const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const resumeController = require('../controllers/resumeController');
const { single } = require('../middleware/resumeUpload');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// CORS middleware specifically for file serving endpoints
const corsForFiles = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
};

// Enhanced authentication middleware that supports both header and URL token
const authenticateTokenFlexible = (req, res, next) => {
  console.log('=== Authentication Check ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Query params:', req.query);

  // First try the standard Authorization header
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  
  // Then try URL token parameter (for file serving when headers can't be easily set)
  const urlToken = req.query.token;
  
  const token = headerToken || urlToken;
  
  console.log('Header token:', headerToken ? 'Present' : 'Not found');
  console.log('URL token:', urlToken ? 'Present' : 'Not found');
  console.log('Using token:', token ? 'Present' : 'Not found');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required',
      details: 'Please provide authentication token in Authorization header or as URL parameter'
    });
  }

  try {
    // Verify the token (make sure you have the correct JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified for user:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token',
      details: err.message
    });
  }
};

// Test endpoint to check table structure (for debugging)
router.get("/debug/table-structure", authenticateToken, resumeController.testTableStructure);

// IMPORTANT: Specific routes MUST come before parameterized routes
// File serving endpoints - these must come before /:id route

// Get all documents for a candidate
router.get("/:id/documents", authenticateToken, resumeController.getCandidateDocuments);

// File info endpoint - uses standard auth
router.get("/:id/file-info", authenticateToken, resumeController.getResumeFileInfo);

// Download endpoint - uses flexible auth and CORS
router.get("/:id/download", corsForFiles, authenticateTokenFlexible, resumeController.downloadResume);

// Preview endpoint - uses flexible auth and CORS (this is the key one for PDF viewing)
router.get("/:id/preview", corsForFiles, authenticateTokenFlexible, resumeController.previewResume);

// Get all resumes - this must come before /:id route
router.get("/", authenticateToken, resumeController.getAllResumes);

// Share resume via SendGrid
router.post("/share", authenticateToken, resumeController.shareResume);

// Schedule Interview via SendGrid
router.post("/schedule-interview", authenticateToken, resumeController.scheduleInterview);

// Upload new resume - Auth first, then file upload
router.post("/", authenticateToken, single, resumeController.createResume);

// Update existing resume - Auth first, then optional file upload
router.put("/:id", authenticateToken, single, resumeController.updateResume);

// Delete resume
router.delete("/:id", authenticateToken, resumeController.deleteResume);

// Get single resume by ID - this must come LAST among /:id routes
router.get("/:id", authenticateToken, resumeController.getResumeById);

// OPTIONS handler for CORS preflight requests
router.options("/:id/download", corsForFiles);
router.options("/:id/preview", corsForFiles);
router.options("/:id/documents", corsForFiles);

// ── PROXY: Parse Resume via FastAPI ──────────────────────────────────────────
// The browser can't call the external FastAPI server directly (CORS/network),
// so we proxy through Express. Using axios for reliable multipart forwarding.
const multer = require('multer');
const parseUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const axios = require('axios');
const FormDataNode = require('form-data');

const FASTAPI_URL = process.env.RESUME_PARSER_URL || 'http://66.179.82.107:8001';

router.post("/parse", authenticateToken, parseUpload.single('file1'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Send a file as "file1".' });
    }

    console.log(`📄 Proxying resume parse: ${req.file.originalname} (${req.file.size} bytes)`);

    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Create a FRESH form for each attempt (streams are consumed once)
        const form = new FormDataNode();
        form.append('file1', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });

        const http = require('http');
        const response = await axios.post(`${FASTAPI_URL}/extract-resume`, form, {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 300000,       // 5 min timeout for AI parsing
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          // Force a fresh connection each time (no keep-alive reuse)
          httpAgent: new http.Agent({ keepAlive: false }),
        });

        console.log(`✅ Resume parsed successfully (attempt ${attempt})`);
        return res.status(200).json(response.data);
      } catch (retryErr) {
        lastError = retryErr;
        const isRetryable = retryErr.code === 'ECONNRESET' ||
                            retryErr.code === 'EPIPE' ||
                            retryErr.code === 'ECONNREFUSED' ||
                            retryErr.message?.includes('socket hang up') ||
                            retryErr.message?.includes('ECONNRESET');
        if (isRetryable && attempt < MAX_RETRIES) {
          console.log(`⚠️ Attempt ${attempt} failed (${retryErr.message}), retrying in 2s...`);
          await new Promise(r => setTimeout(r, 2000));
        } else {
          break;
        }
      }
    }

    // All retries failed
    if (lastError.response) {
      console.error(`❌ FastAPI error ${lastError.response.status}:`, JSON.stringify(lastError.response.data).substring(0, 200));
      res.status(lastError.response.status).json(lastError.response.data);
    } else if (lastError.code === 'ECONNABORTED') {
      console.error('❌ FastAPI proxy timeout');
      res.status(504).json({ error: 'Resume parser timed out. The AI is processing — please try again.' });
    } else {
      console.error(`❌ FastAPI proxy error after ${MAX_RETRIES} attempts:`, lastError.message);
      res.status(502).json({ error: `Resume parser error: ${lastError.message}` });
    }
  } catch (err) {
    console.error('❌ Parse proxy unexpected error:', err);
    res.status(500).json({ error: 'Failed to proxy resume parsing request' });
  }
});

// ── PROXY: AI Search via FastAPI (Port 9001) ────────────────────────────────
const SEARCH_AI_URL = process.env.SEARCH_AI_URL || 'http://65.38.99.253:9001';

router.post("/search", authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`🔍 Proxying AI Search: "${query}"`);

    const response = await axios.post(`${SEARCH_AI_URL}/search`, 
      { query }, 
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 1 min timeout
      }
    );

    console.log(`✅ AI Search results returned: ${response.data?.results?.length || 0} hits`);
    return res.status(200).json(response.data);
  } catch (err) {
    if (err.response) {
      console.error(`❌ AI Search error ${err.response.status}:`, err.response.data);
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error('❌ AI Search proxy error:', err.message);
      res.status(502).json({ error: 'AI Search service is unreachable' });
    }
  }
});

// ── PROXY: AI Chat via FastAPI (Port 9000) ──────────────────────────────────
// Keeping this as HTTP as per your request
const CHAT_AI_URL = process.env.CHAT_AI_URL || 'http://65.38.99.253:9000';

router.post("/chat", authenticateToken, async (req, res) => {
  try {
    const { question, session_id } = req.body;
    
    console.log(`💬 Proxying AI Chat request: "${question?.substring(0, 50)}..."`);

    const response = await axios.post(`${CHAT_AI_URL}/chat`, 
      { question, session_id }, 
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000 // 1.5 min timeout
      }
    );

    console.log(`✅ AI Chat response received`);
    return res.status(200).json(response.data);
  } catch (err) {
    if (err.response) {
      console.error(`❌ AI Chat error ${err.response.status}:`, err.response.data);
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error('❌ AI Chat proxy error:', err.message);
      res.status(502).json({ error: 'AI Chat service is unreachable' });
    }
  }
});

module.exports = router;
