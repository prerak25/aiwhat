export class PromptService {
  private static readonly TOPIC_KEYWORDS = {
    technical: [
      'bug', 'error', 'code', 'PR', 'merge', 'deploy', 'implementation',
      'api', 'database', 'test', 'fix', 'backend', 'frontend', 'dev',
      'performance', 'dependency', 'git', 'pipeline'
    ],
    planning: [
      'sprint', 'timeline', 'plan', 'schedule', 'deadline', 'milestone',
      'roadmap', 'priority', 'estimate', 'scope', 'release', 'launch',
      'project', 'task', 'requirement'
    ],
    work_discussion: [
      'decision', 'approve', 'confirm', 'agree', 'proposal', 'review',
      'status', 'update', 'progress', 'blocker', 'pending', 'meeting',
      'discuss', 'sync', 'alignment'
    ],
    casual: [
      'lunch', 'break', 'coffee', 'fun', 'weekend', 'holiday', 'party',
      'social', 'game', 'chat', 'joke', 'haha', 'lol'
    ]
  };

  private static readonly PROMPT_TEMPLATES = {
    technical: `
      Provide a brief technical summary:
      
      🎯 Decision/Outcome:
      [Main technical decision or solution]

      ⚡ Next Steps:
      • [Key technical actions needed]
    `,
    planning: `
      Provide a brief planning summary:
      
      🎯 Agreed:
      [Main decisions/agreements]

      ⚡ Next Steps:
      • [Key actions and deadlines]
    `,
    work_discussion: `
      Provide a brief summary of the key points discussed:
      
      • [Main point 1]
      • [Main point 2]
      
      ⚡ Next Steps (if any):
      [Action items if applicable]
    `,
    casual: `This appears to be a casual conversation. Would you like me to summarize it?`
  };

  static generatePrompt(messages: any[]): string {
    try {
      if (!Array.isArray(messages)) {
        console.error('Invalid messages format:', messages);
        messages = [];
      }

      const messageText = messages
        .filter(m => m && typeof m.text === 'string')
        .map(m => m.text.toLowerCase())
        .join(' ');

      // First check if it's a casual conversation
      if (this.TOPIC_KEYWORDS.casual.some(keyword => messageText.includes(keyword))) {
        return this.PROMPT_TEMPLATES.casual;
      }

      // Detect other topic types
      const topicTypes = this.detectTopicType(messages);
      const messageCount = messages.length;

      let prompt = `Summarize this ${messageCount}-message Slack thread.\n`;
      prompt += `IMPORTANT: Keep it brief and natural. Focus on what matters.\n\n`;

      // If we detect a specific work-related topic, use its template
      if (topicTypes.length > 0 && topicTypes[0] !== 'casual') {
        prompt += this.PROMPT_TEMPLATES[topicTypes[0] as keyof typeof this.PROMPT_TEMPLATES] + "\n";
      } else {
        // For general discussions, use a simple format
        prompt += `
          Provide a brief, natural summary of the discussion:
          • Focus on main points only
          • Include any conclusions reached
          • Note any action items (if applicable)
          
          Keep it conversational and skip unnecessary formatting.
        `;
      }

      prompt += `\nThread content:\n`;
      prompt += messages.map(msg => `${msg.user}: ${msg.text}`).join('\n');

      return prompt;
    } catch (error) {
      console.error('Error in generatePrompt:', error);
      return 'Please provide a brief summary of the discussion.';
    }
  }

  private static detectTopicType(messages: any[]): string[] {
    try {
      const messageText = messages
        .filter(m => m && typeof m.text === 'string')
        .map(m => m.text.toLowerCase())
        .join(' ');

      return Object.entries(this.TOPIC_KEYWORDS)
        .filter(([_, keywords]) => 
          (keywords as string[]).some(keyword => messageText.includes(keyword)))
        .map(([type]) => type);
    } catch (error) {
      console.error('Error in detectTopicType:', error);
      return ['work_discussion'];
    }
  }
} 