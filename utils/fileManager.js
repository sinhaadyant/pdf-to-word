/**
 * File Manager utilities for PDF to DOCX Converter API
 * Handles file operations, cleanup, and storage management
 */

const fs = require('fs');
const path = require('path');
const { 
    PATHS, 
    TIMING, 
    ERROR_MESSAGES 
} = require('../constants');

/**
 * Cleanup function for temporary files
 * @param {string} filePath - Path to the file to cleanup
 */
function cleanupTempFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up temporary file: ${filePath}`);
        }
    } catch (error) {
        console.error('Error cleaning up temporary file:', error);
    }
}

/**
 * Batch cleanup function for multiple files
 * @param {Array<string>} filePaths - Array of file paths to cleanup
 */
function cleanupBatchFiles(filePaths) {
    filePaths.forEach(filePath => {
        cleanupTempFile(filePath);
    });
}

/**
 * Auto-cleanup old files based on age
 * @param {string} directory - Directory to cleanup
 * @param {number} maxAge - Maximum age in milliseconds
 */
function cleanupOldFiles(directory, maxAge = TIMING.CLEANUP_INTERVAL) {
    const now = Date.now();
    
    try {
        if (!fs.existsSync(directory)) {
            return;
        }
        
        const files = fs.readdirSync(directory);
        let cleanedCount = 0;
        
        files.forEach(file => {
            const filePath = path.join(directory, file);
            
            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    console.log(`Cleaned up old file: ${filePath}`);
                    cleanedCount++;
                }
            } catch (error) {
                console.error(`Error processing file ${filePath}:`, error);
            }
        });
        
        if (cleanedCount > 0) {
            console.log(`Cleaned up ${cleanedCount} old files from ${directory}`);
        }
    } catch (error) {
        console.error(`Error cleaning up directory ${directory}:`, error);
    }
}

/**
 * Gets directory size in bytes
 * @param {string} directory - Directory path
 * @returns {number} Total size in bytes
 */
function getDirectorySize(directory) {
    let totalSize = 0;
    
    try {
        if (!fs.existsSync(directory)) {
            return 0;
        }
        
        const files = fs.readdirSync(directory);
        
        files.forEach(file => {
            const filePath = path.join(directory, file);
            
            try {
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                }
            } catch (error) {
                console.error(`Error getting size for ${filePath}:`, error);
            }
        });
    } catch (error) {
        console.error(`Error calculating directory size for ${directory}:`, error);
    }
    
    return totalSize;
}

/**
 * Gets directory statistics
 * @param {string} directory - Directory path
 * @returns {Object} Directory statistics
 */
function getDirectoryStats(directory) {
    try {
        if (!fs.existsSync(directory)) {
            return {
                exists: false,
                fileCount: 0,
                totalSize: 0,
                totalSizeMB: 0
            };
        }
        
        const files = fs.readdirSync(directory);
        let totalSize = 0;
        let fileCount = 0;
        
        files.forEach(file => {
            const filePath = path.join(directory, file);
            
            try {
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                    fileCount++;
                }
            } catch (error) {
                console.error(`Error getting stats for ${filePath}:`, error);
            }
        });
        
        return {
            exists: true,
            fileCount,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    } catch (error) {
        console.error(`Error getting directory stats for ${directory}:`, error);
        return {
            exists: false,
            fileCount: 0,
            totalSize: 0,
            totalSizeMB: 0,
            error: error.message
        };
    }
}

/**
 * Ensures required directories exist
 * @param {Array<string>} directories - Array of directory paths
 */
function ensureDirectoriesExist(directories) {
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
}

/**
 * Lists files in a directory with optional filtering
 * @param {string} directory - Directory path
 * @param {Object} options - Options for filtering
 * @returns {Array} Array of file objects
 */
function listFiles(directory, options = {}) {
    const {
        extension = null,
        maxAge = null,
        limit = null
    } = options;
    
    try {
        if (!fs.existsSync(directory)) {
            return [];
        }
        
        const files = fs.readdirSync(directory);
        const now = Date.now();
        let fileList = [];
        
        files.forEach(file => {
            const filePath = path.join(directory, file);
            
            try {
                const stats = fs.statSync(filePath);
                
                if (!stats.isFile()) {
                    return;
                }
                
                // Filter by extension
                if (extension && !file.toLowerCase().endsWith(extension.toLowerCase())) {
                    return;
                }
                
                // Filter by age
                if (maxAge && (now - stats.mtime.getTime()) > maxAge) {
                    return;
                }
                
                fileList.push({
                    name: file,
                    path: filePath,
                    size: stats.size,
                    sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
                    created: stats.birthtime,
                    modified: stats.mtime
                });
            } catch (error) {
                console.error(`Error processing file ${filePath}:`, error);
            }
        });
        
        // Sort by modification time (newest first)
        fileList.sort((a, b) => b.modified - a.modified);
        
        // Apply limit
        if (limit && fileList.length > limit) {
            fileList = fileList.slice(0, limit);
        }
        
        return fileList;
    } catch (error) {
        console.error(`Error listing files in ${directory}:`, error);
        return [];
    }
}

/**
 * Validates file path for security
 * @param {string} filePath - File path to validate
 * @param {string} baseDirectory - Base directory to restrict to
 * @returns {boolean} True if path is valid and within base directory
 */
function validateFilePath(filePath, baseDirectory) {
    try {
        const resolvedPath = path.resolve(filePath);
        const resolvedBase = path.resolve(baseDirectory);
        
        // Check if path is within base directory
        return resolvedPath.startsWith(resolvedBase);
    } catch (error) {
        return false;
    }
}

module.exports = {
    cleanupTempFile,
    cleanupBatchFiles,
    cleanupOldFiles,
    getDirectorySize,
    getDirectoryStats,
    ensureDirectoriesExist,
    listFiles,
    validateFilePath
};
