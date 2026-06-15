const { poolPromise, sql } = require("../../config/db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import S3 functions - FIXED: Added getFile import
const { uploadFile, deleteFile, getSignedUrl, getFile } = require("../../config/s3");

// Use memory storage for file processing
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  console.log('File received:', file.originalname, file.mimetype);
  
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const extname = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC and DOCX files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Allow up to 5 files
  }
});

// Middleware to handle multiple files
exports.uploadResume = (req, res, next) => {
  upload.array('resume', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File size too large. Maximum size is 5MB per file.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({ message: 'Too many files. Maximum 5 files allowed.' });
      }
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      console.error('File filter error:', err);
      return res.status(415).json({ message: err.message });
    }
    next();
  });
};

// Update createApplication to handle multiple files
exports.createApplication = async (req, res) => {
  console.log('\n========================================');
  console.log('🎯 CREATE APPLICATION - DUAL STORAGE STARTED');
  console.log('========================================');
  console.log('📋 Request body fields:', Object.keys(req.body));
  console.log('📦 Files received:', req.files ? req.files.length : 0);
  
  if (req.files && req.files.length > 0) {
    req.files.forEach((file, idx) => {
      console.log(`📄 File ${idx + 1}:`, {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        buffer: file.buffer ? `Buffer(${file.buffer.length} bytes)` : 'no buffer'
      });
    });
  }

  const { 
    roleId, 
    name, 
    email, 
    phone, 
    experience, 
    currentCompany, 
    expectedSalary, 
    noticePeriod, 
    location, 
    skills,
    candidateFirstName,
    candidateLastName,
    dateOfBirth,
    workAuthorization,
    rate,
    currentLocation,
    linkedInUrl,
    passport,
    totalITExperience,
    relevantExperience,
    highestDegree,
    currentEmployer,
    currentEmployerAddress,
    isFormerTCSEmployee,
    tcsEmployeeId,
    isFormerTCSBusinessAssociate,
    tcsBusinessAssociateId,
    dateAvailability
  } = req.body;

  try {
    if (!roleId) {
      console.error('❌ Role ID is missing');
      return res.status(400).json({ message: 'Role ID is required' });
    }

    const roleIdNumeric = parseInt(roleId, 10);
    if (isNaN(roleIdNumeric)) {
      console.error('❌ Invalid Role ID:', roleId);
      return res.status(400).json({ message: 'Invalid Role ID. Must be numeric.' });
    }

    console.log('✅ Role ID validated:', roleIdNumeric);

    const pool = await poolPromise;

    // Check if role exists
    const roleCheck = await pool.request()
      .input('roleId', sql.Int, roleIdNumeric)
      .query('SELECT id FROM RecruitmentRoles WHERE id = @roleId');

    if (roleCheck.recordset.length === 0) {
      console.error('❌ Role not found:', roleIdNumeric);
      return res.status(404).json({ message: 'Role not found' });
    }

    console.log('✅ Role found:', roleIdNumeric);

    // Check if email already applied for this role
    if (email && email.trim()) {
      const emailCheck = await pool.request()
        .input('roleId', sql.Int, roleIdNumeric)
        .input('email', sql.NVarChar(100), email.toLowerCase().trim())
        .query('SELECT id FROM Applications WHERE roleId = @roleId AND email = @email');

      if (emailCheck.recordset.length > 0) {
        console.error('❌ Duplicate application for email:', email);
        return res.status(409).json({ message: 'Candidate already applied for this role' });
      }
    }

    console.log('✅ No duplicate found');

    // Process multiple files - NEW FILES GO TO S3
    let resumeFiles = [];
    if (req.files && req.files.length > 0) {
      console.log('Uploading files to S3...');
      
      for (const file of req.files) {
        try {
          // Upload to S3 for new files
          const s3Result = await uploadFile(file, 'recruitment');
          resumeFiles.push({
            storageType: 's3', // Mark as S3 storage
            s3Url: s3Result.url,
            s3Key: s3Result.key,
            fileName: s3Result.fileName,
            fileSize: file.size,
            contentType: file.mimetype
          });
          console.log(`✅ File uploaded to S3: ${s3Result.fileName}`);
        } catch (uploadError) {
          console.error('❌ Failed to upload file to S3, falling back to local storage:', uploadError);
          // Fallback to local storage if S3 fails
          resumeFiles.push({
            storageType: 'local', // Mark as local storage
            resumeData: file.buffer,
            fileName: file.originalname,
            fileSize: file.size,
            contentType: file.mimetype
          });
        }
      }
    }

    console.log('Inserting application into database...');
    
    // Get submitter information from authenticated user
    const submittedBy = req.user ? req.user.username : 'Unknown';

    // Build full name
    let fullName = name?.trim() || '';
    if (!fullName && candidateFirstName && candidateLastName) {
      fullName = `${candidateFirstName} ${candidateLastName}`.trim();
    } else if (!fullName && candidateFirstName) {
      fullName = candidateFirstName.trim();
    } else if (!fullName && candidateLastName) {
      fullName = candidateLastName.trim();
    }
    if (!fullName) {
      fullName = 'Candidate';
    }

    console.log('👤 Candidate name:', fullName);

    // Parse numeric fields
    const expectedSalaryNumeric = expectedSalary ? parseFloat(expectedSalary) : null;
    const rateNumeric = rate ? parseFloat(rate) : null;
    
    // Parse boolean fields
    const isFormerTCSEmployeeValue = isFormerTCSEmployee === 'true' || isFormerTCSEmployee === true ? 1 : 0;
    const isFormerTCSBusinessAssociateValue = isFormerTCSBusinessAssociate === 'true' || isFormerTCSBusinessAssociate === true ? 1 : 0;

    // Insert application - Using String() for safer type coercion
    const insertResult = await pool.request()
      .input('roleId', sql.Int, roleIdNumeric)
      .input('name', sql.NVarChar(100), fullName)
      .input('email', sql.NVarChar(100), (String(email || '').toLowerCase().trim()).substring(0, 100))
      .input('phone', sql.NVarChar(20), (String(phone || '').trim()).substring(0, 20))
      .input('experience', sql.NVarChar(100), (String(experience || '').trim()).substring(0, 100))
      .input('currentCompany', sql.NVarChar(100), (String(currentCompany || '').trim()).substring(0, 100))
      .input('expectedSalary', sql.Decimal(10, 2), expectedSalaryNumeric)
      .input('noticePeriod', sql.NVarChar(50), (String(noticePeriod || '').trim()).substring(0, 50))
      .input('location', sql.NVarChar(200), (String(location || '').trim()).substring(0, 200))
      .input('skills', sql.NVarChar(sql.MAX), String(skills || '').trim())
      .input('status', sql.NVarChar(50), 'Applied')
      .input('currentStep', sql.Int, 0)
      .input('submittedBy', sql.NVarChar(100), String(submittedBy || 'Unknown').substring(0, 100))
      .input('appliedAt', sql.DateTime2, new Date())
      .input('candidateFirstName', sql.NVarChar(100), (String(candidateFirstName || '').trim()).substring(0, 100))
      .input('candidateLastName', sql.NVarChar(100), (String(candidateLastName || '').trim()).substring(0, 100))
      .input('dateOfBirth', sql.Date, dateOfBirth || null)
      .input('workAuthorization', sql.NVarChar(50), (String(workAuthorization || '').trim()).substring(0, 50))
      .input('rate', sql.Decimal(10, 2), rateNumeric)
      .input('currentLocation', sql.NVarChar(200), (String(currentLocation || '').trim()).substring(0, 200))
      .input('linkedInUrl', sql.NVarChar(200), (String(linkedInUrl || '').trim()).substring(0, 200))
      .input('passport', sql.NVarChar(50), (String(passport || '').trim()).substring(0, 50))
      .input('totalITExperience', sql.NVarChar(50), (String(totalITExperience || '').trim()).substring(0, 50))
      .input('relevantExperience', sql.NVarChar(100), (String(relevantExperience || '').trim()).substring(0, 100))
      .input('highestDegree', sql.NVarChar(100), (String(highestDegree || '').trim()).substring(0, 100))
      .input('currentEmployer', sql.NVarChar(100), (String(currentEmployer || '').trim()).substring(0, 100))
      .input('currentEmployerAddress', sql.NVarChar(500), (String(currentEmployerAddress || '').trim()).substring(0, 500))
      .input('isFormerTCSEmployee', sql.Bit, isFormerTCSEmployeeValue)
      .input('tcsEmployeeId', sql.NVarChar(50), (String(tcsEmployeeId || '').trim()).substring(0, 50))
      .input('isFormerTCSBusinessAssociate', sql.Bit, isFormerTCSBusinessAssociateValue)
      .input('tcsBusinessAssociateId', sql.NVarChar(50), (String(tcsBusinessAssociateId || '').trim()).substring(0, 50))
      .input('dateAvailability', sql.Date, dateAvailability || null)
      .query(`
        INSERT INTO Applications 
        (roleId, name, email, phone, experience, currentCompany, expectedSalary, 
         noticePeriod, location, skills, status, currentStep, submittedBy, appliedAt,
         candidateFirstName, candidateLastName, dateOfBirth, workAuthorization, rate,
         currentLocation, linkedInUrl, passport, totalITExperience, relevantExperience,
         highestDegree, currentEmployer, currentEmployerAddress, isFormerTCSEmployee,
         tcsEmployeeId, isFormerTCSBusinessAssociate, tcsBusinessAssociateId, dateAvailability)
        OUTPUT INSERTED.id 
        VALUES 
        (@roleId, @name, @email, @phone, @experience, @currentCompany, @expectedSalary, 
         @noticePeriod, @location, @skills, @status, @currentStep, @submittedBy, @appliedAt,
         @candidateFirstName, @candidateLastName, @dateOfBirth, @workAuthorization, @rate,
         @currentLocation, @linkedInUrl, @passport, @totalITExperience, @relevantExperience,
         @highestDegree, @currentEmployer, @currentEmployerAddress, @isFormerTCSEmployee,
         @tcsEmployeeId, @isFormerTCSBusinessAssociate, @tcsBusinessAssociateId, @dateAvailability)
      `);

    const newApplicationId = insertResult.recordset[0].id;
    console.log('✅ Application created with ID:', newApplicationId);

     // ✅ ADD NOTIFICATION FOR ROLE OWNER AND MANAGERS ABOUT NEW APPLICATION
    try {
      // Get role details including assignTo (role owner)
      const roleResult = await pool.request()
        .input('roleId', sql.Int, roleIdNumeric)
        .query(`
          SELECT rr.assignTo, rr.role as roleName, rr.client,
                 u.role as ownerRole
          FROM RecruitmentRoles rr
          LEFT JOIN userinfo u ON rr.assignTo = u.username
          WHERE rr.id = @roleId
        `);

      if (roleResult.recordset.length > 0) {
        const role = roleResult.recordset[0];
        const submittedBy = req.user ? req.user.username : 'Unknown';
        
        // Notify the role owner
        if (role.assignTo) {
          await require('../controllers/recruitmentController').createNotification(
            role.assignTo,
            `New application submitted for ${role.roleName} by ${submittedBy}`,
            'new_application',
            {
              applicationId: newApplicationId,
              roleId: roleIdNumeric,
              roleName: role.roleName,
              client: role.client,
              candidateName: fullName,
              submittedBy: submittedBy
            },
            submittedBy
          );
        }
        
        // Notify all managers and admins
        const managersResult = await pool.request()
          .query(`
            SELECT username FROM userinfo 
            WHERE role IN ('manager', 'admin')
          `);
        
        for (const manager of managersResult.recordset) {
          await require('../controllers/recruitmentController').createNotification(
            manager.username,
            `New application for ${role.roleName} submitted by ${submittedBy}`,
            'new_application',
            {
              applicationId: newApplicationId,
              roleId: roleIdNumeric,
              roleName: role.roleName,
              client: role.client,
              candidateName: fullName,
              submittedBy: submittedBy
            },
            submittedBy
          );
        }
      }
    } catch (notificationError) {
      console.error('Error creating application notifications:', notificationError);
      // Don't fail the application creation if notifications fail
    }

    // Insert resume files info to database with storage type
    let uploadedResumeCount = 0;
    if (resumeFiles.length > 0) {
      console.log(`\n📎 Storing ${resumeFiles.length} resume file(s)...`);
      
      for (const file of resumeFiles) {
        try {
          console.log(`  ➜ Storing: ${file.fileName} (${file.fileSize} bytes)`);
          
          if (file.storageType === 's3') {
            // S3 Storage
            await pool.request()
              .input('applicationId', sql.Int, newApplicationId)
              .input('s3Url', sql.NVarChar, file.s3Url)
              .input('s3Key', sql.NVarChar, file.s3Key)
              .input('resumeFileName', sql.NVarChar(255), file.fileName.substring(0, 255))
              .input('resumeContentType', sql.NVarChar, file.contentType)
              .input('resumeFileSize', sql.Int, file.fileSize)
              .input('storageType', sql.NVarChar, 's3')
              .query(`
                INSERT INTO ApplicationResumes 
                (applicationId, s3Url, s3Key, resumeFileName, resumeContentType, resumeFileSize, storageType) 
                VALUES 
                (@applicationId, @s3Url, @s3Key, @resumeFileName, @resumeContentType, @resumeFileSize, @storageType)
              `);
          } else {
            // Local Storage (fallback)
            await pool.request()
              .input('applicationId', sql.Int, newApplicationId)
              .input('resumeData', sql.VarBinary(sql.MAX), file.resumeData)
              .input('resumeFileName', sql.NVarChar(255), file.fileName.substring(0, 255))
              .input('resumeContentType', sql.NVarChar, file.contentType)
              .input('resumeFileSize', sql.Int, file.fileSize)
              .input('storageType', sql.NVarChar, 'local')
              .query(`
                INSERT INTO ApplicationResumes 
                (applicationId, resumeData, resumeFileName, resumeContentType, resumeFileSize, storageType) 
                VALUES 
                (@applicationId, @resumeData, @resumeFileName, @resumeContentType, @resumeFileSize, @storageType)
              `);
          }
          
          uploadedResumeCount++;
          console.log(`  ✅ Resume stored: ${file.fileName}`);
          
        } catch (resumeError) {
          console.error(`  ❌ Error storing resume ${file.fileName}:`, resumeError.message);
        }
      }
      
      console.log(`✅ Completed: ${uploadedResumeCount}/${resumeFiles.length} resumes stored`);
    }

    // Update application count in role
    try {
      await pool.request()
        .input('roleId', sql.Int, roleIdNumeric)
        .query(`
          UPDATE RecruitmentRoles 
          SET applicationCount = (SELECT COUNT(*) FROM Applications WHERE roleId = @roleId) 
          WHERE id = @roleId
        `);
      console.log('✅ Application count updated');
    } catch (updateError) {
      console.error('⚠️ Could not update application count:', updateError.message);
    }

    console.log('\n========================================');
    console.log('✅ APPLICATION CREATED SUCCESSFULLY');
    console.log('========================================\n');

    const s3FilesCount = resumeFiles.filter(f => f.storageType === 's3').length;
    const localFilesCount = resumeFiles.filter(f => f.storageType === 'local').length;

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: newApplicationId,
      candidateName: fullName,
      filesUploaded: uploadedResumeCount,
      storageInfo: {
        s3Files: s3FilesCount,
        localFiles: localFilesCount,
        primaryStorage: 'AWS S3'
      },
      submittedBy: submittedBy,
      submittedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('\n❌ ERROR CREATING APPLICATION:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);

    if (error.code === 'EREQUEST') {
      return res.status(400).json({ 
        message: 'Database validation error', 
        error: error.message,
        details: 'Please check that all required database columns have default values or allow NULL'
      });
    }
    
    if (error.message.includes('converting data type')) {
      return res.status(400).json({ 
        message: 'Invalid data format',
        error: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Server error while creating application', 
      error: error.message 
    });
  }
};


// New function to get all resumes for an application
exports.getApplicationResumes = async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .query(`
        SELECT id, resumeFileName, resumeContentType, resumeFileSize, uploadedAt, storageType, s3Url
        FROM ApplicationResumes
        WHERE applicationId = @applicationId
        ORDER BY uploadedAt DESC
      `);
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching application resumes:", error);
    res.status(500).json({ 
      message: "Server error while fetching resumes", 
      error: error.message 
    });
  }
};





// New function to delete a specific resume
exports.deleteApplicationResume = async (req, res) => {
  try {
    const resumeId = req.params.resumeId;
    
    const pool = await poolPromise;
    
    // Get resume info including storage type
    const appResult = await pool.request()
      .input("resumeId", sql.Int, parseInt(resumeId))
      .query(`
        SELECT applicationId, s3Key, storageType 
        FROM ApplicationResumes 
        WHERE id = @resumeId
      `);
    
    if (appResult.recordset.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }
    
    const applicationId = appResult.recordset[0].applicationId;
    const s3Key = appResult.recordset[0].s3Key;
    const storageType = appResult.recordset[0].storageType;
    
    // Delete from S3 if it's an S3-stored file
    if (storageType === 's3' && s3Key) {
      try {
        await deleteFile(s3Key);
        console.log('✅ File deleted from S3:', s3Key);
      } catch (s3Error) {
        console.error('❌ Error deleting from S3:', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }
    
    // Delete the resume record from database
    await pool.request()
      .input("resumeId", sql.Int, parseInt(resumeId))
      .query("DELETE FROM ApplicationResumes WHERE id = @resumeId");
    
    // Check if there are any resumes left for this application
    const remainingResumes = await pool.request()
      .input("applicationId", sql.Int, applicationId)
      .query("SELECT COUNT(*) as count FROM ApplicationResumes WHERE applicationId = @applicationId");
    
    res.status(200).json({ 
      message: "Resume deleted successfully",
      remainingResumes: remainingResumes.recordset[0].count,
      storageType: storageType,
      s3Deleted: !!(storageType === 's3' && s3Key)
    });
    
  } catch (error) {
    console.error("Error deleting resume:", error);
    res.status(500).json({ 
      message: "Server error while deleting resume", 
      error: error.message 
    });
  }
};

// Update application status function
exports.updateApplicationStatus = async (req, res) => {
  const applicationId = req.params.id;
  const { currentStep, status } = req.body;
  
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input("id", sql.Int, parseInt(applicationId))
      .input("currentStep", sql.Int, parseInt(currentStep))
      .input("status", sql.NVarChar(50), status)
      .query(`
        UPDATE Applications
        SET currentStep = @currentStep, status = @status, updatedAt = GETDATE()
        WHERE id = @id
      `);
    
    res.status(200).json({ message: "Application status updated successfully" });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Server error while updating status", error: error.message });
  }
};

// Get hiring steps function
exports.getApplicationHiringSteps = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id, stepName, stepOrder
      FROM HiringSteps
      WHERE isActive = 1
      ORDER BY stepOrder
    `);
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching hiring steps:", error);
    res.status(500).json({ message: "Server error while fetching steps", error: error.message });
  }
};


// Fixed function to serve resume from database
exports.serveResumeFromDB = async (req, res) => {
  try {
    console.log('=== SERVE RESUME STARTED ===');
    const applicationId = req.params.applicationId;
    const resumeId = req.params.resumeId;
    
    console.log('Request parameters:', { applicationId, resumeId });

    const pool = await poolPromise;
    const result = await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .input("resumeId", sql.Int, parseInt(resumeId))
      .query(`
        SELECT
          ar.id,
          ar.s3Url,
          ar.s3Key,
          ar.resumeData,
          ar.resumeFileName,
          ar.resumeContentType,
          ar.resumeFileSize,
          ar.storageType,
          a.name,
          rr.assignTo,
          rr.recruiter
        FROM ApplicationResumes ar
        INNER JOIN Applications a ON ar.applicationId = a.id
        INNER JOIN RecruitmentRoles rr ON a.roleId = rr.id
        WHERE ar.applicationId = @applicationId
        AND ar.id = @resumeId
      `);

    console.log('Database query result:', result.recordset);

    if (result.recordset.length === 0) {
      console.log('❌ Resume not found in database');
      return res.status(404).json({ message: "Resume not found" });
    }

    const resume = result.recordset[0];
    console.log('Resume data:', {
      id: resume.id,
      fileName: resume.resumeFileName,
      storageType: resume.storageType,
      s3Key: resume.s3Key,
      hasResumeData: !!resume.resumeData,
      fileSize: resume.resumeFileSize
    });
    
    const displayFileName = resume.resumeFileName || 'Resume';
    console.log('Display filename:', displayFileName);
    
    // Determine content type
    let contentType = resume.resumeContentType;
    if (!contentType) {
      const ext = path.extname(displayFileName).toLowerCase();
      switch (ext) {
        case '.pdf': contentType = 'application/pdf'; break;
        case '.doc': contentType = 'application/msword'; break;
        case '.docx': contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
        default: contentType = 'application/octet-stream';
      }
    }

    // Set proper content disposition
    let contentDisposition = `attachment; filename="${displayFileName}"`;
    if (contentType.includes('word') || contentType.includes('msword') || 
        displayFileName.endsWith('.doc') || displayFileName.endsWith('.docx')) {
      contentDisposition = `attachment; filename="${displayFileName}"`;
    }

    // Set common headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', resume.resumeFileSize);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Storage-Type', resume.storageType || 'unknown');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');

    // Handle different storage types
    if (resume.storageType === 's3' && resume.s3Key) {
      // S3 Storage
      console.log('📁 Serving from S3 via backend proxy:', resume.s3Key);
      try {
        const s3File = await getFile(resume.s3Key);
        
        // Set proper headers
        res.setHeader('Content-Type', s3File.ContentType || contentType);
        res.setHeader('Content-Length', s3File.ContentLength);
        res.setHeader('Content-Disposition', contentDisposition);
        
        // Send the file buffer directly
        res.end(s3File.Body);
        
      } catch (s3Error) {
        console.error("❌ Error accessing S3 file:", s3Error);
        // Fallback to local if S3 fails
        if (resume.resumeData) {
          console.log('🔄 Falling back to local storage');
          res.end(resume.resumeData);
        } else {
          throw new Error('S3 access failed and no local fallback available');
        }
      }
    } else if (resume.resumeData) {
      // Local Database Storage (BLOB)
      console.log('📁 Serving from Database BLOB with filename:', displayFileName);
      res.end(resume.resumeData);
    } else {
      return res.status(404).json({ message: "Resume file data not found" });
    }

  } catch (error) {
    console.error("❌ Error serving resume:", error);
    res.status(500).json({
      message: "Server error while serving resume",
      error: error.message,
      storageType: 'unknown'
    });
  }
};
// Keep the original file system approach as fallback
exports.serveResumeFromFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    const filePath = path.join(uploadDir, filename);

    console.log('=== Serving Resume from File System ===');
    console.log('Requested filename:', filename);
    console.log('User:', req.user.username, 'Role:', req.user.role);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('Resume file not found at path:', filePath);
      return res.status(404).json({ message: "Resume file not found" });
    }

    // Permission check
    const pool = await poolPromise;
    const result = await pool.request()
      .input("resumeUrl", sql.NVarChar, `/uploads/resumes/${filename}`)
      .query(`
        SELECT a.id, a.name, rr.recruiter, rr.assignTo 
        FROM Applications a
        JOIN RecruitmentRoles rr ON a.roleId = rr.id
        WHERE a.resumeUrl = @resumeUrl
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Resume record not found in database" });
    }

    const application = result.recordset[0];
    const currentUser = req.user.username;
    const currentUserRole = req.user.role;
    const currentUserId = req.user.userId || req.user.id;

    // Fetch user's historical/recruiter names
    const recruitersResult = await pool.request()
      .input("userId", sql.Int, currentUserId)
      .query("SELECT name FROM Recruiters WHERE userId = @userId");
    const userRecruiterNames = recruitersResult.recordset.map(r => r.name.toLowerCase());

    // Enhanced permission check
    const hasPermission = 
      currentUserRole === 'manager' || 
      currentUserRole === 'admin' ||
      (application.assignTo && (
        application.assignTo.toLowerCase() === currentUser.toLowerCase() ||
        userRecruiterNames.includes(application.assignTo.toLowerCase())
      )) ||
      application.recruiter === currentUserId;

    if (!hasPermission) {
      return res.status(403).json({ message: "Unauthorized to view this resume" });
    }

    // Serve file with proper headers
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf': contentType = 'application/pdf'; break;
      case '.doc': contentType = 'application/msword'; break;
      case '.docx': contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('Error streaming resume:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error serving resume" });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error("Error serving resume from file:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "Server error while serving resume",
        error: error.message 
      });
    }
  }
};

// Function to get applications with resume info
// Update getApplicationsWithResumes to include all new fields
exports.getApplicationsWithResumes = async (req, res) => {
  try {
    const { roleId } = req.params;
    console.log('Fetching applications for role ID:', roleId);

    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('roleId', sql.Int, parseInt(roleId))
      .query(`
        SELECT 
          a.id, a.name, a.email, a.phone, a.experience, a.currentCompany, 
          a.expectedSalary, a.noticePeriod, a.location, a.skills, a.status, 
          a.currentStep, a.appliedAt, a.updatedAt, a.submittedBy,
          a.candidateFirstName, a.candidateLastName, a.dateOfBirth, a.workAuthorization,
          a.rate, a.currentLocation, a.linkedInUrl, a.passport, a.totalITExperience,
          a.relevantExperience, a.highestDegree, a.currentEmployer, a.currentEmployerAddress,
          a.isFormerTCSEmployee, a.tcsEmployeeId, a.isFormerTCSBusinessAssociate,
          a.tcsBusinessAssociateId, a.dateAvailability,
          (SELECT COUNT(*) FROM ApplicationResumes ar WHERE ar.applicationId = a.id) as resumeCount,
          (SELECT TOP 1 ar.resumeFileName FROM ApplicationResumes ar WHERE ar.applicationId = a.id ORDER BY ar.uploadedAt DESC) as resumeFileName,
          (SELECT TOP 1 ar.id FROM ApplicationResumes ar WHERE ar.applicationId = a.id ORDER BY ar.uploadedAt DESC) as resumeId
        FROM Applications a 
        WHERE a.roleId = @roleId 
        ORDER BY a.appliedAt DESC
      `);

    console.log('Found', result.recordset.length, 'applications for role', roleId);
    
    result.recordset.forEach(app => {
      if (app.resumeCount > 0) {
        console.log(`  📄 Application ${app.id}: ${app.resumeCount} resume(s) - File: ${app.resumeFileName}`);
      }
    });

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error while fetching applications', error: error.message });
  }
};


// Edit application function
exports.editApplication = async (req, res) => {
  const applicationId = req.params.id;
  const {
    name, email, phone, experience,
    currentCompany, expectedSalary, noticePeriod,
    location, skills
  } = req.body;

  try {
    // Validation
    if (!name || !email || !phone || !experience) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const pool = await poolPromise;
    
    // Check if application exists
    const appCheck = await pool.request()
      .input("id", sql.Int, parseInt(applicationId))
      .query("SELECT id FROM Applications WHERE id = @id");
    
    if (appCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update application
    await pool.request()
      .input("id", sql.Int, parseInt(applicationId))
      .input("name", sql.NVarChar, name.trim())
      .input("email", sql.NVarChar, email.toLowerCase().trim())
      .input("phone", sql.NVarChar, phone.trim())
      .input("experience", sql.NVarChar, experience.trim())
      .input("currentCompany", sql.NVarChar, currentCompany?.trim() || null)
      .input("expectedSalary", sql.NVarChar, expectedSalary?.trim() || null)
      .input("noticePeriod", sql.NVarChar, noticePeriod?.trim() || null)
      .input("location", sql.NVarChar, location?.trim() || null)
      .input("skills", sql.NVarChar, skills?.trim() || null)
      .query(`
        UPDATE Applications 
        SET name = @name, email = @email, phone = @phone, 
            experience = @experience, currentCompany = @currentCompany,
            expectedSalary = @expectedSalary, noticePeriod = @noticePeriod,
            location = @location, skills = @skills, updatedAt = GETDATE()
        WHERE id = @id
      `);
    
    res.status(200).json({ message: "Application updated successfully" });
    
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ 
      message: "Server error while updating application", 
      error: error.message 
    });
  }
};

// Delete application function
// In the deleteApplication function, update to return the updated application count
exports.deleteApplication = async (req, res) => {
  const applicationId = req.params.id;

  try {
    const pool = await poolPromise;
    
    // Get roleId before deleting to update application count
    const roleResult = await pool.request()
      .input("id", sql.Int, parseInt(applicationId))
      .query("SELECT roleId FROM Applications WHERE id = @id");
    
    if (roleResult.recordset.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    const roleId = roleResult.recordset[0].roleId;
    
    // Delete application
    await pool.request()
      .input("id", sql.Int, parseInt(applicationId))
      .query("DELETE FROM Applications WHERE id = @id");
    
    // Update application count in role and get the new count
    const countResult = await pool.request()
      .input("roleId", sql.Int, parseInt(roleId))
      .query(`
        UPDATE RecruitmentRoles
        SET applicationCount = (
          SELECT COUNT(*) FROM Applications WHERE roleId = @roleId
        )
        OUTPUT INSERTED.applicationCount
        WHERE id = @roleId
      `);
    
    const newApplicationCount = countResult.recordset[0].applicationCount;
    
    res.status(200).json({ 
      message: "Application deleted successfully",
      newApplicationCount: newApplicationCount
    });
    
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ 
      message: "Server error while deleting application", 
      error: error.message 
    });
  }
};




// Update application with resume (PUT /api/recruitment/applications/:id)
exports.updateApplication = async (req, res) => {
  const applicationId = req.params.id;
  const {
    email, phone, experience,
    currentCompany, expectedSalary, noticePeriod,
    location, skills,
    candidateFirstName,
    candidateLastName,
    dateOfBirth,
    workAuthorization,
    rate,
    currentLocation,
    linkedInUrl,
    passport,
    totalITExperience,
    relevantExperience,
    highestDegree,
    currentEmployer,
    currentEmployerAddress,
    isFormerTCSEmployee,
    tcsEmployeeId,
    isFormerTCSBusinessAssociate,
    tcsBusinessAssociateId,
    dateAvailability
  } = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if application exists
    const appCheck = await pool.request()
      .input("id", sql.Int, parseInt(applicationId))
      .query("SELECT id, roleId FROM Applications WHERE id = @id");
    
    if (appCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    const roleId = appCheck.recordset[0].roleId;
    
    // Process new files for S3 storage
    let newResumeFiles = [];
    if (req.files && req.files.length > 0) {
      console.log('Uploading new files to S3 for update...');
      
      for (const file of req.files) {
        try {
          const s3Result = await uploadFile(file, 'recruitment');
          newResumeFiles.push({
            storageType: 's3',
            s3Url: s3Result.url,
            s3Key: s3Result.key,
            fileName: s3Result.fileName,
            fileSize: file.size,
            contentType: file.mimetype
          });
          console.log(`✅ New file uploaded to S3: ${s3Result.fileName}`);
        } catch (uploadError) {
          console.error('❌ Failed to upload file to S3, using local storage:', uploadError);
          newResumeFiles.push({
            storageType: 'local',
            resumeData: file.buffer,
            fileName: file.originalname,
            fileSize: file.size,
            contentType: file.mimetype
          });
        }
      }
    }

    // Build full name
    let fullName = '';
    if (candidateFirstName && candidateLastName) {
      fullName = `${candidateFirstName} ${candidateLastName}`.trim();
    } else if (candidateFirstName) {
      fullName = candidateFirstName.trim();
    } else if (candidateLastName) {
      fullName = candidateLastName.trim();
    } else {
      // If no name provided, keep existing name from database
      const currentApp = await pool.request()
        .input("id", sql.Int, parseInt(applicationId))
        .query("SELECT name FROM Applications WHERE id = @id");
      fullName = currentApp.recordset[0].name || 'Candidate';
    }

    // Parse numeric fields
    const expectedSalaryNumeric = expectedSalary && expectedSalary.trim() 
      ? parseFloat(expectedSalary) 
      : null;
    const rateNumeric = rate && rate.trim() 
      ? parseFloat(rate) 
      : null;

    // Parse boolean fields
    const isFormerTCSEmployeeValue = isFormerTCSEmployee === 'true' || isFormerTCSEmployee === true ? 1 : 0;
    const isFormerTCSBusinessAssociateValue = isFormerTCSBusinessAssociate === 'true' || isFormerTCSBusinessAssociate === true ? 1 : 0;

    // Build update query
    const updateQuery = `
      UPDATE Applications 
      SET 
        name = @name, 
        email = @email, 
        phone = @phone, 
        experience = @experience, 
        currentCompany = @currentCompany,
        expectedSalary = @expectedSalary, 
        noticePeriod = @noticePeriod,
        location = @location, 
        skills = @skills, 
        updatedAt = GETDATE(),
        candidateFirstName = @candidateFirstName, 
        candidateLastName = @candidateLastName,
        dateOfBirth = @dateOfBirth, 
        workAuthorization = @workAuthorization,
        rate = @rate, 
        currentLocation = @currentLocation, 
        linkedInUrl = @linkedInUrl,
        passport = @passport, 
        totalITExperience = @totalITExperience,
        relevantExperience = @relevantExperience, 
        highestDegree = @highestDegree,
        currentEmployer = @currentEmployer, 
        currentEmployerAddress = @currentEmployerAddress,
        isFormerTCSEmployee = @isFormerTCSEmployee, 
        tcsEmployeeId = @tcsEmployeeId,
        isFormerTCSBusinessAssociate = @isFormerTCSBusinessAssociate, 
        tcsBusinessAssociateId = @tcsBusinessAssociateId, 
        dateAvailability = @dateAvailability
      WHERE id = @id
    `;
    
    // Execute update
    const request = pool.request()
      .input("id", sql.Int, parseInt(applicationId))
      .input("name", sql.NVarChar(100), fullName)
      .input("email", sql.NVarChar(100), (email?.toLowerCase().trim() || '').substring(0, 100))
      .input("phone", sql.NVarChar(20), (phone?.trim() || '').substring(0, 20))
      .input("experience", sql.NVarChar(100), (experience?.trim() || '').substring(0, 100))
      .input("currentCompany", sql.NVarChar(100), (currentCompany?.trim() || '').substring(0, 100))
      .input("expectedSalary", sql.Decimal(10, 2), expectedSalaryNumeric)
      .input("noticePeriod", sql.NVarChar(50), (noticePeriod?.trim() || '').substring(0, 50))
      .input("location", sql.NVarChar(200), (location?.trim() || '').substring(0, 200))
      .input("skills", sql.NVarChar(sql.MAX), skills?.trim() || '')
      .input("candidateFirstName", sql.NVarChar(100), (candidateFirstName?.trim() || '').substring(0, 100))
      .input("candidateLastName", sql.NVarChar(100), (candidateLastName?.trim() || '').substring(0, 100))
      .input("dateOfBirth", sql.Date, dateOfBirth || null)
      .input("workAuthorization", sql.NVarChar(50), (workAuthorization?.trim() || '').substring(0, 50))
      .input("rate", sql.Decimal(10, 2), rateNumeric)
      .input("currentLocation", sql.NVarChar(200), (currentLocation?.trim() || '').substring(0, 200))
      .input("linkedInUrl", sql.NVarChar(200), (linkedInUrl?.trim() || '').substring(0, 200))
      .input("passport", sql.NVarChar(50), (passport?.trim() || '').substring(0, 50))
      .input("totalITExperience", sql.NVarChar(50), (totalITExperience?.trim() || '').substring(0, 50))
      .input("relevantExperience", sql.NVarChar(100), (relevantExperience?.trim() || '').substring(0, 100))
      .input("highestDegree", sql.NVarChar(100), (highestDegree?.trim() || '').substring(0, 100))
      .input("currentEmployer", sql.NVarChar(100), (currentEmployer?.trim() || '').substring(0, 100))
      .input("currentEmployerAddress", sql.NVarChar(500), (currentEmployerAddress?.trim() || '').substring(0, 500))
      .input("isFormerTCSEmployee", sql.Bit, isFormerTCSEmployeeValue)
      .input("tcsEmployeeId", sql.NVarChar(50), (tcsEmployeeId?.trim() || '').substring(0, 50))
      .input("isFormerTCSBusinessAssociate", sql.Bit, isFormerTCSBusinessAssociateValue)
      .input("tcsBusinessAssociateId", sql.NVarChar(50), (tcsBusinessAssociateId?.trim() || '').substring(0, 50))
      .input("dateAvailability", sql.Date, dateAvailability || null);
    
    await request.query(updateQuery);

    // Insert new resume files if any
    if (newResumeFiles.length > 0) {
      for (const file of newResumeFiles) {
        if (file.storageType === 's3') {
          await pool.request()
            .input("applicationId", sql.Int, parseInt(applicationId))
            .input("s3Url", sql.NVarChar, file.s3Url)
            .input("s3Key", sql.NVarChar, file.s3Key)
            .input("resumeFileName", sql.NVarChar(255), file.fileName.substring(0, 255))
            .input("resumeContentType", sql.NVarChar, file.contentType)
            .input("resumeFileSize", sql.Int, file.fileSize)
            .input("storageType", sql.NVarChar, 's3')
            .query(`
              INSERT INTO ApplicationResumes (
                applicationId, s3Url, s3Key, resumeFileName, 
                resumeContentType, resumeFileSize, storageType
              )
              VALUES (
                @applicationId, @s3Url, @s3Key, @resumeFileName,
                @resumeContentType, @resumeFileSize, @storageType
              )
            `);
        } else {
          await pool.request()
            .input("applicationId", sql.Int, parseInt(applicationId))
            .input("resumeData", sql.VarBinary(sql.MAX), file.resumeData)
            .input("resumeFileName", sql.NVarChar(255), file.fileName.substring(0, 255))
            .input("resumeContentType", sql.NVarChar, file.contentType)
            .input("resumeFileSize", sql.Int, file.fileSize)
            .input("storageType", sql.NVarChar, 'local')
            .query(`
              INSERT INTO ApplicationResumes (
                applicationId, resumeData, resumeFileName, 
                resumeContentType, resumeFileSize, storageType
              )
              VALUES (
                @applicationId, @resumeData, @resumeFileName,
                @resumeContentType, @resumeFileSize, @storageType
              )
            `);
        }
      }
    }
    
    const s3FilesCount = newResumeFiles.filter(f => f.storageType === 's3').length;
    const localFilesCount = newResumeFiles.filter(f => f.storageType === 'local').length;
    
    res.status(200).json({ 
      message: "Application updated successfully",
      applicationId: applicationId,
      filesUploaded: newResumeFiles.length,
      newFiles: {
        total: newResumeFiles.length,
        s3: s3FilesCount,
        local: localFilesCount
      }
    });
    
  } catch (error) {
    console.error("Error updating application:", error);
    console.error("Error message:", error.message);
    
    if (error.message.includes('converting data type')) {
      return res.status(400).json({ 
        message: "Invalid data format - numeric fields contain invalid values",
        error: error.message 
      });
    }

    if (error.message.includes('Cannot insert NULL')) {
      return res.status(400).json({ 
        message: "Missing required fields or invalid data",
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Server error while updating application", 
      error: error.message 
    });
  }
};


// Save or update step notes
exports.saveStepNotes = async (req, res) => {
  const { applicationId, stepIndex, stepName, notes } = req.body;
  
  try {
    if (!applicationId || stepIndex === undefined || !stepName) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const pool = await poolPromise;
    const createdBy = req.user ? req.user.username : 'Unknown';

    // Check if notes already exist for this application and step
    const existingNotes = await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .input("stepIndex", sql.Int, parseInt(stepIndex))
      .query(`
        SELECT id FROM ApplicationStepNotes 
        WHERE applicationId = @applicationId AND stepIndex = @stepIndex
      `);

    if (existingNotes.recordset.length > 0) {
      // Update existing notes
      await pool.request()
        .input("applicationId", sql.Int, parseInt(applicationId))
        .input("stepIndex", sql.Int, parseInt(stepIndex))
        .input("notes", sql.NVarChar(sql.MAX), notes || null)
        .query(`
          UPDATE ApplicationStepNotes 
          SET notes = @notes, updatedAt = GETDATE()
          WHERE applicationId = @applicationId AND stepIndex = @stepIndex
        `);
    } else {
      // Insert new notes
      await pool.request()
        .input("applicationId", sql.Int, parseInt(applicationId))
        .input("stepIndex", sql.Int, parseInt(stepIndex))
        .input("stepName", sql.NVarChar(100), stepName)
        .input("notes", sql.NVarChar(sql.MAX), notes || null)
        .input("createdBy", sql.NVarChar, createdBy)
        .query(`
          INSERT INTO ApplicationStepNotes 
          (applicationId, stepIndex, stepName, notes, createdBy)
          VALUES 
          (@applicationId, @stepIndex, @stepName, @notes, @createdBy)
        `);
    }

    res.status(200).json({ 
      message: "Step notes saved successfully",
      notes: notes 
    });

  } catch (error) {
    console.error("Error saving step notes:", error);
    res.status(500).json({ 
      message: "Server error while saving step notes", 
      error: error.message 
    });
  }
};

// Get all notes for an application
exports.getApplicationStepNotes = async (req, res) => {
  const applicationId = req.params.applicationId;
  
  try {
    const pool = await poolPromise;
    
    console.log('📋 Fetching notes for application:', applicationId);
    
    const result = await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .query(`
        SELECT 
          stepIndex, 
          stepName, 
          notes, 
          createdAt, 
          updatedAt, 
          createdBy, 
          assignedTo
        FROM ApplicationStepNotes
        WHERE applicationId = @applicationId
        ORDER BY stepIndex, createdAt
      `);

    console.log('📦 Raw notes data from DB:', result.recordset);

    // Convert to object with stepIndex as key for easier frontend access
    const notesMap = {};
    const assignments = {};
    
    result.recordset.forEach(note => {
      // Store notes by step index
      notesMap[note.stepIndex] = note.notes;
      
      console.log(`📝 Note for step ${note.stepIndex}:`, {
        stepName: note.stepName,
        assignedTo: note.assignedTo,
        notes: note.notes ? 'Has notes' : 'No notes'
      });
      
      // Track assignments for screening step (index 1)
      // Check for both index 1 AND any step with 'Screening' in the name
      if ((note.stepIndex === 1 || note.stepName.toLowerCase().includes('screening')) 
          && note.assignedTo) {
        assignments.screeningAssignedTo = note.assignedTo;
        assignments.screeningAssignedBy = note.createdBy;
        assignments.screeningAssignedAt = note.createdAt;
        
        console.log('✅ Found screening assignment:', {
          assignedTo: note.assignedTo,
          assignedBy: note.createdBy,
          stepIndex: note.stepIndex,
          stepName: note.stepName
        });
      }
    });

    const response = {
      notes: notesMap,
      assignments: assignments
    };

    console.log('📤 Sending response:', response);

    res.status(200).json(response);

  } catch (error) {
    console.error("❌ Error fetching application step notes:", error);
    res.status(500).json({ 
      message: "Server error while fetching step notes", 
      error: error.message 
    });
  }
};
// Get notes for a specific step
exports.getStepNotes = async (req, res) => {
  const { applicationId, stepIndex } = req.params;
  
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .input("stepIndex", sql.Int, parseInt(stepIndex))
      .query(`
        SELECT notes, createdAt, updatedAt, createdBy
        FROM ApplicationStepNotes
        WHERE applicationId = @applicationId AND stepIndex = @stepIndex
      `);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(200).json({ notes: null });
    }

  } catch (error) {
    console.error("Error fetching step notes:", error);
    res.status(500).json({ 
      message: "Server error while fetching step notes", 
      error: error.message 
    });
  }
};

// Update the updateApplicationStatus function to include notes
exports.updateApplicationStatusWithNotes = async (req, res) => {
  const applicationId = req.params.id;
  const { currentStep, status, notes, stepName } = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Update application status
    await pool.request()
      .input("id", sql.Int, parseInt(applicationId))
      .input("currentStep", sql.Int, parseInt(currentStep))
      .input("status", sql.NVarChar(50), status)
      .query(`
        UPDATE Applications
        SET currentStep = @currentStep, status = @status, updatedAt = GETDATE()
        WHERE id = @id
      `);

    // Save or update step notes if provided
    if (notes && stepName) {
      const createdBy = req.user ? req.user.username : 'Unknown';
      
      const existingNotes = await pool.request()
        .input("applicationId", sql.Int, parseInt(applicationId))
        .input("stepIndex", sql.Int, parseInt(currentStep))
        .query(`
          SELECT id FROM ApplicationStepNotes 
          WHERE applicationId = @applicationId AND stepIndex = @stepIndex
        `);

      if (existingNotes.recordset.length > 0) {
        await pool.request()
          .input("applicationId", sql.Int, parseInt(applicationId))
          .input("stepIndex", sql.Int, parseInt(currentStep))
          .input("notes", sql.NVarChar(sql.MAX), notes)
          .query(`
            UPDATE ApplicationStepNotes 
            SET notes = @notes, updatedAt = GETDATE()
            WHERE applicationId = @applicationId AND stepIndex = @stepIndex
          `);
      } else {
        await pool.request()
          .input("applicationId", sql.Int, parseInt(applicationId))
          .input("stepIndex", sql.Int, parseInt(currentStep))
          .input("stepName", sql.NVarChar(100), stepName)
          .input("notes", sql.NVarChar(sql.MAX), notes)
          .input("createdBy", sql.NVarChar, createdBy)
          .query(`
            INSERT INTO ApplicationStepNotes 
            (applicationId, stepIndex, stepName, notes, createdBy)
            VALUES 
            (@applicationId, @stepIndex, @stepName, @notes, @createdBy)
          `);
      }
    }
    
    res.status(200).json({ message: "Application status and notes updated successfully" });
  } catch (error) {
    console.error("Error updating application status with notes:", error);
    res.status(500).json({ message: "Server error while updating status", error: error.message });
  }
};


// New function to get available users for assignment
exports.getAvailableUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get all users with appropriate roles from userinfo table
    const result = await pool.request().query(`
      SELECT 
        username,
        role,
        username as name
      FROM userinfo 
      WHERE role IN ('manager', 'teamlead', 'user')
      ORDER BY role, username
    `);

    console.log('Available users fetched:', result.recordset.length);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching available users:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ 
      message: "Server error while fetching users", 
      error: error.message 
    });
  }
};

// New function to assign screening task
// COMPLETE FIX for assignScreeningTask function
exports.assignScreeningTask = async (req, res) => {
  console.log('=== Assign Screening Task Started ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  const { applicationId, assignedTo } = req.body;
  
  try {
    // Validation
    if (!applicationId || !assignedTo) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ 
        message: "Application ID and assigned user are required",
        received: { applicationId, assignedTo }
      });
    }

    const pool = await poolPromise;
    const assignedBy = req.user ? req.user.username : 'System';
    
    console.log('✅ Parsed data:', {
      applicationId: parseInt(applicationId),
      assignedTo,
      assignedBy
    });

    // Check if application exists and get roleId
    console.log('🔍 Checking if application exists...');
    const appCheck = await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .query(`
        SELECT a.id, a.currentStep, a.status, a.name, a.roleId, rr.role as roleName
        FROM Applications a
        INNER JOIN RecruitmentRoles rr ON a.roleId = rr.id
        WHERE a.id = @applicationId
      `);

    if (appCheck.recordset.length === 0) {
      console.log('❌ Application not found');
      return res.status(404).json({ message: "Application not found" });
    }

    const application = appCheck.recordset[0];
    console.log('✅ Application found:', {
      id: application.id,
      name: application.name,
      roleId: application.roleId,
      roleName: application.roleName
    });

    // Create assignment note text
    const assignmentText = `SCREENING ASSIGNED\nAssigned to: ${assignedTo}\nAssigned by: ${assignedBy}\nDate: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`;
    
    console.log('📝 Creating/updating assignment note...');
    console.log('Assignment details:', {
      applicationId: parseInt(applicationId),
      assignedTo,
      assignedBy,
      stepIndex: 1,
      stepName: 'Screening - Assigned'
    });

    // Check for existing assignment
    const existingCheck = await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .input("stepIndex", sql.Int, 1)
      .query(`
        SELECT id, assignedTo, notes
        FROM ApplicationStepNotes 
        WHERE applicationId = @applicationId 
        AND stepIndex = @stepIndex
        AND stepName = 'Screening - Assigned'
      `);

    if (existingCheck.recordset.length > 0) {
      console.log('📝 Updating existing assignment:', existingCheck.recordset[0]);
      
      // Update existing with assignedTo column - THIS IS CRITICAL
      const updateResult = await pool.request()
        .input("id", sql.Int, existingCheck.recordset[0].id)
        .input("notes", sql.NVarChar, assignmentText)
        .input("assignedTo", sql.NVarChar, assignedTo)  // STORE THE USERNAME HERE
        .input("updatedBy", sql.NVarChar, assignedBy)
        .query(`
          UPDATE ApplicationStepNotes 
          SET notes = @notes,
              assignedTo = @assignedTo,
              createdBy = @updatedBy,
              updatedAt = GETDATE()
          WHERE id = @id;
          
          -- Return the updated record to verify
          SELECT id, applicationId, stepIndex, stepName, assignedTo, createdBy
          FROM ApplicationStepNotes
          WHERE id = @id;
        `);
      
      console.log('✅ Assignment updated. Verification:', updateResult.recordset[0]);
      
    } else {
      console.log('📝 Creating new assignment');
      
      // Insert new with assignedTo column - THIS IS CRITICAL
      const insertResult = await pool.request()
        .input("applicationId", sql.Int, parseInt(applicationId))
        .input("stepIndex", sql.Int, 1)
        .input("stepName", sql.NVarChar(100), 'Screening - Assigned')
        .input("notes", sql.NVarChar, assignmentText)
        .input("assignedTo", sql.NVarChar, assignedTo)  // STORE THE USERNAME HERE
        .input("createdBy", sql.NVarChar, assignedBy)
        .query(`
          INSERT INTO ApplicationStepNotes 
          (applicationId, stepIndex, stepName, notes, assignedTo, createdBy)
          OUTPUT INSERTED.id, INSERTED.applicationId, INSERTED.stepIndex, 
                 INSERTED.stepName, INSERTED.assignedTo, INSERTED.createdBy
          VALUES 
          (@applicationId, @stepIndex, @stepName, @notes, @assignedTo, @createdBy)
        `);
      
      console.log('✅ Assignment created. New record:', insertResult.recordset[0]);
    }

    // Update application status to screening
    console.log('🔄 Updating application status...');
    await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .query(`
        UPDATE Applications 
        SET currentStep = 1,
            status = 'In Progress',
            updatedAt = GETDATE()
        WHERE id = @applicationId
      `);

    // VERIFY THE ASSIGNMENT WAS SAVED CORRECTLY
    const verifyAssignment = await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .input("assignedTo", sql.NVarChar, assignedTo)
      .query(`
        SELECT id, applicationId, stepIndex, stepName, assignedTo, notes, createdBy
        FROM ApplicationStepNotes
        WHERE applicationId = @applicationId
        AND assignedTo = @assignedTo
        AND stepIndex = 1
      `);
    
    console.log('🔍 Verification query result:', verifyAssignment.recordset);
    
    if (verifyAssignment.recordset.length === 0) {
      console.error('⚠️ WARNING: Assignment was not saved correctly!');
    } else {
      console.log('✅ Assignment verified in database:', verifyAssignment.recordset[0]);
    }

    console.log('=== Assignment completed successfully ===');

        // ✅ ADD NOTIFICATION FOR ASSIGNED USER
    await require('../controllers/recruitmentController').createNotification(
      assignedTo,
      `Screening task assigned for application by ${assignedBy}`,
      'screening_assigned',
      {
        applicationId: parseInt(applicationId),
        roleId: application.roleId,
        roleName: application.roleName,
        candidateName: application.name,
        assignedBy: assignedBy
      },
      assignedBy
    );


    res.status(200).json({ 
      message: "Screening task assigned successfully",
      assignedTo: assignedTo,
      assignedBy: assignedBy,
      applicationId: parseInt(applicationId),
      roleId: application.roleId,
      roleName: application.roleName,
      verification: verifyAssignment.recordset[0] || null
    });

  } catch (error) {
    console.error('=== ❌ Error in assignScreeningTask ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error number:', error.number);
    console.error('Error stack:', error.stack);
    
    // SQL Server specific error info
    if (error.originalError) {
      console.error('SQL Error details:', error.originalError);
    }
    
    // Check if it's a column not found error
    if (error.message.includes('Invalid column name')) {
      console.error('⚠️ COLUMN MISSING ERROR - The assignedTo column does not exist in ApplicationStepNotes table');
      console.error('⚠️ Run this SQL to add it:');
      console.error(`
        ALTER TABLE ApplicationStepNotes 
        ADD assignedTo NVARCHAR(100) NULL;
      `);
    }
    
    res.status(500).json({ 
      message: "Server error while assigning screening task", 
      error: error.message,
      code: error.code,
      hint: error.message.includes('Invalid column name') ? 
        'The assignedTo column is missing. Please run: ALTER TABLE ApplicationStepNotes ADD assignedTo NVARCHAR(100) NULL;' : 
        null
    });
  }
};
// UPDATED getScreeningAssignments function with detailed logging
exports.getScreeningAssignments = async (req, res) => {
  try {
    const username = req.user.username;
    const pool = await poolPromise;
    
    console.log('=== GET SCREENING ASSIGNMENTS ===');
    console.log('🔍 Fetching screening assignments for user:', username);
    
    // First, let's check what's in the table
    const debugQuery = await pool.request()
      .query(`
        SELECT TOP 10
          id, applicationId, stepIndex, stepName, assignedTo, createdBy, createdAt
        FROM ApplicationStepNotes
        WHERE stepIndex = 1
        ORDER BY createdAt DESC
      `);
    
    console.log('📋 Recent screening step notes in database:', debugQuery.recordset);
    console.log('📋 Count of notes with assignedTo populated:', 
      debugQuery.recordset.filter(r => r.assignedTo !== null && r.assignedTo !== '').length
    );
    
    // Now get assignments for this specific user
    const assignedQuery = `
      SELECT 
        a.id as applicationId,
        a.name as candidateName,
        a.email,
        a.phone,
        a.experience,
        a.roleId,
        rr.role as roleName,
        rr.client,
        a.appliedAt,
        a.currentStep,
        a.status,
        asn.createdAt as assignedAt,
        asn.createdBy as assignedBy,
        asn.assignedTo
      FROM Applications a
      INNER JOIN RecruitmentRoles rr ON a.roleId = rr.id
      INNER JOIN ApplicationStepNotes asn ON a.id = asn.applicationId
      WHERE asn.assignedTo = @username
      AND asn.stepIndex = 1
      AND asn.stepName = 'Screening - Assigned'
      ORDER BY asn.createdAt DESC
    `;

    const assignedResult = await pool.request()
      .input("username", sql.NVarChar, username)
      .query(assignedQuery);

    console.log(`✅ Found ${assignedResult.recordset.length} screening assignments for "${username}"`);
    
    // Log each assignment for debugging
    if (assignedResult.recordset.length > 0) {
      assignedResult.recordset.forEach((assignment, index) => {
        console.log(`📌 Assignment ${index + 1}:`, {
          applicationId: assignment.applicationId,
          roleId: assignment.roleId,
          roleName: assignment.roleName,
          candidateName: assignment.candidateName,
          assignedTo: assignment.assignedTo,
          assignedBy: assignment.assignedBy
        });
      });
    } else {
      console.log('⚠️ No assignments found for user:', username);
      console.log('🔍 Checking if there are any assignments for other users...');
      
      const otherUsersQuery = await pool.request()
        .query(`
          SELECT DISTINCT assignedTo, COUNT(*) as count
          FROM ApplicationStepNotes
          WHERE stepIndex = 1
          AND stepName = 'Screening - Assigned'
          AND assignedTo IS NOT NULL
          GROUP BY assignedTo
        `);
      
      console.log('📊 Assignments by user:', otherUsersQuery.recordset);
    }
    
    console.log('=== END GET SCREENING ASSIGNMENTS ===');

    res.status(200).json({
      assignedApplications: assignedResult.recordset
    });

  } catch (error) {
    console.error("❌ Error fetching screening assignments:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ 
      message: "Server error while fetching screening assignments", 
      error: error.message 
    });
  }
};

// New function to complete screening
exports.completeScreening = async (req, res) => {
  const { applicationId, notes } = req.body;
  
  try {
    const pool = await poolPromise;
    const completedBy = req.user ? req.user.username : 'Unknown';

    // Update the step notes to mark screening as completed
    await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .input("stepIndex", sql.Int, 1)
      .input("stepName", sql.NVarChar(100), 'Screening - Completed')
      .input("notes", sql.NVarChar(sql.MAX), notes || 'Screening completed')
      .input("createdBy", sql.NVarChar, completedBy)
      .query(`
        UPDATE ApplicationStepNotes 
        SET stepName = @stepName,
            notes = @notes,
            createdBy = @createdBy,
            updatedAt = GETDATE()
        WHERE applicationId = @applicationId 
        AND stepIndex = @stepIndex
        AND stepName = 'Screening - Assigned'
      `);

    // Move to next step (Technical Interview)
    await pool.request()
      .input("applicationId", sql.Int, parseInt(applicationId))
      .input("currentStep", sql.Int, 2) // Move to next step
      .input("status", sql.NVarChar(50), 'In Progress')
      .query(`
        UPDATE Applications 
        SET currentStep = @currentStep, 
            status = @status,
            updatedAt = GETDATE()
        WHERE id = @applicationId
      `);

    res.status(200).json({ 
      message: "Screening completed successfully",
      completedBy: completedBy,
      nextStep: 2
    });

  } catch (error) {
    console.error("Error completing screening:", error);
    res.status(500).json({ 
      message: "Server error while completing screening", 
      error: error.message 
    });
  }
};