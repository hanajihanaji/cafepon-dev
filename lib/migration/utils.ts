const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Utility functions for image migration
 */

class MigrationUtils {
  /**
   * Check if a file exists and is accessible
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size in bytes
   */
  static async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate file hash for duplicate detection
   */
  static async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Check if file is a placeholder image
   */
  static isPlaceholderImage(imagePath: string): boolean {
    const placeholderPatterns = [
      'placeholder',
      'placeholder-',
      '/placeholder',
      'default',
      'no-image',
      'coming-soon'
    ];

    const lowerPath = imagePath.toLowerCase();
    return placeholderPatterns.some(pattern => lowerPath.includes(pattern));
  }

  /**
   * Get file extension from path
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase().replace('.', '');
  }

  /**
   * Check if file format is supported
   */
  static isSupportedFormat(filePath: string, supportedFormats: string[]): boolean {
    const extension = this.getFileExtension(filePath);
    return supportedFormats.map(f => f.toLowerCase()).includes(extension);
  }

  /**
   * Generate unique filename to avoid conflicts
   */
  static generateUniqueFilename(originalName: string, existingNames: string[]): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    let counter = 1;
    let newName = originalName;
    
    while (existingNames.includes(newName)) {
      newName = `${baseName}_${counter}${ext}`;
      counter++;
    }
    
    return newName;
  }

  /**
   * Sanitize filename for safe upload
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Create directory if it doesn't exist
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract filename from URL or path
   */
  static extractFilename(urlOrPath: string): string {
    try {
      const url = new URL(urlOrPath);
      return path.basename(url.pathname);
    } catch {
      return path.basename(urlOrPath);
    }
  }

  /**
   * Create backup filename with timestamp
   */
  static createBackupFilename(prefix: string = 'migration-backup'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.json`;
  }

  /**
   * Parse JSON file safely
   */
  static async parseJsonFile<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * Write JSON file safely
   */
  static async writeJsonFile(filePath: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }
}

module.exports = { MigrationUtils };