type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Logger {
  static log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level,
      message,
      ...(meta && { meta })
    };

    if (process.env.NODE_ENV === 'production') {
      // In production, you might want to use a proper logging service
      console[level](JSON.stringify(logMessage));
    } else {
      // In development, pretty print
      console[level](message, meta || '');
    }
  }

  static info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  static error(message: string, meta?: any) {
    this.log('error', message, meta);
  }

  static warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  static debug(message: string, meta?: any) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  }
} 