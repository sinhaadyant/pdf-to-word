/**
 * Download and file management routes for PDF to DOCX Converter API
 * Handles file downloads and file management operations
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Import utilities and constants
const { 
    PATHS, 
    STATUS_CODES, 
    ERROR_MESSAGES,
    CONTENT_TYPES 
} = require('../constants');
const { validateFilename, validateFilePath } = require('../utils/validation');
const { getFileInfo } = require('../utils/converter');
const { listFiles, getDirectoryStats } = require('../utils/fileManager');

const router = express.Router();

/**
 * Download converted file endpoint
 * GET /download/:filename
 */
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Security: Validate filename
    if (!validateFilename(filename)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            error: 'Invalid filename',
            message: ERROR_MESSAGES.DIRECTORY_TRAVERSAL
        });
    }
    
    const filePath = path.join(__dirname, '..', PATHS.OUTPUTS_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            error: 'File not found',
            message: ERROR_MESSAGES.FILE_NOT_FOUND
        });
    }

    // Check if file is a DOCX file
    if (!filename.toLowerCase().endsWith('.docx')) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            error: 'Invalid file type',
            message: ERROR_MESSAGES.INVALID_DOWNLOAD_TYPE
        });
    }

    // Validate file path for security
    const outputsDir = path.join(__dirname, '..', PATHS.OUTPUTS_DIR);
    if (!validateFilePath(filePath, outputsDir)) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            error: 'Access denied',
            message: 'Invalid file path'
        });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', CONTENT_TYPES.DOCX);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file for download
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
        console.error('Download error:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DOWNLOAD_FAILED,
            message: error.message
        });
    });

    fileStream.pipe(res);
});

/**
 * List converted files endpoint
 * GET /files
 */
router.get('/files', (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'modified' } = req.query;
        const outputsDir = path.join(__dirname, '..', PATHS.OUTPUTS_DIR);
        
        // Get directory stats
        const stats = getDirectoryStats(outputsDir);
        
        // List files with filtering
        const files = listFiles(outputsDir, {
            extension: '.docx',
            limit: parseInt(limit) * 2 // Get more files for pagination
        });
        
        // Apply pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedFiles = files.slice(startIndex, endIndex);
        
        // Calculate pagination info
        const totalPages = Math.ceil(files.length / limitNum);
        
        res.status(STATUS_CODES.SUCCESS).json({
            success: true,
            data: {
                files: paginatedFiles.map(file => ({
                    filename: file.name,
                    size: file.sizeMB + ' MB',
                    created: file.created,
                    modified: file.modified,
                    downloadUrl: `/download/${file.name}`
                })),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: files.length,
                    pages: totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                },
                stats: {
                    totalFiles: stats.fileCount,
                    totalSize: stats.totalSizeMB + ' MB'
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to list files',
            message: error.message
        });
    }
});

/**
 * Get file info endpoint
 * GET /files/:filename/info
 */
router.get('/files/:filename/info', (req, res) => {
    const filename = req.params.filename;
    
    // Security: Validate filename
    if (!validateFilename(filename)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            error: 'Invalid filename',
            message: ERROR_MESSAGES.DIRECTORY_TRAVERSAL
        });
    }
    
    const filePath = path.join(__dirname, '..', PATHS.OUTPUTS_DIR, filename);
    
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                error: 'File not found',
                message: ERROR_MESSAGES.FILE_NOT_FOUND
            });
        }
        
        // Get file information
        const fileInfo = getFileInfo(filePath);
        
        res.status(STATUS_CODES.SUCCESS).json({
            success: true,
            data: {
                filename: filename,
                size: fileInfo.sizeInMB + ' MB',
                created: fileInfo.created,
                modified: fileInfo.modified,
                downloadUrl: `/download/${filename}`
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting file info:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to get file info',
            message: error.message
        });
    }
});

/**
 * Delete file endpoint
 * DELETE /files/:filename
 */
router.delete('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Security: Validate filename
    if (!validateFilename(filename)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            error: 'Invalid filename',
            message: ERROR_MESSAGES.DIRECTORY_TRAVERSAL
        });
    }
    
    const filePath = path.join(__dirname, '..', PATHS.OUTPUTS_DIR, filename);
    
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                error: 'File not found',
                message: ERROR_MESSAGES.FILE_NOT_FOUND
            });
        }
        
        // Validate file path for security
        const outputsDir = path.join(__dirname, '..', PATHS.OUTPUTS_DIR);
        if (!validateFilePath(filePath, outputsDir)) {
            return res.status(STATUS_CODES.FORBIDDEN).json({
                success: false,
                error: 'Access denied',
                message: 'Invalid file path'
            });
        }
        
        // Delete the file
        fs.unlinkSync(filePath);
        
        res.status(STATUS_CODES.SUCCESS).json({
            success: true,
            message: 'File deleted successfully',
            data: {
                filename: filename
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to delete file',
            message: error.message
        });
    }
});

module.exports = router;
