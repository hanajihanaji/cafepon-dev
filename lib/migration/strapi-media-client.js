/**
 * Strapi Media API Client - CommonJS Version
 * Handles media upload and management operations for image migration
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class StrapiMediaClient {
  constructor(options) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiToken = options.apiToken;
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    return headers;
  }

  /**
   * Upload image file to Strapi media library
   */
  async uploadImage(filePath, metadata = {}) {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'File not found',
          reason: `File does not exist: ${filePath}`
        };
      }

      // Get file info
      const fileName = path.basename(filePath);
      const stats = fs.statSync(filePath);
      
      // Check for existing media with same filename first
      const existingMedia = await this.findExistingMedia(fileName);
      if (existingMedia) {
        return {
          success: true,
          mediaId: existingMedia.id,
          mediaUrl: existingMedia.url,
          documentId: existingMedia.documentId,
          skipped: true,
          reason: 'Media already exists with same filename'
        };
      }

      // Create FormData for upload using form-data package
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      formData.append('files', fileBuffer, {
        filename: fileName,
        contentType: this.getMimeType(path.extname(fileName))
      });

      // Add metadata if provided
      if (metadata?.alternativeText) {
        formData.append('fileInfo', JSON.stringify({
          alternativeText: metadata.alternativeText
        }));
      }

      // Upload to Strapi using node-fetch with form-data
      const authHeaders = this.getAuthHeaders();
      delete authHeaders['Content-Type']; // Let FormData set content-type
      
      const headers = {
        ...authHeaders,
        ...formData.getHeaders()
      };

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Upload failed: ${response.status} ${response.statusText}`,
          reason: errorText
        };
      }

      const uploadedFiles = await response.json();
      
      if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
        return {
          success: false,
          error: 'No files returned from upload',
          reason: 'Strapi returned empty response'
        };
      }

      const uploadedFile = uploadedFiles[0];
      
      return {
        success: true,
        mediaId: uploadedFile.id,
        mediaUrl: uploadedFile.url,
        documentId: uploadedFile.documentId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
        reason: error instanceof Error ? error.stack : 'No stack trace'
      };
    }
  }

  /**
   * Find existing media by filename
   */
  async findExistingMedia(filename) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/upload/files?filters[name][$eq]=${encodeURIComponent(filename)}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        console.warn(`Failed to search for existing media: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      return data && data.length > 0 ? data[0] : null;

    } catch (error) {
      console.warn('Error searching for existing media:', error);
      return null;
    }
  }

  /**
   * Find existing media by file hash (more accurate duplicate detection)
   */
  async findExistingMediaByHash(filePath) {
    try {
      // Calculate file hash
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

      const response = await fetch(
        `${this.baseUrl}/api/upload/files?filters[hash][$eq]=${hash}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        console.warn(`Failed to search for existing media by hash: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      return data && data.length > 0 ? data[0] : null;

    } catch (error) {
      console.warn('Error searching for existing media by hash:', error);
      return null;
    }
  }

  /**
   * Update menu item with media reference using documentId (Strapi 5.x)
   */
  async updateMenuItemImage(itemId, mediaId) {
    try {
      // First, get the menu item to find its documentId
      const getResponse = await fetch(`${this.baseUrl}/api/menu-items?filters[id][$eq]=${itemId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!getResponse.ok) {
        console.error('Failed to get menu item:', await getResponse.text());
        return false;
      }
      
      const menuItems = await getResponse.json();
      if (!menuItems.data || menuItems.data.length === 0) {
        console.error('Menu item not found with ID:', itemId);
        return false;
      }
      
      const menuItem = menuItems.data[0];
      const documentId = menuItem.documentId;
      
      // Now update using documentId
      const updateResponse = await fetch(`${this.baseUrl}/api/menu-items/${documentId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          data: {
            image: mediaId
          }
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Update failed:', errorText);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error updating menu item image:', error);
      return false;
    }
  }

  /**
   * Get all menu items from Strapi
   */
  async getMenuItems() {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/menu-items?populate=*&pagination[pageSize]=100`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch menu items: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];

    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/upload/files?pagination[pageSize]=1`, {
        headers: this.getAuthHeaders()
      });

      return response.ok;

    } catch (error) {
      return false;
    }
  }

  /**
   * Get MIME type based on file extension
   */
  getMimeType(ext) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.avif': 'image/avif',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}

module.exports = { StrapiMediaClient };