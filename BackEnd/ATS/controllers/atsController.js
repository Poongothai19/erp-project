const sql = require('mssql');
const { dbConfig } = require('../../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const AWS = require('aws-sdk');

// ============================================
// ✅ AWS S3 CONFIGURATION
// ============================================

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const S3_BUCKET = process.env.AWS_BUCKET_NAME;

// ============================================
// ✅ HELPER: Extract Clean Job ID
// ============================================

const extractJobId = (jobIdInput) => {
  if (!jobIdInput) return null;
  
  const jobIdStr = String(jobIdInput).trim();
  
  // Return as-is - supports both "47488-1" and "N-0037" formats
  // No conversion needed - store exactly what's provided
  return jobIdStr;
};

// ============================================
// ✅ GROQ API HELPER - Score Resume
// ============================================

const scoreResumeWithGroq = async (resumeText, jobDescription) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GROQ_API_KEY not set in environment variables');
      return { success: false, score: null, error: 'Groq API key not configured' };
    }

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze the following resume against the job description and provide a match score from 0-100.

Resume:
${resumeText}

Job Description:
${jobDescription}

Respond ONLY with a JSON object in this exact format (NO markdown, NO code blocks):
{
  "score": <number between 0-100>,
  "matchedSkills": [<list of matched skills>],
  "missingSkills": [<list of missing skills>],
  "summary": "<brief one-line summary>"
}

Be strict and realistic with scoring.`;

    const payload = JSON.stringify({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        port: 443,
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
            try {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                const response = JSON.parse(data);
                let content = response.choices?.[0]?.message?.content;
                
                if (content) {
                  content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                  const jsonMatch = content.match(/\{[\s\S]*?\}/);
                  
                  if (jsonMatch) {
                    try {
                      const scoreData = JSON.parse(jsonMatch[0]);
                      
                      if (scoreData.score !== undefined && scoreData.score !== null) {
                        console.log('✅ Resume scored successfully with Groq:', scoreData.score);
                        resolve({ 
                          success: true, 
                          score: parseInt(scoreData.score),
                          matchedSkills: Array.isArray(scoreData.matchedSkills) ? scoreData.matchedSkills : [],
                          missingSkills: Array.isArray(scoreData.missingSkills) ? scoreData.missingSkills : [],
                          summary: scoreData.summary || ''
                        });
                      } else {
                        throw new Error('Score field missing or invalid in response');
                      }
                    } catch (parseErr) {
                      console.error('❌ JSON parse error:', parseErr.message);
                      resolve({ 
                        success: false, 
                        score: null,
                        error: 'Failed to parse AI response: ' + parseErr.message
                      });
                    }
                  } else {
                    console.error('❌ No JSON object found in response');
                    resolve({ 
                      success: false, 
                      score: null,
                      error: 'No valid JSON found in Groq response'
                    });
                  }
                } else {
                  throw new Error('No content in response');
                }
              } else {
                console.error('❌ Groq API error:', res.statusCode, data);
                resolve({ 
                  success: false, 
                  score: null,
                  error: `Groq API: ${res.statusCode}` 
                });
              }
            } catch (parseError) {
              console.error('❌ Error parsing Groq response:', parseError);
              resolve({ 
                success: false, 
                score: null,
                error: 'Failed to parse AI response'
              });
            }
          });
      });

      req.on('error', (error) => {
        console.error('❌ Groq request error:', error);
        reject(error);
      });

      req.write(payload);
      req.end();
    });

  } catch (error) {
    console.error('❌ Error in scoreResumeWithGroq:', error);
    return { success: false, score: null, error: error.message };
  }
};

// ============================================
// ✅ EXTRACT TEXT FROM RESUME
// ============================================

const extractResumeText = async (fileBuffer, fileName) => {
  try {
    const ext = path.extname(fileName).toLowerCase();
    
    if (ext === '.pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(fileBuffer);
        let text = data.text || '';
        
        if (!text || text.trim().length === 0) {
          console.warn('⚠️ No text extracted from PDF');
          return `Resume file: ${path.basename(fileName)}`;
        }
        
        return text.substring(0, 8000);
      } catch (pdfError) {
        console.warn('⚠️ Could not parse PDF with pdfParse:', pdfError.message);
        return `Resume file: ${path.basename(fileName)}`;
      }
    } 
    else if (ext === '.docx') {
      try {
        const JSZip = require('jszip');
        const xml2js = require('xml2js');
        
        const zip = new JSZip();
        await zip.loadAsync(fileBuffer);
        
        const xmlContent = await zip.file('word/document.xml').async('string');
        const parser = new xml2js.Parser();
        const parsed = await parser.parseStringPromise(xmlContent);
        
        const paragraphs = parsed['w:document']['w:body'][0]['w:p'] || [];
        const text = paragraphs
          .map(p => {
            const runs = p['w:r'] || [];
            return runs
              .map(r => r['w:t']?.[0] || '')
              .join('');
          })
          .join('\n');
        
        return text.substring(0, 8000);
      } catch (docxError) {
        console.warn('⚠️ Could not parse DOCX:', docxError.message);
        return `Resume file: ${path.basename(fileName)}`;
      }
    } 
    
    return '';
  } catch (error) {
    console.error('❌ Error extracting resume text:', error);
    return '';
  }
};

// ============================================
// ✅ UPLOAD RESUME TO S3
// ============================================

const uploadResumeToS3 = async (fileBuffer, fileName, email) => {
  try {
    if (!S3_BUCKET) {
      throw new Error('AWS_BUCKET_NAME not configured in environment variables');
    }

    // Create unique file name in S3
    const timestamp = Date.now();
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const ext = path.extname(fileName);
    const s3Key = `recruitment/resumes/${timestamp}${ext}`;

    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: getContentType(ext),
      ServerSideEncryption: 'AES256',
      Metadata: {
        'email': email,
        'upload-date': new Date().toISOString()
      }
    };

    const result = await s3.upload(params).promise();
    console.log('✅ Resume uploaded to S3:', s3Key);
    
    return {
      success: true,
      s3Key: s3Key,
      s3Url: result.Location,
      fileName: fileName,
      bucket: S3_BUCKET
    };

  } catch (error) {
    console.error('❌ Error uploading resume to S3:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// ✅ HELPER: Get Content Type
// ============================================

const getContentType = (ext) => {
  const typeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return typeMap[ext] || 'application/octet-stream';
};

// ============================================
// ✅ DOWNLOAD RESUME FROM S3 (HELPER FUNCTION)
// ============================================

const downloadResumeFromS3 = async (s3Key, res) => {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };

    const data = await s3.getObject(params).promise();
    
    const ext = path.extname(s3Key).toLowerCase();
    const contentType = getContentType(ext);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(s3Key)}"`);
    res.setHeader('Content-Length', data.Body.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(data.Body);
    console.log('✅ Resume downloaded from S3:', s3Key);

  } catch (error) {
    console.error('❌ Error downloading resume from S3:', error.message);
    throw error;
  }
};

// ============================================
// ✅ DELETE RESUME FROM S3
// ============================================

const deleteResumeFromS3 = async (s3Key) => {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };

    await s3.deleteObject(params).promise();
    console.log('✅ Resume deleted from S3:', s3Key);
    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting resume from S3:', error.message);
    return { success: false, error: error.message };
  }
};

const fetchJobDescriptionFromDB = async (jobId) => {
  let pool;
  try {
    pool = new sql.ConnectionPool(dbConfig);
    await pool.connect();
    
    const request = new sql.Request(pool);
    // Try both numeric ID and full job ID format
    const numericId = parseInt(jobId, 10);
    
    request.input('job_id', sql.NVarChar(50), jobId);
    request.input('numeric_id', sql.Int, isNaN(numericId) ? null : numericId);
    
    const result = await request.query(`
      SELECT 
        id, 
        description, 
        job_description,
        title,
        requirements,
        qualifications
      FROM jobs 
      WHERE id = @numeric_id OR CAST(id AS NVARCHAR(50)) = @job_id
    `);

    if (result.recordset.length > 0) {
      const job = result.recordset[0];
      const jobDesc = job.description || job.job_description || job.requirements || '';
      console.log('✅ Job description fetched from DB for Job ID:', jobId);
      return jobDesc;
    }

    console.warn('⚠️ Job ID not found in database:', jobId);
    return null;

  } catch (error) {
    console.error('❌ Error fetching job description:', error.message);
    return null;
  } finally {
    if (pool) await pool.close();
  }
};

// ============================================
// ✅ SENDGRID EMAIL HELPER
// ============================================

const sendEmailViaSendGrid = async (emailData) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ SENDGRID_API_KEY not set in environment variables');
      return { success: false, error: 'SendGrid API key not configured' };
    }

    const payload = JSON.stringify({
      personalizations: [
        {
          to: [{ email: emailData.to }],
          subject: emailData.subject
        }
      ],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        name: process.env.SENDGRID_FROM_NAME || 'Prophecy Technologies'
      },
      content: [
        {
          type: 'text/html',
          value: emailData.html
        }
      ]
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Email sent successfully via SendGrid API');
            resolve({ success: true });
          } else {
            console.error('❌ SendGrid API error:', res.statusCode, data);
            resolve({ 
              success: false, 
              error: `SendGrid returned status ${res.statusCode}`,
              details: data 
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ SendGrid request error:', error);
        reject(error);
      });

      req.write(payload);
      req.end();
    });
  } catch (error) {
    console.error('❌ Error sending email via SendGrid:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ✅ SEND THANK YOU EMAIL TO CANDIDATE
// ============================================

const sendCandidateThankYouEmail = async (candidateData) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #17a2b8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Application Received!</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Dear ${candidateData.first_name},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for applying for the <strong>${candidateData.position}</strong> position with us.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We have successfully received your application, and our recruitment team is currently reviewing your profile. If your qualifications match our requirements, we will contact you to discuss the next steps in the selection process.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We appreciate your interest in joining our organization and wish you all the best.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
            <strong>Warm regards,</strong>
          </p>
          
          <p style="color: #17a2b8; font-size: 16px; font-weight: bold; margin: 0;">
            Prophecy Technologies
          </p>
          
          <p style="color: #999; font-size: 12px; line-height: 1.6; margin-top: 20px;">
            If you have any questions about your application, please don't hesitate to reach out to our recruitment team.<br><br>
            <strong>This is an automated message. Please do not reply to this email.</strong>
          </p>
        </div>
      </div>
    `;

    const result = await sendEmailViaSendGrid({
      to: candidateData.email.trim(),
      subject: `Application Received - ${candidateData.position} Position`,
      html: htmlContent
    });

    if (result.success) {
      console.log('✅ Thank you email sent to candidate:', candidateData.email);
    } else {
      console.error('❌ Failed to send thank you email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error in sendCandidateThankYouEmail:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ✅ MULTER CONFIGURATION - MEMORY STORAGE (for S3)
// ============================================

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExt = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ============================================
// ✅ ATS CONTROLLER
// ============================================

const atsController = {
  getAllApplicants: async (req, res) => {
    let pool;
    try {
      console.log('=== GET ALL APPLICANTS ===');
      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      
      const request = new sql.Request(pool);
      const result = await request.query(`
        SELECT 
          id, timestamp, first_name, last_name, email, phone, position,
          visa_type, current_state, current_city, employment_type,
          resume_s3_key, created_at, job_id, resume_score,
          matched_skills, missing_skills
        FROM applicants
        ORDER BY created_at DESC
      `);

      // ✅ Parse JSON skills for each applicant
      const applicantsWithParsedSkills = result.recordset.map(applicant => ({
        ...applicant,
        matched_skills: applicant.matched_skills ? JSON.parse(applicant.matched_skills) : [],
        missing_skills: applicant.missing_skills ? JSON.parse(applicant.missing_skills) : []
      }));

      console.log(`✅ Found ${result.recordset.length} applicants`);
      return res.json({
        success: true,
        data: applicantsWithParsedSkills,
        count: result.recordset.length
      });

    } catch (error) {
      console.error('❌ Get all applicants error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error fetching applicants',
        error: error.message
      });
    } finally {
      if (pool) await pool.close();
    }
  },

  getApplicantById: async (req, res) => {
    let pool;
    try {
      const applicantId = req.params.id;
      console.log('=== GET APPLICANT BY ID ===', applicantId);

      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      
      const request = new sql.Request(pool);
      request.input('id', sql.Int, applicantId);
      const result = await request.query(`
        SELECT 
          id, timestamp, first_name, last_name, email, phone, position,
          visa_type, current_state, current_city, employment_type,
          resume_s3_key, created_at, job_id, resume_score,
          matched_skills, missing_skills
        FROM applicants 
        WHERE id = @id
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Applicant not found'
        });
      }

      const applicant = result.recordset[0];
      
      // ✅ Parse JSON skills
      const applicantWithSkills = {
        ...applicant,
        matched_skills: applicant.matched_skills ? JSON.parse(applicant.matched_skills) : [],
        missing_skills: applicant.missing_skills ? JSON.parse(applicant.missing_skills) : []
      };

      console.log('✅ Applicant found:', applicantWithSkills.first_name);
      console.log('   Job ID:', applicantWithSkills.job_id);
      console.log('   Matched Skills:', applicantWithSkills.matched_skills);
      console.log('   Missing Skills:', applicantWithSkills.missing_skills);

      return res.json({
        success: true,
        data: applicantWithSkills
      });

    } catch (error) {
      console.error('❌ Get applicant error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error fetching applicant',
        error: error.message
      });
    } finally {
      if (pool) await pool.close();
    }
  },

  getApplicantsByPosition: async (req, res) => {
    let pool;
    try {
      const { position } = req.params;
      console.log('=== GET APPLICANTS BY POSITION ===', position);

      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      
      const request = new sql.Request(pool);
      request.input('position', sql.NVarChar, position);
      const result = await request.query(`
        SELECT 
          id, timestamp, first_name, last_name, email, phone, position,
          visa_type, current_state, current_city, employment_type,
          resume_s3_key, created_at, job_id, resume_score,
          matched_skills, missing_skills
        FROM applicants 
        WHERE position = @position
        ORDER BY created_at DESC
      `);

      // ✅ Parse JSON skills for each applicant
      const applicantsWithParsedSkills = result.recordset.map(applicant => ({
        ...applicant,
        matched_skills: applicant.matched_skills ? JSON.parse(applicant.matched_skills) : [],
        missing_skills: applicant.missing_skills ? JSON.parse(applicant.missing_skills) : []
      }));

      console.log(`✅ Found ${result.recordset.length} applicants for position: ${position}`);
      return res.json({
        success: true,
        data: applicantsWithParsedSkills,
        count: result.recordset.length
      });

    } catch (error) {
      console.error('❌ Get applicants by position error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error fetching applicants',
        error: error.message
      });
    } finally {
      if (pool) await pool.close();
    }
  },

  createApplicant: async (req, res) => {
    let pool;
    try {
      console.log('=== CREATE APPLICANT ===');
      const { first_name, last_name, email, phone, position, visa_type, current_state, current_city, employment_type, job_id } = req.body;
      const file = req.file;

      // ✅ FIXED: Only check mandatory fields
      if (!first_name || !last_name || !email || !phone || !position) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      if (!file) {
        return res.status(400).json({ success: false, message: 'Resume file is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }

      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();

      // Check if email exists
      const checkRequest = new sql.Request(pool);
      checkRequest.input('email', sql.NVarChar, email);
      const checkResult = await checkRequest.query(`SELECT id FROM applicants WHERE email = @email`);

      if (checkResult.recordset.length > 0) {
        return res.status(409).json({ success: false, message: 'This email has already been registered' });
      }

      // ✅ UPLOAD RESUME TO S3
      console.log('📤 Uploading resume to S3...');
      const s3Upload = await uploadResumeToS3(file.buffer, file.originalname, email);

      if (!s3Upload.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload resume to S3',
          error: s3Upload.error
        });
      }

      const timestamp = new Date().toISOString();

      // ✅ Extract clean Job ID (keeps both formats: "47488-1", "N-0037")
      const cleanJobId = extractJobId(job_id);
      console.log('📋 Job ID Input:', job_id);
      console.log('📋 Job ID Stored:', cleanJobId);

      const request = new sql.Request(pool);
      request.input('timestamp', sql.NVarChar, timestamp);
      request.input('first_name', sql.NVarChar, first_name);
      request.input('last_name', sql.NVarChar, last_name);
      request.input('email', sql.NVarChar, email);
      request.input('phone', sql.NVarChar, phone);
      request.input('position', sql.NVarChar, position);
      // ✅ Optional fields - use empty string if not provided
      request.input('visa_type', sql.NVarChar, visa_type || '');
      request.input('current_state', sql.NVarChar, current_state || '');
      request.input('current_city', sql.NVarChar, current_city || '');
      request.input('employment_type', sql.NVarChar, employment_type || '');
      request.input('resume_s3_key', sql.NVarChar, s3Upload.s3Key);
      request.input('created_at', sql.DateTime, new Date());
      request.input('job_id', sql.NVarChar(50), cleanJobId); // ✅ Store as NVARCHAR(50), not INT
      request.input('matched_skills', sql.NVarChar(sql.MAX), JSON.stringify([]));
      request.input('missing_skills', sql.NVarChar(sql.MAX), JSON.stringify([]));

      const result = await request.query(`
        INSERT INTO applicants 
        (timestamp, first_name, last_name, email, phone, position, visa_type, current_state, current_city, employment_type, resume_s3_key, created_at, job_id, matched_skills, missing_skills)
        OUTPUT INSERTED.*
        VALUES (@timestamp, @first_name, @last_name, @email, @phone, @position, @visa_type, @current_state, @current_city, @employment_type, @resume_s3_key, @created_at, @job_id, @matched_skills, @missing_skills)
      `);

      const newApplicant = result.recordset[0];
      console.log('✅ Applicant created successfully, ID:', newApplicant.id);
      console.log('✅ Job ID stored:', newApplicant.job_id);

      // Send thank you email
      const emailResult = await sendCandidateThankYouEmail({
        first_name: newApplicant.first_name,
        last_name: newApplicant.last_name,
        email: newApplicant.email,
        position: newApplicant.position
      });

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: newApplicant,
        emailSent: emailResult.success,
        emailError: emailResult.error || null
      });

    } catch (error) {
      console.error('❌ Create applicant error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error submitting application',
        error: error.message
      });
    } finally {
      if (pool) await pool.close();
    }
  },

  downloadResume: async (req, res) => {
    let pool;
    try {
      console.log('=== DOWNLOAD RESUME ===', req.params.id);

      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      
      const request = new sql.Request(pool);
      request.input('id', sql.Int, req.params.id);
      const result = await request.query(`
        SELECT id, resume_s3_key, first_name, last_name
        FROM applicants WHERE id = @id
      `);

      if (result.recordset.length === 0) {
        console.log('❌ Applicant not found');
        return res.status(404).json({ success: false, message: 'Applicant not found' });
      }

      const applicant = result.recordset[0];

      if (!applicant.resume_s3_key) {
        console.log('❌ Resume S3 key not found');
        return res.status(404).json({ success: false, message: 'Resume not found' });
      }

      console.log('📥 Fetching resume from S3:', applicant.resume_s3_key);
      
      try {
        const params = {
          Bucket: S3_BUCKET,
          Key: applicant.resume_s3_key
        };

        const data = await s3.getObject(params).promise();
        
        // ✅ CRITICAL FIX: Set proper headers for file download
        const ext = path.extname(applicant.resume_s3_key).toLowerCase();
        const contentType = getContentType(ext);
        const fileName = `${applicant.first_name}_${applicant.last_name}${ext}`;

        console.log('📊 Resume details:');
        console.log('   - S3 Key:', applicant.resume_s3_key);
        console.log('   - File name:', fileName);
        console.log('   - Content Type:', contentType);
        console.log('   - Size:', data.Body.length, 'bytes');

        // ✅ Set headers BEFORE sending response body
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', data.Body.length);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // ✅ Send the binary file data
        res.send(data.Body);
        console.log('✅ Resume sent successfully:', fileName);

      } catch (s3Error) {
        console.error('❌ S3 Error:', s3Error.message);
        return res.status(500).json({
          success: false,
          message: 'Error reading resume from S3',
          error: s3Error.message
        });
      }

    } catch (error) {
      console.error('❌ Download resume error:', error.message);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Error downloading resume',
          error: error.message
        });
      }
    } finally {
      if (pool) await pool.close();
    }
  },

  updateApplicant: async (req, res) => {
    let pool;
    try {
      console.log('=== UPDATE APPLICANT ===', req.params.id);
      const applicantId = req.params.id;
      const { first_name, last_name, email, phone, position, visa_type, current_state, current_city, employment_type, job_id } = req.body;

      if (!first_name && !last_name && !email && !phone && !position && !visa_type && !current_state && !current_city && !employment_type && !job_id) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();

      const getRequest = new sql.Request(pool);
      getRequest.input('id', sql.Int, applicantId);
      const getResult = await getRequest.query(`SELECT * FROM applicants WHERE id = @id`);

      if (getResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Applicant not found' });
      }

      const curr = getResult.recordset[0];
      const cleanJobId = job_id ? extractJobId(job_id) : curr.job_id;

      const updateRequest = new sql.Request(pool);
      updateRequest.input('id', sql.Int, applicantId);
      updateRequest.input('first_name', sql.NVarChar, first_name || curr.first_name);
      updateRequest.input('last_name', sql.NVarChar, last_name || curr.last_name);
      updateRequest.input('email', sql.NVarChar, email || curr.email);
      updateRequest.input('phone', sql.NVarChar, phone || curr.phone);
      updateRequest.input('position', sql.NVarChar, position || curr.position);
      updateRequest.input('visa_type', sql.NVarChar, visa_type || curr.visa_type);
      updateRequest.input('current_state', sql.NVarChar, current_state || curr.current_state);
      updateRequest.input('current_city', sql.NVarChar, current_city || curr.current_city);
      updateRequest.input('employment_type', sql.NVarChar, employment_type || curr.employment_type);
      updateRequest.input('job_id', sql.NVarChar(50), cleanJobId); // ✅ CHANGED: Store as NVARCHAR(50)

      await updateRequest.query(`
        UPDATE applicants 
        SET first_name = @first_name, last_name = @last_name, email = @email,
            phone = @phone, position = @position, visa_type = @visa_type,
            current_state = @current_state, current_city = @current_city,
            employment_type = @employment_type, job_id = @job_id
        WHERE id = @id
      `);

      console.log('✅ Applicant updated successfully');
      console.log('✅ Job ID updated to:', cleanJobId);
      return res.json({
        success: true,
        message: 'Applicant updated successfully'
      });

    } catch (error) {
      console.error('❌ Update applicant error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error updating applicant',
        error: error.message
      });
    } finally {
      if (pool) await pool.close();
    }
  },

  deleteApplicant: async (req, res) => {
    let pool;
    try {
      console.log('=== DELETE APPLICANT ===', req.params.id);

      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();

      const getRequest = new sql.Request(pool);
      getRequest.input('id', sql.Int, req.params.id);
      const getResult = await getRequest.query(`SELECT resume_s3_key FROM applicants WHERE id = @id`);

      if (getResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Applicant not found' });
      }

      const applicant = getResult.recordset[0];
      
      // ✅ DELETE FROM S3
      if (applicant.resume_s3_key) {
        const s3Delete = await deleteResumeFromS3(applicant.resume_s3_key);
        if (!s3Delete.success) {
          console.warn('⚠️ Could not delete resume from S3:', s3Delete.error);
        }
      }

      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('id', sql.Int, req.params.id);
      await deleteRequest.query(`DELETE FROM applicants WHERE id = @id`);

      console.log('✅ Applicant deleted successfully');
      return res.json({
        success: true,
        message: 'Applicant deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete applicant error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error deleting applicant',
        error: error.message
      });
    } finally {
      if (pool) await pool.close();
    }
  },

  scoreResume: async (req, res) => {
    let pool;
    try {
      console.log('=== SCORE RESUME ===');
      const { applicantId, jobDescription } = req.body;
      
      if (!applicantId) {
        return res.status(400).json({
          success: false,
          message: 'Applicant ID is required'
        });
      }

      if (!jobDescription) {
        return res.status(400).json({
          success: false,
          message: 'Job description is required'
        });
      }

      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();

      const request = new sql.Request(pool);
      request.input('id', sql.Int, applicantId);
      const result = await request.query(`
        SELECT id, first_name, last_name, resume_s3_key, job_id
        FROM applicants WHERE id = @id
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Applicant not found'
        });
      }

      const applicant = result.recordset[0];
      
      let resumeText = '';
      
      // ✅ GET RESUME TEXT FROM S3
      if (applicant.resume_s3_key) {
        try {
          const params = {
            Bucket: S3_BUCKET,
            Key: applicant.resume_s3_key
          };
          const data = await s3.getObject(params).promise();
          resumeText = await extractResumeText(data.Body, applicant.resume_s3_key);
        } catch (s3Error) {
          console.error('❌ Error reading from S3:', s3Error.message);
        }
      }

      if (!resumeText) {
        return res.status(400).json({
          success: false,
          message: 'Could not extract text from resume'
        });
      }

      // Score with Groq
      const scoreResult = await scoreResumeWithGroq(resumeText, jobDescription);

      console.log('🎯 Score result:', scoreResult);

      if (scoreResult.success) {
        const updateRequest = new sql.Request(pool);
        updateRequest.input('id', sql.Int, applicantId);
        updateRequest.input('score', sql.Int, scoreResult.score);
        updateRequest.input('matchedSkills', sql.NVarChar(sql.MAX), JSON.stringify(scoreResult.matchedSkills || []));
        updateRequest.input('missingSkills', sql.NVarChar(sql.MAX), JSON.stringify(scoreResult.missingSkills || []));
        
        try {
          await updateRequest.query(`
            UPDATE applicants 
            SET resume_score = @score,
                matched_skills = @matchedSkills,
                missing_skills = @missingSkills
            WHERE id = @id
          `);
          console.log('✅ Resume score and skills saved to database');
          console.log('   Matched Skills:', scoreResult.matchedSkills);
          console.log('   Missing Skills:', scoreResult.missingSkills);
        } catch (e) {
          console.log('⚠️ Could not save score/skills to database:', e.message);
        }

        // ✅ FIX: Ensure skills are properly formatted
        const responseData = {
          applicantId: applicant.id,
          score: scoreResult.score || 0,
          matchedSkills: Array.isArray(scoreResult.matchedSkills) 
            ? scoreResult.matchedSkills.filter(s => s && String(s).trim().length > 0)
            : [],
          missingSkills: Array.isArray(scoreResult.missingSkills)
            ? scoreResult.missingSkills.filter(s => s && String(s).trim().length > 0)
            : [],
          summary: scoreResult.summary || 'Resume has been evaluated',
          jobId: applicant.job_id
        };

        console.log('📊 Response data:', responseData);
        console.log('✅ Matched skills count:', responseData.matchedSkills.length);
        console.log('✅ Missing skills count:', responseData.missingSkills.length);

        return res.json({
          success: true,
          data: responseData
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to score resume',
          error: scoreResult.error
        });
      }

    } catch (error) {
      console.error('❌ Score resume error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error scoring resume',
        error: error.message
      });
    } finally {
      if (pool) await pool.close();
    }
  },

  getJobDescription: async (req, res) => {
    try {
      const jobId = req.params.id;
      console.log('=== GET JOB DESCRIPTION ===', jobId);

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'Job ID is required'
        });
      }

      const jobDesc = await fetchJobDescriptionFromDB(jobId);

      if (!jobDesc) {
        return res.status(404).json({
          success: false,
          message: 'Job description not found for this Job ID'
        });
      }

      return res.json({
        success: true,
        data: {
          jobId: jobId,
          description: jobDesc
        }
      });

    } catch (error) {
      console.error('❌ Get job description error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error fetching job description',
        error: error.message
      });
    }
  },

  getStatistics: async (req, res) => {
    let pool;
    try {
      console.log('=== GET ATS STATISTICS ===');

      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();

      const totalRequest = new sql.Request(pool);
      const totalResult = await totalRequest.query(`SELECT COUNT(*) as count FROM applicants`);

      const positionRequest = new sql.Request(pool);
      const positionResult = await positionRequest.query(`
        SELECT position, COUNT(*) as count 
        FROM applicants 
        GROUP BY position 
        ORDER BY count DESC
      `);

      const recentRequest = new sql.Request(pool);
      const recentResult = await recentRequest.query(`
        SELECT TOP 5 * FROM applicants ORDER BY created_at DESC
      `);

      console.log('✅ Statistics retrieved');

      return res.json({
        success: true,
        data: {
          totalApplicants: totalResult.recordset[0].count,
          applicantsByPosition: positionResult.recordset,
          recentApplicants: recentResult.recordset
        }
      });

    } catch (error) {
      console.error('❌ Get statistics error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error fetching statistics',
        error: error.message
      });
    } finally {
      if (pool) await pool.close();
    }
  }
};

// Export
module.exports = { atsController, upload, scoreResumeWithGroq, extractResumeText, fetchJobDescriptionFromDB };