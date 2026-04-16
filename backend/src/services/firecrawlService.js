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

    const json = await response.json();
    const id = json.id || json.jobId;
    if (!id) {
        console.error('Firecrawl crawl start: missing job id in response', JSON.stringify(json).slice(0, 500));
        throw new Error('Firecrawl did not return a crawl job id');
    }
    return { ...json, id };
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

/**
 * Firecrawl may split crawl results across pages (response.next). Merge all chunks before analysis.
 */
export async function getCrawlStatusWithAllData(jobId) {
    const key = getApiKey();
    let status = await getCrawlStatus(jobId);
    let data = [...(status.data || [])];
    let next = status.next;
    let guard = 0;
    while (next && guard++ < 30) {
        const r = await fetch(next, { headers: { Authorization: `Bearer ${key}` } });
        if (!r.ok) {
            console.error('Firecrawl next-page error:', r.status, await r.text());
            break;
        }
        const chunk = await r.json();
        data = data.concat(chunk.data || []);
        next = chunk.next || null;
        if (chunk.status) status = { ...status, ...chunk, data };
    }
    return { ...status, data };
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
