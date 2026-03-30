/**
 * visibilityAgents.js
 *
 * New architecture:
 *   - Generate 20 prompts ONCE (shared across all engines)
 *   - For each prompt, send ONE request to Infatica's multi-engine API
 *     (ChatGPT + Gemini + Perplexity all return in one call)
 *   - Also run Google AI Overview in parallel (separate SERP endpoint)
 *   - Parse every engine's response
 *   - Build prompt-keyed result map for Prompt Intelligence UI
 */

import { queryAllEngines, queryGoogleAIOverview } from './infaticaService.js';
import { generateSuperPrompts, generateFallbackPrompts } from './promptIntelligence.js';
import { parseResponse } from './responseParser.js';
import {
    computeVisibilityScore,
    computeShareOfVoice,
    computePerEngine,
    computePerCategory,
    computeSourceDomains,
    computeIndustryRanking,
    computeCompetitorGap,
    computeSentimentBreakdown,
    computeQueryTracking,
} from './scoringEngine.js';

// All LLMs sent to the Infatica multi-engine endpoint
const LLM_ENGINES = ['chatgpt', 'gemini', 'perplexity'];

// All engines including Google AI (separate endpoint)
const ALL_ENGINES = [...LLM_ENGINES, 'googleAI'];

const ENGINE_LABELS = {
    chatgpt: 'ChatGPT',
    gemini: 'Gemini',
    perplexity: 'Perplexity',
    googleAI: 'Google AI Overview',
};

/**
 * Run a single prompt against all engines.
 * Returns per-engine { text, sources } map.
 */
async function runPromptOnAllEngines(promptText, { geo = 'US', country = '' } = {}) {
    // Fire LLM engines (multi-engine call) and Google AI SERP in parallel
    const [llmResults, googleResult] = await Promise.allSettled([
        queryAllEngines(promptText, { engines: LLM_ENGINES, geo }),
        queryGoogleAIOverview(promptText, country),
    ]);

    const results = {};

    // LLM engines
    if (llmResults.status === 'fulfilled') {
        Object.assign(results, llmResults.value);
    } else {
        console.warn('[VisAgent] LLM multi-engine call failed:', llmResults.reason?.message);
        for (const eng of LLM_ENGINES) {
            results[eng] = { text: null, sources: [] };
        }
    }

    // Google AI Overview
    results.googleAI = googleResult.status === 'fulfilled'
        ? googleResult.value
        : { text: null, sources: [], html: null };

    return results;
}

/**
 * Parse a single engine's Infatica result into our standard run data shape.
 */
function buildRunFromEngineResult(engineResult, { promptId, query, engine, category, intent, weight, brandName, domain, competitors }) {
    const runData = parseResponse(engineResult, brandName, domain, competitors, engine);
    return {
        promptId,
        query,
        engine,
        category,
        intent,
        promptWeight: weight ?? 1.0,
        strategicValue: 10,
        ...runData,
    };
}

/**
 * Main scan function.
 * For each of the 20 prompts → query all LLMs simultaneously → parse → aggregate.
 */
export async function runAllEnginesOnAllPrompts(agentConfig, onProgress) {
    const {
        brandName, domain, industry, competitors = [],
        location, country, language,
    } = agentConfig;

    const geo = country || (location?.toLowerCase().includes('india') ? 'IN' : 'US');

    // Generate the 20 prompts once
    let prompts;
    try {
        prompts = generateSuperPrompts({ brandName, domain, industry, competitors, location, language });
    } catch (err) {
        console.warn('[VisAgent] Prompt generation failed, using fallback:', err.message);
        prompts = generateFallbackPrompts(brandName, domain, industry, competitors, location);
    }

    const total = prompts.length;
    console.log(`[VisAgent] Starting scan: ${total} prompts × ${ALL_ENGINES.length} engines = up to ${total * ALL_ENGINES.length} responses`);

    /**
     * allRuns: flat list of { promptId, query, engine, brandMentioned, entities, citations, rawText, ... }
     * promptMap: { P01: { promptId, query, category, intent, engines: { chatgpt: {...}, gemini: {...}, ... } }, ... }
     */
    const allRuns = [];
    const promptMap = {};

    // Process prompts in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
        const batch = prompts.slice(batchStart, batchStart + BATCH_SIZE);

        await Promise.allSettled(batch.map(async (prompt) => {
            let engineResults;
            try {
                engineResults = await runPromptOnAllEngines(prompt.core, { geo, country });
            } catch (err) {
                console.warn(`[VisAgent] Prompt ${prompt.id} failed:`, err.message);
                engineResults = {};
                for (const eng of ALL_ENGINES) {
                    engineResults[eng] = { text: null, sources: [], html: null };
                }
            }

            // Initialize the prompt entry
            if (!promptMap[prompt.id]) {
                promptMap[prompt.id] = {
                    promptId: prompt.id,
                    query: prompt.core,
                    category: prompt.category,
                    intent: prompt.intent,
                    engines: {},
                };
            }

            // Parse each engine's response
            for (const engine of ALL_ENGINES) {
                const engineResult = engineResults[engine] || { text: null, sources: [], html: null };
                const run = buildRunFromEngineResult(engineResult, {
                    promptId: prompt.id,
                    query: prompt.core,
                    engine,
                    category: prompt.category,
                    intent: prompt.intent,
                    weight: prompt.weight,
                    brandName,
                    domain,
                    competitors,
                });

                allRuns.push(run);

                const hasResponse = !!(run.rawText?.trim?.().length > 0);
                promptMap[prompt.id].engines[engine] = {
                    mentioned:      run.brandMentioned,
                    snippet:        run.brandEntity?.snippet || null,
                    sentiment:      run.brandEntity?.sentiment || 'neutral',
                    positionRank:   run.brandEntity?.positionRank || null,
                    rawText:        run.rawText || null,
                    citationCount:  (run.citations || []).length,
                    status:         hasResponse ? '✓ Response received' : '⚠ No response',
                    citations: (run.citations || []).slice(0, 10).map(c => ({
                        domain:          c.domain,
                        url:             c.url,
                        title:           c.title || '',
                        category:        c.category || 'other',
                        citationPosition: c.citationPosition,
                        isTargetBrand:   c.isTargetBrand,
                        isCompetitor:    c.isCompetitor,
                    })),
                };
            }

            // Report progress
            const completedCount = Object.keys(promptMap).length;
            if (onProgress) {
                onProgress({
                    completed: completedCount,
                    total,
                    promptId: prompt.id,
                    engines: ALL_ENGINES,
                });
            }
        }));
    }

    console.log(`[VisAgent] Scan complete: ${allRuns.length} total responses across ${Object.keys(promptMap).length} prompts`);

    return {
        allRuns,
        promptMap,
        promptList: Object.values(promptMap),
        engines: ALL_ENGINES,
    };
}

/**
 * Build per-engine analytics from allRuns.
 * Returns the platformResults shape expected by visibilityController.js.
 */
function buildPlatformResults(allRuns, brandName, competitors) {
    const platformResults = {};

    for (const engine of ALL_ENGINES) {
        const engineRuns = allRuns.filter(r => r.engine === engine);
        if (engineRuns.length === 0) continue;

        const score = computeVisibilityScore(engineRuns, brandName);
        const shareOfVoice = computeShareOfVoice(engineRuns, brandName, competitors);
        const perCategory = computePerCategory(engineRuns);
        const sentiment = computeSentimentBreakdown(engineRuns);
        const sourceDomains = computeSourceDomains(engineRuns);
        const industryRanking = computeIndustryRanking(engineRuns, brandName, competitors);
        const competitorGaps = computeCompetitorGap(engineRuns, brandName, competitors);

        platformResults[engine] = {
            engine,
            platformName: ENGINE_LABELS[engine] || engine,
            allRuns: engineRuns,
            promptCount: engineRuns.length,
            totalCalls: engineRuns.length,
            score,
            shareOfVoice,
            perCategory,
            sentiment,
            sourceDomains,
            industryRanking,
            competitorGaps,
            citationSummary: sourceDomains.topDomains,
            config: { promptCount: engineRuns.length, totalCalls: engineRuns.length },
        };
    }

    return platformResults;
}

/**
 * Main entry point called by visibilityController.
 * Replaces the old runAllAgentsInParallel.
 */
export async function runAllAgentsInParallel(agentConfig, onAgentProgress) {
    const { brandName, competitors = [] } = agentConfig;

    const { allRuns, promptList } = await runAllEnginesOnAllPrompts(agentConfig, (p) => {
        if (onAgentProgress) {
            // Simulate progress for all engines per prompt
            for (const engine of ALL_ENGINES) {
                onAgentProgress({ engine, completed: p.completed, total: p.total });
            }
        }
    });

    const platformResults = buildPlatformResults(allRuns, brandName, competitors);
    const errors = [];

    // Check for engines with zero responses
    for (const engine of ALL_ENGINES) {
        if (!platformResults[engine]) {
            errors.push({ engine, error: 'No responses received' });
            platformResults[engine] = {
                engine,
                platformName: ENGINE_LABELS[engine] || engine,
                error: 'No responses received',
                allRuns: [],
                score: { overall: 0, components: {} },
                shareOfVoice: { brand: { name: brandName, sov: 0, mentions: 0 }, competitors: [] },
                industryRanking: [],
                prompts: [],
                entityGraph: [],
                citationSummary: [],
                competitorGaps: [],
                config: { promptCount: 0, totalCalls: 0 },
            };
        }
    }

    return { platformResults, allRuns, errors, promptList };
}
