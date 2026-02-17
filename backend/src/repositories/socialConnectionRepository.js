import prisma from '../lib/prisma.js';

export const socialConnectionRepository = {
  async findByUserId(userId) {
    return prisma.socialConnection.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  },

  async findByUserIdAndPlatform(userId, platform) {
    return prisma.socialConnection.findUnique({
      where: {
        user_id_platform: { user_id: userId, platform },
      },
      include: { fetched_content: true },
    });
  },

  async upsert(userId, platform, data) {
    return prisma.socialConnection.upsert({
      where: {
        user_id_platform: { user_id: userId, platform },
      },
      create: {
        user_id: userId,
        platform,
        connection_type: data.connection_type || 'manual',
        handle_or_url: data.handle_or_url,
        status: data.status || 'active',
      },
      update: {
        handle_or_url: data.handle_or_url,
        status: data.status ?? undefined,
        last_fetched_at: data.last_fetched_at ?? undefined,
        updated_at: new Date(),
      },
    });
  },

  async delete(userId, platform) {
    return prisma.socialConnection.deleteMany({
      where: { user_id: userId, platform },
    });
  },

  async saveFetchedContent(connectionId, platform, items) {
    // Delete old content for this connection
    await prisma.fetchedContent.deleteMany({
      where: { social_connection_id: connectionId },
    });

    if (items.length === 0) return [];

    return prisma.fetchedContent.createMany({
      data: items.map((item) => ({
        social_connection_id: connectionId,
        platform,
        raw_content: item.text || item.content || item.caption || '',
        post_id: item.id || item.urn || item.shortCode || null,
        post_url: item.url || item.inputUrl || null,
      })),
    });
  },

  async getFetchedContentForUser(userId) {
    const connections = await prisma.socialConnection.findMany({
      where: { user_id: userId, status: 'active' },
      include: { fetched_content: true },
    });
    return connections.flatMap((c) =>
      c.fetched_content.map((f) => ({ ...f, platform: c.platform }))
    );
  },
};
