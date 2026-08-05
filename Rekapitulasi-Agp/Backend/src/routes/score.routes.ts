import { Router } from 'express';
import { submitScores } from '../controllers/score.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// POST /api/scores/submit (Protected: Requires Supabase Auth Bearer token)
router.post('/submit', requireAuth, submitScores);

export default router;
