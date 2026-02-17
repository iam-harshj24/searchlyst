import express from 'express';
import {
  getSummary,
  runScan,
  listPrompts,
  addPrompt,
  deletePrompt,
} from '../controllers/sentimentGeoController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateToken, requireUser);

router.get('/', getSummary);
router.post('/scan', runScan);
router.get('/prompts', listPrompts);
router.post('/prompts', addPrompt);
router.delete('/prompts/:promptId', deletePrompt);

export default router;
