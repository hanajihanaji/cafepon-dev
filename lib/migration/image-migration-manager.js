/**
 * Image Migration Orchestrator - Tsumiki Task 5
 * Main controller for managing the complete image migration process
 */

import { StrapiMediaClient } from './strapi-media-client.js';
import { BackupManager } from './backup-manager.js';
import { UploadHandler } from './upload-handler.js';
import { ErrorHandler } from './error-handler.js';
import { ValidationSystem } from './validation-system.js';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export class ImageMigrationManager extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      strapiUrl: 'http://localhost:1340',
      strapiApiToken: null,
      publicImagesDir: './public/images',
      maxConcurrency: 3,
      skipPlaceholders: true,
      overwriteExisting: false,
      dryRun: false,
      verbose: false,
      backupEnabled: true,
      ...config
    };

    // Initialize clients
    this.strapiClient = new StrapiMediaClient({
      baseUrl: this.config.strapiUrl,
      apiToken: this.config.strapiApiToken
    });

    this.backupManager = new BackupManager(this.config);

    // Initialize comprehensive error handler (Tsumiki Task 7)
    this.errorHandler = new ErrorHandler({
      maxRetries: this.config.uploadRetries || 3,
      baseRetryDelay: this.config.retryDelay || 1000,
      exponentialBackoff: true,
      enableGracefulDegradation: this.config.gracefulDegradation !== false,
      logLevel: this.config.verbose ? 'debug' : 'info',
      contextualLogging: true
    });

    // Initialize enhanced upload handler (Tsumiki Task 6)
    this.uploadHandler = new UploadHandler(this.strapiClient, {
      maxRetries: this.config.uploadRetries || 3,
      retryDelay: this.config.retryDelay || 1000,
      exponentialBackoff: true,
      timeout: this.config.uploadTimeout || 30000,
      atomicOperations: this.config.atomicOperations !== false,
      clearImagePathAfterUpload: this.config.clearImagePathAfterUpload || false,
      errorHandler: this.errorHandler // Inject error handler
    });

    // Initialize validation system (Tsumiki Task 8)
    this.validationSystem = new ValidationSystem(this.strapiClient, {
      validateImageAccess: this.config.validateImageAccess !== false,
      checkBrokenLinks: this.config.checkBrokenLinks !== false,
      checkOrphanedImages: this.config.checkOrphanedImages !== false,
      validationTimeout: this.config.validationTimeout || 10000,
      maxConcurrentValidations: this.config.maxConcurrentValidations || 5
    });

    // Forward error handler events
    this.errorHandler.on('error:categorized', (data) => this.emit('error:categorized', data));
    this.errorHandler.on('error:retry', (data) => this.emit('error:retry', data));
    this.errorHandler.on('error:fatal', (data) => this.emit('error:fatal', data));
    this.errorHandler.on('error:degraded', (data) => this.emit('error:degraded', data));

    // Forward validation system events
    this.validationSystem.on('validation:started', (data) => this.emit('validation:started', data));
    this.validationSystem.on('validation:completed', (data) => this.emit('validation:completed', data));
    this.validationSystem.on('item:validated', (data) => this.emit('item:validated', data));

    // Forward upload handler events
    this.uploadHandler.on('operation:started', (data) => this.emit('upload:started', data));
    this.uploadHandler.on('operation:completed', (data) => this.emit('upload:completed', data));
    this.uploadHandler.on('operation:failed', (data) => this.emit('upload:failed', data));
    this.uploadHandler.on('upload:retry_delay', (data) => this.emit('upload:retry', data));
    this.uploadHandler.on('atomic:started', (data) => this.emit('atomic:started', data));

    // Migration state
    this.stats = {
      total: 0,
      processed: 0,
      uploaded: 0,
      reused: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      startTime: null,
      endTime: null
    };

    // Processing queue and concurrency control
    this.processingQueue = [];
    this.activeProcesses = new Set();
    this.backupPath = null;
  }

  /**
   * Main migration orchestrator method
   */
  async migrate() {
    try {
      this.stats.startTime = new Date();
      this.emit('migration:started', { config: this.config });
      
      console.log('🚀 Starting Image Migration Orchestrator');
      console.log('=====================================');
      
      // Phase 1: Pre-migration validation
      await this.validatePrerequisites();
      
      // Phase 2: Scan and extract menu items with imagePath
      const menuItems = await this.scanMenuItems();
      
      // Phase 3: Create backup (unless disabled)
      if (this.config.backupEnabled && !this.config.dryRun) {
        await this.createBackup(menuItems);
      }
      
      // Phase 4: Process images with concurrent control
      await this.processImages();
      
      // Phase 5: Generate final report
      this.stats.endTime = new Date();
      const report = this.generateReport();
      
      this.emit('migration:completed', { stats: this.stats, report });
      
      return {
        success: this.stats.failed === 0,
        stats: this.stats,
        report
      };

    } catch (error) {
      this.stats.endTime = new Date();
      this.emit('migration:failed', { error: error.message, stats: this.stats });
      
      console.error('❌ Migration orchestrator failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate all prerequisites before starting migration
   */
  async validatePrerequisites() {
    console.log('🔍 Phase 1: Validating prerequisites...');
    
    // Test Strapi connection
    const isConnected = await this.strapiClient.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Strapi API. Please check server and API token.');
    }
    console.log('✅ Strapi API connection verified');

    // Check public images directory
    if (!fs.existsSync(this.config.publicImagesDir)) {
      throw new Error(`Public images directory not found: ${this.config.publicImagesDir}`);
    }
    console.log(`✅ Public images directory found: ${this.config.publicImagesDir}`);

    // Validate concurrency limits
    if (this.config.maxConcurrency < 1 || this.config.maxConcurrency > 20) {
      console.warn(`⚠️  Adjusting concurrency from ${this.config.maxConcurrency} to safe range`);
      this.config.maxConcurrency = Math.max(1, Math.min(this.config.maxConcurrency, 20));
    }
    console.log(`✅ Concurrency limit set to: ${this.config.maxConcurrency}`);

    this.emit('validation:completed');
  }

  /**
   * Scan menu items and extract those with imagePath fields
   */
  async scanMenuItems() {
    console.log('📋 Phase 2: Scanning menu items...');
    
    try {
      const allMenuItems = await this.strapiClient.getMenuItems();
      console.log(`   Found ${allMenuItems.length} total menu items`);
      
      // Filter items that have imagePath and need processing
      const itemsWithImages = allMenuItems.filter(item => {
        if (!item.imagePath) return false;
        
        if (this.config.skipPlaceholders && this.isPlaceholderImage(item.imagePath)) {
          return false;
        }
        
        return true;
      });

      console.log(`   Found ${itemsWithImages.length} items with images to migrate`);
      
      // Build processing queue with file validation
      this.processingQueue = [];
      
      for (const item of itemsWithImages) {
        const resolvedPath = this.resolveImagePath(item.imagePath);
        
        if (resolvedPath && fs.existsSync(resolvedPath)) {
          this.processingQueue.push({
            item,
            imagePath: resolvedPath,
            status: 'pending'
          });
        } else {
          console.log(`   ❌ File not found for ${item.name}: ${item.imagePath}`);
          this.stats.failed++;
        }
      }

      this.stats.total = this.processingQueue.length;
      console.log(`📸 Queue prepared: ${this.stats.total} images ready for migration`);
      
      this.emit('scan:completed', { 
        totalItems: allMenuItems.length,
        imagesToProcess: this.stats.total,
        queue: this.processingQueue.map(q => ({
          itemName: q.item.name,
          imagePath: q.item.imagePath
        }))
      });

      return allMenuItems;

    } catch (error) {
      console.error('❌ Failed to scan menu items:', error.message);
      throw error;
    }
  }

  /**
   * Create backup before migration
   */
  async createBackup(menuItems) {
    console.log('💾 Phase 3: Creating backup...');
    
    try {
      this.backupPath = await this.backupManager.createBackup(
        menuItems,
        `Migration backup - ${new Date().toISOString()}`
      );
      
      if (this.backupPath) {
        console.log(`✅ Backup created: ${path.basename(this.backupPath)}`);
        this.emit('backup:created', { backupPath: this.backupPath });
      } else {
        console.warn('⚠️  Failed to create backup - proceeding with caution');
      }

    } catch (error) {
      console.warn('⚠️  Backup creation failed:', error.message);
      
      if (!this.config.dryRun) {
        const proceed = await this.promptContinueWithoutBackup();
        if (!proceed) {
          throw new Error('Migration cancelled due to backup failure');
        }
      }
    }
  }

  /**
   * Process images with concurrent control and progress tracking
   */
  async processImages() {
    console.log('🖼️  Phase 4: Processing images with concurrent control...');
    console.log(`   Concurrency limit: ${this.config.maxConcurrency}`);
    
    if (this.config.dryRun) {
      console.log('🏷️  [DRY RUN MODE] - No actual changes will be made');
    }

    const startTime = Date.now();
    let completed = 0;

    // Process queue with concurrency control
    while (this.processingQueue.length > 0 || this.activeProcesses.size > 0) {
      
      // Start new processes up to concurrency limit
      while (
        this.processingQueue.length > 0 && 
        this.activeProcesses.size < this.config.maxConcurrency
      ) {
        const queueItem = this.processingQueue.shift();
        const processPromise = this.processSingleImage(queueItem);
        
        this.activeProcesses.add(processPromise);
        
        // Handle completion
        processPromise
          .then(() => {
            completed++;
            this.reportProgress(completed, this.stats.total, startTime);
          })
          .catch(error => {
            console.error('❌ Process error:', error.message);
            this.stats.failed++;
          })
          .finally(() => {
            this.activeProcesses.delete(processPromise);
          });
      }

      // Wait for at least one process to complete
      if (this.activeProcesses.size > 0) {
        await Promise.race(this.activeProcesses);
      }
    }

    console.log('✅ All images processed');
    this.emit('processing:completed', { stats: this.stats });
  }

  /**
   * Process a single image item with enhanced upload handler (Tsumiki Task 6)
   */
  async processSingleImage(queueItem) {
    const { item, imagePath } = queueItem;
    
    try {
      if (this.config.verbose) {
        console.log(`   📎 Processing: ${item.name} (${path.basename(imagePath)})`);
      }

      queueItem.status = 'processing';
      this.emit('item:processing', { item: item.name, path: imagePath });

      if (!this.config.dryRun) {
        // Use enhanced upload handler with atomic operations and retry logic
        const result = await this.uploadHandler.uploadAndUpdateMenuItem(item, imagePath);

        if (result.success) {
          if (result.skipped) {
            if (this.config.verbose) {
              console.log(`   ♻️  Reused existing: ${item.name}`);
            }
            this.stats.reused++;
          } else {
            if (this.config.verbose) {
              console.log(`   ⬆️  Uploaded: ${item.name}`);
            }
            this.stats.uploaded++;
          }

          queueItem.status = 'completed';
          this.emit('item:completed', { 
            item: item.name, 
            status: 'success',
            mediaId: result.mediaId,
            mediaUrl: result.mediaUrl
          });

        } else {
          queueItem.status = 'failed';
          const errorDetails = result.operation ? result.operation.errors.join(', ') : result.error;
          console.error(`   ❌ Upload/update failed for ${item.name}: ${errorDetails}`);
          
          this.stats.errors.push({
            item: item.name,
            path: imagePath,
            error: errorDetails,
            operation: result.operation
          });
          this.stats.failed++;

          this.emit('item:completed', { 
            item: item.name, 
            status: 'failed', 
            error: errorDetails 
          });
        }
      } else {
        // Dry run simulation with validation
        const validation = await this.uploadHandler.validateFile(imagePath);
        
        if (validation.valid) {
          if (this.config.verbose) {
            console.log(`   🏷️  [DRY RUN] Would upload: ${item.name}`);
          }
          this.stats.uploaded++;
          queueItem.status = 'completed';
          
          this.emit('item:completed', { 
            item: item.name, 
            status: 'success_dryrun' 
          });
        } else {
          if (this.config.verbose) {
            console.log(`   ❌ [DRY RUN] Would fail: ${item.name} - ${validation.errors.join(', ')}`);
          }
          this.stats.failed++;
          queueItem.status = 'failed';
          
          this.emit('item:completed', { 
            item: item.name, 
            status: 'failed_dryrun',
            error: validation.errors.join(', ')
          });
        }
      }

      this.stats.processed++;

    } catch (error) {
      queueItem.status = 'failed';
      console.error(`   ❌ Error processing ${item.name}: ${error.message}`);
      
      this.stats.errors.push({
        item: item.name,
        path: imagePath,
        error: error.message
      });
      this.stats.failed++;

      this.emit('item:completed', { 
        item: item.name, 
        status: 'failed', 
        error: error.message 
      });
    }
  }

  /**
   * Report real-time progress
   */
  reportProgress(completed, total, startTime) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rate = elapsed > 0 ? (completed / elapsed).toFixed(1) : '0.0';
    const remaining = total - completed;
    const eta = rate > 0 ? Math.round(remaining / parseFloat(rate)) : 0;

    if (completed % 10 === 0 || completed === total) {
      console.log(`   📊 Progress: ${completed}/${total} (${Math.round((completed/total)*100)}%) - ${rate}/sec - ETA: ${eta}s`);
    }

    this.emit('progress:update', {
      completed,
      total,
      percentage: Math.round((completed/total)*100),
      rate: parseFloat(rate),
      eta
    });
  }

  /**
   * Generate comprehensive migration report including upload handler statistics
   */
  generateReport() {
    const duration = this.stats.endTime - this.stats.startTime;
    const successRate = this.stats.total > 0 ? 
      Math.round(((this.stats.uploaded + this.stats.reused) / this.stats.total) * 100) : 0;

    // Get upload handler performance statistics and error report
    const uploadPerformance = this.uploadHandler.generatePerformanceReport();
    const errorReport = this.errorHandler.generateErrorReport();

    const report = {
      summary: {
        totalImages: this.stats.total,
        processed: this.stats.processed,
        newlyUploaded: this.stats.uploaded,
        reusedExisting: this.stats.reused,
        failed: this.stats.failed,
        successRate: successRate,
        duration: Math.round(duration / 1000),
        averageRate: duration > 0 ? (this.stats.processed / (duration / 1000)).toFixed(1) : '0.0'
      },
      config: {
        dryRun: this.config.dryRun,
        maxConcurrency: this.config.maxConcurrency,
        skipPlaceholders: this.config.skipPlaceholders,
        atomicOperations: this.config.atomicOperations !== false,
        uploadRetries: this.config.uploadRetries || 3,
        backupCreated: !!this.backupPath
      },
      performance: uploadPerformance,
      errorAnalysis: errorReport,
      errors: this.stats.errors,
      backup: this.backupPath ? {
        path: this.backupPath,
        filename: path.basename(this.backupPath)
      } : null
    };

    this.printReport(report);
    return report;
  }

  /**
   * Print formatted report to console with enhanced statistics
   */
  printReport(report) {
    console.log('\n📊 Migration Report');
    console.log('===================');
    console.log(`Total images: ${report.summary.totalImages}`);
    console.log(`Processed: ${report.summary.processed}`);
    console.log(`Newly uploaded: ${report.summary.newlyUploaded}`);
    console.log(`Reused existing: ${report.summary.reusedExisting}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`✅ Success rate: ${report.summary.successRate}%`);
    console.log(`⏱️  Duration: ${report.summary.duration} seconds`);
    console.log(`📈 Average rate: ${report.summary.averageRate} items/sec`);
    
    // Enhanced performance statistics from Tsumiki Task 6
    if (report.performance) {
      console.log('\n📈 Upload Performance:');
      console.log(`   Upload success rate: ${report.performance.uploadStats.successRate}`);
      console.log(`   Upload retries: ${report.performance.uploadStats.retries} (avg: ${report.performance.uploadStats.avgRetries})`);
      console.log(`   Update success rate: ${report.performance.updateStats.successRate}`);
      console.log(`   Update retries: ${report.performance.updateStats.retries} (avg: ${report.performance.updateStats.avgRetries})`);
      
      if (report.performance.errorStats.timeouts > 0) {
        console.log(`   ⚠️  Timeouts: ${report.performance.errorStats.timeouts}`);
      }
    }

    // Error analysis from Tsumiki Task 7
    if (report.errorAnalysis && report.errorAnalysis.summary.totalErrors > 0) {
      console.log('\n🚨 Error Analysis:');
      console.log(`   Total errors: ${report.errorAnalysis.summary.totalErrors}`);
      console.log(`   Error rate: ${report.errorAnalysis.summary.errorRate}/min`);
      console.log(`   Retry rate: ${report.errorAnalysis.summary.retryRate}`);
      console.log(`   Fatal rate: ${report.errorAnalysis.summary.fatalRate}`);
      
      if (Object.keys(report.errorAnalysis.categories).length > 0) {
        console.log('   Error categories:');
        Object.entries(report.errorAnalysis.categories).forEach(([category, count]) => {
          console.log(`     ${category}: ${count}`);
        });
      }

      if (report.errorAnalysis.recommendations.length > 0) {
        console.log('   💡 Recommendations:');
        report.errorAnalysis.recommendations.slice(0, 3).forEach(rec => {
          console.log(`     • [${rec.priority.toUpperCase()}] ${rec.message}`);
        });
      }
    }

    // Configuration details
    console.log('\n⚙️  Configuration:');
    console.log(`   Atomic operations: ${report.config.atomicOperations ? 'enabled' : 'disabled'}`);
    console.log(`   Max concurrency: ${report.config.maxConcurrency}`);
    console.log(`   Upload retries: ${report.config.uploadRetries}`);
    
    if (report.backup) {
      console.log(`   💾 Backup: ${report.backup.filename}`);
    }

    if (report.config.dryRun) {
      console.log('\n🏷️  This was a dry run - no actual changes were made');
    }

    if (report.errors.length > 0) {
      console.log('\n❌ Recent Errors:');
      report.errors.slice(0, 5).forEach(error => {
        console.log(`   • ${error.item}: ${error.error}`);
      });
      if (report.errors.length > 5) {
        console.log(`   ... and ${report.errors.length - 5} more errors`);
      }
    }
  }

  /**
   * Resolve image path from imagePath field
   */
  resolveImagePath(imagePath) {
    if (!imagePath) return null;
    
    const publicDir = this.config.publicImagesDir;
    
    if (path.isAbsolute(imagePath)) {
      return imagePath;
    }

    const cleanPath = imagePath.replace(/^\//, '');
    const attempts = [
      path.join(publicDir, cleanPath),
      path.join(publicDir, 'images', path.basename(cleanPath)),
      path.join(publicDir, cleanPath.replace(/^images\//, '')),
      path.join(process.cwd(), 'public', cleanPath)
    ];

    for (const attempt of attempts) {
      if (fs.existsSync(attempt)) {
        return attempt;
      }
    }

    return null;
  }

  /**
   * Check if image is a placeholder that should be skipped
   */
  isPlaceholderImage(imagePath) {
    if (!imagePath) return false;
    
    const placeholderPatterns = [
      /placeholder/i,
      /dummy/i,
      /sample/i,
      /temp/i,
      /test/i
    ];

    return placeholderPatterns.some(pattern => pattern.test(imagePath));
  }

  /**
   * Prompt user to continue without backup (for interactive use)
   */
  async promptContinueWithoutBackup() {
    // In CLI context, default to proceeding with warning
    console.warn('⚠️  Continuing without backup - use at your own risk');
    return true;
  }

  /**
   * Validation-only mode - validate current state without migration
   */
  async validateOnly() {
    console.log('🔍 Running validation-only mode...');
    console.log('==================================');
    
    try {
      // Test connection first
      const isConnected = await this.strapiClient.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to Strapi API. Please check server and API token.');
      }

      // Run validation system
      const validationResult = await this.validationSystem.validateOnly();
      
      this.emit('validation:only:completed', validationResult);
      
      return validationResult;

    } catch (error) {
      this.emit('validation:only:failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current migration statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get backup path if backup was created
   */
  getBackupPath() {
    return this.backupPath;
  }

  /**
   * Rollback to previous state using backup
   */
  async rollback(backupPath = null) {
    const targetBackup = backupPath || this.backupPath;
    
    if (!targetBackup) {
      throw new Error('No backup available for rollback');
    }

    console.log('🔄 Starting rollback process...');
    const result = await this.backupManager.restoreFromBackup(targetBackup, this.strapiClient);
    
    if (result.success) {
      console.log('✅ Rollback completed successfully');
    } else {
      console.error('❌ Rollback completed with errors');
    }

    return result;
  }
}