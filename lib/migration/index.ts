/**
 * Image Migration System
 * 
 * This module provides automated migration of images from Next.js public directory
 * to Strapi media library with comprehensive error handling and validation.
 */

// Core types and interfaces
export * from './types';

// Configuration management
export { ConfigManager } from './config';

// Logging system
export { Logger, LogLevel } from './logger';

// Utility functions
export { MigrationUtils } from './utils';

// Main components
export { StrapiMediaClient } from './strapi-client';
export { ImageProcessor } from './image-processor';
export { BackupManager } from './backup-manager';
export { ImageMigrationManager } from './migration-manager';

// Version information
export const VERSION = '1.0.0';
export const DESCRIPTION = 'Automated image migration system for Strapi CMS';