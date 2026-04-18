/**
 * Citation / source type labels (AI Sources pie, domain tables, URL rankings).
 * Names are short and distinct for UI clarity.
 */
export function classifyDomainContentType(domain) {
    const d = String(domain || '').toLowerCase().replace(/^www\./, '');
    if (!d) return 'Other';

    if (d.endsWith('.gov') || d.includes('.gov.')) return 'Government';
    if (d.endsWith('.edu')) return 'Academic';

    if (/reddit\.|news\.ycombinator\.|stackoverflow\.|stackexchange\.|quora\.|discourse\.|forum\./.test(d)) {
        return 'Community';
    }
    if (/youtube\.|youtu\.be|tiktok\.|instagram\.|facebook\.|twitter\.|x\.com|linkedin\.|pinterest\./.test(d)) {
        return 'Social & video';
    }
    if (/wikipedia\.|wikidata\./.test(d)) return 'Reference';
    if (/medium\.|substack\.|ghost\.|wordpress\.com|blog\./.test(d)) return 'Creator & blog';
    if (
        /forbes\.|bloomberg\.|reuters\.|techcrunch\.|theverge\.|bbc\.|cnn\.|nytimes\.|wsj\.|ft\.com|economist\./.test(d)
    ) {
        return 'Editorial';
    }
    if (/github\.|gitlab\.|npmjs\.|readthedocs\.|stackoverflow\.com/.test(d)) return 'Developer resources';
    if (/amazon\.|ebay\.|shopify|etsy\.|walmart\./.test(d)) return 'Commerce';
    if (/g2\.|capterra\.|trustpilot\.|gartner\.|crunchbase\./.test(d)) return 'Reviews & listings';
    if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(d)) return 'Search portal';

    return 'Independent site';
}

export function classifyCitationRow(c) {
    if (c?.isTargetBrand) return 'Your brand';
    if (c?.isCompetitor) return 'Competitor';
    return classifyDomainContentType(c?.domain);
}
