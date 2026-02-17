import prisma from '../lib/prisma.js';

export const projectRepository = {
  async findByUserId(userId) {
    return prisma.project.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  },

  async findById(id) {
    return prisma.project.findUnique({
      where: { id },
      include: { brand_profile: true },
    });
  },

  async findByUserIdAndId(userId, id) {
    return prisma.project.findFirst({
      where: { id, user_id: userId },
      include: { brand_profile: true },
    });
  },

  async create(userId, data) {
    return prisma.project.create({
      data: {
        user_id: userId,
        name: data.name,
        url: data.url,
        status: data.status || 'pending',
        visibility_score: data.visibility_score ?? 0,
        total_citations: data.total_citations ?? 0,
        sentiment: data.sentiment ?? 0,
        issues_count: data.issues_count ?? 0,
      },
    });
  },

  async update(id, userId, data) {
    await prisma.project.updateMany({
      where: { id, user_id: userId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
    return this.findByUserIdAndId(userId, id);
  },

  async delete(id, userId) {
    return prisma.project.deleteMany({
      where: { id, user_id: userId },
    });
  },
};
