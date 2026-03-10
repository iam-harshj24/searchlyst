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
    // Dev-only bypass: test@gmail.com / 24112001 (bypasses DB, works when DB is down)
    if (process.env.NODE_ENV === 'development' && email === 'test@gmail.com' && password === '24112001') {
      const token = generateToken({
        id: -1,
        email: 'test@gmail.com',
        name: 'Test User',
        role: 'user',
      });
      return {
        success: true,
        token,
        user: {
          id: -1,
          email: 'test@gmail.com',
          name: 'Test User',
          role: 'user',
          onboarded: true,
        },
      };
    }

    // Check admin first so admin credentials take precedence if email exists in both tables
    let user = await authRepository.findAdminByEmail(email);
    let isAdmin = !!user;

    if (!user) {
      user = await authRepository.findUserByEmail(email);
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
