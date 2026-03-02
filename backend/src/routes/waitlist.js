import express from 'express';
import {
  createWaitlistEntry,
  getAllWaitlistEntries,
  updateWaitlistStatus,
  getWaitlistStats
} from '../controllers/waitlistController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { waitlistSchema, updateStatusSchema } from '../validations/schemas.js';

const router = express.Router();

// Routes
router.post('/', validate(waitlistSchema), createWaitlistEntry); // Public - for form submissions
router.get('/', authenticateToken, requireAdmin, getAllWaitlistEntries); // Protected - admin only
router.get('/stats', authenticateToken, requireAdmin, getWaitlistStats); // Protected - admin only
router.put('/:id', authenticateToken, requireAdmin, validate(updateStatusSchema), updateWaitlistStatus); // Protected - admin only

export default router;
