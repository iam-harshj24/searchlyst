import { projectService } from '../services/projectService.js';
import { prisma } from '../lib/prisma.js';

export async function createProject(req, res) {
    try {
        const userId = req.user.id; // From authenticateToken middleware
        // Dev bypass user (id: -1) — return fake project without DB (used when DB is down)
        if (userId === -1) {
            const { brandName, domain, industry } = req.body || {};
            const project = {
                id: -1,
                brandName: brandName || 'Demo Brand',
                domain: domain || 'example.com',
                industry: industry || null,
            };
            return res.status(201).json({ success: true, project });
        }
        const project = await projectService.createProject(userId, req.body);

        // Mark user as onboarded
        await prisma.user.update({
            where: { id: userId },
            data: { onboarded: true }
        });

        res.status(201).json({ success: true, project });
    } catch (error) {
        console.error('Create project error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create project' });
    }
}

export async function getProjects(req, res) {
    try {
        const userId = req.user.id;
        // Dev bypass user (id: -1) — skip DB, return empty (used when DB is down)
        if (userId === -1) {
            return res.json({ success: true, projects: [] });
        }
        const projects = await projectService.getUserProjects(userId);
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Get projects error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch projects' });
    }
}

export async function updateProject(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { role_type, industry, companySize, location, language, reach, target_audience, social_linkedin, social_instagram, social_substack, social_reddit, website_url, domain } = req.body;

        if (userId === -1) {
            return res.json({ success: true, message: 'Dev mode bypass' });
        }

        // Update Project specifically
        const updatedProject = await projectService.updateProject(id, {
            industry,
            companySize,
            location,
            language,
            reach,
            target_audience,
            social_linkedin,
            social_instagram,
            social_substack,
            social_reddit,
            domain: website_url || domain
        });

        // Also update User's role_type since the Brand Hub manages it
        if (role_type) {
            await prisma.user.update({
                where: { id: userId },
                data: { role_type }
            });
        }

        res.json({ success: true, project: updatedProject });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ success: false, message: 'Failed to update project data' });
    }
}

export async function deleteProject(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await projectService.deleteProject(id, userId);
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        if (error.code === 'NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        console.error('Delete project error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete project' });
    }
}

export async function getDashboardMetrics(req, res) {
    try {
        const userId = req.user.id;
        const { projectId } = req.query;

        // Base where clause for user
        const whereUser = { userId };
        if (projectId) {
            const pid = parseInt(projectId, 10);
            if (!isNaN(pid)) whereUser.projectId = pid;
        }

        // 1. Articles Published
        const contentCount = await prisma.content.count({ where: whereUser });

        // 2. Visibility Scans Count (for Hours Saved math)
        const scansCount = await prisma.visibilityScan.count({ where: whereUser });
        
        // Hours Saved = (articles * 2) + (scans * 0.5)
        const hoursSaved = (contentCount * 2) + (scansCount * 0.5);

        // 3. Site Health (Latest Audit Score)
        const latestAudit = await prisma.auditJob.findFirst({
            where: { ...whereUser, status: 'completed' },
            orderBy: { created_at: 'desc' },
        });

        let siteHealth = null;
        if (latestAudit && latestAudit.results) {
            try {
                const results = typeof latestAudit.results === 'string' ? JSON.parse(latestAudit.results) : latestAudit.results;
                siteHealth = results?.scores?.overall || null;
            } catch (e) {
                console.error('Error parsing audit results:', e);
            }
        }

        // 4. AI Visibility Trend
        const recentScans = await prisma.visibilityScan.findMany({
            where: { ...whereUser, status: 'completed' },
            orderBy: { created_at: 'desc' },
            take: 7,
        });

        const trendData = recentScans.map(scan => {
            let score = null;
            if (scan.results) {
                try {
                    const results = typeof scan.results === 'string' ? JSON.parse(scan.results) : scan.results;
                    score = results?.score || 0;
                } catch(e) {}
            }
            return {
                id: scan.id,
                date: scan.created_at,
                score
            };
        }).reverse(); // chronological order

        res.json({
            success: true,
            metrics: {
                articlesPublished: contentCount,
                hoursSaved,
                siteHealth,
                visibilityTrend: trendData
            }
        });
    } catch (error) {
        console.error('Get dashboard metrics error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics' });
    }
}
