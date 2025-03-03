type SimulatedMessage = {
  user: string;
  text: string;
  timestamp: string;
  thread_ts?: string;
}

export class ConversationSimulator {
  private conversationTemplates = {
    technicalDiscussion: [
      { role: "engineer1", text: "We need to migrate the database by next week." },
      { role: "engineer2", text: "That's tight. We'll need to plan the downtime." },
      { role: "devops", text: "I can schedule maintenance window for Sunday 2AM." },
      // More focused on key decisions/actions for better TL;DR testing
    ],
    projectPlanning: [
      { role: "pm", text: "Let's discuss the Q2 roadmap for the mobile app." },
      { role: "designer", text: "We should prioritize the new onboarding flow." },
      { role: "engineer", text: "The authentication refactor needs to be done first." },
      // ... more messages
    ],
    customerSupport: [
      { role: "support", text: "Customer reported issues with login on iOS." },
      { role: "engineer", text: "Can you get their app version and device model?" },
      { role: "qa", text: "We've seen similar issues in testing." },
      // ... more messages
    ]
  };

  private users = {
    engineer1: "Alice Chen (Senior Backend Engineer)",
    engineer2: "Bob Smith (Frontend Lead)",
    devops: "Carol Jones (DevOps Engineer)",
    pm: "David Wilson (Product Manager)",
    designer: "Eva Brown (UX Designer)",
    support: "Frank Miller (Customer Support)",
    qa: "Grace Lee (QA Lead)"
  };

  generateThread(type: keyof typeof this.conversationTemplates, messageCount: number = 10): SimulatedMessage[] {
    const template = this.conversationTemplates[type];
    const thread_ts = new Date().getTime().toString();
    
    return template.slice(0, messageCount).map((msg, index) => ({
      user: this.users[msg.role as keyof typeof this.users],
      text: msg.text,
      timestamp: (new Date().getTime() + index * 60000).toString(),
      thread_ts: thread_ts
    }));
  }
} 