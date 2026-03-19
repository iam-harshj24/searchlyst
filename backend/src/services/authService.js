import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { authRepository } from '../repositories/authRepository.js';
import { generateToken } from '../middleware/auth.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authService = {
  async createAnonymousUser() {
    // Dev-only bypass: return fake user without DB (works when DB is down)
    if (process.env.NODE_ENV === 'development') {
      const randomId = crypto.randomUUID();
      const user = {
        id: -1,
        email: `anon_${randomId}@anonymous.local`,
        name: 'Anonymous User',
        role_type: 'user',
        onboarded: false,
      };
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user',
      });
      return { success: true, user, token };
    }

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
      auth_provider: 'local',
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
    // Dev-only bypass admin login (works when DB is down)
    if (
      process.env.NODE_ENV === 'development' &&
      email === 'harsh@searchlyst.com' &&
      password === 'Harsh@?search#'
    ) {
      const token = generateToken({
        id: -1,
        email: 'harsh@searchlyst.com',
        name: 'Harsh',
        role: 'admin',
      });
      return {
        success: true,
        token,
        user: {
          id: -1,
          email: 'harsh@searchlyst.com',
          name: 'Harsh',
          role: 'admin',
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

    if (!user.password_hash) {
      return { success: false, providerMismatch: true };
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

  async loginWithGoogle(idToken) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Google login is not configured on the server');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email) {
      return { success: false, invalidGoogleToken: true };
    }
    if (!payload.email_verified) {
      return { success: false, unverifiedGoogleEmail: true };
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || payload.given_name || email.split('@')[0];

    let user = await authRepository.findUserByGoogleId(googleId);
    if (!user) {
      user = await authRepository.findUserByEmail(email);
      if (user) {
        user = await authRepository.updateUserAuthProvider(user.id, {
          auth_provider: 'google',
          google_id: googleId,
        });
      } else {
        user = await authRepository.createUser({
          email,
          name,
          auth_provider: 'google',
          google_id: googleId,
          password_hash: null,
        });
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'user',
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user',
        onboarded: user.onboarded,
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
