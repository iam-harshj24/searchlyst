import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

let genAI = null;
function getModel() {
    if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

function extractText(html) {
    if (!html) return '';
    try {
        const $ = cheerio.load(html);
        $('script, style, noscript, svg, img, link, meta').remove();
        return $('body').text().replace(/\s+/g, ' ').trim();
    } catch {
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
}

// Domain categorization for source analysis
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
    
    // Check if it's the brand's own domain
    if (brandD && (d === brandD || d.includes(brandD.split('.')[0]))) return 'owned';
    
    // Check if it's a competitor domain
    for (const comp of competitorDomains) {
        const c = comp.toLowerCase().replace('www.', '');
        if (d === c || d.includes(c.split('.')[0])) return 'competitor';
    }
    
    // Check category patterns
    for (const pattern of DOMAIN_CATEGORIES.forum) {
        if (d.includes(pattern)) return 'forum';
    }
    for (const pattern of DOMAIN_CATEGORIES.social) {
        if (d.includes(pattern)) return 'social';
    }
    for (const pattern of DOMAIN_CATEGORIES.review) {
        if (d.includes(pattern)) return 'review';
    }
    for (const pattern of DOMAIN_CATEGORIES.institutional) {
        if (d.includes(pattern)) return 'institutional';
    }
    for (const pattern of DOMAIN_CATEGORIES.editorial) {
        if (d.includes(pattern)) return 'editorial';
    }
    
    return 'other';
}

function extractLinks(html) {
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

function findPosition(text, term) {
    const idx = text.indexOf(term.toLowerCase());
    if (idx === -1) return -1;
    return idx;
}

function getSnippet(text, term, maxLen = 150) {
    if (!term) return '';
    const idx = text.indexOf(term.toLowerCase());
    if (idx === -1) return '';
    const start = Math.max(0, idx - 50);
    const end = Math.min(text.length, idx + term.length + maxLen - 50);
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
        aliases.add(d.split('.')[0]); // e.g. "searchlyst" from "searchlyst.com"
    }
    if (name) {
        const clean = name.toLowerCase().replace(/\b(inc|llc|ltd|corp|co|inc\.|llc\.|ltd\.|corp\.|co\.)\b/g, '').trim();
        if (clean && clean.length > 2) aliases.add(clean);
    }
    return Array.from(aliases);
}

function checkMentions(textLower, aliases) {
    let count = 0;
    let firstPos = -1;
    let snippetTerm = '';
    
    for (const alias of aliases) {
        if (!alias || alias.length < 2) continue;
        const c = countOccurrences(textLower, alias);
        if (c > 0) {
            count += c;
            const pos = textLower.indexOf(alias);
            if (firstPos === -1 || pos < firstPos) {
                firstPos = pos;
                snippetTerm = alias;
            }
        }
    }
    return { count, firstPos, snippetTerm };
}

export function fastParse(html, brandName, domain, competitors, engine) {
    const text = extractText(html);
    const textLower = text.toLowerCase();
    const links = extractLinks(html);
    const domainClean = domain.replace(/^www\./, '').toLowerCase();
    const competitorDomains = competitors.map(c => typeof c === 'string' ? c : c.domain || '').filter(Boolean);

    const brandAliases = getAliases(brandName, domain);
    const brandMatch = checkMentions(textLower, brandAliases);
    
    const brandMentioned = brandMatch.count > 0;

    // Collect all entities with their first position for ranking
    const allEntities = [];
    
    if (brandMentioned) {
        allEntities.push({
            name: brandName,
            domain,
            mentions: brandMatch.count,
            firstPosition: brandMatch.firstPos,
            sentiment: quickSentiment(textLower, brandName),
            snippet: getSnippet(textLower, brandMatch.snippetTerm),
            isTargetBrand: true,
            isCompetitor: false,
        });
    }

    for (const comp of competitors) {
        const name = (typeof comp === 'string' ? comp : comp.name || '');
        const cDomain = (typeof comp === 'string' ? comp : comp.domain || '');
        if (!name) continue;
        
        const compAliases = getAliases(name, cDomain);
        const compMatch = checkMentions(textLower, compAliases);
        
        if (compMatch.count > 0) {
            allEntities.push({
                name,
                domain: cDomain.replace(/^www\./, ''),
                mentions: compMatch.count,
                firstPosition: compMatch.firstPos,
                sentiment: quickSentiment(textLower, name),
                snippet: getSnippet(textLower, compMatch.snippetTerm),
                isTargetBrand: false,
                isCompetitor: true,
            });
        }
    }

    // Sort entities by first position (earliest first) to determine mention rank
    allEntities.sort((a, b) => a.firstPosition - b.firstPosition);
    
    // Assign position rank (1 = first mentioned, 2 = second mentioned, etc.)
    const entities = allEntities.map((entity, idx) => ({
        ...entity,
        positionRank: idx + 1,  // 1-indexed rank
        totalBrandsInResponse: allEntities.length,
    }));

    // Find the brand entity with its position rank
    const brandEntity = entities.find(e => e.isTargetBrand) || null;

    // Process citations with domain categorization
    const citations = links.slice(0, 15).map((l, idx) => ({
        url: l.url,
        domain: l.domain,
        text: l.text,
        citationPosition: idx + 1,  // 1-indexed position in source list
        category: categorizeDomain(l.domain, domainClean, competitorDomains),
        isTargetBrand: l.domain.includes(domainClean),
        isCompetitor: competitorDomains.some(cd => l.domain.includes(cd.split('.')[0])),
    }));

    // Calculate citation stats by category
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
    };
}

export async function batchDeepAnalysis(allResults, brandName, domain, competitors) {
    const compNames = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);

    const summary = allResults.map(r => {
        const entNames = r.entities.map(e => `${e.name}(${e.mentions}x,${e.sentiment})`).join(', ');
        const citDomains = [...new Set(r.citations.map(c => c.domain))].slice(0, 5).join(', ');
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
        const text = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(text);
    } catch (err) {
        console.error('[BatchAnalysis] Failed:', err.message);
        return null;
    }
}
