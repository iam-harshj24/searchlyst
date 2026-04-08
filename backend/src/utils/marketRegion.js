/**
 * Normalize up to 3 tracking market labels from API / project settings.
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeTrackingLocations(raw) {
    if (!raw) return [];
    let arr = raw;
    if (typeof raw === 'string') {
        try {
            arr = JSON.parse(raw);
        } catch {
            arr = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        }
    }
    if (!Array.isArray(arr)) return [];
    return arr
        .map((x) => String(x ?? '').trim())
        .filter(Boolean)
        .slice(0, 3);
}

/**
 * Best-effort ISO2 country for Infatica when the client did not send `country`.
 * @param {string[]} markets
 * @param {string} [fallbackLocation]
 * @returns {string}
 */
export function inferCountryFromMarkets(markets, fallbackLocation = '') {
    const blob = `${(markets || []).join(' ')} ${fallbackLocation || ''}`.toLowerCase();
    if (!blob.trim()) return '';
    if (/\bindia\b|\bbangalore\b|\bmumbai\b|\bdelhi\b|\bchennai\b|\bhyderabad\b|\bbengaluru\b/.test(blob)) return 'IN';
    if (/\bunited kingdom\b|\buk\b|\blondon\b|\bengland\b|\bscotland\b|\bwales\b/.test(blob)) return 'GB';
    if (/\bgermany\b|\bberlin\b|\bmunich\b|\bdeutsch/.test(blob)) return 'DE';
    if (/\bfrance\b|\bparis\b/.test(blob)) return 'FR';
    if (/\baustralia\b|\bsydney\b|\bmelbourne\b/.test(blob)) return 'AU';
    if (/\bcanada\b|\btoronto\b|\bvancouver\b/.test(blob)) return 'CA';
    if (/\bjapan\b|\btokyo\b|\bosaka\b/.test(blob)) return 'JP';
    if (/\bbrazil\b|\bsão paulo\b|\bsao paulo\b/.test(blob)) return 'BR';
    if (/\bsingapore\b/.test(blob)) return 'SG';
    if (/\bunited states\b|\busa\b|\bus\b|\bnyc\b|\bnew york\b|\bchicago\b|\bhouston\b|\btx\b|\bca\b|\bfl\b/.test(blob)) return 'US';
    return '';
}
