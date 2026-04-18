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
        password_hash: data.password_hash ?? null,
        auth_provider: data.auth_provider ?? 'local',
        google_id: data.google_id ?? null,
        name: data.name,
        role_type: 'user',
        onboarded: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        auth_provider: true,
        google_id: true,
        role_type: true,
        onboarded: true
      },
    });
  },

  async updateUserAuthProvider(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        auth_provider: data.auth_provider,
        google_id: data.google_id ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        auth_provider: true,
        google_id: true,
        role_type: true,
        onboarded: true,
      },
    });
  },

  async findUserByGoogleId(googleId) {
    return prisma.user.findUnique({
      where: { google_id: googleId },
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

  async updateUserPassword(email, password_hash) {
    return prisma.user.update({
      where: { email },
      data: { password_hash },
    });
  },

  async updateAdminPassword(email, password_hash) {
    return prisma.adminUser.update({
      where: { email },
      data: { password_hash },
    });
  },

};
