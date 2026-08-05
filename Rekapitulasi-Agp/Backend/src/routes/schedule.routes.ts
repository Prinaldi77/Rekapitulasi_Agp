import { Router } from 'express';
import { updateScheduleStatus } from '../controllers/schedule.controller';

const router = Router();

// PATCH /api/schedules/status
router.patch('/status', updateScheduleStatus);

export default router;
