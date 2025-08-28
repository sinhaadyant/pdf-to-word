# PDF to DOCX Converter API

A high-performance REST API for converting PDF files to DOCX format using the pdf2docx Python library. Built with Node.js and Express.

**🌍 Location:** Bhopal, India  
**🚀 Version:** 1.0.0  
**📄 License:** MIT

## Features

- ✅ **Fast PDF to DOCX Conversion** - Powered by pdf2docx Python library
- ✅ **RESTful API** - Clean, documented endpoints
- ✅ **File Validation** - Comprehensive file type and size validation
- ✅ **Security** - Directory traversal protection, input sanitization
- ✅ **File Management** - Upload, convert, download, and cleanup
- ✅ **Error Handling** - Detailed error messages and logging
- ✅ **Modern UI** - Beautiful test client interface
- ✅ **Pagination** - Efficient file listing with pagination
- ✅ **Automatic Cleanup** - Temporary file management

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.6 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf2docx-master
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Test the API**
   - Open `test-client.html` in your browser
   - Or use the health endpoint: `http://localhost:3000/health`

## API Endpoints

### Health Check
```bash
GET /health
```

### Convert PDF to DOCX
```bash
POST /convert
Content-Type: multipart/form-data
Body: pdf file
```

### Download Converted File
```bash
GET /download/:filename
```

### List Converted Files
```bash
GET /files?page=1&limit=10
```

### Delete File
```bash
DELETE /files/:filename
```

### Cleanup Old Files
```bash
POST /cleanup
Content-Type: application/json
Body: {"maxAge": 86400000}
```

## Usage Examples

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Convert PDF
curl -X POST -F "pdf=@document.pdf" http://localhost:3000/convert

# List files
curl http://localhost:3000/files

# Download file
curl -O http://localhost:3000/download/document-1704110400000.docx

# Delete file
curl -X DELETE http://localhost:3000/files/document-1704110400000.docx

# Cleanup old files
curl -X POST -H "Content-Type: application/json" \
  -d '{"maxAge": 86400000}' \
  http://localhost:3000/cleanup
```

### Using JavaScript

```javascript
// Convert PDF
const formData = new FormData();
formData.append('pdf', fileInput.files[0]);

const response = await fetch('http://localhost:3000/convert', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

## File Requirements

- **File Type:** PDF only
- **Maximum Size:** 50MB
- **File Status:** Must not be empty or corrupted
- **Encoding:** UTF-8 compatible

## Security Features

1. **File Type Validation** - Only PDF files accepted
2. **File Size Limits** - Maximum 50MB per file
3. **Directory Traversal Protection** - Prevents path manipulation attacks
4. **Input Sanitization** - Filenames are sanitized
5. **Temporary File Cleanup** - Uploaded files are automatically removed
6. **Process Timeout** - 5-minute timeout for conversion process

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Common Error Codes

- `LIMIT_FILE_SIZE` - File exceeds 50MB limit
- `LIMIT_FILE_COUNT` - More than one file uploaded
- `INVALID_FILE_TYPE` - Non-PDF file uploaded
- `EMPTY_FILE` - File is empty or corrupted
- `CONVERSION_TIMEOUT` - Conversion process took too long

## Project Structure

```
pdf2docx-master/
├── pdf2docx/           # Core Python conversion engine
├── server.js           # Node.js API server
├── package.json        # Node.js dependencies
├── test-client.html    # API testing interface
├── requirements.txt    # Python dependencies
├── README.md          # Project documentation
├── API.md             # Detailed API documentation
├── samples/           # Sample PDF files
├── uploads/           # Upload directory (auto-created)
├── outputs/           # Output directory (auto-created)
└── node_modules/      # Node.js dependencies
```

## Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run clean      # Clean uploads and outputs directories
npm run test-api   # Test API health endpoint
```

### Environment Variables

- `PORT` - Server port (default: 3000)

### Testing

1. **Start the server**
   ```bash
   npm run dev
   ```

2. **Open test client**
   - Open `test-client.html` in your browser
   - Upload a PDF file and test conversion

3. **API testing**
   ```bash
   npm run test-api
   ```

## Deployment

### Local Deployment

1. Install dependencies
2. Start server: `npm start`
3. Access API at `http://localhost:3000`

### Production Deployment

1. Set environment variables
2. Use process manager (PM2, Forever)
3. Configure reverse proxy (Nginx, Apache)
4. Set up SSL certificates
5. Configure firewall rules

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Performance

- **Conversion Speed:** Depends on PDF complexity and size
- **Concurrent Requests:** Limited by system resources
- **Memory Usage:** Optimized for large files
- **Timeout:** 5 minutes per conversion

## Troubleshooting

### Common Issues

1. **Python not found**
   - Ensure Python is installed and in PATH
   - Use `py` command on Windows

2. **Conversion fails**
   - Check PDF file integrity
   - Verify file size limits
   - Check Python dependencies

3. **Port already in use**
   - Change PORT environment variable
   - Kill existing process

4. **File upload errors**
   - Check file type and size
   - Verify network connection
   - Check disk space

### Logs

Check console output for detailed error messages and conversion logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation:** See `API.md` for detailed API documentation
- **Issues:** Create an issue in the repository
- **Questions:** Check the troubleshooting section

## Acknowledgments

- **pdf2docx** - Core conversion library
- **Express.js** - Web framework
- **Multer** - File upload handling
- **Bhopal, India** - Development location

---

**Made with ❤️ in Bhopal, India**