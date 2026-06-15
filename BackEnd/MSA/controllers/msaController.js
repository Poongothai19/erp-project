// BackEnd/MSA/controllers/msaController.js
// COMPLETE UPDATED VERSION - ALL 25 FUNCTIONS WITH FIXES APPLIED
// ✅ Fixed uploadDocument function (ID issue)
// ✅ Fixed getUploadedDocumentPreview function (CORS + public access)
// ✅ Part 1: Client dropdown now fetches real clients from OnboardingWorkflowEmployees
// ✅ Part 2: Signed MSA automatically links to Employee Directory and marks step complete

const sql = require('mssql');
const { dbConfig } = require('../../config/db');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

let pool = null;

// ============================================
// DATABASE POOL
// ============================================
const getPool = async () => {
  try {
    if (!pool) {
      pool = new sql.ConnectionPool(dbConfig);
      pool.on('error', err => {
        console.error('❌ Database pool error:', err);
        pool = null;
      });
      await pool.connect();
      console.log('✅ Database connection pool created');
    }
    return pool;
  } catch (error) {
    console.error('❌ Failed to create database pool:', error);
    throw error;
  }
};

// ============================================
// SENDGRID EMAIL HELPER
// ============================================
const sendEmailViaSendGrid = async (emailData) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not set in environment variables');
      return { success: false, error: 'SendGrid API key not configured' };
    }

    console.log('📧 Preparing to send email via SendGrid to:', emailData.to);
    console.log('Subject:', emailData.subject);

    const payload = {
      personalizations: [
        {
          to: [{ email: emailData.to }],
          subject: emailData.subject
        }
      ],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@prophecytechs.com',
        name: process.env.SENDGRID_FROM_NAME || 'Prophecy MSA System'
      },
      content: [
        {
          type: 'text/html',
          value: emailData.html
        }
      ]
    };

    const payloadString = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadString)
        }
      };

      console.log('📡 Sending request to SendGrid API...');

      const req = https.request(options, (res) => {
        let data = '';
        
        console.log('SendGrid Response Status:', res.statusCode);
        console.log('SendGrid Response Headers:', res.headers);

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Email sent successfully via SendGrid');
            resolve({ success: true });
          } else {
            console.error('❌ SendGrid error:', res.statusCode);
            console.error('SendGrid response:', data);
            resolve({ 
              success: false, 
              error: `SendGrid returned ${res.statusCode}: ${data}` 
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ SendGrid request error:', error.message);
        reject(error);
      });

      req.write(payloadString);
      req.end();
    });
  } catch (error) {
    console.error('❌ Error in sendEmailViaSendGrid:', error.message);
    return { success: false, error: error.message };
  }
};

// ============================================
// HELPER: GENERATE TOKEN
// ============================================
function generateToken(documentId) {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(`${documentId}-${Date.now()}-${Math.random()}`)
    .digest('hex');
}

// ============================================
// SHARED MOCK DATA (Only for Suppliers, Clients now come from Onboarding)
// ============================================
const sharedMockSuppliers = {
  '101': { id: '101', companyName: 'SupplyCo Inc', email: 'orders@supplyco.com', address: '321 Supply St', city: 'Dallas', state: 'TX', zipCode: '75201', phone: '214-555-9876', taxId: '45-6789012', contactPerson: 'Alice Brown' },
  '102': { id: '102', companyName: 'Vendor Solutions', email: 'sales@vendorsolutions.com', address: '654 Vendor Way', city: 'Seattle', state: 'WA', zipCode: '98101', phone: '206-555-5432', taxId: '21-0987654', contactPerson: 'Bob Miller' },
  '103': { id: '103', companyName: 'Parts Distributors', email: 'info@partsdist.com', address: '987 Parts Rd', city: 'Boston', state: 'MA', zipCode: '02110', phone: '617-555-8765', taxId: '54-3210987', contactPerson: 'Charlie Taylor' },
  '104': { id: '104', companyName: 'Global Supply Chain', email: 'contact@globalsupply.com', address: '741 Logistics Ln', city: 'Atlanta', state: 'GA', zipCode: '30301', phone: '404-555-3333', taxId: '87-6543210', contactPerson: 'David Anderson' },
  '105': { id: '105', companyName: 'Premier Vendors', email: 'sales@premiervendors.com', address: '852 Premier Pkwy', city: 'Denver', state: 'CO', zipCode: '80201', phone: '303-555-4444', taxId: '10-2938475', contactPerson: 'Eva Thomas' }
};

// ============================================
// MAIN CONTROLLER - ALL 25 FUNCTIONS
// ============================================

const msaController = {
  
  // 1️⃣ GET ALL TEMPLATES
  getAllTemplates: async (req, res) => {
    let connection;
    try {
      console.log('=== GET ALL MSA TEMPLATES ===');
      const { mode, serviceType, limit = 50, offset = 0 } = req.query;

      connection = await getPool();
      const request = connection.request();

      let query = `
        SELECT 
          Id,
          TemplateName,
          Mode,
          ServiceType,
          Version,
          Description,
          [Content],
          IsActive,
          CreatedAt,
          UpdatedAt,
          CreatedBy
        FROM MSATemplates
        WHERE IsActive = 1
      `;

      if (mode && mode !== 'all') {
        query += ` AND Mode = @mode`;
        request.input('mode', sql.NVarChar, mode);
      }

      if (serviceType && serviceType !== 'all') {
        query += ` AND ServiceType = @serviceType`;
        request.input('serviceType', sql.NVarChar, serviceType);
      }

      query += ` ORDER BY CreatedAt DESC OFFSET ${parseInt(offset)} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;

      const result = await request.query(query);

      console.log(`✅ Found ${result.recordset.length} templates`);

      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length,
        filters: { mode, serviceType }
      });
    } catch (error) {
      console.error('❌ Get templates error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving templates',
        error: error.message
      });
    }
  },

  // 2️⃣ GET ALL PARTIES - ✅ FIXED: Now fetches real clients from Onboarding
  getAllParties: async (req, res) => {
    let connection;
    try {
      const { mode } = req.query;

      console.log(`📋 Getting all ${mode}s`);

      if (!mode || !['CLIENT', 'SUPPLIER'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Mode must be CLIENT or SUPPLIER'
        });
      }

      // If Suppliers, still use mock data
      if (mode === 'SUPPLIER') {
        const parties = Object.values(sharedMockSuppliers);
        return res.json({
          success: true,
          data: parties,
          count: parties.length,
          mode
        });
      }

      // ✅ FETCH REAL CLIENTS FROM ONBOARDING MODULE
      console.log('🔍 Fetching real clients from Onboarding records...');
      connection = await getPool();
      const request = connection.request();
      
      // Select distinct clients who have submitted their information
      const result = await request.query(`
        SELECT DISTINCT 
          Client as companyName,
          ClientEmail as email,
          'Onboarding' as source,
          MIN(WorkflowEmployeeId) as id
        FROM OnboardingWorkflowEmployees
        WHERE Client IS NOT NULL AND Client != ''
        GROUP BY Client, ClientEmail
      `);

      const parties = result.recordset.map(item => ({
        id: item.id.toString(),
        companyName: item.companyName,
        email: item.email || '',
        address: 'Refer to Onboarding Record',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        taxId: '',
        contactPerson: item.companyName
      }));

      console.log(`✅ Found ${parties.length} real clients from Onboarding`);

      res.json({
        success: true,
        data: parties,
        count: parties.length,
        mode
      });
    } catch (error) {
      console.error('❌ Get all parties error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving parties: ' + error.message,
        error: error.message
      });
    }
  },

  // 3️⃣ GET SINGLE TEMPLATE
  getTemplateById: async (req, res) => {
    let connection;
    try {
      const { templateId } = req.params;
      console.log('📄 Getting template:', templateId);

      const id = parseInt(templateId);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid template ID'
        });
      }

      connection = await getPool();
      const request = connection.request();
      request.input('templateId', sql.Int, id);

      const result = await request.query(`
        SELECT * FROM MSATemplates WHERE Id = @templateId
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('❌ Get template error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving template',
        error: error.message
      });
    }
  },

  // 4️⃣ CREATE TEMPLATE
  createTemplate: async (req, res) => {
    let connection;
    try {
      const { templateName, mode, serviceType, description, content } = req.body;

      if (!templateName || !mode || !content) {
        return res.status(400).json({
          success: false,
          message: 'Template name, mode, and content are required'
        });
      }

      if (!['CLIENT', 'SUPPLIER'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Mode must be CLIENT or SUPPLIER'
        });
      }

      connection = await getPool();
      const request = connection.request();
      request.input('templateName', sql.NVarChar, templateName);
      request.input('mode', sql.NVarChar, mode);
      request.input('serviceType', sql.NVarChar, serviceType || 'General');
      request.input('description', sql.NVarChar, description || '');
      request.input('content', sql.NVarChar(sql.MAX), content);
      request.input('version', sql.NVarChar, '1.0');
      request.input('isActive', sql.Bit, 1);
      request.input('createdBy', sql.NVarChar, req.user?.email || 'System');
      request.input('createdAt', sql.DateTime, new Date());

      const result = await request.query(`
        INSERT INTO MSATemplates (TemplateName, Mode, ServiceType, Description, [Content], Version, IsActive, CreatedBy, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.Id, INSERTED.*
        VALUES (@templateName, @mode, @serviceType, @description, @content, @version, @isActive, @createdBy, @createdAt, @createdAt)
      `);

      console.log('✅ Template created with ID:', result.recordset[0].Id);

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('❌ Create template error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error creating template',
        error: error.message
      });
    }
  },

  // 5️⃣ SEARCH PARTY
  searchParty: async (req, res) => {
    try {
      const { mode, query, limit = 10 } = req.query;

      console.log(`🔍 Searching ${mode}:`, query);

      if (!mode || !['CLIENT', 'SUPPLIER'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Mode must be CLIENT or SUPPLIER'
        });
      }

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      // For CLIENT mode, search in real data from Onboarding
      if (mode === 'CLIENT') {
        let connection = await getPool();
        const request = connection.request();
        request.input('search', sql.NVarChar, `%${query}%`);
        
        const result = await request.query(`
          SELECT DISTINCT 
            Client as companyName,
            ClientEmail as email,
            MIN(WorkflowEmployeeId) as id
          FROM OnboardingWorkflowEmployees
          WHERE Client IS NOT NULL AND Client != ''
            AND (Client LIKE @search OR ClientEmail LIKE @search)
          GROUP BY Client, ClientEmail
        `);

        const filteredData = result.recordset.map(item => ({
          id: item.id.toString(),
          companyName: item.companyName,
          email: item.email || '',
          address: 'Refer to Onboarding Record',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          taxId: '',
          contactPerson: item.companyName
        })).slice(0, limit);

        return res.json({
          success: true,
          data: filteredData,
          count: filteredData.length,
          mode
        });
      }

      // For SUPPLIER mode, use mock data
      const sourceData = Object.values(sharedMockSuppliers);
      const filteredData = sourceData.filter(item => 
        item.companyName.toLowerCase().includes(query.toLowerCase()) ||
        item.email.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit);

      res.json({
        success: true,
        data: filteredData,
        count: filteredData.length,
        mode
      });
    } catch (error) {
      console.error('❌ Search party error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error searching party',
        error: error.message
      });
    }
  },

  // 6️⃣ GET PARTY DETAILS
  getPartyDetails: async (req, res) => {
    try {
      const { mode, partyId } = req.params;

      console.log(`📋 Getting ${mode} details for ID:`, partyId);

      if (!mode || !['CLIENT', 'SUPPLIER'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Mode must be CLIENT or SUPPLIER'
        });
      }

      // For CLIENT mode, try to fetch from Onboarding
      if (mode === 'CLIENT') {
        let connection = await getPool();
        const request = connection.request();
        request.input('employeeId', sql.Int, parseInt(partyId));
        
        const result = await request.query(`
          SELECT TOP 1 
            Client as companyName,
            ClientEmail as email,
            WorkflowEmployeeId as id
          FROM OnboardingWorkflowEmployees
          WHERE WorkflowEmployeeId = @employeeId
        `);

        if (result.recordset.length > 0) {
          const partyData = result.recordset[0];
          return res.json({
            success: true,
            data: {
              id: partyData.id.toString(),
              companyName: partyData.companyName,
              email: partyData.email || '',
              address: 'Refer to Onboarding Record',
              city: '',
              state: '',
              zipCode: '',
              phone: '',
              taxId: '',
              contactPerson: partyData.companyName
            },
            mode
          });
        }
      }

      // Fallback to mock data for SUPPLIER or if client not found
      const partyData = mode === 'SUPPLIER' ? sharedMockSuppliers[partyId] : null;

      if (!partyData) {
        return res.status(404).json({
          success: false,
          message: 'Party not found'
        });
      }

      res.json({
        success: true,
        data: partyData,
        mode
      });
    } catch (error) {
      console.error('❌ Get party details error:', error.message);
      res.status(404).json({
        success: false,
        message: 'Party not found',
        error: error.message
      });
    }
  },

  // 7️⃣ GET COMPANY DETAILS
  getCompanyDetails: async (req, res) => {
    try {
      console.log('🏢 Getting company details');
      
      const mockCompany = {
        id: 1,
        name: 'Prophecy Tech Solutions',
        address: '500 Innovation Drive, Suite 100',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        email: 'info@prophecytechs.com',
        phone: '512-555-0000',
        taxId: '88-1234567'
      };

      res.json({
        success: true,
        data: mockCompany
      });
    } catch (error) {
      console.error('❌ Get company details error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving company details',
        error: error.message
      });
    }
  },

  // 8️⃣ GET START DOCUMENT
  getStartDocument: async (req, res) => {
    try {
      console.log('=== GET START DOCUMENT ===');
      
      const startDocumentContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      max-width: 900px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #038a77; text-align: center; font-size: 32px; margin-bottom: 40px; border-bottom: 3px solid #038a77; padding-bottom: 15px; }
    .step { display: flex; align-items: center; margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 6px solid #038a77; }
    .step-number { background: #038a77; color: white; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 25px; font-size: 20px; }
    .step-content { flex: 1; font-size: 18px; font-weight: 600; color: #1f2937; }
    .arrow { text-align: center; color: #6b7280; font-size: 28px; margin: 15px 0; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Master Services Agreement (MSA) Complete Workflow</h1>
  
  <div class="step">
    <div class="step-number">1</div>
    <div class="step-content">[SELECT MODE: Vendor or Client]</div>
  </div>
  
  <div class="arrow">↓</div>
  
  <div class="step">
    <div class="step-number">2</div>
    <div class="step-content">[SEARCH CRM FOR PARTY]</div>
  </div>
  
  <div class="arrow">↓</div>
  
  <div class="step">
    <div class="step-number">3</div>
    <div class="step-content">[SELECT TEMPLATE OR UPLOAD DOCUMENT]</div>
  </div>
  
  <div class="arrow">↓</div>
  
  <div class="step">
    <div class="step-number">4</div>
    <div class="step-content">[PREVIEW DOCUMENT]</div>
  </div>
  
  <div class="arrow">↓</div>
  
  <div class="step">
    <div class="step-number">5</div>
    <div class="step-content">[ENTER RECIPIENT INFO]</div>
  </div>
  
  <div class="arrow">↓</div>
  
  <div class="step">
    <div class="step-number">6</div>
    <div class="step-content">[SEND VIA DOCUSIGN]</div>
  </div>
  
  <div class="arrow">↓</div>
  
  <div style="text-align: center; padding: 25px; background: #fee2e2; border-radius: 12px; font-weight: bold; color: #dc2626; font-size: 24px;">
    ✅ PROCESS COMPLETE - EMAIL SENT
  </div>
</body>
</html>`;

      res.json({
        success: true,
        data: {
          content: startDocumentContent,
          title: 'MSA Workflow Document',
          type: 'workflow',
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Get start document error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving start document',
        error: error.message
      });
    }
  },

  // 9️⃣ GENERATE MSA DOCUMENT
  generateMSADocument: async (req, res) => {
    let connection;
    try {
      console.log('=== GENERATE MSA DOCUMENT ===');
      const { templateId, mode, partyId, additionalTerms = {}, effectiveDate, termLength, renewalTerm } = req.body;

      if (!templateId || !mode || !partyId) {
        return res.status(400).json({
          success: false,
          message: 'Template ID, mode, and party ID are required'
        });
      }

      connection = await getPool();
      let request = connection.request();
      request.input('templateId', sql.Int, parseInt(templateId));
      
      let templateResult = await request.query(`
        SELECT * FROM MSATemplates WHERE Id = @templateId
      `);

      if (templateResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const template = templateResult.recordset[0];
      let templateContent = template.Content;
      console.log('✅ Template retrieved:', template.TemplateName);

      if (template.TemplateName === 'Generic Client MSA' || template.TemplateName.includes('Generic')) {
        try {
          const mammoth = require('mammoth');
          const docPath = path.join(__dirname, '../../../MSA Prophecy Consulting Inc.docx');
          const logoPath = path.join(__dirname, '../../../FrontEnd/my-app/src/Recruitment/Assets/images/prophecy-logo.png');
          
          if (fs.existsSync(docPath)) {
            const result = await mammoth.convertToHtml({ path: docPath });
            let logoBase64 = '';
            
            if (fs.existsSync(logoPath)) {
              const logoData = fs.readFileSync(logoPath);
              logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
            }

            let rawHtml = result.value;

            // Center-align the "MASTER SERVICES AGREEMENT" heading
            rawHtml = rawHtml.replace(
              /<p><strong>MASTER SERVICES AGREEMENT<\/strong><\/p>/g, 
              '<p style="text-align: center;"><strong>MASTER SERVICES AGREEMENT</strong></p>'
            ).replace(
              /<p>MASTER SERVICES AGREEMENT<\/p>/g,
              '<p style="text-align: center;">MASTER SERVICES AGREEMENT</p>'
            );

            const tableMatches = [];
            let htmlSafe = rawHtml.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
              tableMatches.push(match);
              return `###TABLE_${tableMatches.length - 1}###`;
            });

            // Re-tuned regex to never chunk inside <li> so numbering and lists don't break either
            const blocks = htmlSafe.split(/(?<=<\/p>|<\/h[1-6]>|<br \/>|<br>)/);
            
            const pages = [];
            let currentPage = '';
            let currentLength = 0;
            const MAX_PAGE_LENGTH = 3000; // Safe approximate char length for A4
        
            blocks.forEach(block => {
              if (currentLength + block.length > MAX_PAGE_LENGTH && currentLength > 0) {
                pages.push(currentPage);
                currentPage = block;
                currentLength = block.length;
              } else {
                currentPage += block;
                currentLength += block.length;
              }
            });
            if (currentPage) pages.push(currentPage);
        
            let finalPagesHtml = '';
            pages.forEach((pageContentRaw, index) => {
              const pageContent = pageContentRaw.replace(/###TABLE_(\d+)###/g, (match, p1) => {
                return tableMatches[parseInt(p1, 10)];
              });

              finalPagesHtml += `
                <div class="a4-page" style="width: 100%; max-width: 900px; margin: 0 auto 30px auto; background: white; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid #ccc;">
                  
                  <!-- Header Line -->
                  <div style="flex: 0 0 auto; margin-bottom: 20px;">
                    <div style="border-top: 3px solid #6d0e6d; width: 100%;"></div>
                  </div>
                  
                  <!-- Page Content -->
                  <div style="flex: 1 1 auto; font-family: Calibri, Arial, sans-serif; font-size: 14pt; text-align: justify; word-wrap: break-word; color: #000; min-height: 800px;">
                    ${pageContent}
                  </div>
        
                  <!-- Footer Banner -->
                  <div style="flex: 0 0 auto; margin-top: 30px;">
                    <div style="border-top: 7px solid #6d0e6d;"></div>
                    <div style="background-color: #00487c; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between;">
                      <div style="flex: 0 0 auto;">
                        ${logoBase64 ? `<img src="${logoBase64}" alt="Prophecy Logo" style="height: 35px;" />` : `<h2 style="color: white; margin: 0; font-family: sans-serif;">PROPHECY</h2>`}
                      </div>
                      <div style="flex: 1 1 auto; text-align: right; padding-left: 20px; color: #ffffff; font-size: 11px; line-height: 1.4; font-family: Arial, sans-serif;">
                        <strong style="color: #ffffff;">Prophecy Consulting Inc</strong> | <a href="http://www.prophecytechs.com" style="color: #ffffff; text-decoration: none;">www.prophecytechs.com</a><br/>
                        <span style="color: #ffffff;">7545 Irvine Center Dr, Ste 200, Irvine, CA 92618</span><br/>
                        <a href="mailto:onboarding@prophecytechs.com" style="color: #ffffff; text-decoration: none;">onboarding@prophecytechs.com</a> | <span style="color: #ffffff;">+1(551) 689-4006</span>
                      </div>
                    </div>
                  </div>
        
                </div>
              `;
            });
            
            templateContent = `
              <div style="background: transparent; padding: 20px 0;">
                ${finalPagesHtml}
              </div>
            `;
            console.log(`📄 Successfully loaded and paginated DOCX file into ${pages.length} pages`);
          } else {
            console.warn('⚠️ DOCX file not found at:', docPath);
          }
        } catch (err) {
          console.error('❌ Failed to extract DOCX:', err);
        }
      }

      const yourCompany = {
        id: 1,
        name: 'Prophecy Tech Solutions',
        address: '500 Innovation Drive, Suite 100',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        email: 'info@prophecytechs.com',
        phone: '512-555-0000',
        taxId: '88-1234567'
      };

      // Fetch party details - for CLIENT mode, try to get from Onboarding
      let partyDetails = null;
      if (mode === 'CLIENT') {
        try {
          const partyReq = connection.request();
          partyReq.input('employeeId', sql.Int, parseInt(partyId));
          const partyResult = await partyReq.query(`
            SELECT TOP 1 
              Client as companyName,
              ClientEmail as email
            FROM OnboardingWorkflowEmployees
            WHERE WorkflowEmployeeId = @employeeId
          `);
          if (partyResult.recordset.length > 0) {
            partyDetails = {
              id: partyId,
              companyName: partyResult.recordset[0].companyName,
              email: partyResult.recordset[0].email || '',
              address: 'Refer to Onboarding Record'
            };
          }
        } catch (e) {
          console.warn('Could not fetch client from Onboarding, falling back to mock:', e.message);
        }
      }

      // Fallback to mock for SUPPLIER or if client fetch failed
      if (!partyDetails) {
        partyDetails = mode === 'SUPPLIER' ? sharedMockSuppliers[partyId] : null;
      }
      
      if (!partyDetails) {
        return res.status(404).json({
          success: false,
          message: 'Party not found'
        });
      }

      const placeholders = {
        '{{YOUR_COMPANY_NAME}}': yourCompany.name,
        '{{YOUR_COMPANY_ADDRESS}}': yourCompany.address,
        '{{PARTY_NAME}}': partyDetails.companyName,
        '{{PARTY_ADDRESS}}': partyDetails.address,
        '{{EFFECTIVE_DATE}}': effectiveDate || new Date().toISOString().split('T')[0],
        '{{TERM_LENGTH}}': termLength || '3',
        '{{GENERATED_DATE}}': new Date().toISOString().split('T')[0],
        ...additionalTerms
      };

      Object.entries(placeholders).forEach(([placeholder, value]) => {
        try {
          const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          templateContent = templateContent.replace(regex, value || '');
        } catch (e) {
          console.warn(`⚠️ Failed to replace placeholder: ${placeholder}`);
        }
      });

      request = connection.request();
      request.input('templateId', sql.Int, parseInt(templateId));
      request.input('mode', sql.NVarChar, mode);
      request.input('partyId', sql.NVarChar, partyId);
      request.input('partyName', sql.NVarChar, partyDetails.companyName);
      request.input('yourCompanyId', sql.Int, yourCompany.id);
      request.input('content', sql.NVarChar(sql.MAX), templateContent);
      request.input('status', sql.NVarChar, 'Draft');
      request.input('createdBy', sql.NVarChar, req.user?.email || 'System');
      request.input('createdAt', sql.DateTime, new Date());

      const docResult = await request.query(`
        INSERT INTO MSADocuments (TemplateId, Mode, PartyId, PartyName, YourCompanyId, [Content], [Status], CreatedBy, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.Id, INSERTED.*
        VALUES (@templateId, @mode, @partyId, @partyName, @yourCompanyId, @content, @status, @createdBy, @createdAt, @createdAt)
      `);

      const documentData = {
        documentId: docResult.recordset[0].Id,
        content: templateContent,
        metadata: {
          template: template.TemplateName,
          mode,
          partyName: partyDetails.companyName,
          yourCompany: yourCompany.name,
          generatedAt: new Date().toISOString()
        }
      };

      res.json({
        success: true,
        message: 'MSA document generated successfully',
        data: documentData
      });
    } catch (error) {
      console.error('❌ Generate document error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error generating MSA document',
        error: error.message
      });
    }
  },

  // 🔟 UPDATE DOCUMENT CONTENT
  updateDocumentContent: async (req, res) => {
    let connection;
    try {
      console.log('=== UPDATE DOCUMENT CONTENT ===');
      const { documentId, content } = req.body;

      if (!documentId || !content) {
        return res.status(400).json({
          success: false,
          message: 'Document ID and content are required'
        });
      }

      connection = await getPool();
      const request = connection.request();
      request.input('documentId', sql.Int, parseInt(documentId));
      request.input('content', sql.NVarChar(sql.MAX), content);
      request.input('updatedAt', sql.DateTime, new Date());

      const result = await request.query(`
        UPDATE MSADocuments
        SET [Content] = @content,
            UpdatedAt = @updatedAt
        WHERE Id = @documentId
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: {
          documentId,
          content: content,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Update document error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error updating document',
        error: error.message
      });
    }
  },

  // 1️⃣1️⃣ SEND FOR SIGNATURE
  sendForSignature: async (req, res) => {
    try {
      console.log('=== SEND FOR SIGNATURE ===');
      const { documentId, signatureMethod, recipientEmail, recipientName } = req.body;

      if (!documentId || !signatureMethod) {
        return res.status(400).json({
          success: false,
          message: 'Document ID and signature method are required'
        });
      }

      res.json({
        success: true,
        message: 'Document sent for signature',
        data: {
          documentId,
          method: signatureMethod,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Send for signature error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error sending for signature',
        error: error.message
      });
    }
  },

  // 1️⃣2️⃣ SUBMIT SIGNATURE
  submitSignature: async (req, res) => {
    let connection;
    try {
      console.log('=== SUBMIT SIGNATURE ===');
      const { documentId, signatureData, signerName, signerTitle, signerEmail } = req.body;

      if (!documentId || !signatureData) {
        return res.status(400).json({
          success: false,
          message: 'Document ID and signature data are required'
        });
      }

      connection = await getPool();
      const request = connection.request();
      request.input('documentId', sql.Int, parseInt(documentId));
      request.input('signatureData', sql.NVarChar(sql.MAX), signatureData);
      request.input('signerName', sql.NVarChar, signerName);
      request.input('signerTitle', sql.NVarChar, signerTitle || '');
      request.input('signerEmail', sql.NVarChar, signerEmail);
      request.input('signedAt', sql.DateTime, new Date());
      request.input('status', sql.NVarChar, 'Signed');

      const result = await request.query(`
        UPDATE MSADocuments
        SET SignatureData = @signatureData,
            SignerName = @signerName,
            SignerTitle = @signerTitle,
            SignerEmail = @signerEmail,
            SignedAt = @signedAt,
            [Status] = @status,
            UpdatedAt = @signedAt
        WHERE Id = @documentId
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      res.json({
        success: true,
        message: 'MSA signed successfully',
        data: {
          documentId,
          signedAt: new Date().toISOString(),
          signer: signerName
        }
      });
    } catch (error) {
      console.error('❌ Submit signature error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error submitting signature',
        error: error.message
      });
    }
  },

  // 1️⃣3️⃣ GET PARTY MSAS
  getPartyMSAs: async (req, res) => {
    let connection;
    try {
      const { mode, partyId } = req.params;

      if (!mode || !['CLIENT', 'SUPPLIER'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Mode must be CLIENT or SUPPLIER'
        });
      }

      connection = await getPool();
      const request = connection.request();
      request.input('mode', sql.NVarChar, mode);
      request.input('partyId', sql.NVarChar, partyId);

      const result = await request.query(`
        SELECT Id, TemplateId, Mode, PartyId, PartyName, [Status], CreatedAt
        FROM MSADocuments
        WHERE Mode = @mode AND PartyId = @partyId
        ORDER BY CreatedAt DESC
      `);

      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('❌ Get party MSAs error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving MSAs',
        error: error.message
      });
    }
  },

  // 1️⃣4️⃣ GET MSA STATISTICS
  getMSAStats: async (req, res) => {
    let connection;
    try {
      connection = await getPool();
      const request = connection.request();

      const result = await request.query(`
        SELECT 
          COUNT(*) as TotalDocuments,
          SUM(CASE WHEN [Status] = 'Signed' THEN 1 ELSE 0 END) as SignedCount,
          SUM(CASE WHEN [Status] = 'Pending Signature' THEN 1 ELSE 0 END) as PendingCount,
          SUM(CASE WHEN [Status] = 'Draft' THEN 1 ELSE 0 END) as DraftCount
        FROM MSADocuments
      `);

      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('❌ Get stats error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving statistics',
        error: error.message
      });
    }
  },

  // 1️⃣5️⃣ DOWNLOAD DOCUMENT AS HTML (Content is HTML, not PDF)
  downloadDocumentAsPDF: async (req, res) => {
    let connection;
    try {
      console.log('=== DOWNLOAD DOCUMENT ===');
      const { documentId } = req.params;
      
      connection = await getPool();
      const request = connection.request();
      request.input('documentId', sql.Int, parseInt(documentId));
      
      const result = await request.query(`
        SELECT * FROM MSADocuments WHERE Id = @documentId
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      const document = result.recordset[0];
      const htmlBuffer = Buffer.from(document.Content, 'utf-8');
      const safeName = (document.PartyName || 'Document').replace(/[^a-zA-Z0-9-_]/g, '_');
      
      // Content is HTML - serve as downloadable HTML file
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="MSA-${safeName}-${new Date().toISOString().split('T')[0]}.html"`);
      res.setHeader('Content-Length', htmlBuffer.length);
      
      res.send(htmlBuffer);
      
    } catch (error) {
      console.error('❌ Download document error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error downloading document',
        error: error.message
      });
    }
  },

  // 1️⃣6️⃣ SAVE START DOCUMENT
  saveStartDocument: async (req, res) => {
    let connection;
    try {
      console.log('=== SAVE START DOCUMENT ===');
      const { content, title } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }

      connection = await getPool();
      const request = connection.request();
      
      const checkResult = await request.query(`
        SELECT Id FROM MSADocuments 
        WHERE TemplateId IS NULL AND PartyId = 'START_DOC'
      `);

      if (checkResult.recordset.length > 0) {
        const updateReq = connection.request();
        updateReq.input('documentId', sql.Int, checkResult.recordset[0].Id);
        updateReq.input('content', sql.NVarChar(sql.MAX), content);
        updateReq.input('updatedAt', sql.DateTime, new Date());

        await updateReq.query(`
          UPDATE MSADocuments
          SET [Content] = @content,
              UpdatedAt = @updatedAt
          WHERE Id = @documentId
        `);

        res.json({
          success: true,
          message: 'Start document updated successfully',
          data: { documentId: checkResult.recordset[0].Id }
        });
      } else {
        const insertReq = connection.request();
        insertReq.input('content', sql.NVarChar(sql.MAX), content);
        insertReq.input('title', sql.NVarChar, title || 'MSA Workflow Document');
        insertReq.input('partyId', sql.NVarChar, 'START_DOC');
        insertReq.input('partyName', sql.NVarChar, 'Workflow Document');
        insertReq.input('status', sql.NVarChar, 'Draft');
        insertReq.input('createdBy', sql.NVarChar, req.user?.email || 'System');
        insertReq.input('createdAt', sql.DateTime, new Date());

        const result = await insertReq.query(`
          INSERT INTO MSADocuments (PartyId, PartyName, [Content], [Status], CreatedBy, CreatedAt, UpdatedAt)
          OUTPUT INSERTED.Id
          VALUES (@partyId, @partyName, @content, @status, @createdBy, @createdAt, @createdAt)
        `);

        res.json({
          success: true,
          message: 'Start document saved successfully',
          data: { documentId: result.recordset[0].Id }
        });
      }
    } catch (error) {
      console.error('❌ Save start document error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error saving start document',
        error: error.message
      });
    }
  },

  // 1️⃣7️⃣ UPLOAD DOCUMENT FILE - ✅ FIXED
  uploadDocument: async (req, res) => {
    let connection;
    try {
      console.log('=== UPLOAD DOCUMENT ===');
      const file = req.file;
      const { fileName } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'File size must be less than 10MB'
        });
      }

      const validMimeTypes = [
        'application/pdf',
        'text/html',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!validMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Allowed: PDF, HTML, TXT, DOC, DOCX'
        });
      }

      connection = await getPool();
      const request = connection.request();
      
      const fileBuffer = file.buffer;
      const originalFileName = fileName || file.originalname;
      const fileType = file.mimetype;

      console.log('📄 File details:');
      console.log('  - Name:', originalFileName);
      console.log('  - Type:', fileType);
      console.log('  - Size:', file.size, 'bytes');

      request.input('fileName', sql.NVarChar, originalFileName);
      request.input('fileType', sql.NVarChar, fileType);
      request.input('fileData', sql.VarBinary(sql.MAX), fileBuffer);
      request.input('fileSize', sql.Int, file.size);
      request.input('uploadedBy', sql.NVarChar, req.user?.email || 'System');
      request.input('uploadedAt', sql.DateTime, new Date());
      request.input('createdAt', sql.DateTime, new Date());
      request.input('updatedAt', sql.DateTime, new Date());

      const result = await request.query(`
        INSERT INTO UploadedDocuments 
        (FileName, FileType, FileData, FileSize, UploadedBy, UploadedAt, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.Id, INSERTED.FileName, INSERTED.FileType, INSERTED.FileSize, INSERTED.UploadedAt
        VALUES (@fileName, @fileType, @fileData, @fileSize, @uploadedBy, @uploadedAt, @createdAt, @updatedAt)
      `);

      if (!result.recordset || result.recordset.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to save document to database'
        });
      }

      const uploadedDoc = result.recordset[0];
      
      // ✅ FIX: Ensure documentId is a number, not an array
      const documentId = uploadedDoc.Id;
      console.log('✅ Document uploaded with ID:', documentId);
      console.log('✅ ID Type:', typeof documentId);
      console.log('✅ ID Value:', documentId);

      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      const fileUrl = `${backendUrl}/api/msa/documents/upload/${documentId}/preview`;

      console.log('✅ File URL:', fileUrl);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          documentId: documentId,
          fileName: originalFileName,
          fileType: fileType,
          fileSize: file.size,
          uploadedAt: uploadedDoc.UploadedAt,
          fileUrl: fileUrl
        }
      });
    } catch (error) {
      console.error('❌ Upload document error:', error.message);
      console.error('Full error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading document: ' + error.message,
        error: error.message
      });
    }
  },


  // 1️⃣8️⃣ GET UPLOADED DOCUMENT PREVIEW - ✅ FIXED (PUBLIC + CORS)
  getUploadedDocumentPreview: async (req, res) => {
    let connection;
    try {
      const { documentId } = req.params;
      console.log('=== GET DOCUMENT PREVIEW ===', documentId);

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const id = parseInt(documentId);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      connection = await getPool();
      const request = connection.request();
      request.input('documentId', sql.Int, id);

      const result = await request.query(`
        SELECT Id, FileName, FileType, FileData, FileSize
        FROM UploadedDocuments 
        WHERE Id = @documentId
      `);

      if (result.recordset.length === 0) {
        console.log('❌ Document not found for ID:', documentId);
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const document = result.recordset[0];
      console.log('📄 Found document:', document.FileName);
      console.log('📊 File type:', document.FileType);
      console.log('📊 File size:', document.FileSize, 'bytes');
      console.log('📊 FileData type:', typeof document.FileData);
      console.log('📊 FileData is Buffer:', Buffer.isBuffer(document.FileData));
      
      // ✅ FIX: Handle FileData properly
      let fileBuffer;
      
      if (!document.FileData) {
        console.log('❌ Document data is empty for ID:', documentId);
        return res.status(404).json({
          success: false,
          message: 'Document data not found - file may be corrupted'
        });
      }

      // FileData from MSSQL should be a Buffer
      if (Buffer.isBuffer(document.FileData)) {
        fileBuffer = document.FileData;
        console.log('✅ FileData is already a Buffer');
      } else if (typeof document.FileData === 'string') {
        // If it's a base64 string, decode it
        try {
          fileBuffer = Buffer.from(document.FileData, 'base64');
          console.log('✅ Decoded base64 string to Buffer');
        } catch (e) {
          // If not base64, treat as UTF-8
          fileBuffer = Buffer.from(document.FileData, 'utf-8');
          console.log('✅ Converted UTF-8 string to Buffer');
        }
      } else {
        // Last resort: try to convert to buffer
        fileBuffer = Buffer.from(document.FileData);
        console.log('✅ Converted to Buffer');
      }

      console.log('📊 Final buffer size:', fileBuffer.length, 'bytes');

      // ✅ Set proper headers for file serving with CORS
      res.setHeader('Content-Type', document.FileType || 'application/pdf');
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Content-Disposition', 'inline; filename="' + document.FileName + '"');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // ✅ CORS headers - allow all origins for preview
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');

      console.log('✅ Sending document preview:', document.FileName);
      console.log('✅ Content-Length:', fileBuffer.length);
      console.log('✅ Content-Type:', document.FileType);
      
      res.send(fileBuffer);

    } catch (error) {
      console.error('❌ Get preview error:', error.message);
      console.error('Full error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error retrieving document preview: ' + error.message
        });
      }
    }
  },

  // 1️⃣9️⃣ SEND UPLOADED DOCUMENT FOR DOCUSIGN - WITH EMAIL
  sendUploadedDocumentForDocuSign: async (req, res) => {
    let connection;
    try {
      console.log('=== SEND UPLOADED DOCUMENT FOR DOCUSIGN ===');
      const {
        uploadedDocumentId,
        fileName,
        recipientEmail,
        recipientName,
        recipientTitle,
        fields = []
      } = req.body;

      if (!uploadedDocumentId || !recipientEmail) {
        return res.status(400).json({
          success: false,
          message: 'Document ID and recipient email are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address'
        });
      }

      connection = await getPool();
      
      let request = connection.request();
      request.input('documentId', sql.Int, parseInt(uploadedDocumentId));

      const docResult = await request.query(`
        SELECT * FROM UploadedDocuments WHERE Id = @documentId
      `);

      if (docResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Uploaded document not found'
        });
      }

      const uploadedDoc = docResult.recordset[0];
      const signingToken = generateToken(uploadedDocumentId);
      const envelopeId = 'env-' + Date.now();
      
      // Generate signing link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:218';
      const signingLink = `${frontendUrl}/sign/${signingToken}?envelope=${envelopeId}`;

      console.log('📧 Sending signing email to:', recipientEmail);

      // ============================================
      // SEND EMAIL USING SENDGRID
      // ============================================
      const htmlEmailContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333;
                background-color: #f5f5f5;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: white;
                border-radius: 8px;
              }
              .header { 
                background: linear-gradient(135deg, #038a77 0%, #026b5e 100%);
                color: white; 
                padding: 30px 20px; 
                border-radius: 8px 8px 0 0; 
                text-align: center; 
              }
              .header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content { 
                padding: 30px 20px; 
                background-color: #ffffff;
              }
              .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #038a77 0%, #026b5e 100%);
                color: white; 
                padding: 14px 32px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0; 
                font-weight: bold;
                text-align: center;
                font-size: 16px;
              }
              .button:hover {
                opacity: 0.9;
                text-decoration: none;
                color: white;
              }
              .footer { 
                text-align: center; 
                color: #999; 
                font-size: 12px; 
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
              }
              .warning { 
                background-color: #fff3cd; 
                border: 1px solid #ffc107; 
                padding: 12px; 
                border-radius: 5px; 
                margin: 15px 0;
                color: #856404;
              }
              .steps {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
              }
              .steps ol {
                margin: 0;
                padding-left: 20px;
              }
              .steps li {
                margin: 8px 0;
              }
              code {
                background-color: #f0f0f0;
                padding: 10px;
                display: block;
                word-break: break-all;
                border-radius: 4px;
                margin: 10px 0;
                font-family: monospace;
                font-size: 12px;
                overflow-x: auto;
              }
              .greeting {
                font-size: 18px;
                color: #038a77;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div class="container">
              <div class="header">
                <h2>📄 Document Signature Request</h2>
              </div>
              
              <div class="content">
                <p class="greeting">Hi <strong>${recipientName || 'there'}</strong>,</p>
                
                <p>You have been requested to electronically sign the following document:</p>
                
                <div style="background-color: #038a77; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 16px; font-weight: bold;">
                  ${fileName}
                </div>
                
                <p><strong>What to do:</strong></p>
                
                <p>Click the button below to securely sign the document:</p>
                
                <div style="text-align: center;">
                  <a href="${signingLink}" class="button">Sign Document Now</a>
                </div>
                
                <p style="text-align: center; color: #666;">Or copy and paste this link in your browser:</p>
                <code>${signingLink}</code>
                
                <div class="warning">
                  <strong>⏰ Important:</strong> This signing request is valid for <strong>30 days</strong>. Please complete the signature before the expiration date.
                </div>
                
                <div class="steps">
                  <strong>📋 Signing Process:</strong>
                  <ol>
                    <li>Click the "Sign Document Now" button above</li>
                    <li>Review the document carefully</li>
                    <li>Sign where indicated</li>
                    <li>Submit your signature</li>
                    <li>You'll receive a confirmation email</li>
                  </ol>
                </div>
                
                <p><strong>Questions?</strong></p>
                <p>If you have any questions or need assistance, please contact the sender of this request.</p>
                
                <p style="margin-top: 30px; color: #999;">
                  Best regards,<br>
                  <strong>Prophecy MSA System</strong>
                </p>
              </div>
              
              <div class="footer">
                <p>© 2024 Prophecy Technologies. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Call SendGrid to send email
      const emailResult = await sendEmailViaSendGrid({
        to: recipientEmail,
        subject: `Document Signature Request: ${fileName}`,
        html: htmlEmailContent
      });

      if (!emailResult.success) {
        console.warn('⚠️ Email send warning:', emailResult.error);
      } else {
        console.log('✅ Email sent successfully via SendGrid');
      }

      // Save envelope request to database
      try {
        const insertReq = connection.request();
        insertReq.input('uploadedDocumentId', sql.Int, parseInt(uploadedDocumentId));
        insertReq.input('envelopeId', sql.NVarChar, envelopeId);
        insertReq.input('recipientEmail', sql.NVarChar, recipientEmail);
        insertReq.input('recipientName', sql.NVarChar, recipientName || '');
        insertReq.input('recipientTitle', sql.NVarChar, recipientTitle || '');
        insertReq.input('signingToken', sql.NVarChar, signingToken);
        insertReq.input('status', sql.NVarChar, 'sent');
        insertReq.input('fieldData', sql.NVarChar(sql.MAX), JSON.stringify(fields));
        insertReq.input('sentAt', sql.DateTime, new Date());
        insertReq.input('createdAt', sql.DateTime, new Date());
        insertReq.input('updatedAt', sql.DateTime, new Date());

        const insertQuery = `
          INSERT INTO DocusignRequests 
          (UploadedDocumentId, EnvelopeId, RecipientEmail, RecipientName, RecipientTitle, 
           SigningToken, [Status], FieldData, SentAt, CreatedAt, UpdatedAt)
          VALUES 
          (@uploadedDocumentId, @envelopeId, @recipientEmail, @recipientName, @recipientTitle,
           @signingToken, @status, @fieldData, @sentAt, @createdAt, @updatedAt)
        `;

        console.log('📝 Saving to database...');
        await insertReq.query(insertQuery);
        console.log('✅ Envelope request saved to database successfully');

      } catch (dbError) {
        console.error('❌ Failed to save envelope to database:', dbError.message);
      }

      res.json({
        success: true,
        message: 'Document sent for signature via DocuSign',
        data: {
          documentId: uploadedDocumentId,
          envelopeId: envelopeId,
          signingToken: signingToken,
          docusignLink: signingLink,
          recipientEmail: recipientEmail,
          emailSent: emailResult.success,
          sentAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Send for DocuSign error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error sending document for signature',
        error: error.message
      });
    }
  },

  // 2️⃣0️⃣ GET ENVELOPE STATUS
  getEnvelopeStatus: async (req, res) => {
    try {
      const { envelopeId } = req.params;
      
      console.log('📊 Getting envelope status:', envelopeId);

      res.json({
        success: true,
        data: {
          status: 'sent',
          envelopeId: envelopeId,
          sentAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Get envelope status error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving envelope status',
        error: error.message
      });
    }
  },

  // 2️⃣1️⃣ CREATE RECIPIENT VIEW
  createRecipientView: async (req, res) => {
    try {
      const { signingToken, envelopeId } = req.body;

      if (!signingToken || !envelopeId) {
        return res.status(400).json({
          success: false,
          message: 'Signing token and envelope ID are required'
        });
      }

      console.log('👤 Creating recipient view for embedded signing...');
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:218';
      const signingUrl = `${frontendUrl}/sign/${signingToken}`;

      res.json({
        success: true,
        data: {
          redirectUrl: signingUrl,
          envelopeId: envelopeId
        }
      });

    } catch (error) {
      console.error('❌ Create recipient view error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error creating signing view',
        error: error.message
      });
    }
  },

  // 2️⃣2️⃣ CONFIRM DOCUSIGN SIGNATURE - WITH INTEGRATION TO ONBOARDING
  confirmDocusignSignature: async (req, res) => {
    let connection;
    try {
      console.log('=== CONFIRM DOCUSIGN SIGNATURE ===');
      const { signingToken, fields, signerName, signerTitle, signerEmail, documentId, signedPdfBase64 } = req.body;

      if (!signingToken || !documentId) {
        return res.status(400).json({
          success: false,
          message: 'Signing token and document ID are required'
        });
      }

      connection = await getPool();
      
      let request = connection.request();
      request.input('signingToken', sql.NVarChar, signingToken);

      const tokenResult = await request.query(`
        SELECT Id, EnvelopeId, UploadedDocumentId, RecipientEmail 
        FROM DocusignRequests 
        WHERE SigningToken = @signingToken
      `);

      if (tokenResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Signing token not found or expired'
        });
      }

      const docuSignRequest = tokenResult.recordset[0];

      request = connection.request();
      request.input('docusignRequestId', sql.Int, docuSignRequest.Id);
      request.input('signerName', sql.NVarChar, signerName);
      request.input('signerTitle', sql.NVarChar, signerTitle || '');
      request.input('signerEmail', sql.NVarChar, signerEmail);
      request.input('fieldData', sql.NVarChar(sql.MAX), JSON.stringify(fields));
      request.input('signedAt', sql.DateTime, new Date());
      request.input('status', sql.NVarChar, 'completed');
      request.input('updatedAt', sql.DateTime, new Date());

      await request.query(`
        UPDATE DocusignRequests
        SET 
          RecipientName = @signerName,
          RecipientTitle = @signerTitle,
          FieldData = @fieldData,
          [Status] = @status,
          UpdatedAt = @updatedAt
        WHERE Id = @docusignRequestId
      `);

      console.log('✅ Signature saved successfully');

      // Convert signed PDF base64 to buffer if provided
      const signedFileBuffer = signedPdfBase64 ? Buffer.from(signedPdfBase64, 'base64') : null;
      if (signedFileBuffer) {
        console.log('📄 Received signed PDF from browser, size:', signedFileBuffer.length, 'bytes');
      }

      // Ensure SignedFileData column exists
      try {
        const colCheck = connection.request();
        await colCheck.query(`
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SignedDocuments') AND name = 'SignedFileData')
          ALTER TABLE SignedDocuments ADD SignedFileData VARBINARY(MAX) NULL
        `);
      } catch (colErr) {
        console.warn('⚠️ Could not check/add SignedFileData column:', colErr.message);
      }

      request = connection.request();
      request.input('docusignRequestId', sql.Int, docuSignRequest.Id);
      request.input('uploadedDocumentId', sql.Int, docuSignRequest.UploadedDocumentId);
      request.input('signerName', sql.NVarChar, signerName);
      request.input('signerEmail', sql.NVarChar, signerEmail);
      request.input('fieldData', sql.NVarChar(sql.MAX), JSON.stringify(fields));
      request.input('createdAt', sql.DateTime, new Date());
      request.input('signedFileData', sql.VarBinary(sql.MAX), signedFileBuffer);

      const signedResult = await request.query(`
        INSERT INTO SignedDocuments (DocusignRequestId, UploadedDocumentId, SignerName, SignerEmail, FieldData, SignedFileData, CreatedAt)
        OUTPUT INSERTED.Id, INSERTED.*
        VALUES (@docusignRequestId, @uploadedDocumentId, @signerName, @signerEmail, @fieldData, @signedFileData, @createdAt)
      `);

      const signedDocumentId = signedResult.recordset[0].Id;
      console.log('✅ Signed document record created with ID:', signedDocumentId);

      // =====================================================================
      // 🚀 INTEGRATION: LINK SIGNED MSA TO ONBOARDING MODULE
      // =====================================================================
      try {
        const lookupEmail = signerEmail || docuSignRequest.RecipientEmail;
        console.log(`🔗 Attempting to link signed MSA to Onboarding... Lookup Email: ${lookupEmail}`);

        if (lookupEmail) {
          // Find employee by client email (as they are the ones signing the MSA)
          const employeeRequest = connection.request();
          employeeRequest.input('lookupEmail', sql.NVarChar, lookupEmail);
          
          const employeeResult = await employeeRequest.query(`
            SELECT TOP 1 WorkflowEmployeeId, CompanyId, DocumentPaths, WorkflowSteps 
            FROM OnboardingWorkflowEmployees 
            WHERE ClientEmail = @lookupEmail OR CandidateEmail = @lookupEmail
            ORDER BY UpdatedAt DESC
          `);

          if (employeeResult.recordset.length > 0) {
            const employee = employeeResult.recordset[0];
            const { WorkflowEmployeeId, CompanyId } = employee;
            console.log(`👤 Found matching employee in Onboarding: ID ${WorkflowEmployeeId}`);

            // 1. Update DocumentPaths
            let documentPaths = {};
            try {
              documentPaths = employee.DocumentPaths ? JSON.parse(employee.DocumentPaths) : {};
            } catch (e) {
              console.warn('⚠️ Could not parse DocumentPaths JSON, starting fresh');
              documentPaths = {};
            }

            // Construct link to the signed document download
            const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
            const msaUrl = `${backendUrl}/api/msa/documents/signed/${signedDocumentId}/download`;

            documentPaths['msaSignedDocument'] = {
              url: msaUrl,
              fileName: `Signed_MSA_${signedDocumentId}.pdf`,
              uploadedAt: new Date().toISOString(),
              source: 'MSA Module'
            };

            // 2. Update WorkflowSteps (mark "Sign MSA" as completed)
            let steps = [];
            try {
              steps = employee.WorkflowSteps ? 
                (typeof employee.WorkflowSteps === 'string' ? JSON.parse(employee.WorkflowSteps) : employee.WorkflowSteps) 
                : [];
            } catch (e) {
              console.warn('⚠️ Could not parse WorkflowSteps JSON');
              steps = [];
            }

            let stepFound = false;
            steps = steps.map(step => {
              if (step.title === 'Sign MSA' || step.id === 'sign-msa' || step.title?.includes('MSA')) {
                stepFound = true;
                return { 
                  ...step, 
                  completed: true, 
                  completedAt: new Date().toISOString(),
                  documentPath: msaUrl 
                };
              }
              return step;
            });

            // If step wasn't found in current steps, we still update the documentPaths
            // which the Eye Icon logic will use.

            // 3. Save updates to database
            const updateReq = connection.request();
            updateReq.input('documentPaths', sql.NVarChar(sql.MAX), JSON.stringify(documentPaths));
            updateReq.input('workflowSteps', sql.NVarChar(sql.MAX), JSON.stringify(steps));
            updateReq.input('employeeId', sql.Int, WorkflowEmployeeId);
            updateReq.input('companyId', sql.Int, CompanyId);

            await updateReq.query(`
              UPDATE OnboardingWorkflowEmployees 
              SET 
                DocumentPaths = @documentPaths,
                WorkflowSteps = @workflowSteps,
                UpdatedAt = GETDATE()
              WHERE WorkflowEmployeeId = @employeeId AND CompanyId = @companyId
            `);

            console.log(`✅ Successfully updated Onboarding record for employee ${WorkflowEmployeeId}`);
          } else {
            console.log(`ℹ️ No matching onboarding employee found for email ${lookupEmail}`);
          }
        }
      } catch (integrationError) {
        console.error('❌ Integration error (Syncing to Onboarding):', integrationError.message);
        // We don't fail the whole request because the signature itself was already saved successfully
      }
      // =====================================================================

      res.json({
        success: true,
        message: 'Document signed successfully',
        data: {
          docusignRequestId: docuSignRequest.Id,
          signedDocumentId: signedDocumentId,
          envelopeId: docuSignRequest.EnvelopeId,
          signerName: signerName,
          signedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error confirming signature:', error.message);
      console.error('Full error:', error);
      res.status(500).json({
        success: false,
        message: 'Error confirming signature: ' + error.message,
        error: error.message
      });
    }
  },

  // 2️⃣3️⃣ SHARE SIGNED DOCUMENT
  shareSignedDocument: async (req, res) => {
    let connection;
    try {
      console.log('=== SHARE SIGNED DOCUMENT ===');
      const { signingToken, recipientEmail, subject, message, documentId } = req.body;

      if (!signingToken || !recipientEmail || !documentId) {
        return res.status(400).json({
          success: false,
          message: 'Signing token, recipient email, and document ID are required'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address'
        });
      }

      connection = await getPool();
      
      let request = connection.request();
      request.input('signingToken', sql.NVarChar, signingToken);

      const tokenResult = await request.query(`
        SELECT dr.Id as docusignRequestId, sd.Id as signedDocumentId, sd.SignerName, ud.FileName
        FROM DocusignRequests dr
        LEFT JOIN SignedDocuments sd ON dr.Id = sd.DocusignRequestId
        LEFT JOIN UploadedDocuments ud ON dr.UploadedDocumentId = ud.Id
        WHERE dr.SigningToken = @signingToken
      `);

      if (tokenResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const docData = tokenResult.recordset[0];

      request = connection.request();
      request.input('docusignRequestId', sql.Int, docData.docusignRequestId);
      request.input('signedDocumentId', sql.Int, docData.signedDocumentId || null);
      request.input('recipientEmail', sql.NVarChar, recipientEmail);
      request.input('subject', sql.NVarChar, subject);
      request.input('message', sql.NVarChar(sql.MAX), message);
      request.input('sharedAt', sql.DateTime, new Date());

      const shareResult = await request.query(`
        INSERT INTO DocumentShares (DocusignRequestId, SignedDocumentId, RecipientEmail, Subject, Message, SharedAt)
        OUTPUT INSERTED.Id
        VALUES (@docusignRequestId, @signedDocumentId, @recipientEmail, @subject, @message, @sharedAt)
      `);

      console.log('✅ Share record created with ID:', shareResult.recordset[0].Id);

      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      const downloadLink = `${backendUrl}/api/msa/documents/signed/${docData.signedDocumentId}/download`;

      const htmlEmailContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333;
                background-color: #f5f5f5;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: white;
                border-radius: 8px;
              }
              .header { 
                background: linear-gradient(135deg, #038a77 0%, #026b5e 100%);
                color: white; 
                padding: 30px 20px; 
                border-radius: 8px 8px 0 0; 
                text-align: center; 
              }
              .header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content { 
                padding: 30px 20px; 
                background-color: #ffffff;
              }
              .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #038a77 0%, #026b5e 100%);
                color: white; 
                padding: 14px 32px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0; 
                font-weight: bold;
                text-align: center;
                font-size: 16px;
              }
              .button:hover {
                opacity: 0.9;
                text-decoration: none;
                color: white;
              }
              .footer { 
                text-align: center; 
                color: #999; 
                font-size: 12px; 
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
              }
              .document-info {
                background-color: #f0fdf4;
                border-left: 4px solid #10b981;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
              }
              .greeting {
                font-size: 16px;
                color: #038a77;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div class="container">
              <div class="header">
                <h2>📄 Signed Document</h2>
              </div>
              
              <div class="content">
                <p class="greeting">Hi there,</p>
                
                <p>${message}</p>
                
                <div class="document-info">
                  <strong>📋 Document:</strong> ${docData.FileName}<br/>
                  <strong>✍️ Signed by:</strong> ${docData.SignerName}<br/>
                  <strong>📅 Signed on:</strong> ${new Date().toLocaleDateString()}
                </div>

                <p style="text-align: center;">
                  <a href="${downloadLink}" class="button">📥 Download Signed Document</a>
                </p>

                <p style="margin-top: 30px; color: #6b7280;">
                  Best regards,<br>
                  <strong>Prophecy MSA System</strong>
                </p>
              </div>
              
              <div class="footer">
                <p>© 2024 Prophecy Technologies. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmailViaSendGrid({
        to: recipientEmail,
        subject: subject,
        html: htmlEmailContent
      });

      console.log('✅ Email sent to:', recipientEmail);

      res.json({
        success: true,
        message: 'Document shared successfully',
        data: {
          recipientEmail: recipientEmail,
          documentName: docData.FileName,
          sharedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error sharing document:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error sharing document',
        error: error.message
      });
    }
  },

  // 2️⃣4️⃣ DOWNLOAD SIGNED DOCUMENT
  downloadSignedDocument: async (req, res) => {
    let connection;
    try {
      const { signedDocumentId } = req.params;
      console.log('📥 Downloading signed document:', signedDocumentId);

      connection = await getPool();
      const request = connection.request();
      request.input('signedDocumentId', sql.Int, parseInt(signedDocumentId));

      const result = await request.query(`
        SELECT sd.*, ud.FileName, ud.FileData, ud.FileType
        FROM SignedDocuments sd
        JOIN UploadedDocuments ud ON sd.UploadedDocumentId = ud.Id
        WHERE sd.Id = @signedDocumentId
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Signed document not found' });
      }

      const signedDoc = result.recordset[0];
      const baseName = (signedDoc.FileName || 'document').replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}_SIGNED_${new Date().toISOString().split('T')[0]}.pdf`;

      // ── CHECK 1: Use browser-generated signed PDF if available ──
      if (signedDoc.SignedFileData && signedDoc.SignedFileData.length > 0) {
        const signedBuf = Buffer.isBuffer(signedDoc.SignedFileData) 
          ? signedDoc.SignedFileData 
          : Buffer.from(signedDoc.SignedFileData);
        
        console.log('✅ Using browser-generated signed PDF. Size:', signedBuf.length);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', signedBuf.length);
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(signedBuf);
      }

      // ── FALLBACK: Try server-side PDF modification ──
      console.log('📄 No browser-generated PDF, trying server-side modification...');

      // Get original file buffer
      let fileBuffer;
      if (Buffer.isBuffer(signedDoc.FileData)) {
        fileBuffer = signedDoc.FileData;
      } else if (typeof signedDoc.FileData === 'string') {
        fileBuffer = Buffer.from(signedDoc.FileData, 'base64');
      } else {
        fileBuffer = Buffer.from(signedDoc.FileData);
      }

      // Parse field data
      let fieldData = [];
      try {
        fieldData = JSON.parse(signedDoc.FieldData || '[]');
      } catch (e) {
        console.warn('Could not parse FieldData:', e.message);
      }

      let isPdf = (signedDoc.FileType || '').includes('pdf') || 
                    (signedDoc.FileName || '').toLowerCase().endsWith('.pdf');

      const contentStr = Buffer.from(fileBuffer).toString('utf8').toLowerCase();
      const isHtml = contentStr.includes('<html') || contentStr.includes('<div') || 
                     contentStr.includes('<p>') || (signedDoc.FileType || '').includes('html') ||
                     (signedDoc.FileName || '').toLowerCase().endsWith('.html');

      // Convert HTML files to PDF on-the-fly
      if (!isPdf && isHtml) {
        try {
          console.log('🔄 Converting HTML doc to PDF for signature embedding...');
          const PDFGenerator = require('../utils/pdfGenerator');
          let htmlContent = Buffer.from(fileBuffer).toString('utf8');

          // INJECT FIELDS DIRECTLY INTO HTML BEFORE PDF GENERATION
          if (fieldData.length > 0) {
             console.log(`🔧 Injecting ${fieldData.length} fields into HTML...`);
             
             // Wrapper to ensure 850px scale and relative positioning match exactly what user saw
             let wrappedHtml = `
               <div id="msa-pdf-root" style="width: 850px; position: relative; background: #fff; margin: 0 auto; overflow: hidden;">
                 ${htmlContent}
                 <div id="msa-signatures-overlay" style="position: absolute; top:0; left:0; width: 850px; height: 100%; pointer-events: none; z-index: 99999;">`;
             
             fieldData.forEach(field => {
                const w = field.width || (field.type === 'signature' || field.type === 'initial' ? 180 : 140);
                const h = field.height || (field.type === 'signature' || field.type === 'initial' ? 56 : 36);

                let content = '';
                if ((field.type === 'signature' || field.type === 'initial') && field.value.startsWith('data:image/')) {
                   content = `<img src="${field.value}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />`;
                } else if (field.value && !field.value.startsWith('data:')) {
                   const fontSize = Math.min(12, h * 0.5);
                   content = `<div style="width: 100%; height: 100%; font-size: ${fontSize}px; font-weight: 600; color: ${field.color || '#1f2937'}; text-align: center; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">${field.value}</div>`;
                }
                wrappedHtml += `<div style="position: absolute; left: ${field.x}px; top: ${field.y}px; width: ${w}px; height: ${h}px; display: flex; align-items: center; justify-content: center; overflow: hidden;">${content}</div>`;
             });
             
             wrappedHtml += `</div></div>`;
             htmlContent = wrappedHtml;
             fieldData = [];
          }

          // Generate PDF matching the 850px width view exactly.
          fileBuffer = await PDFGenerator.generatePDF(htmlContent, {
             fullPage: true,
             width: 850,
             pdfWidth: '850px'
          });
          console.log('✅ HTML to PDF conversion complete. Size:', fileBuffer.length);
          
          // 🔥 Return explicitly as PDF to avoid fallback to raw text/html!
          const outBuf = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Length', outBuf.length);
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.send(outBuf);
        } catch (convertErr) {
          console.error('❌ Failed to convert HTML to PDF:', convertErr.message);
        }
      }

      if (isPdf && fieldData.length > 0) {
        const canvasWidth = 850;
        console.log('🔧 Embedding', fieldData.length, 'fields into PDF...');

        // Helper to calculate page positions and draw fields
        const drawFieldsOnPages = async (pdfDoc, pages) => {
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const pageRanges = [];
          let cumH = 0;
          for (const page of pages) {
            const { width, height } = page.getSize();
            const ch = height * (canvasWidth / width);
            pageRanges.push({ page, pdfWidth: width, pdfHeight: height, canvasStart: cumH, canvasEnd: cumH + ch });
            cumH += ch;
          }

          let count = 0;
          for (const field of fieldData) {
            if (!field.value) continue;
            const pr = pageRanges.find(p => field.y >= p.canvasStart && field.y < p.canvasEnd) || pageRanges[pageRanges.length - 1];
            const scale = pr.pdfWidth / canvasWidth;
            const pdfX = field.x * scale;
            const localY = field.y - pr.canvasStart;
            const fH = (field.height || 36) * scale;
            const fW = (field.width || 150) * scale;
            const pdfY = pr.pdfHeight - (localY * scale) - fH;

            if ((field.type === 'signature' || field.type === 'initial') && field.value && field.value.startsWith('data:image/png')) {
              try {
                const sigImg = await pdfDoc.embedPng(Buffer.from(field.value.split(',')[1], 'base64'));
                pr.page.drawImage(sigImg, { x: pdfX, y: pdfY, width: fW, height: fH });
                count++;
                console.log(`  ✅ ${field.type} at (${Math.round(pdfX)},${Math.round(pdfY)})`);
              } catch (e) { console.warn(`  ⚠️ img error: ${e.message}`); }
            } else if (field.value && typeof field.value === 'string' && !field.value.startsWith('data:')) {
              try {
                pr.page.drawText(String(field.value), { x: pdfX + 3, y: pdfY + fH / 3, size: Math.min(11, fH * 0.5), font, color: rgb(0.1, 0.1, 0.15) });
                count++;
              } catch (e) { console.warn(`  ⚠️ text error: ${e.message}`); }
            }
          }

          if (signedDoc.SignerName && pages.length > 0) {
            try {
              const lastPage = pages[pages.length - 1];
              const { width: pW, height: pH } = lastPage.getSize();
              lastPage.drawText(`Digitally signed by: ${signedDoc.SignerName} | ${new Date(signedDoc.CreatedAt || Date.now()).toLocaleDateString()}`, { 
                x: 50, 
                y: 20, 
                size: 8, 
                font, 
                color: rgb(0.4, 0.4, 0.4) 
              });
            } catch (e) {}
          }
          return count;
        };

        // ── TRY 1: Modify original PDF in-place (no copying) ──
        try {
          console.log('  📌 Try 1: In-place modification...');
          const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true, updateMetadata: false });
          const count = await drawFieldsOnPages(pdfDoc, pdfDoc.getPages());
          console.log(`  📄 Drew ${count} fields. Saving...`);
          
          let buf;
          try { buf = Buffer.from(await pdfDoc.save({ useObjectStreams: false })); }
          catch (e) { buf = Buffer.from(await pdfDoc.save()); }

          console.log('  ✅ In-place save OK! Size:', buf.length);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Length', buf.length);
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.send(buf);
        } catch (e1) {
          console.warn('  ⚠️ Try 1 failed:', e1.message);
        }

        // ── TRY 2: embedPdf pages into fresh document ──
        try {
          console.log('  📌 Try 2: embedPdf to fresh doc...');
          const origPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
          const newPdf = await PDFDocument.create();

          for (let i = 0; i < origPdf.getPageCount(); i++) {
            try {
              const [emb] = await newPdf.embedPdf(origPdf, [i]);
              const { width, height } = emb.size();
              const page = newPdf.addPage([width, height]);
              page.drawPage(emb, { x: 0, y: 0, width, height });
            } catch (pe) {
              // If single page fails, add blank page with same size
              const orig = origPdf.getPage(i);
              const { width, height } = orig.getSize();
              newPdf.addPage([width, height]);
            }
          }

          const count = await drawFieldsOnPages(newPdf, newPdf.getPages());
          const buf = Buffer.from(await newPdf.save());
          console.log(`  ✅ embedPdf OK! ${count} fields, ${newPdf.getPageCount()} pages, Size: ${buf.length}`);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Length', buf.length);
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.send(buf);
        } catch (e2) {
          console.warn('  ⚠️ Try 2 failed:', e2.message);
        }

        // ── TRY 3: copyPages to fresh document ──
        try {
          console.log('  📌 Try 3: copyPages to fresh doc...');
          const origPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
          const newPdf = await PDFDocument.create();
          const copied = await newPdf.copyPages(origPdf, origPdf.getPageIndices());
          copied.forEach(p => newPdf.addPage(p));
          const count = await drawFieldsOnPages(newPdf, newPdf.getPages());
          const buf = Buffer.from(await newPdf.save({ useObjectStreams: false }));
          console.log(`  ✅ copyPages OK! ${count} fields, Size: ${buf.length}`);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Length', buf.length);
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.send(buf);
        } catch (e3) {
          console.warn('  ⚠️ Try 3 failed:', e3.message);
        }

        console.log('  ❌ All PDF modification approaches failed. Returning original.');
      }

      // Return original file
      console.log('📄 Returning original file');
      res.setHeader('Content-Type', signedDoc.FileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(fileBuffer);

    } catch (error) {
      console.error('❌ Error downloading document:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error downloading document',
        error: error.message
      });
    }
  },

  // 2️⃣5️⃣ GET DOCUMENT BY SIGNING TOKEN
  getDocumentBySigningToken: async (req, res) => {
    let connection;
    try {
      const { signingToken } = req.params;
      console.log('=== GET DOCUMENT BY SIGNING TOKEN ===', signingToken);

      connection = await getPool();
      const request = connection.request();
      request.input('signingToken', sql.NVarChar, signingToken);

      const query = `
        SELECT 
          dr.Id as requestId,
          dr.UploadedDocumentId,
          dr.EnvelopeId,
          dr.RecipientEmail,
          dr.RecipientName,
          dr.Status,
          dr.FieldData,
          ud.FileName,
          ud.FileData,
          ud.FileType
        FROM DocusignRequests dr
        INNER JOIN UploadedDocuments ud ON dr.UploadedDocumentId = ud.Id
        WHERE dr.SigningToken = @signingToken
      `;

      console.log('Executing query with token:', signingToken);
      const result = await request.query(query);

      if (result.recordset.length === 0) {
        console.log('❌ No document found for token:', signingToken);
        return res.status(404).json({
          success: false,
          message: 'Document not found or token expired'
        });
      }

      const docData = result.recordset[0];
      console.log('✅ Document found:', docData.FileName);
      
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      const fileUrl = `${backendUrl}/api/msa/documents/upload/${docData.UploadedDocumentId}/preview`;

      // Parse stored field positions
      let placedFields = [];
      if (docData.FieldData) {
        try {
          placedFields = JSON.parse(docData.FieldData);
        } catch (e) {
          console.warn('Could not parse FieldData:', e.message);
        }
      }

      res.json({
        success: true,
        data: {
          documentId: docData.UploadedDocumentId,
          fileName: docData.FileName,
          fileUrl: fileUrl,
          recipientEmail: docData.RecipientEmail,
          recipientName: docData.RecipientName,
          envelopeId: docData.EnvelopeId,
          status: docData.Status,
          fields: placedFields
        }
      });

    } catch (error) {
      console.error('❌ Error getting document:', error.message);
      console.error('Full error details:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving document: ' + error.message,
        error: error.message
      });
    }
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

module.exports = msaController;