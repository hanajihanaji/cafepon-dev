/**
 * Validation and Verification System - Tsumiki Task 8
 * Post-migration image accessibility validation, menu item reference integrity checking, and broken link detection
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export class ValidationSystem extends EventEmitter {
  constructor(strapiClient, config = {}) {
    super();
    
    this.strapiClient = strapiClient;
    this.config = {
      validateImageAccess: true,
      validateImageSize: true,
      validateImageFormat: true,
      checkBrokenLinks: true,
      checkOrphanedImages: true,
      maxConcurrentValidations: 5,
      validationTimeout: 10000,
      acceptableImageFormats: ['.jpg', '.jpeg', '.png', '.svg', '.avif', '.webp', '.gif'],
      minImageSize: 100, // bytes
      maxImageSize: 50 * 1024 * 1024, // 50MB
      ...config
    };

    this.validationStats = {
      totalItems: 0,
      validatedItems: 0,
      validItems: 0,
      invalidItems: 0,
      brokenLinks: 0,
      orphanedImages: 0,
      sizeMismatches: 0,
      formatIssues: 0,
      accessibilityIssues: 0,
      startTime: null,
      endTime: null,
      validationErrors: []
    };

    this.validationResults = {
      validItems: [],
      invalidItems: [],
      brokenLinks: [],
      orphanedImages: [],
      recommendations: []
    };
  }

  /**
   * Main validation orchestrator
   */
  async validateMigration(options = {}) {
    try {
      this.validationStats.startTime = new Date();
      this.emit('validation:started', { options });

      console.log('🔍 Starting post-migration validation...');
      console.log('=====================================');

      // Phase 1: Get all menu items and media files
      const { menuItems, mediaFiles } = await this.gatherValidationData();

      // Phase 2: Validate menu item references
      if (this.config.validateImageAccess) {
        await this.validateMenuItemReferences(menuItems);
      }

      // Phase 3: Check for broken links
      if (this.config.checkBrokenLinks) {
        await this.checkBrokenImageLinks(menuItems);
      }

      // Phase 4: Find orphaned images
      if (this.config.checkOrphanedImages) {
        await this.findOrphanedImages(menuItems, mediaFiles);
      }

      // Phase 5: Validate image properties
      if (this.config.validateImageSize || this.config.validateImageFormat) {
        await this.validateImageProperties(mediaFiles);
      }

      // Phase 6: Generate comprehensive report
      this.validationStats.endTime = new Date();
      const report = this.generateValidationReport();

      this.emit('validation:completed', { report });
      return report;

    } catch (error) {
      this.validationStats.endTime = new Date();
      this.emit('validation:failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Gather all data needed for validation
   */
  async gatherValidationData() {
    console.log('📋 Gathering validation data...');

    try {
      // Get all menu items with populated image references
      const menuItems = await this.strapiClient.getMenuItems();
      console.log(`   Found ${menuItems.length} menu items`);

      // Get all media files from Strapi
      const mediaFiles = await this.getAllMediaFiles();
      console.log(`   Found ${mediaFiles.length} media files`);

      this.validationStats.totalItems = menuItems.length;

      this.emit('data:gathered', {
        menuItemCount: menuItems.length,
        mediaFileCount: mediaFiles.length
      });

      return { menuItems, mediaFiles };

    } catch (error) {
      console.error('❌ Failed to gather validation data:', error.message);
      throw error;
    }
  }

  /**
   * Get all media files from Strapi
   */
  async getAllMediaFiles() {
    try {
      const response = await fetch(`${this.strapiClient.baseUrl}/api/upload/files?pagination[pageSize]=1000`, {
        headers: this.strapiClient.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch media files: ${response.status}`);
      }

      const data = await response.json();
      return data || [];

    } catch (error) {
      console.error('Error fetching media files:', error);
      return [];
    }
  }

  /**
   * Validate menu item image references
   */
  async validateMenuItemReferences(menuItems) {
    console.log('🔗 Validating menu item references...');

    const itemsWithImages = menuItems.filter(item => item.image?.id);
    console.log(`   Validating ${itemsWithImages.length} items with image references`);

    let validCount = 0;
    let invalidCount = 0;

    for (const item of itemsWithImages) {
      this.validationStats.validatedItems++;
      
      try {
        const validationResult = await this.validateSingleItemReference(item);
        
        if (validationResult.valid) {
          validCount++;
          this.validationStats.validItems++;
          this.validationResults.validItems.push({
            id: item.id,
            name: item.name,
            imageUrl: item.image.url,
            imageId: item.image.id
          });
        } else {
          invalidCount++;
          this.validationStats.invalidItems++;
          this.validationResults.invalidItems.push({
            id: item.id,
            name: item.name,
            imageId: item.image?.id,
            issues: validationResult.issues
          });
        }

        this.emit('item:validated', {
          item: item.name,
          valid: validationResult.valid,
          issues: validationResult.issues
        });

      } catch (error) {
        invalidCount++;
        this.validationStats.invalidItems++;
        this.validationStats.validationErrors.push({
          itemId: item.id,
          itemName: item.name,
          error: error.message
        });
      }
    }

    console.log(`   ✅ Valid references: ${validCount}`);
    console.log(`   ❌ Invalid references: ${invalidCount}`);
  }

  /**
   * Validate a single menu item's image reference
   */
  async validateSingleItemReference(item) {
    const issues = [];
    let valid = true;

    try {
      // Check if item has image reference
      if (!item.image?.id) {
        issues.push('No image reference found');
        valid = false;
        return { valid, issues };
      }

      // Validate image accessibility via HTTP request
      if (item.image.url) {
        const imageAccessible = await this.checkImageAccessibility(item.image.url);
        if (!imageAccessible.accessible) {
          issues.push(`Image not accessible: ${imageAccessible.error}`);
          valid = false;
          this.validationStats.accessibilityIssues++;
        }
      } else {
        issues.push('Image URL not found');
        valid = false;
      }

      // Check image format if specified
      if (this.config.validateImageFormat && item.image.url) {
        const format = this.getImageFormat(item.image.url);
        if (!this.config.acceptableImageFormats.includes(format)) {
          issues.push(`Unsupported image format: ${format}`);
          this.validationStats.formatIssues++;
          // Don't mark as invalid for format issues unless critical
        }
      }

      return { valid, issues };

    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
      return { valid: false, issues };
    }
  }

  /**
   * Check if image is accessible via HTTP request
   */
  async checkImageAccessibility(imageUrl) {
    try {
      // Handle relative URLs
      const fullUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${this.strapiClient.baseUrl}${imageUrl}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.validationTimeout);

      const response = await fetch(fullUrl, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          accessible: true,
          status: response.status,
          contentLength: response.headers.get('content-length'),
          contentType: response.headers.get('content-type')
        };
      } else {
        return {
          accessible: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          accessible: false,
          error: 'Request timeout'
        };
      }
      
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Check for broken image links
   */
  async checkBrokenImageLinks(menuItems) {
    console.log('🔗 Checking for broken image links...');

    const brokenLinks = [];
    let checkedCount = 0;

    for (const item of menuItems) {
      // Check both new image references and old imagePath fields
      const linksToCheck = [];
      
      if (item.image?.url) {
        linksToCheck.push({
          type: 'image_reference',
          url: item.image.url,
          id: item.image.id
        });
      }

      if (item.imagePath) {
        linksToCheck.push({
          type: 'image_path',
          url: item.imagePath,
          id: null
        });
      }

      for (const link of linksToCheck) {
        checkedCount++;
        const accessibility = await this.checkImageAccessibility(link.url);
        
        if (!accessibility.accessible) {
          brokenLinks.push({
            itemId: item.id,
            itemName: item.name,
            linkType: link.type,
            url: link.url,
            imageId: link.id,
            error: accessibility.error
          });
          
          this.validationStats.brokenLinks++;
        }
      }
    }

    this.validationResults.brokenLinks = brokenLinks;
    console.log(`   Checked ${checkedCount} links, found ${brokenLinks.length} broken`);

    if (brokenLinks.length > 0) {
      console.log('   ❌ Broken links found:');
      brokenLinks.slice(0, 5).forEach(link => {
        console.log(`     • ${link.itemName}: ${link.url} (${link.error})`);
      });
      if (brokenLinks.length > 5) {
        console.log(`     ... and ${brokenLinks.length - 5} more`);
      }
    }
  }

  /**
   * Find orphaned images (images in media library not used by any menu item)
   */
  async findOrphanedImages(menuItems, mediaFiles) {
    console.log('🗃️  Checking for orphaned images...');

    const usedImageIds = new Set();
    
    // Collect all used image IDs
    menuItems.forEach(item => {
      if (item.image?.id) {
        usedImageIds.add(item.image.id);
      }
    });

    const orphanedImages = mediaFiles.filter(file => {
      // Consider only image files
      const isImage = file.mime && file.mime.startsWith('image/');
      const isUsed = usedImageIds.has(file.id);
      
      return isImage && !isUsed;
    });

    this.validationResults.orphanedImages = orphanedImages.map(file => ({
      id: file.id,
      name: file.name,
      url: file.url,
      size: file.size,
      uploadedAt: file.createdAt
    }));

    this.validationStats.orphanedImages = orphanedImages.length;

    console.log(`   Found ${orphanedImages.length} orphaned images`);
    
    if (orphanedImages.length > 0) {
      console.log('   🗑️  Orphaned images:');
      orphanedImages.slice(0, 5).forEach(file => {
        const sizeKB = Math.round(file.size / 1024);
        console.log(`     • ${file.name} (${sizeKB}KB) - uploaded ${new Date(file.createdAt).toLocaleDateString()}`);
      });
      if (orphanedImages.length > 5) {
        console.log(`     ... and ${orphanedImages.length - 5} more`);
      }
    }
  }

  /**
   * Validate image properties (size, format, etc.)
   */
  async validateImageProperties(mediaFiles) {
    console.log('📐 Validating image properties...');

    let sizeMismatches = 0;
    let formatIssues = 0;

    for (const file of mediaFiles) {
      if (!file.mime || !file.mime.startsWith('image/')) {
        continue;
      }

      // Validate file size
      if (this.config.validateImageSize) {
        if (file.size < this.config.minImageSize || file.size > this.config.maxImageSize) {
          sizeMismatches++;
          this.validationStats.sizeMismatches++;
        }
      }

      // Validate file format
      if (this.config.validateImageFormat) {
        const format = this.getImageFormat(file.name);
        if (!this.config.acceptableImageFormats.includes(format)) {
          formatIssues++;
          this.validationStats.formatIssues++;
        }
      }
    }

    console.log(`   Size mismatches: ${sizeMismatches}`);
    console.log(`   Format issues: ${formatIssues}`);
  }

  /**
   * Get image format from filename
   */
  getImageFormat(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    const duration = this.validationStats.endTime - this.validationStats.startTime;
    const validationRate = this.validationStats.totalItems > 0 ? 
      (this.validationStats.validItems / this.validationStats.totalItems * 100).toFixed(1) : '0.0';

    // Generate recommendations
    this.generateRecommendations();

    const report = {
      summary: {
        totalItems: this.validationStats.totalItems,
        validatedItems: this.validationStats.validatedItems,
        validItems: this.validationStats.validItems,
        invalidItems: this.validationStats.invalidItems,
        validationRate: validationRate + '%',
        duration: Math.round(duration / 1000),
        timestamp: new Date().toISOString()
      },
      issues: {
        brokenLinks: this.validationStats.brokenLinks,
        orphanedImages: this.validationStats.orphanedImages,
        sizeMismatches: this.validationStats.sizeMismatches,
        formatIssues: this.validationStats.formatIssues,
        accessibilityIssues: this.validationStats.accessibilityIssues
      },
      results: this.validationResults,
      recommendations: this.validationResults.recommendations,
      config: {
        validateImageAccess: this.config.validateImageAccess,
        checkBrokenLinks: this.config.checkBrokenLinks,
        checkOrphanedImages: this.config.checkOrphanedImages,
        validationTimeout: this.config.validationTimeout
      }
    };

    this.printValidationReport(report);
    return report;
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const recommendations = [];

    // Broken links recommendations
    if (this.validationStats.brokenLinks > 0) {
      recommendations.push({
        type: 'critical',
        issue: 'broken_links',
        message: `${this.validationStats.brokenLinks} broken image links found`,
        action: 'Fix broken links by re-uploading images or updating URLs',
        priority: 'high'
      });
    }

    // Invalid items recommendations
    if (this.validationStats.invalidItems > 5) {
      recommendations.push({
        type: 'error',
        issue: 'invalid_references',
        message: `${this.validationStats.invalidItems} items have invalid image references`,
        action: 'Review and fix invalid image references',
        priority: 'high'
      });
    }

    // Orphaned images recommendations
    if (this.validationStats.orphanedImages > 10) {
      recommendations.push({
        type: 'cleanup',
        issue: 'orphaned_images',
        message: `${this.validationStats.orphanedImages} orphaned images taking up storage space`,
        action: 'Consider removing unused images to free up storage',
        priority: 'medium'
      });
    }

    // Low validation rate
    const validationRate = this.validationStats.totalItems > 0 ? 
      (this.validationStats.validItems / this.validationStats.totalItems * 100) : 0;
    
    if (validationRate < 80) {
      recommendations.push({
        type: 'warning',
        issue: 'low_validation_rate',
        message: `Only ${validationRate.toFixed(1)}% of items passed validation`,
        action: 'Review migration process and fix systematic issues',
        priority: 'high'
      });
    }

    // Format issues recommendations
    if (this.validationStats.formatIssues > 0) {
      recommendations.push({
        type: 'info',
        issue: 'format_issues',
        message: `${this.validationStats.formatIssues} images have format issues`,
        action: 'Consider converting to standard web formats (JPG, PNG, WebP)',
        priority: 'low'
      });
    }

    this.validationResults.recommendations = recommendations;
  }

  /**
   * Print formatted validation report
   */
  printValidationReport(report) {
    console.log('\n📋 Validation Report');
    console.log('===================');
    console.log(`Total items: ${report.summary.totalItems}`);
    console.log(`Valid items: ${report.summary.validItems}`);
    console.log(`Invalid items: ${report.summary.invalidItems}`);
    console.log(`✅ Validation rate: ${report.summary.validationRate}`);
    console.log(`⏱️  Duration: ${report.summary.duration} seconds`);

    // Issues summary
    const hasIssues = Object.values(report.issues).some(count => count > 0);
    if (hasIssues) {
      console.log('\n🚨 Issues Found:');
      if (report.issues.brokenLinks > 0) {
        console.log(`   🔗 Broken links: ${report.issues.brokenLinks}`);
      }
      if (report.issues.orphanedImages > 0) {
        console.log(`   🗑️  Orphaned images: ${report.issues.orphanedImages}`);
      }
      if (report.issues.accessibilityIssues > 0) {
        console.log(`   🚫 Accessibility issues: ${report.issues.accessibilityIssues}`);
      }
      if (report.issues.sizeMismatches > 0) {
        console.log(`   📏 Size mismatches: ${report.issues.sizeMismatches}`);
      }
      if (report.issues.formatIssues > 0) {
        console.log(`   🎨 Format issues: ${report.issues.formatIssues}`);
      }
    } else {
      console.log('\n✅ No issues found - migration appears successful!');
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.slice(0, 5).forEach(rec => {
        const priority = rec.priority.toUpperCase();
        console.log(`   • [${priority}] ${rec.message}`);
        console.log(`     Action: ${rec.action}`);
      });
    }
  }

  /**
   * Standalone validation mode - validate existing data without migration
   */
  async validateOnly() {
    console.log('🔍 Running validation-only mode...');
    
    const report = await this.validateMigration();
    
    // Return simple pass/fail result
    const isValid = report.issues.brokenLinks === 0 && 
                   report.summary.invalidItems === 0;

    return {
      valid: isValid,
      report,
      brokenLinks: this.validationResults.brokenLinks,
      invalidItems: this.validationResults.invalidItems,
      recommendations: this.validationResults.recommendations
    };
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return { ...this.validationStats };
  }

  /**
   * Reset validation state
   */
  resetValidation() {
    this.validationStats = {
      totalItems: 0,
      validatedItems: 0,
      validItems: 0,
      invalidItems: 0,
      brokenLinks: 0,
      orphanedImages: 0,
      sizeMismatches: 0,
      formatIssues: 0,
      accessibilityIssues: 0,
      startTime: null,
      endTime: null,
      validationErrors: []
    };

    this.validationResults = {
      validItems: [],
      invalidItems: [],
      brokenLinks: [],
      orphanedImages: [],
      recommendations: []
    };
  }
}