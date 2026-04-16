/**
 * Visibility System Test Suite
 * Run: node scripts/test-visibility.mjs (from backend dir)
 * Tests: promptIntelligence, responseParser, scoringEngine, data structures
 */

import { generateFallbackPrompts } from '../src/services/promptIntelligence.js';
import { fastParse } from '../src/services/responseParser.js';
import {
    computeVisibilityScore,
    computeShareOfVoice,
    computePerEngine,
    computePerCategory,
    computeCompetitorGap,
    computeSentimentBreakdown,
    computeSourceDomains,
    computeIndustryRanking,
} from '../src/services/scoringEngine.js';

const assert = (cond, msg) => {
    if (!cond) throw new Error(`FAIL: ${msg}`);
};
const pass = (name) => console.log(`  ✓ ${name}`);

console.log('\n=== VISIBILITY SYSTEM TESTS ===\n');

// ------------------------------------------------------------------
// 1. PROMPT INTELLIGENCE - generateFallbackPrompts
// ------------------------------------------------------------------
console.log('1. PROMPT INTELLIGENCE (generateFallbackPrompts)');
try {
    const prompts = generateFallbackPrompts('Searchlyst', 'searchlyst.com', 'SEO', ['Ahrefs', 'SEMrush'], 'US');
    assert(Array.isArray(prompts), 'Returns array');
    assert(prompts.length === 20, 'Returns exactly 20 Super prompts');
    assert(prompts.every(p => p.core && p.category && p.id && p.intent), 'Each prompt has core, category, id, intent');
    const cats = new Set(prompts.map((p) => p.category));
    assert(cats.has('ranking'), 'Has ranking');
    assert(cats.has('share_of_voice'), 'Has share_of_voice');
    assert(cats.has('competitor_tracking'), 'Has competitor_tracking');
    assert(cats.has('geo_location'), 'Has geo_location');
    assert(cats.has('trust_sentiment'), 'Has trust_sentiment');
    assert(prompts[0].id === 'P1' && prompts[19].id === 'P20', 'P1–P20 ids');
    assert(prompts.every((p) => typeof p.weight === 'number' && p.weight > 0), 'Each prompt has a numeric weight > 0');
    assert(prompts.every((p) => typeof p.includesBrand === 'boolean'), 'Each prompt has boolean includesBrand');
    pass('generateFallbackPrompts: 20 prompts, matrix categories, weights + includesBrand set');
} catch (e) {
    console.error('  ✗', e.message);
}

// ------------------------------------------------------------------
// 2. RESPONSE PARSER - fastParse
// ------------------------------------------------------------------
console.log('\n2. RESPONSE PARSER (fastParse)');
try {
    const htmlWithBrand = `
        <html><body>
            <p>Searchlyst is one of the best AI visibility tools. Ahrefs is also popular.</p>
            <a href="https://searchlyst.com">Searchlyst</a>
            <a href="https://ahrefs.com">Ahrefs</a>
        </body></html>
    `;
    const result = fastParse(htmlWithBrand, 'Searchlyst', 'searchlyst.com', [{ name: 'Ahrefs', domain: 'ahrefs.com' }], 'perplexity');
    assert(result.brandMentioned === true, 'Brand mentioned');
    assert(result.brandEntity !== null, 'Brand entity present');
    assert(result.entities && result.entities.length >= 1, 'Entities array populated');
    assert(result.citations && Array.isArray(result.citations), 'Citations array');
    assert(result.engine === 'perplexity', 'Engine preserved');
    assert(typeof result.brandEntity.positionRank === 'number', 'Position rank present');
    pass('fastParse: extracts brand, entities, citations');

    // Null domain guard
    const r2 = fastParse('<p>Test</p>', 'X', null, [], 'gemini');
    assert(r2 !== undefined, 'Handles null domain');
    pass('fastParse: handles null domain (C-4 fix)');
} catch (e) {
    console.error('  ✗', e.message);
}

// ------------------------------------------------------------------
// 3. SCORING ENGINE - computeVisibilityScore
// ------------------------------------------------------------------
console.log('\n3. SCORING ENGINE (computeVisibilityScore)');
try {
    const mockRuns = [
        { brandMentioned: true, brandEntity: { positionRank: 1, sentiment: 'positive' }, promptWeight: 2.0, category: 'industry_best', citationStats: { brandCited: true } },
        { brandMentioned: true, brandEntity: { positionRank: 2, sentiment: 'neutral' }, promptWeight: 0.8, category: 'direct_brand', citationStats: { brandCited: false } },
        { brandMentioned: false, brandEntity: null, promptWeight: 1.8, category: 'problem_solution', citationStats: { brandCited: false } },
    ];
    const score = computeVisibilityScore(mockRuns, 'TestBrand');
    assert(typeof score.overall === 'number', 'Score is number');
    assert(score.overall >= 0 && score.overall <= 100, 'Score in 0-100');
    assert(score.components, 'Components present');
    assert(score.totalRuns === 3, 'totalRuns correct');
    assert(score.mentionedIn === 2, 'mentionedIn correct');
    pass('computeVisibilityScore: weighted scoring works');
} catch (e) {
    console.error('  ✗', e.message);
}

// ------------------------------------------------------------------
// 4. SCORING ENGINE - computeShareOfVoice
// ------------------------------------------------------------------
console.log('\n4. SCORING ENGINE (computeShareOfVoice)');
try {
    const runsWithEntities = [
        { entities: [{ name: 'BrandA', positionRank: 1, sentiment: 'positive', isTargetBrand: true }], promptWeight: 2.0, category: 'industry_best' },
        { entities: [{ name: 'BrandA', positionRank: 1, sentiment: 'neutral', isTargetBrand: true }, { name: 'BrandB', positionRank: 2, sentiment: 'neutral', isTargetBrand: false }], promptWeight: 2.0, category: 'industry_best' },
    ];
    const sov = computeShareOfVoice(runsWithEntities, 'BrandA', [{ name: 'BrandB' }]);
    assert(sov.brand, 'Brand data present');
    assert(typeof sov.brand.sov === 'number', 'Brand SOV is number');
    assert(Array.isArray(sov.competitors), 'Competitors array');
    assert(sov.brand.sov + sov.competitors.reduce((s, c) => s + c.sov, 0) <= 100.1, 'SOV sums to ~100%');
    pass('computeShareOfVoice: SOV calculation correct');
} catch (e) {
    console.error('  ✗', e.message);
}

// ------------------------------------------------------------------
// 5. SCORING ENGINE - computePerEngine, computePerCategory
// ------------------------------------------------------------------
console.log('\n5. SCORING ENGINE (per-engine, per-category)');
try {
    const multiEngineRuns = [
        { engine: 'perplexity', brandMentioned: true, brandEntity: { positionRank: 1 }, promptWeight: 2.0, category: 'industry_best' },
        { engine: 'gemini', brandMentioned: true, brandEntity: { positionRank: 2 }, promptWeight: 2.0, category: 'industry_best' },
        { engine: 'googleAI', brandMentioned: false, brandEntity: null, promptWeight: 1.8, category: 'problem_solution' },
    ];
    const perEngine = computePerEngine(multiEngineRuns);
    assert(perEngine.perplexity, 'Perplexity score');
    assert(perEngine.gemini, 'Gemini score');
    assert(perEngine.googleAI, 'Google AI score');
    assert(perEngine.perplexity.runs === 1 && perEngine.gemini.runs === 1 && perEngine.googleAI.runs === 1, 'Runs per engine');
    pass('computePerEngine: 3 platforms');

    const perCat = computePerCategory(multiEngineRuns);
    assert(perCat.industry_best, 'industry_best category');
    assert(perCat.problem_solution, 'problem_solution category');
    pass('computePerCategory: category breakdown');
} catch (e) {
    console.error('  ✗', e.message);
}

// ------------------------------------------------------------------
// 6. SCORING ENGINE - computeCompetitorGap, computeIndustryRanking
// ------------------------------------------------------------------
console.log('\n6. SCORING ENGINE (gaps, ranking)');
try {
    const gapRuns = [
        { promptId: 0, query: 'best SEO tools', brandMentioned: false, entities: [{ name: 'Ahrefs', isCompetitor: true }] },
        { promptId: 1, query: 'Searchlyst review', brandMentioned: true, entities: [{ name: 'Searchlyst', isTargetBrand: true }] },
    ];
    const gaps = computeCompetitorGap(gapRuns, 'Searchlyst', [{ name: 'Ahrefs' }]);
    assert(Array.isArray(gaps), 'Gaps is array');
    assert(gaps.length >= 1, 'At least one gap (competitor present, brand absent)');
    assert(gaps[0].query, 'Gap has query');
    assert(gaps[0].competitorsPresent && gaps[0].competitorsPresent.length > 0, 'Gap has competitors');
    assert(gaps[0].gapId && typeof gaps[0].gapId === 'string', 'Gap has stable gapId');
    assert(gaps[0].geoBrief?.targetPlatforms?.length > 0, 'Gap has geoBrief.targetPlatforms');
    assert(gaps[0].byEngine && typeof gaps[0].byEngine === 'object', 'Gap has byEngine');
    pass('computeCompetitorGap: detects gaps');

    const ranking = computeIndustryRanking(gapRuns, 'Searchlyst', [{ name: 'Ahrefs' }]);
    assert(Array.isArray(ranking), 'Ranking is array');
    pass('computeIndustryRanking: returns ranked list');
} catch (e) {
    console.error('  ✗', e.message);
}

// ------------------------------------------------------------------
// 7. EDGE CASES - empty entities, null guards
// ------------------------------------------------------------------
console.log('\n7. EDGE CASES (null/empty guards)');
try {
    const emptyRuns = [];
    const emptyScore = computeVisibilityScore(emptyRuns, 'X');
    assert(emptyScore.overall === 0, 'Empty runs = 0 score');
    assert(emptyScore.totalRuns === 0, 'Empty totalRuns');
    pass('Empty runs handled');

    const runsWithNoEntities = [
        { brandMentioned: false, entities: null, promptWeight: 1.0, category: 'general' },
    ];
    const sov2 = computeShareOfVoice(runsWithNoEntities, 'Brand', []);
    assert(sov2.brand.sov === 0, 'No entities = 0 SOV');
    pass('Missing entities handled (C-5 fix)');
} catch (e) {
    console.error('  ✗', e.message);
}

// ------------------------------------------------------------------
// 8. FINAL RESULT STRUCTURE (matches frontend expectations)
// ------------------------------------------------------------------
console.log('\n8. RESULT STRUCTURE (frontend compatibility)');
try {
    const mockAllRuns = [
        { promptId: 0, query: 'q1', engine: 'perplexity', brandMentioned: true, brandEntity: { positionRank: 1, sentiment: 'positive', snippet: '...' }, entities: [{ name: 'Brand', positionRank: 1, isTargetBrand: true }], citations: [{ domain: 'example.com', url: 'https://example.com', isTargetBrand: false }], citationStats: { brandCited: false }, category: 'industry_best', promptWeight: 2.0 },
    ];
    const score = computeVisibilityScore(mockAllRuns, 'Brand');
    const sov = computeShareOfVoice(mockAllRuns, 'Brand', []);
    const perEngine = computePerEngine(mockAllRuns);
    const perCategory = computePerCategory(mockAllRuns);
    const sentiment = computeSentimentBreakdown(mockAllRuns);
    const ranking = computeIndustryRanking(mockAllRuns, 'Brand', []);

    assert(score.overall !== undefined, 'score.overall');
    assert(score.components?.visibility !== undefined, 'score.components.visibility');
    assert(sov.brand?.sov !== undefined, 'shareOfVoice.brand');
    assert(perEngine.perplexity?.score !== undefined, 'perEngine.perplexity');
    assert(typeof perCategory === 'object', 'perCategory object');
    assert(sentiment.detailed, 'sentiment.detailed');
    assert(Array.isArray(ranking), 'industryRanking array');
    pass('All expected keys present for frontend');
} catch (e) {
    console.error('  ✗', e.message);
}

console.log('\n=== ALL TESTS COMPLETED ===\n');
