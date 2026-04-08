import { createHash } from 'crypto';
import { attachGeoBriefsToGaps } from './geoPlaybook.js';

/**
 * Scoring Engine — AI Visibility & Share of Voice
 *
 * Methodology:
 *   1. Visibility Score  = (prompts where brand appeared / total prompts) × 100
 *   2. Share of Voice     = (brand mentions / total mentions across all brands) × 100
 *   3. Position Score     = avg(1/rank) on runs with positionRank, / MAX_RECIPROCAL_RANK → 0-100
 *   4. Sentiment Score    = average of run-level brandEntity sentiment (one vote per engine run where brand appears), same labels as sentiment breakdown, mapped to 0-100
 *   5. AI Presence Index  = Vis×0.30 + SOV×0.30 + Pos×0.20 + Sent×0.20
 */

/**
 * Raw weights mapped to 0–100 via ((avg + 1) / 2) * 100.
 * Used for composite sentiment, SOV rows, and (via getSentimentWeight) per-run competitor sampling.
 * Neutral is slightly above zero so “no opinion” is not a full penalty.
 * Missing keys are not neutral — use getSentimentWeight (0) vs getSentimentBucket (neutral for charts).
 */
const SENTIMENT_VALUES = { positive: 1, neutral: 0.25, negative: -1 };

/** Rank 1 ⇒ reciprocal 1.0 ⇒ 100 after scaling. */
const MAX_RECIPROCAL_RANK = 1.0;

function getSentimentWeight(label) {
    return SENTIMENT_VALUES[label] ?? 0;
}

/** Breakdown / display only: unknown or missing → neutral bucket. */
function getSentimentBucket(label) {
    if (!label || label === 'unknown') return 'neutral';
    if (label === 'positive' || label === 'neutral' || label === 'negative') return label;
    return 'neutral';
}

function humanizeCategory(cat) {
    if (!cat) return '';
    return String(cat).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function computeVisibilityScore(allRunResults, brandName) {
    const totalResults = allRunResults.length;
    if (totalResults === 0) return { overall: 0, components: {}, totalRuns: 0, uniquePrompts: 0, mentionedIn: 0 };

    // 1. AI Visibility Score — binary appearance rate
    const mentionedCount = allRunResults.filter(r => r.brandMentioned).length;
    const visibilityScore = (mentionedCount / totalResults) * 100;

    // 2. AI Share of Voice — brand mentions / total mentions
    let brandMentionCount = 0;
    let totalMentionCount = 0;
    for (const run of allRunResults) {
        for (const entity of (run.entities || [])) {
            const mentions = entity.mentions || 1;
            totalMentionCount += mentions;
            if (entity.isTargetBrand) brandMentionCount += mentions;
        }
    }
    const sovScore = totalMentionCount > 0 ? (brandMentionCount / totalMentionCount) * 100 : 0;

    // 3. Position Score — avg reciprocal rank, scaled by MAX_RECIPROCAL_RANK (rank 1 → 100)
    //    positionRank 1 = mentioned first → reciprocal 1.0 → score 100
    //    positionRank 2 = mentioned second → reciprocal 0.5 → score 50
    //    positionRank 3 → reciprocal 0.33 → score 33, etc.
    let positionWeightedSum = 0;
    let positionCount = 0;
    for (const run of allRunResults) {
        if (!run.brandMentioned) continue;
        // Defensive: ensure positionRank is a positive number (handles string, null, 0, negative)
        const posRank = Number(run.brandEntity?.positionRank);
        if (posRank > 0 && Number.isFinite(posRank)) {
            positionWeightedSum += 1 / posRank;
            positionCount++;
        }
    }
    const avgReciprocalRank = positionCount > 0 ? positionWeightedSum / positionCount : 0;
    const positionScore =
        positionCount > 0
            ? Math.min((avgReciprocalRank / MAX_RECIPROCAL_RANK) * 100, 100)
            : 0;

    // 4. Sentiment Score — one sample per run from brandEntity (same basis as computeSentimentBreakdown + SOV target row)
    let sentimentSum = 0;
    let sentimentCount = 0;
    for (const run of allRunResults) {
        if (run.brandMentioned && run.brandEntity) {
            sentimentSum += getSentimentWeight(run.brandEntity.sentiment);
            sentimentCount += 1;
        }
    }
    const sentimentRaw = sentimentCount > 0 ? sentimentSum / sentimentCount : 0;
    const sentimentScore = Math.min(100, Math.max(0, ((sentimentRaw + 1) / 2) * 100));

    // 5. AI Presence Index (composite)
    const overall = Math.round(
        visibilityScore * 0.30 +
        sovScore * 0.30 +
        positionScore * 0.20 +
        sentimentScore * 0.20
    );

    const uniquePrompts = new Set(allRunResults.map(r => r.promptId)).size;

    return {
        overall: Math.min(100, Math.max(0, overall)),
        components: {
            visibility: Math.round(visibilityScore),
            shareOfVoice: Math.round(sovScore),
            position: Math.round(positionScore),
            sentiment: Math.round(Math.min(100, Math.max(0, sentimentScore))),
        },
        totalRuns: totalResults,
        uniquePrompts,
        mentionedIn: mentionedCount,
    };
}

/** Normalize brand/entity names so "Acme" and "acme" merge for SOV + sentiment. */
function normEntityKey(name) {
    return String(name || '').trim().toLowerCase();
}

function pickDominantEntityForKey(entities, entityKey) {
    const matches = (entities || []).filter((e) => normEntityKey(e.name) === entityKey);
    if (!matches.length) return null;
    return [...matches].sort(
        (a, b) => (b.mentions ?? b.mentionCount ?? 1) - (a.mentions ?? a.mentionCount ?? 1),
    )[0];
}

export function computeShareOfVoice(allRunResults, brandName, competitors, brandDomain) {
    const byKey = {};
    const brandKey = normEntityKey(brandName);

    const touchDisplay = (row, incoming) => {
        const s = String(incoming || '').trim();
        if (!s) return;
        if (!row.displayName || s.length > row.displayName.length) row.displayName = s;
    };

    const ensure = (rawName, defaults = {}) => {
        const k = normEntityKey(rawName);
        if (!k) return null;
        if (!byKey[k]) {
            byKey[k] = {
                displayName: String(rawName || '').trim() || k,
                domain: '',
                mentions: 0,
                totalPosition: 0,
                positionCount: 0,
                sentimentSum: 0,
                isTarget: false,
                ...defaults,
            };
        } else {
            if (defaults.domain && !byKey[k].domain) byKey[k].domain = defaults.domain;
            if (defaults.isTarget) byKey[k].isTarget = true;
        }
        return byKey[k];
    };

    ensure(brandName, {
        domain: (brandDomain || '').replace(/^www\./, ''),
        isTarget: true,
    });

    for (const comp of competitors) {
        const name = typeof comp === 'string' ? comp : comp.name;
        const domain = typeof comp === 'string' ? comp : (comp.domain || '');
        if (!name) continue;
        const row = ensure(name, {
            domain: domain.replace(/^www\./, ''),
            isTarget: false,
        });
        if (row && domain && !row.domain) row.domain = domain.replace(/^www\./, '');
        touchDisplay(row, name);
    }

    for (const run of allRunResults) {
        for (const entity of run.entities || []) {
            const raw = entity.name;
            if (!raw) continue;
            const k = normEntityKey(raw);
            const row = ensure(raw, { isTarget: k === brandKey });
            if (k === brandKey) row.isTarget = true;
            touchDisplay(row, raw);
            if (entity.domain && !row.domain) {
                row.domain = String(entity.domain).replace(/^www\./, '');
            }
            row.mentions += entity.mentions || 1;
            // Defensive: ensure positionRank is a positive number
            const posRank = Number(entity.positionRank);
            if (posRank > 0 && Number.isFinite(posRank)) {
                row.totalPosition += posRank;
                row.positionCount++;
            }
            // Competitor sentiment: one vote per run from dominant entity row (see loop below).
        }
    }

    const brandRowForSentiment = byKey[brandKey];
    if (brandRowForSentiment) {
        let runSentSum = 0;
        let runSentCount = 0;
        for (const run of allRunResults) {
            if (run.brandMentioned && run.brandEntity) {
                runSentSum += getSentimentWeight(run.brandEntity.sentiment);
                runSentCount += 1;
            }
        }
        if (runSentCount > 0) {
            brandRowForSentiment.sentimentSum = runSentSum;
            brandRowForSentiment.sentimentAvgDenominator = runSentCount;
        } else {
            let fs = 0;
            let fm = 0;
            for (const run of allRunResults) {
                for (const entity of run.entities || []) {
                    if (normEntityKey(entity.name) !== brandKey) continue;
                    const w = entity.mentions || 1;
                    fs += getSentimentWeight(entity.sentiment) * w;
                    fm += w;
                }
            }
            if (fm > 0) {
                brandRowForSentiment.sentimentSum = fs;
                brandRowForSentiment.sentimentAvgDenominator = fm;
            }
        }
    }

    // Competitors: one sentiment vote per run (dominant entity row for that key), same mapping as target brand.
    for (const [k, row] of Object.entries(byKey)) {
        if (k === brandKey || row.mentions <= 0) continue;
        let runSentSum = 0;
        let runSentCount = 0;
        for (const run of allRunResults) {
            const entity = pickDominantEntityForKey(run.entities, k);
            if (!entity) continue;
            runSentSum += getSentimentWeight(entity.sentiment);
            runSentCount += 1;
        }
        if (runSentCount > 0) {
            row.sentimentSum = runSentSum;
            row.sentimentAvgDenominator = runSentCount;
        }
    }

    const allScores = Object.values(byKey).filter((e) => e.mentions > 0);
    const totalMentions = allScores.reduce((sum, e) => sum + e.mentions, 0);

    const formatEntity = (e) => {
        let sentimentOut = null;
        if (e.isTarget) {
            const sentDen = e.sentimentAvgDenominator ?? e.mentions;
            sentimentOut =
                sentDen > 0
                    ? Math.min(100, Math.max(0, Math.round(((e.sentimentSum / sentDen + 1) / 2) * 100)))
                    : null;
        } else if (e.sentimentAvgDenominator > 0) {
            sentimentOut = Math.min(
                100,
                Math.max(0, Math.round(((e.sentimentSum / e.sentimentAvgDenominator + 1) / 2) * 100)),
            );
        }
        return {
            name: e.displayName || brandName,
            domain: e.domain || '',
            sov: totalMentions > 0 ? Math.round((e.mentions / totalMentions) * 1000) / 10 : 0,
            mentions: e.mentions,
            avgPosition: e.positionCount > 0
                ? (Math.round((e.totalPosition / e.positionCount) * 10) / 10).toFixed(1)
                : '-',
            sentiment: sentimentOut,
            change: null,
        };
    };

    const brandRow = byKey[brandKey];
    const brandData = brandRow
        ? formatEntity(brandRow)
        : {
              name: brandName,
              domain: '',
              sov: 0,
              mentions: 0,
              avgPosition: '-',
              sentiment: null,
              change: '0.0%',
          };

    if (brandData.sentiment == null && brandData.mentions === 0) {
        brandData.sentiment = null;
    }

    const compResults = allScores
        .filter((e) => !e.isTarget && e.mentions > 0)
        .map(formatEntity)
        .sort((a, b) => b.sov - a.sov);

    return { brand: brandData, competitors: compResults, total: totalMentions };
}

export function computePerEngine(allRunResults) {
    const engines = {};
    for (const run of allRunResults) {
        if (!engines[run.engine]) engines[run.engine] = { mentioned: 0, total: 0 };
        engines[run.engine].total++;
        if (run.brandMentioned) engines[run.engine].mentioned++;
    }

    const result = {};
    for (const [engine, data] of Object.entries(engines)) {
        result[engine] = {
            score: data.total > 0 ? Math.round((data.mentioned / data.total) * 100) : 0,
            runs: data.total,
            mentions: data.mentioned,
        };
    }
    return result;
}

export function computePerCategory(allRunResults) {
    const categories = {};
    for (const run of allRunResults) {
        const cat = run.category || 'uncategorized';
        if (!categories[cat]) categories[cat] = { mentioned: 0, total: 0 };
        categories[cat].total++;
        if (run.brandMentioned) categories[cat].mentioned++;
    }

    return Object.fromEntries(
        Object.entries(categories).map(([cat, data]) => [
            cat,
            {
                ...data,
                score: data.total > 0 ? Math.round((data.mentioned / data.total) * 100) : 0,
            },
        ])
    );
}

export function computeQueryTracking(allRunResults, brandName) {
    const byQuery = {};
    for (const run of allRunResults) {
        const key = run.promptId ?? run.query;
        if (!byQuery[key]) {
            byQuery[key] = {
                queryId: run.promptId,
                query: run.query,
                category: run.category,
                date: new Date().toISOString().split('T')[0],
                engines: {},
                location: 'US',
            };
        }

        // Defensive: ensure positionRank is stored as a positive number
        const posRank = Number(run.brandEntity?.positionRank);
        byQuery[key].engines[run.engine] = {
            mentioned: run.brandMentioned,
            positionRank: (posRank > 0 && Number.isFinite(posRank)) ? posRank : null,
            sentiment: run.brandEntity?.sentiment || 'n/a',
            citations: run.citations?.length || 0,
            brandCited: run.citationStats?.brandCited || false,
        };
    }

    return Object.values(byQuery).map(q => {
        const engineList = Object.values(q.engines);
        const mentionedCount = engineList.filter(e => e.mentioned).length;
        const totalEngines = engineList.length;

        // Filter and convert positions to ensure valid numbers
        const positions = engineList
            .map(e => Number(e.positionRank))
            .filter(n => n > 0 && Number.isFinite(n));
        const avgPosition = positions.length > 0
            ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1)
            : 'N/A';

        const withLabel = engineList.filter((e) =>
            e.sentiment && ['positive', 'neutral', 'negative'].includes(e.sentiment),
        );
        const totalL = withLabel.length;
        let positiveRate = 0;
        let neutralRate = 0;
        let negativeRate = 0;
        let sentimentScore = null;
        if (totalL > 0) {
            positiveRate = withLabel.filter((s) => s.sentiment === 'positive').length / totalL;
            neutralRate = withLabel.filter((s) => s.sentiment === 'neutral').length / totalL;
            negativeRate = withLabel.filter((s) => s.sentiment === 'negative').length / totalL;
            sentimentScore = Math.round(positiveRate * 100 + neutralRate * 62.5 + negativeRate * 12);
        }

        const totalCitations = engineList.reduce((sum, e) => sum + e.citations, 0);

        return {
            ...q,
            mentionedIn: `${mentionedCount}/${totalEngines}`,
            avgPosition,
            sentimentScore,
            sentimentPositivePct: totalL > 0 ? Math.round(positiveRate * 100) : null,
            sentimentNeutralPct: totalL > 0 ? Math.round(neutralRate * 100) : null,
            sentimentNegativePct: totalL > 0 ? Math.round(negativeRate * 100) : null,
            totalCitations,
        };
    });
}

export function computeSourceDomains(allRunResults) {
    const domainStats = {};

    for (const run of allRunResults) {
        for (const citation of (run.citations || [])) {
            const domain = citation.domain;
            if (!domainStats[domain]) {
                domainStats[domain] = {
                    domain,
                    category: citation.category || 'other',
                    count: 0,
                    uniqueUrls: new Set(),
                    engines: new Set(),
                    isTargetBrand: citation.isTargetBrand,
                    isCompetitor: citation.isCompetitor,
                };
            }
            domainStats[domain].count++;
            domainStats[domain].uniqueUrls.add(citation.url);
            domainStats[domain].engines.add(run.engine);
        }
    }

    const domains = Object.values(domainStats)
        .map(d => ({
            domain: d.domain,
            category: d.category,
            count: d.count,
            uniqueUrls: d.uniqueUrls.size,
            engines: Array.from(d.engines),
            isTargetBrand: d.isTargetBrand,
            isCompetitor: d.isCompetitor,
        }))
        .sort((a, b) => b.count - a.count);

    const byCategory = {};
    for (const d of domains) {
        byCategory[d.category] = (byCategory[d.category] || 0) + d.count;
    }

    return {
        topDomains: domains.slice(0, 20),
        byCategory,
        totalCitations: domains.reduce((sum, d) => sum + d.count, 0),
    };
}

function mergeCompetitorAgg(map, name, domainHint) {
    if (!name) return;
    const dom = String(domainHint || '')
        .replace(/^www\./, '')
        .split('/')[0]
        .toLowerCase();
    const prev = map[name];
    if (!prev) {
        map[name] = { count: 1, domain: dom || '' };
    } else if (typeof prev === 'number') {
        map[name] = { count: prev + 1, domain: dom || '' };
    } else {
        map[name] = {
            count: prev.count + 1,
            domain: prev.domain || dom || '',
        };
    }
}

function citationHost(d) {
    return String(d || '')
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .toLowerCase();
}

/**
 * Top competitor-flagged citations on a single run (for GEO “their URL” signals).
 */
function topCompetitorCitationsForRun(run) {
    const urlMap = new Map();
    for (const c of run.citations || []) {
        if (!c?.isCompetitor || c.isTargetBrand) continue;
        const url = String(c.url || '').trim();
        if (!url) continue;
        const prev = urlMap.get(url) || {
            count: 0,
            title: c.title || '',
            domain: c.domain || '',
            names: new Set(),
        };
        prev.count += 1;
        if (c.title && !prev.title) prev.title = c.title;
        if (c.domain && !prev.domain) prev.domain = c.domain;
        urlMap.set(url, prev);
    }
    const compEntities = (run.entities || []).filter((e) => e.isCompetitor && !e.isTargetBrand);
    for (const v of urlMap.values()) {
        const host = citationHost(v.domain);
        for (const e of compEntities) {
            const eh = citationHost(e.domain);
            if (eh && host && (host === eh || host.endsWith(`.${eh}`))) {
                v.names.add(e.name);
            }
        }
    }
    return [...urlMap.entries()]
        .map(([url, v]) => ({
            url,
            title: v.title,
            domain: v.domain,
            count: v.count,
            matchedCompetitorName: v.names.size ? [...v.names][0] : null,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

function gapIdStable(promptKey, competitorNames) {
    const tail = [...competitorNames].sort().join('|').slice(0, 200);
    return createHash('sha256')
        .update(`${String(promptKey)}::${tail}`)
        .digest('hex')
        .slice(0, 16);
}

/**
 * Competitor gaps: prompts where the brand is never mentioned but at least one competitor is.
 * Enriched with per-engine mention + citation signals and a template GEO brief for content teams.
 */
export function computeCompetitorGap(allRunResults, brandName, competitors) {
    const byQuery = {};
    for (const run of allRunResults) {
        const key = run.promptId ?? run.query;
        const engine = run.engine || 'unknown';
        if (!byQuery[key]) {
            byQuery[key] = {
                promptId: run.promptId ?? null,
                query: run.query,
                category: run.category || null,
                intent: run.intent || null,
                brandMentioned: false,
                competitors: {},
                perEngine: {},
            };
        }

        if (run.brandMentioned) byQuery[key].brandMentioned = true;
        if (!byQuery[key].category && run.category) byQuery[key].category = run.category;
        if (!byQuery[key].intent && run.intent) byQuery[key].intent = run.intent;

        if (!byQuery[key].perEngine[engine]) {
            byQuery[key].perEngine[engine] = {
                brandMentioned: false,
                competitors: {},
                topCompetitorCitations: [],
            };
        }
        const pe = byQuery[key].perEngine[engine];
        if (run.brandMentioned) pe.brandMentioned = true;

        for (const entity of run.entities || []) {
            if (entity.isCompetitor && !entity.isTargetBrand) {
                const n = entity.name;
                if (!n) continue;
                mergeCompetitorAgg(byQuery[key].competitors, n, entity.domain);
                mergeCompetitorAgg(pe.competitors, n, entity.domain);
            }
        }

        const cites = topCompetitorCitationsForRun(run);
        if (cites.length) {
            const merged = new Map();
            for (const x of pe.topCompetitorCitations || []) merged.set(x.url, { ...x });
            for (const x of cites) {
                const prev = merged.get(x.url);
                if (!prev) merged.set(x.url, { ...x });
                else merged.set(x.url, { ...prev, count: prev.count + x.count });
            }
            pe.topCompetitorCitations = [...merged.values()].sort((a, b) => b.count - a.count).slice(0, 5);
        }
    }

    const brandCitedSet = new Set();
    for (const r of allRunResults) {
        const pk = r.promptId ?? r.query;
        if ((r.citations || []).some((c) => c.isTargetBrand)) {
            brandCitedSet.add(`${String(pk)}@@@${r.engine || 'unknown'}`);
        }
    }

    const waveOrder = ['gemini', 'perplexity', 'googleAI', 'chatgpt'];
    const sortEngines = (a, b) => {
        const ia = waveOrder.indexOf(a);
        const ib = waveOrder.indexOf(b);
        if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    };

    const gaps = Object.values(byQuery)
        .filter((q) => !q.brandMentioned && Object.keys(q.competitors).length > 0)
        .map((q) => {
            const pkey = q.promptId ?? q.query;
            const sorted = Object.entries(q.competitors)
                .map(([name, val]) => {
                    if (typeof val === 'number') return { name, count: val, domain: '' };
                    return { name, count: val.count, domain: val.domain || '' };
                })
                .sort((a, b) => b.count - a.count);
            const topNames = sorted.slice(0, 3).map((c) => c.name).filter(Boolean);
            const catLabel = humanizeCategory(q.category);
            const shortQuery = q.query.length > 140 ? `${q.query.slice(0, 137)}…` : q.query;
            const topicHead = catLabel || 'AI answer visibility';
            const contentTopic = `${topicHead}: ${shortQuery}`;
            const leadComp = topNames[0] || 'competitors';
            const also = topNames.length > 1 ? ` (also ${topNames.slice(1).join(', ')})` : '';

            const byEngine = {};
            const enginesLost = [];
            for (const [eng, row] of Object.entries(q.perEngine || {})) {
                const compSorted = Object.entries(row.competitors || {})
                    .map(([name, val]) => {
                        if (typeof val === 'number') return { name, count: val, domain: '' };
                        return { name, count: val.count, domain: val.domain || '' };
                    })
                    .sort((a, b) => b.count - a.count);
                const brandCited = brandCitedSet.has(`${String(pkey)}@@@${eng}`);
                const hasCompetitorSignal =
                    compSorted.length > 0 || (row.topCompetitorCitations || []).length > 0;
                const mentionGap = hasCompetitorSignal && !row.brandMentioned;
                if (mentionGap && eng !== 'unknown') enginesLost.push(eng);

                byEngine[eng] = {
                    brandMentioned: row.brandMentioned,
                    mentionGap,
                    brandCited,
                    competitorsPresent: compSorted,
                    topCompetitorCitations: row.topCompetitorCitations || [],
                };
            }

            const enginesAffected = [...new Set(enginesLost)].sort(sortEngines);

            const leadEngineHint =
                enginesAffected.find((e) => waveOrder.includes(e)) ||
                enginesAffected[0] ||
                'perplexity';
            const platformLabel =
                {
                    gemini: 'Gemini',
                    perplexity: 'Perplexity',
                    googleAI: 'Google AI Overview',
                    chatgpt: 'ChatGPT',
                }[leadEngineHint] || 'AI platforms';

            const contentAngle = `Out-structure ${leadComp}${also} on ${platformLabel} first: direct-answer lede, platform-appropriate schema, and proof (stats or comparison) so models can cite ${brandName || 'your brand'} alongside them.`;

            const gapId = gapIdStable(pkey, sorted.map((c) => c.name));

            return {
                gapId,
                promptId: q.promptId,
                query: q.query,
                category: q.category,
                intent: q.intent,
                contentTopic,
                contentAngle,
                competitorsPresent: sorted,
                opportunity: 'high',
                enginesAffected,
                byEngine,
            };
        })
        .sort((a, b) => b.competitorsPresent.length - a.competitorsPresent.length);

    return attachGeoBriefsToGaps(gaps, brandName);
}

/**
 * Counts engine-runs (brandMentioned + brandEntity) into display buckets via getSentimentBucket.
 * Composite / SOV use getSentimentWeight on the raw label (missing → 0, not neutral’s 0.25).
 */
export function computeSentimentBreakdown(allRunResults) {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    let total = 0;
    let weightSum = 0;

    for (const run of allRunResults) {
        if (run.brandMentioned && run.brandEntity) {
            const bucket = getSentimentBucket(run.brandEntity.sentiment);
            counts[bucket] += 1;
            total++;
            weightSum += getSentimentWeight(run.brandEntity.sentiment);
        }
    }

    const sentimentIndex =
        total > 0 ? Math.round(((weightSum / total + 1) / 2) * 1000) / 10 : null;

    return {
        detailed: counts,
        summary: {
            positive: total > 0 ? Math.round((counts.positive / total) * 100) : 0,
            neutral: total > 0 ? Math.round((counts.neutral / total) * 100) : 100,
            negative: total > 0 ? Math.round((counts.negative / total) * 100) : 0,
            rawCounts: {
                positive: counts.positive,
                neutral: counts.neutral,
                negative: counts.negative,
            },
            /** 0–100 weighted index: positive=+1, neutral=+0.25, negative=−1 → ((avg+1)/2)×100 */
            sentimentIndex,
        },
        total,
    };
}

/** SOV-sorted entity list (legacy / analytics). */
export function computeIndustryRanking(allRunResults, brandName, competitors, brandDomain) {
    const sov = computeShareOfVoice(allRunResults, brandName, competitors, brandDomain);

    const allEntities = [sov.brand, ...sov.competitors]
        .filter(e => e.mentions > 0)
        .sort((a, b) => b.sov - a.sov)
        .map((e, idx) => ({
            rank: idx + 1,
            ...e,
            isTargetBrand: e.name === brandName,
        }));

    return allEntities;
}

/**
 * Prompt-coverage ranking — how many distinct prompts each brand appears in (AI visibility breadth).
 * Sentiment per brand: one vote per prompt×engine run (dominant entity row per normalized name per run),
 * weighted mean (+1 / +0.25 / −1) → sentimentIndex 0–100 with one decimal; exact pos/neu/neg counts included.
 * @param {Array} previousRunResults optional prior scan runs — when set, sentimentTrendPct = current index − prior index (same brand key).
 */
export function computeIndustryPresenceRanking(allRunResults, brandName, previousRunResults = null) {
    const promptKeys = [...new Set(allRunResults.map(r => r.promptId ?? r.query))];
    const totalPrompts = Math.max(promptKeys.length, 1);
    /** @type {Map<string, { name: string, domain: string, prompts: Set, mentions: number, totalPosition: number, positionCount: number, sentimentSum: number, sentimentN: number, sentimentCounts: { positive: number, neutral: number, negative: number } }>} */
    const byNorm = new Map();

    function rowForEntity(entity) {
        const displayName = String(entity.name || '').trim();
        if (!displayName) return null;
        const nk = normEntityKey(displayName);
        if (!byNorm.has(nk)) {
            byNorm.set(nk, {
                name: displayName,
                domain: (entity.domain || '').replace(/^www\./, ''),
                prompts: new Set(),
                mentions: 0,
                totalPosition: 0,
                positionCount: 0,
                sentimentSum: 0,
                sentimentN: 0,
                sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
            });
        }
        return byNorm.get(nk);
    }

    for (const run of allRunResults) {
        const pKey = run.promptId ?? run.query;
        const runBest = new Map();
        for (const entity of run.entities || []) {
            const nm = entity.name;
            if (!nm) continue;
            const nk = normEntityKey(nm);
            const prev = runBest.get(nk);
            const m = entity.mentions || 1;
            if (!prev || m > (prev.mentions || 1)) runBest.set(nk, entity);
        }
        for (const entity of runBest.values()) {
            const row = rowForEntity(entity);
            if (!row) continue;
            row.prompts.add(pKey);
            row.mentions += entity.mentions || 1;
            // Defensive: ensure positionRank is a positive number
            const posRank = Number(entity.positionRank);
            if (posRank > 0 && Number.isFinite(posRank)) {
                row.totalPosition += posRank;
                row.positionCount++;
            }
            if (entity.domain && !row.domain) {
                row.domain = entity.domain.replace(/^www\./, '');
            }
            row.sentimentSum += getSentimentWeight(entity.sentiment);
            row.sentimentN += 1;
            const b = getSentimentBucket(entity.sentiment);
            row.sentimentCounts[b] += 1;
        }
    }

    const rows = [...byNorm.values()]
        .filter(e => e.mentions > 0)
        .map(e => {
            const sn = e.sentimentN;
            const rawAvg = sn > 0 ? e.sentimentSum / sn : 0;
            const sentimentIndex = sn > 0 ? Math.round(((rawAvg + 1) / 2) * 1000) / 10 : null;
            const { positive: pc, neutral: nc, negative: ngc } = e.sentimentCounts;
            const tot = pc + nc + ngc;
            return {
                name: e.name,
                domain: e.domain || '',
                mentions: e.mentions,
                avgPosition: e.positionCount > 0
                    ? (Math.round((e.totalPosition / e.positionCount) * 10) / 10).toFixed(1)
                    : '-',
                promptCoverage: Math.round((e.prompts.size / totalPrompts) * 1000) / 10,
                promptsReached: e.prompts.size,
                totalPrompts,
                isTargetBrand: normEntityKey(e.name) === normEntityKey(brandName),
                sentimentIndex,
                sentimentN: sn,
                sentimentCounts: { positive: pc, neutral: nc, negative: ngc },
                sentimentPct:
                    tot > 0
                        ? {
                              positive: Math.round((pc / tot) * 1000) / 10,
                              neutral: Math.round((nc / tot) * 1000) / 10,
                              negative: Math.round((ngc / tot) * 1000) / 10,
                          }
                        : { positive: 0, neutral: 0, negative: 0 },
            };
        })
        .sort((a, b) => b.promptCoverage - a.promptCoverage || b.mentions - a.mentions)
        .map((row, idx) => ({ rank: idx + 1, ...row }));

    if (previousRunResults?.length) {
        const prevRows = computeIndustryPresenceRanking(previousRunResults, brandName, null);
        const prevMapIdx = new Map(prevRows.map((r) => [normEntityKey(r.name), r.sentimentIndex]));
        const prevMapCov = new Map(prevRows.map((r) => [normEntityKey(r.name), r.promptCoverage]));
        for (const r of rows) {
            const key = normEntityKey(r.name);
            const prevIdx = prevMapIdx.get(key);
            if (r.sentimentIndex != null && prevIdx != null) {
                r.sentimentTrendPct = Math.round((r.sentimentIndex - prevIdx) * 10) / 10;
            } else {
                r.sentimentTrendPct = null;
            }

            const prevCov = prevMapCov.has(key) ? Number(prevMapCov.get(key)) || 0 : 0;
            const currCov = Number(r.promptCoverage) || 0;
            if (prevCov > 0) {
                r.effortTrendPct = Math.round(((currCov - prevCov) / prevCov) * 1000) / 10;
                r.effortTrendNew = false;
            } else if (prevCov === 0 && currCov > 0) {
                r.effortTrendPct = null;
                r.effortTrendNew = true;
            } else if (prevCov > 0 && currCov === 0) {
                r.effortTrendPct = -100;
                r.effortTrendNew = false;
            } else {
                r.effortTrendPct = null;
                r.effortTrendNew = false;
            }
        }
    } else {
        for (const r of rows) {
            r.sentimentTrendPct = null;
            r.effortTrendPct = null;
            r.effortTrendNew = false;
        }
    }

    return rows;
}

/** Rank all unique URLs across all runs by frequency. */
export function computeUrlRanking(allRunResults) {
    const urlStats = {};

    for (const run of allRunResults) {
        const runCategory = run.category || 'other';
        const querySample = (run.query || '').trim().slice(0, 220);
        for (const citation of (run.citations || [])) {
            const url = citation.url;
            if (!url) continue;
            if (!urlStats[url]) {
                urlStats[url] = {
                    url,
                    domain: citation.domain || '',
                    title: citation.title || '',
                    category: citation.category || 'other',
                    isTargetBrand: citation.isTargetBrand || false,
                    isCompetitor: citation.isCompetitor || false,
                    count: 0,
                    engines: new Set(),
                    prompts: new Set(),
                    byPromptCategory: {},
                    sampleQueries: new Set(),
                };
            }
            urlStats[url].count++;
            urlStats[url].engines.add(run.engine);
            if (run.promptId) urlStats[url].prompts.add(run.promptId);
            if (!urlStats[url].title && citation.title) urlStats[url].title = citation.title;
            const pc = urlStats[url].byPromptCategory;
            pc[runCategory] = (pc[runCategory] || 0) + 1;
            if (querySample) urlStats[url].sampleQueries.add(querySample);
        }
    }

    const urls = Object.values(urlStats)
        .map((u) => {
            const entries = Object.entries(u.byPromptCategory || {});
            const dominant = entries.sort((a, b) => b[1] - a[1])[0];
            const category = dominant?.[0] || u.category || 'other';
            return {
                url: u.url,
                domain: u.domain,
                title: u.title,
                category,
                byPromptCategory: u.byPromptCategory || {},
                sampleQueries: [...u.sampleQueries].slice(0, 4),
                isTargetBrand: u.isTargetBrand,
                isCompetitor: u.isCompetitor,
                count: u.count,
                engines: Array.from(u.engines),
                promptCount: u.prompts.size,
            };
        })
        .sort((a, b) => b.count - a.count);

    return {
        urls,
        totalUrls: urls.length,
        totalMentions: urls.reduce((s, u) => s + u.count, 0),
    };
}
