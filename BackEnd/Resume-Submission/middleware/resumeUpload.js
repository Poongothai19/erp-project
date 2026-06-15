const multer = require('multer');
const path = require('path');

// Use memory storage instead of disk storage
// Files will be stored in req.file.buffer as binary data
const storage = multer.memoryStorage();

// File filter configuration
const fileFilter = (req, file, cb) => {
  console.log('File filter called with:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    console.log('✅ File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ File rejected:', file.originalname, 'Type:', file.mimetype);
    cb(new Error(`Invalid file type. Only PDF, Word, and image documents are allowed. Received: ${file.mimetype}`), false);
  }
};

// Build dynamic fields array: ResumeUpload (1) + up to 10 additional docs
const buildFieldsArray = () => {
  const fields = [{ name: 'ResumeUpload', maxCount: 1 }];
  for (let i = 0; i < 10; i++) {
    fields.push({ name: `AdditionalDoc_${i}`, maxCount: 1 });
  }
  return fields;
};

// Create multer instance with memory storage
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 11 // 1 resume + up to 10 additional docs
  }
});

// Enhanced middleware with better error handling — uses fields() so it
// accepts both 'ResumeUpload' and 'AdditionalDoc_N' in the same request
const singleUploadWithErrorHandling = (req, res, next) => {
  console.log('=== Multer Middleware Called ===');
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);

  const fieldsUpload = upload.fields(buildFieldsArray());
  
  fieldsUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      
      let errorMessage = 'File upload error';
      let details = err.message;
      
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          errorMessage = 'File too large';
          details = 'File size must be less than 10MB';
          break;
        case 'LIMIT_FILE_COUNT':
          errorMessage = 'Too many files';
          details = 'Maximum 11 files allowed (1 resume + 10 additional documents)';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          errorMessage = 'Unexpected field';
          details = 'File field name must be "ResumeUpload" or "AdditionalDoc_N"';
          break;
        case 'LIMIT_PART_COUNT':
          errorMessage = 'Too many parts';
          details = 'Form has too many parts';
          break;
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: details
      });
    } else if (err) {
      console.error('Upload Error:', err.message);
      return res.status(400).json({
        success: false,
        error: 'File upload failed',
        details: err.message
      });
    }
    
    // Attach req.file alias for backward-compat (points to the primary resume if present)
    if (req.files && req.files['ResumeUpload'] && req.files['ResumeUpload'][0]) {
      req.file = req.files['ResumeUpload'][0];
      console.log('Primary resume upload successful:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer.length,
        isBuffer: Buffer.isBuffer(req.file.buffer)
      });
    } else {
      req.file = null;
      console.log('No primary resume file uploaded in this request');
    }

    // Log additional docs
    for (let i = 0; i < 10; i++) {
      const key = `AdditionalDoc_${i}`;
      if (req.files && req.files[key] && req.files[key][0]) {
        console.log(`Additional document ${i} uploaded:`, req.files[key][0].originalname);
      }
    }
    
    next();
  });
};

// Alternative middleware that makes file optional for updates
const optionalFileUpload = (req, res, next) => {
  console.log('=== Optional File Upload Middleware ===');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.get('Content-Type'));
  
  // If it's not multipart/form-data, skip file processing
  if (!req.get('Content-Type') || !req.get('Content-Type').includes('multipart/form-data')) {
    console.log('Not multipart/form-data, skipping file upload');
    return next();
  }
  
  return singleUploadWithErrorHandling(req, res, next);
};

// Export methods
module.exports = {
  single: singleUploadWithErrorHandling,
  optional: optionalFileUpload,
  upload: upload
};