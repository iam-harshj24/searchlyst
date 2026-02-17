/**
 * Sentiment analysis using the sentiment package (AFINN-165)
 * Maps text to score, label, and 0-100 sentiment score
 */

import Sentiment from 'sentiment';

const sentiment = new Sentiment();

/**
 * Strip HTML and normalize text for sentiment analysis
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

/**
 * Analyze sentiment of text
 * @param {string} text - Raw text (HTML will be stripped)
 * @returns {{ score: number, comparative: number, label: 'positive'|'neutral'|'negative', sentimentScore: number }}
 */
export function analyzeSentiment(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return {
      score: 0,
      comparative: 0,
      label: 'neutral',
      sentimentScore: 50,
    };
  }

  const result = sentiment.analyze(normalized);
  const comparative = result.comparative ?? 0;

  // Map comparative (-1 to 1 typically) to 0-100
  const sentimentScore = Math.round(Math.min(100, Math.max(0, (comparative + 1) * 50)));

  let label = 'neutral';
  if (comparative > 0.1) label = 'positive';
  else if (comparative < -0.1) label = 'negative';

  return {
    score: result.score ?? 0,
    comparative,
    label,
    sentimentScore,
  };
}
