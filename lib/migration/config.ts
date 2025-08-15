const path = require('path');
const fs = require('fs');

/**
 * Configuration management for image migration system
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: MigrationConfig;

  private constructor() {
    this.config = this.loadDefaultConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadDefaultConfig(): MigrationConfig {
    return {
      strapiUrl: process.env.STRAPI_URL || 'http://localhost:1340',
      strapiApiToken: process.env.STRAPI_API_TOKEN,
      publicImagesDir: process.env.PUBLIC_IMAGES_DIR || './public/images',
      dryRun: process.env.DRY_RUN === 'true',
      verbose: process.env.LOG_LEVEL === 'verbose',
      skipPlaceholders: process.env.SKIP_PLACEHOLDERS !== 'false',
      overwriteExisting: process.env.OVERWRITE_EXISTING === 'true',
      maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '3'),
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
      backupEnabled: process.env.BACKUP_ENABLED !== 'false',
      maxFileSize: this.parseFileSize(process.env.MAX_FILE_SIZE || '10MB'),
      supportedFormats: (process.env.SUPPORTED_FORMATS || 'jpg,jpeg,png,svg,avif').split(',')
    };
  }

  private parseFileSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]{1,2})$/i);
    if (!match) {
      throw new Error(`Invalid file size format: ${sizeStr}`);
    }

    const [, size, unit] = match;
    const multiplier = units[unit.toUpperCase()];
    if (!multiplier) {
      throw new Error(`Unknown file size unit: ${unit}`);
    }

    return parseFloat(size) * multiplier;
  }

  public getConfig(): MigrationConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<MigrationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate Strapi URL
    try {
      new URL(this.config.strapiUrl);
    } catch {
      errors.push('Invalid Strapi URL format');
    }

    // Validate public images directory
    if (!fs.existsSync(this.config.publicImagesDir)) {
      errors.push(`Public images directory does not exist: ${this.config.publicImagesDir}`);
    }

    // Validate numeric values
    if (this.config.maxConcurrency < 1 || this.config.maxConcurrency > 10) {
      errors.push('Max concurrency must be between 1 and 10');
    }

    if (this.config.retryAttempts < 0 || this.config.retryAttempts > 10) {
      errors.push('Retry attempts must be between 0 and 10');
    }

    if (this.config.maxFileSize < 1024) {
      errors.push('Max file size must be at least 1KB');
    }

    // Validate supported formats
    const validFormats = ['jpg', 'jpeg', 'png', 'svg', 'avif', 'webp'];
    const invalidFormats = this.config.supportedFormats.filter(
      format => !validFormats.includes(format.toLowerCase())
    );
    if (invalidFormats.length > 0) {
      errors.push(`Unsupported image formats: ${invalidFormats.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public printConfig(): void {
    console.log('🔧 Migration Configuration:');
    console.log(`   Strapi URL: ${this.config.strapiUrl}`);
    console.log(`   Public Images Dir: ${this.config.publicImagesDir}`);
    console.log(`   Dry Run: ${this.config.dryRun}`);
    console.log(`   Skip Placeholders: ${this.config.skipPlaceholders}`);
    console.log(`   Max Concurrency: ${this.config.maxConcurrency}`);
    console.log(`   Retry Attempts: ${this.config.retryAttempts}`);
    console.log(`   Max File Size: ${this.formatFileSize(this.config.maxFileSize)}`);
    console.log(`   Supported Formats: ${this.config.supportedFormats.join(', ')}`);
    console.log('');
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
}