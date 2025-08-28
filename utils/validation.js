/**
 * Validation utilities for PDF to DOCX Converter API
 * Handles file validation, batch validation, and security checks
 */

const path = require('path');
const { 
    UPLOAD_LIMITS, 
    FILE_VALIDATION, 
    ERROR_MESSAGES 
} = require('../constants');

/**
 * Validates a single PDF file
 * @param {Object} file - Multer file object
 * @returns {Array} Array of validation errors
 */
function validatePdfFile(file) {
    const errors = [];
    
    // Check if file exists
    if (!file) {
        errors.push(ERROR_MESSAGES.NO_FILE_UPLOADED);
        return errors;
    }
    
    // Check file size
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        const limitInMB = UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
        errors.push(ERROR_MESSAGES.FILE_TOO_LARGE(sizeInMB, limitInMB));
    }
    
    // Check file type
    if (!FILE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE(file.mimetype));
    }
    
    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(fileExtension)) {
        errors.push(ERROR_MESSAGES.INVALID_EXTENSION(fileExtension));
    }
    
    // Check if file is corrupted (basic check)
    if (file.size === 0) {
        errors.push(ERROR_MESSAGES.FILE_CORRUPTED);
    }
    
    // Check filename length
    if (file.originalname.length > UPLOAD_LIMITS.MAX_FILENAME_LENGTH) {
        errors.push(ERROR_MESSAGES.FILENAME_TOO_LONG);
    }
    
    // Check for potentially malicious filenames
    if (FILE_VALIDATION.DANGEROUS_PATTERNS.test(file.originalname)) {
        errors.push(ERROR_MESSAGES.INVALID_FILENAME);
    }
    
    return errors;
}

/**
 * Validates a batch of files
 * @param {Array} files - Array of Multer file objects
 * @returns {Object} Object containing errors and warnings
 */
function validateBatch(files) {
    const errors = [];
    const warnings = [];
    
    if (!files || files.length === 0) {
        errors.push(ERROR_MESSAGES.NO_FILES_UPLOADED);
        return { errors, warnings };
    }
    
    if (files.length > UPLOAD_LIMITS.MAX_FILES_PER_REQUEST) {
        errors.push(ERROR_MESSAGES.TOO_MANY_FILES(UPLOAD_LIMITS.MAX_FILES_PER_REQUEST));
        return { errors, warnings };
    }
    
    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > UPLOAD_LIMITS.MAX_TOTAL_SIZE) {
        const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        const limitInMB = UPLOAD_LIMITS.MAX_TOTAL_SIZE / (1024 * 1024);
        errors.push(ERROR_MESSAGES.TOTAL_SIZE_EXCEEDED(totalSizeInMB, limitInMB));
    }
    
    // Check for duplicate filenames
    const filenames = files.map(file => file.originalname);
    const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index);
    if (duplicates.length > 0) {
        warnings.push(ERROR_MESSAGES.DUPLICATE_FILENAMES(duplicates));
    }
    
    // Validate each file
    files.forEach((file, index) => {
        const fileErrors = validatePdfFile(file);
        if (fileErrors.length > 0) {
            errors.push(`File ${index + 1} (${file.originalname}): ${fileErrors.join(', ')}`);
        }
    });
    
    return { errors, warnings };
}

/**
 * Validates filename for security (prevents directory traversal)
 * @param {string} filename - Filename to validate
 * @returns {boolean} True if filename is safe
 */
function validateFilename(filename) {
    if (!filename) return false;
    
    // Check for directory traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return false;
    }
    
    // Check for dangerous characters
    if (FILE_VALIDATION.DANGEROUS_PATTERNS.test(filename)) {
        return false;
    }
    
    // Check length
    if (filename.length > UPLOAD_LIMITS.MAX_FILENAME_LENGTH) {
        return false;
    }
    
    return true;
}

/**
 * Sanitizes a filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Generates a unique filename with timestamp
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for the filename
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, prefix = 'pdf') {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = sanitizeFilename(originalName);
    const extension = path.extname(sanitizedName);
    return `${prefix}-${uniqueSuffix}${extension}`;
}

module.exports = {
    validatePdfFile,
    validateBatch,
    validateFilename,
    sanitizeFilename,
    generateUniqueFilename
};
