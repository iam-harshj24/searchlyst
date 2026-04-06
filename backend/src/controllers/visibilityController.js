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
    computeIndustryPresenceRanking,
    computeUrlRanking,
} from '../services/scoringEngine.js';
import { queryPerplexity, queryGemini, queryGoogleAI } from '../services/infaticaService.js';
import { parseResponse, batchApplyGeminiSentimentByPrompt } from '../services/responseParser.js';
import { prisma } from '../lib/prisma.js';
import {
    aggregateCitationsForIntelligence,
    generateCitationIntelligenceBrief,
    generatePerUrlTableInsights,
    extractCompetitorContext,
} from '../services/citationIntelligenceService.js';

function buildCompStr(competitors) {
    const list = (competitors || []).map(c => typeof c === 'string' ? c : (c.name || c.domain)).filter(Boolean);
    return list.slice(0, 5).join(', ') || 'major competitors';
}

function normalizeDomainHint(d) {
    return String(d || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
}

function plainFromInfatica(raw) {
    if (raw?.text?.trim()) return raw.text.trim();
    if (raw?.html) {
        const h = typeof raw.html === 'string' ? raw.html : '';
        return h
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    return '';
}

function parseNumberedCompetitorLines(text) {
    if (!text || typeof text !== 'string') return [];
    const lines = text.split(/\r?\n/);
    const out = [];
    const seen = new Set();
    for (const line of lines) {
        const m = line.match(/^\s*\d+[\).\s]+\s*(.+)$/);
        const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
        const raw = (m || bullet)?.[1]?.trim();
        if (!raw) continue;
        const name = raw.replace(/\s*[\u2014\-]\s*.+$/, '').replace(/\([^)]*\)/g, '').trim();
        if (name.length < 2 || name.length > 80) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(name);
    }
    return out.slice(0, 24);
}

function hostSlug(domain) {
    const d = normalizeDomainHint(domain);
    if (!d) return '';
    return d.split('.')[0].replace(/-/g, '');
}

function suggestionMatchesCitedDomains(name, citedDomainsNorm) {
    if (!citedDomainsNorm?.length) return false;
    const nl = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const words = (name || '')
        .toLowerCase()
        .split(/\s+/)
        .map(w => w.replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length > 2);
    for (const dom of citedDomainsNorm) {
        if (!dom) continue;
        const slug = hostSlug(dom);
        if (slug && slug.length > 2 && (nl.includes(slug) || words.some(w => slug.includes(w) || w.includes(slug)))) return true;
    }
    return false;
}

function suggestionNearTrackedPeer(name, expandedCompetitors) {
    const nl = (name || '').toLowerCase();
    const words = nl.split(/[\s./]+/).filter(w => w.length > 3);
    for (const c of expandedCompetitors || []) {
        const cn = String(c.name || '').toLowerCase();
        const cd = hostSlug(c.domain || c.name || '');
        if (cn && (nl === cn || nl.includes(cn) || cn.includes(nl))) return true;
        if (cd && cd.length > 3 && words.some(w => w.includes(cd) || cd.includes(w))) return true;
    }
    return false;
}

function isDuplicateOfBrandOrTracked(name, brandName, brandDomain, expandedCompetitors) {
    const nl = (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const bl = (brandName || '').toLowerCase().trim();
    if (bl && (nl === bl || nl.includes(bl) || bl.includes(nl))) return true;
    const bslug = hostSlug(brandDomain);
    if (bslug && bslug.length > 2 && nl.replace(/[^a-z0-9]/g, '').includes(bslug)) return true;
    for (const c of expandedCompetitors || []) {
        const cn = String(c.name || '').toLowerCase().trim();
        if (cn && (nl === cn || nl.includes(cn) || cn.includes(nl))) return true;
        const cd = normalizeDomainHint(c.domain || '');
        const cs = hostSlug(cd);
        if (cs && cs.length > 2 && nl.replace(/[^a-z0-9]/g, '').includes(cs)) return true;
    }
    return false;
}

const PROMPT_ENGINE_ORDER = ['perplexity', 'gemini', 'googleAI'];

function engineDisplayLabel(ek) {
    if (ek === 'googleAI') return 'ChatGPT';
    if (ek === 'perplexity') return 'Perplexity';
    if (ek === 'gemini') return 'Gemini';
    return ek;
}

/** Per-LLM sentiment schema for prompt list + detail views */
function attachPromptSentimentSchema(p) {
    const eng = p.engines || {};
    const sentimentByEngine = {};
    const engineSentiments = [];
    for (const ek of PROMPT_ENGINE_ORDER) {
        const row = eng[ek];
        const sent = row?.sentiment && row.sentiment !== 'n/a' ? row.sentiment : 'n/a';
        sentimentByEngine[ek] = sent;
        const sc = row?.sentimentScore;
        const sentimentScore = sc != null && Number.isFinite(Number(sc)) ? Math.min(100, Math.max(0, Math.round(Number(sc)))) : null;
        engineSentiments.push({
            engine: ek,
            label: engineDisplayLabel(ek),
            mentioned: !!row?.mentioned,
            sentiment: sent,
            sentimentScore,
            sentimentAnalysis: row?.sentimentAnalysis || null,
            positionRank: row?.positionRank ?? null,
        });
    }
    return { ...p, sentimentByEngine, engineSentiments };
}

function normalizeGaps(gaps) {
    if (!Array.isArray(gaps)) return [];
    return gaps.map(g => {
        if (typeof g === 'string') return { query: g, competitors: [], contentTopic: g, contentAngle: '' };
        if (g && typeof g === 'object' && (g.query || g.topic)) {
            const competitors = Array.isArray(g.competitors)
                ? g.competitors
                : (g.competitorsPresent || []).map(c => (typeof c === 'string' ? c : c.name || c));
            return {
                ...g,
                query: g.query || g.topic,
                competitors,
                contentTopic: g.contentTopic || g.query || g.topic,
                contentAngle: g.contentAngle || '',
            };
        }
        return g;
    }).filter(Boolean);
}

function buildOverviewFromPlatforms(platformResults, allRuns, brandName, domain, industry, competitors, previousRuns = null) {
    const score = computeVisibilityScore(allRuns, brandName);
    const sov = computeShareOfVoice(allRuns, brandName, competitors, domain);
    const perEngine = computePerEngine(allRuns);
    const perCategory = computePerCategory(allRuns);
    const sentiment = computeSentimentBreakdown(allRuns);
    const queryTracking = computeQueryTracking(allRuns, brandName);
    const sourceDomains = computeSourceDomains(allRuns);
    const urlRanking = computeUrlRanking(allRuns);
    const industryRanking = computeIndustryPresenceRanking(allRuns, brandName, previousRuns);
    const competitorGaps = computeCompetitorGap(allRuns, brandName, competitors);

    const promptMap = {};
    for (const run of allRuns) {
        const key = run.promptId;
        if (!promptMap[key]) {
            promptMap[key] = { promptId: run.promptId, query: run.query, category: run.category, intent: run.intent, engines: {} };
        }
        
        const hasResponse = !!(
            (run.rawText && run.rawText.trim().length > 0)
            || (Array.isArray(run.citations) && run.citations.length > 0)
        );
        
        promptMap[key].engines[run.engine] = {
            mentioned: run.brandMentioned,
            snippet: run.brandEntity?.snippet || null,
            sentiment: run.brandEntity?.sentiment || 'n/a',
            sentimentScore: run.brandEntity?.sentimentScore != null && Number.isFinite(Number(run.brandEntity.sentimentScore))
                ? Math.min(100, Math.max(0, Math.round(Number(run.brandEntity.sentimentScore))))
                : null,
            sentimentAnalysis: run.brandEntity?.sentimentAnalysis || null,
            positionRank: run.brandEntity?.positionRank || null,
            citations: run.citations || [],
            rawText: run.rawText || null,
            status: hasResponse ? '✓ Response received' : '⚠ No response',
        };
    }
    const prompts = Object.values(promptMap).map(attachPromptSentimentSchema);

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
            googleAI: { name: 'ChatGPT', ...(perEngine.googleAI || { score: 0, runs: 0, mentions: 0 }) },
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
        competitorAnalysis: { shareOfVoice: sovArr, industryRanking: overview.industryRanking || [], threats: [] },
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
 * Scan execution with 3 dedicated parallel pipelines.
 * Early results fire at ~50% completion so the frontend can start rendering.
 * Final results saved after all pipelines finish + deep analysis.
 */
async function executeScan(scanId, userId, projectId, brandName, domain, industry, competitors, location, country, language) {
    const expandedCompetitors = (competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);

    try {
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'agents_running', detail: 'Running 3 parallel pipelines (Perplexity ×2, Gemini ×3, Google SERP ×3). Fast SERP mode — no headless render.', completed: 0, total: 0 }) }
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
                        data: { progress: JSON.stringify({ phase: 'querying', detail: `${p.completed}/${p.total} calls (${p.successful} with data)`, completed: p.completed, total: p.total, successful: p.successful }) }
                    });
                } catch (_) { /* ignore */ }
            },
            // Early results callback — fires at ~50% completion across all 3 pipelines
            async (phase1Runs, allPrompts) => {
                try {
                    const earlyOverview = buildOverviewFromPlatforms({}, phase1Runs, brandName, domain, industry, expandedCompetitors, null);
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

        const wherePrev = { userId, status: 'completed', id: { not: scanId } };
        if (projectId != null && !Number.isNaN(Number(projectId))) {
            wherePrev.projectId = projectId;
        } else if (domain) {
            wherePrev.domain = domain;
        }
        const prevScan = await prisma.visibilityScan.findFirst({
            where: wherePrev,
            orderBy: { created_at: 'desc' },
            select: { allRuns: true },
        });
        let previousRuns = null;
        if (prevScan?.allRuns) {
            try {
                previousRuns =
                    typeof prevScan.allRuns === 'string' ? JSON.parse(prevScan.allRuns) : prevScan.allRuns;
                if (!Array.isArray(previousRuns) || previousRuns.length === 0) previousRuns = null;
            } catch (_) {
                previousRuns = null;
            }
        }

        const [intelligence, overview] = await Promise.all([
            batchDeepAnalysis(allRuns, brandName, domain, expandedCompetitors).catch(err => {
                console.error('[Scan] Deep analysis failed:', err.message);
                return null;
            }),
            Promise.resolve(
                buildOverviewFromPlatforms(
                    platformResults,
                    allRuns,
                    brandName,
                    domain,
                    industry,
                    expandedCompetitors,
                    previousRuns,
                ),
            ),
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

        executeScan(scanId, userId, projectId ? parseInt(projectId, 10) : null, brandName, domain, industry || '', competitors || [], location || '', country || '', language || 'English');
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

/** Extract target brand prompt coverage % from stored scan results (for trend / Prompt Intel delta). */
/** Compact mention counts per brand for historical charts (entities / SOV). */
function extractMentionLeaders(results, defaultBrandName) {
    try {
        const sov = results?.shareOfVoice;
        if (!sov?.brand && !(sov?.competitors?.length)) return [];
        const rows = [];
        if (sov.brand) {
            rows.push({
                name: String(sov.brand.name || defaultBrandName || 'Your brand'),
                mentions: Number(sov.brand.mentions) || 0,
                isYou: true,
            });
        }
        for (const c of sov.competitors || []) {
            if (c?.name) {
                rows.push({
                    name: String(c.name),
                    mentions: Number(c.mentions) || 0,
                    isYou: false,
                });
            }
        }
        return rows.sort((a, b) => b.mentions - a.mentions).slice(0, 12);
    } catch {
        return [];
    }
}

function extractTargetPromptCoverage(results, brandName) {
    const bn = String(brandName || '').trim();
    if (!bn) return null;
    const rows = results?.industryRanking;
    if (Array.isArray(rows)) {
        const target = rows.find(
            (r) => r?.isTargetBrand === true || (r?.name && String(r.name).toLowerCase() === bn.toLowerCase())
        );
        if (target?.promptCoverage != null && target?.promptCoverage !== undefined) {
            const n = Number(target.promptCoverage);
            if (Number.isFinite(n)) return n;
        }
    }
    const prompts = results?.prompts;
    if (!Array.isArray(prompts) || prompts.length === 0) return null;
    const total = prompts.length;
    let hit = 0;
    for (const p of prompts) {
        if (Object.values(p.engines || {}).some((e) => e?.mentioned)) hit += 1;
    }
    return Math.round((hit / total) * 1000) / 10;
}

/** Per-engine visibility scores for trend pills (matches frontend `platforms.*.score.overall`). */
function extractPlatformScores(results) {
    if (!results?.platforms) return null;
    return {
        perplexity: results.platforms.perplexity?.score?.overall ?? null,
        gemini: results.platforms.gemini?.score?.overall ?? null,
        googleAI: results.platforms.googleAI?.score?.overall ?? null,
    };
}

/**
 * Compact geo/sentiment KPI snapshot for Sentiment & Geo deltas (aligned with SentimentGeoPage derive).
 */
function extractSentimentGeoSnapshot(results) {
    if (!results) return null;
    try {
        const summary = results.sentiment?.summary || { positive: 0, neutral: 100, negative: 0 };
        const citationDomains = results.citationSummary || results.sourceDomains?.topDomains || [];
        const regionMap = {};
        for (const citation of citationDomains) {
            const d = (citation.domain || '').toLowerCase();
            let geo = 'global';
            if (d.endsWith('.co.uk') || d.endsWith('.uk')) geo = 'united kingdom';
            else if (d.endsWith('.de')) geo = 'germany';
            else if (d.endsWith('.fr')) geo = 'france';
            else if (d.endsWith('.in') || d.includes('.co.in')) geo = 'india';
            else if (d.endsWith('.au') || d.endsWith('.com.au')) geo = 'australia';
            else if (d.endsWith('.ca')) geo = 'canada';
            else if (d.endsWith('.jp')) geo = 'japan';
            else if (d.endsWith('.br')) geo = 'brazil';
            else if (d.endsWith('.com') || d.endsWith('.org') || d.endsWith('.io') || d.endsWith('.net')) geo = 'united states';

            if (!regionMap[geo]) regionMap[geo] = { citations: 0 };
            regionMap[geo].citations += citation.count || 1;
        }
        const totalCitations = citationDomains.reduce((s, c) => s + (c.count || 1), 0);
        const activeRegions = Object.keys(regionMap).filter((g) => g !== 'global').length;
        const sentimentIndex =
            summary.sentimentIndex != null && Number.isFinite(Number(summary.sentimentIndex))
                ? Number(summary.sentimentIndex)
                : null;
        return {
            sentimentSummary: {
                positive: Number(summary.positive) || 0,
                neutral: Number(summary.neutral) || 0,
                negative: Number(summary.negative) || 0,
            },
            sentimentIndex,
            totalCitations,
            activeRegions,
            negativePct: Number(summary.negative) || 0,
        };
    } catch {
        return null;
    }
}

/** Score history for charts (chronological). Returns most recent N scans by default. */
export async function getScanHistory(req, res) {
    try {
        const userId = req.user.id;
        const { projectId, domain, days, limit: limitRaw } = req.query;
        const where = { userId, status: 'completed' };
        if (projectId) {
            const pid = parseInt(projectId, 10);
            if (!isNaN(pid)) where.projectId = pid;
        }
        if (domain) where.domain = domain;

        const daysNum = parseInt(days, 10);
        if (!Number.isNaN(daysNum) && daysNum > 0) {
            const since = new Date(Date.now() - daysNum * 86400000);
            where.created_at = { gte: since };
        }

        const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 60, 1), 200);

        const scans = await prisma.visibilityScan.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit,
        });

        const chronological = [...scans].reverse();

        const history = chronological.map((s) => {
            try {
                const results = typeof s.results === 'string' ? JSON.parse(s.results) : s.results;
                const overall =
                    results?.score?.overall ??
                    (typeof results?.score === 'number' ? results.score : 0);
                return {
                    id: s.id,
                    date: s.created_at,
                    score: overall,
                    components: results?.score?.components || {},
                    promptCoverage: extractTargetPromptCoverage(results, s.brandName || results?.brandName),
                    mentionLeaders: extractMentionLeaders(results, s.brandName || results?.brandName),
                    platformScores: extractPlatformScores(results),
                    geoSnapshot: extractSentimentGeoSnapshot(results),
                };
            } catch {
                return {
                    id: s.id,
                    date: s.created_at,
                    score: 0,
                    components: {},
                    promptCoverage: null,
                    mentionLeaders: [],
                    platformScores: null,
                    geoSnapshot: null,
                };
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
        const { query, brandName, domain, competitors, country, language, useGeminiDirect } = req.body;
        if (!query?.trim()) return res.status(400).json({ success: false, message: 'query is required' });

        const expandedCompetitors = (competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);
        const engineResults = {};

        // ── Gemini Direct (SDK) path — used for structured JSON prompts ──────
        // Infatica Gemini/ChatGPT endpoints return rendered HTML (800K-1.2M chars)
        // which buries the model's JSON output. The SDK gives clean text directly.
        if (useGeminiDirect) {
            const geminiKey = process.env.GEMINI_API_KEY?.trim();
            if (!geminiKey) {
                return res.status(503).json({ success: false, message: 'GEMINI_API_KEY is required for direct structured prompts' });
            }
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const result = await model.generateContent(query.trim());
                const text = result.response?.text?.() ?? '';
                console.log(`[runCustomPrompt/geminiDirect] Response: ${text.length} chars`);
                engineResults['geminiDirect'] = {
                    mentioned: false,
                    snippet: null,
                    sentiment: 'n/a',
                    positionRank: null,
                    citations: [],
                    rawText: text.trim() || null,
                    status: text.trim() ? '✓ Response received' : '⚠ No response',
                };
            } catch (err) {
                console.error('[runCustomPrompt/geminiDirect] Failed:', err.message);
                engineResults['geminiDirect'] = {
                    mentioned: false, snippet: null, sentiment: 'n/a', positionRank: null,
                    citations: [], rawText: null, status: `⚠ Error: ${err.message}`,
                };
            }

            const basePrompt = {
                promptId: `custom_${Date.now()}`,
                query: query.trim(),
                category: 'custom',
                intent: 'custom_prompt',
                isCustom: true,
                engines: engineResults,
            };
            return res.json({ success: true, prompt: attachPromptSentimentSchema(basePrompt) });
        }

        // ── Standard Infatica path (for regular custom prompts) ───────────────
        if (!process.env.INFATICA_API_KEY?.trim()) {
            return res.status(503).json({ success: false, message: 'Visibility scans require INFATICA_API_KEY on the server' });
        }

        const engines = [
            { key: 'perplexity', fn: queryPerplexity, label: 'Perplexity' },
            { key: 'gemini', fn: queryGemini, label: 'Gemini' },
            { key: 'googleAI', fn: queryGoogleAI, label: 'ChatGPT' },
        ];

        const hasData = (raw) => raw && (raw.text || raw.html || (Array.isArray(raw.sources) && raw.sources.length > 0));

        const customPid = `custom_${Date.now()}`;
        const results = await Promise.allSettled(
            engines.map(async ({ key, fn }) => {
                const raw = await fn(query, country || '', language || '');
                if (hasData(raw)) {
                    const parsed = parseResponse(raw, brandName || '', domain || '', expandedCompetitors, key);
                    return { engine: key, success: true, promptId: customPid, ...parsed };
                }
                return { engine: key, success: false };
            })
        );

        const batchRuns = [];
        for (const r of results) {
            const val = r.status === 'fulfilled' ? r.value : null;
            if (val?.success) {
                batchRuns.push({
                    promptId: val.promptId,
                    engine: val.engine,
                    brandMentioned: val.brandMentioned,
                    brandEntity: val.brandEntity,
                    rawText: val.rawText,
                });
            }
        }
        if (batchRuns.length > 0 && brandName) {
            await batchApplyGeminiSentimentByPrompt(batchRuns, brandName);
        }

        for (const r of results) {
            const val = r.status === 'fulfilled' ? r.value : { engine: 'unknown', success: false };
            engineResults[val.engine] = {
                mentioned: val.brandMentioned || false,
                snippet: val.brandEntity?.snippet || null,
                sentiment: val.brandEntity?.sentiment || 'n/a',
                sentimentScore: val.brandEntity?.sentimentScore != null && Number.isFinite(Number(val.brandEntity.sentimentScore))
                    ? Math.min(100, Math.max(0, Math.round(Number(val.brandEntity.sentimentScore))))
                    : null,
                sentimentAnalysis: val.brandEntity?.sentimentAnalysis || null,
                positionRank: val.brandEntity?.positionRank || null,
                citations: val.citations || [],
                rawText: val.rawText || null,
                status: val.success ? '✓ Response received' : '⚠ No response',
            };
        }

        const basePrompt = {
            promptId: customPid,
            query: query.trim(),
            category: 'custom',
            intent: 'custom_prompt',
            isCustom: true,
            engines: engineResults,
        };
        return res.json({ success: true, prompt: attachPromptSentimentSchema(basePrompt) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


/**
 * Batch run: accepts an array of queries and runs each against all 3 engines.
 * Only the provided prompts are sent — no re-scan, no re-running existing prompts.
 * Returns structured prompt objects that the frontend merges into its list.
 */
export async function runCustomPromptsBatch(req, res) {
    try {
        const { queries, brandName, domain, competitors, country, language } = req.body;
        if (!Array.isArray(queries) || queries.length === 0) {
            return res.status(400).json({ success: false, message: 'queries[] is required and must be non-empty' });
        }
        if (queries.length > 10) {
            return res.status(400).json({ success: false, message: 'Maximum 10 prompts per batch' });
        }
        if (!process.env.INFATICA_API_KEY?.trim()) {
            return res.status(503).json({ success: false, message: 'Visibility scans require INFATICA_API_KEY on the server' });
        }

        const expandedCompetitors = (competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);
        const engines = [
            { key: 'perplexity', fn: queryPerplexity },
            { key: 'gemini', fn: queryGemini },
            { key: 'googleAI', fn: queryGoogleAI },
        ];
        const hasData = (raw) => raw && (raw.text || raw.html || (Array.isArray(raw.sources) && raw.sources.length > 0));

        const prompts = [];
        for (const query of queries) {
            const q = (query || '').trim();
            if (!q) continue;

            const engineResults = {};
            const batchPid = `custom_${Date.now()}_${prompts.length}`;
            const settled = await Promise.allSettled(
                engines.map(async ({ key, fn }) => {
                    const raw = await fn(q, country || '', language || '');
                    if (hasData(raw)) {
                        const parsed = parseResponse(raw, brandName || '', domain || '', expandedCompetitors, key);
                        return { engine: key, success: true, promptId: batchPid, ...parsed };
                    }
                    return { engine: key, success: false };
                }),
            );

            const batchRuns = [];
            for (const r of settled) {
                const val = r.status === 'fulfilled' ? r.value : null;
                if (val?.success) {
                    batchRuns.push({
                        promptId: val.promptId,
                        engine: val.engine,
                        brandMentioned: val.brandMentioned,
                        brandEntity: val.brandEntity,
                        rawText: val.rawText,
                    });
                }
            }
            if (batchRuns.length > 0 && brandName) {
                await batchApplyGeminiSentimentByPrompt(batchRuns, brandName);
            }

            for (const r of settled) {
                const val = r.status === 'fulfilled' ? r.value : { engine: 'unknown', success: false };
                engineResults[val.engine] = {
                    mentioned: val.brandMentioned || false,
                    snippet: val.brandEntity?.snippet || null,
                    sentiment: val.brandEntity?.sentiment || 'n/a',
                    sentimentScore: val.brandEntity?.sentimentScore != null && Number.isFinite(Number(val.brandEntity.sentimentScore))
                        ? Math.min(100, Math.max(0, Math.round(Number(val.brandEntity.sentimentScore))))
                        : null,
                    sentimentAnalysis: val.brandEntity?.sentimentAnalysis || null,
                    positionRank: val.brandEntity?.positionRank || null,
                    citations: val.citations || [],
                    rawText: val.rawText || null,
                    status: val.success ? '✓ Response received' : '⚠ No response',
                };
            }

            prompts.push(attachPromptSentimentSchema({
                promptId: batchPid,
                query: q,
                category: 'custom',
                intent: 'custom_prompt',
                isCustom: true,
                engines: engineResults,
            }));
        }

        return res.json({ success: true, prompts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Brand + tracked-competitor-grounded suggestions; re-ranks so scan citation domains win.
 */
export async function suggestCompetitors(req, res) {
    try {
        const {
            brandName = '',
            domain = '',
            industry = '',
            location = '',
            reach = '',
            competitors = [],
            country = '',
            language = '',
            citedDomains = [],
        } = req.body || {};

        if (!process.env.INFATICA_API_KEY?.trim()) {
            return res.status(503).json({ success: false, message: 'Visibility requires INFATICA_API_KEY on the server' });
        }

        const expandedCompetitors = (competitors || []).map(c =>
            typeof c === 'string' ? { name: c, domain: c } : { name: c.name || c.domain, domain: c.domain || c.name },
        );

        const trackedCatalog = expandedCompetitors
            .slice(0, 14)
            .map(c => {
                const n = c.name || c.domain || '';
                if (!n) return null;
                const d = normalizeDomainHint(c.domain || '');
                return d && d !== n.toLowerCase() ? `${n} (${d})` : n;
            })
            .filter(Boolean)
            .join('; ') || '(none yet — infer peers from the category only)';

        const prompt = `You are a market analyst. A buyer is evaluating vendors like "${brandName}" (${domain || 'website TBD'}).

Hard context (must respect):
- Industry / category: ${industry || 'general B2B'}
- Primary geography: ${location || 'global'}
- Typical buyer scale: ${reach || 'not specified'}

Ground-truth competitors this user already tracks (same shortlist — expand the set, do not repeat these names or their obvious parent brands):
${trackedCatalog}

Task: List 14–18 additional DIRECT competitors that belong in the same RFP / comparison set as "${brandName}" and the tracked peers above—same product job, same buyer, same geo where relevant.

Rules:
- Real companies or products only. Exclude Wikipedia, news, forums, social networks, directories, and generic ".com" content farms.
- Do NOT list "${brandName}" or any name/domain you already listed in the user's tracked set above.
- Output ONLY a numbered list (1. 2. 3. …), one company per line, no intro or explanation.`;

        const engines = [queryPerplexity, queryGemini, queryGoogleAI];
        let combinedText = '';
        for (const fn of engines) {
            try {
                const raw = await fn(prompt, country || '', language || '');
                const chunk = plainFromInfatica(raw);
                if (chunk.length > 80) {
                    combinedText = combinedText ? `${combinedText}\n${chunk}` : chunk;
                    if (parseNumberedCompetitorLines(combinedText).length >= 10) break;
                }
            } catch { /* try next */ }
        }

        const names = parseNumberedCompetitorLines(combinedText);
        const citedNorm = [...new Set((citedDomains || []).map(normalizeDomainHint).filter(Boolean))];

        const suggestions = [];
        for (const name of names) {
            if (isDuplicateOfBrandOrTracked(name, brandName, domain, expandedCompetitors)) continue;
            const urlMatch = suggestionMatchesCitedDomains(name, citedNorm);
            const trackedPeer = suggestionNearTrackedPeer(name, expandedCompetitors);
            let score = 38;
            if (urlMatch) score += 62;
            if (trackedPeer) score += 22;
            const priority = score >= 85 ? 'high' : score >= 58 ? 'medium' : 'low';
            suggestions.push({
                name,
                score,
                priority,
                signals: { urlMatch, trackedPeer },
            });
        }

        suggestions.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

        return res.json({ success: true, suggestions: suggestions.slice(0, 20) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * POST /api/visibility/citation-intelligence
 * Body: { scanId }
 * Uses Gemini to summarize all cited URLs, grouped by prompt category and competitor vs own-brand context.
 */
export async function postCitationIntelligence(req, res) {
    try {
        const userId = req.user.id;
        const scanId = req.body?.scanId;
        if (!scanId || typeof scanId !== 'string') {
            return res.status(400).json({ success: false, message: 'scanId is required' });
        }

        const scan = await prisma.visibilityScan.findFirst({
            where: { id: scanId, userId },
        });
        if (!scan) {
            return res.status(404).json({ success: false, message: 'Scan not found' });
        }

        let allRuns = [];
        try {
            const raw = scan.allRuns ? (typeof scan.allRuns === 'string' ? JSON.parse(scan.allRuns) : scan.allRuns) : [];
            allRuns = Array.isArray(raw) ? raw : [];
        } catch {
            allRuns = [];
        }

        if (allRuns.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'This scan has no stored citation runs yet. Finish a full visibility scan first.',
            });
        }

        let scanResults = null;
        try {
            scanResults = scan.results ? (typeof scan.results === 'string' ? JSON.parse(scan.results) : scan.results) : null;
        } catch {
            scanResults = null;
        }

        const competitorNames = extractCompetitorContext(scanResults);
        const aggregate = aggregateCitationsForIntelligence(allRuns);
        const competitorGaps = normalizeGaps(scanResults?.competitorGaps || []);

        const { brief, aggregateMeta } = await generateCitationIntelligenceBrief({
            brandName: scan.brandName || scanResults?.brandName || 'Your brand',
            domain: scan.domain || scanResults?.domain || '',
            industry: scan.industry || scanResults?.industry || '',
            competitorNames,
            aggregate,
            competitorGaps,
        });

        return res.json({
            success: true,
            scanId: scan.id,
            generatedAt: new Date().toISOString(),
            brief,
            aggregateMeta,
        });
    } catch (error) {
        const msg = error?.message || String(error);
        if (msg.includes('GEMINI_API_KEY')) {
            return res.status(503).json({ success: false, message: msg });
        }
        console.error('[postCitationIntelligence]', msg);
        res.status(500).json({ success: false, message: msg });
    }
}

/**
 * POST /api/visibility/citation-url-insights
 * Body: { scanId, urls?: string[] } — if urls is a non-empty array, only those rows are summarized (e.g. current table page).
 */
export async function postCitationUrlInsights(req, res) {
    try {
        const userId = req.user.id;
        const scanId = req.body?.scanId;
        if (!scanId || typeof scanId !== 'string') {
            return res.status(400).json({ success: false, message: 'scanId is required' });
        }

        const scan = await prisma.visibilityScan.findFirst({
            where: { id: scanId, userId },
        });
        if (!scan) {
            return res.status(404).json({ success: false, message: 'Scan not found' });
        }

        let allRuns = [];
        try {
            const raw = scan.allRuns ? (typeof scan.allRuns === 'string' ? JSON.parse(scan.allRuns) : scan.allRuns) : [];
            allRuns = Array.isArray(raw) ? raw : [];
        } catch {
            allRuns = [];
        }

        if (allRuns.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'This scan has no stored citation runs yet. Finish a full visibility scan first.',
            });
        }

        const aggregate = aggregateCitationsForIntelligence(allRuns);
        const byUrl = new Map((aggregate.allCitationUrls || []).map((row) => [row.url, row]));

        const requested = Array.isArray(req.body?.urls)
            ? req.body.urls.filter((u) => typeof u === 'string' && u.trim().length > 0)
            : null;

        let rowsToInsight;
        if (requested && requested.length > 0) {
            rowsToInsight = requested.map((u) => byUrl.get(u)).filter(Boolean);
            if (rowsToInsight.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'None of the requested URLs appear in this scan.',
                });
            }
        } else if (requested && requested.length === 0) {
            return res.json({
                success: true,
                scanId: scan.id,
                generatedAt: new Date().toISOString(),
                insights: [],
            });
        } else {
            rowsToInsight = aggregate.topUrls.slice(0, 54);
        }

        const insights = await generatePerUrlTableInsights(rowsToInsight, scan.brandName || 'Your brand');

        return res.json({
            success: true,
            scanId: scan.id,
            generatedAt: new Date().toISOString(),
            insights,
        });
    } catch (error) {
        const msg = error?.message || String(error);
        if (msg.includes('GEMINI_API_KEY')) {
            return res.status(503).json({ success: false, message: msg });
        }
        console.error('[postCitationUrlInsights]', msg);
        res.status(500).json({ success: false, message: msg });
    }
}
