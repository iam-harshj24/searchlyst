import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getClient() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

export async function suggestCompetitors({ domain, brandName, industry, companySize, location, language, reach, customCompetitors }) {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const customContext = customCompetitors?.length
        ? `\n\nThe user has already identified these competitors: ${customCompetitors.join(', ')}. Use this to understand the competitive landscape better and suggest similar companies they may have missed.`
        : '';

    const prompt = `You are a competitive intelligence analyst. Given the following brand details, identify 10-15 real competitor companies with their actual domain names.

Brand Details:
- Domain: ${domain}
- Brand Name: ${brandName}
- Industry: ${industry}
- Company Size: ${companySize || 'Not specified'}
- Location: ${location || 'Not specified'}
- Language: ${language || 'English'}
- Market Reach: ${reach || 'Not specified'}${customContext}

Requirements:
1. Return ONLY real, existing companies that are actual competitors in this exact industry/niche
2. Include their actual working domain (e.g. "hubspot.com", "salesforce.com")
3. Do NOT include the brand's own domain "${domain}"
4. Mix of direct competitors (same size) and aspirational competitors (market leaders)
5. Prioritize competitors in the same geographic market and targeting the same audience when location is specified
6. Include a relevance score (1-10) indicating how directly they compete

Respond ONLY with a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array like this:
[{"name":"Company Name","domain":"company.com","reason":"Brief reason why they compete","relevance":8}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
        const competitors = JSON.parse(jsonStr);
        return competitors.map(c => ({
            name: c.name,
            domain: c.domain?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            reason: c.reason,
            relevance: c.relevance || 5,
        }));
    } catch (parseError) {
        console.error('Failed to parse AI response:', text);
        throw new Error('Failed to parse competitor suggestions');
    }
}
