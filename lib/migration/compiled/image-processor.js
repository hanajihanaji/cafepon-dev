"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProcessor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("./logger");
const utils_1 = require("./utils");
/**
 * Image file processing and validation system
 */
class ImageProcessor {
    constructor(config) {
        this.config = config;
        this.logger = logger_1.Logger.getInstance();
    }
    /**
     * Process and validate image file for upload
     */
    async processImage(imagePath) {
        try {
            // Check if it's a placeholder image and should be skipped
            if (this.config.skipPlaceholders && utils_1.MigrationUtils.isPlaceholderImage(imagePath)) {
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
            if (!(await utils_1.MigrationUtils.fileExists(fullPath))) {
                return {
                    valid: false,
                    error: `File not found: ${fullPath}`
                };
            }
            // Validate file format
            if (!utils_1.MigrationUtils.isSupportedFormat(fullPath, this.config.supportedFormats)) {
                return {
                    valid: false,
                    error: `Unsupported format: ${utils_1.MigrationUtils.getFileExtension(fullPath)}`
                };
            }
            // Check file size
            const size = await utils_1.MigrationUtils.getFileSize(fullPath);
            if (size === 0) {
                return {
                    valid: false,
                    error: 'File is empty'
                };
            }
            if (size > this.config.maxFileSize) {
                return {
                    valid: false,
                    error: `File too large: ${utils_1.MigrationUtils.formatBytes(size)} > ${utils_1.MigrationUtils.formatBytes(this.config.maxFileSize)}`
                };
            }
            // Calculate file hash for duplicate detection
            const hash = await utils_1.MigrationUtils.calculateFileHash(fullPath);
            const filename = path.basename(fullPath);
            this.logger.verbose(`Processed image: ${filename}`, {
                size: utils_1.MigrationUtils.formatBytes(size),
                hash: hash.substring(0, 8),
                format: utils_1.MigrationUtils.getFileExtension(fullPath)
            });
            return {
                valid: true,
                fullPath,
                filename,
                size,
                hash
            };
        }
        catch (error) {
            this.logger.error(`Error processing image: ${imagePath}`, {
                error: error.message
            });
            return {
                valid: false,
                error: error.message
            };
        }
    }
    /**
     * Validate multiple images in batch
     */
    async validateImageBatch(imagePaths) {
        const results = {
            valid: [],
            invalid: [],
            skipped: []
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
            }
            else if (result.valid) {
                results.valid.push({
                    path: imagePath,
                    result
                });
            }
            else {
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
    resolveImagePath(imagePath) {
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
        }
        catch {
            return null;
        }
    }
    /**
     * Generate optimized filename for upload
     */
    generateOptimizedFilename(originalPath, existingFilenames = []) {
        const originalName = path.basename(originalPath);
        const sanitized = utils_1.MigrationUtils.sanitizeFilename(originalName);
        // Generate unique filename if conflicts exist
        return utils_1.MigrationUtils.generateUniqueFilename(sanitized, existingFilenames);
    }
    /**
     * Check if image is a valid image file by reading headers
     */
    async validateImageHeaders(filePath) {
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
        }
        catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
    /**
     * Check if buffer matches file signature
     */
    matchesSignature(buffer, signature) {
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
    async getImageMetadata(filePath) {
        const stats = await fs.promises.stat(filePath);
        const hash = await utils_1.MigrationUtils.calculateFileHash(filePath);
        return {
            filename: path.basename(filePath),
            size: stats.size,
            format: utils_1.MigrationUtils.getFileExtension(filePath),
            hash,
            lastModified: stats.mtime
        };
    }
    /**
     * Create backup of image file
     */
    async createImageBackup(filePath, backupDir) {
        try {
            await utils_1.MigrationUtils.ensureDirectory(backupDir);
            const filename = path.basename(filePath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `${timestamp}_${filename}`;
            const backupPath = path.join(backupDir, backupFilename);
            await fs.promises.copyFile(filePath, backupPath);
            this.logger.debug(`Created image backup: ${backupFilename}`);
            return backupPath;
        }
        catch (error) {
            this.logger.error(`Failed to create image backup: ${filePath}`, {
                error: error.message
            });
            return null;
        }
    }
    /**
     * Scan directory for image files
     */
    async scanForImages(directory, recursive = true) {
        const imageFiles = [];
        try {
            const entries = await fs.promises.readdir(directory, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                if (entry.isDirectory() && recursive) {
                    const subImages = await this.scanForImages(fullPath, recursive);
                    imageFiles.push(...subImages);
                }
                else if (entry.isFile()) {
                    if (utils_1.MigrationUtils.isSupportedFormat(entry.name, this.config.supportedFormats)) {
                        imageFiles.push(fullPath);
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`Error scanning directory: ${directory}`, {
                error: error.message
            });
        }
        return imageFiles;
    }
    /**
     * Get statistics about images in directory
     */
    async getImageStats(directory) {
        const images = await this.scanForImages(directory);
        const stats = {
            totalFiles: images.length,
            totalSize: 0,
            formatCounts: {},
            largestFile: null,
            oldestFile: null
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
            }
            catch (error) {
                this.logger.warn(`Failed to get stats for: ${imagePath}`, {
                    error: error.message
                });
            }
        }
        return stats;
    }
}
exports.ImageProcessor = ImageProcessor;
