import React, { useState, useMemo } from 'react';
import {
    Search, ChevronDown, ChevronUp, Eye, EyeOff,
    Globe, MessageSquare, CheckCircle, XCircle, Target,
    RotateCw, Terminal, ExternalLink, Activity, BarChart3, Link2, AlertTriangle, Users
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

function getVisibilityData(domain, projectId) {
    try {
        const key = `searchlyst_visibility_${domain || 'default'}_${projectId ?? 'default'}`;
        let saved = localStorage.getItem(key);
        if (!saved && (projectId == null || projectId === 'default')) {
            saved = localStorage.getItem(`searchlyst_visibility_${domain || 'default'}`);
        }
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
}

const ENGINE_CONFIG = {
    perplexity: {
        label: 'Perplexity',
        icon: ({ size = 18 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M4 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 12v10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
    gemini: {
        label: 'Gemini',
        icon: ({ size = 18 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 2C8 8 8 16 12 22C16 16 16 8 12 2z" fill="currentColor" opacity="0.6" />
            </svg>
        ),
    },
    chatgpt: {
        label: 'ChatGPT',
        icon: ({ size = 18 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.28 9.28a5.76 5.76 0 00-.62-4.73 5.84 5.84 0 00-6.29-2.8A5.77 5.77 0 0011.07 0a5.84 5.84 0 00-5.57 4.05 5.78 5.78 0 00-3.86 2.8 5.84 5.84 0 00.72 6.85 5.76 5.76 0 00.62 4.73 5.84 5.84 0 006.29 2.8A5.77 5.77 0 0012.93 24a5.84 5.84 0 005.58-4.05 5.78 5.78 0 003.85-2.8 5.84 5.84 0 00-.72-6.85l.64-.02zM12.93 22.5l-2.79-1.01 4.63-2.67v-6.52l1.96 1.13v5.4z" />
            </svg>
        ),
    },
};

function getEngineConfig(eng) {
    return ENGINE_CONFIG[eng] || {
        label: eng.charAt(0).toUpperCase() + eng.slice(1),
        icon: ({ size = 18 }) => (
            <div style={{ width: size, height: size }} className="flex items-center justify-center text-[10px] font-bold">
                {eng.slice(0, 2).toUpperCase()}
            </div>
        ),
    };
}

// ── 20 Super Prompt Templates ─────────────────────────────────────────────────

const SUPER_PROMPTS = [
    {
        id: 'P01', layer: 'Visibility', category: 'organic_visibility',
        title: 'Organic Unaided Visibility',
        signal: 'Does AI recommend the brand without being prompted with its name?',
        template: `I am trying to find the best {INDUSTRY} option for my needs and I have not researched any specific names yet. Give me a ranked list of the top 10 options available right now. For each one tell me: what it does best, what it does worst, who it is most suitable for, and whether it is considered affordable or expensive relative to others in the space. Do not skip any major or well-known names.`,
    },
    {
        id: 'P02', layer: 'Visibility', category: 'brand_knowledge',
        title: 'Brand Knowledge Audit',
        signal: 'What does AI actually know — and is any of it wrong?',
        template: `Tell me everything you know about {BRAND} and their website {DOMAIN}. I want to understand: what exactly they offer, who their typical customer or client is, what they are well known for doing well, what they are known for doing poorly, how they are generally perceived compared to others in the {INDUSTRY} space, what their pricing or cost reputation is, and where they sit in the market — are they a dominant leader, a strong challenger, a niche specialist, or an emerging name? Be thorough and honest. If you are uncertain about anything, say so.`,
    },
    {
        id: 'P03', layer: 'Visibility', category: 'conversational_intent',
        title: 'Conversational Intent Visibility',
        signal: 'Does the brand appear when real buyers describe their situation naturally across different intent types?',
        template: `I need to find a good {INDUSTRY} option. My situation is: I am based in {LOCATION}, my operation is {REACH} in scope, and I am an early-stage operation with a very limited budget and a small team. I am not looking for the most expensive option and I do not need anything overly complicated. What are 3 to 5 realistic choices that would genuinely work well for someone in my situation? Explain briefly why each one fits.\n\n[Also run for established mid-size buyer wanting premium full-featured option, and for technically experienced buyer wanting maximum customisation.]`,
    },
    {
        id: 'P04', layer: 'Ranking', category: 'competitive_tier',
        title: 'Competitive Landscape Tier Map',
        signal: 'Which tier does AI place the brand in vs all competitors?',
        template: `Give me a complete market overview of the {INDUSTRY} space. I want to understand where each major player stands.\n\nOrganize every significant name into four tiers: Leaders, Strong Performers, Contenders, and Niche or Emerging Players. For each company, explain in one or two sentences what specifically puts them in that tier — not just their general reputation, but what capability or market position justifies the placement.\n\nAfter the tiers, tell me: which names did you almost place one tier higher or lower, and why? Also flag any players who are rapidly moving between tiers right now.\n\nFactor in that the buyer scope is {REACH} and geography is {LOCATION}.`,
    },
    {
        id: 'P05', layer: 'Ranking', category: 'head_to_head',
        title: 'Head-to-Head Battle',
        signal: 'When directly compared, who does AI pick? Run both name orders to detect bias.',
        template: `I am trying to decide between two options in the {INDUSTRY} space: {COMPETITOR_A} and {COMPETITOR_B}. Compare them across these dimensions: overall quality and capability, ease of getting started, pricing and value for money, reputation for reliability, ability to serve a {REACH} operation based in {LOCATION}, and long-term scalability.\n\nGive me a clear winner for each dimension. Then give me your single overall recommendation — if you could only choose one, which one and why? Do not hedge. Pick one.`,
    },
    {
        id: 'P06', layer: 'Ranking', category: 'forced_scorecard',
        title: 'Forced Competitive Scorecard',
        signal: 'Numerical forced ranking with no score inflation',
        template: `I need to make a final decision in the {INDUSTRY} space. The options I am considering are: {COMPETITORS}, {BRAND}.\n\nFor each dimension below, rank ALL options from 1st to last. No ties. Commit to a winner and a loser for every dimension, even if the difference is small.\n\nDimensions:\n- Overall quality of what they offer\n- Ease of getting started and onboarding\n- Pricing and value relative to what you get\n- Reliability and track record\n- Strength of reputation and market trust\n- Speed of improvement and innovation\n- Depth of presence and support in {LOCATION}\n- Suitability for a {REACH} operation\n\nAfter all dimensions are ranked, calculate a combined overall ranking. Then tell me: who is the overall winner, who is the best value option, and who you would personally recommend to a growing {REACH} organisation entering this category for the first time.`,
    },
    {
        id: 'P07', layer: 'Share of Voice', category: 'share_of_voice',
        title: 'Share of Voice Measurement',
        signal: 'What % of category mindshare does AI assign to the brand?',
        template: `When someone says {INDUSTRY}, what brands, companies, or names come to mind? List every one you associate with {INDUSTRY}, starting with the most dominant and widely recognised, going all the way down to the least known. Do not leave anyone out — include niche players, regional names, and emerging options, not just the big names.\n\nAfter that complete list, tell me: which of these are not pure {INDUSTRY} players but are often used or considered for {INDUSTRY} purposes? Include adjacent options, broader platforms, or alternative categories that overlap with {INDUSTRY}.`,
    },
    {
        id: 'P08', layer: 'Share of Voice', category: 'segment_ownership',
        title: 'Segment Ownership Map',
        signal: 'Which buyer segments does AI assign to the brand — and which does it warn away?',
        template: `In the {INDUSTRY} space, I want segment-level clarity. Answer both sets of questions below. Name the single strongest option per row — not a list, not a tie.\n\nPart 1 — Best for:\n- Best for small or early-stage buyers\n- Best for mid-size buyers with growth ambitions\n- Best for large or enterprise-level buyers\n- Best for buyers with a limited budget\n- Best for buyers who are not experts in this category\n- Best for buyers based primarily in {LOCATION}\n- Best for buyers operating at {REACH} scale\n- Best overall value for money across the category\n\nPart 2 — Worth being cautious about (name ONE per row with reason):\n- Early-stage buyers should think carefully before choosing _____ because _____\n- Large enterprise buyers should be cautious about _____ because _____\n- Budget-conscious buyers should avoid _____ because _____\n- Buyers outside the US or EU should be aware that _____ may not serve them well because _____\n\nDo not limit yourself to any predefined list — name whoever genuinely belongs in each slot.`,
    },
    {
        id: 'P09', layer: 'Share of Voice', category: 'use_case_visibility',
        title: 'Use Case Visibility',
        signal: 'Does the brand appear when buyers search by specific real-world need?',
        template: `In the {INDUSTRY} space, for each use case below name the single best option and explain why in one sentence. Be specific — do not distribute answers artificially if one option genuinely leads across multiple areas.\n\nUse cases:\n- When the buyer needs the highest overall quality\n- When the buyer needs the fastest or easiest start\n- When the buyer has very limited resources and needs maximum value for minimum spend\n- When the buyer is operating across multiple countries at {REACH} scale\n- When the buyer is based specifically in {LOCATION} and needs local support or compliance\n- When the buyer needs a well-established, trusted name with a long track record\n- When the buyer needs the most flexible or customisable option\n- When the buyer needs the strongest after-purchase support\n- When the buyer is likely to grow significantly and needs something that scales without switching\n\nName whoever genuinely belongs in each slot.`,
    },
    {
        id: 'P10', layer: 'Geo + Context', category: 'geo_visibility',
        title: 'Geo-Specific Visibility',
        signal: 'Is the brand visible and credible in its target geography?',
        template: `I am based in {LOCATION} and I am looking for the best {INDUSTRY} option that genuinely works well for people and organisations operating in {LOCATION}. I do not want options that are technically available globally but primarily built for US or Western European buyers — I want options that actually have meaningful presence, local understanding, or a strong track record in {LOCATION}.\n\nGive me the top 5 options for a buyer in {LOCATION} and for each one tell me: whether they have real local presence or operations, whether they are considered reliable in {LOCATION} specifically, and whether they understand the local market context. Are any of these companies originally from or primarily focused on {LOCATION}?`,
    },
    {
        id: 'P11', layer: 'Geo + Context', category: 'multi_turn_persistence',
        title: 'Multi-Turn Session Persistence',
        signal: 'Does the brand survive when a buyer progressively narrows their decision across a real conversation?',
        template: `TURN 1: "What are the best options in the {INDUSTRY} space for someone just starting their search?"\n\nTURN 2: "Which of those would still be relevant for an organisation that is growing quickly and needs something with strong long-term credibility?"\n\nTURN 3: "Of those remaining, which ones are genuinely well suited for a {REACH} operation with a presence in {LOCATION}?"\n\nTURN 4: "Between the top two you just mentioned, which one would you actually recommend and why? Give me a clear answer."\n\n[Send as 4 actual separate conversation turns — not one message. Record which brand survives all 4 turns and which is chosen at Turn 4.]`,
    },
    {
        id: 'P12', layer: 'Geo + Context', category: 'trend_momentum',
        title: 'Trend & Momentum',
        signal: 'Is AI positioning the brand as rising, stable, or fading?',
        template: `How is the {INDUSTRY} space evolving right now? Which names in this space appear to be gaining momentum and growing stronger? Which ones seem to be stagnating, declining, or losing relevance?\n\nWhich company has made the most notable progress or improvement recently? Which would you predict to be the dominant name in this space three years from now, and what is your reasoning?\n\nDoes being based in or primarily serving {LOCATION} give any players a structural advantage or disadvantage as the market shifts?\n\nAfter your assessment, specifically tell me where you would place {BRAND} on the momentum curve — rising, stable, or declining — and what signals drive that view.`,
    },
    {
        id: 'P13', layer: 'Deep Probes', category: 'competitor_extraction',
        title: 'Aggressive Full Competitor Extraction',
        signal: 'Forces AI to surface every competitor across 7 angles, not just the obvious top 10',
        template: `I am building a complete map of every brand, company, product, or option that competes for buyer attention and budget in the {INDUSTRY} space. I need this to be exhaustive, not just a top 10.\n\nGive me competitors across all of these angles:\n\n1. Direct competitors — brands doing the core job of {INDUSTRY} and targeting the same primary buyer\n2. Indirect competitors — adjacent categories buyers often choose instead\n3. Regional or local competitors — names strong specifically in {LOCATION}\n4. Budget alternatives — lower-cost or free options when price drives the decision\n5. Premium or enterprise alternatives — higher-end options when budget is not the constraint\n6. Emerging or newer names — brands that have appeared or grown in the last 2 to 3 years, not yet household names but gaining ground\n7. DIY or no-vendor alternatives — how buyers avoid choosing any brand at all\n\nFor each name, state which angle it falls into and one sentence on why it belongs there. Then tell me: where does {BRAND} fit within this map, and are there any angles where it has no competition at all?`,
    },
    {
        id: 'P14', layer: 'Deep Probes', category: 'alternatives_switching',
        title: 'Alternatives & Switching Capture',
        signal: 'When someone wants to leave a competitor, is the brand recommended?',
        template: `I am currently using {COMPETITORS} for {INDUSTRY} but I am looking for alternatives because I am not fully satisfied. What are the best options I should seriously consider switching to?\n\nFor each alternative, tell me: what it does better than {COMPETITORS}, what I would lose or trade off by switching, and whether the transition is typically straightforward or complicated.\n\nI am a {REACH} operation based in {LOCATION}, so availability, local support, and suitability for my context matter in your recommendations.`,
    },
    {
        id: 'P15', layer: 'Deep Probes', category: 'competitive_gap',
        title: 'Competitive Gap Finder',
        signal: 'Exact attribute-level gaps between the brand and each individual competitor',
        template: `I want a direct and honest competitive breakdown. For {BRAND} ({DOMAIN}) versus each of these specific competitors in the {INDUSTRY} space — {COMPETITORS} — answer exactly three questions:\n\n1. What is {BRAND}'s single most significant advantage over all of these competitors taken together? Not a general strength — something specific that distinguishes it.\n\n2. For each individual competitor, name the single thing that competitor does clearly better than {BRAND}. Be precise about the specific capability or area, not just a broad category.\n\n3. If {BRAND} could address one weakness to meaningfully increase its competitiveness against this group, what should that be?`,
    },
    {
        id: 'P16', layer: 'Deep Probes', category: 'reputation_sentiment',
        title: 'Reputation & Sentiment Deep Dive',
        signal: 'Full sentiment profile with source attribution',
        template: `If someone were researching {BRAND} ({DOMAIN}) before making a decision in the {INDUSTRY} space, what would they typically find in terms of reputation?\n\nCover: what satisfied customers tend to praise, what dissatisfied ones tend to criticise, whether {BRAND} is generally considered trustworthy and reliable in the market, whether there have been any notable controversies or negative events, and how its reputation compares to {COMPETITORS}.\n\nFor each point you make, tell me where that perception typically comes from — for example review platforms, news coverage, social media, professional communities, or analyst opinions.`,
    },
    {
        id: 'P17', layer: 'Deep Probes', category: 'source_influence',
        title: 'Source Influence Map',
        signal: 'Where does AI learn about this industry — and is the brand present at those sources?',
        template: `If I want to thoroughly research {INDUSTRY} before making a decision, what sources should I consult?\n\nGive me your top 3 for each category:\n1. Most trusted review or comparison platforms for {INDUSTRY}\n2. Most trusted publications, newsletters, or analyst reports covering {INDUSTRY}\n3. Most trusted online communities, forums, or professional groups discussing {INDUSTRY}\n4. Most useful video or multimedia content sources covering {INDUSTRY}\n5. Brands or organisations within {INDUSTRY} considered genuine thought leaders — whose own published content is worth reading\n\nFor each source, name which {INDUSTRY} brands are most frequently featured, cited, or recommended there. Do not limit yourself to a fixed list — name whoever genuinely dominates each source.`,
    },
    {
        id: 'P18', layer: 'Deep Probes', category: 'positioning_validation',
        title: 'Brand Positioning Validation',
        signal: 'Does AI agree with how the brand positions itself?',
        template: `In the {INDUSTRY} space, evaluate the following claim critically: that {BRAND} ({DOMAIN}) is a genuine market leader for {REACH} buyers.\n\n1. On a scale of strongly agree, partially agree, or disagree — where do you land on that claim? Give specific reasoning, not hedged generalities.\n\n2. Among all credible players in {INDUSTRY} right now, who has the strongest and most defensible claim to market leadership? What earns them that position?\n\n3. What specific changes — in product, reputation, or market presence — would {BRAND} need to make to be considered a clear, unambiguous leader in {INDUSTRY}, especially for buyers in {LOCATION}?\n\n4. Is there any positioning territory in {INDUSTRY} that {BRAND} could credibly own that no current leader is occupying?`,
    },
    {
        id: 'P19', layer: 'Deep Probes', category: 'semantic_cluster_gap',
        title: 'Semantic Cluster Gap Finder',
        signal: 'The exact words and concepts competitors own in AI\'s mind that the brand does not — semantic white space mapping',
        template: `I want to map how different {INDUSTRY} brands occupy conceptual territory in this market.\n\nStep 1 — Association Mapping: For each of the following brands, list 20 words or phrases that come to mind — product attributes, emotional associations, customer types, use cases, or reputation signals. Brands: {COMPETITORS}, {BRAND}.\n\nStep 2 — Gap Identification: Which words or phrases appear frequently across multiple competitors but are absent or weak for {BRAND}? These are ownership gaps worth noting.\n\nStep 3 — Reverse Gaps: Which words or phrases appear strongly for {BRAND} but rarely for its competitors? These are potential differentiation assets.\n\nStep 4 — White Space: Which high-value terms in {INDUSTRY} are not strongly associated with ANY of these brands? These are unclaimed territory opportunities.\n\nStep 5 — Verdict: Where is {BRAND}'s semantic footprint weakest relative to the competitive set — and which 3 concepts should it most urgently try to own?`,
    },
    {
        id: 'P20', layer: 'Deep Probes', category: 'citation_benchmark',
        title: 'Citation & Benchmark Tracking',
        signal: 'Is the brand used as a reference point in AI\'s reasoning — or is it invisible when category standards are set?',
        template: `When explaining how the {INDUSTRY} space works — the different approaches, how options differ, and what separates strong from weak offerings — what real brands would you use as examples? Use actual names, not hypothetical ones.\n\nAnswer each of these:\n\n1. If you were explaining what best-in-class looks like in {INDUSTRY}, which specific brand would you point to as the gold standard and why?\n\n2. Which brand in {INDUSTRY} is the strongest reference point for value-for-money positioning?\n\n3. Which brand in {INDUSTRY} is the most cited cautionary example — and what is the lesson?\n\n4. If a buyer asked you to benchmark any {INDUSTRY} option against a reliable standard, which brand would you use as that benchmark, and why does it hold that status?\n\nAfter answering freely, tell me: does {BRAND} ({DOMAIN}) appear in any of the four citation roles above — and if not, what would need to change for it to earn one of those positions?`,
    },
];

const LAYER_COLORS = {
    'Visibility':     { bg: '#0d1a0d', border: '#166534', text: '#4ade80' },
    'Ranking':        { bg: '#0f0a1e', border: '#5b21b6', text: '#a78bfa' },
    'Share of Voice': { bg: '#1a0f00', border: '#92400e', text: '#fbbf24' },
    'Geo + Context':  { bg: '#0a1520', border: '#1e40af', text: '#60a5fa' },
    'Deep Probes':    { bg: '#1a0a0a', border: '#991b1b', text: '#f87171' },
};

function generatePrompts(user) {
    const brand      = user?.brandName  || 'Your Brand';
    const domain     = user?.domain     || 'yourdomain.com';
    const industry   = user?.industry   || 'your industry';
    const location   = user?.location   || 'your region';
    const reach      = user?.reach      || 'regional';
    const rawComps   = user?.competitors || [];
    const competitors = Array.isArray(rawComps) && rawComps.length
        ? rawComps.slice(0, 4).map(c => (typeof c === 'string' ? c : c.domain || c.name)).join(', ')
        : 'major competitors';

    const sub = (text) => text
        .replace(/{BRAND}/g, brand)
        .replace(/{DOMAIN}/g, domain)
        .replace(/{INDUSTRY}/g, industry)
        .replace(/{LOCATION}/g, location)
        .replace(/{REACH}/g, reach)
        .replace(/{COMPETITORS}/g, competitors);

    const today = new Date();
    const ENGINES = ['perplexity', 'gemini', 'chatgpt'];
    const SENTIMENTS = ['Positive', 'Neutral', 'Negative'];
    const compArr = competitors.split(', ').filter(Boolean);

    return SUPER_PROMPTS.map((p, idx) => {
        const query = sub(p.template);
        // Deterministic mock per prompt index
        const seed = idx + 1;
        const engines = {};

        ENGINES.forEach((eng, ei) => {
            const isMentioned = ((seed + ei) % 3) !== 0;  // ~67% mention rate
            const hasError    = (seed === 5 && eng === 'chatgpt'); // P5/chatgpt simulates failure
            const sentiment   = SENTIMENTS[(seed + ei) % 3];
            const comp1 = compArr[ei % compArr.length] || 'competitor.com';
            const comp2 = compArr[(ei + 1) % compArr.length] || 'alt-competitor.com';

            const rawResponses = {
                perplexity: isMentioned
                    ? `Based on current search data, ${brand} ranks among the top ${industry} solutions for ${location} businesses [1]. Their focus on ${industry} has earned them positive reviews on G2 and Capterra. Competitors like ${comp1} also appear frequently in this category [2].`
                    : `The leading ${industry} platforms in ${location} tend to be ${comp1} and ${comp2} [1][2]. I could not find strong citations for ${brand} in current AI search indexes for this query type.`,
                gemini: isMentioned
                    ? `${brand} (${domain}) is a recognized name in the ${industry} market. For ${reach} companies based in ${location}, it offers competitive advantages in deployment speed and support [1]. Note that ${comp1} remains a strong alternative for enterprise use cases.`
                    : `In the ${industry} space, ${comp1} leads market share by citation volume [1]. ${comp2} follows closely [2]. ${brand} was not prominently featured in authoritative sources for this prompt.`,
                chatgpt: hasError
                    ? `Request to AI engine timed out. No response captured for this prompt on this platform.`
                    : isMentioned
                    ? `${brand} stands out in the ${industry} landscape specifically for ${location}-based operations [1]. When compared with ${comp1}, ${brand} shows stronger performance in ease of onboarding and regional compliance. Highly recommended for ${reach} organizations [2].`
                    : `For ${industry} needs in ${location}, the most commonly recommended platforms are ${comp1} and ${comp2} [1]. ${brand} appears in niche discussions but lacks broader AI citation coverage for this use case.`,
            };

            const citationSets = {
                perplexity: [
                    { url: `https://g2.com/products/${brand.toLowerCase().replace(/ /g, '-')}/reviews`, domain: 'g2.com', isTargetBrand: isMentioned, citedCompetitor: isMentioned ? null : comp1, DA: 92, timesCited: isMentioned ? 4 : 1 },
                    { url: `https://capterra.com/p/${brand.toLowerCase().replace(/ /g, '-')}/`, domain: 'capterra.com', isTargetBrand: isMentioned, citedCompetitor: null, DA: 88, timesCited: 2 },
                    { url: `https://www.${comp1}/`, domain: comp1, isTargetBrand: false, citedCompetitor: comp1, DA: 74, timesCited: 3 },
                ],
                gemini: [
                    { url: `https://${domain}/`, domain: domain, isTargetBrand: isMentioned, citedCompetitor: null, DA: 55, timesCited: isMentioned ? 2 : 0 },
                    { url: `https://www.${comp1}/features`, domain: comp1, isTargetBrand: false, citedCompetitor: comp1, DA: 69, timesCited: 4 },
                    { url: `https://techcrunch.com/${industry.replace(/ /g, '-')}`, domain: 'techcrunch.com', isTargetBrand: false, citedCompetitor: null, DA: 94, timesCited: 1 },
                ],
                chatgpt: hasError ? [] : [
                    { url: `https://www.${comp2}/pricing`, domain: comp2, isTargetBrand: false, citedCompetitor: comp2, DA: 61, timesCited: 2 },
                    { url: `https://${domain}/pricing`, domain: domain, isTargetBrand: isMentioned, citedCompetitor: null, DA: 55, timesCited: isMentioned ? 3 : 0 },
                    { url: `https://www.gartner.com/reviews/${industry.replace(/ /g, '-')}`, domain: 'gartner.com', isTargetBrand: false, citedCompetitor: null, DA: 97, timesCited: 1 },
                ],
            };

            engines[eng] = {
                status: hasError ? '⚠ Timed Out' : '✓ Responded',
                mentioned: isMentioned && !hasError,
                rawText: rawResponses[eng],
                competitorsMentioned: isMentioned ? [comp1] : [comp1, comp2],
                sentiment: hasError ? 'Neutral' : sentiment,
                citations: citationSets[eng].filter(c => c.timesCited > 0),
            };
        });

        const mentionedEngines = Object.values(engines).filter(e => e.mentioned).length;
        const overallVisibility = mentionedEngines >= 2 ? 'Mentioned' : mentionedEngines === 1 ? 'Partial' : 'Not Mentioned';
        const sentimentCounts = Object.values(engines).reduce((acc, e) => { acc[e.sentiment] = (acc[e.sentiment] || 0) + 1; return acc; }, {});
        const avgSentiment = Object.entries(sentimentCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Neutral';

        const runDate = new Date(today); runDate.setDate(today.getDate() - (idx % 7));

        return {
            promptId: p.id,
            title: p.title,
            layer: p.layer,
            signal: p.signal,
            query,
            category: p.category,
            runDate: runDate.toISOString().split('T')[0],
            competitorCount: compArr.length,
            avgSentiment,
            overallVisibility,
            engines,
        };
    });
}

// ── Shared UI Components ──────────────────────────────────────────────────────

const EngineBadge = ({ eng }) => {
    const cfg = getEngineConfig(eng);
    const Icon = cfg.icon;
    return (
        <div className="w-6 h-6 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#999] shrink-0" title={cfg.label}>
            <Icon size={12} />
        </div>
    );
};

const TabTrigger = React.forwardRef(({ className, value, children, ...props }, ref) => (
    <Tabs.Trigger
        ref={ref}
        value={value}
        className={`px-5 py-3 text-[13px] font-semibold border-b-2 border-transparent data-[state=active]:border-[#E92A15] data-[state=active]:text-white text-[#888] hover:text-[#bbb] transition-colors outline-none cursor-pointer ${className || ''}`}
        {...props}
    >
        {children}
    </Tabs.Trigger>
));

// ── Expanded Prompt Card ──────────────────────────────────────────────────────

const ExpandedPromptCard = ({ prompt, brandName }) => {
    const enginesList = Object.entries(prompt.engines || {});

    // Compute share of voice from real engine data
    const competitors = new Set();
    enginesList.forEach(([, e]) => {
        // From real data: competitor citations
        (e.citations || []).forEach(c => {
            if (c.isCompetitor && c.domain) competitors.add(c.domain);
        });
        // From mock data: competitorsMentioned (backward compat)
        e.competitorsMentioned?.forEach(c => competitors.add(c));
    });

    const chartData = [
        { name: brandName, count: enginesList.filter(([, e]) => e.mentioned).length, fill: '#E92A15' },
        ...Array.from(competitors).slice(0, 4).map((comp, i) => ({
            name: comp.length > 20 ? comp.substring(0, 18) + '…' : comp,
            count: enginesList.filter(([, e]) => {
                const hasCitation = (e.citations || []).some(c => c.isCompetitor && c.domain === comp);
                const hasMock = e.competitorsMentioned?.includes(comp);
                return hasCitation || hasMock;
            }).length,
            fill: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][i % 4]
        }))
    ].filter(data => data.count > 0);

    const gapsFound = Array.from(competitors).filter(comp => {
        return enginesList.some(([, e]) => {
            const hasCitation = (e.citations || []).some(c => c.isCompetitor && c.domain === comp);
            const hasMock = e.competitorsMentioned?.includes(comp);
            return (hasCitation || hasMock) && !e.mentioned;
        });
    });

    return (
        <div className="border border-[#222] bg-[#0A0A0A] rounded-b-2xl mb-4 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <Tabs.Root defaultValue="raw_response">
                <Tabs.List className="flex border-b border-[#222] bg-[#0f0f0f]">
                    <TabTrigger value="responses">Response Summary</TabTrigger>
                    <TabTrigger value="raw_response">Raw AI Response</TabTrigger>
                    <TabTrigger value="competitors">Competitor Analysis</TabTrigger>
                </Tabs.List>

                {/* Response Summary Tab */}
                <Tabs.Content value="responses" className="p-6">
                    <div className="space-y-3">
                        {enginesList.map(([eng, data]) => {
                            const cfg = getEngineConfig(eng);
                            return (
                                <div key={eng} className="flex items-center gap-4 px-5 py-4 bg-[#111] border border-[#222] rounded-xl">
                                    <div className="flex items-center gap-3 w-32 shrink-0">
                                        <EngineBadge eng={eng} />
                                        <span className="text-[#eee] font-semibold text-[13px]">{cfg.label}</span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded text-[11px] font-medium ${data.status.includes('✓') ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#eab308]/10 text-[#eab308]'}`}>
                                        {data.status}
                                    </span>
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border ${data.mentioned ? 'border-[#22c55e]/30 text-[#22c55e] bg-[#22c55e]/5' : 'border-[#444] text-[#888]'}`}>
                                        {data.mentioned ? <CheckCircle className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {data.mentioned ? 'Brand Mentioned' : 'Brand Omitted'}
                                    </span>
                                    <span className={`text-[12px] font-medium ml-4 ${
                                        data.sentiment === 'Positive' ? 'text-[#22c55e]' :
                                        data.sentiment === 'Negative' ? 'text-[#ef4444]' : 'text-[#888]'
                                    }`}>
                                        {data.sentiment} Sentiment
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Tabs.Content>

                {/* Raw AI Response Tab */}
                <Tabs.Content value="raw_response" className="p-6">
                    <div className="space-y-4">
                        {enginesList.map(([eng, data]) => {
                            const cfg = getEngineConfig(eng);
                            return (
                                <details key={eng} className="group bg-[#111] border border-[#222] rounded-xl overflow-hidden open:border-[#444] transition-all" open>
                                    <summary className="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none bg-[#141414] hover:bg-[#1a1a1a]">
                                        <div className="flex items-center gap-3 shrink-0">
                                            <EngineBadge eng={eng} />
                                            <span className="text-[#eee] font-semibold text-[13px] w-24">{cfg.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#8b5cf6]/10 text-[#a78bfa] flex items-center gap-1.5">
                                                <Terminal className="w-3 h-3" /> Raw AI Payload
                                            </span>
                                        </div>
                                        <div className="flex-1" />
                                        <ChevronDown className="w-4 h-4 text-[#555] group-open:rotate-180 transition-transform" />
                                    </summary>

                                    <div className="p-5 border-t border-[#222] grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {/* Raw Response Panel */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[12px] font-semibold text-[#888] flex items-center gap-2 uppercase tracking-wider">
                                                    <MessageSquare className="w-3.5 h-3.5" /> AI Engine Response Text
                                                </h4>
                                            </div>
                                            <div className="bg-[#050505] p-5 border border-[#1a1a1a] rounded-xl min-h-[140px] max-h-[300px] overflow-y-auto">
                                                <p className="text-[#ccc] text-[13px] leading-[1.6] whitespace-pre-wrap font-mono">
                                                    {data.rawText}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Citations Panel */}
                                        <div className="space-y-2.5">
                                            <h4 className="text-[12px] font-semibold text-[#888] flex items-center gap-2 uppercase tracking-wider">
                                                <Link2 className="w-3.5 h-3.5" /> Citations & Sources
                                            </h4>
                                            {data.citations?.length > 0 ? (
                                                <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                                                    <table className="w-full text-left text-[12px]">
                                                        <thead className="bg-[#161616] text-[#666] border-b border-[#222]">
                                                            <tr>
                                                                <th className="px-4 py-2 font-medium">#</th>
                                                                <th className="px-4 py-2 font-medium">Domain Source</th>
                                                                <th className="px-4 py-2 font-medium w-24 text-center">Category</th>
                                                                <th className="px-4 py-2 font-medium text-center">Brand/Competitor</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#222]">
                                                            {data.citations.map((cite, i) => (
                                                                <tr key={i} className="hover:bg-[#1a1a1a]">
                                                                    <td className="px-4 py-3 text-[#555] font-mono">[{i + 1}]</td>
                                                                    <td className="px-4 py-3 max-w-[180px] truncate">
                                                                        <a href={cite.url} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline flex items-center gap-1.5" title={cite.url}>
                                                                            <img src={`https://www.google.com/s2/favicons?domain=${cite.domain}&sz=16`} className="w-3.5 h-3.5 rounded shrink-0" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
                                                                            {cite.domain} <ExternalLink className="w-3 h-3 shrink-0" />
                                                                        </a>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                                            cite.category === 'review' ? 'bg-[#3b82f6]/10 text-[#60a5fa]' :
                                                                            cite.category === 'forum' ? 'bg-[#8b5cf6]/10 text-[#a78bfa]' :
                                                                            cite.category === 'editorial' ? 'bg-[#f59e0b]/10 text-[#fbbf24]' :
                                                                            cite.category === 'owned' ? 'bg-[#22c55e]/10 text-[#4ade80]' :
                                                                            cite.category === 'competitor' ? 'bg-[#ef4444]/10 text-[#f87171]' :
                                                                            'bg-[#333]/50 text-[#666]'
                                                                        }`}>{cite.category || 'other'}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        {cite.isTargetBrand && <span className="text-[#22c55e] border border-[#22c55e]/30 bg-[#22c55e]/10 px-2 py-0.5 rounded text-[10px]">Your Brand</span>}
                                                                        {cite.isCompetitor && <span className="text-[#eab308] border border-[#eab308]/30 bg-[#eab308]/10 px-2 py-0.5 rounded text-[10px] inline-block truncate max-w-[90px]" title={cite.domain}>Competitor</span>}
                                                                        {!cite.isTargetBrand && !cite.isCompetitor && <span className="text-[#555]">—</span>}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                                    <Globe className="w-8 h-8 text-[#333] mb-3" />
                                                    <p className="text-[#555] text-[13px]">No explicit citations returned for this response.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                </Tabs.Content>

                {/* Competitor Analysis Tab */}
                <Tabs.Content value="competitors" className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[14px] font-semibold text-white flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-[#3b82f6]" /> Share of Voice (This Prompt)
                            </h4>
                            <div className="bg-[#111] border border-[#222] rounded-xl p-5 h-[280px]">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#222" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} width={100} tickLine={false} axisLine={false} />
                                            <RechartsTooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: 12, borderRadius: 8 }} />
                                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#555] text-[13px]">
                                        <Users className="w-8 h-8 text-[#333] mb-3" />
                                        No brand or competitor mentions detected.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[14px] font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-[#eab308]" /> Gap Indicators
                            </h4>
                            {gapsFound.length > 0 ? (
                                <div className="space-y-3">
                                    {gapsFound.map(comp => (
                                        <div key={comp} className="bg-[#2a0e0e] border border-[#E92A15]/40 rounded-xl p-4 flex gap-3">
                                            <AlertTriangle className="w-5 h-5 text-[#E92A15] shrink-0 mt-0.5" />
                                            <div>
                                                <h5 className="text-[#fff] text-[13px] font-medium mb-1">Missed Opportunity vs {comp}</h5>
                                                <p className="text-[#aaa] text-[12px] leading-relaxed">
                                                    An LLM suggested <strong>{comp}</strong> for this prompt, but omitted your brand. Review their cited sources to identify content gaps in your strategy.
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 flex flex-col items-center justify-center text-center h-[280px]">
                                    <CheckCircle className="w-10 h-10 text-[#22c55e] mb-3 opacity-50" />
                                    <span className="text-[#888] text-[13px]">No competitor gaps found here.<br/>You are defending this prompt well!</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Tabs.Content>
            </Tabs.Root>
        </div>
    );
};

// ── Infatica Responses View ───────────────────────────────────────────────────

const PLATFORM_COLORS = {
    perplexity: { bg: '#1e1230', border: '#6d28d9', text: '#a78bfa', dot: '#8b5cf6' },
    gemini:     { bg: '#101824', border: '#1d4ed8', text: '#60a5fa', dot: '#3b82f6' },
    googleAI:   { bg: '#0d1f17', border: '#059669', text: '#34d399', dot: '#10b981' },
    chatgpt:    { bg: '#0d1f17', border: '#059669', text: '#34d399', dot: '#10b981' },
};

function getPlatformStyle(eng) {
    return PLATFORM_COLORS[eng] || { bg: '#141414', border: '#333', text: '#aaa', dot: '#666' };
}

function RawEngineResponsesView({ promptsData, brandName }) {
    const [activePromptId, setActivePromptId] = useState(promptsData[0]?.promptId || null);
    const [activePlatform, setActivePlatform] = useState(null);

    const activePrompt = promptsData.find(p => p.promptId === activePromptId);
    const enginesList = Object.entries(activePrompt?.engines || {});

    // Auto-select first platform when prompt changes
    React.useEffect(() => {
        if (enginesList.length > 0 && !enginesList.find(([k]) => k === activePlatform)) {
            setActivePlatform(enginesList[0][0]);
        }
    }, [activePromptId]);

    const activePlatformData = activePrompt?.engines?.[activePlatform];
    const style = getPlatformStyle(activePlatform);

    return (
        <div className="flex gap-0 h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* LEFT: Prompt List Sidebar */}
            <div className="w-[320px] shrink-0 bg-[#080808] border border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col mr-4">
                <div className="px-4 py-3.5 border-b border-[#1a1a1a] bg-[#0f0f0f]">
                    <p className="text-[11px] font-bold text-[#555] uppercase tracking-widest">Prompts</p>
                </div>
                <div className="overflow-y-auto flex-1">
                    {promptsData.map((p, i) => {
                        const isActive = p.promptId === activePromptId;
                        const platformCount = Object.keys(p.engines || {}).length;
                        return (
                            <button
                                key={p.promptId}
                                onClick={() => setActivePromptId(p.promptId)}
                                className={`w-full text-left px-4 py-3.5 border-b border-[#111] transition-all hover:bg-[#111] ${
                                    isActive ? 'bg-[#111] border-l-2 border-l-[#E92A15]' : 'border-l-2 border-l-transparent'
                                }`}
                            >
                                <p className={`text-[12px] font-medium leading-snug line-clamp-2 ${
                                    isActive ? 'text-white' : 'text-[#888]'
                                }`}>
                                    {p.query}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] text-[#555]">{p.runDate}</span>
                                    <span className="text-[10px] text-[#444]">·</span>
                                    <span className="text-[10px] text-[#555]">{platformCount} platform{platformCount !== 1 ? 's' : ''}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT: Platform Tabs + Response */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Platform Selector */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    {enginesList.map(([eng, data]) => {
                        const cfg = getEngineConfig(eng);
                        const Icon = cfg.icon;
                        const s = getPlatformStyle(eng);
                        const isActiveP = eng === activePlatform;
                        return (
                            <button
                                key={eng}
                                onClick={() => setActivePlatform(eng)}
                                style={isActiveP ? { background: s.bg, borderColor: s.border, color: s.text } : {}}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                                    isActiveP
                                        ? 'shadow-lg'
                                        : 'bg-[#0f0f0f] border-[#222] text-[#666] hover:text-[#aaa] hover:border-[#333]'
                                }`}
                            >
                                <div className={`w-5 h-5 shrink-0 flex items-center justify-center`} style={isActiveP ? { color: s.text } : {}}>
                                    <Icon size={14} />
                                </div>
                                {cfg.label}
                                {data.mentioned && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] ml-0.5" title="Brand mentioned" />
                                )}
                                {!data.status?.includes('✓') && (
                                    <span className="text-[10px] text-[#eab308] ml-0.5">⚠</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {activePlatformData ? (
                    <div className="flex-1 overflow-y-auto space-y-4">

                        {/* Prompt Header */}
                        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl px-5 py-4">
                            <div className="flex items-start gap-3">
                                <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1a] text-[#555] border border-[#222]">
                                    {activePrompt?.category || 'prompt'}
                                </span>
                                <p className="text-[#bbb] text-[13px] leading-relaxed">{activePrompt?.query}</p>
                            </div>
                        </div>

                        {/* Status Row */}
                        <div
                            className="flex items-center gap-3 px-5 py-3.5 rounded-xl border"
                            style={{ background: style.bg, borderColor: style.border }}
                        >
                            <div style={{ color: style.dot }}>
                                {(() => { const cfg = getEngineConfig(activePlatform); const Icon = cfg.icon; return <Icon size={18} />; })()}
                            </div>
                            <span className="font-semibold text-[14px]" style={{ color: style.text }}>
                                {getEngineConfig(activePlatform).label}
                            </span>
                            <span className={`ml-2 px-2.5 py-1 rounded text-[11px] font-medium ${
                                activePlatformData.status?.includes('✓') ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#eab308]/10 text-[#eab308]'
                            }`}>
                                {activePlatformData.status}
                            </span>
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border ${
                                activePlatformData.mentioned
                                    ? 'border-[#22c55e]/30 text-[#22c55e] bg-[#22c55e]/5'
                                    : 'border-[#333] text-[#666]'
                            }`}>
                                {activePlatformData.mentioned ? <CheckCircle className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {activePlatformData.mentioned ? 'Brand Mentioned' : 'Brand Omitted'}
                            </span>
                            <span className="ml-auto text-[11px] font-medium" style={{ color:
                                activePlatformData.sentiment === 'Positive' ? '#22c55e' :
                                activePlatformData.sentiment === 'Negative' ? '#ef4444' : '#888'
                            }}>
                                {activePlatformData.sentiment} Tone
                            </span>
                        </div>

                        {/* Raw Response */}
                        <div className="bg-[#070707] border border-[#1a1a1a] rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                                <MessageSquare className="w-3.5 h-3.5 text-[#555]" />
                                <span className="text-[11px] font-bold text-[#555] uppercase tracking-widest">AI Engine Raw Response</span>
                            </div>
                            <div className="p-5 max-h-[280px] overflow-y-auto">
                                <pre className="text-[#ccc] text-[13px] leading-[1.7] whitespace-pre-wrap font-mono">
                                    {activePlatformData.rawText || 'No response text captured.'}
                                </pre>
                            </div>
                        </div>

                                {/* Citations & Sources — real data from Infatica */}
                        <div className="bg-[#070707] border border-[#1a1a1a] rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                                <div className="flex items-center gap-2.5">
                                    <Link2 className="w-3.5 h-3.5 text-[#555]" />
                                    <span className="text-[11px] font-bold text-[#555] uppercase tracking-widest">Sources & Citations</span>
                                </div>
                                <span className="text-[11px] text-[#555]">{activePlatformData.citations?.length || 0} sources captured</span>
                            </div>
                            {activePlatformData.citations?.length > 0 ? (
                                <table className="w-full text-[12px]">
                                    <thead className="bg-[#0f0f0f] text-[#555] border-b border-[#1a1a1a]">
                                        <tr>
                                            <th className="px-5 py-2.5 text-left font-semibold">#</th>
                                            <th className="px-5 py-2.5 text-left font-semibold">Source Domain</th>
                                            <th className="px-5 py-2.5 text-left font-semibold">Full URL</th>
                                            <th className="px-5 py-2.5 text-center font-semibold">Category</th>
                                            <th className="px-5 py-2.5 text-center font-semibold">Brand / Competitor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#111]">
                                        {activePlatformData.citations.map((cite, i) => (
                                            <tr key={i} className="hover:bg-[#0f0f0f] transition-colors">
                                                <td className="px-5 py-3 text-[#444] font-mono">[{i + 1}]</td>
                                                <td className="px-5 py-3">
                                                    <span className="flex items-center gap-2">
                                                        <img
                                                            src={`https://www.google.com/s2/favicons?domain=${cite.domain}&sz=32`}
                                                            className="w-4 h-4 rounded shrink-0"
                                                            alt=""
                                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                        <span className="text-[#ddd] font-medium">{cite.domain}</span>
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 max-w-[240px]">
                                                    <a
                                                        href={cite.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#3b82f6] hover:underline flex items-center gap-1 truncate"
                                                        title={cite.url}
                                                    >
                                                        <span className="truncate">{cite.url}</span>
                                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                                    </a>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                        cite.category === 'review' ? 'bg-[#3b82f6]/10 text-[#60a5fa]' :
                                                        cite.category === 'forum' ? 'bg-[#8b5cf6]/10 text-[#a78bfa]' :
                                                        cite.category === 'editorial' ? 'bg-[#f59e0b]/10 text-[#fbbf24]' :
                                                        cite.category === 'owned' ? 'bg-[#22c55e]/10 text-[#4ade80]' :
                                                        cite.category === 'competitor' ? 'bg-[#ef4444]/10 text-[#f87171]' :
                                                        'bg-[#333]/50 text-[#666]'
                                                    }`}>{cite.category || 'other'}</span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {cite.isTargetBrand && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">Your Brand</span>
                                                    )}
                                                    {cite.isCompetitor && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20 truncate max-w-[100px] inline-block" title={cite.domain}>
                                                            Competitor
                                                        </span>
                                                    )}
                                                    {!cite.isTargetBrand && !cite.isCompetitor && (
                                                        <span className="text-[#444]">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <Globe className="w-8 h-8 text-[#222]" />
                                    <p className="text-[#444] text-[13px]">No citations captured for this engine response.</p>
                                    <p className="text-[#333] text-[11px]">This engine may not have returned source URLs for this prompt.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Terminal className="w-10 h-10 text-[#222]" />
                        <p className="text-[#555] text-[14px]">Select a prompt and platform to view the AI engine response.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PromptIntelPage({ user }) {
    const [viewTab, setViewTab] = useState('prompts'); // 'prompts' | 'raw_engines' | 'competitors_layer'
    const [expandedPrompt, setExpandedPrompt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const scanData = useMemo(() => getVisibilityData(user?.domain, user?.projectId), [user?.domain, user?.projectId]);
    const promptsData = useMemo(() => scanData?.prompts?.length ? scanData.prompts : [], [scanData]);

    const filteredPrompts = promptsData.filter(p => !searchQuery || p.query?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Analytics for Header — derived entirely from real scan data (p.engines)
    const totalPrompts = promptsData.length;
    const mentionedCount = promptsData.filter(p => {
        const engines = Object.values(p.engines || {});
        return engines.some(e => e.mentioned === true);
    }).length;
    const totalSources = promptsData.reduce((sum, p) => {
        return sum + Object.values(p.engines || {}).reduce((s, e) => s + (e.citationCount || e.citations?.length || 0), 0);
    }, 0);

    if (promptsData.length === 0) {
        return (
            <div className="w-full pb-12">
                <div className="h-[105px] flex items-end justify-between -mt-8 -mx-8 px-8 pb-3 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                    <div className="flex items-center gap-4 pb-1">
                        <div className="w-11 h-11 bg-[#0a0505] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                            <Terminal className="w-5 h-5 text-[#E92A15]" />
                        </div>
                        <div>
                            <h1 className="text-[19px] font-semibold text-white tracking-tight">Prompt Intelligence</h1>
                            <p className="text-[#666] text-[13px] mt-0.5">Analyze exact LLM responses, citations, and competitor overlap</p>
                        </div>
                    </div>
                </div>
                <div className="mt-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-[#333] mb-6">
                        <Activity className="w-8 h-8 text-[#666]" />
                    </div>
                    <h2 className="text-[22px] font-bold text-white tracking-tight">No data comes from backend</h2>
                    <p className="text-[#888] text-[14px] max-w-[400px] mt-2">
                        You need to click on run visibility scan to fetch new live responses directly from the AI engines.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full pb-12">
            {/* ── Sticky Header ── */}
            <div className="h-[105px] flex items-end justify-between -mt-8 -mx-8 px-8 pb-3 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4 pb-1">
                    <div className="w-11 h-11 bg-[#0a0505] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Terminal className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Prompt Intelligence</h1>
                        <p className="text-[#666] text-[13px] mt-0.5">Analyze exact LLM responses, citations, and competitor overlap</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 bg-[#111] p-1 rounded-xl border border-[#222]">
                    <button onClick={() => setViewTab('prompts')} className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${viewTab === 'prompts' ? 'bg-[#E92A15] text-white shadow-md' : 'text-[#888] hover:text-[#bbb]'}`}>
                        Prompts View
                    </button>
                    <button onClick={() => setViewTab('raw_engines')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${viewTab === 'raw_engines' ? 'bg-[#6d28d9] text-white shadow-md shadow-purple-900/30' : 'text-[#888] hover:text-[#bbb]'}`}>
                        <Terminal className="w-3.5 h-3.5" /> AI Engine Responses
                    </button>
                    <button onClick={() => setViewTab('competitors_layer')} className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${viewTab === 'competitors_layer' ? 'bg-[#E92A15] text-white shadow-md' : 'text-[#888] hover:text-[#bbb]'}`}>
                        Competitors Layer
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {viewTab === 'raw_engines' ? (
                    <RawEngineResponsesView promptsData={filteredPrompts} brandName={user?.brandName || 'Your Brand'} />
                ) : viewTab === 'prompts' ? (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* ── KPI Cards ── */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5">
                                <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.14em] mb-3">TOTAL PROMPTS</p>
                                <p className="text-white text-[38px] font-bold tracking-tight leading-none">{totalPrompts}</p>
                            </div>
                            <div className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5">
                                <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.14em] mb-3">BRAND VISIBLE IN</p>
                                <p className="text-white text-[38px] font-bold tracking-tight leading-none">
                                    <span className="text-[#22c55e]">{mentionedCount}</span>
                                    <span className="text-[#555] text-[18px] ml-1">/ {totalPrompts}</span>
                                </p>
                            </div>
                            <div className="bg-[#0B0B0B] border border-[#1e1e1e] rounded-2xl p-5">
                                <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.14em] mb-3">TOTAL SOURCES</p>
                                <p className="text-white text-[38px] font-bold tracking-tight leading-none">{totalSources}</p>
                            </div>
                        </div>

                        {/* ── Filter Bar ── */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search specific prompts..."
                                    className="w-full pl-11 pr-4 py-3 bg-[#0B0B0B] border border-[#222] rounded-xl text-[#eee] text-[13px] placeholder:text-[#555] focus:outline-none focus:border-[#E92A15]/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* ── Prompt List Header ── */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[11px] font-bold text-[#555] uppercase tracking-wider bg-[#0f0f0f] rounded-xl border border-[#1a1a1a]">
                            <div className="col-span-5">Prompt Query</div>
                            <div className="col-span-2 text-center">Platforms</div>
                            <div className="col-span-2 text-center">Brand Visibility</div>
                            <div className="col-span-1 text-center">Competitors</div>
                            <div className="col-span-1 text-center">Sentiment</div>
                            <div className="col-span-1 text-right">Last Run</div>
                        </div>

                        {/* ── Prompt List Body ── */}
                        <div className="space-y-0">
                            {filteredPrompts.map((p) => {
                                const isExpanded = expandedPrompt === p.promptId;
                                const engineEntries = Object.entries(p.engines || {});
                                const plCount = engineEntries.length;
                                const plResponded = engineEntries.filter(([, e]) => e.status?.includes('✓')).length;

                                // Derive display values from real engine data
                                const mentionedEngines = engineEntries.filter(([, e]) => e.mentioned).length;
                                const overallVisibility = mentionedEngines >= 2 ? 'Mentioned' : mentionedEngines === 1 ? 'Partial' : 'Not Mentioned';

                                const allSentiments = engineEntries
                                    .filter(([, e]) => e.mentioned && e.sentiment)
                                    .map(([, e]) => e.sentiment);
                                const sentimentCounts = allSentiments.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
                                const avgSentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
                                const sentimentLabel = avgSentiment.charAt(0).toUpperCase() + avgSentiment.slice(1);

                                const competitorCount = engineEntries.reduce((count, [, e]) => {
                                    const compCitations = (e.citations || []).filter(c => c.isCompetitor).map(c => c.domain);
                                    return count + compCitations.length;
                                }, 0);

                                const sourceCount = engineEntries.reduce((s, [, e]) => s + (e.citationCount || e.citations?.length || 0), 0);

                                return (
                                    <React.Fragment key={p.promptId}>
                                        <button
                                            onClick={() => setExpandedPrompt(isExpanded ? null : p.promptId)}
                                            className={`w-full grid grid-cols-12 gap-4 px-6 py-4 items-center text-left transition-colors border-x border-[#222] ${isExpanded ? 'bg-[#0A0A0A] border-t border-[#E92A15]/30 mt-3 rounded-t-2xl' : 'bg-[#0e0e0e] border-y hover:bg-[#141414]'}`}
                                        >
                                            <div className="col-span-5 pr-4">
                                                <p className="text-[#ddd] text-[13px] font-medium leading-snug line-clamp-2">{p.query}</p>
                                            </div>
                                            <div className="col-span-2 flex justify-center items-center gap-1.5 text-[12px] text-[#888]">
                                                <Activity className="w-3.5 h-3.5 text-[#555]" /> {plResponded}/{plCount}
                                            </div>
                                            <div className="col-span-2 flex justify-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                    overallVisibility === 'Mentioned' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30' :
                                                    overallVisibility === 'Partial' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30' :
                                                    'bg-[#444]/20 text-[#888] border border-[#333]'
                                                }`}>
                                                    {overallVisibility}
                                                </span>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1a1a1a] border border-[#222] text-[#aaa] text-[11px] font-medium">
                                                    <Link2 className="w-3 h-3" /> {sourceCount}
                                                </span>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <span className={`text-[12px] font-medium ${
                                                    sentimentLabel === 'Positive' ? 'text-[#22c55e]' :
                                                    sentimentLabel === 'Negative' ? 'text-[#ef4444]' : 'text-[#888]'
                                                }`}>
                                                    {sentimentLabel}
                                                </span>
                                            </div>
                                            <div className="col-span-1 flex justify-end items-center gap-2">
                                                <span className="text-[#666] text-[11px]">{p.runDate || '—'}</span>
                                                <ChevronDown className={`w-4 h-4 text-[#888] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>

                                        {isExpanded && <ExpandedPromptCard prompt={p} brandName={user?.brandName || 'Your Brand'} />}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Competitors Cross-Prompt View */}
                        <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-8 text-center min-h-[500px] flex flex-col justify-center">
                            <div className="w-16 h-16 bg-[#111] border border-[#222] rounded-2xl flex items-center justify-center mx-auto mb-5 relative overflow-hidden group">
                                <Users className="w-8 h-8 text-[#E92A15] relative z-10" />
                                <div className="absolute inset-0 bg-[#E92A15]/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                            </div>
                            <h2 className="text-[22px] font-bold text-white tracking-tight mb-3">Cross-Prompt Competitor Intelligence</h2>
                            <p className="text-[#888] text-[14px] max-w-lg mx-auto mb-8">
                                Aggregated macro data mapping exactly where competitors are beating you across all tested prompts, outlining specific sources and domain gaps.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                <div className="p-6 border border-[#222] rounded-xl bg-[#0e0e0e] text-left hover:border-[#333] transition-colors">
                                    <BarChart3 className="w-6 h-6 text-[#3b82f6] mb-4" />
                                    <h3 className="text-white text-[15px] font-semibold mb-2">Global Share of Voice</h3>
                                    <p className="text-[#777] text-[13px] leading-relaxed">See which rival domains dominate explicit LLM mentions across the entire Prompt Intelligence platform.</p>
                                </div>
                                <div className="p-6 border border-[#222] rounded-xl bg-[#0e0e0e] text-left hover:border-[#333] transition-colors">
                                    <Globe className="w-6 h-6 text-[#10b981] mb-4" />
                                    <h3 className="text-white text-[15px] font-semibold mb-2">Citation Overlap</h3>
                                    <p className="text-[#777] text-[13px] leading-relaxed">Discover which high-Domain Authority (DA) publishers successfully drive citations for competitors, but not you.</p>
                                </div>
                                <div className="p-6 border border-[#222] rounded-xl bg-[#0e0e0e] text-left hover:border-[#333] transition-colors">
                                    <Activity className="w-6 h-6 text-[#f59e0b] mb-4" />
                                    <h3 className="text-white text-[15px] font-semibold mb-2">Trending Alerts</h3>
                                    <p className="text-[#777] text-[13px] leading-relaxed">Get notified of spikes in competitor visibility within top-tier foundational models (ChatGPT, Gemini).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
