/**
 * Infatica Service — tuned for speed (benchmark ~57/60 = 95% success, ~5 min wall clock).
 *
 * - Perplexity / Gemini / ChatGPT: try JSON/text first; retry with return_html when empty or non-prose; nested HTML + broad source keys.
 * - Google SERP: 90s — prefers JSON `html` for parsing; may retry with `return_html: true` when markup is thin.
 * - ChatGPT (optional): queryInfaticaChatGPT()
 */

import { isReadableAnswerText } from '../utils/readableText.js';

const INFATICA_BASE = 'https://scrape.infatica.io';
const MAX_QUERY_LEN = 6000;

/** Perplexity page renders are slower; 45s caused frequent AbortError + empty runs. Override via INFATICA_PERPLEXITY_TIMEOUT_MS. */
const PERPLEXITY_TIMEOUT_MS = Math.min(
    180_000,
    Math.max(50_000, Number(process.env.INFATICA_PERPLEXITY_TIMEOUT_MS) || 90_000),
);

/** Gemini/ChatGPT via Infatica often need the same headroom as Perplexity (45s produced frequent empty runs). */
const GEMINI_CHATGPT_TIMEOUT_MS = Math.min(
    180_000,
    Math.max(50_000, Number(process.env.INFATICA_GEMINI_TIMEOUT_MS) || 90_000),
);
const CHATGPT_INFATICA_TIMEOUT_MS = Math.min(
    180_000,
    Math.max(50_000, Number(process.env.INFATICA_CHATGPT_TIMEOUT_MS) || GEMINI_CHATGPT_TIMEOUT_MS),
);

const RETRY_CONFIG = {
    // Extra HTTP retries + longer waits — Perplexity/Infatica often returns 429 or slow responses under concurrent scans.
    perplexity: {
        maxRetries: Math.min(4, Math.max(1, Number(process.env.INFATICA_PERPLEXITY_HTTP_RETRIES) || 2)),
        delays: [3500, 6000, 10_000],
        timeout: PERPLEXITY_TIMEOUT_MS,
    },
    gemini: {
        maxRetries: Math.min(4, Math.max(1, Number(process.env.INFATICA_GEMINI_HTTP_RETRIES) || 2)),
        delays: [3000, 5500, 10_000],
        timeout: GEMINI_CHATGPT_TIMEOUT_MS,
    },
    chatgpt: {
        maxRetries: Math.min(4, Math.max(1, Number(process.env.INFATICA_CHATGPT_HTTP_RETRIES) || 2)),
        delays: [3000, 5500, 10_000],
        timeout: CHATGPT_INFATICA_TIMEOUT_MS,
    },
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
    const s = String(country).trim().toUpperCase();
    if (!s) return {};
    // Infatica expects ISO 3166-1 alpha-2; free-text (e.g. "Dubai") can cause failed scrapes.
    if (/^[A-Z]{2}$/.test(s)) return { country: s };
    return {};
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
    return status === 500 || status === 502 || status === 503 || status === 504 || status === 429 || status === 408;
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

/** Normalize URL strings from Infatica / model JSON (protocol-relative, trim). */
function normalizeSourceUrl(raw) {
    if (raw == null || typeof raw !== 'string') return '';
    let u = raw.trim().replace(/\s+/g, '');
    if (!u) return '';
    if (u.startsWith('//')) u = `https:${u}`;
    if (!/^https?:\/\//i.test(u)) return '';
    try {
        const parsed = new URL(u);
        if (!parsed.hostname) return '';
        // Strip hash fragments for better deduplication
        const clean = `${parsed.origin}${parsed.pathname}${parsed.search}`;
        return clean.replace(/\/$/, '') || parsed.href;
    } catch {
        return '';
    }
}

/** Check if URL is a tracking/analytics redirect or contains ad parameters. */
function isTrackingOrAdUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    // Tracking patterns
    const trackingPatterns = [
        '/track?', '/click?', '/redirect?', '/goto?', '/out?', '/link?',
        'utm_', 'fbclid=', 'gclid=', 'msclkid=', '_ga=', 'mc_cid=', 'mc_eid=',
    ];
    if (trackingPatterns.some(p => lower.includes(p))) return true;
    
    // Google ad URLs
    if (lower.includes('/aclk?') || lower.includes('/adurl?')) return true;
    
    // Ad/analytics domains
    const adDomains = [
        'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
        'googletagmanager.com', 'googletagservices.com', 'google-analytics.com',
        'analytics.google.com', 'adclick.', 'ad.doubleclick.', 'adservice.',
    ];
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        if (adDomains.some(ad => hostname.includes(ad))) return true;
    } catch { /* ignore */ }
    
    return false;
}

/** Unwrap google.com/url and relative /url?q=… redirects from SERP JSON. */
function expandGoogleRedirectUrl(raw) {
    if (raw == null || typeof raw !== 'string') return '';
    const decodeQ = (q) => {
        if (!q || typeof q !== 'string' || !q.startsWith('http')) return '';
        try {
            return decodeURIComponent(q.replace(/\+/g, ' '));
        } catch {
            return q;
        }
    };
    let t = raw.trim();
    if (t.startsWith('//')) t = `https:${t}`;
    if (/^https?:\/\//i.test(t)) {
        try {
            const u = new URL(t);
            if (u.hostname.includes('google.') && /\/url\b/i.test(u.pathname)) {
                const out = decodeQ(u.searchParams.get('q') || u.searchParams.get('url') || u.searchParams.get('adurl'));
                if (out) return normalizeSourceUrl(out);
            }
        } catch { /* keep */ }
        return normalizeSourceUrl(t);
    }
    if (t.startsWith('/url')) {
        try {
            const q = t.includes('?') ? t.slice(t.indexOf('?') + 1) : '';
            const sp = new URLSearchParams(q);
            const out = decodeQ(sp.get('q') || sp.get('url') || sp.get('adurl'));
            if (out) return normalizeSourceUrl(out);
        } catch { /* keep */ }
    }
    return '';
}

/**
 * ChatGPT / OpenAI UIs and JSON often wrap the real source in a chatgpt.com or openai.com redirect.
 * Without unwrapping, citations look like "openai" instead of the publisher URL.
 */
function unwrapOpenAiChatRedirectUrl(raw) {
    if (raw == null || typeof raw !== 'string') return '';
    let t = raw.trim();
    if (t.startsWith('//')) t = `https:${t}`;
    if (!/^https?:\/\//i.test(t)) return '';
    try {
        const u = new URL(t);
        const host = u.hostname.toLowerCase();
        if (!host.endsWith('openai.com') && !host.endsWith('chatgpt.com')) return '';
        for (const key of ['url', 'q', 'u', 'destination', 'to', 'target', 'link', 'src']) {
            const inner = u.searchParams.get(key);
            if (!inner) continue;
            let dec = inner;
            try {
                dec = decodeURIComponent(inner.replace(/\+/g, ' '));
            } catch { /* keep inner */ }
            if (/^https?:\/\//i.test(dec)) {
                const n = normalizeSourceUrl(dec);
                if (n) return n;
            }
        }
    } catch {
        return '';
    }
    return '';
}

/** Normalize a citation URL from JSON (Google redirects + OpenAI chat wrappers). */
function chainUnwrapCitationUrl(s) {
    if (!s || typeof s !== 'string') return '';
    let u = expandGoogleRedirectUrl(s);
    if (!u) u = normalizeSourceUrl(s);
    if (!u) return '';
    const inner = unwrapOpenAiChatRedirectUrl(u);
    return inner || u;
}

/** Pull a citation/source URL from a string or object (Infatica and scrapers vary widely). */
function urlFromSourceEntry(entry) {
    if (typeof entry === 'string') return chainUnwrapCitationUrl(entry);
    if (!entry || typeof entry !== 'object') return '';
    if (entry.url_citation && typeof entry.url_citation === 'object' && typeof entry.url_citation.url === 'string') {
        const n = chainUnwrapCitationUrl(entry.url_citation.url);
        if (n) return n;
    }
    const direct =
        entry.url ??
        entry.href ??
        entry.link ??
        entry.uri ??
        entry.document_url ??
        entry.page_url ??
        entry.canonical_url;
    if (typeof direct === 'string') {
        const n = chainUnwrapCitationUrl(direct);
        if (n) return n;
    }
    const src = entry.source;
    if (typeof src === 'string' && src.trim()) {
        return chainUnwrapCitationUrl(src);
    }
    if (entry.metadata && typeof entry.metadata === 'object' && typeof entry.metadata.url === 'string') {
        return chainUnwrapCitationUrl(entry.metadata.url);
    }
    return '';
}

function titleFromSourceEntry(entry) {
    if (!entry || typeof entry !== 'object') return '';
    const t = entry.title ?? entry.name ?? entry.snippet ?? entry.description ?? entry.text_headline ?? '';
    const raw = typeof t === 'string' ? t.trim().slice(0, 500) : '';
    // Strip sponsored/promoted prefixes and suffixes
    return raw
        .replace(/^(sponsored|promoted|ad|advertisement)\s*[:\-·•]?\s*/i, '')
        .replace(/\s*[\-·•]\s*(sponsored|promoted|ad)\s*$/i, '')
        .replace(/\s*\|\s*(sponsored|promoted|advertisement)\s*$/i, '')
        .trim();
}

const SOURCE_ARRAY_KEYS = [
    'sources', 'citations', 'references', 'links', 'search_results', 'searchResults',
    'web_results', 'web_search_results', 'organic', 'organic_results', 'organicResults',
    'items', 'documents', 'chunks', 'footnotes', 'source_list', 'urls', 'results',
    'serp_results', 'annotations', 'citation_sources', 'used_sources', 'source_urls',
    'search_results_web', 'related_links', 'supporting_documents',
    /** OpenAI / ChatGPT-style response metadata */
    'content_references', 'tool_results', 'url_citation_results',
];

/** Recurse into common LLM / Perplexity JSON nests that hold citations. */
const SOURCE_NEST_ARRAY_KEYS = [
    'steps', 'messages', 'conversation', 'turns', 'history', 'blocks', 'content_blocks',
    'segments', 'parts', 'citations_detail',
];

/**
 * Collect unique { url, domain, title } from Infatica JSON (top-level and common nests).
 * Handles array citations, string URLs, and citation maps { "1": { url } }.
 */
function collectSourcesFromJson(obj) {
    const out = [];
    const seen = new Set();

    const pushUrl = (url, title = '') => {
        if (typeof url !== 'string' || !url.trim()) return;
        const u = chainUnwrapCitationUrl(url);
        if (!u || seen.has(u)) return;
        // Filter out tracking URLs and ad networks
        if (isTrackingOrAdUrl(u)) {
            console.warn(`[Sources] Skipping tracking/ad URL: ${u.slice(0, 60)}`);
            return;
        }
        let domain = '';
        try {
            domain = new URL(u).hostname.replace(/^www\./, '');
        } catch {
            return;
        }
        seen.add(u);
        out.push({ url: u, domain, title: String(title || '').slice(0, 500) });
    };

    const drainArray = (arr) => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) {
            if (typeof item === 'string') {
                pushUrl(item, '');
                continue;
            }
            const u = urlFromSourceEntry(item);
            if (u) pushUrl(u, titleFromSourceEntry(item));
        }
    };

    const drainCitationRecord = (rec) => {
        if (!rec || typeof rec !== 'object') return;
        if (Array.isArray(rec)) {
            drainArray(rec);
            return;
        }
        for (const v of Object.values(rec)) {
            if (typeof v === 'string') pushUrl(v, '');
            else if (v && typeof v === 'object') {
                const u = urlFromSourceEntry(v);
                if (u) pushUrl(u, titleFromSourceEntry(v));
            }
        }
    };

    const scan = (node) => {
        if (!node || typeof node !== 'object') return;
        for (const key of SOURCE_ARRAY_KEYS) {
            if (!Array.isArray(node[key])) continue;
            drainArray(node[key]);
        }
        const cit = node.citations;
        if (cit && typeof cit === 'object' && !Array.isArray(cit)) {
            drainCitationRecord(cit);
        }
        for (const key of SOURCE_NEST_ARRAY_KEYS) {
            const arr = node[key];
            if (!Array.isArray(arr)) continue;
            for (const item of arr) {
                if (item && typeof item === 'object') scan(item);
            }
        }
    };

    scan(obj);
    if (obj?.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
        scan(obj.data);
    }

    /** Deep scan for { url|link|href, title|snippet } objects (SERP API shapes). */
    const deepOrganic = (node, d) => {
        if (d <= 0 || node == null) return;
        if (Array.isArray(node)) {
            for (const x of node) deepOrganic(x, d - 1);
            return;
        }
        if (typeof node !== 'object') return;
        const link = node.link || node.url || node.href;
        const title = node.title || node.name || node.snippet || node.description || node.text || '';
        if (typeof link === 'string') {
            const u = chainUnwrapCitationUrl(link);
            if (u) pushUrl(u, typeof title === 'string' ? title : '');
        }
        for (const v of Object.values(node)) {
            if (v && typeof v === 'object') deepOrganic(v, d - 1);
        }
    };
    deepOrganic(obj, 10);
    if (obj?.data) deepOrganic(obj.data, 10);

    return out;
}

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

function pickNestedAnswerContent(a) {
    if (!a || typeof a !== 'object') return '';
    const v =
        (typeof a.text === 'string' ? a.text : null) ??
        (typeof a.markdown === 'string' ? a.markdown : null) ??
        (typeof a.md === 'string' ? a.md : null) ??
        (typeof a.content === 'string' ? a.content : null) ??
        (typeof a.message === 'string' ? a.message : null) ??
        (typeof a.body === 'string' ? a.body : null) ??
        '';
    return typeof v === 'string' ? v : '';
}

function pickOpenAiStyleText(json) {
    const choices = json?.choices;
    if (!Array.isArray(choices) || !choices.length) return null;
    const c0 = choices[0];
    if (!c0 || typeof c0 !== 'object') return null;
    const msg = c0.message ?? c0.delta;
    if (msg && typeof msg === 'object' && typeof msg.content === 'string' && msg.content.trim()) {
        return msg.content.trim();
    }
    if (typeof c0.text === 'string' && c0.text.trim()) return c0.text.trim();
    return null;
}

/** Google Generative Language API shape when Infatica forwards raw JSON (candidates[].content.parts[].text). */
function pickGeminiApiStyleText(json) {
    const cands = json?.candidates;
    if (!Array.isArray(cands) || !cands.length) return null;
    const c0 = cands[0];
    if (!c0 || typeof c0 !== 'object') return null;
    const content = c0.content;
    if (typeof content === 'string' && content.trim()) return content.trim();
    if (content && typeof content === 'object') {
        const parts = content.parts;
        if (Array.isArray(parts) && parts.length) {
            const texts = parts
                .map((p) => (p && typeof p === 'object' && typeof p.text === 'string' ? p.text : ''))
                .filter(Boolean);
            const joined = texts.join('\n\n').trim();
            if (joined) return joined;
        }
        if (typeof content.text === 'string' && content.text.trim()) return content.text.trim();
    }
    return null;
}

/**
 * Primary answer text from Infatica LLM JSON (/perplexity, /gemini, /chatgpt) — many vendors nest fields differently.
 */
function extractLlmJsonText(json) {
    if (!json || typeof json !== 'object') return null;
    const tryStr = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const nested = pickNestedAnswerContent;

    const direct =
        pickOpenAiStyleText(json) ??
        pickGeminiApiStyleText(json) ??
        tryStr(json.answer) ??
        tryStr(json.reply) ??
        tryStr(json.assistant_response) ??
        tryStr(json.assistant) ??
        tryStr(json.text) ??
        tryStr(json.markdown) ??
        tryStr(json.md) ??
        tryStr(json.content) ??
        tryStr(json.response) ??
        tryStr(json.result) ??
        tryStr(json.output) ??
        tryStr(json.message) ??
        tryStr(json.body) ??
        tryStr(json.generated_text) ??
        tryStr(json.full_text) ??
        tryStr(json.completion) ??
        tryStr(json.model_output) ??
        tryStr(json.model_response) ??
        tryStr(json.final_answer) ??
        null;

    if (direct) return direct;

    if (json.answer && typeof json.answer === 'object') {
        const n = nested(json.answer);
        if (n?.trim()) return n.trim();
    }
    if (json.result && typeof json.result === 'object') {
        const n = nested(json.result);
        if (n?.trim()) return n.trim();
    }
    if (json.output && typeof json.output === 'object') {
        const n = nested(json.output);
        if (n?.trim()) return n.trim();
    }
    if (json.response && typeof json.response === 'object') {
        const n = nested(json.response);
        if (n?.trim()) return n.trim();
    }
    return null;
}

function pickHtmlFromJson(json) {
    if (!json || typeof json !== 'object') return null;
    if (typeof json.html !== 'string' || !json.html.trim()) return null;
    return tryBase64Decode(json.html) ?? json.html;
}

function looksLikeHtmlString(s) {
    if (typeof s !== 'string' || s.length < 48) return false;
    return /<\/?(div|span|html|body|table|a|section|ul|li|p|main|article|header|nav)\b/i.test(s);
}

/**
 * Infatica /serp JSON shape varies; HTML may live under nested keys, not only `html`.
 */
function deepPickHtmlFromJson(node, depth = 8, seen = new WeakSet()) {
    if (node == null || depth < 0) return null;
    if (typeof node === 'string') {
        if (node.length < 64 || !looksLikeHtmlString(node)) return null;
        return tryBase64Decode(node) ?? node;
    }
    if (typeof node !== 'object') return null;
    if (seen.has(node)) return null;
    seen.add(node);

    const preferKeys = [
        'html', 'page_html', 'pageHtml', 'serp_html', 'raw_html', 'body', 'content',
        'markup', 'snapshot', 'page', 'document_html', 'inner_html', 'innerHtml',
        'rendered_html', 'renderedHtml', 'screenshot_html', 'page_source', 'pageSource',
        'dom_html', 'domHtml', 'rendered_page', 'renderedPage',
    ];
    if (!Array.isArray(node)) {
        for (const k of preferKeys) {
            const v = node[k];
            if (typeof v === 'string' && v.length > 64) {
                const dec = tryBase64Decode(v) ?? v;
                if (looksLikeHtmlString(dec)) return dec;
            }
        }
        for (const [, v] of Object.entries(node)) {
            if (typeof v === 'string' && v.length > 200 && looksLikeHtmlString(v)) {
                return tryBase64Decode(v) ?? v;
            }
        }
    }

    const children = Array.isArray(node) ? node : Object.values(node);
    for (const v of children) {
        const h = deepPickHtmlFromJson(v, depth - 1, seen);
        if (h) return h;
    }
    return null;
}

function resolveSerpHtml(json) {
    const direct = pickHtmlFromJson(json);
    if (direct && direct.length > 80) return direct;
    return deepPickHtmlFromJson(json);
}

/** HTML for /perplexity, /gemini, /chatgpt when `html` is nested (same deep scan as SERP). */
function resolveLlmHtml(json) {
    const direct = pickHtmlFromJson(json);
    if (direct && direct.length > 80) return direct;
    const deep = deepPickHtmlFromJson(json);
    if (deep && deep.length > 64) return deep;
    return null;
}

function extractResponse(res, label) {
    return res.text().then(raw => {
        let json = null;
        try {
            json = JSON.parse(raw);
        } catch {
            try {
                const cleaned = String(raw).replace(/^\uFEFF/, '').trim();
                if (cleaned.length > 2) json = JSON.parse(cleaned);
            } catch { /* not JSON */ }
        }

        const isGoogleSerp = label === 'GoogleSERP';

        if (json && typeof json === 'object') {
            if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
                json = { ...json, ...json.data };
            }

            const text = extractLlmJsonText(json);

            const sources = collectSourcesFromJson(json);
            const htmlFromJson = isGoogleSerp ? resolveSerpHtml(json) : resolveLlmHtml(json);

            // Google SERP: JSON `text` is often internal state — prefer any real HTML fragment we can find
            if (isGoogleSerp && htmlFromJson && htmlFromJson.length > 80) {
                console.log(`    ✓ [${label}] HTML ${htmlFromJson.length}ch (SERP — HTML over JSON text), ${sources.length} sources`);
                return { text: null, sources, html: htmlFromJson };
            }

            let deferredBadLlmText = null;
            if (text && text.trim()) {
                const t = text.trim();
                if (isGoogleSerp && !isReadableAnswerText(t)) {
                    console.warn(`    [${label}] Ignoring non-prose text field (${t.length}ch)`);
                } else if (!isGoogleSerp && !isReadableAnswerText(t)) {
                    deferredBadLlmText = t;
                    console.warn(`    [${label}] Deferring non-prose JSON text (${t.length}ch) — trying HTML / nested`);
                } else {
                    console.log(`    ✓ [${label}] text ${t.length}ch, ${sources.length} sources`);
                    return { text: t, sources, html: null };
                }
            }

            // Perplexity / Gemini / ChatGPT: rendered HTML usually beats scraped JSON noise
            if (!isGoogleSerp && htmlFromJson && htmlFromJson.length > 80) {
                console.log(`    ✓ [${label}] HTML ${htmlFromJson.length}ch (LLM render)`);
                return { text: null, sources, html: htmlFromJson };
            }

            let nested = longestJsonTextBlob(json, 7, 100);
            if (nested.length >= 100) {
                if (isGoogleSerp && !isReadableAnswerText(nested)) {
                    console.warn(`    [${label}] Ignoring non-prose nested blob (${nested.length}ch)`);
                    nested = '';
                } else if (!isGoogleSerp && !isReadableAnswerText(nested)) {
                    console.warn(`    [${label}] Ignoring non-prose nested blob (${nested.length}ch)`);
                    nested = '';
                } else {
                    console.log(`    ✓ [${label}] nested text ${nested.length}ch, ${sources.length} sources`);
                    return { text: nested, sources, html: null };
                }
            }

            if (htmlFromJson && htmlFromJson.length > 80) {
                console.log(`    ✓ [${label}] HTML ${htmlFromJson.length}ch`);
                return { text: null, sources, html: htmlFromJson };
            }

            if (deferredBadLlmText) {
                console.warn(`    [${label}] Using deferred non-prose text as last resort (${deferredBadLlmText.length}ch)`);
                return { text: deferredBadLlmText, sources, html: null };
            }
        }

        if (raw && raw.trim().length > 50) {
            if (raw.includes('<html') || raw.includes('<body') || raw.includes('<div')) {
                console.log(`    ✓ [${label}] raw HTML ${raw.length}ch`);
                return { text: null, sources: [], html: raw };
            }
            const rt = raw.trim();
            // SERP may return JSON as string without Content-Type — try parse once more for embedded HTML
            if (isGoogleSerp && rt.startsWith('{')) {
                try {
                    const j2 = JSON.parse(rt);
                    const h2 = resolveSerpHtml(j2.data && typeof j2.data === 'object' ? { ...j2, ...j2.data } : j2);
                    if (h2 && h2.length > 80) {
                        console.log(`    ✓ [${label}] HTML from stringified JSON ${h2.length}ch`);
                        return { text: null, sources: collectSourcesFromJson(j2), html: h2 };
                    }
                } catch { /* ignore */ }
            }
            if (!isGoogleSerp && rt.startsWith('{')) {
                try {
                    const j2 = JSON.parse(rt);
                    const merged = j2.data && typeof j2.data === 'object' && !Array.isArray(j2.data)
                        ? { ...j2, ...j2.data }
                        : j2;
                    const t2 = extractLlmJsonText(merged);
                    const s2 = collectSourcesFromJson(merged);
                    const h2 = resolveLlmHtml(merged);
                    if (t2 && isReadableAnswerText(t2)) {
                        console.log(`    ✓ [${label}] text from raw JSON ${t2.length}ch`);
                        return { text: t2, sources: s2, html: null };
                    }
                    if (h2 && h2.length > 80) {
                        console.log(`    ✓ [${label}] HTML from raw JSON ${h2.length}ch`);
                        return { text: null, sources: s2, html: h2 };
                    }
                    if (t2 && t2.trim()) {
                        return { text: t2.trim(), sources: s2, html: null };
                    }
                } catch { /* ignore */ }
            }
            if (isGoogleSerp && !isReadableAnswerText(rt)) {
                console.warn(`    [${label}] Rejecting non-prose raw body (${rt.length}ch)`);
                return { text: null, sources: [], html: null };
            }
            console.log(`    ✓ [${label}] raw text ${rt.length}ch`);
            return { text: rt, sources: [], html: null };
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
    const txt = String(out.text || '').trim();
    const htmlLen = String(out.html || '').length;
    const proseBad = txt.length > 0 && !isReadableAnswerText(txt);
    const needHtmlRetry =
        !resultHasContent(out) ||
        (proseBad && htmlLen < 200);
    if (needHtmlRetry) {
        console.warn(`  [${label}] Empty or non-prose (${txt.length}ch text, ${htmlLen}ch html) — retrying with return_html=true`);
        const res2 = await post(true);
        const out2 = await extractResponse(res2, label);
        if (resultHasContent(out2)) {
            const t2 = String(out2.text || '').trim();
            const h2 = String(out2.html || '').length;
            const read2 = t2 && isReadableAnswerText(t2);
            const read1 = txt && isReadableAnswerText(txt);
            if (!resultHasContent(out)) {
                out = out2;
            } else if (read2 && !read1) {
                out = out2;
            } else if (h2 > htmlLen + 400 && h2 > 600) {
                out = out2;
            } else if (read2 && t2.length > txt.length * 1.15 && t2.length > 120) {
                out = out2;
            }
        }
    }
    return out;
}

export async function queryPerplexity(query, country, language) {
    return queryLlmPage('/perplexity', 'Perplexity', query, country, language, RETRY_CONFIG.perplexity);
}

export async function queryGemini(query, country, language) {
    return queryLlmPage('/gemini', 'Gemini', query, country, language, RETRY_CONFIG.gemini);
}

export async function queryGoogleAI(query, country, language) {
    const q = truncateQuery(query);
    const label = 'GoogleSERP';
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    const basePayload = {
        url,
        results: 10,
        ...countryPayload(country),
        ...languagePayload(language),
    };

    const fetchSerp = (returnHtml) =>
        infaticaFetch(`${INFATICA_BASE}/serp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
            body: JSON.stringify(returnHtml ? { ...basePayload, return_html: true } : basePayload),
        }, label, RETRY_CONFIG.serp);

    console.log(`  [${label}] "${q.substring(0, 60)}…"`);
    // Prefer HTML first — our parser depends on markup; JSON-only text is often unusable for Google SERP.
    let res = await fetchSerp(true);
    let out = await extractResponse(res, label);

    const htmlLen = String(out.html || '').length;
    const txt = String(out.text || '').trim();
    const srcCount = Array.isArray(out.sources) ? out.sources.length : 0;
    const badText = txt && !isReadableAnswerText(txt);
    const needFallback = !resultHasContent(out) || htmlLen < 200 || badText;

    console.log(`  [${label}] First attempt: html=${htmlLen}ch, text=${txt.length}ch, sources=${srcCount}, needFallback=${needFallback}`);

    if (needFallback) {
        try {
            console.warn(`  [${label}] SERP follow-up without return_html (html=${htmlLen}ch)`);
            res = await fetchSerp(false);
            const out2 = await extractResponse(res, label);
            const h2 = String(out2.html || '').length;
            const s2 = Array.isArray(out2.sources) ? out2.sources.length : 0;
            console.log(`  [${label}] Fallback: html=${h2}ch, sources=${s2}`);
            if (h2 > htmlLen) {
                console.log(`  [${label}] Using fallback (more HTML: ${h2} > ${htmlLen})`);
                out = out2;
            } else if (!resultHasContent(out) && resultHasContent(out2)) {
                console.log(`  [${label}] Using fallback (first empty, fallback has content)`);
                out = out2;
            }
        } catch (e) {
            console.warn(`  [${label}] SERP fallback fetch failed:`, e.message);
        }
    }

    return out;
}

/** Infatica ChatGPT scraper — same JSON/HTML retry path as Perplexity & Gemini. */
export async function queryInfaticaChatGPT(query, country, language) {
    return queryLlmPage('/chatgpt', 'ChatGPT', query, country, language, RETRY_CONFIG.chatgpt);
}
