import { randomUUID } from 'crypto';
import { runAllAgentsInParallel } from '../services/visibilityAgents.js';
import { batchDeepAnalysis } from '../services/responseParser.js';
import {
    computeVisibilityScore,
    computeShareOfVoice,
    computePerEngine,
    computePerCategory,
    computeCompetitorGap,
    computeSentimentBreakdown,
    computeQueryTracking,
    computeSourceDomains,
    computeIndustryRanking,
} from '../services/scoringEngine.js';
import { prisma } from '../lib/prisma.js';

function buildCompStr(competitors) {
    const list = (competitors || []).map(c => typeof c === 'string' ? c : (c.name || c.domain)).filter(Boolean);
    return list.slice(0, 5).join(', ') || 'major competitors';
}

function normalizeGaps(gaps) {
    if (!Array.isArray(gaps)) return [];
    return gaps.map(g => {
        if (typeof g === 'string') return { query: g, competitors: [] };
        if (g && typeof g === 'object' && (g.query || g.topic)) return { query: g.query || g.topic, competitors: Array.isArray(g.competitors) ? g.competitors : (g.competitorsPresent || []).map(c => c.name || c) };
        return g;
    }).filter(Boolean);
}

function buildOverviewFromPlatforms(platformResults, allRuns, brandName, domain, industry, competitors) {
    const score = computeVisibilityScore(allRuns, brandName);
    const sov = computeShareOfVoice(allRuns, brandName, competitors);
    const perEngine = computePerEngine(allRuns);
    const perCategory = computePerCategory(allRuns);
    const sentiment = computeSentimentBreakdown(allRuns);
    const queryTracking = computeQueryTracking(allRuns, brandName);
    const sourceDomains = computeSourceDomains(allRuns);
    const industryRanking = computeIndustryRanking(allRuns, brandName, competitors);
    const competitorGaps = computeCompetitorGap(allRuns, brandName, competitors);

    const promptMap = {};
    for (const run of allRuns) {
        const key = `${run.promptId}-${run.engine}`;
        if (!promptMap[key]) {
            promptMap[key] = { promptId: run.promptId, query: run.query, category: run.category, intent: run.intent, engines: {} };
        }
        promptMap[key].engines[run.engine] = {
            mentioned: run.brandMentioned,
            snippet: run.brandEntity?.snippet || null,
            sentiment: run.brandEntity?.sentiment || 'n/a',
            positionRank: run.brandEntity?.positionRank || null,
            citations: (run.citations || []).slice(0, 3).map(c => ({ domain: c?.domain, url: c?.url, isTargetBrand: c?.isTargetBrand })) || [],
        };
    }
    const prompts = Object.values(promptMap);

    const entityMap = {};
    for (const run of allRuns) {
        for (const e of run.entities || []) {
            if (!entityMap[e.name]) entityMap[e.name] = { ...e, totalMentions: 0, queryCount: new Set(), positionSum: 0, positionCount: 0 };
            entityMap[e.name].totalMentions += e.mentions || 1;
            entityMap[e.name].queryCount.add(run.query);
            if (e.positionRank) { entityMap[e.name].positionSum += e.positionRank; entityMap[e.name].positionCount++; }
        }
    }
    const entityGraph = Object.values(entityMap)
        .map(e => ({ name: e.name, domain: e.domain, isTargetBrand: e.isTargetBrand, isCompetitor: e.isCompetitor, totalMentions: e.totalMentions, queryCount: e.queryCount.size, sentiment: e.sentiment, avgPosition: e.positionCount > 0 ? (e.positionSum / e.positionCount).toFixed(1) : '-' }))
        .sort((a, b) => b.totalMentions - a.totalMentions).slice(0, 20);

    const totalCalls = allRuns.length;
    const promptCount = new Set(allRuns.map(r => r.query)).size;

    return {
        score,
        shareOfVoice: sov,
        industryRanking,
        perEngine,
        platformBreakdown: {
            perplexity: { name: 'Perplexity', ...(perEngine.perplexity || { score: 0, runs: 0, mentions: 0 }) },
            gemini: { name: 'Gemini', ...(perEngine.gemini || { score: 0, runs: 0, mentions: 0 }) },
            googleAI: { name: 'Google AI Overview', ...(perEngine.googleAI || { score: 0, runs: 0, mentions: 0 }) },
        },
        perCategory,
        sentiment,
        queryTracking,
        sourceDomains,
        prompts,
        entityGraph,
        citationSummary: sourceDomains.topDomains,
        competitorGaps,
        config: { promptCount, engines: 3, totalCalls },
        completedPrompts: promptCount,
        totalPrompts: promptCount,
    };
}

/**
 * 3 parallel agents (Perplexity, Gemini, Google AI) generate platform-specific prompts,
 * query Infatica, and produce per-platform analytics. Combined into Overview.
 */
async function executeScan(scanId, brandName, domain, industry, competitors, location, country, language) {
    const expandedCompetitors = (competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);
    const compStr = buildCompStr(expandedCompetitors);

    try {
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'agents_running', detail: '3 parallel agents (Perplexity, Gemini, Google AI) generating prompts & querying AI models...', completed: 0, total: 0 }) }
        });

        const agentConfig = { brandName, domain, industry, competitors: expandedCompetitors, location, country, language };

        const progressByEngine = { perplexity: 0, gemini: 0, googleAI: 0 };
        const { platformResults, allRuns, errors } = await runAllAgentsInParallel(agentConfig, (p) => {
            if (p?.engine) progressByEngine[p.engine] = p.completed;
        });

        const completedCalls = allRuns.length;
        const totalCalls = Object.values(platformResults).reduce((s, p) => s + (p.totalCalls || p.config?.totalCalls || 0), 0);

        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { allRuns: JSON.stringify(allRuns), progress: JSON.stringify({ phase: 'querying', detail: `Perplexity ${progressByEngine.perplexity}, Gemini ${progressByEngine.gemini}, Google AI ${progressByEngine.googleAI} completed`, completed: completedCalls, total: totalCalls }) }
        });

        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'analyzing', detail: 'Running deep AI analysis...', completed: completedCalls, total: totalCalls }) }
        });

        let intelligence = null;
        try {
            intelligence = await batchDeepAnalysis(allRuns, brandName, domain, expandedCompetitors, location);
        } catch (err) { console.error('[Scan] Deep analysis failed:', err.message); }

        const overview = buildOverviewFromPlatforms(platformResults, allRuns, brandName, domain, industry, expandedCompetitors);

        const sovArr = overview.shareOfVoice?.competitors?.map(c => ({ name: c.name, sov: c.sov })) || [];
        sovArr.unshift({ name: overview.shareOfVoice?.brand?.name || brandName, sov: overview.shareOfVoice?.brand?.sov || 0 });

        const finalResult = {
            brandName,
            domain,
            industry: industry || '',
            scannedAt: new Date().toISOString(),
            score: overview.score,
            shareOfVoice: overview.shareOfVoice,
            industryRanking: overview.industryRanking,
            perEngine: overview.perEngine,
            platformBreakdown: overview.platformBreakdown,
            perCategory: overview.perCategory,
            sentiment: overview.sentiment,
            queryTracking: overview.queryTracking,
            sourceDomains: overview.sourceDomains,
            prompts: overview.prompts,
            entityGraph: overview.entityGraph,
            citationSummary: overview.citationSummary,
            competitorGaps: normalizeGaps(overview.competitorGaps),
            competitorAnalysis: { shareOfVoice: sovArr, industryRanking: sovArr, threats: [] },
            competitorInsights: {
                topFindings: intelligence?.strengthAreas || [],
                recommendations: intelligence?.topOpportunities || [],
            },
            intelligence,
            config: overview.config,
            completedPrompts: overview.completedPrompts,
            totalPrompts: overview.totalPrompts,
            platforms: {
                perplexity: platformResults.perplexity,
                gemini: platformResults.gemini,
                googleAI: platformResults.googleAI,
            },
            agentErrors: errors.length > 0 ? errors : undefined,
        };

        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { status: 'completed', allRuns: JSON.stringify(allRuns), results: JSON.stringify(finalResult), progress: JSON.stringify({ phase: 'done', detail: 'Scan completed', completed: completedCalls, total: completedCalls }) }
        });
    } catch (err) {
        console.error('[Scan] Fatal:', err);
        await prisma.visibilityScan.update({ where: { id: scanId }, data: { status: 'failed', error: err.message } });
    }
}

export async function startVisibilityScan(req, res) {
    try {
        const { brandName, domain, industry, competitors, location, country, language, projectId } = req.body;
        const userId = req.user.id;
        if (!brandName || !domain) return res.status(400).json({ success: false, message: 'brandName and domain are required' });

        const scanId = randomUUID();
        await prisma.visibilityScan.create({
            data: {
                id: scanId,
                userId,
                projectId: projectId ? parseInt(projectId, 10) : null,
                brandName,
                domain,
                industry: industry || null,
                status: 'scanning',
                progress: JSON.stringify({ phase: 'initializing', detail: 'Starting visibility scan...' })
            }
        });

        executeScan(scanId, brandName, domain, industry || '', competitors || [], location || '', country || '', language || 'English');
        res.json({ success: true, scanId, status: 'scanning' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getScanStatus(req, res) {
    try {
        const { id } = req.params;
        const job = await prisma.visibilityScan.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ success: false, message: 'Scan not found' });

        const progress = job.progress ? (typeof job.progress === 'string' ? JSON.parse(job.progress) : job.progress) : {};
        const results = job.results ? (typeof job.results === 'string' ? JSON.parse(job.results) : job.results) : null;
        return res.json({
            success: true,
            status: job.status,
            phase: progress.phase,
            phaseDetail: progress.detail,
            progress: { completed: progress.completed || 0, total: progress.total || 0 },
            completedPrompts: progress.completed,
            totalPrompts: progress.total,
            result: results,
            error: job.error
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/** List visibility scans (optional projectId filter) */
export async function listScans(req, res) {
    try {
        const userId = req.user.id;
        const { projectId } = req.query;
        const where = { userId };
        if (projectId) {
            const pid = parseInt(projectId, 10);
            if (!isNaN(pid)) where.projectId = pid;
        }
        const scans = await prisma.visibilityScan.findMany({
            where, orderBy: { created_at: 'desc' }, take: 50,
            select: { id: true, projectId: true, brandName: true, domain: true, industry: true, status: true, created_at: true }
        });
        return res.json({ success: true, scans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/** Get latest completed scan for project or domain */
export async function getLatestScan(req, res) {
    try {
        const userId = req.user.id;
        const { projectId, domain } = req.query;
        const where = { userId, status: 'completed' };
        if (projectId) { const pid = parseInt(projectId, 10); if (!isNaN(pid)) where.projectId = pid; }
        if (domain) where.domain = domain;
        const scan = await prisma.visibilityScan.findFirst({ where, orderBy: { created_at: 'desc' } });
        if (!scan) return res.json({ success: true, scan: null });
        const results = scan.results ? (typeof scan.results === 'string' ? JSON.parse(scan.results) : scan.results) : null;
        return res.json({ success: true, scan: { id: scan.id, projectId: scan.projectId, brandName: scan.brandName, domain: scan.domain, createdAt: scan.created_at, result: results } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
