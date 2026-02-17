/**
 * Infatica Web Scraper API integration
 * Docs: https://infatica.io/documentation/scraper-api
 */

const INFATICA_BASE = 'https://scrape.infatica.io';
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

/**
 * Fetch a webpage via Infatica API
 * @param {string} url - Full URL to fetch (e.g. https://www.example.com)
 * @param {object} options - { returnHtml: boolean, country?: string, language?: string }
 * @returns {Promise<string>} - Raw HTML string
 */
export async function fetchPage(url, options = {}) {
  const apiKey = process.env.INFATICA_API_KEY;
  if (!apiKey) {
    throw new Error('INFATICA_API_KEY is not configured');
  }

  const { returnHtml = true, country, language } = options;

  const body = {
    url: normalizeUrl(url),
    return_html: returnHtml,
  };
  if (country) body.country = country;
  if (language) body.language = language;

  let lastError;
  let res;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      res = await fetch(`${INFATICA_BASE}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const errBody = await res.text();
        let msg = `Infatica API error ${res.status}`;
        try {
          const parsed = JSON.parse(errBody);
          msg = parsed.message || parsed.error || msg;
        } catch {
          if (errBody) msg += `: ${errBody.slice(0, 200)}`;
        }
        throw mapInfaticaError(res.status, msg);
      }

      if (returnHtml) {
        return await res.text();
      }

      const json = await res.json();
      const htmlBase64 = json?.data?.html ?? json?.html;
      if (!htmlBase64) {
        throw new Error('Infatica response missing HTML content');
      }
      return Buffer.from(htmlBase64, 'base64').toString('utf-8');
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') {
        lastError = new Error('Request timeout while fetching page');
      }
      const shouldRetry = attempt < MAX_RETRIES && (res?.status === 429 || err.name === 'AbortError');
      if (shouldRetry) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error('Failed to fetch page');
}

/**
 * Fetch page with JS rendering (for SPAs) - fallback when scrape returns minimal content
 */
export async function fetchPageWithRender(url, options = {}) {
  const apiKey = process.env.INFATICA_API_KEY;
  if (!apiKey) {
    throw new Error('INFATICA_API_KEY is not configured');
  }

  const { returnHtml = true, country, language } = options;

  const body = {
    url: normalizeUrl(url),
    return_html: returnHtml,
  };
  if (country) body.country = country;
  if (language) body.language = language;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // render can be slower

  try {
    const res = await fetch(`${INFATICA_BASE}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      throw mapInfaticaError(res.status, errBody || `Infatica render error ${res.status}`);
    }

    if (returnHtml) {
      return await res.text();
    }

    const json = await res.json();
    const htmlBase64 = json?.data?.html ?? json?.html;
    if (!htmlBase64) {
      throw new Error('Infatica render response missing HTML content');
    }
    return Buffer.from(htmlBase64, 'base64').toString('utf-8');
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timeout while rendering page');
    }
    throw err;
  }
}

function normalizeUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) throw new Error('URL is required');
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function mapInfaticaError(status, message) {
  const err = new Error(message);
  switch (status) {
    case 400:
      err.code = 'INVALID_PAYLOAD';
      break;
    case 401:
      err.code = 'Invalid API key or insufficient prepaid requests';
      break;
    case 403:
      err.code = 'ACCOUNT_SUSPENDED';
      break;
    case 422:
      err.code = 'VALIDATION_FAILED';
      break;
    case 429:
      err.code = 'RATE_LIMITED';
      break;
    case 500:
      err.code = 'SERVER_ERROR';
      break;
    default:
      err.code = 'UNKNOWN';
  }
  return err;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
