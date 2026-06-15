// H1B/controllers/h1bController.js
const { sql, poolPromise } = require("../../config/db");
const AWS = require("aws-sdk");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// ============================================
// ✅ AWS S3 CONFIGURATION
// ============================================
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const S3_BUCKET = process.env.AWS_BUCKET_NAME || 'prophecy-erp';

// ============================================
// ✅ HELPER: Upload to S3
// ============================================
const uploadToS3 = async (fileBuffer, originalName, fileType, submissionId = 'temp') => {
  try {
    console.log(`📤 Uploading ${fileType} to S3...`);
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();

    let s3Folder = 'recruitment/h1b/';
    if (fileType === 'passport') s3Folder = 'recruitment/passport/';
    else if (fileType === 'visa_copy') s3Folder = 'recruitment/visa_copy/';
    else if (fileType === 'resume') s3Folder = 'recruitment/resume/';

    const s3Key = `${s3Folder}${submissionId}_${timestamp}_${cleanFileName}`;

    const getContentType = (ext) => {
      const typeMap = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain'
      };
      return typeMap[ext] || 'application/octet-stream';
    };

    const ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
    const contentType = getContentType(ext);

    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        'submission-id': submissionId.toString(),
        'file-type': fileType,
        'upload-date': new Date().toISOString(),
        'original-name': originalName
      }
    };

    const result = await s3.upload(params).promise();
    console.log(`✅ File uploaded to S3: ${s3Key}`);

    return {
      success: true,
      s3Key,
      s3Url: result.Location,
      fileName: originalName,
      fileType,
      size: fileBuffer.length,
      bucket: S3_BUCKET
    };
  } catch (error) {
    console.error('❌ Error uploading file to S3:', error.message);
    return { success: false, error: error.message };
  }
};

// ============================================
// ✅ HELPER: Delete from S3 (ignores missing files)
// ============================================
const deleteFromS3 = async (s3Key) => {
  if (!s3Key) return;
  try {
    await s3.deleteObject({ Bucket: S3_BUCKET, Key: s3Key }).promise();
    console.log(`✅ S3 file deleted: ${s3Key}`);
  } catch (err) {
    // Non-fatal: log and continue
    console.warn(`⚠️ Could not delete S3 file ${s3Key}:`, err.message);
  }
};

// ============================================
// ✅ HELPER: Format Date for Frontend
// ============================================
const formatDate = (date) => {
  if (!date) return null;
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (err) {
    return null;
  }
};

// ============================================
// ✅ H1B CONTROLLER
// ============================================
const h1bController = {

  // ✅ Test endpoint
  test: async (req, res) => {
    res.json({
      success: true,
      message: 'H1B API is working!',
      timestamp: new Date().toISOString(),
      endpoints: {
        upload: 'POST /api/h1b/upload',
        submissions: 'POST /api/h1b/submissions',
        getSubmissions: 'GET /api/h1b/submissions',
        getById: 'GET /api/h1b/submissions/:id',
        statistics: 'GET /api/h1b/statistics',
        download: 'GET /api/h1b/download',
        stream: 'GET /api/h1b/stream',
        delete: 'DELETE /api/h1b/submissions/:id'
      }
    });
  },

  // ✅ Download file from S3 (signed URL redirect)
  downloadFile: async (req, res) => {
    try {
      const { s3Key, fileName } = req.query;
      if (!s3Key) {
        return res.status(400).json({ success: false, message: 'S3 key is required' });
      }

      const originalKeyExt = s3Key.split('.').pop();
      const clientFileName = fileName || s3Key.split('/').pop();
      // Replace hardcoded extension from frontend with true extension from S3 key
      const finalFileName = clientFileName.replace(/\.[^/.]+$/, "") + '.' + originalKeyExt;

      const params = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Expires: 300,
        ResponseContentDisposition: `attachment; filename="${finalFileName}"`
      };

      const signedUrl = await s3.getSignedUrlPromise('getObject', params);
      return res.redirect(signedUrl);
    } catch (error) {
      console.error('❌ Download file error:', error.message);
      res.status(500).json({ success: false, message: 'Error generating download link', error: error.message });
    }
  },

  // ✅ Stream file from S3
  streamFile: async (req, res) => {
    try {
      const { s3Key, fileName } = req.query;
      if (!s3Key) {
        return res.status(400).json({ success: false, message: 'S3 key is required' });
      }

      const params = { Bucket: S3_BUCKET, Key: s3Key };
      const s3Object = await s3.getObject(params).promise();

      res.setHeader('Content-Disposition', `attachment; filename="${fileName || s3Key.split('/').pop()}"`);
      res.setHeader('Content-Type', s3Object.ContentType || 'application/octet-stream');
      res.setHeader('Content-Length', s3Object.ContentLength);
      res.send(s3Object.Body);
    } catch (error) {
      console.error('❌ Stream file error:', error.message);
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ success: false, message: 'File not found in storage' });
      }
      res.status(500).json({ success: false, message: 'Error downloading file', error: error.message });
    }
  },

  // ✅ Upload file to S3
  uploadFile: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const { fileType, submissionId } = req.body;

      if (!fileType || !['passport', 'visa_copy', 'resume'].includes(fileType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Must be: passport, visa_copy, or resume'
        });
      }

      const s3Upload = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        fileType,
        submissionId || 'temp'
      );

      if (!s3Upload.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload file to S3',
          error: s3Upload.error
        });
      }

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully to S3',
        data: {
          s3Key: s3Upload.s3Key,
          s3Url: s3Upload.s3Url,
          fileName: s3Upload.fileName,
          fileType: s3Upload.fileType,
          size: s3Upload.size,
          bucket: s3Upload.bucket
        }
      });
    } catch (error) {
      console.error('❌ Upload file error:', error.message);
      res.status(500).json({ success: false, message: `Upload failed: ${error.message}` });
    }
  },

  // ✅ Create H1B submission
  createSubmissionPublic: async (req, res) => {
    let pool;
    try {
      const {
        prefix, first_name, middle_name, last_name, gender, date_of_birth,
        phone, email,
        passport_number, passport_expiry_date, nationality,
        country_of_birth, place_of_birth,
        current_status, i94_expiration,
        position_title, job_summary, expected_salary,
        worksite_address, home_address, offsite_details,
        bachelors_degree, bachelors_field,
        masters_degree, masters_field, masters_cap_quota_eligible,
        end_client, tier1_vendor, tier2_vendor, tier3_vendor,
        filing_type, employer_name, anticipated_start_date, h4_required, h4_count,
        passport_copy_s3_key, visa_copy_s3_key, resume_s3_key,
        consent
      } = req.body;

      if (!first_name || !last_name || !email || !filing_type) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: first_name, last_name, email, filing_type'
        });
      }

      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      let idPrefix = 'H1B';
      switch (filing_type) {
        case 'H1 Transfer': idPrefix = 'H1 T'; break;
        case 'Extension': idPrefix = 'EXT'; break;
        case 'Amendment': idPrefix = 'AMD'; break;
        case 'Extension & Amendment': idPrefix = 'EXT&AMD'; break;
        case 'H1B Lottery': idPrefix = 'H1B L'; break;
        case 'Change of Status': idPrefix = 'COS'; break;
        case 'New H-1B': idPrefix = 'NEW'; break;
      }
      const submission_id = `${idPrefix}-${timestamp}${random}`;

      pool = await poolPromise;
      const request = new sql.Request(pool);

      request.input('Prefix', sql.NVarChar(10), prefix || '');
      request.input('FirstName', sql.NVarChar(100), first_name);
      request.input('MiddleName', sql.NVarChar(100), middle_name || '');
      request.input('LastName', sql.NVarChar(100), last_name);
      request.input('Gender', sql.NVarChar(50), gender || '');
      request.input('DateOfBirth', sql.Date, date_of_birth || null);
      request.input('Phone', sql.NVarChar(20), phone || '');
      request.input('Email', sql.NVarChar(255), email);
      request.input('PassportNumber', sql.NVarChar(50), passport_number || '');
      request.input('PassportExpiryDate', sql.Date, passport_expiry_date || null);
      request.input('Nationality', sql.NVarChar(100), nationality || '');
      request.input('CountryOfBirth', sql.NVarChar(100), country_of_birth || '');
      request.input('PlaceOfBirth', sql.NVarChar(100), place_of_birth || '');
      request.input('CurrentStatus', sql.NVarChar(100), current_status || '');
      request.input('I94Expiration', sql.Date, i94_expiration || null);
      request.input('PositionTitle', sql.NVarChar(200), position_title || '');
      request.input('JobSummary', sql.NVarChar(sql.MAX), job_summary || '');
      request.input('ExpectedSalary', sql.NVarChar(100), expected_salary || '');
      request.input('WorksiteAddress', sql.NVarChar(sql.MAX), worksite_address || '');
      request.input('HomeAddress', sql.NVarChar(sql.MAX), home_address || '');
      request.input('OffsiteDetails', sql.NVarChar(sql.MAX), offsite_details || '');
      request.input('BachelorsDegree', sql.NVarChar(200), bachelors_degree || '');
      request.input('BachelorsField', sql.NVarChar(200), bachelors_field || '');
      request.input('MastersDegree', sql.NVarChar(200), masters_degree || '');
      request.input('MastersField', sql.NVarChar(200), masters_field || '');
      request.input('MastersCapQuotaEligible', sql.NVarChar(10), masters_cap_quota_eligible || '');
      request.input('EndClient', sql.NVarChar(200), end_client || '');
      request.input('Tier1Vendor', sql.NVarChar(200), tier1_vendor || '');
      request.input('Tier2Vendor', sql.NVarChar(200), tier2_vendor || '');
      request.input('Tier3Vendor', sql.NVarChar(200), tier3_vendor || '');
      request.input('FilingType', sql.NVarChar(100), filing_type);
      request.input('EmployerName', sql.NVarChar(200), employer_name || 'Prophecy Technologies');
      request.input('AnticipatedStartDate', sql.Date, anticipated_start_date || null);
      request.input('H4Required', sql.NVarChar(10), h4_required || '');
      request.input('H4Count', sql.NVarChar(10), h4_count || '');
      request.input('PassportCopyS3Key', sql.NVarChar(500), passport_copy_s3_key || '');
      request.input('VisaCopyS3Key', sql.NVarChar(500), visa_copy_s3_key || '');
      request.input('ResumeS3Key', sql.NVarChar(500), resume_s3_key || '');
      const consentValue = (consent === true || consent === 'true' || consent === 1) ? 1 : 0;
      request.input('Consent', sql.Bit, consentValue);
      request.input('CreatedBy', sql.NVarChar(100), 'Public Form');
      request.input('SubmissionId', sql.NVarChar(100), submission_id);

      const query = `
        INSERT INTO [dbo].[h1b_submissions] 
        (
          Prefix, FirstName, MiddleName, LastName, Gender, DateOfBirth,
          Phone, Email, PassportNumber, PassportExpiryDate, Nationality,
          CountryOfBirth, PlaceOfBirth, CurrentStatus, I94Expiration,
          PositionTitle, JobSummary, ExpectedSalary, WorksiteAddress, HomeAddress,
          OffsiteDetails, BachelorsDegree, BachelorsField, MastersDegree, MastersField,
          MastersCapQuotaEligible, EndClient, Tier1Vendor, Tier2Vendor, Tier3Vendor,
          FilingType, EmployerName, AnticipatedStartDate, H4Required, H4Count,
          PassportCopyS3Key, VisaCopyS3Key, ResumeS3Key,
          Consent, CreatedBy, SubmissionId, PetitionStatus, ReviewStatus
        )
        OUTPUT INSERTED.*
        VALUES 
        (
          @Prefix, @FirstName, @MiddleName, @LastName, @Gender, @DateOfBirth,
          @Phone, @Email, @PassportNumber, @PassportExpiryDate, @Nationality,
          @CountryOfBirth, @PlaceOfBirth, @CurrentStatus, @I94Expiration,
          @PositionTitle, @JobSummary, @ExpectedSalary, @WorksiteAddress, @HomeAddress,
          @OffsiteDetails, @BachelorsDegree, @BachelorsField, @MastersDegree, @MastersField,
          @MastersCapQuotaEligible, @EndClient, @Tier1Vendor, @Tier2Vendor, @Tier3Vendor,
          @FilingType, @EmployerName, @AnticipatedStartDate, @H4Required, @H4Count,
          @PassportCopyS3Key, @VisaCopyS3Key, @ResumeS3Key,
          @Consent, @CreatedBy, @SubmissionId, 'pending', 'not_reviewed'
        )
      `;

      const result = await request.query(query);
      const insertedRecord = result.recordset[0];

      // ── Send notification email via SendGrid ──
      try {
        const applicantName = `${prefix || ''} ${first_name} ${last_name}`.trim();
        const submittedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Determine Email Routing & Branding based on Employer Name
        const actualEmployerName = employer_name || 'Prophecy Technologies';
        let notificationTo = 'onboarding@prophecytechs.com';
        let systemName = 'Prophecy H-1B System';
        
        if (actualEmployerName === 'Cognifyar Technologies') {
          notificationTo = 'onboarding@cognifyar.com';
          systemName = 'Cognifyar H-1B System';
        } else if (actualEmployerName === 'Disensystem' || actualEmployerName === 'Disensystems') {
          notificationTo = 'onboarding@disensystems.com';
          systemName = 'Disensystems H-1B Portal';
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
              <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td style="background:#038a77;padding:28px 36px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">🎉 New H-1B Application Received</h1>
                      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${systemName}</p>
                    </td>
                  </tr>

                  <!-- Submission ID Banner -->
                  <tr>
                    <td style="background:#f0fdf9;padding:14px 36px;border-bottom:1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size:12px;color:#64748b;font-weight:600;">SUBMISSION ID</td>
                          <td style="font-size:12px;color:#64748b;font-weight:600;text-align:right;">SUBMITTED ON</td>
                        </tr>
                        <tr>
                          <td style="font-size:16px;color:#038a77;font-weight:800;font-family:monospace;">${submission_id}</td>
                          <td style="font-size:14px;color:#1e293b;font-weight:600;text-align:right;">${submittedOn}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:28px 36px;">
                      <p style="margin:0 0 20px;font-size:15px;color:#334155;">A new H-1B petition intake form has been submitted. Please review the details below:</p>

                      <!-- Applicant Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr><td colspan="2" style="background:#038a77;border-radius:4px 4px 0 0;padding:8px 14px;">
                          <span style="color:#fff;font-size:12px;font-weight:700;letter-spacing:1px;">APPLICANT INFORMATION</span>
                        </td></tr>
                        <tr style="background:#f8fafc;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;width:40%;">Full Name</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;font-weight:700;">${applicantName}</td>
                        </tr>
                        <tr style="background:#ffffff;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">Email</td>
                          <td style="padding:10px 14px;font-size:14px;color:#038a77;"><a href="mailto:${email}" style="color:#038a77;text-decoration:none;">${email}</a></td>
                        </tr>
                        <tr style="background:#f8fafc;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">Phone</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;">${phone || 'N/A'}</td>
                        </tr>
                        <tr style="background:#ffffff;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">Passport Number</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;font-family:monospace;">${passport_number || 'N/A'}</td>
                        </tr>
                        <tr style="background:#f8fafc;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">Nationality</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;">${nationality || 'N/A'}</td>
                        </tr>
                      </table>

                      <!-- Filing Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr><td colspan="2" style="background:#0369a1;border-radius:4px 4px 0 0;padding:8px 14px;">
                          <span style="color:#fff;font-size:12px;font-weight:700;letter-spacing:1px;">H-1B FILING DETAILS</span>
                        </td></tr>
                        <tr style="background:#f8fafc;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;width:40%;">Employer</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;font-weight:700;">${employer_name || 'Prophecy Technologies'}</td>
                        </tr>
                        <tr style="background:#ffffff;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">Filing Type</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;">${filing_type || 'N/A'}</td>
                        </tr>
                        <tr style="background:#f8fafc;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">Position Title</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;">${position_title || 'N/A'}</td>
                        </tr>
                        <tr style="background:#ffffff;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">Anticipated Start Date</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;">${anticipated_start_date ? new Date(anticipated_start_date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : 'N/A'}</td>
                        </tr>
                        <tr style="background:#f8fafc;">
                          <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">H-4 Dependent Required</td>
                          <td style="padding:10px 14px;font-size:14px;color:#1e293b;">${h4_required || 'N/A'}</td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding:10px 0 4px;">
                            <a href="${process.env.FRONTEND_URL || 'https://devprophecyerp.com'}/h1b/dashboard"
                              style="display:inline-block;background:#038a77;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:6px;font-size:14px;font-weight:700;letter-spacing:0.3px;">
                              View in Admin Dashboard →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#94a3b8;">${systemName}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">This is an automated notification. Please do not reply to this email.</p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `;

        await sgMail.send({
          to: notificationTo,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'notifications@prophecytechs.com',
            name: systemName
          },
          subject: `🆕 New H-1B Application: ${applicantName} — ${submission_id}`,
          html: emailHtml,
          text: `New H-1B application received.\n\nApplicant: ${applicantName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nFiling Type: ${filing_type}\nEmployer: ${actualEmployerName}\nSubmission ID: ${submission_id}\nSubmitted: ${submittedOn}\n\nView in dashboard: ${process.env.FRONTEND_URL || 'https://devprophecyerp.com'}/h1b/dashboard`
        });

        console.log(`✅ Notification email sent to ${notificationTo} for submission ${submission_id}`);
      } catch (emailErr) {
        // Email failure should NOT block the submission response
        console.error('⚠️ SendGrid notification failed (submission still saved):', emailErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'H1B submission created successfully',
        submission_id,
        data: {
          id: insertedRecord.Id,
          submission_id: insertedRecord.SubmissionId,
          first_name: insertedRecord.FirstName,
          last_name: insertedRecord.LastName,
          email: insertedRecord.Email,
          filing_type: insertedRecord.FilingType,
          petition_status: insertedRecord.PetitionStatus,
          created_at: insertedRecord.CreatedAt
        }
      });
    } catch (error) {
      console.error('❌ Create submission error:', error.message);
      res.status(500).json({ success: false, message: 'Error creating submission', error: error.message });
    }
  },

  // ✅ Get all submissions
  getAllSubmissions: async (req, res) => {
    let pool;
    try {
      const { search, page = 1, limit = 50, company } = req.query;

      pool = await poolPromise;
      const request = new sql.Request(pool);

      let whereConditions = ['IsArchived = 0'];

      if (company && company !== 'All') {
        whereConditions.push('EmployerName = @company');
        request.input('company', sql.NVarChar, company);
      }

      if (search) {
        whereConditions.push('(FirstName LIKE @search OR LastName LIKE @search OR Email LIKE @search OR SubmissionId LIKE @search OR PassportNumber LIKE @search)');
        request.input('search', sql.NVarChar, `%${search}%`);
      }

      const offset = (page - 1) * limit;
      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, parseInt(limit));

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const query = `
        SELECT 
          Id, SubmissionId, Prefix, FirstName, MiddleName, LastName,
          Email, Phone, Gender, DateOfBirth,
          PassportNumber, PassportExpiryDate, Nationality,
          CountryOfBirth, PlaceOfBirth,
          CurrentStatus, I94Expiration,
          FilingType, EmployerName, AnticipatedStartDate,
          PositionTitle, ExpectedSalary, JobSummary,
          WorksiteAddress, HomeAddress, OffsiteDetails,
          EndClient, Tier1Vendor, Tier2Vendor, Tier3Vendor,
          BachelorsDegree, BachelorsField, MastersDegree, MastersField,
          MastersCapQuotaEligible, H4Required, H4Count, Consent,
          PassportCopyS3Key, VisaCopyS3Key, ResumeS3Key,
          PetitionStatus, CreatedAt
        FROM [dbo].[h1b_submissions]
        ${whereClause}
        ORDER BY CreatedAt DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

      // Build a separate parameterized request for the count query
      const countRequest = new sql.Request(pool);
      if (company && company !== 'All') {
        countRequest.input('company', sql.NVarChar, company);
      }
      if (search) {
        countRequest.input('search', sql.NVarChar, `%${search}%`);
      }

      const [submissions, countResult] = await Promise.all([
        request.query(query),
        countRequest.query(`SELECT COUNT(*) as total FROM [dbo].[h1b_submissions] ${whereClause}`)
      ]);

      res.json({
        success: true,
        data: submissions.recordset.map(sub => ({
          ...sub,
          DateOfBirth: formatDate(sub.DateOfBirth),
          PassportExpiryDate: formatDate(sub.PassportExpiryDate),
          I94Expiration: formatDate(sub.I94Expiration),
          AnticipatedStartDate: formatDate(sub.AnticipatedStartDate)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.recordset[0]?.total || 0
        }
      });
    } catch (error) {
      console.error('❌ Get submissions error:', error.message);
      res.status(500).json({ success: false, message: 'Error fetching submissions', error: error.message });
    }
  },

  // ✅ Get submission by ID
  getSubmissionById: async (req, res) => {
    let pool;
    try {
      const { id } = req.params;
      pool = await poolPromise;
      const request = new sql.Request(pool);
      request.input('id', sql.Int, id);

      const result = await request.query(`
        SELECT * FROM [dbo].[h1b_submissions] WHERE Id = @id
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }

      const data = result.recordset[0];
      data.DateOfBirth = formatDate(data.DateOfBirth);
      data.PassportExpiryDate = formatDate(data.PassportExpiryDate);
      data.I94Expiration = formatDate(data.I94Expiration);
      data.AnticipatedStartDate = formatDate(data.AnticipatedStartDate);

      res.json({ success: true, data: data });
    } catch (error) {
      console.error('❌ Get submission error:', error.message);
      res.status(500).json({ success: false, message: 'Error fetching submission', error: error.message });
    }
  },

  // ✅ Update submission status
  updateSubmissionStatus: async (req, res) => {
    let pool;
    try {
      const { id } = req.params;
      const { petition_status } = req.body;

      if (!petition_status || !['pending', 'approved', 'rejected'].includes(petition_status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: pending, approved, or rejected'
        });
      }

      pool = await poolPromise;
      const request = new sql.Request(pool);
      request.input('id', sql.Int, id);
      request.input('status', sql.NVarChar(100), petition_status.toLowerCase());

      const result = await request.query(`
        UPDATE [dbo].[h1b_submissions]
        SET PetitionStatus = @status
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }

      res.json({ success: true, message: 'Submission status updated', data: result.recordset[0] });
    } catch (error) {
      console.error('⚠️ Update status error:', error.message);
      res.status(500).json({ success: false, message: 'Error updating submission status', error: error.message });
    }
  },

  // 🟢 Update full submission data
  updateSubmissionFull: async (req, res) => {
    let pool;
    try {
      const { id } = req.params;
      const updates = req.body; // Full data payload
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid submission ID' });
      }

      pool = await poolPromise;
      const request = new sql.Request(pool);
      request.input('id', sql.Int, id);

      // Fields to update (excluding S3 keys, id, createdat, etc.)
      const fields = [
        { name: 'Prefix', type: sql.NVarChar(50) },
        { name: 'FirstName', type: sql.NVarChar(100) },
        { name: 'MiddleName', type: sql.NVarChar(100) },
        { name: 'LastName', type: sql.NVarChar(100) },
        { name: 'Gender', type: sql.NVarChar(20) },
        { name: 'DateOfBirth', type: sql.Date },
        { name: 'Phone', type: sql.NVarChar(50) },
        { name: 'Email', type: sql.NVarChar(255) },
        { name: 'PassportNumber', type: sql.NVarChar(100) },
        { name: 'PassportExpiryDate', type: sql.Date },
        { name: 'Nationality', type: sql.NVarChar(100) },
        { name: 'CountryOfBirth', type: sql.NVarChar(100) },
        { name: 'PlaceOfBirth', type: sql.NVarChar(200) },
        { name: 'CurrentStatus', type: sql.NVarChar(100) },
        { name: 'I94Expiration', type: sql.Date },
        { name: 'PositionTitle', type: sql.NVarChar(200) },
        { name: 'JobSummary', type: sql.NVarChar(sql.MAX) },
        { name: 'ExpectedSalary', type: sql.NVarChar(100) },
        { name: 'WorksiteAddress', type: sql.NVarChar(sql.MAX) },
        { name: 'HomeAddress', type: sql.NVarChar(sql.MAX) },
        { name: 'OffsiteDetails', type: sql.NVarChar(sql.MAX) },
        { name: 'BachelorsDegree', type: sql.NVarChar(200) },
        { name: 'BachelorsField', type: sql.NVarChar(200) },
        { name: 'MastersDegree', type: sql.NVarChar(200) },
        { name: 'MastersField', type: sql.NVarChar(200) },
        { name: 'MastersCapQuotaEligible', type: sql.NVarChar(50) },
        { name: 'EndClient', type: sql.NVarChar(200) },
        { name: 'Tier1Vendor', type: sql.NVarChar(200) },
        { name: 'Tier2Vendor', type: sql.NVarChar(200) },
        { name: 'Tier3Vendor', type: sql.NVarChar(200) },
        { name: 'FilingType', type: sql.NVarChar(100) },
        { name: 'EmployerName', type: sql.NVarChar(200) },
        { name: 'AnticipatedStartDate', type: sql.Date },
        { name: 'H4Required', type: sql.NVarChar(50) },
        { name: 'H4Count', type: sql.NVarChar(50) }
      ];

      let setStatements = [];
      fields.forEach(field => {
        if (updates[field.name] !== undefined) {
          let val = updates[field.name];
          if (val === '' && field.type === sql.Date) val = null;
          request.input(field.name, field.type, val);
          setStatements.push(`${field.name} = @${field.name}`);
        }
      });

      if (setStatements.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields provided to update' });
      }

      const query = `
        UPDATE [dbo].[h1b_submissions]
        SET ${setStatements.join(', ')}
        OUTPUT INSERTED.*
        WHERE Id = @id
      `;

      const result = await request.query(query);

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }

      const data = result.recordset[0];
      data.DateOfBirth = formatDate(data.DateOfBirth);
      data.PassportExpiryDate = formatDate(data.PassportExpiryDate);
      data.I94Expiration = formatDate(data.I94Expiration);
      data.AnticipatedStartDate = formatDate(data.AnticipatedStartDate);

      res.json({ success: true, message: 'Submission updated successfully', data: data });
    } catch (error) {
      console.error('⚠️ Update full submission error:', error.message);
      res.status(500).json({ success: false, message: 'Error updating submission', error: error.message });
    }
  },

  // ============================================
  // ✅ DELETE SUBMISSION (hard delete + S3 cleanup)
  // ============================================
  deleteSubmission: async (req, res) => {
    let pool;
    try {
      const { id } = req.params;
      console.log('=== DELETE H1B SUBMISSION ===', id);

      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid submission ID' });
      }

      pool = await poolPromise;
      const request = new sql.Request(pool);
      request.input('id', sql.Int, parseInt(id));

      // 1️⃣ Fetch S3 keys before deleting so we can clean up S3
      const fetchResult = await request.query(`
        SELECT PassportCopyS3Key, VisaCopyS3Key, ResumeS3Key, FirstName, LastName
        FROM [dbo].[h1b_submissions]
        WHERE Id = @id
      `);

      if (fetchResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }

      const record = fetchResult.recordset[0];
      console.log(`Deleting submission for: ${record.FirstName} ${record.LastName}`);

      // 2️⃣ Delete S3 files (non-blocking — errors are just logged)
      await Promise.all([
        deleteFromS3(record.PassportCopyS3Key),
        deleteFromS3(record.VisaCopyS3Key),
        deleteFromS3(record.ResumeS3Key)
      ]);

      // 3️⃣ Hard delete from database
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('id', sql.Int, parseInt(id));

      await deleteRequest.query(`
        DELETE FROM [dbo].[h1b_submissions] WHERE Id = @id
      `);

      console.log(`✅ Submission ${id} deleted successfully`);

      res.json({
        success: true,
        message: `Submission for ${record.FirstName} ${record.LastName} deleted successfully`,
        deletedId: parseInt(id)
      });

    } catch (error) {
      console.error('❌ Delete submission error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error deleting submission',
        error: error.message
      });
    }
  },

  // ✅ Get statistics
  getStatistics: async (req, res) => {
    let pool;
    try {
      const { company } = req.query;
      pool = await poolPromise;

      const request = new sql.Request(pool);
      let whereClause = 'WHERE IsArchived = 0';
      
      if (company && company !== 'All') {
        whereClause += ' AND EmployerName = @company';
        request.input('company', sql.NVarChar, company);
      }

      const totalResult = await request.query(`
        SELECT COUNT(*) as total FROM [dbo].[h1b_submissions] ${whereClause}
      `);
      const statusResult = await request.query(`
        SELECT PetitionStatus, COUNT(*) as count 
        FROM [dbo].[h1b_submissions] 
        ${whereClause}
        GROUP BY PetitionStatus
      `);
      const recentResult = await request.query(`
        SELECT TOP 5 Id, FirstName, LastName, Email, FilingType, PetitionStatus, CreatedAt
        FROM [dbo].[h1b_submissions] 
        ${whereClause}
        ORDER BY CreatedAt DESC
      `);

      res.json({
        success: true,
        data: {
          total: totalResult.recordset[0].total,
          byStatus: statusResult.recordset,
          recentSubmissions: recentResult.recordset
        }
      });
    } catch (error) {
      console.error('❌ Get statistics error:', error.message);
      res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
    }
  }
};

module.exports = h1bController;