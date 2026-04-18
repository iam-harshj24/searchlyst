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

OUTPUT HYGIENE (critical for Blog and Email):
- Never end "content" with a bare comma-separated keyword run (e.g. foo, bar, baz, ...). Use ## Keywords or ## Tags with Markdown bullets, or put terms only in JSON "suggestedKeywords" as plain strings without #.
- Never use a body line that is only hashtags (#a #b #c). Put hashtags in "suggestedKeywords" OR under "## Hashtags" as bullets "- #tag".
- For email newsletters: put subject line options under "## Subject line options" as a numbered Markdown list (1. ... 2. ...), never one comma-separated line.
- Use real ## / ### headings and "- " bullets; avoid CSV-style lists in the narrative body.

EMAIL + REDDIT / QUORA — PASTE-READY (must follow for those platforms):
- Do NOT use #hashtags anywhere inside JSON "content" (no "#marketing", no trailing hashtag lines). Put discoverability terms only in JSON "suggestedKeywords" as plain words without #.
- Do NOT output comma-separated subject lines, preview lines, or keyword blobs on a single line. Always use numbered lists or separate lines.
- Do NOT add a "## Hashtags" or "### Hashtags" block in "content" for Email or Reddit/Quora.
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
- In the Markdown "content", render these ONLY under "## Subject line options" as a numbered list with five lines: "1. ..." through "5. ..." (one subject per line). Never put all subjects on one line separated by commas.

### 2. PREVIEW TEXT (Give 3 options)
- Under "## Preview text options" use a numbered list "1." "2." "3." — one line each (90-140 characters). Never comma-separated on one line.

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

    // 2. LinkedIn Post — same JSON + Markdown contract as Blog (Preview / Markdown / CMS copy)
    if (platform === 'LinkedIn Post') {
        return `${MASTER_LONG}
You are a LinkedIn content strategist and AEO/GEO expert. Produce one piece in the **same output contract as a Blog Article**: full Markdown in JSON "content", JSON "faq" mirrored from ## FAQ in that Markdown, plus ### AI search & discoverability notes before ## FAQ.

TOPIC: ${safeTopic}
AUTHOR: Representative from ${safeBrand}
INDUSTRY: ${safeIndustry}
AUDIENCE: Professionals and decision-makers
TONE: Thought leader, conversational expert${safeKeywords}

---

## LINKEDIN — MARKDOWN inside JSON "content" (like Blog)

Structure the Markdown for LinkedIn paste (user copies from Preview or Markdown tab like blog):
- Opening: powerful **first paragraph** (hook), then ## Why this matters now with short paragraphs and (Source: Name, Year) where you use stats.
- ## Core insights: use **bold** subheads, numbered or bullet lists, one blockquote if it helps.
- ## What most people miss — short section.
- ## TL;DR — bullet list.
- ## Call to action — question or next step.
- Optional final line: **Hashtags:** #Industry #Leadership (3–6 relevant tags).
- Early in the piece include a **Key takeaways** bullet list (align with JSON keyTakeaways).
- Use [Source: Brand Hub — …] when using Brand Hub facts; same Master rules as blog.

Then include ### AI search & discoverability notes and ## FAQ (3–5 Q&As) exactly as required by the Master block above.

${JSON_OUTPUT_LONGFORM}
`;
    }

    // 3. X / Twitter Thread — same contract; thread as Markdown sections
    if (platform === 'X / Twitter Thread') {
        return `${MASTER_LONG}
You are a Twitter/X thread strategist and AEO/GEO expert. Same JSON + Markdown contract as **Blog Article**: one JSON object; "content" is full GFM Markdown including ### AI search & discoverability notes and ## FAQ.

TOPIC: ${safeTopic}
HANDLE: @${safeBrand.replace(/\s+/g, '')}
NICHE: ${safeIndustry}
TONE: Sharp, direct, data-friendly${safeKeywords}

---

## X / TWITTER THREAD — MARKDOWN inside JSON "content"

- Start with a short intro line, then use **10–15 sections** headed ## Tweet 1, ## Tweet 2, … (or ## 1 — Hook, ## 2 — …).
- Under each heading, one paragraph = that tweet’s text (~260–280 characters per tweet; do not print character counts or "[1/12]" metadata in the text).
- Tweet 1: scroll-stopping hook; optional 🧵 in the line.
- Include TL;DR, CTA, and one question-style tweet across the thread.
- After the thread sections, add ### AI search & discoverability notes and ## FAQ per Master (same as blog).

${JSON_OUTPUT_LONGFORM}
`;
    }

    // 4. Instagram Caption — Markdown body + same Master tail as blog
    if (platform === 'Instagram Caption') {
        return `${MASTER_LONG}
You are an Instagram strategist and AEO/GEO expert. Same output contract as **Blog Article**: Markdown in "content", full FAQ + discoverability sections in that Markdown, JSON "faq" aligned.

TOPIC: ${safeTopic}
ACCOUNT: @${safeBrand.replace(/\s+/g, '')}
NICHE: ${safeIndustry}
TONE: Bold, educational${safeKeywords}

---

## INSTAGRAM — MARKDOWN inside JSON "content"

- ## Hook — first line strong (before “more” behavior when pasted); keep line 1 mostly emoji-free, emojis OK below.
- ## Caption — short paragraphs, line breaks, 3–6 emojis in the body, lists if helpful.
- ## Save / share CTA — one clear ask.
- ## Hashtags — line with 15–25 #hashtags as plain #words in Markdown.
- **Key takeaways** bullets early if useful (align JSON keyTakeaways).
- Then ### AI search & discoverability notes and ## FAQ per Master (same as blog).

${JSON_OUTPUT_LONGFORM}
`;
    }

    // 5. Reddit / Quora — Markdown answer + same Master tail as blog
    if (platform === 'Reddit / Quora') {
        return `${MASTER_LONG}
You are a Reddit/Quora strategist and AEO/GEO expert. Same JSON + Markdown contract as **Blog Article**.

TOPIC: ${safeTopic}
PERSONA: Professional in ${safeIndustry} at ${safeBrand}
TONE: Helpful, honest, non-salesy${safeKeywords}

---

## REDDIT / QUORA — MARKDOWN inside JSON "content"

- Write so the user can copy the post text and paste it into Reddit or Quora as-is: short paragraphs, **bold**, numbered/bullet lists — no hashtag lines, no "#keyword" tokens, no comma-separated keyword dumps at the end.
- ## The short answer — direct answer first.
- ## Why it matters — brief context.
- ## Breakdown — 3–7 numbered or bulleted points with **bold** lead-ins.
- ## One thing most people get wrong — your sharpest take.
- Mention ${safeDomain} only if natural. 0–2 emojis total if it fits the platform.
- Then ### AI search & discoverability notes and ## FAQ per Master (same as blog).
- Put subreddit or community ideas in JSON "sources" as name/description entries if useful.

${JSON_OUTPUT_LONGFORM}
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
