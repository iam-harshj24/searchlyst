const INFATICA_BASE = 'https://scrape.infatica.io';

function getApiKey() {
    const key = process.env.INFATICA_API_KEY;
    if (!key) throw new Error('INFATICA_API_KEY is not configured');
    return key;
}

async function extractHtml(res) {
    const text = await res.text();
    try {
        const json = JSON.parse(text);
        return json.html || '';
    } catch {
        return text;
    }
}

export async function queryPerplexity(query) {
    const res = await fetch(`${INFATICA_BASE}/perplexity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ query }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Infatica Perplexity error:', res.status, err);
        throw new Error(`Perplexity query failed: ${res.status}`);
    }

    return await extractHtml(res);
}

export async function queryGemini(query) {
    const res = await fetch(`${INFATICA_BASE}/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ query }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Infatica Gemini error:', res.status, err);
        throw new Error(`Gemini query failed: ${res.status}`);
    }

    return await extractHtml(res);
}

export async function queryGoogleAI(query, country) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(`${INFATICA_BASE}/serp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({
            url,
            mode: 'render',
            results: 10,
            ...(country && { country }),
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Infatica SERP error:', res.status, err);
        throw new Error(`Google AI query failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.html) {
        return Buffer.from(data.html, 'base64').toString('utf-8');
    }
    return '';
}

export function generateQueries(brandName, domain, industry, competitors = [], location = '') {
    const queries = [
        `best ${industry.toLowerCase()} companies${location ? ' in ' + location : ''}`,
        `${brandName}`,
        `${brandName} review`,
        `top ${industry.toLowerCase()} brands ${new Date().getFullYear()}`,
        `${industry.toLowerCase()} recommendations${location ? ' ' + location : ''}`,
    ];

    if (competitors.length > 0) {
        queries.push(`${brandName} vs ${competitors[0]}`);
    }

    return queries;
}
