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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrapiMediaClient = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const logger_1 = require("./logger");
const utils_1 = require("./utils");
/**
 * Strapi API client for media operations
 */
class StrapiMediaClient {
    constructor(config) {
        this.config = config;
        this.logger = logger_1.Logger.getInstance();
        this.baseUrl = config.strapiUrl.replace(/\/$/, '');
        this.headers = {
            'Accept': 'application/json',
        };
        if (config.strapiApiToken) {
            this.headers['Authorization'] = `Bearer ${config.strapiApiToken}`;
        }
    }
    /**
     * Test connection to Strapi API
     */
    async testConnection() {
        try {
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/api/upload/files?pagination[pageSize]=1`, {
                method: 'GET',
                headers: this.headers,
            });
            if (response.ok) {
                this.logger.success('Strapi API connection successful');
                return true;
            }
            else {
                this.logger.error(`Strapi API connection failed: ${response.status} ${response.statusText}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error('Failed to connect to Strapi API', { error: error.message });
            return false;
        }
    }
    /**
     * Upload image to Strapi media library
     */
    async uploadImage(filePath, metadata = {}) {
        try {
            // Validate file exists
            if (!(await utils_1.MigrationUtils.fileExists(filePath))) {
                return {
                    success: false,
                    error: 'File not found',
                    reason: `File does not exist: ${filePath}`
                };
            }
            // Check file size
            const fileSize = await utils_1.MigrationUtils.getFileSize(filePath);
            if (fileSize > this.config.maxFileSize) {
                return {
                    success: false,
                    error: 'File too large',
                    reason: `File size ${utils_1.MigrationUtils.formatBytes(fileSize)} exceeds limit ${utils_1.MigrationUtils.formatBytes(this.config.maxFileSize)}`
                };
            }
            // Check file format
            if (!utils_1.MigrationUtils.isSupportedFormat(filePath, this.config.supportedFormats)) {
                return {
                    success: false,
                    error: 'Unsupported format',
                    reason: `File format not supported: ${utils_1.MigrationUtils.getFileExtension(filePath)}`
                };
            }
            const filename = metadata.name || path.basename(filePath);
            // Check for existing media
            const existingMedia = await this.findExistingMedia(filename);
            if (existingMedia && !this.config.overwriteExisting) {
                this.logger.debug(`Reusing existing media: ${filename}`, { mediaId: existingMedia.id });
                return {
                    success: true,
                    mediaId: existingMedia.id,
                    mediaUrl: existingMedia.url,
                    skipped: true,
                    reason: 'Media already exists',
                    existingMedia
                };
            }
            // Prepare form data
            const formData = new form_data_1.default();
            formData.append('files', fs.createReadStream(filePath), {
                filename: utils_1.MigrationUtils.sanitizeFilename(filename),
                contentType: this.getMimeType(filePath)
            });
            if (metadata.alternativeText) {
                formData.append('fileInfo', JSON.stringify({
                    alternativeText: metadata.alternativeText,
                    caption: metadata.caption || ''
                }));
            }
            // Upload to Strapi
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/api/upload`, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    ...formData.getHeaders()
                },
                body: formData
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Upload failed for ${filename}`, {
                    status: response.status,
                    error: errorText
                });
                return {
                    success: false,
                    error: `Upload failed: ${response.status}`,
                    reason: errorText
                };
            }
            const uploadedFiles = await response.json();
            const uploadedFile = uploadedFiles[0];
            if (!uploadedFile) {
                return {
                    success: false,
                    error: 'No file returned from upload',
                    reason: 'Strapi did not return uploaded file information'
                };
            }
            this.logger.success(`Uploaded: ${filename}`, {
                mediaId: uploadedFile.id,
                size: utils_1.MigrationUtils.formatBytes(uploadedFile.size)
            });
            return {
                success: true,
                mediaId: uploadedFile.id,
                mediaUrl: uploadedFile.url
            };
        }
        catch (error) {
            this.logger.error(`Upload error for ${filePath}`, { error: error.message });
            return {
                success: false,
                error: error.message,
                reason: 'Network or processing error during upload'
            };
        }
    }
    /**
     * Find existing media by filename
     */
    async findExistingMedia(filename) {
        try {
            const sanitizedFilename = utils_1.MigrationUtils.sanitizeFilename(filename);
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/api/upload/files?filters[name][$eq]=${encodeURIComponent(sanitizedFilename)}`, {
                method: 'GET',
                headers: this.headers,
            });
            if (!response.ok) {
                this.logger.warn(`Failed to search for existing media: ${filename}`);
                return null;
            }
            const data = await response.json();
            return data.length > 0 ? data[0] : null;
        }
        catch (error) {
            this.logger.warn(`Error searching for existing media: ${filename}`, {
                error: error.message
            });
            return null;
        }
    }
    /**
     * Get all media files from Strapi
     */
    async getAllMedia() {
        try {
            const allMedia = [];
            let page = 1;
            const pageSize = 100;
            let hasMore = true;
            while (hasMore) {
                const response = await (0, node_fetch_1.default)(`${this.baseUrl}/api/upload/files?pagination[page]=${page}&pagination[pageSize]=${pageSize}`, {
                    method: 'GET',
                    headers: this.headers,
                });
                if (!response.ok) {
                    this.logger.error(`Failed to fetch media page ${page}`);
                    break;
                }
                const data = await response.json();
                const mediaItems = data.data || data;
                if (Array.isArray(mediaItems) && mediaItems.length > 0) {
                    allMedia.push(...mediaItems);
                    hasMore = mediaItems.length === pageSize;
                    page++;
                }
                else {
                    hasMore = false;
                }
            }
            this.logger.debug(`Retrieved ${allMedia.length} media items from Strapi`);
            return allMedia;
        }
        catch (error) {
            this.logger.error('Failed to retrieve media from Strapi', {
                error: error.message
            });
            return [];
        }
    }
    /**
     * Update menu item with media reference
     */
    async updateMenuItemImage(itemId, mediaId) {
        try {
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/api/menu-items/${itemId}`, {
                method: 'PUT',
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        image: mediaId
                    }
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Failed to update menu item ${itemId}`, {
                    status: response.status,
                    error: errorText
                });
                return false;
            }
            this.logger.debug(`Updated menu item ${itemId} with media ${mediaId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error updating menu item ${itemId}`, {
                error: error.message
            });
            return false;
        }
    }
    /**
     * Get all menu items from Strapi
     */
    async getMenuItems() {
        try {
            const allItems = [];
            let page = 1;
            const pageSize = 100;
            let hasMore = true;
            while (hasMore) {
                const response = await (0, node_fetch_1.default)(`${this.baseUrl}/api/menu-items?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`, {
                    method: 'GET',
                    headers: this.headers,
                });
                if (!response.ok) {
                    this.logger.error(`Failed to fetch menu items page ${page}`);
                    break;
                }
                const data = await response.json();
                const items = data.data || [];
                if (items.length > 0) {
                    allItems.push(...items);
                    hasMore = items.length === pageSize;
                    page++;
                }
                else {
                    hasMore = false;
                }
            }
            this.logger.debug(`Retrieved ${allItems.length} menu items from Strapi`);
            return allItems;
        }
        catch (error) {
            this.logger.error('Failed to retrieve menu items from Strapi', {
                error: error.message
            });
            return [];
        }
    }
    /**
     * Validate image URL accessibility
     */
    async validateImageUrl(url) {
        try {
            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
            const response = await (0, node_fetch_1.default)(fullUrl, { method: 'HEAD' });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    /**
     * Get MIME type for file
     */
    getMimeType(filePath) {
        const ext = utils_1.MigrationUtils.getFileExtension(filePath);
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'svg': 'image/svg+xml',
            'avif': 'image/avif',
            'webp': 'image/webp'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}
exports.StrapiMediaClient = StrapiMediaClient;
