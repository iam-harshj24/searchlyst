import { prisma } from '../lib/prisma.js';
import { getGeminiGenerativeModel, formatGeminiErrorMessage } from '../lib/geminiClient.js';
import { getPromptForPlatform } from '../services/contentPrompts.js';
import { sanitizeArticleObject } from '../utils/contentArticleSanitize.js';

function getModel() {
    return getGeminiGenerativeModel();
}

async function upsertContentStat(userId, projectId, platform, statusDelta) {
    try {
        const statDate = new Date();
        statDate.setUTCHours(0, 0, 0, 0);
        const pId = projectId ? parseInt(projectId, 10) : null;
        const existingInfo = await prisma.contentDailyStat.findFirst({
            where: { userId, projectId: pId, statDate, platform }
        });

        const data = { updated_at: new Date() };
        if (statusDelta === 'draft') { data.draft = { increment: 1 }; data.itemsCount = { increment: 1 }; }
        else if (statusDelta === 'published') { data.draft = { decrement: 1 }; data.published = { increment: 1 }; }
        else if (statusDelta === 'archived') { data.draft = { decrement: 1 }; data.archived = { increment: 1 }; } 

        if (existingInfo) {
            await prisma.contentDailyStat.update({ where: { id: existingInfo.id }, data });
        } else {
            await prisma.contentDailyStat.create({
                data: {
                    userId, projectId: pId, statDate, platform,
                    draft: statusDelta === 'draft' ? 1 : 0,
                    published: statusDelta === 'published' ? 1 : 0,
                    archived: statusDelta === 'archived' ? 1 : 0,
                    itemsCount: statusDelta === 'draft' ? 1 : 0
                }
            });
        }
    } catch(err) { console.error('content stat error', err); }
}

export async function listContent(req, res) {
    try {
        const userId = req.user.id;
        const { projectId, archive = 'exclude' } = req.query;
        const where = { userId };
        if (projectId) {
            const pid = parseInt(projectId, 10);
            if (!isNaN(pid)) where.projectId = pid;
        }
        if (archive === 'only') {
            where.status = 'archived';
        } else if (archive !== 'all') {
            where.NOT = { status: 'archived' };
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
            const raw = article || { title: c.title, content: '' };
            return {
                id: c.id,
                title: c.title,
                platform: c.platform,
                status: c.status,
                date: formatDate(c.created_at),
                createdAt: c.created_at ? new Date(c.created_at).toISOString() : null,
                article: sanitizeArticleObject(raw),
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
        const { topic, brandName, industry, domain, platform, keywords, projectId, brandHubContext } = req.body;
        if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });
        const userId = req.user.id;

        let model;
        try {
            model = getModel();
        } catch (e) {
            return res.status(503).json({ success: false, message: formatGeminiErrorMessage(e) });
        }
        const prompt = getPromptForPlatform({
            platform,
            topic,
            brandName,
            industry,
            domain,
            keywords,
            brandHubContext: typeof brandHubContext === 'string' ? brandHubContext : undefined,
        });

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

        article = sanitizeArticleObject(article);
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

        await upsertContentStat(userId, projectId, platformName, 'draft');

        res.json({ success: true, article, id: saved.id });
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({ success: false, message: formatGeminiErrorMessage(error) });
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

        let model;
        try {
            model = getModel();
        } catch (e) {
            return res.status(503).json({ success: false, message: formatGeminiErrorMessage(e) });
        }
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
        res.status(500).json({ success: false, message: formatGeminiErrorMessage(error) });
    }
}

const CONTENT_STATUSES = ['draft', 'published', 'archived'];

export async function updateContent(req, res) {
    try {
        const userId = req.user.id;
        const id = parseInt(req.params.id, 10);
        const { status } = req.body || {};
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid content id' });
        }
        if (!CONTENT_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `status must be one of: ${CONTENT_STATUSES.join(', ')}` });
        }
        const row = await prisma.content.findFirst({ where: { id, userId } });
        if (!row) {
            return res.status(404).json({ success: false, message: 'Content not found' });
        }
        await prisma.content.update({
            where: { id },
            data: { status, updated_at: new Date() },
        });
        
        if (row.status === 'draft' && (status === 'published' || status === 'archived')) {
            await upsertContentStat(userId, row.projectId, row.platform, status);
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Update content error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function deleteContent(req, res) {
    try {
        const userId = req.user.id;
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid content id' });
        }
        const row = await prisma.content.findFirst({ where: { id, userId } });
        if (!row) {
            return res.status(404).json({ success: false, message: 'Content not found' });
        }
        await prisma.content.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        console.error('Delete content error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function getContentStats(req, res) {
    try {
        const userId = req.user.id;
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ success: false, message: 'projectId is required' });
        const data = await prisma.contentDailyStat.findMany({
            where: { userId, projectId: parseInt(projectId, 10) },
            orderBy: { statDate: 'asc' },
        });
        res.json({ success: true, data });
    } catch(err) { res.status(500).json({ success: false, message: err.message }); }
}
