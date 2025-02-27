export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
  }

  async summarizeThread(messages: any[]) {
    try {
      const prompt = this.buildPrompt(messages);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes Slack threads. Extract key points, decisions, and action items. Be concise but comprehensive.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in AI service:', error);
      throw error;
    }
  }

  private buildPrompt(messages: any[]): string {
    return messages
      .map(msg => `${msg.user}: ${msg.text}`)
      .join('\n');
  }
} 