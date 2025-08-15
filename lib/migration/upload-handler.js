/**
 * Upload Handler - Tsumiki Task 6
 * Enhanced image upload and reference update logic with retry mechanisms
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export class UploadHandler extends EventEmitter {
  constructor(strapiClient, config = {}) {
    super();
    
    this.strapiClient = strapiClient;
    this.errorHandler = config.errorHandler; // Injected from ImageMigrationManager
    this.config = {
      maxRetries: 3,
      retryDelay: 1000, // Base delay in ms
      exponentialBackoff: true,
      timeout: 30000, // 30 seconds per upload
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportedFormats: ['.jpg', '.jpeg', '.png', '.svg', '.avif', '.webp', '.gif'],
      atomicOperations: true,
      ...config
    };

    this.stats = {
      uploadAttempts: 0,
      uploadRetries: 0,
      updateAttempts: 0,
      updateRetries: 0,
      timeouts: 0,
      errors: []
    };
  }

  /**
   * Main upload and update orchestrator with atomic operations
   */
  async uploadAndUpdateMenuItem(menuItem, imagePath) {
    const operation = {
      menuItem,
      imagePath,
      status: 'pending',
      attempts: 0,
      uploadResult: null,
      updateResult: null,
      errors: []
    };

    this.emit('operation:started', { operation });

    try {
      // Phase 1: Validate file before upload
      const validationResult = await this.validateFile(imagePath);
      if (!validationResult.valid) {
        operation.status = 'validation_failed';
        operation.errors.push(...validationResult.errors);
        this.emit('operation:failed', { operation, reason: 'validation' });
        return { success: false, operation };
      }

      // Phase 2: Upload with enhanced error handling
      const uploadResult = await this.uploadWithEnhancedRetry(imagePath, {
        alternativeText: menuItem.name,
        caption: menuItem.description || null
      }, {
        operation: 'upload',
        itemId: menuItem.id,
        itemName: menuItem.name,
        filePath: imagePath
      });

      operation.uploadResult = uploadResult;

      if (!uploadResult.success) {
        operation.status = 'upload_failed';
        operation.errors.push(uploadResult.error);
        this.emit('operation:failed', { operation, reason: 'upload' });
        return { success: false, operation };
      }

      // Phase 3: Update menu item with atomic operation
      if (this.config.atomicOperations) {
        const updateResult = await this.atomicUpdateMenuItem(menuItem, uploadResult);
        operation.updateResult = updateResult;

        if (!updateResult.success) {
          operation.status = 'update_failed';
          operation.errors.push(updateResult.error);
          
          // Attempt cleanup of uploaded file if update fails
          await this.cleanupFailedUpload(uploadResult.mediaId);
          
          this.emit('operation:failed', { operation, reason: 'update' });
          return { success: false, operation };
        }
      } else {
        // Non-atomic update (legacy mode)
        const updateResult = await this.updateWithRetry(menuItem.id, uploadResult.mediaId);
        operation.updateResult = updateResult;

        if (!updateResult.success) {
          operation.status = 'update_failed';
          operation.errors.push(updateResult.error);
          this.emit('operation:failed', { operation, reason: 'update' });
          return { success: false, operation };
        }
      }

      operation.status = 'completed';
      this.emit('operation:completed', { operation });
      
      return {
        success: true,
        operation,
        mediaId: uploadResult.mediaId,
        mediaUrl: uploadResult.mediaUrl,
        skipped: uploadResult.skipped || false
      };

    } catch (error) {
      operation.status = 'error';
      operation.errors.push(error.message);
      this.emit('operation:failed', { operation, reason: 'unexpected', error });
      
      return { success: false, operation, error: error.message };
    }
  }

  /**
   * Validate file before upload
   */
  async validateFile(filePath) {
    const result = { valid: true, errors: [] };

    try {
      // Check file existence
      if (!fs.existsSync(filePath)) {
        result.valid = false;
        result.errors.push(`File not found: ${filePath}`);
        return result;
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      // Check file size
      if (stats.size > this.config.maxFileSize) {
        result.valid = false;
        result.errors.push(
          `File too large: ${Math.round(stats.size / 1024 / 1024)}MB > ${Math.round(this.config.maxFileSize / 1024 / 1024)}MB`
        );
      }

      // Check file format
      const ext = path.extname(filePath).toLowerCase();
      if (!this.config.supportedFormats.includes(ext)) {
        result.valid = false;
        result.errors.push(
          `Unsupported format: ${ext}. Supported: ${this.config.supportedFormats.join(', ')}`
        );
      }

      // Check if file is readable
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch (error) {
        result.valid = false;
        result.errors.push(`File not readable: ${error.message}`);
      }

      return result;

    } catch (error) {
      result.valid = false;
      result.errors.push(`File validation error: ${error.message}`);
      return result;
    }
  }

  /**
   * Enhanced upload with error handler integration
   */
  async uploadWithEnhancedRetry(filePath, metadata, context = {}) {
    if (this.errorHandler) {
      return this.uploadWithErrorHandler(filePath, metadata, context);
    } else {
      // Fallback to legacy retry mechanism
      return this.uploadWithRetry(filePath, metadata);
    }
  }

  /**
   * Upload with comprehensive error handling
   */
  async uploadWithErrorHandler(filePath, metadata, context) {
    let attempt = 0;
    
    while (attempt < this.config.maxRetries) {
      try {
        this.stats.uploadAttempts++;
        
        this.emit('upload:attempt', {
          filePath: path.basename(filePath),
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries
        });

        const uploadPromise = this.strapiClient.uploadImage(filePath, metadata);
        const result = await this.withTimeout(uploadPromise, this.config.timeout);

        if (result.success) {
          this.emit('upload:success', {
            filePath: path.basename(filePath),
            attempt: attempt + 1,
            mediaId: result.mediaId,
            skipped: result.skipped || false
          });
          
          return result;
        } else {
          // Create error object for error handler
          const error = new Error(result.error);
          error.code = result.reason;
          
          const errorContext = {
            ...context,
            attempt,
            filePath: path.basename(filePath)
          };
          
          const errorResult = await this.errorHandler.handleError(error, errorContext);
          
          if (errorResult.fatal) {
            return {
              success: false,
              error: `Fatal error: ${result.error}`,
              fatal: true,
              recommendation: errorResult.recommendation
            };
          }
          
          if (errorResult.degraded) {
            return {
              success: false,
              error: `Degraded operation: ${result.error}`,
              degraded: true,
              degradation: errorResult.degradation
            };
          }
          
          if (!errorResult.retry) {
            return {
              success: false,
              error: `Non-retryable error: ${result.error}`,
              category: errorResult.category
            };
          }
        }

      } catch (error) {
        const errorContext = {
          ...context,
          attempt,
          filePath: path.basename(filePath)
        };
        
        const errorResult = await this.errorHandler.handleError(error, errorContext);
        
        if (errorResult.fatal) {
          return {
            success: false,
            error: `Fatal error: ${error.message}`,
            fatal: true,
            recommendation: errorResult.recommendation
          };
        }
        
        if (!errorResult.retry) {
          return {
            success: false,
            error: `Error: ${error.message}`,
            category: errorResult.category
          };
        }
      }
      
      attempt++;
    }

    return {
      success: false,
      error: `Upload failed after ${this.config.maxRetries} attempts`,
      attempts: this.config.maxRetries
    };
  }

  /**
   * Upload with retry mechanism and exponential backoff (legacy fallback)
   */
  async uploadWithRetry(filePath, metadata) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      this.stats.uploadAttempts++;
      
      try {
        this.emit('upload:attempt', { 
          filePath: path.basename(filePath), 
          attempt, 
          maxRetries: this.config.maxRetries 
        });

        // Add timeout wrapper
        const uploadPromise = this.strapiClient.uploadImage(filePath, metadata);
        const result = await this.withTimeout(uploadPromise, this.config.timeout);

        if (result.success) {
          this.emit('upload:success', { 
            filePath: path.basename(filePath), 
            attempt,
            mediaId: result.mediaId,
            skipped: result.skipped || false
          });
          
          return result;
        } else {
          lastError = result.error;
          this.emit('upload:failed', { 
            filePath: path.basename(filePath), 
            attempt, 
            error: result.error 
          });
        }

      } catch (error) {
        lastError = error.message;
        
        if (error.name === 'TimeoutError') {
          this.stats.timeouts++;
          this.emit('upload:timeout', { 
            filePath: path.basename(filePath), 
            attempt, 
            timeout: this.config.timeout 
          });
        } else {
          this.emit('upload:error', { 
            filePath: path.basename(filePath), 
            attempt, 
            error: error.message 
          });
        }
      }

      // Apply retry delay with exponential backoff
      if (attempt < this.config.maxRetries) {
        this.stats.uploadRetries++;
        const delay = this.config.exponentialBackoff ? 
          this.config.retryDelay * Math.pow(2, attempt - 1) : 
          this.config.retryDelay;
          
        this.emit('upload:retry_delay', { 
          filePath: path.basename(filePath), 
          attempt, 
          delay 
        });
        
        await this.sleep(delay);
      }
    }

    this.stats.errors.push({
      type: 'upload_failed',
      filePath,
      error: lastError,
      attempts: this.config.maxRetries
    });

    return {
      success: false,
      error: `Upload failed after ${this.config.maxRetries} attempts: ${lastError}`,
      attempts: this.config.maxRetries
    };
  }

  /**
   * Update menu item with retry mechanism
   */
  async updateWithRetry(itemId, mediaId) {
    let lastError = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      this.stats.updateAttempts++;

      try {
        this.emit('update:attempt', { itemId, mediaId, attempt });

        const updatePromise = this.strapiClient.updateMenuItemImage(itemId, mediaId);
        const success = await this.withTimeout(updatePromise, this.config.timeout);

        if (success) {
          this.emit('update:success', { itemId, mediaId, attempt });
          return { success: true };
        } else {
          lastError = 'Update returned false';
          this.emit('update:failed', { itemId, mediaId, attempt, error: lastError });
        }

      } catch (error) {
        lastError = error.message;
        
        if (error.name === 'TimeoutError') {
          this.stats.timeouts++;
          this.emit('update:timeout', { itemId, mediaId, attempt });
        } else {
          this.emit('update:error', { itemId, mediaId, attempt, error: error.message });
        }
      }

      // Apply retry delay
      if (attempt < this.config.maxRetries) {
        this.stats.updateRetries++;
        const delay = this.config.exponentialBackoff ? 
          this.config.retryDelay * Math.pow(2, attempt - 1) : 
          this.config.retryDelay;
          
        await this.sleep(delay);
      }
    }

    this.stats.errors.push({
      type: 'update_failed',
      itemId,
      mediaId,
      error: lastError,
      attempts: this.config.maxRetries
    });

    return {
      success: false,
      error: `Update failed after ${this.config.maxRetries} attempts: ${lastError}`,
      attempts: this.config.maxRetries
    };
  }

  /**
   * Atomic update operation - ensures data consistency
   */
  async atomicUpdateMenuItem(menuItem, uploadResult) {
    try {
      this.emit('atomic:started', { itemId: menuItem.id, mediaId: uploadResult.mediaId });

      // Create atomic operation payload
      const updateData = {
        image: uploadResult.mediaId
      };

      // If imagePath should be cleared after successful upload
      if (this.config.clearImagePathAfterUpload) {
        updateData.imagePath = null;
      }

      // Perform atomic update
      const response = await fetch(
        `${this.strapiClient.baseUrl}/api/menu-items/${menuItem.id}`, 
        {
          method: 'PUT',
          headers: this.strapiClient.getAuthHeaders(),
          body: JSON.stringify({ data: updateData })
        }
      );

      if (response.ok) {
        const updatedItem = await response.json();
        
        this.emit('atomic:success', { 
          itemId: menuItem.id, 
          mediaId: uploadResult.mediaId,
          updatedItem: updatedItem.data 
        });

        return { 
          success: true, 
          updatedItem: updatedItem.data 
        };
      } else {
        const errorText = await response.text();
        const error = `Atomic update failed: ${response.status} ${response.statusText} - ${errorText}`;
        
        this.emit('atomic:failed', { 
          itemId: menuItem.id, 
          mediaId: uploadResult.mediaId, 
          error 
        });

        return { success: false, error };
      }

    } catch (error) {
      this.emit('atomic:error', { 
        itemId: menuItem.id, 
        mediaId: uploadResult.mediaId, 
        error: error.message 
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup uploaded file if subsequent operations fail
   */
  async cleanupFailedUpload(mediaId) {
    if (!mediaId) return;

    try {
      this.emit('cleanup:started', { mediaId });

      const response = await fetch(
        `${this.strapiClient.baseUrl}/api/upload/files/${mediaId}`,
        {
          method: 'DELETE',
          headers: this.strapiClient.getAuthHeaders()
        }
      );

      if (response.ok) {
        this.emit('cleanup:success', { mediaId });
      } else {
        this.emit('cleanup:failed', { mediaId, status: response.status });
      }

    } catch (error) {
      this.emit('cleanup:error', { mediaId, error: error.message });
    }
  }

  /**
   * Add timeout wrapper to promises
   */
  async withTimeout(promise, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error(`Operation timed out after ${timeoutMs}ms`);
        error.name = 'TimeoutError';
        reject(error);
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Sleep utility for retry delays
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      uploadAttempts: 0,
      uploadRetries: 0,
      updateAttempts: 0,
      updateRetries: 0,
      timeouts: 0,
      errors: []
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const stats = this.getStats();
    
    const uploadSuccessRate = stats.uploadAttempts > 0 ? 
      ((stats.uploadAttempts - stats.errors.filter(e => e.type === 'upload_failed').length) / stats.uploadAttempts * 100).toFixed(1) : 
      '0.0';

    const updateSuccessRate = stats.updateAttempts > 0 ? 
      ((stats.updateAttempts - stats.errors.filter(e => e.type === 'update_failed').length) / stats.updateAttempts * 100).toFixed(1) : 
      '0.0';

    const avgRetriesPerUpload = stats.uploadAttempts > 0 ? 
      (stats.uploadRetries / stats.uploadAttempts).toFixed(1) : 
      '0.0';

    const avgRetriesPerUpdate = stats.updateAttempts > 0 ? 
      (stats.updateRetries / stats.updateAttempts).toFixed(1) : 
      '0.0';

    return {
      uploadStats: {
        attempts: stats.uploadAttempts,
        retries: stats.uploadRetries,
        successRate: uploadSuccessRate + '%',
        avgRetries: avgRetriesPerUpload
      },
      updateStats: {
        attempts: stats.updateAttempts,
        retries: stats.updateRetries,
        successRate: updateSuccessRate + '%',
        avgRetries: avgRetriesPerUpdate
      },
      errorStats: {
        totalErrors: stats.errors.length,
        timeouts: stats.timeouts,
        uploadErrors: stats.errors.filter(e => e.type === 'upload_failed').length,
        updateErrors: stats.errors.filter(e => e.type === 'update_failed').length
      }
    };
  }
}