/**
 * GEO (Geolocation) audit checker
 * Evaluates local business schema, hreflang, and geo meta tags
 */

import * as cheerio from 'cheerio';

const MAX_HTML_SIZE = 500 * 1024;

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
      // skip invalid JSON
    }
  });
  return schemas;
}

function getSchemaTypes(schema) {
  const types = [];
  const add = (s) => {
    const t = s['@type'];
    if (Array.isArray(t)) types.push(...t);
    else if (t) types.push(t);
  };
  add(schema);
  if (schema['@graph']) {
    for (const g of schema['@graph']) add(g);
  }
  return types;
}

function hasLocalBusiness(schemas) {
  for (const s of schemas) {
    const types = getSchemaTypes(s);
    for (const t of types) {
      if (typeof t === 'string' && (t === 'LocalBusiness' || t.includes('LocalBusiness'))) {
        return s;
      }
    }
  }
  return null;
}

function hasAddressOrPhone(schema) {
  const check = (s) => {
    if (!s) return false;
    if (s.address || s.telephone || s.contactPoint) return true;
    if (s['@graph']) {
      return s['@graph'].some(check);
    }
    return false;
  };
  return check(schema);
}

/**
 * @param {string} html - Raw HTML
 * @param {object} opts - { pageUrl?: string }
 * @returns {{ score: number, issues: Array }}
 */
export function runGeoCheck(html, opts = {}) {
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
  const localBiz = hasLocalBusiness(schemas);

  // No LocalBusiness schema
  if (!localBiz) {
    issues.push({
      category: 'geo',
      severity: 'medium',
      title: 'Local business schema missing',
      impact: 'Reduced local AI search visibility and local pack eligibility',
      fix: 'Add LocalBusiness schema with name, address, and phone',
      meta: addMeta({}),
    });
    deductions += 10;
  } else if (!hasAddressOrPhone(localBiz)) {
    issues.push({
      category: 'geo',
      severity: 'low',
      title: 'LocalBusiness schema missing address or phone',
      impact: 'Incomplete NAP (Name, Address, Phone) reduces local trust signals',
      fix: 'Add address and telephone to LocalBusiness schema',
      meta: addMeta({}),
    });
    deductions += 5;
  }

  // No hreflang for multi-region
  const hreflangs = $('link[rel="alternate"][hreflang]');
  const hasHreflang = hreflangs.length > 0;
  const langTags = $('html[lang], meta[http-equiv="content-language"]');
  const hasMultiLang = langTags.length > 1 || $('link[hreflang]').length > 1;

  const linkHreflangs = $('link[hreflang]').length;
  if (linkHreflangs === 0) {
    issues.push({
      category: 'geo',
      severity: 'low',
      title: 'No hreflang tags for multi-region content',
      impact: 'If you serve content in multiple regions, wrong content may be shown',
      fix: 'Implement hreflang tags if you have multi-region or multi-language content',
      meta: addMeta({}),
    });
    deductions += 3;
  }

  // Geo meta tags (geo.region, geo.placename, etc.)
  const geoMeta = $('meta[name="geo.region"], meta[name="geo.placename"], meta[name="ICBM"]');
  if (geoMeta.length === 0 && localBiz) {
    issues.push({
      category: 'geo',
      severity: 'low',
      title: 'No geo meta tags',
      impact: 'Optional geo meta can reinforce location signals',
      fix: 'Add geo.region, geo.placename meta tags for local pages',
      meta: addMeta({}),
    });
    deductions += 3;
  }

  const score = Math.max(0, 100 - deductions);

  return { score, issues };
}
