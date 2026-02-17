/**
 * Firecrawl API integration for site mapping and crawling
 * Docs: https://docs.firecrawl.dev
 */

const FIRECRAWL_BASE_V0 = 'https://api.firecrawl.dev/v0';
const FIRECRAWL_BASE_V2 = 'https://api.firecrawl.dev/v2';
const CRAWL_POLL_INTERVAL_MS = 4000;
const CRAWL_MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Map a website to discover URLs
 * @param {string} url - Base URL (e.g. https://example.com)
 * @param {object} options - { limit?: number, sitemap?: string }
 * @returns {Promise<Array<{ url: string, title?: string, description?: string }>>}
 */
export async function mapUrls(url, options = {}) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not configured');
  }

  const { limit = 30, sitemap = 'include' } = options;
  const normalizedUrl = normalizeUrl(url);

  const res = await fetch(`${FIRECRAWL_BASE_V2}/map`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: normalizedUrl,
      limit,
      sitemap,
      includeSubdomains: false,
      ignoreQueryParameters: true,
    }),
  });

  if (res.status === 429) {
    throw new Error('Firecrawl rate limit exceeded. Please try again later.');
  }
  if (res.status === 402) {
    throw new Error('Firecrawl payment required.');
  }
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Firecrawl map error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const json = await res.json();
  const links = json?.links ?? [];
  const baseHost = new URL(normalizedUrl).hostname;

  return links
    .filter((l) => l?.url && new URL(l.url).hostname === baseHost)
    .slice(0, limit)
    .map((l) => ({
      url: l.url,
      title: l.title,
      description: l.description,
    }));
}

/**
 * Crawl a website and return page content
 * @param {string} url - Base URL to crawl
 * @param {object} options - { limit?: number, maxDepth?: number }
 * @returns {Promise<Array<{ url: string, html: string, title?: string }>>}
 */
export async function crawlSite(url, options = {}) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not configured');
  }

  const { limit = 15, maxDepth = 2 } = options;
  const normalizedUrl = normalizeUrl(url);

  const res = await fetch(`${FIRECRAWL_BASE_V0}/crawl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: normalizedUrl,
      crawlerOptions: {
        limit,
        maxDepth,
        mode: 'default',
      },
      pageOptions: {
        includeRawHtml: true,
      },
    }),
  });

  if (res.status === 429) {
    throw new Error('Firecrawl rate limit exceeded. Please try again later.');
  }
  if (res.status === 402) {
    throw new Error('Firecrawl payment required.');
  }
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Firecrawl crawl error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const json = await res.json();
  const jobId = json?.jobId;
  if (!jobId) {
    throw new Error('Firecrawl did not return a job ID');
  }

  return pollCrawlStatus(apiKey, jobId);
}

async function pollCrawlStatus(apiKey, jobId) {
  const start = Date.now();

  while (Date.now() - start < CRAWL_MAX_WAIT_MS) {
    await sleep(CRAWL_POLL_INTERVAL_MS);

    const res = await fetch(`${FIRECRAWL_BASE_V0}/crawl/status/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Firecrawl status error ${res.status}`);
    }

    const json = await res.json();
    const status = json?.status;

    if (status === 'failed') {
      throw new Error(json?.error || 'Firecrawl crawl failed');
    }

    if (status === 'completed') {
      const data = json?.data ?? [];
      return data
        .filter((d) => d?.rawHtml || d?.html)
        .map((d) => ({
          url: d?.metadata?.sourceURL || d?.url || '',
          html: d?.rawHtml || d?.html || '',
          title: d?.metadata?.title,
        }));
    }

    // active, paused - keep polling
  }

  throw new Error('Firecrawl crawl timed out');
}

function normalizeUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) throw new Error('URL is required');
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
