/**
 * Sentiment & GEO tracking service
 * Runs scans across prompts, platforms, and regions; aggregates results for dashboard
 */

import { queryPerplexityWithSentiment } from './perplexityVisibilityService.js';
import { queryGeminiWithSentiment } from './geminiVisibilityService.js';
import { sentimentGeoRepository } from '../repositories/sentimentGeoRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';

const THROTTLE_MS = 1500;
const SCAN_TIMEOUT_MS = 90000;

const GEO_COUNTRIES = ['US', 'GB', 'DE', 'IN', 'AU', 'BR'];
const COUNTRY_TO_REGION = {
  US: 'North America',
  GB: 'Europe',
  DE: 'Europe',
  IN: 'Asia Pacific',
  AU: 'Asia Pacific',
  BR: 'Latin America',
};
const COUNTRY_TO_NAME = {
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  IN: 'India',
  AU: 'Australia',
  BR: 'Brazil',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function generateDefaultPrompts(projectName, industry, domain) {
  const name = projectName || domain?.split('.')[0] || 'this company';
  const prompts = [
    `What is ${name}? Tell me about ${name}`,
    `Best ${industry || 'companies'} - ${name} review`,
    `What are the top ${industry || 'tools'}? Include ${name}`,
  ];
  if (industry) {
    prompts.push(`Best ${industry} solutions - ${name}`);
  }
  prompts.push(`${name} - pros and cons`);
  return [...new Set(prompts)].slice(0, 5);
}

/**
 * Ensure project has tracked prompts; create default if none
 */
async function ensurePrompts(projectId, project, brandProfile) {
  let prompts = await sentimentGeoRepository.findTrackedPromptsByProjectId(projectId);
  if (prompts.length === 0) {
    const domain = extractDomain(project.url);
    const defaultQueries = generateDefaultPrompts(project.name, brandProfile?.industry, domain);
    for (const q of defaultQueries) {
      await sentimentGeoRepository.createTrackedPrompt(projectId, q, 'auto');
    }
    prompts = await sentimentGeoRepository.findTrackedPromptsByProjectId(projectId);
  }
  return prompts;
}

/**
 * Run a full sentiment/geo scan for a project
 */
export async function runSentimentGeoScan(projectId, userId, options = {}) {
  const project = await projectRepository.findByUserIdAndId(userId, projectId);
  if (!project) throw new Error('Project not found');

  const domain = extractDomain(project.url);
  if (!domain) throw new Error('Project has no valid URL');

  const prompts = await ensurePrompts(projectId, project, project.brand_profile);
  if (prompts.length === 0) throw new Error('No prompts to scan');

  const platforms = [
    { id: 'perplexity', fn: queryPerplexityWithSentiment },
    { id: 'gemini', fn: queryGeminiWithSentiment },
  ];

  const startTime = Date.now();
  const results = [];

  for (const prompt of prompts) {
    for (const platform of platforms) {
      for (const country of GEO_COUNTRIES) {
        if (Date.now() - startTime > SCAN_TIMEOUT_MS) break;

        const res = await platform.fn(prompt.query, domain, country);
        await sleep(THROTTLE_MS);

        if (res) {
          await sentimentGeoRepository.createSentimentGeoResult({
            projectId,
            trackedPromptId: prompt.id,
            platform: platform.id,
            country,
            citationsCount: res.citationsFound ?? 0,
            sentimentScore: res.sentiment?.sentimentScore ?? 50,
            sentimentLabel: res.sentiment?.label ?? 'neutral',
            rawSnippet: res.rawSnippet?.slice(0, 2000) ?? null,
          });
          results.push(res);
        }
      }
    }
  }

  return { scanned: results.length, prompts: prompts.length };
}

/**
 * Get aggregated summary for the dashboard
 */
export async function getSentimentGeoSummary(projectId, userId, range = '30d') {
  const project = await projectRepository.findByUserIdAndId(userId, projectId);
  if (!project) throw new Error('Project not found');

  const now = new Date();
  let startDate = new Date(now);
  if (range === '7d') startDate.setDate(startDate.getDate() - 7);
  else if (range === '30d') startDate.setDate(startDate.getDate() - 30);
  else if (range === '90d') startDate.setDate(startDate.getDate() - 90);
  else startDate = new Date(0);

  const results = await sentimentGeoRepository.findResultsByProjectAndDateRange(
    projectId,
    startDate,
    now
  );

  if (results.length === 0) {
    const prompts = await sentimentGeoRepository.findTrackedPromptsByProjectId(projectId);
    return {
      kpis: {
        avgSentiment: 0,
        trackedPrompts: prompts.length,
        activeRegions: 0,
        negativeMentions: 0,
        avgSentimentChange: null,
        trackedPromptsChange: null,
        activeRegionsChange: null,
        negativeMentionsChange: null,
      },
      sentimentTrend: [],
      sentimentBreakdown: [
        { name: 'Positive', value: 0, color: '#ffffff' },
        { name: 'Neutral', value: 100, color: '#737373' },
        { name: 'Negative', value: 0, color: '#ef4444' },
      ],
      promptPerformance: [],
      regionalPerformance: [],
      topCountries: [],
      hasData: false,
    };
  }

  const byLabel = { positive: 0, neutral: 0, negative: 0 };
  const byDate = new Map();
  const byPrompt = new Map();
  const byRegion = new Map();
  const byCountry = new Map();

  for (const r of results) {
    byLabel[r.sentiment_label] = (byLabel[r.sentiment_label] ?? 0) + 1;
    const d = r.created_at?.toISOString?.()?.slice(0, 10) ?? 'unknown';
    if (!byDate.has(d)) byDate.set(d, { positive: 0, neutral: 0, negative: 0 });
    byDate.get(d)[r.sentiment_label]++;
    const pk = r.tracked_prompt_id;
    if (!byPrompt.has(pk))
      byPrompt.set(pk, {
        prompt: r.tracked_prompt?.query ?? 'Unknown',
        citations: 0,
        sentimentSum: 0,
        count: 0,
        regions: new Set(),
        platform: r.platform,
      });
    const pp = byPrompt.get(pk);
    pp.citations += r.citations_count ?? 0;
    pp.sentimentSum += r.sentiment_score ?? 50;
    pp.count++;
    pp.regions.add(r.country);
    const region = COUNTRY_TO_REGION[r.country] ?? r.country;
    if (!byRegion.has(region))
      byRegion.set(region, { citations: 0, sentimentSum: 0, count: 0 });
    const pr = byRegion.get(region);
    pr.citations += r.citations_count ?? 0;
    pr.sentimentSum += r.sentiment_score ?? 50;
    pr.count++;
    byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + (r.citations_count ?? 0));
  }

  const total = results.length;
  const pos = byLabel.positive ?? 0;
  const neu = byLabel.neutral ?? 0;
  const neg = byLabel.negative ?? 0;
  const avgSentiment = total > 0
    ? Math.round(
        results.reduce((s, r) => s + (r.sentiment_score ?? 50), 0) / total
      )
    : 0;
  const negativePct = total > 0 ? Math.round((neg / total) * 100) : 0;
  const regions = new Set(results.map((r) => COUNTRY_TO_REGION[r.country] ?? r.country));

  const sentimentBreakdown = [
    { name: 'Positive', value: total > 0 ? Math.round((pos / total) * 100) : 0, color: '#ffffff' },
    { name: 'Neutral', value: total > 0 ? Math.round((neu / total) * 100) : 0, color: '#737373' },
    { name: 'Negative', value: negativePct, color: '#ef4444' },
  ];

  const sentimentTrend = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => {
      const d = new Date(date);
      const month = d.toLocaleString('default', { month: 'short' });
      const total = (v.positive ?? 0) + (v.neutral ?? 0) + (v.negative ?? 0);
      const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
      return {
        date: month,
        positive: pct(v.positive ?? 0),
        neutral: pct(v.neutral ?? 0),
        negative: pct(v.negative ?? 0),
      };
    });

  const promptPerformance = [...byPrompt.entries()].map(([_, p]) => ({
    prompt: p.prompt,
    citations: p.citations,
    sentiment: p.count > 0 ? Math.round(p.sentimentSum / p.count) : 50,
    region: [...p.regions].slice(0, 2).join(', ') || 'Global',
    platform: p.platform,
    trend: '+0%',
    positive: true,
  }));

  const totalCitations = [...byRegion.values()].reduce((s, r) => s + r.citations, 0);
  const regionalPerformance = [...byRegion.entries()].map(([region, data]) => ({
    region,
    citations: data.citations,
    sentiment: data.count > 0 ? Math.round(data.sentimentSum / data.count) : 50,
    trend: '+0%',
    positive: true,
    flag: region === 'North America' ? '🇺🇸' : region === 'Europe' ? '🇪🇺' : region === 'Asia Pacific' ? '🌏' : region === 'Latin America' ? '🌎' : '🌍',
  }));

  const topCountries = [...byCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([code, citations]) => ({
      country: COUNTRY_TO_NAME[code] ?? code,
      citations,
      share: totalCitations > 0 ? Math.round((citations / totalCitations) * 100) : 0,
      flag: code === 'US' ? '🇺🇸' : code === 'GB' ? '🇬🇧' : code === 'DE' ? '🇩🇪' : code === 'IN' ? '🇮🇳' : code === 'AU' ? '🇦🇺' : '🇨🇦',
    }));

  const prompts = await sentimentGeoRepository.findTrackedPromptsByProjectId(projectId);

  return {
    kpis: {
      avgSentiment,
      trackedPrompts: prompts.length,
      activeRegions: regions.size,
      negativeMentions: negativePct,
      avgSentimentChange: null,
      trackedPromptsChange: null,
      activeRegionsChange: null,
      negativeMentionsChange: null,
    },
    sentimentTrend,
    sentimentBreakdown,
    promptPerformance,
    regionalPerformance,
    topCountries,
    hasData: true,
  };
}
