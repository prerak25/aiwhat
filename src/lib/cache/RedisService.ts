import { Redis } from "@upstash/redis"

// Initialize Redis client using environment variables
const redis = Redis.fromEnv()

export class RedisService {
  private readonly CACHE_TTL = 3600; // 1 hour

  // Rate limiting configuration
  private static RATE_LIMITS = {
    SUMMARIES_PER_USER: { count: 10, window: 60 * 60 }, // 10 requests per hour
    SUMMARIES_PER_CHANNEL: { count: 30, window: 60 * 60 }, // 30 requests per hour
    GLOBAL: { count: 100, window: 60 * 60 } // 100 requests per hour total
  }

  // Track summary generation
  async trackSummary(channelId: string, threadTs: string) {
    try {
      const date = new Date().toISOString().split('T')[0]
      const key = `summaries:${date}`
      
      // Increment the counter
      const result = await redis.hincrby(key, channelId, 1)
      console.log('Tracked summary:', { date, channelId, count: result })

      // Store thread details
      await redis.lpush(`channel:${channelId}:threads`, threadTs)
      await redis.ltrim(`channel:${channelId}:threads`, 0, 99) // Keep last 100

      return result
    } catch (error) {
      console.error('Error tracking summary:', error)
      throw error
    }
  }

  // Get summaries for today
  async getTodaySummaries() {
    try {
      const date = new Date().toISOString().split('T')[0]
      const key = `summaries:${date}`
      const summaries = await redis.hgetall(key)
      console.log('Retrieved summaries:', { date, summaries })
      return summaries
    } catch (error) {
      console.error('Error getting summaries:', error)
      return null
    }
  }

  // Test connection
  async testConnection() {
    try {
      // Try to set a test value
      await redis.set('test-connection', 'hello')
      // Try to get the test value
      const testValue = await redis.get('test-connection')
      // Delete the test value
      await redis.del('test-connection')
      
      console.log('Redis connection test:', testValue === 'hello' ? 'SUCCESS' : 'FAILED')
      return testValue === 'hello'
    } catch (error) {
      console.error('Redis connection error:', error)
      return false
    }
  }

  async getCachedSummary(threadTs: string, channelId: string): Promise<string | null> {
    const key = `summary:${channelId}:${threadTs}`;
    return redis.get(key);
  }

  async cacheSummary(threadTs: string, channelId: string, summary: string): Promise<void> {
    const key = `summary:${channelId}:${threadTs}`;
    await redis.setex(key, this.CACHE_TTL, summary);
  }

  // Rate limiting
  async checkRateLimit(type: 'user' | 'channel' | 'global', id?: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetIn: number;
  }> {
    try {
      const limit = RedisService.RATE_LIMITS[
        type === 'user' ? 'SUMMARIES_PER_USER' : 
        type === 'channel' ? 'SUMMARIES_PER_CHANNEL' : 'GLOBAL'
      ]
      
      const key = `ratelimit:${type}:${id || 'global'}`
      const count = await redis.incr(key)
      
      if (count === 1) {
        await redis.expire(key, limit.window)
      }

      const ttl = await redis.ttl(key)
      
      return {
        allowed: count <= limit.count,
        remaining: Math.max(0, limit.count - count),
        resetIn: ttl
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { allowed: true, remaining: 1, resetIn: 0 } // Fail open
    }
  }

  // Error tracking
  async logError(error: Error, context: {
    userId?: string;
    channelId?: string;
    action: string;
  }) {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        ...context
      }

      // Store in recent errors list
      await redis.lpush('recent_errors', JSON.stringify(errorLog))
      await redis.ltrim('recent_errors', 0, 99) // Keep last 100 errors

      // Increment error count for monitoring
      const date = new Date().toISOString().split('T')[0]
      await redis.hincrby(`errors:${date}`, context.action, 1)

    } catch (err) {
      console.error('Error logging error:', err)
    }
  }

  // Get recent errors
  async getRecentErrors(limit: number = 10) {
    try {
      const errors = await redis.lrange('recent_errors', 0, limit - 1)
      return errors.map(error => JSON.parse(error))
    } catch (error) {
      console.error('Error fetching recent errors:', error)
      return []
    }
  }

  // Store reaction to a summary
  async storeReaction(threadId: string, reaction: string, channelId: string) {
    try {
      const key = `reaction:${channelId}:${threadId}`
      await redis.hincrby(key, reaction, 1)
      // Auto-expire after 30 days
      await redis.expire(key, 60 * 60 * 24 * 30)
      console.log(`Stored reaction ${reaction} for thread ${threadId}`)
    } catch (error) {
      console.error('Error storing reaction:', error)
    }
  }

  // Get reactions for a thread
  async getReactions(threadId: string, channelId: string) {
    try {
      const key = `reaction:${channelId}:${threadId}`
      return await redis.hgetall(key)
    } catch (error) {
      console.error('Error getting reactions:', error)
      return null
    }
  }

  // ONLY store non-sensitive metrics
  async trackMetrics(channelId: string, threadTs: string, metadata: {
    userId: string,
    messageCount: number,
    processingTimeMs: number,
    isSuccess: boolean,
    tldrLength?: number,  // Added to track TL;DR metrics
    summaryLength?: number
  }) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const key = `metrics:${date}`;

      await redis.hset(key, {
        [`channel:${channelId}:count`]: await redis.hincrby(key, `channel:${channelId}:count`, 1),
        'total_requests': await redis.hincrby(key, 'total_requests', 1),
        'avg_tldr_length': await this.updateAverage(key, 'avg_tldr_length', metadata.tldrLength || 0),
        'avg_summary_length': await this.updateAverage(key, 'avg_summary_length', metadata.summaryLength || 0),
        'avg_processing_time': await this.updateAverage(key, 'avg_processing_time', metadata.processingTimeMs)
      });

      await redis.expire(key, 60 * 60 * 24 * 30); // 30 days
    } catch (error) {
      console.error('Error tracking metrics:', error);
    }
  }

  // Get today's metrics
  async getTodayMetrics() {
    try {
      const date = new Date().toISOString().split('T')[0]
      const key = `metrics:${date}`
      
      const metrics = await redis.hgetall(key)
      console.log('Retrieved metrics:', { date, metrics })
      
      return metrics
    } catch (error) {
      console.error('Error getting metrics:', error)
      return null
    }
  }

  // Track error counts (no sensitive data)
  async trackError(errorType: string) {
    try {
      const date = new Date().toISOString().split('T')[0]
      await redis.hincrby(`errors:${date}`, errorType, 1)
    } catch (error) {
      console.error('Error tracking error:', error)
    }
  }

  private async updateAverage(key: string, field: string, newValue: number): Promise<number> {
    const count = await redis.hincrby(key, `${field}:count`, 1)
    const currentAvg = parseFloat(await redis.hget(key, field) || '0')
    const newAvg = (currentAvg * (count - 1) + newValue) / count
    return newAvg
  }
} 