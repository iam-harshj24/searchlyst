import prisma from '../lib/prisma.js';

export const authRepository = {
  async findAdminByEmail(email) {
    return prisma.adminUser.findUnique({
      where: { email },
    });
  },

  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async createUser(data) {
    return prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.password_hash,
        name: data.name,
        role_type: 'user',
        onboarded: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role_type: true,
        onboarded: true
      },
    });
  },

  async updateUserOnboarded(userId, onboarded) {
    return prisma.user.update({
      where: { id: userId },
      data: { onboarded }
    });
  },

  async createAdmin(data) {
    return prisma.adminUser.create({
      data: {
        email: data.email,
        password_hash: data.password_hash,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  },

  async updateLastLogin(adminId) {
    return prisma.adminUser.update({
      where: { id: adminId },
      data: { last_login: new Date() },
    });
  },
};
