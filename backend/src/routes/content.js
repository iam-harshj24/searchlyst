import { Router } from 'express';
import { generateArticle } from '../controllers/contentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/generate', authMiddleware, generateArticle);

export default router;
