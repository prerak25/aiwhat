import { WebClient } from '@slack/web-api';

export class SlackService {
  private client: WebClient;

  constructor(token: string) {
    if (!token) {
      throw new Error('Slack bot token is required');
    }
    console.log('Initializing Slack client with token starting with:', token.substring(0, 10));
    this.client = new WebClient(token);
  }

  async getThreadMessages(channelId: string, threadTs: string) {
    try {
      console.log('Fetching thread messages:', { channelId, threadTs });
      
      const result = await this.client.conversations.replies({
        channel: channelId,
        ts: threadTs,
      });

      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }

      console.log('Successfully fetched thread messages');
      return result.messages;
    } catch (error) {
      console.error('Error fetching thread:', error);
      throw error;
    }
  }

  async openModal({ trigger_id, view }: { trigger_id: string, view: any }) {
    try {
      console.log('Opening modal with trigger_id:', trigger_id);
      
      const result = await this.client.views.open({
        trigger_id,
        view
      });

      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }

      console.log('Successfully opened modal');
      return result;
    } catch (error) {
      console.error('Error opening modal:', error);
      throw error;
    }
  }

  async postMessageInChannel(channelId: string, summary: string, threadTs?: string) {
    try {
      console.log('Posting summary in channel:', { channelId });
      
      const result = await this.client.chat.postMessage({
        channel: channelId,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Here's your thread summary!* 📝\n${threadTs ? `<https://slack.com/archives/${channelId}/p${threadTs.replace('.', '')}|View Original Thread>\n\n` : ''}${summary}`
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "Was this summary helpful? React with 👍 or 👎"
              }
            ]
          }
        ]
      });

      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }

      console.log('Successfully posted summary message in channel');
      return result;
    } catch (error) {
      console.error('Error posting message:', error);
      throw error;
    }
  }

  async postMessageInThread(channelId: string, threadTs: string, summary: string) {
    try {
      console.log('Posting summary in thread:', { channelId, threadTs });
      
      const result = await this.client.chat.postMessage({
        channel: channelId,
        thread_ts: threadTs,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Thread Summary* 📝\n" + summary
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "Was this summary helpful? React with 👍 or 👎"
              }
            ]
          }
        ]
      });

      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }

      console.log('Successfully posted summary message in thread');
      return result;
    } catch (error) {
      console.error('Error posting message:', error);
      throw error;
    }
  }
} 