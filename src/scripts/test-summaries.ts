import dotenv from 'dotenv';
import { TestHarness } from '../lib/testing/TestHarness';

// Load environment variables from .env file
dotenv.config();

async function main() {
  // Verify API key is loaded
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }

  const tester = new TestHarness();
  
  try {
    await tester.runTestSuite();
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

main(); 