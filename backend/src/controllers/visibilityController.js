import { randomUUID } from 'crypto';
import { queryPerplexity, queryGemini, queryGoogleAI } from '../services/infaticaService.js';
import {
    PP1_BrandVisibilityRanking,
    PP2_AIMentionAudit,
    PP3_ShareOfVoice,
    GP1_BrandRankingWithEvidence,
    GP2_MentionQualityAuditWithCitations,
    GP3_ThreatRadarWithSources,
} from '../services/visibilityPrompts.js';
import { analyzeRawResponses } from '../services/geminiAnalyticsService.js';
import { prisma } from '../lib/prisma.js';

function buildCompStr(competitors) {
    const list = (competitors || []).map(c => typeof c === 'string' ? c : (c.name || c.domain)).filter(Boolean);
    return list.slice(0, 5).join(', ') || 'major competitors';
}

function buildEntityGraphFromPrompts(prompts, brandName, domain, compStr) {
    const brandLower = brandName.toLowerCase();
    const competitors = compStr.split(',').map(c => c.trim()).filter(Boolean);
    const entities = [];
    let brandMentions = 0;
    const compMentions = Object.fromEntries(competitors.map(c => [c, 0]));

    for (const p of prompts) {
        const engines = p.engines || {};
        for (const [, data] of Object.entries(engines)) {
            if (data.mentioned) brandMentions++;
        }
    }

    entities.push({ name: brandName, domain: domain || '', isTargetBrand: true, isCompetitor: false, totalMentions: brandMentions, queryCount: prompts.length });
    for (const comp of competitors) {
        entities.push({ name: comp, domain: '', isTargetBrand: false, isCompetitor: true, totalMentions: compMentions[comp] || 0, queryCount: prompts.length });
    }
    return entities;
}

function normalizeGaps(gaps) {
    if (!Array.isArray(gaps)) return [];
    return gaps.map(g => {
        if (typeof g === 'string') return { query: g, competitors: [] };
        if (g && typeof g === 'object' && (g.query || g.topic)) return { query: g.query || g.topic, competitors: Array.isArray(g.competitors) ? g.competitors : (g.competitorsPresent || []).map(c => c.name || c) };
        return g;
    }).filter(Boolean);
}

function stripHtml(html) {
    if (!html) return '';
    return typeof html === 'string'
        ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : '';
}

async function runWithTimeout(fn, timeoutMs = 120000) {
    return Promise.race([
        fn(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), timeoutMs))
    ]);
}

/**
 * Phase 1: Send prompts to LLMs via Infatica
 * Phase 2: Feed raw responses to Gemini API for structured analytics
 */
async function executeScan(scanId, brandName, domain, industry, competitors, location, country, language) {
    const compStr = buildCompStr(competitors);
    const topCompetitor = (competitors || [])[0];
    const compName = typeof topCompetitor === 'string' ? topCompetitor : topCompetitor?.name || compStr.split(',')[0]?.trim() || 'leading competitor';

    const year = new Date().getFullYear();

    // Build prompts for Perplexity & Gemini
    const pp1 = PP1_BrandVisibilityRanking(brandName, domain, industry, compStr, compName);
    const pp2 = PP2_AIMentionAudit(brandName, industry, compStr, compName);
    const pp3 = PP3_ShareOfVoice(brandName, industry, compStr, compName);
    const gp1 = GP1_BrandRankingWithEvidence(brandName, compStr, industry, compName);
    const gp2 = GP2_MentionQualityAuditWithCitations(brandName, compStr, industry, compName);
    const gp3 = GP3_ThreatRadarWithSources(brandName, compStr, industry);

    // Google AI Overview queries — searches that surface AI Overview at top of SERP
    const industrySlug = (industry || 'software').trim() || 'software';
    const gai1 = `best ${industrySlug} tools ${year}`;
    const gai2 = `${brandName} reviews`;
    const gai3 = compName ? `${brandName} vs ${compName}` : `best ${industrySlug} software ${year}`;

    const JOBS = [
        { id: 'PP1', engine: 'perplexity', prompt: pp1, fn: () => queryPerplexity(pp1) },
        { id: 'PP2', engine: 'perplexity', prompt: pp2, fn: () => queryPerplexity(pp2) },
        { id: 'PP3', engine: 'perplexity', prompt: pp3, fn: () => queryPerplexity(pp3) },
        { id: 'GP1', engine: 'gemini',     prompt: gp1, fn: () => queryGemini(gp1) },
        { id: 'GP2', engine: 'gemini',     prompt: gp2, fn: () => queryGemini(gp2) },
        { id: 'GP3', engine: 'gemini',     prompt: gp3, fn: () => queryGemini(gp3) },
        { id: 'GAI1', engine: 'googleAI',  prompt: gai1, fn: () => queryGoogleAI(gai1, country) },
        { id: 'GAI2', engine: 'googleAI',  prompt: gai2, fn: () => queryGoogleAI(gai2, country) },
        { id: 'GAI3', engine: 'googleAI',  prompt: gai3, fn: () => queryGoogleAI(gai3, country) },
    ];

    const totalJobs = JOBS.length;

    try {
        // ── Phase 1: Query all LLMs via Infatica ───────────────────────
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'querying', detail: `Querying ${totalJobs} prompts (Perplexity, Gemini, Google AI Overview) via Infatica...`, completed: 0, total: totalJobs }) }
        });

        const rawResponses = [];
        let completed = 0;

        for (const job of JOBS) {
            let rawText = '';
            try {
                const html = await runWithTimeout(job.fn, 120000);
                rawText = stripHtml(html);
                console.log(`[Scan] ${job.id} (${job.engine}) → ${rawText.length} chars`);
            } catch (err) {
                console.error(`[Scan] ${job.id} (${job.engine}) failed:`, err.message);
            }
            rawResponses.push({ id: job.id, engine: job.engine, prompt: job.prompt.slice(0, 200), rawText });
            completed++;

            await prisma.visibilityScan.update({
                where: { id: scanId },
                data: {
                    progress: JSON.stringify({
                        phase: 'querying',
                        detail: `Completed ${completed}/${totalJobs} LLM queries...`,
                        completed,
                        total: totalJobs + 1,
                    })
                }
            });
        }

        // ── Phase 2: Gemini analyzes raw responses into structured data ─
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'analyzing', detail: 'Gemini is analyzing raw responses into structured analytics...', completed: totalJobs, total: totalJobs + 1 }) }
        });

        let analytics;
        try {
            analytics = await analyzeRawResponses(rawResponses, brandName, domain, industry, compStr);
        } catch (err) {
            console.error('[Scan] Gemini analytics failed:', err.message);
            analytics = { visibilityScore: 0, sentiment: { positive: 0, negative: 0, neutral: 0 }, shareOfVoice: [], entityGraph: [], platformBreakdown: {}, sources: [], competitorInsights: { ranking: [], gaps: [], threats: [] }, topFindings: [], recommendations: [] };
        }

        // ── Build final result ─────────────────────────────────────────
        const perplexityRuns = rawResponses.filter(r => r.engine === 'perplexity');
        const geminiRuns = rawResponses.filter(r => r.engine === 'gemini');
        const googleRuns = rawResponses.filter(r => r.engine === 'googleAI');
        const pMentioned = rawResponses.filter(r => r.engine === 'perplexity' && (r.rawText || '').toLowerCase().includes(brandName.toLowerCase())).length;
        const gMentioned = rawResponses.filter(r => r.engine === 'gemini' && (r.rawText || '').toLowerCase().includes(brandName.toLowerCase())).length;
        const gaiMentioned = rawResponses.filter(r => r.engine === 'googleAI' && (r.rawText || '').toLowerCase().includes(brandName.toLowerCase())).length;

        const allSources = (analytics.sources || []).filter(s => s?.url);

        const prompts = rawResponses.map(r => ({
            promptId: r.id,
            query: r.prompt,
            engine: r.engine,
            engines: {
                [r.engine]: {
                    mentioned: (r.rawText || '').toLowerCase().includes(brandName.toLowerCase()),
                    snippet: (r.rawText || '').slice(0, 300),
                    citations: allSources.slice(0, 5).map(s => ({ url: s.url, domain: s.domain || '', isTargetBrand: !!s.brandMentioned })),
                }
            },
        }));

        const sovArr = analytics.shareOfVoice || [];
        const brandEntry = sovArr.find(s => s.name?.toLowerCase() === brandName.toLowerCase()) || { name: brandName, sov: 0 };
        const competitorEntries = sovArr.filter(s => s.name?.toLowerCase() !== brandName.toLowerCase());

        const finalResult = {
            brandName,
            domain,
            industry: industry || '',
            scannedAt: new Date().toISOString(),
            score: {
                overall: analytics.visibilityScore || 0,
                components: {
                    mentionProbability: Math.min(100, Math.round(((pMentioned + gMentioned + gaiMentioned) / 3) * 100)),
                    citationAuthority: Math.min(100, (analytics.sources || []).filter(s => s.tier === 1).length * 15),
                    positionScore: Math.min(100, Math.round((analytics.visibilityScore || 0) * 0.8)),
                    sentimentScore: Math.min(100, (analytics.sentiment?.positive || 0) * 25 + (analytics.sentiment?.neutral || 0) * 3),
                    coverageBreadth: Math.min(100, Math.round(((pMentioned + gMentioned + gaiMentioned) / 3) * 100)),
                },
            },
            shareOfVoice: {
                brand: { name: brandEntry.name, sov: brandEntry.sov || 0 },
                competitors: competitorEntries.map(c => ({ name: c.name, sov: c.sov || 0 })),
            },
            industryRanking: [{ name: brandEntry.name, sov: brandEntry.sov }, ...competitorEntries].map((e, i) => ({ name: e.name, sov: e.sov })),
            platformBreakdown: {
                perplexity: { name: 'Perplexity', score: pMentioned ? analytics.visibilityScore : 0, runs: perplexityRuns.length, mentions: pMentioned },
                gemini: { name: 'Gemini', score: gMentioned ? analytics.visibilityScore : 0, runs: geminiRuns.length, mentions: gMentioned },
                googleAI: { name: 'Google AI Overview', score: gaiMentioned ? analytics.visibilityScore : 0, runs: googleRuns.length, mentions: gaiMentioned },
            },
            perCategory: {},
            sentiment: analytics.sentiment || { positive: 0, negative: 0, neutral: 0 },
            queryTracking: [],
            sourceDomains: {
                topDomains: (analytics.sources || [])
                    .filter(s => s && (s.domain || s.url))
                    .reduce((acc, s) => {
                        let d = s.domain || '';
                        if (!d && s.url) { try { d = new URL(s.url).hostname?.replace(/^www\./, '') || ''; } catch { d = 'unknown'; } }
                        if (!d) d = 'unknown';
                        const existing = acc.find(a => a.domain === d);
                        if (existing) { existing.count++; }
                        else { acc.push({ domain: d, count: 1, tier: s.tier === 1 ? 'gold' : s.tier === 2 ? 'silver' : 'standard' }); }
                        return acc;
                    }, []).sort((a, b) => b.count - a.count).slice(0, 15),
            },
            prompts,
            entityGraph: (Array.isArray(analytics.entityGraph) && analytics.entityGraph.length > 0)
                ? analytics.entityGraph
                : buildEntityGraphFromPrompts(prompts, brandName, domain, compStr),
            citationSummary: (analytics.sources || []).slice(0, 10),
            competitorGaps: normalizeGaps(analytics.competitorInsights?.gaps || []),
            competitorAnalysis: {
                shareOfVoice: sovArr,
                industryRanking: sovArr,
                threats: analytics.competitorInsights?.threats || [],
            },
            competitorInsights: {
                topFindings: analytics.topFindings || [],
                recommendations: analytics.recommendations || [],
            },
            config: { promptCount: totalJobs, engines: 3, totalCalls: totalJobs },
            completedPrompts: totalJobs,
            totalPrompts: totalJobs,
            rawResponses: rawResponses.map(r => ({ id: r.id, engine: r.engine, textLength: r.rawText?.length || 0 })),
        };

        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: {
                status: 'completed',
                allRuns: JSON.stringify(rawResponses),
                results: JSON.stringify(finalResult),
                progress: JSON.stringify({ phase: 'done', detail: 'Scan completed', completed: totalJobs + 1, total: totalJobs + 1 })
            }
        });
    } catch (err) {
        console.error('[Scan] Fatal:', err);
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { status: 'failed', error: err.message }
        });
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
