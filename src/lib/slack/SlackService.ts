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

  async joinChannel(channelId: string) {
    try {
      console.log('Attempting to join channel:', channelId);
      await this.client.conversations.join({ channel: channelId });
      console.log('Successfully joined channel');
    } catch (error) {
      console.error('Error joining channel:', error);
      throw error;
    }
  }

  async getThreadMessages(channelId: string, threadTs: string) {
    try {
      console.log('Fetching thread messages:', { channelId, threadTs });
      
      try {
        return await this.client.conversations.replies({
          channel: channelId,
          ts: threadTs,
        });
      } catch (error: any) {
        // If the error is 'not_in_channel', try to join the channel and retry
        if (error?.data?.error === 'not_in_channel') {
          console.log('Bot not in channel, attempting to join...');
          await this.joinChannel(channelId);
          
          // Retry fetching messages after joining
          return await this.client.conversations.replies({
            channel: channelId,
            ts: threadTs,
          });
        }
        throw error;
      }
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
      try {
        return await this.sendFormattedMessage(channelId, summary, threadTs);
      } catch (error: any) {
        // If the error is 'not_in_channel', try to join the channel and retry
        if (error?.data?.error === 'not_in_channel') {
          console.log('Bot not in channel, attempting to join...');
          await this.joinChannel(channelId);
          
          // Retry sending message after joining
          return await this.sendFormattedMessage(channelId, summary, threadTs);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error posting message:', error);
      throw error;
    }
  }

  private async sendFormattedMessage(channelId: string, summary: string, threadTs?: string) {
    // Move the message formatting logic to a separate method
    const sections = this.parseSummary(summary);
    const blocks = this.buildMessageBlocks(sections, channelId, threadTs);

    return await this.client.chat.postMessage({
      channel: channelId,
      blocks: blocks,
      text: "Thread Summary" // Fallback text
    });
  }

  private buildMessageBlocks(sections: { type: string; content: string }[], channelId: string, threadTs?: string) {
    const blocks: any[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📝 Thread Summary",
          emoji: true
        }
      },
      {
        type: "divider"
      }
    ];

    // Add thread link if available
    if (threadTs) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📍 <https://slack.com/archives/${channelId}/p${threadTs.replace('.', '')}|View Original Thread>`
          }
        ]
      });
    }

    // Add formatted sections
    sections.forEach(section => {
      blocks.push(...this.formatSection(section));
    });

    // Add feedback section
    blocks.push(
      {
        type: "divider"
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
    );

    return blocks;
  }

  private parseSummary(summary: string): { type: string; content: string }[] {
    const lines = summary.split('\n');
    const sections: { type: string; content: string }[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Detect line type based on content
      if (trimmedLine.toLowerCase().includes('decision:') || 
          trimmedLine.toLowerCase().includes('decided:')) {
        sections.push({ type: 'decision', content: trimmedLine });
      }
      else if (trimmedLine.toLowerCase().includes('action:') || 
               trimmedLine.toLowerCase().includes('next step:')) {
        sections.push({ type: 'action', content: trimmedLine });
      }
      else if (trimmedLine.toLowerCase().includes('blocker:') || 
               trimmedLine.toLowerCase().includes('blocked by:')) {
        sections.push({ type: 'blocker', content: trimmedLine });
      }
      else if (trimmedLine.startsWith('•') || 
               trimmedLine.startsWith('-') || 
               trimmedLine.match(/^\d+\./)) {
        sections.push({ type: 'bullet', content: trimmedLine });
      }
      else {
        sections.push({ type: 'text', content: trimmedLine });
      }
    });

    return sections;
  }

  private formatSection(section: { type: string; content: string }): any[] {
    const blocks: any[] = [];
    let emoji = '•';
    let color = '';

    // Set emoji and color based on section type
    switch (section.type) {
      case 'decision':
        emoji = '🎯';
        color = '#2ECC71'; // Green
        break;
      case 'action':
        emoji = '⚡';
        color = '#3498DB'; // Blue
        break;
      case 'blocker':
        emoji = '🚫';
        color = '#E74C3C'; // Red
        break;
      case 'bullet':
        emoji = '•';
        break;
    }

    // Format the content
    let formattedText = section.content
      .replace(/^[•\-]\s*/, '') // Remove bullet points
      .replace(/^\d+\.\s*/, ''); // Remove numbering

    // Add color formatting if specified
    if (color) {
      formattedText = `\`\`\`${formattedText}\`\`\``;
    }

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} ${formattedText}`
      }
    });

    return blocks;
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