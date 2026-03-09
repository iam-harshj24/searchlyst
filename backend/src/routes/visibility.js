import { Router } from 'express';
import { startVisibilityScan, getScanStatus, listScans, getLatestScan } from '../controllers/visibilityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/scan', startVisibilityScan);
router.get('/scans', listScans);
router.get('/latest', getLatestScan);
router.get('/:id/status', getScanStatus);

export default router;
