/**
 * System/user prompt for Gemini: multi-factor sentiment on AI answer excerpts (0–100),
 * aligned with SENTIMENT_FACTOR_WEIGHTS in multiFactorSentiment.js
 */

import { SENTIMENT_FACTOR_WEIGHTS } from './multiFactorSentiment.js';

const ENGINE_KEYS = ['perplexity', 'gemini', 'googleAI'];

/**
 * @param {string} brandName
 * @param {string} excerptBlocksMarkdown - pre-formatted "engine:\n\"\"\"excerpt\"\"\""
 */
export function buildGeminiSentimentBatchPrompt(brandName, excerptBlocksMarkdown) {
    const w = SENTIMENT_FACTOR_WEIGHTS;
    const weightLine = `emotion ${(w.emotion * 100).toFixed(0)}%, polarity ${(w.polarity * 100).toFixed(0)}%, intensity ${(w.intensity * 100).toFixed(0)}%, subjectivity ${(w.subjectivity * 100).toFixed(0)}%, toxicity ${(w.toxicity * 100).toFixed(0)}%`;

    return `You evaluate how positively or negatively an AI assistant's answer portrays the brand "${brandName}".

TASK
For each engine below you have an excerpt of that model's answer (may be truncated). Score sentiment using FIVE factors, each as an INTEGER 0–100:

1) emotion — Affective tone toward "${brandName}" (joy/endorsement high; anger/fear/disgust low).
2) polarity — Overall positive vs negative framing (praise/recommendation high; criticism/warning low).
3) intensity — Strength of feeling (mild/neutral middle; strong language or emphasis pushes toward 0 or 100).
4) subjectivity — How opinionated vs factual the passage is (pure opinion higher; dry facts lower).
5) toxicity — Clean/professional high; insults, slurs, or hostile language low.

Also set "overall" 0–100 for that engine. It should reflect the weighted blend:
overall ≈ ${weightLine}
If you omit "overall" but all five factors are integers, the reader will recompute using those weights.

Scale reminder:
- 0–39 = net negative / critical toward the brand
- 40–69 = mixed or neutral
- 70–100 = positive / endorsing

If an excerpt is empty or "${brandName}" is not meaningfully discussed, return null for that engine (not an object).

OUTPUT — reply with ONLY valid JSON (no markdown), exactly this shape:
{
  "engines": {
    "perplexity": null,
    "gemini": {
      "overall": 78,
      "emotion": 80,
      "polarity": 76,
      "intensity": 72,
      "subjectivity": 65,
      "toxicity": 92,
      "rationale": "One short sentence citing what in the text drove the scores."
    },
    "googleAI": null
  }
}

Engine keys must be exactly: "perplexity", "gemini", "googleAI".

EXCERPTS
${excerptBlocksMarkdown}`;
}

export { ENGINE_KEYS };
