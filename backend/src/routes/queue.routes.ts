import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// NOTE: Redis-based queue is temporarily disabled.
// Generation now happens synchronously in pruebalo.controller.ts
// TODO: Replace Redis queue with a more reliable alternative (e.g., BullMQ, Bull, or database-based queue)

router.get('/stats', asyncHandler(async (req, res) => {
  res.json({
    status: 'disabled',
    message: 'Redis queue temporarily disabled. Generation is now synchronous.',
    stats: { pending: 0, processing: 0, failed: 0 },
    recentJobs: [],
  });
}));

router.get('/next', asyncHandler(async (req, res) => {
  res.status(204).send();
}));

router.post('/retry-failed', asyncHandler(async (req, res) => {
  res.json({ retried: 0, message: 'Queue disabled' });
}));

export default router;