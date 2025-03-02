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

      // Generate summary
      console.log('\n=== Generated Summary ===');
      const summary = await this.aiService.summarizeThread(messages);
      console.log(summary);

      return {
        messages,
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