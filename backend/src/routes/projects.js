import express from 'express';
import { listProjects, createProject } from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema } from '../validations/schemas.js';

const router = express.Router();

router.use(authenticateToken, requireUser);

router.get('/', listProjects);
router.post('/', validate(createProjectSchema), createProject);

export default router;
