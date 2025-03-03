import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const payload = JSON.parse(data.get('payload') as string);

    if (payload.type === 'shortcut' || payload.type === 'message_action') {
      const view = {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Welcome to TL;DR!* 📝'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Get quick TL;DRs and summaries of your Slack threads.'
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Get TL;DR',
                  emoji: true
                },
                action_id: 'get_tldr',
                style: 'primary'
              }
            ]
          }
        ]
      };

      return NextResponse.json({ view });
    }

    return NextResponse.json({ message: 'No action taken' });
  } catch (error) {
    console.error('Error updating home tab:', error);
    return NextResponse.json(
      { error: 'Failed to update home tab' },
      { status: 500 }
    );
  }
} 