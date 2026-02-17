import prisma from '../lib/prisma.js';

export const authRepository = {
  // Admin methods
  async findAdminByEmail(email) {
    return prisma.adminUser.findUnique({
      where: { email },
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

  // User (regular app user) methods
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
        full_name: data.full_name,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        onboarded: true,
        profile_data: true,
      },
    });
  },

  async updateUserProfile(userId, profileData) {
    const { onboarded, ...rest } = profileData;
    const updateData = { updated_at: new Date() };
    if (typeof onboarded === 'boolean') updateData.onboarded = onboarded;
    if (Object.keys(rest).length > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const existingProfile = (user?.profile_data && typeof user.profile_data === 'object') ? user.profile_data : {};
      updateData.profile_data = { ...existingProfile, ...rest };
    }
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        full_name: true,
        onboarded: true,
        profile_data: true,
      },
    });
  },

  async findUserById(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  },
};
