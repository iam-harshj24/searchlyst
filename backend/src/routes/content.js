import { Router } from 'express';
import { generateArticle } from '../controllers/contentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/generate', authenticateToken, generateArticle);

export default router;
