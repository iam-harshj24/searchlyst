import { authService } from '../services/authService.js';

export const createAnonymous = async (req, res) => {
  try {
    const result = await authService.createAnonymousUser();
    res.status(201).json({
      success: true,
      message: 'Anonymous user created successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Anonymous auth error:', error);
    const isDbUnreachable = error?.name === 'PrismaClientInitializationError' ||
      /Can't reach database server|Connection refused|ECONNREFUSED/i.test(error?.message || '');
    const message = isDbUnreachable
      ? 'Database unavailable. Check DATABASE_URL and ensure PostgreSQL is running and reachable.'
      : 'Failed to create anonymous user';
    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /auth/register
 * Step 1: Send OTP to the provided email. Does NOT create the user yet.
 */
export const registerUser = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const result = await authService.sendOtp(email, password, name);

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    if (result.emailFailed) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      otpSent: true,
      message: 'Verification code sent to your email. Please check your inbox.',
    });
  } catch (error) {
    console.error('Register (send OTP) error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate registration.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /auth/verify-otp
 * Step 2: Verify OTP and create the user account.
 */
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const result = await authService.verifyOtp(email, otp);

    if (result.notFound) {
      return res.status(400).json({
        success: false,
        message: 'No pending signup found for this email. Please register again.',
      });
    }

    if (result.expired) {
      return res.status(410).json({
        success: false,
        message: 'Your verification code has expired. Please register again.',
        expired: true,
      });
    }

    if (result.invalidOtp) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect verification code. Please try again.',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    const isDbUnreachable = error?.name === 'PrismaClientInitializationError' ||
      /Can't reach database server|Connection refused|ECONNREFUSED/i.test(error?.message || '');
    const message = isDbUnreachable
      ? 'Database unavailable. Check DATABASE_URL and ensure PostgreSQL is running and reachable.'
      : 'Verification failed. Could not create user.';
    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authService.login(email, password);

    if (result.invalidCredentials) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    if (result.providerMismatch) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Please continue with Google.',
      });
    }

    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    const isDbUnreachable = error?.name === 'PrismaClientInitializationError' ||
      /Can't reach database server|Connection refused|ECONNREFUSED/i.test(error?.message || '');
    const message = isDbUnreachable
      ? 'Database unavailable. Check DATABASE_URL and ensure PostgreSQL is running and reachable.'
      : 'Login failed';
    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const loginWithGoogle = async (req, res) => {
  const { idToken } = req.body;

  try {
    const result = await authService.loginWithGoogle(idToken);

    if (result.invalidGoogleToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }
    if (result.unverifiedGoogleEmail) {
      return res.status(400).json({
        success: false,
        message: 'Google account email is not verified',
      });
    }

    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const verifyToken = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

export const createAdmin = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const result = await authService.createAdmin(email, password, name);

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: 'Admin user already exists',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      admin: result.admin,
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await authService.sendPasswordResetOtp(email);

    if (result.notFound) {
      // Prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a reset code shortly.',
      });
    }

    if (result.emailFailed) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email. Please check your inbox.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate password reset.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const result = await authService.resetPassword(email, otp, newPassword);

    if (result.notFound || result.invalidOtp) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset code.',
      });
    }

    if (result.expired) {
      return res.status(410).json({
        success: false,
        message: 'Your reset code has expired. Please request a new one.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
