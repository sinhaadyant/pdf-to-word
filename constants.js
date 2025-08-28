/**
 * Application Constants and Configuration
 * Centralized configuration for the PDF to DOCX Converter API
 */

// File upload and processing limits
const UPLOAD_LIMITS = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB per file
    MAX_FILES_PER_REQUEST: 10,
    MAX_TOTAL_SIZE: 200 * 1024 * 1024, // 200MB total per batch
    MAX_FILENAME_LENGTH: 255,
    FIELD_SIZE_LIMIT: 1024 * 1024 // 1MB for field data
};

// File type validations
const FILE_VALIDATION = {
    ALLOWED_MIME_TYPES: ['application/pdf'],
    ALLOWED_EXTENSIONS: ['.pdf'],
    DANGEROUS_PATTERNS: /[<>:"|?*\x00-\x1f]/ // Characters that could be malicious
};

// Processing timeouts and intervals
const TIMING = {
    CONVERSION_TIMEOUT: 5 * 60 * 1000, // 5 minutes for conversion
    CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours for cleanup
    HEALTH_CHECK_INTERVAL: 30 * 1000 // 30 seconds for health checks
};

// API response status codes
const STATUS_CODES = {
    SUCCESS: 200,
    CREATED: 201,
    MULTI_STATUS: 207, // For batch operations with mixed results
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    REQUEST_TOO_LARGE: 413,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

// Error messages
const ERROR_MESSAGES = {
    NO_FILE_UPLOADED: 'No file uploaded',
    NO_FILES_UPLOADED: 'No PDF files uploaded',
    FILE_TOO_LARGE: (size, limit) => `File size (${size}MB) exceeds maximum limit of ${limit}MB`,
    INVALID_FILE_TYPE: (type) => `Invalid file type: ${type}. Only PDF files are allowed`,
    INVALID_EXTENSION: (ext) => `Invalid file extension: ${ext}. Only .pdf files are allowed`,
    FILE_CORRUPTED: 'File appears to be empty or corrupted',
    FILENAME_TOO_LONG: 'Filename is too long (maximum 255 characters)',
    INVALID_FILENAME: 'Filename contains invalid characters',
    TOO_MANY_FILES: (limit) => `Too many files uploaded. Maximum allowed: ${limit}`,
    TOTAL_SIZE_EXCEEDED: (size, limit) => `Total file size (${size}MB) exceeds maximum limit of ${limit}MB`,
    DUPLICATE_FILENAMES: (names) => `Duplicate filenames detected: ${names.join(', ')}`,
    CONVERSION_TIMEOUT: 'Conversion timeout: Process took too long to complete',
    INPUT_FILE_NOT_FOUND: 'Input PDF file not found',
    INPUT_FILE_NOT_READABLE: 'Input PDF file is not readable',
    OUTPUT_FILE_NOT_CREATED: 'Conversion completed but output file was not created',
    OUTPUT_FILE_EMPTY: 'Conversion completed but output file is empty',
    PYTHON_PROCESS_ERROR: (code, error) => `Python process exited with code ${code}. Error: ${error || 'Unknown error'}`,
    PYTHON_START_FAILED: (error) => `Failed to start Python process: ${error}`,
    BATCH_VALIDATION_FAILED: 'Batch validation failed',
    BATCH_CONVERSION_FAILED: 'Batch conversion failed',
    DOWNLOAD_FAILED: 'Download failed',
    FILE_NOT_FOUND: 'The requested file does not exist',
    INVALID_DOWNLOAD_TYPE: 'Only DOCX files can be downloaded',
    DIRECTORY_TRAVERSAL: 'Filename contains invalid characters'
};

// Success messages
const SUCCESS_MESSAGES = {
    SINGLE_CONVERSION: 'PDF converted successfully to DOCX',
    BATCH_CONVERSION_ALL: (count) => `All ${count} files converted successfully`,
    BATCH_CONVERSION_PARTIAL: (success, failed) => `${success} files converted successfully, ${failed} failed`,
    HEALTH_CHECK: 'PDF to DOCX API is running'
};

// File paths and directories
const PATHS = {
    UPLOADS_DIR: 'uploads',
    OUTPUTS_DIR: 'outputs',
    PYTHON_MODULE: 'py',
    PYTHON_SCRIPT: '-m',
    PYTHON_PACKAGE: 'pdf2docx.main',
    PYTHON_COMMAND: 'convert'
};

// API endpoints
const ENDPOINTS = {
    HEALTH: '/health',
    CONVERT_SINGLE: '/convert',
    CONVERT_BATCH: '/convert-batch',
    DOWNLOAD: '/download/:filename'
};

// HTTP methods
const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
};

// Content types
const CONTENT_TYPES = {
    JSON: 'application/json',
    PDF: 'application/pdf',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

// Application metadata
const APP_METADATA = {
    NAME: 'PDF to DOCX Converter API',
    VERSION: '2.0.0',
    DESCRIPTION: 'REST API for converting PDF to DOCX using pdf2docx',
    AUTHOR: 'Your Name',
    LICENSE: 'MIT',
    LOCATION: 'Bhopal, India',
    FEATURES: ['single-file', 'multi-file', 'batch-processing', 'auto-cleanup']
};

// Logging levels
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

// File status for batch processing
const FILE_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    FAILED: 'failed'
};

// Export all constants
module.exports = {
    UPLOAD_LIMITS,
    FILE_VALIDATION,
    TIMING,
    STATUS_CODES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    PATHS,
    ENDPOINTS,
    HTTP_METHODS,
    CONTENT_TYPES,
    APP_METADATA,
    LOG_LEVELS,
    FILE_STATUS
};
