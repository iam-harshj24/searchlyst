import { Router } from 'express';
import { startAuditHandler, getAuditStatusHandler, getLatestAuditHandler } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/start', startAuditHandler);
router.get('/latest', getLatestAuditHandler);
router.get('/:id/status', getAuditStatusHandler);

export default router;
