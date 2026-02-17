/**
 * Infatica Perplexity API - AI citation visibility check
 * Docs: https://infatica.io/documentation/scraper-api
 * Requires Infatica Advanced plan
 */

import { analyzeSentiment } from './sentimentAnalysisService.js';

const PERPLEXITY_URL = 'https://scrape.infatica.io/perplexity';
const TIMEOUT_MS = 45000;

/**
 * Extract domain from URL (e.g. https://www.searchlyst.com -> searchlyst.com)
 */
function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, '');
    return host;
  } catch {
    return '';
  }
}

/**
 * Check if domain appears in text (citation URLs, answer body)
 */
function domainInText(text, domain) {
  if (!text || !domain) return { cited: false, mentioned: false };
  const lower = String(text).toLowerCase();
  const d = domain.toLowerCase();
  // Check for URL patterns
  const urlPattern = new RegExp(`https?://[^\\s"']*${escapeRegex(d)}[^\\s"']*`, 'i');
  const cited = urlPattern.test(lower) || lower.includes(`https://${d}`) || lower.includes(`http://${d}`);
  // Check for domain mention (without full URL)
  const mentioned = lower.includes(d) || lower.includes(d.replace(/\./g, ' '));
  return { cited, mentioned };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Run AI citation visibility check
 * @param {string} projectName - Project/company name
 * @param {string} projectUrl - Project website URL
 * @param {string} [industry] - Optional industry for query
 * @returns {Promise<{ score: number, citationsFound: number, raw?: object } | null>}
 *   Returns null if Perplexity is not available (403, no key, etc.)
 */
export async function checkAiVisibility(projectName, projectUrl, industry) {
  const apiKey = process.env.INFATICA_API_KEY;
  if (!apiKey) {
    return null;
  }

  const domain = extractDomain(projectUrl);
  if (!domain) {
    return null;
  }

  const name = projectName || domain.split('.')[0];
  const query = industry
    ? `What are the best ${industry} companies? Tell me about ${name} (${domain})`
    : `What is ${name}? Tell me about ${name} and ${domain}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ query, return_html: false }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 403) {
      return null; // Advanced plan required
    }
    if (res.status === 401 || res.status === 402) {
      return null;
    }
    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const html = json?.html ?? json?.content ?? '';
    const text = typeof html === 'string' ? html : JSON.stringify(json);

    const { cited, mentioned } = domainInText(text, domain);

    let score = 0;
    let citationsFound = 0;
    if (cited) {
      score = 100;
      citationsFound = (text.match(new RegExp(escapeRegex(domain), 'gi')) || []).length;
    } else if (mentioned) {
      score = 50;
      citationsFound = 0;
    }

    return {
      score,
      citationsFound,
      raw: { query, snippet: text.slice(0, 500) },
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return null;
    }
    return null;
  }
}

/**
 * Query Perplexity with custom query, optional country, and sentiment analysis
 * @param {string} query - Search query
 * @param {string} domain - Domain to check for citations (e.g. searchlyst.com)
 * @param {string} [country] - ISO 3166-1 alpha-2 code (e.g. US, GB, DE)
 * @returns {Promise<{ score: number, citationsFound: number, rawSnippet: string, sentiment: { label, sentimentScore } } | null>}
 */
export async function queryPerplexityWithSentiment(query, domain, country) {
  const apiKey = process.env.INFATICA_API_KEY;
  if (!apiKey) return null;

  const body = { query, return_html: false };
  if (country) body.country = country;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(PERPLEXITY_URL, {
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
