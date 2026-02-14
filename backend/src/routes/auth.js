import express from 'express';
import { login, verifyToken, createAdmin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { allowSetupOnlyWhenEnabled } from '../middleware/setupGuard.js';
import { loginSchema, createAdminSchema } from '../validations/schemas.js';

const router = express.Router();

// Routes
router.post('/login', validate(loginSchema), login);
router.get('/verify', authenticateToken, verifyToken);

// Setup route - only works when ALLOW_ADMIN_SETUP=true (set when creating first admin)
router.post('/setup', allowSetupOnlyWhenEnabled, validate(createAdminSchema), createAdmin);

export default router;
