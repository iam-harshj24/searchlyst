export function getPromptForPlatform({ platform, topic, brandName, industry, domain, keywords }) {
    const safeTopic = topic || 'General industry topics';
    const safeBrand = brandName || 'Our Brand';
    const safeDomain = domain || 'ourwebsite.com';
    const safeIndustry = industry || 'our industry';
    const safeKeywords = keywords ? `\nTarget Keywords: ${keywords}` : '';
    
    // Universal JSON wrapper added to the end of EVERY prompt
    const JSON_OUTPUT_WRAPPER = `
---
CRITICAL JSON COMPLIANCE:
All your generated content (including the post, hooks, formatting, metadata) MUST be delivered inside a strict JSON object. Do not output raw markdown outside of this JSON wrapper.

Return exactly this JSON format:
{
    "title": "A catchy title for the generated content (e.g., Blog Title, Thread Hook, Newsletter Subject Line)",
    "metaDescription": "A 150-160 character summary of the content and its purpose",
    "keyTakeaways": ["Key insight 1", "Key insight 2", "Key insight 3"],
    "content": "INSERT THE FULL GENERATED MARKDOWN CONTENT HERE. Include the hooks, the body, the metadata section, and all formatting using \n\n for line breaks.",
    "faq": [{"q": "Extract any FAQs generated here", "a": "Extract the answer here"}],
    "sources": [{"name": "Source Name", "description": "What this source covers"}],
    "suggestedKeywords": ["keyword1", "keyword2"],
    "wordCount": 0,
    "readingTime": "1 min"
}
`;

    // 1. Email Newsletter
    if (platform === 'Email Newsletter') {
        return `You are an expert content strategist, SEO specialist, and email newsletter writer who deeply understands Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO). Your job is to create a comprehensive, authoritative, and citation-worthy email newsletter post on the following topic:

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
Generate 7-10 FAQs following these rules:
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
9. **Recency signals.** Reference current year (${new Date().getFullYear()}), recent developments, etc.

---

## OUTPUT FORMAT:
Deliver the complete newsletter post with all 10 sections above.
Use proper markdown formatting (headers, bold, bullets, tables).
After the post, provide a separate "META SECTION" that includes:
- Suggested Blog Title
- Meta Description
- Target Keywords
- Schema Markup Suggestion
- AI Engine Optimization Score Self-Assessment

${JSON_OUTPUT_WRAPPER}
`;
    }

    // 2. LinkedIn Post
    if (platform === 'LinkedIn Post') {
        return `You are a LinkedIn content strategist and AEO/GEO optimization expert. Create a high-performing LinkedIn post that is structured for maximum engagement, AI citability, and authority building.

TOPIC: ${safeTopic}
AUTHOR NAME/TITLE: Representative from ${safeBrand}
INDUSTRY: ${safeIndustry}
TARGET AUDIENCE: Professionals, decision-makers, and industry peers
TONE: Thought Leader / Conversational Expert${safeKeywords}
GOAL: Establish Authority and Community Building

---

## LINKEDIN POST STRUCTURE — Follow this EXACT framework:

### SECTION 1: THE HOOK (First 2-3 Lines — ABOVE THE FOLD)
Create the opening using ONE of these proven hook formulas:
- **Bold Contrarian Statement:** "Most people think [common belief]. They're wrong. Here's why."
- **Surprising Statistic:** "[Shocking number/stat] — and nobody is talking about it."
- **Personal Story Entry:** "Last [week/month/year], I [did something]. It changed how I think about [topic]."
- **Direct Challenge:** "If you're still doing [old approach], you're leaving [result] on the table."

Rules:
- First line must be a STANDALONE power sentence (max 15 words).
- Add a line break after the first sentence.
- Second line adds tension, curiosity, or context.
- Provide 3 hook variations to choose from at the very top.

### SECTION 2: THE CONTEXT BRIDGE (50-80 words)
- Transition from the hook to the main insight.
- Establish WHY this matters NOW.
- Include ONE statistic with source: "(Source: [Org, Year])"

### SECTION 3: THE CORE INSIGHT / FRAMEWORK (400-600 words)
Structure using ONE of these formats:

**Option A — Numbered Breakdown**
Present 5-7 key points/strategies/lessons:
- Each point: Bold emoji-led headline + 2-3 sentence explanation
- Format: "1. [Bold Point] → [Explanation]"
- At least 3 points must include a "quotable line" (self-contained, insightful).

**Option B — Myth-Busting Framework**
- Present 3-5 common myths/misconceptions:
  - "❌ Myth: [Wrong belief]"
  - "✅ Reality: [Correct insight with evidence]"

### SECTION 4: THE "QUOTABLE PARAGRAPH" (40-60 words)
- Write ONE standalone paragraph that is the most insightful, original take in the entire post.
- Be self-contained and start with "Here's what most people miss:" 

### SECTION 5: KEY TAKEAWAYS / TL;DR (60-80 words)
- "TL;DR:" or "Here's what to remember:"
- 3-5 bullet points using → or • or ✅

### SECTION 6: ENGAGEMENT CTA (30-50 words)
Create 2 options:
- Option A — Question CTA (specific and easy-to-answer)
- Option B — Challenge/Action CTA 

### SECTION 7: HASHTAG BLOCK
- Provide 3-5 relevant hashtags.

---

## LINKEDIN-SPECIFIC WRITING RULES:
1. **Line breaks are your weapon.** Never write paragraphs longer than 3 lines on mobile. 
2. **Front-load every sentence.** Lead with the insight, not the setup.
3. **Include entity references.** Name real companies, tools, people, studies. 
4. **No external links in the post body.** Put links in the FIRST COMMENT instead.

---

## OUTPUT FORMAT:
Deliver the complete LinkedIn post with all sections.
Use proper LinkedIn-native formatting (line breaks, emojis, bullets).
After the post, provide:
- Best Time to Post
- First Comment Strategy
- AI Citability Score (1-10)

${JSON_OUTPUT_WRAPPER}
`;
    }

    // 3. X / Twitter Thread
    if (platform === 'X / Twitter Thread') {
        return `You are a Twitter/X thread strategist and AEO/GEO optimization expert. Create a high-performing thread that goes viral through value density, shareability, and AI-citable structure.

TOPIC: ${safeTopic}
AUTHOR/HANDLE: @${safeBrand.replace(/\s+/g, '')}
NICHE: ${safeIndustry}
TARGET AUDIENCE: Industry professionals interested in ${safeTopic}
TONE: Sharp & Direct / Data-Driven
THREAD LENGTH: 10-15 tweets${safeKeywords}

---

## TWITTER THREAD STRUCTURE — Follow this EXACT framework:

### TWEET 1: THE HOOK TWEET
This tweet determines if ANYONE reads the rest. It must stop the scroll.
Provide 3 Tweet 1 variations using formulas like:
- "Unpopular opinion: [Bold statement about topic]. Here's why (with data): 🧵"
- "[Topic] can [big result]. Here are [X] [lessons/rules] that most people miss: 🧵"

### TWEET 2: THE CONTEXT TWEET
- Establish credibility or set up WHY this matters.
- Include one specific number, stat, or timeframe.

### TWEETS 3-9/12: THE VALUE TWEETS (Core of the thread)
Rules for each value tweet:
- Open with a bold, numbered statement: "[Number]/[Total] — [Bold claim or principle]"
- Explain in 1-2 sentences.
- Each tweet must stand alone. (Screenshot-worthy)
- Include at least 3 tweets with specific data/stats with "(Source: [Name])"
- Include 1 "myth-busting" tweet.
- Format using • or → natively. Max 270 chars per tweet.

### TWEET 10/13: THE SUMMARY TWEET
- "TL;DR:" or "The key points:"
- List the 3-5 most important takeaways as short bullet points.

### TWEET 11/14: THE CTA TWEET
Create 2 options: Engagement CTA or Conversion CTA.

### TWEET 12/15: THE ENGAGEMENT BAIT TWEET
- Ask a specific, polarizing, or easy-to-answer question.

---

## OUTPUT FORMAT:
Deliver ALL tweets numbered clearly: [1/15], [2/15], etc.
Show character count for each tweet in brackets: [243 chars].
After the thread, provide:
- Best Posting Time
- Thread Companion Strategy
- AI Citability Score (1-10)

${JSON_OUTPUT_WRAPPER}
`;
    }

    // 4. Instagram Caption
    if (platform === 'Instagram Caption') {
        return `You are an Instagram content strategist and AEO/GEO optimization expert. Create a high-performing Instagram caption that drives engagement, saves, shares, and is optimized for AI discoverability and citation.

TOPIC: ${safeTopic}
ACCOUNT NAME: @${safeBrand.replace(/\s+/g, '')}
NICHE: ${safeIndustry}
TONE: Bold & Direct / Educational${safeKeywords}

---

## INSTAGRAM CAPTION STRUCTURE — Follow this EXACT framework:

### LINE 1: THE HOOK (First line before "...more")
Provide 3 hook variations (max 100 characters, no emojis in first line).

### LINES 2-4: THE CORE VALUE (100-150 words)
Deliver the main insight in a compact, scannable format. Structure with a Mini Numbered List or Problem → Insight → Action.
- Include at least ONE specific number or statistic.
- Include at least ONE "quotable line".

### LINE 5: THE POWER SENTENCE (15-25 words)
- One standalone, bold, self-contained insight (save-worthy).

### LINE 6: THE CTA (20-40 words)
Create 2 options: Option A (Save/Share) and Option B (Comment).

### HASHTAG STRATEGY (After the caption)
- Provide 15-20 hashtags grouped by size: Large, Medium, Small, Micro.

---

## INSTAGRAM-SPECIFIC WRITING RULES:
1. **Write for scanners, not readers.** 
2. **Mobile-first formatting.** Short lines, white space.
3. **Emojis as visual anchors.** Max 3-6 emojis total.
4. **Value density over length.** 

---

## OUTPUT FORMAT:
Deliver the complete Instagram caption with all sections.
Format exactly as it would appear on Instagram (line breaks, emojis, etc.).
After the caption, provide:
- Suggested Visual
- Alt-Text
- First Comment
- Story Companion
- AI Citability Score (1-10)

${JSON_OUTPUT_WRAPPER}
`;
    }

    // 5. Reddit / Quora
    if (platform === 'Reddit / Quora') {
        return `You are a Reddit/Quora content strategist and AEO/GEO optimization expert. Create a high-value, authentic response/post that earns upvotes, builds credibility, provides genuine value, and is optimized to be cited by AI engines pulling from Reddit/Quora content.

TOPIC: ${safeTopic}
PERSONA: Industry professional in ${safeIndustry} at ${safeBrand}
TONE: Helpful Expert / Honest Practitioner${safeKeywords}
GOAL: Genuine Community Help & Authority Building

---

## REDDIT/QUORA RESPONSE STRUCTURE — Follow this EXACT framework:

### OPENING: THE CREDIBILITY + DIRECT ANSWER (40-60 words)
- Soft Credibility Marker: "I've been dealing with [thing] for [X years]..." (No bragging)
- Direct Answer: Answer the core question IMMEDIATELY. "The short answer is [direct answer]. Here's why:"

### BODY: THE DETAILED BREAKDOWN (250-400 words)
Use "The 'Here's What Actually Works' Breakdown":
- 3-5 numbered points/steps with bold headlines.
- Explain with SPECIFIC details, concrete examples, and at least 1 data/stat reference.

### THE "GOLDEN PARAGRAPH" (40-60 words)
- Include ONE paragraph that contains your most original, insightful take. Self-contained, authoritative but not arrogant.

### PRACTICAL RESOURCES / TOOLS (40-60 words)
- Mention 2-4 specific tools, resources, books. 
- You can subtly mention ${safeDomain} or your own guide ONLY IF it naturally fits, but Reddit users hate overt self-promotion.

### CLOSING: THE GENUINE SIGN-OFF (20-40 words)
- "Happy to go deeper into any of these if you have follow-up questions." (No CTA to follow).

---

## REDDIT/QUORA-SPECIFIC WRITING RULES:
1. **Be genuinely helpful above all else.** 
2. **Conversational, not polished.** 
3. **Specific > General. Always.** 
4. **Edit: formatting.** Use bold, bullets, and markdown line breaks.
5. **No emoji overuse.** 0-2 emojis max.

---

## OUTPUT FORMAT:
Deliver the complete Reddit/Quora response.
Format as it would actually appear on the platform (markdown formatting, natural paragraph breaks). Do not include section labels like "BODY".
After the response, provide:
- Suggested Post Title
- Suggested Subreddits / Quora Questions
- AI Citation Probability (1-10)

${JSON_OUTPUT_WRAPPER}
`;
    }

    // 6. Default (Blog / Article)
    return `ROLE: You are an expert content strategist who creates comprehensive articles that AI search engines love to cite.

TASK: Write an authoritative article about: "${safeTopic}"

CONTEXT:
- Brand: ${safeBrand} (${safeDomain})
- Industry: ${safeIndustry}
- Target Platform: Blog / Article${safeKeywords}

ARTICLE REQUIREMENTS:
1. Write 1000-1500 words of high-quality, factual content optimized for Answer Engine Optimization (AEO).
2. Include specific data points, statistics, and examples.
3. Structure with clear H2 and H3 headings for scanability.
4. Add inline citations in [Source: Name] format throughout.
5. Include a "Key Takeaways" bulleted list at the top.
6. Include an FAQ section (3-5 questions) at the end utilizing natural language queries.
7. Include a "Sources & References" list at the very bottom.
8. Optimize for E-E-A-T.

${JSON_OUTPUT_WRAPPER}
`;
}
