import { randomUUID } from 'crypto';
import { startCrawl, getCrawlStatus } from '../services/firecrawlService.js';
import { analyzeAudit } from '../services/auditAnalyzer.js';
import { prisma } from '../lib/prisma.js';

export async function startAuditHandler(req, res) {
    try {
        const { url } = req.body;
        const userId = req.user.id;
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
        const updatedProgress = {
            ...progress,
            completed: crawlStatus.completed || 0,
            total: crawlStatus.total || 0,
        };

        if (crawlStatus.status === 'completed') {
            await prisma.auditJob.update({
                where: { id },
                data: {
                    status: 'analyzing',
                    progress: JSON.stringify(updatedProgress)
                }
            });

            (async () => {
                try {
                    console.log(`Analyzing ${crawlStatus.data?.length || 0} pages for audit ${job.id}`);
                    const result = await analyzeAudit(crawlStatus.data || [], job.url);
                    await prisma.auditJob.update({
                        where: { id },
                        data: {
                            status: 'completed',
                            results: JSON.stringify(result)
                        }
                    });
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

        if (crawlStatus.status === 'failed') {
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
