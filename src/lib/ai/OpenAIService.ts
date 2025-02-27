import { Configuration, OpenAIApi } from 'openai';

export class OpenAIService {
  private openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async summarizeThread(messages: any[]) {
    try {
      const prompt = this.buildPrompt(messages);
      
      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes Slack threads. Extract key points, decisions, and action items. Be concise but comprehensive."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      return completion.data.choices[0].message?.content;
    } catch (error) {
      console.error('Error in OpenAI service:', error);
      throw error;
    }
  }

  private buildPrompt(messages: any[]): string {
    return messages
      .map(msg => `${msg.user}: ${msg.text}`)
      .join('\n');
  }
} 