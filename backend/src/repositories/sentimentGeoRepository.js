import prisma from '../lib/prisma.js';

export const sentimentGeoRepository = {
  async createTrackedPrompt(projectId, query, source = 'auto') {
    return prisma.trackedPrompt.create({
      data: {
        project_id: projectId,
        query,
        source,
      },
    });
  },

  async findTrackedPromptsByProjectId(projectId) {
    return prisma.trackedPrompt.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'asc' },
    });
  },

  async deleteTrackedPrompt(promptId, projectId) {
    return prisma.trackedPrompt.deleteMany({
      where: { id: promptId, project_id: projectId },
    });
  },

  async createSentimentGeoResult(data) {
    return prisma.sentimentGeoResult.create({
      data: {
        project_id: data.projectId,
        tracked_prompt_id: data.trackedPromptId,
        platform: data.platform,
        country: data.country,
        citations_count: data.citationsCount ?? 0,
        sentiment_score: data.sentimentScore ?? 50,
        sentiment_label: data.sentimentLabel ?? 'neutral',
        raw_snippet: data.rawSnippet ?? null,
      },
    });
  },

  async findResultsByProjectAndDateRange(projectId, startDate, endDate) {
    return prisma.sentimentGeoResult.findMany({
      where: {
        project_id: projectId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { tracked_prompt: true },
      orderBy: { created_at: 'desc' },
    });
  },

  async findLatestResultsByProject(projectId, limit = 500) {
    return prisma.sentimentGeoResult.findMany({
      where: { project_id: projectId },
      include: { tracked_prompt: true },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },
};
