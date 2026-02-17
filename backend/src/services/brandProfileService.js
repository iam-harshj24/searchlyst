import { brandProfileRepository } from '../repositories/brandProfileRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { socialConnectionRepository } from '../repositories/socialConnectionRepository.js';

export const brandProfileService = {
  async getByProjectId(userId, projectId) {
    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) return null;

    const profile = await brandProfileRepository.findByProjectId(projectId);
    const connections = await socialConnectionRepository.findByUserId(userId);
    const social = {};
    connections.forEach((c) => {
      social[`social_${c.platform}`] = c.handle_or_url;
    });
    return profile ? { ...profile, ...social } : { ...social };
  },

  async upsert(userId, projectId, data) {
    const project = await projectRepository.findByUserIdAndId(userId, projectId);
    if (!project) return null;

    return brandProfileRepository.upsert(projectId, {
      role_type: data.role_type,
      industry: data.industry,
      target_audience: data.target_audience,
      location: data.location,
      website_url: data.website_url,
    });
  },
};
