import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
function getModel() {
    if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

function safeParse(text) {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

// PROMPTS 6–9 — Competitive Intel: SOV, Ranking, Sentiment, Threat Radar (Enhanced)
export function generateCompetitorPrompts(brandName, domain, industry, competitors, location) {
    const compList = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
    const compStr = compList.slice(0, 5).join(', ') || 'major competitors in the industry';
    const year = new Date().getFullYear();

    return [
        {
            id: 'sov_analysis',
            type: 'share_of_voice',
            // PROMPT 6 — Share of Voice (Enhanced)
            prompt: `ROLE:
You are a digital market intelligence analyst specializing in Share of Voice (SOV) measurement. You synthesize data from Google Trends, media monitoring, social listening, and SEO tools to estimate brand presence across channels.

CONTEXT:
You are conducting a 6-month retrospective SOV analysis for "${brandName}" against these competitors: ${compStr}. SOV measures what percentage of the total industry conversation each brand "owns."

REASONING STEPS (apply before producing numbers):
Step 1 — Establish the total: The SOV percentages for ALL brands in this response MUST sum to 100. Decide the rough split first.
Step 2 — Estimate by evidence signals: For each brand, consider:
          • Web presence (domain authority, organic traffic signals)
          • Media mentions (PR, news, industry publications)
          • Social media activity (LinkedIn, Twitter/X, YouTube)
Step 3 — Assign confidence: Use these rules:
          • "high" = brand is well-known with clearly observable public data
          • "medium" = brand is known but data is patchy or regional
          • "low" = brand is niche, private, or has minimal public presence
Step 4 — Identify key topics: For each brand, name 2–4 SPECIFIC topics or themes they are currently associated with (e.g. "AI-powered SEO audits", "enterprise link building") — not generic terms like "SEO."
Step 5 — Determine traffic channels: Choose from: organic_search, paid_search, social_media, direct, referral, email, pr_and_media

CONSTRAINTS:
✅ All estimated_sov_percent values MUST sum to exactly 100
✅ Include BOTH "${brandName}" AND all brands in: ${compStr}
✅ key_topics must be specific and evidence-based — no generic labels
✅ If a brand is extremely small, it may have sov_percent of 1–3 (but still include it)
❌ Do not assign identical SOV scores to all brands (that signals the model didn't reason)
❌ Do not return markdown, explanation, or extra text

FALLBACK:
If you cannot estimate a brand's SOV with any confidence, assign:
estimated_sov_percent: 1, data_confidence: "low",
and add a "note" field: "Insufficient public data — estimate only"

OUTPUT FORMAT:
Return ONLY a valid raw JSON array (brands ordered by SOV descending):
[{"brand_name":"Name","estimated_sov_percent":35,"search_interest_trend":"up","primary_traffic_channels":["organic_search","social_media"],"key_topics":["specific topic 1","specific topic 2"],"data_confidence":"high"}]`,
            category: 'competitor_sov',
            weight: 1.0,
        },
        {
            id: 'market_ranking',
            type: 'industry_ranking',
            // PROMPT 7 — Industry Ranking (Enhanced)
            prompt: `ROLE:
You are a market research analyst who specializes in competitive positioning and industry benchmarking. You draw from sources like G2, Gartner, Forrester, IDC, Capterra, Trustpilot, and industry trade publications.

CONTEXT:
You are building an industry ranking table for the "${industry}" sector in "${location || 'the global market'}" as of ${year}. The brands to rank are: ${brandName} and ${compStr}.

REASONING STEPS:
Step 1 — Assess each brand's market presence: Consider factors like funding, company size, customer base, geographic reach, and product maturity.
Step 2 — Cross-reference public signals: Think of analyst reports (G2 Grid, Gartner Magic Quadrant, Forrester Wave), review volumes, and press coverage to establish relative rankings.
Step 3 — Assign rankings: Rank from 1 (most dominant) downward. No two brands can share the same ranking.
Step 4 — Estimate market share: Only provide a specific number if you have high confidence. Otherwise use null and note low confidence.
Step 5 — Awards check: Only list awards that actually exist and are plausible for ${year} or ${year - 1}. Common real awards: "G2 Leader", "G2 High Performer", "Capterra Top 20", "Gartner Peer Insights Customers' Choice". Do NOT invent award names.
Step 6 — Source type: Use "analyst_report" only if a named report exists; "industry_publication" if from trade press; "estimate" if inferred.

CONSTRAINTS:
✅ All brands in [${brandName}, ${compStr}] must be included
✅ Rankings must be unique — no ties
✅ estimated_market_share_percent must be null if genuinely unknown
✅ recent_awards must only include real, named industry awards
✅ key_strengths must be specific differentiators — not generic phrases like "good UI"
❌ Do not fabricate award names or analyst report placements
❌ Do not return markdown or explanation

FALLBACK:
If a brand is too new or niche to rank meaningfully, set:
ranking: null, source_type: "estimate",
and add "note": "Insufficient data to rank confidently"

OUTPUT FORMAT:
Return ONLY a valid raw JSON array sorted by ranking (ascending, nulls last):
[{"ranking":1,"brand_name":"Name","estimated_market_share_percent":35,"key_strengths":["specific strength 1","specific strength 2"],"recent_awards":["G2 Leader ${year}","Capterra Top 20"],"source_type":"analyst_report"}]`,
            category: 'competitor_ranking',
            weight: 1.0,
        },
        {
            id: 'sentiment_weakness',
            type: 'sentiment_analysis',
            // PROMPT 8 — Sentiment Analysis (Enhanced)
            prompt: `ROLE:
You are a customer experience analyst who specializes in synthesizing brand sentiment from review platforms, community forums, and social media. You understand the difference between feature-level praise/complaints and overall brand perception.

CONTEXT:
You are comparing customer sentiment for "${brandName}" against these competitors: ${compStr}. Your data sources should be: G2, Capterra, Trustpilot, Reddit (relevant subreddits), and industry forums. Focus on reviews from the last 12 months where possible.

REASONING STEPS:
Step 1 — Assess overall sentiment per brand: Based on review platform signals, is the brand predominantly praised, criticized, or mixed?
Step 2 — Score it: Use this scale for sentiment_score:
          80–100 = strongly positive (fans, advocates)
          60–79  = mostly positive (satisfied but with some complaints)
          40–59  = mixed (polarized reviews)
          20–39  = mostly negative (common frustration)
          0–19   = strongly negative (major trust or product issues)
Step 3 — Extract specific praise and complaints: Think of the actual words and themes reviewers use. Avoid generic labels like "bad support" — be specific: "slow ticket response times (48+ hours reported)."
Step 4 — Evaluate opportunity_for_you: Set to TRUE only if a competitor's top complaint directly maps to something "${brandName}" is known for doing well. Otherwise set FALSE.
Step 5 — Estimate review volume:
          "high" = 500+ reviews across platforms
          "medium" = 50–499 reviews
          "low" = fewer than 50 reviews or brand is too niche

CONSTRAINTS:
✅ Include "${brandName}" AND all brands in: ${compStr}
✅ top_praised_features and top_complaints must be specific — no generic phrases
✅ average_rating must be on a 1–5 scale
✅ opportunity_for_you must be true ONLY with a specific reason attached
❌ Do not fabricate reviews or invent ratings
❌ Do not return markdown or explanation

FALLBACK:
If a brand has very few reviews or minimal public sentiment data:
set overall_sentiment: "unknown", sentiment_score: null,
review_volume: "low", and add "note": "Insufficient review data available"

OUTPUT FORMAT:
Return ONLY a valid raw JSON array:
[{"brand_name":"Name","overall_sentiment":"positive","sentiment_score":72,"top_praised_features":["specific praise 1","specific praise 2"],"top_complaints":["specific complaint 1","specific complaint 2"],"average_rating":4.2,"review_volume":"high","opportunity_for_you":false,"opportunity_reason":null}]`,
            category: 'competitor_sentiment',
            weight: 1.0,
        },
        {
            id: 'threat_radar',
            type: 'strategic_moves',
            // PROMPT 9 — Threat Radar (Enhanced)
            prompt: `ROLE:
You are a competitive strategy analyst who tracks market intelligence for fast-moving digital industries. You monitor competitor activity through press releases, product changelogs, funding databases (Crunchbase, PitchBook), and industry news to identify moves that could shift market dynamics.

CONTEXT:
You are analyzing strategic moves made by these competitors of "${brandName}" in the last 3–6 months: ${compStr}. Your job is to surface moves that create a competitive threat or unexpected opportunity for "${brandName}."

REASONING STEPS:
Step 1 — Recall recent activity: For each competitor in [${compStr}], think through known recent events: product launches, pricing page changes, press releases, job postings (signal of expansion), funding announcements, acquisitions, and executive hires.
Step 2 — Filter for relevance: Only include moves that could directly affect "${brandName}"'s market position, customer acquisition, or pricing power. Skip minor or irrelevant updates.
Step 3 — Classify accurately: Use the move_type list below. If an event doesn't cleanly fit, use "other" and describe it clearly.
Step 4 — Assess impact: Be specific about WHY it's high/medium/low impact for "${brandName}" specifically — not generically for the market.
Step 5 — Write a concrete recommended_action: This should be a real, executable suggestion — not "monitor closely."
          Example: "Publish a comparison landing page targeting [Competitor] switchers within 30 days."

CRITICAL HONESTY RULE:
If you are not confident a specific event happened, do NOT include it.
It is better to return fewer items than to fabricate recent news.
Only include events you can describe with reasonable specificity.

MOVE TYPE DEFINITIONS:
- "product_launch" — new product, major feature, or version release
- "pricing" — pricing model change, discount campaign, or freemium launch
- "acquisition" — company or asset purchase
- "partnership" — major integration, channel, or co-marketing deal
- "leadership" — C-suite hire or departure
- "funding" — seed, Series A–Z, or IPO announcement
- "marketing" — major campaign, rebrand, or aggressive ad spend
- "expansion" — new market, geography, or customer segment
- "other" — anything significant that doesn't fit above

FALLBACK:
If a competitor has no notable moves in the last 3–6 months:
Include one entry per quiet competitor with:
move_type: "other",
description: "No significant strategic moves detected in this period.",
impact_level: "low", threat_or_opportunity: "neutral",
recommended_action: "Continue monitoring [competitor] quarterly."

CONSTRAINTS:
✅ Cover every competitor listed in: ${compStr}
✅ Sort output by impact_level: high → medium → low
✅ recommended_action must be specific and executable — not "monitor closely"
✅ date_approximate must be in YYYY-MM format, or "recent" if month is unknown
❌ Do not fabricate events — if unsure, omit or use the fallback
❌ Do not return markdown or explanation

OUTPUT FORMAT:
Return ONLY a valid raw JSON array:
[{"competitor_name":"Name","move_type":"product_launch","description":"Specific 1–2 sentence description of what happened and why it matters.","impact_level":"high","date_approximate":"2025-11","threat_or_opportunity":"threat","recommended_action":"Specific, executable action for ${brandName}"}]`,
            category: 'competitor_threats',
            weight: 1.0,
        },
    ];
}

export async function runCompetitorAnalysis(brandName, domain, industry, competitors, location, queryEngine) {
    const prompts = generateCompetitorPrompts(brandName, domain, industry, competitors, location);
    const results = {
        shareOfVoice: null,
        industryRanking: null,
        sentimentAnalysis: null,
        threatRadar: null,
        rawResponses: {},
        errors: [],
    };

    for (const prompt of prompts) {
        try {
            const html = await queryEngine(prompt.prompt);
            if (!html) {
                results.errors.push({ type: prompt.type, error: 'No response from AI engine' });
                continue;
            }

            const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            results.rawResponses[prompt.type] = text;

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    switch (prompt.type) {
                        case 'share_of_voice':
                            results.shareOfVoice = normalizeSOVData(parsed, brandName, competitors);
                            break;
                        case 'industry_ranking':
                            results.industryRanking = normalizeRankingData(parsed, brandName);
                            break;
                        case 'sentiment_analysis':
                            results.sentimentAnalysis = normalizeSentimentData(parsed, brandName);
                            break;
                        case 'strategic_moves':
                            results.threatRadar = normalizeThreatData(parsed);
                            break;
                    }
                } catch (parseErr) {
                    results.errors.push({ type: prompt.type, error: `JSON parse failed: ${parseErr.message}` });
                }
            } else {
                results.errors.push({ type: prompt.type, error: 'No JSON found in response' });
            }
        } catch (err) {
            results.errors.push({ type: prompt.type, error: err.message });
        }
    }

    return results;
}

function normalizeSOVData(data, brandName, competitors) {
    if (!Array.isArray(data)) return null;

    const compNames = competitors.map(c => (typeof c === 'string' ? c : c.name).toLowerCase());
    const brandLower = brandName.toLowerCase();

    return data.map(item => ({
        brandName: item.brand_name || item.brandName || 'Unknown',
        sovPercent: Number(item.estimated_sov_percent || item.sovPercent || 0),
        trend: item.search_interest_trend || item.trend || 'stable',
        trafficChannels: Array.isArray(item.primary_traffic_channels) ? item.primary_traffic_channels : [],
        keyTopics: Array.isArray(item.key_topics) ? item.key_topics : [],
        confidence: item.data_confidence || 'medium',
        note: item.note || null,
        isTargetBrand: (item.brand_name || '').toLowerCase().includes(brandLower) ||
            brandLower.includes((item.brand_name || '').toLowerCase()),
        isCompetitor: compNames.some(c => (item.brand_name || '').toLowerCase().includes(c)),
    })).sort((a, b) => b.sovPercent - a.sovPercent);
}

function normalizeRankingData(data, brandName) {
    if (!Array.isArray(data)) return null;

    const brandLower = brandName.toLowerCase();

    return data.map((item, idx) => ({
        rank: item.ranking || idx + 1,
        brandName: item.brand_name || item.brandName || 'Unknown',
        marketShare: item.estimated_market_share_percent ?? null,
        keyStrengths: Array.isArray(item.key_strengths) ? item.key_strengths : [],
        awards: Array.isArray(item.recent_awards) ? item.recent_awards : [],
        sourceType: item.source_type || 'estimate',
        note: item.note || null,
        isTargetBrand: (item.brand_name || '').toLowerCase().includes(brandLower),
    })).sort((a, b) => {
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return a.rank - b.rank;
    });
}

function normalizeSentimentData(data, brandName) {
    if (!Array.isArray(data)) return null;

    const brandLower = brandName.toLowerCase();

    return data.map(item => ({
        brandName: item.brand_name || item.brandName || 'Unknown',
        overallSentiment: item.overall_sentiment || 'neutral',
        sentimentScore: item.sentiment_score != null ? Number(item.sentiment_score) : null,
        topPraisedFeatures: Array.isArray(item.top_praised_features) ? item.top_praised_features : [],
        topComplaints: Array.isArray(item.top_complaints) ? item.top_complaints : [],
        averageRating: item.average_rating != null ? Number(item.average_rating) : null,
        reviewVolume: item.review_volume || 'medium',
        isOpportunity: item.opportunity_for_you === true,
        opportunityReason: item.opportunity_reason || null,
        note: item.note || null,
        isTargetBrand: (item.brand_name || '').toLowerCase().includes(brandLower),
        trafficLight: getSentimentColor(item.overall_sentiment, item.sentiment_score),
    })).sort((a, b) => (b.sentimentScore ?? 0) - (a.sentimentScore ?? 0));
}

function getSentimentColor(sentiment, score) {
    if (sentiment === 'positive' || score >= 70) return 'green';
    if (sentiment === 'negative' || score <= 40) return 'red';
    return 'yellow';
}

function normalizeThreatData(data) {
    if (!Array.isArray(data)) return null;

    const impactOrder = { high: 0, medium: 1, low: 2 };

    return data.map(item => ({
        competitor: item.competitor_name || 'Unknown',
        moveType: item.move_type || 'other',
        description: item.description || '',
        impactLevel: item.impact_level || 'medium',
        date: item.date_approximate || 'recent',
        classification: item.threat_or_opportunity || 'neutral',
        recommendedAction: item.recommended_action || '',
        impactColor: item.impact_level === 'high' ? 'red' : item.impact_level === 'medium' ? 'yellow' : 'gray',
    })).sort((a, b) => (impactOrder[a.impactLevel] || 2) - (impactOrder[b.impactLevel] || 2));
}

// PROMPT 10 — Competitive Intel: Executive Summary (Enhanced)
export async function generateCompetitorInsights(analysisResults, brandName, industry) {
    const model = getModel();

    const dataSnapshot = {
        sov: analysisResults.shareOfVoice?.slice(0, 5) || [],
        ranking: analysisResults.industryRanking?.slice(0, 5) || [],
        sentiment: analysisResults.sentimentAnalysis?.slice(0, 5) || [],
        threats: analysisResults.threatRadar?.slice(0, 5) || [],
    };

    // Determine which modules have data for the dataGaps field
    const hasSOV = dataSnapshot.sov.length > 0;
    const hasRanking = dataSnapshot.ranking.length > 0;
    const hasSentiment = dataSnapshot.sentiment.length > 0;
    const hasThreats = dataSnapshot.threats.length > 0;

    const prompt = `ROLE:
You are a Chief Strategy Officer-level competitive analyst. You synthesize complex, multi-source market data into clear executive briefings that help leadership teams make fast, confident decisions.

CONTEXT:
You have just completed a full competitive intelligence analysis for "${brandName}" in the "${industry}" industry. The analysis consists of four modules: Share of Voice (SOV), Industry Ranking, Customer Sentiment, and Threat Radar.

FULL ANALYSIS DATA:
${JSON.stringify(dataSnapshot, null, 2)}

DATA STRUCTURE GUIDE:
- dataSnapshot.sov → Share of Voice array${!hasSOV ? ' [EMPTY — data unavailable]' : ''}
- dataSnapshot.ranking → Industry ranking array${!hasRanking ? ' [EMPTY — data unavailable]' : ''}
- dataSnapshot.sentiment → Sentiment analysis array${!hasSentiment ? ' [EMPTY — data unavailable]' : ''}
- dataSnapshot.threats → Threat radar array${!hasThreats ? ' [EMPTY — data unavailable]' : ''}

REASONING STEPS:
Step 1 — Extract "${brandName}"'s position in each available module:
          • SOV: What % does it own? Trending up or down?
          • Ranking: What position? What are its noted strengths?
          • Sentiment: What score? What do customers praise/complain about?
          • Threats: Are incoming threats rated high impact?
Step 2 — Look for convergent signals: Do multiple modules tell the same story?
Step 3 — Look for contradictions: High SOV but poor sentiment? Good ranking but high threats? Note these tensions.
Step 4 — Assign competitive position using this rubric:
          "leading" — top 1–2 in ranking + high SOV + positive sentiment
          "strong" — top 3 ranking + good SOV + mostly positive sentiment
          "competitive" — mid-table ranking, moderate SOV, mixed signals
          "challenging" — below mid-table, low SOV, mixed or negative sentiment
          "weak" — bottom ranking, minimal SOV, poor sentiment, high threats
Step 5 — Prioritize actions: Rank by impact × urgency.
          High priority = can be acted on in 30 days and would meaningfully shift position.
          Medium = 30–90 day horizon. Low = strategic, longer-term plays.

CONSTRAINTS:
✅ Every conclusion must trace to at least one data point in the snapshot
✅ If a module's array is empty, state "Data unavailable for [module]" — don't guess
✅ recommendedActions must have at least 1 high-priority item
✅ competitorToWatch must be the single most threatening competitor — not just the largest
❌ Do not fabricate data to fill gaps
❌ Return ONLY valid JSON — no markdown, no explanation

OUTPUT FORMAT:
{
  "executiveSummary": "2–3 sentences synthesizing the overall competitive position.",
  "competitivePosition": "leading|strong|competitive|challenging|weak",
  "positionRationale": "1 sentence explaining why this position was assigned.",
  "topOpportunities": ["Specific opportunity grounded in data","Second opportunity","Third opportunity"],
  "topThreats": ["Specific threat from data","Second threat","Third threat"],
  "recommendedActions": [
    {"action": "Specific, executable action","priority": "high|medium|low","impact": "Expected measurable outcome","timeframe": "30 days|30–90 days|90+ days"}
  ],
  "competitorToWatch": {"name": "Competitor name","reason": "Specific reason why they pose the greatest near-term threat"},
  "dataGaps": ["List any modules that returned no data — omit field if all modules had data"]
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return safeParse(text);
    } catch (err) {
        console.error('[CompetitorInsights] Failed:', err.message);
        return null;
    }
}
