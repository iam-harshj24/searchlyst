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
    res.status(500).json({
      success: false,
      message: 'Failed to create anonymous user',
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
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
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

    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
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
