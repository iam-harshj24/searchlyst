/**
 * Visibility Agents — Two-Phase Parallel Execution
 *
 * Architecture:
 * - Generate 20 compressed prompts once
 * - Phase 1: First 10 prompts across 3 engines in parallel → emit early results
 * - Phase 2: Remaining 10 prompts in parallel → final results
 * - Larger batch sizes (perplexity=2, gemini=3, googleAI=3) to cut wall-clock time
 * - Target: ~1.5 min per phase, ~3 min total
 */

import { queryPerplexity, queryGemini, queryGoogleAI } from './infaticaService.js';
import { generatePromptMatrixForPlatform, generateFallbackPrompts } from './promptIntelligence.js';
import { parseResponse } from './responseParser.js';
import {
    computeVisibilityScore,
    computeShareOfVoice,
    computePerCategory,
    computeSourceDomains,
    computeIndustryRanking,
    computeCompetitorGap,
    computeSentimentBreakdown,
} from './scoringEngine.js';

const ENGINES = ['perplexity', 'gemini', 'googleAI'];
const PLATFORM_NAMES = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'Google AI' };
const BATCH_SIZES = { perplexity: 2, gemini: 3, googleAI: 3 };
const PHASE1_SIZE = 10;

function queryFn(engine) {
    switch (engine) {
        case 'perplexity': return queryPerplexity;
        case 'gemini':     return queryGemini;
        case 'googleAI':   return queryGoogleAI;
    }
}

/**
 * Run a single engine agent: process prompts in batches per BATCH_SIZES[engine].
 */
async function runEngineAgent(engine, prompts, brandName, domain, competitors, country, onResult) {
    const fn = queryFn(engine);
    const runs = [];
    let successCount = 0;
    let failCount = 0;
    const batchSize = BATCH_SIZES[engine] || 2;
    const totalBatches = Math.ceil(prompts.length / batchSize);

    console.log(`[Agent:${engine}] Starting ${prompts.length} prompts in ${totalBatches} batches (size=${batchSize})`);

    for (let i = 0; i < prompts.length; i += batchSize) {
        const batch = prompts.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;

        const results = await Promise.allSettled(
            batch.map(async (prompt) => {
                try {
                    const infResult = await fn(prompt.core, country);
                    if (infResult && (infResult.text || infResult.html)) {
                        const parsed = parseResponse(infResult, brandName, domain, competitors, engine);
                        return { success: true, data: parsed, prompt };
                    }
                    return { success: false, prompt };
                } catch (err) {
                    console.warn(`  [Agent:${engine}] Call failed: ${err.message}`);
                    return { success: false, prompt };
                }
            })
        );

        for (const r of results) {
            const val = r.status === 'fulfilled' ? r.value : { success: false, prompt: batch[0] };
            const prompt = val.prompt;
            const runData = val.success ? val.data : {
                engine,
                brandMentioned: false, brandEntity: null, entities: [],
                citations: [], citationStats: { total: 0, byCategory: {}, brandCited: false, competitorsCited: [] },
                textLength: 0, rawText: null,
            };

            const run = {
                promptId: prompt.id,
                query: prompt.core,
                engine,
                promptWeight: prompt.weight ?? 1.0,
                category: prompt.category,
                intent: prompt.intent,
                strategicValue: prompt.strategicValue ?? 10,
                includesBrand: prompt.includesBrand ?? false,
                ...runData,
            };
            runs.push(run);
            if (val.success) successCount++; else failCount++;
            if (onResult) onResult(run, val.success);
        }

        console.log(`[Agent:${engine}] Batch ${batchNum}/${totalBatches} done (running: ${successCount} ok, ${failCount} fail)`);
    }

    console.log(`[Agent:${engine}] Finished: ${successCount}/${prompts.length} with data, ${failCount} empty`);
    return { runs, successCount, failCount };
}

/** Collect runs from Promise.allSettled results */
function collectPhaseRuns(settledResults, errors) {
    const runs = [];
    for (let i = 0; i < settledResults.length; i++) {
        const engine = ENGINES[i];
        if (settledResults[i].status === 'fulfilled') {
            runs.push(...settledResults[i].value.runs);
        } else {
            console.error(`[Agent:${engine}] Fatal:`, settledResults[i].reason?.message);
            if (!errors.find(e => e.engine === engine)) {
                errors.push({ engine, error: settledResults[i].reason?.message });
            }
        }
    }
    return runs;
}

/** Build per-platform result objects */
function buildPlatformResults(allRuns, prompts, brandName, competitors, domain) {
    const platformResults = {};
    for (const engine of ENGINES) {
        const engineRuns = allRuns.filter(r => r.engine === engine);
        const dataRuns = engineRuns.filter(r => r.textLength > 0);
        platformResults[engine] = {
            engine,
            platformName: PLATFORM_NAMES[engine],
            allRuns: engineRuns,
            score: computeVisibilityScore(dataRuns, brandName),
            shareOfVoice: computeShareOfVoice(dataRuns, brandName, competitors, domain),
            perCategory: computePerCategory(dataRuns),
            sentiment: computeSentimentBreakdown(dataRuns),
            sourceDomains: computeSourceDomains(dataRuns),
            industryRanking: computeIndustryRanking(dataRuns, brandName, competitors, domain),
            competitorGaps: computeCompetitorGap(dataRuns, brandName, competitors),
            promptCount: prompts.length,
            totalCalls: engineRuns.length,
            successfulCalls: dataRuns.length,
            prompts: [],
            entityGraph: [],
            citationSummary: computeSourceDomains(dataRuns).topDomains,
            config: { promptCount: prompts.length, totalCalls: engineRuns.length, successfulCalls: dataRuns.length },
        };
    }
    return platformResults;
}

/**
 * Main entry: two-phase parallel execution.
 *
 * Phase 1 — first 10 prompts → calls onEarlyResults so the controller can
 *           save intermediate data and the frontend can start rendering.
 * Phase 2 — remaining 10 prompts → merged with Phase 1 for final results.
 *
 * @param {object}   agentConfig     - brandName, domain, industry, etc.
 * @param {function} onAgentProgress - (p) => void, called per completed call
 * @param {function} onEarlyResults  - async (phase1Runs, prompts) => void
 */
export async function runAllAgentsInParallel(agentConfig, onAgentProgress, onEarlyResults) {
    const { brandName, domain, industry, competitors, location, country, language } = agentConfig;

    let prompts;
    try {
        prompts = await generatePromptMatrixForPlatform(
            { brandName, domain, industry, competitors, location, language },
            'general'
        );
    } catch (err) {
        console.warn(`[Agents] Prompt generation failed, using fallback:`, err.message);
        prompts = generateFallbackPrompts(brandName, domain, industry, competitors, location);
    }

    const phase1Prompts = prompts.slice(0, PHASE1_SIZE);
    const phase2Prompts = prompts.slice(PHASE1_SIZE);
    const totalCalls = prompts.length * ENGINES.length;
    let completedCalls = 0;
    let successCalls = 0;

    const progressCb = (_run, wasSuccess) => {
        completedCalls++;
        if (wasSuccess) successCalls++;
        if (onAgentProgress) {
            onAgentProgress({ completed: completedCalls, total: totalCalls, successful: successCalls });
        }
    };

    console.log(`[Agents] ${prompts.length} prompts × ${ENGINES.length} engines = ${totalCalls} total calls (batch sizes: ${JSON.stringify(BATCH_SIZES)})`);
    console.log(`[Agents] Phase 1: ${phase1Prompts.length} prompts | Phase 2: ${phase2Prompts.length} prompts`);

    // ── Phase 1: first 10 prompts across all engines in parallel ─────────────
    const phase1Settled = await Promise.allSettled(
        ENGINES.map(engine =>
            runEngineAgent(engine, phase1Prompts, brandName, domain, competitors, country, progressCb)
        )
    );

    const errors = [];
    const phase1Runs = collectPhaseRuns(phase1Settled, errors);

    console.log(`[Agents] Phase 1 complete: ${phase1Runs.filter(r => r.textLength > 0).length}/${phase1Runs.length} runs with data`);

    // Emit early results so frontend can start rendering
    if (onEarlyResults && phase1Runs.length > 0) {
        try {
            await onEarlyResults(phase1Runs, prompts);
        } catch (e) {
            console.warn('[Agents] Early results callback error:', e.message);
        }
    }

    // ── Phase 2: remaining prompts across all engines in parallel ────────────
    let phase2Runs = [];
    if (phase2Prompts.length > 0) {
        const phase2Settled = await Promise.allSettled(
            ENGINES.map(engine =>
                runEngineAgent(engine, phase2Prompts, brandName, domain, competitors, country, progressCb)
            )
        );
        phase2Runs = collectPhaseRuns(phase2Settled, errors);
        console.log(`[Agents] Phase 2 complete: ${phase2Runs.filter(r => r.textLength > 0).length}/${phase2Runs.length} runs with data`);
    }

    // ── Merge and return ─────────────────────────────────────────────────────
    const allRuns = [...phase1Runs, ...phase2Runs];
    const platformResults = buildPlatformResults(allRuns, prompts, brandName, competitors, domain);

    const stats = {};
    for (const engine of ENGINES) {
        const engineRuns = allRuns.filter(r => r.engine === engine);
        const dataRuns = engineRuns.filter(r => r.textLength > 0);
        stats[engine] = { success: dataRuns.length, fail: engineRuns.length - dataRuns.length };
    }

    console.log(`[Agents] Complete: ${successCalls}/${totalCalls} calls returned data`);
    for (const [eng, s] of Object.entries(stats)) {
        console.log(`  ${eng}: ${s.success} ok, ${s.fail} empty`);
    }

    return { platformResults, allRuns, errors };
}
