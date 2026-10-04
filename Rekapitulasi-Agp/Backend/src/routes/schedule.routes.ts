import { Router } from 'express';
import { getSchedules, createSchedule, updateScheduleStatus, deleteSchedule } from '../controllers/schedule.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// GET /api/schedules (Public read)
router.get('/', getSchedules);

// POST /api/schedules (Protected: Requires Auth)
router.post('/', requireAuth, createSchedule);

// PATCH /api/schedules/status (Protected)
router.patch('/status', requireAuth, updateScheduleStatus);

// DELETE /api/schedules/:id (Protected: Requires Auth)
router.delete('/:id', requireAuth, deleteSchedule);

export default router;
