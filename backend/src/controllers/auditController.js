import { runAudit } from '../services/auditService.js';
import { generatePdf, generateCsv } from '../services/auditExportService.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';

export const startAudit = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const { url, mode, includeAiCheck } = req.body || {};

    const audit = await runAudit(userId, projectId, { url, mode, includeAiCheck });

    res.status(201).json({
      success: true,
      audit: formatAuditResponse(audit),
    });
  } catch (error) {
    console.error('Start audit error:', error);
    const status = error.message === 'Project not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to run audit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const listAudits = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);

    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const audits = await auditRepository.findByProjectId(projectId);
    res.json({
      success: true,
      audits: audits.map(formatAuditResponse),
    });
  } catch (error) {
    console.error('List audits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list audits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getAudit = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const auditId = parseInt(req.params.auditId, 10);

    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const audit = await auditRepository.findById(auditId);
    if (!audit || audit.project_id !== projectId) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    res.json({
      success: true,
      audit: formatAuditResponse(audit),
    });
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const compareAudits = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const auditId1 = parseInt(req.query.auditId1, 10);
    const auditId2 = parseInt(req.query.auditId2, 10);

    if (!auditId1 || !auditId2 || auditId1 === auditId2) {
      return res.status(400).json({
        success: false,
        message: 'Provide two different audit IDs (auditId1, auditId2)',
      });
    }

    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const [audit1, audit2] = await Promise.all([
      auditRepository.findById(auditId1),
      auditRepository.findById(auditId2),
    ]);

    if (!audit1 || audit1.project_id !== projectId) {
      return res.status(404).json({ success: false, message: 'Audit 1 not found' });
    }
    if (!audit2 || audit2.project_id !== projectId) {
      return res.status(404).json({ success: false, message: 'Audit 2 not found' });
    }

    const older = audit1.created_at < audit2.created_at ? audit1 : audit2;
    const newer = audit1.created_at < audit2.created_at ? audit2 : audit1;

    const issueKey = (i) => `${i.category}|${i.title}`;
    const oldKeys = new Set((older.issues || []).map(issueKey));
    const newKeys = new Set((newer.issues || []).map(issueKey));

    const resolved = (older.issues || []).filter((i) => !newKeys.has(issueKey(i)));
    const added = (newer.issues || []).filter((i) => !oldKeys.has(issueKey(i)));
    const unchanged = (newer.issues || []).filter((i) => oldKeys.has(issueKey(i)));

    const scoreDelta = (a, b) => (a != null && b != null ? (b - a) : null);

    res.json({
      success: true,
      comparison: {
        older: formatAuditResponse(older),
        newer: formatAuditResponse(newer),
        scores: {
          seo: { from: older.seo_score, to: newer.seo_score, delta: scoreDelta(older.seo_score, newer.seo_score) },
          aeo: { from: older.aeo_score, to: newer.aeo_score, delta: scoreDelta(older.aeo_score, newer.aeo_score) },
          geo: { from: older.geo_score, to: newer.geo_score, delta: scoreDelta(older.geo_score, newer.geo_score) },
          ai: { from: older.ai_citation_score, to: newer.ai_citation_score, delta: scoreDelta(older.ai_citation_score, newer.ai_citation_score) },
        },
        issues: {
          resolved,
          added,
          unchanged: unchanged.length,
        },
      },
    });
  } catch (error) {
    console.error('Compare audits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare audits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const exportAudit = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const auditId = parseInt(req.params.auditId, 10);
    const format = (req.query.format || 'pdf').toLowerCase();

    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const audit = await auditRepository.findById(auditId);
    if (!audit || audit.project_id !== projectId) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    const date = new Date().toISOString().slice(0, 10);
    const filename = `audit-${projectId}-${date}`;

    if (format === 'csv') {
      const csv = generateCsv(audit, project);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    }

    const pdf = await generatePdf(audit, project);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    console.error('Export audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

function formatAuditResponse(audit) {
  return {
    id: audit.id,
    project_id: audit.project_id,
    url: audit.url,
    status: audit.status,
    audit_mode: audit.audit_mode,
    pages_crawled: audit.pages_crawled,
    seo_score: audit.seo_score,
    aeo_score: audit.aeo_score,
    geo_score: audit.geo_score,
    ai_citation_score: audit.ai_citation_score,
    ai_citations_found: audit.ai_citations_found,
    seo_issues_count: audit.seo_issues_count,
    aeo_issues_count: audit.aeo_issues_count,
    geo_issues_count: audit.geo_issues_count,
    started_at: audit.started_at,
    completed_at: audit.completed_at,
    created_at: audit.created_at,
    issues: (audit.issues || []).map((i) => ({
      id: i.id,
      category: i.category,
      severity: i.severity,
      title: i.title,
      impact: i.impact,
      fix: i.fix,
      meta: i.meta,
    })),
  };
}
