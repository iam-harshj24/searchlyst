import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authRepository } from '../repositories/authRepository.js';
import { generateToken } from '../middleware/auth.js';

export const authService = {
  async createAnonymousUser() {
    const randomId = crypto.randomUUID();
    const email = `anon_${randomId}@anonymous.local`;
    const passwordHash = await bcrypt.hash(randomId, 10);
    
    const user = await authRepository.createUser({
      email,
      password_hash: passwordHash,
      name: 'Anonymous User',
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'user'
    });

    return { success: true, user, token };
  },

  async register(email, password, name) {
    const existingUser = await authRepository.findUserByEmail(email);
    const existingAdmin = await authRepository.findAdminByEmail(email);
    
    if (existingUser || existingAdmin) {
      return { success: false, conflict: true };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await authRepository.createUser({
      email,
      password_hash: passwordHash,
      name,
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'user'
    });

    return { success: true, user, token };
  },

  async login(email, password) {
    let user = await authRepository.findUserByEmail(email);
    let isAdmin = false;

    if (!user) {
      user = await authRepository.findAdminByEmail(email);
      isAdmin = true;
    }

    if (!user) {
      return { success: false, invalidCredentials: true };
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, invalidCredentials: true };
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: isAdmin ? 'admin' : 'user'
    });

    if (isAdmin) {
      await authRepository.updateLastLogin(user.id);
    }

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: isAdmin ? 'admin' : 'user',
        onboarded: isAdmin ? true : user.onboarded
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
