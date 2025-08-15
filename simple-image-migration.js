#!/usr/bin/env node

/**
 * Simple Image Migration Tool for Strapi CMS
 * JavaScript version without TypeScript compilation
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch').default || require('node-fetch');

// Configuration
const config = {
  strapiUrl: process.env.STRAPI_URL || 'http://localhost:1340',
  strapiApiToken: process.env.STRAPI_API_TOKEN,
  publicImagesDir: process.env.PUBLIC_IMAGES_DIR || './public/images',
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  maxConcurrency: 3,
  supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
};

// Logging utilities
const log = {
  info: (msg, data = {}) => {
    console.log(`ℹ️  ${msg}`);
    if (config.verbose && Object.keys(data).length > 0) {
      console.log('   ', JSON.stringify(data, null, 2));
    }
  },
  success: (msg, data = {}) => {
    console.log(`✅ ${msg}`);
    if (config.verbose && Object.keys(data).length > 0) {
      console.log('   ', JSON.stringify(data, null, 2));
    }
  },
  warn: (msg, data = {}) => {
    console.log(`⚠️  ${msg}`);
    if (config.verbose && Object.keys(data).length > 0) {
      console.log('   ', JSON.stringify(data, null, 2));
    }
  },
  error: (msg, data = {}) => {
    console.log(`❌ ${msg}`);
    if (config.verbose && Object.keys(data).length > 0) {
      console.log('   ', JSON.stringify(data, null, 2));
    }
  },
  section: (msg) => {
    console.log(`\\n🔸 ${msg}`);
    console.log('─'.repeat(50));
  },
  subsection: (msg) => {
    console.log(`\\n  📋 ${msg}`);
  }
};

// Utility functions
const utils = {
  fileExists: (filePath) => {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  },
  
  getFileSize: (filePath) => {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  },
  
  isPlaceholder: (imagePath) => {
    const placeholderPatterns = ['placeholder', 'default', 'no-image', 'coming-soon'];
    const lowerPath = imagePath.toLowerCase();
    return placeholderPatterns.some(pattern => lowerPath.includes(pattern));
  },
  
  getFileExtension: (filePath) => {
    return path.extname(filePath).toLowerCase().replace('.', '');
  },
  
  isSupportedFormat: (filePath) => {
    const extension = utils.getFileExtension(filePath);
    return config.supportedFormats.includes(extension);
  },
  
  formatBytes: (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },
  
  resolveImagePath: (imagePath) => {
    if (!imagePath) return null;
    
    // If absolute path, use as is
    if (path.isAbsolute(imagePath)) {
      return utils.fileExists(imagePath) ? imagePath : null;
    }
    
    // Try different path combinations
    const possiblePaths = [
      path.join(config.publicImagesDir, imagePath),
      path.join('./public', imagePath),
      path.join('./', imagePath),
      imagePath
    ];
    
    for (const testPath of possiblePaths) {
      if (utils.fileExists(testPath)) {
        return testPath;
      }
    }
    
    return null;
  }
};

// Strapi API client
const strapiClient = {
  headers: {
    'Authorization': config.strapiApiToken ? `Bearer ${config.strapiApiToken}` : undefined
  },
  
  async testConnection() {
    try {
      const response = await fetch(`${config.strapiUrl}/api/menu-items?pagination[limit]=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      log.error('Strapi connection failed', { error: error.message });
      return false;
    }
  },
  
  async getMenuItems() {
    try {
      const allItems = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(
          `${config.strapiUrl}/api/menu-items?pagination[page]=${page}&pagination[pageSize]=100&populate=image`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        if (!response.ok) {
          log.error(`Failed to fetch menu items page ${page}`);
          break;
        }
        
        const data = await response.json();
        allItems.push(...data.data);
        
        if (data.meta.pagination.page < data.meta.pagination.pageCount) {
          page++;
        } else {
          hasMore = false;
        }
      }
      
      log.info(`Retrieved ${allItems.length} menu items from Strapi`);
      return allItems;
      
    } catch (error) {
      log.error('Failed to fetch menu items', { error: error.message });
      return [];
    }
  },
  
  async uploadImage(filePath, metadata = {}) {
    try {
      if (!utils.fileExists(filePath)) {
        return { success: false, error: 'File does not exist' };
      }
      
      const fileSize = utils.getFileSize(filePath);
      if (fileSize === 0) {
        return { success: false, error: 'File is empty' };
      }
      
      if (!utils.isSupportedFormat(filePath)) {
        return { success: false, error: 'Unsupported file format' };
      }
      
      const filename = metadata.name || path.basename(filePath);
      
      // Check for existing media
      const existingMedia = await this.findExistingMedia(filename);
      if (existingMedia) {
        log.info(`Media already exists: ${filename}`);
        return {
          success: true,
          mediaId: existingMedia.id,
          mediaUrl: existingMedia.url,
          skipped: true,
          reason: 'Media already exists',
          existingMedia
        };
      }
      
      if (config.dryRun) {
        log.info(`[DRY RUN] Would upload: ${filename} (${utils.formatBytes(fileSize)})`);
        return {
          success: true,
          skipped: true,
          reason: 'Dry run mode'
        };
      }
      
      // Prepare form data
      const formData = new FormData();
      formData.append('files', fs.createReadStream(filePath), filename);
      
      if (metadata.alternativeText || metadata.caption) {
        formData.append('fileInfo', JSON.stringify({
          alternativeText: metadata.alternativeText || '',
          caption: metadata.caption || ''
        }));
      }
      
      // Upload to Strapi
      const response = await fetch(`${config.strapiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          ...this.headers,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Upload failed: ${response.status} ${errorText}`
        };
      }
      
      const uploadedFiles = await response.json();
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return {
          success: false,
          error: 'No files were uploaded'
        };
      }
      
      const uploadedFile = uploadedFiles[0];
      log.success(`Uploaded: ${filename}`, { 
        id: uploadedFile.id,
        url: uploadedFile.url,
        size: utils.formatBytes(fileSize)
      });
      
      return {
        success: true,
        mediaId: uploadedFile.id,
        mediaUrl: uploadedFile.url,
        uploadedFile
      };
      
    } catch (error) {
      log.error('Upload failed', { error: error.message, filePath });
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async findExistingMedia(filename) {
    try {
      const response = await fetch(
        `${config.strapiUrl}/api/upload/files?filters[name][$eq]=${encodeURIComponent(filename)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
      
    } catch (error) {
      log.warn(`Failed to search for existing media: ${filename}`);
      return null;
    }
  },
  
  async updateMenuItemImage(itemId, mediaId) {
    try {
      if (config.dryRun) {
        log.info(`[DRY RUN] Would update menu item ${itemId} with media ${mediaId}`);
        return true;
      }
      
      const response = await fetch(`${config.strapiUrl}/api/menu-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        body: JSON.stringify({
          data: {
            image: mediaId
          }
        })
      });
      
      if (response.ok) {
        log.success(`Updated menu item ${itemId} with media ${mediaId}`);
        return true;
      } else {
        log.error(`Failed to update menu item ${itemId}`, {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
      
    } catch (error) {
      log.error(`Failed to update menu item ${itemId}`, {
        error: error.message
      });
      return false;
    }
  }
};

// Main migration logic
const migration = {
  async run() {
    try {
      log.section('Image Migration Started');
      
      // Validate configuration
      await this.validateConfig();
      
      // Test Strapi connection
      await this.testConnection();
      
      // Get menu items
      const menuItems = await strapiClient.getMenuItems();
      
      if (menuItems.length === 0) {
        throw new Error('No menu items found');
      }
      
      // Process migration
      const result = await this.processMigration(menuItems);
      
      // Generate report
      this.generateReport(result);
      
      return result;
      
    } catch (error) {
      log.error('Migration failed', { error: error.message });
      throw error;
    }
  },
  
  async validateConfig() {
    log.subsection('Validating Configuration');
    
    const errors = [];
    
    if (!config.strapiUrl) {
      errors.push('STRAPI_URL is required');
    }
    
    if (!config.strapiApiToken) {
      log.warn('STRAPI_API_TOKEN not set - some operations may fail');
    }
    
    if (!utils.fileExists(config.publicImagesDir)) {
      errors.push(`Public images directory not found: ${config.publicImagesDir}`);
    }
    
    if (errors.length > 0) {
      errors.forEach(error => log.error(`  - ${error}`));
      throw new Error('Configuration validation failed');
    }
    
    log.success('Configuration validated');
    log.info('Settings:', {
      strapiUrl: config.strapiUrl,
      publicImagesDir: config.publicImagesDir,
      dryRun: config.dryRun,
      verbose: config.verbose
    });
  },
  
  async testConnection() {
    log.subsection('Testing Strapi Connection');
    
    const connected = await strapiClient.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Strapi API');
    }
    
    log.success('Strapi connection successful');
  },
  
  async processMigration(menuItems) {
    log.subsection('Processing Menu Items');
    
    const result = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    const itemsWithImages = menuItems.filter(item => 
      item.attributes.imagePath && 
      item.attributes.imagePath.trim() !== ''
    );
    
    log.info(`Found ${itemsWithImages.length} items with imagePath out of ${menuItems.length} total items`);
    
    if (itemsWithImages.length === 0) {
      log.warn('No items found with imagePath field');
      return result;
    }
    
    // Process items with concurrency control
    const batches = this.createBatches(itemsWithImages, config.maxConcurrency);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      log.info(`Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);
      
      const batchPromises = batch.map(item => this.processMenuItem(item));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((batchResult, index) => {
        const item = batch[index];
        result.processed++;
        
        if (batchResult.status === 'fulfilled') {
          const uploadResult = batchResult.value;
          
          if (uploadResult.success) {
            if (uploadResult.skipped) {
              result.skipped++;
            } else {
              result.successful++;
            }
          } else {
            result.failed++;
            result.errors.push({
              itemId: item.id,
              itemName: item.attributes.name,
              error: uploadResult.error || 'Unknown error',
              imagePath: item.attributes.imagePath
            });
          }
        } else {
          result.failed++;
          result.errors.push({
            itemId: item.id,
            itemName: item.attributes.name,
            error: batchResult.reason?.message || 'Processing failed',
            imagePath: item.attributes.imagePath
          });
        }
      });
      
      // Progress update
      log.info(`Progress: ${result.processed}/${itemsWithImages.length} - ✅${result.successful} ❌${result.failed} ⏭️${result.skipped}`);
    }
    
    return result;
  },
  
  async processMenuItem(item) {
    try {
      const imagePath = item.attributes.imagePath;
      
      // Skip placeholder images
      if (utils.isPlaceholder(imagePath)) {
        return {
          success: true,
          skipped: true,
          reason: 'Placeholder image'
        };
      }
      
      // Resolve image path
      const fullPath = utils.resolveImagePath(imagePath);
      if (!fullPath) {
        return {
          success: false,
          error: `Image file not found: ${imagePath}`
        };
      }
      
      // Upload image to Strapi
      const uploadResult = await strapiClient.uploadImage(fullPath, {
        name: path.basename(fullPath),
        alternativeText: `Image for ${item.attributes.name}`,
        caption: item.attributes.description || ''
      });
      
      if (!uploadResult.success) {
        return uploadResult;
      }
      
      // Skip updating if it was skipped or dry run
      if (uploadResult.skipped) {
        return uploadResult;
      }
      
      // Update menu item with new image reference
      const updateSuccess = await strapiClient.updateMenuItemImage(
        item.documentId,
        uploadResult.mediaId
      );
      
      if (!updateSuccess) {
        return {
          success: false,
          error: 'Failed to update menu item reference'
        };
      }
      
      return uploadResult;
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  },
  
  generateReport(result) {
    log.section('Migration Report');
    
    log.info(`📊 Summary:`);
    log.info(`   Total processed: ${result.processed}`);
    log.info(`   Successful: ${result.successful}`);
    log.info(`   Failed: ${result.failed}`);
    log.info(`   Skipped: ${result.skipped}`);
    
    if (result.errors.length > 0) {
      log.warn(`\\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach(error => {
        log.warn(`   ${error.itemName}: ${error.error}`);
      });
    }
    
    if (result.successful > 0) {
      log.success('\\n🎉 Migration completed successfully!');
      if (config.dryRun) {
        log.info('   This was a dry run - no actual changes were made');
        log.info('   Remove --dry-run flag to perform actual migration');
      }
    }
  }
};

// CLI interface
async function main() {
  try {
    // Show banner
    console.log('🖼️  Simple Image Migration Tool v1.0.0');
    console.log('=========================================\\n');
    
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      showHelp();
      process.exit(0);
    }
    
    if (config.dryRun) {
      log.info('🧪 Running in DRY RUN mode - no changes will be made');
    }
    
    const result = await migration.run();
    
    // Exit with appropriate code
    const hasErrors = result.failed > 0;
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    log.error('Fatal error', { error: error.message });
    
    if (config.verbose) {
      console.error('\\nStack trace:');
      console.error(error.stack);
    }
    
    console.error('\\n🆘 Troubleshooting:');
    console.error('  1. Check Strapi server is running and accessible');
    console.error('  2. Verify STRAPI_API_TOKEN is set and valid');
    console.error('  3. Ensure public images directory exists');
    console.error('  4. Run with --verbose for detailed logs');
    console.error('  5. Try --dry-run first to test configuration');
    
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🖼️  Simple Image Migration Tool for Strapi CMS

DESCRIPTION:
  Migrates images from imagePath fields to Strapi media library.

USAGE:
  node simple-image-migration.js [options]

OPTIONS:
  --dry-run     Simulate migration without making changes
  --verbose     Enable verbose logging
  --help, -h    Show this help message

ENVIRONMENT VARIABLES:
  STRAPI_URL              Strapi server URL (default: http://localhost:1340)
  STRAPI_API_TOKEN        Strapi API token for authentication
  PUBLIC_IMAGES_DIR       Directory containing images (default: ./public/images)

EXAMPLES:
  # Dry run to see what would be migrated
  node simple-image-migration.js --dry-run --verbose

  # Full migration
  STRAPI_API_TOKEN=your_token node simple-image-migration.js
`);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\\n\\n⚠️  Migration interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\\n\\n⚠️  Migration terminated');
  process.exit(143);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { migration, strapiClient, utils, config };