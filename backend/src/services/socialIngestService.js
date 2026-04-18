/**
 * Pulls public data from connected social URLs where no per-user OAuth is required.
 *
 * - YouTube: official Data API v3 (needs YOUTUBE_API_KEY).
 * - Substack: public RSS feed.
 * - Reddit: public .json listing (fragile; may rate-limit — use sparingly).
 *
 * LinkedIn, Instagram, X/Twitter, TikTok, Quora: no reliable server-side public API
 * without OAuth / partner access — we return explicit status + next steps.
 *
 * We never post or publish on behalf of the user. Inferred writing style is read-only
 * and stored on the project snapshot for Brand Hub + content personalization.
 */

import * as cheerio from 'cheerio';
import { getGeminiGenerativeModel } from '../lib/geminiClient.js';

/** Same Gemini client as content generation — loads backend/.env reliably. */
function getStyleModel() {
    try {
        return getGeminiGenerativeModel();
    } catch {
        return null;
    }
}

const UA = 'SearchlystSocialIngest/1.0 (+https://searchlyst.com)';

async function fetchJson(url, { timeoutMs = 15000, userAgent } = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                'User-Agent': userAgent || UA,
            },
        });
        if (!res.ok) return { ok: false, status: res.status, error: res.statusText };
        const data = await res.json();
        return { ok: true, data };
    } catch (e) {
        return { ok: false, error: e.message || 'fetch failed' };
    } finally {
        clearTimeout(t);
    }
}

async function fetchText(url, { timeoutMs = 15000 } = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*', 'User-Agent': UA },
        });
        if (!res.ok) return { ok: false, status: res.status, error: res.statusText };
        const text = await res.text();
        return { ok: true, text };
    } catch (e) {
        return { ok: false, error: e.message || 'fetch failed' };
    } finally {
        clearTimeout(t);
    }
}

/** @param {string} raw */
function extractYoutubeHandleOrChannelId(raw) {
    const s = String(raw || '').trim();
    if (!s) return null;
    const u = s.startsWith('http') ? s : `https://${s.replace(/^\/+/, '')}`;
    try {
        const url = new URL(u);
        const host = url.hostname.replace(/^www\./, '');
        if (!host.includes('youtube.com') && host !== 'youtu.be') return null;
        const path = url.pathname;
        const at = path.match(/\/@([^/?#]+)/);
        if (at) return { type: 'handle', value: decodeURIComponent(at[1]) };
        const ch = path.match(/\/channel\/([^/?#]+)/);
        if (ch) return { type: 'channelId', value: ch[1] };
        const c = path.match(/\/c\/([^/?#]+)/);
        if (c) return { type: 'custom', value: decodeURIComponent(c[1]) };
        const user = path.match(/\/user\/([^/?#]+)/);
        if (user) return { type: 'custom', value: decodeURIComponent(user[1]) };
    } catch {
        if (s.startsWith('@')) return { type: 'handle', value: s.replace(/^@/, '') };
    }
    return null;
}

/**
 * @param {string} input
 * @param {string} [apiKey]
 */
async function ingestYouTube(input, apiKey) {
    if (!apiKey) {
        return {
            source: 'youtube',
            ok: false,
            needsConfig: true,
            message: 'Set YOUTUBE_API_KEY in the backend .env (Google Cloud → YouTube Data API v3).',
            items: [],
        };
    }

    const parsed = extractYoutubeHandleOrChannelId(input);
    if (!parsed) {
        return {
            source: 'youtube',
            ok: false,
            message: 'Could not parse YouTube URL. Use youtube.com/@handle or /channel/UC…',
            items: [],
        };
    }

    const key = `key=${encodeURIComponent(apiKey)}`;
    let channelId = null;
    let channelTitle = null;

    if (parsed.type === 'channelId') {
        channelId = parsed.value;
    } else if (parsed.type === 'handle') {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(parsed.value)}&${key}`;
        const r = await fetchJson(url);
        if (!r.ok || !r.data?.items?.[0]) {
            return {
                source: 'youtube',
                ok: false,
                message: r.error || 'Channel not found for this handle',
                items: [],
            };
        }
        channelId = r.data.items[0].id;
        channelTitle = r.data.items[0].snippet?.title;
    } else {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(parsed.value)}&maxResults=1&${key}`;
        const r = await fetchJson(url);
        if (!r.ok || !r.data?.items?.[0]?.id?.channelId) {
            return {
                source: 'youtube',
                ok: false,
                message: r.error || 'Could not resolve custom /user channel (try @handle URL instead).',
                items: [],
            };
        }
        channelId = r.data.items[0].id.channelId;
        channelTitle = r.data.items[0].snippet?.title;
    }

    const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${encodeURIComponent(channelId)}&${key}`;
    const chRes = await fetchJson(chUrl);
    if (!chRes.ok || !chRes.data?.items?.[0]) {
        return { source: 'youtube', ok: false, message: chRes.error || 'Channel lookup failed', items: [] };
    }
    const uploads = chRes.data.items[0].contentDetails?.relatedPlaylists?.uploads;
    channelTitle = channelTitle || chRes.data.items[0].snippet?.title;
    if (!uploads) {
        return {
            source: 'youtube',
            ok: true,
            channelTitle,
            channelId,
            message: 'No uploads playlist exposed for this channel.',
            items: [],
        };
    }

    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(uploads)}&maxResults=10&${key}`;
    const pl = await fetchJson(plUrl);
    if (!pl.ok) {
        return { source: 'youtube', ok: false, message: pl.error || 'Failed to list videos', items: [] };
    }

    const items = (pl.data?.items || []).map((it) => {
        const sn = it.snippet;
        return {
            title: sn?.title,
            publishedAt: sn?.publishedAt,
            videoId: sn?.resourceId?.videoId,
            url: sn?.resourceId?.videoId ? `https://www.youtube.com/watch?v=${sn.resourceId.videoId}` : null,
        };
    });

    return {
        source: 'youtube',
        ok: true,
        channelTitle,
        channelId,
        items,
    };
}

/** @param {string} raw */
function extractSubstackFeedUrl(raw) {
    const s = String(raw || '').trim().replace(/^@/, '');
    if (!s) return null;
    if (s.includes('substack.com')) {
        try {
            const u = new URL(s.startsWith('http') ? s : `https://${s}`);
            const host = u.hostname.replace(/^www\./, '');
            if (!host.endsWith('substack.com')) return null;
            return `https://${host}/feed`;
        } catch {
            return null;
        }
    }
    const slug = s.replace(/\.substack\.com.*/i, '').replace(/[^a-zA-Z0-9-]/g, '');
    if (!slug) return null;
    return `https://${slug}.substack.com/feed`;
}

/** @param {string} input */
async function ingestSubstack(input) {
    const feedUrl = extractSubstackFeedUrl(input);
    if (!feedUrl) {
        return {
            source: 'substack',
            ok: false,
            message: 'Use your Substack URL or slug (e.g. yourname.substack.com).',
            items: [],
        };
    }
    const r = await fetchText(feedUrl);
    if (!r.ok) {
        return {
            source: 'substack',
            ok: false,
            message: r.error || `Feed HTTP ${r.status}`,
            items: [],
        };
    }
    const $ = cheerio.load(r.text, { xmlMode: true });
    const items = [];
    $('item').each((_, el) => {
        const title = $(el).find('title').first().text().replace(/\s+/g, ' ').trim();
        let link = $(el).find('link').first().text().trim();
        if (!link) link = $(el).find('link').attr('href') || '';
        const pubDate = $(el).find('pubDate').first().text().trim();
        if (title) items.push({ title, link, pubDate });
    });
    return {
        source: 'substack',
        ok: true,
        feedUrl,
        items: items.slice(0, 12),
    };
}

/** @param {string} raw */
function extractRedditUsername(raw) {
    const s = String(raw || '').trim();
    if (!s) return null;
    const m = s.match(/(?:reddit\.com\/(?:user|u)\/)([^/?#]+)/i);
    if (m) return m[1];
    if (/^u\//i.test(s)) return s.replace(/^u\//i, '');
    if (!s.includes('/') && !s.includes('.')) return s.replace(/^u\//i, '');
    return null;
}

/** @param {string} input */
async function ingestReddit(input) {
    const user = extractRedditUsername(input);
    if (!user) {
        return {
            source: 'reddit',
            ok: false,
            message: 'Use reddit.com/user/name or u/name',
            items: [],
        };
    }
    const url = `https://www.reddit.com/user/${encodeURIComponent(user)}/submitted.json?limit=8&raw_json=1`;
    // Reddit often 403s non-browser user-agents from datacenter IPs
    const r = await fetchJson(url, {
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    if (!r.ok) {
        return {
            source: 'reddit',
            ok: false,
            message: r.error || `Reddit HTTP ${r.status || ''}`.trim(),
            items: [],
        };
    }
    const children = r.data?.data?.children || [];
    const items = children
        .map((c) => {
            const d = c.data;
            if (!d) return null;
            return {
                title: d.title,
                url: d.url && d.url.startsWith('http') ? d.url : d.permalink ? `https://www.reddit.com${d.permalink}` : null,
                createdUtc: d.created_utc,
                subreddit: d.subreddit,
            };
        })
        .filter(Boolean);

    return { source: 'reddit', ok: true, username: user, items };
}

function oauthOnly(platform, docs) {
    return {
        source: platform,
        ok: false,
        needsOAuth: true,
        message:
            'Public server-side fetch is not available without connecting your account (OAuth) or an official API partnership.',
        docs,
        items: [],
    };
}

/** Collect post/video titles from ingest blocks (read-only samples for style inference). */
function collectTitleSamples(platforms) {
    const lines = [];
    for (const [key, block] of Object.entries(platforms || {})) {
        if (block?.needsOAuth) continue;
        if (!Array.isArray(block?.items)) continue;
        for (const it of block.items) {
            const title = (it.title || '').trim();
            if (title) lines.push({ platform: key, title });
        }
    }
    return lines;
}

/**
 * Infer a compact writing-style profile from public titles (no posting; analysis only).
 * @param {{ platform: string, title: string }[]} samples
 * @param {string} brandName
 */
async function inferWritingStyleFromSamples(samples, brandName) {
    const model = getStyleModel();
    const safeBrand = String(brandName || 'this brand').slice(0, 120);
    if (!model) {
        return {
            source: 'none',
            summary:
                'Set GEMINI_API_KEY on the server to infer tone and vocabulary from sampled public titles.',
            traits: [],
        };
    }
    if (!samples.length) {
        return {
            source: 'none',
            summary:
                'Save social links and sync again after we can read public samples (e.g. YouTube, Substack, Reddit). We never post on your behalf.',
            traits: [],
        };
    }

    const corpus = samples
        .slice(0, 45)
        .map((s) => `[${s.platform}] ${s.title}`)
        .join('\n');

    const prompt = `You analyze how a brand sounds on social and content platforms. Use ONLY the public post/video titles below (no body text, no guessing from domain). Infer this creator/brand’s writing voice for short-form social copy: tone, word choice, rhythm, and personality as suggested by how they title content.

Brand label: "${safeBrand}"

TITLES (tagged by source platform):
${corpus}

Return a JSON object with exactly this shape (no markdown fences, no extra keys):
{"summary":"one sentence stating this is inferred from public titles only and which kinds of platforms contributed","traits":[{"label":"Tone","value":"short phrase","confidence":85},{"label":"Vocabulary","value":"short phrase","confidence":80},{"label":"Sentence style","value":"short phrase","confidence":78},{"label":"Personality","value":"short phrase","confidence":75}]}

Rules: exactly 4 traits; confidence integers 60-95; stay conservative if there are few titles; do not invent facts about the brand beyond the titles.`;

    const parseGeminiJson = (raw) => {
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    };

    try {
        let result;
        try {
            result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.35,
                },
            });
        } catch (e) {
            console.warn('[socialIngest] Gemini JSON mode failed, retrying plain text:', e?.message?.slice(0, 120));
            result = await model.generateContent(prompt);
        }
        let parsed;
        const raw = result.response.text().trim();
        try {
            parsed = JSON.parse(raw);
        } catch {
            parsed = parseGeminiJson(raw);
        }
        const traits = Array.isArray(parsed.traits)
            ? parsed.traits.slice(0, 4).map((t) => ({
                  label: String(t.label || '').slice(0, 80),
                  value: String(t.value || '').slice(0, 200),
                  confidence: Math.min(100, Math.max(0, Number(t.confidence) || 70)),
              }))
            : [];
        return {
            source: 'llm',
            summary: String(parsed.summary || 'Writing style inferred from public titles.').slice(0, 500),
            traits,
        };
    } catch (e) {
        return {
            source: 'error',
            summary: e?.message || 'Could not infer writing style from samples.',
            traits: [],
        };
    }
}

/**
 * @param {object} project — Prisma project row with social_* fields
 */
export async function buildSocialIngestSnapshot(project) {
    const youtubeKey = process.env.YOUTUBE_API_KEY || '';
    const fetchedAt = new Date().toISOString();
    const platforms = {};

    if (project.social_youtube?.trim()) {
        platforms.youtube = await ingestYouTube(project.social_youtube, youtubeKey);
    }
    if (project.social_substack?.trim()) {
        platforms.substack = await ingestSubstack(project.social_substack);
    }
    if (project.social_reddit?.trim()) {
        platforms.reddit = await ingestReddit(project.social_reddit);
    }

    if (project.social_linkedin?.trim()) {
        platforms.linkedin = oauthOnly('linkedin', 'https://learn.microsoft.com/en-us/linkedin/shared/references/v2/profile/profile-overview');
    }
    if (project.social_twitter?.trim()) {
        platforms.twitter = oauthOnly('twitter', 'https://developer.x.com/en/docs/twitter-api');
    }
    if (project.social_instagram?.trim()) {
        platforms.instagram = oauthOnly('instagram', 'https://developers.facebook.com/docs/instagram-api/');
    }
    if (project.social_tiktok?.trim()) {
        platforms.tiktok = oauthOnly('tiktok', 'https://developers.tiktok.com/');
    }
    if (project.social_quora?.trim()) {
        platforms.quora = oauthOnly('quora', 'No official public API for profile content; options are manual export or compliant third-party data vendors.');
    }

    const titleSamples = collectTitleSamples(platforms);
    if (titleSamples.length === 0) {
        console.warn(
            '[socialIngest] No public title samples — add Substack, Reddit, or YouTube (with YOUTUBE_API_KEY) to infer style.',
        );
    } else {
        console.log(`[socialIngest] ${titleSamples.length} title sample(s) for writing-style inference`);
    }
    const writingStyle = await inferWritingStyleFromSamples(titleSamples, project.brandName);

    return {
        fetchedAt,
        platforms,
        writingStyle: {
            extractedAt: fetchedAt,
            ...writingStyle,
            sampleCount: titleSamples.length,
        },
    };
}
