import express from 'express';
import { getCompetitorSuggestions } from '../controllers/onboardingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/competitors', getCompetitorSuggestions);

export default router;
