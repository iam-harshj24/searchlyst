import { ApifyClient } from 'apify-client';
import Parser from 'rss-parser';

const apifyToken = process.env.APIFY_API_TOKEN;
const parser = new Parser();

/**
 * Normalize handle/URL to platform-specific format for Apify
 */
function normalizeHandle(platform, handleOrUrl) {
  const trimmed = String(handleOrUrl || '').trim();
  if (!trimmed) return null;

  switch (platform) {
    case 'linkedin':
      // Accept: linkedin.com/in/username, https://..., or just username
      const liMatch = trimmed.match(/linkedin\.com\/in\/([^/?]+)/i);
      return liMatch ? liMatch[1] : trimmed.replace(/^@/, '');
    case 'twitter':
      // Accept: x.com/username, twitter.com/username, @username, or username
      const twMatch = trimmed.match(/(?:x\.com|twitter\.com)\/([^/?]+)/i);
      if (twMatch) return twMatch[1];
      return trimmed.replace(/^@/, '');
    case 'instagram':
      // Accept: instagram.com/username, @username, or username
      const igMatch = trimmed.match(/instagram\.com\/([^/?]+)/i);
      if (igMatch) return igMatch[1];
      return trimmed.replace(/^@/, '');
    case 'substack':
      // Accept: username.substack.com or https://username.substack.com
      const subMatch = trimmed.match(/([a-z0-9_-]+)\.substack\.com/i);
      return subMatch ? subMatch[1] : trimmed.replace(/^@/, '');
    default:
      return trimmed;
  }
}

/**
 * Fetch posts from LinkedIn via Apify
 */
async function fetchLinkedIn(username) {
  if (!apifyToken) throw new Error('APIFY_API_TOKEN is not configured');
  const client = new ApifyClient({ token: apifyToken });
  const run = await client.actor('apimaestro/linkedin-profile-posts').call({
    username,
    limit: 10,
    page_number: 1,
  });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  let posts = [];
  if (items?.length > 0) {
    const first = items[0];
    posts = first?.data?.posts || first?.posts || (Array.isArray(first) ? first : []);
    if (!Array.isArray(posts) && items.length > 1) {
      posts = items;
    }
  }
  return (Array.isArray(posts) ? posts : []).map((p) => ({
    text: p.text || '',
    id: p.urn || p.full_urn,
    url: p.url,
  }));
}

/**
 * Fetch tweets from Twitter/X via Apify
 */
async function fetchTwitter(username) {
  if (!apifyToken) throw new Error('APIFY_API_TOKEN is not configured');
  const client = new ApifyClient({ token: apifyToken });
  const run = await client.actor('scrapier/twitter-x-scraper').call({
    startUrls: [username.startsWith('@') ? username : `https://x.com/${username}`],
    maxTweets: 10,
    withReplies: false,
    includeUserInfo: false,
  });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items.map((item) => ({
    text: item.text || '',
    id: item.id,
    url: item.url,
  }));
}

/**
 * Fetch posts from Instagram via Apify
 */
async function fetchInstagram(username) {
  if (!apifyToken) throw new Error('APIFY_API_TOKEN is not configured');
  const url = username.includes('instagram.com') ? username : `https://www.instagram.com/${username}/`;
  const client = new ApifyClient({ token: apifyToken });
  const run = await client.actor('apify/instagram-scraper').call({
    directUrls: [url],
    resultsType: 'posts',
    resultsLimit: 10,
  });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items.map((item) => ({
    text: item.caption || '',
    id: item.shortCode || item.id,
    url: item.url || item.inputUrl,
  }));
}

/**
 * Fetch Substack posts via RSS (free, no Apify)
 */
async function fetchSubstack(username) {
  const feedUrl = `https://${username}.substack.com/feed`;
  const feed = await parser.parseURL(feedUrl);
  return (feed.items || []).slice(0, 10).map((item) => ({
    text: item.contentSnippet || item.content || item.title || '',
    id: item.guid || item.link,
    url: item.link,
  }));
}

/**
 * Fetch content from a platform based on connection
 */
export async function fetchContentFromPlatform(platform, handleOrUrl) {
  const normalized = normalizeHandle(platform, handleOrUrl);
  if (!normalized) return [];

  switch (platform) {
    case 'linkedin':
      return fetchLinkedIn(normalized);
    case 'twitter':
      return fetchTwitter(normalized);
    case 'instagram':
      return fetchInstagram(normalized);
    case 'substack':
      return fetchSubstack(normalized);
    default:
      return [];
  }
}
