function buildBrandHubBlock({ brandHubContext, safeBrand, safeDomain }) {
    return brandHubContext?.trim()
        ? `
BRAND HUB — SUPPLIED CONTEXT (mandatory to use when relevant; cite inline):
${brandHubContext.trim()}

CITATION RULE: Whenever you use a fact, tone rule, or claim from the block above, add an inline citation such as:
[Source: Brand Hub — Social] / [Source: Brand Hub — AI Visibility] / [Source: Brand Hub — Custom Inbox] / [Source: Brand Hub — Profile]
matching the slice of context you used. Do not invent data not present in the topic or this block.
`
        : `
BRAND HUB: No Social / AI Visibility / Custom Inbox text was attached to this request.
Still ground brand-specific statements in the provided topic and brand fields, and cite: [Source: Brand Hub — Profile — ${safeBrand} (${safeDomain})] when stating positioning or offerings.
`;
}

/** Blog + newsletter: Markdown in "content", FAQ + discoverability inside body (AEO/GEO). */
function buildMasterLongform({ brandHubContext, safeBrand, safeDomain, safeIndustry }) {
    const hubBlock = buildBrandHubBlock({ brandHubContext, safeBrand, safeDomain });
    return `
=== MASTER (LONG-FORM — Blog / Email newsletter) ===
ROLE: You are an Expert AI Content Strategist. You optimize for AI search (AEO/GEO) and treat Brand Hub knowledge as authoritative when provided.

${hubBlock}

FORMATTING — "content" field:
- Use GitHub-flavored Markdown: **bold**, *italics*, ## / ### headings, lists, blockquotes, --- where helpful for CMS paste (WordPress, Notion, etc.).

STRUCTURE:
- Introduction, actionable takeaways (align JSON keyTakeaways), conclusion with CTA.

MANDATORY IN "content" MARKDOWN:
- Before ## FAQ, include heading exactly: ### AI search & discoverability notes with 3–5 qualitative bullets (no fake numeric engine scores).
- End with heading exactly: ## FAQ and 3–5 Q&As; mirror the same pairs in JSON "faq".

=== END MASTER ===
CONTEXT: Industry ${safeIndustry}. Brand ${safeBrand}. Domain ${safeDomain}.
`;
}

/** Social / Reddit: plain paste-ready "content" — no markdown; SEO signals in JSON only. */
function buildMasterSocial({ brandHubContext, safeBrand, safeDomain, safeIndustry }) {
    const hubBlock = buildBrandHubBlock({ brandHubContext, safeBrand, safeDomain });
    return `
=== MASTER (SOCIAL — paste-ready plain text) ===
ROLE: Expert content strategist for social and community platforms. Optimize for AEO/GEO without exposing markup to the reader.

${hubBlock}

CRITICAL — JSON "content" STRING (what the user copies and pastes):
- Must be plain text ONLY: real line breaks, normal punctuation, optional • or numbered "1." lists, emojis only if native to that platform.
- FORBIDDEN inside "content": markdown (** # ### * _ \` ), HTML, code fences, labels like "SECTION 1", "Tweet 3/12", character counts like "[243 chars]", "Best time to post", strategy decks, scores, JSON fragments, triple dashes as section dividers, "### AI search", "## FAQ", or any FAQ text.
- Write for AEO/GEO using plain language: definitional opening sentences, entity names (${safeBrand}, ${safeDomain}), quotable standalone lines, stats with (Source: Organization, Year) in parentheses — never markdown bold.

STRUCTURED DATA (NOT inside pasted "content"):
- Put 3–5 Q&A pairs ONLY in JSON "faq" (natural questions people ask AI/search).
- Put 3–5 qualitative discoverability bullets ONLY in JSON "discoverabilityNotes" (array of strings). No numeric fake rankings.

=== END MASTER ===
CONTEXT: Industry ${safeIndustry}. Brand ${safeBrand}. Domain ${safeDomain}.
`;
}

export function getPromptForPlatform({ platform, topic, brandName, industry, domain, keywords, brandHubContext }) {
    const safeTopic = topic || 'General industry topics';
    const safeBrand = brandName || 'Our Brand';
    const safeDomain = domain || 'ourwebsite.com';
    const safeIndustry = industry || 'our industry';
    const safeKeywords = keywords ? `\nTarget Keywords: ${keywords}` : '';
    const currentYear = new Date().getFullYear();
    const todayLong = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const MASTER_LONG = buildMasterLongform({ brandHubContext, safeBrand, safeDomain, safeIndustry });
    const MASTER_SOCIAL = buildMasterSocial({ brandHubContext, safeBrand, safeDomain, safeIndustry });

    const JSON_OUTPUT_LONGFORM = `
---
TODAY'S DATE (recency): ${todayLong}. Use ${currentYear} / "this year" for timely framing unless historical.
CRITICAL: Return ONE JSON object only. No text outside JSON.

{
    "title": "Title or subject line",
    "metaDescription": "150-160 character summary",
    "keyTakeaways": ["3-7 bullets aligned with the piece"],
    "content": "FULL MARKDOWN: intro, body with ##/### headings, ### AI search & discoverability notes (3-5 qualitative bullets, no fake scores), ## FAQ (3-5 Q&As), CTA. Escape newlines as \\\\n in JSON.",
    "faq": [{"q": "Question", "a": "Answer"}],
    "sources": [{"name": "Source Name", "description": "What it covers"}],
    "suggestedKeywords": ["keyword1", "keyword2"],
    "wordCount": 0,
    "readingTime": "1 min"
}

STRICT: "faq" 3-5 items matching ## FAQ in "content". "content" must include ### AI search & discoverability notes and ## FAQ. Do not append META SECTIONs, scores, or posting-time notes after the article inside "content".
`;

    const JSON_OUTPUT_SOCIAL = `
---
TODAY'S DATE (recency): ${todayLong}. Use ${currentYear} for timely framing unless historical.
CRITICAL: Return ONE JSON object only. No text outside JSON.

{
    "title": "Short label (e.g. thread hook idea)",
    "metaDescription": "150-160 character summary for previews",
    "keyTakeaways": ["3-7 bullets summarizing the post"],
    "content": "SINGLE plain-text string: the EXACT text the user pastes into the app. No markdown. No FAQ here. No strategy notes or scores.",
    "faq": [{"q": "Natural question", "a": "Direct answer"}],
    "sources": [{"name": "Source Name", "description": "Brief"}],
    "suggestedKeywords": ["keyword1", "keyword2"],
    "discoverabilityNotes": ["3-5 qualitative AEO/GEO signals for this piece — not shown in the post"],
    "wordCount": 0,
    "readingTime": "1 min"
}

STRICT: "content" is plain UTF-8 only (no ** # \` HTML). "faq" and "discoverabilityNotes" must each have 3-5 items. Never put FAQ or discoverability headings inside "content".
`;

    // 1. Email Newsletter
    if (platform === 'Email Newsletter') {
        return `${MASTER_LONG}
You are an expert content strategist, SEO specialist, and email newsletter writer who deeply understands Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO). Your job is to create a comprehensive, authoritative, and citation-worthy email newsletter post on the following topic:

TOPIC: ${safeTopic}
TARGET AUDIENCE: Subscribers, industry professionals, and potential customers of ${safeBrand}
INDUSTRY/NICHE: ${safeIndustry}
NEWSLETTER NAME: The ${safeBrand} Newsletter
TONE: Professional but Conversational Expert${safeKeywords}

---

## CONTENT GOALS:
1. This content must be structured so AI engines (ChatGPT, Perplexity, Google SGE/AI Overviews, Gemini, Copilot) can easily parse, cite, and reference it.
2. It must rank and get pulled into AI-generated answers.
3. It must provide genuine value for email subscribers.
4. It must establish ${safeBrand} as a topical authority.

---

## CONTENT STRUCTURE — Generate the full post using this EXACT framework:

### 1. SUBJECT LINE OPTIONS (Give 5)
- Create 5 email subject lines that are curiosity-driven, specific, and under 60 characters.
- At least 2 should be question-based (AEO-friendly).
- At least 1 should contain a number/statistic.

### 2. PREVIEW TEXT (Give 3 options)
- 90-140 characters each.
- Complements the subject line without repeating it.

### 3. HOOK / OPENING PARAGRAPH
- Start with a bold, definitive statement OR a surprising statistic OR a direct answer to the core question the topic addresses.
- This paragraph must work as a standalone "featured snippet" — meaning if an AI pulled ONLY this paragraph, it would still fully answer the user's core query.
- Keep it to 40-60 words.
- Use the "Definition-First" pattern: "[Topic] is..." or "The [concept] refers to..."

### 4. CONTEXT / WHY THIS MATTERS NOW
- 2-3 short paragraphs explaining why this topic is relevant right now.
- Include at least ONE real or realistic statistic with a cited source format: (Source: [Name, Year]).
- Include at least ONE quote from a known expert or authority figure (real or attributed style).
- Tie it to a current trend, recent event, or emerging shift.
- Write in a way that AI engines would consider "freshness signals."

### 5. MAIN BODY — THE DEEP DIVE
Structure this section using ALL of the following GEO-optimized patterns:

#### A. NUMBERED LIST OR STEP-BY-STEP BREAKDOWN
- Break the core content into 5-9 clearly numbered points, steps, strategies, or principles.
- Each point must have:
  - A bold heading (concise, keyword-rich)
  - A 2-4 sentence explanation
  - At least 3 points should include a "Quotable Line" — a single sentence that is self-contained, insightful, and designed to be cited by AI engines verbatim.
  
#### B. COMPARISON OR CONTRAST ELEMENT
- Include a "X vs Y" or "Before vs After" or "Old Way vs New Way" mini-section.
- Format as a simple table or side-by-side comparison.
- This triggers AI engines to pull structured comparative data.

#### C. DATA/STATISTICS BOX
- Create a callout box section titled "Key Data Points" or "By The Numbers"
- Include 4-6 bullet points with specific statistics, percentages, or metrics related to the topic.
- Each must have a source attribution (Source: [Name/Org, Year]).
- These act as "citation magnets" for AI engines.

#### D. EXPERT INSIGHT / ORIGINAL PERSPECTIVE
- Include 1-2 paragraphs of original analysis or a unique framework/model.
- Give the framework a NAME (e.g., "The 3-Layer Authority Model" or "The Relevance Flywheel").
- This creates a "branded concept" that AI engines may cite directly.
- Use phrases like: "According to ${safeBrand}..." or "A framework proposed by ${safeBrand}..."

#### E. PRACTICAL EXAMPLES / CASE STUDY SNIPPET
- Include 1-2 real-world or realistic examples showing the concept in action.
- Format: "[Company/Person] did [specific thing] and achieved [specific result]."
- Concrete examples increase citation probability by 40%+ in GEO.

### 6. COMMON MISTAKES / MYTHS SECTION
- Title: "Common Mistakes" or "Myths vs. Reality" or "What Most People Get Wrong About [Topic]"
- Include 3-5 myths or mistakes.
- Format each as:
  - ❌ Myth/Mistake: "[wrong belief]"
  - ✅ Reality/Fix: "[correct information in 1-2 sentences]"
- This directly feeds AI engines' "People Also Ask" and correction-based responses.

### 7. FAQ SECTION (Critical for AEO)
Generate **between 3 and 5** FAQs only (Master System Prompt — same set must appear in JSON "faq"). Following these rules:
- Each question must be written in natural, conversational language — exactly how a real person would ask Google or an AI assistant.
- Questions should cover:
  - 2 basic/beginner questions ("What is...?", "How does... work?")
  - 2 intermediate questions ("How do you...?", "What are the best...?")
  - 2 advanced/strategic questions ("What's the difference between...?", "How to measure...?")
  - 1-2 "myth-busting" questions ("Is it true that...?", "Does... really work?")
  - 1 future-focused question ("What will... look like in 2025/2026?")
- Each answer must:
  - Start with a direct, concise answer in the FIRST sentence (no fluff, no "Great question!")
  - Be 40-80 words total
  - Be self-contained (makes sense without reading the rest of the article)
  - Include specific details, numbers, or examples where possible
  - End with an actionable insight or forward-looking statement when appropriate

Format each FAQ as:

**Q: [Full question in natural language]?**
A: [Direct answer starting with the key information...]

### 8. KEY TAKEAWAYS / TL;DR BOX
- Title: "Key Takeaways" or "TL;DR"
- 5-7 bullet points summarizing the most important insights.
- Each bullet should be a complete, self-contained statement.
- Write these as if each bullet could be independently quoted by an AI engine.
- Use strong, declarative language.

### 9. ACTIONABLE CTA (Call to Action)
- Provide 2 CTA options:
  - One for engagement (reply, share, comment)
  - One for conversion (visit ${safeDomain}, sign up, try a tool)
- Keep CTAs conversational and value-driven, not salesy.

### 10. RECOMMENDED RESOURCES / FURTHER READING
- Suggest 3-5 related topics, tools, books, or resources.
- Format: "[Resource Name] — [One-line description of why it's relevant]"

---

## WRITING STYLE RULES (Apply to ALL sections):
1. **Clarity over cleverness.** Write at an 8th-grade reading level. Use simple sentence structures.
2. **Front-load answers.** Every section and paragraph should lead with the key point, then elaborate.
3. **Use semantic keywords naturally.** Include related terms, synonyms, and LSI keywords throughout.
4. **Write quotable sentences.** At least 10 sentences across the entire piece should be designed as "pull quotes".
5. **Use specific numbers over vague claims.** Say "67% of marketers" not "most marketers."
6. **Include entity references.** Mention known brands, tools, people, and organizations.
7. **Use structured formatting.** Headers, sub-headers, bold text, bullet points, numbered lists, tables.
8. **Source attribution style.** Use "(Source: [Organization/Study Name, Year])" format for all statistics and claims.
9. **Recency signals.** Reference current year (${currentYear}), recent developments, etc.

---

## OUTPUT FORMAT:
Deliver the complete newsletter with all sections above inside the JSON "content" field as Markdown only.
Do NOT append any META SECTION, scores, posting times, or strategy notes after the newsletter — nothing after the final resources/CTA inside "content". Put keywords only in JSON "suggestedKeywords".

${JSON_OUTPUT_LONGFORM}
`;
    }

    // 2. LinkedIn Post
    if (platform === 'LinkedIn Post') {
        return `${MASTER_SOCIAL}
You are a LinkedIn content strategist and AEO/GEO optimization expert. Create a high-performing LinkedIn post that is structured for maximum engagement, AI citability, and authority building.

TOPIC: ${safeTopic}
AUTHOR NAME/TITLE: Representative from ${safeBrand}
INDUSTRY: ${safeIndustry}
TARGET AUDIENCE: Professionals, decision-makers, and industry peers
TONE: Thought Leader / Conversational Expert${safeKeywords}
GOAL: Establish Authority and Community Building

---

## LINKEDIN — PLAIN-TEXT POST (inside JSON "content" only)

Build ONE finished post the user can paste into LinkedIn as-is:
- Opening: first line = powerful standalone sentence (max ~15 words), blank line, then 1-2 short lines of tension or context.
- Next: why this matters now (plain sentences, optional stat with (Source: Name, Year)).
- Core: 5-7 short blocks separated by blank lines. Use lines starting with "1." "2." or bullet "•" — no markdown asterisks or hashes.
- Include one "Here's what most people miss:" paragraph (plain text).
- TL;DR: 3-5 lines starting with • 
- End with ONE clear CTA (question or action).
- Optional: last line can be 3-5 real LinkedIn hashtags as plain words with # (e.g. #Leadership) — no markdown.

Do NOT include: multiple hook options, "SECTION" labels, best-time-to-post, first-comment strategy, scores, FAQ, or discoverability headings in "content".

${JSON_OUTPUT_SOCIAL}
`;
    }

    // 3. X / Twitter Thread
    if (platform === 'X / Twitter Thread') {
        return `${MASTER_SOCIAL}
You are a Twitter/X thread strategist and AEO/GEO optimization expert. Create a high-performing thread that goes viral through value density, shareability, and AI-citable structure.

TOPIC: ${safeTopic}
AUTHOR/HANDLE: @${safeBrand.replace(/\s+/g, '')}
NICHE: ${safeIndustry}
TARGET AUDIENCE: Industry professionals interested in ${safeTopic}
TONE: Sharp & Direct / Data-Driven
THREAD LENGTH: 10-15 tweets${safeKeywords}

---

## X / TWITTER THREAD — PLAIN TEXT (inside JSON "content" only)

Write 10-15 tweets as ONE plain string: each tweet on its own, separated by a blank line (double newline).
- Tweet 1: scroll-stopping hook; you may end with 🧵
- Tweet 2: context + credibility + one concrete number or timeframe
- Middle tweets: each must stand alone, max ~270 characters per tweet (count yourself; do not print character counts in the text).
- Include numbered ideas like "3/12 — insight here" using plain numbers and dashes, not brackets metadata.
- Include TL;DR tweet and one CTA tweet and one question tweet.
- Stats as (Source: Name, Year) in plain parens.

Do NOT print [243 chars], [1/15] style metadata lines, posting times, strategies, scores, FAQ, or markdown in "content".

${JSON_OUTPUT_SOCIAL}
`;
    }

    // 4. Instagram Caption
    if (platform === 'Instagram Caption') {
        return `${MASTER_SOCIAL}
You are an Instagram content strategist and AEO/GEO optimization expert. Create a high-performing Instagram caption that drives engagement, saves, shares, and is optimized for AI discoverability and citation.

TOPIC: ${safeTopic}
ACCOUNT NAME: @${safeBrand.replace(/\s+/g, '')}
NICHE: ${safeIndustry}
TONE: Bold & Direct / Educational${safeKeywords}

---

## INSTAGRAM CAPTION — PLAIN TEXT (inside JSON "content" only)

ONE paste-ready caption:
- Line 1: hook before "more" (max ~100 characters, no emoji on line 1).
- Short lines and blank lines for mobile; 3-6 emojis total in the caption body.
- Core value: numbered mini-list or Problem → Insight → Action in plain sentences.
- One save-worthy one-liner.
- ONE CTA (save, share, or comment).
- Final line(s): 15-25 real Instagram hashtags as #word tokens (plain text), space-separated — no markdown, no section headers.

Do NOT add suggested visual, alt text, first comment, story ideas, scores, FAQ, or "###" headings in "content".

${JSON_OUTPUT_SOCIAL}
`;
    }

    // 5. Reddit / Quora
    if (platform === 'Reddit / Quora') {
        return `${MASTER_SOCIAL}
You are a Reddit/Quora content strategist and AEO/GEO optimization expert. Create a high-value, authentic response/post that earns upvotes, builds credibility, provides genuine value, and is optimized to be cited by AI engines pulling from Reddit/Quora content.

TOPIC: ${safeTopic}
PERSONA: Industry professional in ${safeIndustry} at ${safeBrand}
TONE: Helpful Expert / Honest Practitioner${safeKeywords}
GOAL: Genuine Community Help & Authority Building

---

## REDDIT / QUORA — PLAIN TEXT (inside JSON "content" only)

Write ONE answer/post as plain text (no markdown ** # or backticks):
- Open with soft credibility + immediate direct answer: "The short answer is … Here's why:"
- 3-5 numbered points (1. 2. 3.) with short titles in plain words, then explanation.
- Golden paragraph: your sharpest original take.
- Tools/resources in plain sentences; mention ${safeDomain} only if natural (no hard sell).
- Close warmly; offer to go deeper. 0-2 emojis max.

Do not include suggested subreddit lists, scores, FAQ blocks, "###" headings, or strategy notes in "content". Put subreddit ideas only in JSON "sources" or "discoverabilityNotes" if needed as plain strings.

${JSON_OUTPUT_SOCIAL}
`;
    }

    // 6. Default (Blog / Article)
    return `${MASTER_LONG}
ROLE: You are an expert content strategist who creates comprehensive articles that AI search engines love to cite.

TASK: Write an authoritative article about: "${safeTopic}"

CONTEXT:
- Brand: ${safeBrand} (${safeDomain})
- Industry: ${safeIndustry}
- Target Platform: Blog / Article${safeKeywords}

ARTICLE REQUIREMENTS:
1. Write 1000-1500 words of high-quality, factual content optimized for Answer Engine Optimization (AEO).
2. Use rich Markdown: **bold**, *italics*, ## / ### headings, lists, blockquotes — optimized for copy-paste into CMS tools.
3. Include specific data points, statistics, and examples.
4. Structure with clear H2 and H3 headings for scanability.
5. Add inline citations in [Source: Name] or [Source: Brand Hub — …] format throughout.
6. Include a **Key Takeaways** bulleted list near the top (after a short introduction).
7. Before the FAQ, include ### AI search & discoverability notes (Master rules).
8. Include ## FAQ with **3 to 5** questions at the end (natural language queries); mirror in JSON "faq".
9. Include a clear conclusion with CTA, then a **Sources & References** list at the very bottom.
10. Optimize for E-E-A-T.

${JSON_OUTPUT_LONGFORM}
`;
}
