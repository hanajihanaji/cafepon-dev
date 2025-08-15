#!/usr/bin/env node

/**
 * Image Migration CLI Script - Enhanced with Tsumiki Task 5
 * 
 * Automatically migrates images from imagePath fields to Strapi media library
 * Includes backup/rollback, concurrent processing, and comprehensive reporting
 * 
 * Usage:
 *   node migrate-images-to-strapi.js [options]
 * 
 * Options:
 *   --dry-run              Simulate migration without making changes
 *   --verbose              Enable verbose logging
 *   --skip-placeholders    Skip placeholder images (default: true)
 *   --overwrite-existing   Overwrite existing media files
 *   --max-concurrency N    Maximum concurrent uploads (default: 3)
 *   --no-backup            Disable backup creation
 *   --rollback [file]      Rollback using backup file
 *   --validate-only        Only validate current state
 *   --help                 Show this help message
 */

import { ImageMigrationManager } from './lib/migration/image-migration-manager.js';
import { BackupManager } from './lib/migration/backup-manager.js';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    verbose: false,
    skipPlaceholders: true,
    overwriteExisting: false,
    maxConcurrency: 3,
    backupEnabled: true,
    rollback: null,
    validateOnly: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--skip-placeholders':
        options.skipPlaceholders = true;
        break;
      case '--no-skip-placeholders':
        options.skipPlaceholders = false;
        break;
      case '--overwrite-existing':
        options.overwriteExisting = true;
        break;
      case '--max-concurrency':
        if (i + 1 < args.length) {
          options.maxConcurrency = parseInt(args[++i]);
        }
        break;
      case '--no-backup':
        options.backupEnabled = false;
        break;
      case '--rollback':
        options.rollback = i + 1 < args.length ? args[++i] : true;
        break;
      case '--validate-only':
        options.validateOnly = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

// Show help message
function showHelp() {
  console.log(`
🖼️  Image Migration Tool for Strapi CMS

DESCRIPTION:
  Automatically migrates images from imagePath fields to Strapi media library.
  Creates backups, handles errors, and provides detailed reporting.

USAGE:
  node migrate-images-to-strapi.js [options]

OPTIONS:
  --dry-run                 Simulate migration without making changes
  --verbose                 Enable verbose logging with detailed progress
  --skip-placeholders       Skip placeholder images (default: enabled)
  --no-skip-placeholders    Process placeholder images
  --overwrite-existing      Overwrite existing media files in Strapi
  --max-concurrency N       Maximum concurrent uploads (default: 3, max: 10)
  --no-backup               Disable backup creation (not recommended)
  --rollback [file]         Rollback using backup file (uses latest if no file specified)
  --validate-only           Only validate current image links without migration
  --help, -h                Show this help message

ENVIRONMENT VARIABLES:
  STRAPI_URL               Strapi server URL (default: http://localhost:1340)
  STRAPI_API_TOKEN         Strapi API token for authentication
  PUBLIC_IMAGES_DIR        Public images directory (default: ./public/images)
  MAX_FILE_SIZE            Maximum file size (default: 10MB)
  SUPPORTED_FORMATS        Comma-separated formats (default: jpg,jpeg,png,svg,avif)

EXAMPLES:
  # Dry run to see what would be migrated
  node migrate-images-to-strapi.js --dry-run --verbose

  # Full migration with custom concurrency
  node migrate-images-to-strapi.js --max-concurrency 5

  # Rollback to previous state
  node migrate-images-to-strapi.js --rollback

  # Validate current image links
  node migrate-images-to-strapi.js --validate-only

BACKUP & SAFETY:
  - Automatic backup creation before migration
  - Rollback capability to restore previous state
  - Dry-run mode for safe testing
  - Comprehensive error handling and logging

For more information, visit: https://github.com/your-repo/image-migration
`);
}

// Main execution function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Initialize simple logging
  const logger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
    success: console.log
  };

  try {
    // Show banner
    console.log('🖼️  Strapi Image Migration Tool v2.0.0 (Tsumiki Enhanced)');
    console.log('===========================================================\n');

    // Validate environment
    if (!process.env.STRAPI_URL && !process.env.NEXT_PUBLIC_STRAPI_URL) {
      logger.warn('STRAPI_URL not set, using default: http://localhost:1340');
    }

    // Create migration manager with enhanced features
    const migrationManager = new ImageMigrationManager({
      dryRun: options.dryRun,
      verbose: options.verbose,
      skipPlaceholders: options.skipPlaceholders,
      overwriteExisting: options.overwriteExisting,
      maxConcurrency: Math.min(options.maxConcurrency, 10),
      backupEnabled: options.backupEnabled,
      strapiUrl: process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1340',
      strapiApiToken: process.env.STRAPI_API_TOKEN,
      publicImagesDir: process.env.PUBLIC_IMAGES_DIR || './public/images'
    });

    // Add event listeners for enhanced feedback
    migrationManager.on('migration:started', (data) => {
      if (options.verbose) {
        console.log('📋 Migration configuration:', JSON.stringify(data.config, null, 2));
      }
    });

    migrationManager.on('progress:update', (data) => {
      if (!options.verbose && data.completed % 5 === 0) {
        console.log(`📊 Progress: ${data.percentage}% (${data.completed}/${data.total}) - ETA: ${data.eta}s`);
      }
    });

    migrationManager.on('backup:created', (data) => {
      console.log(`💾 Backup created: ${path.basename(data.backupPath)}`);
    });

    // Handle different modes
    if (options.rollback) {
      logger.info('🔄 Starting rollback process...');
      const backupFile = typeof options.rollback === 'string' ? options.rollback : undefined;
      const success = await migrationManager.rollback(backupFile);
      process.exit(success.success ? 0 : 1);
    }

    if (options.validateOnly) {
      logger.info('🔍 Starting validation-only mode...');
      const result = await migrationManager.validateOnly();
      
      if (result.valid) {
        logger.success('✅ All image links and references are valid');
        console.log(`📊 Validation Summary:`);
        console.log(`   Valid items: ${result.report.summary.validItems}`);
        console.log(`   Invalid items: ${result.report.summary.invalidItems}`);
        console.log(`   Validation rate: ${result.report.summary.validationRate}`);
        process.exit(0);
      } else {
        logger.error(`❌ Found ${result.brokenLinks.length} broken links and ${result.invalidItems.length} invalid references`);
        
        if (result.recommendations.length > 0) {
          console.log('\n💡 Recommendations:');
          result.recommendations.slice(0, 3).forEach(rec => {
            console.log(`   • [${rec.priority.toUpperCase()}] ${rec.message}`);
          });
        }
        
        process.exit(1);
      }
    }

    // Run migration
    if (options.dryRun) {
      logger.info('🧪 Running in DRY RUN mode - no changes will be made');
    }

    const result = await migrationManager.migrate();

    // Run post-migration validation if requested
    if (result.success && options.verbose) {
      logger.info('\n🔍 Running post-migration validation...');
      try {
        const validationResult = await migrationManager.validateOnly();
        
        if (validationResult.valid) {
          logger.success('✅ Post-migration validation passed');
        } else {
          logger.warn('⚠️  Post-migration validation found issues - check the report above');
        }
      } catch (error) {
        logger.warn('⚠️  Post-migration validation failed:', error.message);
      }
    }

    // Show final results
    if (result.success) {
      logger.success('\n✅ Migration completed successfully!');
      
      if (result.report.backup) {
        logger.info(`💾 Backup available at: ${result.report.backup.filename}`);
        logger.info('   Use --rollback to restore if needed');
      }
    } else {
      logger.error('\n❌ Migration completed with errors');
      
      if (result.report.errors.length > 0) {
        logger.error('   Check the error details above for troubleshooting');
      }
    }

    // Exit with appropriate code
    const hasErrors = result.stats.failed > 0;
    process.exit(hasErrors ? 1 : 0);

  } catch (error) {
    logger.error('Migration failed with error:', error.message);
    console.error('\n💥 Fatal Error:', error.message);
    
    if (options.verbose) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.error('\n🆘 Troubleshooting:');
    console.error('  1. Check Strapi server is running and accessible');
    console.error('  2. Verify STRAPI_API_TOKEN is set and valid');
    console.error('  3. Ensure public images directory exists');
    console.error('  4. Run with --verbose for detailed logs');
    console.error('  5. Try --dry-run first to test configuration');
    
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Migration interrupted by user');
  console.log('💡 Use --rollback to restore previous state if needed');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Migration terminated');
  process.exit(143);
});

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}