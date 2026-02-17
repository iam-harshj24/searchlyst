import express from 'express';
import { getSummary } from '../controllers/aiVisibilityController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateToken, requireUser);
router.get('/', getSummary);

export default router;
