/**
 * Live Infatica 60-call benchmark.
 *
 * Runs 20 prompts × 3 engines using the same dedicated-pipeline architecture
 * as the production scan. Reports wall-clock time, per-engine stats, and
 * individual call timings.
 *
 * Usage:  node scripts/test-infatica-60.mjs   (from backend/)
 * Requires INFATICA_API_KEY in .env or environment.
 */

import 'dotenv/config';
import { queryPerplexity, queryGemini, queryGoogleAI } from '../src/services/infaticaService.js';

const ENGINES = [
    { key: 'perplexity', fn: queryPerplexity, concurrency: 2 },
    { key: 'gemini',     fn: queryGemini,     concurrency: 3 },
    { key: 'googleSERP', fn: queryGoogleAI,   concurrency: 3 },
];

const PROMPTS = [
    'What are the best AI visibility tools for brands in 2025?',
    'How does AI-powered SEO compare to traditional SEO?',
    'Which companies offer competitive intelligence for AI search?',
    'What is share of voice in AI-generated search results?',
    'How do brands measure their visibility on Perplexity and Gemini?',
    'What are the top SaaS tools for monitoring brand mentions in AI answers?',
    'How does brand sentiment analysis work in AI overviews?',
    'What is the future of search engine optimization with AI?',
    'Which AI platforms provide the most accurate product recommendations?',
    'How do e-commerce brands improve their AI search rankings?',
    'What are the key metrics for AI brand visibility?',
    'How does citation analysis work in AI-generated content?',
    'What tools help track competitor mentions in AI search?',
    'How important is entity recognition for AI visibility?',
    'What strategies improve brand presence in Google AI Overviews?',
    'How do digital marketing agencies use AI visibility data?',
    'What is prompt engineering for brand monitoring?',
    'How do AI assistants decide which brands to recommend?',
    'What are the differences between Perplexity, Gemini, and ChatGPT for brand discovery?',
    'How can startups improve their visibility in AI-powered search engines?',
];

const HARD_TIMEOUT = 100_000;

function withTimeout(promise, ms, label) {
    let timer;
    const deadline = new Promise((_, rej) => {
        timer = setTimeout(() => rej(new Error(`${label}: hard timeout ${ms / 1000}s`)), ms);
    });
    return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

async function runPipeline(engine) {
    const { key, fn, concurrency } = engine;
    let nextIdx = 0;
    const results = [];

    async function worker(wid) {
        while (nextIdx < PROMPTS.length) {
            const idx = nextIdx++;
            const prompt = PROMPTS[idx];
            const t0 = Date.now();
            let ok = false;
            let reason = '';
            try {
                const res = await withTimeout(fn(prompt, '', ''), HARD_TIMEOUT, `${key}:P${idx + 1}`);
                const hasText = res && (res.text || res.html);
                const hasSrc = res && Array.isArray(res.sources) && res.sources.length > 0;
                ok = !!(hasText || hasSrc);
                if (!ok) reason = 'empty_response';
            } catch (err) {
                reason = err.message || 'unknown';
            }
            const elapsed = Date.now() - t0;
            results.push({ idx, key, ok, elapsed, reason });
            const status = ok ? '✓' : '✗';
            console.log(`  [${key}] P${String(idx + 1).padStart(2)} ${status} ${elapsed}ms${reason ? ' — ' + reason.substring(0, 60) : ''}`);
        }
    }

    const workers = [];
    for (let w = 0; w < Math.min(concurrency, PROMPTS.length); w++) {
        workers.push(worker(w));
    }
    await Promise.all(workers);
    return results;
}

async function main() {
    if (!process.env.INFATICA_API_KEY) {
        console.error('ERROR: INFATICA_API_KEY not set. Put it in .env or export it.');
        process.exit(1);
    }

    const totalCalls = PROMPTS.length * ENGINES.length;
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  INFATICA 60-CALL BENCHMARK`);
    console.log(`  ${PROMPTS.length} prompts × ${ENGINES.length} engines = ${totalCalls} calls`);
    console.log(`  Pipelines: ${ENGINES.map(e => `${e.key}(×${e.concurrency})`).join(', ')}`);
    console.log(`  Timeout: 45s per attempt, 1 retry, ${HARD_TIMEOUT / 1000}s hard cap`);
    console.log(`${'═'.repeat(60)}\n`);

    const t0 = Date.now();

    const allResults = await Promise.all(ENGINES.map(e => runPipeline(e)));
    const flat = allResults.flat();

    const wallClock = ((Date.now() - t0) / 1000).toFixed(1);

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  RESULTS — ${wallClock}s wall clock`);
    console.log(`${'═'.repeat(60)}\n`);

    for (const engine of ENGINES) {
        const rows = flat.filter(r => r.key === engine.key);
        const okCount = rows.filter(r => r.ok).length;
        const failCount = rows.length - okCount;
        const times = rows.map(r => r.elapsed);
        const avg = (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1);
        const min = (Math.min(...times) / 1000).toFixed(1);
        const max = (Math.max(...times) / 1000).toFixed(1);
        const median = (times.sort((a, b) => a - b)[Math.floor(times.length / 2)] / 1000).toFixed(1);

        console.log(`  ${engine.key.toUpperCase()}`);
        console.log(`    Success: ${okCount}/${rows.length}  |  Failed: ${failCount}`);
        console.log(`    Timing:  avg=${avg}s  median=${median}s  min=${min}s  max=${max}s`);

        if (failCount > 0) {
            const fails = rows.filter(r => !r.ok);
            const reasons = {};
            for (const f of fails) {
                const r = f.reason || 'unknown';
                reasons[r] = (reasons[r] || 0) + 1;
            }
            console.log(`    Failures:`);
            for (const [reason, count] of Object.entries(reasons)) {
                console.log(`      ${count}× ${reason}`);
            }
        }
        console.log();
    }

    const totalOk = flat.filter(r => r.ok).length;
    const totalFail = flat.length - totalOk;
    console.log(`  TOTAL: ${totalOk}/${flat.length} succeeded, ${totalFail} failed`);
    console.log(`  Wall clock: ${wallClock}s`);
    console.log(`${'═'.repeat(60)}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
