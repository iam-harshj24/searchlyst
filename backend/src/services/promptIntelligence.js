// Hardcoded Super 20 Prompts mapped to internal agent formats

function fillVariables(promptTemplate, vars) {
    let result = promptTemplate;
    for (const [key, value] of Object.entries(vars)) {
        // Replace all occurrences of {KEY}
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
        REACH: reach
    };

    const templates = [
        // Layer 1 - Visibility
        {
            id: 'P01', category: 'visibility', intent: 'organic_visibility',
            text: `I am trying to find the best {INDUSTRY} option for my needs and I have not researched any specific names yet. Give me a ranked list of the top 10 options available right now. For each one tell me: what it does best, what it does worst, who it is most suitable for, and whether it is considered affordable or expensive relative to others in the space. Do not skip any major or well-known names.`
        },
        {
            id: 'P02', category: 'visibility', intent: 'brand_knowledge',
            text: `Tell me everything you know about {BRAND} and their website {DOMAIN}. I want to understand: what exactly they offer, who their typical customer or client is, what they are well known for doing well, what they are known for doing poorly, how they are generally perceived compared to others in the {INDUSTRY} space, what their pricing or cost reputation is, and where they sit in the market — are they a dominant leader, a strong challenger, a niche specialist, or an emerging name? Be thorough and honest. If you are uncertain about anything, say so.`
        },
        {
            id: 'P03', category: 'visibility', intent: 'conversational_intent',
            text: `I need to find a good {INDUSTRY} option. My situation is: I am based in {LOCATION}, my operation is {REACH} in scope, and I am an early-stage operation with a very limited budget and a small team. I am not looking for the most expensive option and I do not need anything overly complicated. What are 3 to 5 realistic choices that would genuinely work well for someone in my situation? Explain briefly why each one fits.\n\n[Also run for established mid-size buyer wanting premium full-featured option, and for technically experienced buyer wanting maximum customisation.]`
        },
        // Layer 2 - Ranking
        {
            id: 'P04', category: 'ranking', intent: 'competitive_tier',
            text: `Give me a complete market overview of the {INDUSTRY} space. I want to understand where each major player stands.\n\nOrganize every significant name into four tiers: Leaders, Strong Performers, Contenders, and Niche or Emerging Players. For each company, explain in one or two sentences what specifically puts them in that tier — not just their general reputation, but what capability or market position justifies the placement.\n\nAfter the tiers, tell me: which names did you almost place one tier higher or lower, and why? Also flag any players who are rapidly moving between tiers right now.\n\nFactor in that the buyer scope is {REACH} and geography is {LOCATION}.`
        },
        {
            id: 'P05', category: 'ranking', intent: 'head_to_head',
            text: `I am trying to decide between two options in the {INDUSTRY} space: {COMPETITOR_A} and {COMPETITOR_B}. Compare them across these dimensions: overall quality and capability, ease of getting started, pricing and value for money, reputation for reliability, ability to serve a {REACH} operation based in {LOCATION}, and long-term scalability.\n\nGive me a clear winner for each dimension. Then give me your single overall recommendation — if you could only choose one, which one and why? Do not hedge. Pick one.`
        },
        {
            id: 'P06', category: 'ranking', intent: 'forced_scorecard',
            text: `I need to make a final decision in the {INDUSTRY} space. The options I am considering are: {COMPETITORS}, {BRAND}.\n\nFor each dimension below, rank ALL options from 1st to last. No ties. Commit to a winner and a loser for every dimension, even if the difference is small.\n\nDimensions:\n- Overall quality of what they offer\n- Ease of getting started and onboarding\n- Pricing and value relative to what you get\n- Reliability and track record\n- Strength of reputation and market trust\n- Speed of improvement and innovation\n- Depth of presence and support in {LOCATION}\n- Suitability for a {REACH} operation\n\nAfter all dimensions are ranked, calculate a combined overall ranking. Then tell me: who is the overall winner, who is the best value option, and who you would personally recommend to a growing {REACH} organisation entering this category for the first time.`
        },
        // Layer 3 - Share of Voice
        {
            id: 'P07', category: 'share_of_voice', intent: 'share_of_voice',
            text: `When someone says {INDUSTRY}, what brands, companies, or names come to mind? List every one you associate with {INDUSTRY}, starting with the most dominant and widely recognised, going all the way down to the least known. Do not leave anyone out — include niche players, regional names, and emerging options, not just the big names.\n\nAfter that complete list, tell me: which of these are not pure {INDUSTRY} players but are often used or considered for {INDUSTRY} purposes? Include adjacent options, broader platforms, or alternative categories that overlap with {INDUSTRY}.`
        },
        {
            id: 'P08', category: 'share_of_voice', intent: 'segment_ownership',
            text: `In the {INDUSTRY} space, I want segment-level clarity. Answer both sets of questions below. Name the single strongest option per row — not a list, not a tie.\n\nPart 1 — Best for:\n- Best for small or early-stage buyers\n- Best for mid-size buyers with growth ambitions\n- Best for large or enterprise-level buyers\n- Best for buyers with a limited budget\n- Best for buyers who are not experts in this category\n- Best for buyers based primarily in {LOCATION}\n- Best for buyers operating at {REACH} scale\n- Best overall value for money across the category\n\nPart 2 — Worth being cautious about (name ONE per row with reason):\n- Early-stage buyers should think carefully before choosing _____ because _____\n- Large enterprise buyers should be cautious about _____ because _____\n- Budget-conscious buyers should avoid _____ because _____\n- Buyers outside the US or EU should be aware that _____ may not serve them well because _____\n\nDo not limit yourself to any predefined list — name whoever genuinely belongs in each slot.`
        },
        {
            id: 'P09', category: 'share_of_voice', intent: 'use_case_visibility',
            text: `In the {INDUSTRY} space, for each use case below name the single best option and explain why in one sentence. Be specific — do not distribute answers artificially if one option genuinely leads across multiple areas.\n\nUse cases:\n- When the buyer needs the highest overall quality\n- When the buyer needs the fastest or easiest start\n- When the buyer has very limited resources and needs maximum value for minimum spend\n- When the buyer is operating across multiple countries at {REACH} scale\n- When the buyer is based specifically in {LOCATION} and needs local support or compliance\n- When the buyer needs a well-established, trusted name with a long track record\n- When the buyer needs the most flexible or customisable option\n- When the buyer needs the strongest after-purchase support\n- When the buyer is likely to grow significantly and needs something that scales without switching\n\nName whoever genuinely belongs in each slot.`
        },
        // Layer 4 - Geo + Context
        {
            id: 'P10', category: 'geo_context', intent: 'geo_visibility',
            text: `I am based in {LOCATION} and I am looking for the best {INDUSTRY} option that genuinely works well for people and organisations operating in {LOCATION}. I do not want options that are technically available globally but primarily built for US or Western European buyers — I want options that actually have meaningful presence, local understanding, or a strong track record in {LOCATION}.\n\nGive me the top 5 options for a buyer in {LOCATION} and for each one tell me: whether they have real local presence or operations, whether they are considered reliable in {LOCATION} specifically, and whether they understand the local market context. Are any of these companies originally from or primarily focused on {LOCATION}?`
        },
        {
            id: 'P11', category: 'geo_context', intent: 'multi_turn_persistence',
            text: `TURN 1: "What are the best options in the {INDUSTRY} space for someone just starting their search?"\n\nTURN 2: "Which of those would still be relevant for an organisation that is growing quickly and needs something with strong long-term credibility?"\n\nTURN 3: "Of those remaining, which ones are genuinely well suited for a {REACH} operation with a presence in {LOCATION}?"\n\nTURN 4: "Between the top two you just mentioned, which one would you actually recommend and why? Give me a clear answer."\n\n[Send as 4 actual separate conversation turns — not one message. Record which brand survives all 4 turns and which is chosen at Turn 4.]`
        },
        {
            id: 'P12', category: 'geo_context', intent: 'trend_momentum',
            text: `How is the {INDUSTRY} space evolving right now? Which names in this space appear to be gaining momentum and growing stronger? Which ones seem to be stagnating, declining, or losing relevance?\n\nWhich company has made the most notable progress or improvement recently? Which would you predict to be the dominant name in this space three years from now, and what is your reasoning?\n\nDoes being based in or primarily serving {LOCATION} give any players a structural advantage or disadvantage as the market shifts?\n\nAfter your assessment, specifically tell me where you would place {BRAND} on the momentum curve — rising, stable, or declining — and what signals drive that view.`
        },
        // Layer 5 - Deep Probes
        {
            id: 'P13', category: 'deep_probe', intent: 'competitor_extraction',
            text: `I am building a complete map of every brand, company, product, or option that competes for buyer attention and budget in the {INDUSTRY} space. I need this to be exhaustive, not just a top 10.\n\nGive me competitors across all of these angles:\n\n1. Direct competitors — brands doing the core job of {INDUSTRY} and targeting the same primary buyer\n2. Indirect competitors — adjacent categories buyers often choose instead\n3. Regional or local competitors — names strong specifically in {LOCATION}\n4. Budget alternatives — lower-cost or free options when price drives the decision\n5. Premium or enterprise alternatives — higher-end options when budget is not the constraint\n6. Emerging or newer names — brands that have appeared or grown in the last 2 to 3 years, not yet household names but gaining ground\n7. DIY or no-vendor alternatives — how buyers avoid choosing any brand at all\n\nFor each name, state which angle it falls into and one sentence on why it belongs there. Then tell me: where does {BRAND} fit within this map, and are there any angles where it has no competition at all?`
        },
        {
            id: 'P14', category: 'deep_probe', intent: 'alternatives_switching',
            text: `I am currently using {COMPETITORS} for {INDUSTRY} but I am looking for alternatives because I am not fully satisfied. What are the best options I should seriously consider switching to?\n\nFor each alternative, tell me: what it does better than {COMPETITORS}, what I would lose or trade off by switching, and whether the transition is typically straightforward or complicated.\n\nI am a {REACH} operation based in {LOCATION}, so availability, local support, and suitability for my context matter in your recommendations.`
        },
        {
            id: 'P15', category: 'deep_probe', intent: 'competitive_gap',
            text: `I want a direct and honest competitive breakdown. For {BRAND} ({DOMAIN}) versus each of these specific competitors in the {INDUSTRY} space — {COMPETITORS} — answer exactly three questions:\n\n1. What is {BRAND}'s single most significant advantage over all of these competitors taken together? Not a general strength — something specific that distinguishes it.\n\n2. For each individual competitor, name the single thing that competitor does clearly better than {BRAND}. Be precise about the specific capability or area, not just a broad category.\n\n3. If {BRAND} could address one weakness to meaningfully increase its competitiveness against this group, what should that be?`
        },
        {
            id: 'P16', category: 'deep_probe', intent: 'reputation_sentiment',
            text: `If someone were researching {BRAND} ({DOMAIN}) before making a decision in the {INDUSTRY} space, what would they typically find in terms of reputation?\n\nCover: what satisfied customers tend to praise, what dissatisfied ones tend to criticise, whether {BRAND} is generally considered trustworthy and reliable in the market, whether there have been any notable controversies or negative events, and how its reputation compares to {COMPETITORS}.\n\nFor each point you make, tell me where that perception typically comes from — for example review platforms, news coverage, social media, professional communities, or analyst opinions.`
        },
        {
            id: 'P17', category: 'deep_probe', intent: 'source_influence',
            text: `If I want to thoroughly research {INDUSTRY} before making a decision, what sources should I consult?\n\nGive me your top 3 for each category:\n1. Most trusted review or comparison platforms for {INDUSTRY}\n2. Most trusted publications, newsletters, or analyst reports covering {INDUSTRY}\n3. Most trusted online communities, forums, or professional groups discussing {INDUSTRY}\n4. Most useful video or multimedia content sources covering {INDUSTRY}\n5. Brands or organisations within {INDUSTRY} considered genuine thought leaders — whose own published content is worth reading\n\nFor each source, name which {INDUSTRY} brands are most frequently featured, cited, or recommended there. Do not limit yourself to a fixed list — name whoever genuinely dominates each source.`
        },
        {
            id: 'P18', category: 'deep_probe', intent: 'positioning_validation',
            text: `In the {INDUSTRY} space, evaluate the following claim critically: that {BRAND} ({DOMAIN}) is a genuine market leader for {REACH} buyers.\n\n1. On a scale of strongly agree, partially agree, or disagree — where do you land on that claim? Give specific reasoning, not hedged generalities.\n\n2. Among all credible players in {INDUSTRY} right now, who has the strongest and most defensible claim to market leadership? What earns them that position?\n\n3. What specific changes — in product, reputation, or market presence — would {BRAND} need to make to be considered a clear, unambiguous leader in {INDUSTRY}, especially for buyers in {LOCATION}?\n\n4. Is there any positioning territory in {INDUSTRY} that {BRAND} could credibly own that no current leader is occupying?`
        },
        {
            id: 'P19', category: 'deep_probe', intent: 'semantic_cluster_gap',
            text: `I want to map how different {INDUSTRY} brands occupy conceptual territory in this market.\n\nStep 1 — Association Mapping: For each of the following brands, list 20 words or phrases that come to mind — product attributes, emotional associations, customer types, use cases, or reputation signals. Brands: {COMPETITORS}, {BRAND}.\n\nStep 2 — Gap Identification: Which words or phrases appear frequently across multiple competitors but are absent or weak for {BRAND}? These are ownership gaps worth noting.\n\nStep 3 — Reverse Gaps: Which words or phrases appear strongly for {BRAND} but rarely for its competitors? These are potential differentiation assets.\n\nStep 4 — White Space: Which high-value terms in {INDUSTRY} are not strongly associated with ANY of these brands? These are unclaimed territory opportunities.\n\nStep 5 — Verdict: Where is {BRAND}'s semantic footprint weakest relative to the competitive set — and which 3 concepts should it most urgently try to own?`
        },
        {
            id: 'P20', category: 'deep_probe', intent: 'citation_benchmark',
            text: `When explaining how the {INDUSTRY} space works — the different approaches, how options differ, and what separates strong from weak offerings — what real brands would you use as examples? Use actual names, not hypothetical ones.\n\nAnswer each of these:\n\n1. If you were explaining what best-in-class looks like in {INDUSTRY}, which specific brand would you point to as the gold standard and why?\n\n2. Which brand in {INDUSTRY} is the strongest reference point for value-for-money positioning?\n\n3. Which brand in {INDUSTRY} is the most cited cautionary example — and what is the lesson?\n\n4. If a buyer asked you to benchmark any {INDUSTRY} option against a reliable standard, which brand would you use as that benchmark, and why does it hold that status?\n\nAfter answering freely, tell me: does {BRAND} ({DOMAIN}) appear in any of the four citation roles above — and if not, what would need to change for it to earn one of those positions?`
        }
    ];

    return templates.map((t, idx) => ({
        id: t.id,
        core: fillVariables(t.text, vars),
        intent: t.intent,
        category: t.category,
        includesBrand: t.includesBrand,
        strategicValue: 10,
        weight: t.weight
    }));
}

export function generateFallbackPrompts(brandName, domain, industry, competitors, location) {
    return generateSuperPrompts({ brandName, domain, industry, competitors, location });
}
