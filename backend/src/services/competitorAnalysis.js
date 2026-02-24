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

export function generateCompetitorPrompts(brandName, domain, industry, competitors, location) {
    const compList = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
    const compStr = compList.slice(0, 3).join(', ') || 'major competitors in the industry';
    const year = new Date().getFullYear();

    return [
        {
            id: 'sov_analysis',
            type: 'share_of_voice',
            prompt: `Conduct a digital Share of Voice (SOV) analysis for ${brandName} compared to these main competitors: ${compStr} over the last 6 months. Analyze web search interest, media mentions, and social media presence.

Output the findings in a JSON table format with these columns for each brand:
- brand_name
- estimated_sov_percent (number 0-100)
- search_interest_trend ("up", "down", or "stable")
- primary_traffic_channels (array of strings)
- key_topics (array of current topics associated with the brand)
- data_confidence ("high", "medium", "low")

Return ONLY valid JSON array. Example format:
[{"brand_name":"Brand","estimated_sov_percent":25,"search_interest_trend":"up","primary_traffic_channels":["organic","social"],"key_topics":["topic1","topic2"],"data_confidence":"medium"}]`,
            category: 'competitor_sov',
            weight: 1.0,
        },
        {
            id: 'market_ranking',
            type: 'industry_ranking',
            prompt: `Find the most recent industry rankings and estimated market share for the ${industry} sector in ${location || 'global market'}. Rank ${brandName}, ${compStr} based on industry reports, analyst data, and market research.

Format the response as a JSON array with these fields per brand:
- ranking (number 1-10)
- brand_name
- estimated_market_share_percent (number or null if unknown)
- key_strengths (array of 2-3 strings)
- recent_awards (array of awards/recognitions like "G2 Leader", "Gartner Magic Quadrant")
- source_type ("analyst_report", "industry_publication", "estimate")

Return ONLY valid JSON array sorted by ranking. Example:
[{"ranking":1,"brand_name":"Leader","estimated_market_share_percent":35,"key_strengths":["innovation","market reach"],"recent_awards":["G2 Leader ${year}"],"source_type":"analyst_report"}]`,
            category: 'competitor_ranking',
            weight: 1.0,
        },
        {
            id: 'sentiment_weakness',
            type: 'sentiment_analysis',
            prompt: `Perform a customer sentiment and review analysis comparing ${brandName} with ${compStr}. Analyze data from review sites (Trustpilot, G2, Reddit, Capterra, industry forums).

Provide a JSON array with these columns per brand:
- brand_name
- overall_sentiment ("positive", "neutral", "negative", "mixed")
- sentiment_score (number 1-100, where 100 is most positive)
- top_praised_features (array of 2-3 most praised aspects)
- top_complaints (array of 2-3 biggest customer complaints/weaknesses)
- average_rating (number 1-5 scale)
- review_volume ("high", "medium", "low")
- opportunity_for_you (boolean - true if their weakness is your strength)

Return ONLY valid JSON array. Focus on actionable insights.`,
            category: 'competitor_sentiment',
            weight: 1.0,
        },
        {
            id: 'threat_radar',
            type: 'strategic_moves',
            prompt: `Summarize the major strategic moves made by ${compStr} in the last 3 to 6 months that could affect ${brandName}. Look for:
- New product launches
- Pricing changes
- Acquisitions or partnerships
- Leadership changes
- Major marketing campaigns
- Funding announcements

Present as a JSON array of threat items:
- competitor_name
- move_type ("product_launch", "pricing", "acquisition", "leadership", "marketing", "funding", "partnership", "other")
- description (1-2 sentence summary)
- impact_level ("high", "medium", "low")
- date_approximate (YYYY-MM or "recent")
- threat_or_opportunity ("threat", "opportunity", "neutral")
- recommended_action (brief suggestion for ${brandName})

Return ONLY valid JSON array sorted by impact_level (high first).`,
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

            // Extract text and try to parse JSON
            const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            results.rawResponses[prompt.type] = text;

            // Try to find and parse JSON from the response
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
        marketShare: item.estimated_market_share_percent || item.marketShare || null,
        keyStrengths: Array.isArray(item.key_strengths) ? item.key_strengths : [],
        awards: Array.isArray(item.recent_awards) ? item.recent_awards : [],
        sourceType: item.source_type || 'estimate',
        isTargetBrand: (item.brand_name || '').toLowerCase().includes(brandLower),
    })).sort((a, b) => a.rank - b.rank);
}

function normalizeSentimentData(data, brandName) {
    if (!Array.isArray(data)) return null;
    
    const brandLower = brandName.toLowerCase();
    
    return data.map(item => ({
        brandName: item.brand_name || item.brandName || 'Unknown',
        overallSentiment: item.overall_sentiment || 'neutral',
        sentimentScore: Number(item.sentiment_score || 50),
        topPraisedFeatures: Array.isArray(item.top_praised_features) ? item.top_praised_features : [],
        topComplaints: Array.isArray(item.top_complaints) ? item.top_complaints : [],
        averageRating: Number(item.average_rating || 0),
        reviewVolume: item.review_volume || 'medium',
        isOpportunity: item.opportunity_for_you === true,
        isTargetBrand: (item.brand_name || '').toLowerCase().includes(brandLower),
        // Traffic light color for UI
        trafficLight: getSentimentColor(item.overall_sentiment, item.sentiment_score),
    })).sort((a, b) => b.sentimentScore - a.sentimentScore);
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
        // UI helper
        impactColor: item.impact_level === 'high' ? 'red' : item.impact_level === 'medium' ? 'yellow' : 'gray',
    })).sort((a, b) => (impactOrder[a.impactLevel] || 2) - (impactOrder[b.impactLevel] || 2));
}

export async function generateCompetitorInsights(analysisResults, brandName, industry) {
    const model = getModel();
    
    const dataSnapshot = {
        sov: analysisResults.shareOfVoice?.slice(0, 5) || [],
        ranking: analysisResults.industryRanking?.slice(0, 5) || [],
        sentiment: analysisResults.sentimentAnalysis?.slice(0, 5) || [],
        threats: analysisResults.threatRadar?.slice(0, 5) || [],
    };

    const prompt = `You are a competitive intelligence analyst. Based on this competitor analysis data for ${brandName} in the ${industry} industry, provide a strategic executive summary.

DATA:
${JSON.stringify(dataSnapshot, null, 2)}

Provide a JSON response with:
{
  "executiveSummary": "2-3 sentence overall competitive position assessment",
  "competitivePosition": "leading" | "strong" | "competitive" | "challenging" | "weak",
  "topOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "topThreats": ["threat 1", "threat 2", "threat 3"],
  "recommendedActions": [
    {"action": "specific action", "priority": "high|medium|low", "impact": "expected outcome"}
  ],
  "competitorToWatch": {"name": "competitor name", "reason": "why they're the biggest threat"}
}

Return ONLY valid JSON.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return safeParse(text);
    } catch (err) {
        console.error('[CompetitorInsights] Failed:', err.message);
        return null;
    }
}
