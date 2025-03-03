import { RedisService } from '@/lib/cache/RedisService'

export async function GET(req: Request) {
  const redis = new RedisService()
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') || 'all'

  try {
    const data: any = {}

    // Get metrics
    if (view === 'all' || view === 'metrics') {
      const metrics = await redis.getTodayMetrics()
      data.metrics = {
        ...metrics,
        tldrStats: {
          avgLength: metrics.avg_tldr_length,
          total: metrics.total_requests
        },
        summaryStats: {
          avgLength: metrics.avg_summary_length
        }
      }
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