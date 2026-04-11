import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { generationQueueService, TryOnJob } from '../services/generation-queue.service';
import { generationConcurrencyService } from '../services/generation-concurrency.service';
import { N8nClient } from '../services/n8n.client';
import { GenerationsService } from '../services/generations.service';
import { UsageService } from '../services/usage.service';
import { generationsLogService } from '../services/generations-log.service';

const router = Router();
const n8nClient = new N8nClient();
const generationsService = new GenerationsService();
const usageService = new UsageService();

async function processNextJob(): Promise<void> {
  const job = await generationQueueService.dequeueJob(5);
  if (!job) return;

  console.log(`[Queue Worker] Processing job ${job.generation_id}`);

  // Crear log en admin_generations_log
  const logId = await generationsLogService.logFromQueueJob({
    generation_id: job.generation_id,
    brand_id: job.brand_id,
    product_id: job.product_id,
    selfie_url: job.selfie_url,
    product_image_url: job.product_image_url,
    model_used: 'openrouter'
  });

  const slot = await generationConcurrencyService.acquireSlot(job.brand_id, 'PRO');

  if (!slot.acquired) {
    await generationQueueService.enqueueJob(job);
    console.log(`[Queue Worker] Re-enqueued job ${job.generation_id} - no slots available`);
    return;
  }

  const startTime = Date.now();

  try {
    const n8nResult = await n8nClient.callTryOnWebhook({
      brand_id: job.brand_id,
      product_id: job.product_id,
      selfie_url: job.selfie_url,
      product_image_url: job.product_image_url,
      prompt: job.prompt,
    });

    const processingTime = Date.now() - startTime;

    if (n8nResult.success && n8nResult.imageUrl) {
      await generationsService.updateGeneration(job.generation_id, {
        status: 'SUCCESS',
        result_image_url: n8nResult.imageUrl,
      });
      // Actualizar log
      if (logId) {
        await generationsLogService.markCompleted(logId, n8nResult.imageUrl, processingTime);
      }
    } else {
      throw new Error(n8nResult.error || 'Unknown n8n error');
    }

    await generationQueueService.markJobCompleted(job.generation_id);
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    await generationsService.updateGeneration(job.generation_id, {
      status: 'FAILED',
      error_message: error.message,
    });

    // Actualizar log
    if (logId) {
      await generationsLogService.markFailed(logId, error.message, processingTime);
    }

    await generationQueueService.markJobFailed(job.generation_id, error.message);

    if (error.message?.includes('INSUFFICIENT_CREDITS') || error.message?.includes('CREDITS_EXHAUSTED')) {
      // Don't retry credit errors
    } else {
      // Retry failed jobs
      setTimeout(() => {
        generationQueueService.retryFailedJobs();
      }, 5000);
    }
  } finally {
    await generationConcurrencyService.releaseSlot(job.brand_id, slot.slotId);
  }
}

setInterval(() => {
  // Solo procesar si Redis está conectado
  if ((generationQueueService as any).isReady && !(generationQueueService as any).isReady()) {
    return;
  }
  
  // Como generationQueueService usa el singleton de redis, podemos chequear el status directamente
  if (require('../config/redis').redis.status !== 'ready') {
    return;
  }

  processNextJob().catch(err => {
    console.error('[Queue Worker] Error processing job:', err.message);
  });
}, 2000);

router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await generationQueueService.getStats();
  const jobs = await generationQueueService.getJobsInQueue(5);

  res.json({
    stats,
    recentJobs: jobs.map(j => ({
      generationId: j.generation_id,
      brandId: j.brand_id,
      createdAt: j.created_at,
    })),
  });
}));

router.get('/next', asyncHandler(async (req, res) => {
  const job = await generationQueueService.dequeueJob(1);
  if (!job) {
    return res.status(204).send();
  }
  res.json(job);
}));

router.post('/retry-failed', asyncHandler(async (req, res) => {
  const count = await generationQueueService.retryFailedJobs();
  res.json({ retried: count });
}));

export default router;