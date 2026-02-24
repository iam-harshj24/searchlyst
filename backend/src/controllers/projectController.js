import { projectService } from '../services/projectService.js';
import { prisma } from '../lib/prisma.js';

export async function createProject(req, res) {
    try {
        const userId = req.user.id; // From authenticateToken middleware
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
        await projectService.deleteProject(id);
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete project' });
    }
}
