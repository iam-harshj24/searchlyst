/** Default character count for inline prompt / topic previews (full text on hover via title). */
export const PROMPT_PREVIEW_MAX_CHARS = 40;

/** @deprecated use PROMPT_PREVIEW_MAX_CHARS */
export const PROMPT_PREVIEW_MAX_WORDS = PROMPT_PREVIEW_MAX_CHARS;

/**
 * @param {unknown} text
 * @param {number} [maxChars] — first N characters shown; remainder on hover
 * @returns {{ display: string, full: string, truncated: boolean }}
 */
export function promptPreview(text, maxChars = PROMPT_PREVIEW_MAX_CHARS) {
    const raw = String(text ?? '').trim();
    if (!raw) return { display: '—', full: '', truncated: false };
    const n = Math.max(1, Number(maxChars) || PROMPT_PREVIEW_MAX_CHARS);
    if (raw.length <= n) {
        return { display: raw, full: raw, truncated: false };
    }
    return {
        display: `${raw.slice(0, n)}…`,
        full: raw,
        truncated: true,
    };
}
