// middleWare/hotlistValidationMiddleware.js - SIMPLIFIED FIXED VERSION

const validateHotlistCandidate = (req, res, next) => {
  const { fullName, role, exp, state, relocation, visa, priority } = req.body;
  const errors = [];

  console.log('🔍 Single Validation - Input:', req.body);

  // Required field validation - only fullName is required
  if (!fullName || (typeof fullName === 'string' && !fullName.trim())) {
    errors.push('Full Name is required');
  }

  if (errors.length > 0) {
    console.error('❌ Single Validation Errors:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  // Sanitize and format data
  req.body.fullName = fullName ? String(fullName).trim() : '';
  req.body.role = role ? String(role).trim() : '';
  req.body.exp = exp ? String(exp).trim() : '';
  req.body.state = state ? String(state).trim() : '';
  req.body.relocation = relocation ? String(relocation).trim() : '';
  req.body.visa = visa ? String(visa).trim() : '';
  req.body.priority = priority ? String(priority).trim() : 'Medium';
  
  console.log('✅ Single Validation - Sanitized:', req.body);
  next();
};

// FIXED: Bulk validation - simplified and working
const validateBulkHotlistCandidates = (req, res, next) => {
  try {
    const { candidates } = req.body;

    console.log('🔍 Bulk Validation - Received candidates:', candidates?.length);

    if (!Array.isArray(candidates)) {
      console.error('❌ Bulk Validation Error: Candidates is not an array');
      return res.status(400).json({
        success: false,
        message: 'Candidates must be an array'
      });
    }

    if (candidates.length === 0) {
      console.error('❌ Bulk Validation Error: Empty candidates array');
      return res.status(400).json({
        success: false,
        message: 'At least one candidate is required'
      });
    }

    // First pass: Validate each candidate has fullName
    const validationErrors = [];
    candidates.forEach((candidate, index) => {
      const fullName = candidate.fullName ? String(candidate.fullName).trim() : '';
      if (!fullName) {
        validationErrors.push(`Candidate ${index + 1}: Full Name is required`);
      }
    });

    if (validationErrors.length > 0) {
      console.error('❌ Bulk Validation Errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Bulk validation failed',
        errors: validationErrors
      });
    }

    // Second pass: Sanitize all candidates
    const sanitizedCandidates = candidates.map((candidate, index) => {
      try {
        const sanitized = {
          fullName: candidate.fullName ? String(candidate.fullName).trim() : '',
          role: candidate.role ? String(candidate.role).trim() : '',
          exp: candidate.exp ? String(candidate.exp).trim() : '',
          state: candidate.state ? String(candidate.state).trim() : '',
          relocation: candidate.relocation ? String(candidate.relocation).trim() : '',
          visa: candidate.visa ? String(candidate.visa).trim() : '',
          priority: candidate.priority ? String(candidate.priority).trim() : 'Medium'
        };

        // Ensure fullName is not empty
        if (!sanitized.fullName || sanitized.fullName === '') {
          throw new Error(`Candidate ${index + 1}: Full Name cannot be empty`);
        }

        return sanitized;
      } catch (error) {
        throw new Error(`Candidate ${index + 1}: ${error.message}`);
      }
    });

    req.body.candidates = sanitizedCandidates;

    console.log('✅ Bulk Validation - Sanitized candidates:', sanitizedCandidates.length);
    console.log('✅ First candidate sample:', sanitizedCandidates[0]);
    
    next();

  } catch (error) {
    console.error('❌ Bulk Validation Exception:', error.message);
    return res.status(400).json({
      success: false,
      message: 'Bulk validation failed: ' + error.message,
      errors: [error.message]
    });
  }
};

module.exports = {
  validateHotlistCandidate,
  validateBulkHotlistCandidates
};