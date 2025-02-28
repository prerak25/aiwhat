import { NextResponse } from 'next/server';
import { SlackService } from '@/lib/slack/SlackService';
import { AIService } from '@/lib/ai/AIService';
import { DatabaseService } from '@/lib/db/DatabaseService';
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
  console.log('🚀 POST request received', new Date().toISOString());
  
  try {
    const body = await req.text();
    console.log('📝 Request body:', body);
    
    const signature = req.headers.get('x-slack-signature');
    const timestamp = req.headers.get('x-slack-request-timestamp');
    
    console.log('🔐 Verification headers:', { signature, timestamp });

    // Skip verification in development if needed
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping signature verification in development');
    } else if (!verifySlackRequest(signature || '', timestamp || '', body)) {
      console.log('❌ Invalid request signature');
      return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
    }

    const payload = JSON.parse(new URLSearchParams(body).get('payload') || '');
    console.log('📦 Parsed payload:', payload);

    if (payload.type === 'message_action' && payload.callback_id === 'summarize_thread') {
      const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
      const aiService = new AIService();

      const messages = await slackService.getThreadMessages(
        payload.channel.id,
        payload.message.thread_ts || payload.message.ts
      );

      const summary = await aiService.summarizeThread(messages);

      // Handle response based on configuration
      switch (AppConfig.slack.responseMode) {
        case 'message':
          await slackService.postMessageInChannel(
            payload.channel.id,
            summary,
            payload.message.thread_ts || payload.message.ts
          );
          break;

        case 'modal':
          await slackService.openModal({
            trigger_id: payload.trigger_id,
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
          break;

        case 'both':
          await Promise.all([
            slackService.postMessageInChannel(
              payload.channel.id,
              summary,
              payload.message.thread_ts || payload.message.ts
            ),
            slackService.openModal({
              trigger_id: payload.trigger_id,
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
            })
          ]);
          break;
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in action handler:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
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
  const dbService = new DatabaseService();

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