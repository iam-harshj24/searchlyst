import express from 'express';
import { sendMessage } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/', sendMessage);

export default router;
