import express from 'express';
import { getOverviewData } from '../controllers/overviewController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';

const router = express.Router();

router.use(authenticateToken, requireUser);
router.get('/', getOverviewData);

export default router;
