import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller';

const router = Router();

// GET /api/leaderboard/:categoryId
router.get('/:categoryId', getLeaderboard);

export default router;
