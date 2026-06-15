const express = require('express');
const router = express.Router();

console.log('🔧 [ATS-ROUTES] Starting initialization...');

let atsController;
let upload;
let scoreResumeWithGroq;
let extractResumeText;

// Load ATS Controller
try {
  const atsModule = require('../controllers/atsController');
  atsController = atsModule.atsController;
  upload = atsModule.upload;
  scoreResumeWithGroq = atsModule.scoreResumeWithGroq;
  extractResumeText = atsModule.extractResumeText;
  console.log('✅ [ATS-ROUTES] Controller loaded successfully');
} catch (error) {
  console.error('❌ [ATS-ROUTES] Failed to load controller:', error.message);
  throw error;
}

console.log('📋 [ATS-ROUTES] JWT Authentication DISABLED - All routes are PUBLIC');

// ============================================
// ALL ROUTES ARE PUBLIC (No Authentication)
// ============================================

// 1️⃣ Submit application - PUBLIC
router.post('/apply', (req, res, next) => {
  console.log('📝 [ATS-ROUTE] POST /apply received');
  next();
}, upload.single('resume'), (req, res, next) => {
  console.log('📎 [ATS-ROUTE] File uploaded:', req.file?.filename || 'No file');
  next();
}, async (req, res) => {
  try {
    console.log('🎯 [ATS-ROUTE] Calling createApplicant controller');
    await atsController.createApplicant(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] createApplicant error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error in createApplicant',
      error: error.message
    });
  }
});

console.log('✅ Route registered: POST /api/ats/apply');

// 2️⃣ Get all applicants - PUBLIC
router.get('/applicants', async (req, res) => {
  try {
    console.log('📋 [ATS-ROUTE] GET /applicants');
    await atsController.getAllApplicants(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] getAllApplicants error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching applicants',
      error: error.message
    });
  }
});

console.log('✅ Route registered: GET /api/ats/applicants');

// 3️⃣ Get statistics - PUBLIC
router.get('/statistics/dashboard', async (req, res) => {
  try {
    console.log('📊 [ATS-ROUTE] GET /statistics/dashboard');
    await atsController.getStatistics(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] getStatistics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

console.log('✅ Route registered: GET /api/ats/statistics/dashboard');

// 4️⃣ Download resume - PUBLIC
router.get('/download-resume/:id', async (req, res) => {
  try {
    console.log('📥 [ATS-ROUTE] GET /download-resume/:id - Applicant ID:', req.params.id);
    await atsController.downloadResume(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] downloadResume error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error downloading resume',
      error: error.message
    });
  }
});

console.log('✅ Route registered: GET /api/ats/download-resume/:id');

// 5️⃣ Get applicants by position - PUBLIC
router.get('/position/:position', async (req, res) => {
  try {
    console.log('🎯 [ATS-ROUTE] GET /position/:position - Position:', req.params.position);
    await atsController.getApplicantsByPosition(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] getApplicantsByPosition error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching applicants by position',
      error: error.message
    });
  }
});

console.log('✅ Route registered: GET /api/ats/position/:position');

// 6️⃣ Get applicant by ID - PUBLIC
router.get('/:id', async (req, res) => {
  try {
    console.log('👤 [ATS-ROUTE] GET /:id - Applicant ID:', req.params.id);
    await atsController.getApplicantById(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] getApplicantById error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching applicant',
      error: error.message
    });
  }
});

console.log('✅ Route registered: GET /api/ats/:id');

// 7️⃣ Update applicant - PUBLIC
router.put('/:id', async (req, res) => {
  try {
    console.log('✏️  [ATS-ROUTE] PUT /:id - Applicant ID:', req.params.id);
    await atsController.updateApplicant(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] updateApplicant error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating applicant',
      error: error.message
    });
  }
});

console.log('✅ Route registered: PUT /api/ats/:id');

// 8️⃣ Delete applicant - PUBLIC
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️  [ATS-ROUTE] DELETE /:id - Applicant ID:', req.params.id);
    await atsController.deleteApplicant(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] deleteApplicant error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting applicant',
      error: error.message
    });
  }
});

console.log('✅ Route registered: DELETE /api/ats/:id');

// 9️⃣ Score resume with AI - PUBLIC
router.post('/score-resume', async (req, res) => {
  try {
    console.log('🎯 [ATS-ROUTE] POST /score-resume');
    console.log('Request body:', { 
      applicantId: req.body.applicantId,
      jobDescLength: req.body.jobDescription?.length 
    });
    await atsController.scoreResume(req, res);
  } catch (error) {
    console.error('❌ [ATS-ROUTE] scoreResume error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error scoring resume',
      error: error.message
    });
  }
});

console.log('✅ Route registered: POST /api/ats/score-resume');

// Note: Job descriptions are fetched from /api/recruitment/public/roles
// No need for separate /api/ats/jobs/:id endpoint

// ============================================
// Error handler for this router
// ============================================

router.use((error, req, res, next) => {
  console.error('❌ [ATS-ERROR] Unhandled error in ATS routes:');
  console.error('   Path:', req.method, req.path);
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  
  res.status(error.status || 500).json({
    success: false,
    message: 'Internal server error in ATS module',
    error: error.message,
    path: req.path,
    method: req.method
  });
});

console.log('\n✅ [ATS-ROUTES] All routes configured successfully');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 ATS Routes Summary (ALL PUBLIC - NO AUTH):');
console.log('   ✓ POST   /api/ats/apply');
console.log('   ✓ GET    /api/ats/applicants');
console.log('   ✓ GET    /api/ats/statistics/dashboard');
console.log('   ✓ GET    /api/ats/download-resume/:id');
console.log('   ✓ GET    /api/ats/position/:position');
console.log('   ✓ GET    /api/ats/:id');
console.log('   ✓ PUT    /api/ats/:id');
console.log('   ✓ DELETE /api/ats/:id');
console.log('   ✓ POST   /api/ats/score-resume (AI SCORING)');
console.log('   ✓ GET    /api/ats/jobs/:id (NEW - AUTO SCORE)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

module.exports = router;