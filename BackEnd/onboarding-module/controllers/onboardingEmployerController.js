const sql = require('mssql');
const { dbConfig } = require('../../config/db');
const bcrypt = require('bcrypt');
const https = require('https');

// ✅ SendGrid Email Helper Function
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
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@prophecyerp.com',
        name: process.env.SENDGRID_FROM_NAME || 'Prophecy ERP'
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
            console.log('✅ Employer email sent successfully via SendGrid API to:', emailData.to);
            resolve({ success: true });
          } else {
            console.error('❌ SendGrid API error for employer email:');
            console.error('   Status:', res.statusCode);
            console.error('   To:', emailData.to);
            console.error('   From:', process.env.SENDGRID_FROM_EMAIL || 'noreply@prophecyerp.com');
            console.error('   Response body:', data);
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

// ✅ Get Frontend URL
const getFrontendURL = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://prophechyerp.duckdns.org';
  }
  return 'http://localhost:218';
};

// ✅ Send Welcome Email to Employer
const sendEmployerWelcomeEmail = async (employerData, credentials) => {
  try {
    const frontendURL = getFrontendURL();
    const employerPortalLink = `${frontendURL}/employer-dashboard`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #019d88; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Prophecy ERP!</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Hello ${employerData.signingAuthorityName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your employer account for <strong>${employerData.companyName}</strong> has been successfully created.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: -10px;">
            You are registered as: <strong>${employerData.signingAuthorityDesignation || 'Authorized Signatory'}</strong>
          </p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">🔐 Your Login Credentials:</h3>
            <table style="width: 100%; color: #856404;">
              <tr>
                <td style="padding: 8px 0;"><strong>Username:</strong></td>
                <td style="padding: 8px 0; font-family: monospace; background: white; padding: 8px; border-radius: 4px;">${credentials.username}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Password:</strong></td>
                <td style="padding: 8px 0; font-family: monospace; background: white; padding: 8px; border-radius: 4px;">${credentials.password}</td>
              </tr>
            </table>
            <p style="color: #856404; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
              ⚠️ <strong>Important:</strong> After logging in, please complete your company information form.
            </p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${employerPortalLink}" 
               style="background-color: #019d88; 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;">
              Access Employer Portal
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #019d88; word-break: break-all; font-size: 12px;">
            ${employerPortalLink}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            If you have any questions or need assistance, please contact our support team.<br><br>
            <strong>This is an automated message. Please do not reply to this email.</strong>
          </p>
        </div>
      </div>
    `;

    const result = await sendEmailViaSendGrid({
      to: employerData.emailId.trim(),
      subject: `Welcome to Prophecy ERP - Your Employer Account Details for ${employerData.companyName}`,
      html: htmlContent
    });

    if (result.success) {
      console.log('✅ Welcome email sent to employer:', employerData.emailId);
    } else {
      console.error('❌ Failed to send welcome email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error in sendEmployerWelcomeEmail:', error);
    return { success: false, error: error.message };
  }
};

const onboardingEmployerController = {
  // Test connection
  testConnection: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const result = await sql.query('SELECT 1 as test');
      res.json({
        success: true,
        message: 'Onboarding employer module database connection successful',
        data: result.recordset
      });
    } catch (error) {
      console.error('Onboarding employer DB connection failed:', error);
      res.status(500).json({
        success: false,
        message: 'Onboarding employer module database connection failed',
        error: error.message
      });
    }
  },

  // Create new employer with email
  createEmployer: async (req, res) => {
    let connection = null;
    
    try {
      console.log('=== CREATE EMPLOYER REQUEST ===');
      console.log('Request body:', req.body);
      
      connection = new sql.ConnectionPool(dbConfig);
      await connection.connect();
      console.log('✅ Database connection established');
      
      const {
        companyName,
        feinId,
        companyAddress,
        signingAuthorityName,
        signingAuthorityDesignation,
        emailId,
        contactNo,
        username,
        password
      } = req.body;

      const normalizedEmail = emailId.trim().toLowerCase();
      console.log('🔍 Normalized email:', normalizedEmail);

      // Validation - only check for absolutely required fields
      if (!companyName || !emailId || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Company name, email, username, and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Check if username already exists
      const usernameCheckRequest = new sql.Request(connection);
      usernameCheckRequest.input('username', sql.NVarChar, username.trim());
      const usernameCheckResult = await usernameCheckRequest.query(`
        SELECT id FROM userinfo WHERE username = @username
      `);
      
      if (usernameCheckResult.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists. Please choose a different username.'
        });
      }

      // Check if email already exists in userdetails
      const emailCheckRequest = new sql.Request(connection);
      emailCheckRequest.input('email', sql.NVarChar, normalizedEmail);
      const emailCheckResult = await emailCheckRequest.query(`
        SELECT id FROM userdetails WHERE email = @email
      `);
      
      if (emailCheckResult.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered. Please use a different email.'
        });
      }

      let userAuthId = null;
      const hashedPassword = await bcrypt.hash(password, 10);
      const plainPassword = password;

      // Start transaction
      const transaction = new sql.Transaction(connection);
      await transaction.begin();

      try {
        // 1. Create user authentication
        const userInfoRequest = new sql.Request(transaction);
        const userResult = await userInfoRequest
          .input('username', sql.NVarChar, username.trim())
          .input('password', sql.NVarChar, hashedPassword)
          .input('role', sql.NVarChar, 'employer')
          .input('profile', sql.NVarChar, '')
          .input('EmployeeId', sql.NVarChar, null)
          .query(`
            INSERT INTO userinfo (username, password, role, profile, EmployeeId)
            OUTPUT INSERTED.id
            VALUES (@username, @password, @role, @profile, @EmployeeId)
          `);

        userAuthId = userResult.recordset[0].id;
        console.log('✅ User authentication created with ID:', userAuthId);

        // 2. Create user details (with empty strings for optional fields)
        const nameParts = signingAuthorityName ? signingAuthorityName.trim().split(' ') : [companyName];
        const firstName = nameParts[0] || companyName;
        const lastName = nameParts.slice(1).join(' ') || '';

        const userDetailsRequest = new sql.Request(transaction);
        await userDetailsRequest
          .input('id', sql.Int, userAuthId)
          .input('firstName', sql.NVarChar, firstName)
          .input('lastName', sql.NVarChar, lastName)
          .input('email', sql.NVarChar, normalizedEmail)
          .input('phone', sql.NVarChar, contactNo || '')
          .input('mobile', sql.NVarChar, '')
          .input('fax', sql.NVarChar, '')
          .input('website', sql.NVarChar, '')
          .input('dob', sql.DateTime, null)
          .input('street', sql.NVarChar, companyAddress || '')
          .input('city', sql.NVarChar, '')
          .input('province', sql.NVarChar, '')
          .input('postalCode', sql.NVarChar, '')
          .input('country', sql.NVarChar, '')
          .input('signature', sql.NVarChar, '')
          .input('alias', sql.NVarChar, '')
          .input('emailNotifications', sql.Bit, 1)
          .query(`
            INSERT INTO userdetails (
              id, firstName, lastName, email, phone, mobile, fax, website, 
              dob, street, city, province, postalCode, country, 
              signature, alias, emailNotifications
            )
            VALUES (
              @id, @firstName, @lastName, @email, @phone, @mobile, @fax, @website,
              @dob, @street, @city, @province, @postalCode, @country,
              @signature, @alias, @emailNotifications
            )
          `);

        console.log('✅ User details created for ID:', userAuthId);

        // 3. Create employer record
        const feinIdValue = (feinId && String(feinId).trim() !== '') ? String(feinId).trim() : null;

        const employerRequest = new sql.Request(transaction);
        employerRequest.input('companyName', sql.NVarChar, companyName.trim());
        employerRequest.input('companyAddress', sql.NVarChar, companyAddress || '');
        employerRequest.input('signingAuthorityName', sql.NVarChar, signingAuthorityName || '');
        employerRequest.input('signingAuthorityDesignation', sql.NVarChar, signingAuthorityDesignation || '');
        employerRequest.input('emailId', sql.NVarChar, normalizedEmail);
        employerRequest.input('contactNo', sql.NVarChar, contactNo || '');
        employerRequest.input('userId', sql.Int, userAuthId);
        employerRequest.input('createdAt', sql.DateTime, new Date());
        employerRequest.input('updatedAt', sql.DateTime, new Date());

        const feinIdSql = feinIdValue ? '@feinId' : 'NULL';
        if (feinIdValue) {
          employerRequest.input('feinId', sql.NVarChar, feinIdValue);
        }

        const employerResult = await employerRequest.query(`
          INSERT INTO employers (
            companyName, feinId, companyAddress, signingAuthorityName,
            signingAuthorityDesignation, emailId, contactNo, userId,
            createdAt, updatedAt
          )
          OUTPUT INSERTED.id
          VALUES (
            @companyName, ${feinIdSql}, @companyAddress, @signingAuthorityName,
            @signingAuthorityDesignation, @emailId, @contactNo, @userId,
            @createdAt, @updatedAt
          )
        `);

        const employerId = employerResult.recordset[0].id;
        console.log('✅ Employer record created with ID:', employerId);

        await transaction.commit();
        console.log('✅ Transaction committed successfully');

        const employerDataForEmail = {
          companyName,
          feinId: feinId || 'Not provided',
          companyAddress: companyAddress || 'Not provided',
          signingAuthorityName: signingAuthorityName || companyName,
          signingAuthorityDesignation: signingAuthorityDesignation || 'Not provided',
          emailId: normalizedEmail,
          contactNo: contactNo || 'Not provided'
        };

        const credentials = {
          username: username.trim(),
          password: plainPassword
        };

        console.log('📧 Sending welcome email to:', normalizedEmail);
        const emailResult = await sendEmployerWelcomeEmail(employerDataForEmail, credentials);

        // Fetch created employer
        const getEmployerRequest = new sql.Request(connection);
        getEmployerRequest.input('id', sql.Int, employerId);
        const getEmployerResult = await getEmployerRequest.query(`
          SELECT * FROM employers WHERE id = @id
        `);

        const newEmployer = getEmployerResult.recordset[0];

        res.status(201).json({
          success: true,
          message: 'Employer created successfully',
          data: {
            id: newEmployer.id,
            companyName: newEmployer.companyName,
            feinId: newEmployer.feinId,
            companyAddress: newEmployer.companyAddress,
            signingAuthorityName: newEmployer.signingAuthorityName,
            signingAuthorityDesignation: newEmployer.signingAuthorityDesignation,
            emailId: newEmployer.emailId,
            contactNo: newEmployer.contactNo,
            userId: newEmployer.userId,
            createdAt: newEmployer.createdAt,
            updatedAt: newEmployer.updatedAt
          },
          credentials: credentials,
          emailSent: emailResult.success,
          emailError: emailResult.error || null,
          module: 'onboarding'
        });

      } catch (transactionError) {
        await transaction.rollback();
        console.error('❌ Transaction error:', transactionError);
        throw transactionError;
      }

    } catch (error) {
      console.error('❌ Create employer error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating employer: ' + error.message, 
        error: error.message 
      });
    } finally {
      if (connection && connection.connected) {
        try {
          await connection.close();
          console.log('✅ Database connection closed');
        } catch (closeError) {
          console.warn('⚠️ Error closing connection:', closeError.message);
        }
      }
    }
  },

  // Get all employers (supports ?email= filter for existence check)
  getAllEmployers: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      
      const { email } = req.query;
      
      let query = `SELECT * FROM employers`;
      const request = new sql.Request();
      
      if (email) {
        request.input('email', sql.NVarChar, email.trim().toLowerCase());
        query += ` WHERE LOWER(emailId) = @email`;
      }
      
      query += ` ORDER BY createdAt DESC`;
      
      const result = await request.query(query);
      
      const employers = result.recordset.map(emp => ({
        id: emp.id,
        companyName: emp.companyName,
        feinId: emp.feinId,
        companyAddress: emp.companyAddress,
        signingAuthorityName: emp.signingAuthorityName,
        signingAuthorityDesignation: emp.signingAuthorityDesignation,
        emailId: emp.emailId,
        contactNo: emp.contactNo,
        userId: emp.userId,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt
      }));
      
      res.json({
        success: true,
        data: employers,
        count: employers.length,
        module: 'onboarding'
      });
    } catch (error) {
      console.error('Onboarding get employers error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employers', 
        error: error.message 
      });
    }
  },

  // Get employer by ID
  getEmployerById: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      
      const result = await request.query(`
        SELECT * FROM employers WHERE id = @id
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Employer not found' 
        });
      }
      
      const emp = result.recordset[0];
      
      res.json({
        success: true,
        data: {
          id: emp.id,
          companyName: emp.companyName,
          feinId: emp.feinId,
          companyAddress: emp.companyAddress,
          signingAuthorityName: emp.signingAuthorityName,
          signingAuthorityDesignation: emp.signingAuthorityDesignation,
          emailId: emp.emailId,
          contactNo: emp.contactNo,
          userId: emp.userId,
          createdAt: emp.createdAt,
          updatedAt: emp.updatedAt
        }
      });
    } catch (error) {
      console.error('Onboarding get employer error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employer', 
        error: error.message 
      });
    }
  },

  // Get employer with document paths
  getEmployerWithDocuments: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { id } = req.params;

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT * FROM employers WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Employer not found' 
        });
      }

      const emp = result.recordset[0];
      let documentPaths = {};
      if (emp.DocumentPaths) {
        try {
          documentPaths = JSON.parse(emp.DocumentPaths);
        } catch (e) {
          documentPaths = {};
        }
      }

      res.json({
        success: true,
        data: {
          id: emp.id,
          companyName: emp.companyName,
          feinId: emp.feinId,
          companyAddress: emp.companyAddress,
          signingAuthorityName: emp.signingAuthorityName,
          signingAuthorityDesignation: emp.signingAuthorityDesignation,
          emailId: emp.emailId,
          contactNo: emp.contactNo,
          userId: emp.userId,
          createdAt: emp.createdAt,
          updatedAt: emp.updatedAt,
          documentPaths: documentPaths
        }
      });
    } catch (error) {
      console.error('Error getting employer with documents:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employer: ' + error.message 
      });
    }
  },

  // Get employer by user ID (for dashboard after login)
  getEmployerByUserId: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { userId } = req.params;
      
      const request = new sql.Request();
      request.input('userId', sql.Int, userId);
      
      const result = await request.query(`
        SELECT * FROM employers WHERE userId = @userId
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Employer not found for this user' 
        });
      }
      
      const emp = result.recordset[0];
      
      // Parse document paths
      let documentPaths = {};
      if (emp.DocumentPaths) {
        try {
          documentPaths = JSON.parse(emp.DocumentPaths);
        } catch (e) {
          documentPaths = {};
        }
      }
      
      res.json({
        success: true,
        data: {
          id: emp.id,
          companyName: emp.companyName,
          feinId: emp.feinId,
          companyAddress: emp.companyAddress,
          signingAuthorityName: emp.signingAuthorityName,
          signingAuthorityDesignation: emp.signingAuthorityDesignation,
          emailId: emp.emailId,
          contactNo: emp.contactNo,
          userId: emp.userId,
          createdAt: emp.createdAt,
          updatedAt: emp.updatedAt,
          documentPaths: documentPaths
        }
      });
    } catch (error) {
      console.error('Onboarding get employer by user ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employer by user ID', 
        error: error.message 
      });
    }
  },

  // Upload document for employer
  uploadDocument: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { id } = req.params;
      const { documentType } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Get current document paths
      const getResult = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT DocumentPaths FROM employers WHERE id = @id
        `);

      if (getResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      let documentPaths = {};
      if (getResult.recordset[0].DocumentPaths) {
        try {
          documentPaths = JSON.parse(getResult.recordset[0].DocumentPaths);
        } catch (e) {
          documentPaths = {};
        }
      }

      // Convert file buffer to base64 data URI
      const base64Data = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;

      // Store base64 in document paths
      documentPaths[documentType] = {
        url: dataUri,
        fileName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        fileSize: req.file.size,
        fileType: req.file.mimetype
      };

      const documentPathsJson = JSON.stringify(documentPaths);

      await pool.request()
        .input('id', sql.Int, id)
        .input('documentPaths', sql.NVarChar, documentPathsJson)
        .query(`
          UPDATE employers 
          SET DocumentPaths = @documentPaths,
              UpdatedAt = GETDATE()
          WHERE id = @id
        `);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          documentType,
          fileName: req.file.originalname,
          url: dataUri
        }
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error uploading document: ' + error.message 
      });
    }
  },

  // Delete document for employer
  deleteDocument: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { id, documentType } = req.params;

      // Get current document paths
      const getResult = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT DocumentPaths FROM employers WHERE id = @id
        `);

      if (getResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      let documentPaths = {};
      if (getResult.recordset[0].DocumentPaths) {
        try {
          documentPaths = JSON.parse(getResult.recordset[0].DocumentPaths);
        } catch (e) {
          documentPaths = {};
        }
      }

      // Remove document
      if (documentPaths[documentType]) {
        delete documentPaths[documentType];
      }

      const documentPathsJson = JSON.stringify(documentPaths);

      await pool.request()
        .input('id', sql.Int, id)
        .input('documentPaths', sql.NVarChar, documentPathsJson)
        .query(`
          UPDATE employers 
          SET DocumentPaths = @documentPaths,
              UpdatedAt = GETDATE()
          WHERE id = @id
        `);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting document: ' + error.message 
      });
    }
  },

  // Update employer
  updateEmployer: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const {
        companyName,
        feinId,
        companyAddress,
        signingAuthorityName,
        signingAuthorityDesignation,
        emailId,
        contactNo
      } = req.body;
      
      if (!companyName || !feinId || !companyAddress || !signingAuthorityName || 
          !signingAuthorityDesignation || !emailId || !contactNo) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      request.input('companyName', sql.NVarChar, companyName.trim());
      request.input('feinId', sql.NVarChar, feinId.trim());
      request.input('companyAddress', sql.NVarChar, companyAddress.trim());
      request.input('signingAuthorityName', sql.NVarChar, signingAuthorityName.trim());
      request.input('signingAuthorityDesignation', sql.NVarChar, signingAuthorityDesignation.trim());
      request.input('emailId', sql.NVarChar, emailId.trim().toLowerCase());
      request.input('contactNo', sql.NVarChar, contactNo.trim());
      request.input('updatedAt', sql.DateTime, new Date());
      
      const result = await request.query(`
        UPDATE employers 
        SET companyName = @companyName,
            feinId = @feinId,
            companyAddress = @companyAddress,
            signingAuthorityName = @signingAuthorityName,
            signingAuthorityDesignation = @signingAuthorityDesignation,
            emailId = @emailId,
            contactNo = @contactNo,
            updatedAt = @updatedAt
        WHERE id = @id
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Employer not found' 
        });
      }
      
      const getRequest = new sql.Request();
      getRequest.input('id', sql.Int, id);
      const getResult = await getRequest.query(`
        SELECT * FROM employers WHERE id = @id
      `);
      
      const emp = getResult.recordset[0];
      
      res.json({
        success: true,
        message: 'Employer updated successfully',
        data: {
          id: emp.id,
          companyName: emp.companyName,
          feinId: emp.feinId,
          companyAddress: emp.companyAddress,
          signingAuthorityName: emp.signingAuthorityName,
          signingAuthorityDesignation: emp.signingAuthorityDesignation,
          emailId: emp.emailId,
          contactNo: emp.contactNo,
          userId: emp.userId,
          createdAt: emp.createdAt,
          updatedAt: emp.updatedAt
        },
        module: 'onboarding'
      });
    } catch (error) {
      console.error('Onboarding update employer error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating employer: ' + error.message, 
        error: error.message 
      });
    }
  },

  // Delete employer
  deleteEmployer: async (req, res) => {
    let connection = null;
    
    try {
      const { id } = req.params;
      
      connection = new sql.ConnectionPool(dbConfig);
      await connection.connect();
      
      const getRequest = new sql.Request(connection);
      getRequest.input('id', sql.Int, id);
      const getResult = await getRequest.query(`
        SELECT * FROM employers WHERE id = @id
      `);
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Employer not found' 
        });
      }
      
      const employer = getResult.recordset[0];
      const userId = employer.userId;
      
      const transaction = new sql.Transaction(connection);
      await transaction.begin();
      
      try {
        const deleteEmployerRequest = new sql.Request(transaction);
        deleteEmployerRequest.input('id', sql.Int, id);
        await deleteEmployerRequest.query(`
          DELETE FROM employers WHERE id = @id
        `);
        
        if (userId) {
          const deleteUserDetailsRequest = new sql.Request(transaction);
          deleteUserDetailsRequest.input('userId', sql.Int, userId);
          await deleteUserDetailsRequest.query(`
            DELETE FROM userdetails WHERE id = @userId
          `);
          
          const deleteUserInfoRequest = new sql.Request(transaction);
          deleteUserInfoRequest.input('userId', sql.Int, userId);
          await deleteUserInfoRequest.query(`
            DELETE FROM userinfo WHERE id = @userId
          `);
        }
        
        await transaction.commit();
        
        res.json({
          success: true,
          message: 'Employer deleted successfully',
          module: 'onboarding'
        });
        
      } catch (transactionError) {
        await transaction.rollback();
        throw transactionError;
      }
      
    } catch (error) {
      console.error('Onboarding delete employer error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting employer', 
        error: error.message 
      });
    } finally {
      if (connection && connection.connected) {
        try {
          await connection.close();
        } catch (e) {}
      }
    }
  },

  // Delete orphaned userinfo/userdetails record by email (when employer creation failed mid-way)
  cleanupOrphanedEmail: async (req, res) => {
    try {
      const { email } = req.params;
      const normalizedEmail = decodeURIComponent(email).trim().toLowerCase();

      await sql.connect(dbConfig);

      // Find user by email in userdetails
      const findRequest = new sql.Request();
      findRequest.input('email', sql.NVarChar, normalizedEmail);
      const findResult = await findRequest.query(`
        SELECT ud.id, ui.role 
        FROM userdetails ud
        LEFT JOIN userinfo ui ON ui.id = ud.id
        WHERE LOWER(ud.email) = @email
      `);

      if (findResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No user found with this email in userdetails'
        });
      }

      const userId = findResult.recordset[0].id;
      const role = findResult.recordset[0].role;

      // Safety check: only allow cleanup of employer/orphaned records, not candidates/employees
      if (role === 'candidate' || role === 'employee') {
        return res.status(403).json({
          success: false,
          message: `Cannot delete: this email belongs to a ${role} account`
        });
      }

      // Also check if a completed employer record exists — if so, don't allow deletion
      const employerCheckRequest = new sql.Request();
      employerCheckRequest.input('email', sql.NVarChar, normalizedEmail);
      const employerCheck = await employerCheckRequest.query(`
        SELECT id FROM employers WHERE LOWER(emailId) = @email
      `);

      if (employerCheck.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'A completed employer record exists for this email. Use the delete employer endpoint instead.',
          employerId: employerCheck.recordset[0].id
        });
      }

      // Safe to delete orphaned records
      const deleteDetailsRequest = new sql.Request();
      deleteDetailsRequest.input('userId', sql.Int, userId);
      await deleteDetailsRequest.query(`DELETE FROM userdetails WHERE id = @userId`);

      const deleteUserRequest = new sql.Request();
      deleteUserRequest.input('userId', sql.Int, userId);
      await deleteUserRequest.query(`DELETE FROM userinfo WHERE id = @userId`);

      console.log(`✅ Cleaned up orphaned records for email: ${normalizedEmail}, userId: ${userId}`);

      res.json({
        success: true,
        message: `Orphaned user records for ${normalizedEmail} deleted. You can now re-create the employer account.`,
        deletedUserId: userId
      });

    } catch (error) {
      console.error('Error cleaning up orphaned email:', error);
      res.status(500).json({
        success: false,
        message: 'Error cleaning up: ' + error.message
      });
    }
  },

  // Resend credentials email to an existing employer
  resendEmployerCredentials: async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to resend credentials'
        });
      }

      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      const result = await request.query(`SELECT * FROM employers WHERE id = @id`);

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Employer not found' });
      }

      const emp = result.recordset[0];

      // Get username from userinfo
      const userRequest = new sql.Request();
      userRequest.input('userId', sql.Int, emp.userId);
      const userResult = await userRequest.query(`SELECT username FROM userinfo WHERE id = @userId`);
      const username = userResult.recordset[0]?.username || 'N/A';

      const employerDataForEmail = {
        companyName: emp.companyName,
        signingAuthorityName: emp.signingAuthorityName || emp.companyName,
        emailId: emp.emailId
      };

      const emailResult = await sendEmployerWelcomeEmail(employerDataForEmail, { username, password });

      res.json({
        success: true,
        message: emailResult.success
          ? 'Credentials email resent successfully'
          : 'Employer found but email failed to send',
        emailSent: emailResult.success,
        emailError: emailResult.error || null
      });
    } catch (error) {
      console.error('Error resending employer credentials:', error);
      res.status(500).json({ success: false, message: 'Error resending credentials: ' + error.message });
    }
  },

  // Get employer statistics
  getEmployerStats: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      
      const result = await sql.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN createdAt >= DATEADD(month, -1, GETDATE()) THEN 1 END) as newLastMonth,
          COUNT(CASE WHEN createdAt >= DATEADD(month, -3, GETDATE()) THEN 1 END) as newLastQuarter
        FROM employers
      `);
      
      res.json({
        success: true,
        data: result.recordset[0],
        module: 'onboarding'
      });
    } catch (error) {
      console.error('Onboarding get employer stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employer statistics', 
        error: error.message 
      });
    }
  }
};

module.exports = onboardingEmployerController;