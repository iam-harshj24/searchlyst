import { Router } from 'express';
import { generateArticle, listContent, suggestTopics, updateContent, deleteContent, getContentStats } from '../controllers/contentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/', listContent);
router.get('/stats', getContentStats);
router.post('/generate', generateArticle);
router.post('/suggest-topics', suggestTopics);
router.patch('/:id', updateContent);
router.delete('/:id', deleteContent);

export default router;
