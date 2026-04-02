/**
 * Coarse content-type bucket for citation URLs / domains (AI Sources pie + tables).
 */
export function classifyDomainContentType(domain) {
    const d = String(domain || '').toLowerCase().replace(/^www\./, '');
    if (!d) return 'Unknown';

    if (d.endsWith('.gov') || d.includes('.gov.')) return 'Government';
    if (d.endsWith('.edu')) return 'Education';

    if (/reddit\.|news\.ycombinator\.|stackoverflow\.|stackexchange\.|quora\.|discourse\.|forum\./.test(d)) {
        return 'Forum & community';
    }
    if (/youtube\.|youtu\.be|tiktok\.|instagram\.|facebook\.|twitter\.|x\.com|linkedin\.|pinterest\./.test(d)) {
        return 'Social & video';
    }
    if (/wikipedia\.|wikidata\./.test(d)) return 'Reference';
    if (/medium\.|substack\.|ghost\.|wordpress\.com|blog\./.test(d)) return 'Blog & newsletter';
    if (
        /forbes\.|bloomberg\.|reuters\.|techcrunch\.|theverge\.|bbc\.|cnn\.|nytimes\.|wsj\.|ft\.com|economist\./.test(d)
    ) {
        return 'News & media';
    }
    if (/github\.|gitlab\.|npmjs\.|readthedocs\.|stackoverflow\.com/.test(d)) return 'Technical & docs';
    if (/amazon\.|ebay\.|shopify|etsy\.|walmart\./.test(d)) return 'Marketplace & commerce';
    if (/g2\.|capterra\.|trustpilot\.|gartner\.|crunchbase\./.test(d)) return 'Reviews & directories';
    if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(d)) return 'Search & portal';

    return 'General web';
}

export function classifyCitationRow(c) {
    if (c?.isTargetBrand) return 'Your brand / owned';
    if (c?.isCompetitor) return 'Competitor domain';
    return classifyDomainContentType(c?.domain);
}
