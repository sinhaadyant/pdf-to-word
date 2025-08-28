/**
 * PDF to DOCX Converter utilities
 * Handles the conversion process using pdf2docx Python library
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { 
    TIMING, 
    PATHS, 
    ERROR_MESSAGES 
} = require('../constants');

/**
 * Converts a PDF file to DOCX format
 * @param {string} pdfPath - Path to the input PDF file
 * @param {string} docxPath - Path for the output DOCX file
 * @returns {Promise<string>} Promise that resolves with conversion output
 */
function convertPdfToDocx(pdfPath, docxPath) {
    return new Promise((resolve, reject) => {
        // Validate input file exists
        if (!fs.existsSync(pdfPath)) {
            return reject(new Error(ERROR_MESSAGES.INPUT_FILE_NOT_FOUND));
        }
        
        // Check if input file is readable
        try {
            fs.accessSync(pdfPath, fs.constants.R_OK);
        } catch (error) {
            return reject(new Error(ERROR_MESSAGES.INPUT_FILE_NOT_READABLE));
        }
        
        // Prepare Python command
        const pythonArgs = [
            PATHS.PYTHON_SCRIPT,
            PATHS.PYTHON_PACKAGE,
            PATHS.PYTHON_COMMAND,
            pdfPath,
            docxPath
        ];
        
        const pythonProcess = spawn(PATHS.PYTHON_MODULE, pythonArgs);

        let stdout = '';
        let stderr = '';
        let timeoutId;

        // Set timeout for conversion
        timeoutId = setTimeout(() => {
            pythonProcess.kill('SIGTERM');
            reject(new Error(ERROR_MESSAGES.CONVERSION_TIMEOUT));
        }, TIMING.CONVERSION_TIMEOUT);

        // Handle stdout
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        // Handle stderr
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            
            if (code === 0) {
                // Verify output file was created
                if (!fs.existsSync(docxPath)) {
                    reject(new Error(ERROR_MESSAGES.OUTPUT_FILE_NOT_CREATED));
                    return;
                }
                
                // Check if output file has content
                const stats = fs.statSync(docxPath);
                if (stats.size === 0) {
                    reject(new Error(ERROR_MESSAGES.OUTPUT_FILE_EMPTY));
                    return;
                }
                
                resolve(stdout);
            } else {
                reject(new Error(ERROR_MESSAGES.PYTHON_PROCESS_ERROR(code, stderr)));
            }
        });

        // Handle process errors
        pythonProcess.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(new Error(ERROR_MESSAGES.PYTHON_START_FAILED(error.message)));
        });
    });
}

/**
 * Validates that Python and pdf2docx are available
 * @returns {Promise<boolean>} Promise that resolves to true if available
 */
function validatePythonEnvironment() {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn(PATHS.PYTHON_MODULE, [
            PATHS.PYTHON_SCRIPT,
            PATHS.PYTHON_PACKAGE,
            '--version'
        ]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                reject(new Error(`pdf2docx not available: ${stderr}`));
            }
        });

        pythonProcess.on('error', (error) => {
            reject(new Error(`Python not available: ${error.message}`));
        });
    });
}

/**
 * Gets file information (size, creation date, etc.)
 * @param {string} filePath - Path to the file
 * @returns {Object} File information object
 */
function getFileInfo(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return {
            size: stats.size,
            sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
            created: stats.birthtime,
            modified: stats.mtime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        };
    } catch (error) {
        throw new Error(`Failed to get file info: ${error.message}`);
    }
}

/**
 * Checks if a file exists and is readable
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if file exists and is readable
 */
function isFileReadable(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.R_OK);
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param {string} dirPath - Directory path
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

module.exports = {
    convertPdfToDocx,
    validatePythonEnvironment,
    getFileInfo,
    isFileReadable,
    ensureDirectoryExists
};
