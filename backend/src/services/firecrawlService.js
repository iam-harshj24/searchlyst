const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

function getApiKey() {
    const key = process.env.FIRECRAWL_API_KEY;
    if (!key) throw new Error('FIRECRAWL_API_KEY is not configured');
    return key;
}

export async function startCrawl(url, options = {}) {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url,
            limit: options.limit || 25,
            scrapeOptions: {
                formats: ['markdown', 'html', 'rawHtml'],
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Firecrawl crawl start error:', response.status, err);
        throw new Error(`Firecrawl error: ${response.status}`);
    }

    return await response.json();
}

export async function getCrawlStatus(jobId) {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl/${jobId}`, {
        headers: { 'Authorization': `Bearer ${getApiKey()}` },
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Firecrawl status error:', response.status, err);
        throw new Error(`Firecrawl status error: ${response.status}`);
    }

    return await response.json();
}

export async function fetchRobotsTxt(domain) {
    try {
        const res = await fetch(`https://${domain}/robots.txt`, { signal: AbortSignal.timeout(10000) });
        if (res.ok) return await res.text();
        return null;
    } catch { return null; }
}

export async function fetchSitemapXml(domain) {
    try {
        const res = await fetch(`https://${domain}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
        if (res.ok) return await res.text();
        return null;
    } catch { return null; }
}
