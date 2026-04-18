import { marked } from 'marked';

marked.setOptions({ gfm: true });

/**
 * Per-platform markdown cleanup before converting to plain text for paste.
 * Strips internal AEO blocks where users post only the human-facing copy on social.
 * @param {string} md
 * @param {string} [platformId] — blog | newsletter | linkedin | twitter | instagram | reddit
 */
export function formatMarkdownForPasteByPlatform(md, platformId = '') {
    if (!md || typeof md !== 'string') return '';
    const id = platformId || '';
    let s = md;

    // Social handles: post body only — no AEO appendix, no FAQ block
    if (['reddit', 'linkedin', 'twitter', 'instagram'].includes(id)) {
        s = (s.split(/\n###\s*AI search & discoverability notes\b/i)[0] || s).trim();
        s = (s.split(/\n##\s*FAQ\b/i)[0] || s).trim();
    } else if (id === 'newsletter') {
        s = s.replace(/\n###\s*AI search & discoverability notes\b[\s\S]*?(?=\n##\s*FAQ\b|\z)/i, '\n').trim();
    } else if (id === 'blog') {
        s = s.replace(
            /\n###\s*AI search & discoverability notes\b[\s\S]*?(?=\n##\s*FAQ\b|\n## [^#]|\z)/i,
            '\n',
        ).trim();
    }

    // Remove ## Hashtags / ## Keywords appendix sections
    s = s.replace(/\n##\s*Hashtags\b[\s\S]*?(?=\n##[^#]|\n###\s|[\r\n]*\z)/gi, '\n');
    s = s.replace(/\n##\s*Keywords\b[\s\S]*?(?=\n##[^#]|\n###\s|[\r\n]*\z)/gi, '\n');

    // Drop lines that are only #tokens (not markdown headings ##)
    s = s
        .split('\n')
        .filter((line) => {
            const t = line.trim();
            if (!t) return true;
            if (t.startsWith('##')) return true;
            if (/^(#[\w\u00C0-\u024F-]+\s*)+$/i.test(t)) return false;
            if (/^\*\*Hashtags:\*\*/i.test(t)) return false;
            return true;
        })
        .join('\n');

    // Trailing *Keywords:* comma lines (export footer)
    s = s.replace(/\n\*Keywords:\*[^\n]*$/gim, '');
    s = s.replace(/\n\*Keywords:\*\*[^\n]*$/gim, '');

    return s.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Full pipeline: markdown export → platform cleanup → plain text for native apps (no .md file).
 */
export function markdownToReadyPostPlain(md, platformId = '') {
    const formatted = formatMarkdownForPasteByPlatform(md, platformId);
    return stripSocialPasteArtifacts(markdownToPlainClean(formatted));
}

/** Drop lines that are only social-style hashtags (paste-friendly plain text). */
function stripHashtagOnlyLines(plain) {
    return plain
        .split('\n')
        .filter((line) => {
            const t = line.trim();
            if (!t) return true;
            if (/^(#[\w]+\s*)+$/i.test(t)) return false;
            return true;
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');
}

/** Remove common "strategy deck" lines models add after the real post. */
export function stripPasteMetaNoise(plain) {
    if (!plain) return '';
    return plain
        .split('\n')
        .filter((line) => {
            const t = line.trim();
            if (!t) return true;
            const lower = t.toLowerCase();
            if (/^\[?\d+\s*chars?\]?$/i.test(t)) return false;
            if (/^best\s+time\s+to\s+post/i.test(t)) return false;
            if (/^best\s+posting\s+time/i.test(t)) return false;
            if (/^first\s+comment\s+strategy/i.test(t)) return false;
            if (/^ai\s+citability\s+score/i.test(t)) return false;
            if (/^ai\s+citation\s+probability/i.test(t)) return false;
            if (/^thread\s+companion/i.test(t)) return false;
            if (/^meta\s+section/i.test(lower)) return false;
            if (/^suggested\s+visual/i.test(lower)) return false;
            if (/^alt[- ]?text/i.test(lower)) return false;
            if (/^story\s+companion/i.test(lower)) return false;
            if (/^schema\s+markup/i.test(lower)) return false;
            return true;
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Final pass for social copy: remove internal citation brackets and tighten whitespace
 * so pasted text matches what users expect in native apps.
 */
export function stripSocialPasteArtifacts(plain) {
    let s = stripPasteMetaNoise(plain || '');
    s = s.replace(/\s*\[Source:\s*[^\]\r\n]+\]/gi, '');
    s = s.replace(/\n{3,}/g, '\n\n');
    s = s
        .split('\n')
        .map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
        .join('\n');
    return s.trim();
}

export function markdownToPlainClean(md) {
    const body = marked.parse(md || '', { async: false });
    const div = document.createElement('div');
    div.innerHTML = body;
    const plain = div.innerText || div.textContent || '';
    return stripHashtagOnlyLines(stripPasteMetaNoise(plain)).trim();
}

function markdownToHtmlDocument(md) {
    const body = marked.parse(md || '', { async: false });
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
}

/**
 * Rich clipboard for CMS / Word / email clients.
 */
export async function copyMarkdownToClipboard(markdown) {
    const html = markdownToHtmlDocument(markdown);
    const plain = markdownToPlainClean(markdown) || (markdown || '').trim();

    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([plain], { type: 'text/plain' }),
                }),
            ]);
            return;
        } catch {
            /* fall through */
        }
    }
    await navigator.clipboard.writeText(plain);
}

/** Social / plain-only paste (no HTML) — safest for LinkedIn, X, Instagram. */
export async function copyPlainTextToClipboard(text) {
    const t = stripSocialPasteArtifacts((text || '').trim());
    await navigator.clipboard.writeText(t);
}
