import { RedisService } from '../cache/RedisService';
import { NextResponse } from 'next/server';

const redisService = new RedisService();
const RATE_LIMIT = 100; // 100 requests per hour

export async function rateLimiter(userId: string) {
  const count = await redisService.getRateLimit(userId);
  
  if (count > RATE_LIMIT) {
    throw new Error('Rate limit exceeded');
  }
} 