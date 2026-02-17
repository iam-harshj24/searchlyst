import express from 'express';
import { getBrandProfile, updateBrandProfile } from '../controllers/brandProfileController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateToken, requireUser);

router.get('/', getBrandProfile);
router.put('/', updateBrandProfile);

export default router;
