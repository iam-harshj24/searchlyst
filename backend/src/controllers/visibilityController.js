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
    computeUrlRanking,
} from '../services/scoringEngine.js';
import { queryPerplexity, queryGemini, queryGoogleAI } from '../services/infaticaService.js';
import { parseResponse } from '../services/responseParser.js';
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
    const sov = computeShareOfVoice(allRuns, brandName, competitors, domain);
    const perEngine = computePerEngine(allRuns);
    const perCategory = computePerCategory(allRuns);
    const sentiment = computeSentimentBreakdown(allRuns);
    const queryTracking = computeQueryTracking(allRuns, brandName);
    const sourceDomains = computeSourceDomains(allRuns);
    const urlRanking = computeUrlRanking(allRuns);
    const industryRanking = computeIndustryRanking(allRuns, brandName, competitors, domain);
    const competitorGaps = computeCompetitorGap(allRuns, brandName, competitors);

    const promptMap = {};
    for (const run of allRuns) {
        const key = run.promptId;
        if (!promptMap[key]) {
            promptMap[key] = { promptId: run.promptId, query: run.query, category: run.category, intent: run.intent, engines: {} };
        }
        
        const hasResponse = !!(run.rawText && run.rawText.trim().length > 0);
        
        promptMap[key].engines[run.engine] = {
            mentioned: run.brandMentioned,
            snippet: run.brandEntity?.snippet || null,
            sentiment: run.brandEntity?.sentiment || 'n/a',
            positionRank: run.brandEntity?.positionRank || null,
            citations: run.citations || [],
            rawText: run.rawText || null,
            status: hasResponse ? '✓ Response received' : '⚠ No response',
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
            googleAI: { name: 'Google AI', ...(perEngine.googleAI || { score: 0, runs: 0, mentions: 0 }) },
        },
        perCategory,
        sentiment,
        queryTracking,
        sourceDomains,
        urlRanking,
        prompts,
        entityGraph,
        citationSummary: sourceDomains.topDomains,
        competitorGaps,
        config: { promptCount, engines: 3, totalCalls },
        completedPrompts: promptCount,
        totalPrompts: promptCount,
    };
}

/** Assemble per-platform analytics into the Overview result. */
/** Assemble the result JSON that the frontend consumes. */
function assembleResult(overview, platformResults, intelligence, brandName, domain, industry, errors, isPartial = false) {
    const sovArr = overview.shareOfVoice?.competitors?.map(c => ({ name: c.name, sov: c.sov })) || [];
    sovArr.unshift({ name: overview.shareOfVoice?.brand?.name || brandName, sov: overview.shareOfVoice?.brand?.sov || 0 });

    return {
        brandName,
        domain,
        industry: industry || '',
        scannedAt: new Date().toISOString(),
        isPartial,
        score: overview.score,
        shareOfVoice: overview.shareOfVoice,
        industryRanking: overview.industryRanking,
        perEngine: overview.perEngine,
        platformBreakdown: overview.platformBreakdown,
        perCategory: overview.perCategory,
        sentiment: overview.sentiment,
        queryTracking: overview.queryTracking,
        sourceDomains: overview.sourceDomains,
        urlRanking: overview.urlRanking,
        prompts: overview.prompts,
        entityGraph: overview.entityGraph,
        citationSummary: overview.citationSummary,
        competitorGaps: normalizeGaps(overview.competitorGaps),
        competitorAnalysis: { shareOfVoice: sovArr, industryRanking: sovArr, threats: [] },
        competitorInsights: {
            topFindings: intelligence?.strengthAreas || [],
            recommendations: intelligence?.topOpportunities || [],
        },
        intelligence: intelligence || null,
        config: overview.config,
        completedPrompts: overview.completedPrompts,
        totalPrompts: overview.totalPrompts,
        platforms: {
            perplexity: platformResults?.perplexity || null,
            gemini: platformResults?.gemini || null,
            googleAI: platformResults?.googleAI || null,
        },
        agentErrors: errors?.length > 0 ? errors : undefined,
    };
}

/**
 * Two-phase scan execution:
 * Phase 1 — first 10 prompts across 3 engines → save early results (frontend can start rendering)
 * Phase 2 — remaining 10 prompts → merge with Phase 1, run deep analysis, save final results
 */
async function executeScan(scanId, brandName, domain, industry, competitors, location, country, language) {
    const expandedCompetitors = (competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);

    try {
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'agents_running', detail: '3 parallel agents (Perplexity, Gemini, Google AI) querying...', completed: 0, total: 0 }) }
        });

        const agentConfig = { brandName, domain, industry, competitors: expandedCompetitors, location, country, language };

        let lastProgressUpdate = 0;
        const { platformResults, allRuns, errors } = await runAllAgentsInParallel(
            agentConfig,
            // Progress callback — throttled to every 2s
            async (p) => {
                const now = Date.now();
                if (now - lastProgressUpdate < 2000) return;
                lastProgressUpdate = now;
                try {
                    await prisma.visibilityScan.update({
                        where: { id: scanId },
                        data: { progress: JSON.stringify({ phase: 'querying', detail: `${p.completed}/${p.total} engine calls complete`, completed: p.completed, total: p.total }) }
                    });
                } catch (_) { /* ignore */ }
            },
            // Early results callback — fires after Phase 1 (first 10 prompts)
            async (phase1Runs, allPrompts) => {
                try {
                    const earlyOverview = buildOverviewFromPlatforms({}, phase1Runs, brandName, domain, industry, expandedCompetitors);
                    const earlyResult = assembleResult(earlyOverview, {}, null, brandName, domain, industry, [], true);
                    earlyResult.completedPhase = 1;

                    await prisma.visibilityScan.update({
                        where: { id: scanId },
                        data: {
                            results: JSON.stringify(earlyResult),
                            progress: JSON.stringify({
                                phase: 'early_results',
                                detail: 'Phase 1 complete — early results available. Enhancing with remaining prompts...',
                                completed: phase1Runs.length,
                                total: allPrompts.length * 3,
                            }),
                        },
                    });
                    console.log(`[Scan:${scanId}] Phase 1 early results saved (${phase1Runs.length} runs)`);
                } catch (e) {
                    console.warn(`[Scan:${scanId}] Failed to save early results:`, e.message);
                }
            }
        );

        // ── Final scoring + deep analysis ────────────────────────────────────
        const completedCalls = allRuns.length;

        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'analyzing', detail: 'Computing final scores & running AI analysis...', completed: completedCalls, total: completedCalls }) }
        });

        const [intelligence, overview] = await Promise.all([
            batchDeepAnalysis(allRuns, brandName, domain, expandedCompetitors).catch(err => {
                console.error('[Scan] Deep analysis failed:', err.message);
                return null;
            }),
            Promise.resolve(buildOverviewFromPlatforms(platformResults, allRuns, brandName, domain, industry, expandedCompetitors)),
        ]);

        const finalResult = assembleResult(overview, platformResults, intelligence, brandName, domain, industry, errors, false);

        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: {
                status: 'completed',
                allRuns: JSON.stringify(allRuns),
                results: JSON.stringify(finalResult),
                progress: JSON.stringify({ phase: 'done', detail: 'Scan completed', completed: completedCalls, total: completedCalls }),
            },
        });
    } catch (err) {
        console.error('[Scan] Fatal:', err);
        await prisma.visibilityScan.update({ where: { id: scanId }, data: { status: 'failed', error: err.message } });
    }
}

/**
 * Cleanup orphaned scans on server startup.
 * If the server restarts mid-scan, those scans are stuck at 'scanning' forever.
 */
export async function cleanupOrphanedScans() {
    try {
        // Any scan still in 'scanning' state when the server (re)starts is orphaned —
        // the async executeScan that owned it is dead. Mark ALL of them failed.
        const orphans = await prisma.visibilityScan.updateMany({
            where: { status: 'scanning' },
            data: { status: 'failed', error: 'Server restarted during scan — please re-run' },
        });
        if (orphans.count > 0) console.log(`[Cleanup] Marked ${orphans.count} orphaned scan(s) as failed`);
    } catch (err) {
        console.warn('[Cleanup] Could not clean orphaned scans:', err.message);
    }
}

export async function startVisibilityScan(req, res) {
    try {
        const { brandName, domain, industry, competitors, location, country, language, projectId } = req.body;
        const userId = req.user.id;
        if (!brandName || !domain) return res.status(400).json({ success: false, message: 'brandName and domain are required' });
        if (!process.env.INFATICA_API_KEY?.trim()) {
            return res.status(503).json({ success: false, message: 'Visibility scans require INFATICA_API_KEY on the server' });
        }

        const existing = await prisma.visibilityScan.findFirst({
            where: { userId, status: 'scanning' },
            orderBy: { created_at: 'desc' },
        });
        if (existing) {
            return res.json({ success: true, scanId: existing.id, status: 'scanning', message: 'Scan already in progress' });
        }

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

        const hasEarlyResults = progress.phase === 'early_results' || (results && results.isPartial);

        return res.json({
            success: true,
            status: job.status,
            phase: progress.phase,
            phaseDetail: progress.detail,
            progress: { completed: progress.completed || 0, total: progress.total || 0 },
            completedPrompts: progress.completed,
            totalPrompts: progress.total,
            hasEarlyResults,
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

/** Score history for the overview chart (dates on X-axis). */
export async function getScanHistory(req, res) {
    try {
        const userId = req.user.id;
        const { projectId, domain } = req.query;
        const where = { userId, status: 'completed' };
        if (projectId) {
            const pid = parseInt(projectId, 10);
            if (!isNaN(pid)) where.projectId = pid;
        }
        if (domain) where.domain = domain;

        const scans = await prisma.visibilityScan.findMany({
            where,
            orderBy: { created_at: 'asc' },
            take: 30,
        });

        const history = scans.map(s => {
            try {
                const results = typeof s.results === 'string' ? JSON.parse(s.results) : s.results;
                return {
                    id: s.id,
                    date: s.created_at,
                    score: results?.score?.overall || 0,
                    components: results?.score?.components || {},
                };
            } catch {
                return { id: s.id, date: s.created_at, score: 0, components: {} };
            }
        });

        return res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Run a single custom prompt against all 3 engines.
 * Returns parsed results so the frontend can display them inline.
 */
export async function runCustomPrompt(req, res) {
    try {
        const { query, brandName, domain, competitors, country } = req.body;
        if (!query?.trim()) return res.status(400).json({ success: false, message: 'query is required' });
        if (!process.env.INFATICA_API_KEY?.trim()) {
            return res.status(503).json({ success: false, message: 'Visibility scans require INFATICA_API_KEY on the server' });
        }

        const expandedCompetitors = (competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);
        const engines = [
            { key: 'perplexity', fn: queryPerplexity, label: 'Perplexity' },
            { key: 'gemini', fn: queryGemini, label: 'Gemini' },
            { key: 'googleAI', fn: queryGoogleAI, label: 'Google AI' },
        ];

        const results = await Promise.allSettled(
            engines.map(async ({ key, fn }) => {
                const raw = await fn(query, country || '');
                if (raw && (raw.text || raw.html)) {
                    const parsed = parseResponse(raw, brandName || '', domain || '', expandedCompetitors, key);
                    return { engine: key, success: true, ...parsed };
                }
                return { engine: key, success: false };
            })
        );

        const engineResults = {};
        for (const r of results) {
            const val = r.status === 'fulfilled' ? r.value : { engine: 'unknown', success: false };
            engineResults[val.engine] = {
                mentioned: val.brandMentioned || false,
                snippet: val.brandEntity?.snippet || null,
                sentiment: val.brandEntity?.sentiment || 'n/a',
                positionRank: val.brandEntity?.positionRank || null,
                citations: val.citations || [],
                rawText: val.rawText || null,
                status: val.success ? '✓ Response received' : '⚠ No response',
            };
        }

        return res.json({
            success: true,
            prompt: {
                promptId: `custom_${Date.now()}`,
                query: query.trim(),
                category: 'custom',
                intent: 'custom_prompt',
                isCustom: true,
                engines: engineResults,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
