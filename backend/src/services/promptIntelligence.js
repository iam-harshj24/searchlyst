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

// PROMPT 3 — Visibility Scan: Query Generation (Enhanced)
export async function generatePromptMatrix(brand) {
    const { brandName, domain, industry, competitors = [], location, language } = brand;
    const compList = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean).slice(0, 5);

    const cacheKey = `${brandName}_${domain}_${industry}_${location}_${language}_${compList.join(',')}`.toLowerCase();
    if (promptCache.has(cacheKey)) {
        console.log(`[Prompt Intelligence] Using cached prompts for ${brandName}`);
        return promptCache.get(cacheKey);
    }

    const compContext = compList.length > 0
        ? compList.join(', ')
        : '[none provided — use typical market leaders for this industry]';

    const prompt = `ROLE:
You are an AI Search Intelligence Analyst specializing in how real buyers research products using AI assistants like ChatGPT, Perplexity, and Gemini. You understand search intent, query psychology, and how AI engines rank brands.

CONTEXT:
You are generating test queries to measure how visible "${brandName}" (${domain}) is when real potential customers search for solutions in the "${industry}" space. These queries will be submitted to AI search engines to see whether "${brandName}" gets mentioned organically.

BRAND CONTEXT:
- Brand: ${brandName} | Domain: ${domain}
- Industry: ${industry}
- Location: ${location || 'Global'}
- Language: ${language || 'English'}
- Known Competitors: ${compContext}

TASK:
Generate exactly 15 search queries — exactly 3 per category below.
Each query must sound like a real person typed it into ChatGPT or Perplexity.
Write all queries in: ${language || 'English'}.

REASONING STEPS (apply before writing queries):
Step 1 — Understand the buyer: Who is the typical customer of "${brandName}"? What job title, company size, or pain point do they have?
Step 2 — Map the intent per category: What mindset is the buyer in for each category? (Evaluating? Comparing? Problem-aware? Review-seeking?)
Step 3 — Pick the best competitor: For Category 1 and 4 queries that need a competitor name, choose the most well-known rival from: [${compContext}]
Step 4 — Write naturally: Each query must use casual, human language — not keyword-stuffed SEO phrases.
Step 5 — Validate: Confirm exactly 3 queries per category before outputting.

CATEGORIES (3 queries each = 15 total):

CATEGORY 1 — "direct_brand"
The buyer knows the brand and wants to learn more or compare it.
→ MUST include "${brandName}" or a direct competitor name
→ Intent values: "direct" or "comparison"

CATEGORY 2 — "industry_best"
The buyer wants to find the best tool without naming any brand.
→ Must NOT include any brand names
→ Intent values: "discovery" or "ranking"

CATEGORY 3 — "problem_solution"
The buyer describes a problem and wants AI to recommend a solution.
→ Must NOT include any brand names
→ Intent values: "problem_aware" or "solution_seeking"

CATEGORY 4 — "alternative"
The buyer is unhappy with a current tool and seeks alternatives.
→ MUST include at least one competitor name
→ Intent values: "switching" or "comparison"

CATEGORY 5 — "social_proof"
The buyer wants real opinions, reviews, or community takes.
→ Must NOT include brand names (keep generic to the industry)
→ Intent values: "validation" or "review_seeking"

CONSTRAINTS:
✅ Exactly 3 queries per category (15 total — no more, no less)
✅ All queries in: ${language || 'English'}
✅ Categories 2, 3, 5: zero brand or competitor names
✅ Categories 1, 4: must include at least one real name
✅ Queries must be 6–20 words — conversational, not robotic
❌ No keyword stuffing or SEO-style phrasing
❌ No duplicate queries or near-duplicates
❌ Do not return anything outside the JSON array

OUTPUT FORMAT:
Return ONLY a valid raw JSON array:
[{"id":1,"category":"direct_brand","query":"...","intent":"direct","includes_brand":true}]`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const parsed = safeParse(result.response.text().trim());

    const generatedPrompts = parsed.map((p, i) => ({
        id: i,
        core: p.query || p.prompt,
        intent: p.intent || 'awareness',
        category: p.category || 'general',
        includesBrand: p.includes_brand ?? false,
        strategicValue: 9,
        weight: 0.9,
    }));

    promptCache.set(cacheKey, generatedPrompts);
    return generatedPrompts;
}

// PROMPT 4 — Visibility Scan: Fallback Queries (Enhanced)
// All conditional logic is resolved server-side before string injection
export function generateFallbackPrompts(brandName, domain, industry, competitors, location) {
    const comp = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);

    // Guard: never leave blank tokens in the query
    const compStr = comp[0] || 'leading tools in this category';
    const compStr2 = comp[1] || comp[0] || 'popular alternatives';
    const year = new Date().getFullYear();

    // Resolve industry-specific outcome server-side
    const industryLower = industry.toLowerCase();
    const outcome = industryLower.includes('seo')
        ? 'search rankings'
        : industryLower.includes('hr')
            ? 'employee retention'
            : industryLower.includes('sales')
                ? 'sales conversion'
                : industryLower.includes('market')
                    ? 'marketing ROI'
                    : 'business results';

    return [
        // Category 1: Direct Brand (2 queries)
        { id: 0, core: `${brandName} pricing and features ${year} — is it worth it?`, intent: 'direct', category: 'direct_brand', includesBrand: true, strategicValue: 9, weight: 0.9 },
        { id: 1, core: `${brandName} vs ${compStr} — which is better for ${industry}?`, intent: 'comparison', category: 'direct_brand', includesBrand: true, strategicValue: 9, weight: 0.9 },

        // Category 2: Industry Best-Of (2 queries)
        { id: 2, core: `best ${industry} tools in ${year}`, intent: 'discovery', category: 'industry_best', includesBrand: false, strategicValue: 9, weight: 0.9 },
        { id: 3, core: `top ${industry} platforms for small and mid-sized businesses`, intent: 'ranking', category: 'industry_best', includesBrand: false, strategicValue: 9, weight: 0.9 },

        // Category 3: Problem-Solution (2 queries)
        { id: 4, core: `how to improve ${outcome} with ${industry} tools in ${year}`, intent: 'problem_aware', category: 'problem_solution', includesBrand: false, strategicValue: 9, weight: 0.9 },
        { id: 5, core: `what is ${industry} and why does it matter for businesses in ${year}`, intent: 'solution_seeking', category: 'problem_solution', includesBrand: false, strategicValue: 8, weight: 0.8 },

        // Category 4: Alternative-Seeking (2 queries)
        { id: 6, core: `best alternatives to ${compStr} for ${industry} in ${year}`, intent: 'switching', category: 'alternative', includesBrand: false, strategicValue: 9, weight: 0.9 },
        { id: 7, core: `${compStr2} alternatives — what do users recommend`, intent: 'comparison', category: 'alternative', includesBrand: false, strategicValue: 9, weight: 0.9 },

        // Category 5: Social Proof & Reviews (2 queries)
        { id: 8, core: `honest reviews of ${brandName} — Reddit and G2 ${year}`, intent: 'validation', category: 'social_proof', includesBrand: true, strategicValue: 10, weight: 1.0 },
        { id: 9, core: `what do real users say about ${industry} tools on Reddit`, intent: 'review_seeking', category: 'social_proof', includesBrand: false, strategicValue: 9, weight: 0.9 },
    ];
}
