# Configuration Guide

This document provides comprehensive information about configuring the PDF to DOCX Converter API.

## Table of Contents

- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Configuration Categories](#configuration-categories)
- [Environment-Specific Settings](#environment-specific-settings)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The application uses a centralized configuration system that supports:
- Environment-based configuration
- Validation of configuration values
- Feature toggles
- Performance tuning
- Security settings

## Environment Variables

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port (1-65535) |
| `HOST` | localhost | Server host |
| `NODE_ENV` | development | Environment mode (development/production/test) |
| `TRUST_PROXY` | false | Trust proxy for rate limiting behind reverse proxy |

### File Upload Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | 52428800 | Maximum file size in bytes (50MB) |
| `MAX_FILES_PER_REQUEST` | 10 | Maximum files per batch request |
| `MAX_TOTAL_SIZE` | 209715200 | Maximum total size per batch (200MB) |
| `FIELD_SIZE_LIMIT` | 1048576 | Maximum field size in bytes (1MB) |

### Python Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PYTHON_EXECUTABLE` | py | Python executable command |
| `PYTHON_MODULE` | pdf2docx.main | Python module for conversion |
| `PYTHON_COMMAND` | convert | Python command to execute |
| `CONVERSION_TIMEOUT` | 300000 | Conversion timeout in milliseconds (5 minutes) |

### Storage Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UPLOADS_DIR` | uploads | Directory for uploaded files |
| `OUTPUTS_DIR` | outputs | Directory for converted files |
| `CLEANUP_INTERVAL` | 86400000 | Cleanup interval in milliseconds (24 hours) |
| `MAX_FILE_AGE` | 604800000 | Maximum file age in milliseconds (7 days) |

### Security Configuration

#### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_ENABLED` | true | Enable/disable rate limiting |
| `RATE_LIMIT_WINDOW` | 900000 | Rate limit window in milliseconds (15 minutes) |
| `RATE_LIMIT_MAX` | 100 | Maximum requests per window |
| `RATE_LIMIT_SKIP_SUCCESS` | false | Skip successful requests from counting |
| `RATE_LIMIT_SKIP_FAILED` | false | Skip failed requests from counting |

#### CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ENABLED` | true | Enable/disable CORS |
| `CORS_ORIGIN` | * | Allowed origins |
| `CORS_CREDENTIALS` | false | Allow credentials |
| `CORS_METHODS` | GET,HEAD,PUT,PATCH,POST,DELETE | Allowed HTTP methods |
| `CORS_ALLOWED_HEADERS` | Content-Type,Authorization | Allowed headers |

#### Helmet (Security Headers)

| Variable | Default | Description |
|----------|---------|-------------|
| `HELMET_ENABLED` | true | Enable/disable Helmet security headers |
| `HELMET_CSP` | true | Enable Content Security Policy |
| `HELMET_HSTS` | true | Enable HTTP Strict Transport Security |

### Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | info | Logging level (error, warn, info, debug) |
| `ENABLE_REQUEST_LOGGING` | true | Enable request logging |
| `ENABLE_ERROR_LOGGING` | true | Enable error logging |
| `ENABLE_PERFORMANCE_LOGGING` | false | Enable performance logging |
| `LOG_FORMAT` | combined | Log format |
| `LOG_FILE` | | Log file path (optional) |

### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_PATH` | /api | API base path |
| `API_VERSION` | v1 | API version |
| `ENABLE_HEALTH_CHECK` | true | Enable health check endpoint |
| `ENABLE_METRICS` | false | Enable metrics endpoint |
| `ENABLE_SWAGGER` | false | Enable Swagger documentation |

### Performance Configuration

#### Compression

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPRESSION_ENABLED` | true | Enable/disable compression |
| `COMPRESSION_LEVEL` | 6 | Compression level (1-9) |
| `COMPRESSION_THRESHOLD` | 1024 | Minimum size for compression |

#### Cache

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_ENABLED` | false | Enable/disable caching |
| `CACHE_MAX_AGE` | 3600 | Cache max age in seconds |

### Monitoring Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_HEALTH_CHECKS` | true | Enable health checks |
| `HEALTH_CHECK_INTERVAL` | 30000 | Health check interval in milliseconds |
| `ENABLE_METRICS` | false | Enable metrics collection |
| `METRICS_PORT` | 9090 | Metrics server port |

## Configuration Categories

### 1. Server Configuration
Controls basic server settings like port, host, and environment.

### 2. File Upload Configuration
Manages file upload limits and restrictions.

### 3. Python Configuration
Controls the Python conversion process settings.

### 4. Storage Configuration
Manages file storage and cleanup settings.

### 5. Security Configuration
Comprehensive security settings including rate limiting, CORS, and security headers.

### 6. Logging Configuration
Controls logging behavior and output.

### 7. API Configuration
Manages API endpoints and features.

### 8. Performance Configuration
Optimization settings for compression and caching.

### 9. Monitoring Configuration
Health checks and metrics collection settings.

## Environment-Specific Settings

The application automatically applies different settings based on the `NODE_ENV` environment variable:

### Development Environment
- More verbose logging
- Higher rate limits (1000 requests per window)
- Debug information enabled
- Performance logging enabled

### Production Environment
- Info-level logging
- Standard rate limits (100 requests per window)
- Security features enabled
- Performance optimizations

### Test Environment
- Error-only logging
- Rate limiting disabled
- Minimal logging for faster tests

## Best Practices

### 1. Security
- Always enable rate limiting in production
- Use specific CORS origins instead of `*`
- Enable Helmet security headers
- Set appropriate file size limits

### 2. Performance
- Enable compression for better response times
- Use appropriate cleanup intervals
- Monitor memory usage
- Set reasonable timeouts

### 3. Monitoring
- Enable health checks
- Use appropriate log levels
- Monitor rate limiter statistics
- Track conversion success rates

### 4. Development
- Use development environment for local development
- Enable debug logging for troubleshooting
- Use higher rate limits for testing
- Enable performance logging for optimization

## Examples

### Development Environment
```bash
NODE_ENV=development
LOG_LEVEL=debug
RATE_LIMIT_MAX=1000
ENABLE_PERFORMANCE_LOGGING=true
```

### Production Environment
```bash
NODE_ENV=production
LOG_LEVEL=info
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://yourdomain.com
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

### High-Traffic Production
```bash
NODE_ENV=production
RATE_LIMIT_MAX=500
RATE_LIMIT_WINDOW=600000
COMPRESSION_LEVEL=9
CACHE_ENABLED=true
ENABLE_METRICS=true
```

### Testing Environment
```bash
NODE_ENV=test
LOG_LEVEL=error
RATE_LIMIT_ENABLED=false
ENABLE_REQUEST_LOGGING=false
```

## Configuration Validation

The application validates all configuration values on startup and will fail to start if invalid values are detected. Common validation rules:

- Port numbers must be between 1 and 65535
- File sizes must be positive numbers
- Timeouts must be positive numbers
- Rate limit values must be positive numbers
- Max total size must be greater than or equal to max file size

## Feature Toggles

Use the `config.isEnabled()` method to check if features are enabled:

```javascript
const config = require('./config/config');

if (config.isEnabled('rateLimit')) {
    // Rate limiting is enabled
}

if (config.isEnabled('compression')) {
    // Compression is enabled
}
```

Available feature toggles:
- `rateLimit` - Rate limiting
- `cors` - CORS support
- `helmet` - Security headers
- `compression` - Response compression
- `cache` - Caching
- `metrics` - Metrics collection
- `healthChecks` - Health checks
- `requestLogging` - Request logging
- `errorLogging` - Error logging
- `performanceLogging` - Performance logging
