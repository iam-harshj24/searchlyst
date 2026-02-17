import express from 'express';
import { listConnections, analyzeWritingStyle } from '../controllers/socialController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validate } from '../middleware/validate.js';
import { analyzeWritingStyleSchema } from '../validations/schemas.js';

const router = express.Router();

router.use(authenticateToken, requireUser);

router.get('/connections', listConnections);
router.post('/analyze', validate(analyzeWritingStyleSchema), analyzeWritingStyle);

export default router;
