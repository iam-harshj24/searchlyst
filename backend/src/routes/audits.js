import express from 'express';
import { startAudit, listAudits, getAudit, exportAudit, compareAudits } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validate } from '../middleware/validate.js';
import { runAuditSchema } from '../validations/schemas.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateToken, requireUser);

router.post('/', validate(runAuditSchema), startAudit);
router.get('/', listAudits);
router.get('/compare', compareAudits);
router.get('/:auditId/export', exportAudit);
router.get('/:auditId', getAudit);

export default router;
