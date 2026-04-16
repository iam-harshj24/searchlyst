import { randomUUID } from 'crypto';
import { startCrawl, getCrawlStatus, getCrawlStatusWithAllData } from '../services/firecrawlService.js';
import { analyzeAudit } from '../services/auditAnalyzer.js';
import { prisma } from '../lib/prisma.js';

export async function startAuditHandler(req, res) {
    try {
        const { url, projectId } = req.body;
        const userId = req.user.id;
        // AuditJob.userId → User.id (FK). Dev JWT stubs use id -1 — no DB row, so creates fail silently to users.
        if (typeof userId !== 'number' || userId < 1) {
            return res.status(403).json({
                success: false,
                code: 'REAL_ACCOUNT_REQUIRED',
                message: 'Website audit requires a signed-in account with a saved profile. Use Sign up / Log in (not guest dev bypass).',
            });
        }
        if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

        const auditId = randomUUID();
        console.log(`Starting audit ${auditId} for ${normalizedUrl}`);

        const crawlResult = await startCrawl(normalizedUrl);
        console.log(`Firecrawl job started: ${crawlResult.id}`);

        await prisma.auditJob.create({
            data: {
                id: auditId,
                userId,
                projectId: projectId ? parseInt(projectId, 10) : null,
                url: normalizedUrl,
                status: 'crawling',
                progress: JSON.stringify({ completed: 0, total: 0, firecrawlJobId: crawlResult.id }),
                results: null,
            }
        });

        res.json({ success: true, auditId, status: 'crawling' });
    } catch (error) {
        console.error('Start audit error:', error);
        if (error.message.includes('FIRECRAWL_API_KEY')) {
            return res.status(503).json({ success: false, message: 'Audit service is not configured. Please add a Firecrawl API key.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getLatestAuditHandler(req, res) {
    try {
        const userId = req.user.id;
        const { url, projectId } = req.query;

        const where = { userId, status: 'completed' };
        if (projectId) {
            where.projectId = parseInt(projectId, 10);
        } else if (url) {
            let normalizedUrl = url.trim();
            if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
            normalizedUrl = normalizedUrl.replace(/\/+$/, '') || normalizedUrl;
            where.url = { in: [normalizedUrl, normalizedUrl + '/'] };
        } else {
            return res.status(400).json({ success: false, message: 'url or projectId is required' });
        }

        const job = await prisma.auditJob.findFirst({
            where,
            orderBy: { created_at: 'desc' },
        });

        if (!job || !job.results) {
            return res.json({ success: false, result: null });
        }

        const result = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
        return res.json({ success: true, result });
    } catch (error) {
        console.error('Get latest audit error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getAuditStatusHandler(req, res) {
    try {
        const { id } = req.params;
        const job = await prisma.auditJob.findUnique({
            where: { id }
        });

        if (!job) return res.status(404).json({ success: false, message: 'Audit not found' });

        if (job.status === 'completed') {
            const results = job.results ? (typeof job.results === 'string' ? JSON.parse(job.results) : job.results) : null;
            return res.json({ success: true, status: 'completed', result: results });
        }
        if (job.status === 'failed') {
            return res.json({ success: false, status: 'failed', error: job.error });
        }

        const progress = job.progress ? (typeof job.progress === 'string' ? JSON.parse(job.progress) : job.progress) : {};
        if (job.status === 'analyzing') {
            return res.json({ success: true, status: 'analyzing', progress });
        }

        const firecrawlJobId = progress.firecrawlJobId;
        if (!firecrawlJobId) {
            return res.status(500).json({ success: false, message: 'Invalid job state: missing Firecrawl ID' });
        }

        const crawlStatus = await getCrawlStatus(firecrawlJobId);
        const fcStatus = String(crawlStatus.status || '').toLowerCase();
        const updatedProgress = {
            ...progress,
            completed: crawlStatus.completed || 0,
            total: crawlStatus.total || 0,
        };

        if (fcStatus === 'completed' || fcStatus === 'complete') {
            await prisma.auditJob.update({
                where: { id },
                data: {
                    status: 'analyzing',
                    progress: JSON.stringify(updatedProgress)
                }
            });

            (async () => {
                try {
                    const merged = await getCrawlStatusWithAllData(firecrawlJobId);
                    const pageData = merged.data || [];
                    if (!pageData.length) {
                        throw new Error('Crawl finished but returned no page content. Check the URL, robots.txt, and Firecrawl credits.');
                    }
                    console.log(`Analyzing ${pageData.length} pages for audit ${job.id}`);
                    const result = await analyzeAudit(pageData, job.url);
                    await prisma.auditJob.update({
                        where: { id },
                        data: {
                            status: 'completed',
                            results: JSON.stringify(result)
                        }
                    });
                    
                    try {
                        const auditDate = new Date();
                        auditDate.setUTCHours(0, 0, 0, 0);
                        let domain = '';
                        try { domain = new URL(job.url).hostname.replace(/^www\./, ''); } catch(e){}
                        
                        await prisma.auditDailySnapshot.create({
                            data: {
                                auditId: id,
                                userId: job.userId,
                                projectId: job.projectId,
                                url: job.url,
                                domain,
                                auditDate,
                                overallScore: result.scores?.overall,
                                seoScore: result.scores?.seo,
                                perfScore: result.scores?.performance,
                                a11yScore: result.scores?.accessibility,
                                issuesTotal: result.summary?.total,
                                crawledPages: result.crawledPages
                            }
                        });
                    } catch (snapErr) {
                        console.error('Audit snapshot save failed:', snapErr);
                    }
                    console.log(`Audit ${job.id} completed: ${result.summary?.total || 0} issues found`);
                } catch (e) {
                    console.error('Audit analysis error:', e);
                    await prisma.auditJob.update({
                        where: { id },
                        data: {
                            status: 'failed',
                            error: e.message
                        }
                    });
                }
            })();

            return res.json({ success: true, status: 'analyzing', progress: updatedProgress });
        }

        if (fcStatus === 'failed') {
            await prisma.auditJob.update({
                where: { id },
                data: {
                    status: 'failed',
                    error: 'Website crawl failed'
                }
            });
            return res.json({ success: false, status: 'failed', error: 'Website crawl failed. Please check the URL and try again.' });
        }

        // Update progress in DB even while crawling
        await prisma.auditJob.update({
            where: { id },
            data: { progress: JSON.stringify(updatedProgress) }
        });

        return res.json({ success: true, status: 'crawling', progress: updatedProgress });
    } catch (error) {
        console.error('Audit status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getAuditHistoryHandler(req, res) {
    try {
        const userId = req.user.id;
        const { url, projectId } = req.query;

        const where = { userId, status: 'completed' };
        if (projectId) {
            where.projectId = parseInt(projectId, 10);
        } else if (url) {
            let normalizedUrl = url.trim();
            if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
            normalizedUrl = normalizedUrl.replace(/\/+$/, '') || normalizedUrl;
            where.url = { in: [normalizedUrl, normalizedUrl + '/'] };
        }

        const jobs = await prisma.auditJob.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 20,
            select: { id: true, url: true, created_at: true, results: true },
        });

        const history = jobs.map(job => {
            try {
                const result = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
                return {
                    id: job.id,
                    url: job.url,
                    scannedAt: job.created_at,
                    scores: result?.scores || {},
                    summary: result?.summary || {},
                    crawledPages: result?.crawledPages || 0,
                };
            } catch {
                return { id: job.id, url: job.url, scannedAt: job.created_at, scores: {}, summary: {}, crawledPages: 0 };
            }
        });

        return res.json({ success: true, history });
    } catch (error) {
        console.error('Audit history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getAuditSnapshots(req, res) {
    try {
        const userId = req.user.id;
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ success: false, message: 'projectId is required' });
        const data = await prisma.auditDailySnapshot.findMany({
            where: { userId, projectId: parseInt(projectId, 10) },
            orderBy: { auditDate: 'asc' },
        });
        res.json({ success: true, data });
    } catch(err) { res.status(500).json({ success: false, message: err.message }); }
}
