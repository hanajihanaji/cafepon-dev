const fs = require('fs');
const path = require('path');
const { Logger } = require('./logger');
const { MigrationUtils } = require('./utils');
const { StrapiMediaClient } = require('./strapi-client');

/**
 * Backup and rollback system for migration safety
 */
class BackupManager {
  private config: MigrationConfig;
  private logger: Logger;
  private strapiClient: StrapiMediaClient;
  private backupDir: string;

  constructor(config: MigrationConfig, strapiClient: StrapiMediaClient) {
    this.config = config;
    this.logger = Logger.getInstance();
    this.strapiClient = strapiClient;
    this.backupDir = path.join(process.cwd(), 'migration-backups');
  }

  /**
   * Create comprehensive backup of current state
   */
  async createBackup(menuItems: any[]): Promise<string | null> {
    try {
      if (!this.config.backupEnabled) {
        this.logger.info('Backup disabled, skipping backup creation');
        return null;
      }

      this.logger.info('Creating migration backup...');
      
      // Ensure backup directory exists
      await MigrationUtils.ensureDirectory(this.backupDir);

      // Prepare backup data
      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        menuItems: menuItems.map(item => ({
          id: item.id,
          documentId: item.documentId,
          name: item.name,
          imagePath: item.imagePath || null,
          imageId: item.image?.id || null,
          imageUrl: item.image?.url || null
        }))
      };

      // Generate backup filename
      const backupFilename = MigrationUtils.createBackupFilename('menu-items-backup');
      const backupPath = path.join(this.backupDir, backupFilename);

      // Write backup file
      await MigrationUtils.writeJsonFile(backupPath, backupData);

      this.logger.success(`Backup created: ${backupFilename}`, {
        items: backupData.menuItems.length,
        path: backupPath
      });

      return backupPath;

    } catch (error) {
      this.logger.error('Failed to create backup', {
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Create backup of specific menu items
   */
  async createSelectiveBackup(itemIds: string[], description?: string): Promise<string | null> {
    try {
      this.logger.info(`Creating selective backup for ${itemIds.length} items...`);

      // Fetch current state of specified items
      const allItems = await this.strapiClient.getMenuItems();
      const selectedItems = allItems.filter(item => 
        itemIds.includes(item.id.toString()) || itemIds.includes(item.documentId)
      );

      if (selectedItems.length === 0) {
        this.logger.warn('No items found for selective backup');
        return null;
      }

      // Create backup with description
      const backupData: BackupData & { description?: string } = {
        timestamp: new Date().toISOString(),
        description: description || `Selective backup of ${selectedItems.length} items`,
        menuItems: selectedItems.map(item => ({
          id: item.id,
          documentId: item.documentId,
          name: item.name,
          imagePath: item.imagePath || null,
          imageId: item.image?.id || null,
          imageUrl: item.image?.url || null
        }))
      };

      const backupFilename = MigrationUtils.createBackupFilename('selective-backup');
      const backupPath = path.join(this.backupDir, backupFilename);

      await MigrationUtils.writeJsonFile(backupPath, backupData);

      this.logger.success(`Selective backup created: ${backupFilename}`, {
        items: selectedItems.length
      });

      return backupPath;

    } catch (error) {
      this.logger.error('Failed to create selective backup', {
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Restore from backup file
   */
  async restoreFromBackup(backupPath: string): Promise<{
    success: boolean;
    restored: number;
    failed: number;
    errors: Array<{ itemId: string; error: string }>;
  }> {
    const result = {
      success: false,
      restored: 0,
      failed: 0,
      errors: [] as Array<{ itemId: string; error: string }>
    };

    try {
      this.logger.info(`Restoring from backup: ${path.basename(backupPath)}`);

      // Load backup data
      const backupData = await MigrationUtils.parseJsonFile<BackupData>(backupPath);
      if (!backupData) {
        throw new Error('Failed to parse backup file');
      }

      this.logger.info(`Backup contains ${backupData.menuItems.length} items from ${backupData.timestamp}`);

      // Restore each item
      for (let i = 0; i < backupData.menuItems.length; i++) {
        const item = backupData.menuItems[i];
        this.logger.progress(i + 1, backupData.menuItems.length, `Restoring: ${item.name}`);

        try {
          const restored = await this.restoreMenuItem(item);
          if (restored) {
            result.restored++;
          } else {
            result.failed++;
            result.errors.push({
              itemId: item.documentId,
              error: 'Failed to restore item'
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            itemId: item.documentId,
            error: (error as Error).message
          });
        }
      }

      result.success = result.failed === 0;

      this.logger.info(`Restore complete: ${result.restored} restored, ${result.failed} failed`);

      if (result.errors.length > 0) {
        this.logger.warn('Restore errors occurred:', { errors: result.errors });
      }

      return result;

    } catch (error) {
      this.logger.error('Failed to restore from backup', {
        error: (error as Error).message
      });
      return result;
    }
  }

  /**
   * Restore individual menu item
   */
  private async restoreMenuItem(backupItem: BackupMenuItem): Promise<boolean> {
    try {
      // Prepare update data
      const updateData: any = {};

      // Restore imagePath if it was set
      if (backupItem.imagePath !== null) {
        updateData.imagePath = backupItem.imagePath;
      }

      // Remove image reference if it was null in backup
      if (backupItem.imageId === null) {
        updateData.image = null;
      }

      // Update the menu item
      const success = await this.updateMenuItemFields(backupItem.documentId, updateData);
      
      if (success) {
        this.logger.debug(`Restored item: ${backupItem.name}`);
      } else {
        this.logger.warn(`Failed to restore item: ${backupItem.name}`);
      }

      return success;

    } catch (error) {
      this.logger.error(`Error restoring item: ${backupItem.name}`, {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Update menu item fields via Strapi API
   */
  private async updateMenuItemFields(documentId: string, updateData: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.strapiUrl}/api/menu-items/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.strapiApiToken}`
        },
        body: JSON.stringify({ data: updateData })
      });

      return response.ok;

    } catch (error) {
      this.logger.error(`Failed to update menu item ${documentId}`, {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * List available backup files
   */
  async listBackups(): Promise<Array<{
    filename: string;
    path: string;
    timestamp: string;
    size: number;
    itemCount?: number;
  }>> {
    try {
      if (!(await MigrationUtils.fileExists(this.backupDir))) {
        return [];
      }

      const files = await fs.promises.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      const backups = [];

      for (const filename of backupFiles) {
        const filePath = path.join(this.backupDir, filename);
        const stats = await fs.promises.stat(filePath);
        
        // Try to read backup metadata
        const backupData = await MigrationUtils.parseJsonFile<BackupData>(filePath);
        
        backups.push({
          filename,
          path: filePath,
          timestamp: backupData?.timestamp || stats.mtime.toISOString(),
          size: stats.size,
          itemCount: backupData?.menuItems?.length
        });
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return backups;

    } catch (error) {
      this.logger.error('Failed to list backups', {
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Validate backup file integrity
   */
  async validateBackup(backupPath: string): Promise<{
    valid: boolean;
    errors: string[];
    itemCount: number;
    timestamp?: string;
  }> {
    const result = {
      valid: false,
      errors: [] as string[],
      itemCount: 0,
      timestamp: undefined as string | undefined
    };

    try {
      // Check file exists
      if (!(await MigrationUtils.fileExists(backupPath))) {
        result.errors.push('Backup file does not exist');
        return result;
      }

      // Parse backup data
      const backupData = await MigrationUtils.parseJsonFile<BackupData>(backupPath);
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
      result.errors.push((error as Error).message);
      return result;
    }
  }

  /**
   * Clean up old backup files
   */
  async cleanupOldBackups(keepCount: number = 10): Promise<number> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= keepCount) {
        this.logger.info(`No cleanup needed: ${backups.length} backups (keeping ${keepCount})`);
        return 0;
      }

      const toDelete = backups.slice(keepCount);
      let deletedCount = 0;

      for (const backup of toDelete) {
        try {
          await fs.promises.unlink(backup.path);
          deletedCount++;
          this.logger.debug(`Deleted old backup: ${backup.filename}`);
        } catch (error) {
          this.logger.warn(`Failed to delete backup: ${backup.filename}`, {
            error: (error as Error).message
          });
        }
      }

      this.logger.info(`Cleaned up ${deletedCount} old backup files`);
      return deletedCount;

    } catch (error) {
      this.logger.error('Failed to cleanup old backups', {
        error: (error as Error).message
      });
      return 0;
    }
  }

  /**
   * Create emergency rollback point
   */
  async createEmergencyBackup(): Promise<string | null> {
    try {
      this.logger.warn('Creating emergency backup...');
      
      const menuItems = await this.strapiClient.getMenuItems();
      const backupPath = await this.createBackup(menuItems);
      
      if (backupPath) {
        // Also create a copy with emergency prefix
        const emergencyPath = backupPath.replace('menu-items-backup', 'EMERGENCY-backup');
        await fs.promises.copyFile(backupPath, emergencyPath);
        
        this.logger.warn(`Emergency backup created: ${path.basename(emergencyPath)}`);
        return emergencyPath;
      }

      return null;

    } catch (error) {
      this.logger.error('Failed to create emergency backup', {
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDirectory(): string {
    return this.backupDir;
  }

  /**
   * Set custom backup directory
   */
  setBackupDirectory(directory: string): void {
    this.backupDir = directory;
  }
}

module.exports = { BackupManager };