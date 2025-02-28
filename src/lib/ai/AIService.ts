import { PromptService } from './PromptService';

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!;
  }

  async summarizeThread(messages: any[]) {
    try {
      const prompt = PromptService.generatePrompt(messages);
      console.log('Generated prompt:', prompt);

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
              content: 'You are an expert at analyzing conversations and providing clear, structured summaries.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      console.log('Received response:', data);

      return data.choices[0].message?.content || 'Failed to generate summary';
    } catch (error) {
      console.error('Error in AI service:', error);
      throw error;
    }
  }
} 