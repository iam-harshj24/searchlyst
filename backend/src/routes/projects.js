import express from 'express';
import {
    createProject,
    getProjects,
    deleteProject,
    getDashboardMetrics,
    updateProject,
    ingestSocialSnapshot,
} from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/metrics', getDashboardMetrics);
router.get('/', getProjects);
router.post('/', createProject);
router.put('/:id', updateProject);
router.post('/:id/social-ingest', ingestSocialSnapshot);
router.delete('/:id', deleteProject);

export default router;
