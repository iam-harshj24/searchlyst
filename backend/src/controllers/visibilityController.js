import { randomUUID } from 'crypto';
import { queryPerplexity, queryGemini, queryGoogleAI } from '../services/infaticaService.js';
import { generatePromptMatrix, generateFallbackPrompts } from '../services/promptIntelligence.js';
import { fastParse, batchDeepAnalysis } from '../services/responseParser.js';
import {
    computeVisibilityScore, computeShareOfVoice, computePerEngine,
    computePerCategory, computeCompetitorGap, computeSentimentBreakdown,
    computeQueryTracking, computeSourceDomains, computeIndustryRanking,
} from '../services/scoringEngine.js';
import {
    generateCompetitorPrompts, runCompetitorAnalysis, generateCompetitorInsights,
} from '../services/competitorAnalysis.js';
import { prisma } from '../lib/prisma.js';

const ENGINES = ['perplexity', 'gemini', 'googleAI'];

async function runEngine(engine, query, country) {
    try {
        switch (engine) {
            case 'perplexity': return await queryPerplexity(query);
            case 'gemini': return await queryGemini(query);
            case 'googleAI': return await queryGoogleAI(query, country);
            default: return null;
        }
    } catch (err) {
        console.error(`[${engine}] "${query.substring(0, 40)}..." failed: ${err.message}`);
        return null;
    }
}

async function runEngineWithTimeout(engine, query, country, timeoutMs = 90000) {
    try {
        return await Promise.race([
            runEngine(engine, query, country),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);
    } catch (err) {
        console.warn(`[${engine}] "${query.substring(0, 30)}..." failed or timed out: ${err.message}`);
        return null;
    }
}

function calculateResult(jobData) {
    const runs = jobData.allRuns || [];
    if (runs.length === 0) return null;

    const brandName = jobData.brandName;
    const competitors = jobData.competitors || [];

    // Core metrics using enhanced scoring engine
    const score = computeVisibilityScore(runs, brandName);
    const sov = computeShareOfVoice(runs, brandName, competitors);
    const perEngine = computePerEngine(runs);
    const perCategory = computePerCategory(runs);
    const sentiment = computeSentimentBreakdown(runs);

    // New enhanced metrics
    const queryTracking = computeQueryTracking(runs, brandName);
    const sourceDomains = computeSourceDomains(runs);
    const industryRanking = computeIndustryRanking(runs, brandName, competitors);
    const competitorGaps = computeCompetitorGap(runs, brandName, competitors);

    // Entity graph
    const entityMap = {};
    for (const run of runs) {
        for (const e of (run.entities || [])) {
            if (!entityMap[e.name]) entityMap[e.name] = {
                ...e,
                totalMentions: 0,
                queryCount: new Set(),
                avgPosition: 0,
                positionSum: 0,
                positionCount: 0,
            };
            entityMap[e.name].totalMentions += e.mentions || 1;
            entityMap[e.name].queryCount.add(run.query);
            if (e.positionRank) {
                entityMap[e.name].positionSum += e.positionRank;
                entityMap[e.name].positionCount++;
            }
        }
    }
    const entityGraph = Object.values(entityMap)
        .map(e => ({
            name: e.name,
            domain: e.domain,
            isTargetBrand: e.isTargetBrand,
            isCompetitor: e.isCompetitor,
            totalMentions: e.totalMentions,
            queryCount: e.queryCount.size,
            sentiment: e.sentiment,
            avgPosition: e.positionCount > 0 ? (e.positionSum / e.positionCount).toFixed(1) : '-',
        }))
        .sort((a, b) => b.totalMentions - a.totalMentions).slice(0, 20);

    const promptMap = {};
    for (const run of runs) {
        if (!promptMap[run.promptId]) promptMap[run.promptId] = {
            query: run.query, category: run.category, intent: run.intent, strategicValue: run.strategicValue, engines: {}
        };
        if (!promptMap[run.promptId].engines[run.engine]) {
            promptMap[run.promptId].engines[run.engine] = { mentioned: false, snippet: null, sentiment: 'n/a', positionRank: null, citations: '' };
        }
        const eng = promptMap[run.promptId].engines[run.engine];
        if (run.brandMentioned && run.brandEntity) {
            eng.mentioned = true;
            eng.snippet = run.brandEntity.snippet || null;
            eng.sentiment = run.brandEntity.sentiment || 'n/a';
            eng.positionRank = run.brandEntity.positionRank || null;
        }
        if (run.citations?.length > 0) {
            eng.citations = run.citations.slice(0, 3).map(c => c.domain).join(', ');
        }
    }
    const prompts = Object.entries(promptMap).map(([id, d]) => ({ promptId: id, ...d }));

    return {
        brandName,
        domain: jobData.domain,
        industry: jobData.industry,
        scannedAt: new Date().toISOString(),
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
        intelligence: jobData.intelligence || null,
        competitorAnalysis: jobData.competitorAnalysis ? {
            shareOfVoice: jobData.competitorAnalysis.shareOfVoice || [],
            industryRankingDetailed: jobData.competitorAnalysis.industryRanking || [],
            sentimentComparison: jobData.competitorAnalysis.sentimentAnalysis || [],
            threatRadar: jobData.competitorAnalysis.threatRadar || [],
            analysisErrors: jobData.competitorAnalysis.errors || [],
        } : null,
        competitorInsights: jobData.competitorInsights || null,
        config: {
            promptCount: jobData.promptCount,
            engines: ENGINES.length,
            totalCalls: jobData.totalCalls
        },
        completedPrompts: jobData.completedPrompts,
        totalPrompts: jobData.promptCount,
    };
}

async function executeScan(scanId, brandName, domain, industry, competitors, location, country, language) {
    try {
        // ── Phase 0: Competitor Discovery ──────────────────────────────
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'competitor_discovery', detail: 'Discovering additional competitors via AI engines...' }) }
        });

        let expandedCompetitors = [...(competitors || [])];
        try {
            const competitorNames = expandedCompetitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
            const discoveryPrompt = `List the top 15 companies that directly compete with ${brandName} (${domain}) in the ${industry} industry${location ? ` in ${location}` : ''}. ${competitorNames.length > 0 ? `Known competitors include: ${competitorNames.join(', ')}. Find additional competitors beyond these.` : ''} Return ONLY a JSON array of objects with "name" and "domain" fields, no other text.`;

            // Query two engines for broader coverage
            const [perplexityResult, geminiResult] = await Promise.allSettled([
                runEngineWithTimeout('perplexity', discoveryPrompt, country, 60000),
                runEngineWithTimeout('gemini', discoveryPrompt, country, 60000),
            ]);

            const parseCompetitors = (html) => {
                if (!html) return [];
                try {
                    // Try to extract JSON array from response
                    const jsonMatch = html.match(/\[[\s\S]*?\]/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        return parsed.filter(c => c && (c.name || c.domain)).map(c => ({
                            name: c.name || c.domain,
                            domain: c.domain || c.name,
                        }));
                    }
                } catch { }
                return [];
            };

            const discovered1 = parseCompetitors(perplexityResult.status === 'fulfilled' ? perplexityResult.value : null);
            const discovered2 = parseCompetitors(geminiResult.status === 'fulfilled' ? geminiResult.value : null);

            // Deduplicate: merge discovered with existing
            const existingNames = new Set(expandedCompetitors.map(c => (typeof c === 'string' ? c : c.name).toLowerCase()));
            existingNames.add(brandName.toLowerCase()); // Don't include ourselves
            existingNames.add(domain.toLowerCase());

            [...discovered1, ...discovered2].forEach(comp => {
                const key = (comp.name || '').toLowerCase();
                if (key && !existingNames.has(key) && key !== domain.toLowerCase()) {
                    expandedCompetitors.push(comp);
                    existingNames.add(key);
                }
            });

            console.log(`[Scan] Competitor discovery: ${competitors.length} user-provided → ${expandedCompetitors.length} total`);
        } catch (err) {
            console.error('[Scan] Competitor discovery failed (non-blocking):', err.message);
        }

        // ── Phase 1: Prompt Generation ─────────────────────────────────
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'generating_prompts', detail: 'Generating smart prompts with Gemini...' }) }
        });

        let prompts;
        try {
            prompts = await generatePromptMatrix({ brandName, domain, industry, competitors: expandedCompetitors, location, language });
        } catch (err) {
            console.error('[Scan] Prompt gen failed, using fallback:', err.message);
            prompts = generateFallbackPrompts(brandName, domain, industry, expandedCompetitors, location);
        }

        const promptCount = prompts.length;
        const totalCalls = promptCount * ENGINES.length;
        let completedCalls = 0;
        let allRuns = [];

        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: {
                progress: JSON.stringify({
                    phase: 'querying',
                    detail: `Querying ${ENGINES.length} AI engines...`,
                    completed: 0,
                    total: totalCalls
                })
            }
        });

        const fetchPromises = [];
        for (const prompt of prompts) {
            for (const engine of ENGINES) {
                fetchPromises.push((async () => {
                    const html = await runEngineWithTimeout(engine, prompt.core, country, 90000);
                    completedCalls++;

                    const runData = html ? fastParse(html, brandName, domain, competitors, engine) : {
                        brandMentioned: false, brandEntity: null, entities: [], citations: [], textLength: 0
                    };

                    const run = {
                        promptId: prompt.id, query: prompt.core, engine,
                        promptWeight: prompt.weight, category: prompt.category, intent: prompt.intent,
                        strategicValue: prompt.strategicValue,
                        ...runData,
                    };

                    allRuns.push(run);

                    // Periodically update DB with results and progress
                    if (completedCalls % 5 === 0 || completedCalls === totalCalls) {
                        const partialResult = calculateResult({
                            brandName, domain, industry, competitors: expandedCompetitors, allRuns,
                            promptCount, totalCalls, completedPrompts: Math.floor(completedCalls / ENGINES.length)
                        });
                        await prisma.visibilityScan.update({
                            where: { id: scanId },
                            data: {
                                allRuns: JSON.stringify(allRuns),
                                results: JSON.stringify(partialResult),
                                progress: JSON.stringify({
                                    phase: 'querying',
                                    detail: `Live processing: ${completedCalls}/${totalCalls} queries...`,
                                    completed: completedCalls,
                                    total: totalCalls
                                })
                            }
                        });
                    }
                })());
            }
        }

        await Promise.allSettled(fetchPromises);

        // Deep Analysis Phase
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'analyzing', detail: 'Running deep AI analysis...' }) }
        });

        let intelligence = null;
        try {
            intelligence = await batchDeepAnalysis(allRuns, brandName, domain, expandedCompetitors);
        } catch (err) { console.error('[Scan] Deep analysis failed:', err.message); }

        // Competitor Analysis Phase
        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: { progress: JSON.stringify({ phase: 'competitor_analysis', detail: 'Running competitor intelligence analysis...' }) }
        });

        let competitorAnalysis = null;
        let competitorInsights = null;
        try {
            competitorAnalysis = await runCompetitorAnalysis(brandName, domain, industry, expandedCompetitors, location, async (p) => {
                try { return await queryPerplexity(p); } catch { return await queryGemini(p); }
            });
            if (competitorAnalysis.shareOfVoice || competitorAnalysis.industryRanking) {
                competitorInsights = await generateCompetitorInsights(competitorAnalysis, brandName, industry);
            }
        } catch (err) {
            console.error('[Scan] Competitor analysis failed:', err.message);
            competitorAnalysis = { errors: [{ type: 'general', error: err.message }] };
        }

        const finalResult = calculateResult({
            brandName, domain, industry, competitors: expandedCompetitors, allRuns,
            promptCount, totalCalls, completedPrompts: promptCount,
            intelligence, competitorAnalysis, competitorInsights
        });

        await prisma.visibilityScan.update({
            where: { id: scanId },
            data: {
                status: 'completed',
                allRuns: JSON.stringify(allRuns),
                results: JSON.stringify(finalResult),
                progress: JSON.stringify({ phase: 'done', detail: 'Scan completed successfully', completed: totalCalls, total: totalCalls })
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
        const { brandName, domain, industry, competitors, location, country, language } = req.body;
        const userId = req.user.id;
        if (!brandName || !domain) return res.status(400).json({ success: false, message: 'brandName and domain are required' });

        const scanId = randomUUID();
        await prisma.visibilityScan.create({
            data: {
                id: scanId, userId, brandName, domain,
                status: 'scanning',
                progress: JSON.stringify({ phase: 'initializing', detail: 'Starting...' })
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
            result: results,
            error: job.error
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
