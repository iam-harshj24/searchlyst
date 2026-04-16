import { normalizeTrackingLocations } from '../utils/marketRegion.js';

/**
 * Visibility prompt matrix (20 prompts).
 * Core text is fixed; only {placeholders} are substituted — no extra instructions appended.
 */

function fillVariables(promptTemplate, vars) {
    let result = promptTemplate;
    for (const [key, value] of Object.entries(vars)) {
        result = result.split(`{${key}}`).join(value);
    }
    return result;
}

export async function generatePromptMatrixForPlatform(brand, platform) {
    return generateSuperPrompts(brand, platform);
}

export async function generatePromptMatrix(brand) {
    return generateSuperPrompts(brand, 'general');
}

export function generateSuperPrompts(brand, platform = 'general') {
    void platform;
    const {
        industry,
        competitors = [],
        location: locationRaw,
        trackingLocations,
        language: langRaw,
        companySize: companySizeRaw,
        reach: reachRaw,
        isAgency: isAgencyRaw,
    } = brand;

    const tracked = normalizeTrackingLocations(trackingLocations);
    const compList = competitors
        .map(c => (typeof c === 'string' ? c : c.name))
        .filter(Boolean);
    const compStr = compList.length > 0 ? compList.join(', ') : 'leading competitors';

    const locDisplay = String(locationRaw || '').trim() || (tracked[0] || '') || 'your region';
    const reachDisplay = String(reachRaw || '').trim() || (locDisplay.toLowerCase() === 'global' ? 'worldwide' : 'regional');

    const vars = {
        INDUSTRY: (industry || 'the industry').trim(),
        COMPANY_SIZE: String(companySizeRaw || 'mid-market').trim(),
        REACH: reachDisplay,
        LANGUAGE: String(langRaw || 'English').trim(),
        LOCATION: locDisplay,
        COMPETITORS: compStr,
        IS_AGENCY_PREP: isAgencyRaw === true ? 'an agency' : 'a brand',
    };

    const templates = [
        {
            id: 'P1',
            category: 'ranking',
            intent: 'market_leadership_top10',
            weight: 1.7,
            includesBrand: false,
            text: 'What are the top 10 most popular and highly-rated solutions in the {INDUSTRY} industry right now? Please list them in order of market leadership.',
        },
        {
            id: 'P2',
            category: 'ranking',
            intent: 'company_size_top5',
            weight: 1.7,
            includesBrand: false,
            text: 'For a {COMPANY_SIZE} company looking for providers in the {INDUSTRY} sector, how would you rank the top 5 available options from best to worst?',
        },
        {
            id: 'P3',
            category: 'ranking',
            intent: 'tier_leaders_reach',
            weight: 1.6,
            includesBrand: false,
            text: 'Which brands are considered the top-tier leaders in the {INDUSTRY} market for a {REACH} audience? Rank the top 5.',
        },
        {
            id: 'P4',
            category: 'ranking',
            intent: 'established_players',
            weight: 1.6,
            includesBrand: false,
            text: 'List the top 5 most established players in the {INDUSTRY} space. Which of these holds the strongest market position?',
        },
        {
            id: 'P5',
            category: 'share_of_voice',
            intent: 'mentioned_recommended_language',
            weight: 1.7,
            includesBrand: false,
            text: 'What are the most frequently mentioned and recommended {INDUSTRY} brands in professional {LANGUAGE}-speaking communities today?',
        },
        {
            id: 'P6',
            category: 'share_of_voice',
            intent: 'location_search_prominence',
            weight: 1.6,
            includesBrand: false,
            text: 'When buyers in {LOCATION} search for {INDUSTRY} services, which 5 brand names appear most prominently in search results and recommendations?',
        },
        {
            id: 'P7',
            category: 'share_of_voice',
            intent: 'social_forums_attention',
            weight: 1.5,
            includesBrand: false,
            text: 'Who are the dominant players capturing the most attention in the {INDUSTRY} conversation on social media and industry forums?',
        },
        {
            id: 'P8',
            category: 'share_of_voice',
            intent: 'alternatives_to_competitors',
            weight: 1.6,
            includesBrand: false,
            text: 'If a customer is looking for alternatives to {COMPETITORS}, what are the top 3 other providers they should consider? List them in order of relevance.',
        },
        {
            id: 'P9',
            category: 'competitor_tracking',
            intent: 'strengths_weaknesses_named',
            weight: 1.6,
            includesBrand: false,
            text: 'What are the primary strengths and weaknesses of the leading competitors in the {INDUSTRY} space, specifically {COMPETITORS}?',
        },
        {
            id: 'P10',
            category: 'competitor_tracking',
            intent: 'differentiation_uvp',
            weight: 1.5,
            includesBrand: false,
            text: 'How do the market leaders in {INDUSTRY} differentiate themselves from the competition? What is the unique value proposition of the top players?',
        },
        {
            id: 'P11',
            category: 'competitor_tracking',
            intent: 'choose_competitor_over_leader',
            weight: 1.4,
            includesBrand: false,
            text: 'What are the main reasons a customer might choose a competitor over the market leader in the {INDUSTRY} sector?',
        },
        {
            id: 'P12',
            category: 'competitor_tracking',
            intent: 'features_pricing_company_size',
            weight: 1.5,
            includesBrand: false,
            text: 'Compare the feature sets and pricing models of the top providers in {INDUSTRY}. Which ones offer the best value for a {COMPANY_SIZE} business?',
        },
        {
            id: 'P13',
            category: 'geo_location',
            intent: 'leaders_within_region',
            weight: 1.5,
            includesBrand: false,
            text: 'Which {INDUSTRY} providers are considered the market leaders specifically within the {LOCATION} region?',
        },
        {
            id: 'P14',
            category: 'geo_location',
            intent: 'local_vs_global',
            weight: 1.4,
            includesBrand: false,
            text: 'Are there any local {INDUSTRY} companies in {LOCATION} that outperform global competitors in terms of reputation and service?',
        },
        {
            id: 'P15',
            category: 'geo_location',
            intent: 'reach_level_top3',
            weight: 1.5,
            includesBrand: false,
            text: 'For a business operating at a {REACH} level in {LOCATION}, which are the top 3 most relevant service providers?',
        },
        {
            id: 'P16',
            category: 'geo_location',
            intent: 'local_vs_global_landscape',
            weight: 1.4,
            includesBrand: false,
            text: 'How does the competitive landscape for {INDUSTRY} differ between {LOCATION} and the global market?',
        },
        {
            id: 'P17',
            category: 'trust_sentiment',
            intent: 'trust_reputation',
            weight: 1.5,
            includesBrand: false,
            text: 'Which {INDUSTRY} providers have the best reputation for trustworthiness, reliability, and ethical business practices?',
        },
        {
            id: 'P18',
            category: 'trust_sentiment',
            intent: 'complaints_pain_points',
            weight: 1.4,
            includesBrand: false,
            text: 'What are the most common customer complaints or pain points associated with the leading {INDUSTRY} providers?',
        },
        {
            id: 'P19',
            category: 'trust_sentiment',
            intent: 'satisfaction_company_size',
            weight: 1.5,
            includesBrand: false,
            text: 'Based on recent user reviews, which {INDUSTRY} brands have the highest customer satisfaction scores for {COMPANY_SIZE} businesses?',
        },
        {
            id: 'P20',
            category: 'trust_sentiment',
            intent: 'recommended_for_agency_or_brand',
            weight: 1.4,
            includesBrand: false,
            text: 'Who are the top 3 most recommended {INDUSTRY} providers for {IS_AGENCY_PREP} focusing on long-term partnerships?',
        },
    ];

    return templates.map((t) => ({
        id: t.id,
        core: fillVariables(t.text, vars),
        intent: t.intent,
        category: t.category,
        includesBrand: t.includesBrand,
        strategicValue: 10,
        weight: t.weight,
    }));
}

/** @param {object|string} brandOrName — full brand object, or legacy brandName string */
export function generateFallbackPrompts(brandOrName, domain, industry, competitors, location, trackingLocations) {
    if (brandOrName && typeof brandOrName === 'object') {
        return generateSuperPrompts(brandOrName);
    }
    return generateSuperPrompts({
        brandName: brandOrName,
        domain,
        industry,
        competitors,
        location,
        trackingLocations,
    });
}
