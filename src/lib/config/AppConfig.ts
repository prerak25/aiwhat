export const AppConfig = {
  slack: {
    maxThreadMessages: 100,
    rateLimitPerHour: 100,
    modalTimeout: 30000, // 30 seconds
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