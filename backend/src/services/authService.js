import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { authRepository } from '../repositories/authRepository.js';
import { generateToken } from '../middleware/auth.js';
import { sendOtpEmail, sendPasswordResetOtpEmail } from './emailService.js';

// ---------------------------------------------------------------------------
// In-memory OTP store: { email -> { name, passwordHash, otp, expiresAt } }
// ---------------------------------------------------------------------------
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const otpStore = new Map();

// Purge expired entries every 5 minutes to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of otpStore.entries()) {
    if (entry.expiresAt <= now) otpStore.delete(email);
  }
}, 5 * 60 * 1000);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/** Single canonical form for emails (DB + OTP store + login). */
function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

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
        onboarded: false,
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
      role: 'user',
      onboarded: user.onboarded,
    });

    return { success: true, user, token };
  },

  /**
   * Step 1 of signup: validate, hash password, generate OTP, send email.
   * The User record is NOT created here.
   */
  async sendOtp(email, password, name) {
    const emailKey = normalizeEmail(email);
    const existingUser = await authRepository.findUserByEmail(emailKey);
    const existingAdmin = await authRepository.findAdminByEmail(emailKey);

    if (existingUser || existingAdmin) {
      return { success: false, conflict: true };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const otp = generateOtp();

    otpStore.set(emailKey, {
      name,
      passwordHash,
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    const emailResult = await sendOtpEmail({ name, email: emailKey, otp });
    if (!emailResult.success) {
      otpStore.delete(emailKey);
      return { success: false, emailFailed: true };
    }

    return { success: true, otpSent: true };
  },

  /**
   * Step 2 of signup: verify OTP, create user, return token.
   */
  async verifyOtp(email, otp) {
    const emailKey = normalizeEmail(email);
    const entry = otpStore.get(emailKey);

    // Ensure we are processing a signup OTP, not a reset OTP
    if (!entry || entry.type === 'reset') {
      return { success: false, notFound: true };
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(emailKey);
      return { success: false, expired: true };
    }

    if (entry.otp !== otp) {
      return { success: false, invalidOtp: true };
    }

    // OTP is valid — create the user now
    const user = await authRepository.createUser({
      email: emailKey,
      password_hash: entry.passwordHash,
      auth_provider: 'local',
      name: entry.name,
    });

    otpStore.delete(emailKey);

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'user',
      onboarded: user.onboarded,
    });

    return { success: true, user, token };
  },

  async sendPasswordResetOtp(email) {
    const emailKey = normalizeEmail(email);
    const existingUser = await authRepository.findUserByEmail(emailKey);
    const existingAdmin = await authRepository.findAdminByEmail(emailKey);

    if (!existingUser && !existingAdmin) {
      return { success: false, notFound: true };
    }

    const name = existingAdmin ? existingAdmin.name : existingUser.name;
    const otp = generateOtp();

    otpStore.set(emailKey, {
      type: 'reset',
      name,
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    const emailResult = await sendPasswordResetOtpEmail({ name, email: emailKey, otp });
    if (!emailResult.success) {
      otpStore.delete(emailKey);
      return { success: false, emailFailed: true };
    }

    return { success: true, otpSent: true };
  },

  async login(email, password) {
    const emailNorm = normalizeEmail(email);

    // Dev-only bypass admin login (works when DB is down)
    if (
      process.env.NODE_ENV === 'development' &&
      emailNorm === 'harsh@searchlyst.com' &&
      password === 'Harsh@?search#'
    ) {
      const token = generateToken({
        id: -1,
        email: 'harsh@searchlyst.com',
        name: 'Harsh',
        role: 'admin',
        onboarded: true,
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
    let user = await authRepository.findAdminByEmail(emailNorm);
    let isAdmin = !!user;

    if (!user) {
      user = await authRepository.findUserByEmail(emailNorm);
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

    const onboarded = isAdmin ? true : user.onboarded;
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: isAdmin ? 'admin' : 'user',
      onboarded,
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
        onboarded,
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
      onboarded: user.onboarded,
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

  async resetPassword(email, otp, newPassword) {
    const emailKey = normalizeEmail(email);
    const entry = otpStore.get(emailKey);

    if (!entry || entry.type !== 'reset') {
      return { success: false, notFound: true };
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(emailKey);
      return { success: false, expired: true };
    }

    if (entry.otp !== otp) {
      return { success: false, invalidOtp: true };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const existingAdmin = await authRepository.findAdminByEmail(emailKey);
    if (existingAdmin) {
      await authRepository.updateAdminPassword(emailKey, passwordHash);
    } else {
      await authRepository.updateUserPassword(emailKey, passwordHash);
    }

    otpStore.delete(emailKey);

    return { success: true };
  },

  async createAdmin(email, password, name) {
    const emailKey = normalizeEmail(email);
    const existing = await authRepository.findAdminByEmail(emailKey);
    if (existing) {
      return { success: false, conflict: true };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await authRepository.createAdmin({
      email: emailKey,
      password_hash: passwordHash,
      name,
    });

    return { success: true, admin };
  },
};
