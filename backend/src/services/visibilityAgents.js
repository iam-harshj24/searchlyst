/**
 * Parallel Visibility Agents
 *
 * Three independent agents run in parallel:
 * - Perplexity Agent (Superplexity)
 * - Gemini Agent
 * - Google AI Overview Agent
 *
 * Each agent: generates prompts → queries Infatica in parallel → parses → computes platform analytics.
 * Results are combined into an Overview.
 */

import { queryPerplexity, queryGemini, queryGoogleAI } from './infaticaService.js';
import { generatePromptMatrixForPlatform, generateFallbackPrompts } from './promptIntelligence.js';
import { fastParse } from './responseParser.js';
import {
    computeVisibilityScore,
    computeShareOfVoice,
    computePerCategory,
    computeSourceDomains,
    computeIndustryRanking,
    computeCompetitorGap,
    computeSentimentBreakdown,
} from './scoringEngine.js';

const PLATFORM_NAMES = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'Google AI Overview' };

async function queryWithTimeout(engine, query, country, timeoutMs = 60000) {
    try {
        return await Promise.race([
            (async () => {
                switch (engine) {
                    case 'perplexity': return await queryPerplexity(query);
                    case 'gemini': return await queryGemini(query);
                    case 'googleAI': return await queryGoogleAI(query, country);
                    default: return null;
                }
            })(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs)),
        ]);
    } catch (err) {
        console.warn(`[${engine}] Query failed: ${err.message}`);
        return null;
    }
}

/**
 * Run a single platform agent: generate prompts → query Infatica in parallel → parse → compute analytics
 */
export async function runPlatformAgent(agentConfig) {
    const { engine, brandName, domain, industry, competitors, location, country, language, onProgress } = agentConfig;

    const platformName = PLATFORM_NAMES[engine] || engine;

    let prompts;
    try {
        prompts = await generatePromptMatrixForPlatform(
            { brandName, domain, industry, competitors, location, language },
            engine
        );
    } catch (err) {
        console.warn(`[Agent ${engine}] Prompt gen failed, using fallback:`, err.message);
        prompts = generateFallbackPrompts(brandName, domain, industry, competitors, location).slice(0, 15);
    }

    const total = prompts.length;
    const allRuns = [];

    const fetchPromises = prompts.map(async (prompt) => {
        const html = await queryWithTimeout(engine, prompt.core, country, 60000);

        const runData = html
            ? fastParse(html, brandName, domain, competitors, engine)
            : { brandMentioned: false, brandEntity: null, entities: [], citations: [], textLength: 0 };

        const run = {
            promptId: prompt.id,
            query: prompt.core,
            engine,
            promptWeight: prompt.weight,
            category: prompt.category,
            intent: prompt.intent,
            strategicValue: prompt.strategicValue,
            ...runData,
        };

        allRuns.push(run);
        if (onProgress) onProgress({ engine, completed: allRuns.length, total, run });
        return run;
    });

    await Promise.allSettled(fetchPromises);

    const score = computeVisibilityScore(allRuns, brandName);
    const shareOfVoice = computeShareOfVoice(allRuns, brandName, competitors);
    const perCategory = computePerCategory(allRuns);
    const sentiment = computeSentimentBreakdown(allRuns);
    const sourceDomains = computeSourceDomains(allRuns);
    const industryRanking = computeIndustryRanking(allRuns, brandName, competitors);
    const competitorGaps = computeCompetitorGap(allRuns, brandName, competitors);

    const promptMap = {};
    for (const run of allRuns) {
        const key = run.promptId ?? run.query;
        if (!promptMap[key]) {
            promptMap[key] = { promptId: run.promptId, query: run.query, category: run.category, intent: run.intent, engines: {} };
        }
        promptMap[key].engines[engine] = {
            mentioned: run.brandMentioned,
            snippet: run.brandEntity?.snippet || null,
            sentiment: run.brandEntity?.sentiment || 'n/a',
            positionRank: run.brandEntity?.positionRank || null,
            citations: run.citations?.slice(0, 3).map(c => ({ domain: c.domain, url: c.url, isTargetBrand: c.isTargetBrand })) || [],
        };
    }

    const promptList = Object.values(promptMap);

    const entityMap = {};
    for (const run of allRuns) {
        for (const e of run.entities || []) {
            if (!entityMap[e.name]) {
                entityMap[e.name] = { ...e, totalMentions: 0, queryCount: new Set(), positionSum: 0, positionCount: 0 };
            }
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
        .sort((a, b) => b.totalMentions - a.totalMentions)
        .slice(0, 15);

    return {
        engine,
        platformName,
        allRuns,
        promptCount: promptList.length,
        totalCalls: allRuns.length,
        score,
        shareOfVoice,
        perCategory,
        sentiment,
        sourceDomains,
        industryRanking,
        competitorGaps,
        prompts: promptList,
        entityGraph,
        citationSummary: sourceDomains.topDomains,
        config: { promptCount: promptList.length, totalCalls: allRuns.length },
    };
}

/**
 * Run all 3 platform agents in parallel
 */
export async function runAllAgentsInParallel(agentConfig, onAgentProgress) {
    const agents = ['perplexity', 'gemini', 'googleAI'];

    const agentPromises = agents.map(engine =>
        runPlatformAgent({ ...agentConfig, engine, onProgress: (p) => onAgentProgress?.(p) })
    );

    const results = await Promise.allSettled(agentPromises);

    const platformResults = {};
    const allRuns = [];
    const errors = [];

    results.forEach((result, idx) => {
        const engine = agents[idx];
        if (result.status === 'fulfilled') {
            platformResults[engine] = result.value;
            allRuns.push(...(result.value.allRuns || []));
        } else {
            console.error(`[Agent ${engine}] Failed:`, result.reason);
            platformResults[engine] = {
                engine,
                platformName: PLATFORM_NAMES[engine],
                error: result.reason?.message || 'Unknown error',
                allRuns: [],
                score: { overall: 0, components: {} },
                shareOfVoice: { brand: { name: '', sov: 0, mentions: 0 }, competitors: [] },
                industryRanking: [],
                prompts: [],
                entityGraph: [],
                citationSummary: [],
                competitorGaps: [],
                config: { promptCount: 0, totalCalls: 0 },
            };
            errors.push({ engine, error: result.reason?.message });
        }
    });

    return { platformResults, allRuns, errors };
}
