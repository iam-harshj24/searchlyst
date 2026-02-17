import prisma from '../lib/prisma.js';

export const auditRepository = {
  async create(projectId, url, auditMode = 'single') {
    return prisma.audit.create({
      data: {
        project_id: projectId,
        url,
        audit_mode: auditMode,
        status: 'running',
        started_at: new Date(),
      },
    });
  },

  async findById(auditId) {
    return prisma.audit.findUnique({
      where: { id: auditId },
      include: { issues: true },
    });
  },

  async findByProjectId(projectId, limit = 20) {
    return prisma.audit.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: { issues: true },
    });
  },

  async findByUserId(userId, limit = 50) {
    return prisma.audit.findMany({
      where: { project: { user_id: userId } },
      orderBy: [{ completed_at: 'desc' }, { created_at: 'desc' }],
      take: limit,
      include: { project: { select: { id: true, name: true } } },
    });
  },

  async updateCompleted(auditId, data) {
    return prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'completed',
        completed_at: new Date(),
        pages_crawled: data.pagesCrawled ?? 1,
        seo_score: data.seoScore ?? null,
        aeo_score: data.aeoScore ?? null,
        geo_score: data.geoScore ?? null,
        ai_citation_score: data.aiCitationScore ?? null,
        ai_citations_found: data.aiCitationsFound ?? null,
        ai_citation_raw: data.aiCitationRaw ?? null,
        seo_issues_count: data.seoIssuesCount ?? 0,
        aeo_issues_count: data.aeoIssuesCount ?? 0,
        geo_issues_count: data.geoIssuesCount ?? 0,
      },
    });
  },

  async updateFailed(auditId) {
    return prisma.audit.update({
      where: { id: auditId },
      data: { status: 'failed', completed_at: new Date() },
    });
  },

  async createIssues(auditId, issues) {
    if (!issues?.length) return [];

    const data = issues.map((i) => ({
      audit_id: auditId,
      category: i.category,
      severity: i.severity,
      title: i.title,
      impact: i.impact,
      fix: i.fix,
      meta: i.meta ?? undefined,
    }));

    await prisma.auditIssue.createMany({ data });
    return prisma.auditIssue.findMany({
      where: { audit_id: auditId },
    });
  },
};
