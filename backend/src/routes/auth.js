import express from 'express';
import { login, verifyToken, createAdmin, registerUser, createAnonymous } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { allowSetupOnlyWhenEnabled } from '../middleware/setupGuard.js';
import { loginSchema, createAdminSchema } from '../validations/schemas.js';

const router = express.Router();

// Routes
router.post('/login', validate(loginSchema), login);
router.post('/register', validate(createAdminSchema), registerUser); // Reuse createAdminSchema since fields are same
router.post('/anonymous', createAnonymous); // Public route for guest dashboard users
router.get('/verify', authenticateToken, verifyToken);

// Setup route - only works when ALLOW_ADMIN_SETUP=true (set when creating first admin)
router.post('/setup', allowSetupOnlyWhenEnabled, validate(createAdminSchema), createAdmin);

export default router;
