import express from 'express';
import {
  createWaitlistEntry,
  getAllWaitlistEntries,
  updateWaitlistStatus,
  getWaitlistStats,
  bulkCreateEntries,
  sendWelcomeBulk,
  getWelcomeJobStatus,
} from '../controllers/waitlistController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { waitlistSchema, updateStatusSchema, bulkWaitlistSchema, sendWelcomeBulkSchema } from '../validations/schemas.js';

const router = express.Router();

// Routes
router.post('/', validate(waitlistSchema), createWaitlistEntry); // Public - for form submissions
router.post('/bulk', authenticateToken, requireAdmin, validate(bulkWaitlistSchema), bulkCreateEntries); // Protected - admin only
router.post('/send-welcome-bulk', authenticateToken, requireAdmin, validate(sendWelcomeBulkSchema), sendWelcomeBulk); // Protected - admin only
router.get('/welcome-job/:id', authenticateToken, requireAdmin, getWelcomeJobStatus); // Protected - admin only
router.get('/', authenticateToken, requireAdmin, getAllWaitlistEntries); // Protected - admin only
router.get('/stats', authenticateToken, requireAdmin, getWaitlistStats); // Protected - admin only
router.put('/:id', authenticateToken, requireAdmin, validate(updateStatusSchema), updateWaitlistStatus); // Protected - admin only

export default router;
