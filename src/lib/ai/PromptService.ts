export class PromptService {
  private static readonly TOPIC_KEYWORDS = {
    technical: [
      'bug', 'error', 'code', 'PR', 'merge', 'deploy', 'implementation',
      'api', 'endpoint', 'database', 'schema', 'test', 'debug', 'fix',
      'backend', 'frontend', 'dev', 'staging', 'production', 'logs',
      'performance', 'latency', 'memory', 'cpu', 'crash', 'exception',
      'dependency', 'package', 'library', 'framework', 'repository',
      'git', 'branch', 'commit', 'pipeline', 'ci/cd', 'build'
    ],
    planning: [
      'sprint', 'timeline', 'plan', 'schedule', 'deadline', 'milestone',
      'roadmap', 'backlog', 'priority', 'estimate', 'scope', 'release',
      'launch', 'delivery', 'target', 'goal', 'objective', 'quarter',
      'project', 'task', 'story', 'epic', 'requirement', 'stakeholder',
      'resource', 'capacity', 'availability', 'timeline', 'blockers'
    ],
    discussion: [
      'think', 'consider', 'suggest', 'opinion', 'perspective',
      'proposal', 'idea', 'feedback', 'review', 'thoughts',
      'discuss', 'explore', 'question', 'concern', 'alternative',
      'approach', 'strategy', 'option', 'possibility', 'recommendation',
      'pros', 'cons', 'trade-off', 'impact', 'risk', 'benefit'
    ],
    decision: [
      'decide', 'agreement', 'approved', 'confirmed', 'go ahead',
      'consensus', 'sign-off', 'green light', 'proceed', 'move forward',
      'finalize', 'conclusion', 'resolved', 'settled', 'determined',
      'agreed', 'decision', 'approval', 'reject', 'accept', 'choose',
      'selected', 'final', 'verdict', 'outcome'
    ],
    status: [
      'update', 'progress', 'status', 'blocker', 'completed',
      'pending', 'ongoing', 'started', 'finished', 'blocked',
      'waiting', 'dependency', 'delayed', 'on track', 'behind',
      'ahead', 'done', 'in progress', 'not started', 'review'
    ]
  };

  private static readonly PROMPT_TEMPLATES = {
    technical: `
      Provide a BRIEF technical summary using this exact format:
      
      🎯 DECISION: [Main technical decision or solution chosen]
      
      KEY POINTS:
      • [Most important technical detail]
      • [Critical implementation note]
      
      ⚡ NEXT STEPS:
      • [Immediate technical action needed]
      
      🚫 BLOCKERS (if any):
      • [List any blocking issues]

      Keep it focused and use max 1-2 bullet points per section.
    `,
    planning: `
      Provide a BRIEF planning summary using this exact format:
      
      🎯 DECISION: [Main decision or agreement reached]
      
      KEY POINTS:
      • [Critical deadline or milestone]
      • [Important resource/assignment]
      
      ⚡ NEXT STEPS:
      • [Immediate action items with owners]
      
      🚫 BLOCKERS (if any):
      • [List any blocking issues]

      Keep it focused and use max 1-2 bullet points per section.
    `,
    discussion: `
      Provide a BRIEF discussion summary using this exact format:
      
      🎯 OUTCOME: [Main conclusion or point of agreement]
      
      KEY POINTS:
      • [Most important discussion point]
      • [Critical perspective shared]
      
      ⚡ NEXT STEPS:
      • [Agreed follow-up actions]
      
      🚫 OPEN ITEMS (if any):
      • [Unresolved points needing attention]

      Keep it focused and use max 1-2 bullet points per section.
    `,
    decision: `
      Provide a BRIEF decision summary using this exact format:
      
      🎯 DECISION: [The final decision made]
      
      RATIONALE:
      • [Key reason for the decision]
      
      ⚡ NEXT STEPS:
      • [Implementation or follow-up actions]
      
      🚫 CONSIDERATIONS (if any):
      • [Important caveats or dependencies]

      Keep it focused and use max 1-2 bullet points per section.
    `,
    status: `
      Provide a BRIEF status summary using this exact format:
      
      🎯 CURRENT STATUS: [Overall status in one line]
      
      PROGRESS:
      • [Key achievement or milestone]
      • [Important update]
      
      ⚡ NEXT STEPS:
      • [Immediate next actions]
      
      🚫 BLOCKERS (if any):
      • [Current blockers or risks]

      Keep it focused and use max 1-2 bullet points per section.
    `
  };

  static generatePrompt(messages: any[]): string {
    const topicTypes = this.detectTopicType(messages);
    const messageCount = messages.length;
    const participants = this.getUniqueParticipants(messages);

    let prompt = `You are summarizing a Slack thread with ${messageCount} messages from ${participants.length} participants.\n\n`;
    prompt += `IMPORTANT FORMATTING RULES:
    1. Use EXACTLY the format provided below
    2. Keep each bullet point BRIEF (max 10-12 words)
    3. Use "none" or "N/A" if a section has no relevant items
    4. Preserve all emojis and section headers exactly as shown
    5. Focus on actionable and concrete information\n\n`;

    // Add topic-specific template
    if (topicTypes.length > 0) {
      prompt += this.PROMPT_TEMPLATES[topicTypes[0] as keyof typeof this.PROMPT_TEMPLATES] + "\n";
    } else {
      prompt += this.PROMPT_TEMPLATES.discussion; // Default to discussion template
    }

    prompt += `\nThread content:\n`;
    prompt += messages.map(msg => `${msg.user}: ${msg.text}`).join('\n');

    return prompt;
  }

  private static getUniqueParticipants(messages: any[]): string[] {
    return [...new Set(messages.map(m => m.user))];
  }

  private static detectTopicType(messages: any[]): string[] {
    const messageText = messages.map(m => m.text.toLowerCase()).join(' ');
    return Object.entries(this.TOPIC_KEYWORDS)
      .filter(([_, keywords]) => 
        (keywords as string[]).some(keyword => messageText.includes(keyword)))
      .map(([type]) => type);
  }
} 