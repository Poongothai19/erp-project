// Accounts/controllers/accountsController.js
const sql = require('mssql');
const { dbConfig } = require('../../config/db');
const fs = require('fs');
const path = require('path');

const getEmployeeTable = (companyId) => {
  const tableMap = {
    5: 'CognifyarEmployees',
    3: 'ProphecyOffshoreEmployees', 
    2: 'ProphecyConsultingEmployees'
  };
  return tableMap[parseInt(companyId)] || 'CognifyarEmployees';
};

const accountsController = {
  
  // Get current logged-in employee details with company info (hrm schema aligned)
  getMyEmployeeDetails: async (req, res) => {
    try {
      console.log('=== GET MY EMPLOYEE DETAILS (HRM SCHEMA) ===');
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      // 1. Get User and linked EmployeeId
      const userRequest = new sql.Request();
      userRequest.input('userId', sql.Int, userId);
      const userResult = await userRequest.query(`
        SELECT id, username, EmployeeId FROM userinfo WHERE id = @userId
      `);

      if (userResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const { EmployeeId: employeeId } = userResult.recordset[0];

      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID not linked' });
      }

      // 2. Fetch from centralized hrm.Employee table with Candidate join
      const empRequest = new sql.Request();
      // Use NVarChar to avoid conversion errors with alphanumeric codes like 'PC9879'
      empRequest.input('employeeId', sql.NVarChar, employeeId);
      const empResult = await empRequest.query(`
        SELECT 
          e.EmployeeId as Id,
          e.EmployeeId,
          e.EmployeeCode as employeeId,
          e.EntityId as CompanyId,
          TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name,
          ci_email.IdentityValue as Email,
          c.JobTitle as Position,
          e.EmploymentStatus,
          e.TimePunchEnabled,
          ent.EntityName as companyName
        FROM [hrm].[Employee] e
        JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
        LEFT JOIN [core].[Entity] ent ON e.EntityId = ent.EntityId
        WHERE e.EmployeeCode = @employeeId AND e.IsDeleted = 0
      `);

      if (empResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee record not found in system' });
      }

      const employeeData = empResult.recordset[0];
      console.log('✅ Employee found:', employeeData.Name);

      res.json({
        success: true,
        data: {
          employee: employeeData,
          company: {
             id: employeeData.CompanyId,
             name: employeeData.companyName
          },
          userId: userId
        }
      });

    } catch (error) {
      console.error('Get employee details error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employee details',
        error: error.message
      });
    }
  },

  // Get employee statements
  getMyStatements: async (req, res) => {
    try {
      console.log('=== GET MY STATEMENTS ===');
      const userId = req.user?.id;
      const { companyId, employeeId } = req.query;

      console.log('User ID:', userId);
      console.log('Company ID:', companyId);
      console.log('Employee ID:', employeeId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      const request = new sql.Request();
      request.input('employeeId', sql.NVarChar, employeeId);

      const result = await request.query(`
        SELECT * FROM EmployeePayStructure 
        WHERE EmployeeId = @employeeId
        ORDER BY CheckDate DESC
      `);

      console.log('✅ Statements found:', result.recordset.length);

      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });

    } catch (error) {
      console.error('Get statements error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching statements',
        error: error.message
      });
    }
  },

  // Get employee reports
  getMyReports: async (req, res) => {
    try {
      console.log('=== GET MY REPORTS ===');
      const userId = req.user?.id;
      const { employeeId } = req.query;

      console.log('User ID:', userId);
      console.log('Employee ID:', employeeId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      const request = new sql.Request();
      request.input('employeeId', sql.NVarChar, employeeId);

      const result = await request.query(`
        SELECT 
          Id,
          EmployeeId,
          FileName,
          FilePath,
          Description,
          Type,
          UploadDate
        FROM EmployeeReports 
        WHERE EmployeeId = @employeeId
        ORDER BY UploadDate DESC
      `);

      console.log('✅ Reports found:', result.recordset.length);

      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });

    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reports',
        error: error.message
      });
    }
  },

  // Download report file
  downloadReport: async (req, res) => {
    try {
      console.log('=== DOWNLOAD REPORT ===');
      const userId = req.user?.id;
      const reportId = req.params.id;

      console.log('User ID:', userId);
      console.log('Report ID:', reportId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      // Get report details with user info
      const request = new sql.Request();
      request.input('reportId', sql.Int, reportId);
      request.input('userId', sql.Int, userId);
      
      const result = await request.query(`
        SELECT 
          er.*,
          u.EmployeeId as UserEmployeeId
        FROM EmployeeReports er
        CROSS JOIN userinfo u 
        WHERE er.Id = @reportId AND u.id = @userId
      `);

      if (result.recordset.length === 0) {
        console.log('❌ Report not found in database');
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      const report = result.recordset[0];
      console.log('📋 Report details:', {
        Id: report.Id,
        FileName: report.FileName,
        FilePath: report.FilePath,
        ReportEmployeeId: report.EmployeeId,
        UserEmployeeId: report.UserEmployeeId
      });

      // Check authorization
      if (!report.UserEmployeeId) {
        console.log('❌ User not found or no EmployeeId');
        return res.status(403).json({
          success: false,
          message: 'User not authorized'
        });
      }

      if (report.EmployeeId !== report.UserEmployeeId) {
        console.log('❌ Authorization failed: Employee IDs do not match');
        return res.status(403).json({
          success: false,
          message: 'Not authorized to download this report'
        });
      }

      // Check if file path exists
      if (!report.FilePath) {
        console.log('❌ No file path in database');
        return res.status(404).json({
          success: false,
          message: 'File path not available in database'
        });
      }

      console.log('📄 File path found:', report.FilePath);

      // Determine content type based on file extension
      const getContentType = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        const typeMap = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'txt': 'text/plain',
          'csv': 'text/csv'
        };
        return typeMap[ext] || 'application/octet-stream';
      };

      const contentType = getContentType(report.FileName);
      const fileName = report.FileName || `report-${report.Id}.pdf`;

      // Set headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`📤 Serving file from path: ${report.FilePath}`);

      let filePath = report.FilePath;
      
      // If it's a relative path, make it absolute
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(__dirname, '../../', filePath);
      }
      
      console.log('📁 Resolved file path:', filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log('❌ File not found at path:', filePath);
        
        // Try alternative locations
        const alternativePaths = [
          filePath,
          path.join(__dirname, '../../uploads/reports/', path.basename(report.FilePath)),
          path.join(__dirname, '../../uploads/reports/', report.FileName),
          path.join(process.cwd(), 'uploads/reports/', path.basename(report.FilePath)),
          path.join(process.cwd(), 'uploads/reports/', report.FileName)
        ];
        
        let foundPath = null;
        for (const altPath of alternativePaths) {
          console.log('🔍 Checking alternative path:', altPath);
          if (fs.existsSync(altPath)) {
            foundPath = altPath;
            console.log('✅ Found file at alternative path:', foundPath);
            break;
          }
        }
        
        if (!foundPath) {
          console.log('❌ File not found in any alternative location');
          return res.status(404).json({
            success: false,
            message: 'File not found on server'
          });
        }
        
        filePath = foundPath;
      }

      console.log('✅ File found, sending...');
      
      // Send the file
      return res.sendFile(filePath, (err) => {
        if (err) {
          console.error('❌ Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error sending file',
              error: err.message
            });
          }
        } else {
          console.log('✅ File sent successfully');
        }
      });

    } catch (error) {
      console.error('❌ Download report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading report',
        error: error.message
      });
    }
  },

  // Get report download URL/info
  getReportDownloadUrl: async (req, res) => {
    try {
      console.log('=== GET REPORT DOWNLOAD URL ===');
      const userId = req.user?.id;
      const reportId = req.params.id;

      console.log('User ID:', userId);
      console.log('Report ID:', reportId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      // Get report details
      const request = new sql.Request();
      request.input('reportId', sql.Int, reportId);
      request.input('userId', sql.Int, userId);
      
      const result = await request.query(`
        SELECT 
          er.*,
          u.EmployeeId as UserEmployeeId
        FROM EmployeeReports er
        CROSS JOIN userinfo u 
        WHERE er.Id = @reportId AND u.id = @userId
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      const report = result.recordset[0];

      // Check authorization
      if (!report.UserEmployeeId || report.EmployeeId !== report.UserEmployeeId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this report'
        });
      }

      // Return the download info
      res.json({
        success: true,
        data: {
          downloadUrl: `/api/accounts/download-report/${report.Id}`,
          fileName: report.FileName,
          filePath: report.FilePath,
          uploadDate: report.UploadDate
        }
      });

    } catch (error) {
      console.error('Get report URL error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting report URL',
        error: error.message
      });
    }
  },

  // Debug endpoint to check report details
  getReportDebug: async (req, res) => {
    try {
      const reportId = req.params.id;
      console.log('=== DEBUG REPORT ===');
      console.log('Report ID:', reportId);

      await sql.connect(dbConfig);

      const request = new sql.Request();
      request.input('reportId', sql.Int, reportId);
      
      const result = await request.query(`
        SELECT 
          Id,
          EmployeeId,
          FileName,
          FilePath,
          Description,
          Type,
          UploadDate
        FROM EmployeeReports 
        WHERE Id = @reportId
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      const report = result.recordset[0];
      console.log('Report debug data:', report);

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Debug report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error debugging report',
        error: error.message
      });
    }
  },

  // Upload report (for future use)
  uploadReport: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { employeeId, description, reportType } = req.body;
      const file = req.file;

      console.log('=== UPLOAD REPORT ===');
      console.log('User ID:', userId);
      console.log('Employee ID:', employeeId);
      console.log('File:', file);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      await sql.connect(dbConfig);

      // Verify user has permission to upload for this employee
      const userRequest = new sql.Request();
      userRequest.input('userId', sql.Int, userId);
      const userResult = await userRequest.query(`
        SELECT EmployeeId FROM userinfo WHERE id = @userId
      `);

      if (userResult.recordset.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'User not authorized'
        });
      }

      const userEmployeeId = userResult.recordset[0].EmployeeId;
      if (userEmployeeId !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload reports for this employee'
        });
      }

      // Generate file path
      const uploadsDir = path.join(__dirname, '../../uploads/reports');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `report-${Date.now()}-${Math.floor(Math.random() * 1000000)}.${file.originalname.split('.').pop()}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file to uploads directory
      fs.writeFileSync(filePath, file.buffer);

      const request = new sql.Request();
      request.input('EmployeeId', sql.NVarChar, employeeId);
      request.input('FileName', sql.NVarChar, file.originalname);
      request.input('FilePath', sql.NVarChar, `uploads/reports/${fileName}`);
      request.input('Description', sql.NVarChar, description || '');
      request.input('Type', sql.NVarChar, reportType || 'General');
      request.input('UploadDate', sql.DateTime, new Date());

      const result = await request.query(`
        INSERT INTO EmployeeReports 
        (EmployeeId, FileName, FilePath, Description, Type, UploadDate)
        OUTPUT INSERTED.*
        VALUES (@EmployeeId, @FileName, @FilePath, @Description, @Type, @UploadDate)
      `);

      const uploadedReport = result.recordset[0];
      console.log('✅ Report uploaded, ID:', uploadedReport.Id);

      res.json({
        success: true,
        message: 'Report uploaded successfully',
        data: {
          id: uploadedReport.Id,
          fileName: uploadedReport.FileName,
          uploadDate: uploadedReport.UploadDate
        }
      });

    } catch (error) {
      console.error('Upload report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading report',
        error: error.message
      });
    }
  },

  // Delete report
  deleteReport: async (req, res) => {
    try {
      const userId = req.user?.id;
      const reportId = req.params.id;

      console.log('=== DELETE REPORT ===');
      console.log('User ID:', userId);
      console.log('Report ID:', reportId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      // Check if report exists and user has permission
      const checkRequest = new sql.Request();
      checkRequest.input('reportId', sql.Int, reportId);
      checkRequest.input('userId', sql.Int, userId);
      
      const checkResult = await checkRequest.query(`
        SELECT er.*, u.EmployeeId as UserEmployeeId
        FROM EmployeeReports er
        CROSS JOIN userinfo u 
        WHERE er.Id = @reportId AND u.id = @userId
      `);

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      const report = checkResult.recordset[0];
      
      // Check authorization
      if (!report.UserEmployeeId || report.EmployeeId !== report.UserEmployeeId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this report'
        });
      }

      // Delete the file from file system if it exists
      if (report.FilePath) {
        try {
          let filePath = report.FilePath;
          if (!path.isAbsolute(filePath)) {
            filePath = path.join(__dirname, '../../', filePath);
          }
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('✅ File deleted from file system:', filePath);
          }
        } catch (fileError) {
          console.warn('⚠️ Could not delete file from file system:', fileError.message);
        }
      }

      // Delete the report from database
      const deleteRequest = new sql.Request();
      deleteRequest.input('reportId', sql.Int, reportId);
      
      await deleteRequest.query(`
        DELETE FROM EmployeeReports WHERE Id = @reportId
      `);

      console.log('✅ Report deleted from database:', reportId);

      res.json({
        success: true,
        message: 'Report deleted successfully'
      });

    } catch (error) {
      console.error('Delete report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting report',
        error: error.message
      });
    }
  },

  // Get employee benefits
  getMyBenefits: async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      // Get user employee ID
      const userRequest = new sql.Request();
      userRequest.input('userId', sql.Int, userId);
      const userResult = await userRequest.query(`
        SELECT EmployeeId FROM userinfo WHERE id = @userId
      `);

      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const employeeId = userResult.recordset[0].EmployeeId;

      // Placeholder - implement based on your benefits data structure
      // This is a sample implementation - adjust based on your actual benefits table
      const benefitsRequest = new sql.Request();
      benefitsRequest.input('employeeId', sql.NVarChar, employeeId);
      
      try {
        const benefitsResult = await benefitsRequest.query(`
          SELECT * FROM EmployeeBenefits WHERE EmployeeId = @employeeId
        `);

        res.json({
          success: true,
          data: benefitsResult.recordset
        });
      } catch (error) {
        // If benefits table doesn't exist, return placeholder data
        console.log('Benefits table not found, returning placeholder data');
        const benefits = [
          {
            id: 1,
            name: 'Health Insurance',
            provider: 'Blue Cross',
            status: 'Active',
            coverage: 'Family',
            startDate: '2023-01-15',
            endDate: '2024-12-31'
          },
          {
            id: 2,
            name: 'Dental Insurance', 
            provider: 'Delta Dental',
            status: 'Active',
            coverage: 'Individual',
            startDate: '2023-01-15',
            endDate: '2024-12-31'
          },
          {
            id: 3,
            name: '401(k) Retirement Plan',
            provider: 'Fidelity',
            status: 'Active',
            coverage: 'N/A',
            startDate: '2023-01-15'
          }
        ];

        res.json({
          success: true,
          data: benefits
        });
      }

    } catch (error) {
      console.error('Get benefits error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching benefits',
        error: error.message
      });
    }
  },

  // Get immigration documents
  getMyImmigration: async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      // Get user employee ID
      const userRequest = new sql.Request();
      userRequest.input('userId', sql.Int, userId);
      const userResult = await userRequest.query(`
        SELECT EmployeeId FROM userinfo WHERE id = @userId
      `);

      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const employeeId = userResult.recordset[0].EmployeeId;

      // Placeholder - implement based on your immigration data structure
      // This is a sample implementation - adjust based on your actual immigration table
      const immigrationRequest = new sql.Request();
      immigrationRequest.input('employeeId', sql.NVarChar, employeeId);
      
      try {
        const immigrationResult = await immigrationRequest.query(`
          SELECT * FROM EmployeeImmigration WHERE EmployeeId = @employeeId
        `);

        res.json({
          success: true,
          data: immigrationResult.recordset
        });
      } catch (error) {
        // If immigration table doesn't exist, return placeholder data
        console.log('Immigration table not found, returning placeholder data');
        const documents = [
          {
            id: 1,
            type: 'Work Visa',
            number: 'H1B-123456',
            issued: '2023-01-15',
            expires: '2026-01-15',
            status: 'Active',
            category: 'H-1B Specialty Occupation'
          },
          {
            id: 2,
            type: 'I-94 Travel Record',
            number: 'I94-789012',
            issued: '2023-01-15',
            expires: '2026-01-15',
            status: 'Active',
            category: 'Arrival/Departure Record'
          }
        ];

        res.json({
          success: true,
          data: documents
        });
      }

    } catch (error) {
      console.error('Get immigration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching immigration documents',
        error: error.message
      });
    }
  },

  // Get account summary
  getAccountSummary: async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await sql.connect(dbConfig);

      // Get user employee ID
      const userRequest = new sql.Request();
      userRequest.input('userId', sql.Int, userId);
      const userResult = await userRequest.query(`
        SELECT EmployeeId FROM userinfo WHERE id = @userId
      `);

      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const employeeId = userResult.recordset[0].EmployeeId;

      // Get counts for different sections
      const reportsRequest = new sql.Request();
      reportsRequest.input('employeeId', sql.NVarChar, employeeId);
      const reportsResult = await reportsRequest.query(`
        SELECT COUNT(*) as count FROM EmployeeReports WHERE EmployeeId = @employeeId
      `);

      const statementsRequest = new sql.Request();
      statementsRequest.input('employeeId', sql.NVarChar, employeeId);
      const statementsResult = await statementsRequest.query(`
        SELECT COUNT(*) as count FROM EmployeePayStructure WHERE EmployeeId = @employeeId
      `);

      res.json({
        success: true,
        data: {
          reportsCount: reportsResult.recordset[0].count,
          statementsCount: statementsResult.recordset[0].count,
          benefitsCount: 3, // Placeholder
          immigrationCount: 2 // Placeholder
        }
      });

    } catch (error) {
      console.error('Get account summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching account summary',
        error: error.message
      });
    }
  }
};

module.exports = accountsController;