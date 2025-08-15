const fs = require('fs');
const path = require('path');
const { ErrorType } = require('./types');
const { Logger } = require('./logger');
const { MigrationUtils } = require('./utils');

/**
 * Image file processing and validation system
 */
class ImageProcessor {
  private config: MigrationConfig;
  private logger: Logger;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.logger = Logger.getInstance();
  }

  /**
   * Process and validate image file for upload
   */
  async processImage(imagePath: string): Promise<{
    valid: boolean;
    fullPath?: string;
    filename?: string;
    size?: number;
    hash?: string;
    error?: string;
    shouldSkip?: boolean;
    skipReason?: string;
  }> {
    try {
      // Check if it's a placeholder image and should be skipped
      if (this.config.skipPlaceholders && MigrationUtils.isPlaceholderImage(imagePath)) {
        return {
          valid: false,
          shouldSkip: true,
          skipReason: 'Placeholder image'
        };
      }

      // Resolve full path
      const fullPath = this.resolveImagePath(imagePath);
      if (!fullPath) {
        return {
          valid: false,
          error: 'Could not resolve image path'
        };
      }

      // Validate file exists
      if (!(await MigrationUtils.fileExists(fullPath))) {
        return {
          valid: false,
          error: `File not found: ${fullPath}`
        };
      }

      // Validate file format
      if (!MigrationUtils.isSupportedFormat(fullPath, this.config.supportedFormats)) {
        return {
          valid: false,
          error: `Unsupported format: ${MigrationUtils.getFileExtension(fullPath)}`
        };
      }

      // Check file size
      const size = await MigrationUtils.getFileSize(fullPath);
      if (size === 0) {
        return {
          valid: false,
          error: 'File is empty'
        };
      }

      if (size > this.config.maxFileSize) {
        return {
          valid: false,
          error: `File too large: ${MigrationUtils.formatBytes(size)} > ${MigrationUtils.formatBytes(this.config.maxFileSize)}`
        };
      }

      // Calculate file hash for duplicate detection
      const hash = await MigrationUtils.calculateFileHash(fullPath);
      const filename = path.basename(fullPath);

      this.logger.verbose(`Processed image: ${filename}`, {
        size: MigrationUtils.formatBytes(size),
        hash: hash.substring(0, 8),
        format: MigrationUtils.getFileExtension(fullPath)
      });

      return {
        valid: true,
        fullPath,
        filename,
        size,
        hash
      };

    } catch (error) {
      this.logger.error(`Error processing image: ${imagePath}`, {
        error: (error as Error).message
      });
      return {
        valid: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Validate multiple images in batch
   */
  async validateImageBatch(imagePaths: string[]): Promise<{
    valid: Array<{ path: string; result: any }>;
    invalid: Array<{ path: string; error: string }>;
    skipped: Array<{ path: string; reason: string }>;
  }> {
    const results = {
      valid: [] as Array<{ path: string; result: any }>,
      invalid: [] as Array<{ path: string; error: string }>,
      skipped: [] as Array<{ path: string; reason: string }>
    };

    this.logger.info(`Validating ${imagePaths.length} images...`);

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      this.logger.progress(i + 1, imagePaths.length, `Validating: ${path.basename(imagePath)}`);

      const result = await this.processImage(imagePath);

      if (result.shouldSkip) {
        results.skipped.push({
          path: imagePath,
          reason: result.skipReason || 'Unknown'
        });
      } else if (result.valid) {
        results.valid.push({
          path: imagePath,
          result
        });
      } else {
        results.invalid.push({
          path: imagePath,
          error: result.error || 'Unknown error'
        });
      }
    }

    this.logger.info(`Validation complete: ${results.valid.length} valid, ${results.invalid.length} invalid, ${results.skipped.length} skipped`);

    return results;
  }

  /**
   * Resolve image path to full system path
   */
  private resolveImagePath(imagePath: string): string | null {
    try {
      // If it's already an absolute path, use it
      if (path.isAbsolute(imagePath)) {
        return imagePath;
      }

      // Remove leading slash if present
      const cleanPath = imagePath.replace(/^\//, '');
      
      // Try relative to public images directory (most common case)
      const publicPath = path.join(this.config.publicImagesDir, cleanPath.replace(/^images\//, ''));
      if (fs.existsSync(publicPath)) {
        return publicPath;
      }

      // Try relative to public directory
      const publicRootPath = path.join(this.config.publicImagesDir, '..', cleanPath);
      if (fs.existsSync(publicRootPath)) {
        return publicRootPath;
      }

      // Try as direct path from project root
      const projectPath = path.join(process.cwd(), 'public', cleanPath);
      if (fs.existsSync(projectPath)) {
        return projectPath;
      }

      // Try without 'images/' prefix in public/images directory
      if (cleanPath.startsWith('images/')) {
        const withoutImagesPrefix = cleanPath.replace('images/', '');
        const directPath = path.join(this.config.publicImagesDir, withoutImagesPrefix);
        if (fs.existsSync(directPath)) {
          return directPath;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Generate optimized filename for upload
   */
  generateOptimizedFilename(originalPath: string, existingFilenames: string[] = []): string {
    const originalName = path.basename(originalPath);
    const sanitized = MigrationUtils.sanitizeFilename(originalName);
    
    // Generate unique filename if conflicts exist
    return MigrationUtils.generateUniqueFilename(sanitized, existingFilenames);
  }

  /**
   * Check if image is a valid image file by reading headers
   */
  async validateImageHeaders(filePath: string): Promise<{
    valid: boolean;
    format?: string;
    width?: number;
    height?: number;
    error?: string;
  }> {
    try {
      const buffer = await fs.promises.readFile(filePath, { flag: 'r' });
      
      // Check for common image file signatures
      const signatures = {
        'jpg': [0xFF, 0xD8, 0xFF],
        'png': [0x89, 0x50, 0x4E, 0x47],
        'svg': [0x3C, 0x3F, 0x78, 0x6D], // <?xml or <svg
        'avif': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]
      };

      for (const [format, signature] of Object.entries(signatures)) {
        if (this.matchesSignature(buffer, signature)) {
          return {
            valid: true,
            format
          };
        }
      }

      // Special handling for SVG (text-based)
      if (filePath.toLowerCase().endsWith('.svg')) {
        const content = buffer.toString('utf8', 0, Math.min(1000, buffer.length));
        if (content.includes('<svg') || content.includes('<?xml')) {
          return {
            valid: true,
            format: 'svg'
          };
        }
      }

      return {
        valid: false,
        error: 'Unknown or invalid image format'
      };

    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check if buffer matches file signature
   */
  private matchesSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get image metadata without external dependencies
   */
  async getImageMetadata(filePath: string): Promise<{
    filename: string;
    size: number;
    format: string;
    hash: string;
    lastModified: Date;
  }> {
    const stats = await fs.promises.stat(filePath);
    const hash = await MigrationUtils.calculateFileHash(filePath);
    
    return {
      filename: path.basename(filePath),
      size: stats.size,
      format: MigrationUtils.getFileExtension(filePath),
      hash,
      lastModified: stats.mtime
    };
  }

  /**
   * Create backup of image file
   */
  async createImageBackup(filePath: string, backupDir: string): Promise<string | null> {
    try {
      await MigrationUtils.ensureDirectory(backupDir);
      
      const filename = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${timestamp}_${filename}`;
      const backupPath = path.join(backupDir, backupFilename);
      
      await fs.promises.copyFile(filePath, backupPath);
      
      this.logger.debug(`Created image backup: ${backupFilename}`);
      return backupPath;
      
    } catch (error) {
      this.logger.error(`Failed to create image backup: ${filePath}`, {
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Scan directory for image files
   */
  async scanForImages(directory: string, recursive: boolean = true): Promise<string[]> {
    const imageFiles: string[] = [];
    
    try {
      const entries = await fs.promises.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory() && recursive) {
          const subImages = await this.scanForImages(fullPath, recursive);
          imageFiles.push(...subImages);
        } else if (entry.isFile()) {
          if (MigrationUtils.isSupportedFormat(entry.name, this.config.supportedFormats)) {
            imageFiles.push(fullPath);
          }
        }
      }
      
    } catch (error) {
      this.logger.error(`Error scanning directory: ${directory}`, {
        error: (error as Error).message
      });
    }
    
    return imageFiles;
  }

  /**
   * Get statistics about images in directory
   */
  async getImageStats(directory: string): Promise<{
    totalFiles: number;
    totalSize: number;
    formatCounts: Record<string, number>;
    largestFile: { path: string; size: number } | null;
    oldestFile: { path: string; date: Date } | null;
  }> {
    const images = await this.scanForImages(directory);
    const stats = {
      totalFiles: images.length,
      totalSize: 0,
      formatCounts: {} as Record<string, number>,
      largestFile: null as { path: string; size: number } | null,
      oldestFile: null as { path: string; date: Date } | null
    };

    for (const imagePath of images) {
      try {
        const metadata = await this.getImageMetadata(imagePath);
        
        stats.totalSize += metadata.size;
        
        const format = metadata.format;
        stats.formatCounts[format] = (stats.formatCounts[format] || 0) + 1;
        
        if (!stats.largestFile || metadata.size > stats.largestFile.size) {
          stats.largestFile = { path: imagePath, size: metadata.size };
        }
        
        if (!stats.oldestFile || metadata.lastModified < stats.oldestFile.date) {
          stats.oldestFile = { path: imagePath, date: metadata.lastModified };
        }
        
      } catch (error) {
        this.logger.warn(`Failed to get stats for: ${imagePath}`, {
          error: (error as Error).message
        });
      }
    }

    return stats;
  }
}

module.exports = { ImageProcessor };