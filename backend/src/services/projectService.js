import { projectRepository } from '../repositories/projectRepository.js';

export const projectService = {
    async createProject(userId, projectData) {
        return projectRepository.create({
            userId,
            ...projectData,
        });
    },

    async getUserProjects(userId) {
        return projectRepository.findByUserId(userId);
    },

    async getProjectById(id) {
        return projectRepository.findById(id);
    },

    async updateProject(id, data) {
        return projectRepository.update(id, data);
    },

    async deleteProject(id, userId) {
        const project = await projectRepository.findById(id);
        if (!project || project.userId !== userId) {
            const err = new Error('Project not found');
            err.code = 'NOT_FOUND';
            throw err;
        }
        return projectRepository.delete(id);
    },
};
