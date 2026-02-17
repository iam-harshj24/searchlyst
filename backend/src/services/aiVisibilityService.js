/**
 * AI Visibility service
 * Aggregates audits, sentiment_geo, and audit_issues for the AI Visibility dashboard
 */

import { projectRepository } from '../repositories/projectRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { sentimentGeoRepository } from '../repositories/sentimentGeoRepository.js';
import prisma from '../lib/prisma.js';

const TREND_WEEKS = 8;

const PLATFORMS = [
  { id: 'perplexity', name: 'Perplexity', hasData: true },
  { id: 'gemini', name: 'Gemini', hasData: true },
  { id: 'chatgpt', name: 'ChatGPT', hasData: false },
  { id: 'claude', name: 'Claude', hasData: false },
  { id: 'copilot', name: 'Copilot', hasData: false },
];

/**
 * Get AI visibility summary for a project
 */
export async function getAiVisibilitySummary(projectId, userId, range = '30d') {
  const project = await projectRepository.findByUserIdAndId(userId, projectId);
  if (!project) throw new Error('Project not found');

  const now = new Date();
  let startDate = new Date(now);
  if (range === '7d') startDate.setDate(startDate.getDate() - 7);
  else if (range === '30d') startDate.setDate(startDate.getDate() - 30);
  else if (range === '90d') startDate.setDate(startDate.getDate() - 90);
  else startDate = new Date(0);

  const [audits, sentimentResults] = await Promise.all([
    auditRepository.findByProjectId(projectId, 20),
    sentimentGeoRepository.findResultsByProjectAndDateRange(projectId, startDate, now),
  ]);

  const latestAudit = audits.find((a) => a.status === 'completed');
  let aeoIssues = [];
  if (latestAudit?.id) {
    aeoIssues = await prisma.auditIssue.findMany({
      where: { audit_id: latestAudit.id, category: 'aeo' },
      take: 10,
    });
  }

  const platformScores = buildPlatformScores(sentimentResults, latestAudit);
  const citationTrend = buildCitationTrend(sentimentResults, audits, startDate, now);
  const sentimentBreakdown = buildSentimentBreakdown(sentimentResults);
  const citationsByPrompt = buildCitationsByPrompt(sentimentResults);
  const issues = buildIssues(aeoIssues);

  return {
    platformScores,
    citationTrend,
    sentimentBreakdown,
    citationsByPrompt,
    issues,
    hasData: sentimentResults.length > 0 || (latestAudit && latestAudit.ai_citation_score != null),
  };
}

function buildPlatformScores(sentimentResults, latestAudit) {
  const byPlatform = new Map();

  for (const p of PLATFORMS) {
    if (p.hasData) {
      const platformResults = sentimentResults.filter((r) => r.platform === p.id);
      let score = 0;
      let trend = null;

      if (platformResults.length > 0) {
        const totalWeight = platformResults.reduce((s, r) => s + (r.citations_count ?? 0) + 1, 0);
        const weightedSum = platformResults.reduce(
          (s, r) => s + (r.sentiment_score ?? 50) * ((r.citations_count ?? 0) + 1),
          0
        );
        score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
      } else if (p.id === 'perplexity' && latestAudit?.ai_citation_score != null) {
        score = latestAudit.ai_citation_score;
      }

      byPlatform.set(p.id, {
        name: p.name,
        score,
        trend,
        positive: score >= 50,
        comingSoon: false,
      });
    } else {
      byPlatform.set(p.id, {
        name: p.name,
        score: null,
        trend: null,
        positive: true,
        comingSoon: true,
      });
    }
  }

  if (sentimentResults.length >= 2) {
    const byPlatformAndWeek = new Map();
    for (const r of sentimentResults) {
      const d = new Date(r.created_at);
      const weekStart = getWeekStart(d);
      const key = `${r.platform}|${weekStart}`;
      if (!byPlatformAndWeek.has(key)) byPlatformAndWeek.set(key, []);
      byPlatformAndWeek.get(key).push(r);
    }
    for (const p of ['perplexity', 'gemini']) {
      const entry = byPlatform.get(p);
      if (entry && entry.score !== null) {
        const weeks = [...new Set(sentimentResults.filter((r) => r.platform === p).map((r) => getWeekStart(new Date(r.created_at))))].sort();
        if (weeks.length >= 2) {
          const firstWeek = weeks[0];
          const lastWeek = weeks[weeks.length - 1];
          const firstAvg = avgScore(sentimentResults.filter((r) => r.platform === p && getWeekStart(new Date(r.created_at)) === firstWeek));
          const lastAvg = avgScore(sentimentResults.filter((r) => r.platform === p && getWeekStart(new Date(r.created_at)) === lastWeek));
          if (firstAvg > 0) {
            const pct = Math.round(((lastAvg - firstAvg) / firstAvg) * 100);
            entry.trend = pct >= 0 ? `+${pct}%` : `${pct}%`;
            entry.positive = pct >= 0;
          }
        }
      }
    }
  }

  return [...byPlatform.values()];
}

function getWeekStart(d) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  return copy.toISOString().slice(0, 10);
}

function avgScore(results) {
  if (!results.length) return 0;
  return results.reduce((s, r) => s + (r.sentiment_score ?? 50), 0) / results.length;
}

function buildCitationTrend(sentimentResults, audits, startDate, endDate) {
  const byWeek = new Map();
  const now = new Date(endDate);

  for (let i = TREND_WEEKS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = getWeekStart(d);
    const weekLabel = `W${TREND_WEEKS - i}`;
    byWeek.set(weekStart, { week: weekLabel, citations: 0 });
  }

  for (const r of sentimentResults) {
    const weekStart = getWeekStart(new Date(r.created_at));
    if (byWeek.has(weekStart)) {
      byWeek.get(weekStart).citations += r.citations_count ?? 0;
    }
  }

  for (const a of audits) {
    if (a.status === 'completed' && a.completed_at) {
      const weekStart = getWeekStart(new Date(a.completed_at));
      if (byWeek.has(weekStart)) {
        byWeek.get(weekStart).citations += a.ai_citations_found ?? 0;
      }
    }
  }

  return [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v);
}

function buildSentimentBreakdown(sentimentResults) {
  const byLabel = { positive: 0, neutral: 0, negative: 0 };
  for (const r of sentimentResults) {
    byLabel[r.sentiment_label] = (byLabel[r.sentiment_label] ?? 0) + 1;
  }
  const total = sentimentResults.length;
  if (total === 0) {
    return [
      { name: 'Positive', value: 0, color: '#ffffff' },
      { name: 'Neutral', value: 100, color: '#737373' },
      { name: 'Negative', value: 0, color: '#ef4444' },
    ];
  }
  return [
    { name: 'Positive', value: Math.round((byLabel.positive / total) * 100), color: '#ffffff' },
    { name: 'Neutral', value: Math.round((byLabel.neutral / total) * 100), color: '#737373' },
    { name: 'Negative', value: Math.round((byLabel.negative / total) * 100), color: '#ef4444' },
  ];
}

function buildCitationsByPrompt(sentimentResults) {
  const byPrompt = new Map();
  for (const r of sentimentResults) {
    const query = r.tracked_prompt?.query ?? 'Unknown';
    if (!byPrompt.has(query)) byPrompt.set(query, 0);
    byPrompt.set(query, byPrompt.get(query) + (r.citations_count ?? 0));
  }
  return [...byPrompt.entries()]
    .map(([query, citations]) => ({ query, you: citations }))
    .sort((a, b) => b.you - a.you)
    .slice(0, 10);
}

function buildIssues(aeoIssues) {
  const seen = new Set();
  return aeoIssues
    .filter((i) => {
      const key = `${i.title}|${i.severity}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((i) => ({
      platform: 'Content',
      issue: i.title,
      severity: i.severity,
      impact: i.impact,
      fix: i.fix,
    }))
    .slice(0, 6);
}
