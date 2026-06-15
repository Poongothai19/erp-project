// h1bRoutes.js
const express = require('express');
const router = express.Router();
const h1bController = require('../Controllers/h1bController');
const multer = require('multer');

// ✅ Configure multer for memory storage (for S3 upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Public Routes
router.post('/submissions', h1bController.createSubmissionPublic);

// Protected Routes (add your auth middleware here)
router.get('/submissions', h1bController.getAllSubmissions);
router.get('/submissions/:id', h1bController.getSubmissionById);
router.put('/submissions/:id', h1bController.updateSubmission);
router.get('/statistics', h1bController.getStatistics);

// ✅ New S3 File Upload/Download Routes
router.post('/upload', upload.single('file'), h1bController.uploadFile);
router.get('/download/:s3Key', h1bController.downloadFile);
router.delete('/file/:s3Key', h1bController.deleteFile);
router.get('/file/info/:s3Key', h1bController.getFileInfo);

module.exports = router;