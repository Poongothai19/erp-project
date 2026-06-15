// middleware/validationMiddleware.js

// Validate candidate data
const validateCandidate = (req, res, next) => {
  const { name, email, phone, skills, experience, location, availability, visaStatus } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.push('Valid email is required');
  }

  if (!phone || phone.trim().length < 10) {
    errors.push('Valid phone number is required');
  }

  if (!skills || (Array.isArray(skills) ? skills.length === 0 : skills.trim().length === 0)) {
    errors.push('At least one skill is required');
  }

  if (!experience || isNaN(experience) || experience < 0) {
    errors.push('Valid experience (years) is required');
  }

  if (!location || location.trim().length < 2) {
    errors.push('Location is required');
  }

  if (!availability) {
    errors.push('Availability is required');
  }

  if (!visaStatus) {
    errors.push('Visa status is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

// Validate requirement data
const validateRequirement = (req, res, next) => {
  const { jobTitle, skills, client, location, rate, duration, experience, jobType } = req.body;
  const errors = [];

  if (!jobTitle || jobTitle.trim().length < 2) {
    errors.push('Job title is required');
  }

  if (!skills || (Array.isArray(skills) ? skills.length === 0 : skills.trim().length === 0)) {
    errors.push('At least one skill is required');
  }

  if (!client || client.trim().length < 2) {
    errors.push('Client/Vendor is required');
  }

  if (!location || location.trim().length < 2) {
    errors.push('Location is required');
  }

  if (!rate || rate.trim().length < 1) {
    errors.push('Rate/Salary is required');
  }

  if (!duration) {
    errors.push('Duration is required');
  }

  if (!experience) {
    errors.push('Experience requirement is required');
  }

  if (!jobType) {
    errors.push('Job type is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

// Validate submission data
const validateSubmission = (req, res, next) => {
  const { candidateId, requirementId, vendorId } = req.body;
  const errors = [];

  if (!candidateId || isNaN(candidateId)) {
    errors.push('Valid candidate ID is required');
  }

  if (!requirementId || isNaN(requirementId)) {
    errors.push('Valid requirement ID is required');
  }

  if (!vendorId || isNaN(vendorId)) {
    errors.push('Valid vendor ID is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

// Validate vendor data
const validateVendor = (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Vendor name is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

module.exports = {
  validateCandidate,
  validateRequirement,
  validateSubmission,
  validateVendor
};