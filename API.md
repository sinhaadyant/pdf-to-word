# PDF to DOCX Converter API Documentation

## Overview
REST API for converting PDF files to DOCX format using the pdf2docx Python library. Built with Node.js and Express.

**Base URL:** `http://localhost:3000`  
**Location:** Bhopal, India  
**Version:** 1.0.0

## Endpoints

### 1. Health Check
**GET** `/health`

Check if the API is running and healthy.

**Response:**
```json
{
  "status": "OK",
  "message": "PDF to DOCX API is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "location": "Bhopal, India"
}
```

### 2. Convert PDF to DOCX
**POST** `/convert`

Convert a PDF file to DOCX format.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with field name `pdf` containing the PDF file

**File Requirements:**
- File type: PDF only
- Maximum size: 50MB
- File must not be empty or corrupted

**Response (Success):**
```json
{
  "success": true,
  "message": "PDF converted successfully to DOCX",
  "data": {
    "originalFile": "document.pdf",
    "convertedFile": "document-1704110400000.docx",
    "outputPath": "/path/to/output/document-1704110400000.docx",
    "fileSize": "2.45 MB",
    "downloadUrl": "/download/document-1704110400000.docx",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "File validation failed",
  "details": [
    "File size (75.2MB) exceeds maximum limit of 50MB",
    "Invalid file type: application/octet-stream. Only PDF files are allowed"
  ]
}
```

### 3. Download Converted File
**GET** `/download/:filename`

Download a converted DOCX file.

**Parameters:**
- `filename`: Name of the DOCX file to download

**Security Features:**
- Prevents directory traversal attacks
- Only allows DOCX files
- Validates file existence

**Response:**
- File download (binary)
- Or error JSON if file not found/invalid

### 4. List Converted Files
**GET** `/files`

List all converted DOCX files with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "filename": "document-1704110400000.docx",
        "size": "2.45 MB",
        "created": "2024-01-01T12:00:00.000Z",
        "modified": "2024-01-01T12:00:00.000Z",
        "downloadUrl": "/download/document-1704110400000.docx"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 5. Delete Converted File
**DELETE** `/files/:filename`

Delete a specific converted DOCX file.

**Parameters:**
- `filename`: Name of the DOCX file to delete

**Security Features:**
- Prevents directory traversal attacks
- Only allows DOCX files
- Validates file existence

**Response:**
```json
{
  "success": true,
  "message": "File document-1704110400000.docx deleted successfully"
}
```

### 6. Cleanup Old Files
**POST** `/cleanup`

Remove old converted files based on age.

**Request Body:**
```json
{
  "maxAge": 86400000  // Optional: Age in milliseconds (default: 24 hours)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 5 old files",
  "deletedCount": 5
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "File too large",
  "message": "File size must be less than 50MB"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "File not found",
  "message": "The requested file does not exist"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Conversion failed",
  "message": "Python process exited with code 1. Error: Invalid PDF format",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Error Codes
- `LIMIT_FILE_SIZE`: File exceeds 50MB limit
- `LIMIT_FILE_COUNT`: More than one file uploaded
- `INVALID_FILE_TYPE`: Non-PDF file uploaded
- `EMPTY_FILE`: File is empty or corrupted
- `CONVERSION_TIMEOUT`: Conversion process took too long (5 minutes)

## Security Features

1. **File Type Validation**: Only PDF files accepted
2. **File Size Limits**: Maximum 50MB per file
3. **Directory Traversal Protection**: Prevents path manipulation attacks
4. **Input Sanitization**: Filenames are sanitized
5. **Temporary File Cleanup**: Uploaded files are automatically removed
6. **Process Timeout**: 5-minute timeout for conversion process

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production use.

## File Management

### Automatic Cleanup
- Uploaded PDF files are automatically deleted after conversion
- Use `/cleanup` endpoint to remove old converted files
- Files are stored in `outputs/` directory

### File Naming
- Converted files use format: `{original-name}-{timestamp}.docx`
- Timestamps prevent filename conflicts
- Original filenames are sanitized for security

## Testing

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
```

### Using Test Client
Open `test-client.html` in a web browser for a graphical interface.

## Dependencies

### Node.js Dependencies
- `express`: Web framework
- `multer`: File upload handling
- `cors`: Cross-origin resource sharing

### Python Dependencies
- `pdf2docx`: Core conversion library
- See `requirements.txt` for full list

## Environment Variables

- `PORT`: Server port (default: 3000)

## Deployment

1. Install Node.js dependencies: `npm install`
2. Install Python dependencies: `pip install -r requirements.txt`
3. Start server: `npm start`
4. For development: `npm run dev`

## Support

For issues and questions, check the project README or create an issue in the repository.
