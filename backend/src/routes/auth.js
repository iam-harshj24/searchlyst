import express from 'express';
import { login, verifyToken, createAdmin, registerUser, createAnonymous, loginWithGoogle, verifyOtp, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { allowSetupOnlyWhenEnabled } from '../middleware/setupGuard.js';
import { loginSchema, createAdminSchema, googleLoginSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema } from '../validations/schemas.js';

const router = express.Router();

// Routes
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleLoginSchema), loginWithGoogle);
router.post('/register', validate(createAdminSchema), registerUser); // Step 1: sends OTP
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);   // Step 2: verifies OTP & creates user
router.post('/forgot-password', validate(forgotPasswordSchema), requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/anonymous', createAnonymous); // Public route for guest dashboard users
router.get('/verify', authenticateToken, verifyToken);

// Setup route - only works when ALLOW_ADMIN_SETUP=true (set when creating first admin)
router.post('/setup', allowSetupOnlyWhenEnabled, validate(createAdminSchema), createAdmin);

export default router;
