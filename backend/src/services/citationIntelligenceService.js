/**
 * Gemini-powered briefing over all citation URLs from a visibility scan.
 * Groups URLs by prompt category (visibility, share_of_voice, etc.) and competitor / own-brand flags,
 * then synthesizes brand-facing narrative (who is ahead, content gaps).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getClient() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

const CATEGORY_LABELS = {
    visibility: 'Visibility & brand knowledge',
    ranking: 'Ranking & head-to-head',
    share_of_voice: 'Share of voice & segment',
    geo_context: 'Geo & momentum',
    deep_probe: 'Deep competitive research',
    other: 'Other prompts',
};

function safeJsonParse(text) {
    let t = String(text || '').trim();
    const fence = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
    if (fence) t = fence[1].trim();
    return JSON.parse(t);
}

/** Best-effort JSON when the model adds prose around the object. */
function parseInsightsResponse(text) {
    const raw = String(text || '').trim();
    try {
        return safeJsonParse(raw);
    } catch {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(raw.slice(start, end + 1));
            } catch {
                /* fall through */
            }
        }
        throw new Error('Could not parse model JSON');
    }
}

function normalizeCitationUrl(url) {
    const s = String(url || '').trim();
    if (!s) return '';
    try {
        const u = new URL(s);
        let p = u.pathname || '/';
        if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
        return `${u.protocol}//${u.hostname.toLowerCase()}${p}${u.search}`.toLowerCase();
    } catch {
        return s.toLowerCase().replace(/\/+$/, '');
    }
}

function buildFallbackInsight(row) {
    const domain = row.domain || '';
    const title = (row.title || '').trim();
    const cats = Object.entries(row.byPromptCategory || row.byCategory || {})
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k.replace(/_/g, ' '));
    const catStr = cats.length ? cats.slice(0, 2).join(', ') : 'general';
    const summary = title
        ? `Page titled “${title.slice(0, 90)}${title.length > 90 ? '…' : ''}” on ${domain || 'this domain'}.`
        : `Source from ${domain || 'cited domain'} (${(row.url || '').replace(/^https?:\/\//i, '').split('/')[0] || 'link'}).`;
    const why = row.sampleQueries?.length
        ? `Surfaced when models answer questions like those in your ${catStr} prompts, as a reference for that intent.`
        : `Appears in ${catStr} visibility prompts where models cite external sources.`;
    return { summary, whyCited: why };
}

/**
 * @param {Array} allRuns - visibility agent runs with citations, category, query, engine
 */
export function aggregateCitationsForIntelligence(allRuns) {
    const byUrl = new Map();

    for (const run of allRuns || []) {
        const cat = run.category || 'other';
        const query = (run.query || '').slice(0, 200);
        const engine = run.engine || '';

        for (const c of run.citations || []) {
            const url = (c.url || '').trim();
            if (!url) continue;
            const key = url;
            if (!byUrl.has(key)) {
                byUrl.set(key, {
                    url: key,
                    domain: c.domain || '',
                    title: (c.title || '').slice(0, 180),
                    isTargetBrand: !!c.isTargetBrand,
                    isCompetitor: !!c.isCompetitor,
                    citationCount: 0,
                    engines: new Set(),
                    categories: new Map(),
                    sampleQueries: new Set(),
                });
            }
            const row = byUrl.get(key);
            row.citationCount += 1;
            if (engine) row.engines.add(engine);
            row.categories.set(cat, (row.categories.get(cat) || 0) + 1);
            if (query) row.sampleQueries.add(query);
            if (c.title && !row.title) row.title = (c.title || '').slice(0, 180);
            if (c.isTargetBrand) row.isTargetBrand = true;
            if (c.isCompetitor) row.isCompetitor = true;
        }
    }

    const urls = [...byUrl.values()]
        .map((u) => ({
            url: u.url,
            domain: u.domain,
            title: u.title,
            isTargetBrand: u.isTargetBrand,
            isCompetitor: u.isCompetitor,
            citationCount: u.citationCount,
            engines: [...u.engines],
            byCategory: Object.fromEntries(u.categories),
            byPromptCategory: Object.fromEntries(u.categories),
            sampleQueries: [...u.sampleQueries].slice(0, 3),
        }))
        .sort((a, b) => b.citationCount - a.citationCount);

    const byCategory = {};
    for (const u of urls) {
        for (const [cat, n] of Object.entries(u.byCategory)) {
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push({ ...u, categoryHits: n });
        }
    }

    for (const cat of Object.keys(byCategory)) {
        byCategory[cat].sort((a, b) => (b.categoryHits || 0) - (a.categoryHits || 0));
        byCategory[cat] = byCategory[cat].slice(0, 35);
    }

    return {
        totalUniqueUrls: urls.length,
        totalCitationEvents: urls.reduce((s, u) => s + u.citationCount, 0),
        /** Full sorted citation list (for per-page URL insights). */
        allCitationUrls: urls,
        topUrls: urls.slice(0, 60),
        byCategory,
        competitorUrls: urls.filter((u) => u.isCompetitor).slice(0, 40),
        ownBrandUrls: urls.filter((u) => u.isTargetBrand).slice(0, 25),
    };
}

function competitorNamesFromResults(scanResults) {
    const names = [];
    const sov = scanResults?.shareOfVoice;
    for (const c of sov?.competitors || []) {
        if (c?.name) names.push(String(c.name));
    }
    for (const e of scanResults?.entityGraph || []) {
        if (e?.isCompetitor && e?.name && !e?.isTargetBrand) names.push(String(e.name));
    }
    return [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 12);
}

/**
 * @param {object} params
 * @param {string} params.brandName
 * @param {string} params.domain
 * @param {string} params.industry
 * @param {string[]} params.competitorNames
 * @param {object} params.aggregate - from aggregateCitationsForIntelligence
 * @param {object[]} params.competitorGaps - optional normalized gaps from scan results
 */
export async function generateCitationIntelligenceBrief(params) {
    const { brandName, domain, industry, competitorNames, aggregate, competitorGaps } = params;

    const categoryLegend = Object.entries(CATEGORY_LABELS)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');

    const gapsCompact = (competitorGaps || []).slice(0, 12).map((g) => ({
        query: (g.query || g.topic || '').slice(0, 160),
        competitors: (g.competitorsPresent || g.competitors || [])
            .slice(0, 4)
            .map((c) => (typeof c === 'string' ? c : c.name))
            .filter(Boolean),
        enginesAffected: Array.isArray(g.enginesAffected) ? g.enginesAffected : [],
    }));

    const payload = {
        brandName,
        domain: domain || '',
        industry: industry || '',
        trackedCompetitors: competitorNames || [],
        stats: {
            totalUniqueUrls: aggregate.totalUniqueUrls,
            totalCitationEvents: aggregate.totalCitationEvents,
        },
        ownBrandUrls: aggregate.ownBrandUrls,
        competitorFlaggedUrls: aggregate.competitorUrls,
        topUrlsOverall: aggregate.topUrls.slice(0, 45),
        urlsGroupedByPromptCategory: aggregate.byCategory,
        contentGapHints: gapsCompact,
    };

    const prompt = `You are an AI search (AEO) strategist. Your audience is "${brandName}" (${domain || 'unknown domain'}) in industry: ${industry || 'general'}.

We tracked how Perplexity, Gemini, and ChatGPT-style answers cite sources across many prompts. Prompt categories in our data:
${categoryLegend}

Below is JSON with URLs the models cited, grouped by which *prompt category* produced those citations, plus flags isCompetitor / isTargetBrand when our parser matched domains to competitors or the user's brand. Use ONLY this data — do not invent URLs or competitors not present in the JSON.

DATA:
${JSON.stringify(payload)}

Return a SINGLE JSON object (no markdown fences) with this exact shape:
{
  "executiveSummary": "string, 2-4 short paragraphs in plain language for the brand team",
  "competitorTakeaways": [
    { "label": "competitor name or domain", "insight": "why they appear stronger in citations", "exampleUrls": ["up to 3 urls from data"] }
  ],
  "whereYouAreCited": "one paragraph on the brand's own URLs/themes if any; say if sparse",
  "categoryNarratives": {
    "visibility": "1-2 sentences",
    "ranking": "1-2 sentences",
    "share_of_voice": "1-2 sentences",
    "geo_context": "1-2 sentences or empty string",
    "deep_probe": "1-2 sentences or empty string",
    "other": "optional"
  },
  "contentGaps": [
    { "headline": "short title", "detail": "what to publish or clarify; tie to prompts/gaps in data", "priority": "high|medium|low" }
  ],
  "limitations": "one sentence on what this analysis cannot see (e.g. live web, uncited answers)"
}

Rules:
- exampleUrls must be subsets of URLs appearing in the input JSON.
- If a category has no URLs in data, use an empty string for that category key.
- Be direct: say when competitors are cited more or when the brand has no article on a theme suggested by gap hints.
- Keep competitorTakeaways to at most 6 items; contentGaps to at most 8.`;

    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    let parsed;
    try {
        parsed = safeJsonParse(text);
    } catch {
        throw new Error('Gemini returned non-JSON; retry the request or shorten the scan data.');
    }

    return {
        brief: parsed,
        aggregateMeta: {
            totalUniqueUrls: aggregate.totalUniqueUrls,
            totalCitationEvents: aggregate.totalCitationEvents,
            categoryLabels: CATEGORY_LABELS,
        },
    };
}

const URL_INSIGHT_CHUNK = 18;

/**
 * One-sentence summary + why-cited per URL for dashboard table (Gemini).
 * Uses title, domain, path, prompt categories, and sample queries only — no live fetch.
 *
 * @param {Array<object>} topUrlRows - rows with url, title, domain, citationCount|count, byPromptCategory|byCategory, sampleQueries, flags
 * @param {string} brandName
 * @returns {Promise<Array<{ url: string, summary: string, whyCited: string }>>}
 */
export async function generatePerUrlTableInsights(topUrlRows, brandName) {
    const normalized = (topUrlRows || []).slice(0, 60).map((r) => ({
        url: r.url,
        domain: r.domain || '',
        title: (r.title || '').slice(0, 200),
        citationCount: r.citationCount ?? r.count ?? 0,
        byPromptCategory: r.byPromptCategory || r.byCategory || {},
        sampleQueries: (r.sampleQueries || []).slice(0, 3).map((q) => String(q).slice(0, 180)),
        isCompetitor: !!r.isCompetitor,
        isTargetBrand: !!r.isTargetBrand,
        engines: (r.engines || []).slice(0, 4),
    }));

    const client = getClient();
    const model = client.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });

    const mergeGeminiIntoChunk = (chunk, batch) => {
        const byNorm = new Map();
        for (const row of batch) {
            if (!row?.url) continue;
            const w = String(row.whyCited ?? row.why_cited ?? '').trim();
            const s = String(row.summary || '').trim();
            const k = normalizeCitationUrl(row.url);
            if (k) byNorm.set(k, { summary: s, whyCited: w });
        }
        return chunk.map((input) => {
            const canonical = input.url;
            const k = normalizeCitationUrl(canonical);
            const g = k ? byNorm.get(k) : null;
            const fb = buildFallbackInsight(input);
            const summary = g?.summary && g.summary !== '—' ? g.summary : fb.summary;
            const whyCited = g?.whyCited && g.whyCited !== '—' ? g.whyCited : fb.whyCited;
            return {
                url: canonical,
                summary: summary || fb.summary,
                whyCited: whyCited || fb.whyCited,
            };
        });
    };

    const out = [];

    for (let i = 0; i < normalized.length; i += URL_INSIGHT_CHUNK) {
        const chunk = normalized.slice(i, i + URL_INSIGHT_CHUNK);
        const prompt = `You explain AI search citations for the brand "${brandName}".

For EACH object in INPUT, output one row with the SAME "url" string (character-for-character identical to input url).
- summary: ONE concise sentence — what this page likely is, using only domain, URL path, and title. Do not claim you opened the page or quote statistics you did not see in the input.
- whyCited: ONE concise sentence — why AI answers (Perplexity / Gemini / ChatGPT-style) would cite this URL given byPromptCategory, sampleQueries, isCompetitor, isTargetBrand, and engines.

INPUT:
${JSON.stringify(chunk)}

Return JSON only with shape: {"rows":[{"url":"...","summary":"...","whyCited":"..."}]}
Include every INPUT url exactly once, same url string as provided.`;

        let batch = [];
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const parsed = parseInsightsResponse(text);
            batch = Array.isArray(parsed?.rows) ? parsed.rows : [];
        } catch (err) {
            console.warn('[generatePerUrlTableInsights] Gemini chunk failed, using fallbacks:', err.message);
            batch = [];
        }
        out.push(...mergeGeminiIntoChunk(chunk, batch));
    }

    return out;
}

/**
 * Load competitor names from stored scan results when available.
 */
export function extractCompetitorContext(scanResults) {
    return competitorNamesFromResults(scanResults || {});
}
