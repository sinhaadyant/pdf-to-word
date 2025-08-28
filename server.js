const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads and outputs directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
}

// Enhanced file validation function
function validatePdfFile(file) {
    const errors = [];
    
    // Check if file exists
    if (!file) {
        errors.push('No file uploaded');
        return errors;
    }
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
        errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of 50MB`);
    }
    
    // Check file type
    const allowedMimeTypes = ['application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        errors.push(`Invalid file type: ${file.mimetype}. Only PDF files are allowed`);
    }
    
    // Check file extension
    const allowedExtensions = ['.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`Invalid file extension: ${fileExtension}. Only .pdf files are allowed`);
    }
    
    // Check if file is corrupted (basic check)
    if (file.size === 0) {
        errors.push('File appears to be empty or corrupted');
    }
    
    return errors;
}

// Configure multer for file uploads with enhanced validation
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp and sanitize original name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, 'pdf-' + uniqueSuffix + path.extname(sanitizedName));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Enhanced file filtering
        const errors = validatePdfFile(file);
        if (errors.length > 0) {
            return cb(new Error(errors.join('; ')), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1 // Only allow 1 file per request
    }
});

// Helper function to run Python pdf2docx command with enhanced error handling
function convertPdfToDocx(pdfPath, docxPath) {
    return new Promise((resolve, reject) => {
        // Check if input file exists
        if (!fs.existsSync(pdfPath)) {
            return reject(new Error('Input PDF file not found'));
        }
        
        // Check if input file is readable
        try {
            fs.accessSync(pdfPath, fs.constants.R_OK);
        } catch (error) {
            return reject(new Error('Input PDF file is not readable'));
        }
        
        const pythonProcess = spawn('py', [
            '-m', 'pdf2docx.main', 'convert',
            pdfPath,
            docxPath
        ]);

        let stdout = '';
        let stderr = '';
        let timeoutId;

        // Set timeout for conversion (5 minutes)
        timeoutId = setTimeout(() => {
            pythonProcess.kill('SIGTERM');
            reject(new Error('Conversion timeout: Process took too long to complete'));
        }, 5 * 60 * 1000);

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            if (code === 0) {
                // Verify output file was created
                if (!fs.existsSync(docxPath)) {
                    reject(new Error('Conversion completed but output file was not created'));
                    return;
                }
                
                // Check if output file has content
                const stats = fs.statSync(docxPath);
                if (stats.size === 0) {
                    reject(new Error('Conversion completed but output file is empty'));
                    return;
                }
                
                resolve(stdout);
            } else {
                reject(new Error(`Python process exited with code ${code}. Error: ${stderr || 'Unknown error'}`));
            }
        });

        pythonProcess.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to start Python process: ${error.message}`));
        });
    });
}

// Cleanup function for temporary files
function cleanupTempFiles(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error cleaning up temporary file:', error);
    }
}

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'PDF to DOCX API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        location: 'Bhopal, India'
    });
});

// Convert PDF to DOCX endpoint with enhanced validation
app.post('/convert', upload.single('pdf'), async (req, res) => {
    let uploadedFilePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No PDF file uploaded',
                message: 'Please upload a PDF file using the "pdf" field'
            });
        }

        uploadedFilePath = req.file.path;
        const originalName = req.file.originalname;
        const baseName = path.basename(originalName, '.pdf');
        
        // Additional validation
        const validationErrors = validatePdfFile(req.file);
        if (validationErrors.length > 0) {
            cleanupTempFiles(uploadedFilePath);
            return res.status(400).json({
                success: false,
                error: 'File validation failed',
                details: validationErrors
            });
        }
        
        // Generate output filename with timestamp
        const timestamp = Date.now();
        const docxFilename = `${baseName}-${timestamp}.docx`;
        const docxPath = path.join(outputsDir, docxFilename);

        console.log(`Converting ${uploadedFilePath} to ${docxPath}`);

        // Convert PDF to DOCX
        await convertPdfToDocx(uploadedFilePath, docxPath);

        // Get file stats
        const stats = fs.statSync(docxPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        // Clean up uploaded PDF file
        cleanupTempFiles(uploadedFilePath);

        res.json({
            success: true,
            message: 'PDF converted successfully to DOCX',
            data: {
                originalFile: originalName,
                convertedFile: docxFilename,
                outputPath: docxPath,
                fileSize: `${fileSizeInMB} MB`,
                downloadUrl: `/download/${docxFilename}`,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Conversion error:', error);
        
        // Clean up uploaded file if it exists
        if (uploadedFilePath) {
            cleanupTempFiles(uploadedFilePath);
        }

        res.status(500).json({
            success: false,
            error: 'Conversion failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Download converted file endpoint with enhanced security
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid filename',
            message: 'Filename contains invalid characters'
        });
    }
    
    const filePath = path.join(outputsDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: 'File not found',
            message: 'The requested file does not exist'
        });
    }

    // Check if file is a DOCX file
    if (!filename.toLowerCase().endsWith('.docx')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid file type',
            message: 'Only DOCX files can be downloaded'
        });
    }

    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(500).json({
                success: false,
                error: 'Download failed',
                message: err.message
            });
        }
    });
});

// List converted files endpoint with pagination
app.get('/files', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const files = fs.readdirSync(outputsDir)
            .filter(file => file.endsWith('.docx'))
            .map(file => {
                const filePath = path.join(outputsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    downloadUrl: `/download/${file}`
                };
            })
            .sort((a, b) => b.created - a.created);

        const totalFiles = files.length;
        const paginatedFiles = files.slice(offset, offset + limit);

        res.json({
            success: true,
            data: {
                files: paginatedFiles,
                pagination: {
                    page,
                    limit,
                    total: totalFiles,
                    pages: Math.ceil(totalFiles / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to list files',
            message: error.message
        });
    }
});

// Delete converted file endpoint with enhanced security
app.delete('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid filename',
            message: 'Filename contains invalid characters'
        });
    }
    
    const filePath = path.join(outputsDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: 'File not found',
            message: 'The requested file does not exist'
        });
    }

    // Check if file is a DOCX file
    if (!filename.toLowerCase().endsWith('.docx')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid file type',
            message: 'Only DOCX files can be deleted'
        });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({
            success: true,
            message: `File ${filename} deleted successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete file',
            message: error.message
        });
    }
});

// Cleanup endpoint to remove old files
app.post('/cleanup', (req, res) => {
    try {
        const maxAge = req.body.maxAge || 24 * 60 * 60 * 1000; // Default: 24 hours
        const cutoffTime = Date.now() - maxAge;
        
        const files = fs.readdirSync(outputsDir)
            .filter(file => file.endsWith('.docx'))
            .map(file => {
                const filePath = path.join(outputsDir, file);
                const stats = fs.statSync(filePath);
                return { filename: file, path: filePath, created: stats.birthtime };
            })
            .filter(file => file.created.getTime() < cutoffTime);
        
        let deletedCount = 0;
        files.forEach(file => {
            try {
                fs.unlinkSync(file.path);
                deletedCount++;
            } catch (error) {
                console.error(`Failed to delete ${file.filename}:`, error);
            }
        });
        
        res.json({
            success: true,
            message: `Cleaned up ${deletedCount} old files`,
            deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Cleanup failed',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                message: 'File size must be less than 50MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files',
                message: 'Only one file can be uploaded at a time'
            });
        }
    }
    
    console.error('API Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.originalUrl} does not exist`,
        availableEndpoints: [
            'GET /health',
            'POST /convert',
            'GET /download/:filename',
            'GET /files',
            'DELETE /files/:filename',
            'POST /cleanup'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 PDF to DOCX API server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`📁 Outputs directory: ${outputsDir}`);
    console.log(`🌍 Location: Bhopal, India`);
});
