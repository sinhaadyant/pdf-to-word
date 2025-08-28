/**
 * Rate limiter middleware
 * Prevents DoS attacks and API abuse by limiting request frequency
 * Configurable via environment variables
 */

const config = require('../config/config');
const { STATUS_CODES } = require('../constants');

// In-memory store for rate limiting (in production, use Redis)
const requestStore = new Map();

/**
 * Rate limiter middleware factory
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware function
 */
function createRateLimiter(options = {}) {
    const {
        enabled = config.security.rateLimit.enabled,
        windowMs = config.security.rateLimit.windowMs,
        maxRequests = config.security.rateLimit.maxRequests,
        skipSuccessfulRequests = config.security.rateLimit.skipSuccessfulRequests,
        skipFailedRequests = config.security.rateLimit.skipFailedRequests,
        keyGenerator = null,
        handler = null
    } = options;

    // If rate limiting is disabled, return a no-op middleware
    if (!enabled) {
        return (req, res, next) => {
            // Add headers to indicate rate limiting is disabled
            res.set({
                'X-RateLimit-Disabled': 'true',
                'X-RateLimit-Limit': 'unlimited',
                'X-RateLimit-Remaining': 'unlimited'
            });
            next();
        };
    }

    /**
     * Generate a unique key for the client
     * @param {Object} req - Express request object
     * @returns {string} Client identifier
     */
    function generateKey(req) {
        if (keyGenerator) {
            return keyGenerator(req);
        }
        
        // Use IP address as default key
        return req.ip || req.connection.remoteAddress || 'unknown';
    }

    /**
     * Handle rate limit exceeded
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} retryAfter - Seconds to wait before retry
     */
    function handleRateLimitExceeded(req, res, retryAfter) {
        if (handler) {
            return handler(req, res, retryAfter);
        }

        return res.status(STATUS_CODES.TOO_MANY_REQUESTS || 429).json({
            success: false,
            error: 'Rate Limit Exceeded',
            message: 'Too many requests from this IP. Please try again later.',
            retryAfter,
            timestamp: new Date().toISOString(),
            limit: maxRequests,
            windowMs: windowMs / 1000
        });
    }

    /**
     * Rate limiter middleware
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    return function rateLimiter(req, res, next) {
        const clientKey = generateKey(req);
        const now = Date.now();
        
        // Get client's request history
        const clientRequests = requestStore.get(clientKey) || [];
        
        // Remove old requests outside the window
        const recentRequests = clientRequests.filter(timestamp => now - timestamp < windowMs);
        
        // Check if client has exceeded the limit
        if (recentRequests.length >= maxRequests) {
            const retryAfter = Math.ceil(windowMs / 1000);
            
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': maxRequests,
                'X-RateLimit-Remaining': 0,
                'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
                'Retry-After': retryAfter
            });

            return handleRateLimitExceeded(req, res, retryAfter);
        }
        
        // Add current request to history
        recentRequests.push(now);
        requestStore.set(clientKey, recentRequests);
        
        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': maxRequests - recentRequests.length,
            'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        });

        // Store request info for post-processing
        req.rateLimit = {
            limit: maxRequests,
            remaining: maxRequests - recentRequests.length,
            reset: new Date(now + windowMs),
            windowMs
        };

        next();
    };
}

/**
 * Clean up old entries from the request store
 * This prevents memory leaks in long-running applications
 */
function cleanupRequestStore() {
    const now = Date.now();
    const windowMs = config.security.rateLimit.windowMs;
    
    let cleanedCount = 0;
    
    for (const [clientKey, requests] of requestStore.entries()) {
        const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
        
        if (recentRequests.length === 0) {
            requestStore.delete(clientKey);
            cleanedCount++;
        } else {
            requestStore.set(clientKey, recentRequests);
        }
    }

    if (cleanedCount > 0 && config.logging.level === 'debug') {
        console.log(`🧹 Rate limiter cleanup: removed ${cleanedCount} expired entries`);
    }
}

/**
 * Get rate limiter statistics
 * @returns {Object} Rate limiter statistics
 */
function getRateLimiterStats() {
    const now = Date.now();
    const windowMs = config.security.rateLimit.windowMs;
    let totalRequests = 0;
    let activeClients = 0;

    for (const [clientKey, requests] of requestStore.entries()) {
        const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
        if (recentRequests.length > 0) {
            activeClients++;
            totalRequests += recentRequests.length;
        }
    }

    return {
        enabled: config.security.rateLimit.enabled,
        activeClients,
        totalRequests,
        storeSize: requestStore.size,
        windowMs: windowMs / 1000,
        maxRequests: config.security.rateLimit.maxRequests
    };
}

/**
 * Reset rate limiter for a specific client
 * @param {string} clientKey - Client identifier
 * @returns {boolean} Whether client was found and reset
 */
function resetClient(clientKey) {
    if (requestStore.has(clientKey)) {
        requestStore.delete(clientKey);
        return true;
    }
    return false;
}

/**
 * Reset all rate limiter data
 */
function resetAll() {
    const size = requestStore.size;
    requestStore.clear();
    console.log(`🔄 Rate limiter reset: cleared ${size} client entries`);
}

// Clean up request store every 15 minutes
const cleanupInterval = setInterval(cleanupRequestStore, 15 * 60 * 1000);

// Graceful cleanup on process exit
process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
    cleanupRequestStore();
});

process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    cleanupRequestStore();
});

module.exports = {
    createRateLimiter,
    getRateLimiterStats,
    resetClient,
    resetAll,
    cleanupRequestStore
};
