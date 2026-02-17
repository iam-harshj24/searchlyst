/**
 * Overview dashboard service
 * Aggregates audits, sentiment_geo, and projects for the overview page
 */

import { projectRepository } from '../repositories/projectRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import prisma from '../lib/prisma.js';

const TREND_DAYS = 7;

function formatTimeAgo(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

/**
 * Get overview data for a user
 */
export async function getOverview(userId, activeProjectId = null) {
  const projects = await projectRepository.findByUserId(userId);
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return {
      kpis: {
        aiVisibilityScore: 0,
        aiVisibilityChange: null,
        totalCitations: 0,
        citationsChange: null,
        projectsCount: 0,
        sentiment: 0,
        issuesCount: 0,
      },
      visibilityTrend: [],
      recentActivity: [],
      activeProject: null,
    };
  }

  const audits = await auditRepository.findByUserId(userId, 100);
  const completedAudits = audits.filter((a) => a.status === 'completed');

  const sentimentAgg = await prisma.sentimentGeoResult.aggregate({
    where: { project_id: { in: projectIds } },
    _sum: { citations_count: true },
    _avg: { sentiment_score: true },
    _count: true,
  });

  const latestAuditsByProject = new Map();
  for (const a of completedAudits) {
    if (!latestAuditsByProject.has(a.project_id)) {
      latestAuditsByProject.set(a.project_id, a);
    }
  }

  let aiVisibilityScore = 0;
  let totalCitations = 0;
  let issuesCount = 0;

  for (const [pid, audit] of latestAuditsByProject) {
    aiVisibilityScore += audit.ai_citation_score ?? 0;
    totalCitations += audit.ai_citations_found ?? 0;
    issuesCount += (audit.seo_issues_count ?? 0) + (audit.aeo_issues_count ?? 0) + (audit.geo_issues_count ?? 0);
  }

  const projectCount = latestAuditsByProject.size;
  if (projectCount > 0) {
    aiVisibilityScore = Math.round(aiVisibilityScore / projectCount);
  }

  totalCitations += sentimentAgg._sum?.citations_count ?? 0;
  const sentimentFromGeo = sentimentAgg._count > 0 ? Math.round(sentimentAgg._avg?.sentiment_score ?? 50) : 0;

  const visibilityTrend = buildVisibilityTrend(completedAudits, TREND_DAYS);

  const recentActivity = buildRecentActivity(completedAudits, audits.filter((a) => a.status === 'failed'), userId);

  const activeProject = activeProjectId
    ? await getActiveProjectSummary(activeProjectId, userId, latestAuditsByProject, sentimentAgg)
    : null;

  const prevScore = visibilityTrend.length >= 2 ? visibilityTrend[0]?.score : 0;
  const currScore = visibilityTrend.length >= 1 ? visibilityTrend[visibilityTrend.length - 1]?.score : aiVisibilityScore;
  const aiVisibilityChange = prevScore > 0 ? `+${Math.round(((currScore - prevScore) / prevScore) * 100)}%` : null;

  return {
    kpis: {
      aiVisibilityScore,
      aiVisibilityChange,
      totalCitations,
      citationsChange: null,
      projectsCount: projects.length,
      sentiment: sentimentFromGeo,
      issuesCount,
    },
    visibilityTrend,
    recentActivity,
    activeProject,
  };
}

function buildVisibilityTrend(completedAudits, days) {
  const now = new Date();
  const byDate = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, { date: key, score: 0, count: 0 });
  }

  for (const a of completedAudits) {
    const key = (a.completed_at || a.created_at)?.toISOString?.()?.slice(0, 10);
    if (key && byDate.has(key)) {
      const entry = byDate.get(key);
      entry.score += a.ai_citation_score ?? 0;
      entry.count += 1;
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, v]) => {
      const d = new Date(v.date);
      const score = v.count > 0 ? Math.round(v.score / v.count) : 0;
      return {
        day: dayNames[d.getDay()],
        score,
      };
    });
}

async function buildRecentActivity(completedAudits, failedAudits, userId) {
  const recent = [];

  for (const a of completedAudits.slice(0, 5)) {
    const score = a.ai_citation_score ?? 0;
    const projectName = a.project?.name ?? 'Project';
    const ts = new Date(a.completed_at || a.created_at).getTime();
    recent.push({
      type: 'audit_completed',
      text: `AEO audit for ${projectName} completed (${score}/100)`,
      time: formatTimeAgo(a.completed_at || a.created_at),
      ts,
      color: 'text-white',
    });
  }

  for (const a of failedAudits.slice(0, 2)) {
    const projectName = a.project?.name ?? 'Project';
    const ts = new Date(a.completed_at || a.created_at).getTime();
    recent.push({
      type: 'audit_failed',
      text: `Audit for ${projectName} failed`,
      time: formatTimeAgo(a.completed_at || a.created_at),
      ts,
      color: 'text-red-400',
    });
  }

  const sentimentResults = await prisma.sentimentGeoResult.findMany({
    where: { project: { user_id: userId } },
    orderBy: { created_at: 'desc' },
    take: 10,
    include: { project: { select: { name: true } } },
  });

  const seenProjects = new Set();
  for (const r of sentimentResults) {
    if (seenProjects.has(r.project_id)) continue;
    seenProjects.add(r.project_id);
    const ts = new Date(r.created_at).getTime();
    recent.push({
      type: 'sentiment_scan',
      text: `Sentiment scan for ${r.project?.name ?? 'Project'} completed`,
      time: formatTimeAgo(r.created_at),
      ts,
      color: 'text-red-400',
    });
  }

  recent.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
  return recent.slice(0, 6);
}

async function getActiveProjectSummary(activeProjectId, userId, latestAuditsByProject, sentimentAgg) {
  const project = await projectRepository.findByUserIdAndId(userId, activeProjectId);
  if (!project) return null;

  const latestAudit = latestAuditsByProject.get(activeProjectId);

  const sentimentForProject = await prisma.sentimentGeoResult.aggregate({
    where: { project_id: activeProjectId },
    _avg: { sentiment_score: true },
    _sum: { citations_count: true },
    _count: true,
  });

  const visibility = latestAudit?.ai_citation_score ?? project.visibility_score ?? 0;
  const fromAuditAndSentiment = (latestAudit?.ai_citations_found ?? 0) + (sentimentForProject._sum?.citations_count ?? 0);
  const citations = fromAuditAndSentiment || (project.total_citations ?? 0);
  const sentiment = sentimentForProject._count > 0 ? Math.round(sentimentForProject._avg?.sentiment_score ?? 50) : project.sentiment ?? 0;
  const issues = latestAudit
    ? (latestAudit.seo_issues_count ?? 0) + (latestAudit.aeo_issues_count ?? 0) + (latestAudit.geo_issues_count ?? 0)
    : project.issues_count ?? 0;

  return {
    id: project.id,
    name: project.name,
    visibility_score: visibility,
    total_citations: citations,
    sentiment,
    issues_count: issues,
  };
}
