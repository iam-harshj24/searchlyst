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

export const registerUser = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const result = await authService.register(email, password, name);

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Register user error:', error);
    const isDbUnreachable = error?.name === 'PrismaClientInitializationError' ||
      /Can't reach database server|Connection refused|ECONNREFUSED/i.test(error?.message || '');
    const message = isDbUnreachable
      ? 'Database unavailable. Check DATABASE_URL and ensure PostgreSQL is running and reachable.'
      : 'Failed to create user';
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
