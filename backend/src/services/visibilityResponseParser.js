/**
 * Parse one-shot visibility responses: answer + inline citations + sources.
 */

const SECTION_HEADERS = [
    '### FULL CITED ANSWER', '### COMPETITIVE RANKING', '### MENTION QUALITY ANALYSIS',
    '### SOV ANALYSIS WITH FULL CITATIONS', '### ANSWER', '### MENTION QUALITY ANALYSIS'
];
const SCORECARD_HEADERS = [
    '### VISIBILITY SCORECARD', '### RANKING TABLE', '### MENTION QUALITY SCORECARD',
    '### CITATION-BACKED SCORECARD', '### SOV TABLE (citation-backed only)'
];
const SOURCES_HEADERS = ['### SOURCES', '### SOURCES USED', '### ALL SOURCES USED', '### COMPLETE SOURCE LIST'];
const GAPS_HEADERS = ['### ACTIONABLE GAPS', '### NOT FOUND', '### WHAT THE SOURCES TELL US', '### WHAT THE SOURCES REVEAL'];

export function extractSection(text, header) {
    if (!text) return null;
    const idx = text.indexOf(header);
    if (idx === -1) return null;
    const start = idx + header.length;
    let end = text.length;
    const nextH3 = text.slice(start).match(/\n###\s+/);
    if (nextH3) end = start + nextH3.index;
    return text.slice(start, end).trim();
}

export function extractSectionAny(text, headers) {
    for (const h of headers) {
        const s = extractSection(text, h);
        if (s) return s;
    }
    return null;
}

export function extractInlineCitations(text) {
    const citations = [];
    const claimPattern = /([^[]+)(\[\d+(?:\s*,\s*\d+)*\])/g;
    const numPattern = /\[(\d+)\]/g;
    let m;
    while ((m = claimPattern.exec(text)) !== null) {
        const claim = m[1].trim();
        const nums = [];
        let nm;
        const numStr = m[2];
        while ((nm = /\d+/.exec(numStr)) !== null) {
            nums.push(parseInt(nm[0], 10));
            numStr = numStr.slice(nm.index + nm[0].length);
        }
        if (claim.length > 5) {
            citations.push({ citation_numbers: [...new Set(nums)], claim });
        }
    }
    return citations;
}

export function extractSourcesList(text) {
    const sourcesSection = extractSectionAny(text, SOURCES_HEADERS);
    if (!sourcesSection) return [];
    const sources = [];
    const lineRegex = /\[(\d+)\]\s*(https?:\/\/[^\s|—\n]+)(?:\s*[|—]\s*([^\n]*))?/gi;
    let m;
    while ((m = lineRegex.exec(sourcesSection)) !== null) {
        const url = m[2].trim();
        let domain = '';
        try {
            domain = new URL(url).hostname.replace(/^www\./, '');
        } catch {}
        sources.push({
            number: parseInt(m[1], 10),
            url,
            domain,
            title: (m[3] || '').trim().slice(0, 200),
            tier: classifySourceTier(domain),
            covers_brand: 'unknown',
        });
    }
    return sources;
}

export function classifySourceTier(domain) {
    if (!domain) return 3;
    const d = domain.toLowerCase();
    const gold = ['g2.com', 'capterra.com', 'gartner.com', 'forrester.com', 'techcrunch.com', 'forbes.com', 'producthunt.com'];
    const silver = ['reddit.com', 'linkedin.com', 'trustpilot.com', 'hackernews.com', 'medium.com'];
    if (gold.some(g => d.includes(g))) return 1;
    if (silver.some(s => d.includes(s))) return 2;
    return 3;
}

export function extractTable(text, header) {
    const section = extractSection(text, header);
    if (!section) return null;
    const lines = section.split('\n').filter(l => l.includes('|'));
    if (lines.length < 2) return null;
    const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split('|').map(c => c.trim()).filter((_, idx) => idx > 0 && idx < headers.length + 1);
        if (cells.length >= headers.length) {
            const row = {};
            headers.forEach((h, j) => { row[h] = cells[j] || ''; });
            rows.push(row);
        }
    }
    return { headers, rows };
}

export function extractTableAny(text, headers) {
    for (const h of headers) {
        const t = extractTable(text, h);
        if (t && t.rows?.length > 0) return t;
    }
    return null;
}

export function countMentions(text, brandName) {
    if (!text || !brandName) return 0;
    const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text.match(new RegExp(escaped, 'gi')) || []).length;
}

export function calculateCitationScore(text, brandName, sources) {
    const srcs = sources || extractSourcesList(text);
    const brandSources = srcs.filter(s =>
        s.url?.toLowerCase().includes(brandName?.toLowerCase().replace(/\s/g, '')) ||
        s.title?.toLowerCase().includes(brandName?.toLowerCase())
    );
    const goldCount = brandSources.filter(s => s.tier === 1).length;
    const silverCount = brandSources.filter(s => s.tier === 2).length;
    const base = goldCount * 3 + silverCount * 2 + (brandSources.length - goldCount - silverCount);
    return Math.min(10, Math.round((base / 5) * 10) / 10);
}

export function parseAIResponse(rawResponse, engine, brandName) {
    const sources = extractSourcesList(rawResponse);
    const answer = extractSectionAny(rawResponse, SECTION_HEADERS);
    const scorecard = extractTableAny(rawResponse, SCORECARD_HEADERS);
    const gaps = extractSectionAny(rawResponse, GAPS_HEADERS);
    const inlineCitations = extractInlineCitations(rawResponse || '');

    return {
        engine,
        tested_at: new Date().toISOString(),
        answer: answer || rawResponse?.slice(0, 2000),
        inline_citations: inlineCitations,
        sources,
        scorecard: scorecard?.rows || [],
        gaps,
        brand_summary: {
            name: brandName,
            mentioned: (rawResponse || '').toLowerCase().includes((brandName || '').toLowerCase()),
            mention_count: countMentions(rawResponse, brandName),
            sources_citing_brand: sources.filter(s => s.covers_brand === brandName || s.covers_brand === 'both'),
            citation_backed_score: calculateCitationScore(rawResponse, brandName, sources),
        },
    };
}
