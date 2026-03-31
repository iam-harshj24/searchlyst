/**
 * Scoring Engine — AI Visibility & Share of Voice
 *
 * Methodology:
 *   1. Visibility Score  = (prompts where brand appeared / total prompts) × 100
 *   2. Share of Voice     = (brand mentions / total mentions across all brands) × 100
 *   3. Position Score     = Σ(1/rank) / total appearances, normalized to 0-100
 *   4. Sentiment Score    = mention-type weighted average, normalized to 0-100
 *   5. AI Presence Index  = Vis×0.30 + SOV×0.30 + Pos×0.20 + Sent×0.20
 */

const SENTIMENT_VALUES = { positive: 1, neutral: 0, negative: -1 };

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

    // 3. Position Score — weighted 1/rank, normalized to 0-100
    let positionWeightedSum = 0;
    let positionCount = 0;
    for (const run of allRunResults) {
        if (run.brandMentioned && run.brandEntity?.positionRank) {
            positionWeightedSum += 1 / run.brandEntity.positionRank;
            positionCount++;
        }
    }
    const positionScore = positionCount > 0 ? (positionWeightedSum / positionCount) * 100 : 0;

    // 4. Sentiment Score — map to [-1,+1], normalize to [0,100]
    let sentimentSum = 0;
    let sentimentCount = 0;
    for (const run of allRunResults) {
        if (run.brandMentioned && run.brandEntity) {
            sentimentSum += SENTIMENT_VALUES[run.brandEntity.sentiment] ?? 0;
            sentimentCount++;
        }
    }
    const sentimentRaw = sentimentCount > 0 ? sentimentSum / sentimentCount : 0;
    const sentimentScore = ((sentimentRaw + 1) / 2) * 100;

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
            sentiment: Math.round(sentimentScore),
        },
        totalRuns: totalResults,
        uniquePrompts,
        mentionedIn: mentionedCount,
    };
}

export function computeShareOfVoice(allRunResults, brandName, competitors, brandDomain) {
    const entityScores = {};

    entityScores[brandName] = {
        name: brandName,
        domain: (brandDomain || '').replace(/^www\./, ''),
        mentions: 0,
        totalPosition: 0,
        positionCount: 0,
        sentimentSum: 0,
        isTarget: true,
    };

    for (const comp of competitors) {
        const name = typeof comp === 'string' ? comp : comp.name;
        const domain = typeof comp === 'string' ? comp : (comp.domain || '');
        if (name && !entityScores[name]) {
            entityScores[name] = {
                name,
                domain: domain.replace(/^www\./, ''),
                mentions: 0,
                totalPosition: 0,
                positionCount: 0,
                sentimentSum: 0,
                isTarget: false,
            };
        }
    }

    for (const run of allRunResults) {
        for (const entity of (run.entities || [])) {
            const name = entity.name;
            if (!entityScores[name]) {
                entityScores[name] = {
                    name,
                    domain: (entity.domain || '').replace(/^www\./, ''),
                    mentions: 0,
                    totalPosition: 0,
                    positionCount: 0,
                    sentimentSum: 0,
                    isTarget: false,
                };
            }
            if (entity.domain && !entityScores[name].domain) {
                entityScores[name].domain = entity.domain.replace(/^www\./, '');
            }
            const score = entityScores[name];
            score.mentions += entity.mentions || 1;
            if (entity.positionRank) {
                score.totalPosition += entity.positionRank;
                score.positionCount++;
            }
            score.sentimentSum += SENTIMENT_VALUES[entity.sentiment] ?? 0;
        }
    }

    const allScores = Object.values(entityScores).filter(e => e.mentions > 0);
    const totalMentions = allScores.reduce((sum, e) => sum + e.mentions, 0);

    const formatEntity = (e) => ({
        name: e.name,
        domain: e.domain || '',
        sov: totalMentions > 0 ? Math.round((e.mentions / totalMentions) * 1000) / 10 : 0,
        mentions: e.mentions,
        avgPosition: e.positionCount > 0
            ? (Math.round((e.totalPosition / e.positionCount) * 10) / 10).toFixed(1)
            : '-',
        sentiment: e.mentions > 0
            ? Math.round(((e.sentimentSum / e.mentions + 1) / 2) * 100)
            : 50,
        change: null,
    });

    const brandData = entityScores[brandName]
        ? formatEntity(entityScores[brandName])
        : { name: brandName, domain: '', sov: 0, mentions: 0, avgPosition: '-', sentiment: 50, change: '0.0%' };

    const compResults = allScores
        .filter(e => !e.isTarget && e.mentions > 0)
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

        byQuery[key].engines[run.engine] = {
            mentioned: run.brandMentioned,
            positionRank: run.brandEntity?.positionRank || null,
            sentiment: run.brandEntity?.sentiment || 'n/a',
            citations: run.citations?.length || 0,
            brandCited: run.citationStats?.brandCited || false,
        };
    }

    return Object.values(byQuery).map(q => {
        const engineList = Object.values(q.engines);
        const mentionedCount = engineList.filter(e => e.mentioned).length;
        const totalEngines = engineList.length;

        const positions = engineList.filter(e => e.positionRank).map(e => e.positionRank);
        const avgPosition = positions.length > 0
            ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1)
            : 'N/A';

        const sentiments = engineList.filter(e => e.sentiment && e.sentiment !== 'n/a');
        const positiveSentiments = sentiments.filter(s => s.sentiment === 'positive').length;
        const sentimentScore = sentiments.length > 0
            ? Math.round((positiveSentiments / sentiments.length) * 100)
            : null;

        const totalCitations = engineList.reduce((sum, e) => sum + e.citations, 0);

        return {
            ...q,
            mentionedIn: `${mentionedCount}/${totalEngines}`,
            avgPosition,
            sentimentScore,
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

export function computeCompetitorGap(allRunResults, brandName, competitors) {
    const byQuery = {};
    for (const run of allRunResults) {
        const key = run.promptId ?? run.query;
        if (!byQuery[key]) byQuery[key] = { query: run.query, brandMentioned: false, competitors: {} };

        if (run.brandMentioned) byQuery[key].brandMentioned = true;

        for (const entity of (run.entities || [])) {
            if (entity.isCompetitor && !entity.isTargetBrand) {
                byQuery[key].competitors[entity.name] = (byQuery[key].competitors[entity.name] || 0) + 1;
            }
        }
    }

    const gaps = Object.values(byQuery)
        .filter(q => !q.brandMentioned && Object.keys(q.competitors).length > 0)
        .map(q => ({
            query: q.query,
            competitorsPresent: Object.entries(q.competitors)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            opportunity: 'high',
        }))
        .sort((a, b) => b.competitorsPresent.length - a.competitorsPresent.length);

    return gaps;
}

export function computeSentimentBreakdown(allRunResults) {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    let total = 0;

    for (const run of allRunResults) {
        if (run.brandMentioned && run.brandEntity) {
            const sent = run.brandEntity.sentiment || 'neutral';
            counts[sent] = (counts[sent] || 0) + 1;
            total++;
        }
    }

    return {
        detailed: counts,
        summary: {
            positive: total > 0 ? Math.round((counts.positive / total) * 100) : 0,
            neutral: total > 0 ? Math.round((counts.neutral / total) * 100) : 100,
            negative: total > 0 ? Math.round((counts.negative / total) * 100) : 0,
        },
        total,
    };
}

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

/** Rank all unique URLs across all runs by frequency. */
export function computeUrlRanking(allRunResults) {
    const urlStats = {};

    for (const run of allRunResults) {
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
                };
            }
            urlStats[url].count++;
            urlStats[url].engines.add(run.engine);
            if (run.promptId) urlStats[url].prompts.add(run.promptId);
            if (!urlStats[url].title && citation.title) urlStats[url].title = citation.title;
        }
    }

    const urls = Object.values(urlStats)
        .map(u => ({
            url: u.url,
            domain: u.domain,
            title: u.title,
            category: u.category,
            isTargetBrand: u.isTargetBrand,
            isCompetitor: u.isCompetitor,
            count: u.count,
            engines: Array.from(u.engines),
            promptCount: u.prompts.size,
        }))
        .sort((a, b) => b.count - a.count);

    return {
        urls,
        totalUrls: urls.length,
        totalMentions: urls.reduce((s, u) => s + u.count, 0),
    };
}
