import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { downloadFullDatabaseExport } from '../controllers/adminExportController.js';

const router = express.Router();

router.get(
  '/export-database',
  authenticateToken,
  requireAdmin,
  downloadFullDatabaseExport,
);

export default router;
