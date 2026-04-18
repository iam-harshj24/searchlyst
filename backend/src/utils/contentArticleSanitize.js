/**
 * Normalize model output: escaped newlines, trailing hashtag dumps, and comma-separated keyword blobs
 * so blog/email preview matches other long-form content (proper Markdown sections).
 */

function uniqPush(arr, val) {
    const t = String(val || '').trim();
    if (!t) return;
    const low = t.toLowerCase();
    if (arr.some((x) => String(x).toLowerCase() === low)) return;
    arr.push(t);
}

/**
 * @param {string} content
 * @param {string[]} [keywords] — mutated: hashtags / parsed keywords appended here
 * @returns {string}
 */
export function sanitizeArticleContent(content, keywords = []) {
    if (typeof content !== 'string') return '';
    let s = content
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .trim();

    const lines = s.split('\n');

    // Strip trailing blank lines first
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

    // Peel trailing lines that are only hashtags (or **Hashtags:** ...)
    let changed = true;
    while (changed && lines.length) {
        changed = false;
        const last = lines[lines.length - 1].trim();
        if (last === '') {
            lines.pop();
            changed = true;
            continue;
        }
        if (/^(#[A-Za-z0-9_-]+\s*)+$/i.test(last)) {
            const tags = last.match(/#[A-Za-z0-9_-]+/gi) || [];
            tags.forEach((tag) => uniqPush(keywords, tag.slice(1)));
            lines.pop();
            changed = true;
            continue;
        }
        const ht = last.match(/^\*\*Hashtags?:\*\*\s*(.+)$/i);
        if (ht) {
            const tags = ht[1].match(/#[A-Za-z0-9_-]+/gi) || [];
            tags.forEach((tag) => uniqPush(keywords, tag.slice(1)));
            lines.pop();
            changed = true;
            continue;
        }
    }

    s = lines.join('\n').trimEnd();

    // Trailing single line: long comma-separated list (keyword dump) → Markdown list
    const L = s.split('\n');
    if (L.length > 0) {
        const lastLine = L[L.length - 1].trim();
        const parts = lastLine.split(',').map((x) => x.trim()).filter(Boolean);
        if (
            parts.length >= 6 &&
            lastLine.includes(',') &&
            !lastLine.startsWith('#') &&
            !/^\|/.test(lastLine) &&
            parts.every((p) => p.length <= 48 && p.split(/\s+/).length <= 4)
        ) {
            const looksLikeKeywords = parts.every((p) => /^[#]?[\w.-]+$/i.test(p.replace(/^#/, '')));
            if (looksLikeKeywords) {
                parts.forEach((p) => uniqPush(keywords, p.replace(/^#/, '')));
                L.pop();
                const body = L.join('\n').trimEnd();
                const bullets = parts.map((p) => `- ${p.startsWith('#') ? p : p}`).join('\n');
                s = `${body}\n\n## Keywords\n\n${bullets}`;
            }
        }
    }

    return s.trim();
}

/**
 * @param {object} article
 * @returns {object} cloned article with cleaned content + merged suggestedKeywords
 */
export function sanitizeArticleObject(article) {
    if (!article || typeof article !== 'object') return article;
    const suggestedKeywords = Array.isArray(article.suggestedKeywords)
        ? [...article.suggestedKeywords.map((x) => String(x).trim()).filter(Boolean)]
        : [];
    const content = sanitizeArticleContent(article.content || '', suggestedKeywords);
    return {
        ...article,
        content,
        suggestedKeywords,
    };
}
