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
exports.ConfigManager = void 0;
const fs = __importStar(require("fs"));
/**
 * Configuration management for image migration system
 */
class ConfigManager {
    constructor() {
        this.config = this.loadDefaultConfig();
    }
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    loadDefaultConfig() {
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
    parseFileSize(sizeStr) {
        const units = {
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
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
    validateConfig() {
        const errors = [];
        // Validate Strapi URL
        try {
            new URL(this.config.strapiUrl);
        }
        catch {
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
        const invalidFormats = this.config.supportedFormats.filter(format => !validFormats.includes(format.toLowerCase()));
        if (invalidFormats.length > 0) {
            errors.push(`Unsupported image formats: ${invalidFormats.join(', ')}`);
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    printConfig() {
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
    formatFileSize(bytes) {
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
exports.ConfigManager = ConfigManager;
