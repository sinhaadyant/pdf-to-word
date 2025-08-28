/**
 * Centralized error handler middleware
 * Handles all application errors in a consistent way
 */

const multer = require('multer');
const { STATUS_CODES, ERROR_MESSAGES } = require('../constants');

/**
 * Global error handler middleware
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(error, req, res, next) {
    console.error('🚨 Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle Multer errors
    if (error instanceof multer.MulterError) {
        return handleMulterError(error, res);
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            error: 'Validation Error',
            message: error.message,
            details: error.details || [],
            timestamp: new Date().toISOString()
        });
    }

    // Handle file system errors
    if (error.code === 'ENOENT') {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            error: 'File Not Found',
            message: 'The requested file or directory does not exist',
            timestamp: new Date().toISOString()
        });
    }

    // Handle permission errors
    if (error.code === 'EACCES' || error.code === 'EPERM') {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            error: 'Permission Denied',
            message: 'Access to the requested resource is denied',
            timestamp: new Date().toISOString()
        });
    }

    // Handle timeout errors
    if (error.message && error.message.includes('timeout')) {
        return res.status(STATUS_CODES.REQUEST_TOO_LARGE).json({
            success: false,
            error: 'Request Timeout',
            message: 'The request took too long to process',
            timestamp: new Date().toISOString()
        });
    }

    // Handle Python process errors
    if (error.message && error.message.includes('Python')) {
        return res.status(STATUS_CODES.SERVICE_UNAVAILABLE).json({
            success: false,
            error: 'Conversion Service Unavailable',
            message: 'The PDF conversion service is currently unavailable',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Default error response
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'An unexpected error occurred';

    res.status(statusCode).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
        timestamp: new Date().toISOString()
    });
}

/**
 * Handle Multer-specific errors
 * @param {multer.MulterError} error - Multer error object
 * @param {Object} res - Express response object
 */
function handleMulterError(error, res) {
    switch (error.code) {
        case 'LIMIT_FILE_SIZE':
            return res.status(STATUS_CODES.REQUEST_TOO_LARGE).json({
                success: false,
                error: 'File Too Large',
                message: ERROR_MESSAGES.FILE_TOO_LARGE(
                    (error.limit / (1024 * 1024)).toFixed(2),
                    (error.limit / (1024 * 1024)).toFixed(0)
                ),
                timestamp: new Date().toISOString()
            });

        case 'LIMIT_FILE_COUNT':
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'Too Many Files',
                message: ERROR_MESSAGES.TOO_MANY_FILES(error.limit),
                timestamp: new Date().toISOString()
            });

        case 'LIMIT_FIELD_COUNT':
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'Too Many Fields',
                message: 'Too many form fields submitted',
                timestamp: new Date().toISOString()
            });

        case 'LIMIT_FIELD_SIZE':
            return res.status(STATUS_CODES.REQUEST_TOO_LARGE).json({
                success: false,
                error: 'Field Too Large',
                message: 'A form field is too large',
                timestamp: new Date().toISOString()
            });

        case 'LIMIT_UNEXPECTED_FILE':
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'Unexpected File',
                message: 'An unexpected file was uploaded',
                timestamp: new Date().toISOString()
            });

        default:
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'File Upload Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
    }
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches async errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    errorHandler,
    asyncHandler
};
