import { Router } from 'express';
import { togglePublishStatus } from '../controllers/publish.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

// PATCH /api/publish/:categoryId (Protected: Requires GRAND_MASTER role)
router.patch('/:categoryId', requireAuth, requireRole('GRAND_MASTER'), togglePublishStatus);

export default router;
