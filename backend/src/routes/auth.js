import express from 'express';
import { login, register, verifyToken, updateProfile, forgotPassword, createAdmin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { allowSetupOnlyWhenEnabled } from '../middleware/setupGuard.js';
import { loginSchema, registerSchema, forgotPasswordSchema, createAdminSchema } from '../validations/schemas.js';

const router = express.Router();

// Public routes
router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// Protected routes (require valid JWT)
router.get('/verify', authenticateToken, verifyToken);
router.put('/profile', authenticateToken, updateProfile);

// Setup route - only works when ALLOW_ADMIN_SETUP=true (set when creating first admin)
router.post('/setup', allowSetupOnlyWhenEnabled, validate(createAdminSchema), createAdmin);

export default router;
