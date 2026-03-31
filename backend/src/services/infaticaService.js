/**
 * Infatica Service — retry logic + speed-optimised for 3-4 min total scans.
 *
 * Key design:
 * - Retry once on 500/502/503/504 with short backoff
 * - 35s timeout per attempt (enough for Gemini/SERP, avoids long hangs)
 * - Queries up to 2000 chars (compressed Super-20 prompts fit comfortably)
 * - No `nocache` flag (cached = faster)
 */

const INFATICA_BASE = 'https://scrape.infatica.io';
const MAX_QUERY_LEN = 2000;
const MAX_RETRIES = 1;
const RETRY_DELAYS = [2000];
const ATTEMPT_TIMEOUT = 35_000;

function getApiKey() {
    const key = process.env.INFATICA_API_KEY;
    if (!key) throw new Error('INFATICA_API_KEY is not configured');
    return key;
}

function truncateQuery(query) {
    if (query.length <= MAX_QUERY_LEN) return query;
    return query.substring(0, MAX_QUERY_LEN).replace(/\s+\S*$/, '');
}

/** Infatica rejects lowercase ISO-2 (e.g. "us"); uppercase and trim. */
function countryPayload(country) {
    if (country == null) return {};
    const s = String(country).trim();
    if (!s) return {};
    if (s.length === 2) return { country: s.toUpperCase() };
    return { country: s };
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
        const res = await fetch(url, { ...opts, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

function isRetryable(status) {
    return status === 500 || status === 502 || status === 503 || status === 504 || status === 429;
}

async function infaticaFetch(url, opts, label) {
    let lastErr = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            const delay = RETRY_DELAYS[attempt - 1] || 2000;
            console.log(`  [${label}] Retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
            await sleep(delay);
        }
        try {
            const res = await fetchWithTimeout(url, opts, ATTEMPT_TIMEOUT);
            if (res.ok) return res;
            const errBody = await res.text().catch(() => '');
            if (isRetryable(res.status) && attempt < MAX_RETRIES) {
                console.warn(`  [${label}] HTTP ${res.status} (retryable): ${errBody.substring(0, 80)}`);
                lastErr = new Error(`${label} HTTP ${res.status}`);
                continue;
            }
            throw new Error(`${label} HTTP ${res.status}: ${errBody.substring(0, 100)}`);
        } catch (err) {
            if (err.name === 'AbortError') {
                lastErr = new Error(`${label} timeout (${ATTEMPT_TIMEOUT / 1000}s)`);
                if (attempt < MAX_RETRIES) {
                    console.warn(`  [${label}] Timeout on attempt ${attempt + 1}, will retry...`);
                    continue;
                }
            }
            if (attempt >= MAX_RETRIES) throw lastErr || err;
            lastErr = err;
        }
    }
    throw lastErr || new Error(`${label} failed after ${MAX_RETRIES + 1} attempts`);
}

async function extractResponse(res, label) {
    const raw = await res.text();
    let json = null;
    try { json = JSON.parse(raw); } catch { /* not JSON */ }

    if (json && typeof json === 'object') {
        if (json.data && typeof json.data === 'object') json = { ...json, ...json.data };

        const text =
            (typeof json.answer === 'string' ? json.answer : null) ??
            (typeof json.text === 'string' ? json.text : null) ??
            (typeof json.content === 'string' ? json.content : null) ??
            (typeof json.response === 'string' ? json.response : null) ??
            (typeof json.result === 'string' ? json.result : null) ??
            (typeof json.output === 'string' ? json.output : null) ??
            (typeof json.message === 'string' ? json.message : null) ??
            (typeof json.body === 'string' ? json.body : null) ??
            (typeof json.generated_text === 'string' ? json.generated_text : null);

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
            console.log(`    ✓ [${label}] Structured text (${text.length} chars, ${sources.length} sources)`);
            return { text: text.trim(), sources, html: null };
        }

        if (json.html && typeof json.html === 'string') {
            const decoded = tryBase64Decode(json.html) ?? json.html;
            console.log(`    ✓ [${label}] HTML from JSON (${decoded.length} chars)`);
            return { text: null, sources, html: decoded };
        }
    }

    if (raw && raw.trim() && raw.length > 50) {
        if (raw.includes('<html') || raw.includes('<body') || raw.includes('<div')) {
            console.log(`    ✓ [${label}] Raw HTML (${raw.length} chars)`);
            return { text: null, sources: [], html: raw };
        }
        console.log(`    ✓ [${label}] Raw text (${raw.length} chars)`);
        return { text: raw.trim(), sources: [], html: null };
    }

    console.warn(`    ✗ [${label}] Empty response`);
    return { text: null, sources: [], html: null };
}

export async function queryPerplexity(query, country) {
    const q = truncateQuery(query);
    const label = 'Perplexity';
    console.log(`  [${label}] "${q.substring(0, 70)}..."`);
    const res = await infaticaFetch(`${INFATICA_BASE}/perplexity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ query: q, ...countryPayload(country) }),
    }, label);
    return await extractResponse(res, label);
}

export async function queryGemini(query, country) {
    const q = truncateQuery(query);
    const label = 'Gemini';
    console.log(`  [${label}] "${q.substring(0, 70)}..."`);
    const res = await infaticaFetch(`${INFATICA_BASE}/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ query: q, ...countryPayload(country) }),
    }, label);
    return await extractResponse(res, label);
}

export async function queryGoogleAI(query, country) {
    const q = truncateQuery(query);
    const label = 'Google AI';
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    console.log(`  [${label}] "${q.substring(0, 70)}..."`);
    const res = await infaticaFetch(`${INFATICA_BASE}/serp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ url, mode: 'render', results: 10, ...countryPayload(country) }),
    }, label);
    return await extractResponse(res, label);
}
