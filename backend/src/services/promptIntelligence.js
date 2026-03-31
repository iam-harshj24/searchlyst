// Super 20 Compressed Prompts — exact user-specified templates with weights

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
    const { brandName, domain, industry, competitors = [], location } = brand;
    const compList = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
    const compStr = compList.length > 0 ? compList.join(', ') : 'leading competitors';
    const topComp = compList.length > 0 ? compList[0] : 'the top competitor';
    const loc = location || 'Global';
    const reach = loc.toLowerCase() === 'global' ? 'worldwide' : 'regional';

    const vars = {
        BRAND: brandName || 'the brand',
        DOMAIN: domain || '',
        INDUSTRY: industry || 'the industry',
        COMPETITORS: compStr,
        COMPETITOR: topComp,
        COMPETITOR_A: brandName || 'the brand',
        COMPETITOR_B: topComp,
        LOCATION: loc,
        REACH: reach,
    };

    const templates = [
        // Layer 1 — Visibility
        {
            id: 'P01', category: 'visibility', intent: 'organic_visibility',
            weight: 1.5, includesBrand: false,
            text: `I'm researching {INDUSTRY} options with no names in mind yet. Give me a ranked top 10 right now. For each: what it does best, worst, who it suits, and whether it's affordable or expensive relative to peers. Include all major names.`,
        },
        {
            id: 'P02', category: 'visibility', intent: 'brand_knowledge',
            weight: 1.2, includesBrand: true,
            text: `I'm researching several {INDUSTRY} options and want a deep profile on one in particular: {DOMAIN}. Tell me what they offer, who their typical customer is, what they do well, what they do poorly, how they compare in the {INDUSTRY} space, their pricing reputation, and their market position — dominant leader, strong challenger, niche specialist, or emerging name? Be thorough and honest. Flag uncertainty.`,
        },
        {
            id: 'P03', category: 'visibility', intent: 'conversational_intent',
            weight: 1.0, includesBrand: false,
            text: `I need a {INDUSTRY} option. I'm in {LOCATION}, {REACH} in scope, early-stage, limited budget, small team — no complex or expensive solutions needed. Give me 3–5 realistic fits with a brief reason each.\n\n[Also run for: established mid-size buyer wanting premium full-featured option; technically experienced buyer wanting maximum customisation.]`,
        },
        // Layer 2 — Ranking
        {
            id: 'P04', category: 'ranking', intent: 'competitive_tier',
            weight: 1.8, includesBrand: false,
            text: `Give me a full market overview of {INDUSTRY}. Sort every significant player into four tiers: Leaders, Strong Performers, Contenders, Niche/Emerging. For each, one or two sentences on what specifically earns that placement — not general reputation.\n\nThen: which names nearly landed a tier higher or lower, and why? Who is actively moving between tiers?\n\nBuyer scope: {REACH}. Geography: {LOCATION}.`,
        },
        {
            id: 'P05', category: 'ranking', intent: 'head_to_head',
            weight: 1.5, includesBrand: true,
            text: `Compare {COMPETITOR_A} vs {COMPETITOR_B} in {INDUSTRY} across: overall quality, ease of onboarding, pricing and value, reliability reputation, suitability for a {REACH} operation in {LOCATION}, and long-term scalability.\n\nGive a clear winner per dimension. Then one overall recommendation — pick one, no hedging.`,
        },
        {
            id: 'P06', category: 'ranking', intent: 'forced_scorecard',
            weight: 2.0, includesBrand: false,
            text: `Rank ALL of these {INDUSTRY} options from 1st to last across every dimension below — no ties:\n\nOptions: {COMPETITORS}.\n\nDimensions:\n- Overall quality\n- Ease of onboarding\n- Pricing and value\n- Reliability and track record\n- Reputation and market trust\n- Innovation speed\n- Presence and support in {LOCATION}\n- Fit for a {REACH} operation\n\nAfter all rankings: overall winner, best value option, and your recommendation for a growing {REACH} organisation entering {INDUSTRY} for the first time.`,
        },
        // Layer 3 — Share of Voice
        {
            id: 'P07', category: 'share_of_voice', intent: 'share_of_voice',
            weight: 1.8, includesBrand: false,
            text: `What brands come to mind when you hear {INDUSTRY}? List every one — from most dominant to least known. Include niche, regional, and emerging names, not just major players.\n\nThen flag: which of these aren't pure {INDUSTRY} players but are commonly used or considered for {INDUSTRY} purposes? Include adjacent platforms and overlapping categories.`,
        },
        {
            id: 'P08', category: 'share_of_voice', intent: 'segment_ownership',
            weight: 1.5, includesBrand: false,
            text: `In {INDUSTRY}, name one winner per row — no ties, no lists.\n\nBest for:\n- Small or early-stage buyers\n- Mid-size buyers with growth ambitions\n- Large/enterprise buyers\n- Limited-budget buyers\n- Non-expert buyers\n- Buyers based in {LOCATION}\n- Buyers at {REACH} scale\n- Best overall value\n\nWorth caution (one name + reason each):\n- Early-stage buyers should think twice before _____ because _____\n- Enterprise buyers should be cautious about _____ because _____\n- Budget-conscious buyers should avoid _____ because _____\n- Buyers outside US/EU should note _____ may not serve them because _____`,
        },
        {
            id: 'P09', category: 'share_of_voice', intent: 'use_case_visibility',
            weight: 1.5, includesBrand: false,
            text: `In {INDUSTRY}, name the single best option per use case and explain why in one sentence. Don't distribute answers artificially if one option genuinely leads across multiple areas.\n\n- Highest overall quality\n- Fastest or easiest start\n- Maximum value on minimal spend\n- Multi-country {REACH} operations\n- Based in {LOCATION}, needing local support or compliance\n- Most established and trusted\n- Most flexible or customisable\n- Strongest post-purchase support\n- Best for significant growth without switching`,
        },
        // Layer 4 — Geo + Context
        {
            id: 'P10', category: 'geo_context', intent: 'geo_visibility',
            weight: 1.3, includesBrand: false,
            text: `I'm in {LOCATION} and want the best {INDUSTRY} option that genuinely works for buyers there — not technically global options built primarily for US or Western European markets.\n\nTop 5 for {LOCATION} buyers. For each: do they have real local presence? Are they considered reliable specifically in {LOCATION}? Do they understand the local market? Are any originally from or primarily focused on {LOCATION}?`,
        },
        {
            id: 'P11', category: 'geo_context', intent: 'multi_turn_persistence',
            weight: 1.2, includesBrand: false,
            text: `TURN 1: "What are the best {INDUSTRY} options for someone just starting their search?"\n\nTURN 2: "Which of those would still fit an organisation growing quickly and needing strong long-term credibility?"\n\nTURN 3: "Of those remaining, which are genuinely suited for a {REACH} operation with a presence in {LOCATION}?"\n\nTURN 4: "Between the top two you just named, which do you actually recommend and why? Give a clear answer."\n\n[Send as 4 separate conversation turns. Record which brand survives all 4 turns and which is chosen at Turn 4.]`,
        },
        {
            id: 'P12', category: 'geo_context', intent: 'trend_momentum',
            weight: 1.3, includesBrand: false,
            text: `How is {INDUSTRY} evolving right now? Who's gaining momentum? Who's stagnating or losing relevance?\n\nWhich player has made the most notable recent progress? Who do you predict will be dominant in three years, and why?\n\nDoes operating in or primarily serving {LOCATION} give any players a structural advantage or disadvantage as the market shifts?\n\nFor each of these options — {COMPETITORS} — place them on the momentum curve: rising, stable, or declining. What signals drive each view?`,
        },
        // Layer 5 — Deep Probes
        {
            id: 'P13', category: 'deep_probe', intent: 'competitor_extraction',
            weight: 1.5, includesBrand: false,
            text: `Map every brand competing for buyer attention and budget in {INDUSTRY} — exhaustively, not just top 10.\n\nCover:\n1. Direct competitors — same core job, same primary buyer\n2. Indirect competitors — adjacent categories buyers choose instead\n3. Regional/local competitors — strong specifically in {LOCATION}\n4. Budget alternatives — lower-cost or free options\n5. Premium/enterprise alternatives — when price isn't the constraint\n6. Emerging names — appeared or grown in the last 2–3 years, not yet household names\n7. DIY or no-vendor alternatives — how buyers avoid choosing any brand\n\nFor each: which angle it falls into and one sentence why. Then for each of these specifically — {COMPETITORS} — identify where they fit in this map and whether there are angles where they face no competition.`,
        },
        {
            id: 'P14', category: 'deep_probe', intent: 'alternatives_switching',
            weight: 1.3, includesBrand: false,
            text: `I'm currently using {COMPETITORS} for {INDUSTRY} and looking to switch. What alternatives should I seriously consider?\n\nFor each: what it does better than {COMPETITORS}, what I'd lose by switching, and whether the transition is typically straightforward or complicated.\n\nI'm a {REACH} operation in {LOCATION} — availability, local support, and contextual fit matter.`,
        },
        {
            id: 'P15', category: 'deep_probe', intent: 'competitive_gap',
            weight: 1.8, includesBrand: false,
            text: `For this group of {INDUSTRY} options — {COMPETITORS} — answer exactly:\n\n1. Which single option has the most significant and specific advantage over the rest of the group? Not a broad strength — something precise that distinguishes it.\n\n2. For each option: name the one thing it does clearly better than all the others. Be specific about the capability.\n\n3. For each option: the one weakness it should address to most meaningfully improve its competitiveness against this group.`,
        },
        {
            id: 'P16', category: 'deep_probe', intent: 'reputation_sentiment',
            weight: 1.5, includesBrand: false,
            text: `I'm researching these {INDUSTRY} options before making a decision: {COMPETITORS}. For each one, what would I typically find in terms of reputation?\n\nCover: what satisfied customers praise, what dissatisfied ones criticise, whether it's seen as trustworthy and reliable, any notable controversies or negative events, and how its reputation compares to the others on this list.\n\nFor each point, name the source — review platforms, news, social media, professional communities, analyst opinions, etc.`,
        },
        {
            id: 'P17', category: 'deep_probe', intent: 'source_influence',
            weight: 1.2, includesBrand: false,
            text: `If I'm thoroughly researching {INDUSTRY}, what sources should I consult? Top 3 per category:\n\n1. Most trusted review or comparison platforms\n2. Most trusted publications, newsletters, or analyst reports\n3. Most trusted online communities, forums, or professional groups\n4. Most useful video or multimedia sources\n5. Brands considered genuine thought leaders — whose own content is worth reading\n\nFor each source, name which {INDUSTRY} brands are most frequently featured, cited, or recommended there.`,
        },
        {
            id: 'P18', category: 'deep_probe', intent: 'positioning_validation',
            weight: 1.5, includesBrand: false,
            text: `Among these {INDUSTRY} options — {COMPETITORS} — evaluate which has the strongest claim to market leadership for {REACH} buyers.\n\n1. For each, rate their leadership claim: strongly credible, partially credible, or weak — with specific reasoning, no hedging.\n\n2. Who currently has the strongest, most defensible claim overall, and what earns it?\n\n3. For each option: what specific changes — in product, reputation, or market presence — would it need to be considered a clear, unambiguous leader, especially for buyers in {LOCATION}?\n\n4. Is there positioning territory in {INDUSTRY} that any of these options could credibly own that no current leader occupies?`,
        },
        {
            id: 'P19', category: 'deep_probe', intent: 'semantic_cluster_gap',
            weight: 1.5, includesBrand: false,
            text: `Map how {INDUSTRY} brands occupy conceptual territory.\n\nStep 1 — Association mapping: For each brand below, list 20 words or phrases — attributes, emotional associations, customer types, use cases, reputation signals.\nBrands: {COMPETITORS}.\n\nStep 2 — Ownership gaps: Which words appear frequently across most brands but are absent or weak for one or more of them?\n\nStep 3 — Differentiation assets: Which words appear strongly for one brand but rarely for its competitors?\n\nStep 4 — White space: Which high-value {INDUSTRY} terms aren't strongly associated with ANY of these brands?\n\nStep 5 — Verdict: For each brand, where is its semantic footprint weakest — and which 3 concepts should it most urgently try to own?`,
        },
        {
            id: 'P20', category: 'deep_probe', intent: 'citation_benchmark',
            weight: 1.5, includesBrand: false,
            text: `When explaining how {INDUSTRY} works — different approaches, what separates strong from weak offerings — which real brands would you use as examples?\n\n1. The gold standard for best-in-class in {INDUSTRY} — which brand and why?\n2. The strongest reference point for value-for-money positioning?\n3. The most cited cautionary example — and what's the lesson?\n4. The benchmark you'd use to evaluate any {INDUSTRY} option — why does it hold that status?\n\nThen for each of these — {COMPETITORS} — does it appear in any of the four citation roles above? If not, what would it need to change to earn one?`,
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

export function generateFallbackPrompts(brandName, domain, industry, competitors, location) {
    return generateSuperPrompts({ brandName, domain, industry, competitors, location });
}
