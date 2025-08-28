# PDF to DOCX Converter API

A robust REST API for converting PDF files to DOCX format using the `pdf2docx` Python library. Built with Node.js and Express, featuring multi-file upload support, comprehensive validation, and production-ready architecture.

## 🚀 Features

- **Single & Batch File Conversion**: Convert one or multiple PDF files simultaneously
- **Comprehensive Validation**: File type, size, and security validation
- **Production Ready**: Rate limiting, error handling, logging, and security measures
- **Auto Cleanup**: Automatic cleanup of temporary files
- **Progress Tracking**: Real-time conversion progress for batch operations
- **RESTful API**: Clean, well-documented REST endpoints
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 📋 Prerequisites

- **Node.js** (v14.0.0 or higher)
- **Python** (v3.7 or higher)
- **pdf2docx** Python library

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pdf2docx-api.git
   cd pdf2docx-api
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install pdf2docx
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env file with your configuration
   ```

5. **Create required directories**
   ```bash
   npm run setup
   ```

## 🚀 Quick Start

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "PDF to DOCX API is running",
  "version": "2.0.0",
  "features": ["single-file", "multi-file", "batch-processing"],
  "limits": {
    "maxFileSize": "50MB",
    "maxFilesPerRequest": 10,
    "maxTotalSize": "200MB"
  }
}
```

#### Single File Conversion
```http
POST /convert
Content-Type: multipart/form-data

Form Data:
- pdf: [PDF file]
```

**Response:**
```json
{
  "success": true,
  "message": "PDF converted successfully to DOCX",
  "data": {
    "originalFile": "document.pdf",
    "convertedFile": "document-1234567890.docx",
    "fileSize": "2.5 MB",
    "downloadUrl": "/api/download/document-1234567890.docx",
    "timestamp": "2023-12-01T10:30:00.000Z"
  }
}
```

#### Batch File Conversion
```http
POST /convert-batch
Content-Type: multipart/form-data

Form Data:
- pdfs: [PDF file 1]
- pdfs: [PDF file 2]
- pdfs: [PDF file 3]
```

**Response:**
```json
{
  "success": true,
  "message": "All 3 files converted successfully",
  "summary": {
    "totalFiles": 3,
    "successful": 3,
    "failed": 0
  },
  "results": [
    {
      "originalFile": "document1.pdf",
      "convertedFile": "document1-1234567890.docx",
      "fileSize": "1.2 MB",
      "downloadUrl": "/api/download/document1-1234567890.docx",
      "status": "success"
    }
  ],
  "errors": []
}
```

#### Download Converted File
```http
GET /download/:filename
```

#### List Converted Files
```http
GET /files?page=1&limit=10
```

#### Get File Information
```http
GET /files/:filename/info
```

#### Delete File
```http
DELETE /files/:filename
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `MAX_FILE_SIZE` | 52428800 | Max file size in bytes (50MB) |
| `MAX_FILES_PER_REQUEST` | 10 | Max files per batch request |
| `MAX_TOTAL_SIZE` | 209715200 | Max total size per batch (200MB) |
| `CONVERSION_TIMEOUT` | 300000 | Conversion timeout in ms (5min) |
| `CLEANUP_INTERVAL` | 86400000 | Cleanup interval in ms (24h) |
| `RATE_LIMIT_MAX` | 100 | Max requests per 15 minutes |

### File Limits

- **Single File**: Maximum 50MB
- **Batch Upload**: Maximum 10 files per request
- **Total Size**: Maximum 200MB per batch
- **Supported Format**: PDF only

## 🏗️ Project Structure

```
pdf2docx-api/
├── config/
│   └── config.js          # Application configuration
├── middleware/
│   ├── errorHandler.js    # Global error handling
│   ├── requestLogger.js   # Request logging
│   └── rateLimiter.js     # Rate limiting
├── routes/
│   ├── convert.js         # Conversion endpoints
│   └── download.js        # File management endpoints
├── utils/
│   ├── validation.js      # File validation utilities
│   ├── converter.js       # PDF conversion utilities
│   └── fileManager.js     # File management utilities
├── constants.js           # Application constants
├── server.js              # Main server file
├── test-client.html       # Test client interface
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Health Check
```bash
npm run health
```

## 🛡️ Security Features

- **File Validation**: Comprehensive file type and size validation
- **Rate Limiting**: Prevents API abuse and DoS attacks
- **Input Sanitization**: Prevents directory traversal attacks
- **Error Handling**: Secure error messages (no sensitive data exposure)
- **CORS Protection**: Configurable cross-origin resource sharing
- **Request Size Limits**: Prevents large payload attacks

## 📊 Monitoring & Logging

- **Request Logging**: All requests logged with timestamps and performance metrics
- **Error Logging**: Detailed error logging with stack traces
- **Performance Metrics**: Response time tracking
- **Health Monitoring**: Built-in health check endpoint

## 🚀 Deployment

### Docker Deployment

1. **Build Docker image**
   ```bash
   npm run docker:build
   ```

2. **Run Docker container**
   ```bash
   npm run docker:run
   ```

### Production Considerations

- Use environment variables for configuration
- Set up proper logging (Winston/Pino)
- Use Redis for rate limiting in production
- Set up monitoring and alerting
- Use HTTPS in production
- Configure proper CORS settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/pdf2docx-api/issues)
- **Documentation**: [API Documentation](https://github.com/yourusername/pdf2docx-api/wiki)
- **Email**: your.email@example.com

## 🙏 Acknowledgments

- [pdf2docx](https://github.com/dothinking/pdf2docx) - Python library for PDF to DOCX conversion
- [Express.js](https://expressjs.com/) - Web application framework
- [Multer](https://github.com/expressjs/multer) - File upload middleware

---

**Made with ❤️ in Bhopal, India**