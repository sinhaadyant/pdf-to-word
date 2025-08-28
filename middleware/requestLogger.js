/**
 * Request logger middleware
 * Logs all incoming requests with timestamps and performance metrics
 */

/**
 * Request logger middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log request details
    console.log(`📥 ${timestamp} - ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        timestamp
    });

    // Override res.end to log response details
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        
        // Determine log level based on status code
        let logLevel = '📤';
        if (statusCode >= 400 && statusCode < 500) {
            logLevel = '⚠️';
        } else if (statusCode >= 500) {
            logLevel = '🚨';
        }
        
        console.log(`${logLevel} ${timestamp} - ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`, {
            method: req.method,
            url: req.originalUrl,
            statusCode,
            duration: `${duration}ms`,
            contentLength: res.get('Content-Length'),
            timestamp
        });

        // Call original end method
        originalEnd.call(this, chunk, encoding);
    };

    next();
}

module.exports = requestLogger;
