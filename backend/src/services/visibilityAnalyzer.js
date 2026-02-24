import * as cheerio from 'cheerio';

const POSITIVE_WORDS = [
    'best', 'top', 'leading', 'excellent', 'great', 'recommended', 'trusted',
    'popular', 'premier', 'outstanding', 'innovative', 'reliable', 'award',
    'renowned', 'reputable', 'quality', 'professional', 'expert', 'superior',
    'favorite', 'preferred', 'exceptional', 'notable', 'distinguished',
];

const NEGATIVE_WORDS = [
    'worst', 'bad', 'poor', 'avoid', 'scam', 'complaint', 'issue', 'problem',
    'negative', 'controversy', 'decline', 'fail', 'expensive', 'overpriced',
    'unreliable', 'disappointing', 'lawsuit', 'fraud', 'terrible', 'mediocre',
];

function extractText(html) {
    if (!html) return '';
    try {
        const $ = cheerio.load(html);
        $('script, style, noscript, svg, img').remove();
        return $('body').text().replace(/\s+/g, ' ').trim().toLowerCase();
    } catch {
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    }
}

function countOccurrences(text, term) {
    if (!text || !term) return 0;
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (text.match(regex) || []).length;
}

function getSentiment(text, brandName) {
    const brandLower = brandName.toLowerCase();
    const idx = text.indexOf(brandLower);
    if (idx === -1) return 'neutral';

    const windowStart = Math.max(0, idx - 200);
    const windowEnd = Math.min(text.length, idx + brandLower.length + 200);
    const context = text.substring(windowStart, windowEnd);

    let posCount = 0;
    let negCount = 0;
    POSITIVE_WORDS.forEach(w => { if (context.includes(w)) posCount++; });
    NEGATIVE_WORDS.forEach(w => { if (context.includes(w)) negCount++; });

    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
}

function getSnippet(text, brandName, maxLen = 200) {
    const brandLower = brandName.toLowerCase();
    const idx = text.indexOf(brandLower);
    if (idx === -1) return '';

    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + brandLower.length + maxLen - 60);
    let snippet = text.substring(start, end).trim();
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    return snippet;
}

function getPosition(text, brandName) {
    const brandLower = brandName.toLowerCase();
    const idx = text.indexOf(brandLower);
    if (idx === -1) return -1;
    const before = text.substring(0, idx);
    return before.split(/[.!?]+/).length;
}

export function analyzePlatformResponse(html, brandName, domain) {
    const text = extractText(html);
    const brandLower = brandName.toLowerCase();
    const domainClean = domain.replace(/^www\./, '').toLowerCase();

    const brandMentions = countOccurrences(text, brandLower);
    const domainMentions = countOccurrences(text, domainClean);
    const totalMentions = brandMentions + domainMentions;
    const mentioned = totalMentions > 0;
    const sentiment = mentioned ? getSentiment(text, brandName) : 'neutral';
    const snippet = mentioned ? getSnippet(text, brandName) || getSnippet(text, domainClean) : '';
    const position = mentioned ? getPosition(text, brandName) : -1;

    return { mentioned, mentions: totalMentions, sentiment, snippet, position };
}

export function analyzeCompetitorInResponse(html, competitorName, competitorDomain) {
    const text = extractText(html);
    const mentions = countOccurrences(text, competitorName.toLowerCase()) +
        countOccurrences(text, competitorDomain.replace(/^www\./, '').toLowerCase());
    return { mentioned: mentions > 0, mentions };
}

export function aggregateResults(queryResults, brandName) {
    const platforms = { perplexity: [], gemini: [], googleAI: [] };
    let totalMentions = 0;
    let sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let totalQueries = queryResults.length;

    queryResults.forEach(qr => {
        for (const [platform, result] of Object.entries(qr.platforms)) {
            if (platforms[platform]) {
                platforms[platform].push(result);
                totalMentions += result.mentions;
                if (result.mentioned) sentimentCounts[result.sentiment]++;
            }
        }
    });

    const calcScore = (results) => {
        if (results.length === 0) return 0;
        const mentioned = results.filter(r => r.mentioned).length;
        return Math.round((mentioned / results.length) * 100);
    };

    const scores = {
        perplexity: calcScore(platforms.perplexity),
        gemini: calcScore(platforms.gemini),
        googleAI: calcScore(platforms.googleAI),
    };
    scores.overall = Math.round((scores.perplexity * 0.35 + scores.gemini * 0.35 + scores.googleAI * 0.3));

    const totalSentimentResponses = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
    const sentiment = totalSentimentResponses > 0 ? {
        positive: Math.round((sentimentCounts.positive / totalSentimentResponses) * 100),
        neutral: Math.round((sentimentCounts.neutral / totalSentimentResponses) * 100),
        negative: Math.round((sentimentCounts.negative / totalSentimentResponses) * 100),
    } : { positive: 0, neutral: 100, negative: 0 };

    return { scores, sentiment, totalMentions, totalQueries };
}
