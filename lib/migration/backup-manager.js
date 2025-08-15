/**
 * Backup and Rollback System for Migration Safety
 * Handles state preservation and restoration for image migrations
 */

import fs from 'fs';
import path from 'path';

export class BackupManager {
  constructor(config) {
    this.config = config;
    this.backupDir = path.join(process.cwd(), 'migration-backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create comprehensive backup of current state
   */
  async createBackup(menuItems, description = 'Auto backup') {
    try {
      console.log('💾 Creating migration backup...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `menu-items-backup-${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFilename);

      const backupData = {
        timestamp: new Date().toISOString(),
        description,
        totalItems: menuItems.length,
        menuItems: menuItems.map(item => ({
          id: item.id,
          documentId: item.documentId,
          name: item.name,
          imagePath: item.imagePath || null,
          imageId: item.image?.id || null,
          imageUrl: item.image?.url || null,
          originalState: {
            hasImagePath: !!item.imagePath,
            hasLinkedImage: !!item.image?.id
          }
        }))
      };

      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      console.log(`✅ Backup created: ${backupFilename}`);
      console.log(`   Items backed up: ${backupData.totalItems}`);
      console.log(`   Backup location: ${backupPath}`);

      return backupPath;

    } catch (error) {
      console.error('❌ Failed to create backup:', error.message);
      return null;
    }
  }

  /**
   * Create selective backup for specific items
   */
  async createSelectiveBackup(menuItems, itemIds, description) {
    try {
      const selectedItems = menuItems.filter(item => 
        itemIds.includes(item.id.toString()) || itemIds.includes(item.documentId)
      );

      if (selectedItems.length === 0) {
        console.warn('⚠️  No items found for selective backup');
        return null;
      }

      return await this.createBackup(selectedItems, `Selective backup: ${description}`);

    } catch (error) {
      console.error('❌ Failed to create selective backup:', error.message);
      return null;
    }
  }

  /**
   * Restore from backup file
   */
  async restoreFromBackup(backupPath, strapiClient) {
    const result = {
      success: false,
      restored: 0,
      failed: 0,
      errors: []
    };

    try {
      console.log(`🔄 Restoring from backup: ${path.basename(backupPath)}`);

      // Load backup data
      const backupData = this.loadBackupData(backupPath);
      if (!backupData) {
        throw new Error('Failed to load backup file');
      }

      console.log(`📋 Backup contains ${backupData.menuItems.length} items from ${backupData.timestamp}`);

      // Restore each item
      for (let i = 0; i < backupData.menuItems.length; i++) {
        const item = backupData.menuItems[i];
        console.log(`   🔄 Restoring ${i + 1}/${backupData.menuItems.length}: ${item.name}`);

        try {
          const restored = await this.restoreMenuItem(item, strapiClient);
          if (restored) {
            result.restored++;
            console.log(`   ✅ Restored: ${item.name}`);
          } else {
            result.failed++;
            result.errors.push({
              itemId: item.documentId,
              itemName: item.name,
              error: 'Failed to restore item'
            });
            console.log(`   ❌ Failed to restore: ${item.name}`);
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            itemId: item.documentId,
            itemName: item.name,
            error: error.message
          });
          console.log(`   ❌ Error restoring ${item.name}: ${error.message}`);
        }
      }

      result.success = result.failed === 0;

      console.log(`\n📊 Restore Summary:`);
      console.log(`   ✅ Restored: ${result.restored}`);
      console.log(`   ❌ Failed: ${result.failed}`);
      console.log(`   🎯 Success rate: ${Math.round((result.restored / backupData.menuItems.length) * 100)}%`);

      return result;

    } catch (error) {
      console.error('❌ Failed to restore from backup:', error.message);
      return result;
    }
  }

  /**
   * Restore individual menu item
   */
  async restoreMenuItem(backupItem, strapiClient) {
    try {
      const updateData = {};

      // Restore imagePath if it existed
      if (backupItem.imagePath !== null) {
        updateData.imagePath = backupItem.imagePath;
      }

      // Remove image reference if it was null in backup
      if (backupItem.imageId === null) {
        updateData.image = null;
      }

      // Update the menu item via Strapi API
      const response = await fetch(`${this.config.strapiUrl}/api/menu-items/${backupItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.strapiApiToken ? `Bearer ${this.config.strapiApiToken}` : undefined
        }.filter(Boolean),
        body: JSON.stringify({ data: updateData })
      });

      return response.ok;

    } catch (error) {
      console.error(`Error restoring item ${backupItem.name}:`, error);
      return false;
    }
  }

  /**
   * List available backup files
   */
  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      const backups = [];

      for (const filename of backupFiles) {
        const filePath = path.join(this.backupDir, filename);
        const stats = fs.statSync(filePath);
        
        // Try to read backup metadata
        const backupData = this.loadBackupData(filePath);
        
        backups.push({
          filename,
          path: filePath,
          timestamp: backupData?.timestamp || stats.mtime.toISOString(),
          size: stats.size,
          itemCount: backupData?.totalItems || backupData?.menuItems?.length,
          description: backupData?.description || 'No description'
        });
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return backups;

    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Get the latest backup file
   */
  async getLatestBackup() {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Validate backup file integrity
   */
  validateBackup(backupPath) {
    const result = {
      valid: false,
      errors: [],
      itemCount: 0,
      timestamp: undefined
    };

    try {
      // Check file exists
      if (!fs.existsSync(backupPath)) {
        result.errors.push('Backup file does not exist');
        return result;
      }

      // Parse backup data
      const backupData = this.loadBackupData(backupPath);
      if (!backupData) {
        result.errors.push('Failed to parse backup file');
        return result;
      }

      // Validate structure
      if (!backupData.timestamp) {
        result.errors.push('Missing timestamp in backup');
      }

      if (!Array.isArray(backupData.menuItems)) {
        result.errors.push('Invalid menu items array in backup');
        return result;
      }

      result.itemCount = backupData.menuItems.length;
      result.timestamp = backupData.timestamp;

      // Validate each menu item
      for (let i = 0; i < backupData.menuItems.length; i++) {
        const item = backupData.menuItems[i];
        
        if (!item.id || !item.documentId || !item.name) {
          result.errors.push(`Invalid item at index ${i}: missing required fields`);
        }
      }

      result.valid = result.errors.length === 0;

      return result;

    } catch (error) {
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Clean up old backup files
   */
  async cleanupOldBackups(keepCount = 10) {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= keepCount) {
        console.log(`🗂️  No cleanup needed: ${backups.length} backups (keeping ${keepCount})`);
        return 0;
      }

      const toDelete = backups.slice(keepCount);
      let deletedCount = 0;

      for (const backup of toDelete) {
        try {
          fs.unlinkSync(backup.path);
          deletedCount++;
          console.log(`🗑️  Deleted old backup: ${backup.filename}`);
        } catch (error) {
          console.warn(`⚠️  Failed to delete backup: ${backup.filename}`, error.message);
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old backup files`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Failed to cleanup old backups:', error.message);
      return 0;
    }
  }

  /**
   * Create emergency backup with special naming
   */
  async createEmergencyBackup(menuItems, reason = 'Emergency') {
    try {
      console.log('🚨 Creating emergency backup...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `EMERGENCY-backup-${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFilename);

      const backupData = {
        timestamp: new Date().toISOString(),
        description: `Emergency backup - ${reason}`,
        emergencyBackup: true,
        totalItems: menuItems.length,
        menuItems: menuItems.map(item => ({
          id: item.id,
          documentId: item.documentId,
          name: item.name,
          imagePath: item.imagePath || null,
          imageId: item.image?.id || null,
          imageUrl: item.image?.url || null
        }))
      };

      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      console.log(`🚨 Emergency backup created: ${backupFilename}`);
      return backupPath;

    } catch (error) {
      console.error('❌ Failed to create emergency backup:', error.message);
      return null;
    }
  }

  /**
   * Load backup data from file
   */
  loadBackupData(backupPath) {
    try {
      const content = fs.readFileSync(backupPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load backup data:', error);
      return null;
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDirectory() {
    return this.backupDir;
  }

  /**
   * Set custom backup directory
   */
  setBackupDirectory(directory) {
    this.backupDir = directory;
    this.ensureBackupDirectory();
  }

  /**
   * Display backup summary
   */
  async displayBackupSummary() {
    console.log('\n📊 Backup System Status');
    console.log('========================');
    
    const backups = await this.listBackups();
    console.log(`📁 Backup directory: ${this.backupDir}`);
    console.log(`📋 Available backups: ${backups.length}`);
    
    if (backups.length > 0) {
      const latest = backups[0];
      console.log(`🕒 Latest backup: ${latest.filename}`);
      console.log(`   Created: ${new Date(latest.timestamp).toLocaleString()}`);
      console.log(`   Items: ${latest.itemCount}`);
      console.log(`   Description: ${latest.description}`);
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    console.log(`💾 Total backup size: ${this.formatBytes(totalSize)}`);
    
    return backups;
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}