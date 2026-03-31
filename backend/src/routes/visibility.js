import { Router } from 'express';
import {
    startVisibilityScan,
    getScanStatus,
    listScans,
    getLatestScan,
    getScanHistory,
    runCustomPrompt,
    runCustomPromptsBatch,
    suggestCompetitors,
} from '../controllers/visibilityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/scan', startVisibilityScan);
router.post('/run-prompt', runCustomPrompt);
router.post('/run-prompts', runCustomPromptsBatch);
router.post('/suggest-competitors', suggestCompetitors);
router.get('/scans', listScans);
router.get('/latest', getLatestScan);
router.get('/history', getScanHistory);
router.get('/:id/status', getScanStatus);

export default router;
