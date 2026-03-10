import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma.js';

let genAI = null;
function getModel() {
    if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

export async function listContent(req, res) {
    try {
        const userId = req.user.id;
        const { projectId } = req.query;
        const where = { userId };
        if (projectId) {
            const pid = parseInt(projectId, 10);
            if (!isNaN(pid)) where.projectId = pid;
        }
        const items = await prisma.content.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 100,
            select: { id: true, topic: true, platform: true, title: true, payload: true, status: true, projectId: true, created_at: true },
        });
        const contents = items.map((c) => {
            let article = null;
            try {
                article = JSON.parse(c.payload);
            } catch {}
            return {
                id: c.id,
                title: c.title,
                platform: c.platform,
                status: c.status,
                date: formatDate(c.created_at),
                article: article || { title: c.title, content: '' },
            };
        });
        return res.json({ success: true, contents });
    } catch (error) {
        console.error('List content error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

function formatDate(d) {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return new Date(d).toLocaleDateString();
}

export async function generateArticle(req, res) {
    try {
        const { topic, brandName, industry, domain, platform, keywords, projectId } = req.body;
        if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });
        const userId = req.user.id;

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

        // Parse JSON from response — extract object even if wrapped in markdown or extra text
        let article;
        try {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            const toParse = jsonMatch ? jsonMatch[0] : cleaned;
            article = JSON.parse(toParse);
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

        const title = article.title || topic;
        const platformName = platform || 'Blog';

        const saved = await prisma.content.create({
            data: {
                userId,
                projectId: projectId ? parseInt(projectId, 10) : null,
                topic,
                platform: platformName,
                title,
                payload: JSON.stringify(article),
                status: 'draft',
            },
        });

        res.json({ success: true, article, id: saved.id });
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
