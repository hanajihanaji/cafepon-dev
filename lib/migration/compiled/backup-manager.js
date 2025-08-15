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
exports.BackupManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("./logger");
const utils_1 = require("./utils");
/**
 * Backup and rollback system for migration safety
 */
class BackupManager {
    constructor(config, strapiClient) {
        this.config = config;
        this.logger = logger_1.Logger.getInstance();
        this.strapiClient = strapiClient;
        this.backupDir = path.join(process.cwd(), 'migration-backups');
    }
    /**
     * Create comprehensive backup of current state
     */
    async createBackup(menuItems) {
        try {
            if (!this.config.backupEnabled) {
                this.logger.info('Backup disabled, skipping backup creation');
                return null;
            }
            this.logger.info('Creating migration backup...');
            // Ensure backup directory exists
            await utils_1.MigrationUtils.ensureDirectory(this.backupDir);
            // Prepare backup data
            const backupData = {
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
            const backupFilename = utils_1.MigrationUtils.createBackupFilename('menu-items-backup');
            const backupPath = path.join(this.backupDir, backupFilename);
            // Write backup file
            await utils_1.MigrationUtils.writeJsonFile(backupPath, backupData);
            this.logger.success(`Backup created: ${backupFilename}`, {
                items: backupData.menuItems.length,
                path: backupPath
            });
            return backupPath;
        }
        catch (error) {
            this.logger.error('Failed to create backup', {
                error: error.message
            });
            return null;
        }
    }
    /**
     * Create backup of specific menu items
     */
    async createSelectiveBackup(itemIds, description) {
        try {
            this.logger.info(`Creating selective backup for ${itemIds.length} items...`);
            // Fetch current state of specified items
            const allItems = await this.strapiClient.getMenuItems();
            const selectedItems = allItems.filter(item => itemIds.includes(item.id.toString()) || itemIds.includes(item.documentId));
            if (selectedItems.length === 0) {
                this.logger.warn('No items found for selective backup');
                return null;
            }
            // Create backup with description
            const backupData = {
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
            const backupFilename = utils_1.MigrationUtils.createBackupFilename('selective-backup');
            const backupPath = path.join(this.backupDir, backupFilename);
            await utils_1.MigrationUtils.writeJsonFile(backupPath, backupData);
            this.logger.success(`Selective backup created: ${backupFilename}`, {
                items: selectedItems.length
            });
            return backupPath;
        }
        catch (error) {
            this.logger.error('Failed to create selective backup', {
                error: error.message
            });
            return null;
        }
    }
    /**
     * Restore from backup file
     */
    async restoreFromBackup(backupPath) {
        const result = {
            success: false,
            restored: 0,
            failed: 0,
            errors: []
        };
        try {
            this.logger.info(`Restoring from backup: ${path.basename(backupPath)}`);
            // Load backup data
            const backupData = await utils_1.MigrationUtils.parseJsonFile(backupPath);
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
                    }
                    else {
                        result.failed++;
                        result.errors.push({
                            itemId: item.documentId,
                            error: 'Failed to restore item'
                        });
                    }
                }
                catch (error) {
                    result.failed++;
                    result.errors.push({
                        itemId: item.documentId,
                        error: error.message
                    });
                }
            }
            result.success = result.failed === 0;
            this.logger.info(`Restore complete: ${result.restored} restored, ${result.failed} failed`);
            if (result.errors.length > 0) {
                this.logger.warn('Restore errors occurred:', { errors: result.errors });
            }
            return result;
        }
        catch (error) {
            this.logger.error('Failed to restore from backup', {
                error: error.message
            });
            return result;
        }
    }
    /**
     * Restore individual menu item
     */
    async restoreMenuItem(backupItem) {
        try {
            // Prepare update data
            const updateData = {};
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
            }
            else {
                this.logger.warn(`Failed to restore item: ${backupItem.name}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error(`Error restoring item: ${backupItem.name}`, {
                error: error.message
            });
            return false;
        }
    }
    /**
     * Update menu item fields via Strapi API
     */
    async updateMenuItemFields(documentId, updateData) {
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
        }
        catch (error) {
            this.logger.error(`Failed to update menu item ${documentId}`, {
                error: error.message
            });
            return false;
        }
    }
    /**
     * List available backup files
     */
    async listBackups() {
        try {
            if (!(await utils_1.MigrationUtils.fileExists(this.backupDir))) {
                return [];
            }
            const files = await fs.promises.readdir(this.backupDir);
            const backupFiles = files.filter(file => file.endsWith('.json'));
            const backups = [];
            for (const filename of backupFiles) {
                const filePath = path.join(this.backupDir, filename);
                const stats = await fs.promises.stat(filePath);
                // Try to read backup metadata
                const backupData = await utils_1.MigrationUtils.parseJsonFile(filePath);
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
        }
        catch (error) {
            this.logger.error('Failed to list backups', {
                error: error.message
            });
            return [];
        }
    }
    /**
     * Validate backup file integrity
     */
    async validateBackup(backupPath) {
        const result = {
            valid: false,
            errors: [],
            itemCount: 0,
            timestamp: undefined
        };
        try {
            // Check file exists
            if (!(await utils_1.MigrationUtils.fileExists(backupPath))) {
                result.errors.push('Backup file does not exist');
                return result;
            }
            // Parse backup data
            const backupData = await utils_1.MigrationUtils.parseJsonFile(backupPath);
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
        }
        catch (error) {
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
                }
                catch (error) {
                    this.logger.warn(`Failed to delete backup: ${backup.filename}`, {
                        error: error.message
                    });
                }
            }
            this.logger.info(`Cleaned up ${deletedCount} old backup files`);
            return deletedCount;
        }
        catch (error) {
            this.logger.error('Failed to cleanup old backups', {
                error: error.message
            });
            return 0;
        }
    }
    /**
     * Create emergency rollback point
     */
    async createEmergencyBackup() {
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
        }
        catch (error) {
            this.logger.error('Failed to create emergency backup', {
                error: error.message
            });
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
    }
}
exports.BackupManager = BackupManager;
