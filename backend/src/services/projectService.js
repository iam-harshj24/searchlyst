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

    async deleteProject(id) {
        return projectRepository.delete(id);
    },
};
