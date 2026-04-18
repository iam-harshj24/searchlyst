/**
 * Turn scraped / collapsed LLM HTML text into readable markdown-ish text for ReactMarkdown.
 * Fixes glued words (AnswerAnswerLinksLinks), strips duplicate nav chrome, adds paragraph breaks.
 */

function desmushGluedWords(s) {
    let out = s;
    let prev;
    do {
        prev = out;
        // Lowercase/digit/paren → uppercase word (ShareWhere → Share Where)
        out = out.replace(/([a-z0-9),;:])([A-Z])/g, '$1 $2');
        // ?Show / !Here — punctuation glued to next sentence
        out = out.replace(/([!?])([A-Z])/g, '$1 $2');
    } while (out !== prev);
    return out;
}

/** Remove repeated Answer Answer Links Links… at the start (after spaces are normalized). */
function stripDuplicateChromePrefix(s) {
    let out = s.trim();
    let prev;
    do {
        prev = out;
        out = out
            .replace(/^(Answer\s*){2,}/i, '')
            .replace(/^(Links\s*){2,}/i, '')
            .replace(/^(Images\s*){2,}/i, '')
            .replace(/^(Videos\s*){2,}/i, '')
            .replace(/^(Share\s*){2,}/i, '')
            .replace(/^(Menu\s*){2,}/i, '')
            .trim();
    } while (out !== prev);
    return out;
}

function looksLikeStructuredMarkdown(s) {
    if (/^#{1,6}\s/m.test(s)) return true;
    if (/^[-*]\s+\S/m.test(s)) return true;
    if (/^>\s/m.test(s)) return true;
    if (s.includes('\n## ') || s.includes('\n### ') || s.includes('\n- ')) return true;
    return false;
}

/**
 * @param {string} raw
 * @param {string} [_engineKey] reserved for engine-specific rules
 * @returns {string}
 */
export function formatEngineResponseForMarkdown(raw, _engineKey = '') {
    if (raw == null || typeof raw !== 'string') return '';
    let s = raw.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
    if (!s) return '';

    if (looksLikeStructuredMarkdown(s)) {
        return s.replace(/\n{3,}/g, '\n\n').trim();
    }

    s = desmushGluedWords(s);
    s = s.replace(/\s+/g, ' ').trim();
    s = stripDuplicateChromePrefix(s);

    // Single stray chrome token right at start (one "Answer" / "Links" left)
    s = s.replace(/^(Answer|Links|Images|Videos|Share|Menu)\s+(?=[A-Za-z])/i, '');

    // Common SERP / UI bridges → paragraph breaks
    s = s.replace(/\s*Show more\s*/gi, '\n\n');
    s = s.replace(/\s*(Here['\u2019]s|Here is)\s+/gi, '\n\n$1 ');
    s = s.replace(/\s*((?:Quick answer|TL;DR|Summary|Key takeaways))\s*:/gi, '\n\n**$1:**');

    // Numbered categories like "(1) review" — newline before
    s = s.replace(/\s+(\(\d+\))\s*/g, '\n\n$1 ');
    s = s.replace(/([.!?])\s*(\(\d+\))/g, '$1\n\n$2');

    // Bullet-ish "• " or "· "
    s = s.replace(/\s*[·•]\s*/g, '\n- ');

    // Split long runs: sentence end + space + capital or paren
    s = s.replace(/([.!?])\s+(?=[A-Z(])/g, '$1\n\n');

    s = s.replace(/[ \t]+/g, ' ');
    s = s.replace(/\n[ \t]+/g, '\n');
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
}
