import express from 'express';
import { createProject, getProjects, deleteProject } from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getProjects);
router.post('/', createProject);
router.delete('/:id', deleteProject);

export default router;
