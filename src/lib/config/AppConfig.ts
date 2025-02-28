type ResponseMode = 'modal' | 'message' | 'both';

export const AppConfig = {
  slack: {
    maxThreadMessages: 100,
    rateLimitPerHour: 100,
    modalTimeout: 30000, // 30 seconds
    responseMode: (process.env.RESPONSE_MODE || 'message') as ResponseMode,
  },
  redis: {
    cacheTTL: 3600, // 1 hour
    prefix: {
      summary: 'summary:',
      rateLimit: 'ratelimit:',
    }
  },
  ai: {
    maxRetries: 3,
    timeout: 15000, // 15 seconds
  }
}; 