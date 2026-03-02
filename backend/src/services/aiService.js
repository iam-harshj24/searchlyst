import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getClient() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

// PROMPT 1 — Onboarding: Competitor Suggestions
// Uses Gemini 2.0 Flash with Google Search Grounding so the model
// searches G2, Capterra, Reddit, Crunchbase in real-time.
export async function suggestCompetitors({ domain, brandName, industry, companySize, location, language, reach, customCompetitors }) {
    const client = getClient();

    const competitorNames = Array.isArray(customCompetitors) ? customCompetitors.filter(Boolean) : [];

    const prompt = `SEARCH TASK:
Search the web right now to find the top 15 companies that directly compete with "${brandName}" (website: ${domain}) in the "${industry}" market${location ? ` specifically in or targeting ${location}` : ' globally'}.

SEARCH SOURCES TO CHECK:
- G2.com category pages for "${industry}"
- Capterra.com software directories
- Product Hunt collections for "${industry}"
- Crunchbase company categories
- Reddit threads: site:reddit.com "${industry}" alternatives OR competitors
- Recent blog posts titled "best ${industry} tools" or "${industry} alternatives"
- Google: "${industry} software comparison" published after January 2024

WHAT YOU ARE LOOKING FOR:
Companies that:
1. Solve the same core problem as "${brandName}"
2. Target the same buyer type (same job title, same company size)
3. Are actively marketing and acquiring customers right now
4. Have a real, working website and product

${competitorNames.length > 0
            ? `ALREADY KNOWN — DO NOT include these: ${competitorNames.join(', ')}
     Your job is to find ADDITIONAL competitors beyond this list.`
            : ''}

DO NOT INCLUDE:
- ${domain} itself
- Companies that are shut down, acquired, or pivoting away from this market
- Loosely adjacent tools that serve a different core use case
- Any company you are not confident actually exists and competes here

FOR EACH COMPETITOR FOUND, REPORT:
- Their exact company name
- Their working domain (verify it exists)
- One sentence on how they directly compete with ${brandName}
- Where you found this (source URL or platform name)
- Your confidence: high | medium | low

OUTPUT — return ONLY this raw JSON array, nothing else:
[{"name":"Exact Company Name","domain":"theirdomain.com","reason":"One specific sentence on how they compete with ${brandName}","source":"e.g. G2 category page","relevance":8,"confidence":"high"}]

If you cannot find 15 with high confidence, return fewer. Do not pad the list with uncertain entries.`;

    try {
        // Try with Google Search grounding first (gemini-2.0-flash supports it)
        const groundedModel = client.getGenerativeModel({
            model: 'gemini-2.0-flash',
            tools: [{ googleSearch: {} }],
        });

        const result = await groundedModel.generateContent(prompt);
        const text = result.response.text().trim();
        return parseCompetitorResponse(text, competitorNames, domain);
    } catch (groundingError) {
        console.warn('[Competitor AI] Grounding failed, falling back to standard model:', groundingError.message?.slice(0, 100));

        // Fallback: use gemini-2.5-flash without grounding
        try {
            const fallbackModel = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await fallbackModel.generateContent(prompt);
            const text = result.response.text().trim();
            return parseCompetitorResponse(text, competitorNames, domain);
        } catch (fallbackError) {
            console.error('[Competitor AI] Fallback also failed:', fallbackError.message?.slice(0, 100));
            throw fallbackError;
        }
    }
}

function parseCompetitorResponse(text, competitorNames, domain) {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON array
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
    }

    const competitors = JSON.parse(jsonMatch[0]);
    return competitors
        .filter(c => c.name && c.domain)
        .filter(c => !c.domain.includes(domain))
        .map(c => ({
            name: c.name,
            domain: c.domain?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            reason: c.reason || c.compete_reason || 'Competes in the same market',
            source: c.source || 'AI web search',
            relevance: typeof c.relevance === 'number' ? c.relevance : 7,
            confidence: c.confidence || 'medium',
        }));
}

// PROMPT: Brand Knowledge Summary
export async function generateBrandSummary({ domain, brandName, industry }) {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a brand strategist. Write a concise, 3-4 sentence brand summary for a company named "${brandName}" (website: ${domain}) operating in the "${industry}" industry.
Focus on:
1. What they do (their core offering)
2. Who they serve (their target audience)
3. Their main value proposition

Make it read professionally, like a company bio. Do NOT include phrases like "Here is a summary" or "This company". Just output the summary paragraph directly.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err) {
        console.error('[Brand Summary AI] Error:', err.message);
        throw err;
    }
}
