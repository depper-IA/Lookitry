import { redis } from '../config/redis';

export interface TryOnJob {
  brand_id: string;
  product_id: string;
  selfie_url: string;
  product_image_url: string;
  prompt: string;
  generation_id: string;
  created_at: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
}

export class GenerationQueueService {
  private readonly QUEUE_KEY = 'queue:tryon';
  private readonly PROCESSING_KEY = 'queue:tryon:processing';
  private readonly FAILED_KEY = 'queue:tryon:failed';
  private readonly MAX_RETRIES = 3;
  private readonly JOB_TTL_SECONDS = 3600;

  async enqueueJob(job: Omit<TryOnJob, 'created_at'>): Promise<void> {
    const fullJob: TryOnJob = {
      ...job,
      created_at: new Date().toISOString(),
    };

    await redis.lpush(this.QUEUE_KEY, JSON.stringify(fullJob));
    console.log(`[Queue] Job enqueued for generation ${job.generation_id}`);
  }

  async dequeueJob(timeoutSeconds = 5): Promise<TryOnJob | null> {
    const result = await redis.brpop(this.QUEUE_KEY, timeoutSeconds);
    if (!result) return null;

    const job: TryOnJob = JSON.parse(result[1]);

    await redis.lpush(this.PROCESSING_KEY, JSON.stringify({
      ...job,
      dequeued_at: new Date().toISOString(),
    }));

    return job;
  }

  async markJobCompleted(generationId: string): Promise<void> {
    await this.removeFromProcessing(generationId);
    console.log(`[Queue] Job completed: ${generationId}`);
  }

  async markJobFailed(generationId: string, error: string): Promise<void> {
    const processing = await redis.lrange(this.PROCESSING_KEY, 0, -1);

    for (const item of processing) {
      const job: TryOnJob & { dequeued_at?: string } = JSON.parse(item);
      if (job.generation_id === generationId) {
        await redis.lrem(this.PROCESSING_KEY, 1, item);

        const failedJob = {
          ...job,
          failed_at: new Date().toISOString(),
          error,
        };
        await redis.lpush(this.FAILED_KEY, JSON.stringify(failedJob));
        break;
      }
    }

    console.error(`[Queue] Job failed: ${generationId} - ${error}`);
  }

  private async removeFromProcessing(generationId: string): Promise<void> {
    const processing = await redis.lrange(this.PROCESSING_KEY, 0, -1);

    for (const item of processing) {
      const job: TryOnJob = JSON.parse(item);
      if (job.generation_id === generationId) {
        await redis.lrem(this.PROCESSING_KEY, 1, item);
        break;
      }
    }
  }

  async retryFailedJobs(): Promise<number> {
    const failed = await redis.lrange(this.FAILED_KEY, 0, -1);
    let retried = 0;

    for (const item of failed) {
      const job: TryOnJob & { failed_at?: string; error?: string } = JSON.parse(item);
      const retryCount = (job as any).retry_count || 0;

      if (retryCount < this.MAX_RETRIES) {
        await redis.lrem(this.FAILED_KEY, 1, item);

        const retryJob = {
          ...job,
          retry_count: retryCount + 1,
          retried_at: new Date().toISOString(),
        };
        delete retryJob.failed_at;
        delete retryJob.error;

        await redis.lpush(this.QUEUE_KEY, JSON.stringify(retryJob));
        retried++;
      }
    }

    if (retried > 0) {
      console.log(`[Queue] Retried ${retried} failed jobs`);
    }

    return retried;
  }

  async getStats(): Promise<QueueStats> {
    const [pending, processing, failed] = await Promise.all([
      redis.llen(this.QUEUE_KEY),
      redis.llen(this.PROCESSING_KEY),
      redis.llen(this.FAILED_KEY),
    ]);

    return { pending, processing, failed };
  }

  async getJobsInQueue(limit = 10): Promise<TryOnJob[]> {
    const jobs = await redis.lrange(this.QUEUE_KEY, 0, limit - 1);
    return jobs.map(j => JSON.parse(j)).reverse();
  }
}

export const generationQueueService = new GenerationQueueService();