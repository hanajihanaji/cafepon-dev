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
exports.MigrationUtils = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
/**
 * Utility functions for image migration
 */
class MigrationUtils {
    /**
     * Check if a file exists and is accessible
     */
    static async fileExists(filePath) {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get file size in bytes
     */
    static async getFileSize(filePath) {
        try {
            const stats = await fs.promises.stat(filePath);
            return stats.size;
        }
        catch {
            return 0;
        }
    }
    /**
     * Calculate file hash for duplicate detection
     */
    static async calculateFileHash(filePath) {
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
    static isPlaceholderImage(imagePath) {
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
    static getFileExtension(filePath) {
        return path.extname(filePath).toLowerCase().replace('.', '');
    }
    /**
     * Check if file format is supported
     */
    static isSupportedFormat(filePath, supportedFormats) {
        const extension = this.getFileExtension(filePath);
        return supportedFormats.map(f => f.toLowerCase()).includes(extension);
    }
    /**
     * Generate unique filename to avoid conflicts
     */
    static generateUniqueFilename(originalName, existingNames) {
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
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }
    /**
     * Create directory if it doesn't exist
     */
    static async ensureDirectory(dirPath) {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
        catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }
    /**
     * Sleep for specified milliseconds
     */
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Retry function with exponential backoff
     */
    static async retry(fn, maxAttempts, baseDelay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxAttempts) {
                    throw lastError;
                }
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    /**
     * Format bytes to human readable string
     */
    static formatBytes(bytes) {
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
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Extract filename from URL or path
     */
    static extractFilename(urlOrPath) {
        try {
            const url = new URL(urlOrPath);
            return path.basename(url.pathname);
        }
        catch {
            return path.basename(urlOrPath);
        }
    }
    /**
     * Create backup filename with timestamp
     */
    static createBackupFilename(prefix = 'migration-backup') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `${prefix}-${timestamp}.json`;
    }
    /**
     * Parse JSON file safely
     */
    static async parseJsonFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    /**
     * Write JSON file safely
     */
    static async writeJsonFile(filePath, data) {
        const content = JSON.stringify(data, null, 2);
        await fs.promises.writeFile(filePath, content, 'utf-8');
    }
}
exports.MigrationUtils = MigrationUtils;
