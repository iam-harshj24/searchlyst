import crypto from 'node:crypto';
import { getGoogleGenerativeAI, getCompetitorSuggestionModelName } from '../lib/geminiClient.js';

/** Short-lived cache + in-flight dedupe for identical competitor requests (reduces repeat latency). TTL ms; 0 = disabled. */
function getCompetitorSuggestCacheTtlMs() {
    const raw = process.env.COMPETITOR_SUGGEST_CACHE_TTL_MS;
    const n = raw === undefined || raw === '' ? 300_000 : parseInt(String(raw), 10);
    return Number.isFinite(n) && n >= 0 ? n : 300_000;
}

const competitorSuggestCache = new Map();
const competitorSuggestInflight = new Map();

function hashCompetitorSuggestPayload(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function getCompetitorGenerationConfig(grounding) {
    // JSON array of ~10 competitor objects needs headroom; 1024 was truncating mid-JSON (MAX_TOKENS).
    const fastMax = parseInt(process.env.GEMINI_ONBOARDING_FAST_MAX_OUTPUT ?? '4096', 10);
    const groundedMax = parseInt(process.env.GEMINI_ONBOARDING_GROUNDED_MAX_OUTPUT ?? '4096', 10);
    const maxOutputTokens = grounding
        ? Math.min(Math.max(Number.isFinite(groundedMax) ? groundedMax : 1536, 256), 8192)
        : Math.min(Math.max(Number.isFinite(fastMax) ? fastMax : 1024, 256), 8192);
    const base = {
        maxOutputTokens,
        temperature: grounding ? 0.25 : 0.2,
    };
    // JSON MIME forces valid JSON for the fast path (fixes prose / markdown-only replies).
    // Not used with googleSearch grounding (tool responses vary).
    if (!grounding) {
        base.responseMimeType = 'application/json';
    }
    return base;
}

function getClient() {
    return getGoogleGenerativeAI();
}

/** Default: fast (no Google Search tool). Grounding runs multiple search rounds and is often 20–60s+. */
function useGroundingForOnboarding(explicitGrounding) {
    if (process.env.GEMINI_ONBOARDING_GROUNDING === 'true') return true;
    return explicitGrounding === true;
}

function buildGroundedCompetitorPrompt(
    domain,
    brandName,
    industry,
    location,
    language,
    reach,
    companySize,
    competitorNames,
) {
    const geo = location ? ` Geography / market: ${location}.` : '';
    const lang = language ? ` Language / locale: ${language}.` : '';
    const reachLine = reach ? ` Audience reach: ${reach}.` : '';
    const sizeLine = companySize ? ` Typical customer / company size: ${companySize}.` : '';
    return `SEARCH TASK:
Infer from "${brandName}" (${domain}) and industry "${industry}" what primary pain/problem they solve and which buyers they target.${geo}${lang}${reachLine}${sizeLine}

Search the web for up to 12 companies that are EXACT competitors — all must match:
(1) Same industry/category as "${industry}" (not a vague "B2B" adjacency),
(2) Same core pain / job-to-be-done (same problem buyers hire this category to solve),
(3) Same target audience and use case as ${brandName} (shortlist you'd see on the same RFP or bake-off).

SEARCH SOURCES TO CHECK:
- G2.com, Capterra, Product Hunt, Crunchbase, Reddit (site:reddit.com), recent comparison articles

${competitorNames.length > 0
        ? `ALREADY KNOWN — DO NOT include: ${competitorNames.join(', ')}`
        : ''}

EXCLUDE: ${domain}; defunct companies; generic directories; tangential tools that do not solve this exact pain for this audience.

OUTPUT — ONLY raw JSON array (reason must state same pain + same audience alignment):
[{"name":"Company","domain":"site.com","reason":"one sentence","source":"where found","relevance":8,"confidence":"high"}]

If you cannot find 12 with high confidence, return fewer.`;
}

function buildFastCompetitorPrompt(domain, brandName, industry, location, language, reach, companySize, competitorNames) {
    const loc = location ? ` Geography: ${location}.` : '';
    const lang = language ? ` Language market: ${language}.` : '';
    const reachLine = reach ? ` Reach: ${reach}.` : '';
    const sizeLine = companySize ? ` Typical customer size: ${companySize}.` : '';
    const exclude = competitorNames.length
        ? ` Exclude these names/domains: ${competitorNames.join(', ')}.`
        : '';

    return `You are a market analyst. From domain ${domain}, brand "${brandName}", and industry "${industry}", infer the primary pain/problem this product solves and the buyer/audience it serves.${loc}${lang}${reachLine}${sizeLine}
${exclude}
Using your training knowledge only (no browsing), list up to 10 EXACT competitors. Each must satisfy ALL of:
- Same industry/category as "${industry}" (not a loose "also SaaS" neighbor).
- Same core pain / job-to-be-done — a buyer evaluating ${brandName} would realistically compare them for solving that exact problem.
- Same target audience and use case (apply geography, language, reach, and company-size hints above).
- Exclude ${domain}; exclude tangential tools, generic platforms, or categories that only overlap at the edges.

Prefer real companies with domains you are confident about; omit uncertain names rather than filling with weak adjacencies.

Return ONLY a JSON array (no markdown, no prose). Each "reason" must briefly justify same pain + same audience:
[{"name":"Company Inc","domain":"company.com","reason":"One short sentence tying same pain and same ICP to ${brandName}","source":"known market","relevance":7,"confidence":"medium"}]`;
}

async function generateCompetitorsFromPrompt(client, prompt, { grounding }) {
    const modelName = getCompetitorSuggestionModelName();
    const generationConfig = getCompetitorGenerationConfig(grounding);

    if (grounding) {
        const groundedModel = client.getGenerativeModel({
            model: modelName,
            tools: [{ googleSearch: {} }],
            generationConfig,
        });
        const result = await groundedModel.generateContent(prompt);
        return extractTextFromGenerateResult(result);
    }

    const model = client.getGenerativeModel({
        model: modelName,
        generationConfig,
    });
    const result = await model.generateContent(prompt);
    return extractTextFromGenerateResult(result);
}

function extractTextFromGenerateResult(result) {
    const cand = result?.response?.candidates?.[0];
    const finish = cand?.finishReason;
    if (finish && finish !== 'STOP' && finish !== 'MAX_TOKENS') {
        console.warn('[Competitor AI] Unusual finishReason:', finish);
    }
    let text;
    try {
        text = result.response.text();
    } catch (e) {
        const msg = e?.message || String(e);
        const block = result?.response?.promptFeedback?.blockReason;
        throw new Error(`Gemini returned no text (${msg})${block ? `; blockReason=${block}` : ''}`);
    }
    const t = (text || '').trim();
    if (!t) {
        throw new Error(`Empty Gemini response (finishReason=${finish || 'unknown'})`);
    }
    if (finish === 'MAX_TOKENS') {
        console.warn('[Competitor AI] Output hit MAX_TOKENS — raise GEMINI_ONBOARDING_FAST_MAX_OUTPUT or shorten the prompt.');
    }
    return t;
}

// PROMPT 1 — Onboarding: Competitor Suggestions
// Default path is fast (plain Flash). Enable grounding via GEMINI_ONBOARDING_GROUNDING=true or body.grounding=true.
export async function suggestCompetitors({
    domain,
    brandName,
    industry,
    companySize,
    location,
    language,
    reach,
    customCompetitors,
    grounding: explicitGrounding,
}) {
    const client = getClient();
    const competitorNames = Array.isArray(customCompetitors) ? customCompetitors.filter(Boolean) : [];
    const wantGrounding = useGroundingForOnboarding(explicitGrounding);

    const cachePayload = {
        domain: String(domain || '').toLowerCase().trim(),
        brandName: String(brandName || '').trim(),
        industry: String(industry || '').trim(),
        companySize: companySize || '',
        location: String(location || '').trim(),
        language: language || '',
        reach: reach || '',
        custom: [...competitorNames].sort(),
        grounding: wantGrounding,
    };
    const cacheKey = hashCompetitorSuggestPayload(cachePayload);
    const ttl = getCompetitorSuggestCacheTtlMs();

    if (ttl > 0) {
        const hit = competitorSuggestCache.get(cacheKey);
        if (hit && hit.expires > Date.now()) {
            return hit.value.map((c) => ({ ...c }));
        }
        const pending = competitorSuggestInflight.get(cacheKey);
        if (pending) return pending.then((rows) => rows.map((c) => ({ ...c })));
    }

    const execute = async () => {
        const run = async (grounding) => {
            const prompt = grounding
                ? buildGroundedCompetitorPrompt(
                    domain,
                    brandName,
                    industry,
                    location,
                    language,
                    reach,
                    companySize,
                    competitorNames,
                )
                : buildFastCompetitorPrompt(
                    domain,
                    brandName,
                    industry,
                    location,
                    language,
                    reach,
                    companySize,
                    competitorNames,
                );
            const text = await generateCompetitorsFromPrompt(client, prompt, { grounding });
            return parseCompetitorResponse(text, competitorNames, domain);
        };

        if (wantGrounding) {
            try {
                return await run(true);
            } catch (groundingError) {
                console.warn('[Competitor AI] Grounding failed, falling back to fast model:', groundingError.message?.slice(0, 120));
                return await run(false);
            }
        }
        return await run(false);
    };

    const promise = execute().then((rows) => {
        if (ttl > 0) {
            competitorSuggestCache.set(cacheKey, { value: rows, expires: Date.now() + ttl });
        }
        return rows;
    }).finally(() => {
        if (ttl > 0) competitorSuggestInflight.delete(cacheKey);
    });

    if (ttl > 0) competitorSuggestInflight.set(cacheKey, promise);
    return promise;
}

/** Pull first top-level JSON array from text (handles extra prose, fences, trailing commas in some cases). */
function extractCompetitorJsonArray(raw) {
    const cleaned = String(raw || '')
        .replace(/^\uFEFF/, '')
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    const tryParse = (s) => {
        try {
            const v = JSON.parse(s);
            if (Array.isArray(v)) return v;
            if (v && typeof v === 'object' && Array.isArray(v.competitors)) return v.competitors;
            if (v && typeof v === 'object' && Array.isArray(v.items)) return v.items;
        } catch { /* try next */ }
        return null;
    };

    const direct = tryParse(cleaned);
    if (direct) return direct;

    const start = cleaned.indexOf('[');
    if (start === -1) throw new Error('No JSON array found in AI response');

    let depth = 0;
    let inString = false;
    let esc = false;
    for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (inString) {
            if (esc) esc = false;
            else if (ch === '\\') esc = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === '[') depth++;
        if (ch === ']') {
            depth--;
            if (depth === 0) {
                const slice = cleaned.slice(start, i + 1);
                const arr = tryParse(slice);
                if (arr) return arr;
                break;
            }
        }
    }

    throw new Error('No JSON array found in AI response');
}

function parseCompetitorResponse(text, competitorNames, domain) {
    const competitors = extractCompetitorJsonArray(text);
    return competitors
        .filter(c => c.name && c.domain)
        .filter(c => !c.domain.includes(domain))
        .map(c => ({
            name: c.name,
            domain: c.domain?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            reason: c.reason || c.compete_reason || 'Competes in the same market',
            source: c.source || 'AI web search',
            relevance: typeof c.relevance === 'number' ? c.relevance : 7,
            confidence: c.confidence || 'medium',
        }));
}

// Agent Chat — powered by Gemini
export async function chatWithAgent({ messages, brandContext, analyticsSnapshot }) {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const { brandName, domain, industry, location, competitors } = brandContext || {};
    const snapshotBlock =
        analyticsSnapshot && String(analyticsSnapshot).trim().length > 0
            ? `\n\n---\nLive analytics for this account (from the product — treat as ground truth; do not invent numbers):\n${String(analyticsSnapshot).trim()}\n---\n`
            : '';

    const contextBlock = (brandName || domain || industry) ? `
You are the user's analytics account manager inside Searchlyst. Answer using the brand context and any live analytics below. If a number is in the analytics block, quote it; if something is missing, say you don't have that metric yet and suggest running a scan.

You help with:
- AI visibility scores, trends, share of voice, citations, and prompts
- Content strategy and closing citation gaps
- Competitor positioning using scan data

Brand context: ${brandName || 'N/A'} | ${domain || 'N/A'} | ${industry || 'N/A'}${location ? ` | ${location}` : ''}
${competitors?.length ? `Competitors: ${competitors.slice(0, 12).map(c => typeof c === 'string' ? c : c.name).join(', ')}` : ''}
${snapshotBlock}
Be concise, actionable, and professional. Use markdown for lists when helpful.
` : `You are a helpful AI assistant for content strategy and AI search visibility.${snapshotBlock}\nBe concise and actionable. Use markdown when helpful.\n`;

    const history = (messages || []).map(m => {
        const role = m.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${m.content}`;
    }).join('\n\n');

    const prompt = `${contextBlock}\n\nConversation:\n${history}\n\nAssistant:`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response?.text?.();
        return (text || '').trim();
    } catch (err) {
        console.error('[Agent Chat] Error:', err.message);
        throw err;
    }
}

// PROMPT: Brand Knowledge Summary
export async function generateBrandSummary({ domain, brandName, industry }) {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a brand strategist. Write a concise, 3-4 sentence brand summary for a company named "${brandName}" (website: ${domain}) operating in the "${industry}" industry.
Focus on:
1. What they do (their core offering)
2. Who they serve (their target audience)
3. Their main value proposition

Make it read professionally, like a company bio. Do NOT include phrases like "Here is a summary" or "This company". Just output the summary paragraph directly.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err) {
        console.error('[Brand Summary AI] Error:', err.message);
        throw err;
    }
}
