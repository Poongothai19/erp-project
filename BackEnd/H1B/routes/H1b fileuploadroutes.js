// ============================================
// H1B FILE UPLOAD HANDLER
// ============================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// ✅ Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/h1b');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp_originalname
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, fileExt);
    cb(null, `${fileName}_${uniqueSuffix}${fileExt}`);
  }
});

// ✅ File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt'];

  const fileExt = path.extname(file.originalname).toLowerCase();
  const mimeOk = allowedMimes.includes(file.mimetype);
  const extOk = allowedExtensions.includes(fileExt);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed: PDF, JPG, PNG, DOC, DOCX, TXT`), false);
  }
};

// ✅ Configure multer with limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
});

// ============================================
// ROUTES
// ============================================

// ✅ Upload single file endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Return file info
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        size: req.file.size,
        path: `/uploads/h1b/${req.file.filename}`,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: `Upload failed: ${error.message}`
    });
  }
});

// ✅ Upload multiple files endpoint
router.post('/upload-multiple', upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      fileName: file.filename,
      size: file.size,
      path: `/uploads/h1b/${file.filename}`,
      mimeType: file.mimetype,
      uploadedAt: new Date()
    }));

    return res.status(200).json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    return res.status(500).json({
      success: false,
      message: `Upload failed: ${error.message}`
    });
  }
});

// ✅ Delete file endpoint
router.post('/delete/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../uploads/h1b', fileName);

    // Security: prevent directory traversal
    const realPath = path.resolve(filePath);
    const uploadDir = path.resolve(path.join(__dirname, '../uploads/h1b'));
    
    if (!realPath.startsWith(uploadDir)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('File delete error:', error);
    return res.status(500).json({
      success: false,
      message: `Delete failed: ${error.message}`
    });
  }
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 50MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }

  next();
});

module.exports = router;