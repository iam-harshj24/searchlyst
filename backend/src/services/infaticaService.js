const INFATICA_BASE = 'https://scrape.infatica.io';

function getApiKey() {
    const key = process.env.INFATICA_API_KEY;
    if (!key) throw new Error('INFATICA_API_KEY is not configured');
    return key;
}

/**
 * Smart response extractor — handles every known Infatica response format.
 * Returns { text, sources } where text is the plain AI answer and sources
 * is an array of { url, title, domain } objects if the engine provided them.
 */
async function extractResponse(res) {
    const raw = await res.text();

    let json = null;
    try { json = JSON.parse(raw); } catch { /* not JSON — treat as plain text */ }

    // ── Case 1: Structured JSON with a sources/citations array (Infatica direct API) ──
    if (json && typeof json === 'object') {
        // Extract the AI answer text from whichever field exists
        const text =
            json.answer ??          // perplexity-style
            json.text ??            // generic text
            json.content ??         // content field
            json.response ??        // response field
            json.result ??          // result field
            json.output ??          // output field
            json.message ??         // message field
            (json.html ? null : '');// if html exists handle below

        // Extract embedded sources from structured response
        const rawSources =
            json.sources ??
            json.citations ??
            json.references ??
            json.links ??
            [];

        const sources = Array.isArray(rawSources)
            ? rawSources.map(s => {
                  if (typeof s === 'string') {
                      try { return { url: s, domain: new URL(s).hostname.replace('www.', ''), title: '' }; }
                      catch { return null; }
                  }
                  if (s && typeof s === 'object') {
                      const url = s.url ?? s.href ?? s.link ?? '';
                      let domain = s.domain ?? s.hostname ?? '';
                      if (!domain && url) {
                          try { domain = new URL(url).hostname.replace('www.', ''); } catch {}
                      }
                      return { url, domain, title: s.title ?? s.name ?? '' };
                  }
                  return null;
              }).filter(Boolean)
            : [];

        if (text && typeof text === 'string' && text.trim()) {
            console.log(`[Infatica] Structured text response (${text.length} chars, ${sources.length} sources)`);
            return { text: text.trim(), sources, html: null };
        }

        // ── Case 2: HTML in json.html (rendered page scrape) ──
        if (json.html && typeof json.html === 'string') {
            const decoded = tryBase64Decode(json.html) ?? json.html;
            console.log(`[Infatica] HTML response (${decoded.length} chars)`);
            return { text: null, sources: [], html: decoded };
        }
    }

    // ── Case 3: Raw text (not JSON), treat as plain AI response ──
    if (raw && raw.trim()) {
        console.log(`[Infatica] Raw text response (${raw.length} chars)`);
        return { text: raw.trim(), sources: [], html: null };
    }

    console.warn('[Infatica] Empty response received');
    return { text: null, sources: [], html: null };
}

function tryBase64Decode(str) {
    try {
        const decoded = Buffer.from(str, 'base64').toString('utf-8');
        // Check it looks like HTML
        if (decoded.includes('<html') || decoded.includes('<body') || decoded.includes('<div')) {
            return decoded;
        }
        return null;
    } catch {
        return null;
    }
}

export async function queryPerplexity(query) {
    console.log(`[Perplexity] Querying: "${query.substring(0, 80)}..."`);
    const res = await fetch(`${INFATICA_BASE}/perplexity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ query, nocache: true }),
        cache: 'no-store',
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[Perplexity] Error:', res.status, err.substring(0, 200));
        throw new Error(`Perplexity query failed: ${res.status}`);
    }

    return await extractResponse(res);
}

export async function queryGemini(query) {
    console.log(`[Gemini] Querying: "${query.substring(0, 80)}..."`);
    const res = await fetch(`${INFATICA_BASE}/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({ query, nocache: true }),
        cache: 'no-store',
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[Gemini] Error:', res.status, err.substring(0, 200));
        throw new Error(`Gemini query failed: ${res.status}`);
    }

    return await extractResponse(res);
}

export async function queryGoogleAI(query, country) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    console.log(`[GoogleAI] Querying SERP: "${query.substring(0, 80)}..."`);
    const res = await fetch(`${INFATICA_BASE}/serp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': getApiKey() },
        body: JSON.stringify({
            url,
            mode: 'render',
            results: 10,
            nocache: true,
            ...(country && { country }),
        }),
        cache: 'no-store',
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[GoogleAI] SERP Error:', res.status, err.substring(0, 200));
        throw new Error(`Google AI query failed: ${res.status}`);
    }

    return await extractResponse(res);
}
