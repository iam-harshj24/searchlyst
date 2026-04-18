import * as cheerio from 'cheerio';
import { fetchRobotsTxt, fetchSitemapXml } from './firecrawlService.js';

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function extractDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

function getPlainText(markdown) {
    if (!markdown) return '';
    return markdown
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
        .replace(/[#*_~`>|]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function avgSentenceLength(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length === 0) return 0;
    const totalWords = sentences.reduce((sum, s) => sum + countWords(s), 0);
    return totalWords / sentences.length;
}

function textSimilarity(a, b) {
    if (!a || !b) return 0;
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size > 0 ? intersection.size / union.size : 0;
}

// ═══════════════════════════════════════════════════════════════
// PAGE DATA EXTRACTION
// ═══════════════════════════════════════════════════════════════

function extractPageData(page) {
    const html = page.rawHtml || page.html || '';
    const $ = cheerio.load(html);
    const url = page.metadata?.sourceURL || page.metadata?.url || page.sourceURL || '';
    const markdown = page.markdown || '';
    const plainText = getPlainText(markdown);

    const title = $('title').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
    const canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';
    const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || '';

    const h1Tags = [];
    $('h1').each((_, el) => h1Tags.push($(el).text().trim()));

    const headings = [];
    $('h1,h2,h3,h4,h5,h6').each((_, el) => {
        headings.push({ level: parseInt(el.tagName[1]), text: $(el).text().trim() });
    });

    const images = [];
    $('img').each((_, el) => {
        images.push({
            src: $(el).attr('src') || '',
            alt: $(el).attr('alt') || '',
            width: $(el).attr('width') || '',
            height: $(el).attr('height') || '',
        });
    });

    const domain = extractDomain(url);
    const internalLinks = [];
    const externalLinks = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
        try {
            const linkDomain = extractDomain(new URL(href, url).href);
            if (linkDomain === domain || href.startsWith('/')) {
                internalLinks.push(href);
            } else if (href.startsWith('http')) {
                externalLinks.push(href);
            }
        } catch { /* invalid URL */ }
    });

    const jsonLdScripts = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try { jsonLdScripts.push(JSON.parse($(el).html())); } catch { /* invalid JSON-LD */ }
    });

    const schemaTypes = jsonLdScripts.flatMap(s => {
        if (Array.isArray(s)) return s.map(i => i['@type']).filter(Boolean);
        return s['@type'] ? [s['@type']] : [];
    });

    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogType = $('meta[property="og:type"]').attr('content') || '';
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
    const twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';

    const hreflangTags = [];
    $('link[rel="alternate"][hreflang]').each((_, el) => {
        hreflangTags.push({ lang: $(el).attr('hreflang'), href: $(el).attr('href') });
    });

    const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').length > 0;
    const hasViewport = $('meta[name="viewport"]').length > 0;

    const httpResources = [];
    $('[src],[href]').each((_, el) => {
        const val = $(el).attr('src') || $(el).attr('href') || '';
        if (val.startsWith('http://') && !val.includes('localhost')) httpResources.push(val);
    });

    const tables = $('table').length;
    const lists = $('ul,ol').length;
    const wordCount = countWords(plainText);
    const paragraphs = [];
    $('p').each((_, el) => { const t = $(el).text().trim(); if (t) paragraphs.push(t); });

    const hasSpeakable = jsonLdScripts.some(s => s.speakable || (s['@type'] === 'WebPage' && s.speakable));
    const hasFAQSchema = schemaTypes.some(t => t === 'FAQPage' || t === 'Question');
    const hasHowToSchema = schemaTypes.some(t => t === 'HowTo');
    const hasOrgSchema = schemaTypes.some(t => ['Organization', 'Corporation', 'LocalBusiness'].includes(t));
    const hasPersonSchema = schemaTypes.some(t => t === 'Person');
    const hasBreadcrumb = schemaTypes.some(t => t === 'BreadcrumbList');
    const hasArticleSchema = schemaTypes.some(t => ['Article', 'BlogPosting', 'NewsArticle'].includes(t));
    const hasProductSchema = schemaTypes.some(t => t === 'Product');
    const hasReviewSchema = schemaTypes.some(t => ['Review', 'AggregateRating'].includes(t));

    return {
        url, html, markdown, plainText, title, metaDescription, canonical, robotsMeta,
        h1Tags, headings, images, internalLinks, externalLinks,
        jsonLdScripts, schemaTypes, ogTitle, ogDescription, ogImage, ogType,
        twitterCard, twitterTitle, hreflangTags, hasFavicon, hasViewport,
        httpResources, tables, lists, wordCount, paragraphs,
        hasSpeakable, hasFAQSchema, hasHowToSchema, hasOrgSchema, hasPersonSchema,
        hasBreadcrumb, hasArticleSchema, hasProductSchema, hasReviewSchema,
        domain,
    };
}

// ═══════════════════════════════════════════════════════════════
// SEO CHECKS
// ═══════════════════════════════════════════════════════════════

function checkTitleTags(pages) {
    const issues = [];
    const missingPages = pages.filter(p => !p.title);
    if (missingPages.length > 0) {
        issues.push({
            id: 'missing-title', category: 'seo', severity: 'critical',
            title: 'Missing page title tags',
            description: `${missingPages.length} page(s) have no <title> tag. Search engines use titles as the primary ranking signal.`,
            impact: 'Severely hurts search rankings and click-through rate',
            fix: 'Add a unique, descriptive <title> tag (50-60 characters) to every page',
            affectedPages: missingPages.map(p => p.url),
        });
    }

    const titles = pages.filter(p => p.title).map(p => ({ url: p.url, title: p.title }));
    const dupes = new Map();
    titles.forEach(({ url, title }) => {
        const key = title.toLowerCase();
        if (!dupes.has(key)) dupes.set(key, []);
        dupes.get(key).push(url);
    });
    const dupGroups = [...dupes.values()].filter(g => g.length > 1);
    if (dupGroups.length > 0) {
        issues.push({
            id: 'duplicate-titles', category: 'seo', severity: 'high',
            title: 'Duplicate page titles found',
            description: `${dupGroups.length} group(s) of pages share identical titles. Each page needs a unique title.`,
            impact: 'Search engines cannot differentiate between pages, cannibalizing rankings',
            fix: 'Write unique, descriptive titles for each page',
            affectedPages: dupGroups.flat(),
        });
    }

    const longTitles = pages.filter(p => p.title && p.title.length > 60);
    if (longTitles.length > 0) {
        issues.push({
            id: 'title-too-long', category: 'seo', severity: 'medium',
            title: 'Page titles too long',
            description: `${longTitles.length} page(s) have titles exceeding 60 characters, which get truncated in search results.`,
            impact: 'Titles get cut off in SERPs, reducing click-through rate',
            fix: 'Shorten titles to 50-60 characters while keeping them descriptive',
            affectedPages: longTitles.map(p => p.url),
        });
    }

    const shortTitles = pages.filter(p => p.title && p.title.length < 30 && p.title.length > 0);
    if (shortTitles.length > 0) {
        issues.push({
            id: 'title-too-short', category: 'seo', severity: 'low',
            title: 'Page titles too short',
            description: `${shortTitles.length} page(s) have very short titles (under 30 characters), missing keyword opportunities.`,
            impact: 'Underutilizing title tag for ranking potential',
            fix: 'Expand titles to include relevant keywords while staying under 60 characters',
            affectedPages: shortTitles.map(p => p.url),
        });
    }

    return issues;
}

function checkMetaDescriptions(pages) {
    const issues = [];
    const missing = pages.filter(p => !p.metaDescription);
    if (missing.length > 0) {
        issues.push({
            id: 'missing-meta-description', category: 'seo', severity: 'high',
            title: 'Missing meta descriptions',
            description: `${missing.length} page(s) lack a meta description. This is the snippet shown in search results.`,
            impact: 'Reduced click-through rate and AI summarization accuracy',
            fix: 'Add unique meta descriptions (120-160 characters) to all pages',
            affectedPages: missing.map(p => p.url),
        });
    }

    const descs = pages.filter(p => p.metaDescription).map(p => ({ url: p.url, desc: p.metaDescription }));
    const dupes = new Map();
    descs.forEach(({ url, desc }) => {
        const key = desc.toLowerCase().substring(0, 100);
        if (!dupes.has(key)) dupes.set(key, []);
        dupes.get(key).push(url);
    });
    const dupGroups = [...dupes.values()].filter(g => g.length > 1);
    if (dupGroups.length > 0) {
        issues.push({
            id: 'duplicate-meta-descriptions', category: 'seo', severity: 'medium',
            title: 'Duplicate meta descriptions',
            description: `${dupGroups.length} group(s) of pages share identical meta descriptions.`,
            impact: 'Missed opportunity to differentiate pages in search results',
            fix: 'Write unique meta descriptions for each page',
            affectedPages: dupGroups.flat(),
        });
    }

    const longDescs = pages.filter(p => p.metaDescription && p.metaDescription.length > 160);
    if (longDescs.length > 0) {
        issues.push({
            id: 'meta-description-too-long', category: 'seo', severity: 'low',
            title: 'Meta descriptions too long',
            description: `${longDescs.length} page(s) have meta descriptions over 160 characters.`,
            impact: 'Descriptions get truncated in search results',
            fix: 'Trim meta descriptions to 120-160 characters',
            affectedPages: longDescs.map(p => p.url),
        });
    }

    return issues;
}

function checkCanonicals(pages) {
    const issues = [];
    const missing = pages.filter(p => !p.canonical);
    if (missing.length > 0) {
        issues.push({
            id: 'missing-canonical', category: 'seo', severity: 'medium',
            title: 'Missing canonical tags',
            description: `${missing.length} page(s) lack a canonical URL tag, risking duplicate content issues.`,
            impact: 'Search engines may index duplicate versions of pages',
            fix: 'Add <link rel="canonical"> pointing to the preferred URL on every page',
            affectedPages: missing.map(p => p.url),
        });
    }

    const wrongCanonical = pages.filter(p => {
        if (!p.canonical || !p.url) return false;
        try {
            const canonicalDomain = extractDomain(new URL(p.canonical, p.url).href);
            return canonicalDomain !== p.domain && p.canonical !== p.url;
        } catch { return false; }
    });
    if (wrongCanonical.length > 0) {
        issues.push({
            id: 'incorrect-canonical', category: 'seo', severity: 'high',
            title: 'Canonical tag points to different domain',
            description: `${wrongCanonical.length} page(s) have canonical URLs pointing to a different domain.`,
            impact: 'Search engines may de-index these pages in favor of the canonical target',
            fix: 'Ensure canonical tags point to the correct URL on your own domain',
            affectedPages: wrongCanonical.map(p => p.url),
        });
    }

    return issues;
}

function checkHeadings(pages) {
    const issues = [];
    const noH1 = pages.filter(p => p.h1Tags.length === 0);
    if (noH1.length > 0) {
        issues.push({
            id: 'missing-h1', category: 'seo', severity: 'high',
            title: 'Pages missing H1 heading',
            description: `${noH1.length} page(s) have no H1 tag. The H1 is the main heading that signals page topic.`,
            impact: 'Search engines and AI struggle to determine the primary topic',
            fix: 'Add exactly one descriptive H1 heading to each page',
            affectedPages: noH1.map(p => p.url),
        });
    }

    const multiH1 = pages.filter(p => p.h1Tags.length > 1);
    if (multiH1.length > 0) {
        issues.push({
            id: 'multiple-h1', category: 'seo', severity: 'medium',
            title: 'Multiple H1 tags on pages',
            description: `${multiH1.length} page(s) have more than one H1 tag, diluting the primary heading signal.`,
            impact: 'Confuses search engines about the main page topic',
            fix: 'Use exactly one H1 per page; demote additional headings to H2 or lower',
            affectedPages: multiH1.map(p => p.url),
        });
    }

    const badHierarchy = pages.filter(p => {
        if (p.headings.length < 2) return false;
        for (let i = 1; i < p.headings.length; i++) {
            if (p.headings[i].level - p.headings[i - 1].level > 1) return true;
        }
        if (p.headings.length > 0 && p.headings[0].level !== 1) return true;
        return false;
    });
    if (badHierarchy.length > 0) {
        issues.push({
            id: 'heading-hierarchy', category: 'seo', severity: 'medium',
            title: 'Heading hierarchy issues',
            description: `${badHierarchy.length} page(s) skip heading levels (e.g., H1 → H3) or don't start with H1.`,
            impact: 'Impairs accessibility and content structure for crawlers',
            fix: 'Use headings in sequential order: H1 → H2 → H3 without skipping levels',
            affectedPages: badHierarchy.map(p => p.url),
        });
    }

    return issues;
}

function checkImages(pages) {
    const issues = [];
    const pagesWithMissingAlt = pages.filter(p => p.images.some(img => !img.alt));
    const totalMissingAlt = pages.reduce((sum, p) => sum + p.images.filter(img => !img.alt).length, 0);
    if (totalMissingAlt > 0) {
        issues.push({
            id: 'missing-alt-text', category: 'seo', severity: 'high',
            title: 'Images missing alt text',
            description: `${totalMissingAlt} image(s) across ${pagesWithMissingAlt.length} page(s) lack alt text.`,
            impact: 'Hurts accessibility, image search rankings, and AI content understanding',
            fix: 'Add descriptive alt text to all images',
            affectedPages: pagesWithMissingAlt.map(p => p.url),
        });
    }

    return issues;
}

function checkOpenGraph(pages) {
    const issues = [];
    const noOG = pages.filter(p => !p.ogTitle && !p.ogDescription && !p.ogImage);
    if (noOG.length > 0) {
        issues.push({
            id: 'missing-og-tags', category: 'seo', severity: 'medium',
            title: 'Missing Open Graph meta tags',
            description: `${noOG.length} page(s) lack Open Graph tags for social media sharing.`,
            impact: 'Poor appearance when shared on Facebook, LinkedIn, etc.',
            fix: 'Add og:title, og:description, and og:image meta tags',
            affectedPages: noOG.map(p => p.url),
        });
    }

    const noTwitter = pages.filter(p => !p.twitterCard);
    if (noTwitter.length > 0) {
        issues.push({
            id: 'missing-twitter-card', category: 'seo', severity: 'low',
            title: 'Missing Twitter Card meta tags',
            description: `${noTwitter.length} page(s) lack Twitter Card markup.`,
            impact: 'Poor appearance when shared on X/Twitter',
            fix: 'Add twitter:card, twitter:title, twitter:description meta tags',
            affectedPages: noTwitter.map(p => p.url),
        });
    }

    return issues;
}

function checkStructuredData(pages) {
    const issues = [];
    const noSchema = pages.filter(p => p.jsonLdScripts.length === 0);
    if (noSchema.length > 0) {
        issues.push({
            id: 'missing-structured-data', category: 'seo', severity: 'high',
            title: 'Missing structured data (Schema.org)',
            description: `${noSchema.length} page(s) have no JSON-LD structured data markup.`,
            impact: 'Missing rich snippets in search results and reduced AI understanding',
            fix: 'Add relevant Schema.org markup (Article, Organization, Product, FAQ, etc.)',
            affectedPages: noSchema.map(p => p.url),
        });
    }

    const noBreadcrumb = pages.filter(p => !p.hasBreadcrumb && p.url !== pages[0]?.url);
    if (noBreadcrumb.length > Math.ceil(pages.length * 0.5)) {
        issues.push({
            id: 'missing-breadcrumb-schema', category: 'seo', severity: 'low',
            title: 'Missing breadcrumb structured data',
            description: 'Most pages lack BreadcrumbList schema markup.',
            impact: 'No breadcrumb trail in search results',
            fix: 'Add BreadcrumbList schema to inner pages',
            affectedPages: noBreadcrumb.map(p => p.url).slice(0, 10),
        });
    }

    return issues;
}

function checkRobotsMeta(pages) {
    const issues = [];
    const noindexed = pages.filter(p => p.robotsMeta.includes('noindex'));
    if (noindexed.length > 0) {
        issues.push({
            id: 'noindex-pages', category: 'seo', severity: 'high',
            title: 'Pages set to noindex',
            description: `${noindexed.length} page(s) are marked as noindex and won't appear in search results.`,
            impact: 'These pages are invisible to search engines',
            fix: 'Remove noindex directive from pages that should be indexed',
            affectedPages: noindexed.map(p => p.url),
        });
    }
    return issues;
}

function checkHreflang(pages) {
    const issues = [];
    const hasMultiLang = pages.some(p => p.hreflangTags.length > 0);
    if (!hasMultiLang) {
        const hasForeignContent = pages.some(p => {
            const $ = cheerio.load(p.html || '');
            const lang = $('html').attr('lang');
            return lang && !lang.startsWith('en');
        });
        if (hasForeignContent) {
            issues.push({
                id: 'missing-hreflang', category: 'seo', severity: 'medium',
                title: 'Missing hreflang tags for multilingual content',
                description: 'Site appears to have non-English content but lacks hreflang tags.',
                impact: 'Wrong language version may appear in regional search results',
                fix: 'Add hreflang tags to specify language/region targeting',
                affectedPages: pages.map(p => p.url).slice(0, 5),
            });
        }
    }
    return issues;
}

function checkFavicon(pages) {
    const issues = [];
    const noFavicon = pages.filter(p => !p.hasFavicon);
    if (noFavicon.length > Math.ceil(pages.length * 0.5)) {
        issues.push({
            id: 'missing-favicon', category: 'seo', severity: 'low',
            title: 'Missing favicon',
            description: 'Most pages lack a favicon link tag.',
            impact: 'No icon in browser tabs and bookmarks, looks unprofessional',
            fix: 'Add a favicon.ico and link to it in the <head>',
            affectedPages: noFavicon.map(p => p.url).slice(0, 5),
        });
    }
    return issues;
}

function checkHttpsSecurity(pages) {
    const issues = [];
    const httpPages = pages.filter(p => p.url.startsWith('http://'));
    if (httpPages.length > 0) {
        issues.push({
            id: 'non-https-pages', category: 'seo', severity: 'critical',
            title: 'Non-HTTPS pages detected',
            description: `${httpPages.length} page(s) are served over insecure HTTP.`,
            impact: 'Browser warnings, ranking penalties, and security risks',
            fix: 'Migrate all pages to HTTPS and set up proper redirects',
            affectedPages: httpPages.map(p => p.url),
        });
    }

    const mixedContent = pages.filter(p => p.httpResources.length > 0);
    if (mixedContent.length > 0) {
        issues.push({
            id: 'mixed-content', category: 'seo', severity: 'medium',
            title: 'Mixed content (HTTP resources on HTTPS pages)',
            description: `${mixedContent.length} page(s) load resources over insecure HTTP.`,
            impact: 'Browser security warnings, blocked resources',
            fix: 'Update all resource URLs to use HTTPS',
            affectedPages: mixedContent.map(p => p.url),
        });
    }

    return issues;
}

function checkUrlStructure(pages) {
    const issues = [];
    const longUrls = pages.filter(p => p.url.length > 100);
    if (longUrls.length > 0) {
        issues.push({
            id: 'long-urls', category: 'seo', severity: 'low',
            title: 'URLs too long',
            description: `${longUrls.length} page(s) have URLs over 100 characters.`,
            impact: 'Long URLs are harder to share and may be truncated',
            fix: 'Use shorter, descriptive URL slugs',
            affectedPages: longUrls.map(p => p.url),
        });
    }

    const specialChars = pages.filter(p => /[?&=%]/.test(new URL(p.url).pathname));
    if (specialChars.length > 0) {
        issues.push({
            id: 'url-special-characters', category: 'seo', severity: 'low',
            title: 'URLs contain special characters or parameters',
            description: `${specialChars.length} page(s) have dynamic parameters or special characters in the URL path.`,
            impact: 'Can cause crawling and indexing issues',
            fix: 'Use clean, static URL slugs without query parameters',
            affectedPages: specialChars.map(p => p.url),
        });
    }

    return issues;
}

function checkInternalLinking(pages) {
    const issues = [];
    const lowInternal = pages.filter(p => p.internalLinks.length < 3);
    if (lowInternal.length > 0) {
        issues.push({
            id: 'low-internal-links', category: 'seo', severity: 'medium',
            title: 'Low internal linking density',
            description: `${lowInternal.length} page(s) have fewer than 3 internal links.`,
            impact: 'Poor link equity distribution and crawlability',
            fix: 'Add contextual internal links to related pages',
            affectedPages: lowInternal.map(p => p.url),
        });
    }

    const highOutbound = pages.filter(p => p.externalLinks.length > 50);
    if (highOutbound.length > 0) {
        issues.push({
            id: 'high-outbound-links', category: 'seo', severity: 'low',
            title: 'Very high outbound link count',
            description: `${highOutbound.length} page(s) have more than 50 external links.`,
            impact: 'May dilute page authority and look spammy',
            fix: 'Reduce outbound links or use nofollow where appropriate',
            affectedPages: highOutbound.map(p => p.url),
        });
    }

    const allLinked = new Set();
    pages.forEach(p => {
        p.internalLinks.forEach(l => {
            try { allLinked.add(new URL(l, p.url).pathname); } catch {}
        });
    });
    const orphans = pages.filter(p => {
        try { return !allLinked.has(new URL(p.url).pathname) && p.url !== pages[0]?.url; } catch { return false; }
    });
    if (orphans.length > 0) {
        issues.push({
            id: 'orphan-pages', category: 'seo', severity: 'medium',
            title: 'Orphan pages detected',
            description: `${orphans.length} page(s) have no internal links pointing to them from other crawled pages.`,
            impact: 'Search engines may not discover or properly value these pages',
            fix: 'Add internal links from relevant pages to orphan pages',
            affectedPages: orphans.map(p => p.url),
        });
    }

    return issues;
}

function checkThinContent(pages) {
    const issues = [];
    const thin = pages.filter(p => p.wordCount < 300 && p.wordCount > 0);
    if (thin.length > 0) {
        issues.push({
            id: 'thin-content', category: 'seo', severity: 'high',
            title: 'Thin content pages',
            description: `${thin.length} page(s) have fewer than 300 words, considered thin by search engines.`,
            impact: 'Thin pages rarely rank and may trigger quality penalties',
            fix: 'Expand content with valuable, relevant information (aim for 500+ words)',
            affectedPages: thin.map(p => p.url),
        });
    }
    return issues;
}

function checkDuplicateContent(pages) {
    const issues = [];
    const pairs = [];
    for (let i = 0; i < pages.length; i++) {
        for (let j = i + 1; j < pages.length; j++) {
            if (pages[i].wordCount > 100 && pages[j].wordCount > 100) {
                const sim = textSimilarity(pages[i].plainText, pages[j].plainText);
                if (sim > 0.7) pairs.push([pages[i].url, pages[j].url, sim]);
            }
        }
    }
    if (pairs.length > 0) {
        issues.push({
            id: 'duplicate-content', category: 'seo', severity: 'high',
            title: 'Duplicate or near-duplicate content detected',
            description: `${pairs.length} pair(s) of pages have highly similar content (>70% overlap).`,
            impact: 'Search engines may filter out duplicate pages from results',
            fix: 'Consolidate duplicate content, use canonical tags, or differentiate pages',
            affectedPages: [...new Set(pairs.flat().filter(p => typeof p === 'string'))],
        });
    }
    return issues;
}

function checkMobileUsability(pages) {
    const issues = [];
    const noViewport = pages.filter(p => !p.hasViewport);
    if (noViewport.length > 0) {
        issues.push({
            id: 'missing-viewport', category: 'seo', severity: 'high',
            title: 'Missing viewport meta tag',
            description: `${noViewport.length} page(s) lack a viewport meta tag for mobile responsiveness.`,
            impact: 'Pages may not render properly on mobile devices',
            fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
            affectedPages: noViewport.map(p => p.url),
        });
    }
    return issues;
}

function checkSitemap(pages, sitemapXml) {
    const issues = [];
    if (!sitemapXml) {
        issues.push({
            id: 'missing-sitemap', category: 'seo', severity: 'high',
            title: 'XML sitemap not found',
            description: 'No sitemap.xml found at the root of the website.',
            impact: 'Search engines may miss important pages during crawling',
            fix: 'Create and submit an XML sitemap to search engines',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    } else {
        const sitemapUrls = new Set();
        const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || [];
        urlMatches.forEach(m => {
            const url = m.replace(/<\/?loc>/g, '').trim();
            sitemapUrls.add(url);
        });

        const missingFromSitemap = pages.filter(p => {
            return !sitemapUrls.has(p.url) && !p.robotsMeta.includes('noindex');
        });
        if (missingFromSitemap.length > 0 && sitemapUrls.size > 0) {
            issues.push({
                id: 'pages-missing-from-sitemap', category: 'seo', severity: 'medium',
                title: 'Pages missing from XML sitemap',
                description: `${missingFromSitemap.length} indexable page(s) are not listed in the sitemap.`,
                impact: 'These pages may be crawled less frequently',
                fix: 'Add all important, indexable pages to the XML sitemap',
                affectedPages: missingFromSitemap.map(p => p.url),
            });
        }
    }
    return issues;
}

// ═══════════════════════════════════════════════════════════════
// GEO CHECKS (Generative Engine Optimization)
// ═══════════════════════════════════════════════════════════════

function checkEntityDefinition(pages) {
    const issues = [];
    const homepage = pages[0];
    if (homepage && !homepage.hasOrgSchema && !homepage.hasPersonSchema) {
        issues.push({
            id: 'no-entity-definition', category: 'geo', severity: 'critical',
            title: 'No entity definition on homepage',
            description: 'Homepage lacks Organization or Person structured data that defines who you are.',
            impact: 'AI engines cannot properly identify and cite your brand',
            fix: 'Add Organization/Person schema with name, description, logo, URL, and sameAs links',
            affectedPages: [homepage.url],
        });
    }
    return issues;
}

function checkAboutPage(pages) {
    const issues = [];
    const hasAbout = pages.some(p => /\/about/i.test(p.url));
    if (!hasAbout) {
        issues.push({
            id: 'missing-about-page', category: 'geo', severity: 'high',
            title: 'No About page found',
            description: 'No /about page detected. AI engines use About pages to understand organizations.',
            impact: 'AI models may misidentify your organization or skip it in citations',
            fix: 'Create a comprehensive About page with org details, team, history, and credentials',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    } else {
        const aboutPage = pages.find(p => /\/about/i.test(p.url));
        if (aboutPage && aboutPage.wordCount < 200) {
            issues.push({
                id: 'thin-about-page', category: 'geo', severity: 'medium',
                title: 'About page is too thin',
                description: 'The About page has very little content, missing key organizational details.',
                impact: 'Insufficient information for AI models to build your entity profile',
                fix: 'Expand the About page with mission, team, expertise, location, and contact info',
                affectedPages: [aboutPage.url],
            });
        }
    }
    return issues;
}

function checkAuthorSignals(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 300);
    const noAuthor = contentPages.filter(p => {
        const hasAuthorMarkup = p.hasArticleSchema || p.hasPersonSchema;
        const hasAuthorText = /author|written by|posted by/i.test(p.plainText);
        return !hasAuthorMarkup && !hasAuthorText;
    });
    if (noAuthor.length > 0 && contentPages.length > 0) {
        issues.push({
            id: 'no-author-bios', category: 'geo', severity: 'high',
            title: 'No author attribution on content pages',
            description: `${noAuthor.length} content page(s) lack author bios or bylines.`,
            impact: 'AI engines value expertise signals; missing authors reduce E-E-A-T',
            fix: 'Add author names, bios, and credentials to all articles and blog posts',
            affectedPages: noAuthor.map(p => p.url),
        });
    }
    return issues;
}

function checkEEAT(pages) {
    const issues = [];
    let eeatScore = 0;
    const hasAbout = pages.some(p => /\/about/i.test(p.url));
    const hasContact = pages.some(p => /\/contact/i.test(p.url));
    const hasPrivacy = pages.some(p => /\/privacy/i.test(p.url));
    const hasTerms = pages.some(p => /\/terms/i.test(p.url));
    const hasTestimonials = pages.some(p => /testimonial|review|case.study/i.test(p.url) || p.hasReviewSchema);
    const hasOrgSchema = pages.some(p => p.hasOrgSchema);

    if (hasAbout) eeatScore++;
    if (hasContact) eeatScore++;
    if (hasPrivacy) eeatScore++;
    if (hasTerms) eeatScore++;
    if (hasTestimonials) eeatScore++;
    if (hasOrgSchema) eeatScore++;

    if (eeatScore < 3) {
        const missing = [];
        if (!hasAbout) missing.push('About page');
        if (!hasContact) missing.push('Contact page');
        if (!hasPrivacy) missing.push('Privacy Policy');
        if (!hasTerms) missing.push('Terms of Service');
        if (!hasTestimonials) missing.push('Testimonials/Reviews');
        if (!hasOrgSchema) missing.push('Organization schema');

        issues.push({
            id: 'low-eeat-signals', category: 'geo', severity: 'critical',
            title: 'Insufficient E-E-A-T trust signals',
            description: `Only ${eeatScore}/6 trust signals found. Missing: ${missing.join(', ')}.`,
            impact: 'AI engines deprioritize sites lacking trust and authority signals',
            fix: 'Add the missing trust pages and structured data to establish credibility',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    }

    return issues;
}

function checkBrandSchema(pages) {
    const issues = [];
    const anyOrgSchema = pages.some(p => p.hasOrgSchema);
    if (!anyOrgSchema) {
        issues.push({
            id: 'missing-brand-schema', category: 'geo', severity: 'high',
            title: 'Missing Organization/Brand schema',
            description: 'No Organization, Corporation, or LocalBusiness schema found on any page.',
            impact: 'AI engines cannot build your Knowledge Panel or cite your brand properly',
            fix: 'Add Organization schema with name, URL, logo, description, sameAs, and contactPoint',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    }

    const hasSameAs = pages.some(p => p.jsonLdScripts.some(s => s.sameAs && s.sameAs.length > 0));
    if (!hasSameAs && anyOrgSchema) {
        issues.push({
            id: 'missing-sameas-links', category: 'geo', severity: 'medium',
            title: 'No sameAs links in Organization schema',
            description: 'Organization schema exists but lacks sameAs links to social profiles and Wikipedia.',
            impact: 'Missed opportunity to connect your entity to external knowledge bases',
            fix: 'Add sameAs array with links to social media profiles, Wikipedia, Wikidata',
            affectedPages: pages.filter(p => p.hasOrgSchema).map(p => p.url),
        });
    }

    return issues;
}

function checkTopicalAuthority(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 200);
    if (contentPages.length < 5) {
        issues.push({
            id: 'low-topical-depth', category: 'geo', severity: 'medium',
            title: 'Limited topical depth',
            description: `Only ${contentPages.length} substantial content pages found. AI engines prefer sites with deep topic coverage.`,
            impact: 'Insufficient content depth reduces perceived topical authority',
            fix: 'Create more in-depth content around your core topics (aim for 10+ quality pages)',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    }
    return issues;
}

function checkSocialProof(pages) {
    const issues = [];
    const hasReviews = pages.some(p => p.hasReviewSchema);
    const hasTestimonialContent = pages.some(p =>
        /testimonial|review|case.study|success.story/i.test(p.url) ||
        /testimonial|customer.review|client.said/i.test(p.plainText)
    );

    if (!hasReviews && !hasTestimonialContent) {
        issues.push({
            id: 'missing-social-proof', category: 'geo', severity: 'medium',
            title: 'No social proof signals found',
            description: 'No reviews, testimonials, or case studies detected on the site.',
            impact: 'AI engines factor social proof into trust and authority scoring',
            fix: 'Add customer testimonials, reviews with Review schema, or case studies',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    }

    return issues;
}

function checkCitableContent(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 200);
    const withStats = contentPages.filter(p =>
        /\d+%|\$\d|\d+ (percent|million|billion|thousand)|according to|study|research|survey|data shows/i.test(p.plainText)
    );
    if (withStats.length === 0 && contentPages.length > 0) {
        issues.push({
            id: 'no-citable-data', category: 'geo', severity: 'medium',
            title: 'No data, statistics, or research found in content',
            description: 'Content pages lack specific data points, statistics, or research citations.',
            impact: 'AI engines prefer citable facts and data-driven content',
            fix: 'Include specific numbers, statistics, research citations, and original data',
            affectedPages: contentPages.map(p => p.url).slice(0, 5),
        });
    }

    return issues;
}

function checkFAQContent(pages) {
    const issues = [];
    const hasFAQPage = pages.some(p => /faq|frequently.asked/i.test(p.url));
    const hasFAQSection = pages.some(p =>
        /frequently asked|common questions|FAQ/i.test(p.plainText)
    );

    if (!hasFAQPage && !hasFAQSection) {
        issues.push({
            id: 'no-faq-content', category: 'geo', severity: 'medium',
            title: 'No FAQ or definition-style content',
            description: 'No FAQ page or FAQ sections found. AI engines easily extract Q&A content.',
            impact: 'Missing a key content format that AI engines can directly cite',
            fix: 'Create an FAQ page or add FAQ sections to relevant pages',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    }

    return issues;
}

function checkJSRendering(pages) {
    const issues = [];
    const heavyJS = pages.filter(p => {
        const $ = cheerio.load(p.html || '');
        const scripts = $('script[src]').length;
        const hasReactRoot = $('#root, #__next, #app').length > 0;
        const bodyText = $('body').text().trim();
        return (scripts > 15 || hasReactRoot) && bodyText.length < 200;
    });

    if (heavyJS.length > 0) {
        issues.push({
            id: 'heavy-js-rendering', category: 'geo', severity: 'high',
            title: 'Content hidden behind JavaScript rendering',
            description: `${heavyJS.length} page(s) appear to rely heavily on client-side JS rendering.`,
            impact: 'AI crawlers may not execute JavaScript, missing your content entirely',
            fix: 'Implement server-side rendering (SSR) or pre-rendering for important content',
            affectedPages: heavyJS.map(p => p.url),
        });
    }

    return issues;
}

// ═══════════════════════════════════════════════════════════════
// AEO CHECKS (Answer Engine Optimization)
// ═══════════════════════════════════════════════════════════════

function checkFAQSchema(pages) {
    const issues = [];
    const hasFAQ = pages.some(p => p.hasFAQSchema);
    if (!hasFAQ) {
        issues.push({
            id: 'no-faq-schema', category: 'aeo', severity: 'critical',
            title: 'No FAQ schema markup found',
            description: 'No pages have FAQPage or Question structured data markup.',
            impact: 'AI search engines cannot extract Q&A content for direct answers',
            fix: 'Add FAQ schema markup to pages with question-answer content',
            affectedPages: pages.map(p => p.url).slice(0, 5),
        });
    }
    return issues;
}

function checkHowToSchema(pages) {
    const issues = [];
    const hasHowToContent = pages.some(p =>
        /how to|step.by.step|guide|tutorial/i.test(p.title) ||
        /how to|step.by.step/i.test(p.plainText.substring(0, 500))
    );
    const hasHowToMarkup = pages.some(p => p.hasHowToSchema);

    if (hasHowToContent && !hasHowToMarkup) {
        issues.push({
            id: 'missing-howto-schema', category: 'aeo', severity: 'high',
            title: 'How-to content lacks HowTo schema',
            description: 'Pages contain how-to/tutorial content but lack HowTo structured data.',
            impact: 'Missing rich results for instructional queries in search and AI answers',
            fix: 'Add HowTo schema to tutorial and guide pages',
            affectedPages: pages.filter(p => /how to|step.by.step|guide|tutorial/i.test(p.title)).map(p => p.url),
        });
    }

    return issues;
}

function checkSpeakableSchema(pages) {
    const issues = [];
    const hasSpeakable = pages.some(p => p.hasSpeakable);
    if (!hasSpeakable) {
        issues.push({
            id: 'missing-speakable-schema', category: 'aeo', severity: 'medium',
            title: 'No Speakable schema markup',
            description: 'No pages have Speakable schema, which helps voice assistants read your content.',
            impact: 'Content is not optimized for voice search results',
            fix: 'Add Speakable schema to key content sections on important pages',
            affectedPages: pages.map(p => p.url).slice(0, 3),
        });
    }
    return issues;
}

function checkQuestionOptimization(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 200);

    const noQuestionHeadings = contentPages.filter(p => {
        const questionHeadings = p.headings.filter(h =>
            /^(who|what|when|where|why|how|can|does|is|are|should|will|which)\b/i.test(h.text) || h.text.endsWith('?')
        );
        return questionHeadings.length === 0;
    });

    if (noQuestionHeadings.length > Math.ceil(contentPages.length * 0.7) && contentPages.length > 0) {
        issues.push({
            id: 'no-question-headings', category: 'aeo', severity: 'high',
            title: 'Questions not used as headings',
            description: 'Most content pages don\'t use question-format headings (who, what, how, why).',
            impact: 'AI engines match questions to answers — missing this format reduces visibility',
            fix: 'Restructure headings as questions users actually ask',
            affectedPages: noQuestionHeadings.map(p => p.url).slice(0, 5),
        });
    }

    return issues;
}

function checkDirectAnswers(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 200);

    const noFrontLoaded = contentPages.filter(p => {
        const firstParagraph = p.paragraphs[0] || '';
        return firstParagraph.length < 40 || firstParagraph.length > 300;
    });

    if (noFrontLoaded.length > Math.ceil(contentPages.length * 0.5) && contentPages.length > 0) {
        issues.push({
            id: 'no-featured-snippet-optimization', category: 'aeo', severity: 'high',
            title: 'Content not optimized for featured snippets',
            description: 'Most pages lack a concise summary paragraph (40-60 words) at the top.',
            impact: 'Missing featured snippet and AI answer box opportunities',
            fix: 'Add a clear, concise definition or summary paragraph near the top of each page',
            affectedPages: noFrontLoaded.map(p => p.url).slice(0, 5),
        });
    }

    return issues;
}

function checkAnswerFormatting(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 200);

    const noLists = contentPages.filter(p => p.lists === 0 && p.tables === 0);
    if (noLists.length > Math.ceil(contentPages.length * 0.5) && contentPages.length > 0) {
        issues.push({
            id: 'no-list-table-formatting', category: 'aeo', severity: 'medium',
            title: 'No table or list formatting in content',
            description: `${noLists.length} content page(s) lack lists or tables.`,
            impact: 'AI engines prefer structured formats (lists, tables) for extraction',
            fix: 'Add bullet points, numbered lists, or comparison tables to content',
            affectedPages: noLists.map(p => p.url).slice(0, 5),
        });
    }

    return issues;
}

function checkComparisonContent(pages) {
    const issues = [];
    const productPages = pages.filter(p =>
        p.hasProductSchema || /product|service|pricing|plan/i.test(p.url)
    );

    if (productPages.length > 0) {
        const hasComparison = pages.some(p =>
            /comparison|vs\.|versus|compare|alternative/i.test(p.title) ||
            (p.tables > 0 && /feature|price|plan/i.test(p.plainText))
        );
        if (!hasComparison) {
            issues.push({
                id: 'no-comparison-tables', category: 'aeo', severity: 'medium',
                title: 'No comparison tables for products/services',
                description: 'Product/service pages exist but no comparison or versus content found.',
                impact: 'Missing AI answer visibility for comparison queries',
                fix: 'Create comparison pages with structured tables comparing features, pricing',
                affectedPages: productPages.map(p => p.url).slice(0, 5),
            });
        }
    }

    return issues;
}

function checkStepByStep(pages) {
    const issues = [];
    const howToPages = pages.filter(p =>
        /how.to|guide|tutorial|steps|process/i.test(p.title) || /how.to|step.by.step/i.test(p.plainText.substring(0, 500))
    );

    const noSteps = howToPages.filter(p => {
        const hasNumberedList = /\d+\.\s/.test(p.plainText);
        const hasStepHeadings = p.headings.some(h => /step\s*\d/i.test(h.text));
        return !hasNumberedList && !hasStepHeadings;
    });

    if (noSteps.length > 0) {
        issues.push({
            id: 'no-step-by-step', category: 'aeo', severity: 'medium',
            title: 'How-to content lacks step-by-step format',
            description: `${noSteps.length} tutorial/guide page(s) don't use numbered steps or step headings.`,
            impact: 'AI engines prefer clearly structured step-by-step content',
            fix: 'Format instructional content with numbered steps and clear step headings',
            affectedPages: noSteps.map(p => p.url),
        });
    }

    return issues;
}

function checkConclusions(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 500);
    const noConclusion = contentPages.filter(p => {
        const lastHeadings = p.headings.slice(-3);
        return !lastHeadings.some(h =>
            /conclusion|summary|final.thought|takeaway|key.point|wrap.up|in.short|tl;?dr/i.test(h.text)
        );
    });

    if (noConclusion.length > Math.ceil(contentPages.length * 0.5) && contentPages.length > 0) {
        issues.push({
            id: 'no-conclusions', category: 'aeo', severity: 'low',
            title: 'Content pages lack conclusions',
            description: `${noConclusion.length} long-form page(s) don't have a summary or conclusion section.`,
            impact: 'AI engines look for clear takeaways to cite in answers',
            fix: 'Add a Conclusion, Summary, or Key Takeaways section to long articles',
            affectedPages: noConclusion.map(p => p.url).slice(0, 5),
        });
    }

    return issues;
}

function checkVideoContent(pages) {
    const issues = [];
    const videoPages = pages.filter(p => {
        const $ = cheerio.load(p.html || '');
        return $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
    });

    const noTranscripts = videoPages.filter(p =>
        !/transcript|caption/i.test(p.plainText)
    );

    if (noTranscripts.length > 0) {
        issues.push({
            id: 'no-video-transcripts', category: 'aeo', severity: 'medium',
            title: 'Video content without transcripts',
            description: `${noTranscripts.length} page(s) with video content lack transcripts or captions.`,
            impact: 'AI engines cannot index or cite video content without text',
            fix: 'Add text transcripts or summaries below video embeds',
            affectedPages: noTranscripts.map(p => p.url),
        });
    }

    return issues;
}

function checkLocalAnswerOptimization(pages) {
    const issues = [];
    const hasLocalContent = pages.some(p =>
        p.schemaTypes.includes('LocalBusiness') ||
        /location|address|near me|local/i.test(p.plainText.substring(0, 1000))
    );
    const hasLocalSchema = pages.some(p =>
        p.schemaTypes.includes('LocalBusiness') || p.schemaTypes.includes('Place')
    );

    if (hasLocalContent && !hasLocalSchema) {
        issues.push({
            id: 'no-local-optimization', category: 'aeo', severity: 'medium',
            title: 'Local content not optimized for answer engines',
            description: 'Site mentions location/local info but lacks LocalBusiness schema.',
            impact: 'Missing visibility for "near me" and local AI answer queries',
            fix: 'Add LocalBusiness schema with name, address, phone, hours, and geo coordinates',
            affectedPages: pages.filter(p => /location|address|local/i.test(p.plainText.substring(0, 1000))).map(p => p.url).slice(0, 5),
        });
    }

    return issues;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT CHECKS
// ═══════════════════════════════════════════════════════════════

function checkContentQuality(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 50);

    const outdated = contentPages.filter(p => {
        const dateMatch = p.plainText.match(/\b(20[0-1]\d|2020|2021|2022)\b/);
        return dateMatch && !/updated|revised/i.test(p.plainText.substring(0, 200));
    });
    if (outdated.length > 0) {
        issues.push({
            id: 'outdated-content', category: 'content', severity: 'medium',
            title: 'Potentially outdated content detected',
            description: `${outdated.length} page(s) reference dates from 2022 or earlier without update indicators.`,
            impact: 'Stale content loses rankings and user trust over time',
            fix: 'Review and update content with current information, add "last updated" dates',
            affectedPages: outdated.map(p => p.url),
        });
    }

    const stuffed = contentPages.filter(p => {
        const words = p.plainText.toLowerCase().split(/\s+/);
        const freq = new Map();
        words.forEach(w => { if (w.length > 4) freq.set(w, (freq.get(w) || 0) + 1); });
        const maxFreq = Math.max(...freq.values(), 0);
        return maxFreq / words.length > 0.05 && words.length > 100;
    });
    if (stuffed.length > 0) {
        issues.push({
            id: 'keyword-stuffing', category: 'content', severity: 'high',
            title: 'Possible keyword stuffing detected',
            description: `${stuffed.length} page(s) show unnaturally high keyword repetition.`,
            impact: 'Search engines penalize keyword stuffing, reducing rankings',
            fix: 'Write naturally; use synonyms and semantic variations instead of repeating keywords',
            affectedPages: stuffed.map(p => p.url),
        });
    }

    return issues;
}

function checkReadability(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 200);

    const poorReadability = contentPages.filter(p => {
        const asl = avgSentenceLength(p.plainText);
        return asl > 25;
    });
    if (poorReadability.length > 0) {
        issues.push({
            id: 'poor-readability', category: 'content', severity: 'medium',
            title: 'Poor content readability',
            description: `${poorReadability.length} page(s) have very long average sentence length (>25 words).`,
            impact: 'Hard-to-read content has higher bounce rates and lower engagement',
            fix: 'Break up long sentences, aim for 15-20 words per sentence',
            affectedPages: poorReadability.map(p => p.url),
        });
    }

    const longParagraphs = contentPages.filter(p => p.paragraphs.some(para => countWords(para) > 150));
    if (longParagraphs.length > 0) {
        issues.push({
            id: 'long-paragraphs', category: 'content', severity: 'low',
            title: 'Very long paragraphs without visual breaks',
            description: `${longParagraphs.length} page(s) have paragraphs exceeding 150 words.`,
            impact: 'Long text blocks reduce scannability and mobile readability',
            fix: 'Break paragraphs into shorter chunks (3-4 sentences max)',
            affectedPages: longParagraphs.map(p => p.url),
        });
    }

    return issues;
}

function checkContentStructure(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 300);

    const noSubheadings = contentPages.filter(p => {
        const subheadings = p.headings.filter(h => h.level >= 2);
        return subheadings.length < 2;
    });
    if (noSubheadings.length > 0) {
        issues.push({
            id: 'missing-subheadings', category: 'content', severity: 'medium',
            title: 'Content pages missing subheadings',
            description: `${noSubheadings.length} page(s) with 300+ words have fewer than 2 subheadings.`,
            impact: 'Poor scannability and weakened content structure signals',
            fix: 'Add descriptive H2/H3 subheadings every 200-300 words',
            affectedPages: noSubheadings.map(p => p.url),
        });
    }

    const noFormats = contentPages.filter(p => p.lists === 0 && p.tables === 0);
    if (noFormats.length > 0) {
        issues.push({
            id: 'no-visual-breaks', category: 'content', severity: 'low',
            title: 'No bullet points, lists, or tables in content',
            description: `${noFormats.length} content page(s) rely solely on paragraphs.`,
            impact: 'Reduced readability and engagement',
            fix: 'Add bullet points, numbered lists, or tables to break up content',
            affectedPages: noFormats.map(p => p.url),
        });
    }

    const noSummary = contentPages.filter(p => {
        return !/tl;?dr|summary|overview|key takeaway|in.short/i.test(p.plainText.substring(0, 500));
    });
    if (noSummary.length > Math.ceil(contentPages.length * 0.7) && contentPages.length > 2) {
        issues.push({
            id: 'no-content-summary', category: 'content', severity: 'low',
            title: 'Content pages lack a summary or TL;DR',
            description: 'Most content pages don\'t have a summary or overview section at the top.',
            impact: 'Readers and AI engines benefit from upfront summaries',
            fix: 'Add a brief summary, TL;DR, or overview paragraph at the start of long content',
            affectedPages: noSummary.map(p => p.url).slice(0, 5),
        });
    }

    return issues;
}

function checkContentLinks(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 200);

    const noInternal = contentPages.filter(p => p.internalLinks.length === 0);
    if (noInternal.length > 0) {
        issues.push({
            id: 'content-no-internal-links', category: 'content', severity: 'medium',
            title: 'Content pages with no internal links',
            description: `${noInternal.length} content page(s) don't link to any other pages on the site.`,
            impact: 'Broken content silos, poor link equity distribution',
            fix: 'Add contextual internal links to related articles and pages',
            affectedPages: noInternal.map(p => p.url),
        });
    }

    const noExternal = contentPages.filter(p => p.externalLinks.length === 0);
    if (noExternal.length > Math.ceil(contentPages.length * 0.7) && contentPages.length > 2) {
        issues.push({
            id: 'no-external-links', category: 'content', severity: 'low',
            title: 'Content lacks external links to authoritative sources',
            description: 'Most content pages don\'t link to any external authoritative sources.',
            impact: 'External links to quality sources improve trust signals',
            fix: 'Cite and link to authoritative sources, studies, and references',
            affectedPages: noExternal.map(p => p.url).slice(0, 5),
        });
    }

    return issues;
}

function checkCTA(pages) {
    const issues = [];
    const commercialPages = pages.filter(p =>
        /product|service|pricing|plan|demo|trial|buy|shop/i.test(p.url) ||
        /product|service|pricing/i.test(p.title)
    );

    const noCTA = commercialPages.filter(p => {
        const $ = cheerio.load(p.html || '');
        const ctaButtons = $('a, button').filter((_, el) => {
            const text = $(el).text().toLowerCase();
            return /get started|sign up|buy|order|subscribe|free trial|demo|contact|learn more|try/i.test(text);
        });
        return ctaButtons.length === 0;
    });

    if (noCTA.length > 0) {
        issues.push({
            id: 'missing-cta', category: 'content', severity: 'medium',
            title: 'Commercial pages without clear CTA',
            description: `${noCTA.length} product/service page(s) lack a clear call-to-action button.`,
            impact: 'Missing conversion opportunities on high-intent pages',
            fix: 'Add prominent CTAs (Get Started, Sign Up, Contact Us) to commercial pages',
            affectedPages: noCTA.map(p => p.url),
        });
    }

    return issues;
}

function checkAuthorAttribution(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 300);
    const noDate = contentPages.filter(p => {
        const $ = cheerio.load(p.html || '');
        const hasDateMeta = $('meta[property="article:published_time"], time[datetime], .date, .published').length > 0;
        const hasDateText = /published|posted|updated|date/i.test(p.plainText.substring(0, 300));
        return !hasDateMeta && !hasDateText;
    });

    if (noDate.length > 0) {
        issues.push({
            id: 'missing-content-date', category: 'content', severity: 'medium',
            title: 'Content missing published/updated dates',
            description: `${noDate.length} content page(s) have no visible publish or update date.`,
            impact: 'Users and AI cannot assess content freshness',
            fix: 'Add visible "Published" and "Last Updated" dates to all content pages',
            affectedPages: noDate.map(p => p.url),
        });
    }

    return issues;
}

function checkMultimedia(pages) {
    const issues = [];
    const contentPages = pages.filter(p => p.wordCount > 300);

    const noImages = contentPages.filter(p => p.images.length === 0);
    if (noImages.length > 0) {
        issues.push({
            id: 'content-no-images', category: 'content', severity: 'low',
            title: 'Content pages without any images',
            description: `${noImages.length} content page(s) have no images at all.`,
            impact: 'Visual content increases engagement and time on page',
            fix: 'Add relevant images, diagrams, or infographics to content pages',
            affectedPages: noImages.map(p => p.url),
        });
    }

    return issues;
}

function checkContentStrategy(pages) {
    const issues = [];

    const hasPillar = pages.some(p => p.wordCount > 1500 && p.headings.length > 5);
    if (!hasPillar) {
        issues.push({
            id: 'no-pillar-pages', category: 'content', severity: 'medium',
            title: 'No pillar/cornerstone content pages found',
            description: 'No comprehensive long-form pages (1500+ words) found that could serve as topic pillars.',
            impact: 'Without pillar content, topic authority is fragmented',
            fix: 'Create comprehensive pillar pages for your core topics (1500-3000 words)',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    }

    const hasGlossary = pages.some(p => /glossary|definition|terminology|dictionary/i.test(p.url));
    if (!hasGlossary) {
        issues.push({
            id: 'no-glossary', category: 'content', severity: 'low',
            title: 'No glossary or definition pages',
            description: 'No glossary or terminology pages found for industry terms.',
            impact: 'AI engines frequently cite definition content for "what is" queries',
            fix: 'Create a glossary page defining key industry terms',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    }

    const contentTypes = new Set();
    pages.forEach(p => {
        if (/blog|article|post/i.test(p.url)) contentTypes.add('blog');
        if (/guide|tutorial|how-to/i.test(p.url)) contentTypes.add('guide');
        if (/case.study|success/i.test(p.url)) contentTypes.add('case-study');
        if (/tool|calculator|generator/i.test(p.url)) contentTypes.add('tool');
        if (/video|webinar|podcast/i.test(p.url)) contentTypes.add('media');
    });
    if (contentTypes.size <= 1 && pages.length > 5) {
        issues.push({
            id: 'limited-content-types', category: 'content', severity: 'low',
            title: 'Over-reliance on a single content type',
            description: `Only ${contentTypes.size || 0} content type(s) detected. Diverse content attracts more traffic.`,
            impact: 'Limited content diversity reduces total addressable search queries',
            fix: 'Diversify with guides, case studies, tools, videos, and comparison pages',
            affectedPages: [pages[0]?.url].filter(Boolean),
        });
    }

    return issues;
}

// ═══════════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════════

function calculateScores(issues) {
    const categories = { seo: 100, geo: 100, aeo: 100, content: 100 };
    const penalties = { critical: 8, high: 4, medium: 2, low: 1 };

    issues.forEach(issue => {
        const penalty = penalties[issue.severity] || 0;
        if (categories[issue.category] !== undefined) {
            categories[issue.category] = Math.max(0, categories[issue.category] - penalty);
        }
    });

    const overall = Math.round(
        categories.seo * 0.35 +
        categories.geo * 0.25 +
        categories.aeo * 0.20 +
        categories.content * 0.20
    );

    return { overall, seo: categories.seo, geo: categories.geo, aeo: categories.aeo, content: categories.content };
}

function groupByCategory(issues) {
    const groups = { seo: [], geo: [], aeo: [], content: [] };
    const summaries = {};

    issues.forEach(issue => {
        if (groups[issue.category]) groups[issue.category].push(issue);
    });

    for (const [cat, catIssues] of Object.entries(groups)) {
        summaries[cat] = {
            critical: catIssues.filter(i => i.severity === 'critical').length,
            high: catIssues.filter(i => i.severity === 'high').length,
            medium: catIssues.filter(i => i.severity === 'medium').length,
            low: catIssues.filter(i => i.severity === 'low').length,
            total: catIssues.length,
        };
    }

    return { issues: groups, summaries };
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export async function analyzeAudit(crawlData, siteUrl) {
    const pages = crawlData.map(extractPageData);
    if (pages.length === 0) throw new Error('No pages to analyze');

    const domain = extractDomain(siteUrl);
    const [robotsTxt, sitemapXml] = await Promise.all([
        fetchRobotsTxt(domain),
        fetchSitemapXml(domain),
    ]);

    const allIssues = [
        // SEO
        ...checkTitleTags(pages),
        ...checkMetaDescriptions(pages),
        ...checkCanonicals(pages),
        ...checkHeadings(pages),
        ...checkImages(pages),
        ...checkOpenGraph(pages),
        ...checkStructuredData(pages),
        ...checkRobotsMeta(pages),
        ...checkHreflang(pages),
        ...checkFavicon(pages),
        ...checkHttpsSecurity(pages),
        ...checkUrlStructure(pages),
        ...checkInternalLinking(pages),
        ...checkThinContent(pages),
        ...checkDuplicateContent(pages),
        ...checkMobileUsability(pages),
        ...checkSitemap(pages, sitemapXml),

        // GEO
        ...checkEntityDefinition(pages),
        ...checkAboutPage(pages),
        ...checkAuthorSignals(pages),
        ...checkEEAT(pages),
        ...checkBrandSchema(pages),
        ...checkTopicalAuthority(pages),
        ...checkSocialProof(pages),
        ...checkCitableContent(pages),
        ...checkFAQContent(pages),
        ...checkJSRendering(pages),

        // AEO
        ...checkFAQSchema(pages),
        ...checkHowToSchema(pages),
        ...checkSpeakableSchema(pages),
        ...checkQuestionOptimization(pages),
        ...checkDirectAnswers(pages),
        ...checkAnswerFormatting(pages),
        ...checkComparisonContent(pages),
        ...checkStepByStep(pages),
        ...checkConclusions(pages),
        ...checkVideoContent(pages),
        ...checkLocalAnswerOptimization(pages),

        // Content
        ...checkContentQuality(pages),
        ...checkReadability(pages),
        ...checkContentStructure(pages),
        ...checkContentLinks(pages),
        ...checkCTA(pages),
        ...checkAuthorAttribution(pages),
        ...checkMultimedia(pages),
        ...checkContentStrategy(pages),
    ];

    const scores = calculateScores(allIssues);
    const { issues, summaries } = groupByCategory(allIssues);

    const totalSummary = {
        critical: allIssues.filter(i => i.severity === 'critical').length,
        high: allIssues.filter(i => i.severity === 'high').length,
        medium: allIssues.filter(i => i.severity === 'medium').length,
        low: allIssues.filter(i => i.severity === 'low').length,
        total: allIssues.length,
    };

    return {
        url: siteUrl,
        domain,
        crawledPages: pages.length,
        auditedAt: new Date().toISOString(),
        scores,
        summary: totalSummary,
        categories: {
            seo: { name: 'Technical SEO', score: scores.seo, issues: issues.seo, summary: summaries.seo },
            geo: { name: 'Generative Engine Optimization', score: scores.geo, issues: issues.geo, summary: summaries.geo },
            aeo: { name: 'Answer Engine Optimization', score: scores.aeo, issues: issues.aeo, summary: summaries.aeo },
            content: { name: 'Content Quality', score: scores.content, issues: issues.content, summary: summaries.content },
        },
        pages: pages.map(p => ({ url: p.url, title: p.title, wordCount: p.wordCount })),
        hasSitemap: !!sitemapXml,
        hasRobotsTxt: !!robotsTxt,
    };
}
