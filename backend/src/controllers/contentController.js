import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma.js';
import { getPromptForPlatform } from '../services/contentPrompts.js';

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
        const prompt = getPromptForPlatform({ platform, topic, brandName, industry, domain, keywords });

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

export async function suggestTopics(req, res) {
    try {
        const { brandName, industry, location, domain, context } = req.body;

        const now = new Date();
        const currentYear = now.getFullYear();
        const todayLong = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const model = getModel();
        const prompt = `ROLE: You are an expert SEO content strategist.
TASK: Suggest 8 high-performing content topics for a company.
CONTEXT:
- Brand: ${brandName || 'Unknown'}
- Domain: ${domain || 'Unknown'}
- Industry: ${industry || 'General'}
- Location: ${location || 'Dubai'}
- Today's date: ${todayLong}
- Current calendar year: ${currentYear} (use this year in titles like "… in ${currentYear}" or "… ${currentYear} guide" — do not use outdated years such as two or three years ago unless the topic is explicitly historical)
${context ? `- Additional Context: ${context}` : ''}

REQUIREMENTS:
Return EXACTLY 8 topics as a JSON array of strings. Do not include any other text or markdown.
Make them relevant to the core offerings and highly clickable.
Combine a mix of "How-to", "Guides", and "Why..." formats.

Example (illustrative only — adapt to the brand's industry and location):
["Top ${industry || 'service'} options in ${location || 'your market'} (${currentYear})", "Buying guide — where to start in ${currentYear}"]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        let topics = [];
        try {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            const toParse = jsonMatch ? jsonMatch[0] : cleaned;
            topics = JSON.parse(toParse);
        } catch {
            topics = [
                `Top ${industry} trends in ${location}`,
                `Why ${brandName} is leading the market`,
                `Essential guide to ${industry}`,
                `How to choose the best ${industry} company`,
                `Future of ${industry} in ${location}`,
                `What makes ${brandName} different from competitors`,
                `Insider tips for ${industry}`,
                `The definitive ${brandName} handbook`
            ];
        }

        const mappedTopics = topics.slice(0, 8).map((t, i) => ({
            type: i < 3 ? 'VISIBILITY' : (i < 6 ? 'BRAND' : 'COMPETITOR'),
            text: t
        }));

        res.json({ success: true, topics: mappedTopics });
    } catch (error) {
        console.error('Topic suggestion error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
