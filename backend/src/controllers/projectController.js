import { projectService } from '../services/projectService.js';
import { prisma } from '../lib/prisma.js';
import { buildSocialIngestSnapshot } from '../services/socialIngestService.js';

const SOCIAL_PROJECT_KEYS = [
    'social_linkedin',
    'social_instagram',
    'social_substack',
    'social_reddit',
    'social_twitter',
    'social_youtube',
    'social_quora',
    'social_tiktok',
];

/** Merge optional social URLs from the request body over the DB project (trimmed strings). */
function mergeProjectSocialFromBody(project, body) {
    if (!body || typeof body !== 'object') return project;
    const merged = { ...project };
    for (const k of SOCIAL_PROJECT_KEYS) {
        if (body[k] === undefined) continue;
        const v = body[k];
        merged[k] = typeof v === 'string' ? v.trim() : v == null ? null : String(v).trim() || null;
    }
    return merged;
}

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
        // Enforce max 2 projects per user
        const existingProjects = await projectService.getUserProjects(userId);
        if (existingProjects.length >= 2) {
            return res.status(403).json({
                success: false,
                message: 'Project limit reached. You can only have up to 2 projects.',
            });
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
        const projectIds = projects.map((p) => p.id).filter((id) => id != null);
        let latestByProjectId = new Map();
        if (projectIds.length > 0) {
            const scans = await prisma.visibilityScan.findMany({
                where: {
                    userId,
                    status: 'completed',
                    projectId: { in: projectIds },
                },
                orderBy: { created_at: 'desc' },
                select: { projectId: true, results: true, created_at: true },
            });
            for (const s of scans) {
                if (s.projectId == null || latestByProjectId.has(s.projectId)) continue;
                latestByProjectId.set(s.projectId, s);
            }
        }

        const enriched = projects.map((p) => {
            const scan = latestByProjectId.get(p.id);
            let lastVisibilityScore = null;
            let lastVisibilityScanAt = null;
            if (scan?.results) {
                try {
                    const r = typeof scan.results === 'string' ? JSON.parse(scan.results) : scan.results;
                    lastVisibilityScore =
                        r?.score?.overall ?? (typeof r?.score === 'number' ? r.score : null);
                    lastVisibilityScanAt = scan.created_at;
                } catch {
                    /* ignore */
                }
            }
            return {
                ...p,
                lastVisibilityScore,
                lastVisibilityScanAt,
            };
        });

        res.json({ success: true, projects: enriched });
    } catch (error) {
        console.error('Get projects error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch projects' });
    }
}

export async function updateProject(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const {
            role_type, industry, companySize, location, language, reach, target_audience,
            social_linkedin, social_instagram, social_substack, social_reddit,
            social_twitter, social_youtube, social_quora, social_tiktok,
            website_url, domain,
            trackingLocations,
        } = req.body;

        if (userId === -1) {
            return res.json({ success: true, message: 'Dev mode bypass' });
        }

        // Normalize domain: strip protocol and trailing slash so we never
        // store "https://camanahomes.com" — only "camanahomes.com"
        const rawDomain = website_url || domain || '';
        const normalizedDomain = rawDomain
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .replace(/\/+$/, '')
            .trim() || undefined;

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
            social_twitter,
            social_youtube,
            social_quora,
            social_tiktok,
            ...(normalizedDomain ? { domain: normalizedDomain } : {}),
            ...(trackingLocations !== undefined ? { trackingLocations } : {}),
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

/** Pull public data from saved social_* fields (YouTube API, Substack RSS, Reddit JSON). */
export async function ingestSocialSnapshot(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const projectId = parseInt(id, 10);
        if (Number.isNaN(projectId)) {
            return res.status(400).json({ success: false, message: 'Invalid project id' });
        }

        if (userId === -1) {
            return res.json({
                success: true,
                snapshot: {
                    fetchedAt: new Date().toISOString(),
                    platforms: {
                        demo: {
                            ok: true,
                            source: 'demo',
                            message: 'Dev mode: connect a real account to test ingest.',
                            items: [{ title: 'Example post', url: 'https://example.com' }],
                        },
                    },
                    writingStyle: {
                        extractedAt: new Date().toISOString(),
                        source: 'none',
                        sampleCount: 1,
                        summary: 'Dev mode: real sync infers writing style from public titles only (read-only, never posts).',
                        traits: [],
                    },
                },
            });
        }

        const project = await projectService.getProjectById(projectId);
        if (!project || project.userId !== userId) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const projectForIngest = mergeProjectSocialFromBody(project, req.body);
        const snapshot = await buildSocialIngestSnapshot(projectForIngest);

        const persistSocial = {};
        for (const k of SOCIAL_PROJECT_KEYS) {
            if (req.body?.[k] !== undefined) persistSocial[k] = projectForIngest[k];
        }

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                socialIngestSnapshot: JSON.stringify(snapshot),
                updated_at: new Date(),
                ...persistSocial,
            },
        });

        res.json({
            success: true,
            snapshot,
            project: {
                ...updated,
                socialIngestSnapshot: snapshot,
            },
        });
    } catch (error) {
        console.error('Social ingest error:', error);
        res.status(500).json({ success: false, message: error.message || 'Social ingest failed' });
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
                    score =
                        results?.score?.overall ??
                        (typeof results?.score === 'number' ? results.score : null);
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
