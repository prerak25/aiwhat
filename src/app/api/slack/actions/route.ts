import { NextResponse } from 'next/server';
import { SlackService } from '@/lib/slack/SlackService';
import { AIService } from '@/lib/ai/AIService';

import { RedisService } from '@/lib/cache/RedisService';
import { rateLimiter } from '@/lib/middleware/rateLimiter';
import { verifySlackRequest } from '@/lib/utils/verifySlackRequest';
import { errorHandler, AppError } from '@/lib/utils/ErrorHandler';
import { Logger } from '@/lib/utils/Logger';
import { AppConfig } from '@/lib/config/AppConfig';

// Add GET handler for testing
export async function GET(req: Request) {
  console.log('🔍 GET request received');
  return NextResponse.json({ message: 'API is working' });
}

export async function POST(req: Request) {
  try {
    console.log('Received Slack action request');
    const data = await req.formData();
    const payloadStr = data.get('payload') as string;
    console.log('Raw payload:', payloadStr);
    
    const payload = JSON.parse(payloadStr);
    console.log('Parsed payload:', payload);

    // Handle message action
    if (payload.type === 'message_action') {
      console.log('Message action received');
      const slackService = new SlackService(process.env.SLACK_BOT_TOKEN as string);
      
      const channelId = payload.channel.id;
      const threadTs = payload.message.thread_ts || payload.message.ts;
      const userId = payload.user.id;

      console.log('Processing request with:', { channelId, threadTs, userId });

      // Generate and post summary
      await slackService.summarizeThread(channelId, threadTs, userId);
      console.log('Summary posted successfully');

      return NextResponse.json({ message: 'Processing summary request' });
    }

    // Handle block actions (for app home or other interactive components)
    if (payload.type === 'block_actions') {
      console.log('Block action received:', payload.actions[0]);
      const action = payload.actions[0];
      
      if (action.action_id === 'get_tldr') {
        console.log('TLDR action triggered');
        const slackService = new SlackService(process.env.SLACK_BOT_TOKEN as string);
        
        const channelId = payload.channel.id;
        const threadTs = payload.message.thread_ts || payload.message.ts;
        const userId = payload.user.id;

        console.log('Processing request with:', { channelId, threadTs, userId });

        // Generate and post summary
        await slackService.summarizeThread(channelId, threadTs, userId);
        console.log('Summary posted successfully');

        return NextResponse.json({ message: 'Processing summary request' });
      }
    }

    console.log('No matching action found');
    return NextResponse.json({ message: 'No action taken' });

  } catch (error) {
    console.error('Error processing Slack action:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleSummarizeAction(payload: any) {
  const redisService = new RedisService();
  const cachedSummary = await redisService.getCachedSummary(
    payload.message.thread_ts || payload.message.ts,
    payload.channel.id
  );

  if (cachedSummary) {
    Logger.info('Returning cached summary');
    return await showSummaryModal(payload.trigger_id, cachedSummary);
  }

  const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
  const aiService = new AIService();

  const messages = await slackService.getThreadMessages(
    payload.channel.id,
    payload.message.thread_ts || payload.message.ts
  );

  if (!messages) {
    throw new AppError('No messages found', 400, 'NO_MESSAGES');
  }

  if (messages.length > AppConfig.slack.maxThreadMessages) {
    throw new AppError('Thread too long', 400, 'THREAD_TOO_LONG');
  }

  const summary = await aiService.summarizeThread(messages);

  await Promise.all([
    dbService.saveSummary({
      threadTs: payload.message.thread_ts || payload.message.ts,
      channelId: payload.channel.id,
      content: summary,
      workspaceId: payload.team.id,
    }),
    redisService.cacheSummary(
      payload.message.thread_ts || payload.message.ts,
      payload.channel.id,
      summary
    )
  ]);

  Logger.info('Summary generated and cached');
  return await showSummaryModal(payload.trigger_id, summary);
}

async function showSummaryModal(triggerId: string, summary: string) {
  const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
  await slackService.openModal({
    trigger_id: triggerId,
    view: {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: 'Thread Summary'
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: summary
          }
        }
      ]
    }
  });

  return NextResponse.json({ ok: true });
} 