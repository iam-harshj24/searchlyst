/**
 * One-shot visibility prompts: Answer + Citations + Sources in a single response.
 * PP1–PP3: sent to Perplexity via Infatica
 * GP1–GP3: sent to Gemini via Infatica
 * All 6 prompts produce raw text; Gemini API (direct) then converts to analytics.
 */

const year = new Date().getFullYear();
const yearMinus1 = year - 1;
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 7);

/** PP1 — Brand Visibility + Ranking (via Infatica → Perplexity) */
export function PP1_BrandVisibilityRanking(brandName, domain, industry, compStr, topCompetitor) {
    const tc = topCompetitor || compStr.split(',')[0]?.trim() || 'leading competitor';
    return `Search the web right now and answer the following. Every single claim must have an inline citation [1], [2] etc. and a full source list at the end. If you cannot cite it — do not say it.

QUERY: How visible and well-ranked is "${brandName}" (${domain}) compared to ${compStr} in the "${industry}" market as of ${year}?

ANSWER THESE SPECIFIC QUESTIONS (cite each answer):

1. Where does ${brandName} rank on G2 in the ${industry} category?
   (cite the exact G2 category page URL)

2. How many reviews does ${brandName} have on G2 and Capterra vs each competitor? (cite each review page URL)

3. Which ${industry} tools are listed in the top 3 "best ${industry} tools ${year}" articles right now? Is ${brandName} in any of them?
   (cite each article URL)

4. What is ${brandName}'s current Reddit presence in ${year}?
   Are people recommending it? (cite the Reddit threads)

5. Which brand dominates when someone searches
   "best ${industry} software ${year}"? (cite the search result source)

6. Has ${brandName} or any competitor had a major product launch,
   funding, or press coverage in the last 6 months? (cite news URLs)

RESPONSE FORMAT — return exactly this structure:

### ANSWER

${brandName} currently holds a [G2 Grid position] on G2 with [X] reviews [1],
compared to ${tc} which has [X] reviews and a Leader badge [2].
In top ranking articles for "${industry} tools ${year}", ${brandName} appears
at position [X] in [article name] [3] but is absent from [article name] [4]...

### VISIBILITY SCORECARD

| Brand | G2 Rating | G2 Reviews | G2 Position | Listed in Top Articles | Reddit Mentions | Source |
|-------|-----------|------------|-------------|------------------------|-----------------|--------|
| ${brandName} | x.x | xxx | Leader/HP/Contender | Yes/No (position) | High/Med/Low | [1] |
| [Competitor] | x.x | xxx | Leader/HP/Contender | Yes/No (position) | High/Med/Low | [2] |

### SOURCES
[1] https://g2.com/categories/... — G2 ${industry} Grid, accessed ${year}
[2] https://g2.com/products/... — ${tc} G2 profile, accessed ${year}
[3] https://... — "Best ${industry} Tools ${year}" — [Publication], [Date]
[4] https://... — "Top ${industry} Software" — [Publication], [Date]
[5] https://reddit.com/r/... — Reddit thread, [upvotes] upvotes, [Date]
[6] https://... — News/press source, [Date]

### WHAT THE SOURCES TELL US
- ${brandName}'s strongest citation: [Source URL + why it matters]
- ${brandName}'s biggest citation gap: [What competitors have that brand doesn't]
- Top competitor advantage (with proof): [Claim → Source URL]`;
}

/** PP2 — AI Search Mention Audit (via Infatica → Perplexity) */
export function PP2_AIMentionAudit(brandName, industry, compStr, topCompetitor) {
    const tc = topCompetitor || compStr.split(',')[0]?.trim() || 'leading competitor';
    const industrySubreddit = industry?.replace(/\s+/g, '').toLowerCase().slice(0, 20) || 'saas';
    return `I need to know exactly how AI search engines and review platforms describe "${brandName}" vs ${compStr} right now. Search and answer with full inline citations — every claim needs a source URL.

INDUSTRY: ${industry} | DATE: ${year}

SEARCH AND ANSWER THESE:

BLOCK A — HOW AI DESCRIBES THESE BRANDS
Search: "best ${industry} tools" and report verbatim what the top results say about each brand. Who gets mentioned first? What words are used to describe them?
→ Cite every article/page you pull this from

Search: "${brandName} vs ${tc}" and report what comparison pages say about each. Who wins? On what criteria?
→ Cite the comparison page URL

Search: "${industry} alternatives" and report which brands appear as recommended alternatives
→ Cite source URL

BLOCK B — WHAT REAL USERS SAY (REDDIT + REVIEWS)
Search "${brandName} reddit ${year}" and report:
- Which subreddits discuss it
- What the top voted comments say
- Are people recommending it or warning against it?
→ Cite the exact Reddit thread URLs

Search "${tc} reddit ${year}" — same questions
→ Cite the exact Reddit thread URLs

BLOCK C — REVIEW PLATFORM STANDING
Search "${brandName} site:g2.com" and report exact rating + review count
Search "${compStr} site:g2.com" — same for each competitor
→ Cite each G2 page URL

RETURN YOUR ANSWER IN THIS FORMAT:

---
### FULL CITED ANSWER

When asked about ${industry} tools, top-ranking articles describe ${tc} as the 'enterprise-grade solution' [1][2] while ${brandName} is typically positioned as the 'easier to use' option [3]. On Reddit, ${brandName} receives mostly positive mentions in r/${industrySubreddit} [4] but ${tc} dominates the recommendation threads with 3x more unprompted endorsements [5]...

---
### CITATION-BACKED SCORECARD

**Mention Quality per Brand** (based only on sources found):
| Brand | How AI Describes Them | Sentiment | Source Count | Top Source |
|-------|-----------------------|-----------|---------------|------------|
| ${brandName} | "quote from source" | Pos/Neg/Mix | X | [URL] |
| [Comp] | "quote from source" | Pos/Neg/Mix | X | [URL] |

---
### ALL SOURCES USED

Number every source. Include:
[1] Full URL | Domain | Content Type | Published Date | Which brand it covers
[2] Full URL | Domain | Content Type | Published Date | Which brand it covers
...

---
### GAPS — Sources you searched for but could NOT find:
List any query where you found no credible source.
These are the research blind spots.`;
}

/** PP3 — Competitive Share of Voice (via Infatica → Perplexity) */
export function PP3_ShareOfVoice(brandName, industry, compStr, topCompetitor) {
    const tc = topCompetitor || compStr.split(',')[0]?.trim() || 'leading competitor';
    return `Search the web right now. I need a Share of Voice analysis for ${brandName} vs ${compStr} in the "${industry}" market.

Every number you give me must be backed by a cited source. Do not estimate anything without evidence.

SEARCH SEQUENCE (run all of these):

1. Search "best ${industry} ${year}" — record every brand mentioned across the top 5 results. Count mentions. Cite each article.

2. Search "${industry} recommendations site:reddit.com ${year}" — record every brand mentioned in top threads. Count. Cite threads.

3. Search "${brandName} site:g2.com" — get rating + review count. Cite the G2 URL.
   Repeat for each brand in ${compStr}.

4. Search "${brandName} news OR press ${year}" — how many press mentions? Cite the news URLs.
   Repeat for top 2 competitors.

5. Search "${industry} market leader OR most popular ${year}" — which brand appears most? Cite sources.

NOW BUILD THE SOV PICTURE:

Using ONLY what you found above (not training data), calculate:

Total brand mentions found across all searches = X
${brandName} mentions = Y → SOV = Y/X × 100
[Each competitor] mentions = Z → SOV = Z/X × 100

RETURN FORMAT:

---
### SOV ANALYSIS WITH FULL CITATIONS

Across [X] sources searched, ${tc} received [X] total mentions [1][2][3][4] versus ${brandName}'s [X] mentions [5][6]. In the top-ranking 'best ${industry}' articles alone, ${tc} appeared in [X/5] articles [1][2] while ${brandName} appeared in [X/5] [5]...

---
### SOV TABLE (citation-backed only)

| Brand | Article Mentions | Reddit Mentions | G2 Reviews | Press Mentions | RAW TOTAL | SOV % | Evidence |
|-------|-----------------|-----------------|------------|----------------|-----------|-------|----------|
| ${brandName} | X [cite] | X [cite] | X [cite] | X [cite] | X | X% | [1][5][8] |
| [Comp 1] | X [cite] | X [cite] | X [cite] | X [cite] | X | X% | [2][6][9] |

SOV TOTAL must = 100% (normalize the raw totals)

---
### COMPLETE SOURCE LIST

[1] https://... | Title | Published | Brands mentioned | Relevance
[2] https://... | Title | Published | Brands mentioned | Relevance
...

---
### DATA CONFIDENCE NOTES
- High confidence data (direct URL found): list claims
- Medium confidence (inferred from partial data): list claims
- Could not verify (no source found): list claims`;
}

/** GP1 — Brand Ranking with Sourced Evidence (Gemini) */
export function GP1_BrandRankingWithEvidence(brandName, compStr, industry, topCompetitor) {
    const tc = topCompetitor || compStr.split(',')[0]?.trim() || 'leading competitor';
    return `[GOOGLE SEARCH GROUNDING: ON]
[RULE: Every claim must have an inline citation. No citation = omit the claim.]
[DATE FILTER: Only use sources from ${year} or late ${yearMinus1}]

TASK: Produce a sourced competitive ranking for "${brandName}" vs ${compStr} in the "${industry}" market.

EXECUTE THESE SEARCHES IN ORDER:

Search 1: "${industry} G2 category grid ${year}"
→ Find the G2 category page for ${industry}
→ Extract: Leader quadrant brands, High Performer brands, review counts
→ Cite: exact G2 category URL

Search 2: "${brandName} reviews g2.com"
→ Find ${brandName}'s G2 profile page
→ Extract: rating, review count, top badge earned, most cited pros/cons
→ Cite: exact G2 product URL

Search 3: "[each competitor in ${compStr}] reviews g2.com"
→ Same extraction for each competitor
→ Cite: each competitor's G2 URL

Search 4: "best ${industry} software ${year}"
→ Find the top 3 ranking articles
→ Extract: which brands are listed, what position, what reasons given
→ Cite: each article URL + author + publication date

Search 5: "${brandName} vs ${tc} comparison"
→ Find any comparison article or G2 compare page
→ Extract: who wins, on what criteria, what features differentiate
→ Cite: comparison URL

Search 6: "${industry} market share OR market leader ${year}"
→ Find any analyst or industry report data
→ Extract: market position claims with brand names
→ Cite: report URL or publication

---
COMPOSE YOUR ANSWER:

Write a competitive ranking analysis using ONLY what you found in the 6 searches above. Structure it exactly like this:

### COMPETITIVE RANKING — ${industry} Market ${year}

"${brandName} currently holds a [G2 position] on G2's ${industry} Grid with a [X.X/5] rating across [X] reviews [1]. By comparison, ${tc} holds the Leader position with [X] reviews [2], making it the most reviewed brand in the category.

In top-ranking comparison articles for '${industry} software ${year}', ${tc} appears in [X/3] articles reviewed [3][4] while ${brandName} appears in [X/3] [5]..."

---
### RANKING TABLE

| Rank | Brand | G2 Rating | G2 Reviews | G2 Badge | Article Appearances | Source |
|------|-------|-----------|------------|----------|---------------------|---------|
| 1 | [name] | x.x | xxxx | Leader | X/3 | [1][3] |
| 2 | [name] | x.x | xxx | High Performer | X/3 | [2][4] |

Ranking methodology: 50% weight → G2 review volume, 30% → G2 badge, 20% → Article appearances

---
### SOURCES

[1] [URL] — G2 ${brandName} profile — Rating: x.x — Reviews: xxx — Date accessed: ${year}
[2] [URL] — G2 ${tc} profile — Rating: x.x — Reviews: xxx — Date accessed: ${year}
[3] [URL] — "[Article title]" — [Publication] — Published: [date] — ${brandName} at position: X
[4] [URL] — "[Article title]" — [Publication] — Published: [date]
[5] [URL] — G2 ${industry} category grid — Accessed: ${year}
[6] [URL] — [Analyst/news source] — Published: [date]

---
### WHAT THE SOURCES REVEAL

Biggest advantage ${tc} has over ${brandName} (with proof):
→ [Specific finding] → [Source URL]

Biggest opportunity for ${brandName} (based on evidence):
→ [Specific finding] → [Source URL]

One thing ${brandName} does better (if found in sources):
→ [Specific finding] → [Source URL]`;
}

/** GP2 — AI Mention Quality Audit with Citations (Gemini) */
export function GP2_MentionQualityAuditWithCitations(brandName, compStr, industry, topCompetitor) {
    const tc = topCompetitor || compStr.split(',')[0]?.trim() || 'leading competitor';
    return `[GOOGLE SEARCH GROUNDING: ON]
[STRICT RULE: If a claim has no grounded source link — do not include it]

TASK: Audit how "${brandName}" is described and recommended across AI-influenced content vs ${compStr}.

INDUSTRY: ${industry} | YEAR: ${year}

SEARCH AND EXTRACT:

[S1] Search: "best ${industry} tools ${year}"
Extract from top 3 results:
- Which brands are recommended and in what order?
- What specific language is used to describe each brand?
- Is ${brandName} present? What exact position and description?
Cite: URL of each article

[S2] Search: "${brandName} vs ${tc}"
Extract from top result:
- Who wins the comparison?
- What features or reasons are cited?
- Is the comparison favorable or unfavorable to ${brandName}?
Cite: Comparison page URL

[S3] Search: "${industry} alternatives to ${tc}"
Extract:
- Is ${brandName} listed as an alternative?
- What position is it in the alternatives list?
- What reason is given for recommending it?
Cite: Article URL

[S4] Search: "${brandName} site:reddit.com ${year}"
Extract from top thread:
- What is the question being asked?
- How is ${brandName} described in top comments?
- What is the vote count on positive vs negative comments?
Cite: Reddit thread URL

[S5] Search: "${tc} site:reddit.com ${year}"
Same as S4 for competitor
Cite: Reddit thread URL

NOW ANSWER:

How well is "${brandName}" represented when buyers search for ${industry} solutions? Where does it win and where does it lose to competitors — with evidence for every claim.

RESPONSE FORMAT:

---
### MENTION QUALITY ANALYSIS — ${brandName} vs Competitors

In the top-ranking '${industry} tools' articles, ${brandName} is described as [exact description from source] [1] whereas ${tc} is called [exact description] [2]. In head-to-head comparison content, ${brandName} [wins/loses] on [specific criteria] [3]...

On Reddit, the most upvoted discussion of ${brandName} ([X] upvotes) describes it as [exact community language] [4], while ${tc}'s most-cited thread ([X] upvotes) frames it as [description] [5]...

---
### MENTION QUALITY SCORECARD

| Brand | How Top Articles Describe Them | Reddit Sentiment | Comparison Win Rate | Overall Score |
|-------|-------------------------------|-----------------|---------------------|---------------|
| ${brandName} | "exact phrase from source [1]" | Pos/Neg [4] | X/Y comparisons | X/10 |
| ${tc} | "exact phrase from source [2]" | Pos/Neg [5] | X/Y comparisons | X/10 |

---
### SOURCES USED

[1] [Full URL] | [Publication] | [Date] | Describes ${brandName} as: "[exact quote]"
[2] [Full URL] | [Publication] | [Date] | Describes ${tc} as: "[exact quote]"
[3] [Full URL] | [Publication] | [Date] | Comparison result: [winner + reason]
[4] [Full Reddit URL] | r/[subreddit] | [Date] | [X] upvotes | ${brandName} sentiment: [pos/neg]
[5] [Full Reddit URL] | r/[subreddit] | [Date] | [X] upvotes | ${tc} sentiment

---
### ACTIONABLE GAPS (evidence-backed)

Gap 1: [What's missing] → Proof: [Source showing competitor has this]
Gap 2: [What's missing] → Proof: [Source showing competitor has this]
Gap 3: [What's missing] → Proof: [Source showing competitor has this]`;
}

/** GP3 — Threat Radar with Sourced Events (Gemini) */
export function GP3_ThreatRadarWithSources(brandName, compStr, industry) {
    return `[GOOGLE SEARCH GROUNDING: ON]
[CRITICAL RULE: Only report events you find a live URL for. No URL = the event did not happen as far as this report is concerned.]

TASK: Find recent strategic moves by competitors of "${brandName}" that are backed by a real, citable source.

COMPETITORS: ${compStr}
INDUSTRY: ${industry}
SEARCH WINDOW: Last 6 months only (after ${sixMonthsAgoStr})

FOR EACH COMPETITOR — RUN THESE SEARCHES:
→ Search: "[competitor] product launch OR new feature ${year}"
→ Search: "[competitor] funding OR raised OR Series ${year}"
→ Search: "[competitor] pricing change OR free plan ${year}"
→ Search: "[competitor] acquires OR partnership ${year}"
→ Search: "[competitor] news site:techcrunch.com OR site:venturebeat.com ${year}"

FOR EACH EVENT FOUND — EXTRACT AND CITE:
- What happened (specific, not vague)
- When it happened (date from the article)
- Source URL (required — if no URL, skip this event)
- Why it matters to ${brandName} specifically
- Confidence: High (named publication) / Medium (blog/community post)

RESPONSE FORMAT:

---
### THREAT RADAR — ${year}

"${compStr.split(',')[0]?.trim() || 'Competitor'} launched [specific feature/product] in [month] [1], directly targeting [buyer segment] — the same segment ${brandName} serves. This is significant because [specific impact]..."

---
### THREAT TABLE

| Competitor | Move | Date | Impact | Source | Action for ${brandName} |
|------------|------|------|--------|--------|------------------------|
| [name] | [specific event] | [date] | High/Med/Low | [URL] [1] | [executable action] |

---
### SOURCES

[1] [Full URL] | [Publication name] | [Published date] | [What the article covers]
[2] [Full URL] | [Publication name] | [Published date] | [What the article covers]

---
### NOT FOUND (important)
Competitors where no verifiable news was found in last 6 months:
- [Competitor name]: searched X queries, no citable events found
  → Recommendation: monitor quarterly

---
### RISK ASSESSMENT (based only on sourced events above)

Highest threat to ${brandName} right now:
→ [Event] → Why: [specific reason] → Source: [URL]

Biggest opportunity from competitor weakness:
→ [Finding] → Source: [URL]`;
}
