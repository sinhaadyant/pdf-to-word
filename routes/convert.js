/**
 * Conversion routes for PDF to DOCX Converter API
 * Handles single and batch file conversion endpoints
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import utilities and constants
const { 
    UPLOAD_LIMITS, 
    PATHS, 
    STATUS_CODES, 
    ERROR_MESSAGES, 
    SUCCESS_MESSAGES,
    APP_METADATA 
} = require('../constants');
const { validatePdfFile, validateBatch, generateUniqueFilename } = require('../utils/validation');
const { convertPdfToDocx, getFileInfo } = require('../utils/converter');
const { cleanupTempFile, cleanupBatchFiles } = require('../utils/fileManager');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', PATHS.UPLOADS_DIR));
    },
    filename: function (req, file, cb) {
        const uniqueFilename = generateUniqueFilename(file.originalname);
        cb(null, uniqueFilename);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const errors = validatePdfFile(file);
        if (errors.length > 0) {
            return cb(new Error(errors.join('; ')), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE,
        files: UPLOAD_LIMITS.MAX_FILES_PER_REQUEST,
        fieldSize: UPLOAD_LIMITS.FIELD_SIZE_LIMIT
    }
});

/**
 * Single file conversion endpoint
 * POST /convert
 */
router.post('/convert', upload.single('pdf'), async (req, res) => {
    let uploadedFilePath = null;
    
    try {
        if (!req.file) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({ 
                success: false,
                error: ERROR_MESSAGES.NO_FILE_UPLOADED,
                message: 'Please upload a PDF file using the "pdf" field'
            });
        }

        uploadedFilePath = req.file.path;
        const originalName = req.file.originalname;
        const baseName = path.basename(originalName, '.pdf');
        
        // Additional validation
        const validationErrors = validatePdfFile(req.file);
        if (validationErrors.length > 0) {
            cleanupTempFile(uploadedFilePath);
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'File validation failed',
                details: validationErrors
            });
        }
        
        // Generate output filename with timestamp
        const timestamp = Date.now();
        const docxFilename = `${baseName}-${timestamp}.docx`;
        const docxPath = path.join(__dirname, '..', PATHS.OUTPUTS_DIR, docxFilename);

        console.log(`Converting ${uploadedFilePath} to ${docxPath}`);

        // Convert PDF to DOCX
        await convertPdfToDocx(uploadedFilePath, docxPath);

        // Get file stats
        const fileInfo = getFileInfo(docxPath);

        // Clean up uploaded PDF file
        cleanupTempFile(uploadedFilePath);

        res.status(STATUS_CODES.SUCCESS).json({
            success: true,
            message: SUCCESS_MESSAGES.SINGLE_CONVERSION,
            data: {
                originalFile: originalName,
                convertedFile: docxFilename,
                outputPath: docxPath,
                fileSize: `${fileInfo.sizeInMB} MB`,
                downloadUrl: `/download/${docxFilename}`,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Conversion error:', error);
        
        // Clean up uploaded file if it exists
        if (uploadedFilePath) {
            cleanupTempFile(uploadedFilePath);
        }

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Conversion failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Batch file conversion endpoint
 * POST /convert-batch
 */
router.post('/convert-batch', upload.array('pdfs', UPLOAD_LIMITS.MAX_FILES_PER_REQUEST), async (req, res) => {
    const uploadedFilePaths = [];
    const results = [];
    const errors = [];
    
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({ 
                success: false,
                error: ERROR_MESSAGES.NO_FILES_UPLOADED,
                message: 'Please upload PDF files using the "pdfs" field'
            });
        }

        // Batch validation
        const validation = validateBatch(req.files);
        if (validation.errors.length > 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: ERROR_MESSAGES.BATCH_VALIDATION_FAILED,
                details: validation.errors,
                warnings: validation.warnings
            });
        }

        // Process each file
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const uploadedFilePath = file.path;
            uploadedFilePaths.push(uploadedFilePath);
            
            try {
                const originalName = file.originalname;
                const baseName = path.basename(originalName, '.pdf');
                
                // Generate output filename with timestamp
                const timestamp = Date.now() + i; // Ensure unique timestamps
                const docxFilename = `${baseName}-${timestamp}.docx`;
                const docxPath = path.join(__dirname, '..', PATHS.OUTPUTS_DIR, docxFilename);

                console.log(`Converting ${uploadedFilePath} to ${docxPath}`);

                // Convert PDF to DOCX
                await convertPdfToDocx(uploadedFilePath, docxPath);

                // Get file stats
                const fileInfo = getFileInfo(docxPath);

                results.push({
                    originalFile: originalName,
                    convertedFile: docxFilename,
                    outputPath: docxPath,
                    fileSize: `${fileInfo.sizeInMB} MB`,
                    downloadUrl: `/download/${docxFilename}`,
                    status: 'success',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error(`Error converting file ${file.originalname}:`, error);
                errors.push({
                    originalFile: file.originalname,
                    error: error.message,
                    status: 'failed'
                });
            }
        }

        // Clean up uploaded PDF files
        cleanupBatchFiles(uploadedFilePaths);

        // Prepare response
        const response = {
            success: errors.length === 0,
            message: errors.length === 0 ? 
                SUCCESS_MESSAGES.BATCH_CONVERSION_ALL(req.files.length) : 
                SUCCESS_MESSAGES.BATCH_CONVERSION_PARTIAL(results.length, errors.length),
            summary: {
                totalFiles: req.files.length,
                successful: results.length,
                failed: errors.length
            },
            results: results,
            errors: errors,
            timestamp: new Date().toISOString()
        };

        // Return appropriate status code
        const statusCode = errors.length === 0 ? 
            STATUS_CODES.SUCCESS : 
            (results.length === 0 ? STATUS_CODES.INTERNAL_SERVER_ERROR : STATUS_CODES.MULTI_STATUS);
        
        res.status(statusCode).json(response);

    } catch (error) {
        console.error('Batch conversion error:', error);
        
        // Clean up uploaded files if they exist
        cleanupBatchFiles(uploadedFilePaths);

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.BATCH_CONVERSION_FAILED,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
