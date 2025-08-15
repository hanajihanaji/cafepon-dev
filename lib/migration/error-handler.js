/**
 * Error Handler - Tsumiki Task 7
 * Comprehensive error handling system with categorized error types and graceful degradation
 */

import { EventEmitter } from 'events';

export class ErrorHandler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseRetryDelay: config.baseRetryDelay || 1000,
      maxRetryDelay: config.maxRetryDelay || 30000,
      exponentialBackoff: config.exponentialBackoff !== false,
      retryableErrors: config.retryableErrors || [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
        'ECONNREFUSED',
        'NETWORK_ERROR',
        'RATE_LIMITED',
        'TEMP_UNAVAILABLE'
      ],
      fatalErrors: config.fatalErrors || [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'INVALID_TOKEN',
        'INSUFFICIENT_PERMISSIONS',
        'INVALID_CONFIG'
      ],
      enableGracefulDegradation: config.enableGracefulDegradation !== false,
      logLevel: config.logLevel || 'info', // 'debug', 'info', 'warn', 'error'
      contextualLogging: config.contextualLogging !== false
    };

    this.stats = {
      totalErrors: 0,
      errorsByCategory: {},
      retriedErrors: 0,
      fatalErrors: 0,
      gracefullyDegraded: 0,
      startTime: new Date(),
      errorHistory: []
    };

    this.errorCategories = {
      // Network-related errors
      NETWORK: {
        patterns: [/ECONNRESET/, /ETIMEDOUT/, /ENOTFOUND/, /EAI_AGAIN/, /ECONNREFUSED/],
        retryable: true,
        severity: 'medium',
        description: 'Network connectivity issues'
      },
      
      // Authentication and authorization errors
      AUTH: {
        patterns: [/401/, /403/, /UNAUTHORIZED/, /FORBIDDEN/, /INVALID_TOKEN/],
        retryable: false,
        severity: 'high',
        description: 'Authentication or authorization failures'
      },
      
      // File system errors
      FILESYSTEM: {
        patterns: [/ENOENT/, /EACCES/, /EPERM/, /EMFILE/, /ENFILE/],
        retryable: false,
        severity: 'high',
        description: 'File system access problems'
      },
      
      // API-specific errors
      API: {
        patterns: [/400/, /422/, /500/, /502/, /503/, /504/],
        retryable: true,
        severity: 'medium',
        description: 'API server errors'
      },
      
      // Validation errors
      VALIDATION: {
        patterns: [/validation/i, /invalid/i, /malformed/i, /corrupt/i],
        retryable: false,
        severity: 'medium',
        description: 'Data validation failures'
      },
      
      // Resource errors
      RESOURCE: {
        patterns: [/too large/i, /quota exceeded/i, /insufficient/i, /limit/i],
        retryable: false,
        severity: 'high',
        description: 'Resource limitations'
      },
      
      // Rate limiting
      RATE_LIMIT: {
        patterns: [/rate.?limit/i, /too many requests/i, /429/],
        retryable: true,
        severity: 'low',
        description: 'Rate limiting restrictions'
      },
      
      // Unknown errors
      UNKNOWN: {
        patterns: [/.*/],
        retryable: true,
        severity: 'medium',
        description: 'Unclassified errors'
      }
    };
  }

  /**
   * Handle error with comprehensive processing
   */
  async handleError(error, context = {}) {
    this.stats.totalErrors++;
    
    // Categorize the error
    const category = this.categorizeError(error);
    this.updateErrorStats(category);
    
    // Create error record with full context
    const errorRecord = this.createErrorRecord(error, category, context);
    
    // Log error with appropriate level
    this.logError(errorRecord);
    
    // Emit error event for listeners
    this.emit('error:categorized', errorRecord);
    
    // Determine if error should be retried
    const shouldRetry = this.shouldRetryError(errorRecord, context);
    
    if (shouldRetry && context.attempt < this.config.maxRetries) {
      const retryDelay = this.calculateRetryDelay(context.attempt || 0, category);
      
      this.stats.retriedErrors++;
      this.emit('error:retry', { errorRecord, retryDelay, attempt: context.attempt + 1 });
      
      await this.sleep(retryDelay);
      return { retry: true, delay: retryDelay };
    }
    
    // Handle fatal errors
    if (this.isFatalError(category, error)) {
      this.stats.fatalErrors++;
      this.emit('error:fatal', errorRecord);
      
      return { 
        retry: false, 
        fatal: true, 
        category: category.name,
        recommendation: this.getRecoveryRecommendation(category, error)
      };
    }
    
    // Attempt graceful degradation
    if (this.config.enableGracefulDegradation) {
      const degradation = this.attemptGracefulDegradation(errorRecord, context);
      
      if (degradation.possible) {
        this.stats.gracefullyDegraded++;
        this.emit('error:degraded', { errorRecord, degradation });
        
        return {
          retry: false,
          degraded: true,
          degradation
        };
      }
    }
    
    // Regular error handling complete
    return {
      retry: false,
      category: category.name,
      severity: category.severity,
      recommendation: this.getRecoveryRecommendation(category, error)
    };
  }

  /**
   * Categorize error based on patterns and characteristics
   */
  categorizeError(error) {
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || error.status || '';
    const combinedError = `${errorMessage} ${errorCode}`;
    
    for (const [name, category] of Object.entries(this.errorCategories)) {
      for (const pattern of category.patterns) {
        if (pattern.test(combinedError)) {
          return { name, ...category };
        }
      }
    }
    
    return { name: 'UNKNOWN', ...this.errorCategories.UNKNOWN };
  }

  /**
   * Create comprehensive error record
   */
  createErrorRecord(error, category, context) {
    return {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      category: category.name,
      severity: category.severity,
      retryable: category.retryable,
      description: category.description,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: this.config.logLevel === 'debug' ? error.stack : undefined,
        name: error.name
      },
      context: {
        operation: context.operation || 'unknown',
        itemId: context.itemId,
        itemName: context.itemName,
        filePath: context.filePath,
        attempt: context.attempt || 0,
        ...context
      }
    };
  }

  /**
   * Determine if error should be retried
   */
  shouldRetryError(errorRecord, context) {
    // Check if error category is retryable
    if (!errorRecord.retryable) {
      return false;
    }
    
    // Check attempt count
    if (context.attempt >= this.config.maxRetries) {
      return false;
    }
    
    // Check for specific non-retryable conditions
    const fatalPatterns = [
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /invalid token/i,
      /permission denied/i
    ];
    
    const errorMessage = errorRecord.error.message || '';
    if (fatalPatterns.some(pattern => pattern.test(errorMessage))) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt, category) {
    let delay = this.config.baseRetryDelay;
    
    if (this.config.exponentialBackoff) {
      delay = this.config.baseRetryDelay * Math.pow(2, attempt);
    } else {
      delay = this.config.baseRetryDelay * (attempt + 1);
    }
    
    // Add category-specific adjustments
    if (category.name === 'RATE_LIMIT') {
      delay *= 2; // Longer delays for rate limiting
    } else if (category.name === 'NETWORK') {
      delay *= 1.5; // Slightly longer for network issues
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    delay += jitter;
    
    return Math.min(delay, this.config.maxRetryDelay);
  }

  /**
   * Check if error is considered fatal
   */
  isFatalError(category, error) {
    // Category-based fatal determination
    if (['AUTH', 'FILESYSTEM'].includes(category.name)) {
      return true;
    }
    
    // Message-based fatal determination
    const fatalPatterns = [
      /invalid configuration/i,
      /missing required parameter/i,
      /file not found/i,
      /permission denied/i,
      /access denied/i,
      /quota exceeded/i,
      /disk full/i
    ];
    
    const errorMessage = error.message || '';
    return fatalPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Attempt graceful degradation
   */
  attemptGracefulDegradation(errorRecord, context) {
    const degradationStrategies = {
      'upload_failed': {
        possible: true,
        strategy: 'skip_and_continue',
        description: 'Skip this image and continue with others',
        impact: 'Single image will not be migrated'
      },
      'update_failed': {
        possible: true,
        strategy: 'manual_link',
        description: 'Upload succeeded but linking failed - can be fixed manually',
        impact: 'Image uploaded but not linked to menu item'
      },
      'network_timeout': {
        possible: true,
        strategy: 'reduce_concurrency',
        description: 'Reduce concurrent operations to improve stability',
        impact: 'Slower processing but higher success rate'
      },
      'rate_limited': {
        possible: true,
        strategy: 'exponential_backoff',
        description: 'Wait longer between requests',
        impact: 'Significantly slower processing'
      }
    };

    const operation = context.operation || 'unknown';
    const strategy = degradationStrategies[operation] || degradationStrategies['network_timeout'];

    // Determine if degradation makes sense for this error
    if (errorRecord.category === 'AUTH' || errorRecord.category === 'FILESYSTEM') {
      return { possible: false, reason: 'Critical system error cannot be degraded' };
    }

    return {
      possible: strategy.possible,
      strategy: strategy.strategy,
      description: strategy.description,
      impact: strategy.impact,
      recommendedAction: this.generateDegradationAction(strategy.strategy, context)
    };
  }

  /**
   * Generate specific degradation action
   */
  generateDegradationAction(strategy, context) {
    switch (strategy) {
      case 'skip_and_continue':
        return `Skip ${context.itemName || 'current item'} and continue processing`;
      
      case 'manual_link':
        return `Image uploaded successfully. Manually link media ID to menu item ${context.itemName || context.itemId}`;
      
      case 'reduce_concurrency':
        return 'Reduce max-concurrency setting and restart migration';
      
      case 'exponential_backoff':
        return 'Increase retry delays and reduce request frequency';
      
      default:
        return 'Continue with caution and monitor for additional errors';
    }
  }

  /**
   * Get recovery recommendation for error
   */
  getRecoveryRecommendation(category, error) {
    const recommendations = {
      NETWORK: 'Check internet connection and Strapi server status',
      AUTH: 'Verify STRAPI_API_TOKEN is correct and has sufficient permissions',
      FILESYSTEM: 'Check file permissions and disk space',
      API: 'Check Strapi server status and logs',
      VALIDATION: 'Verify file format and content are correct',
      RESOURCE: 'Check available disk space and memory',
      RATE_LIMIT: 'Reduce concurrency and increase delays between requests',
      UNKNOWN: 'Review error details and check system resources'
    };

    return recommendations[category.name] || 'Contact system administrator for assistance';
  }

  /**
   * Update error statistics
   */
  updateErrorStats(category) {
    if (!this.stats.errorsByCategory[category.name]) {
      this.stats.errorsByCategory[category.name] = 0;
    }
    this.stats.errorsByCategory[category.name]++;
    
    // Maintain error history (last 100 errors)
    if (this.stats.errorHistory.length >= 100) {
      this.stats.errorHistory.shift();
    }
    this.stats.errorHistory.push({
      timestamp: new Date(),
      category: category.name,
      severity: category.severity
    });
  }

  /**
   * Log error with contextual information
   */
  logError(errorRecord) {
    const logLevel = this.getLogLevel(errorRecord.severity);
    
    if (!this.shouldLog(logLevel)) {
      return;
    }

    const logMessage = this.formatLogMessage(errorRecord);
    
    switch (logLevel) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }

  /**
   * Format log message with context
   */
  formatLogMessage(errorRecord) {
    const timestamp = new Date(errorRecord.timestamp).toLocaleTimeString();
    const context = errorRecord.context;
    
    let message = `[${timestamp}] ${errorRecord.category}(${errorRecord.severity}): ${errorRecord.error.message}`;
    
    if (context.itemName) {
      message += ` | Item: ${context.itemName}`;
    }
    
    if (context.operation) {
      message += ` | Operation: ${context.operation}`;
    }
    
    if (context.attempt > 0) {
      message += ` | Attempt: ${context.attempt + 1}`;
    }

    return message;
  }

  /**
   * Determine log level based on severity
   */
  getLogLevel(severity) {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warn';
      case 'high': return 'error';
      default: return 'warn';
    }
  }

  /**
   * Check if should log based on configuration
   */
  shouldLog(logLevel) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(logLevel);
    
    return messageLevel >= currentLevel;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get comprehensive error statistics
   */
  getErrorStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    
    return {
      ...this.stats,
      uptime: Math.round(uptime / 1000),
      errorRate: this.stats.totalErrors / Math.max(uptime / 1000 / 60, 1), // errors per minute
      retryRate: this.stats.retriedErrors / Math.max(this.stats.totalErrors, 1) * 100,
      fatalRate: this.stats.fatalErrors / Math.max(this.stats.totalErrors, 1) * 100,
      degradationRate: this.stats.gracefullyDegraded / Math.max(this.stats.totalErrors, 1) * 100
    };
  }

  /**
   * Generate error handling report
   */
  generateErrorReport() {
    const stats = this.getErrorStats();
    
    return {
      summary: {
        totalErrors: stats.totalErrors,
        retriedErrors: stats.retriedErrors,
        fatalErrors: stats.fatalErrors,
        gracefullyDegraded: stats.gracefullyDegraded,
        uptime: stats.uptime,
        errorRate: stats.errorRate.toFixed(2),
        retryRate: stats.retryRate.toFixed(1) + '%',
        fatalRate: stats.fatalRate.toFixed(1) + '%',
        degradationRate: stats.degradationRate.toFixed(1) + '%'
      },
      categories: stats.errorsByCategory,
      recentErrors: stats.errorHistory.slice(-10),
      recommendations: this.generateSystemRecommendations(stats)
    };
  }

  /**
   * Generate system-wide recommendations based on error patterns
   */
  generateSystemRecommendations(stats) {
    const recommendations = [];
    
    // High error rate
    if (stats.errorRate > 1) {
      recommendations.push({
        type: 'performance',
        message: 'High error rate detected - consider reducing concurrency',
        priority: 'high'
      });
    }
    
    // High retry rate
    if (stats.retryRate > 50) {
      recommendations.push({
        type: 'stability',
        message: 'High retry rate - check network connectivity and server stability',
        priority: 'medium'
      });
    }
    
    // High fatal rate
    if (stats.fatalRate > 20) {
      recommendations.push({
        type: 'configuration',
        message: 'High fatal error rate - review configuration and permissions',
        priority: 'high'
      });
    }
    
    // Specific category recommendations
    if (stats.errorsByCategory.NETWORK > 5) {
      recommendations.push({
        type: 'network',
        message: 'Multiple network errors - check internet connectivity',
        priority: 'medium'
      });
    }
    
    if (stats.errorsByCategory.AUTH > 0) {
      recommendations.push({
        type: 'authentication',
        message: 'Authentication errors detected - verify API token',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Reset error statistics
   */
  resetStats() {
    this.stats = {
      totalErrors: 0,
      errorsByCategory: {},
      retriedErrors: 0,
      fatalErrors: 0,
      gracefullyDegraded: 0,
      startTime: new Date(),
      errorHistory: []
    };
  }
}