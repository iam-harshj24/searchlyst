import prisma from '../lib/prisma.js';

export const waitlistRepository = {
  async findByEmail(email) {
    return prisma.waitlist.findUnique({
      where: { email },
    });
  },

  async findById(id) {
    return prisma.waitlist.findUnique({
      where: { id },
    });
  },

  async create(data) {
    return prisma.waitlist.create({
      data: {
        full_name: data.full_name,
        email: data.email,
        website_url: data.website_url || null,
        source: data.source || 'unknown',
      },
    });
  },

  async findAll() {
    return prisma.waitlist.findMany({
      orderBy: { created_at: 'desc' },
    });
  },

  async updateStatus(id, status) {
    const updated = await prisma.waitlist.updateMany({
      where: { id },
      data: { status, updated_at: new Date() },
    });
    if (updated.count === 0) return null;
    return prisma.waitlist.findUnique({ where: { id } });
  },

  async getStats() {
    const [total, pending, contacted, converted] = await Promise.all([
      prisma.waitlist.count(),
      prisma.waitlist.count({ where: { status: 'pending' } }),
      prisma.waitlist.count({ where: { status: 'contacted' } }),
      prisma.waitlist.count({ where: { status: 'converted' } }),
    ]);
    return { total, pending, contacted, converted };
  },
};
