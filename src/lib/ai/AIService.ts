export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!;
  }

  async summarizeThread(messages: any[]) {
    try {
      const prompt = this.buildPrompt(messages);
      console.log('Sending request to OpenAI with prompt:', prompt);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes Slack threads. Extract key points, decisions, and action items. Be concise but comprehensive.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      console.log('Received response from OpenAI:', data);

      if (!data.choices || !data.choices[0]) {
        console.error('Unexpected API response:', data);
        throw new Error('Invalid API response format');
      }

      return data.choices[0].message?.content || 'Failed to generate summary';
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