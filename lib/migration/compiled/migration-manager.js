"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageMigrationManager = void 0;
const config_1 = require("./config");
const logger_1 = require("./logger");
const strapi_client_1 = require("./strapi-client");
const image_processor_1 = require("./image-processor");
const backup_manager_1 = require("./backup-manager");
/**
 * Main orchestrator for image migration process
 */
class ImageMigrationManager {
    constructor(options = {}) {
        this.startTime = 0;
        // Initialize configuration
        const configManager = config_1.ConfigManager.getInstance();
        configManager.updateConfig(options);
        this.config = configManager.getConfig();
        // Initialize logger
        this.logger = logger_1.Logger.getInstance(this.config.verbose ? logger_1.LogLevel.VERBOSE : logger_1.LogLevel.INFO);
        // Initialize components
        this.strapiClient = new strapi_client_1.StrapiMediaClient(this.config);
        this.imageProcessor = new image_processor_1.ImageProcessor(this.config);
        this.backupManager = new backup_manager_1.BackupManager(this.config, this.strapiClient);
        // Initialize migration state
        this.migrationState = {
            timestamp: new Date().toISOString(),
            totalItems: 0,
            processedItems: 0,
            successfulUploads: 0,
            failedUploads: 0,
            skippedItems: 0,
            errors: []
        };
    }
    /**
     * Main migration workflow
     */
    async migrate() {
        this.startTime = Date.now();
        try {
            this.logger.section('Image Migration Started');
            // Validate configuration
            await this.validateConfiguration();
            // Test Strapi connection
            await this.testStrapiConnection();
            // Fetch menu items
            const menuItems = await this.fetchMenuItems();
            // Create backup
            await this.createBackup(menuItems);
            // Process migration
            const result = await this.processMigration(menuItems);
            // Validate results
            await this.validateMigrationResults();
            // Generate report
            this.generateMigrationReport(result);
            return result;
        }
        catch (error) {
            this.logger.failure('Migration failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Validate configuration and prerequisites
     */
    async validateConfiguration() {
        this.logger.subsection('Configuration Validation');
        const configManager = config_1.ConfigManager.getInstance();
        const validation = configManager.validateConfig();
        if (!validation.valid) {
            this.logger.error('Configuration validation failed');
            validation.errors.forEach(error => this.logger.error(`  - ${error}`));
            throw new Error('Invalid configuration');
        }
        configManager.printConfig();
        this.logger.success('Configuration validated');
    }
    /**
     * Test connection to Strapi API
     */
    async testStrapiConnection() {
        this.logger.subsection('Strapi Connection Test');
        const connected = await this.strapiClient.testConnection();
        if (!connected) {
            throw new Error('Failed to connect to Strapi API');
        }
    }
    /**
     * Fetch menu items from Strapi
     */
    async fetchMenuItems() {
        this.logger.subsection('Fetching Menu Items');
        const menuItems = await this.strapiClient.getMenuItems();
        this.migrationState.totalItems = menuItems.length;
        this.logger.info(`Found ${menuItems.length} menu items`);
        if (menuItems.length === 0) {
            throw new Error('No menu items found in Strapi');
        }
        return menuItems;
    }
    /**
     * Create backup before migration
     */
    async createBackup(menuItems) {
        if (!this.config.backupEnabled) {
            this.logger.info('Backup disabled, skipping backup creation');
            return;
        }
        this.logger.subsection('Creating Backup');
        const backupPath = await this.backupManager.createBackup(menuItems);
        if (!backupPath) {
            this.logger.warn('Failed to create backup, continuing without backup');
        }
    }
    /**
     * Process migration for all menu items
     */
    async processMigration(menuItems) {
        this.logger.subsection('Processing Migration');
        // Filter items that have imagePath
        const itemsWithImages = menuItems.filter(item => item.imagePath);
        this.logger.info(`Found ${itemsWithImages.length} items with image paths`);
        if (itemsWithImages.length === 0) {
            this.logger.warn('No items with image paths found');
            return {
                processed: 0,
                successful: 0,
                failed: 0,
                skipped: 0,
                errors: []
            };
        }
        // Process items with concurrency control
        const result = await this.processItemsConcurrently(itemsWithImages);
        return result;
    }
    /**
     * Process items with controlled concurrency
     */
    async processItemsConcurrently(items) {
        const result = {
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
        // Create batches for concurrent processing
        const batches = this.createBatches(items, this.config.maxConcurrency);
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            this.logger.info(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);
            // Process batch concurrently
            const batchPromises = batch.map(item => this.processMenuItem(item));
            const batchResults = await Promise.allSettled(batchPromises);
            // Aggregate results
            for (let i = 0; i < batchResults.length; i++) {
                const batchResult = batchResults[i];
                const item = batch[i];
                result.processed++;
                this.migrationState.processedItems++;
                if (batchResult.status === 'fulfilled') {
                    const uploadResult = batchResult.value;
                    if (uploadResult.success) {
                        if (uploadResult.skipped) {
                            result.skipped++;
                            this.migrationState.skippedItems++;
                        }
                        else {
                            result.successful++;
                            this.migrationState.successfulUploads++;
                        }
                    }
                    else {
                        result.failed++;
                        this.migrationState.failedUploads++;
                        const error = {
                            itemId: item.documentId,
                            itemName: item.name,
                            error: uploadResult.error || 'Unknown error',
                            imagePath: item.imagePath,
                            timestamp: new Date().toISOString()
                        };
                        result.errors.push(error);
                        this.migrationState.errors.push(error);
                    }
                }
                else {
                    result.failed++;
                    this.migrationState.failedUploads++;
                    const error = {
                        itemId: item.documentId,
                        itemName: item.name,
                        error: batchResult.reason?.message || 'Processing failed',
                        imagePath: item.imagePath,
                        timestamp: new Date().toISOString()
                    };
                    result.errors.push(error);
                    this.migrationState.errors.push(error);
                }
                // Update progress
                this.logger.progress(result.processed, items.length, `${item.name} - ${result.successful}✅ ${result.failed}❌ ${result.skipped}⏭️`);
            }
        }
        return result;
    }
    /**
     * Process individual menu item
     */
    async processMenuItem(item) {
        try {
            // Skip if dry run mode
            if (this.config.dryRun) {
                this.logger.debug(`[DRY RUN] Would process: ${item.name}`);
                return {
                    success: true,
                    skipped: true,
                    reason: 'Dry run mode'
                };
            }
            // Process image file
            const imageResult = await this.imageProcessor.processImage(item.imagePath);
            if (!imageResult.valid) {
                if (imageResult.shouldSkip) {
                    return {
                        success: true,
                        skipped: true,
                        reason: imageResult.skipReason
                    };
                }
                else {
                    return {
                        success: false,
                        error: imageResult.error
                    };
                }
            }
            // Upload image to Strapi
            const uploadResult = await this.strapiClient.uploadImage(imageResult.fullPath, {
                name: imageResult.filename,
                alternativeText: `Image for ${item.name}`,
                caption: item.description || ''
            });
            if (!uploadResult.success) {
                return uploadResult;
            }
            // Update menu item with new image reference
            if (!uploadResult.skipped && uploadResult.mediaId) {
                const updateSuccess = await this.strapiClient.updateMenuItemImage(item.documentId, uploadResult.mediaId);
                if (!updateSuccess) {
                    return {
                        success: false,
                        error: 'Failed to update menu item reference'
                    };
                }
            }
            return uploadResult;
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Create batches for concurrent processing
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    /**
     * Validate migration results
     */
    async validateMigrationResults() {
        this.logger.subsection('Validating Migration Results');
        // Get updated menu items
        const menuItems = await this.strapiClient.getMenuItems();
        const itemsWithImages = menuItems.filter(item => item.image?.url);
        this.logger.info(`Validating ${itemsWithImages.length} items with images...`);
        const brokenLinks = [];
        let validLinks = 0;
        for (const item of itemsWithImages) {
            const isValid = await this.strapiClient.validateImageUrl(item.image.url);
            if (isValid) {
                validLinks++;
            }
            else {
                brokenLinks.push({
                    itemId: item.documentId,
                    itemName: item.name,
                    imageUrl: item.image.url,
                    error: 'Image URL not accessible'
                });
            }
        }
        const result = {
            valid: brokenLinks.length === 0,
            brokenLinks,
            totalChecked: itemsWithImages.length,
            validLinks
        };
        if (result.valid) {
            this.logger.success(`All ${validLinks} image links validated successfully`);
        }
        else {
            this.logger.warn(`Found ${brokenLinks.length} broken image links`);
            brokenLinks.forEach(link => {
                this.logger.warn(`  - ${link.itemName}: ${link.imageUrl}`);
            });
        }
        return result;
    }
    /**
     * Generate comprehensive migration report
     */
    generateMigrationReport(result) {
        const duration = (Date.now() - this.startTime) / 1000;
        this.logger.section('Migration Report');
        this.logger.summary({
            total: result.processed,
            successful: result.successful,
            failed: result.failed,
            skipped: result.skipped,
            duration
        });
        if (result.errors.length > 0) {
            this.logger.subsection('Errors');
            result.errors.forEach(error => {
                this.logger.error(`${error.itemName}: ${error.error}`, {
                    itemId: error.itemId,
                    imagePath: error.imagePath
                });
            });
        }
        // Performance metrics
        if (result.successful > 0) {
            const avgTimePerItem = duration / result.successful;
            this.logger.info(`Average processing time: ${avgTimePerItem.toFixed(2)}s per item`);
        }
        // Recommendations
        this.generateRecommendations(result);
    }
    /**
     * Generate recommendations based on results
     */
    generateRecommendations(result) {
        this.logger.subsection('Recommendations');
        if (result.failed > 0) {
            this.logger.info('📋 For failed items:');
            this.logger.info('  - Check image file paths and permissions');
            this.logger.info('  - Verify image formats are supported');
            this.logger.info('  - Ensure Strapi has sufficient storage space');
        }
        if (result.skipped > 0) {
            this.logger.info('📋 For skipped items:');
            this.logger.info('  - Review placeholder image detection rules');
            this.logger.info('  - Consider manual upload for important images');
        }
        if (result.successful > 0) {
            this.logger.info('📋 Next steps:');
            this.logger.info('  - Test image display in your application');
            this.logger.info('  - Consider removing old imagePath fields');
            this.logger.info('  - Update image alt text and captions in Strapi');
        }
    }
    /**
     * Get current migration state
     */
    getMigrationState() {
        return { ...this.migrationState };
    }
    /**
     * Rollback migration using backup
     */
    async rollback(backupPath) {
        try {
            this.logger.section('Migration Rollback');
            let targetBackup = backupPath;
            if (!targetBackup) {
                // Find most recent backup
                const backups = await this.backupManager.listBackups();
                if (backups.length === 0) {
                    this.logger.error('No backup files found for rollback');
                    return false;
                }
                targetBackup = backups[0].path;
                this.logger.info(`Using most recent backup: ${backups[0].filename}`);
            }
            // Validate backup
            const validation = await this.backupManager.validateBackup(targetBackup);
            if (!validation.valid) {
                this.logger.error('Backup validation failed');
                validation.errors.forEach(error => this.logger.error(`  - ${error}`));
                return false;
            }
            // Perform rollback
            const result = await this.backupManager.restoreFromBackup(targetBackup);
            if (result.success) {
                this.logger.success(`Rollback completed: ${result.restored} items restored`);
            }
            else {
                this.logger.error(`Rollback partially failed: ${result.restored} restored, ${result.failed} failed`);
            }
            return result.success;
        }
        catch (error) {
            this.logger.error('Rollback failed', { error: error.message });
            return false;
        }
    }
    /**
     * Validate migration without making changes
     */
    async validateOnly() {
        this.logger.section('Migration Validation (Read-Only)');
        // Test connection
        await this.testStrapiConnection();
        // Validate current state
        return await this.validateMigrationResults();
    }
}
exports.ImageMigrationManager = ImageMigrationManager;
