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

const promptCache = new Map();

export async function generatePromptMatrix(brand) {
    const { brandName, domain, industry, competitors = [], location, language } = brand;
    const compList = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean).slice(0, 5);
    
    const cacheKey = `${brandName}_${domain}_${industry}_${location}_${language}_${compList.join(',')}`.toLowerCase();
    if (promptCache.has(cacheKey)) {
        console.log(`[Prompt Intelligence] Using cached prompts for ${brandName}`);
        return promptCache.get(cacheKey);
    }

    const prompt = `You are an AI Search Intelligence Analyst. Generate exactly 10 search queries that a real potential customer would type into an AI assistant (ChatGPT, Perplexity, or Google Gemini) when researching solutions.

CONTEXT:
- Brand being analyzed: ${brandName}
- Brand's website: ${domain}
- Industry/Niche: ${industry}
- Location: ${location || 'Global'}
- Language: ${language || 'English'}
- Known competitors: ${compList.join(', ') || 'Unknown'}

Generate exactly 10 search queries spread across these 5 categories (2 queries per category):

CATEGORY 1 — DIRECT BRAND QUERIES ("direct_brand")
Queries where someone is specifically looking up the brand or comparing it to a named competitor.
Pattern examples: "{brand} pricing and features 2026", "{brand} vs {competitor} comparison"

CATEGORY 2 — INDUSTRY BEST-OF QUERIES ("industry_best")
Queries where someone is looking for the best tool/service in the industry WITHOUT naming any specific brand.
Pattern examples: "best {industry} tools in 2026", "top {industry} platforms for {target_audience}"

CATEGORY 3 — PROBLEM-SOLUTION QUERIES ("problem_solution")
Queries where someone describes a problem they're trying to solve and wants the AI to recommend a solution.
Pattern examples: "how to improve {outcome} for {audience}", "what is {industry_concept} and why does it matter"

CATEGORY 4 — ALTERNATIVE-SEEKING QUERIES ("alternative")
Queries where someone is actively looking for alternatives to a competitor or the brand itself.
Pattern examples: "{competitor} alternatives for {use_case}", "best alternatives to {competitor}"

CATEGORY 5 — SOCIAL PROOF & REVIEW QUERIES ("social_proof")
Queries where someone is looking for opinions, reviews, or community discussions.
Pattern examples: "{brand} reviews from users", "what do people say about {industry} tools on Reddit"

RULES:
1. Each query must sound like a REAL human would type it into ChatGPT or Perplexity
2. Only Category 1 and Category 4 should include brand/competitor names
3. Categories 2, 3, and 5 should be GENERIC industry queries where any brand could potentially appear
4. Queries should be specific enough to trigger detailed AI responses with source citations
5. Return ONLY the 10 queries as a JSON array

OUTPUT FORMAT:
[{"id":1,"category":"direct_brand","query":"...","intent":"direct"},{"id":2,"category":"direct_brand","query":"...","intent":"comparison"}]`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const parsed = safeParse(result.response.text().trim());

    const generatedPrompts = parsed.map((p, i) => ({
        id: i,
        core: p.query || p.prompt,
        intent: p.intent || 'awareness',
        category: p.category || 'general',
        strategicValue: 9,
        weight: 0.9,
    }));
    
    promptCache.set(cacheKey, generatedPrompts);
    return generatedPrompts;
}

export function generateFallbackPrompts(brandName, domain, industry, competitors, location) {
    const comp = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
    const compStr = comp.length > 0 ? comp[0] : 'leading competitors';
    const compStr2 = comp.length > 1 ? comp[1] : 'other alternatives';
    const year = new Date().getFullYear();
    
    return [
        // Category 1: Direct Brand (2 queries)
        { id: 0, core: `${brandName} pricing and features ${year}`, intent: 'direct', category: 'direct_brand', strategicValue: 9, weight: 0.9 },
        { id: 1, core: `${brandName} vs ${compStr} comparison - which is better?`, intent: 'comparison', category: 'direct_brand', strategicValue: 9, weight: 0.9 },
        
        // Category 2: Industry Best-Of (2 queries)
        { id: 2, core: `best ${industry} tools in ${year}`, intent: 'discovery', category: 'industry_best', strategicValue: 9, weight: 0.9 },
        { id: 3, core: `top ${industry} platforms for small businesses and enterprises`, intent: 'discovery', category: 'industry_best', strategicValue: 9, weight: 0.9 },
        
        // Category 3: Problem-Solution (2 queries)
        { id: 4, core: `how to improve ${industry.toLowerCase().includes('seo') ? 'search rankings' : 'business results'} using ${industry}`, intent: 'solution', category: 'problem_solution', strategicValue: 9, weight: 0.9 },
        { id: 5, core: `what is ${industry} and why does it matter for businesses in ${year}`, intent: 'education', category: 'problem_solution', strategicValue: 8, weight: 0.8 },
        
        // Category 4: Alternative-Seeking (2 queries)
        { id: 6, core: `${compStr} alternatives ${year}`, intent: 'alternative', category: 'alternative', strategicValue: 9, weight: 0.9 },
        { id: 7, core: `best alternatives to ${compStr2} for ${industry}`, intent: 'alternative', category: 'alternative', strategicValue: 9, weight: 0.9 },
        
        // Category 5: Social Proof & Reviews (2 queries)
        { id: 8, core: `${brandName} reviews from actual users - Reddit and G2`, intent: 'sentiment', category: 'social_proof', strategicValue: 10, weight: 1.0 },
        { id: 9, core: `what do people say about ${industry} tools on Reddit ${year}`, intent: 'sentiment', category: 'social_proof', strategicValue: 9, weight: 0.9 },
    ];
}
