/**
 * Infatica Gemini API - AI citation visibility and sentiment
 * Docs: https://infatica.io/documentation/scraper-api
 * Requires Infatica Advanced plan
 */

import { analyzeSentiment } from './sentimentAnalysisService.js';

const GEMINI_URL = 'https://scrape.infatica.io/gemini';
const TIMEOUT_MS = 45000;

function domainInText(text, domain) {
  if (!text || !domain) return { cited: false, mentioned: false };
  const lower = String(text).toLowerCase();
  const d = domain.toLowerCase();
  const urlPattern = new RegExp(`https?://[^\\s"']*${escapeRegex(d)}[^\\s"']*`, 'i');
  const cited = urlPattern.test(lower) || lower.includes(`https://${d}`) || lower.includes(`http://${d}`);
  const mentioned = lower.includes(d) || lower.includes(d.replace(/\./g, ' '));
  return { cited, mentioned };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Query Gemini with custom query, optional country, and sentiment analysis
 * @param {string} query - Search query
 * @param {string} domain - Domain to check for citations
 * @param {string} [country] - ISO 3166-1 alpha-2 code (e.g. US, GB, DE)
 * @returns {Promise<{ score: number, citationsFound: number, rawSnippet: string, sentiment: { label, sentimentScore } } | null>}
 */
export async function queryGeminiWithSentiment(query, domain, country) {
  const apiKey = process.env.INFATICA_API_KEY;
  if (!apiKey) return null;

  const body = { query, return_html: false };
  if (country) body.country = country;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 403 || res.status === 401 || res.status === 402 || !res.ok) {
      return null;
    }

    const json = await res.json();
    const html = json?.html ?? json?.content ?? '';
    const text = typeof html === 'string' ? html : JSON.stringify(json);
    const rawSnippet = text.slice(0, 2000);

    const { cited, mentioned } = domainInText(text, domain);
    let score = 0;
    let citationsFound = 0;
    if (cited) {
      score = 100;
      citationsFound = (text.match(new RegExp(escapeRegex(domain), 'gi')) || []).length;
    } else if (mentioned) {
      score = 50;
    }

    const sentimentResult = analyzeSentiment(rawSnippet);

    return {
      score,
      citationsFound,
      rawSnippet,
      sentiment: {
        label: sentimentResult.label,
        sentimentScore: sentimentResult.sentimentScore,
      },
    };
  } catch (err) {
    if (err.name === 'AbortError') return null;
    return null;
  }
}
