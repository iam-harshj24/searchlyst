import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { isReadableAnswerText } from '../utils/readableText.js';
import { multiFactorSentiment0to100, weightedOverallFromFactors } from './multiFactorSentiment.js';
import { buildGeminiSentimentBatchPrompt } from './geminiSentimentPrompt.js';

let genAI = null;
function getModel() {
    if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

/** Prevents scans from hanging forever if Gemini never responds (SDK has no default deadline). */
const GEMINI_VISIBILITY_TIMEOUT_MS = Math.min(
    180_000,
    Math.max(25_000, Number(process.env.GEMINI_VISIBILITY_TIMEOUT_MS) || 90_000),
);

function withGeminiDeadline(promise, label) {
    let t;
    const deadline = new Promise((_, reject) => {
        t = setTimeout(
            () => reject(new Error(`${label}: Gemini timeout ${GEMINI_VISIBILITY_TIMEOUT_MS / 1000}s`)),
            GEMINI_VISIBILITY_TIMEOUT_MS,
        );
    });
    return Promise.race([promise, deadline]).finally(() => clearTimeout(t));
}

/**
 * Max citation rows stored per engine × prompt run (URLs in dashboard Sources).
 * Default 80; cap 200. Set MAX_CITATIONS_PER_RUN in env.
 */
const MAX_CITATIONS_PER_RUN = Math.min(
    200,
    Math.max(15, Number(process.env.MAX_CITATIONS_PER_RUN) || 80),
);

/**
 * Merge Infatica JSON + text + HTML link lists: dedupe by canonical URL, normalize href/domain.
 */
function dedupeSourcesForRun(sources) {
    if (!Array.isArray(sources)) return [];
    const seen = new Set();
    const out = [];
    for (const s of sources) {
        if (!s || typeof s !== 'object') continue;
        let raw = String(s.url || '').trim();
        if (!raw) continue;
        raw = raw.replace(/[.,;:!?]+$/, '');
        if (raw.startsWith('//')) raw = `https:${raw}`;
        if (!/^https?:\/\//i.test(raw)) continue;
        let href;
        let dedupeKey;
        try {
            const u = new URL(raw);
            u.hash = '';
            href = u.href;
            dedupeKey = `${u.hostname}${u.pathname}${u.search}`.toLowerCase();
        } catch {
            continue;
        }
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        let domain = String(s.domain || '').trim().replace(/^www\./i, '');
        if (!domain) {
            try {
                domain = new URL(href).hostname.replace(/^www\./i, '');
            } catch {
                domain = '';
            }
        }
        out.push({
            url: href,
            domain,
            title: String(s.title || s.text || '').trim().slice(0, 500),
        });
    }
    return out;
}

// ── Domain Categorization ────────────────────────────────────────────────────

const DOMAIN_CATEGORIES = {
    forum: ['reddit.com', 'quora.com', 'stackoverflow.com', 'news.ycombinator.com', 'community.', 'forum.', 'discuss.'],
    social: ['linkedin.com', 'twitter.com', 'x.com', 'youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'medium.com'],
    review: ['g2.com', 'capterra.com', 'trustpilot.com', 'trustradius.com', 'yelp.com', 'getapp.com', 'softwareadvice.com'],
    institutional: ['wikipedia.org', 'arxiv.org', '.edu', '.gov', 'researchgate.net'],
    editorial: [
        'searchengineland.com', 'searchenginejournal.com', 'techcrunch.com', 'forbes.com', 'nytimes.com',
        'hubspot.com', 'neilpatel.com', 'moz.com', 'ahrefs.com', 'semrush.com', 'backlinko.com',
        'contentmarketinginstitute.com', 'entrepreneur.com', 'inc.com', 'businessinsider.com', 'wired.com',
        'theverge.com', 'engadget.com', 'mashable.com', 'zdnet.com', 'cnet.com', 'techradar.com'
    ]
};

/** Subdomain or exact host match — avoids false positives from `includes(firstLabel)`. */
function hostMatchesBrandDomain(citationHost, brandDomain) {
    if (!citationHost || !brandDomain) return false;
    const h = String(citationHost).replace(/^www\./, '').toLowerCase();
    const b = String(brandDomain).replace(/^www\./, '').toLowerCase();
    if (h === b) return true;
    if (b.length > 2 && h.endsWith(`.${b}`)) return true;
    return false;
}

function hostMatchesCompetitorDomain(citationHost, compDomain) {
    if (!citationHost || !compDomain) return false;
    const h = String(citationHost).replace(/^www\./, '').toLowerCase();
    const c = String(compDomain).replace(/^www\./, '').toLowerCase();
    if (c.length < 2) return false;
    if (h === c) return true;
    if (h.endsWith(`.${c}`)) return true;
    return false;
}

function categorizeDomain(domain, brandDomain, competitorDomains = []) {
    const d = domain.toLowerCase();
    const brandD = brandDomain?.toLowerCase().replace('www.', '') || '';
    if (brandD && hostMatchesBrandDomain(d, brandD)) return 'owned';
    for (const comp of competitorDomains) {
        const c = comp.toLowerCase().replace('www.', '');
        if (hostMatchesCompetitorDomain(d, c)) return 'competitor';
    }
    for (const pattern of DOMAIN_CATEGORIES.forum) { if (d.includes(pattern)) return 'forum'; }
    for (const pattern of DOMAIN_CATEGORIES.social) { if (d.includes(pattern)) return 'social'; }
    for (const pattern of DOMAIN_CATEGORIES.review) { if (d.includes(pattern)) return 'review'; }
    for (const pattern of DOMAIN_CATEGORIES.institutional) { if (d.includes(pattern)) return 'institutional'; }
    for (const pattern of DOMAIN_CATEGORIES.editorial) { if (d.includes(pattern)) return 'editorial'; }
    return 'other';
}

// ── HTML Utilities ───────────────────────────────────────────────────────────

function extractTextFromHtml(html) {
    if (!html) return '';
    try {
        const $ = cheerio.load(html);
        $('script, style, noscript, svg, img, link, meta').remove();
        let t = $('body').text().replace(/\s+/g, ' ').trim();
        if (t.length < 120) t = $('html').text().replace(/\s+/g, ' ').trim();
        if (t.length < 120) t = $.root().text().replace(/\s+/g, ' ').trim();
        return t;
    } catch {
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
}

/** Last-resort plain text from any HTML (Infatica returns full pages; body may be empty in fragment HTML). */
function stripHtmlToPlain(html, maxLen = 14_000) {
    if (!html || typeof html !== 'string') return '';
    let s = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (s.length > maxLen) {
        s = s.slice(0, maxLen - 40) + '\n\n… [truncated for storage] …';
    }
    return s;
}

function decodeGoogleResultHref(href) {
    if (!href || typeof href !== 'string') return null;
    const decodeQ = (q) => {
        if (!q || typeof q !== 'string') return null;
        if (!q.startsWith('http')) return null;
        try {
            return decodeURIComponent(q.replace(/\+/g, ' '));
        } catch {
            return q;
        }
    };
    if (href.startsWith('http')) {
        try {
            const u = new URL(href);
            if (u.hostname.includes('google.') && u.pathname.includes('/url')) {
                const q = u.searchParams.get('q') || u.searchParams.get('url');
                const out = decodeQ(q);
                if (out) return out;
            }
        } catch { /* keep */ }
        return href;
    }
    if (href.startsWith('/url?')) {
        try {
            const sp = new URLSearchParams(href.replace(/^\/url\?/, ''));
            const q = sp.get('q') || sp.get('url') || sp.get('adurl');
            const out = decodeQ(q);
            if (out) return out;
        } catch { /* ignore */ }
    }
    return null;
}

/** Match infaticaService: ChatGPT/OpenAI often wrap the real publisher URL in a chatgpt.com redirect. */
function decodeOpenAiChatgptWrappedUrl(href) {
    if (!href || typeof href !== 'string') return null;
    let t = href.trim();
    if (t.startsWith('//')) t = `https:${t}`;
    if (!/^https?:\/\//i.test(t)) return null;
    try {
        const u = new URL(t);
        const host = u.hostname.toLowerCase();
        if (!host.endsWith('openai.com') && !host.endsWith('chatgpt.com')) return null;
        for (const key of ['url', 'q', 'u', 'destination', 'to', 'target', 'link', 'src']) {
            const inner = u.searchParams.get(key);
            if (!inner) continue;
            let dec = inner;
            try {
                dec = decodeURIComponent(inner.replace(/\+/g, ' '));
            } catch { /* keep */ }
            if (/^https?:\/\//i.test(dec)) return dec;
        }
    } catch {
        return null;
    }
    return null;
}

function resolveCitationAnchorHref(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const t = raw.trim();
    if (!t) return '';
    let href = t.startsWith('http') ? t : decodeGoogleResultHref(t);
    if (!href && t.startsWith('//')) href = `https:${t}`;
    if (!href) return '';
    const unwrapped = decodeOpenAiChatgptWrappedUrl(href);
    return unwrapped || href;
}

function extractLinksFromHtml(html) {
    if (!html) return [];
    try {
        const $ = cheerio.load(html);
        const links = [];
        const seen = new Set();
        $('a[href]').each((_, el) => {
            const raw = $(el).attr('href');
            const text = $(el).text().trim();
            const href = resolveCitationAnchorHref(raw || '');
            if (!href) return;
            try {
                const url = new URL(href);
                const d = url.hostname.replace(/^www\./, '');
                if (d.includes('google.com') || d.includes('gstatic')) return;
                if (seen.has(href)) return;
                seen.add(href);
                links.push({ url: href, domain: d, text: text.substring(0, 80) });
            } catch {}
        });
        return links;
    } catch { return []; }
}

/**
 * When AI Overview markup is missing or parser returns garbage, use classic organic titles + snippets + links.
 * Google DOM changes often — use h3-centric + div.g fallbacks.
 */
function extractGoogleOrganicSnippetsFromHtml(html) {
    if (!html || typeof html !== 'string') return { markdown: '', links: [] };
    try {
        const $ = cheerio.load(html);
        $('script, style, noscript, svg').remove();
        const links = [];
        const chunks = [];
        const seen = new Set();

        const resolveHref = (rawHref) => {
            if (!rawHref) return null;
            if (rawHref.startsWith('http')) return decodeGoogleResultHref(rawHref) || rawHref;
            return decodeGoogleResultHref(rawHref);
        };

        const pushResult = (title, snippet, href) => {
            if (!href || !/^https?:\/\//i.test(href)) return;
            // Skip Google ad URLs
            if (href.includes('/aclk?') || href.includes('/adurl?')) return;
            let domain = '';
            try {
                domain = new URL(href).hostname.replace(/^www\./, '');
            } catch {
                return;
            }
            if (domain === 'google.com' || domain.endsWith('.google.com') || domain.includes('gstatic')) return;
            // Skip ad networks
            const adDomains = ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com'];
            if (adDomains.some(ad => domain.includes(ad))) return;
            const t = title.replace(/\s+/g, ' ').trim();
            const sn = snippet.replace(/\s+/g, ' ').trim();
            // Skip if title starts with "Ad·" or "Sponsored"
            if (/^(ad\s*·|sponsored|promoted)/i.test(t)) return;
            if (t.length < 2 && sn.length < 15) return;
            if (seen.has(href)) return;
            seen.add(href);
            links.push({ url: href, domain, title: t || sn.slice(0, 72) });
            const body = sn || t;
            let block = '';
            if (t.length >= 2) block += `### ${t}\n\n`;
            block += body;
            block += `\n\n[${domain}](${href})`;
            chunks.push(block);
        };

        // A) Standard organic cards
        $('div.g, div.Gx5Zad, div.tF2Cxc, div.N54PNb').each((_, el) => {
            const $el = $(el);
            // Skip ad containers
            if ($el.attr('data-text-ad') || $el.hasClass('ads-ad') || $el.find('[data-text-ad], .ad_cclk, .ads-ad').length) return;
            const title = $el.find('h3').first().text().trim();
            const snippet =
                $el.find('.VwiC3b, .yXK7lf, .MUxGbd, .aCOpRe, .lyLwlc, .IsZvec, .kb0PBd, .lEBKjf, .yiP64c, .s3v9rd')
                    .first()
                    .text()
                    .trim();
            const $a = $el.find('a[href]').filter((__, n) => {
                const h = $(n).attr('href') || '';
                return h.startsWith('http') || h.startsWith('/url');
            }).first();
            const href = resolveHref($a.attr('href'));
            pushResult(title, snippet, href);
        });

        // B) h3 wrapped in <a> (common layout)
        $('#rso h3, #center_col h3, #search h3, main h3').each((_, h3) => {
            const $h3 = $(h3);
            const title = $h3.text().trim();
            if (title.length < 2) return;
            let raw = $h3.closest('a').attr('href') || '';
            const $scope = $h3.closest('div.g, div.MjjYud, div.tF2Cxc, div[data-hveid], div.N54PNb').first();
            if (!raw && $scope.length) {
                raw = $scope.find('a[href^="http"], a[href^="/url"]').first().attr('href') || '';
            }
            const href = resolveHref(raw);
            let snippet = '';
            if ($scope.length) {
                snippet = $scope.find('.VwiC3b, .aCOpRe, .IsZvec, .lEBKjf').first().text().trim();
            }
            pushResult(title, snippet, href);
        });

        return { markdown: chunks.join('\n\n---\n\n'), links };
    } catch {
        return { markdown: '', links: [] };
    }
}

// ── Readable answer extraction (semantic HTML → markdown-ish text) ─────────────

/** Inline **bold**, *italic*, [text](url) inside a phrasing context. */
function extractInlineMarkdown($, el) {
    if (!el) return '';
    let out = '';
    $(el).contents().each((_, node) => {
        if (node.type === 'text') {
            out += node.data || '';
            return;
        }
        if (node.type !== 'tag') return;
        const n = node.name?.toLowerCase();
        if (n === 'br') {
            out += '\n';
            return;
        }
        if (n === 'strong' || n === 'b') {
            const inner = extractInlineMarkdown($, node).replace(/\s+/g, ' ').trim();
            if (inner) out += `**${inner}**`;
            return;
        }
        if (n === 'em' || n === 'i') {
            const inner = extractInlineMarkdown($, node).replace(/\s+/g, ' ').trim();
            if (inner) out += `*${inner}*`;
            return;
        }
        if (n === 'a') {
            const href = $(node).attr('href');
            const inner = extractInlineMarkdown($, node).replace(/\s+/g, ' ').trim();
            if (href && /^https?:\/\//i.test(href) && inner) {
                out += `[${inner}](${href})`;
            } else {
                out += inner;
            }
            return;
        }
        if (n === 'code') {
            const inner = $(node).text().trim();
            if (inner) out += `\`${inner}\``;
            return;
        }
        out += extractInlineMarkdown($, node);
    });
    return out.trim();
}

const GOOGLE_SERP_NOISE = /people also ask|related searches|trending searches|see more results|images for|videos for|sponsored|promoted|advertisement|why this ad|about featured snippets|about this result|feedback\s*$/i;

function postProcessAnswerMarkdown(md, engine) {
    if (!md || typeof md !== 'string') return '';
    const lines = md.split('\n').filter((line) => {
        const s = line.trim();
        if (s.length < 2) return true;
        if (GOOGLE_SERP_NOISE.test(s) && engine === 'googleAI') return false;
        if (/^(show more|see more|read more|expand)$/i.test(s)) return false;
        // Filter lines that are clearly ads
        if (/^(ad\s*·|sponsored\s+by|promoted\s+content)/i.test(s)) return false;
        return true;
    });
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Walk block-level nodes inside a subtree in document order → headings, paragraphs, lists.
 * Skips nav/footer and duplicate chunks so the dashboard reads like the live UIs.
 */
function extractSemanticMarkdownFromRoot($, root) {
    if (!root) return '';
    const $root = $(root);
    const lines = [];
    const seen = new Set();

    $root.find('h1,h2,h3,h4,h5,h6,p,li,blockquote,pre').each((_, el) => {
        if ($(el).closest('nav,footer,header,[role="navigation"],button').length) return;
        const tag = el.tagName?.toLowerCase();
        if (tag === 'p' && $(el).parents('li').length) return;

        let t = '';
        if (tag === 'pre') {
            t = $(el).text().replace(/\r\n/g, '\n').trim();
            if (t.length > 2) {
                lines.push('```');
                lines.push(t);
                lines.push('```');
                lines.push('');
            }
            return;
        }

        if (tag === 'blockquote') {
            t = extractInlineMarkdown($, el).replace(/\s+/g, ' ').trim();
            if (t.length > 2) {
                lines.push(`> ${t}`);
                lines.push('');
            }
            return;
        }

        t = extractInlineMarkdown($, el).replace(/\s+/g, ' ').trim();
        if (t.length < 2) return;

        const dedupKey = t.slice(0, 160).toLowerCase();
        if (seen.has(dedupKey)) return;
        seen.add(dedupKey);

        if (tag === 'li') {
            lines.push(`- ${t}`);
            return;
        }
        if (tag?.startsWith('h')) {
            const level = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : tag === 'h3' ? '### ' : '#### ';
            lines.push(`${level}${t}`);
            lines.push('');
            return;
        }
        lines.push(t);
        lines.push('');
    });

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Prefer ARIA / region semantics over obfuscated class names (Google changes classes often). */
function findGoogleAiOverviewRoot($) {
    // Try ARIA label "AI Overview" or "AI-generated answer"
    const overviewAria = $('[aria-label*="AI Overview" i], [aria-label*="AI overview" i], [aria-label*="AI-generated" i], [aria-label*="generated answer" i]').first();
    if (overviewAria.length) {
        const region = overviewAria.closest('[role="region"]');
        if (region.length) {
            const txt = region.text().replace(/\s+/g, ' ').trim();
            if (txt.length > 60) {
                console.log(`[GoogleAI] Found AI Overview via ARIA (region, ${txt.length}ch)`);
                return region.get(0);
            }
        }
        const block = overviewAria.closest('div[data-hveid], div.MjjYud, div[data-ved], div[jsname], div[jscontroller]').first();
        if (block.length) {
            const txt = block.text().replace(/\s+/g, ' ').trim();
            if (txt.length > 60) {
                console.log(`[GoogleAI] Found AI Overview via ARIA (block, ${txt.length}ch)`);
                return block.get(0);
            }
        }
        // If we found the label but containers were too small, try the element itself
        const txt = overviewAria.text().replace(/\s+/g, ' ').trim();
        if (txt.length > 40) {
            console.log(`[GoogleAI] Found AI Overview via ARIA (direct, ${txt.length}ch)`);
            return overviewAria.get(0);
        }
    }

    // Try "Generative" label (some regions use this)
    const genLabel = $('[aria-label*="Generative" i], [aria-label*="generative" i]').first();
    if (genLabel.length) {
        const region = genLabel.closest('[role="region"]');
        if (region.length) {
            const txt = region.text().replace(/\s+/g, ' ').trim();
            if (txt.length > 60) {
                console.log(`[GoogleAI] Found AI Overview via Generative label (${txt.length}ch)`);
                return region.get(0);
            }
        }
    }

    // Legacy class-based selectors
    const legacy = $('.aiAnswerBox, [class*="ai-overview" i], [class*="AiOverview" i], [class*="ai_overview" i], [class*="SGE" i], [id*="ai-overview" i]').first();
    if (legacy.length) {
        const txt = legacy.text().replace(/\s+/g, ' ').trim();
        if (txt.length > 50) {
            console.log(`[GoogleAI] Found AI Overview via legacy class (${txt.length}ch)`);
            return legacy.get(0);
        }
    }

    // Data-attribute hints (Google sometimes uses data-attrid for AI features)
    const dataHint = $('[data-attrid*="ai" i], [data-attrid*="overview" i], [data-attrid*="sge" i]').first();
    if (dataHint.length) {
        const txt = dataHint.text().replace(/\s+/g, ' ').trim();
        if (txt.length > 50) {
            console.log(`[GoogleAI] Found AI Overview via data-attrid (${txt.length}ch)`);
            return dataHint.get(0);
        }
    }

    console.log(`[GoogleAI] No AI Overview root found via semantic hints`);
    return null;
}

/** When semantic hints fail, score SERP blocks that look like multi-paragraph answers (not PAA). */
function fallbackGoogleSerpAnswerRoot($) {
    let best = null;
    let bestScore = 0;
    // Broader candidates — AI Overviews can appear in various container types
    const candidates = $(
        '#search .MjjYud, #rso .MjjYud, #center_col .MjjYud, div.MjjYud, ' +
        'div.xpd, div.kp-blk, div.ULSxyf, div.IZ6rdc, div.kno-rdesc, ' +
        '#rso > div[data-hveid], #center_col > div[data-hveid], div[jscontroller]'
    );
    candidates.each((_, el) => {
        const $el = $(el);
        // Exclude ad containers
        if ($el.attr('data-text-ad') || $el.hasClass('ads-ad') || $el.find('[data-text-ad], .ads-ad').length) return;
        const plain = $el.text().replace(/\s+/g, ' ').trim();
        // Exclude if starts with ad markers
        if (/^(sponsored|advertisement|promoted|ad\s*·)/i.test(plain)) return;
        // Lower min length — some AI Overviews are concise
        if (plain.length < 80) return;
        if (/people also ask|related searches|trending searches|complementary results|about this result|feedback/i.test(plain)) return;
        const pCount = $el.find('p').length;
        const liCount = $el.find('li').length;
        const h3Count = $el.find('h3').length;
        // AI Overviews often have structure (lists, multiple paragraphs) — score them highly
        let score = pCount * 65 + liCount * 22 + h3Count * 15 + Math.min(plain.length, 4000);
        // Boost if contains citation-style markers (common in AI Overviews)
        if (/\[\d+\]/.test(plain)) score += 300;
        if (score > bestScore) {
            bestScore = score;
            best = el;
        }
    });
    if (best) {
        const txt = $(best).text().replace(/\s+/g, ' ').trim();
        console.log(`[GoogleAI] Fallback SERP scorer found block (${txt.length}ch, score=${bestScore})`);
    }
    return best;
}

function scoreContainerForEngine($, el, engine) {
    if (!el) return 0;
    const md = extractSemanticMarkdownFromRoot($, el);
    if (md.length < 40) return 0;
    let score = md.length;
    if (engine === 'googleAI' && GOOGLE_SERP_NOISE.test(md)) score *= 0.35;
    return score;
}

const PERPLEXITY_ANSWER_SELECTORS = [
    'main', '[role="main"]', 'article',
    '[class*="prose"]', '[class*="answer"]', '[class*="markdown"]',
    '[class*="response"]', '[class*="Message"]', '[class*="MessageRow"]', '[class*="message-row"]',
    '[class*="result"]', '[class*="thread"]', '[class*="query-text"]', '[class*="content"]',
    '[class*="AnswerContent"]', '[class*="answer-content"]', '[class*="TextBlock"]',
    '[class*="MarkdownAnswer"]', '[class*="markdown_answer"]', '[class*="AssistantTurn"]',
    '[class*="assistant-turn"]', '[class*="ChatMessage"]', '[class*="chat-message"]',
    'section[aria-label*="answer" i]',
    '[data-testid*="answer"]', '[data-testid*="message"]', '[data-testid*="assistant"]',
    '[data-testid*="text"]', '[data-testid*="content"]', '.pb-lg', '.break-words',
].join(', ');

const GEMINI_CHATGPT_SELECTORS = [
    '[data-message-author-role="assistant"]',
    '[class*="response"]', '[class*="answer"]', '[class*="markdown"]', '[class*="model-response"]', '[class*="prose"]',
    '.response-content', 'main article', '[class*="message-content"]', '[class*="conversation-turn"]',
].join(', ');

const GOOGLE_LEGACY_SELECTORS = [
    '[data-attrid]', '[data-content-feature]', '[data-md-type]',
    '.hgKELb', '.wUrVib', '.IZ6rdc', '.LGOcR', '.kno-rdesc', '.V3FYCf', '.bVj5Zb',
    '.xpdopen', '.mod', '[jsname="Cpkphb"]', '.ULSxyf', '.kp-wholepage',
    '[class*="IZ6rdc"]', '[class*="wDYxhc"]', '[data-hveid] p',
].join(', ');

function extractAIAnswerFromRenderedPage(html, engine) {
    if (!html) return '';
    try {
        const $ = cheerio.load(html);
        $('script, style, noscript, svg, link, meta').remove();
        
        // Remove ad containers before extraction (avoid extracting ad copy as content)
        if (engine === 'googleAI' || engine === 'perplexity') {
            $('[id*="ad" i], [class*="ad" i]').filter((_, el) => {
                const $el = $(el);
                const id = ($el.attr('id') || '').toLowerCase();
                const cls = ($el.attr('class') || '').toLowerCase();
                // Only remove if clearly ad-related (avoid false positives like "header", "lead")
                return /\b(ad|ads|advertisement|sponsored|promo)\b/.test(id + ' ' + cls);
            }).remove();
        }

        if (engine === 'googleAI') {
            let root = findGoogleAiOverviewRoot($);
            if (!root) root = fallbackGoogleSerpAnswerRoot($);
            if (root) {
                let md = extractSemanticMarkdownFromRoot($, root);
                md = postProcessAnswerMarkdown(md, 'googleAI');
                // Lower threshold — some AI Overviews are concise but valuable
                if (md.length >= 50) {
                    console.log(`[GoogleAI] Extracted ${md.length}ch from AI Overview root`);
                    return md;
                }
                console.warn(`[GoogleAI] Found root but markdown too short (${md.length}ch)`);
            }

            let bestEl = null;
            let bestScore = 0;
            $(GOOGLE_LEGACY_SELECTORS).each((_, el) => {
                const sc = scoreContainerForEngine($, el, 'googleAI');
                if (sc > bestScore) {
                    bestScore = sc;
                    bestEl = el;
                }
            });
            if (bestEl && bestScore >= 60) {
                const md = postProcessAnswerMarkdown(extractSemanticMarkdownFromRoot($, bestEl), 'googleAI');
                if (md.length >= 40) {
                    console.log(`[GoogleAI] Legacy selector extracted ${md.length}ch (score=${bestScore})`);
                    return md;
                }
            }
            console.warn(`[GoogleAI] No extraction via semantic/legacy paths (bestScore=${bestScore})`);
        } else {
            const selectorStr = engine === 'perplexity' ? PERPLEXITY_ANSWER_SELECTORS : GEMINI_CHATGPT_SELECTORS;
            let bestEl = null;
            let bestScore = 0;
            $(selectorStr).each((_, el) => {
                const sc = scoreContainerForEngine($, el, engine);
                if (sc > bestScore) {
                    bestScore = sc;
                    bestEl = el;
                }
            });

            if (bestEl && bestScore >= 50) {
                const md = postProcessAnswerMarkdown(extractSemanticMarkdownFromRoot($, bestEl), engine);
                if (md.length >= 40) return md;
            }
        }

        // Last resort: longest collapsed text blob (old behavior, poor formatting)
        const parts = [];
        if (engine === 'perplexity') {
            $(PERPLEXITY_ANSWER_SELECTORS).each((_, el) => {
                const t = $(el).text().replace(/\s+/g, ' ').trim();
                if (t.length > 40) parts.push(t);
            });
            if (parts.length === 0) {
                $('p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, pre, code').each((_, el) => {
                    const t = $(el).text().replace(/\s+/g, ' ').trim();
                    if (t.length > 30) parts.push(t);
                });
            }
        } else if (engine === 'gemini' || engine === 'chatgpt') {
            $(GEMINI_CHATGPT_SELECTORS).each((_, el) => {
                const t = $(el).text().replace(/\s+/g, ' ').trim();
                if (t.length > 60) parts.push(t);
            });
            if (parts.length === 0) {
                $('p, li, h1, h2, h3, h4, td, blockquote').each((_, el) => {
                    const t = $(el).text().replace(/\s+/g, ' ').trim();
                    if (t.length > 30) parts.push(t);
                });
            }
        } else if (engine === 'googleAI') {
            $(GOOGLE_LEGACY_SELECTORS).each((_, el) => {
                const t = $(el).text().replace(/\s+/g, ' ').trim();
                if (t.length > 80) parts.push(t);
            });
        }

        if (parts.length > 0) {
            parts.sort((a, b) => b.length - a.length);
            const longest = parts[0];
            const deduped = [longest];
            for (let i = 1; i < parts.length; i++) {
                if (!longest.includes(parts[i]) && parts[i].length > 40) {
                    deduped.push(parts[i]);
                }
            }
            const merged = postProcessAnswerMarkdown(deduped.join('\n\n'), engine);
            if (merged.length > 40) return merged;
        }

        return '';
    } catch {
        return '';
    }
}

// ── AI Text Response Parsing (Perplexity/Gemini numbered citation style) ─────

/**
 * Parse sources from Perplexity-style numbered citation text.
 * Perplexity embeds numbers in text like "According to X [1][2]..."
 * and optionally provides a "Sources:" or "References:" section at the end.
 */
function pushUniqueSource(sources, seenUrls, url, title = '') {
    if (!url || typeof url !== 'string') return;
    let u = url.trim().replace(/[.,;:!?]+$/, '');
    if (u.startsWith('//')) u = `https:${u}`;
    if (!/^https?:\/\//i.test(u)) return;
    try {
        const canon = new URL(u).href;
        if (seenUrls.has(canon)) return;
        seenUrls.add(canon);
        const domain = new URL(canon).hostname.replace(/^www\./, '');
        sources.push({ url: canon, domain, title: String(title || '').trim().slice(0, 500) });
    } catch { /* ignore */ }
}

/**
 * Parse citations embedded in model text (Perplexity [1][2], footnotes, Sources blocks, markdown links).
 * Merges cleanly with Infatica JSON `sources` when both are present.
 */
function extractSourcesFromAIText(text) {
    if (!text || typeof text !== 'string') return [];
    const sources = [];
    const seenUrls = new Set();

    // Pattern 1: "Sources:" / "References:" block (often at end; allow trailing content)
    const sourcesSectionMatch = text.match(
        /(?:^|\n)\s*(?:sources?|references?|citations?)\s*:?\s*\n([\s\S]{0,4000})(?=\n\n[^\n]*:|\n#{1,3}\s|$)/i
    ) || text.match(/(?:sources?|references?|citations?)\s*:?\s*\n([\s\S]{0,4000})$/i);
    if (sourcesSectionMatch) {
        const section = sourcesSectionMatch[1];
        const urlLines = section.matchAll(
            /^\s*\d+[\.\)]\s*(?:\[([^\]]+)\]\()?(\bhttps?:\/\/[^\s\)\]]+)[\)\]]?(?:\s*[-–]\s*(.+))?/gm
        );
        for (const m of urlLines) {
            pushUniqueSource(sources, seenUrls, m[2], m[1] || m[3] || '');
        }
        const plainNumbered = section.matchAll(/^\s*\d+[\.\)]\s+(https?:\/\/\S+)/gm);
        for (const m of plainNumbered) {
            pushUniqueSource(sources, seenUrls, m[1], '');
        }
    }

    // Pattern 2: Footnotes like [1] https://... or [12] https://...
    const footnoteUrls = text.matchAll(/\[\d+\]\s*(https?:\/\/[^\s\]\)]+)/g);
    for (const m of footnoteUrls) {
        pushUniqueSource(sources, seenUrls, m[1], '');
    }

    // Pattern 3: Markdown links [title](url)
    const mdLinks = text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g);
    for (const m of mdLinks) {
        pushUniqueSource(sources, seenUrls, m[2], m[1]);
    }

    // Pattern 4: Bare URLs (only as filler when we still have few citations — avoids noise)
    if (sources.length < 8) {
        const urlMatches = text.matchAll(/\bhttps?:\/\/[^\s,\]\)\'"<>]{5,}/g);
        for (const m of urlMatches) {
            pushUniqueSource(sources, seenUrls, m[0], '');
        }
    }

    return sources.slice(0, 120);
}

// ── Brand / Competitor Mention Detection ─────────────────────────────────────

function countOccurrences(text, term) {
    if (!text || !term || term.length < 2) return 0;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text.match(new RegExp(escaped, 'gi')) || []).length;
}

/**
 * Lexical 0–100 sentiment around entity mention (fallback when LLM batch is skipped or fails).
 * Uses multi-factor model: emotion, polarity, intensity, subjectivity, toxicity — see multiFactorSentiment.js.
 */
export function lexicalSentiment0to100(textLower, entityName) {
    return multiFactorSentiment0to100(textLower, entityName);
}

/** Aligns with multi-factor spec: ≥70 positive, ≥40 neutral, else negative. */
export function sentimentScoreToLabel(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return 'neutral';
    if (n >= 70) return 'positive';
    if (n >= 40) return 'neutral';
    return 'negative';
}

function getSnippet(text, term, maxLen = 200) {
    if (!term) return '';
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return '';
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + term.length + maxLen - 60);
    let s = text.substring(start, end).trim();
    if (start > 0) s = '...' + s;
    if (end < text.length) s += '...';
    return s;
}

function getAliases(name, domain) {
    const aliases = new Set();
    if (name) aliases.add(name.toLowerCase());
    if (domain) {
        const d = domain.replace(/^www\./, '').toLowerCase();
        aliases.add(d);
        aliases.add(d.split('.')[0]);
    }
    if (name) {
        const clean = name.toLowerCase().replace(/\b(inc|llc|ltd|corp|co|inc\.|llc\.|ltd\.|corp\.|co\.)\b/g, '').trim();
        if (clean && clean.length > 2) aliases.add(clean);
    }
    return Array.from(aliases).filter(a => a.length > 1);
}

function checkMentions(textLower, aliases) {
    let count = 0, firstPos = -1, snippetTerm = '';
    for (const alias of aliases) {
        if (!alias || alias.length < 2) continue;
        const c = countOccurrences(textLower, alias);
        if (c > 0) {
            count += c;
            const pos = textLower.indexOf(alias);
            if (firstPos === -1 || pos < firstPos) { firstPos = pos; snippetTerm = alias; }
        }
    }
    return { count, firstPos, snippetTerm };
}

// ── Core Shared Parser (works for both text and HTML → text) ─────────────────

/** Keep payload bounded but preserve the *end* of long answers (custom prompts often put JSON on the last line). */
function capRawTextForStorage(text, maxLen = 12_000) {
    if (!text || text.length <= maxLen) return text;
    const sep = '\n\n… [truncated] …\n\n';
    const tailLen = Math.min(5500, Math.floor((maxLen - sep.length) * 0.62));
    const headLen = maxLen - sep.length - tailLen;
    if (headLen < 400) return text.slice(-maxLen);
    return text.slice(0, headLen) + sep + text.slice(-tailLen);
}

/**
 * @param {object} [options]
 * @param {string} [options.mentionContextText] — superset for mention/sentiment (e.g. answer + full page plain text)
 * @param {string} [options.displayText] — body shown/stored as rawText when answer extractor is thin but page has content
 */
function buildRunData(text, sources, brandName, domain, competitors, engine, options = {}) {
    const mentionBlock = (options.mentionContextText ?? text ?? '').trim();
    const mentionLower = mentionBlock.toLowerCase();
    const snippetSource = (options.displayText ?? text ?? '').trim() || mentionBlock;
    const domainClean = (domain || '').replace(/^www\./, '').toLowerCase();
    const competitorDomains = competitors.map(c => typeof c === 'string' ? c : c.domain || '').filter(Boolean);

    const brandAliases = getAliases(brandName, domain);
    const brandMatch = checkMentions(mentionLower, brandAliases);
    const brandMentioned = brandMatch.count > 0;

    // Build entity list
    const allEntities = [];
    if (brandMentioned) {
        const brandScore = lexicalSentiment0to100(mentionLower, brandName);
        allEntities.push({
            name: brandName, domain,
            mentions: brandMatch.count,
            firstPosition: brandMatch.firstPos,
            sentiment: sentimentScoreToLabel(brandScore),
            sentimentScore: brandScore,
            snippet: getSnippet(snippetSource, brandMatch.snippetTerm),
            isTargetBrand: true, isCompetitor: false,
        });
    }

    for (const comp of competitors) {
        const name = typeof comp === 'string' ? comp : comp.name || '';
        const cDomain = typeof comp === 'string' ? comp : comp.domain || '';
        if (!name) continue;
        const compAliases = getAliases(name, cDomain);
        const compMatch = checkMentions(mentionLower, compAliases);
        if (compMatch.count > 0) {
            const compScore = lexicalSentiment0to100(mentionLower, name);
            allEntities.push({
                name, domain: cDomain.replace(/^www\./, ''),
                mentions: compMatch.count,
                firstPosition: compMatch.firstPos,
                sentiment: sentimentScoreToLabel(compScore),
                sentimentScore: compScore,
                snippet: getSnippet(snippetSource, compMatch.snippetTerm),
                isTargetBrand: false, isCompetitor: true,
            });
        }
    }

    allEntities.sort((a, b) => a.firstPosition - b.firstPosition);
    const entities = allEntities.map((entity, idx) => ({
        ...entity,
        positionRank: idx + 1,
        totalBrandsInResponse: allEntities.length,
    }));

    const brandEntity = entities.find(e => e.isTargetBrand) || null;

    // Build citations from merged sources (deduped URLs, domains filled from URL when missing)
    const mergedSources = dedupeSourcesForRun(sources);
    const citations = mergedSources.slice(0, MAX_CITATIONS_PER_RUN).map((s, idx) => ({
        url: s.url,
        domain: s.domain,
        title: s.title || s.text || '',
        citationPosition: idx + 1,
        category: categorizeDomain(s.domain, domainClean, competitorDomains),
        isTargetBrand: domainClean ? hostMatchesBrandDomain(s.domain, domainClean) : false,
        isCompetitor: competitorDomains.some((cd) => hostMatchesCompetitorDomain(s.domain, cd)),
    }));

    const citationStats = {
        total: citations.length,
        byCategory: {},
        brandCited: citations.some(c => c.isTargetBrand),
        competitorsCited: [...new Set(citations.filter(c => c.isCompetitor).map(c => c.domain))],
    };
    for (const c of citations) {
        citationStats.byCategory[c.category] = (citationStats.byCategory[c.category] || 0) + 1;
    }

    const bodyForStorage = (options.displayText ?? text ?? '').trim() || mentionBlock;
    return {
        engine,
        brandMentioned,
        brandEntity,
        entities,
        citations,
        citationStats,
        textLength: bodyForStorage.length,
        rawText: capRawTextForStorage(bodyForStorage, 12_000),
    };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main parse function — accepts the output of infaticaService (a {text, sources, html} object)
 * OR raw HTML string (legacy path).
 */
export function parseResponse(infaticaResult, brandName, domain, competitors, engine) {
    if (typeof infaticaResult === 'string') {
        return fastParse(infaticaResult, brandName, domain, competitors, engine);
    }

    let { text, sources = [], html } = infaticaResult;
    // Infatica often returns a full rendered page inside JSON `text` (e.g. ChatGPT HTML) — treat as HTML for extraction.
    if (!html && text && typeof text === 'string') {
        const t = text.trim();
        const minEmbed = engine === 'perplexity' ? 320 : 500;
        if (t.length > minEmbed && /^[\s\n]*</.test(t) && /<(html|body|!doctype|main|article)\b/i.test(t.slice(0, 4000))) {
            html = text;
            text = null;
        }
    }

    if (engine === 'googleAI' && text && typeof text === 'string' && !isReadableAnswerText(text.trim())) {
        console.warn('[Parser/googleAI] Rejecting TEXT payload (encoded / non-prose)');
        text = null;
    }

    if (text && text.trim().length > 0) {
        const structuredSources = sources.length > 0 ? [...sources] : [];
        const textSources = extractSourcesFromAIText(text);
        const seenUrls = new Set(structuredSources.map((s) => {
            try {
                return new URL(s.url).href;
            } catch {
                return s.url;
            }
        }));
        for (const ts of textSources) {
            let key = ts.url;
            try {
                key = new URL(ts.url).href;
            } catch { /* keep */ }
            if (ts.url && !seenUrls.has(key)) {
                structuredSources.push(ts);
                seenUrls.add(key);
            }
        }
        // JSON `sources` is sometimes empty while the same payload includes HTML with real links
        if (html && html.length > 200) {
            for (const l of extractLinksFromHtml(html)) {
                let key = l.url;
                try {
                    key = new URL(l.url).href;
                } catch { /* keep */ }
                if (!seenUrls.has(key)) {
                    seenUrls.add(key);
                    structuredSources.push({
                        url: l.url,
                        domain: l.domain,
                        title: (l.text || '').slice(0, 500),
                    });
                }
            }
        }
        let mentionContext = text;
        let displayText = text;
        if (html && html.length > 200) {
            const plain = stripHtmlToPlain(html, 28000);
            if (plain.length > 60) {
                mentionContext = `${text}\n\n${plain}`;
                if (text.length < 120 && plain.length > text.length) {
                    displayText = plain;
                }
            }
        }
        console.log(`[Parser/${engine}] TEXT path: ${text.length}ch, ${structuredSources.length} sources`);
        return buildRunData(text, structuredSources, brandName, domain, competitors, engine, {
            mentionContextText: mentionContext.slice(0, 120000),
            displayText,
        });
    }

    if (html && html.length > 0) {
        console.log(`[Parser/${engine}] HTML path: ${html.length}ch`);
        const result = fastParse(html, brandName, domain, competitors, engine, sources);
        if (!result.rawText && result.textLength === 0) {
            const stripped = stripHtmlToPlain(html, 12_000);
            if (stripped.length >= 80) {
                console.log(`[Parser/${engine}] fastParse empty → using stripHtmlToPlain (${stripped.length}ch)`);
                const merged = [...sources];
                const seen = new Set(merged.map((s) => {
                    try {
                        return new URL(s.url).href;
                    } catch {
                        return s.url;
                    }
                }));
                for (const ts of extractSourcesFromAIText(stripped)) {
                    let key = ts.url;
                    try {
                        key = new URL(ts.url).href;
                    } catch { /* keep */ }
                    if (!seen.has(key)) {
                        merged.push(ts);
                        seen.add(key);
                    }
                }
                const mentionCtx =
                    stripped.length > 0 && html.length > 200
                        ? `${stripped}\n\n${stripHtmlToPlain(html, 20000)}`
                        : stripped;
                const fallback = buildRunData(stripped, merged, brandName, domain, competitors, engine, {
                    mentionContextText: mentionCtx.slice(0, 120000),
                });
                fallback.citations = result.citations.length > 0 ? result.citations : fallback.citations;
                return fallback;
            }
        }
        return result;
    }

    console.warn(`[Parser/${engine}] No text or HTML in response`);
    return {
        engine,
        brandMentioned: false,
        brandEntity: null,
        entities: [],
        citations: [],
        citationStats: { total: 0, byCategory: {}, brandCited: false, competitorsCited: [] },
        textLength: 0,
        rawText: null,
    };
}

/**
 * fastParse — HTML scrape parser (used for SERP / rendered pages).
 * Kept for backward compatibility.
 */
export function fastParse(html, brandName, domain, competitors, engine, extraSources = []) {
    let text = extractAIAnswerFromRenderedPage(html, engine);
    if (!text) text = extractTextFromHtml(html);
    if (!text && html && html.length > 300) text = stripHtmlToPlain(html, 14_000);

    let googleOrganicLinkRows = [];
    if (engine === 'googleAI' && html && html.length > 200) {
        const org = extractGoogleOrganicSnippetsFromHtml(html);
        googleOrganicLinkRows = org.links.map((l) => ({
            url: l.url,
            domain: l.domain,
            title: l.title || '',
        }));
        const organicOk = org.links.length > 0 && org.markdown.length > 24;
        const proseBad = !text || !isReadableAnswerText(text);
        // Only use organic as fallback when we have NO text or text is truly garbage
        // Don't replace short but valid AI Overviews with organic snippets
        const shouldUseOrganic = organicOk && (proseBad || text.length < 50);
        if (shouldUseOrganic) {
            console.log(`[Parser/googleAI] Using organic SERP snippets (${org.markdown.length}ch, ${org.links.length} links) — AI Overview text was ${text?.length || 0}ch`);
            text = org.markdown;
        } else if (text && text.length >= 50) {
            console.log(`[Parser/googleAI] Keeping AI Overview text (${text.length}ch) over organic snippets`);
        }
    }

    const links = extractLinksFromHtml(html);
    const domainClean = (domain || '').replace(/^www\./, '').toLowerCase();
    const competitorDomains = competitors.map(c => typeof c === 'string' ? c : c.domain || '').filter(Boolean);

    const linkSources = links.map(l => ({ url: l.url, domain: l.domain, title: l.text }));
    const seenUrls = new Set();
    for (const s of linkSources) {
        try {
            seenUrls.add(new URL(s.url).href);
        } catch {
            seenUrls.add(s.url);
        }
    }
    const mergeExtra = (arr) => {
        for (const es of arr) {
            if (!es?.url) continue;
            let key = es.url;
            try {
                key = new URL(es.url).href;
            } catch { /* keep */ }
            if (!seenUrls.has(key)) {
                linkSources.push({
                    url: es.url,
                    domain: es.domain || '',
                    title: es.title || es.text || '',
                });
                seenUrls.add(key);
            }
        }
    };
    mergeExtra(extraSources);
    mergeExtra(googleOrganicLinkRows);
    if (text) {
        mergeExtra(extractSourcesFromAIText(text));
    }

    if (!text) {
        const lastChance = html && html.length > 200 ? stripHtmlToPlain(html, 8000) : '';
        console.warn(`[Parser/${engine}] Thin HTML text (${html?.length || 0} chars HTML, ${linkSources.length} links); lastChance=${lastChance.length}ch`);
        const dedupedThin = dedupeSourcesForRun(linkSources.map((l) => ({ url: l.url, domain: l.domain, title: l.title || l.text })));
        const citations = dedupedThin.slice(0, MAX_CITATIONS_PER_RUN).map((s, idx) => ({
            url: s.url, domain: s.domain, title: s.title || '',
            citationPosition: idx + 1,
            category: categorizeDomain(s.domain, domainClean, competitorDomains),
            isTargetBrand: domainClean ? hostMatchesBrandDomain(s.domain, domainClean) : false,
            isCompetitor: competitorDomains.some((cd) => hostMatchesCompetitorDomain(s.domain, cd)),
        }));
        if (lastChance.length >= 80) {
            const mentionCtx = `${lastChance}\n\n${stripHtmlToPlain(html, 20000)}`.slice(0, 120000);
            return buildRunData(lastChance, linkSources.map((l) => ({ url: l.url, domain: l.domain, title: l.text || '' })), brandName, domain, competitors, engine, {
                mentionContextText: mentionCtx,
            });
        }
        const fallbackMsg =
            linkSources.length > 0
                ? `We extracted ${linkSources.length} linked sources from this response but could not isolate the answer text. Open the sources below — the model likely answered in-line with the scraped page structure.`
                : 'No answer text or sources could be extracted from this HTML response.';
        return {
            engine, brandMentioned: false, brandEntity: null, entities: [],
            citations,
            citationStats: { total: citations.length, byCategory: {}, brandCited: citations.some(c => c.isTargetBrand), competitorsCited: [...new Set(citations.filter(c => c.isCompetitor).map(c => c.domain))] },
            textLength: 0,
            rawText: citations.length > 0 ? fallbackMsg : null,
        };
    }

    const plainForMentions = stripHtmlToPlain(html, 32000);
    const mentionCtx = `${text}\n\n${plainForMentions}`.trim().slice(0, 120000);
    return buildRunData(text, linkSources, brandName, domain, competitors, engine, {
        mentionContextText: mentionCtx,
    });
}

// ── Per-prompt Gemini sentiment (0–100), batched by promptId ─────────────────

function parseJsonObjectLoose(text) {
    const t = String(text || '').trim().replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
        return JSON.parse(m[0]);
    } catch {
        return null;
    }
}

function numOrNullSent(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Accepts legacy per-engine number or rich object { overall, emotion, polarity, intensity, subjectivity, toxicity, rationale }.
 */
function parseEngineLLMSentimentPayload(payload) {
    if (payload === undefined || payload === null) return { score: null, analysis: null };
    if (typeof payload === 'number') {
        const n = numOrNullSent(payload);
        return n != null ? { score: n, analysis: null } : { score: null, analysis: null };
    }
    if (typeof payload === 'object') {
        const emotion = numOrNullSent(payload.emotion);
        const polarity = numOrNullSent(payload.polarity);
        const intensity = numOrNullSent(payload.intensity);
        const subjectivity = numOrNullSent(payload.subjectivity);
        const toxicity = numOrNullSent(payload.toxicity);
        const factors = { emotion, polarity, intensity, subjectivity, toxicity };
        let overall = numOrNullSent(payload.overall ?? payload.score);
        if (overall == null) overall = weightedOverallFromFactors(factors);
        if (overall == null) return { score: null, analysis: null };
        const rationale =
            typeof payload.rationale === 'string' ? payload.rationale.trim().slice(0, 500) : null;
        const hasAnyFactor = [emotion, polarity, intensity, subjectivity, toxicity].some((x) => x != null);
        const analysis =
            hasAnyFactor || rationale
                ? {
                      emotion,
                      polarity,
                      intensity,
                      subjectivity,
                      toxicity,
                      rationale,
                      source: 'gemini_batch',
                  }
                : null;
        return { score: overall, analysis };
    }
    return { score: null, analysis: null };
}

/** New shape { engines: { perplexity, gemini, chatgpt, googleAI } } or legacy flat keys. */
function coalesceEnginesFromBatchJson(scores) {
    if (!scores || typeof scores !== 'object') return {};
    if (scores.engines && typeof scores.engines === 'object') return scores.engines;
    return {
        perplexity: scores.perplexity,
        gemini: scores.gemini,
        chatgpt: scores.chatgpt,
        googleAI: scores.googleAI,
    };
}

/**
 * One Gemini call per promptId: all engine excerpts in one request → JSON scores per engine.
 * Mutates run.brandEntity.sentimentScore and .sentiment in place.
 * Skips when GEMINI_API_KEY is unset or VISIBILITY_SKIP_LLM_SENTIMENT=1.
 *
 * @param {Function} [onProgress] — optional `( { done, total } ) => void | Promise` after each prompt-group (fixes “stuck” UI during long sequential sentiment phase).
 */
export async function batchApplyGeminiSentimentByPrompt(allRuns, brandName, onProgress) {
    if (!process.env.GEMINI_API_KEY?.trim()) return;
    if (process.env.VISIBILITY_SKIP_LLM_SENTIMENT === '1') return;
    if (!brandName || !Array.isArray(allRuns) || allRuns.length === 0) return;

    const byPrompt = new Map();
    for (const run of allRuns) {
        const id = run.promptId;
        if (id == null || id === '') continue;
        if (!byPrompt.has(id)) byPrompt.set(id, []);
        byPrompt.get(id).push(run);
    }

    const jobs = [];
    for (const [, runs] of byPrompt) {
        if (!runs.some((r) => r.brandMentioned && r.brandEntity)) continue;
        jobs.push(runs);
    }

    const totalJobs = jobs.length;
    if (totalJobs === 0) return;

    /** Run up to N prompt-groups in parallel per chunk — avoids counter races and speeds up vs strict sequential. */
    const chunkSize = Math.min(
        4,
        Math.max(1, Number(process.env.VISIBILITY_SENTIMENT_CONCURRENCY) || 3),
    );

    async function processOneJob(runs) {
        const blocks = runs.map((r) => {
            const excerpt = String(r.rawText || '').replace(/\s+/g, ' ').trim().slice(0, 1400);
            return `${r.engine}:\n"""${excerpt || '(no text)'}"""`;
        }).join('\n\n');

        try {
            const model = getModel();
            const userPrompt = buildGeminiSentimentBatchPrompt(brandName, blocks);

            const result = await withGeminiDeadline(
                model.generateContent(userPrompt),
                '[GeminiSentiment]',
            );
            const raw = result.response?.text?.() ?? '';
            const scores = parseJsonObjectLoose(raw);
            if (!scores || typeof scores !== 'object') return;

            const engines = coalesceEnginesFromBatchJson(scores);
            for (const r of runs) {
                if (!r.brandEntity) continue;
                const payload = engines[r.engine];
                const { score, analysis } = parseEngineLLMSentimentPayload(payload);
                if (score != null) {
                    r.brandEntity.sentimentScore = score;
                    r.brandEntity.sentiment = sentimentScoreToLabel(score);
                    if (analysis) r.brandEntity.sentimentAnalysis = analysis;
                }
            }
        } catch (err) {
            console.warn('[GeminiSentiment] batch failed:', err.message);
        }
    }

    const report = async (done) => {
        if (typeof onProgress !== 'function') return;
        try {
            await Promise.resolve(onProgress({ done, total: totalJobs }));
        } catch {
            /* ignore progress handler errors */
        }
    };

    await report(0);

    let done = 0;
    for (let i = 0; i < jobs.length; i += chunkSize) {
        const chunk = jobs.slice(i, i + chunkSize);
        await Promise.all(chunk.map((runs) => processOneJob(runs)));
        done += chunk.length;
        await report(done);
    }
}

// ── Deep AI Analysis (batch) ──────────────────────────────────────────────────

export async function batchDeepAnalysis(allResults, brandName, domain, competitors) {
    const compNames = competitors.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);

    const summary = allResults.map(r => {
        const entNames = (r.entities || []).map(e => `${e.name}(${e.mentions}x,${e.sentiment})`).join(', ');
        const citDomains = [...new Set((r.citations || []).map(c => c.domain))].slice(0, 5).join(', ');
        return `Query: "${r.query}" | Engine: ${r.engine} | Brand mentioned: ${r.brandMentioned} | Entities: [${entNames}] | Citations: [${citDomains}]`;
    }).join('\n');

    const prompt = `You are an AI Visibility strategist. You will receive structured scan data for "${brandName}" (${domain}).
Competitors: ${compNames.join(', ')}

Scan results summary:
${summary}

Produce an executive brief with EXACTLY this JSON format:
{
  "overallAssessment": "1-2 sentence overall assessment of brand's AI visibility",
  "strengthAreas": ["Evidence-backed strength 1", "Evidence-backed strength 2", "Evidence-backed strength 3"],
  "weaknessAreas": ["Evidence-backed vulnerability 1", "Evidence-backed vulnerability 2", "Evidence-backed vulnerability 3"],
  "topOpportunities": [
    "Specific actionable step 1 (High impact)",
    "Specific actionable step 2 (Medium impact)",
    "Specific actionable step 3 (High impact)"
  ],
  "engineInsights": {
    "perplexity": "1 sentence on Perplexity performance",
    "gemini": "1 sentence on Gemini performance",
    "chatgpt": "1 sentence on ChatGPT performance",
    "googleAI": "1 sentence on Google AI Overviews / SERP performance"
  }
}

Return ONLY valid JSON. Make it strategic, data-driven, and highly actionable for a content team.`;

    try {
        const model = getModel();
        const result = await withGeminiDeadline(model.generateContent(prompt), '[BatchAnalysis]');
        const raw = result.response?.text?.() ?? '';
        const text = raw.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object in response');
        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        console.error('[BatchAnalysis] Failed:', err.message);
        return null;
    }
}
