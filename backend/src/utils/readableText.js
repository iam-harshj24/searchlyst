/**
 * Detect scraped/encoded blobs that are not human-readable answers (Google SERP JSON noise, base64-ish, etc.).
 */

export function isReadableAnswerText(s) {
    if (s == null || typeof s !== 'string') return false;
    const t = s.trim();
    if (t.length < 50) return false;

    const letters = (t.match(/[a-zA-Z\u00C0-\u024F]/g) || []).length;
    const total = t.length;
    if (letters / total < 0.28) return false;

    const spaces = (t.match(/\s/g) || []).length;
    if (spaces / total < 0.06) return false;

    // Long runs of base64 / protobuf-ish tokens
    if (/[A-Za-z0-9+/]{40,}/.test(t) && (t.match(/=/g) || []).length > 3) return false;

    // High density of odd punctuation (encoded UI state)
    const weird = (t.match(/[=<>{}[\]|\\^~`]{2,}/g) || []).length;
    if (weird > 4) return false;

    const words = t.split(/\s+/).filter(Boolean);
    if (words.length < 10) return false;

    let shortTokenNoise = 0;
    for (const w of words.slice(0, 60)) {
        if (w.length <= 4 && /[=0-9]{2,}/.test(w)) shortTokenNoise++;
        if (/^[A-Za-z0-9+=/]{6,}$/.test(w) && !/[aeiou]/i.test(w)) shortTokenNoise++;
    }
    if (shortTokenNoise > 18) return false;

    return true;
}
