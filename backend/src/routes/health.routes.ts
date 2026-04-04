import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ 
    message: 'Health check endpoint moved to /health',
    docs: 'See /api-developer for API documentation'
  });
});

export default router;
