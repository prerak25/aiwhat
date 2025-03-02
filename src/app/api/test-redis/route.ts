import { RedisService } from '@/lib/cache/RedisService'

export async function GET() {
  const redisService = new RedisService()
  
  try {
    const isConnected = await redisService.testConnection()
    
    if (isConnected) {
      return new Response('Redis connection successful!', { status: 200 })
    } else {
      return new Response('Redis connection failed', { status: 500 })
    }
  } catch (error) {
    console.error('Test route error:', error)
    return new Response('Error testing Redis connection', { status: 500 })
  }
} 