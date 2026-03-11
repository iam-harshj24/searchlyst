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
