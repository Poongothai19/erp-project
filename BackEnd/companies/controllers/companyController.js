// controllers/companyController.js - Complete Company Controller with All Functionality
const sql = require('mssql');
const { dbConfig, poolPromise } = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

// Helper function to calculate days until due date
const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const companyController = {
  // Test database connection method
  testConnection: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const result = await sql.query('SELECT 1 as test');
      res.json({
        success: true,
        message: 'Database connection successful',
        data: result.recordset
      });
    } catch (error) {
      console.error('Database connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      });
    }
  },



getAllCompanies: async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const { status, type, manager, search, limit, offset } = req.query;
    
    // First, get all entities with filters
    let query = `
      SELECT e.EntityId AS Id,
             e.EntityName AS Name,
             e.EntityCode AS ClientId,
             (SELECT TOP 1 a.Line1 + ' ' + ISNULL(a.Line2, '') + ' ' + ISNULL(a.PostalCode, '') 
              FROM core.EntityAddress ea 
              JOIN core.Address a ON ea.AddressId = a.AddressId 
              WHERE ea.EntityId = e.EntityId AND ea.IsPrimary = 1) AS Address,
             NULL AS Type, -- Not in core.Entity
             (SELECT TOP 1 u.FirstName + ' ' + u.LastName 
              FROM core.UserRole ur 
              JOIN core.[User] u ON ur.UserId = u.UserId 
              WHERE ur.EntityId = e.EntityId AND ur.RoleCode = 'ACCOUNT_MANAGER' AND ur.IsActive = 1) AS AccountManager,
             (SELECT COUNT(*) FROM hrm.Employee WHERE EntityId = e.EntityId AND EmploymentStatus = 'Active' AND IsDeleted = 0) AS Employees,
             NULL AS PayrollDueDate, -- Not in core.Entity
             NULL AS NextCheckDate,   -- Not in core.Entity
             CASE WHEN e.IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS Status,
             e.CreatedAtUtc AS CreatedAt,
             e.UpdatedAtUtc AS UpdatedAt,
             0 AS DaysUntilPayrollDue,
             0 AS DaysUntilNextCheck
      FROM core.Entity e
      WHERE e.IsDeleted = 0
    `;
    let inputs = [];
    
    if (status && status !== 'all') {
      query += ' AND e.IsActive = @isActive';
      inputs.push({ name: 'isActive', type: sql.Bit, value: status === 'Active' ? 1 : 0 });
    }
    
    // Type is no longer supported in the new schema, but we'll keep the filter for compatibility if needed
    // if (type && type !== 'all') { ... }
    
    if (search) {
      query += ` AND (e.EntityName LIKE @search 
                    OR e.EntityCode LIKE @search)`;
      inputs.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
    }
    
    query += ' ORDER BY e.CreatedAtUtc DESC';
    
    if (limit) {
      query += ` OFFSET ${offset || 0} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }
    
    const request = new sql.Request();
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    console.log('Executing getAllCompanies query...');
    const result = await request.query(query);
    console.log(`Query successful, found ${result.recordset.length} companies.`);
    const companies = result.recordset;
    
    // Map database fields to frontend expected fields
    const companiesWithMapping = companies.map(company => ({
        ...company,
        id: company.Id,
        name: company.Name,
        clientId: company.ClientId,
        address: company.Address,
        type: company.Type,
        accountManager: company.AccountManager,
        status: company.Status,
        employees: company.Employees,
        payrollDueDate: company.PayrollDueDate,
        nextCheckDate: company.NextCheckDate,
        createdAt: company.CreatedAt,
        updatedAt: company.UpdatedAt,
        daysUntilPayrollDue: company.DaysUntilPayrollDue,
        daysUntilNextCheck: company.DaysUntilNextCheck,
        logoPath: null // Not in core.Entity
    }));
    
    res.json({
      success: true,
      data: companiesWithMapping,
      count: companiesWithMapping.length
    });
  } catch (error) {
    console.error('❌ Get all companies error:', error);
    console.error('SQL State:', error.state);
    console.error('Error Code:', error.code);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving companies from core.Entity', 
      error: error.message 
    });
  }
},

  // Get single company by ID
getCompanyById: async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const { id } = req.params;
    
    const request = new sql.Request();
    request.input('id', sql.BigInt, id);
    
    const result = await request.query(`
      SELECT e.EntityId AS Id,
             e.EntityName AS Name,
             e.EntityCode AS ClientId,
             (SELECT TOP 1 a.Line1 + ' ' + ISNULL(a.Line2, '') + ' ' + ISNULL(a.PostalCode, '') 
              FROM core.EntityAddress ea 
              JOIN core.Address a ON ea.AddressId = a.AddressId 
              WHERE ea.EntityId = e.EntityId AND ea.IsPrimary = 1) AS Address,
             NULL AS Type,
             (SELECT TOP 1 u.FirstName + ' ' + u.LastName 
              FROM core.UserRole ur 
              JOIN core.[User] u ON ur.UserId = u.UserId 
              WHERE ur.EntityId = e.EntityId AND ur.RoleCode = 'ACCOUNT_MANAGER' AND ur.IsActive = 1) AS AccountManager,
             (SELECT COUNT(*) FROM hrm.Employee WHERE EntityId = e.EntityId AND EmploymentStatus = 'Active') AS Employees,
             NULL AS PayrollDueDate,
             NULL AS NextCheckDate,
             CASE WHEN e.IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS Status,
             e.CreatedAtUtc AS CreatedAt,
             e.UpdatedAtUtc AS UpdatedAt,
             0 AS DaysUntilPayrollDue,
             0 AS DaysUntilNextCheck
      FROM core.Entity e
      WHERE e.EntityId = @id AND e.IsDeleted = 0
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    const company = result.recordset[0];
    
    // Map database fields to frontend expected fields
    const mappedCompany = {
      ...company,
      id: company.Id,
      name: company.Name,
      clientId: company.ClientId,
      address: company.Address,
      type: company.Type,
      accountManager: company.AccountManager,
      employees: company.Employees,
      status: company.Status,
      payrollDueDate: company.PayrollDueDate,
      nextCheckDate: company.NextCheckDate,
      createdAt: company.CreatedAt,
      updatedAt: company.UpdatedAt,
      daysUntilPayrollDue: company.DaysUntilPayrollDue,
      daysUntilNextCheck: company.DaysUntilNextCheck,
      logoPath: null
    };
    
    res.json({
      success: true,
      data: mappedCompany
    });
  } catch (error) {
    console.error('Get company by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving company from core.Entity', 
      error: error.message 
    });
  }
},

  createCompany: async (req, res) => {
    let connection;
    try {
      console.log('Creating company with address support');
      
      connection = await sql.connect(dbConfig);
      
      const {
        name, clientId, address, status = 'Active'
      } = req.body;

      // Validate required fields
      if (!name || !clientId) {
        return res.status(400).json({
          success: false,
          message: 'Name and Entity Code (Client ID) are required fields'
        });
      }

      // Check if EntityCode already exists
      const checkRequest = new sql.Request();
      checkRequest.input('clientId', sql.NVarChar, clientId);
      const checkResult = await checkRequest.query('SELECT EntityId FROM core.Entity WHERE EntityCode = @clientId');
      
      if (checkResult.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Company with this Entity Code already exists'
        });
      }
      
      // Start Transaction
      const transaction = new sql.Transaction(connection);
      await transaction.begin();
      
      try {
        // 1. Insert into core.Entity
        const entityRequest = new sql.Request(transaction);
        entityRequest.input('name', sql.NVarChar, name.trim());
        entityRequest.input('clientId', sql.NVarChar, clientId.trim());
        entityRequest.input('isActive', sql.Bit, status === 'Active' ? 1 : 0);
        entityRequest.input('createdAt', sql.DateTime2, new Date());
        
        const entityResult = await entityRequest.query(`
          INSERT INTO core.Entity (EntityName, EntityCode, IsActive, CreatedAtUtc)
          OUTPUT INSERTED.EntityId
          VALUES (@name, @clientId, @isActive, @createdAt)
        `);
        
        const entityId = entityResult.recordset[0].EntityId;
        
        // 2. Insert into core.Address if provided
        if (address && address.trim()) {
          const addressRequest = new sql.Request(transaction);
          addressRequest.input('line1', sql.NVarChar, address.trim());
          
          const addressResult = await addressRequest.query(`
            INSERT INTO core.Address (Line1)
            OUTPUT INSERTED.AddressId
            VALUES (@line1)
          `);
          
          const addressId = addressResult.recordset[0].AddressId;
          
          // 3. Link Entity and Address
          const linkRequest = new sql.Request(transaction);
          linkRequest.input('entityId', sql.BigInt, entityId);
          linkRequest.input('addressId', sql.BigInt, addressId);
          
          await linkRequest.query(`
            INSERT INTO core.EntityAddress (EntityId, AddressId, EntityType, IsPrimary)
            VALUES (@entityId, @addressId, 'COMPANY', 1)
          `);
        }
        
        await transaction.commit();
        
        // Return the created entity via getCompanyById logic
        req.params.id = entityId;
        return companyController.getCompanyById(req, res);
        
      } catch (err) {
        if (transaction) await transaction.rollback();
        throw err;
      }
      
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating company with address', 
        error: error.message
      });
    }
  },

  updateCompany: async (req, res) => {
    let connection;
    try {
      console.log('Updating company with address support');
      
      connection = await sql.connect(dbConfig);
      const { id } = req.params;
      
      const {
        name, clientId, address, status
      } = req.body;
      
      // Validate required fields
      if (!name || !clientId) {
        return res.status(400).json({
          success: false,
          message: 'Name and Entity Code (Client ID) are required fields'
        });
      }
      
      // Check if entity exists
      const checkRequest = new sql.Request();
      checkRequest.input('id', sql.BigInt, id);
      const checkResult = await checkRequest.query('SELECT EntityId FROM core.Entity WHERE EntityId = @id AND IsDeleted = 0');
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found' 
        });
      }
      
      // Check if EntityCode already exists for other entities
      const clientCheckRequest = new sql.Request();
      clientCheckRequest.input('clientId', sql.NVarChar, clientId);
      clientCheckRequest.input('id', sql.BigInt, id);
      const clientCheckResult = await clientCheckRequest.query(
        'SELECT EntityId FROM core.Entity WHERE EntityCode = @clientId AND EntityId != @id'
      );
      
      if (clientCheckResult.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Another company with this Entity Code already exists'
        });
      }
      
      // Start Transaction
      const transaction = new sql.Transaction(connection);
      await transaction.begin();
      
      try {
        // 1. Update core.Entity
        const updateRequest = new sql.Request(transaction);
        updateRequest.input('id', sql.BigInt, id);
        updateRequest.input('name', sql.NVarChar, name.trim());
        updateRequest.input('clientId', sql.NVarChar, clientId.trim());
        updateRequest.input('isActive', sql.Bit, status === 'Active' ? 1 : 0);
        updateRequest.input('updatedAt', sql.DateTime2, new Date());
        
        await updateRequest.query(`
          UPDATE core.Entity 
          SET EntityName = @name, 
              EntityCode = @clientId, 
              IsActive = @isActive, 
              UpdatedAtUtc = @updatedAt
          WHERE EntityId = @id
        `);
        
        // 2. Handle Address update
        if (address !== undefined) {
          // Check if primary address exists
          const addrCheckRequest = new sql.Request(transaction);
          addrCheckRequest.input('entityId', sql.BigInt, id);
          const addrResult = await addrCheckRequest.query(`
            SELECT TOP 1 a.AddressId 
            FROM core.EntityAddress ea 
            JOIN core.Address a ON ea.AddressId = a.AddressId 
            WHERE ea.EntityId = @entityId AND ea.IsPrimary = 1
          `);
          
          if (addrResult.recordset.length > 0) {
            // Update existing address
            const addressId = addrResult.recordset[0].AddressId;
            const addrUpdateRequest = new sql.Request(transaction);
            addrUpdateRequest.input('addressId', sql.BigInt, addressId);
            addrUpdateRequest.input('line1', sql.NVarChar, (address || '').trim());
            
            await addrUpdateRequest.query(`
              UPDATE core.Address SET Line1 = @line1 WHERE AddressId = @addressId
            `);
          } else if (address && address.trim()) {
            // Create new address
            const addrInsertRequest = new sql.Request(transaction);
            addrInsertRequest.input('line1', sql.NVarChar, address.trim());
            
            const newAddrResult = await addrInsertRequest.query(`
              INSERT INTO core.Address (Line1) OUTPUT INSERTED.AddressId VALUES (@line1)
            `);
            
            const newAddressId = newAddrResult.recordset[0].AddressId;
            
            // Link it
            const addrLinkRequest = new sql.Request(transaction);
            addrLinkRequest.input('entityId', sql.BigInt, id);
            addrLinkRequest.input('addressId', sql.BigInt, newAddressId);
            
            await addrLinkRequest.query(`
              INSERT INTO core.EntityAddress (EntityId, AddressId, EntityType, IsPrimary) VALUES (@entityId, @addressId, 'COMPANY', 1)
            `);
          }
        }
        
        await transaction.commit();
        
        // Return updated entity via getCompanyById logic
        req.params.id = id;
        return companyController.getCompanyById(req, res);
        
      } catch (err) {
        if (transaction) await transaction.rollback();
        throw err;
      }
      
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating company with address', 
        error: error.message 
      });
    }
  },

  updateCompanyStatus: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate inputs
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid company ID is required'
        });
      }
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }
      
      // Update the status
      const request = new sql.Request();
      request.input('id', sql.BigInt, id);
      request.input('isActive', sql.Bit, status === 'Active' ? 1 : 0);
      request.input('updatedAt', sql.DateTime2, new Date());
      
      const result = await request.query(`
        UPDATE core.Entity 
        SET IsActive = @isActive, UpdatedAtUtc = @updatedAt
        WHERE EntityId = @id AND IsDeleted = 0
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found or no changes made' 
        });
      }
      
      // Return updated entity via getCompanyById logic
      req.params.id = id;
      return companyController.getCompanyById(req, res);
      
    } catch (error) {
      console.error('Update company status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating company status in core.Entity', 
        error: error.message
      });
    }
  },

  deleteCompany: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.BigInt, id);
      request.input('updatedAt', sql.DateTime2, new Date());
      
      const result = await request.query('UPDATE core.Entity SET IsDeleted = 1, UpdatedAtUtc = @updatedAt WHERE EntityId = @id');
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Company deleted successfully (soft delete)'
      });
    } catch (error) {
      console.error('Delete company error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting company from core.Entity', 
        error: error.message 
      });
    }
  },

  // Send payroll reminder - FIXED IMPLEMENTATION
  sendPayrollReminder: async (req, res) => {
    try {
      console.log('Send payroll reminder request:', req.params.id, req.body);
      
      await sql.connect(dbConfig);
      const { id } = req.params;
      const { message, type, recipient } = req.body;
      
      // Get company details
      const getRequest = new sql.Request();
      getRequest.input('id', sql.Int, parseInt(id));
      const getResult = await getRequest.query(`
        SELECT c.*, 
               DATEDIFF(day, GETDATE(), c.PayrollDueDate) as DaysUntilPayrollDue
        FROM Companies c 
        WHERE c.Id = @id
      `);
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found' 
        });
      }
      
      const company = getResult.recordset[0];
      
      // Simulate sending email/notification
      console.log(`Payroll reminder sent for company: ${company.Name}`);
      console.log(`Recipient: ${recipient || company.AccountManager}`);
      console.log(`Message: ${message}`);
      
      // Try to log the reminder action (optional - won't fail if table doesn't exist)
      try {
        const logRequest = new sql.Request();
        logRequest.input('companyId', sql.Int, parseInt(id));
        logRequest.input('action', sql.NVarChar, 'PAYROLL_REMINDER');
        logRequest.input('message', sql.NVarChar, message || `Payroll reminder for ${company.Name}`);
        logRequest.input('recipient', sql.NVarChar, recipient || company.AccountManager);
        logRequest.input('createdAt', sql.DateTime, new Date());
        
        await logRequest.query(`
          INSERT INTO CompanyLogs (CompanyId, Action, Message, Recipient, CreatedAt)
          VALUES (@companyId, @action, @message, @recipient, @createdAt)
        `);
      } catch (logError) {
        console.warn('Could not log reminder action (table may not exist):', logError.message);
        // Continue execution even if logging fails
      }
      
      res.json({
        success: true,
        message: 'Payroll reminder sent successfully',
        data: {
          companyName: company.Name,
          recipient: recipient || company.AccountManager,
          daysUntilDue: company.DaysUntilPayrollDue,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Send payroll reminder error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error sending payroll reminder: ' + error.message, 
        error: error.message 
      });
    }
  },

  // Export company data - FIXED IMPLEMENTATION
  exportCompanyData: async (req, res) => {
    try {
      console.log('Export company data request:', req.params.id);
      
      await sql.connect(dbConfig);
      const { id } = req.params;
      const { format = 'csv' } = req.query;
      
      // Get company details
      const request = new sql.Request();
      request.input('id', sql.Int, parseInt(id));
      const result = await request.query(`
        SELECT c.*, 
               DATEDIFF(day, GETDATE(), c.PayrollDueDate) as DaysUntilPayrollDue,
               DATEDIFF(day, GETDATE(), c.NextCheckDate) as DaysUntilNextCheck
        FROM Companies c 
        WHERE c.Id = @id
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found' 
        });
      }
      
      const company = result.recordset[0];
      
      if (format === 'csv') {
        // Generate CSV data
        const csvHeaders = [
          'ID', 'Name', 'Client ID', 'Address', 'Type', 'Account Manager',
          'Employees', 'Status', 'Payroll Due Date', 'Next Check Date',
          'Days Until Payroll Due', 'Days Until Next Check', 'Created At', 'Updated At'
        ];
        
        const csvData = [
          company.Id || '',
          (company.Name || '').replace(/"/g, '""'), // Escape quotes
          company.ClientId || '',
          (company.Address || '').replace(/"/g, '""'), // Escape quotes
          company.Type || '',
          (company.AccountManager || '').replace(/"/g, '""'), // Escape quotes
          company.Employees || 0,
          company.Status || '',
          company.PayrollDueDate ? formatDate(company.PayrollDueDate) : '',
          company.NextCheckDate ? formatDate(company.NextCheckDate) : '',
          company.DaysUntilPayrollDue || '',
          company.DaysUntilNextCheck || '',
          company.CreatedAt ? formatDate(company.CreatedAt) : '',
          company.UpdatedAt ? formatDate(company.UpdatedAt) : ''
        ];
        
        const csvContent = [
          csvHeaders.join(','),
          csvData.map(field => `"${field}"`).join(',')
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${company.Name}_export_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON format
        res.json({
          success: true,
          data: company,
          exportedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Export company data error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error exporting company data: ' + error.message, 
        error: error.message 
      });
    }
  },

  // Get companies by status - NEW
  getCompaniesByStatus: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { status } = req.params;
      
      const request = new sql.Request();
      request.input('isActive', sql.Bit, status === 'Active' ? 1 : 0);
      
      const result = await request.query(`
        SELECT e.EntityId AS Id,
               e.EntityName AS Name,
               e.EntityCode AS ClientId,
               CASE WHEN e.IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS Status,
               e.CreatedAtUtc AS CreatedAt
        FROM core.Entity e
        WHERE e.IsActive = @isActive AND e.IsDeleted = 0
        ORDER BY e.CreatedAtUtc DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get companies by status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving companies by status from core.Entity', 
        error: error.message 
      });
    }
  },

  // Get companies by manager - NEW
  getCompaniesByManager: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { managerId } = req.params;
      
      const request = new sql.Request();
      request.input('managerId', sql.NVarChar, managerId);
      
      const result = await request.query(`
        SELECT e.EntityId AS Id,
               e.EntityName AS Name,
               e.EntityCode AS ClientId,
               CASE WHEN e.IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS Status
        FROM core.Entity e
        JOIN core.UserRole ur ON e.EntityId = ur.EntityId
        JOIN core.User u ON ur.UserId = u.UserId
        WHERE ur.RoleCode = 'ACCOUNT_MANAGER' 
          AND (u.FirstName + ' ' + u.LastName = @managerId OR ur.UserId = @managerId)
          AND e.IsDeleted = 0
        ORDER BY e.CreatedAtUtc DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get companies by manager error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving companies by manager from core.Entity', 
        error: error.message 
      });
    }
  },

  // Search companies - NEW
  searchCompanies: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { q, limit = 50 } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }
      
      const request = new sql.Request();
      request.input('search', sql.NVarChar, `%${q.trim()}%`);
      request.input('limit', sql.Int, parseInt(limit));
      
      const result = await request.query(`
        SELECT TOP (@limit) 
               e.EntityId AS Id,
               e.EntityName AS Name,
               e.EntityCode AS ClientId,
               CASE WHEN e.IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS Status
        FROM core.Entity e
        WHERE (e.EntityName LIKE @search 
            OR e.EntityCode LIKE @search)
          AND e.IsDeleted = 0
        ORDER BY e.EntityName ASC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length,
        searchTerm: q
      });
    } catch (error) {
      console.error('Search companies error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error searching companies in core.Entity', 
        error: error.message 
      });
    }
  },

  // Get company statistics - NEW
  getCompanyStats: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      
      const result = await sql.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as inactive,
          0 as pending, -- Not in new schema
          (SELECT COUNT(*) FROM hrm.Employee WHERE EmploymentStatus = 'Active') as totalEmployees,
          0 as payrollDueSoon -- Not in new schema
        FROM core.Entity
        WHERE IsDeleted = 0
      `);
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('Get company stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving company statistics from core.Entity', 
        error: error.message 
      });
    }
  },

  // Get companies with payroll due - NEW
  getCompaniesWithPayrollDue: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { days = 7 } = req.query;
      
      const request = new sql.Request();
      request.input('days', sql.Int, parseInt(days));
      
      const result = await request.query(`
        SELECT c.*, 
               DATEDIFF(day, GETDATE(), c.PayrollDueDate) as DaysUntilPayrollDue,
               DATEDIFF(day, GETDATE(), c.NextCheckDate) as DaysUntilNextCheck
        FROM Companies c 
        WHERE c.PayrollDueDate IS NOT NULL 
          AND DATEDIFF(day, GETDATE(), c.PayrollDueDate) BETWEEN 0 AND @days
        ORDER BY c.PayrollDueDate ASC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get companies with payroll due error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving companies with payroll due', 
        error: error.message 
      });
    }
  },
  // Upload company logo - UPDATED FOR YOUR DATABASE STRUCTURE
// FIXED uploadCompanyLogo method with proper parameter handling

uploadCompanyLogo: async (req, res) => {
  let connection = null;
  
  try {
    console.log('🖼️  Upload company logo - START');
    console.log('Company ID:', req.params.id);
    console.log('File info:', {
      originalname: req.file?.originalname,
      size: req.file?.size,
      mimetype: req.file?.mimetype
    });

    // Validate company ID
    const companyId = parseInt(req.params.id);
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    // Validate file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file uploaded'
      });
    }

    // Connect to database
    const pool = await poolPromise;
    console.log('✅ Database connected');

    // Check if company exists
    const checkRequest = new sql.Request(pool);
    checkRequest.input('id', sql.Int, companyId);
    const checkResult = await checkRequest.query('SELECT Id, Name FROM Companies WHERE Id = @id');

    if (checkResult.recordset.length === 0) {
      console.warn('⚠️  Company not found:', companyId);
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const company = checkResult.recordset[0];
    console.log('✅ Company found:', company.Name);

    // Get file buffer
    const fileBuffer = req.file.buffer;
    
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File buffer is empty'
      });
    }

    console.log('📦 File buffer size:', fileBuffer.length, 'bytes');

    // CRITICAL FIX: Use raw SQL with proper hex encoding instead of parameters
    // This bypasses the mssql driver bug with VARBINARY(MAX)
    const updateRequest = new sql.Request(pool);
    
    // Convert buffer to hex string
    const hexString = fileBuffer.toString('hex');
    console.log('🔄 Converting to hex string, length:', hexString.length);

    // Use raw SQL with CONVERT(VARBINARY(MAX), ...)
    const sqlQuery = `
      UPDATE Companies 
      SET Logo = CONVERT(VARBINARY(MAX), 0x${hexString}), 
          UpdatedAt = @updatedAt
      WHERE Id = @id
    `;

    updateRequest.input('id', sql.Int, companyId);
    updateRequest.input('updatedAt', sql.DateTime2, new Date());

    console.log('💾 Updating database with hex-encoded binary data...');
    const result = await updateRequest.query(sqlQuery);

    console.log('Rows affected:', result.rowsAffected[0]);

    if (result.rowsAffected[0] === 0) {
      console.error('❌ Database update failed - no rows affected');
      return res.status(500).json({
        success: false,
        message: 'Failed to update company logo in database'
      });
    }

    console.log('✅ Logo uploaded successfully');

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        companyId: companyId,
        companyName: company.Name,
        fileSize: fileBuffer.length,
        fileName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('❌ Upload company logo error:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error uploading logo: ' + error.message,
      error: error.message
    });
  } finally {
    // Shared pool
  }
},

  // FIXED: getCompanyLogo - Retrieve logo from database
getCompanyLogo: async (req, res) => {
  let connection = null;
  
  try {
    console.log('🖼️  GET LOGO - START');
    console.log('Company ID:', req.params.id);
    
    const companyId = parseInt(req.params.id);
    
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('id', sql.Int, companyId);
    
    console.log('📋 Querying database for logo...');
    const result = await request.query('SELECT Logo FROM Companies WHERE Id = @id');

    if (result.recordset.length === 0) {
      console.warn('⚠️  Company not found:', companyId);
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const logoBuffer = result.recordset[0].Logo;

    if (!logoBuffer) {
      console.warn('⚠️  No logo found for company ID:', companyId);
      return res.status(404).json({
        success: false,
        message: 'No logo found for this company'
      });
    }

    console.log('✅ Logo found, size:', logoBuffer.length, 'bytes');

    // Set appropriate headers
    res.set('Content-Type', 'image/png');
    res.set('Content-Length', logoBuffer.length);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('X-Content-Type-Options', 'nosniff');
    
    console.log('📤 Sending logo buffer to client');
    res.send(logoBuffer);

  } catch (error) {
    console.error('❌ Get company logo error:', error);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error retrieving logo',
      error: error.message
    });
  } finally {
    // Shared pool
  }
},

// Delete company logo - UPDATED FOR YOUR DATABASE STRUCTURE
  deleteCompanyLogo: async (req, res) => {
    let connection = null;
    
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID'
        });
      }

      const pool = await poolPromise;

      // Check if company exists and has logo
      const checkRequest = new sql.Request(pool);
      checkRequest.input('id', sql.Int, companyId);
      const checkResult = await checkRequest.query('SELECT Logo FROM Companies WHERE Id = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      if (!checkResult.recordset[0].Logo) {
        return res.status(404).json({
          success: false,
          message: 'No logo found for this company'
        });
      }

      // Delete logo from database
      const updateRequest = new sql.Request(pool);
      updateRequest.input('id', sql.Int, companyId);
      updateRequest.input('updatedAt', sql.DateTime, new Date());

      const result = await updateRequest.query(`
        UPDATE Companies 
        SET Logo = NULL, UpdatedAt = @updatedAt
        WHERE Id = @id
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete logo'
        });
      }

      res.json({
        success: true,
        message: 'Logo deleted successfully'
      });

    } catch (error) {
      console.error('Delete company logo error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting logo',
        error: error.message
      });
    } finally {
      // Shared pool
    }
  }
};

module.exports = companyController;