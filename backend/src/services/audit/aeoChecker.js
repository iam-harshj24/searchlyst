/**
 * AEO (AI Engine Optimization) audit checker
 * Evaluates structured data and content structure for AI visibility
 */

import * as cheerio from 'cheerio';

const MAX_HTML_SIZE = 500 * 1024;

/**
 * Extract all JSON-LD schemas from the page
 */
function extractJsonLdSchemas($) {
  const schemas = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).html();
      if (!text?.trim()) return;
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        schemas.push(...parsed);
      } else {
        schemas.push(parsed);
      }
    } catch {
      // Invalid JSON, skip
    }
  });
  return schemas;
}

/**
 * Get schema type (handle @graph)
 */
function getSchemaType(schema) {
  if (schema['@graph']) {
    return schema['@graph'].map((s) => s['@type']).filter(Boolean).flat();
  }
  const type = schema['@type'];
  return Array.isArray(type) ? type : type ? [type] : [];
}

/**
 * Check if any schema has the given type (or subtype)
 */
function hasSchemaType(schemas, targetType) {
  for (const s of schemas) {
    const types = getSchemaType(s);
    for (const t of types) {
      if (typeof t === 'string' && (t === targetType || t.endsWith(targetType))) {
        return true;
      }
    }
    if (s['@graph']) {
      for (const g of s['@graph']) {
        const gt = g['@type'];
        const gTypes = Array.isArray(gt) ? gt : gt ? [gt] : [];
        for (const t of gTypes) {
          if (typeof t === 'string' && (t === targetType || t.endsWith(targetType))) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * Count words in text
 */
function wordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Check if content has question-like headings (H2/H3 ending with ?)
 */
function hasQuestionFormat($) {
  const headings = $('h2, h3').toArray();
  for (const h of headings) {
    const text = $(h).text().trim();
    if (text.endsWith('?')) return true;
  }
  return false;
}

/**
 * @param {string} html - Raw HTML
 * @param {object} opts - { pageUrl?: string }
 * @returns {{ score: number, issues: Array }}
 */
export function runAeoCheck(html, opts = {}) {
  const { pageUrl } = opts;
  const addMeta = (m) => {
    const merged = pageUrl ? { page: pageUrl, ...(m || {}) } : (m || {});
    return Object.keys(merged).length ? merged : undefined;
  };

  const issues = [];
  let deductions = 0;

  const truncated = html.length > MAX_HTML_SIZE ? html.slice(0, MAX_HTML_SIZE) : html;
  const $ = cheerio.load(truncated);

  const schemas = extractJsonLdSchemas($);

  // No FAQ schema - critical for AI
  if (!hasSchemaType(schemas, 'FAQPage')) {
    issues.push({
      category: 'aeo',
      severity: 'critical',
      title: 'No FAQ schema markup found',
      impact: 'AI search engines cannot extract Q&A content for citations',
      fix: 'Add FAQPage structured data to key pages with common questions',
      meta: addMeta({}),
    });
    deductions += 15;
  }

  // No Organization schema
  if (!hasSchemaType(schemas, 'Organization')) {
    issues.push({
      category: 'aeo',
      severity: 'high',
      title: 'No Organization schema found',
      impact: 'AI models may misidentify your brand or entity',
      fix: 'Add Organization schema with name, url, and logo',
      meta: addMeta({}),
    });
    deductions += 10;
  }

  // Content not in Q&A format
  if (!hasQuestionFormat($)) {
    issues.push({
      category: 'aeo',
      severity: 'high',
      title: 'Content not optimized for conversational queries',
      impact: 'AI assistants skip content that lacks clear question-answer structure',
      fix: 'Restructure content with question-style headings (H2/H3 ending with ?)',
      meta: addMeta({}),
    });
    deductions += 8;
  }

  // Article/Product schema - check if page looks like article or product
  const hasArticle = hasSchemaType(schemas, 'Article');
  const hasProduct = hasSchemaType(schemas, 'Product');
  const bodyText = $('body').text();
  const words = wordCount(bodyText);

  if (words > 500 && !hasArticle && !hasProduct) {
    issues.push({
      category: 'aeo',
      severity: 'medium',
      title: 'Long-form content without Article schema',
      impact: 'AI systems may not properly categorize your content',
      fix: 'Add Article or BlogPosting schema to content pages',
      meta: addMeta({}),
    });
    deductions += 5;
  }

  // Page length for key pages
  if (words < 300) {
    issues.push({
      category: 'aeo',
      severity: 'medium',
      title: 'Page content is very short',
      impact: 'Thin content is less likely to be cited by AI systems',
      fix: 'Add substantive, authoritative content (800+ words for key pages)',
      meta: addMeta({ wordCount: words }),
    });
    deductions += 5;
  }

  // Direct answer in first 100 words
  const firstBlock = $('p').first().text();
  const firstWords = wordCount(firstBlock);
  if (firstWords < 20 && words > 100) {
    issues.push({
      category: 'aeo',
      severity: 'low',
      title: 'No clear direct answer in opening',
      impact: 'AI systems prefer content that answers the query early',
      fix: 'Add a concise direct answer in the first 1-2 sentences',
      meta: addMeta({}),
    });
    deductions += 3;
  }

  const score = Math.max(0, 100 - deductions);

  return { score, issues };
}
