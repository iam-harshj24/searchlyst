import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
function getModel() {
    if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

export async function generateArticle(req, res) {
    try {
        const { topic, brandName, industry, domain, platform, keywords } = req.body;
        if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });

        const model = getModel();
        const prompt = `ROLE: You are an expert content strategist who creates articles that AI search engines love to cite.

TASK: Write a comprehensive, authoritative article about: "${topic}"

CONTEXT:
- Brand: ${brandName || 'N/A'} (${domain || 'N/A'})
- Industry: ${industry || 'General'}
- Target Platform: ${platform || 'Blog'}
${keywords ? `- Target Keywords: ${keywords}` : ''}

ARTICLE REQUIREMENTS:
1. Write 800-1200 words of high-quality, factual content
2. Include specific data points, statistics, and examples (with realistic source attributions)
3. Structure with clear H2 and H3 headings for scanability
4. Include a "Key Takeaways" section at the top (3-5 bullet points)
5. Add inline citations in [Source: Name] format throughout
6. Include a "Sources & References" section at the bottom with 5-8 credible sources
7. Use natural language that AI engines prefer to cite
8. Include FAQ section (3-4 questions) at the end — this is critical for AI search visibility
9. Mention "${brandName || 'the brand'}" naturally 2-3 times where relevant
10. Optimize for E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

OUTPUT FORMAT:
Return a JSON object:
{
    "title": "Article Title",
    "metaDescription": "SEO meta description (150-160 chars)",
    "keyTakeaways": ["point1", "point2", "point3"],
    "content": "Full markdown article content with ## headings, inline [Source: X] citations",
    "faq": [{"q": "Question?", "a": "Answer"}],
    "sources": [{"name": "Source Name", "url": "https://example.com", "description": "What this source covers"}],
    "suggestedKeywords": ["keyword1", "keyword2"],
    "wordCount": 1000,
    "readingTime": "5 min"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Parse JSON from response
        let article;
        try {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            article = JSON.parse(cleaned);
        } catch {
            // If JSON parsing fails, return the raw text as content
            article = {
                title: topic,
                content: text,
                sources: [],
                faq: [],
                keyTakeaways: [],
                suggestedKeywords: [],
                wordCount: text.split(/\s+/).length,
                readingTime: `${Math.ceil(text.split(/\s+/).length / 200)} min`
            };
        }

        res.json({ success: true, article });
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
