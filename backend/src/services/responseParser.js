import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

let genAI = null;
function getModel() {
    if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// ── Domain Categorization ────────────────────────────────────────────────────

const DOMAIN_CATEGORIES = {
    forum: ['reddit.com', 'quora.com', 'stackoverflow.com', 'news.ycombinator.com', 'community.', 'forum.', 'discuss.'],
    social: ['linkedin.com', 'twitter.com', 'x.com', 'youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'medium.com'],
    review: ['g2.com', 'capterra.com', 'trustpilot.com', 'trustradius.com', 'yelp.com', 'getapp.com', 'softwareadvice.com'],
    institutional: ['wikipedia.org', 'arxiv.org', '.edu', '.gov', 'researchgate.net'],
    editorial: [
        'searchengineland.com', 'searchenginejournal.com', 'techcrunch.com', 'forbes.com', 'nytimes.com',
        'hubspot.com', 'neilpatel.com', 'moz.com', 'ahrefs.com', 'semrush.com', 'backlinko.com',
        'contentmarketinginstitute.com', 'entrepreneur.com', 'inc.com', 'businessinsider.com', 'wired.com',
        'theverge.com', 'engadget.com', 'mashable.com', 'zdnet.com', 'cnet.com', 'techradar.com'
    ]
};

function categorizeDomain(domain, brandDomain, competitorDomains = []) {
    const d = domain.toLowerCase();
    const brandD = brandDomain?.toLowerCase().replace('www.', '') || '';
    if (brandD && (d === brandD || d.includes(brandD.split('.')[0]))) return 'owned';
    for (const comp of competitorDomains) {
        const c = comp.toLowerCase().replace('www.', '');
        if (d === c || d.includes(c.split('.')[0])) return 'competitor';
    }
    for (const pattern of DOMAIN_CATEGORIES.forum) { if (d.includes(pattern)) return 'forum'; }
    for (const pattern of DOMAIN_CATEGORIES.social) { if (d.includes(pattern)) return 'social'; }
    for (const pattern of DOMAIN_CATEGORIES.review) { if (d.includes(pattern)) return 'review'; }
    for (const pattern of DOMAIN_CATEGORIES.institutional) { if (d.includes(pattern)) return 'institutional'; }
    for (const pattern of DOMAIN_CATEGORIES.editorial) { if (d.includes(pattern)) return 'editorial'; }
    return 'other';
}

// ── HTML Utilities ───────────────────────────────────────────────────────────

function extractTextFromHtml(html) {
    if (!html) return '';
    try {
        const $ = cheerio.load(html);
        $('script, style, noscript, svg, img, link, meta').remove();
        return $('body').text().replace(/\s+/g, ' ').trim();
    } catch {
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
}

function extractLinksFromHtml(html) {
    if (!html) return [];
    try {
        const $ = cheerio.load(html);
        const links = [];
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href?.startsWith('http')) {
                try {
                    const url = new URL(href);
                    const d = url.hostname.replace('www.', '');
                    if (!d.includes('google.com') && !d.includes('gstatic')) {
                        links.push({ url: href, domain: d, text: text.substring(0, 80) });
                    }
                } catch {}
            }
        });
        return links;
    } catch { return []; }
}

// ── AI Text Response Parsing (Perplexity/Gemini numbered citation style) ─────

/**
 * Parse sources from Perplexity-style numbered citation text.
 * Perplexity embeds numbers in text like "According to X [1][2]..."
 * and optionally provides a "Sources:" or "References:" section at the end.
 */
function extractSourcesFromAIText(text) {
    const sources = [];

    // Pattern 1: "Sources:" / "References:" section at end of text
    // e.g. "Sources:\n1. https://example.com - Title\n2. https://..."
    const sourcesSectionMatch = text.match(
        /(?:sources?|references?|citations?)\s*:?\s*\n([\s\S]{0,3000})$/i
    );
    if (sourcesSectionMatch) {
        const section = sourcesSectionMatch[1];
        // Match numbered URL lines: "1. https://... - Title" or "1. [Title](url)"
        const urlLines = section.matchAll(
            /^\s*\d+[\.\)]\s*(?:\[([^\]]+)\]\()?(\bhttps?:\/\/[^\s\)\]]+)[\)\]]?(?:\s*[-–]\s*(.+))?/gm
        );
        for (const m of urlLines) {
            const url = m[2];
            const title = m[1] || m[3] || '';
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                sources.push({ url: url.trim(), domain, title: title.trim() });
            } catch {}
        }
    }

    // Pattern 2: Bare URLs in the text (regardless of section)
    if (sources.length === 0) {
        const urlMatches = text.matchAll(/\bhttps?:\/\/[^\s,\]\)\'"<>]{5,}/g);
        for (const m of urlMatches) {
            const url = m[0].replace(/[.,;:!?]+$/, '');
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                if (!sources.find(s => s.url === url)) {
                    sources.push({ url, domain, title: '' });
                }
            } catch {}
        }
    }

    return sources.slice(0, 20);
}

// ── Brand / Competitor Mention Detection ─────────────────────────────────────

function countOccurrences(text, term) {
    if (!text || !term || term.length < 2) return 0;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text.match(new RegExp(escaped, 'gi')) || []).length;
}

const POSITIVE = ['best', 'top', 'leading', 'excellent', 'recommended', 'trusted', 'popular', 'premier', 'outstanding', 'innovative', 'reliable', 'renowned', 'quality', 'professional', 'superior', 'preferred', 'award'];
const NEGATIVE = ['worst', 'bad', 'poor', 'avoid', 'scam', 'complaint', 'issue', 'problem', 'negative', 'decline', 'fail', 'expensive', 'unreliable', 'disappointing', 'mediocre', 'controversial'];

function quickSentiment(text, brandName) {
    const brandLower = brandName.toLowerCase();
    const idx = text.indexOf(brandLower);
    if (idx === -1) return 'neutral';
    const window = text.substring(Math.max(0, idx - 150), Math.min(text.length, idx + brandLower.length + 150));
    let pos = 0, neg = 0;
    POSITIVE.forEach(w => { if (window.includes(w)) pos++; });
    NEGATIVE.forEach(w => { if (window.includes(w)) neg++; });
    if (pos > neg + 1) return 'positive';
    if (neg > pos + 1) return 'negative';
    return 'neutral';
}

function getSnippet(text, term, maxLen = 200) {
    if (!term) return '';
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return '';
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + term.length + maxLen - 60);
    let s = text.substring(start, end).trim();
    if (start > 0) s = '...' + s;
    if (end < text.length) s += '...';
    return s;
}

function getAliases(name, domain) {
    const aliases = new Set();
    if (name) aliases.add(name.toLowerCase());
    if (domain) {
        const d = domain.replace(/^www\./, '').toLowerCase();
        aliases.add(d);
        aliases.add(d.split('.')[0]);
    }
    if (name) {
        const clean = name.toLowerCase().replace(/\b(inc|llc|ltd|corp|co|inc\.|llc\.|ltd\.|corp\.|co\.)\b/g, '').trim();
        if (clean && clean.length > 2) aliases.add(clean);
    }
    return Array.from(aliases).filter(a => a.length > 1);
}

function checkMentions(textLower, aliases) {
    let count = 0, firstPos = -1, snippetTerm = '';
    for (const alias of aliases) {
        if (!alias || alias.length < 2) continue;
        const c = countOccurrences(textLower, alias);
        if (c > 0) {
            count += c;
            const pos = textLower.indexOf(alias);
            if (firstPos === -1 || pos < firstPos) { firstPos = pos; snippetTerm = alias; }
        }
    }
    return { count, firstPos, snippetTerm };
}

// ── Core Shared Parser (works for both text and HTML → text) ─────────────────

function buildRunData(text, sources, brandName, domain, competitors, engine) {
    const textLower = text.toLowerCase();
    const domainClean = (domain || '').replace(/^www\./, '').toLowerCase();
    const competitorDomains = competitors.map(c => typeof c === 'string' ? c : c.domain || '').filter(Boolean);

    const brandAliases = getAliases(brandName, domain);
    const brandMatch = checkMentions(textLower, brandAliases);
    const brandMentioned = brandMatch.count > 0;

    // Build entity list
    const allEntities = [];
    if (brandMentioned) {
        allEntities.push({
            name: brandName, domain,
            mentions: brandMatch.count,
            firstPosition: brandMatch.firstPos,
            sentiment: quickSentiment(textLower, brandName),
            snippet: getSnippet(text, brandMatch.snippetTerm),
            isTargetBrand: true, isCompetitor: false,
        });
    }

    for (const comp of competitors) {
        const name = typeof comp === 'string' ? comp : comp.name || '';
        const cDomain = typeof comp === 'string' ? comp : comp.domain || '';
        if (!name) continue;
        const compAliases = getAliases(name, cDomain);
        const compMatch = checkMentions(textLower, compAliases);
        if (compMatch.count > 0) {
            allEntities.push({
                name, domain: cDomain.replace(/^www\./, ''),
                mentions: compMatch.count,
                firstPosition: compMatch.firstPos,
                sentiment: quickSentiment(textLower, name),
                snippet: getSnippet(text, compMatch.snippetTerm),
                isTargetBrand: false, isCompetitor: true,
            });
        }
    }

    allEntities.sort((a, b) => a.firstPosition - b.firstPosition);
    const entities = allEntities.map((entity, idx) => ({
        ...entity,
        positionRank: idx + 1,
        totalBrandsInResponse: allEntities.length,
    }));

    const brandEntity = entities.find(e => e.isTargetBrand) || null;

    // Build citations from sources
    const citations = sources.slice(0, 15).map((s, idx) => ({
        url: s.url,
        domain: s.domain,
        title: s.title || '',
        citationPosition: idx + 1,
        category: categorizeDomain(s.domain, domainClean, competitorDomains),
        isTargetBrand: domainClean ? s.domain.includes(domainClean.split('.')[0]) : false,
        isCompetitor: competitorDomains.some(cd => s.domain.includes(cd.replace(/^www\./, '').split('.')[0])),
    }));

    const citationStats = {
        total: citations.length,
        byCategory: {},
        brandCited: citations.some(c => c.isTargetBrand),
        competitorsCited: [...new Set(citations.filter(c => c.isCompetitor).map(c => c.domain))],
    };
    for (const c of citations) {
        citationStats.byCategory[c.category] = (citationStats.byCategory[c.category] || 0) + 1;
    }

    return {
        engine,
        brandMentioned,
        brandEntity,
        entities,
        citations,
        citationStats,
        textLength: text.length,
        rawText: text.substring(0, 8000), // cap at 8k chars for storage
    };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main parse function — accepts the output of infaticaService (a {text, sources, html} object)
 * OR raw HTML string (legacy path).
 */
export function parseResponse(infaticaResult, brandName, domain, competitors, engine) {
    // Legacy: caller passed raw HTML string directly
    if (typeof infaticaResult === 'string') {
        return fastParse(infaticaResult, brandName, domain, competitors, engine);
    }

    const { text, sources = [], html } = infaticaResult;

    if (text) {
        // Structured text response from Perplexity/Gemini
        const parsedSources = sources.length > 0 ? sources : extractSourcesFromAIText(text);
        console.log(`[Parser/${engine}] Text: ${text.length} chars, sources: ${parsedSources.length}`);
        return buildRunData(text, parsedSources, brandName, domain, competitors, engine);
    }

    if (html) {
        // HTML scrape (Google AI SERP, or rendered page)
        return fastParse(html, brandName, domain, competitors, engine);
    }

    // Empty response
    console.warn(`[Parser/${engine}] No text or HTML in response`);
    return {
        engine,
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
 * fastParse — HTML scrape parser (used for SERP / rendered pages).
 * Kept for backward compatibility.
 */
export function fastParse(html, brandName, domain, competitors, engine) {
    const text = extractTextFromHtml(html);
    if (!text) {
        return {
            engine,
            brandMentioned: false,
            brandEntity: null,
            entities: [],
            citations: [],
            citationStats: { total: 0, byCategory: {}, brandCited: false, competitorsCited: [] },
            textLength: 0,
            rawText: null,
        };
    }

    const links = extractLinksFromHtml(html);
    const domainClean = (domain || '').replace(/^www\./, '').toLowerCase();
    const competitorDomains = competitors.map(c => typeof c === 'string' ? c : c.domain || '').filter(Boolean);

    // Convert links to sources format
    const sources = links.map(l => ({ url: l.url, domain: l.domain, title: l.text }));

    const runData = buildRunData(text, sources, brandName, domain, competitors, engine);

    // Re-categorize citations with DA info if available
    const citations = links.slice(0, 15).map((l, idx) => ({
        url: l.url,
        domain: l.domain,
        title: l.text,
        citationPosition: idx + 1,
        category: categorizeDomain(l.domain, domainClean, competitorDomains),
        isTargetBrand: domainClean ? l.domain.includes(domainClean.split('.')[0]) : false,
        isCompetitor: competitorDomains.some(cd => l.domain.includes(cd.replace(/^www\./, '').split('.')[0])),
    }));

    return { ...runData, citations };
}

// ── Deep AI Analysis (batch) ──────────────────────────────────────────────────

export async function batchDeepAnalysis(allResults, brandName, domain, competitors) {
    const compNames = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);

    const summary = allResults.map(r => {
        const entNames = (r.entities || []).map(e => `${e.name}(${e.mentions}x,${e.sentiment})`).join(', ');
        const citDomains = [...new Set((r.citations || []).map(c => c.domain))].slice(0, 5).join(', ');
        return `Query: "${r.query}" | Engine: ${r.engine} | Brand mentioned: ${r.brandMentioned} | Entities: [${entNames}] | Citations: [${citDomains}]`;
    }).join('\n');

    const prompt = `You are an AI Visibility strategist. You will receive structured scan data for "${brandName}" (${domain}).
Competitors: ${compNames.join(', ')}

Scan results summary:
${summary}

Produce an executive brief with EXACTLY this JSON format:
{
  "overallAssessment": "1-2 sentence overall assessment of brand's AI visibility",
  "strengthAreas": ["Evidence-backed strength 1", "Evidence-backed strength 2", "Evidence-backed strength 3"],
  "weaknessAreas": ["Evidence-backed vulnerability 1", "Evidence-backed vulnerability 2", "Evidence-backed vulnerability 3"],
  "topOpportunities": [
    "Specific actionable step 1 (High impact)",
    "Specific actionable step 2 (Medium impact)",
    "Specific actionable step 3 (High impact)"
  ],
  "engineInsights": {
    "perplexity": "1 sentence on Perplexity performance",
    "gemini": "1 sentence on Gemini performance",
    "googleAI": "1 sentence on Google AI performance"
  }
}

Return ONLY valid JSON. Make it strategic, data-driven, and highly actionable for a content team.`;

    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        const raw = result.response?.text?.() ?? '';
        const text = raw.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object in response');
        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        console.error('[BatchAnalysis] Failed:', err.message);
        return null;
    }
}
