/**
 * Gemini Analytics Layer (Phase 2)
 * 
 * Takes raw LLM responses (from Infatica → Perplexity/Gemini/Google AI)
 * and uses Gemini API (direct) to convert them into structured analytics.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getClient() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

async function callGemini(prompt) {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

/**
 * Main analytics function: takes all raw LLM responses and produces structured data.
 * @param {Array} rawResponses - [{id, engine, prompt, rawText}]
 * @param {string} brandName
 * @param {string} domain
 * @param {string} industry
 * @param {string} compStr - comma-separated competitor names
 * @returns {Object} structured analytics
 */
export async function analyzeRawResponses(rawResponses, brandName, domain, industry, compStr) {
    const combinedText = rawResponses.map(r =>
        `--- ${r.id} (${r.engine}) ---\n${(r.rawText || '').slice(0, 4000)}`
    ).join('\n\n');

    const analyticsPrompt = `You are a data analyst. I queried multiple AI search engines about "${brandName}" (${domain}) in the "${industry}" market vs competitors: ${compStr}.

Below are the raw responses from Perplexity, Gemini, and Google AI. Your job is to extract structured analytics from ALL of them combined.

RAW RESPONSES:
${combinedText}

---

EXTRACT AND RETURN ONLY THIS JSON (no markdown, no explanation):

{
  "visibilityScore": <number 0-100, based on how well ${brandName} appears across these results>,
  "sentiment": {
    "positive": <count of positive mentions of ${brandName}>,
    "negative": <count of negative mentions>,
    "neutral": <count of neutral mentions>
  },
  "shareOfVoice": [
    {"name": "${brandName}", "sov": <percentage>, "mentions": <count>},
    {"name": "<competitor>", "sov": <percentage>, "mentions": <count>}
  ],
  "platformBreakdown": {
    "perplexity": {"mentioned": <bool>, "sentiment": "<positive/negative/neutral>", "snippets": ["<key quotes>"]},
    "gemini": {"mentioned": <bool>, "sentiment": "<positive/negative/neutral>", "snippets": ["<key quotes>"]},
    "googleAI": {"mentioned": <bool>, "sentiment": "<positive/negative/neutral>", "snippets": ["<key quotes>"]}
  },
  "sources": [
    {"url": "<full URL>", "domain": "<domain>", "title": "<title>", "tier": <1=gold/2=silver/3=bronze>, "brandMentioned": <bool>}
  ],
  "entityGraph": [
    {"name": "<brand>", "domain": "<domain or empty>", "isTargetBrand": <bool>, "isCompetitor": <bool>, "totalMentions": <n>, "queryCount": <n>}
  ],
  "competitorInsights": {
    "ranking": [{"rank": <n>, "name": "<brand>", "evidence": "<why>"}],
    "gaps": [{"query": "<topic/query where competitors appear but ${brandName} does not>", "competitors": ["<name1>", "<name2>"]}],
    "threats": [{"competitor": "<name>", "move": "<what happened>", "impact": "<high/medium/low>", "source": "<url>"}]
  },
  "topFindings": [
    "<1-sentence finding with source reference>"
  ],
  "recommendations": [
    "<actionable recommendation based on evidence>"
  ]
}

RULES:
- Only include data you can extract from the raw responses above
- For URLs/sources: extract any URL mentioned in the raw text
- visibilityScore: 80+ if brand dominates, 50-80 if present but not leading, below 50 if weak
- shareOfVoice percentages must sum to 100
- entityGraph: Extract ALL brands/entities mentioned across responses. Include "${brandName}" (isTargetBrand: true) and each competitor (isCompetitor: true). totalMentions = count of times mentioned, queryCount = number of response blocks where they appear.
- gaps: For each topic/query where competitors are mentioned but "${brandName}" is not, extract the query and list which competitors appeared. Use structured format with "query" and "competitors" array.
- Return ONLY valid JSON, nothing else`;

    try {
        const analyticsJson = await callGemini(analyticsPrompt);
        const cleaned = analyticsJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in analytics response');
        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        console.error('[Gemini Analytics] Failed to parse:', err.message);
        return buildFallbackAnalytics(rawResponses, brandName, compStr);
    }
}

function buildFallbackAnalytics(rawResponses, brandName, compStr) {
    const allText = rawResponses.map(r => r.rawText || '').join(' ').toLowerCase();
    const brandLower = brandName.toLowerCase();
    const brandMentions = (allText.match(new RegExp(brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

    const competitors = compStr.split(',').map(c => c.trim()).filter(Boolean);
    const sov = [{ name: brandName, sov: 0, mentions: brandMentions }];
    let totalMentions = brandMentions;

    for (const comp of competitors) {
        const compLower = comp.toLowerCase();
        const mentions = (allText.match(new RegExp(compLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        sov.push({ name: comp, sov: 0, mentions });
        totalMentions += mentions;
    }

    if (totalMentions > 0) {
        for (const entry of sov) {
            entry.sov = Math.round((entry.mentions / totalMentions) * 100);
        }
    }

    const urlRegex = /https?:\/\/[^\s<>"')\]]+/g;
    const urls = [...new Set(allText.match(urlRegex) || [])];
    const sources = urls.slice(0, 20).map(url => {
        let domain = '';
        try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}
        return { url, domain, title: '', tier: 3, brandMentioned: url.toLowerCase().includes(brandLower) };
    });

    const pMentioned = rawResponses.some(r => r.engine === 'perplexity' && (r.rawText || '').toLowerCase().includes(brandName.toLowerCase()));
    const gMentioned = rawResponses.some(r => r.engine === 'gemini' && (r.rawText || '').toLowerCase().includes(brandName.toLowerCase()));
    const gaiMentioned = rawResponses.some(r => r.engine === 'googleAI' && (r.rawText || '').toLowerCase().includes(brandName.toLowerCase()));

    const entityGraph = [
        { name: brandName, domain: '', isTargetBrand: true, isCompetitor: false, totalMentions: brandMentions, queryCount: rawResponses.length },
        ...competitors.map((comp, i) => {
            const compLower = comp.toLowerCase();
            const mentions = (allText.match(new RegExp(compLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            return { name: comp, domain: '', isTargetBrand: false, isCompetitor: true, totalMentions: mentions, queryCount: rawResponses.length };
        }),
    ];

    return {
        visibilityScore: Math.min(100, Math.round((brandMentions / Math.max(totalMentions, 1)) * 100)),
        sentiment: { positive: 0, negative: 0, neutral: brandMentions },
        shareOfVoice: sov,
        entityGraph,
        platformBreakdown: {
            perplexity: { mentioned: pMentioned, sentiment: 'neutral', snippets: [] },
            gemini: { mentioned: gMentioned, sentiment: 'neutral', snippets: [] },
            googleAI: { mentioned: gaiMentioned, sentiment: 'neutral', snippets: [] },
        },
        sources,
        competitorInsights: { ranking: [], gaps: [], threats: [] },
        topFindings: [],
        recommendations: [],
    };
}
