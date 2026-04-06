/**
 * Multi-factor lexical sentiment (no external NLP API).
 *
 * Inspired by a 5-signal model; implemented with deterministic lexicons + heuristics
 * on a short context window around the entity mention.
 *
 * Weights (must sum to 1):
 *   Emotion 30%, Polarity 25%, Intensity 20%, Subjectivity 10%, Toxicity 15%
 *
 * Each factor is scored 0–100. Final = weighted sum, clamped 0–100.
 * Labels (via sentimentScoreToLabel in responseParser): ≥70 positive, ≥40 neutral, else negative.
 */

export const W_EMOTION = 0.3;
export const W_POLARITY = 0.25;
export const W_INTENSITY = 0.2;
export const W_SUBJECTIVITY = 0.1;
export const W_TOXICITY = 0.15;

/** Same weights the lexical multi-factor model uses — keep LLM prompts in sync. */
export const SENTIMENT_FACTOR_WEIGHTS = {
    emotion: W_EMOTION,
    polarity: W_POLARITY,
    intensity: W_INTENSITY,
    subjectivity: W_SUBJECTIVITY,
    toxicity: W_TOXICITY,
};

/**
 * Combine five 0–100 factor scores with product weights (for LLM output validation / fallback).
 */
export function weightedOverallFromFactors(factors) {
    if (!factors || typeof factors !== 'object') return null;
    const e = Number(factors.emotion);
    const p = Number(factors.polarity);
    const i = Number(factors.intensity);
    const s = Number(factors.subjectivity);
    const t = Number(factors.toxicity);
    if (![e, p, i, s, t].every((x) => Number.isFinite(x))) return null;
    const combined =
        W_EMOTION * e + W_POLARITY * p + W_INTENSITY * i + W_SUBJECTIVITY * s + W_TOXICITY * t;
    return clamp(Math.round(combined * 10) / 10, 0, 100);
}

function clamp(x, lo, hi) {
    return Math.min(hi, Math.max(lo, x));
}

function countHits(hay, words) {
    let n = 0;
    for (const w of words) {
        if (!w) continue;
        if (hay.includes(w)) n++;
    }
    return n;
}

/** Factor 1 — emotion valence (joy high, anger/sadness low). */
const EMOTION_JOY = [
    'love', 'loved', 'loving', 'joy', 'happy', 'happier', 'delighted', 'wonderful', 'amazing',
    'fantastic', 'great', 'brilliant', 'perfect', 'awesome', 'thrilled', 'best', 'favorite',
    'favourite', 'excellent', 'superb', 'outstanding', 'remarkable', 'pleased', 'glad',
];
const EMOTION_SURPRISE = ['surprising', 'surprised', 'shocking', 'unexpected', 'astounding', 'wow'];
const EMOTION_FEAR = ['worried', 'worrying', 'fear', 'scary', 'risky', 'danger', 'concerned', 'alarming', 'threat'];
const EMOTION_SAD = ['sad', 'sadly', 'unfortunate', 'regret', 'tragic', 'heartbreaking', 'disheartening'];
const EMOTION_DISGUST = ['disgusting', 'gross', 'revolting', 'sickening', 'appalling'];
const EMOTION_ANGER = [
    'hate', 'hated', 'terrible', 'awful', 'horrible', 'angry', 'furious', 'outrage', 'outraged',
    'worst', 'pathetic', 'garbage', 'trash', 'ridiculous', 'absurd', 'infuriating',
];

function scoreEmotion0to100(window) {
    const joy = countHits(window, EMOTION_JOY);
    const surprise = countHits(window, EMOTION_SURPRISE);
    const fear = countHits(window, EMOTION_FEAR);
    const sad = countHits(window, EMOTION_SAD);
    const disgust = countHits(window, EMOTION_DISGUST);
    const anger = countHits(window, EMOTION_ANGER);

    let s = 50;
    s += Math.min(28, joy * 9);
    s += Math.min(10, surprise * 4);
    s -= Math.min(22, fear * 8);
    s -= Math.min(18, sad * 7);
    s -= Math.min(22, disgust * 10);
    s -= Math.min(32, anger * 11);
    return clamp(Math.round(s), 0, 100);
}

/** Factor 2 — positive / negative lexicon. */
const POLARITY_POS = [
    'best', 'top', 'leading', 'excellent', 'recommended', 'trusted', 'popular', 'premier',
    'outstanding', 'innovative', 'reliable', 'renowned', 'quality', 'professional', 'superior',
    'preferred', 'award', 'solid', 'strong', 'impressive', 'effective', 'helpful', 'easy',
    'fast', 'secure', 'affordable', 'value', 'success', 'growth', 'winner',
];
const POLARITY_NEG = [
    'worst', 'bad', 'poor', 'avoid', 'scam', 'complaint', 'issue', 'problem', 'negative',
    'decline', 'fail', 'failed', 'expensive', 'unreliable', 'disappointing', 'mediocre',
    'controversial', 'bug', 'broken', 'slow', 'difficult', 'confusing', 'misleading', 'risk',
];

function scorePolarity0to100(window) {
    const pos = countHits(window, POLARITY_POS);
    const neg = countHits(window, POLARITY_NEG);
    const raw = 50 + Math.min(38, pos * 7) - Math.min(45, neg * 9);
    return clamp(Math.round(raw), 0, 100);
}

/** Factor 3 — strength of expression (punctuation, intensifiers, deviation from neutral polarity). */
const INTENSIFIERS = [
    'absolutely', 'extremely', 'utterly', 'totally', 'completely', 'highly', 'deeply', 'strongly',
    'incredibly', 'really', 'very', 'so much', 'insanely',
];

function scoreIntensity0to100(window, polarityScore) {
    const excl = (window.match(/!/g) || []).length;
    const intens = countHits(window, INTENSIFIERS);
    const capsWords = (window.match(/\b[A-Z]{3,}\b/g) || []).length;
    const dev = Math.abs(polarityScore - 50);
    let s = 50 + dev * 0.72 + Math.min(18, excl * 3.5) + Math.min(14, intens * 3) + Math.min(10, capsWords * 2);
    return clamp(Math.round(s), 0, 100);
}

/** Factor 4 — opinion-like vs factual (high = more subjective / opinionated). */
const OPINION_MARKERS = [
    'i think', 'i believe', 'in my opinion', 'imo', 'feels like', 'seems like', 'appears to',
    'obviously', 'clearly', 'undoubtedly', 'must say', 'personally', 'i find', 'i felt',
];
const FACT_MARKERS = [
    'study ', 'studies ', 'research ', 'data shows', 'according to', 'published', 'peer-reviewed',
    'statistics', 'survey', 'reported that', 'founded in', 'established in', 'million', 'billion',
    'percent', 'percentage', 'q1 ', 'q2 ', 'q3 ', 'q4 ', 'revenue', 'headquartered',
];

function scoreSubjectivity0to100(window) {
    const op = countHits(window, OPINION_MARKERS);
    const fact = countHits(window, FACT_MARKERS);
    const raw = 50 + Math.min(35, op * 8) - Math.min(35, fact * 9);
    return clamp(Math.round(raw), 0, 100);
}

/** Factor 5 — cleanliness (100 = clean, low = toxic / insulting). */
const TOXIC_SEVERE = [
    'idiot', 'idiots', 'moron', 'morons', 'stupid', 'pathetic', 'loser', 'losers', 'worthless',
    'garbage human', 'kill yourself', 'go die', 'hate you', 'despicable', 'vile',
];
const TOXIC_MILD = ['sucks', 'crap', 'bullshit', 'bs ', 'damn', 'scam artist', 'fraudster', 'trash'];

function scoreToxicity0to100(window) {
    const sev = countHits(window, TOXIC_SEVERE);
    const mild = countHits(window, TOXIC_MILD);
    let s = 100 - sev * 38 - mild * 12;
    return clamp(Math.round(s), 0, 100);
}

function extractWindowAroundEntity(textLower, entityName) {
    if (!textLower || !entityName || entityName.length < 2) return '';
    const nameLower = entityName.toLowerCase();
    const idx = textLower.indexOf(nameLower);
    if (idx === -1) return '';
    const radius = 220;
    return textLower.substring(Math.max(0, idx - radius), Math.min(textLower.length, idx + entityName.length + radius));
}

/**
 * @param {string} textLower - full answer lowercased
 * @param {string} entityName - brand or competitor name
 * @returns {{ score: number, factors: { emotion: number, polarity: number, intensity: number, subjectivity: number, toxicity: number } }}
 */
export function computeMultiFactorSentiment(textLower, entityName) {
    const window = extractWindowAroundEntity(textLower, entityName);
    if (!window) {
        const mid = {
            emotion: 50,
            polarity: 50,
            intensity: 50,
            subjectivity: 50,
            toxicity: 50,
        };
        return { score: 50, factors: mid };
    }

    const emotion = scoreEmotion0to100(window);
    const polarity = scorePolarity0to100(window);
    const intensity = scoreIntensity0to100(window, polarity);
    const subjectivity = scoreSubjectivity0to100(window);
    const toxicity = scoreToxicity0to100(window);

    const combined =
        W_EMOTION * emotion +
        W_POLARITY * polarity +
        W_INTENSITY * intensity +
        W_SUBJECTIVITY * subjectivity +
        W_TOXICITY * toxicity;

    const score = clamp(Math.round(combined * 10) / 10, 0, 100);
    return {
        score,
        factors: { emotion, polarity, intensity, subjectivity, toxicity },
    };
}

/** Scalar for callers that only need 0–100. */
export function multiFactorSentiment0to100(textLower, entityName) {
    return computeMultiFactorSentiment(textLower, entityName).score;
}
