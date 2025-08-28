/**
 * Main server file for PDF to DOCX Converter API
 * Organized as a senior developer with proper modular structure
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

// Import configuration
const config = require('./config/config');

// Import constants and utilities
const { 
    APP_METADATA, 
    TIMING, 
    PATHS 
} = require('./constants');
const { ensureDirectoriesExist } = require('./utils/fileManager');
const { cleanupOldFiles } = require('./utils/fileManager');
const { validatePythonEnvironment } = require('./utils/converter');

// Import routes
const convertRoutes = require('./routes/convert');
const downloadRoutes = require('./routes/download');

// Import middleware
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { createRateLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = config.server.port;

// Initialize directories
const uploadsDir = path.join(__dirname, PATHS.UPLOADS_DIR);
const outputsDir = path.join(__dirname, PATHS.OUTPUTS_DIR);
ensureDirectoriesExist([uploadsDir, outputsDir]);

// Trust proxy (for rate limiting behind reverse proxy)
if (config.server.trustProxy) {
    app.set('trust proxy', 1);
}

// Security middleware
if (config.isEnabled('helmet')) {
    app.use(helmet({
        contentSecurityPolicy: config.security.helmet.contentSecurityPolicy,
        hsts: config.security.helmet.hsts
    }));
}

// CORS middleware
if (config.isEnabled('cors')) {
    app.use(cors({
        origin: config.security.cors.origin,
        credentials: config.security.cors.credentials,
        methods: config.security.cors.methods.split(','),
        allowedHeaders: config.security.cors.allowedHeaders.split(',')
    }));
}

// Compression middleware
if (config.isEnabled('compression')) {
    app.use(compression({
        level: config.performance.compression.level,
        threshold: config.performance.compression.threshold
    }));
}

// Body parsing middleware
app.use(express.json({ 
    limit: config.upload.fieldSizeLimit 
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: config.upload.fieldSizeLimit 
}));

// Custom middleware
if (config.isEnabled('requestLogging')) {
    app.use(requestLogger);
}

// Rate limiting middleware
const rateLimiter = createRateLimiter();
app.use(rateLimiter);

// Health check endpoint
app.get('/health', asyncHandler(async (req, res) => {
    const healthData = {
        status: 'OK',
        message: 'PDF to DOCX API is running',
        timestamp: new Date().toISOString(),
        version: APP_METADATA.VERSION,
        environment: config.server.environment,
        features: APP_METADATA.FEATURES,
        limits: {
            maxFileSize: `${(config.upload.maxFileSize / (1024 * 1024)).toFixed(0)}MB`,
            maxFilesPerRequest: config.upload.maxFilesPerRequest,
            maxTotalSize: `${(config.upload.maxTotalSize / (1024 * 1024)).toFixed(0)}MB`
        },
        location: APP_METADATA.LOCATION,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        rateLimit: {
            enabled: config.isEnabled('rateLimit'),
            maxRequests: config.security.rateLimit.maxRequests,
            windowMs: config.security.rateLimit.windowMs / 1000
        }
    };

    res.json(healthData);
}));

// API routes
app.use(config.api.basePath, convertRoutes);
app.use(config.api.basePath, downloadRoutes);

// Serve static files (test client)
app.use(express.static(path.join(__dirname, 'public')));

// Serve test client at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-client.html'));
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `The requested route ${req.originalUrl} does not exist`,
        availableRoutes: [
            'GET /health',
            `POST ${config.api.basePath}/convert`,
            `POST ${config.api.basePath}/convert-batch`,
            `GET ${config.api.basePath}/download/:filename`,
            `GET ${config.api.basePath}/files`,
            `GET ${config.api.basePath}/files/:filename/info`,
            `DELETE ${config.api.basePath}/files/:filename`
        ],
        timestamp: new Date().toISOString()
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// Auto-cleanup old files
setInterval(() => {
    cleanupOldFiles(uploadsDir, config.storage.maxFileAge);
    cleanupOldFiles(outputsDir, config.storage.maxFileAge);
}, config.storage.cleanupInterval);

// Validate Python environment on startup
async function validateEnvironment() {
    try {
        await validatePythonEnvironment();
        console.log('✅ Python environment validated successfully');
    } catch (error) {
        console.error('❌ Python environment validation failed:', error.message);
        console.log('Please ensure Python and pdf2docx are installed correctly');
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 ${APP_METADATA.NAME} v${APP_METADATA.VERSION} is running`);
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${config.server.environment}`);
    console.log(`🌍 Location: ${APP_METADATA.LOCATION}`);
    console.log(`📁 Uploads: ${uploadsDir}`);
    console.log(`📁 Outputs: ${outputsDir}`);
    
    // Log configuration status
    console.log('\n🔧 Configuration Status:');
    console.log(`   Rate Limiting: ${config.isEnabled('rateLimit') ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   CORS: ${config.isEnabled('cors') ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Helmet: ${config.isEnabled('helmet') ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Compression: ${config.isEnabled('compression') ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Request Logging: ${config.isEnabled('requestLogging') ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Error Logging: ${config.isEnabled('errorLogging') ? '✅ Enabled' : '❌ Disabled'}`);
    
    // Validate environment
    await validateEnvironment();
    
    console.log('\n✨ Ready to convert PDFs to DOCX!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
