import prisma from '../lib/prisma.js';

export const brandProfileRepository = {
  async findByProjectId(projectId) {
    return prisma.brandProfile.findUnique({
      where: { project_id: projectId },
    });
  },

  async upsert(projectId, data) {
    return prisma.brandProfile.upsert({
      where: { project_id: projectId },
      create: {
        project_id: projectId,
        role_type: data.role_type || 'founder',
        industry: data.industry || null,
        target_audience: data.target_audience || null,
        location: data.location || null,
        website_url: data.website_url || null,
        writing_style_signature: data.writing_style_signature || null,
        analyzed_at: data.analyzed_at || null,
      },
      update: {
        role_type: data.role_type ?? undefined,
        industry: data.industry ?? undefined,
        target_audience: data.target_audience ?? undefined,
        location: data.location ?? undefined,
        website_url: data.website_url ?? undefined,
        writing_style_signature: data.writing_style_signature ?? undefined,
        analyzed_at: data.analyzed_at ?? undefined,
        updated_at: new Date(),
      },
    });
  },

  async updateWritingStyle(projectId, signature, analyzedAt) {
    return prisma.brandProfile.update({
      where: { project_id: projectId },
      data: {
        writing_style_signature: signature,
        analyzed_at: analyzedAt,
        updated_at: new Date(),
      },
    });
  },
};
