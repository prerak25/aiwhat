import { AIService } from '../ai/AIService';
import { ConversationSimulator } from './ConversationSimulator';

export class TestHarness {
  private aiService: AIService;
  private simulator: ConversationSimulator;

  constructor() {
    this.aiService = new AIService();
    this.simulator = new ConversationSimulator();
  }

  async testSummary(type: string, messageCount: number) {
    try {
      // Generate simulated thread
      const messages = this.simulator.generateThread(type as any, messageCount);
      console.log('\n=== Test Scenario ===');
      console.log(`Type: ${type}`);
      console.log(`Messages: ${messageCount}`);
      
      // Log messages
      console.log('\n=== Messages ===');
      messages.forEach(msg => {
        console.log(`${msg.user}: ${msg.text}`);
      });

      // Updated to handle both TL;DR and summary
      const { tldr, summary } = await this.aiService.summarizeThread(messages);
      
      console.log('\n=== Generated TL;DR ===');
      console.log(tldr);
      console.log('\n=== Generated Summary ===');
      console.log(summary);

      return {
        messages,
        tldr,
        summary,
        messageCount: messages.length
      };
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }

  async runTestSuite() {
    const scenarios = [
      { type: 'technicalDiscussion', count: 5 },
      { type: 'technicalDiscussion', count: 15 },
      { type: 'projectPlanning', count: 8 },
      { type: 'customerSupport', count: 10 }
    ];

    console.log('Starting test suite...\n');

    for (const scenario of scenarios) {
      await this.testSummary(scenario.type, scenario.count);
      console.log('\n-------------------\n');
    }
  }
} 