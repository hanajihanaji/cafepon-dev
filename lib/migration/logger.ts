/**
 * Logging system for image migration
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private startTime: number;

  private constructor(level: LogLevel = LogLevel.INFO) {
    this.logLevel = level;
    this.startTime = Date.now();
  }

  public static getInstance(level?: LogLevel): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(level);
    }
    return Logger.instance;
  }

  public setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    let formatted = `[${timestamp}] [+${elapsed}s] ${level}: ${message}`;
    
    if (context) {
      formatted += ` ${JSON.stringify(context)}`;
    }
    
    return formatted;
  }

  public error(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  public warn(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  public info(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  public debug(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  public verbose(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      console.log(this.formatMessage('VERBOSE', message, context));
    }
  }

  public progress(current: number, total: number, message?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const percentage = ((current / total) * 100).toFixed(1);
      const progressBar = this.createProgressBar(current, total);
      const msg = message ? ` - ${message}` : '';
      console.log(`\r🔄 Progress: ${progressBar} ${percentage}% (${current}/${total})${msg}`);
    }
  }

  private createProgressBar(current: number, total: number, width: number = 20): string {
    const filled = Math.floor((current / total) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }

  public success(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('✅ SUCCESS', message, context));
    }
  }

  public failure(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('❌ FAILURE', message, context));
    }
  }

  public section(title: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log('');
      console.log(`${'='.repeat(50)}`);
      console.log(`🔧 ${title}`);
      console.log(`${'='.repeat(50)}`);
    }
  }

  public subsection(title: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log('');
      console.log(`📋 ${title}`);
      console.log(`${'-'.repeat(30)}`);
    }
  }

  public summary(stats: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    duration: number;
  }): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log('');
      console.log('📊 Migration Summary:');
      console.log(`   Total Items: ${stats.total}`);
      console.log(`   ✅ Successful: ${stats.successful}`);
      console.log(`   ❌ Failed: ${stats.failed}`);
      console.log(`   ⏭️ Skipped: ${stats.skipped}`);
      console.log(`   ⏱️ Duration: ${stats.duration.toFixed(2)}s`);
      console.log('');
    }
  }
}

module.exports = { Logger, LogLevel };