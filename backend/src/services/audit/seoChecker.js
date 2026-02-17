/**
 * SEO audit checker - analyzes HTML for SEO health
 */

import * as cheerio from 'cheerio';

const MAX_HTML_SIZE = 500 * 1024; // 500KB

/**
 * @param {string} html - Raw HTML of the page
 * @param {object} opts - { pageUrl?: string }
 * @returns {{ score: number, issues: Array<{ category: string, severity: string, title: string, impact: string, fix: string, meta?: object }> }}
 */
export function runSeoCheck(html, opts = {}) {
  const { pageUrl } = opts;
  const addMeta = (m) => {
    const merged = pageUrl ? { page: pageUrl, ...(m || {}) } : (m || {});
    return Object.keys(merged).length ? merged : undefined;
  };

  const issues = [];
  let deductions = 0;

  const truncated = html.length > MAX_HTML_SIZE ? html.slice(0, MAX_HTML_SIZE) : html;
  const $ = cheerio.load(truncated);

  // Missing meta description
  const metaDesc = $('meta[name="description"]').attr('content');
  if (!metaDesc || !metaDesc.trim()) {
    issues.push({
      category: 'seo',
      severity: 'high',
      title: 'Missing meta description',
      impact: 'Reduced click-through rate and AI summarization accuracy',
      fix: 'Add a unique meta description (120-160 characters) to the page',
      meta: addMeta({}),
    });
    deductions += 5;
  } else if (metaDesc.length < 50) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: 'Meta description too short',
      impact: 'May not effectively summarize the page for search results',
      fix: 'Extend meta description to 120-160 characters',
      meta: addMeta({}),
    });
    deductions += 3;
  }

  // Missing or duplicate title
  const titles = $('title');
  if (titles.length === 0) {
    issues.push({
      category: 'seo',
      severity: 'high',
      title: 'Missing title tag',
      impact: 'Search engines cannot properly identify your page',
      fix: 'Add a unique, descriptive title tag to the page',
      meta: addMeta({}),
    });
    deductions += 8;
  } else {
    const titleText = $(titles[0]).text().trim();
    if (!titleText) {
      issues.push({
        category: 'seo',
        severity: 'high',
        title: 'Empty title tag',
        impact: 'Search engines cannot properly identify your page',
        fix: 'Add meaningful text to the title tag',
        meta: addMeta({}),
      });
      deductions += 8;
    } else if (titleText.length < 50 || titleText.length > 70) {
      issues.push({
        category: 'seo',
        severity: 'medium',
        title: `Title length is ${titleText.length} characters (optimal: 50-70)`,
        impact: 'Titles outside optimal range may be truncated in search results',
        fix: 'Adjust title to 50-70 characters for best display',
        meta: addMeta({ length: titleText.length }),
      });
      deductions += 3;
    }
  }

  // Missing H1
  const h1s = $('h1');
  if (h1s.length === 0) {
    issues.push({
      category: 'seo',
      severity: 'high',
      title: 'Missing H1 heading',
      impact: 'Search engines use H1 to understand page topic',
      fix: 'Add exactly one H1 heading that describes the main topic',
      meta: addMeta({}),
    });
    deductions += 5;
  } else if (h1s.length > 1) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: 'Multiple H1 headings found',
      impact: 'Multiple H1s can dilute topical focus',
      fix: 'Use a single H1 for the main topic; use H2/H3 for subsections',
      meta: addMeta({ count: h1s.length }),
    });
    deductions += 3;
  }

  // Missing alt on images
  const imgsWithoutAlt = $('img:not([alt])');
  const imgCount = imgsWithoutAlt.length;
  if (imgCount > 0) {
    issues.push({
      category: 'seo',
      severity: 'low',
      title: `${imgCount} image(s) missing alt text`,
      impact: 'Impaired accessibility and image search visibility',
      fix: 'Add descriptive alt attributes to all images',
      meta: addMeta({ count: imgCount }),
    });
    deductions += Math.min(imgCount * 1, 10); // cap at 10
  }

  // No canonical URL
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical || !canonical.trim()) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: 'No canonical URL specified',
      impact: 'Risk of duplicate content issues if page is accessible via multiple URLs',
      fix: 'Add a canonical link tag pointing to the preferred URL',
      meta: addMeta({}),
    });
    deductions += 3;
  }

  // Internal links - check for obviously broken (empty href, javascript:, etc.)
  const internalLinks = $('a[href^="/"], a[href^="http"]');
  const badLinks = [];
  internalLinks.each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href === '#' || href.startsWith('javascript:')) {
      badLinks.push(href || '(empty)');
    }
  });
  if (badLinks.length > 0) {
    issues.push({
      category: 'seo',
      severity: 'low',
      title: `${badLinks.length} link(s) with invalid or placeholder href`,
      impact: 'Poor user experience and potential crawl issues',
      fix: 'Replace placeholder or invalid links with proper URLs',
      meta: addMeta({ count: badLinks.length }),
    });
    deductions += Math.min(badLinks.length * 2, 6);
  }

  const score = Math.max(0, 100 - deductions);

  return { score, issues };
}
