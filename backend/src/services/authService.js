import bcrypt from 'bcryptjs';
import { authRepository } from '../repositories/authRepository.js';
import { generateToken } from '../middleware/auth.js';

export const authService = {
  async login(email, password) {
    const admin = await authRepository.findAdminByEmail(email);
    if (!admin) {
      return { success: false, invalidCredentials: true };
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return { success: false, invalidCredentials: true };
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });

    await authRepository.updateLastLogin(admin.id);

    return {
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
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
};
