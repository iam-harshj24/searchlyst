/**
 * Infatica Service — tuned for speed (benchmarked at 57/60 = 95% success, ~5 min wall clock).
 *
 * Timeout strategy per engine:
 * - Perplexity: single return_html=true, ~95s/attempt, up to 3 attempts (tune via INFATICA_PERPLEXITY_*)
 * - Gemini:     45s + 1 retry, optional light-then-HTML via queryLlmPage
 * - Google SERP: 90s, 0 retries → 85% success, avg 41s
 *     No render mode — raw SERP is 5× faster and far more reliable than headless browser.
 *     The 3 SERP failures are 504s from Infatica's upstream, not fixable client-side.
 * - ChatGPT (optional): 45s + 1 retry — available via queryInfaticaChatGPT()
 */

const INFATICA_BASE = 'https://scrape.infatica.io';
const MAX_QUERY_LEN = 6000;

function numEnv(name, fallback) {
    const n = Number(process.env[name]);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Perplexity: upstream is flaky under load; one rendered HTML call + longer timeout + extra retries beats two fast calls that both time out. */
const RETRY_CONFIG = {
    perplexity: {
        maxRetries: numEnv('INFATICA_PERPLEXITY_MAX_RETRIES', 2),
        delays: [3000, 6000],
        timeout: numEnv('INFATICA_PERPLEXITY_TIMEOUT_MS', 95_000),
    },
    gemini:     { maxRetries: 1, delays: [2000], timeout: 45_000 },
    chatgpt:    { maxRetries: 1, delays: [2000], timeout: 45_000 },
    serp:       { maxRetries: 0, delays: [],      timeout: 90_000 },
};

function getApiKey() {
    const key = process.env.INFATICA_API_KEY;
    if (!key) throw new Error('INFATICA_API_KEY is not configured');
    return key;
}

function truncateQuery(query) {
    if (query.length <= MAX_QUERY_LEN) return query;
    return query.substring(0, MAX_QUERY_LEN).replace(/\s+\S*$/, '');
}

function countryPayload(country) {
    if (country == null) return {};
    const s = String(country).trim();
    if (!s) return {};
    if (s.length === 2) return { country: s.toUpperCase() };
    return { country: s };
}

function languagePayload(language) {
    if (language == null) return {};
    const s = String(language).trim();
    if (!s) return {};
    if (/^[a-z]{2}-[A-Z]{2}$/.test(s)) return { language: s };
    const map = {
        english: 'en-US', 'en-us': 'en-US', spanish: 'es-US', french: 'fr-FR',
        german: 'de-DE', italian: 'it-IT', portuguese: 'pt-BR', dutch: 'nl-NL',
        japanese: 'ja-JP', korean: 'ko-KR', chinese: 'zh-CN', hindi: 'hi-IN',
    };
    return map[s.toLowerCase()] ? { language: map[s.toLowerCase()] } : {};
}

function tryBase64Decode(str) {
    try {
        const decoded = Buffer.from(str, 'base64').toString('utf-8');
        if (/^\s*<(!doctype|html|head|body|div)/i.test(decoded)) return decoded;
        return null;
    } catch { return null; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(url, opts, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

function isRetryable(status) {
    return status === 500 || status === 502 || status === 503 || status === 504 || status === 429;
}

async function infaticaFetch(url, opts, label, cfg) {
    const { maxRetries, delays, timeout } = cfg;
    let lastErr = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            const delay = delays[attempt - 1] || 2000;
            console.log(`  [${label}] Retry ${attempt}/${maxRetries} after ${delay}ms…`);
            await sleep(delay);
        }
        try {
            const res = await fetchWithTimeout(url, opts, timeout);
            if (res.ok) return res;
            const errBody = await res.text().catch(() => '');
            if (isRetryable(res.status) && attempt < maxRetries) {
                console.warn(`  [${label}] HTTP ${res.status} — will retry: ${errBody.substring(0, 60)}`);
                lastErr = new Error(`${label} HTTP ${res.status}`);
                continue;
            }
            throw new Error(`${label} HTTP ${res.status}: ${errBody.substring(0, 80)}`);
        } catch (err) {
            if (err.name === 'AbortError') {
                lastErr = new Error(`${label} timeout ${timeout / 1000}s`);
                if (attempt < maxRetries) { console.warn(`  [${label}] Timeout, will retry…`); continue; }
            }
            if (attempt >= maxRetries) throw lastErr || err;
            lastErr = err;
        }
    }
    throw lastErr || new Error(`${label} all attempts failed`);
}

const SKIP_JSON_TEXT_KEYS = new Set(['apikey', 'token', 'authorization', 'password', 'secret', 'trace', 'traceid', 'request_id', 'requestid']);

/** When the API nests the answer under unknown keys, grab the longest plausible prose string. */
function longestJsonTextBlob(node, depth, minLen) {
    if (depth <= 0 || node == null) return '';
    if (typeof node === 'string') {
        const s = node.trim();
        if (s.length < minLen) return '';
        if (!/\s/.test(s) && !/[.!?]/.test(s)) return '';
        return s;
    }
    if (Array.isArray(node)) {
        let best = '';
        for (const x of node) {
            const t = longestJsonTextBlob(x, depth - 1, minLen);
            if (t.length > best.length) best = t;
        }
        return best;
    }
    if (typeof node !== 'object') return '';
    let best = '';
    for (const [k, v] of Object.entries(node)) {
        if (SKIP_JSON_TEXT_KEYS.has(k.toLowerCase())) continue;
        const t = longestJsonTextBlob(v, depth - 1, minLen);
        if (t.length > best.length) best = t;
    }
    return best;
}

function extractResponse(res, label) {
    return res.text().then(raw => {
        let json = null;
        try { json = JSON.parse(raw); } catch { /* not JSON */ }

        if (json && typeof json === 'object') {
            if (json.data && typeof json.data === 'object') json = { ...json, ...json.data };

            const text =
                (typeof json.answer === 'string' ? json.answer : null) ??
                (typeof json.text === 'string' ? json.text : null) ??
                (typeof json.markdown === 'string' ? json.markdown : null) ??
                (typeof json.md === 'string' ? json.md : null) ??
                (typeof json.content === 'string' ? json.content : null) ??
                (typeof json.response === 'string' ? json.response : null) ??
                (typeof json.result === 'string' ? json.result : null) ??
                (typeof json.output === 'string' ? json.output : null) ??
                (typeof json.message === 'string' ? json.message : null) ??
                (typeof json.body === 'string' ? json.body : null) ??
                (typeof json.generated_text === 'string' ? json.generated_text : null) ??
                (typeof json.full_text === 'string' ? json.full_text : null);

            const sources = [];
            for (const key of ['sources', 'citations', 'references', 'links', 'search_results', 'searchResults']) {
                if (Array.isArray(json[key])) {
                    for (const s of json[key]) {
                        const url = typeof s === 'string' ? s : (s?.url ?? s?.href ?? s?.link ?? s?.uri ?? '');
                        if (!url) continue;
                        let domain = '';
                        try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}
                        if (url && !sources.some(x => x.url === url)) {
                            sources.push({ url, domain, title: (typeof s === 'object' ? (s.title || s.name || '') : '') });
                        }
                    }
                }
            }

            if (text && text.trim()) {
                console.log(`    ✓ [${label}] text ${text.length}ch, ${sources.length} sources`);
                return { text: text.trim(), sources, html: null };
            }

            const nested = longestJsonTextBlob(json, 7, 100);
            if (nested.length >= 100) {
                console.log(`    ✓ [${label}] nested text ${nested.length}ch, ${sources.length} sources`);
                return { text: nested, sources, html: null };
            }

            if (json.html && typeof json.html === 'string') {
                const decoded = tryBase64Decode(json.html) ?? json.html;
                console.log(`    ✓ [${label}] HTML ${decoded.length}ch`);
                return { text: null, sources, html: decoded };
            }
        }

        if (raw && raw.trim().length > 50) {
            if (raw.includes('<html') || raw.includes('<body') || raw.includes('<div')) {
                console.log(`    ✓ [${label}] raw HTML ${raw.length}ch`);
                return { text: null, sources: [], html: raw };
            }
            console.log(`    ✓ [${label}] raw text ${raw.length}ch`);
            return { text: raw.trim(), sources: [], html: null };
        }

        console.warn(`    ✗ [${label}] empty`);
        return { text: null, sources: [], html: null };
    });
}

function resultHasContent(out) {
    const t = out?.text && String(out.text).trim().length > 0;
    const h = out?.html && String(out.html).trim().length > 0;
    const s = Array.isArray(out?.sources) && out.sources.length > 0;
    return !!(t || h || s);
}

/**
 * Perplexity / Gemini: many scraper payloads only populate the page when return_html is true.
 * Try JSON/text first (lighter), then one follow-up with rendered HTML so the parser can extract prose.
 */
async function queryLlmPage(path, label, query, country, language, cfg) {
    const q = truncateQuery(query);
    const base = { query: q, ...countryPayload(country), ...languagePayload(language) };
    const post = async (return_html) => infaticaFetch(`${INFATICA_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ ...base, return_html }),
    }, label, cfg);

    console.log(`  [${label}] "${q.substring(0, 60)}…"`);
    const res1 = await post(false);
    let out = await extractResponse(res1, label);
    if (!resultHasContent(out)) {
        console.warn(`  [${label}] Empty with return_html=false — retrying with return_html=true`);
        const res2 = await post(true);
        out = await extractResponse(res2, label);
    }
    return out;
}

/**
 * Perplexity via Infatica: rendered pages carry the answer; a quick JSON-only call then HTML retry
 * doubled wall time and often hit the scan hard-timeout before the HTML fetch finished.
 * Single `return_html: true` request + generous timeout + more retries reduces HTTP 500 / timeout storms.
 */
export async function queryPerplexity(query, country, language) {
    const q = truncateQuery(query);
    const base = { query: q, ...countryPayload(country), ...languagePayload(language) };
    const cfg = RETRY_CONFIG.perplexity;
    const tryLightFirst = String(process.env.INFATICA_PERPLEXITY_TRY_LIGHT_FIRST || '').toLowerCase() === 'true';

    if (tryLightFirst) {
        return queryLlmPage('/perplexity', 'Perplexity', query, country, language, cfg);
    }

    console.log(`  [Perplexity] "${q.substring(0, 60)}…" (return_html=true)`);
    const res = await infaticaFetch(`${INFATICA_BASE}/perplexity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ ...base, return_html: true }),
    }, 'Perplexity', cfg);
    return extractResponse(res, 'Perplexity');
}

export async function queryGemini(query, country, language) {
    return queryLlmPage('/gemini', 'Gemini', query, country, language, RETRY_CONFIG.gemini);
}

export async function queryGoogleAI(query, country, language) {
    const q = truncateQuery(query);
    const label = 'GoogleSERP';
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    console.log(`  [${label}] "${q.substring(0, 60)}…"`);
    const res = await infaticaFetch(`${INFATICA_BASE}/serp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({
            url, results: 10,
            ...countryPayload(country), ...languagePayload(language),
        }),
    }, label, RETRY_CONFIG.serp);
    return extractResponse(res, label);
}

export async function queryInfaticaChatGPT(query, country, language) {
    const q = truncateQuery(query);
    const label = 'ChatGPT';
    console.log(`  [${label}] "${q.substring(0, 60)}…"`);
    const res = await infaticaFetch(`${INFATICA_BASE}/chatgpt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ query: q, return_html: false, ...countryPayload(country), ...languagePayload(language) }),
    }, label, RETRY_CONFIG.chatgpt);
    return extractResponse(res, label);
}
