// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created upload directory:', uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('📁 Setting upload destination:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `resume_${uniqueSuffix}${ext}`;
    
    console.log('📝 Generated filename:', filename);
    console.log('📝 Original filename:', file.originalname);
    
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('🔍 Checking file type:', file.mimetype);
  console.log('📁 File details:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Allow only specific file types
  const allowedMimes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    console.log('✅ File type accepted:', file.mimetype);
    cb(null, true);
  } else {
    console.log('❌ File type rejected:', file.mimetype);
    const error = new Error('Only PDF, DOC, and DOCX files are allowed');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  console.error('📤 Upload error:', err);
  
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file is allowed.',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "resume" as the field name.',
          error: 'UNEXPECTED_FIELD'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + err.message,
          error: err.code
        });
    }
  }
  
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  // Generic error
  return res.status(500).json({
    success: false,
    message: 'Internal server error during file upload',
    error: err.message
  });
};

module.exports = {
  upload,
  handleUploadError
};