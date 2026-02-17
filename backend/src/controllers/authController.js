import { authService } from '../services/authService.js';

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

export const register = async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    const result = await authService.register(full_name, email, password);

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const profile = await authService.getProfileFromToken(req.user);
    if (!profile) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({
      success: true,
      user: profile,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
    });
  }
};

export const updateProfile = async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Only regular users can update profile',
    });
  }

  try {
    const updated = await authService.updateProfile(req.user.id, req.body);
    const profile = (updated.profile_data && typeof updated.profile_data === 'object') ? updated.profile_data : {};
    res.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.full_name,
        full_name: updated.full_name,
        role: 'user',
        onboarded: updated.onboarded ?? false,
        ...profile,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  // Stub: always return success to prevent email enumeration
  // TODO: Implement actual password reset email flow
  console.log('Forgot password requested for:', email);
  res.json({
    success: true,
    message: 'If an account exists with this email, you will receive reset instructions.',
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
