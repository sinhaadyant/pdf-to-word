/**
 * Application configuration
 * Manages environment-specific settings and configuration
 * Follows best practices for development and production
 */

require('dotenv').config();

const config = {
    // Server configuration
    server: {
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development',
        trustProxy: process.env.TRUST_PROXY === 'true'
    },

    // File upload configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
        maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST) || 10,
        maxTotalSize: parseInt(process.env.MAX_TOTAL_SIZE) || 200 * 1024 * 1024, // 200MB
        allowedMimeTypes: ['application/pdf'],
        allowedExtensions: ['.pdf'],
        fieldSizeLimit: parseInt(process.env.FIELD_SIZE_LIMIT) || 1024 * 1024 // 1MB
    },

    // Python configuration
    python: {
        executable: process.env.PYTHON_EXECUTABLE || 'py',
        module: process.env.PYTHON_MODULE || 'pdf2docx.main',
        command: process.env.PYTHON_COMMAND || 'convert',
        timeout: parseInt(process.env.CONVERSION_TIMEOUT) || 5 * 60 * 1000 // 5 minutes
    },

    // Storage configuration
    storage: {
        uploadsDir: process.env.UPLOADS_DIR || 'uploads',
        outputsDir: process.env.OUTPUTS_DIR || 'outputs',
        cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 24 * 60 * 60 * 1000, // 24 hours
        maxFileAge: parseInt(process.env.MAX_FILE_AGE) || 7 * 24 * 60 * 60 * 1000 // 7 days
    },

    // Security configuration
    security: {
        rateLimit: {
            enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
            skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'false'
        },
        cors: {
            enabled: process.env.CORS_ENABLED !== 'false',
            origin: process.env.CORS_ORIGIN || '*',
            credentials: process.env.CORS_CREDENTIALS === 'true',
            methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
            allowedHeaders: process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization'
        },
        helmet: {
            enabled: process.env.HELMET_ENABLED !== 'false',
            contentSecurityPolicy: process.env.HELMET_CSP === 'true',
            hsts: process.env.HELMET_HSTS === 'true'
        }
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
        enableErrorLogging: process.env.ENABLE_ERROR_LOGGING !== 'false',
        enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING !== 'false',
        logFormat: process.env.LOG_FORMAT || 'combined',
        logFile: process.env.LOG_FILE || null
    },

    // API configuration
    api: {
        basePath: process.env.API_BASE_PATH || '/api',
        version: process.env.API_VERSION || 'v1',
        enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        enableSwagger: process.env.ENABLE_SWAGGER === 'true'
    },

    // Performance configuration
    performance: {
        compression: {
            enabled: process.env.COMPRESSION_ENABLED !== 'false',
            level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
            threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024
        },
        cache: {
            enabled: process.env.CACHE_ENABLED === 'true',
            maxAge: parseInt(process.env.CACHE_MAX_AGE) || 3600 // 1 hour
        }
    },

    // Monitoring configuration
    monitoring: {
        enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT) || 9090
    }
};

/**
 * Validate configuration values
 * @returns {Array} Array of validation errors
 */
function validateConfig() {
    const errors = [];

    // Validate server port
    if (config.server.port < 1 || config.server.port > 65535) {
        errors.push('Invalid server port: must be between 1 and 65535');
    }

    // Validate file size limits
    if (config.upload.maxFileSize <= 0) {
        errors.push('Invalid max file size: must be greater than 0');
    }

    if (config.upload.maxFilesPerRequest <= 0) {
        errors.push('Invalid max files per request: must be greater than 0');
    }

    if (config.upload.maxTotalSize <= 0) {
        errors.push('Invalid max total size: must be greater than 0');
    }

    if (config.upload.maxTotalSize < config.upload.maxFileSize) {
        errors.push('Max total size must be greater than or equal to max file size');
    }

    // Validate Python timeout
    if (config.python.timeout <= 0) {
        errors.push('Invalid conversion timeout: must be greater than 0');
    }

    // Validate rate limiting configuration
    if (config.security.rateLimit.enabled) {
        if (config.security.rateLimit.windowMs <= 0) {
            errors.push('Invalid rate limit window: must be greater than 0');
        }
        if (config.security.rateLimit.maxRequests <= 0) {
            errors.push('Invalid rate limit max requests: must be greater than 0');
        }
    }

    // Validate storage configuration
    if (config.storage.cleanupInterval <= 0) {
        errors.push('Invalid cleanup interval: must be greater than 0');
    }

    if (config.storage.maxFileAge <= 0) {
        errors.push('Invalid max file age: must be greater than 0');
    }

    return errors;
}

/**
 * Get configuration for a specific environment
 * @param {string} environment - Environment name
 * @returns {Object} Environment-specific configuration
 */
function getEnvironmentConfig(environment = config.server.environment) {
    const envConfigs = {
        development: {
            logging: {
                level: 'debug',
                enableRequestLogging: true,
                enableErrorLogging: true,
                enablePerformanceLogging: true
            },
            security: {
                rateLimit: {
                    enabled: true,
                    maxRequests: 1000 // More lenient in development
                }
            }
        },
        production: {
            logging: {
                level: 'info',
                enableRequestLogging: true,
                enableErrorLogging: true,
                enablePerformanceLogging: false
            },
            security: {
                rateLimit: {
                    enabled: true,
                    maxRequests: 100
                }
            }
        },
        test: {
            logging: {
                level: 'error',
                enableRequestLogging: false,
                enableErrorLogging: true,
                enablePerformanceLogging: false
            },
            security: {
                rateLimit: {
                    enabled: false
                }
            }
        }
    };

    return envConfigs[environment] || {};
}

/**
 * Merge environment-specific configuration
 */
function mergeEnvironmentConfig() {
    const envConfig = getEnvironmentConfig();
    
    // Deep merge configuration
    Object.keys(envConfig).forEach(key => {
        if (typeof envConfig[key] === 'object' && !Array.isArray(envConfig[key])) {
            config[key] = { ...config[key], ...envConfig[key] };
        } else {
            config[key] = envConfig[key];
        }
    });
}

/**
 * Get configuration value with fallback
 * @param {string} path - Dot notation path to config value
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value
 */
function get(path, defaultValue = null) {
    return path.split('.').reduce((obj, key) => {
        return obj && obj[key] !== undefined ? obj[key] : defaultValue;
    }, config);
}

/**
 * Check if feature is enabled
 * @param {string} feature - Feature name
 * @returns {boolean} Whether feature is enabled
 */
function isEnabled(feature) {
    const featureMap = {
        'rateLimit': config.security.rateLimit.enabled,
        'cors': config.security.cors.enabled,
        'helmet': config.security.helmet.enabled,
        'compression': config.performance.compression.enabled,
        'cache': config.performance.cache.enabled,
        'metrics': config.monitoring.enableMetrics,
        'healthChecks': config.monitoring.enableHealthChecks,
        'requestLogging': config.logging.enableRequestLogging,
        'errorLogging': config.logging.enableErrorLogging,
        'performanceLogging': config.logging.enablePerformanceLogging
    };

    return featureMap[feature] || false;
}

// Validate and merge configuration
const validationErrors = validateConfig();
if (validationErrors.length > 0) {
    throw new Error(`Configuration validation failed:\n${validationErrors.join('\n')}`);
}

mergeEnvironmentConfig();

module.exports = {
    ...config,
    get,
    isEnabled,
    validateConfig,
    getEnvironmentConfig
};
