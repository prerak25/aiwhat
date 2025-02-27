import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class RedisService {
  private readonly CACHE_TTL = 3600; // 1 hour

  async getCachedSummary(threadTs: string, channelId: string): Promise<string | null> {
    const key = `summary:${channelId}:${threadTs}`;
    return redis.get(key);
  }

  async cacheSummary(threadTs: string, channelId: string, summary: string): Promise<void> {
    const key = `summary:${channelId}:${threadTs}`;
    await redis.setex(key, this.CACHE_TTL, summary);
  }

  async getRateLimit(userId: string): Promise<number> {
    const key = `ratelimit:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 3600); // 1 hour window
    }
    return count;
  }
} 