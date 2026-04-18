import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { chat } from '../controllers/agentController.js';

const router = Router();

router.use(authenticateToken);
router.post('/chat', chat);

export default router;
