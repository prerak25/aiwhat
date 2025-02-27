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
} 