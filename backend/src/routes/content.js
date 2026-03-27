import { Router } from 'express';
import { generateArticle, listContent, suggestTopics } from '../controllers/contentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/', listContent);
router.post('/generate', generateArticle);
router.post('/suggest-topics', suggestTopics);

export default router;
