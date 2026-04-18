/** Keep in sync with backend/src/utils/contentArticleSanitize.js */

function uniqPush(arr, val) {
    const t = String(val || '').trim();
    if (!t) return;
    const low = t.toLowerCase();
    if (arr.some((x) => String(x).toLowerCase() === low)) return;
    arr.push(t);
}

export function sanitizeArticleContent(content, keywords = []) {
    if (typeof content !== 'string') return '';
    let s = content
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .trim();

    const lines = s.split('\n');
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

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
