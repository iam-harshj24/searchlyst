import { projectRepository } from '../repositories/projectRepository.js';
import { brandProfileRepository } from '../repositories/brandProfileRepository.js';

export const projectService = {
  async listByUser(userId) {
    const projects = await projectRepository.findByUserId(userId);
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      status: p.status,
      visibility_score: p.visibility_score,
      total_citations: p.total_citations,
      sentiment: p.sentiment,
      issues_count: p.issues_count,
      created_at: p.created_at,
    }));
  },

  async create(userId, data) {
    const project = await projectRepository.create(userId, {
      name: data.name,
      url: data.url,
      status: data.status || 'pending',
      visibility_score: data.visibility_score ?? 0,
      total_citations: data.total_citations ?? 0,
      sentiment: data.sentiment ?? 0,
      issues_count: data.issues_count ?? 0,
    });
    // Create default brand profile
    await brandProfileRepository.upsert(project.id, { role_type: 'founder' });
    return {
      id: project.id,
      name: project.name,
      url: project.url,
      status: project.status,
      visibility_score: project.visibility_score,
      total_citations: project.total_citations,
      sentiment: project.sentiment,
      issues_count: project.issues_count,
      created_at: project.created_at,
    };
  },
};
