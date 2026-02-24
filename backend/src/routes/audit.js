import { Router } from 'express';
import { startAuditHandler, getAuditStatusHandler } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/start', startAuditHandler);
router.get('/:id/status', getAuditStatusHandler);

export default router;
