import { RedisService } from '@/lib/cache/RedisService'

export async function GET(req: Request) {
  const redis = new RedisService()
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') || 'all'

  try {
    const data: any = {}

    // Get metrics
    if (view === 'all' || view === 'metrics') {
      data.metrics = await redis.getTodayMetrics()
      console.log('Dashboard metrics:', data.metrics)
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      data
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return Response.json({
      success: false,
      error: 'Error fetching dashboard data'
    }, { status: 500 })
  }
} 