import bcrypt from 'bcryptjs';
import { authRepository } from '../repositories/authRepository.js';
import { generateToken } from '../middleware/auth.js';

export const authService = {
  async login(email, password) {
    // Try User (regular app user) first
    const user = await authRepository.findUserByEmail(email);
    if (user) {
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, invalidCredentials: true };
      }
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: 'user',
      });
      return {
        success: true,
        token,
        user: formatUserForResponse(user),
      };
    }

    // Fall back to AdminUser
    const admin = await authRepository.findAdminByEmail(email);
    if (admin) {
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      if (!isValidPassword) {
        return { success: false, invalidCredentials: true };
      }
      const token = generateToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
      });
      await authRepository.updateLastLogin(admin.id);
      return {
        success: true,
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin',
        },
      };
    }

    return { success: false, invalidCredentials: true };
  },

  async register(full_name, email, password) {
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      return { success: false, conflict: true };
    }
    const existingAdmin = await authRepository.findAdminByEmail(email);
    if (existingAdmin) {
      return { success: false, conflict: true };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await authRepository.createUser({
      email,
      password_hash: passwordHash,
      full_name,
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: 'user',
    });

    return {
      success: true,
      token,
      user: formatUserForResponse(user),
    };
  },

  async createAdmin(email, password, name) {
    const existing = await authRepository.findAdminByEmail(email);
    if (existing) {
      return { success: false, conflict: true };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await authRepository.createAdmin({
      email,
      password_hash: passwordHash,
      name,
    });

    return { success: true, admin };
  },

  async getProfileFromToken(decoded) {
    const role = decoded.role || 'admin'; // backward compat: old tokens without role = admin
    if (role === 'admin') {
      const admin = await authRepository.findAdminByEmail(decoded.email);
      if (!admin) return null;
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
      };
    }
    const user = await authRepository.findUserById(decoded.id);
    if (!user) return null;
    return formatUserForResponse(user);
  },

  async updateProfile(userId, profileData) {
    return authRepository.updateUserProfile(userId, profileData);
  },
};

function formatUserForResponse(user) {
  const profile = (user.profile_data && typeof user.profile_data === 'object') ? user.profile_data : {};
  return {
    id: user.id,
    email: user.email,
    name: user.full_name,
    full_name: user.full_name,
    role: 'user',
    onboarded: user.onboarded ?? false,
    ...profile,
  };
}
