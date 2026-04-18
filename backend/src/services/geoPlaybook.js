/**
 * GEO playbook — platform-specific guidance attached to competitor gaps.
 * Templates only; no live fetches. Safe to call on every scan.
 */

export const ENGINE_DISPLAY = {
    perplexity: 'Perplexity',
    gemini: 'Gemini',
    chatgpt: 'ChatGPT',
    googleAI: 'Google AI Overview',
};

/** Default production order: ship Gemini-shaped pages first, then Perplexity, AIO, ChatGPT crawl cadence last */
export const PRODUCTION_WAVE = ['gemini', 'perplexity', 'googleAI', 'chatgpt'];

const PLATFORM_HINTS = {
    perplexity: {
        focus: 'Cited statistics, primary sources, dense factual sentences, fresh publish dates.',
        format: 'Title as definitive claim; ≤40-word direct answer opening; stat blocks every ~150–200 words; 4–6 tight bullets per section; Article + FAQ schema.',
        killMove: 'Answer the exact query in sentence 1; add 3+ concrete statistics the competitor page lacks; refresh on a 60–90 day cadence.',
    },
    chatgpt: {
        focus: 'Comprehensive how-to, question-shaped H2/H3s, comparison tables, visible “Last updated”.',
        format: '1,500–2,500 word guide; named comparison table; conversational authority; 3–5 internal links.',
        killMove: 'Add a comparison table + direct-answer lede; explicitly allow GPTBot where appropriate.',
    },
    gemini: {
        focus: 'Brand-owned pages, schema stack, entity consistency (site + listings).',
        format: 'Lead (2–3 sentences) → definition → key facts → comparison → FAQ; Organization + Article + FAQPage + BreadcrumbList.',
        killMove: 'Dedicated topic landing with full schema—not a thin blog post—when a competitor’s entity page is winning.',
    },
    googleAI: {
        focus: 'Snippet-ready answers, FAQ/HowTo schema, E-E-A-T, pages Google already trusts.',
        format: 'Answer in first 1–2 sentences (~≤160 chars ideal); 6–10 FAQs with FAQPage; HowTo for procedural intents.',
        killMove: 'Mirror the competitor’s cited sub-question but with a tighter, more direct FAQ answer.',
    },
};

function normHost(d) {
    return String(d || '')
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .toLowerCase();
}

/**
 * @param {object} gap - enriched row from computeCompetitorGap
 * @param {string} brandName
 */
export function buildGeoBriefForGap(gap, brandName) {
    const known = new Set(PRODUCTION_WAVE);
    const rawAffected = Array.isArray(gap.enginesAffected) ? gap.enginesAffected.filter((e) => known.has(e)) : [];
    const engines =
        rawAffected.length > 0
            ? [...rawAffected].sort((a, b) => PRODUCTION_WAVE.indexOf(a) - PRODUCTION_WAVE.indexOf(b))
            : [...PRODUCTION_WAVE];

    const leadComp = gap.competitorsPresent?.[0]?.name || 'Competitors';
    const urls = [];
    const byE = gap.byEngine || {};
    for (const eng of engines) {
        const cites = byE[eng]?.topCompetitorCitations || [];
        for (const c of cites.slice(0, 2)) {
            urls.push({
                engine: eng,
                url: c.url,
                title: c.title || '',
                competitor: c.matchedCompetitorName || leadComp,
                citationCount: c.count,
            });
        }
    }
    const primaryUrl = urls[0];

    const formats = [];
    if (engines.includes('googleAI')) formats.push('FAQ / snippet-led page');
    if (engines.includes('gemini')) formats.push('Structured landing + schema stack');
    if (engines.includes('perplexity')) formats.push('Data-forward article');
    if (engines.includes('chatgpt')) formats.push('Long-form comparison guide');

    const mustInclude = [];
    for (const eng of engines) {
        const h = PLATFORM_HINTS[eng];
        if (h) mustInclude.push(`${ENGINE_DISPLAY[eng]}: ${h.focus}`);
    }

    const schemaTypes = [];
    schemaTypes.push('Article', 'FAQPage');
    if (engines.includes('googleAI')) schemaTypes.push('HowTo (if procedural)');
    if (engines.includes('gemini')) {
        schemaTypes.push('Organization', 'BreadcrumbList');
    }

    const bots = ['Googlebot'];
    if (engines.includes('chatgpt')) bots.push('GPTBot');
    if (engines.includes('perplexity')) bots.push('Perplexity crawler (check current bot name in provider docs)');

    const brand = brandName || 'Your brand';

    return {
        targetPlatforms: engines.map((e) => ENGINE_DISPLAY[e] || e),
        productionWaveOrder: engines.map((e) => ENGINE_DISPLAY[e] || e),
        queryCluster: gap.query,
        primaryCompetitor: leadComp,
        competitorCitedUrls: urls.slice(0, 8),
        primaryCompetitorUrl: primaryUrl?.url || null,
        contentFormat: formats.length ? formats.join(' · ') : 'Guide / landing page',
        openingSentenceRule: 'Answer the user query directly in sentence 1 (≤30–40 words, no preamble).',
        mustIncludeElements: mustInclude,
        wordCountTarget: 'Aim to beat the cited page length (~+20% once you check their page).',
        schemaToImplement: [...new Set(schemaTypes)],
        robotsAllow: bots,
        successMetric: `Next scan: you’re cited or mentioned on ${engines.map((e) => ENGINE_DISPLAY[e] || e).join(', ')} for this prompt (~60 days).`,
        prioritizedActions: engines.map((eng, i) => ({
            step: i + 1,
            platform: ENGINE_DISPLAY[eng] || eng,
            wave: i + 1,
            playbook: PLATFORM_HINTS[eng]?.killMove || '',
        })),
    };
}

/**
 * @param {Array<object>} gaps
 * @param {string} brandName
 */
export function attachGeoBriefsToGaps(gaps, brandName) {
    if (!Array.isArray(gaps)) return [];
    return gaps.map((g) => ({
        ...g,
        geoBrief: buildGeoBriefForGap(g, brandName),
    }));
}

/**
 * Heatmap: competitor name → engine → count of gaps where that engine saw that competitor (mentions).
 * @param {Array<object>} gaps - enriched competitor gaps
 */
export function buildGapHeatmapMatrix(gaps) {
    const matrix = {}; // competitor -> { engine -> count }
    const engines = [...PRODUCTION_WAVE];

    for (const g of gaps || []) {
        const byE = g.byEngine || {};
        for (const eng of engines) {
            const row = byE[eng];
            if (!row?.competitorsPresent?.length) continue;
            for (const c of row.competitorsPresent) {
                const name = String(c.name || '').trim();
                if (!name) continue;
                if (!matrix[name]) matrix[name] = Object.fromEntries(engines.map((e) => [e, 0]));
                matrix[name][eng] = (matrix[name][eng] || 0) + 1;
            }
        }
    }

    const competitors = Object.keys(matrix).sort((a, b) => {
        const sa = engines.reduce((s, e) => s + (matrix[a][e] || 0), 0);
        const sb = engines.reduce((s, e) => s + (matrix[b][e] || 0), 0);
        return sb - sa;
    });

    return { engines, competitors, matrix };
}
