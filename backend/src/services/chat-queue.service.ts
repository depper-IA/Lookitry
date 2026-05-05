import { redis } from '../config/redis';

export interface ChatMessageJob {
  platform_id: string;
  content: string;
  metadata?: any;
  received_at: string;
}

export class ChatQueueService {
  private readonly QUEUE_KEY = 'queue:chat_messages';

  async enqueueMessage(job: Omit<ChatMessageJob, 'received_at'>): Promise<void> {
    const fullJob: ChatMessageJob = {
      ...job,
      received_at: new Date().toISOString(),
    };
    await redis.lpush(this.QUEUE_KEY, JSON.stringify(fullJob));
    console.log(`[Chat Queue] Message enqueued for ${job.platform_id}`);
  }

  async dequeueMessage(timeoutSeconds = 5): Promise<ChatMessageJob | null> {
    const result = await redis.brpop(this.QUEUE_KEY, timeoutSeconds);
    if (!result) return null;
    return JSON.parse(result[1]);
  }
}

export const chatQueueService = new ChatQueueService();
