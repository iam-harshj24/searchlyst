import { fetchPage } from './infaticaScraperService.js';
import { crawlSite } from './firecrawlService.js';
import { checkAiVisibility } from './perplexityVisibilityService.js';
import { runSeoCheck } from './audit/seoChecker.js';
import { runAeoCheck } from './audit/aeoChecker.js';
import { runGeoCheck } from './audit/geoChecker.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';

const KEY_PATHS = ['/', '/about', '/about-us', '/contact', '/blog', '/pricing', '/features'];

function getPageWeight(pageUrl) {
  try {
    const path = new URL(pageUrl).pathname.replace(/\/$/, '') || '/';
    if (path === '/' || path === '') return 2;
    if (KEY_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return 1.5;
    return 1;
  } catch {
    return 1;
  }
}

function dedupeIssues(issuesWithPage) {
  const byKey = new Map();
  for (const i of issuesWithPage) {
    const key = `${i.category}|${i.severity}|${i.title}`;
    const existing = byKey.get(key);
    if (existing) {
      const pages = new Set(existing.meta?.pages || (existing.meta?.page ? [existing.meta.page] : []));
      const p = i.meta?.page;
      if (p) pages.add(p);
      existing.meta = { ...existing.meta, pages: [...pages], count: pages.size };
    } else {
      const meta = i.meta?.page ? { ...i.meta, pages: [i.meta.page], count: 1 } : i.meta;
      byKey.set(key, { ...i, meta });
    }
  }
  return [...byKey.values()];
}

function aggregateScores(pageResults) {
  let seoTotal = 0;
  let aeoTotal = 0;
  let geoTotal = 0;
  let weightSum = 0;
  for (const { seo, aeo, geo, weight } of pageResults) {
    seoTotal += (seo?.score ?? 0) * weight;
    aeoTotal += (aeo?.score ?? 0) * weight;
    geoTotal += (geo?.score ?? 0) * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return { seoScore: 0, aeoScore: 0, geoScore: 0 };
  return {
    seoScore: Math.round(seoTotal / weightSum),
    aeoScore: Math.round(aeoTotal / weightSum),
    geoScore: Math.round(geoTotal / weightSum),
  };
}

/**
 * Run a full SEO/AEO/GEO audit for a project
 * @param {number} userId - Must own the project
 * @param {number} projectId
 * @param {object} options - { url?: string, mode?: 'single'|'full', includeAiCheck?: boolean }
 */
export async function runAudit(userId, projectId, options = {}) {
  const { url, mode = 'single', includeAiCheck = true } = options;

  const project = await projectRepository.findByUserIdAndId(userId, projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const auditUrl = (url || project.url)?.trim();
  if (!auditUrl) {
    throw new Error('Project has no URL; provide a URL to audit');
  }

  const auditMode = mode === 'full' ? 'full' : 'single';
  const audit = await auditRepository.create(projectId, auditUrl, auditMode);

  try {
    let pages = [];
    let effectiveMode = auditMode;

    if (auditMode === 'full') {
      try {
        pages = await crawlSite(auditUrl, { limit: 15, maxDepth: 2 });
      } catch (err) {
        console.warn('Firecrawl full crawl failed, falling back to single page:', err.message);
        effectiveMode = 'single';
      }
    }

    if (effectiveMode === 'single' || pages.length === 0) {
      const html = await fetchPage(auditUrl, { returnHtml: true });
      pages = [{ url: auditUrl, html }];
    }

    const pageResults = [];
    const allIssuesRaw = [];

    for (const page of pages) {
      const html = page.html || page.rawHtml || '';
      if (!html) continue;

      const weight = getPageWeight(page.url);
      const pageUrl = page.url;

      const [seo, aeo, geo] = await Promise.all([
        Promise.resolve(runSeoCheck(html, { pageUrl })),
        Promise.resolve(runAeoCheck(html, { pageUrl })),
        Promise.resolve(runGeoCheck(html, { pageUrl })),
      ]);

      pageResults.push({ seo, aeo, geo, weight });
      allIssuesRaw.push(...seo.issues, ...aeo.issues, ...geo.issues);
    }

    const scores = effectiveMode === 'full' && pageResults.length > 1
      ? aggregateScores(pageResults)
      : pageResults[0]
        ? {
            seoScore: pageResults[0].seo.score,
            aeoScore: pageResults[0].aeo.score,
            geoScore: pageResults[0].geo.score,
          }
        : { seoScore: 0, aeoScore: 0, geoScore: 0 };

    const allIssues = effectiveMode === 'full' && allIssuesRaw.length > 0
      ? dedupeIssues(allIssuesRaw)
      : allIssuesRaw;

    let aiResult = null;
    if (includeAiCheck) {
      const brandProfile = project.brand_profile;
      const industry = brandProfile?.industry ?? null;
      aiResult = await checkAiVisibility(project.name, auditUrl, industry);
    }

    const issuesCount = allIssues.filter((i) => i.category === 'seo').length
      + allIssues.filter((i) => i.category === 'aeo').length
      + allIssues.filter((i) => i.category === 'geo').length;

    await auditRepository.createIssues(audit.id, allIssues);
    await auditRepository.updateCompleted(audit.id, {
      ...scores,
      pagesCrawled: pages.length,
      aiCitationScore: aiResult?.score ?? null,
      aiCitationsFound: aiResult?.citationsFound ?? null,
      aiCitationRaw: aiResult?.raw ?? null,
      seoIssuesCount: allIssues.filter((i) => i.category === 'seo').length,
      aeoIssuesCount: allIssues.filter((i) => i.category === 'aeo').length,
      geoIssuesCount: allIssues.filter((i) => i.category === 'geo').length,
    });

    await projectRepository.update(projectId, userId, {
      visibility_score: aiResult?.score ?? 0,
      total_citations: aiResult?.citationsFound ?? 0,
      issues_count: issuesCount,
    });

    return auditRepository.findById(audit.id);
  } catch (err) {
    await auditRepository.updateFailed(audit.id);
    throw err;
  }
}
