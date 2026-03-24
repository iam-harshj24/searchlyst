import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
function getModel() {
    if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

function safeParse(text) {
    if (!text || typeof text !== 'string') throw new Error('Invalid input');
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw e;
    }
}

const promptCache = new Map();

// Per-category weights: discovery/ranking categories matter more for visibility
const CATEGORY_WEIGHTS = {
    direct_brand: 0.8,
    industry_best: 2.0,
    problem_solution: 1.8,
    alternative: 1.5,
    social_proof: 1.3,
    general: 0.9,
};

function getCategoryWeight(category) {
    return CATEGORY_WEIGHTS[category] ?? 0.9;
}

// Platform-specific context for enhanced prompt generation
const PLATFORM_PROFILES = {
    perplexity: {
        name: 'Perplexity',
        context: `Perplexity (Superplexity) users tend to ask research-depth questions. They often:\n- Use longer, exploratory queries (15-25 words)\n- Include context like "for a B2B SaaS company" or "as a marketer"\n- Seek comprehensive comparisons and alternatives\n- Cite sources and want evidence-based answers\n- Ask follow-up style questions even in first query`,
        queryStyle: 'conversational, research-oriented, often multi-clause',
    },
    gemini: {
        name: 'Gemini',
        context: `Google Gemini users (via gemini.google.com) tend to:\n- Ask in a chat interface similar to ChatGPT\n- Use conversational, direct questions (8-18 words)\n- Mix casual language with specific intent\n- Often include "best", "top", "recommend" keywords\n- May add location or context ("in ${new Date().getFullYear()}", "for startups")`,
        queryStyle: 'direct, chat-style, mix of casual and specific',
    },
    googleAI: {
        name: 'Google AI Overview',
        context: `Google AI Overview appears in Search results. Users type:\n- Short, intent-driven queries (5-12 words typical)\n- Traditional search-style phrasing\n- Often include year, comparison keywords ("vs"), or "best"\n- May include "near me" or location for local intent\n- More keyword-like than conversational`,
        queryStyle: 'concise, search-intent, keyword-aware',
    },
};

/**
 * Generate platform-specific prompts for enhanced visibility measurement.
 * Each platform gets prompts tailored to how its users actually search.
 */
export async function generatePromptMatrixForPlatform(brand, platform) {
    const { brandName, domain, industry, competitors = [], location, language } = brand;
    const compList = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean).slice(0, 5);
    const profile = PLATFORM_PROFILES[platform] || PLATFORM_PROFILES.perplexity;

    const cacheKey = `${brandName}_${domain}_${industry}_${location}_${language}_${platform}_${compList.join(',')}`.toLowerCase();
    if (promptCache.has(cacheKey)) {
        console.log(`[Prompt Intelligence] Using cached prompts for ${brandName} on ${platform}`);
        return promptCache.get(cacheKey);
    }

    const compContext = compList.length > 0
        ? compList.join(', ')
        : '[none provided — use typical market leaders for this industry]';

    const systemPrompt = `ROLE:
You are an AI Search Intelligence Analyst specializing in how real buyers research products. You understand search intent, query psychology, and how different AI platforms rank and surface brands.

PLATFORM CONTEXT — ${profile.name}:
${profile.context}

CONTEXT:
You are generating test queries to measure how visible "${brandName}" (${domain}) is when real potential customers search on ${profile.name}. These queries will be submitted to ${profile.name} to see whether "${brandName}" gets mentioned organically. Queries must match how ${profile.name} users typically phrase their questions.

BRAND CONTEXT:
- Brand: ${brandName} | Domain: ${domain}
- Industry: ${industry}
- Location: ${location || 'Global'}
- Language: ${language || 'English'}
- Known Competitors: ${compContext}

GEO-TARGETING RULES:
Because you are generating 15 queries, you must distribute the geographic scope realistically:
- If Location is "Worldwide", "Global", or empty: Target different major continents or sub-continents (e.g., "in Europe", "in Latin America", "in Southeast Asia") in at least half of the queries.
- If Location is a specific Country (e.g., "US", "UK", "India"): Target major states, provinces, or top cities within that country (e.g., "in California", "in London", "in Mumbai") in at least half of the queries.
- If Location is already a specific city/state: Use that exact location or its major surrounding areas.

TASK:
Generate exactly 15 search queries — 3 per category below.
Each query must sound like a real person typed it into ${profile.name}.
Query style: ${profile.queryStyle}
Write all queries in: ${language || 'English'}.

CATEGORIES (3 queries each = 15 total):
CATEGORY 1 — "direct_brand": Buyer knows the brand → MUST include "${brandName}" or competitor. Intent: "direct" or "comparison"
CATEGORY 2 — "industry_best": Buyer wants best tool → Must NOT include brand names. Intent: "discovery" or "ranking"
CATEGORY 3 — "problem_solution": Buyer describes problem → Must NOT include brand names. Intent: "problem_aware" or "solution_seeking"
CATEGORY 4 — "alternative": Buyer seeks alternatives → MUST include competitor name. Intent: "switching" or "comparison"
CATEGORY 5 — "social_proof": Buyer wants reviews → Must NOT include brand names. Intent: "validation" or "review_seeking"

CONSTRAINTS:
✅ Exactly 15 queries total. All in: ${language || 'English'}
✅ Categories 2, 3, 5: zero brand names. Categories 1, 4: must include at least one real name
✅ Queries must match ${profile.name} user behavior
❌ No keyword stuffing. Return ONLY a valid raw JSON array

OUTPUT FORMAT:
[{"id":1,"category":"direct_brand","query":"...","intent":"direct","includes_brand":true}]`;

    try {
        const model = getModel();
        const result = await model.generateContent(systemPrompt);
        const parsed = safeParse(result.response.text().trim());

        const generatedPrompts = parsed.slice(0, 15).map((p, i) => {
            const category = p.category || 'general';
            return {
                id: i,
                core: p.query || p.prompt,
                intent: p.intent || 'awareness',
                category,
                includesBrand: p.includes_brand ?? false,
                strategicValue: 9,
                weight: getCategoryWeight(category),
            };
        });

        promptCache.set(cacheKey, generatedPrompts);
        return generatedPrompts;
    } catch (err) {
        console.warn(`[Prompt Intelligence] Platform-specific gen failed for ${platform}, using fallback:`, err.message);
        return generateFallbackPrompts(brandName, domain, industry, competitors, location).slice(0, 15);
    }
}

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

GEO-TARGETING RULES:
Because you are generating 15 queries, you must distribute the geographic scope realistically:
- If Location is "Worldwide", "Global", or empty: Target different major continents or sub-continents (e.g., "in Europe", "in Latin America", "in Southeast Asia") in at least half of the queries.
- If Location is a specific Country (e.g., "US", "UK", "India"): Target major states, provinces, or top cities within that country (e.g., "in California", "in London", "in Mumbai") in at least half of the queries.
- If Location is already a specific city/state: Use that exact location or its major surrounding areas.

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

    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        const text = result.response?.text?.();
        if (!text) throw new Error('Empty model response');
        const parsed = safeParse(text.trim());

        const generatedPrompts = parsed.map((p, i) => {
            const category = p.category || 'general';
            return {
                id: i,
                core: p.query || p.prompt,
                intent: p.intent || 'awareness',
                category,
                includesBrand: p.includes_brand ?? false,
                strategicValue: 9,
                weight: getCategoryWeight(category),
            };
        });

        promptCache.set(cacheKey, generatedPrompts);
        return generatedPrompts;
    } catch (err) {
        console.warn('[Prompt Intelligence] Gen failed, using fallback:', err.message);
        return generateFallbackPrompts(brandName, domain, industry, competitors, location);
    }
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
        // Category 1: Direct Brand (3 queries) — weight 0.8
        { id: 0, core: `${brandName} pricing and features ${year} — is it worth it?`, intent: 'direct', category: 'direct_brand', includesBrand: true, strategicValue: 9, weight: 0.8 },
        { id: 1, core: `${brandName} vs ${compStr} — which is better for ${industry}?`, intent: 'comparison', category: 'direct_brand', includesBrand: true, strategicValue: 9, weight: 0.8 },
        { id: 2, core: `compare ${brandName} with ${compStr} for ${industry} in ${year}`, intent: 'comparison', category: 'direct_brand', includesBrand: true, strategicValue: 9, weight: 0.8 },

        // Category 2: Industry Best-Of (3 queries) — weight 2.0
        { id: 3, core: `best ${industry} tools in ${year}`, intent: 'discovery', category: 'industry_best', includesBrand: false, strategicValue: 10, weight: 2.0 },
        { id: 4, core: `top ${industry} platforms for small and mid-sized businesses`, intent: 'ranking', category: 'industry_best', includesBrand: false, strategicValue: 10, weight: 2.0 },
        { id: 5, core: `most recommended ${industry} solutions ${year}`, intent: 'discovery', category: 'industry_best', includesBrand: false, strategicValue: 10, weight: 2.0 },

        // Category 3: Problem-Solution (3 queries) — weight 1.8
        { id: 6, core: `how to improve ${outcome} with ${industry} tools in ${year}`, intent: 'problem_aware', category: 'problem_solution', includesBrand: false, strategicValue: 9, weight: 1.8 },
        { id: 7, core: `what is ${industry} and why does it matter for businesses in ${year}`, intent: 'solution_seeking', category: 'problem_solution', includesBrand: false, strategicValue: 9, weight: 1.8 },
        { id: 8, core: `need help choosing ${industry} tools for my business`, intent: 'solution_seeking', category: 'problem_solution', includesBrand: false, strategicValue: 9, weight: 1.8 },

        // Category 4: Alternative-Seeking (3 queries) — weight 1.5
        { id: 9, core: `best alternatives to ${compStr} for ${industry} in ${year}`, intent: 'switching', category: 'alternative', includesBrand: false, strategicValue: 9, weight: 1.5 },
        { id: 10, core: `${compStr2} alternatives — what do users recommend`, intent: 'comparison', category: 'alternative', includesBrand: false, strategicValue: 9, weight: 1.5 },
        { id: 11, core: `replace ${compStr} with another ${industry} tool`, intent: 'switching', category: 'alternative', includesBrand: false, strategicValue: 9, weight: 1.5 },

        // Category 5: Social Proof & Reviews (3 queries) — weight 1.3
        { id: 12, core: `honest reviews of ${brandName} — Reddit and G2 ${year}`, intent: 'validation', category: 'social_proof', includesBrand: true, strategicValue: 10, weight: 1.3 },
        { id: 13, core: `what do real users say about ${industry} tools on Reddit`, intent: 'review_seeking', category: 'social_proof', includesBrand: false, strategicValue: 9, weight: 1.3 },
        { id: 14, core: `${industry} tool reviews and comparisons ${year}`, intent: 'validation', category: 'social_proof', includesBrand: false, strategicValue: 9, weight: 1.3 },
    ];
}
