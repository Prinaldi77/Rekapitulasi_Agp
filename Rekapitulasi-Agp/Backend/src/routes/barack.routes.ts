import { Router } from 'express';
import { getBaracks, createBarack, deleteBarack } from '../controllers/barack.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// GET /api/baracks (Public/Internal read)
router.get('/', getBaracks);

// POST /api/baracks (Protected: Requires Auth)
router.post('/', requireAuth, createBarack);

// DELETE /api/baracks/:id (Protected: Requires Auth)
router.delete('/:id', requireAuth, deleteBarack);

export default router;
