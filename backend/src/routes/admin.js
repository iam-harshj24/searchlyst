import express from 'express';
import {
  getOverview,
  getUsers,
  getContents
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/contents', getContents);

export default router;
