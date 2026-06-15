const { poolPromise, sql } = require("../../config/db");
const path = require("path");
const fs = require('fs');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');
const https = require('https');
const AWS = require('aws-sdk');

// ============================================
// AWS S3 CONFIGURATION
// ============================================
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const S3_BUCKET = process.env.AWS_BUCKET_NAME || 'prophecy-erp';

const RESUME_S3_FOLDER = 'recruitment/resumes/';

/**
 * Helper to upload file buffer to S3
 */
const uploadToS3 = async (fileBuffer, originalName, mimeType) => {
  try {
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const s3Key = `${RESUME_S3_FOLDER}${timestamp}_${cleanFileName}`;

    console.log(`ðŸ“¡ Uploading to S3: ${S3_BUCKET}/${s3Key}`);

    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
    };

    const result = await s3.upload(params).promise();
    return { success: true, s3Key, s3Url: result.Location };
  } catch (err) {
    console.error('âŒ S3 upload error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Helper to fetch file buffer from DB or S3
 */
const getDocumentFileBuffer = async (doc) => {
  // 1. Try Database first if ResumeFileData is present
  if (doc.ResumeFileData) {
    return Buffer.from(doc.ResumeFileData);
  }

  // 2. Try S3 if StorageProvider is AWS/S3 and StorageLocator is present
  const provider = (doc.StorageProvider || '').toUpperCase();
  if ((provider === 'AWS' || provider === 'S3') && doc.StorageLocator) {
    try {
      console.log(`ðŸ“¡ Fetching file from S3 bucket: ${S3_BUCKET}, key: ${doc.StorageLocator}`);
      const params = { Bucket: S3_BUCKET, Key: doc.StorageLocator };
      const s3Object = await s3.getObject(params).promise();
      return s3Object.Body;
    } catch (err) {
      console.error('âŒ S3 fetch error:', err.message);
      throw new Error(`Failed to fetch file from S3: ${err.message}`);
    }
  }

  return null;
};


// ============================================
// NAME FORMATTING FUNCTIONS
// ============================================
/**
 * Format a name to proper case while preserving initials
 * Examples:
 * - "META SHANKAR" -> "Meta Shankar"
 * - "BECKY B PAREDES" -> "Becky B Paredes" (preserves middle initial)
 * - "JOHN SMITH" -> "John Smith"
 * - "JOHN D. SMITH" -> "John D. Smith" (preserves initial with dot)
 * - "SENIOR ENGINEER" -> "Senior Engineer" (for job titles)
 * 
 * @param {string} name - The name to format
 * @returns {string} Formatted name
 */
const formatName = (name) => {
  if (!name || typeof name !== 'string') return name || '';

  const trimmed = name.trim();
  if (!trimmed) return '';

  // Split while preserving hyphens and spaces
  const words = trimmed.split(/([-\s])/);

  return words.map(word => {
    // Preserve separators (spaces and hyphens)
    if (word === ' ' || word === '-') return word;
    if (!word) return '';

    // Check if the word is a single letter (initial) or a single letter with dot
    if (/^[A-Za-z]\.?$/.test(word)) {
      // It's an initial - keep it uppercase
      return word.toUpperCase();
    }

    const lowerWord = word.toLowerCase();

    // Handle special prefixes
    if (lowerWord.startsWith('mc')) {
      return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
    }
    if (lowerWord.startsWith("o'")) {
      return "O'" + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
    }
    if (lowerWord.startsWith("mac")) {
      return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
    }

    // Handle roman numerals (II, III, IV, etc.) - keep them uppercase
    if (/^(II|III|IV|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)$/i.test(word)) {
      return word.toUpperCase();
    }

    // Handle common abbreviations (PhD, MD, etc.) - keep them uppercase
    const abbreviations = ['phd', 'md', 'jd', 'dds', 'dvm', 'rn', 'lpn', 'cpa', 'cfa', 'pe', 'ra', 'aia'];
    if (abbreviations.includes(lowerWord)) {
      return word.toUpperCase();
    }

    // Handle words with dots (like "J.R.R." or "Ph.D.")
    if (word.includes('.')) {
      return word.split('.').map(part => {
        if (!part) return '';
        // If the part is a single letter, keep it uppercase
        if (part.length === 1) {
          return part.toUpperCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join('.');
    }

    // Default: capitalize first letter, lowercase the rest
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
};

/**
 * Format job title (should convert ALL CAPS to proper case)
 * Examples:
 * - "SENIOR SOFTWARE ENGINEER" -> "Senior Software Engineer"
 * - "LEAD JAVA FULL STACK DEV" -> "Lead Java Full Stack Dev"
 * - "PYTHON LEAD ENGINEER" -> "Python Lead Engineer"
 * 
 * @param {string} title - Job title to format
 * @returns {string} Formatted job title
 */
const formatJobTitle = (title) => {
  if (!title) return '';

  // Split by common delimiters but preserve them
  const words = title.split(/([-\s/])/);

  return words.map(word => {
    if (word === ' ' || word === '-' || word === '/') return word;
    if (!word) return '';

    // Special case for acronyms (keep uppercase if 2+ letters and all caps)
    if (/^[A-Z]{2,}$/.test(word)) return word;

    // Special case for single letters (like "B" in "Becky B Paredes") - but this shouldn't happen in job titles
    if (/^[A-Za-z]\.?$/.test(word)) {
      return word.toUpperCase();
    }

    // Special case for words that should remain lowercase (like "and", "or", "of", "the")
    const lowerWord = word.toLowerCase();
    const keepLowercase = ['and', 'or', 'of', 'the', 'in', 'at', 'on', 'for', 'to', 'with'];
    if (keepLowercase.includes(lowerWord) && word.length > 1) {
      return lowerWord;
    }

    // For job titles, we want to capitalize first letter and lowercase the rest
    // but handle special cases like "DevOps" (keep the capital O)
    if (lowerWord === 'devops') return 'DevOps';
    if (lowerWord === 'ios') return 'iOS';
    if (lowerWord === 'android') return 'Android';
    if (lowerWord === 'ui' || lowerWord === 'ux') return word.toUpperCase();

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const getUsernameFromRequest = (req) => {
  if (req.user) {
    return req.user.username || req.user.name || req.user.email ||
      req.user.Username || req.user.Name || req.user.Email || 'Unknown User';
  }
  return 'Unknown User';
};

// Convert DOC/DOCX buffer to HTML for preview
const convertDocumentToHtml = async (buffer, fileType) => {
  try {
    // DOCX files â€” use mammoth (XML-based format)
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.convertToHtml({ buffer });
      return { success: true, html: result.value, messages: result.messages };
    }
    // DOC files â€” use word-extractor (old binary format, mammoth does NOT support .doc)
    if (fileType === 'application/msword') {
      const extractor = new WordExtractor();
      const doc = await extractor.extract(buffer);
      const body = doc.getBody() || '';
      // Convert plain text to HTML, preserving paragraphs and basic formatting
      const htmlBody = body
        .split(/\n\n+/)  // split on double newlines (paragraphs)
        .filter(p => p.trim())
        .map(paragraph => {
          // Preserve single line breaks within paragraphs
          const escaped = paragraph
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');
          return `<p>${escaped}</p>`;
        })
        .join('\n');
      return { success: true, html: htmlBody, messages: [] };
    }
    return { success: false, error: 'Unsupported document type' };
  } catch (error) {
    console.error('Document conversion error:', error);
    return { success: false, error: error.message };
  }
};

// â”€â”€â”€ GET ALL CANDIDATES (list view) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getAllResumes = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        c.CandidateId,
        c.CandidateCode,
        c.FirstName,
        c.MiddleName,
        c.LastName,
        c.DateOfBirth,
        c.Phone,
        c.Mobile,
        c.JobTitle,
        c.YearsOfExperience,
        c.CandidateStatus,
        c.WorkAuthorization,
        c.SecurityClearance,
        c.WillingToRelocate,
        c.IsBench,
        c.RemoteStatus,
        c.EmploymentType,
        c.ExpectedRateFrom,
        c.ExpectedRateTo,
        c.ExpectedRateType,
        c.CurrentRate,
        c.CurrentRateType,
        c.Gender,
        c.MaritalStatus,
        c.Industry,
        c.ProfileSummary,
        c.LinkedInUrl,
        c.GitHubUrl,
        c.TwitterUrl,
        c.VideoResumeUrl,
        c.CreatedAtUtc,
        c.UpdatedAtUtc,
        -- primary email
        ci_email.IdentityValue  AS Email,
        -- primary phone
        ci_phone.IdentityValue  AS PrimaryPhone,
        -- primary document info (without binary data)
        d.DocumentId,
        d.FileNameOriginal,
        d.FileExtension,
        d.MimeType,
        d.FileSizeBytes,
        d.ParseStatus,
        d.UploadedOn,
        loc.CityName,
        loc.StateCode,
        loc.CountryName,
        loc.CountryIso2,
        c.EmployeeId,
        e.EmployeeCode AS EmployeeCode
      FROM [recruit].[Candidate] c
      LEFT JOIN (
        SELECT CandidateId, IdentityValue
        FROM [recruit].[CandidateIdentity]
        WHERE IdentityType = 'Email' AND IsPrimary = 1
      ) ci_email ON ci_email.CandidateId = c.CandidateId
      LEFT JOIN (
        SELECT CandidateId, IdentityValue
        FROM [recruit].[CandidateIdentity]
        WHERE IdentityType = 'Phone' AND IsPrimary = 1
      ) ci_phone ON ci_phone.CandidateId = c.CandidateId
      LEFT JOIN (
        SELECT CandidateId, DocumentId, FileNameOriginal, FileExtension,
               MimeType, FileSizeBytes, ParseStatus, UploadedOn, ExtractedTitle,
               ROW_NUMBER() OVER (PARTITION BY CandidateId ORDER BY IsPrimaryResume DESC, UploadedOn DESC) rn
        FROM [recruit].[CandidateDocument]
        WHERE IsDeleted = 0
      ) d ON d.CandidateId = c.CandidateId AND d.rn = 1
      LEFT JOIN (
        SELECT ea.EntityId,
               city.Name AS CityName,
               state.Code AS StateCode,
               country.Name AS CountryName,
               country.Iso2 AS CountryIso2,
               ROW_NUMBER() OVER(PARTITION BY ea.EntityId ORDER BY ea.IsPrimary DESC, ea.CreatedAtUtc DESC) as rn
        FROM [core].[EntityAddress] ea
        INNER JOIN [core].[Address] a ON ea.AddressId = a.AddressId
        LEFT JOIN [core].[City] city ON a.CityId = city.CityId
        LEFT JOIN [core].[StateProvince] state ON city.StateId = state.StateId
        LEFT JOIN [core].[Country] country ON state.CountryId = country.CountryId
        WHERE ea.EntityType = 'Candidate'
      ) loc ON loc.EntityId = c.CandidateId AND loc.rn = 1
      LEFT JOIN [hrm].[Employee] e ON c.EmployeeId = e.EmployeeId
      WHERE c.IsDeleted = 0
      ORDER BY c.CreatedAtUtc DESC
    `);

    // Fetch all skills in a single query and group by CandidateId
    const skillsResult = await pool.request().query(`
      SELECT cs.CandidateId, s.SkillName
      FROM [recruit].[CandidateSkill] cs
      INNER JOIN [recruit].[Skill] s ON s.SkillId = cs.SkillId
    `);

    const skillsMap = {};
    for (const row of skillsResult.recordset) {
      if (!skillsMap[row.CandidateId]) skillsMap[row.CandidateId] = [];
      skillsMap[row.CandidateId].push(row.SkillName);
    }

    // Build the response
    const candidates = result.recordset.map(c => ({
      candidate_id: c.CandidateId,
      candidate_code: c.CandidateCode,
      first_name: c.FirstName,
      middle_name: c.MiddleName,
      last_name: c.LastName,
      date_of_birth: c.DateOfBirth,
      phone: c.PrimaryPhone || c.Phone || '',
      mobile: c.Mobile || '',
      job_title: c.JobTitle,
      years_exp: c.YearsOfExperience,
      status: c.CandidateStatus,
      work_authorization: c.WorkAuthorization,
      security_clearance: c.SecurityClearance,
      willing_to_relocate: c.WillingToRelocate,
      is_bench: c.IsBench,
      remote_status: c.RemoteStatus,
      employment_type: c.EmploymentType,
      expected_rate_from: c.ExpectedRateFrom,
      expected_rate_to: c.ExpectedRateTo,
      expected_rate_type: c.ExpectedRateType,
      current_rate: c.CurrentRate,
      current_rate_type: c.CurrentRateType,
      gender: c.Gender,
      marital_status: c.MaritalStatus,
      industry: c.Industry,
      profile_summary: c.ProfileSummary,
      linkedin_url: c.LinkedInUrl,
      github_url: c.GitHubUrl,
      twitter_url: c.TwitterUrl || '',
      video_resume_url: c.VideoResumeUrl || '',
      created_on: c.CreatedAtUtc,
      modified_on: c.UpdatedAtUtc,
      current_location: c.CityName ? [c.CityName, c.StateCode, c.CountryIso2].filter(Boolean).join(', ') : '',
      email: c.Email,
      skills: (skillsMap[c.CandidateId] || []),
      document: c.DocumentId ? {
        DocumentId: c.DocumentId,
        FileNameOriginal: c.FileNameOriginal,
        FileExtension: c.FileExtension,
        MimeType: c.MimeType,
        FileSizeBytes: c.FileSizeBytes,
        ParseStatus: c.ParseStatus,
        UploadedOn: c.UploadedOn,
        ExtractedTitle: c.ExtractedTitle,
      } : null,
      employee_id: c.EmployeeCode || c.EmployeeId,
      internal_employee_id: c.EmployeeId,
    }));

    console.log(`Returning ${candidates.length} candidates`);
    res.status(200).json(candidates);

  } catch (error) {
    console.error("DB error in getAllResumes:", error.message);
    res.status(500).json({
      success: false,
      error: "Could not fetch candidates",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: []
    });
  }
};

// â”€â”€â”€ GET SINGLE CANDIDATE BY ID (full detail) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getResumeById = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid candidate ID" });
  }

  const candidateId = parseInt(id);

  try {
    const pool = await poolPromise;

    // 1) Candidate + Email (using same JOIN approach as getAllResumes which works reliably)
    const cResult = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT c.*,
               ci_email.IdentityValue AS PrimaryEmail,
               e.EmployeeCode AS EmployeeCode
        FROM [recruit].[Candidate] c
        LEFT JOIN (
          SELECT CandidateId, IdentityValue
          FROM [recruit].[CandidateIdentity]
          WHERE IdentityType = 'Email' AND IsPrimary = 1
        ) ci_email ON ci_email.CandidateId = c.CandidateId
        LEFT JOIN [hrm].[Employee] e ON c.EmployeeId = e.EmployeeId
        WHERE c.CandidateId = @CandidateId AND c.IsDeleted = 0
      `);

    if (!cResult.recordset.length) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }
    const c = cResult.recordset[0];


    // 1.5) Location
    const locResult = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT TOP 1
               city.Name AS CityName,
               state.Code AS StateCode,
               country.Name AS CountryName,
               country.Iso2 AS CountryIso2
        FROM [core].[EntityAddress] ea
        INNER JOIN [core].[Address] a ON ea.AddressId = a.AddressId
        LEFT JOIN [core].[City] city ON a.CityId = city.CityId
        LEFT JOIN [core].[StateProvince] state ON city.StateId = state.StateId
        LEFT JOIN [core].[Country] country ON state.CountryId = country.CountryId
        WHERE ea.EntityType = 'Candidate' AND ea.EntityId = @CandidateId
        ORDER BY ea.IsPrimary DESC, ea.CreatedAtUtc DESC
      `);
    const loc = locResult.recordset.length ? locResult.recordset[0] : null;
    if (loc) {
      c.CityName = loc.CityName;
      c.StateCode = loc.StateCode;
      c.CountryName = loc.CountryName;
      c.CountryIso2 = loc.CountryIso2;
    }

    // 2) Identity (email / phone) â€” also fetch all for phone resolution and email list
    const idResult = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT IdentityType, IdentityValue, IsPrimary
        FROM [recruit].[CandidateIdentity]
        WHERE CandidateId = @CandidateId
      `);

    // Use the reliable SQL JOIN email as primary, with JS fallbacks (use toUpperCase for case-insensitive match)
    const joinEmail = c.PrimaryEmail || '';
    const anyEmailFromJS = idResult.recordset.find(i => i.IdentityType.toUpperCase() === 'EMAIL');
    const resolvedEmail = joinEmail || anyEmailFromJS?.IdentityValue || '';


    const primaryPhone = idResult.recordset.find(i => i.IdentityType.toUpperCase() === 'PHONE' && (i.IsPrimary === true || i.IsPrimary === 1));
    const anyPhone = idResult.recordset.find(i => i.IdentityType.toUpperCase() === 'PHONE');
    const resolvedPhone = primaryPhone || anyPhone;
    // Collect ALL phones (from identity table + candidate table)
    const allPhones = idResult.recordset
      .filter(i => i.IdentityType.toUpperCase() === 'PHONE')
      .map(i => i.IdentityValue);
    // Also include Phone/Mobile from Candidate table if not already listed
    if (c.Phone && !allPhones.includes(c.Phone)) allPhones.unshift(c.Phone);
    if (c.Mobile && c.Mobile !== c.Phone && !allPhones.includes(c.Mobile)) allPhones.push(c.Mobile);
    // Collect ALL emails
    const allEmails = idResult.recordset
      .filter(i => i.IdentityType.toUpperCase() === 'EMAIL')
      .map(i => i.IdentityValue);

    // 3) Skills
    const skillsResult = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT s.SkillId, s.SkillName, cs.DocumentId
        FROM [recruit].[CandidateSkill] cs
        INNER JOIN [recruit].[Skill] s ON s.SkillId = cs.SkillId
        WHERE cs.CandidateId = @CandidateId
      `);

    // 4) Education
    const eduResult = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT EducationId, Institution, Degree, FieldOfStudy, StartDate, EndDate, GPA, Notes, DocumentId
        FROM [recruit].[CandidateEducation]
        WHERE CandidateId = @CandidateId
      `);

    // 5) Work Experience
    const workResult = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT WorkExperienceId, Company, JobTitle, StartDate, EndDate, IsCurrent, Description, DocumentId
        FROM [recruit].[CandidateWorkExperience]
        WHERE CandidateId = @CandidateId
      `);

    // 6) Certifications
    const certResult = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT CertificationId, CertificationName, IssuingOrganization,
               IssueDate, ExpiryDate, CredentialId, CredentialUrl, DocumentId
        FROM [recruit].[CandidateCertification]
        WHERE CandidateId = @CandidateId
      `);

    // 7) ALL Documents (not just primary â€” return every version)
    const docResult = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT DocumentId, DocumentType, VersionNo, IsPrimaryResume,
               FileNameOriginal, FileExtension, MimeType, FileSizeBytes,
               StorageProvider, StorageLocator, ParseStatus, UploadedOn, ExtractedTitle
        FROM [recruit].[CandidateDocument]
        WHERE CandidateId = @CandidateId AND IsDeleted = 0
        ORDER BY IsPrimaryResume DESC, UploadedOn DESC
      `);

    const primaryDoc = docResult.recordset.length ? docResult.recordset[0] : null;
    const allDocuments = docResult.recordset.map(d => ({
      DocumentId: d.DocumentId,
      DocumentType: d.DocumentType,
      FileNameOriginal: d.FileNameOriginal,
      FileExtension: d.FileExtension,
      MimeType: d.MimeType,
      FileSizeBytes: d.FileSizeBytes,
      StorageLocator: d.StorageLocator,
      ParseStatus: d.ParseStatus,
      UploadedOn: d.UploadedOn,
      VersionNo: d.VersionNo,
      IsPrimary: d.IsPrimaryResume,
      ExtractedTitle: d.ExtractedTitle,
    }));

    // Build response
    const candidate = {
      candidate_id: c.CandidateId,
      candidate_code: c.CandidateCode,
      first_name: c.FirstName,
      middle_name: c.MiddleName,
      last_name: c.LastName,
      date_of_birth: c.DateOfBirth,
      phone: resolvedPhone?.IdentityValue || c.Phone || '',
      mobile: c.Mobile || '',
      phones: allPhones,
      email: resolvedEmail || '',
      emails: allEmails,
      job_title: c.JobTitle,
      years_exp: c.YearsOfExperience,
      status: c.CandidateStatus,
      work_authorization: c.WorkAuthorization,
      security_clearance: c.SecurityClearance,
      willing_to_relocate: c.WillingToRelocate,
      is_bench: c.IsBench,
      remote_status: c.RemoteStatus,
      employment_type: c.EmploymentType,
      expected_rate_from: c.ExpectedRateFrom,
      expected_rate_to: c.ExpectedRateTo,
      expected_rate_type: c.ExpectedRateType,
      current_rate: c.CurrentRate,
      current_rate_type: c.CurrentRateType,
      gender: c.Gender,
      marital_status: c.MaritalStatus,
      industry: c.Industry,
      profile_summary: c.ProfileSummary,
      linkedin_url: c.LinkedInUrl,
      github_url: c.GitHubUrl,
      twitter_url: c.TwitterUrl || '',
      video_resume_url: c.VideoResumeUrl || '',
      created_on: c.CreatedAtUtc,
      modified_on: c.UpdatedAtUtc,
      current_location: c.CityName ? [c.CityName, c.StateCode, c.CountryIso2].filter(Boolean).join(', ') : '',
      // Location sub-fields (structured, for edit forms)
      city_name: c.CityName || '',
      state_code: c.StateCode || '',
      country_name: c.CountryName || '',
      country_iso2: c.CountryIso2 || '',

      skills: skillsResult.recordset.map(s => ({
        skill_name: s.SkillName,
        skill_id: s.SkillId,
      })),
      education: eduResult.recordset.map(e => ({
        EducationId: e.EducationId,
        Institution: e.Institution,
        Degree: e.Degree,
        FieldOfStudy: e.FieldOfStudy,
        StartDate: e.StartDate,
        EndDate: e.EndDate,
        GPA: e.GPA,
        Notes: e.Notes,
      })),
      work_experience: workResult.recordset.map(w => ({
        WorkExperienceId: w.WorkExperienceId,
        Company: w.Company,
        JobTitle: w.JobTitle,
        StartDate: w.StartDate,
        EndDate: w.EndDate,
        IsCurrent: w.IsCurrent,
        Description: w.Description,
      })),
      certifications: certResult.recordset.map(ct => ({
        CertificationId: ct.CertificationId,
        CertificationName: ct.CertificationName,
        IssuingOrganization: ct.IssuingOrganization,
        IssueDate: ct.IssueDate,
        ExpiryDate: ct.ExpiryDate,
        CredentialId: ct.CredentialId,
        CredentialUrl: ct.CredentialUrl,
      })),
      // Primary document (backwards compat)
      document: primaryDoc ? {
        DocumentId: primaryDoc.DocumentId,
        FileNameOriginal: primaryDoc.FileNameOriginal,
        FileExtension: primaryDoc.FileExtension,
        MimeType: primaryDoc.MimeType,
        FileSizeBytes: primaryDoc.FileSizeBytes,
        StorageLocator: primaryDoc.StorageLocator,
        ParseStatus: primaryDoc.ParseStatus,
        UploadedOn: primaryDoc.UploadedOn,
        ExtractedTitle: primaryDoc.ExtractedTitle,
      } : null,
      // ALL documents (for multi-resume display)
      documents: allDocuments,
      employee_id: c.EmployeeCode || c.EmployeeId,
      internal_employee_id: c.EmployeeId,
    };

    res.status(200).json(candidate);

  } catch (error) {
    console.error("DB error in getResumeById:", error);
    res.status(500).json({
      success: false,
      error: "Could not fetch candidate",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// â”€â”€â”€ CREATE CANDIDATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.createResume = async (req, res) => {
  console.log('=== Create Candidate Request ===');
  let transaction;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const {
      FirstName, LastName, MiddleName, EmailID,
      Phone, Mobile, JobTitle, YearsOfExperience,
      CandidateStatus, WorkAuthorization, SecurityClearance,
      WillingToRelocate, RemoteStatus, EmploymentType,
      ExpectedRateFrom, ExpectedRateTo, ExpectedRateType,
      CurrentRate, CurrentRateType, Gender, MaritalStatus,
      Industry, ProfileSummary, LinkedInProfile, GitHubUrl,
      TwitterUrl, VideoResumeUrl,
      Dob, IsBench,
      Skills, Education, WorkExperience, Certifications, CurrentLocation,
      ExtractedTitle,
      // Parser Audit Fields
      ParserVendor, ParseStatus, ParsedText, RawPayloadJson,
      ExtractedEmail, ExtractedPhone, SystemFileName,
      IsEmployee, EmployeeId
    } = req.body;

    const changedByUserId = req.user?.id || req.user?.userId || null;

    // ============================================
    // FORMAT NAME FIELDS BEFORE SAVING
    // ============================================
    const formattedFirstName = formatName(FirstName);
    const formattedLastName = formatName(LastName);
    const formattedMiddleName = MiddleName ? formatName(MiddleName) : '';
    const formattedJobTitle = formatJobTitle(JobTitle || '');

    // Validate required fields
    if (!FirstName || !LastName) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: "FirstName and LastName are required" });
    }

    // Parse DOB
    let dobValue = null;
    if (Dob && String(Dob).trim() !== '') {
      dobValue = new Date(Dob);
      if (isNaN(dobValue)) dobValue = null;
    }

    // Parse boolean values
    const willingToRelocate = WillingToRelocate === 'true' || WillingToRelocate === true ? 1 : 0;
    const isBench = IsBench === 'true' || IsBench === true ? 1 : 0;

    // Parse numeric values
    const yearsExp = YearsOfExperience ? parseFloat(YearsOfExperience) : null;
    const expectedRateFrom = ExpectedRateFrom ? parseFloat(ExpectedRateFrom) : null;
    const expectedRateTo = ExpectedRateTo ? parseFloat(ExpectedRateTo) : null;
    const currentRate = CurrentRate ? parseFloat(CurrentRate) : null;

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // CHECK FOR EXISTING CANDIDATE BY EMAIL
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let existingCandidateId = null;
    let existingCandidateCode = null;
    const emailTrimmed = EmailID?.trim();

    if (emailTrimmed) {
      const dupCheck = await new sql.Request(transaction)
        .input('Email', sql.NVarChar(255), emailTrimmed)
        .query(`
          SELECT TOP 1 c.CandidateId, c.CandidateCode
          FROM [recruit].[CandidateIdentity] ci
          INNER JOIN [recruit].[Candidate] c ON ci.CandidateId = c.CandidateId
          WHERE ci.IdentityType = 'Email'
            AND ci.IdentityValue = @Email
          ORDER BY c.CandidateId ASC
        `);

      if (dupCheck.recordset.length > 0) {
        existingCandidateId = dupCheck.recordset[0].CandidateId;
        existingCandidateCode = dupCheck.recordset[0].CandidateCode;
        console.log(`ðŸ”„ Duplicate detected â€” email "${emailTrimmed}" already belongs to ${existingCandidateCode} (ID: ${existingCandidateId})`);
      }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // PATH A: EXISTING CANDIDATE â€” merge data + add new resume
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (existingCandidateId) {
      const candidateId = existingCandidateId;

      // A0) Get current status for history logging
      const currentStatusRes = await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`SELECT CandidateStatus FROM [recruit].[Candidate] WHERE CandidateId = @CandidateId`);
      const oldStatus = currentStatusRes.recordset[0]?.CandidateStatus;

      // A1) Fill only NULL fields â€” never overwrite existing data
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('FirstName', sql.NVarChar(100), formattedFirstName)
        .input('MiddleName', sql.NVarChar(100), formattedMiddleName || null)
        .input('LastName', sql.NVarChar(100), formattedLastName)
        .input('DateOfBirth', sql.Date, dobValue)
        .input('Phone', sql.NVarChar(50), Phone?.trim() || null)
        .input('Mobile', sql.NVarChar(50), Mobile?.trim() || null)
        .input('JobTitle', sql.NVarChar(200), formattedJobTitle || null)
        .input('YearsOfExperience', sql.Decimal(5, 1), yearsExp)
        .input('CandidateStatus', sql.NVarChar(50), CandidateStatus || 'Available')
        .input('WorkAuthorization', sql.NVarChar(50), WorkAuthorization || null)
        .input('SecurityClearance', sql.NVarChar(50), SecurityClearance || null)
        .input('WillingToRelocate', sql.Bit, willingToRelocate)
        .input('IsBench', sql.Bit, isBench)
        .input('RemoteStatus', sql.NVarChar(50), RemoteStatus || null)
        .input('EmploymentType', sql.NVarChar(50), EmploymentType || null)
        .input('ExpectedRateFrom', sql.Decimal(18, 2), expectedRateFrom)
        .input('ExpectedRateTo', sql.Decimal(18, 2), expectedRateTo)
        .input('ExpectedRateType', sql.NVarChar(20), ExpectedRateType || null)
        .input('CurrentRate', sql.Decimal(18, 2), currentRate)
        .input('CurrentRateType', sql.NVarChar(20), CurrentRateType || null)
        .input('Gender', sql.NVarChar(20), Gender || null)
        .input('MaritalStatus', sql.NVarChar(20), MaritalStatus || null)
        .input('Industry', sql.NVarChar(100), Industry || null)
        .input('ProfileSummary', sql.NVarChar(sql.MAX), ProfileSummary?.trim() || null)
        .input('LinkedInUrl', sql.NVarChar(500), LinkedInProfile?.trim() || null)
        .input('GitHubUrl', sql.NVarChar(500), GitHubUrl?.trim() || null)
        .input('TwitterUrl', sql.NVarChar(500), TwitterUrl?.trim() || null)
        .input('VideoResumeUrl', sql.NVarChar(500), VideoResumeUrl?.trim() || null)
        .input('EmployeeId', sql.BigInt, EmployeeId || null)
        .query(`
          UPDATE [recruit].[Candidate] SET
            FirstName           = ISNULL(FirstName,           @FirstName),
            MiddleName          = ISNULL(MiddleName,          @MiddleName),
            LastName            = ISNULL(LastName,            @LastName),
            DateOfBirth         = ISNULL(DateOfBirth,         @DateOfBirth),
            Phone               = ISNULL(Phone,               @Phone),
            Mobile              = ISNULL(Mobile,              @Mobile),
            JobTitle            = ISNULL(JobTitle,            @JobTitle),
            YearsOfExperience   = ISNULL(YearsOfExperience,   @YearsOfExperience),
            CandidateStatus     = ISNULL(CandidateStatus,     @CandidateStatus),
            WorkAuthorization   = ISNULL(WorkAuthorization,   @WorkAuthorization),
            SecurityClearance   = ISNULL(SecurityClearance,   @SecurityClearance),
            WillingToRelocate   = ISNULL(WillingToRelocate,   @WillingToRelocate),
            IsBench             = ISNULL(IsBench,             @IsBench),
            RemoteStatus        = ISNULL(RemoteStatus,        @RemoteStatus),
            EmploymentType      = ISNULL(EmploymentType,      @EmploymentType),
            ExpectedRateFrom    = ISNULL(ExpectedRateFrom,    @ExpectedRateFrom),
            ExpectedRateTo      = ISNULL(ExpectedRateTo,      @ExpectedRateTo),
            ExpectedRateType    = ISNULL(ExpectedRateType,    @ExpectedRateType),
            CurrentRate         = ISNULL(CurrentRate,         @CurrentRate),
            CurrentRateType     = ISNULL(CurrentRateType,     @CurrentRateType),
            Gender              = ISNULL(Gender,              @Gender),
            MaritalStatus       = ISNULL(MaritalStatus,       @MaritalStatus),
            Industry            = ISNULL(Industry,            @Industry),
            ProfileSummary      = ISNULL(ProfileSummary,      @ProfileSummary),
            LinkedInUrl         = ISNULL(LinkedInUrl,         @LinkedInUrl),
            GitHubUrl           = ISNULL(GitHubUrl,           @GitHubUrl),
            TwitterUrl          = ISNULL(TwitterUrl,          @TwitterUrl),
            VideoResumeUrl      = ISNULL(VideoResumeUrl,      @VideoResumeUrl),
            UpdatedAtUtc        = SYSUTCDATETIME(),
            EmployeeId          = @EmployeeId,
            IsDeleted           = 0
          WHERE CandidateId = @CandidateId
        `);

      // A1c) Log status history if changed
      const updatedStatusRes = await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`SELECT CandidateStatus FROM [recruit].[Candidate] WHERE CandidateId = @CandidateId`);
      const newStatus = updatedStatusRes.recordset[0]?.CandidateStatus;

      if (newStatus !== oldStatus) {
        await logStatusHistory(transaction, {
          candidateId,
          fromStatus: oldStatus,
          toStatus: newStatus,
          changedByUserId,
          reasonText: 'Updated during candidate merge'
        });
      }

      // A1b) Add new phone/mobile as identity records (don't replace existing)
      const newPhone = Phone?.trim();
      const newMobile = Mobile?.trim();

      if (newPhone) {
        const phoneExists = await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('IdentityValue', sql.NVarChar(255), newPhone)
          .query(`
            SELECT TOP 1 1 AS Found FROM [recruit].[CandidateIdentity]
            WHERE CandidateId = @CandidateId AND IdentityType = 'Phone' AND IdentityValue = @IdentityValue
          `);
        if (phoneExists.recordset.length === 0) {
          await new sql.Request(transaction)
            .input('CandidateId', sql.Int, candidateId)
            .input('IdentityType', sql.NVarChar(50), 'Phone')
            .input('IdentityValue', sql.NVarChar(255), newPhone)
            .input('IsPrimary', sql.Bit, 0)
            .input('IsVerified', sql.Bit, 0)
            .query(`
              INSERT INTO [recruit].[CandidateIdentity]
                (CandidateId, IdentityType, IdentityValue, IsPrimary, IsVerified, CreatedOn)
              VALUES
                (@CandidateId, @IdentityType, @IdentityValue, @IsPrimary, @IsVerified, GETDATE())
            `);
          console.log(`ðŸ“ž New phone identity added: ${newPhone}`);
        }
      }

      if (newMobile && newMobile !== newPhone) {
        const mobileExists = await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('IdentityValue', sql.NVarChar(255), newMobile)
          .query(`
            SELECT TOP 1 1 AS Found FROM [recruit].[CandidateIdentity]
            WHERE CandidateId = @CandidateId AND IdentityType = 'Phone' AND IdentityValue = @IdentityValue
          `);
        if (mobileExists.recordset.length === 0) {
          await new sql.Request(transaction)
            .input('CandidateId', sql.Int, candidateId)
            .input('IdentityType', sql.NVarChar(50), 'Phone')
            .input('IdentityValue', sql.NVarChar(255), newMobile)
            .input('IsPrimary', sql.Bit, 0)
            .input('IsVerified', sql.Bit, 0)
            .query(`
              INSERT INTO [recruit].[CandidateIdentity]
                (CandidateId, IdentityType, IdentityValue, IsPrimary, IsVerified, CreatedOn)
              VALUES
                (@CandidateId, @IdentityType, @IdentityValue, @IsPrimary, @IsVerified, GETDATE())
            `);
          console.log(`ðŸ“± New mobile identity added: ${newMobile}`);
        }
      }

      // A1d) Initialize DocumentId for linkage
      let primaryDocumentId = null;

      // A1e) Add new Resume as a new VERSION (Moved up to provide DocumentId)
      if (req.file && req.file.buffer) {
        // Mark existing primary resumes as non-primary
        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .query(`
            UPDATE [recruit].[CandidateDocument]
            SET IsPrimaryResume = 0
            WHERE CandidateId = @CandidateId AND IsPrimaryResume = 1
          `);

        // Get next version number
        const versionRes = await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .query(`SELECT ISNULL(MAX(VersionNo), 0) + 1 AS NextVer FROM [recruit].[CandidateDocument] WHERE CandidateId = @CandidateId`);
        const nextVer = versionRes.recordset[0].NextVer;

        const ext = path.extname(req.file.originalname).toLowerCase();

        const useS3 = !!process.env.AWS_ACCESS_KEY_ID;
        let storageProvider = 'DATABASE';
        let storageLocator = 'inline';
        let storageRegion = 'local';
        let resumeFileData = req.file.buffer;

        if (useS3) {
          const s3Result = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
          if (s3Result.success) {
            storageProvider = 'AWS';
            storageLocator = s3Result.s3Key;
            storageRegion = process.env.AWS_REGION || 'us-east-1';
            resumeFileData = null;
          }
        }

        const sqlFields = [
          'CandidateId', 'DocumentType', 'VersionNo', 'IsPrimaryResume',
          'FileNameOriginal', 'FileExtension', 'MimeType', 'FileSizeBytes',
          'StorageProvider', 'StorageLocator', 'StorageRegion',
          'UploadedOn', 'IsDeleted', 'ExtractedTitle',
          'ParseStatus', 'ParsedText', 'ParsedOn', 'SystemFileName'
        ];
        const sqlValues = [
          '@CandidateId', '@DocumentType', '@VersionNo', '@IsPrimaryResume',
          '@FileNameOriginal', '@FileExtension', '@MimeType', '@FileSizeBytes',
          '@StorageProvider', '@StorageLocator', '@StorageRegion',
          'GETDATE()', '@IsDeleted', '@ExtractedTitle',
          '@ParseStatus', '@ParsedText', '@ParsedOn', '@SystemFileName'
        ];

        const request = new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('DocumentType', sql.NVarChar(50), 'RESUME')
          .input('VersionNo', sql.Int, nextVer)
          .input('IsPrimaryResume', sql.Bit, 1)
          .input('FileNameOriginal', sql.NVarChar(255), req.file.originalname)
          .input('FileExtension', sql.NVarChar(10), ext)
          .input('MimeType', sql.NVarChar(100), req.file.mimetype)
          .input('FileSizeBytes', sql.BigInt, req.file.buffer.length)
          .input('StorageProvider', sql.NVarChar(50), storageProvider)
          .input('StorageLocator', sql.NVarChar(500), storageLocator)
          .input('StorageRegion', sql.NVarChar(50), storageRegion)
          .input('IsDeleted', sql.Bit, 0)
          .input('ExtractedTitle', sql.NVarChar(200), ExtractedTitle || formattedJobTitle || null)
          .input('ParseStatus', sql.NVarChar(50), ParseStatus || 'PARSED')
          .input('ParsedText', sql.NVarChar(sql.MAX), ParsedText || null)
          .input('ParsedOn', sql.DateTime, ParsedText ? new Date() : null)
          .input('SystemFileName', sql.NVarChar(500), SystemFileName || storageLocator);

        if (resumeFileData) {
          sqlFields.push('ResumeFileData');
          sqlValues.push('@ResumeFileData');
          request.input('ResumeFileData', sql.VarBinary(sql.MAX), resumeFileData);
        }

        const docRes = await request.query(`
          INSERT INTO [recruit].[CandidateDocument] (${sqlFields.join(', ')}) 
          OUTPUT INSERTED.DocumentId
          VALUES (${sqlValues.join(', ')})
        `);
        primaryDocumentId = docRes.recordset[0].DocumentId;
        console.log(`ðŸ“Ž New resume v${nextVer} (ID: ${primaryDocumentId}) added to existing candidate ${existingCandidateCode} in ${storageProvider}`);
      }

      // A2) Merge Skills (add only new ones, keep existing)
      const skillsList = parseJsonField(Skills);
      for (const skillName of skillsList) {
        if (!skillName || !String(skillName).trim()) continue;
        const name = String(skillName).trim();

        const skillRes = await new sql.Request(transaction)
          .input('SkillName', sql.NVarChar(200), name)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM [recruit].[Skill] WHERE SkillName = @SkillName)
              INSERT INTO [recruit].[Skill] (SkillName) VALUES (@SkillName);
            SELECT SkillId FROM [recruit].[Skill] WHERE SkillName = @SkillName;
          `);
        const skillId = skillRes.recordset[0].SkillId;

        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('SkillId', sql.Int, skillId)
          .input('DocumentId', sql.BigInt, primaryDocumentId)
          .query(`
            IF NOT EXISTS (
              SELECT 1 FROM [recruit].[CandidateSkill]
              WHERE CandidateId = @CandidateId AND SkillId = @SkillId
            )
            INSERT INTO [recruit].[CandidateSkill] (CandidateId, SkillId, DocumentId)
            VALUES (@CandidateId, @SkillId, @DocumentId)
          `);
      }

      // A3) Append Education (skip if exact same institution+degree already exists)
      const eduList = parseJsonField(Education);
      for (const edu of eduList) {
        if (!edu || typeof edu !== 'object') continue;

        const inst = formatName(edu.Institution || edu.institution || '');
        const deg = formatName(edu.Degree || edu.degree || '');
        if (!inst && !deg) continue;

        const exists = await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('Institution', sql.NVarChar(200), inst)
          .input('Degree', sql.NVarChar(200), deg)
          .query(`
            SELECT TOP 1 1 AS Found FROM [recruit].[CandidateEducation]
            WHERE CandidateId = @CandidateId
              AND ISNULL(Institution,'') = ISNULL(@Institution,'')
              AND ISNULL(Degree,'') = ISNULL(@Degree,'')
          `);
        if (exists.recordset.length > 0) continue;

        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('Institution', sql.NVarChar(200), inst || null)
          .input('Degree', sql.NVarChar(200), deg || null)
          .input('FieldOfStudy', sql.NVarChar(200), edu.FieldOfStudy || edu.fieldOfStudy || null)
          .input('StartDate', sql.Date, parseDate(edu.StartDate || edu.startDate))
          .input('EndDate', sql.Date, parseDate(edu.EndDate || edu.endDate))
          .input('GPA', sql.NVarChar(20), edu.GPA || edu.gpa || null)
          .input('Notes', sql.NVarChar(sql.MAX), edu.Notes || edu.notes || null)
          .input('DocumentId', sql.BigInt, primaryDocumentId)
          .query(`
            INSERT INTO [recruit].[CandidateEducation]
              (CandidateId, Institution, Degree, FieldOfStudy, StartDate, EndDate, GPA, Notes, DocumentId)
            VALUES
              (@CandidateId, @Institution, @Degree, @FieldOfStudy, @StartDate, @EndDate, @GPA, @Notes, @DocumentId)
          `);
      }

      // A4) Append Work Experience (skip if same company+jobTitle already exists)
      const workList = parseJsonField(WorkExperience);
      for (const w of workList) {
        if (!w || typeof w !== 'object') continue;

        const company = w.Company || w.company || '';
        const jobT = formatJobTitle(w.JobTitle || w.jobTitle || '');
        if (!company && !jobT) continue;

        const exists = await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('Company', sql.NVarChar(200), company)
          .input('JobTitle', sql.NVarChar(200), jobT)
          .query(`
            SELECT TOP 1 1 AS Found FROM [recruit].[CandidateWorkExperience]
            WHERE CandidateId = @CandidateId
              AND ISNULL(Company,'') = ISNULL(@Company,'')
              AND ISNULL(JobTitle,'') = ISNULL(@JobTitle,'')
          `);
        if (exists.recordset.length > 0) continue;

        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('Company', sql.NVarChar(200), company || null)
          .input('JobTitle', sql.NVarChar(200), jobT || null)
          .input('StartDate', sql.Date, parseDate(w.StartDate || w.startDate))
          .input('EndDate', sql.Date, parseDate(w.EndDate || w.endDate))
          .input('IsCurrent', sql.Bit, w.IsCurrent ?? w.isCurrent ?? 0)
          .input('Description', sql.NVarChar(sql.MAX), w.Description || w.description || null)
          .input('DocumentId', sql.BigInt, primaryDocumentId)
          .query(`
            INSERT INTO [recruit].[CandidateWorkExperience]
              (CandidateId, Company, JobTitle, StartDate, EndDate, IsCurrent, Description, DocumentId)
            VALUES
              (@CandidateId, @Company, @JobTitle, @StartDate, @EndDate, @IsCurrent, @Description, @DocumentId)
          `);
      }

      // A5) Append Certifications (skip if same name already exists)
      const certList = parseJsonField(Certifications);
      for (const cert of certList) {
        if (!cert || typeof cert !== 'object') continue;

        const certName = formatName(cert.CertificationName || cert.name || '');
        if (!certName) continue;

        const exists = await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('CertificationName', sql.NVarChar(200), certName)
          .query(`
            SELECT TOP 1 1 AS Found FROM [recruit].[CandidateCertification]
            WHERE CandidateId = @CandidateId
              AND ISNULL(CertificationName,'') = ISNULL(@CertificationName,'')
          `);
        if (exists.recordset.length > 0) continue;

        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('CertificationName', sql.NVarChar(200), certName)
          .input('IssuingOrganization', sql.NVarChar(200), cert.IssuingOrganization || cert.issuingOrg || null)
          .input('IssueDate', sql.Date, parseDate(cert.IssueDate || cert.issueDate))
          .input('ExpiryDate', sql.Date, parseDate(cert.ExpiryDate || cert.expiryDate))
          .input('CredentialId', sql.NVarChar(100), cert.CredentialId || cert.credentialId || null)
          .input('CredentialUrl', sql.NVarChar(500), cert.CredentialUrl || cert.credentialUrl || null)
          .input('DocumentId', sql.BigInt, primaryDocumentId)
          .query(`
            INSERT INTO [recruit].[CandidateCertification]
              (CandidateId, CertificationName, IssuingOrganization, IssueDate, ExpiryDate, CredentialId, CredentialUrl, DocumentId)
            VALUES
              (@CandidateId, @CertificationName, @IssuingOrganization, @IssueDate, @ExpiryDate, @CredentialId, @CredentialUrl, @DocumentId)
          `);
      }

      // A7) Handle Additional Documents
      const additionalDocsCount = parseInt(req.body.AdditionalDocsCount || '0', 10);
      for (let i = 0; i < additionalDocsCount; i++) {
        const docFile = req.files && req.files[`AdditionalDoc_${i}`] && req.files[`AdditionalDoc_${i}`][0]
          ? req.files[`AdditionalDoc_${i}`][0]
          : null;
        const docName = req.body[`AdditionalDoc_${i}_Name`] || null;
        const docType = req.body[`AdditionalDoc_${i}_Type`] || 'Certificate';

        if (docFile && docFile.buffer) {
          const ext = path.extname(docFile.originalname).toLowerCase();
          console.log(`ðŸ“Ž Inserting additional document ${i}:`, docFile.originalname, 'Type:', docType);
          await new sql.Request(transaction)
            .input('CandidateId', sql.Int, candidateId)
            .input('DocumentType', sql.NVarChar(50), docType)
            .input('VersionNo', sql.Int, 1)
            .input('IsPrimaryResume', sql.Bit, 0)
            .input('FileNameOriginal', sql.NVarChar(255), docName || docFile.originalname)
            .input('FileExtension', sql.NVarChar(10), ext)
            .input('MimeType', sql.NVarChar(100), docFile.mimetype)
            .input('FileSizeBytes', sql.BigInt, docFile.buffer.length)
            .input('StorageProvider', sql.NVarChar(50), 'DATABASE')
            .input('StorageLocator', sql.NVarChar(500), 'inline')
            .input('StorageRegion', sql.NVarChar(50), 'local')
            .input('ResumeFileData', sql.VarBinary(sql.MAX), docFile.buffer)
            .input('IsDeleted', sql.Bit, 0)
            .query(`
              INSERT INTO [recruit].[CandidateDocument] (
                CandidateId, DocumentType, VersionNo, IsPrimaryResume,
                FileNameOriginal, FileExtension, MimeType, FileSizeBytes,
                StorageProvider, StorageLocator, StorageRegion,
                ResumeFileData, UploadedOn, IsDeleted
              ) VALUES (
                @CandidateId, @DocumentType, @VersionNo, @IsPrimaryResume,
                @FileNameOriginal, @FileExtension, @MimeType, @FileSizeBytes,
                @StorageProvider, @StorageLocator, @StorageRegion,
                @ResumeFileData, GETDATE(), @IsDeleted
              )
            `);
        }
      }

      // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // ðŸ“ HANDLE CURRENT LOCATION (core.EntityAddress) - IMPROVED
      // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const locString = (CurrentLocation || '').trim();
      if (locString) {
        await handleLocationUpdate(transaction, candidateId, locString);
      }

      await transaction.commit();
      transaction = null;

      console.log(`âœ… Existing candidate ${existingCandidateCode} updated (merged duplicate)`);

      return res.status(200).json({
        success: true,
        merged: true,
        message: `Candidate already exists with this email. Profile updated and new resume added as version.`,
        CandidateId: candidateId,
        CandidateCode: existingCandidateCode,
      });
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // PATH B: NEW CANDIDATE â€” create from scratch
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // Generate CandidateCode
    const codeResult = await new sql.Request(transaction).query(`
      SELECT ISNULL(MAX(CandidateId), 0) + 1 AS NextId FROM [recruit].[Candidate]
    `);
    const nextId = codeResult.recordset[0].NextId;
    const candidateCode = `CAN-${String(nextId).padStart(6, '0')}`;

    // Process EmployeeId: if IsEmployee is true, use provided EmployeeId or extract from CandidateCode if it was passed there
    let resolvedEmployeeId = null;
    if (IsEmployee === 'true' || IsEmployee === true) {
      resolvedEmployeeId = EmployeeId || null;
      // If no explicit EmployeeId, try to extract from a code if it was passed (e.g. EMP-67)
      if (!resolvedEmployeeId && candidateCode && candidateCode.startsWith('EMP-')) {
        resolvedEmployeeId = candidateCode.replace('EMP-', '');
      }
    }

    // B1) Insert Candidate
    const insertResult = await new sql.Request(transaction)
      .input('CandidateCode', sql.NVarChar(50), candidateCode)
      .input('FirstName', sql.NVarChar(100), formattedFirstName)
      .input('MiddleName', sql.NVarChar(100), formattedMiddleName || null)
      .input('LastName', sql.NVarChar(100), formattedLastName)
      .input('DateOfBirth', sql.Date, dobValue)
      .input('Phone', sql.NVarChar(50), Phone?.trim() || null)
      .input('Mobile', sql.NVarChar(50), Mobile?.trim() || null)
      .input('WhatsAppEnabled', sql.Bit, 0)
      .input('JobTitle', sql.NVarChar(200), formattedJobTitle || null)
      .input('YearsOfExperience', sql.Decimal(5, 1), yearsExp)
      .input('CandidateStatus', sql.NVarChar(50), CandidateStatus || 'Available')
      .input('WorkAuthorization', sql.NVarChar(50), WorkAuthorization || null)
      .input('SecurityClearance', sql.NVarChar(50), SecurityClearance || null)
      .input('WillingToRelocate', sql.Bit, willingToRelocate)
      .input('IsBench', sql.Bit, isBench)
      .input('RemoteStatus', sql.NVarChar(50), RemoteStatus || 'Remote')
      .input('EmploymentType', sql.NVarChar(50), EmploymentType || null)
      .input('ExpectedRateFrom', sql.Decimal(18, 2), expectedRateFrom)
      .input('ExpectedRateTo', sql.Decimal(18, 2), expectedRateTo)
      .input('ExpectedRateType', sql.NVarChar(20), ExpectedRateType || 'Hourly')
      .input('CurrentRate', sql.Decimal(18, 2), currentRate)
      .input('CurrentRateType', sql.NVarChar(20), CurrentRateType || 'Hourly')
      .input('Gender', sql.NVarChar(20), Gender || null)
      .input('MaritalStatus', sql.NVarChar(20), MaritalStatus || null)
      .input('Industry', sql.NVarChar(100), Industry || null)
      .input('ProfileSummary', sql.NVarChar(sql.MAX), ProfileSummary?.trim() || null)
      .input('LinkedInUrl', sql.NVarChar(500), LinkedInProfile?.trim() || null)
      .input('GitHubUrl', sql.NVarChar(500), GitHubUrl?.trim() || null)
      .input('TwitterUrl', sql.NVarChar(500), TwitterUrl?.trim() || null)
      .input('VideoResumeUrl', sql.NVarChar(500), VideoResumeUrl?.trim() || null)
      .input('IsDeleted', sql.Bit, 0)
      .input('EmployeeId', sql.BigInt, resolvedEmployeeId)
      .query(`
        INSERT INTO [recruit].[Candidate] (
          CandidateCode, FirstName, MiddleName, LastName, DateOfBirth,
          Phone, Mobile, WhatsAppEnabled, JobTitle, YearsOfExperience,
          CandidateStatus, WorkAuthorization, SecurityClearance, WillingToRelocate, IsBench,
          RemoteStatus, EmploymentType, ExpectedRateFrom, ExpectedRateTo,
          ExpectedRateType, CurrentRate, CurrentRateType,
          Gender, MaritalStatus, Industry, ProfileSummary,
          LinkedInUrl, GitHubUrl, TwitterUrl, VideoResumeUrl, CreatedAtUtc, UpdatedAtUtc, IsDeleted, EmployeeId
        ) VALUES (
          @CandidateCode, @FirstName, @MiddleName, @LastName, @DateOfBirth,
          @Phone, @Mobile, @WhatsAppEnabled, @JobTitle, @YearsOfExperience,
          @CandidateStatus, @WorkAuthorization, @SecurityClearance, @WillingToRelocate, @IsBench,
          @RemoteStatus, @EmploymentType, @ExpectedRateFrom, @ExpectedRateTo,
          @ExpectedRateType, @CurrentRate, @CurrentRateType,
          @Gender, @MaritalStatus, @Industry, @ProfileSummary,
          @LinkedInUrl, @GitHubUrl, @TwitterUrl, @VideoResumeUrl, SYSUTCDATETIME(), SYSUTCDATETIME(), @IsDeleted, @EmployeeId
        );
        SELECT SCOPE_IDENTITY() AS CandidateId;
      `);

    const candidateId = insertResult.recordset[0].CandidateId;
    let primaryDocumentId = null;

    // B1b) Log initial status history
    await logStatusHistory(transaction, {
      candidateId,
      fromStatus: null,
      toStatus: CandidateStatus || 'Available',
      changedByUserId,
      reasonText: 'Initial candidate creation'
    });

    // B2) Insert primary email identity
    if (emailTrimmed) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('IdentityType', sql.NVarChar(50), 'EMAIL')
        .input('IdentityValue', sql.NVarChar(255), emailTrimmed)
        .input('IsPrimary', sql.Bit, 1)
        .input('IsVerified', sql.Bit, 0)
        .query(`
          INSERT INTO [recruit].[CandidateIdentity]
            (CandidateId, IdentityType, IdentityValue, IsPrimary, IsVerified, CreatedOn)
          VALUES
            (@CandidateId, @IdentityType, @IdentityValue, @IsPrimary, @IsVerified, GETDATE())
        `);
    }

    // B2b) Insert Phone identities
    const newPhone = Phone?.trim();
    const newMobile = Mobile?.trim();

    if (newPhone) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('IdentityType', sql.NVarChar(50), 'PHONE')
        .input('IdentityValue', sql.NVarChar(255), newPhone)
        .input('IsPrimary', sql.Bit, 1)
        .input('IsVerified', sql.Bit, 0)
        .query(`
          INSERT INTO [recruit].[CandidateIdentity]
            (CandidateId, IdentityType, IdentityValue, IsPrimary, IsVerified, CreatedOn)
          VALUES
            (@CandidateId, @IdentityType, @IdentityValue, @IsPrimary, @IsVerified, GETDATE())
        `);
    }

    if (newMobile && newMobile !== newPhone) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('IdentityType', sql.NVarChar(50), 'PHONE')
        .input('IdentityValue', sql.NVarChar(255), newMobile)
        .input('IsPrimary', sql.Bit, 0)
        .input('IsVerified', sql.Bit, 0)
        .query(`
          INSERT INTO [recruit].[CandidateIdentity]
            (CandidateId, IdentityType, IdentityValue, IsPrimary, IsVerified, CreatedOn)
          VALUES
            (@CandidateId, @IdentityType, @IdentityValue, @IsPrimary, @IsVerified, GETDATE())
        `);
    }

    // B3) Insert Resume File (if uploaded) - Moved up to provide DocumentId for sub-tables
    if (req.file && req.file.buffer) {
      const ext = path.extname(req.file.originalname).toLowerCase();

      const useS3 = !!process.env.AWS_ACCESS_KEY_ID;
      let storageProvider = 'DATABASE';
      let storageLocator = 'inline';
      let storageRegion = 'local';
      let resumeFileData = req.file.buffer;

      if (useS3) {
        const s3Result = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
        if (s3Result.success) {
          storageProvider = 'AWS';
          storageLocator = s3Result.s3Key;
          storageRegion = process.env.AWS_REGION || 'us-east-1';
          resumeFileData = null;
        }
      }

      const sqlFields = [
        'CandidateId', 'DocumentType', 'VersionNo', 'IsPrimaryResume',
        'FileNameOriginal', 'FileExtension', 'MimeType', 'FileSizeBytes',
        'StorageProvider', 'StorageLocator', 'StorageRegion',
        'UploadedOn', 'IsDeleted', 'ExtractedTitle',
        'ParseStatus', 'ParsedText', 'ParsedOn', 'SystemFileName'
      ];
      const sqlValues = [
        '@CandidateId', '@DocumentType', '@VersionNo', '@IsPrimaryResume',
        '@FileNameOriginal', '@FileExtension', '@MimeType', '@FileSizeBytes',
        '@StorageProvider', '@StorageLocator', '@StorageRegion',
        'GETDATE()', '@IsDeleted', '@ExtractedTitle',
        '@ParseStatus', '@ParsedText', '@ParsedOn', '@SystemFileName'
      ];

      const request = new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('DocumentType', sql.NVarChar(50), 'RESUME')
        .input('VersionNo', sql.Int, 1)
        .input('IsPrimaryResume', sql.Bit, 1)
        .input('FileNameOriginal', sql.NVarChar(255), req.file.originalname)
        .input('FileExtension', sql.NVarChar(10), ext)
        .input('MimeType', sql.NVarChar(100), req.file.mimetype)
        .input('FileSizeBytes', sql.BigInt, req.file.buffer.length)
        .input('StorageProvider', sql.NVarChar(50), storageProvider)
        .input('StorageLocator', sql.NVarChar(500), storageLocator)
        .input('StorageRegion', sql.NVarChar(50), storageRegion)
        .input('IsDeleted', sql.Bit, 0)
        .input('ExtractedTitle', sql.NVarChar(200), ExtractedTitle || formattedJobTitle || null)
        .input('ParseStatus', sql.NVarChar(50), ParseStatus || 'PARSED')
        .input('ParsedText', sql.NVarChar(sql.MAX), ParsedText || null)
        .input('ParsedOn', sql.DateTime, ParsedText ? new Date() : null)
        .input('SystemFileName', sql.NVarChar(500), SystemFileName || storageLocator);

      if (resumeFileData) {
        sqlFields.push('ResumeFileData');
        sqlValues.push('@ResumeFileData');
        request.input('ResumeFileData', sql.VarBinary(sql.MAX), resumeFileData);
      }

      const docRes = await request.query(`
        INSERT INTO [recruit].[CandidateDocument] (${sqlFields.join(', ')}) 
        OUTPUT INSERTED.DocumentId
        VALUES (${sqlValues.join(', ')})
      `);
      primaryDocumentId = docRes.recordset[0].DocumentId;

      // B3b) Log Parser Run for auditing
      if (primaryDocumentId) {
        try {
          await new sql.Request(transaction)
            .input('DocumentId', sql.BigInt, primaryDocumentId)
            .input('ParserVendor', sql.NVarChar(100), ParserVendor || 'llama-3.1-8b-instant')
            .input('Status', sql.NVarChar(50), ParseStatus || 'SUCCESS')
            .input('RawPayloadJson', sql.NVarChar(sql.MAX), RawPayloadJson || null)
            .input('ExtractedEmail', sql.NVarChar(255), ExtractedEmail || null)
            .input('ExtractedPhone', sql.NVarChar(50), ExtractedPhone || null)
            .query(`
              INSERT INTO [recruit].[CandidateDocumentParseRun]
                (DocumentId, ParserVendor, Status, RawPayloadJson, ExtractedEmail, ExtractedPhone, StartedOn, CompletedOn)
              VALUES
                (@DocumentId, @ParserVendor, @Status, @RawPayloadJson, @ExtractedEmail, @ExtractedPhone, GETDATE(), GETDATE())
            `);
          console.log(`ðŸ“Ž Logged parser run for DocumentId: ${primaryDocumentId}`);
        } catch (auditErr) {
          console.error("âš ï¸ Failed to log parser run:", auditErr.message);
        }
      }
      console.log(`ðŸ“Ž New resume uploaded (ID: ${primaryDocumentId}) to ${storageProvider}:`, req.file.originalname);
    }

    // B4) Insert Skills (Re-indexed from B3)
    const skillsList = parseJsonField(Skills);
    for (const skillName of skillsList) {
      if (!skillName || !String(skillName).trim()) continue;
      const name = String(skillName).trim();

      const skillRes = await new sql.Request(transaction)
        .input('SkillName', sql.NVarChar(200), name)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM [recruit].[Skill] WHERE SkillName = @SkillName)
            INSERT INTO [recruit].[Skill] (SkillName) VALUES (@SkillName);
          SELECT SkillId FROM [recruit].[Skill] WHERE SkillName = @SkillName;
        `);
      const skillId = skillRes.recordset[0].SkillId;

      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('SkillId', sql.Int, skillId)
        .input('DocumentId', sql.BigInt, primaryDocumentId)
        .query(`
          IF NOT EXISTS (
            SELECT 1 FROM [recruit].[CandidateSkill]
            WHERE CandidateId = @CandidateId AND SkillId = @SkillId
          )
          INSERT INTO [recruit].[CandidateSkill] (CandidateId, SkillId, DocumentId)
          VALUES (@CandidateId, @SkillId, @DocumentId)
        `);
    }

    // B4b) Insert Education
    const eduList = parseJsonField(Education);
    for (const edu of eduList) {
      if (!edu || typeof edu !== 'object') continue;

      const formattedInstitution = formatName(edu.Institution || edu.institution || '');
      const formattedDegree = formatName(edu.Degree || edu.degree || '');

      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('Institution', sql.NVarChar(200), formattedInstitution || null)
        .input('Degree', sql.NVarChar(200), formattedDegree || null)
        .input('FieldOfStudy', sql.NVarChar(200), edu.FieldOfStudy || edu.fieldOfStudy || null)
        .input('StartDate', sql.Date, parseDate(edu.StartDate || edu.startDate))
        .input('EndDate', sql.Date, parseDate(edu.EndDate || edu.endDate))
        .input('GPA', sql.NVarChar(20), edu.GPA || edu.gpa || null)
        .input('Notes', sql.NVarChar(sql.MAX), edu.Notes || edu.notes || null)
        .input('DocumentId', sql.BigInt, primaryDocumentId)
        .query(`
          INSERT INTO [recruit].[CandidateEducation]
            (CandidateId, Institution, Degree, FieldOfStudy, StartDate, EndDate, GPA, Notes, DocumentId)
          VALUES
            (@CandidateId, @Institution, @Degree, @FieldOfStudy, @StartDate, @EndDate, @GPA, @Notes, @DocumentId)
        `);
    }

    // B5) Insert Work Experience
    const workList = parseJsonField(WorkExperience);
    for (const w of workList) {
      if (!w || typeof w !== 'object') continue;

      const fJobTitle = formatJobTitle(w.JobTitle || w.jobTitle || '');

      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('Company', sql.NVarChar(200), w.Company || w.company || null)
        .input('JobTitle', sql.NVarChar(200), fJobTitle || null)
        .input('StartDate', sql.Date, parseDate(w.StartDate || w.startDate))
        .input('EndDate', sql.Date, parseDate(w.EndDate || w.endDate))
        .input('IsCurrent', sql.Bit, w.IsCurrent ?? w.isCurrent ?? 0)
        .input('Description', sql.NVarChar(sql.MAX), w.Description || w.description || null)
        .input('DocumentId', sql.BigInt, primaryDocumentId)
        .query(`
          INSERT INTO [recruit].[CandidateWorkExperience]
            (CandidateId, Company, JobTitle, StartDate, EndDate, IsCurrent, Description, DocumentId)
          VALUES
            (@CandidateId, @Company, @JobTitle, @StartDate, @EndDate, @IsCurrent, @Description, @DocumentId)
        `);
    }

    // B6) Insert Certifications
    const certList = parseJsonField(Certifications);
    for (const cert of certList) {
      if (!cert || typeof cert !== 'object') continue;

      const formattedCertName = formatName(cert.CertificationName || cert.name || '');

      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('CertificationName', sql.NVarChar(200), formattedCertName)
        .input('IssuingOrganization', sql.NVarChar(200), cert.IssuingOrganization || cert.issuingOrg || null)
        .input('IssueDate', sql.Date, parseDate(cert.IssueDate || cert.issueDate))
        .input('ExpiryDate', sql.Date, parseDate(cert.ExpiryDate || cert.expiryDate))
        .input('CredentialId', sql.NVarChar(100), cert.CredentialId || cert.credentialId || null)
        .input('CredentialUrl', sql.NVarChar(500), cert.CredentialUrl || cert.credentialUrl || null)
        .input('DocumentId', sql.BigInt, primaryDocumentId)
        .query(`
          INSERT INTO [recruit].[CandidateCertification]
            (CandidateId, CertificationName, IssuingOrganization, IssueDate, ExpiryDate, CredentialId, CredentialUrl, DocumentId)
          VALUES
            (@CandidateId, @CertificationName, @IssuingOrganization, @IssueDate, @ExpiryDate, @CredentialId, @CredentialUrl, @DocumentId)
        `);
    }

    // B8) Insert Additional Documents (if any uploaded via AdditionalDoc_N fields)
    const additionalDocsCount = parseInt(req.body.AdditionalDocsCount || '0', 10);
    for (let i = 0; i < additionalDocsCount; i++) {
      const docFile = req.files && req.files[`AdditionalDoc_${i}`] && req.files[`AdditionalDoc_${i}`][0]
        ? req.files[`AdditionalDoc_${i}`][0]
        : null;
      const docName = req.body[`AdditionalDoc_${i}_Name`] || null;
      const docType = req.body[`AdditionalDoc_${i}_Type`] || 'Certificate';

      if (docFile && docFile.buffer) {
        const ext = path.extname(docFile.originalname).toLowerCase();
        console.log(`ðŸ“Ž Inserting additional document ${i}:`, docFile.originalname, 'Type:', docType);
        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('DocumentType', sql.NVarChar(50), docType)
          .input('VersionNo', sql.Int, 1)
          .input('IsPrimaryResume', sql.Bit, 0)
          .input('FileNameOriginal', sql.NVarChar(255), docName || docFile.originalname)
          .input('FileExtension', sql.NVarChar(10), ext)
          .input('MimeType', sql.NVarChar(100), docFile.mimetype)
          .input('FileSizeBytes', sql.BigInt, docFile.buffer.length)
          .input('StorageProvider', sql.NVarChar(50), 'DATABASE')
          .input('StorageLocator', sql.NVarChar(500), 'inline')
          .input('StorageRegion', sql.NVarChar(50), 'local')
          .input('ResumeFileData', sql.VarBinary(sql.MAX), docFile.buffer)
          .input('IsDeleted', sql.Bit, 0)
          .query(`
            INSERT INTO [recruit].[CandidateDocument] (
              CandidateId, DocumentType, VersionNo, IsPrimaryResume,
              FileNameOriginal, FileExtension, MimeType, FileSizeBytes,
              StorageProvider, StorageLocator, StorageRegion,
              ResumeFileData, UploadedOn, IsDeleted
            ) VALUES (
              @CandidateId, @DocumentType, @VersionNo, @IsPrimaryResume,
              @FileNameOriginal, @FileExtension, @MimeType, @FileSizeBytes,
              @StorageProvider, @StorageLocator, @StorageRegion,
              @ResumeFileData, GETDATE(), @IsDeleted
            )
          `);
      }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ðŸ“ HANDLE CURRENT LOCATION (core.EntityAddress) - IMPROVED
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const locString = (CurrentLocation || '').trim();
    if (locString) {
      await handleLocationUpdate(transaction, candidateId, locString);
    }

    await transaction.commit();
    transaction = null;

    console.log('âœ… New candidate created with ID:', candidateId, 'Code:', candidateCode);

    return res.status(201).json({
      success: true,
      merged: false,
      message: "Candidate created successfully!",
      CandidateId: candidateId,
      CandidateCode: candidateCode,
    });

  } catch (error) {
    console.error("Create error:", error);
    if (transaction) {
      try { await transaction.rollback(); } catch (e) { console.error('Rollback error:', e); }
    }

    // TEMPORARY: Write error to a file so we can read it
    const fs = require('fs');
    fs.appendFileSync('last_create_error.txt', new Date().toISOString() + ' - ' + error.message + '\n' + error.stack + '\n\n');

    return res.status(500).json({
      success: false,
      error: "Failed to create candidate",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// â”€â”€â”€ UPDATE CANDIDATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.updateResume = async (req, res) => {
  console.log('=== Update Candidate Request ===');
  const { id } = req.params;
  let transaction;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid candidate ID" });
  }

  const candidateId = parseInt(id);

  try {
    const pool = await poolPromise;

    // Check existence
    const check = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`SELECT CandidateId FROM [recruit].[Candidate] WHERE CandidateId = @CandidateId AND IsDeleted = 0`);

    if (!check.recordset.length) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Resolve changedByUserId for audit logging
    let changedByUserId = 1; // Default
    try {
      if (req.user && req.user.userId) {
        changedByUserId = req.user.userId;
      } else if (req.body.UserId || req.body.userId) {
        changedByUserId = parseInt(req.body.UserId || req.body.userId);
      }
    } catch (e) { console.error("Error resolving userId:", e); }

    const {
      FirstName, LastName, MiddleName, EmailID,
      Phone, Mobile, JobTitle, YearsOfExperience,
      CandidateStatus, WorkAuthorization, SecurityClearance,
      WillingToRelocate, RemoteStatus, EmploymentType,
      ExpectedRateFrom, ExpectedRateTo, ExpectedRateType,
      CurrentRate, CurrentRateType, Gender, MaritalStatus,
      Industry, ProfileSummary, LinkedInProfile, GitHubUrl,
      TwitterUrl, VideoResumeUrl,
      Dob, IsBench,
      Skills, Education, WorkExperience, Certifications, CurrentLocation,
      ExtractedTitle,
      // Parser Audit Fields
      ParserVendor, ParseStatus, ParsedText, RawPayloadJson,
      ExtractedEmail, ExtractedPhone, SystemFileName,
      IsEmployee, EmployeeId, employee_id, internal_employee_id
    } = req.body;

    // Prioritize internal_employee_id if provided by the frontend, otherwise fallback
    const finalEmployeeId = internal_employee_id !== undefined ? internal_employee_id : EmployeeId;

    // Get current status for history logging
    const currentStatusRes = await transaction.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`SELECT CandidateStatus FROM [recruit].[Candidate] WHERE CandidateId = @CandidateId`);
    const oldStatus = currentStatusRes.recordset[0]?.CandidateStatus;

    // ============================================
    // FORMAT NAME FIELDS BEFORE SAVING
    // ============================================
    const formattedFirstName = FirstName ? formatName(FirstName) : undefined;
    const formattedLastName = LastName ? formatName(LastName) : undefined;
    const formattedMiddleName = MiddleName ? formatName(MiddleName) : undefined;
    const formattedJobTitle = JobTitle ? formatJobTitle(JobTitle) : undefined;

    // Parse DOB
    let dobValue = null;
    if (Dob && String(Dob).trim() !== '') {
      dobValue = new Date(Dob);
      if (isNaN(dobValue)) dobValue = null;
    }

    // Parse boolean values
    const willingToRelocate = WillingToRelocate === 'true' || WillingToRelocate === true ? 1 : 0;
    const isBench = IsBench === 'true' || IsBench === true ? 1 : 0;

    // Parse numeric values
    const yearsExp = YearsOfExperience ? parseFloat(YearsOfExperience) : null;
    const expectedRateFrom = ExpectedRateFrom ? parseFloat(ExpectedRateFrom) : null;
    const expectedRateTo = ExpectedRateTo ? parseFloat(ExpectedRateTo) : null;
    const currentRate = CurrentRate ? parseFloat(CurrentRate) : null;

    // 1) Update Candidate row
    let setClauses = [];
    const request = new sql.Request(transaction);
    request.input('CandidateId', sql.Int, candidateId);

    const addField = (name, col, val, type) => {
      if (val !== undefined) {
        setClauses.push(`${col} = @${name}`);
        request.input(name, type, val === '' ? null : val);
      }
    };

    addField('FirstName', 'FirstName', formattedFirstName, sql.NVarChar(100));
    addField('MiddleName', 'MiddleName', formattedMiddleName, sql.NVarChar(100));
    addField('LastName', 'LastName', formattedLastName, sql.NVarChar(100));
    addField('DateOfBirth', 'DateOfBirth', dobValue, sql.Date);
    addField('Phone', 'Phone', Phone?.trim(), sql.NVarChar(50));
    addField('Mobile', 'Mobile', Mobile?.trim(), sql.NVarChar(50));
    addField('JobTitle', 'JobTitle', formattedJobTitle, sql.NVarChar(200));
    addField('YearsOfExperience', 'YearsOfExperience', yearsExp, sql.Decimal(5, 1));
    addField('CandidateStatus', 'CandidateStatus', CandidateStatus, sql.NVarChar(50));
    addField('WorkAuthorization', 'WorkAuthorization', WorkAuthorization, sql.NVarChar(50));
    addField('SecurityClearance', 'SecurityClearance', SecurityClearance, sql.NVarChar(50));
    addField('WillingToRelocate', 'WillingToRelocate', willingToRelocate, sql.Bit);
    addField('IsBench', 'IsBench', isBench, sql.Bit);
    addField('RemoteStatus', 'RemoteStatus', RemoteStatus, sql.NVarChar(50));
    addField('EmploymentType', 'EmploymentType', EmploymentType, sql.NVarChar(50));
    addField('ExpectedRateFrom', 'ExpectedRateFrom', expectedRateFrom, sql.Decimal(18, 2));
    addField('ExpectedRateTo', 'ExpectedRateTo', expectedRateTo, sql.Decimal(18, 2));
    addField('ExpectedRateType', 'ExpectedRateType', ExpectedRateType, sql.NVarChar(20));
    addField('CurrentRate', 'CurrentRate', currentRate, sql.Decimal(18, 2));
    addField('CurrentRateType', 'CurrentRateType', CurrentRateType, sql.NVarChar(20));
    addField('Gender', 'Gender', Gender, sql.NVarChar(20));
    addField('MaritalStatus', 'MaritalStatus', MaritalStatus, sql.NVarChar(20));
    addField('Industry', 'Industry', Industry, sql.NVarChar(100));
    addField('ProfileSummary', 'ProfileSummary', ProfileSummary?.trim(), sql.NVarChar(sql.MAX));
    addField('LinkedInUrl', 'LinkedInUrl', LinkedInProfile?.trim(), sql.NVarChar(500));
    addField('GitHubUrl', 'GitHubUrl', GitHubUrl?.trim(), sql.NVarChar(500));
    addField('TwitterUrl', 'TwitterUrl', TwitterUrl?.trim(), sql.NVarChar(500));
    addField('VideoResumeUrl', 'VideoResumeUrl', VideoResumeUrl?.trim(), sql.NVarChar(500));
    addField('EmployeeId', 'EmployeeId', finalEmployeeId, sql.BigInt);

    if (setClauses.length > 0) {
      setClauses.push('UpdatedAtUtc = SYSUTCDATETIME()');
      await request.query(`
        UPDATE [recruit].[Candidate]
        SET ${setClauses.join(', ')}
        WHERE CandidateId = @CandidateId
      `);
    }

    // 2) Update Email identity
    if (EmailID !== undefined && EmailID.trim()) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('IdentityValue', sql.NVarChar(255), EmailID.trim())
        .query(`
          IF EXISTS (
            SELECT 1 FROM [recruit].[CandidateIdentity]
            WHERE CandidateId = @CandidateId AND IdentityType = 'Email' AND IsPrimary = 1
          )
            UPDATE [recruit].[CandidateIdentity]
            SET IdentityValue = @IdentityValue
            WHERE CandidateId = @CandidateId AND IdentityType = 'Email' AND IsPrimary = 1
          ELSE
            INSERT INTO [recruit].[CandidateIdentity]
              (CandidateId, IdentityType, IdentityValue, IsPrimary, IsVerified, CreatedOn)
            VALUES (@CandidateId, 'EMAIL', @IdentityValue, 1, 0, GETDATE())
        `);
    }

    // 2.5) Update Phone identity
    if (Phone !== undefined && Phone.trim()) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('IdentityValue', sql.NVarChar(255), Phone.trim())
        .query(`
          IF EXISTS (
            SELECT 1 FROM [recruit].[CandidateIdentity]
            WHERE CandidateId = @CandidateId AND (IdentityType = 'Phone' OR IdentityType = 'PHONE') AND IsPrimary = 1
          )
            UPDATE [recruit].[CandidateIdentity]
            SET IdentityValue = @IdentityValue
            WHERE CandidateId = @CandidateId AND (IdentityType = 'Phone' OR IdentityType = 'PHONE') AND IsPrimary = 1
          ELSE
            INSERT INTO [recruit].[CandidateIdentity]
              (CandidateId, IdentityType, IdentityValue, IsPrimary, IsVerified, CreatedOn)
            VALUES (@CandidateId, 'PHONE', @IdentityValue, 1, 0, GETDATE())
        `);
    }

    // 7) Upload new Resume File (add as new version) - MOVED UP for DocumentId linkage
    let primaryDocumentId = null;
    if (req.file && req.file.buffer) {
      // Mark existing primary resume as non-primary
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`
          UPDATE [recruit].[CandidateDocument]
          SET IsPrimaryResume = 0
          WHERE CandidateId = @CandidateId AND IsPrimaryResume = 1
        `);

      // Get next version number
      const versionRes = await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`SELECT ISNULL(MAX(VersionNo), 0) + 1 AS NextVer FROM [recruit].[CandidateDocument] WHERE CandidateId = @CandidateId`);
      const nextVer = versionRes.recordset[0].NextVer;

      const ext = path.extname(req.file.originalname).toLowerCase();
      const useS3 = !!process.env.AWS_ACCESS_KEY_ID;

      let storageProvider = 'DATABASE';
      let storageLocator = 'inline';
      let storageRegion = 'local';
      let resumeFileData = req.file.buffer;

      if (useS3) {
        const s3Result = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
        if (s3Result.success) {
          storageProvider = 'AWS';
          storageLocator = s3Result.s3Key;
          storageRegion = process.env.AWS_REGION || 'us-east-1';
          resumeFileData = null;
        }
      }

      const sqlFields = [
        'CandidateId', 'DocumentType', 'VersionNo', 'IsPrimaryResume',
        'FileNameOriginal', 'FileExtension', 'MimeType', 'FileSizeBytes',
        'StorageProvider', 'StorageLocator', 'StorageRegion',
        'UploadedOn', 'IsDeleted', 'ExtractedTitle',
        'ParseStatus', 'ParsedText', 'ParsedOn', 'SystemFileName'
      ];
      const sqlValues = [
        '@CandidateId', '@DocumentType', '@VersionNo', '@IsPrimaryResume',
        '@FileNameOriginal', '@FileExtension', '@MimeType', '@FileSizeBytes',
        '@StorageProvider', '@StorageLocator', '@StorageRegion',
        'GETDATE()', '@IsDeleted', '@ExtractedTitle',
        '@ParseStatus', '@ParsedText', '@ParsedOn', '@SystemFileName'
      ];

      const request = new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .input('DocumentType', sql.NVarChar(50), 'RESUME')
        .input('VersionNo', sql.Int, nextVer)
        .input('IsPrimaryResume', sql.Bit, 1)
        .input('FileNameOriginal', sql.NVarChar(255), req.file.originalname)
        .input('FileExtension', sql.NVarChar(10), ext)
        .input('MimeType', sql.NVarChar(100), req.file.mimetype)
        .input('FileSizeBytes', sql.BigInt, req.file.buffer.length)
        .input('StorageProvider', sql.NVarChar(50), storageProvider)
        .input('StorageLocator', sql.NVarChar(500), storageLocator)
        .input('StorageRegion', sql.NVarChar(50), storageRegion)
        .input('IsDeleted', sql.Bit, 0)
        .input('ExtractedTitle', sql.NVarChar(200), ExtractedTitle || formattedJobTitle || null)
        .input('ParseStatus', sql.NVarChar(50), ParseStatus || 'PARSED')
        .input('ParsedText', sql.NVarChar(sql.MAX), ParsedText || null)
        .input('ParsedOn', sql.DateTime, ParsedText ? new Date() : null)
        .input('SystemFileName', sql.NVarChar(500), SystemFileName || storageLocator);

      if (resumeFileData) {
        sqlFields.push('ResumeFileData');
        sqlValues.push('@ResumeFileData');
        request.input('ResumeFileData', sql.VarBinary(sql.MAX), resumeFileData);
      }

      const docInsertRes = await request.query(`
        INSERT INTO [recruit].[CandidateDocument] (${sqlFields.join(', ')}) 
        OUTPUT INSERTED.DocumentId
        VALUES (${sqlValues.join(', ')})
      `);
      primaryDocumentId = docInsertRes.recordset[0].DocumentId;

      // 7b) Log Parser Run for auditing
      if (primaryDocumentId) {
        try {
          await new sql.Request(transaction)
            .input('DocumentId', sql.BigInt, primaryDocumentId)
            .input('ParserVendor', sql.NVarChar(100), ParserVendor || 'llama-3.1-8b-instant')
            .input('Status', sql.NVarChar(50), ParseStatus || 'SUCCESS')
            .input('RawPayloadJson', sql.NVarChar(sql.MAX), RawPayloadJson || null)
            .input('ExtractedEmail', sql.NVarChar(255), ExtractedEmail || null)
            .input('ExtractedPhone', sql.NVarChar(50), ExtractedPhone || null)
            .query(`
              INSERT INTO [recruit].[CandidateDocumentParseRun]
                (DocumentId, ParserVendor, Status, RawPayloadJson, ExtractedEmail, ExtractedPhone, StartedOn, CompletedOn)
              VALUES
                (@DocumentId, @ParserVendor, @Status, @RawPayloadJson, @ExtractedEmail, @ExtractedPhone, GETDATE(), GETDATE())
            `);
          console.log(`ðŸ“Ž Logged parser run for DocumentId: ${primaryDocumentId}`);
        } catch (auditErr) {
          console.error("âš ï¸ Failed to log parser run during Update:", auditErr.message);
        }
      }
      console.log(`ðŸ“Ž New resume version ${nextVer} (ID: ${primaryDocumentId}) uploaded to ${storageProvider}:`, req.file.originalname);
    } else {
      // No new file, try to find existing primary resume for sub-table linkage
      const docRes = await transaction.request()
        .input('CandidateId', sql.Int, candidateId)
        .query(`SELECT TOP 1 DocumentId FROM [recruit].[CandidateDocument] WHERE CandidateId = @CandidateId AND IsPrimaryResume = 1 AND IsDeleted = 0 ORDER BY VersionNo DESC`);
      primaryDocumentId = docRes.recordset[0]?.DocumentId;
    }

    // 3) Replace Skills (delete + re-insert)
    if (Skills !== undefined) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`DELETE FROM [recruit].[CandidateSkill] WHERE CandidateId = @CandidateId`);

      const skillsList = parseJsonField(Skills);
      for (const skillName of skillsList) {
        if (!skillName || !String(skillName).trim()) continue;
        const name = String(skillName).trim();
        const skillRes = await new sql.Request(transaction)
          .input('SkillName', sql.NVarChar(200), name)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM [recruit].[Skill] WHERE SkillName = @SkillName)
              INSERT INTO [recruit].[Skill] (SkillName) VALUES (@SkillName);
            SELECT SkillId FROM [recruit].[Skill] WHERE SkillName = @SkillName;
          `);
        const skillId = skillRes.recordset[0].SkillId;
        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('SkillId', sql.Int, skillId)
          .input('DocumentId', sql.BigInt, primaryDocumentId)
          .query(`INSERT INTO [recruit].[CandidateSkill] (CandidateId, SkillId, DocumentId) VALUES (@CandidateId, @SkillId, @DocumentId)`);
      }
    }

    // 4) Replace Education
    if (Education !== undefined) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`DELETE FROM [recruit].[CandidateEducation] WHERE CandidateId = @CandidateId`);

      for (const edu of parseJsonField(Education)) {
        if (!edu || typeof edu !== 'object') continue;

        const inst = formatName(edu.Institution || edu.institution || '');
        const deg = formatName(edu.Degree || edu.degree || '');

        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('Institution', sql.NVarChar(200), inst || null)
          .input('Degree', sql.NVarChar(200), deg || null)
          .input('FieldOfStudy', sql.NVarChar(200), edu.FieldOfStudy || edu.fieldOfStudy || null)
          .input('StartDate', sql.Date, parseDate(edu.StartDate || edu.startDate))
          .input('EndDate', sql.Date, parseDate(edu.EndDate || edu.endDate))
          .input('GPA', sql.NVarChar(20), edu.GPA || edu.gpa || null)
          .input('Notes', sql.NVarChar(sql.MAX), edu.Notes || edu.notes || null)
          .input('DocumentId', sql.BigInt, primaryDocumentId)
          .query(`
            INSERT INTO [recruit].[CandidateEducation]
              (CandidateId, Institution, Degree, FieldOfStudy, StartDate, EndDate, GPA, Notes, DocumentId)
            VALUES
              (@CandidateId, @Institution, @Degree, @FieldOfStudy, @StartDate, @EndDate, @GPA, @Notes, @DocumentId)
          `);
      }
    }

    // 5) Replace Work Experience
    if (WorkExperience !== undefined) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`DELETE FROM [recruit].[CandidateWorkExperience] WHERE CandidateId = @CandidateId`);

      for (const w of parseJsonField(WorkExperience)) {
        if (!w || typeof w !== 'object') continue;

        const fJobTitle = formatJobTitle(w.JobTitle || w.jobTitle || '');

        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('Company', sql.NVarChar(200), w.Company || w.company || null)
          .input('JobTitle', sql.NVarChar(200), fJobTitle || null)
          .input('StartDate', sql.Date, parseDate(w.StartDate || w.startDate))
          .input('EndDate', sql.Date, parseDate(w.EndDate || w.endDate))
          .input('IsCurrent', sql.Bit, w.IsCurrent ?? w.isCurrent ?? 0)
          .input('Description', sql.NVarChar(sql.MAX), w.Description || w.description || null)
          .input('DocumentId', sql.BigInt, primaryDocumentId)
          .query(`
            INSERT INTO [recruit].[CandidateWorkExperience]
              (CandidateId, Company, JobTitle, StartDate, EndDate, IsCurrent, Description, DocumentId)
            VALUES
              (@CandidateId, @Company, @JobTitle, @StartDate, @EndDate, @IsCurrent, @Description, @DocumentId)
          `);
      }
    }

    // 6) Replace Certifications
    if (Certifications !== undefined) {
      await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`DELETE FROM [recruit].[CandidateCertification] WHERE CandidateId = @CandidateId`);

      for (const cert of parseJsonField(Certifications)) {
        if (!cert || typeof cert !== 'object') continue;

        const fCertName = formatName(cert.CertificationName || cert.name || '');

        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('CertificationName', sql.NVarChar(200), fCertName)
          .input('IssuingOrganization', sql.NVarChar(200), cert.IssuingOrganization || cert.issuingOrg || null)
          .input('IssueDate', sql.Date, parseDate(cert.IssueDate || cert.issueDate))
          .input('ExpiryDate', sql.Date, parseDate(cert.ExpiryDate || cert.expiryDate))
          .input('CredentialId', sql.NVarChar(100), cert.CredentialId || cert.credentialId || null)
          .input('CredentialUrl', sql.NVarChar(500), cert.CredentialUrl || cert.credentialUrl || null)
          .input('DocumentId', sql.BigInt, primaryDocumentId)
          .query(`
            INSERT INTO [recruit].[CandidateCertification]
              (CandidateId, CertificationName, IssuingOrganization, IssueDate, ExpiryDate, CredentialId, CredentialUrl, DocumentId)
            VALUES
              (@CandidateId, @CertificationName, @IssuingOrganization, @IssueDate, @ExpiryDate, @CredentialId, @CredentialUrl, @DocumentId)
          `);
      }
    }

    // Status History check
    if (CandidateStatus && CandidateStatus !== oldStatus) {
      await logStatusHistory(transaction, {
        candidateId,
        fromStatus: oldStatus,
        toStatus: CandidateStatus,
        changedByUserId,
        reasonText: 'Updated via profile edit'
      });
    }

    // 8) Insert Additional Documents (if any uploaded via AdditionalDoc_N fields)
    const additionalDocsCount = parseInt(req.body.AdditionalDocsCount || '0', 10);
    for (let i = 0; i < additionalDocsCount; i++) {
      const docFile = req.files && req.files[`AdditionalDoc_${i}`] && req.files[`AdditionalDoc_${i}`][0]
        ? req.files[`AdditionalDoc_${i}`][0]
        : null;
      const docName = req.body[`AdditionalDoc_${i}_Name`] || null;
      const docType = req.body[`AdditionalDoc_${i}_Type`] || 'Certificate';

      if (docFile && docFile.buffer) {
        const ext = path.extname(docFile.originalname).toLowerCase();
        console.log(`ðŸ“Ž Inserting additional document ${i}:`, docFile.originalname, 'Type:', docType);
        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('DocumentType', sql.NVarChar(50), docType)
          .input('VersionNo', sql.Int, 1)
          .input('IsPrimaryResume', sql.Bit, 0)
          .input('FileNameOriginal', sql.NVarChar(255), docName || docFile.originalname)
          .input('FileExtension', sql.NVarChar(10), ext)
          .input('MimeType', sql.NVarChar(100), docFile.mimetype)
          .input('FileSizeBytes', sql.BigInt, docFile.buffer.length)
          .input('StorageProvider', sql.NVarChar(50), 'DATABASE')
          .input('StorageLocator', sql.NVarChar(500), 'inline')
          .input('StorageRegion', sql.NVarChar(50), 'local')
          .input('ResumeFileData', sql.VarBinary(sql.MAX), docFile.buffer)
          .input('IsDeleted', sql.Bit, 0)
          .query(`
            INSERT INTO [recruit].[CandidateDocument] (
              CandidateId, DocumentType, VersionNo, IsPrimaryResume,
              FileNameOriginal, FileExtension, MimeType, FileSizeBytes,
              StorageProvider, StorageLocator, StorageRegion,
              ResumeFileData, UploadedOn, IsDeleted
            ) VALUES (
              @CandidateId, @DocumentType, @VersionNo, @IsPrimaryResume,
              @FileNameOriginal, @FileExtension, @MimeType, @FileSizeBytes,
              @StorageProvider, @StorageLocator, @StorageRegion,
              @ResumeFileData, GETDATE(), @IsDeleted
            )
          `);
      }
    }

    // 9) Update Location (City / State / Country via core.EntityAddress)
    const locString = (CurrentLocation || '').trim();
    if (locString) {
      await handleLocationUpdate(transaction, candidateId, locString);
    }

    await transaction.commit();
    transaction = null;

    console.log('âœ… Candidate updated:', candidateId);

    return res.status(200).json({
      success: true,
      message: "Candidate updated successfully!",
      CandidateId: candidateId,
    });

  } catch (error) {
    console.error("Update error:", error);
    if (transaction) {
      try { await transaction.rollback(); } catch (e) { console.error('Rollback error:', e); }
    }
    return res.status(500).json({
      success: false,
      error: "Failed to update candidate",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// â”€â”€â”€ DELETE CANDIDATE (soft delete) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.deleteResume = async (req, res) => {
  console.log('=== Delete Candidate Request ===');
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid candidate ID" });
  }

  const candidateId = parseInt(id);

  try {
    const pool = await poolPromise;

    // Check if exists
    const check = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT CandidateId, FirstName, LastName
        FROM [recruit].[Candidate]
        WHERE CandidateId = @CandidateId AND IsDeleted = 0
      `);

    if (!check.recordset.length) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    const candidate = check.recordset[0];

    // Soft delete: set IsDeleted = 1
    await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        UPDATE [recruit].[Candidate]
        SET IsDeleted = 1, UpdatedAtUtc = SYSUTCDATETIME()
        WHERE CandidateId = @CandidateId
      `);

    // Also soft-delete documents
    await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        UPDATE [recruit].[CandidateDocument]
        SET IsDeleted = 1
        WHERE CandidateId = @CandidateId
      `);

    console.log('âœ… Candidate soft-deleted:', candidateId);

    return res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
      deletedId: candidateId,
      deletedCandidate: `${candidate.FirstName} ${candidate.LastName}`,
    });

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not delete candidate",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// â”€â”€â”€ DOWNLOAD RESUME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.downloadResume = async (req, res) => {
  console.log('=== DOWNLOAD RESUME REQUEST ===');
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid document ID" });
  }

  const documentId = parseInt(id);

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('DocumentId', sql.Int, documentId)
      .query(`
        SELECT d.*, c.FirstName, c.LastName
        FROM [recruit].[CandidateDocument] d
        INNER JOIN [recruit].[Candidate] c ON c.CandidateId = d.CandidateId
        WHERE d.DocumentId = @DocumentId AND d.IsDeleted = 0
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    const doc = result.recordset[0];
    const fileBuffer = await getDocumentFileBuffer(doc);

    if (!fileBuffer) {
      return res.status(404).json({ success: false, error: "No file data available (DB or S3)" });
    }

    const fileName = doc.FileNameOriginal || `${doc.FirstName}_${doc.LastName}_Resume.pdf`;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Type', doc.MimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(fileBuffer);

  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Could not download resume",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// â”€â”€â”€ PREVIEW RESUME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.previewResume = async (req, res) => {
  console.log('=== PREVIEW RESUME REQUEST ===');
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid document ID" });
  }

  const documentId = parseInt(id);

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('DocumentId', sql.Int, documentId)
      .query(`
        SELECT *
        FROM [recruit].[CandidateDocument]
        WHERE DocumentId = @DocumentId AND IsDeleted = 0
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    const doc = result.recordset[0];
    const fileBuffer = await getDocumentFileBuffer(doc);

    if (!fileBuffer) {
      return res.status(404).json({ success: false, error: "No file data available (DB or S3)" });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Content-Disposition');

    // fileBuffer already obtained above

    if (doc.MimeType === 'application/pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${doc.FileNameOriginal || 'resume.pdf'}"`);
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:* https://localhost:*");
      res.setHeader('Accept-Ranges', 'bytes');

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1;
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileBuffer.length}`);
        res.setHeader('Content-Length', end - start + 1);
        res.send(fileBuffer.slice(start, end + 1));
      } else {
        res.send(fileBuffer);
      }
    }
    else if (doc.MimeType === 'text/plain') {
      const textContent = fileBuffer.toString('utf-8');
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${doc.FileNameOriginal}</title>
        <style>body{font-family:'Courier New',monospace;padding:30px;background:#f5f5f5;line-height:1.6}
        .container{max-width:900px;margin:0 auto;background:#fff;padding:40px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
        .header{background:#1a6f66;color:#fff;padding:15px 20px;margin:-40px -40px 30px -40px;border-radius:8px 8px 0 0}
        pre{white-space:pre-wrap;word-wrap:break-word;font-size:14px;color:#333}</style></head>
        <body><div class="container"><div class="header"><strong>${doc.FileNameOriginal}</strong></div>
        <pre>${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></div></body></html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
    }
    else if (
      doc.MimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      doc.MimeType === 'application/msword'
    ) {
      const conversionResult = await convertDocumentToHtml(fileBuffer, doc.MimeType);
      if (!conversionResult.success) {
        return res.status(400).json({ success: false, error: "Failed to convert document", details: conversionResult.error });
      }
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${doc.FileNameOriginal}</title>
        <style>body{font-family:Calibri,Arial,sans-serif;padding:30px;background:#f5f5f5;line-height:1.6}
        .container{max-width:900px;margin:0 auto;background:#fff;padding:40px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
        .header{background:#1a6f66;color:#fff;padding:15px 20px;margin:-40px -40px 30px -40px;border-radius:8px 8px 0 0}
        .content{font-size:14px;color:#333} .content p{margin-bottom:12px} .content h1,.content h2,.content h3{color:#1a6f66;margin:20px 0 10px}
        </style></head><body><div class="container"><div class="header"><strong>${doc.FileNameOriginal}</strong></div>
        <div class="content">${conversionResult.html}</div></div></body></html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
    }
    else {
      return res.status(400).json({ success: false, error: "Preview not supported for this file type" });
    }

  } catch (error) {
    console.error("Preview error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Could not preview resume",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// â”€â”€â”€ GET RESUME FILE INFO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getResumeFileInfo = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid document ID" });
  }

  const documentId = parseInt(id);

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('DocumentId', sql.Int, documentId)
      .query(`
        SELECT DocumentId, FileNameOriginal, FileExtension, MimeType, FileSizeBytes
        FROM [recruit].[CandidateDocument]
        WHERE DocumentId = @DocumentId AND IsDeleted = 0
      `);


    if (!result.recordset.length) {
      return res.status(200).json({ success: true, fileAvailable: false, message: "Document not found" });
    }

    const doc = result.recordset[0];
    const previewableTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    const canPreview = previewableTypes.includes(doc.MimeType);

    return res.status(200).json({
      success: true,
      fileAvailable: true,
      fileInfo: {
        fileName: doc.FileNameOriginal,
        fileSize: doc.FileSizeBytes,
        fileExtension: doc.FileExtension,
        canPreview,
        fileType: doc.MimeType,
      },
      downloadUrl: `/api/resumes/${documentId}/download`,
      previewUrl: canPreview ? `/api/resumes/${documentId}/preview` : null,
    });

  } catch (error) {
    console.error("File info error:", error);
    res.status(500).json({
      success: false,
      error: "Could not get file information",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─── GET CANDIDATE DOCUMENTS ──────────────────────────────────────────────────

exports.getCandidateDocuments = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid candidate ID" });
  }

  const candidateId = parseInt(id);

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(`
        SELECT
          DocumentId,
          DocumentType,
          FileNameOriginal,
          FileExtension,
          MimeType,
          FileSizeBytes,
          IsPrimaryResume,
          UploadedOn,
          FileNameOriginal as DocumentName
        FROM [recruit].[CandidateDocument]
        WHERE CandidateId = @CandidateId
          AND IsDeleted = 0
        ORDER BY
          IsPrimaryResume DESC,
          UploadedOn DESC
      `);

    res.status(200).json(result.recordset);

  } catch (error) {
    console.error("Error fetching candidate documents:", error);
    res.status(500).json({
      success: false,
      error: "Could not fetch documents",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─── DEBUG: TABLE STRUCTURE ──────────────────────────────────────────────────

exports.testTableStructure = async (req, res) => {
  try {
    const pool = await poolPromise;

    const schemaResult = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'recruit'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);

    const sampleResult = await pool.request().query(`
      SELECT TOP 5 CandidateId, CandidateCode, FirstName, LastName
      FROM [recruit].[Candidate]
      WHERE IsDeleted = 0
      ORDER BY CandidateId DESC
    `);

    res.json({
      success: true,
      tableSchema: schemaResult.recordset,
      sampleData: sampleResult.recordset,
      totalColumns: schemaResult.recordset.length,
      sampleCount: sampleResult.recordset.length
    });

  } catch (error) {
    console.error('Table structure test failed:', error);
    res.status(500).json({ success: false, error: 'Failed to get table structure', details: error.message });
  }
};

exports.shareResume = async (req, res) => {
  console.log('=== Share Resume Request ===');
  const { candidateId, candidateIds, to, cc, bcc, subject, body, documentIds } = req.body;

  if (!to || !to.trim()) {
    return res.status(400).json({ success: false, error: 'Recipient email is required' });
  }
  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one document must be selected to share' });
  }
  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({ success: false, error: 'SendGrid API Key is not configured on the server' });
  }

  try {
    const pool = await poolPromise;

    // Resolve candidateIds: can be array or single ID
    let finalCandidateIds = [];
    if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
      finalCandidateIds = candidateIds;
    } else if (candidateId) {
      finalCandidateIds = [candidateId];
    } else {
      return res.status(400).json({ success: false, error: 'Candidate ID(s) is required' });
    }

    // Fetch the specific documents from the DB for attachments
    let candPlaceholders = [];
    let docPlaceholders = [];
    const request = pool.request();

    for (let i = 0; i < finalCandidateIds.length; i++) {
      const pName = `cId${i}`;
      candPlaceholders.push(`@${pName}`);
      request.input(pName, sql.Int, finalCandidateIds[i]);
    }

    for (let i = 0; i < documentIds.length; i++) {
      const pName = `docId${i}`;
      docPlaceholders.push(`@${pName}`);
      request.input(pName, sql.Int, documentIds[i]);
    }

    const docResult = await request.query(`
      SELECT *
      FROM [recruit].[CandidateDocument]
      WHERE CandidateId IN (${candPlaceholders.join(', ')})
        AND DocumentId IN (${docPlaceholders.join(', ')})
        AND IsDeleted = 0
    `);

    if (!docResult.recordset.length) {
      return res.status(404).json({ success: false, error: 'Selected documents not found' });
    }

    // Prepare SendGrid Attachments
    const attachments = await Promise.all(docResult.recordset.map(async (doc) => {
      const fileBuffer = await getDocumentFileBuffer(doc);
      if (!fileBuffer) {
        console.warn(`âš ï¸ Skipping attachment ${doc.DocumentId} - no file data`);
        return null;
      }
      return {
        content: fileBuffer.toString('base64'),
        filename: doc.FileNameOriginal || `Resume_Attachment_${doc.DocumentId}.pdf`,
        type: doc.MimeType || 'application/pdf',
        disposition: 'attachment'
      };
    }));

    // Filter out null attachments
    const finalAttachments = attachments.filter(a => a !== null);

    // Helper functions for recipients
    const parseRecipients = (input) => {
      if (!input) return undefined;
      if (Array.isArray(input)) return input.filter(i => validateEmail(i));
      return input.split(/[,;\s]+/).map(i => i.trim()).filter(i => validateEmail(i));
    };

    const toArray = parseRecipients(to);
    const ccArray = parseRecipients(cc);
    const bccArray = parseRecipients(bcc);

    if (toArray.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid recipient email provided' });
    }

    const emailData = {
      to: toArray,
      cc: ccArray,
      bcc: bccArray,
      subject: subject || 'Candidate Resume',
      html: body || '<p>Please find the attached candidate resume.</p>',
      attachments: finalAttachments
    };

    const emailResult = await sendEmailViaSendGrid(emailData);

    if (emailResult.success) {
      res.status(200).json({ success: true, message: 'Resume shared successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send email', details: emailResult.error });
    }
  } catch (error) {
    console.error('Share resume error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share resume',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// â”€â”€â”€ SCHEDULE INTERVIEW (Email via SendGrid) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.scheduleInterview = async (req, res) => {
  console.log('=== Schedule Interview Request ===');
  const { to, cc, bcc, subject, body } = req.body;

  if (!to || !to.trim()) {
    return res.status(400).json({ success: false, error: 'Recipient email is required' });
  }

  try {
    // Helper function for recipients inline (similar to shareResume)
    const parseRecipients = (input) => {
      if (!input) return undefined;
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validateEmail = (email) => re.test(email);

      if (Array.isArray(input)) return input.filter(i => validateEmail(i));
      return input.split(/[,;\s]+/).map(i => i.trim()).filter(i => validateEmail(i));
    };

    const toArray = parseRecipients(to);
    const ccArray = parseRecipients(cc);
    const bccArray = parseRecipients(bcc);

    if (toArray.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid recipient email provided' });
    }

    const emailData = {
      to: toArray,
      cc: ccArray,
      bcc: bccArray,
      subject: subject || 'Interview Scheduled',
      html: body || '<p>An interview has been scheduled with Prophecy Tech.</p>'
    };

    const emailResult = await sendEmailViaSendGrid(emailData);

    if (emailResult.success) {
      res.status(200).json({ success: true, message: 'Interview scheduled and email sent successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send interview email', details: emailResult.error });
    }
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule interview email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// â”€â”€â”€ Utility helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function parseJsonField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return []; }
  }
  return [];
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

// â”€â”€â”€ LOG STATUS HISTORY (Helper Function) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ─────────────────────────────────────────────────────────────────────────────
// LOG STATUS HISTORY (Helper Function) ───────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// LOG STATUS HISTORY (Helper Function) ───────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// LOG STATUS HISTORY (Helper Function) - with manual ID generation
// ─────────────────────────────────────────────────────────────────────────────

async function logStatusHistory(transaction, { candidateId, fromStatus, toStatus, changedByUserId, reasonText = null }) {
  try {
    console.log(`📜 Logging status change for ${candidateId}: ${fromStatus || 'NULL'} -> ${toStatus}`);

    // Get next ID
    const idResult = await new sql.Request(transaction)
      .query(`SELECT ISNULL(MAX(CandidateStatusHistoryId), 0) + 1 AS NextId FROM [recruit].[CandidateStatusHistory]`);
    const nextId = idResult.recordset[0].NextId;

    await new sql.Request(transaction)
      .input('CandidateStatusHistoryId', sql.BigInt, nextId)
      .input('CandidateId',              sql.BigInt, candidateId)
      .input('FromStatus',               sql.NVarChar(50), fromStatus || null)
      .input('ToStatus',                 sql.NVarChar(50), toStatus)
      .input('ChangedByUserId',          sql.BigInt, changedByUserId || null)
      .input('ReasonText',               sql.NVarChar(500), reasonText)
      .query(`
        INSERT INTO [recruit].[CandidateStatusHistory] (
          CandidateStatusHistoryId,
          CandidateId, 
          StartOn, 
          FromStatus, 
          ToStatus, 
          ChangedAtUtc, 
          ChangedByUserId, 
          ReasonText
        ) VALUES (
          @CandidateStatusHistoryId,
          @CandidateId, 
          SYSUTCDATETIME(), 
          @FromStatus, 
          @ToStatus, 
          SYSUTCDATETIME(), 
          @ChangedByUserId, 
          @ReasonText
        )
      `);

    return { success: true };
  } catch (err) {
    console.error('❌ Failed to log status history:', err.message);
    throw err;
  }
}
// â”€â”€â”€ HANDLE LOCATION UPDATE (Helper Function) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€â”€ HANDLE LOCATION UPDATE (Helper Function) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function handleLocationUpdate(transaction, candidateId, locString) {
  try {
    const parts = locString.split(',').map(s => s.trim()).filter(Boolean);
    let cityName = '', stateVal = '', countryVal = '';

    // Standard expected formats: 
    // 1. "City"
    // 2. "City, State"
    // 3. "City, State, Country"
    if (parts.length === 1) {
      cityName = formatName(parts[0]);
    } else if (parts.length === 2) {
      cityName = formatName(parts[0]);
      stateVal = parts[1];
    } else if (parts.length >= 3) {
      cityName = formatName(parts[0]);
      stateVal = parts[1];
      countryVal = parts[2];
    }

    if (!cityName) {
      console.log('No city name provided, skipping location');
      return;
    }

    let countryId = null;
    let stateId = null;
    let cityId = null;

    // 1. Resolve Country (ID, Name, or ISO2)
    if (countryVal) {
      const isCountryId = !isNaN(parseInt(countryVal)) && /^\d+$/.test(countryVal);

      if (isCountryId) {
        countryId = parseInt(countryVal);
      } else {
        const countryCheck = await new sql.Request(transaction)
          .input('Val', sql.NVarChar(100), countryVal)
          .input('Iso2', sql.Char(2), countryVal.toUpperCase().substring(0, 2)) // Fallback/Hint but used carefully
          .query(`
            SELECT TOP 1 CountryId 
            FROM [core].[Country] 
            WHERE Name = @Val OR Iso2 = @Val OR (LEN(@Val) = 2 AND Iso2 = @Val)
          `);

        if (countryCheck.recordset.length > 0) {
          countryId = countryCheck.recordset[0].CountryId;
        } else {
          // If not found and not a code, maybe it's a new country (but with "pre-filled" we should be careful)
          try {
            const iso2 = countryVal.toUpperCase().substring(0, 2);
            const ci = await new sql.Request(transaction)
              .input('Iso2', sql.Char(2), iso2)
              .input('Name', sql.NVarChar(100), formatName(countryVal))
              .query(`INSERT INTO [core].[Country] (Iso2, Name) OUTPUT INSERTED.CountryId VALUES (@Iso2, @Name)`);
            if (ci.recordset.length > 0) countryId = ci.recordset[0].CountryId;
          } catch (e) {
            // Final fallback lookup
            const rc = await new sql.Request(transaction)
              .input('Val', sql.NVarChar(100), countryVal)
              .query(`SELECT TOP 1 CountryId FROM [core].[Country] WHERE Name LIKE @Val + '%' OR Iso2 = @Val`);
            if (rc.recordset.length > 0) countryId = rc.recordset[0].CountryId;
          }
        }
      }
    }

    // 2. Resolve State (ID, Name, or Code)
    if (stateVal) {
      const isStateId = !isNaN(parseInt(stateVal)) && /^\d+$/.test(stateVal);

      if (isStateId) {
        stateId = parseInt(stateVal);
      } else {
        // Search by Code or Name, scoped to country if possible
        let stateQuery = `SELECT TOP 1 StateId FROM [core].[StateProvince] WHERE (Code = @Val OR Name = @Val)`;
        if (countryId) stateQuery += ' AND CountryId = @CountryId';

        const stateReq = new sql.Request(transaction).input('Val', sql.NVarChar(100), stateVal);
        if (countryId) stateReq.input('CountryId', sql.Int, countryId);

        let stateCheck = await stateReq.query(stateQuery);

        if (stateCheck.recordset.length > 0) {
          stateId = stateCheck.recordset[0].StateId;
        } else if (countryId) {
          // Try without country restriction as fallback
          const stateCheck2 = await new sql.Request(transaction)
            .input('Val', sql.NVarChar(100), stateVal)
            .query(`SELECT TOP 1 StateId FROM [core].[StateProvince] WHERE Code = @Val OR Name = @Val`);
          if (stateCheck2.recordset.length > 0) {
            stateId = stateCheck2.recordset[0].StateId;
          }
        }

        // If still not found, only insert if we have a country context
        if (!stateId && countryId) {
          try {
            const si = await new sql.Request(transaction)
              .input('Name', sql.NVarChar(100), formatName(stateVal))
              .input('Code', sql.NVarChar(10), stateVal.substring(0, 10).toUpperCase())
              .input('CountryId', sql.Int, countryId)
              .query(`INSERT INTO [core].[StateProvince] (Name, Code, CountryId) OUTPUT INSERTED.StateId VALUES (@Name, @Code, @CountryId)`);
            if (si.recordset.length > 0) stateId = si.recordset[0].StateId;
          } catch (e) {
            console.log('State insert skipped (non-critical):', e.message);
          }
        }
      }
    }

    // 3. Resolve City, scoped to state when available
    let cityQuery = `SELECT TOP 1 CityId FROM [core].[City] WHERE Name = @CityName`;
    if (stateId) cityQuery += ' AND StateId = @StateId';

    const cityReq = new sql.Request(transaction).input('CityName', sql.NVarChar(100), cityName);
    if (stateId) cityReq.input('StateId', sql.Int, stateId);
    let cityCheck = await cityReq.query(cityQuery);

    if (cityCheck.recordset.length > 0) {
      cityId = cityCheck.recordset[0].CityId;
    } else {
      // Try fuzzy/unscoped
      const cityCheck2 = await new sql.Request(transaction)
        .input('CityName', sql.NVarChar(100), cityName)
        .query(`SELECT TOP 1 CityId FROM [core].[City] WHERE Name = @CityName`);

      if (cityCheck2.recordset.length > 0) {
        cityId = cityCheck2.recordset[0].CityId;
      } else if (stateId) {
        try {
          const ci2 = await new sql.Request(transaction)
            .input('CityName', sql.NVarChar(100), cityName)
            .input('StateId', sql.Int, stateId)
            .query(`INSERT INTO [core].[City] (Name, StateId) OUTPUT INSERTED.CityId VALUES (@CityName, @StateId)`);
          if (ci2.recordset.length > 0) cityId = ci2.recordset[0].CityId;
        } catch (e) {
          console.log('City insert skipped:', e.message);
        }
      }
    }

    // 4. Update existing Address row, or create Address + EntityAddress
    if (cityId) {
      const eaRes = await new sql.Request(transaction)
        .input('CandidateId', sql.Int, candidateId)
        .query(`
          SELECT TOP 1 ea.AddressId
          FROM [core].[EntityAddress] ea
          WHERE ea.EntityType = 'CANDIDATE' AND ea.EntityId = @CandidateId
          ORDER BY ea.IsPrimary DESC, ea.CreatedAtUtc DESC
        `);

      if (eaRes.recordset.length > 0) {
        await new sql.Request(transaction)
          .input('AddressId', sql.Int, eaRes.recordset[0].AddressId)
          .input('CityId', sql.Int, cityId)
          .query(`UPDATE [core].[Address] SET CityId = @CityId WHERE AddressId = @AddressId`);
      } else {
        const addrRes = await new sql.Request(transaction)
          .input('CityId', sql.Int, cityId)
          .query(`INSERT INTO [core].[Address] (CityId) OUTPUT INSERTED.AddressId VALUES (@CityId)`);

        const newAddressId = addrRes.recordset[0].AddressId;
        await new sql.Request(transaction)
          .input('CandidateId', sql.Int, candidateId)
          .input('AddressId', sql.Int, newAddressId)
          .query(`
            INSERT INTO [core].[EntityAddress]
              (EntityType, EntityId, AddressId, AddressType, IsPrimary, CreatedAtUtc)
            VALUES
              ('CANDIDATE', @CandidateId, @AddressId, 'CURRENT', 1, GETDATE())
          `);
      }
      console.log(`ðŸ“ Location updated: ${cityName}, ${stateVal}, ${countryVal} -> cityId=${cityId}, stateId=${stateId}, countryId=${countryId}`);
    }
  } catch (locErr) {
    console.error('Location update error (non-critical):', locErr.message);
  }
}
