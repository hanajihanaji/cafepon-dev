const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { ErrorType } = require('./types');
const { Logger } = require('./logger');
const { MigrationUtils } = require('./utils');

/**
 * Strapi API client for media operations
 */
class StrapiMediaClient {
  private config: MigrationConfig;
  private logger: Logger;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.logger = Logger.getInstance();
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
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/upload/files?pagination[pageSize]=1`, {
        method: 'GET',
        headers: this.headers,
      });

      if (response.ok) {
        this.logger.success('Strapi API connection successful');
        return true;
      } else {
        this.logger.error(`Strapi API connection failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to connect to Strapi API', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Upload image to Strapi media library
   */
  async uploadImage(filePath: string, metadata: {
    name?: string;
    alternativeText?: string;
    caption?: string;
  } = {}): Promise<UploadResult> {
    try {
      // Validate file exists
      if (!(await MigrationUtils.fileExists(filePath))) {
        return {
          success: false,
          error: 'File not found',
          reason: `File does not exist: ${filePath}`
        };
      }

      // Check file size
      const fileSize = await MigrationUtils.getFileSize(filePath);
      if (fileSize > this.config.maxFileSize) {
        return {
          success: false,
          error: 'File too large',
          reason: `File size ${MigrationUtils.formatBytes(fileSize)} exceeds limit ${MigrationUtils.formatBytes(this.config.maxFileSize)}`
        };
      }

      // Check file format
      if (!MigrationUtils.isSupportedFormat(filePath, this.config.supportedFormats)) {
        return {
          success: false,
          error: 'Unsupported format',
          reason: `File format not supported: ${MigrationUtils.getFileExtension(filePath)}`
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
      const formData = new FormData();
      formData.append('files', fs.createReadStream(filePath), {
        filename: MigrationUtils.sanitizeFilename(filename),
        contentType: this.getMimeType(filePath)
      });

      if (metadata.alternativeText) {
        formData.append('fileInfo', JSON.stringify({
          alternativeText: metadata.alternativeText,
          caption: metadata.caption || ''
        }));
      }

      // Upload to Strapi
      const response = await fetch(`${this.baseUrl}/api/upload`, {
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

      const uploadedFiles = await response.json() as StrapiMediaItem[];
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
        size: MigrationUtils.formatBytes(uploadedFile.size)
      });

      return {
        success: true,
        mediaId: uploadedFile.id,
        mediaUrl: uploadedFile.url
      };

    } catch (error) {
      this.logger.error(`Upload error for ${filePath}`, { error: (error as Error).message });
      return {
        success: false,
        error: (error as Error).message,
        reason: 'Network or processing error during upload'
      };
    }
  }

  /**
   * Find existing media by filename
   */
  async findExistingMedia(filename: string): Promise<StrapiMediaItem | null> {
    try {
      const sanitizedFilename = MigrationUtils.sanitizeFilename(filename);
      const response = await fetch(
        `${this.baseUrl}/api/upload/files?filters[name][$eq]=${encodeURIComponent(sanitizedFilename)}`,
        {
          method: 'GET',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        this.logger.warn(`Failed to search for existing media: ${filename}`);
        return null;
      }

      const data = await response.json() as StrapiMediaItem[];
      return data.length > 0 ? data[0] : null;

    } catch (error) {
      this.logger.warn(`Error searching for existing media: ${filename}`, { 
        error: (error as Error).message 
      });
      return null;
    }
  }

  /**
   * Get all media files from Strapi
   */
  async getAllMedia(): Promise<StrapiMediaItem[]> {
    try {
      const allMedia: StrapiMediaItem[] = [];
      let page = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${this.baseUrl}/api/upload/files?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
          {
            method: 'GET',
            headers: this.headers,
          }
        );

        if (!response.ok) {
          this.logger.error(`Failed to fetch media page ${page}`);
          break;
        }

        const data = await response.json() as any;
        const mediaItems = data.data || data;
        
        if (Array.isArray(mediaItems) && mediaItems.length > 0) {
          allMedia.push(...mediaItems);
          hasMore = mediaItems.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      this.logger.debug(`Retrieved ${allMedia.length} media items from Strapi`);
      return allMedia;

    } catch (error) {
      this.logger.error('Failed to retrieve media from Strapi', { 
        error: (error as Error).message 
      });
      return [];
    }
  }

  /**
   * Update menu item with media reference
   */
  async updateMenuItemImage(itemId: string, mediaId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/menu-items/${itemId}`, {
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

    } catch (error) {
      this.logger.error(`Error updating menu item ${itemId}`, { 
        error: (error as Error).message 
      });
      return false;
    }
  }

  /**
   * Get all menu items from Strapi
   */
  async getMenuItems(): Promise<any[]> {
    try {
      const allItems: any[] = [];
      let page = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${this.baseUrl}/api/menu-items?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
          {
            method: 'GET',
            headers: this.headers,
          }
        );

        if (!response.ok) {
          this.logger.error(`Failed to fetch menu items page ${page}`);
          break;
        }

        const data = await response.json() as any;
        const items = data.data || [];
        
        if (items.length > 0) {
          allItems.push(...items);
          hasMore = items.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      this.logger.debug(`Retrieved ${allItems.length} menu items from Strapi`);
      return allItems;

    } catch (error) {
      this.logger.error('Failed to retrieve menu items from Strapi', { 
        error: (error as Error).message 
      });
      return [];
    }
  }

  /**
   * Validate image URL accessibility
   */
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
      const response = await fetch(fullUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get MIME type for file
   */
  private getMimeType(filePath: string): string {
    const ext = MigrationUtils.getFileExtension(filePath);
    const mimeTypes: Record<string, string> = {
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

module.exports = { StrapiMediaClient };