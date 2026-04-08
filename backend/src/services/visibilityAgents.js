/**
 * Visibility Agents — Dedicated parallel pipelines per engine
 *
 * Architecture:
 * - 4 independent pipelines: Perplexity, Gemini, ChatGPT (Infatica /chatgpt), Google SERP (AI Overviews context)
 * - Each pipeline owns ALL prompts and processes them at its own pace
 * - Worker-pool concurrency within each pipeline:
 *     Perplexity : 1 concurrent by default (set VISIBILITY_PERPLEXITY_CONCURRENCY) — reduces Infatica/429 empty runs
 *     Gemini     : 3 concurrent
 *     ChatGPT    : 3 concurrent
 *     GoogleAI   : 3 concurrent (SERP / Infatica serp)
 * - Total peak concurrency: 1+3+3+3 = 10 default simultaneous Infatica calls
 * - No prompt blocks another engine — if Perplexity is slow, Gemini races ahead
 * - Early results fire once ≥50% of engine×prompt calls have completed (initial dashboard), then refine to 100%
 */

import { queryPerplexity, queryGemini, queryGoogleAI, queryInfaticaChatGPT } from './infaticaService.js';
import { generatePromptMatrixForPlatform, generateFallbackPrompts } from './promptIntelligence.js';
import { parseResponse, batchApplyGeminiSentimentByPrompt } from './responseParser.js';
import {
    computeVisibilityScore,
    computeShareOfVoice,
    computePerCategory,
    computeSourceDomains,
    computeIndustryPresenceRanking,
    computeCompetitorGap,
    computeSentimentBreakdown,
} from './scoringEngine.js';

const ENGINES = ['perplexity', 'gemini', 'chatgpt', 'googleAI'];
const PLATFORM_NAMES = {
    perplexity: 'Perplexity',
    gemini: 'Gemini',
    chatgpt: 'ChatGPT',
    googleAI: 'Google AI Overviews',
};

const PIPELINE_CONCURRENCY = {
    // Default 2: Perplexity was the tail bottleneck at 1× (last prompts wait behind the whole queue). Override if Infatica returns 429s.
    perplexity: Math.min(4, Math.max(1, Number(process.env.VISIBILITY_PERPLEXITY_CONCURRENCY) || 2)),
    // Gemini/ChatGPT: lower VISIBILITY_GEMINI_CONCURRENCY if Infatica returns 429 under load.
    gemini: Math.min(4, Math.max(1, Number(process.env.VISIBILITY_GEMINI_CONCURRENCY) || 3)),
    chatgpt: Math.min(4, Math.max(1, Number(process.env.VISIBILITY_CHATGPT_CONCURRENCY) || 3)),
    googleAI: 3,
};

const HARD_TIMEOUT_MS = Math.max(60_000, Number(process.env.VISIBILITY_ENGINE_HARD_TIMEOUT_MS) || 200_000);

function sleep(ms) {
    return ms > 0 ? new Promise(r => setTimeout(r, ms)) : Promise.resolve();
}

function withHardTimeout(promise, ms, label) {
    let timer;
    const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}: hard timeout ${ms / 1000}s`)), ms);
    });
    return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

function queryFn(engine) {
    if (engine === 'perplexity') return queryPerplexity;
    if (engine === 'gemini') return queryGemini;
    if (engine === 'chatgpt') return queryInfaticaChatGPT;
    if (engine === 'googleAI') return queryGoogleAI;
    return queryGemini;
}

function emptyRun(engine, prompt) {
    return {
        promptId: prompt.id,
        query: prompt.core,
        engine,
        promptWeight: prompt.weight ?? 1.0,
        category: prompt.category,
        intent: prompt.intent,
        strategicValue: prompt.strategicValue ?? 10,
        includesBrand: prompt.includesBrand ?? false,
        brandMentioned: false,
        brandEntity: null,
        entities: [],
        citations: [],
        citationStats: { total: 0, byCategory: {}, brandCited: false, competitorsCited: [] },
        textLength: 0,
        rawText: null,
    };
}

/**
 * Single engine × single prompt. Never throws — returns { run, success }.
 */
async function callOne(engine, prompt, brandName, domain, competitors, country, language, tag) {
    const fn = queryFn(engine);
    const t0 = Date.now();
    try {
        const infResult = await withHardTimeout(
            fn(prompt.core, country, language),
            HARD_TIMEOUT_MS,
            `${tag}[${engine}]`,
        );
        const elapsed = Date.now() - t0;
        const hasText = infResult && typeof infResult.text === 'string' && infResult.text.trim().length > 0;
        const hasHtml = infResult && typeof infResult.html === 'string' && infResult.html.trim().length > 0;
        const hasSources = infResult && Array.isArray(infResult.sources) && infResult.sources.length > 0;

        if (!hasText && !hasHtml && !hasSources) {
            console.warn(`[${engine}] ${tag} empty after ${elapsed}ms (text=${!!infResult?.text} html=${!!infResult?.html} sources=${infResult?.sources?.length || 0})`);
            const run = emptyRun(engine, prompt);
            run._errorReason = 'empty_response';
            return { run, success: false };
        }

        const parsed = parseResponse(infResult, brandName, domain, competitors, engine);
        const gotData = (parsed.textLength > 0) || ((parsed.rawText || '').trim().length > 0) || (parsed.citations?.length > 0);
        console.log(`[${engine}] ${tag} ${gotData ? '✓' : '⚠'} ${elapsed}ms text=${parsed.textLength} rawText=${(parsed.rawText || '').length} cit=${parsed.citations?.length || 0}`);
        return {
            run: {
                promptId: prompt.id, query: prompt.core, engine,
                promptWeight: prompt.weight ?? 1.0, category: prompt.category,
                intent: prompt.intent, strategicValue: prompt.strategicValue ?? 10,
                includesBrand: prompt.includesBrand ?? false,
                ...parsed,
            },
            success: gotData,
        };
    } catch (err) {
        const elapsed = Date.now() - t0;
        const reason = err.message || 'unknown';
        console.warn(`[${engine}] ${tag} ✗ ${elapsed}ms — ${reason}`);
        const run = emptyRun(engine, prompt);
        run._errorReason = reason;
        return { run, success: false };
    }
}

/**
 * Worker-pool pipeline for a single engine.
 * N workers pull from a shared prompt index. Each worker processes one prompt at a time.
 */
async function runPipeline(engine, prompts, concurrency, ctx, onCallDone) {
    let nextIdx = 0;
    const results = new Array(prompts.length);
    const { brandName, domain, competitors, country, language } = ctx;

    async function worker(workerId) {
        while (nextIdx < prompts.length) {
            const idx = nextIdx++;
            const prompt = prompts[idx];
            const tag = `P${idx + 1}/${prompts.length} w${workerId}`;
            const { run, success } = await callOne(
                engine, prompt, brandName, domain, competitors, country, language, tag,
            );
            results[idx] = run;
            onCallDone(run, success, engine, idx);
        }
    }

    const numWorkers = Math.min(concurrency, prompts.length);
    const workers = [];
    for (let w = 0; w < numWorkers; w++) {
        workers.push(worker(w));
    }
    await Promise.all(workers);
    return results;
}

function runHasData(r) {
    return (r.textLength > 0)
        || ((r.rawText || '').trim().length > 0)
        || (Array.isArray(r.citations) && r.citations.length > 0);
}

export function buildPlatformResults(allRuns, prompts, brandName, competitors, domain) {
    const platformResults = {};
    for (const engine of ENGINES) {
        const engineRuns = allRuns.filter(r => r.engine === engine);
        const dataRuns = engineRuns.filter(runHasData);
        platformResults[engine] = {
            engine,
            platformName: PLATFORM_NAMES[engine],
            allRuns: engineRuns,
            score: computeVisibilityScore(dataRuns, brandName),
            shareOfVoice: computeShareOfVoice(dataRuns, brandName, competitors, domain),
            perCategory: computePerCategory(dataRuns),
            sentiment: computeSentimentBreakdown(dataRuns),
            sourceDomains: computeSourceDomains(dataRuns),
            industryRanking: computeIndustryPresenceRanking(dataRuns, brandName),
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
 * Main entry point.
 *
 * Runs 4 engine pipelines fully in parallel. Each pipeline independently processes
 * all prompts with its own concurrency level.
 */
export async function runAllAgentsInParallel(agentConfig, onAgentProgress, onEarlyResults) {
    const { brandName, domain, industry, competitors, location, country, language, trackingLocations } = agentConfig;

    let prompts;
    try {
        prompts = await generatePromptMatrixForPlatform(
            { brandName, domain, industry, competitors, location, language, trackingLocations }, 'general',
        );
    } catch (err) {
        console.warn('[Agents] Prompt generation failed, using fallback:', err.message);
        prompts = generateFallbackPrompts({
            brandName,
            domain,
            industry,
            competitors,
            location,
            trackingLocations,
        });
    }

    const totalCalls = prompts.length * ENGINES.length;
    /** First dashboard snapshot after this many engine×prompt calls finish (default 50%; override VISIBILITY_EARLY_PERCENT=40–90). */
    const earlyPercent = Math.min(95, Math.max(40, Number(process.env.VISIBILITY_EARLY_PERCENT) || 50));
    const earlyCallThreshold = Math.max(1, Math.ceil(totalCalls * (earlyPercent / 100)));
    let completedCalls = 0;
    let successCalls = 0;
    let earlyFired = false;
    const allRuns = [];

    console.log(`[Agents] ═══ START: ${prompts.length} prompts × ${ENGINES.length} engines = ${totalCalls} calls ═══`);
    console.log(`[Agents] Early results after ${earlyCallThreshold}/${totalCalls} calls (${earlyPercent}%), then refine to full matrix`);
    console.log(`[Agents] Pipelines: Perplexity(×${PIPELINE_CONCURRENCY.perplexity}), Gemini(×${PIPELINE_CONCURRENCY.gemini}), ChatGPT(×${PIPELINE_CONCURRENCY.chatgpt}), GoogleAI(×${PIPELINE_CONCURRENCY.googleAI})`);
    console.log(`[Agents] Hard timeout per engine call: ${HARD_TIMEOUT_MS / 1000}s`);

    const scanStart = Date.now();

    const onCallDone = (run, success, engine, promptIdx) => {
        allRuns.push(run);
        completedCalls++;
        if (success) successCalls++;

        if (onAgentProgress) {
            onAgentProgress({ completed: completedCalls, total: totalCalls, successful: successCalls });
        }

        if (!earlyFired && completedCalls >= earlyCallThreshold && onEarlyResults) {
            earlyFired = true;
            const snapshot = [...allRuns];
            onEarlyResults(snapshot, prompts, {
                completedCallsAtEarly: completedCalls,
                totalCalls,
                percentThreshold: earlyPercent,
                totalPrompts: prompts.length,
            }).catch((e) =>
                console.warn('[Agents] Early results callback error:', e.message),
            );
        }
    };

    const [perplexityRuns, geminiRuns, chatgptRuns, googleRuns] = await Promise.all([
        runPipeline('perplexity', prompts, PIPELINE_CONCURRENCY.perplexity,
            { brandName, domain, competitors, country, language }, onCallDone),
        runPipeline('gemini', prompts, PIPELINE_CONCURRENCY.gemini,
            { brandName, domain, competitors, country, language }, onCallDone),
        runPipeline('chatgpt', prompts, PIPELINE_CONCURRENCY.chatgpt,
            { brandName, domain, competitors, country, language }, onCallDone),
        runPipeline('googleAI', prompts, PIPELINE_CONCURRENCY.googleAI,
            { brandName, domain, competitors, country, language }, onCallDone),
    ]);

    const elapsed = ((Date.now() - scanStart) / 1000).toFixed(1);

    const mergedRuns = [...perplexityRuns, ...geminiRuns, ...chatgptRuns, ...googleRuns];

    // Infatica calls are done — UI otherwise looked "stuck" with no new progress until final save.
    if (onAgentProgress) {
        await Promise.resolve(
            onAgentProgress({
                completed: totalCalls,
                total: totalCalls,
                successful: successCalls,
                phase: 'gemini_sentiment',
                detail: 'Engine calls finished. Scoring brand sentiment with Gemini (per prompt)...',
                force: true,
            }),
        );
    }

    try {
        await batchApplyGeminiSentimentByPrompt(mergedRuns, brandName);
    } catch (sentErr) {
        console.error('[Agents] Gemini sentiment batch failed — continuing with unscored runs:', sentErr.message);
    }
    const platformResults = buildPlatformResults(mergedRuns, prompts, brandName, competitors, domain);

    const stats = {};
    for (const engine of ENGINES) {
        const engineRuns = mergedRuns.filter(r => r.engine === engine);
        const dataRuns = engineRuns.filter(runHasData);
        stats[engine] = { ok: dataRuns.length, fail: engineRuns.length - dataRuns.length };
    }

    console.log(`[Agents] ═══ DONE in ${elapsed}s: ${successCalls}/${totalCalls} with data ═══`);
    for (const [eng, s] of Object.entries(stats)) {
        console.log(`  ${eng}: ${s.ok} ok, ${s.fail} empty/fail`);
    }

    return { platformResults, allRuns: mergedRuns, errors: [] };
}
