import { WebClient } from '@slack/web-api';
import { AIService } from '@/lib/ai/AIService';
import { RedisService } from '@/lib/cache/RedisService';

export class SlackService {
  private client: WebClient;
  private aiService: AIService;
  private redisService: RedisService;

  constructor(private token: string) {
    if (!token) {
      throw new Error('Slack bot token is required');
    }
    console.log('Initializing Slack client with token starting with:', token.substring(0, 10));
    this.client = new WebClient(token);
    this.aiService = new AIService();
    this.redisService = new RedisService();
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
        const response = await this.client.conversations.replies({
          channel: channelId,
          ts: threadTs,
        });

        // Debug log
        console.log('Raw thread response:', JSON.stringify(response, null, 2));

        if (!response.ok || !response.messages) {
          throw new Error('Failed to fetch messages');
        }

        // Transform messages into expected format
        const formattedMessages = response.messages.map(msg => ({
          user: msg.user || 'unknown',
          text: msg.text || '',
          ts: msg.ts
        }));

        console.log('Formatted messages:', JSON.stringify(formattedMessages, null, 2));
        return formattedMessages;

      } catch (error: any) {
        if (error?.data?.error === 'not_in_channel') {
          console.log('Bot not in channel, attempting to join...');
          await this.joinChannel(channelId);
          
          // Retry fetching messages after joining
          const retryResponse = await this.client.conversations.replies({
            channel: channelId,
            ts: threadTs,
          });

          if (!retryResponse.ok || !retryResponse.messages) {
            throw new Error('Failed to fetch messages after joining channel');
          }

          const formattedMessages = retryResponse.messages.map(msg => ({
            user: msg.user || 'unknown',
            text: msg.text || '',
            ts: msg.ts
          }));

          return formattedMessages;
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
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Here's the summary!* 📝"
        }
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
      if (section.type === 'decision') {
        const decisionContent = section.content
          .replace(/^[🎯\s]*Decision\/Outcome:?\s*/i, '')
          .trim();

        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🎯 *Decision/Outcome:*\n• ${decisionContent}`
          }
        });
      }
      else if (section.type === 'action') {
        const actionPoints = section.content
          .replace(/^[⚡\s]*Next Steps:?\s*/i, '')
          .split(/\n|\.(?=\s|$)/)  // Split by newline or period followed by space/end
          .filter(point => point.trim())  // Remove empty lines
          .map(point => `• ${point.trim()}`)  // Add bullet points
          .join('\n');

        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `⚡ *Next Steps:*\n${actionPoints}`
          }
        });
      }
      else if (section.type === 'bullet' || section.type === 'text') {
        // For regular content, keep bullet points
        const content = section.content.trim();
        if (content.toLowerCase().includes('decision') || 
            content.toLowerCase().includes('next steps') ||
            content.toLowerCase().includes('outcome')) {
          // Don't add bullet points to headers
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: content
            }
          });
        } else {
          // Add bullet points to regular content
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: content.startsWith('•') ? content : `• ${content}`
            }
          });
        }
      }
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

  async summarizeThread(channelId: string, threadTs: string, userId: string) {
    const startTime = Date.now();
    
    try {
      // Get messages (transient)
      const messages = await this.getThreadMessages(channelId, threadTs);
      
      // Generate summary immediately
      const summary = await this.aiService.summarizeThread(messages);
      
      // Post to thread
      await this.postMessageInChannel(channelId, summary, threadTs);
      
      // Track only anonymous metrics
      await this.redisService.trackMetrics(channelId, threadTs, {
        userId,
        messageCount: messages.length,
        processingTimeMs: Date.now() - startTime,
        isSuccess: true
      });
      
      // Clear sensitive data immediately
      messages.length = 0;
      
      return { success: true };
    } catch (error) {
      // Track error (no sensitive data)
      await this.redisService.trackError('summary_generation_failed');
      console.error('Error in summarizeThread:', error);
      throw error;
    }
  }

  async handleReaction(payload: any) {
    try {
      const { reaction, item } = payload;
      
      // Only process reactions to summaries in public channels
      if (item.type === 'message' && item.channel.startsWith('C')) {
        console.log(`Reaction ${reaction} added to message in channel ${item.channel}`);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      throw error;
    }
  }
} 