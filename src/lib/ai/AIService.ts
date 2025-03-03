import { PromptService } from './PromptService';

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!;
  }

  async summarizeThread(messages: any[]): Promise<{
    tldr: string;
    summary: string;
  }> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: "user",
        content: msg.text || ""
      }));

      // Updated system prompt to request both TL;DR and summary
      formattedMessages.unshift({
        role: "system",
        content: `You are a helpful assistant that provides clear TL;DR and summaries of Slack conversations.
        First provide a one-line TL;DR (max 15 words).
        Then provide a brief but detailed summary below it.
        Format your response exactly like this:
        TL;DR: [Your one-line summary]
        
        Summary: [Your detailed summary]`
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      // Parse the response into TL;DR and Summary
      const tldrMatch = content.match(/TL;DR: (.*?)(?:\n|$)/);
      const summaryMatch = content.match(/Summary: ([\s\S]*$)/);

      return {
        tldr: tldrMatch?.[1] || 'No TL;DR available',
        summary: summaryMatch?.[1]?.trim() || 'No summary available'
      };
    } catch (error) {
      console.error('Error in summarizeThread:', error);
      throw error;
    }
  }
} 