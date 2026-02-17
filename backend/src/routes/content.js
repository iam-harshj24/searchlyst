import express from 'express';
import { generate } from '../controllers/contentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';

const router = express.Router();

router.use(authenticateToken, requireUser);

router.post('/generate', generate);

export default router;
