import { Router } from 'express';
import { startAuditHandler, getAuditStatusHandler, getLatestAuditHandler, getAuditHistoryHandler, getAuditSnapshots } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/start', startAuditHandler);
router.get('/history', getAuditHistoryHandler);
router.get('/latest', getLatestAuditHandler);
router.get('/snapshots', getAuditSnapshots);
router.get('/:id/status', getAuditStatusHandler);

export default router;
