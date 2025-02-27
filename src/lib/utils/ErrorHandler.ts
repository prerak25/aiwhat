export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code
    };
  }

  // Handle Slack API errors
  if (error && typeof error === 'object' && 'data' in error) {
    return {
      message: 'Slack API Error',
      statusCode: 400,
      code: 'SLACK_API_ERROR'
    };
  }

  // Handle AI API errors
  if (error && typeof error === 'object' && 'response' in error) {
    return {
      message: 'AI Service Error',
      statusCode: 500,
      code: 'AI_SERVICE_ERROR'
    };
  }

  // Default error
  return {
    message: 'Internal Server Error',
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR'
  };
}; 