/**
 * infaticaService.js
 *
 * Uses the Infatica AI Search multi-engine endpoint:
 * POST https://api.infatica.io/v1/ai-search/query
 *
 * Sends ONE query to ALL selected LLMs simultaneously and returns
 * per-engine structured responses { text, sources }.
 */

const INFATICA_AI_BASE = 'https://api.infatica.io/v1/ai-search/query';
// Keep the SERP base for Google AI Overviews (different endpoint)
const INFATICA_SERP_BASE = 'https://scrape.infatica.io';

const SUPPORTED_ENGINES = ['chatgpt', 'gemini', 'perplexity'];

function getApiKey() {
    const key = process.env.INFATICA_API_KEY;
    if (!key) throw new Error('INFATICA_API_KEY is not configured');
    return key;
}

/**
 * Parses a single engine's response object from the Infatica multi-engine API.
 * Returns { text, sources } — the same shape our responseParser.js expects.
 */
function parseEngineResult(engineResult) {
    if (!engineResult) return { text: null, sources: [] };

    // The Infatica AI Search API returns per-engine objects like:
    // { answer: "...", sources: [{url, title, domain},...] }
    const text =
        engineResult.answer ??
        engineResult.text ??
        engineResult.content ??
        engineResult.response ??
        engineResult.result ??
        null;

    const rawSources = engineResult.sources ?? engineResult.citations ?? engineResult.references ?? [];
    const sources = Array.isArray(rawSources)
        ? rawSources.map(s => {
            if (typeof s === 'string') {
                try { return { url: s, domain: new URL(s).hostname.replace('www.', ''), title: '' }; }
                catch { return null; }
            }
            if (s && typeof s === 'object') {
                const url = s.url ?? s.href ?? s.link ?? '';
                let domain = s.domain ?? s.hostname ?? '';
                if (!domain && url) {
                    try { domain = new URL(url).hostname.replace('www.', ''); } catch {}
                }
                return { url, domain, title: s.title ?? s.name ?? '' };
            }
            return null;
        }).filter(Boolean)
        : [];

    return { text: text?.trim() || null, sources };
}

/**
 * PRIMARY FUNCTION — Send a single query to multiple LLMs at once.
 *
 * @param {string} query          - The prompt text to send
 * @param {object} options
 * @param {string[]} options.engines - e.g. ['chatgpt','gemini','perplexity']
 * @param {string}   options.geo     - e.g. 'US', 'IN', 'GB'
 * @param {number}   options.timeoutMs - per-request timeout
 *
 * @returns {Promise<Object>} Per-engine map: { chatgpt: {text, sources}, gemini: {text, sources}, ... }
 */
export async function queryAllEngines(query, {
    engines = SUPPORTED_ENGINES,
    geo = 'US',
    timeoutMs = 90000,
} = {}) {
    console.log(`[Infatica] Multi-engine query to [${engines.join(', ')}]: "${query.substring(0, 80)}..."`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(INFATICA_AI_BASE, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                engines,
                options: {
                    include_sources: true,
                    include_consensus: false,
                    geo,
                },
            }),
            signal: controller.signal,
            cache: 'no-store',
        });

        clearTimeout(timeout);

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Infatica] Multi-engine API error ${res.status}:`, errText.substring(0, 300));
            throw new Error(`Infatica multi-engine query failed: ${res.status}`);
        }

        const json = await res.json();
        console.log(`[Infatica] Raw response keys:`, Object.keys(json));

        // The API can return results in different wrappers — handle all variants
        // Expected shape: { results: { chatgpt: {...}, gemini: {...}, perplexity: {...} } }
        // OR flat:        { chatgpt: {...}, gemini: {...}, perplexity: {...} }
        const rawResults = json.results ?? json.data ?? json;

        const engineResults = {};
        for (const eng of engines) {
            const raw = rawResults[eng] ?? null;
            engineResults[eng] = parseEngineResult(raw);
            const hasText = !!(engineResults[eng].text);
            console.log(`[Infatica/${eng}] ${hasText ? `✓ ${engineResults[eng].text.length} chars, ${engineResults[eng].sources.length} sources` : '⚠ No response'}`);
        }

        return engineResults;

    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.warn('[Infatica] Multi-engine query timed out');
        } else {
            console.error('[Infatica] Multi-engine query failed:', err.message);
        }
        // Return empty results for all engines so the scan continues
        const fallback = {};
        for (const eng of engines) {
            fallback[eng] = { text: null, sources: [] };
        }
        return fallback;
    }
}

/**
 * Query Google AI Overview via SERP scraping (separate endpoint, different format).
 * Returns { text, sources, html } to match the parseResponse contract.
 */
export async function queryGoogleAIOverview(query, country = '') {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    console.log(`[GoogleAI] SERP query: "${query.substring(0, 80)}..."`);

    try {
        const res = await fetch(`${INFATICA_SERP_BASE}/serp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey(),
            },
            body: JSON.stringify({
                url,
                mode: 'render',
                results: 10,
                nocache: true,
                ...(country && { country }),
            }),
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error('[GoogleAI] SERP error:', res.status);
            return { text: null, sources: [], html: null };
        }

        const raw = await res.text();
        let json = null;
        try { json = JSON.parse(raw); } catch {}

        if (json?.html) {
            return { text: null, sources: [], html: json.html };
        }
        if (json?.answer || json?.text) {
            return parseEngineResult(json);
        }
        if (raw?.trim()) {
            return { text: null, sources: [], html: raw };
        }

        return { text: null, sources: [], html: null };
    } catch (err) {
        console.warn('[GoogleAI] SERP query failed:', err.message);
        return { text: null, sources: [], html: null };
    }
}

// ── Legacy single-engine exports (kept for backward compatibility) ─────────────
export async function queryPerplexity(query) {
    const results = await queryAllEngines(query, { engines: ['perplexity'] });
    return results.perplexity;
}

export async function queryGemini(query) {
    const results = await queryAllEngines(query, { engines: ['gemini'] });
    return results.gemini;
}

export async function queryGoogleAI(query, country) {
    return queryGoogleAIOverview(query, country);
}
