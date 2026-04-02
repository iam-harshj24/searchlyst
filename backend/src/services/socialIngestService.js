/**
 * Pulls public data from connected social URLs where no per-user OAuth is required.
 *
 * - YouTube: official Data API v3 (needs YOUTUBE_API_KEY).
 * - Substack: public RSS feed.
 * - Reddit: public .json listing (fragile; may rate-limit — use sparingly).
 *
 * LinkedIn, Instagram, X/Twitter, TikTok, Quora: no reliable server-side public API
 * without OAuth / partner access — we return explicit status + next steps.
 */

import * as cheerio from 'cheerio';

const UA = 'SearchlystSocialIngest/1.0 (+https://searchlyst.com)';

async function fetchJson(url, { timeoutMs = 15000 } = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json', 'User-Agent': UA },
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
    const r = await fetchJson(url);
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

    return {
        fetchedAt,
        platforms,
    };
}
