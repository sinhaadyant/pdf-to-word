# Development Guide

This document provides comprehensive guidance for developers working on the PDF to DOCX Converter API.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance](#performance)
- [Security](#security)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- Python (v3.7 or higher)
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf2docx-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   pip install pdf2docx
   ```

3. **Set up environment**
   ```bash
   cp env.example .env
   # Edit .env with your local settings
   ```

4. **Create directories**
   ```bash
   npm run setup
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
pdf2docx-api/
├── config/                 # Configuration management
│   └── config.js          # Centralized configuration
├── middleware/            # Express middleware
│   ├── errorHandler.js    # Global error handling
│   ├── requestLogger.js   # Request logging
│   └── rateLimiter.js     # Rate limiting
├── routes/                # API route handlers
│   ├── convert.js         # Conversion endpoints
│   └── download.js        # File management endpoints
├── utils/                 # Utility functions
│   ├── validation.js      # File validation
│   ├── converter.js       # PDF conversion
│   └── fileManager.js     # File operations
├── docs/                  # Documentation
├── constants.js           # Application constants
├── server.js              # Main application file
├── test-client.html       # Test interface
├── package.json           # Dependencies and scripts
├── Dockerfile             # Container configuration
└── README.md             # Project documentation
```

## Development Workflow

### 1. Feature Development

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### 2. Code Review Process

- All changes must be reviewed
- Ensure tests pass
- Check code coverage
- Verify documentation updates
- Test in different environments

### 3. Release Process

1. **Update version**
   ```bash
   npm version patch|minor|major
   ```

2. **Update changelog**
   - Document new features
   - List bug fixes
   - Note breaking changes

3. **Create release tag**
   ```bash
   git tag v2.0.0
   git push origin v2.0.0
   ```

## Code Standards

### 1. JavaScript/Node.js

#### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and constructors
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names

```javascript
// Good
const maxFileSize = 50 * 1024 * 1024;
const validatePdfFile = (file) => { /* ... */ };
const STATUS_CODES = { OK: 200, ERROR: 500 };

// Bad
const mfs = 50 * 1024 * 1024;
const vf = (f) => { /* ... */ };
const codes = { ok: 200, err: 500 };
```

#### Function Structure
- Keep functions small and focused
- Use early returns
- Handle errors properly
- Add JSDoc comments

```javascript
/**
 * Validates a PDF file for conversion
 * @param {Object} file - File object from multer
 * @returns {Array} Array of validation errors
 */
function validatePdfFile(file) {
    const errors = [];
    
    if (!file) {
        errors.push('No file uploaded');
        return errors;
    }
    
    if (file.size > MAX_FILE_SIZE) {
        errors.push('File too large');
    }
    
    return errors;
}
```

#### Error Handling
- Use try-catch blocks for async operations
- Provide meaningful error messages
- Log errors appropriately
- Use custom error classes when needed

```javascript
async function convertPdfToDocx(pdfPath, docxPath) {
    try {
        // Conversion logic
        return result;
    } catch (error) {
        console.error('Conversion failed:', error);
        throw new Error(`PDF conversion failed: ${error.message}`);
    }
}
```

### 2. Configuration Management

- Use environment variables for configuration
- Validate configuration values
- Provide sensible defaults
- Use feature toggles

```javascript
const config = require('./config/config');

if (config.isEnabled('rateLimit')) {
    // Apply rate limiting
}
```

### 3. API Design

- Use RESTful conventions
- Provide consistent response formats
- Include proper status codes
- Add request/response validation

```javascript
// Consistent response format
{
    success: true,
    data: { /* response data */ },
    message: 'Operation successful',
    timestamp: '2023-12-01T10:30:00.000Z'
}
```

## Testing

### 1. Unit Testing

- Test individual functions
- Mock external dependencies
- Test error conditions
- Aim for high coverage

```javascript
describe('validatePdfFile', () => {
    it('should return errors for invalid file', () => {
        const file = { size: 0, mimetype: 'text/plain' };
        const errors = validatePdfFile(file);
        expect(errors).toContain('File appears to be empty');
    });
});
```

### 2. Integration Testing

- Test API endpoints
- Test file upload/convert/download flow
- Test error scenarios
- Test rate limiting

### 3. Performance Testing

- Test with large files
- Test concurrent requests
- Monitor memory usage
- Test cleanup processes

### 4. Security Testing

- Test file validation
- Test rate limiting
- Test input sanitization
- Test directory traversal protection

## Debugging

### 1. Logging

- Use appropriate log levels
- Include context in log messages
- Use structured logging
- Enable debug logging in development

```javascript
console.log('📥 Request received:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    timestamp: new Date().toISOString()
});
```

### 2. Error Tracking

- Use try-catch blocks
- Log stack traces in development
- Use error monitoring services in production
- Provide user-friendly error messages

### 3. Performance Monitoring

- Monitor response times
- Track memory usage
- Monitor file system operations
- Use profiling tools

## Performance

### 1. File Handling

- Stream large files
- Use appropriate buffer sizes
- Clean up temporary files
- Monitor disk usage

### 2. Memory Management

- Avoid loading large files into memory
- Use garbage collection effectively
- Monitor memory leaks
- Set appropriate timeouts

### 3. Caching

- Cache frequently accessed data
- Use appropriate cache strategies
- Monitor cache hit rates
- Implement cache invalidation

### 4. Database Optimization

- Use indexes appropriately
- Optimize queries
- Monitor query performance
- Use connection pooling

## Security

### 1. Input Validation

- Validate all inputs
- Sanitize file names
- Check file types and sizes
- Prevent directory traversal

### 2. Rate Limiting

- Implement rate limiting
- Monitor for abuse
- Use appropriate limits
- Handle rate limit errors gracefully

### 3. File Security

- Validate file contents
- Scan for malware
- Use secure file storage
- Implement access controls

### 4. API Security

- Use HTTPS in production
- Implement authentication if needed
- Use security headers
- Monitor for attacks

## Deployment

### 1. Environment Setup

- Use environment-specific configurations
- Set up proper logging
- Configure monitoring
- Set up backups

### 2. Container Deployment

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

### 3. Production Checklist

- [ ] Environment variables configured
- [ ] Security features enabled
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Backup strategy in place
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Error handling tested

### 4. Monitoring

- Set up health checks
- Monitor application metrics
- Set up alerting
- Track performance metrics

## Best Practices Summary

### Code Quality
- Write clean, readable code
- Follow established patterns
- Use meaningful names
- Add proper documentation

### Testing
- Write comprehensive tests
- Test edge cases
- Maintain high coverage
- Test in different environments

### Security
- Validate all inputs
- Use secure defaults
- Implement proper error handling
- Monitor for vulnerabilities

### Performance
- Optimize critical paths
- Monitor resource usage
- Use appropriate caching
- Handle large files efficiently

### Maintenance
- Keep dependencies updated
- Monitor for deprecations
- Document changes
- Maintain backward compatibility
