import { DatabaseService } from '@/lib/db/DatabaseService';

export async function GET(req: Request) {
  const db = new DatabaseService();
  const { searchParams } = new URL(req.url);
  
  const workspaceId = searchParams.get('workspaceId');
  
  if (!workspaceId) {
    return new Response('Workspace ID required', { status: 400 });
  }

  try {
    // Get various analytics
    const [summaries, popularChannels, recentActivity] = await Promise.all([
      db.getWorkspaceSummaries(workspaceId),
      db.getPopularChannels(workspaceId),
      db.getAnalytics(workspaceId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      }),
    ]);

    return Response.json({
      summaries,
      popularChannels,
      recentActivity,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 