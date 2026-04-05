import { marked } from 'marked';

marked.setOptions({ gfm: true });

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
    const t = stripPasteMetaNoise((text || '').trim());
    await navigator.clipboard.writeText(t);
}
