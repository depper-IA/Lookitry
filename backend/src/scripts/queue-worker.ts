import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });

const QUEUE_KEY = 'queue:tryon';
const PROCESSING_KEY = 'queue:tryon:processing';
const MAX_RETRIES = 3;

interface TryOnJob {
  brand_id: string;
  product_id: string;
  selfie_url: string;
  product_image_url: string;
  prompt: string;
  generation_id: string;
  created_at: string;
  retry_count?: number;
}

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.wilkiedevs.com/webhook/tryon';
const N8N_API_KEY = process.env.N8N_BEARER_TOKEN || process.env.N8N_API_KEY || '';

async function processJob(job: TryOnJob): Promise<void> {
  console.log(`[Worker] Processing job ${job.generation_id}`);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_API_KEY}`,
      },
      body: JSON.stringify({
        brand_id: job.brand_id,
        product_id: job.product_id,
        selfie_url: job.selfie_url,
        product_image_url: job.product_image_url,
        prompt: job.prompt,
        generation_id: job.generation_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n responded with ${response.status}`);
    }

    const result = await response.json();
    console.log(`[Worker] Job ${job.generation_id} completed:`, result.success ? 'SUCCESS' : 'FAILED');

    await redis.lrem(PROCESSING_KEY, 1, JSON.stringify(job));
  } catch (error: any) {
    console.error(`[Worker] Job ${job.generation_id} failed:`, error.message);

    await redis.lrem(PROCESSING_KEY, 1, JSON.stringify(job));

    const retryCount = (job.retry_count || 0) + 1;
    if (retryCount < MAX_RETRIES) {
      const retryJob: TryOnJob = { ...job, retry_count: retryCount };
      await redis.lpush(QUEUE_KEY, JSON.stringify(retryJob));
      console.log(`[Worker] Job ${job.generation_id} re-queued (retry ${retryCount}/${MAX_RETRIES})`);
    } else {
      console.error(`[Worker] Job ${job.generation_id} exceeded max retries, moving to failed`);
      await redis.lpush('queue:tryon:failed', JSON.stringify({
        ...job,
        failed_at: new Date().toISOString(),
        last_error: error.message,
      }));
    }
  }
}

async function runWorker(): Promise<void> {
  console.log('[Worker] Starting Try-On Queue Worker...');
  console.log(`[Worker] Connected to Redis: ${redisUrl}`);
  console.log(`[Worker] Webhook URL: ${N8N_WEBHOOK_URL.replace(/\/[^/]+$/, '/***')}`);

  let activeJobs = 0;
  const MAX_CONCURRENT_JOBS = 3;

  while (true) {
    try {
      if (activeJobs < MAX_CONCURRENT_JOBS) {
        const result = await redis.brpop(QUEUE_KEY, 1);
        if (result) {
          const job: TryOnJob = JSON.parse(result[1]);
          const processingJob = { ...job, dequeued_at: new Date().toISOString() };
          await redis.lpush(PROCESSING_KEY, JSON.stringify(processingJob));
          activeJobs++;

          processJob(job).finally(() => {
            activeJobs--;
          });
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      console.error('[Worker] Error in worker loop:', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

runWorker().catch(err => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});