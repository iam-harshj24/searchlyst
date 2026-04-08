import { normalizeTrackingLocations } from '../utils/marketRegion.js';

/**
 * Super-20 Prompt Matrix — multi-dimensional visibility extraction framework.
 *
 * Every prompt is designed to extract 6 dimensions per brand:
 *   Visibility · Ranking · Sentiment · Sources · Geo · Citations
 *
 * Layers:
 *   1 – Visibility   (P01–P03)  organic, brand knowledge, conversational intent
 *   2 – Ranking       (P04–P06)  competitive tier, head-to-head, forced scorecard
 *   3 – Share of Voice (P07–P09)  SOV, segment ownership, use-case visibility
 *   4 – Geo + Context (P10–P12)  geo visibility, multi-turn persistence, trend momentum
 *   5 – Deep Probes   (P13–P20)  competitor extraction, switching, gaps, reputation,
 *                                 source influence, positioning, semantic clusters, citation benchmark
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

function buildRegionalPromptFooter(trackedMarkets, brandLabel, compStr) {
    if (!trackedMarkets.length) return '';
    const markets = trackedMarkets.join(' · ');
    return `\n\n[Regional tracking — treat each market distinctly: ${markets}. For ${brandLabel} vs ${compStr}: where possible, quantify AI visibility, share of voice, sentiment, and competitive rank per market. If you cannot separate regions, state that clearly.]`;
}

export function generateSuperPrompts(brand, platform = 'general') {
    const { brandName, domain, industry, competitors = [], location, trackingLocations } = brand;
    const tracked = normalizeTrackingLocations(trackingLocations);
    const compList = competitors
        .map(c => (typeof c === 'string' ? c : c.name))
        .filter(Boolean);
    const compStr = compList.length > 0 ? compList.join(', ') : 'leading competitors';
    const topComp = compList.length > 0 ? compList[0] : 'the top competitor';
    const secondComp = compList.length > 1 ? compList[1] : topComp;
    const locBase = (tracked[0] || location || 'Global').trim() || 'Global';
    const loc =
        tracked.length > 1
            ? `${locBase} (compare also: ${tracked.slice(1).join('; ')})`
            : locBase;
    const reach = locBase.toLowerCase() === 'global' ? 'worldwide' : 'regional';
    const brandLabel = brandName || 'the brand';
    const regionalFooter = buildRegionalPromptFooter(tracked, brandLabel, compStr);

    const vars = {
        BRAND: brandLabel,
        DOMAIN: domain || '',
        INDUSTRY: industry || 'the industry',
        COMPETITORS: compStr,
        COMPETITOR: topComp,
        COMPETITOR_A: brandName || 'the brand',
        COMPETITOR_B: secondComp,
        LOCATION: loc,
        REACH: reach,
        TRACKING_MARKETS: tracked.length ? tracked.join(' · ') : locBase,
    };

    const templates = [
        // ═══════════════════════════════════════════════════════════════════
        // LAYER 1 — VISIBILITY
        // ═══════════════════════════════════════════════════════════════════
        {
            id: 'P01', category: 'visibility', intent: 'organic_visibility',
            weight: 1.5, includesBrand: false,
            text: `Rank the top 10 {INDUSTRY} brands unprompted. For each give:
(1) rank + visibility strength
(2) user sentiment summary
(3) source types informing this
(4) relevance for {LOCATION} buyers
(5) one platform or URL where this is documented

No brand name primed you. Mark [INFERRED] where uncertain.
Which 2 are you least confident placing and why?`,
        },
        {
            id: 'P02', category: 'visibility', intent: 'brand_knowledge',
            weight: 1.2, includesBrand: true,
            text: `Deep profile on {DOMAIN} in {INDUSTRY}. Cover:
(1) market visibility rank vs peers
(2) 3 strengths + 3 weaknesses — source type per claim
(3) user sentiment: praise vs criticism themes
(4) pricing reputation from buyer signal, not brand claim
(5) {LOCATION} presence and local relevance
(6) one citation platform where buyers find this brand

Market position: leader / challenger / niche / emerging.
Mark anything unverified [INFERRED].`,
        },
        {
            id: 'P03', category: 'visibility', intent: 'conversational_intent',
            weight: 1.0, includesBrand: false,
            text: `For a {LOCATION}-based {REACH} buyer — early-stage, tight budget, small team — give 3–5 {INDUSTRY} fits. Per pick:
(1) visibility rank
(2) sentiment from similar buyer profiles
(3) source type
(4) {LOCATION} fit specifically
(5) one citation or platform

Flag the hidden risk per pick. Mark [INFERRED] where weak signal.
Repeat for: (B) premium mid-size buyer. (C) technical/customisation-focused buyer.`,
        },

        // ═══════════════════════════════════════════════════════════════════
        // LAYER 2 — RANKING
        // ═══════════════════════════════════════════════════════════════════
        {
            id: 'P04', category: 'ranking', intent: 'competitive_tier',
            weight: 1.8, includesBrand: false,
            text: `Sort all significant {INDUSTRY} players into 4 tiers: Leaders / Strong Performers / Contenders / Niche-Emerging. Per brand:
(1) specific reason for tier placement — not reputation
(2) user sentiment signal
(3) source type
(4) {LOCATION} adjustment if global rank differs locally
(5) one citation where this placement is evidenced

Who nearly moved tiers? Who is actively shifting?
Buyer context: {REACH} in {LOCATION}. Mark uncertain placements [LOW CONFIDENCE].`,
        },
        {
            id: 'P05', category: 'ranking', intent: 'head_to_head',
            weight: 1.5, includesBrand: true,
            text: `Compare {COMPETITOR_A} vs {COMPETITOR_B} for {REACH} buyers in {LOCATION}. Per dimension — quality, onboarding, pricing, reliability, geo fit, scalability, support:
(1) winner — no ties
(2) specific reason
(3) sentiment signal from users
(4) source type
(5) {LOCATION} relevance

End with one overall recommendation — pick one, defend it with specific reasons.
No hedging.`,
        },
        {
            id: 'P06', category: 'ranking', intent: 'forced_scorecard',
            weight: 2.0, includesBrand: false,
            text: `Rank {COMPETITORS} 1st to last — no ties — on: quality, onboarding, pricing/value, reliability, market trust, innovation, {LOCATION} presence, {REACH} fit. Per rank:
(1) specific justification
(2) user sentiment signal
(3) source type
(4) confidence: H / M / L

Finish with: overall winner, best value pick, first-timer recommendation.
Flag where your signal is weakest across the group.`,
        },

        // ═══════════════════════════════════════════════════════════════════
        // LAYER 3 — SHARE OF VOICE
        // ═══════════════════════════════════════════════════════════════════
        {
            id: 'P07', category: 'share_of_voice', intent: 'share_of_voice',
            weight: 1.8, includesBrand: false,
            text: `List every {INDUSTRY} brand — dominant to obscure. Per brand:
(1) visibility strength: strong / moderate / weak / trace
(2) primary signal context: reviews / analyst / news / community
(3) user sentiment direction
(4) {LOCATION} presence
(5) one citation platform

Flag adjacent brands considered for {INDUSTRY} but not pure players.
Which 3 brands dominate your training signal disproportionately — earned dominance or just content volume?`,
        },
        {
            id: 'P08', category: 'share_of_voice', intent: 'segment_ownership',
            weight: 1.5, includesBrand: false,
            text: `One brand per row — no ties. Best for: early-stage / mid-size growth / enterprise / budget / non-technical / {LOCATION} buyers / {REACH} scale / overall value. Per winner:
(1) specific reason
(2) sentiment signal
(3) source type
(4) {LOCATION} fit
(5) confidence: H / M / L

Then complete: "Early-stage avoid [Brand] because [specific reason]." — repeat for enterprise / budget / non-US/EU buyers.`,
        },
        {
            id: 'P09', category: 'share_of_voice', intent: 'use_case_visibility',
            weight: 1.5, includesBrand: false,
            text: `One winner per use case in {INDUSTRY} — don't distribute artificially:
Highest quality / fastest start / best value / multi-country {REACH} / {LOCATION} local support / most trusted / most customisable / best support / best for growth.

Per answer:
(1) specific reason
(2) sentiment signal
(3) source type
(4) {LOCATION} relevance
(5) confidence: H / M / L`,
        },

        // ═══════════════════════════════════════════════════════════════════
        // LAYER 4 — GEO + CONTEXT
        // ═══════════════════════════════════════════════════════════════════
        {
            id: 'P10', category: 'geo_context', intent: 'geo_visibility',
            weight: 1.3, includesBrand: false,
            text: `Top 5 {INDUSTRY} options specifically for {LOCATION} buyers. Per brand:
(1) local visibility rank
(2) local user sentiment
(3) source types with {LOCATION} signal
(4) real local presence vs just technically available
(5) one citation proving {LOCATION} relevance

Flag global brands that underperform locally.
Are there {LOCATION}-native brands overlooked globally?
Where is your {LOCATION} signal weakest?`,
        },
        {
            id: 'P11', category: 'geo_context', intent: 'multi_turn_persistence',
            weight: 1.2, includesBrand: false,
            text: `Answer these 4 questions about {INDUSTRY} in sequence:

T1: "Best {INDUSTRY} options for a first-time buyer?"

T2: "Which of those still fit a fast-growing org needing long-term credibility?"

T3: "Which suit a {REACH} operation in {LOCATION} specifically?"

T4: "Pick one from your top two. Specific reasons only — no hedging. What filtering logic did you apply each turn?"

Record: survivor brand, T4 winner, filtering criteria per turn.`,
        },
        {
            id: 'P12', category: 'geo_context', intent: 'trend_momentum',
            weight: 1.3, includesBrand: false,
            text: `For each of {COMPETITORS}, rate momentum: rising / stable / declining. Per brand:
(1) specific signal driving the rating
(2) user sentiment trajectory
(3) source type
(4) {LOCATION} structural impact
(5) one citation

Who made the most notable recent move?
Who leads in 3 years — name one assumption that must hold.
Where is your momentum data most likely outdated?`,
        },

        // ═══════════════════════════════════════════════════════════════════
        // LAYER 5 — DEEP PROBES
        // ═══════════════════════════════════════════════════════════════════
        {
            id: 'P13', category: 'deep_probe', intent: 'competitor_extraction',
            weight: 1.5, includesBrand: false,
            text: `Map every {INDUSTRY} competitor across 7 angles: direct / indirect / {LOCATION}-regional / budget-free / premium-enterprise / emerging last 2–3 years / no-vendor DIY. Per brand:
(1) category
(2) sentiment signal
(3) source type
(4) {LOCATION} relevance
(5) one citation

For {COMPETITORS} specifically: which category fits them and where do they face no competition?`,
        },
        {
            id: 'P14', category: 'deep_probe', intent: 'alternatives_switching',
            weight: 1.3, includesBrand: false,
            text: `I'm switching from {COMPETITORS} in {INDUSTRY}. I'm a {REACH} operation in {LOCATION}. Per alternative:
(1) visibility vs {COMPETITORS}
(2) what it does better — specific capability
(3) what I lose — honest assessment
(4) transition complexity: simple / moderate / complex
(5) local availability in {LOCATION}
(6) sentiment from actual switchers
(7) source type + one citation

Which alternatives disappoint post-switch despite frequent mention?`,
        },
        {
            id: 'P15', category: 'deep_probe', intent: 'competitive_gap',
            weight: 1.8, includesBrand: false,
            text: `For {COMPETITORS} in {INDUSTRY}:
(1) which brand has the single most defensible advantage — name the specific capability
(2) per brand: one distinct capability it beats all others at — no repeats
(3) per brand: one specific weakness vs this group
(4) sentiment signal per gap
(5) source type
(6) is there a capability gap none of them fills?

Mark [INFERRED] where unverified.`,
        },
        {
            id: 'P16', category: 'deep_probe', intent: 'reputation_sentiment',
            weight: 1.5, includesBrand: false,
            text: `For each of {COMPETITORS}:
(1) consistent praise themes — source type + signal strength
(2) consistent criticism themes — source type + signal strength
(3) documented controversies — name specific incidents, not general reputation
(4) trust perception in {LOCATION} specifically
(5) one citation URL per brand

Who has the largest gap between public positioning and actual user sentiment?
Who is most polarised — praised by some, harshly criticised by others?`,
        },
        {
            id: 'P17', category: 'deep_probe', intent: 'source_influence',
            weight: 1.2, includesBrand: false,
            text: `Where do {INDUSTRY} buyers research? Top 3 per category:
(1) review platforms
(2) analyst reports and publications
(3) communities and forums
(4) video and multimedia
(5) brand thought leadership worth reading

Per source: which brands appear most + earned or paid prominence + sentiment bias + {LOCATION} relevance + one URL.
Which 3 give the most unbiased signal?
Any {LOCATION}-specific sources global rankings miss?`,
        },
        {
            id: 'P18', category: 'deep_probe', intent: 'positioning_validation',
            weight: 1.5, includesBrand: false,
            text: `For {COMPETITORS}, rate each leadership claim: strongly credible / partially credible / weak. Per brand:
(1) specific evidence — not assertion
(2) user sentiment on their leadership claim
(3) source type
(4) credibility specifically for {LOCATION} buyers
(5) one citation

Who holds the most defensible claim overall?
Per non-leader: one specific change to become credible.
Is there unclaimed positioning territory in {INDUSTRY}?`,
        },
        {
            id: 'P19', category: 'deep_probe', intent: 'semantic_cluster_gap',
            weight: 1.5, includesBrand: false,
            text: `For each of {COMPETITORS}, list 15 association words: capabilities, sentiment signals, buyer types, risk markers. Then:
(1) words across all brands — category noise, not differentiators
(2) words owned by one brand only — differentiation assets
(3) high-value {INDUSTRY} terms no brand owns — white space
(4) {LOCATION}-specific associations missing from all brands
(5) per brand: 3 concepts to urgently claim`,
        },
        {
            id: 'P20', category: 'deep_probe', intent: 'citation_benchmark',
            weight: 1.5, includesBrand: false,
            text: `In {INDUSTRY}, name which brand holds each role:
(1) gold standard — who defines best-in-class
(2) value benchmark — who defines good value
(3) cautionary example — specific incident, not general reputation
(4) evaluation baseline — "compare everything against X"

Per role: brand + specific reason + sentiment signal + source type + one citation URL.
For each of {COMPETITORS}: do they hold a role? If not, what specifically earns them one?`,
        },
    ];

    return templates.map((t) => ({
        id: t.id,
        core: fillVariables(t.text, vars) + regionalFooter,
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
