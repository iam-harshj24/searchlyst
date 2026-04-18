/** Labels aligned with backend `geoPlaybook.js` */
export const ENGINE_LABELS = {
    gemini: 'Gemini',
    perplexity: 'Perplexity',
    googleAI: 'Google AI Overview',
    chatgpt: 'ChatGPT',
};

export const HEATMAP_ENGINE_ORDER = ['gemini', 'perplexity', 'googleAI', 'chatgpt'];

/**
 * Client-side heatmap when API did not attach `gapHeatmap` (older cached scans).
 * @param {Array<object>} gaps
 */
export function buildGapHeatmapFromGaps(gaps) {
    const engines = [...HEATMAP_ENGINE_ORDER];
    const matrix = {};

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

/** Prefer server-built heatmap when present. */
export function heatmapFromScan(scanData) {
    const gh = scanData?.gapHeatmap;
    if (gh?.competitors?.length && Array.isArray(gh.engines)) return gh;
    return buildGapHeatmapFromGaps(scanData?.competitorGaps || []);
}
