import { SlackService } from "@/lib/slack/SlackService";

export async function POST(req: Request) {
  const payload = await req.json();

  // Handle reaction events
  if (payload.type === 'reaction_added' || payload.type === 'reaction_removed') {
    const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
    
    try {
      await slackService.handleReaction(payload);
      return new Response('OK');
    } catch (error) {
      console.error('Error handling reaction:', error);
      return new Response('Error processing reaction', { status: 500 });
    }
  }

  return new Response('OK');
} 