const sql = require('mssql');
const { dbConfig } = require('../../config/db');
const bcrypt = require('bcrypt');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { PDFDocument, degrees } = require('pdf-lib');

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

// ✅ Send Welcome Email to Candidate
const sendCandidateWelcomeEmail = async (candidateData, credentials) => {
  try {
    const frontendURL = getFrontendURL();
    const candidatePortalLink = `${frontendURL}/candidate-onboarding`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #019d88; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Prophecy ERP!</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Hello ${candidateData.candidateName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your onboarding process has been initiated for <strong>${candidateData.client || candidateData.clientName}</strong>.
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
              ⚠️ <strong>Important:</strong> Please complete your onboarding form after logging in.
            </p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${candidatePortalLink}" 
               style="background-color: #019d88; 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;">
              Access Candidate Portal
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #019d88; word-break: break-all; font-size: 12px;">
            ${candidatePortalLink}
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
      to: candidateData.candidateEmail.trim(),
      subject: `Welcome to Prophecy ERP - Complete Your Onboarding for ${candidateData.client || candidateData.clientName}`,
      html: htmlContent
    });

    if (result.success) {
      console.log('✅ Welcome email sent to candidate:', candidateData.candidateEmail);
    } else {
      console.error('❌ Failed to send welcome email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error in sendCandidateWelcomeEmail:', error);
    return { success: false, error: error.message };
  }
};

const onboardingWorkflowEmployeeController = {
  // Get all workflow employees for a company
  getAllWorkflowEmployees: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId } = req.params;
      
      const result = await pool.request()
        .input('companyId', sql.Int, companyId)
        .query(`
          SELECT * FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId
          ORDER BY CreatedAt DESC
        `);
      
      const employees = result.recordset.map(emp => ({
        id: emp.WorkflowEmployeeId,
        employeeId: emp.CandidateEmployeeId,
        name: emp.CandidateName,
        email: emp.CandidateEmail,
        department: emp.Department,
        position: emp.Position,
        hireDate: emp.HireDate,
        client: emp.Client,
        clientName: emp.ClientName,
        clientEmail: emp.ClientEmail,
        workflowStatus: emp.WorkflowStatus,
        workflowProgress: emp.WorkflowProgress,
        workflowSteps: emp.WorkflowSteps ? JSON.parse(emp.WorkflowSteps) : [],
        currentStepIndex: emp.CurrentStepIndex,
        templateId: emp.WorkflowTemplateId,
        onboardingFormData: emp.OnboardingFormData ? JSON.parse(emp.OnboardingFormData) : null,
        documentPaths: emp.DocumentPaths ? JSON.parse(emp.DocumentPaths) : {},
        userId: emp.UserId,
        createdAt: emp.CreatedAt,
        updatedAt: emp.UpdatedAt
      }));
      
      res.json({
        success: true,
        data: employees,
        count: employees.length
      });
    } catch (error) {
      console.error('Error getting workflow employees:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving workflow employees: ' + error.message 
      });
    }
  },

  // Get single workflow employee by ID
 // Around line 275 - getWorkflowEmployeeById
getWorkflowEmployeeById: async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { companyId, employeeId } = req.params;
    
    const result = await pool.request()
      .input('companyId', sql.Int, companyId)
      .input('employeeId', sql.Int, employeeId)
      .query(`
        SELECT * FROM OnboardingWorkflowEmployees 
        WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Workflow employee not found' 
      });
    }
    
    const emp = result.recordset[0];
    
    // Parse workflow steps
    let workflowSteps = [];
    if (emp.WorkflowSteps) {
      try {
        workflowSteps = typeof emp.WorkflowSteps === 'string' 
          ? JSON.parse(emp.WorkflowSteps) 
          : emp.WorkflowSteps;
        
        // 🔥 FIX: Process each step to ensure signed documents are prioritized
        workflowSteps = workflowSteps.map(step => {
          // If this is a compliance step that has been signed
          if (step.docusignStatus === 'signed' && step.signedDocuments && step.signedDocuments.length > 0) {
            return {
              ...step,
              // 🔥 CRITICAL: Add a flag that frontend can use
              documentsForDisplay: step.signedDocuments,  // Use signed versions
              hasEmbeddedSignature: true,
              // Also preserve original arrays for reference
              complianceDocuments: step.complianceDocuments,
              signedDocuments: step.signedDocuments
            };
          }
          return step;
        });
        
      } catch (parseError) {
        console.error('Error parsing workflow steps:', parseError);
        workflowSteps = [];
      }
    }
    
    res.json({
      success: true,
      data: {
        id: emp.WorkflowEmployeeId,
        companyId: emp.CompanyId,
        employeeId: emp.CandidateEmployeeId,
        name: emp.CandidateName,
        email: emp.CandidateEmail,
        department: emp.Department,
        position: emp.Position,
        hireDate: emp.HireDate,
        client: emp.Client,
        clientName: emp.ClientName,
        clientEmail: emp.ClientEmail,
        workflowStatus: emp.WorkflowStatus,
        workflowProgress: emp.WorkflowProgress,
        workflowSteps: workflowSteps,  // Now has documentsForDisplay
        currentStepIndex: emp.CurrentStepIndex,
        templateId: emp.WorkflowTemplateId,
        onboardingFormData: emp.OnboardingFormData ? JSON.parse(emp.OnboardingFormData) : null,
        documentPaths: emp.DocumentPaths ? JSON.parse(emp.DocumentPaths) : {},
        userId: emp.UserId,
        createdAt: emp.CreatedAt,
        updatedAt: emp.UpdatedAt
      }
    });
  } catch (error) {
    console.error('Error getting workflow employee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving workflow employee: ' + error.message 
    });
  }
},
  // Get workflow employee by email (for candidate login)
  getWorkflowEmployeeByEmail: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { email } = req.params;
      const normalizedEmail = email.toLowerCase();
      
      const result = await pool.request()
        .input('email', sql.NVarChar, normalizedEmail)
        .query(`
          SELECT * FROM OnboardingWorkflowEmployees 
          WHERE LOWER(CandidateEmail) = @email
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Workflow employee not found' 
        });
      }
      
      const emp = result.recordset[0];
      
      res.json({
        success: true,
        data: {
          id: emp.WorkflowEmployeeId,
          employeeId: emp.CandidateEmployeeId,
          name: emp.CandidateName,
          email: emp.CandidateEmail,
          department: emp.Department,
          position: emp.Position,
          hireDate: emp.HireDate,
          client: emp.Client,
          clientName: emp.ClientName,
          clientEmail: emp.ClientEmail,
          workflowStatus: emp.WorkflowStatus,
          workflowProgress: emp.WorkflowProgress,
          workflowSteps: emp.WorkflowSteps ? JSON.parse(emp.WorkflowSteps) : [],
          currentStepIndex: emp.CurrentStepIndex,
          templateId: emp.WorkflowTemplateId,
          onboardingFormData: emp.OnboardingFormData ? JSON.parse(emp.OnboardingFormData) : null,
          documentPaths: emp.DocumentPaths ? JSON.parse(emp.DocumentPaths) : {},
          userId: emp.UserId,
          createdAt: emp.CreatedAt,
          updatedAt: emp.UpdatedAt
        }
      });
    } catch (error) {
      console.error('Error getting workflow employee by email:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving workflow employee: ' + error.message 
      });
    }
  },
  
  // Get workflow employee by ClientEmail (employer's email) — used by EmployerDashboard
  getWorkflowEmployeeByClientEmail: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { email } = req.params;
      const normalizedEmail = decodeURIComponent(email).toLowerCase();

      const result = await pool.request()
        .input('email', sql.NVarChar, normalizedEmail)
        .query(`
          SELECT TOP 1 * FROM OnboardingWorkflowEmployees 
          WHERE LOWER(ClientEmail) = @email
          ORDER BY CreatedAt DESC
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No workflow record found for this employer email'
        });
      }

      const emp = result.recordset[0];
      res.json({
        success: true,
        data: {
          id: emp.WorkflowEmployeeId,
          companyId: emp.CompanyId,
          candidateName: emp.CandidateName,
          clientEmail: emp.ClientEmail,
          workflowSteps: emp.WorkflowSteps ? JSON.parse(emp.WorkflowSteps) : []
        }
      });
    } catch (error) {
      console.error('Error getting workflow by client email:', error);
      res.status(500).json({
        success: false,
        message: 'Error: ' + error.message
      });
    }
  },

  // Get workflow employee by username (for candidate login - reliable lookup)
  getWorkflowEmployeeByUsername: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { username } = req.params;

      // First get the userId from userinfo by username
      const userResult = await pool.request()
        .input('username', sql.NVarChar, username)
        .query(`
          SELECT id, username, role FROM userinfo WHERE username = @username
        `);

      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userId = userResult.recordset[0].id;

      // Now find the workflow employee by UserId
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT * FROM OnboardingWorkflowEmployees 
          WHERE UserId = @userId
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No onboarding workflow found for your account'
        });
      }

      const emp = result.recordset[0];

      res.json({
        success: true,
        data: {
          id: emp.WorkflowEmployeeId,
          companyId: emp.CompanyId,
          employeeId: emp.CandidateEmployeeId,
          name: emp.CandidateName,
          email: emp.CandidateEmail,
          department: emp.Department,
          position: emp.Position,
          hireDate: emp.HireDate,
          client: emp.Client,
          clientName: emp.ClientName,
          clientEmail: emp.ClientEmail,
          workflowStatus: emp.WorkflowStatus,
          workflowProgress: emp.WorkflowProgress,
          workflowSteps: emp.WorkflowSteps ? JSON.parse(emp.WorkflowSteps) : [],
          currentStepIndex: emp.CurrentStepIndex,
          templateId: emp.WorkflowTemplateId,
          onboardingFormData: emp.OnboardingFormData ? JSON.parse(emp.OnboardingFormData) : null,
          documentPaths: emp.DocumentPaths ? JSON.parse(emp.DocumentPaths) : {},
          userId: emp.UserId,
          createdAt: emp.CreatedAt,
          updatedAt: emp.UpdatedAt
        }
      });
    } catch (error) {
      console.error('Error getting workflow employee by username:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving workflow employee: ' + error.message
      });
    }
  },

  // Create new workflow employee
  createWorkflowEmployee: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId } = req.params;
      
      const {
        client,
        clientName,
        clientEmail,
        candidateName,
        candidateEmail,
        candidateEmployeeId,
        department,
        position,
        hireDate,
        templateId,
        workflowSteps,
        createdBy
      } = req.body;

      console.log('Creating workflow employee:', {
        companyId,
        clientName,
        candidateName,
        candidateEmail,
        candidateEmployeeId
      });

      // Validate required fields
      if (!clientName || !clientEmail || !candidateName || !candidateEmail || !candidateEmployeeId) {
        return res.status(400).json({
          success: false,
          message: 'Client name, Client email, Candidate name, Candidate email, and Employee ID are required'
        });
      }

      const normalizedEmail = candidateEmail.toLowerCase();

      // Check if employee already exists in workflow table
      const checkResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('email', sql.NVarChar, normalizedEmail)
        .input('empId', sql.NVarChar, candidateEmployeeId)
        .query(`
          SELECT WorkflowEmployeeId FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId 
          AND (LOWER(CandidateEmail) = @email OR CandidateEmployeeId = @empId)
        `);
      
      if (checkResult.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Employee with this email or ID already exists in workflow system'
        });
      }

      // Insert into workflow employees table
      const stepsJson = JSON.stringify(workflowSteps);

      // Handle hireDate - if it's empty or invalid, set to NULL
      let finalHireDate = null;
      if (hireDate && hireDate !== '') {
        finalHireDate = hireDate;
      }

      const insertResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('client', sql.NVarChar, client || '')
        .input('clientName', sql.NVarChar, clientName)
        .input('clientEmail', sql.NVarChar, clientEmail)
        .input('candidateName', sql.NVarChar, candidateName)
        .input('candidateEmail', sql.NVarChar, normalizedEmail)
        .input('candidateEmployeeId', sql.NVarChar, candidateEmployeeId)
        .input('department', sql.NVarChar, department || '')
        .input('position', sql.NVarChar, position || '')
        .input('hireDate', sql.DateTime, finalHireDate)
        .input('templateId', sql.Int, templateId || null)
        .input('workflowSteps', sql.NVarChar, stepsJson)
        .input('createdBy', sql.NVarChar, createdBy || 'system')
        .query(`
          INSERT INTO OnboardingWorkflowEmployees (
            CompanyId, Client, ClientName, ClientEmail, CandidateName, CandidateEmail,
            CandidateEmployeeId, Department, Position, HireDate, WorkflowTemplateId,
            WorkflowSteps, WorkflowStatus, WorkflowProgress, CurrentStepIndex,
            CreatedBy, CreatedAt, UpdatedAt
          )
          OUTPUT INSERTED.WorkflowEmployeeId
          VALUES (
            @companyId,
            @client,
            @clientName,
            @clientEmail,
            @candidateName,
            @candidateEmail,
            @candidateEmployeeId,
            @department,
            @position,
            @hireDate,
            @templateId,
            @workflowSteps,
            'Not Started',
            0,
            0,
            @createdBy,
            GETDATE(),
            GETDATE()
          )
        `);
      
      const newId = insertResult.recordset[0].WorkflowEmployeeId;

      res.status(201).json({
        success: true,
        message: 'Workflow employee created successfully',
        data: {
          id: newId,
          employeeId: candidateEmployeeId,
          name: candidateName,
          email: normalizedEmail,
          department,
          position
        }
      });

    } catch (error) {
      console.error('Error creating workflow employee:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating workflow employee: ' + error.message 
      });
    }
  },

  // Send login credentials to candidate
  sendLoginCredentials: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;

      console.log('Sending login credentials for employee:', employeeId);

      // Get employee details
      const getResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          SELECT * FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Workflow employee not found'
        });
      }
      
      const employee = getResult.recordset[0];

      // Check if user account already exists
      if (employee.UserId) {
        return res.status(400).json({
          success: false,
          message: 'Login credentials already sent to this candidate'
        });
      }

      // Generate username and password
      const usernameBase = employee.CandidateEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '_cand';
      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check if username exists
      const usernameCheck = await pool.request()
        .input('username', sql.NVarChar, usernameBase)
        .query(`SELECT id FROM userinfo WHERE username = @username`);

      let finalUsername = usernameBase;
      if (usernameCheck.recordset.length > 0) {
        finalUsername = usernameBase + Math.floor(Math.random() * 1000);
      }

      // Start transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Create user account
        const userResult = await transaction.request()
          .input('username', sql.NVarChar, finalUsername)
          .input('password', sql.NVarChar, hashedPassword)
          .input('role', sql.NVarChar, 'candidate')
          .input('employeeId', sql.NVarChar, employee.CandidateEmployeeId || '')
          .query(`
            INSERT INTO userinfo (username, password, role, EmployeeId)
            OUTPUT INSERTED.id
            VALUES (@username, @password, @role, @employeeId)
          `);
        
        const userId = userResult.recordset[0].id;

        // Split name for userdetails
        const nameParts = employee.CandidateName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Insert into userdetails
        await transaction.request()
          .input('id', sql.Int, userId)
          .input('firstName', sql.NVarChar, firstName)
          .input('lastName', sql.NVarChar, lastName)
          .input('email', sql.NVarChar, employee.CandidateEmail)
          .query(`
            INSERT INTO userdetails (id, firstName, lastName, email)
            VALUES (@id, @firstName, @lastName, @email)
          `);

        // IMPORTANT: Only update UserId, DO NOT modify workflow steps
        await transaction.request()
          .input('companyId', sql.Int, companyId)
          .input('employeeId', sql.Int, employeeId)
          .input('userId', sql.Int, userId)
          .query(`
            UPDATE OnboardingWorkflowEmployees 
            SET UserId = @userId,
                UpdatedAt = GETDATE()
            WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
          `);

        await transaction.commit();

        // Send welcome email
        const candidateData = {
          candidateName: employee.CandidateName,
          candidateEmail: employee.CandidateEmail,
          client: employee.Client,
          clientName: employee.ClientName
        };

        const credentials = {
          username: finalUsername,
          password: password
        };

        console.log('📧 Sending welcome email to candidate:', employee.CandidateEmail);
        
        const emailResult = await sendCandidateWelcomeEmail(candidateData, credentials);

        res.json({
          success: true,
          message: 'Login credentials sent successfully',
          data: {
            username: finalUsername,
            password: password,
            emailSent: emailResult.success
          }
        });

      } catch (transactionError) {
        await transaction.rollback();
        throw transactionError;
      }

    } catch (error) {
      console.error('Error sending login credentials:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending login credentials: ' + error.message
      });
    }
  },

  // Upload document - stores file as base64 directly in DB
  uploadDocument: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      const { documentType } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Get current document paths
      const getResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          SELECT DocumentPaths FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);

      if (getResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Workflow employee not found'
        });
      }

      let documentPaths = {};
      if (getResult.recordset[0].DocumentPaths) {
        documentPaths = JSON.parse(getResult.recordset[0].DocumentPaths);
      }

      // Convert file buffer to base64 data URI - no disk storage needed
      const base64Data = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;

      // Store base64 directly in document paths
      documentPaths[documentType] = {
        url: dataUri,
        fileName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        fileSize: req.file.size,
        fileType: req.file.mimetype
      };

      const documentPathsJson = JSON.stringify(documentPaths);

      await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .input('documentPaths', sql.NVarChar, documentPathsJson)
        .query(`
          UPDATE OnboardingWorkflowEmployees 
          SET DocumentPaths = @documentPaths,
              UpdatedAt = GETDATE()
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          documentType,
          fileName: req.file.originalname
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

  // Delete document
  deleteDocument: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId, documentType } = req.params;

      // Get current document paths
      const getResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          SELECT DocumentPaths FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);

      if (getResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Workflow employee not found'
        });
      }

      let documentPaths = {};
      if (getResult.recordset[0].DocumentPaths) {
        documentPaths = JSON.parse(getResult.recordset[0].DocumentPaths);
      }

      // Remove from document paths (base64 stored in DB, no disk file to delete)
      if (documentPaths[documentType]) {
        delete documentPaths[documentType];
      }

      const documentPathsJson = JSON.stringify(documentPaths);

      await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .input('documentPaths', sql.NVarChar, documentPathsJson)
        .query(`
          UPDATE OnboardingWorkflowEmployees 
          SET DocumentPaths = @documentPaths,
              UpdatedAt = GETDATE()
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
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

  // Save onboarding form data submitted by candidate
// Save onboarding form data submitted by candidate
// Save onboarding form data submitted by candidate
saveOnboardingForm: async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { companyId, employeeId } = req.params;
    
    const formData = req.body;

    console.log('Saving onboarding form for employee:', employeeId);

    const getResult = await pool.request()
      .input('companyId', sql.Int, companyId)
      .input('employeeId', sql.Int, employeeId)
      .query(`
        SELECT WorkflowSteps, WorkflowProgress, CurrentStepIndex, DocumentPaths
        FROM OnboardingWorkflowEmployees 
        WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
      `);
    
    if (getResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow employee not found'
      });
    }
    
    const record = getResult.recordset[0];
    
    // Parse steps
    let steps = [];
    if (record.WorkflowSteps) {
      try {
        if (typeof record.WorkflowSteps === 'object') {
          steps = record.WorkflowSteps;
        } else if (typeof record.WorkflowSteps === 'string') {
          steps = JSON.parse(record.WorkflowSteps);
        }
      } catch (parseError) {
        console.error('Error parsing steps:', parseError);
        steps = [];
      }
    }
    
    const documentPaths = record.DocumentPaths ? JSON.parse(record.DocumentPaths) : {};
    
    // Check required documents
    const requiredDocuments = ['driversLicense', 'resume'];
    const missingDocuments = [];
    
    requiredDocuments.forEach(docType => {
      if (!documentPaths[docType]) {
        missingDocuments.push(docType === 'driversLicense' ? "Driver's License" : "Resume");
      }
    });
    
    if (missingDocuments.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please upload: ${missingDocuments.join(', ')}`,
        missingDocuments
      });
    }
    
    // ✅ FIXED: Store form data but DON'T auto-complete the step
    // Find the candidate form step (usually step 0)
    if (steps.length > 0) {
      // Store form data in the step
      steps[0].formData = formData;
      steps[0].formSubmittedAt = new Date().toISOString();
      // ❌ REMOVED: steps[0].completed = true;
      // ❌ REMOVED: steps[0].completedAt = new Date().toISOString();
    }
    
    // Calculate progress based ONLY on completed steps
    const completedCount = steps.filter(s => s && s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);
    
    // Find next incomplete step - keep current index if we're on step 0
    // since it's not completed yet
    let newCurrentStepIndex = 0; // Stay on step 0 since it's not completed
    
    const status = completedCount === steps.length ? 'Completed' : 'In Progress';
    
    // Update database with direct query
    const stepsJson = JSON.stringify(steps);
    const formDataJson = JSON.stringify(formData);
    
    const escapedStepsJson = stepsJson.replace(/'/g, "''");
    const escapedFormDataJson = formDataJson.replace(/'/g, "''");
    
    const updateQuery = `
      UPDATE OnboardingWorkflowEmployees 
      SET 
        WorkflowSteps = '${escapedStepsJson}',
        OnboardingFormData = '${escapedFormDataJson}',
        WorkflowStatus = '${status}',
        WorkflowProgress = ${progress},
        CurrentStepIndex = ${newCurrentStepIndex},
        UpdatedAt = GETDATE()
      WHERE CompanyId = ${companyId} AND WorkflowEmployeeId = ${employeeId}
    `;
    
    await pool.request().query(updateQuery);
    
    res.json({
      success: true,
      message: 'Onboarding form saved successfully',
      data: {
        steps,
        status,
        progress,
        currentStepIndex: newCurrentStepIndex
      }
    });

  } catch (error) {
    console.error('Error saving form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
},

  // 🔥 UPDATED: Complete a step with completed by info
  completeWorkflowStep: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      const { stepIndex } = req.body;

      // Get admin info from the authenticated user
      const adminName = req.user?.name || req.user?.username || 'Admin';
      const adminId = req.user?.id || null;

      console.log('Completing step:', { 
        companyId, 
        employeeId, 
        stepIndex,
        completedBy: adminName,
        completedById: adminId
      });

      // Get current workflow data
      const getResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          SELECT WorkflowSteps, WorkflowProgress, CurrentStepIndex
          FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Workflow employee not found'
        });
      }
      
      const record = getResult.recordset[0];
      
      // Parse workflow steps
      let steps = [];
      if (record.WorkflowSteps) {
        try {
          if (typeof record.WorkflowSteps === 'object') {
            steps = record.WorkflowSteps;
          } else if (typeof record.WorkflowSteps === 'string') {
            steps = JSON.parse(record.WorkflowSteps);
          }
        } catch (parseError) {
          console.error('Error parsing workflow steps:', parseError);
          steps = [];
        }
      }
      
      console.log(`Steps found: ${steps.length}`);
      
      // Validate stepIndex
      if (stepIndex < 0 || stepIndex >= steps.length) {
        return res.status(400).json({
          success: false,
          message: `Invalid step index. Must be between 0 and ${steps.length - 1}`
        });
      }
      
      // Check if the step exists
      if (!steps[stepIndex]) {
        return res.status(400).json({
          success: false,
          message: `Step at index ${stepIndex} not found`
        });
      }
      
      // Check if step is already completed
      if (steps[stepIndex].completed) {
        return res.json({
          success: true,
          message: 'Step already completed',
          data: {
            steps,
            status: record.WorkflowStatus,
            progress: record.WorkflowProgress,
            currentStepIndex: record.CurrentStepIndex
          }
        });
      }
      
      // 🔥 UPDATED: Mark the specific step as completed WITH COMPLETED BY INFO
      steps[stepIndex].completed = true;
      steps[stepIndex].completedAt = new Date().toISOString();
      steps[stepIndex].completedBy = adminName;
      steps[stepIndex].completedById = adminId;
      
      // Calculate new progress
      const completedCount = steps.filter(s => s && s.completed).length;
      const progress = Math.round((completedCount / steps.length) * 100);
      
      // Find the next incomplete step
      let newCurrentStepIndex = stepIndex;
      for (let i = stepIndex + 1; i < steps.length; i++) {
        if (steps[i] && !steps[i].completed) {
          newCurrentStepIndex = i;
          break;
        }
      }
      
      // Determine status
      const status = completedCount === steps.length ? 'Completed' : 'In Progress';
      
      // Convert steps to JSON string and escape for SQL
      const stepsJson = JSON.stringify(steps);
      const escapedStepsJson = stepsJson.replace(/'/g, "''");
      
      const updateQuery = `
        UPDATE OnboardingWorkflowEmployees 
        SET 
          WorkflowSteps = '${escapedStepsJson}',
          WorkflowStatus = '${status}',
          WorkflowProgress = ${progress},
          CurrentStepIndex = ${newCurrentStepIndex},
          UpdatedAt = GETDATE()
        WHERE CompanyId = ${companyId} AND WorkflowEmployeeId = ${employeeId}
      `;
      
      console.log('Executing update query...');
      const updateResult = await pool.request().query(updateQuery);
      
      console.log('Update successful, rows affected:', updateResult.rowsAffected);

      res.json({
        success: true,
        message: 'Step completed successfully',
        data: {
          steps,
          status,
          progress,
          currentStepIndex: newCurrentStepIndex
        }
      });

    } catch (error) {
      console.error('Error completing step:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error completing step: ' + error.message 
      });
    }
  },

  // 🔥 UPDATED: Send compliance documents (Multiple files + DocuSign)
// In the sendComplianceDocuments function - update to NOT auto-complete

// Around line 540-560 in onboardingWorkflowEmployeeController.js
// Replace the sendComplianceDocuments function with this version:

// 🔥 UPDATED: Send compliance documents (Multiple files) - WITHOUT auto-complete
sendComplianceDocuments: async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { companyId, employeeId } = req.params;
    const { stepId } = req.body;
    const files = req.files; // Array of files from multer

    console.log('Sending compliance documents (Multiple):', { companyId, employeeId, stepId, fileCount: files?.length });

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No documents uploaded' });
    }

    // Get employee details
    const getResult = await pool.request()
      .input('companyId', sql.Int, companyId)
      .input('employeeId', sql.Int, employeeId)
      .query(`
        SELECT * FROM OnboardingWorkflowEmployees 
        WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
      `);
    
    if (getResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Workflow employee not found' });
    }
    
    const employee = getResult.recordset[0];
    let steps = [];
    
    if (employee.WorkflowSteps) {
      try {
        if (typeof employee.WorkflowSteps === 'object') {
          steps = employee.WorkflowSteps;
        } else if (typeof employee.WorkflowSteps === 'string') {
          steps = JSON.parse(employee.WorkflowSteps);
        }
      } catch (parseError) {
        console.error('Error parsing steps:', parseError);
        steps = [];
      }
    }
    
    // Find the step and update with uploaded files
    const stepIndex = steps.findIndex(s => s.id == stepId);
    if (stepIndex === -1) {
      return res.status(404).json({ success: false, message: 'Compliance step not found' });
    }

    // Process files - store as base64
    const uploadedDocs = files.map(file => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      uploadedAt: new Date().toISOString()
    }));

    // Generate a unique token for the signing session
    const signingToken = Math.random().toString(36).substr(2, 12).toUpperCase();
    
    // Update step data - BUT DO NOT MARK AS COMPLETED
    steps[stepIndex].complianceDocuments = uploadedDocs;
    steps[stepIndex].documentsSent = true;
    steps[stepIndex].sentAt = new Date().toISOString();
    steps[stepIndex].signingToken = signingToken;
    steps[stepIndex].docusignStatus = 'sent';
    
    // IMPORTANT: DO NOT set completed = true here
    // Keep completed as false (or preserve existing value)

    const stepsJson = JSON.stringify(steps);
    const escapedStepsJson = stepsJson.replace(/'/g, "''");
    
    await pool.request().query(`
      UPDATE OnboardingWorkflowEmployees 
      SET WorkflowSteps = '${escapedStepsJson}', UpdatedAt = GETDATE()
      WHERE CompanyId = ${companyId} AND WorkflowEmployeeId = ${employeeId}
    `);
    
    // Send email to candidate with the signing link
    const signingLink = `${getFrontendURL()}/onsite/sign/${signingToken}?cid=${companyId}&eid=${employeeId}&sid=${stepId}`;
    
    await sendEmailViaSendGrid({
      to: employee.CandidateEmail,
      subject: `Action Required: Please Sign Compliance Documents for ${employee.ClientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="background-color: #019d88; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Sign Compliance Documents</h1>
          </div>
          
          <div style="padding: 30px; color: #333; line-height: 1.6;">
            <p>Hello <strong>${employee.CandidateName}</strong>,</p>
            <p>Your onboarding progress for <strong>${employee.ClientName}</strong> requires your signature on the following documents:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #019d88;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #019d88;">Documents for your review:</p>
              <ul style="margin: 0; padding-left: 20px; color: #555;">
                ${uploadedDocs.map(doc => `<li>${doc.fileName}</li>`).join('')}
              </ul>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-weight: bold; color: #856404;">📝 Instructions:</p>
              <ol style="margin: 10px 0 0 20px; color: #856404; font-size: 14px;">
                <li>Click the "Sign Document Now" button below.</li>
                <li>Review each document carefully.</li>
                <li>Draw or type your signature and initials where requested.</li>
                <li>Click "Finish Signing" to securely submit the documents.</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${signingLink}" 
                 style="background-color: #019d88; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(1, 157, 136, 0.2);">
                Sign Documents Now
              </a>
            </div>
            
            <div style="padding: 15px; border-top: 1px solid #eee; margin-top: 30px;">
              <p style="font-size: 13px; color: #ef4444; font-weight: 600; margin: 0;">
                ⚠️ 30-Day Expiration Notice:
              </p>
              <p style="font-size: 13px; color: #666; margin: 5px 0 0 0;">
                This request will expire in 30 days. Please complete the signing process at your earliest convenience to avoid delays in your onboarding.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f8fafc; font-size: 12px; color: #94a3b8; border-radius: 0 0 8px 8px;">
            This is an automated request from Prophecy ERP Secure Signing Service.<br>
            © ${new Date().getFullYear()} Prophecy Consulting Inc. All rights reserved.
          </div>
        </div>
      `
    });
    
    res.json({
      success: true,
      message: 'Compliance documents sent successfully',
      data: {
        signingToken,
        documentCount: uploadedDocs.length,
        stepStatus: 'sent' // Still pending completion
      }
    });

  } catch (error) {
    console.error('Error sending compliance documents:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
},

  // Get signing session for candidate portal
  getSigningSession: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId, stepId } = req.params;
      const { token } = req.query;
      
      const getResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          SELECT WorkflowSteps, CandidateName FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      
      const record = getResult.recordset[0];
      const steps = typeof record.WorkflowSteps === 'string' ? JSON.parse(record.WorkflowSteps) : record.WorkflowSteps;
      const step = steps.find(s => s.id == stepId);
      
      if (!step || step.signingToken !== token) {
        return res.status(401).json({ success: false, message: 'Invalid or expired signing session' });
      }
      
      res.json({
        success: true,
        data: {
          candidateName: record.CandidateName,
          title: step.title,
          description: step.description,
          documents: step.complianceDocuments,
          status: step.docusignStatus
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // DocuSign Webhook / Callback - Embed signature into PDF using pdf-lib
docusignWebhook: async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const data = req.body.data || req.body;
    const { 
      companyId, employeeId, stepId, 
      signature, signaturePosition, signatureRotation, signaturePage,
      signedName
    } = data;

    console.log('Processing compliance signing webhook:', { companyId, employeeId, stepId, signaturePage });

    const getResult = await pool.request()
      .input('companyId', sql.Int, companyId)
      .input('employeeId', sql.Int, employeeId)
      .query(`
        SELECT WorkflowSteps, CandidateName, CandidateEmail, ClientEmail, ClientName FROM OnboardingWorkflowEmployees 
        WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
      `);
    
    if (getResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    const employee = getResult.recordset[0];
    let steps = typeof employee.WorkflowSteps === 'string' ? JSON.parse(employee.WorkflowSteps) : employee.WorkflowSteps;
    const stepIndex = steps.findIndex(s => s.id == stepId);
    
    if (stepIndex === -1) {
      return res.status(404).json({ success: false, message: 'Step not found' });
    }

    steps[stepIndex].docusignStatus = 'signed';
    steps[stepIndex].signedAt = new Date().toISOString();
    steps[stepIndex].signedName = signedName || employee.CandidateName;
    
    // ========== EMBED SIGNATURE INTO PDFs USING pdf-lib ==========
    const complianceDocs = steps[stepIndex].complianceDocuments || [];
    const embeddedDocs = [];

    console.log(`[Webhook] Starting embedding for ${complianceDocs.length} documents. Signature present: ${!!signature}, Page: ${signaturePage}`);

    for (let i = 0; i < complianceDocs.length; i++) {
      const doc = complianceDocs[i];
      try {
        if (doc.fileType && doc.fileType.includes('pdf') && doc.data && signature) {
          console.log(`[Webhook] Embedding into PDF: ${doc.fileName}`);
          
          // Clean base64 string and convert to Uint8Array (recommended for pdf-lib)
          const base64Data = doc.data.includes(',') ? doc.data.split(',')[1] : doc.data;
          const cleanedBase64 = base64Data.replace(/\s/g, '');
          const pdfBytes = new Uint8Array(Buffer.from(cleanedBase64, 'base64'));
          
          let pdfDoc;
          try {
            // Strip trash after %%EOF
            const eofMarker = Buffer.from('%%EOF');
            const lastEofIndex = Buffer.from(pdfBytes).lastIndexOf(eofMarker);
            let bytesToLoad = pdfBytes;
            if (lastEofIndex !== -1) {
              bytesToLoad = pdfBytes.slice(0, lastEofIndex + 5);
            }
            
            // Load and immediately copy to a NEW document (this often fixes broken structure)
            const sourceDoc = await PDFDocument.load(bytesToLoad, { ignoreEncryption: true });
            pdfDoc = await PDFDocument.create();
            const copiedPages = await pdfDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
            
            console.log(`[Webhook] PDF Re-created/Repaired successfully for embedding.`);
          } catch (loadErr) {
            console.error(`[Webhook] Repair failed, trying raw load:`, loadErr.message);
            try {
               pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            } catch (rawErr) {
               console.error(`[Webhook] All load methods failed. Document is likely incompatible with embedding.`);
               throw loadErr;
            }
          }
          
          const pages = pdfDoc.getPages();
          console.log(`[Webhook] PDF Loaded. Pages: ${pages.length}`);
          
          const pageNum = parseInt(signaturePage) || pages.length;
          const pageIdx = Math.min(Math.max(pageNum - 1, 0), pages.length - 1);
          const page = pages[pageIdx];
          const pageRotation = page.getRotation().angle;
          const { width, height } = page.getSize();
          
          // Determine visual width/height considering rotation
          const isRotated = pageRotation === 90 || pageRotation === 270;
          const visualWidth = isRotated ? height : width;
          const visualHeight = isRotated ? width : height;

          console.log(`[Webhook] Page size: ${width}x${height}, Rotation: ${pageRotation}, Visual size: ${visualWidth}x${visualHeight}`);
          
          let pos = { x: 50, y: 70 };
          try { 
            pos = typeof signaturePosition === 'string' ? JSON.parse(signaturePosition) : (signaturePosition || pos);
            console.log(`[Webhook] Position used:`, pos);
          } catch(e) {
            console.log(`[Webhook] Position parse error, using default.`);
          }
          
          const sigBase64 = signature.includes(',') ? signature.split(',')[1] : signature;
          const sigBytes = Buffer.from(sigBase64, 'base64');
          const sigImage = await pdfDoc.embedPng(sigBytes);
          
          const sigWidth = 200;
          const sigHeight = (sigImage.height / sigImage.width) * sigWidth;
          const signatureRotationValue = parseInt(signatureRotation) || 0;
          
          // Calculate coordinates relative to visual dimensions
          // Note: pdf-lib (0,0) is bottom-left of the original unrotated media box.
          const vx = (pos.x / 100) * visualWidth;
          const vy = (pos.y / 100) * visualHeight; // Y from top
          
          let drawX, drawY;
          let drawRotation = degrees(-signatureRotationValue);

          // Map visual (x, y from top) to PDF-lib internal (x, y from bottom)
          // considering page rotation
          if (pageRotation === 0) {
            drawX = vx - (sigWidth / 2);
            drawY = visualHeight - vy;
          } else if (pageRotation === 90) {
            drawX = (visualHeight - vy) - (sigWidth / 2);
            drawY = visualWidth - vx;
            drawRotation = degrees(-signatureRotationValue - 90);
          } else if (pageRotation === 180) {
            drawX = visualWidth - vx - (sigWidth / 2);
            drawY = vy;
            drawRotation = degrees(-signatureRotationValue - 180);
          } else if (pageRotation === 270) {
            drawX = vy - (sigWidth / 2);
            drawY = vx;
            drawRotation = degrees(-signatureRotationValue - 270);
          } else {
            drawX = vx - (sigWidth / 2);
            drawY = visualHeight - vy;
          }

          console.log(`[Webhook] Drawing at PDF internal coords: x=${drawX.toFixed(2)}, y=${drawY.toFixed(2)}, PageRotation=${pageRotation}`);

          page.drawImage(sigImage, {
            x: drawX,
            y: drawY,
            width: sigWidth,
            height: sigHeight,
            rotate: drawRotation,
          });
          
          const modifiedPdfBytes = await pdfDoc.save();
          const modifiedBase64 = Buffer.from(modifiedPdfBytes).toString('base64');
          const prefix = doc.data.includes(',') ? doc.data.split(',')[0] + ',' : 'data:application/pdf;base64,';
          
          embeddedDocs.push({
            fileName: doc.fileName, 
            fileType: doc.fileType,
            data: prefix + modifiedBase64,
            signed: true, 
            signedAt: new Date().toISOString(),
            signedName: signedName || employee.CandidateName,
            uploadedAt: doc.uploadedAt,
            isEmbedded: true // Track success
          });
          console.log(`✅ [Webhook] SUCCESS embedding into ${doc.fileName}`);
        } else {
          console.log(`[Webhook] Skipping embedding for ${doc.fileName}`);
          embeddedDocs.push({ 
            ...doc, 
            signed: true, 
            signedAt: new Date().toISOString(), 
            signedName: signedName || employee.CandidateName,
            signature: signature,
            signaturePosition: signaturePosition,
            signatureRotation: signatureRotation,
            signaturePage: signaturePage,
            isEmbedded: false 
          });
        }
      } catch (pdfErr) {
        console.error(`❌ [Webhook] Error embedding in ${doc.fileName}:`, pdfErr.message);
        embeddedDocs.push({ 
          ...doc, 
          signed: true, 
          signedAt: new Date().toISOString(), 
          signedName: signedName || employee.CandidateName,
          signature: signature,
          signaturePosition: signaturePosition,
          signatureRotation: signatureRotation,
          signaturePage: signaturePage,
          isEmbedded: false
        });
      }
    }
    
    steps[stepIndex].signedDocuments = embeddedDocs;
    steps[stepIndex].completed = false; // Admin must still mark as complete

    // Update the record with parameters to handle large JSON strings safely
    await pool.request()
      .input('stepsJson', sql.NVarChar(sql.MAX), JSON.stringify(steps))
      .input('companyId', sql.Int, companyId)
      .input('employeeId', sql.Int, employeeId)
      .query(`
        UPDATE OnboardingWorkflowEmployees 
        SET WorkflowSteps = @stepsJson, UpdatedAt = GETDATE()
        WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
      `);

    console.log(`Successfully updated workflow steps for employee ${employeeId} with signed documents.`);

    await sendEmailViaSendGrid({
      to: employee.ClientEmail,
      subject: `✅ Documents Signed by ${employee.CandidateName} - Ready for Review`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3 style="color: #019d88;">Documents Signed - Awaiting Completion</h3>
          <p><strong>${employee.CandidateName}</strong> has successfully signed the compliance documents.</p>
          <p>The signature has been permanently embedded into the PDF documents.</p>
          <p><strong>Action Required:</strong> Please review the signed documents and click "Mark as Complete" when ready.</p>
          <p><a href="${getFrontendURL()}/employee-directory" style="color: #019d88;">Go to Employee Directory</a></p>
        </div>
      `
    });
    
    res.json({ success: true, message: 'Signing completed, awaiting admin completion' });
  } catch (error) {
    console.error('Error in signing webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
},
  // Update employer submission status
 // Update employer submission status (FIXED VERSION)
// Update employer submission status (FIXED VERSION)
updateEmployerSubmissionStatus: async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { companyId, employeeId } = req.params;
    const { employerSubmitted } = req.body;

    // Get admin info from the authenticated user
    const adminName = req.user?.name || req.user?.username || 'Admin';
    const adminId = req.user?.id || null;

    console.log('Updating employer submission status:', { companyId, employeeId, employerSubmitted, completedBy: adminName });

    // Get current workflow data
    const getResult = await pool.request()
      .input('companyId', sql.Int, companyId)
      .input('employeeId', sql.Int, employeeId)
      .query(`
        SELECT WorkflowSteps, WorkflowProgress, WorkflowStatus, CurrentStepIndex FROM OnboardingWorkflowEmployees 
        WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
      `);
    
    if (getResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow employee not found'
      });
    }
    
    const record = getResult.recordset[0];
    let steps = [];
    
    if (record.WorkflowSteps) {
      try {
        if (typeof record.WorkflowSteps === 'object') {
          steps = record.WorkflowSteps;
        } else if (typeof record.WorkflowSteps === 'string') {
          steps = JSON.parse(record.WorkflowSteps);
        }
      } catch (parseError) {
        console.error('Error parsing steps:', parseError);
        steps = [];
      }
    }
    
    console.log('Current steps before update:', JSON.stringify(steps, null, 2));
    
    // Find the employer step
    let employerStepIndex = -1;
    
    // Method 1: Look for step with title containing "Employer" or type "employer"
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.title?.toLowerCase().includes('employer') || 
          step.type?.toLowerCase() === 'employer' ||
          step.description?.toLowerCase().includes('employer')) {
        employerStepIndex = i;
        console.log(`Found employer step at index ${i} by title/type:`, step.title);
        break;
      }
    }
    
    // Method 2: If not found, assume it's the third step (index 2)
    if (employerStepIndex === -1 && steps.length > 2) {
      employerStepIndex = 2;
      console.log('Using default employer step index 2');
    }
    
    // Update the employer step
    if (employerStepIndex !== -1 && steps[employerStepIndex]) {
      steps[employerStepIndex].employerSubmitted = employerSubmitted;
      if (employerSubmitted) {
        const submittedAt = new Date().toISOString();
        steps[employerStepIndex].employerSubmittedAt = submittedAt;
        steps[employerStepIndex].employerData = {
          submittedAt: submittedAt,
        };
        // 🔥 FIXED: REMOVED auto-complete
        // REMOVED: steps[employerStepIndex].completed = true;
        // REMOVED: steps[employerStepIndex].completedAt = submittedAt;
        // REMOVED: steps[employerStepIndex].completedBy = adminName;
        // REMOVED: steps[employerStepIndex].completedById = adminId;
      }
      console.log(`Updated employer step at index ${employerStepIndex}:`, steps[employerStepIndex]);
    } else {
      console.log('Could not find employer step in workflow');
      steps.forEach((step, idx) => {
        console.log(`Step ${idx}:`, { title: step.title, type: step.type });
      });
    }

    // Recalculate progress and status (based on completed steps only)
    const completedCount = steps.filter(s => s && s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    // Find next incomplete step
    let newCurrentStepIndex = employerStepIndex !== -1 ? employerStepIndex : 0;
    for (let i = newCurrentStepIndex + 1; i < steps.length; i++) {
      if (steps[i] && !steps[i].completed) {
        newCurrentStepIndex = i;
        break;
      }
    }

    const status = completedCount === steps.length ? 'Completed' : 'In Progress';
    
    const stepsJson = JSON.stringify(steps);
    const escapedStepsJson = stepsJson.replace(/'/g, "''");
    
    const updateQuery = `
      UPDATE OnboardingWorkflowEmployees 
      SET WorkflowSteps = '${escapedStepsJson}',
          WorkflowStatus = '${status}',
          WorkflowProgress = ${progress},
          CurrentStepIndex = ${newCurrentStepIndex},
          UpdatedAt = GETDATE()
      WHERE CompanyId = ${companyId} AND WorkflowEmployeeId = ${employeeId}
    `;
    
    await pool.request().query(updateQuery);
    
    console.log('✅ Employer submission status updated successfully');
    
    res.json({
      success: true,
      message: 'Employer submission status updated',
      data: {
        employerStepIndex,
        updated: true,
        steps,
        status,
        progress,
        currentStepIndex: newCurrentStepIndex
      }
    });

  } catch (error) {
    console.error('Error updating employer submission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
},
  // Update workflow steps (for editing steps)
  updateWorkflowSteps: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      const { workflowSteps } = req.body;

      console.log('Updating workflow steps for employee:', employeeId);

      // Get current workflow data
      const getResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          SELECT WorkflowStatus, WorkflowProgress, CurrentStepIndex
          FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Workflow employee not found'
        });
      }
      
      const record = getResult.recordset[0];
      
      // Calculate progress based on updated steps
      const completedCount = workflowSteps.filter(s => s && s.completed).length;
      const progress = Math.round((completedCount / workflowSteps.length) * 100);
      
      // Find current step index
      let currentStepIndex = 0;
      for (let i = 0; i < workflowSteps.length; i++) {
        if (!workflowSteps[i].completed) {
          currentStepIndex = i;
          break;
        }
      }
      
      const status = completedCount === workflowSteps.length ? 'Completed' : 'In Progress';
      
      const stepsJson = JSON.stringify(workflowSteps);
      const escapedStepsJson = stepsJson.replace(/'/g, "''");
      
      const updateQuery = `
        UPDATE OnboardingWorkflowEmployees 
        SET 
          WorkflowSteps = '${escapedStepsJson}',
          WorkflowStatus = '${status}',
          WorkflowProgress = ${progress},
          CurrentStepIndex = ${currentStepIndex},
          UpdatedAt = GETDATE()
        WHERE CompanyId = ${companyId} AND WorkflowEmployeeId = ${employeeId}
      `;
      
      await pool.request().query(updateQuery);
      
      res.json({
        success: true,
        message: 'Workflow steps updated successfully',
        data: {
          workflowSteps,
          status,
          progress,
          currentStepIndex
        }
      });

    } catch (error) {
      console.error('Error updating workflow steps:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error: ' + error.message 
      });
    }
  },

  // Delete workflow employee
  deleteWorkflowEmployee: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      
      await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          DELETE FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);

      res.json({
        success: true,
        message: 'Workflow employee deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting workflow employee:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting workflow employee: ' + error.message 
      });
    }
  },

  // Admin-only: update candidate form data without touching steps/progress
  adminUpdateOnboardingForm: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      const formData = req.body;

      console.log('Admin updating onboarding form for employee:', employeeId);

      // Check employee exists
      const checkResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          SELECT WorkflowEmployeeId FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Workflow employee not found'
        });
      }

      const formDataJson = JSON.stringify(formData);
      const escapedFormDataJson = formDataJson.replace(/'/g, "''");

      // ONLY update OnboardingFormData - nothing else changes
      await pool.request().query(`
        UPDATE OnboardingWorkflowEmployees 
        SET OnboardingFormData = '${escapedFormDataJson}',
            UpdatedAt = GETDATE()
        WHERE CompanyId = ${companyId} AND WorkflowEmployeeId = ${employeeId}
      `);

      res.json({
        success: true,
        message: 'Candidate form data updated successfully'
      });

    } catch (error) {
      console.error('Error in admin update onboarding form:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating form data: ' + error.message
      });
    }
  },

  // ✅ HELPER: Normalize document data to ensure all required properties exist
  normalizeDocumentData: (documentData) => {
    if (!documentData || typeof documentData !== 'object') {
      console.error('⚠️ Invalid documentData provided:', documentData);
      return null;
    }

    const normalized = {
      // Essential properties for preview
      fileName: documentData.fileName || documentData.originalName || documentData.name || 'Document',
      fileType: documentData.fileType || documentData.mimetype || 'application/pdf',
      url: documentData.url || documentData.path || documentData.documentPath || '',
      path: documentData.path || documentData.documentPath || documentData.url || '',
      
      // Optional properties
      data: documentData.data || null,
      size: documentData.size || 0,
      
      // Preserve any additional properties
      ...documentData
    };

    // Validate critical properties
    if (!normalized.fileName || normalized.fileName.trim() === '') {
      console.warn('⚠️ Warning: Document fileName is empty or invalid');
      normalized.fileName = 'Document';
    }

    if (!normalized.url || normalized.url.trim() === '') {
      console.warn('⚠️ Warning: Document URL/path is empty');
    }

    return normalized;
  },

  // Sync document from employer to workflow employee
  syncDocumentToWorkflow: async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      const { documentType, documentData } = req.body;

      console.log('📥 Syncing document to workflow:', { companyId, employeeId, documentType });
      console.log('📊 Received documentData:', documentData);

      // Get current workflow employee data
      const getResult = await pool.request()
        .input('companyId', sql.Int, companyId)
        .input('employeeId', sql.Int, employeeId)
        .query(`
          SELECT DocumentPaths, WorkflowSteps 
          FROM OnboardingWorkflowEmployees 
          WHERE CompanyId = @companyId AND WorkflowEmployeeId = @employeeId
        `);
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Workflow employee not found' });
      }
      
      const record = getResult.recordset[0];
      let documentPaths = {};
      
      if (record.DocumentPaths) {
        try {
          documentPaths = typeof record.DocumentPaths === 'string' 
            ? JSON.parse(record.DocumentPaths) 
            : record.DocumentPaths;
        } catch(e) {
          documentPaths = {};
        }
      }
      
      // Update document paths with the new document
      documentPaths[documentType] = documentData;
      
      // Parse workflow steps
      let workflowSteps = [];
      if (record.WorkflowSteps) {
        try {
          workflowSteps = typeof record.WorkflowSteps === 'string' 
            ? JSON.parse(record.WorkflowSteps) 
            : record.WorkflowSteps;
        } catch(e) {
          workflowSteps = [];
        }
      }
      
      // 🔥 IMPROVED: Find the "Upload Company Documents" step specifically
      // Look for step that has "company" AND "upload" keywords, and NOT "compliance" or "send"
      const companyDocStepIndex = workflowSteps.findIndex(step => {
        const title = step.title?.toLowerCase() || '';
        const description = step.description?.toLowerCase() || '';
        const type = step.type?.toLowerCase() || '';
        
        // Must have "company" AND "upload" keywords together
        const hasCompany = title.includes('company') || description.includes('company');
        const hasUpload = title.includes('upload') || description.includes('upload');
        
        // Must NOT have these keywords (to avoid compliance step)
        const hasCompliance = title.includes('compliance') || description.includes('compliance') || type === 'compliance';
        const hasSend = title.includes('send') || description.includes('send');
        
        // Also check for exact match with "Upload Company Documents" title
        const isExactMatch = title.includes('upload company') || title.includes('company documents');
        
        return (isExactMatch || (hasCompany && hasUpload)) && !hasCompliance && !hasSend;
      });
      
      console.log('Company doc step index:', companyDocStepIndex);
      
      if (companyDocStepIndex !== -1 && workflowSteps[companyDocStepIndex]) {
        console.log('Found step:', workflowSteps[companyDocStepIndex].title);
        
        // Initialize uploadedDocuments if it doesn't exist
        if (!workflowSteps[companyDocStepIndex].uploadedDocuments) {
          workflowSteps[companyDocStepIndex].uploadedDocuments = {};
        }
        
        // ✅ NORMALIZE DOCUMENT DATA TO ENSURE ALL PROPERTIES EXIST
        const normalizedDoc = onboardingWorkflowEmployeeController.normalizeDocumentData(documentData);
        
        if (!normalizedDoc) {
          return res.status(400).json({
            success: false,
            message: 'Invalid document data structure'
          });
        }

        // ✅ VALIDATE URL IS PRESENT (CRITICAL FOR PREVIEW)
        if (!normalizedDoc.url || normalizedDoc.url.trim() === '') {
          console.error('❌ Critical error: Document URL is missing');
          console.error('   Received documentData:', documentData);
          return res.status(400).json({
            success: false,
            message: 'Document URL/path is required. Upload endpoint must return url or path property.',
            received: normalizedDoc
          });
        }
        
        // Document labels for display
        const docLabels = {
          i9: 'I-9 Form',
          w4: 'W-4 Form',
          w9: 'W-9 Form',
          coi: 'Certificate of Insurance',
          businessLicense: 'Business License'
        };
        
        // ✅ ADD THE DOCUMENT WITH COMPLETE, NORMALIZED DATA
        workflowSteps[companyDocStepIndex].uploadedDocuments[documentType] = {
          ...normalizedDoc,
          label: docLabels[documentType] || documentType.replace(/_/g, ' ').trim() || 'Document',
          uploadedAt: normalizedDoc.uploadedAt || new Date().toISOString(),
          uploadedBy: normalizedDoc.uploadedBy || 'employer'
        };
        
        workflowSteps[companyDocStepIndex].documentsUploaded = true;
        workflowSteps[companyDocStepIndex].documentsUploadedAt = new Date().toISOString();
        
        // ✅ LOG COMPLETE DOCUMENT STRUCTURE FOR DEBUGGING
        console.log(`✅ Document ${documentType} added to "Upload Company Documents" step`);
        console.log('📄 Complete document object:', {
          documentType,
          ...workflowSteps[companyDocStepIndex].uploadedDocuments[documentType]
        });
        console.log('📋 Uploaded documents now:', Object.keys(workflowSteps[companyDocStepIndex].uploadedDocuments));
      } else {
        console.warn('⚠️ Could not find "Upload Company Documents" step');
        console.log('Available steps:');
        workflowSteps.forEach((step, idx) => {
          console.log(`  Step ${idx}: "${step.title}" - Type: ${step.type}`);
        });
        
        // If not found, try to create the step or return error
        return res.status(404).json({ 
          success: false, 
          message: 'Could not find "Upload Company Documents" step in workflow',
          steps: workflowSteps.map(s => ({ title: s.title, type: s.type }))
        });
      }
      
      // Update the database
      const documentPathsJson = JSON.stringify(documentPaths);
      const workflowStepsJson = JSON.stringify(workflowSteps);
      
      const updateQuery = `
        UPDATE OnboardingWorkflowEmployees 
        SET DocumentPaths = '${documentPathsJson.replace(/'/g, "''")}',
            WorkflowSteps = '${workflowStepsJson.replace(/'/g, "''")}',
            UpdatedAt = GETDATE()
        WHERE CompanyId = ${companyId} AND WorkflowEmployeeId = ${employeeId}
      `;
      
      await pool.request().query(updateQuery);
      
      res.json({
        success: true,
        message: 'Document synced to workflow successfully',
        data: {
          documentType,
          stepIndex: companyDocStepIndex,
          stepTitle: workflowSteps[companyDocStepIndex]?.title,
          hasUploadedDocuments: workflowSteps[companyDocStepIndex]?.uploadedDocuments
        }
      });
      
    } catch (error) {
      console.error('❌ Error syncing document:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
 
};

module.exports = onboardingWorkflowEmployeeController;