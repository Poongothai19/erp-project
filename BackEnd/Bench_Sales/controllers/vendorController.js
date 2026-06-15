// controllers/vendorController.js
const sql = require('mssql');
const { dbConfig } = require('../../config/db');

const vendorController = {
  // Get all vendors
  getAllVendors: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      
      const request = pool.request();
      const result = await request.query(`
        SELECT * FROM Vendors 
        ORDER BY Name ASC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get all vendors error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving vendors', 
        error: error.message 
      });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  },

  // Get single vendor by ID
  getVendorById: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = pool.request();
      request.input('id', sql.Int, id);
      
      const result = await request.query('SELECT * FROM Vendors WHERE Id = @id');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Vendor not found' 
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('Get vendor by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving vendor', 
        error: error.message 
      });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  },

  // Create new vendor
  createVendor: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const {
        name, email, phone, contactPerson, status = 'Active'
      } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and Email are required fields'
        });
      }

      // Check if vendor with same name already exists
      const checkRequest = pool.request();
      checkRequest.input('name', sql.NVarChar, name.trim());
      const existingVendor = await checkRequest.query('SELECT Id FROM Vendors WHERE LOWER(Name) = LOWER(@name)');
      
      if (existingVendor.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Vendor with name "${name}" already exists`
        });
      }

      // Process multiple emails
      let processedEmail = email;
      if (typeof email === 'string') {
        processedEmail = email.split(/[,;]/)
          .map(e => e.trim())
          .filter(e => e.length > 0)
          .join(', ');
      }
      
      const request = pool.request();
      request.input('name', sql.NVarChar, name.trim());
      request.input('email', sql.NVarChar, processedEmail);
      request.input('phone', sql.NVarChar, phone?.trim() || null);
      request.input('contactPerson', sql.NVarChar, contactPerson?.trim() || null);
      request.input('status', sql.NVarChar, status || 'Active');
      request.input('createdAt', sql.DateTime, new Date());
      request.input('updatedAt', sql.DateTime, new Date());
      
      const result = await request.query(`
        INSERT INTO Vendors (Name, Email, Phone, ContactPerson, Status, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.Id
        VALUES (@name, @email, @phone, @contactPerson, @status, @createdAt, @updatedAt)
      `);
      
      const vendorId = result.recordset[0].Id;
      
      // Get the created vendor
      const getRequest = pool.request();
      getRequest.input('id', sql.Int, vendorId);
      const getResult = await getRequest.query('SELECT * FROM Vendors WHERE Id = @id');
      
      res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: getResult.recordset[0]
      });
    } catch (error) {
      console.error('Create vendor error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating vendor', 
        error: error.message 
      });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  },

  // Bulk import vendors
  bulkImportVendors: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { vendors } = req.body;

      if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendors data. Expected array of vendor objects.'
        });
      }

      const results = {
        total: vendors.length,
        success: 0,
        failed: 0,
        errors: [],
        successItems: []
      };

      // Process each vendor
      for (let i = 0; i < vendors.length; i++) {
        const vendor = vendors[i];
        
        try {
          // Validate required fields
          if (!vendor.name || !vendor.email) {
            results.failed++;
            results.errors.push({
              index: i + 1,
              data: vendor,
              error: 'Name and Email are required fields'
            });
            continue;
          }

          // Check if vendor already exists
          const checkRequest = pool.request();
          checkRequest.input('name', sql.NVarChar, vendor.name.trim());
          const existingVendor = await checkRequest.query('SELECT Id FROM Vendors WHERE LOWER(Name) = LOWER(@name)');
          
          if (existingVendor.recordset.length > 0) {
            results.failed++;
            results.errors.push({
              index: i + 1,
              data: vendor,
              error: `Vendor with name "${vendor.name}" already exists`
            });
            continue;
          }

          // Process multiple emails
          let processedEmail = vendor.email;
          if (typeof vendor.email === 'string') {
            processedEmail = vendor.email.split(/[,;]/)
              .map(e => e.trim())
              .filter(e => e.length > 0)
              .join(', ');
          }

          // Insert vendor
          const insertRequest = pool.request();
          insertRequest.input('name', sql.NVarChar, vendor.name.trim());
          insertRequest.input('email', sql.NVarChar, processedEmail);
          insertRequest.input('phone', sql.NVarChar, vendor.phone?.trim() || null);
          insertRequest.input('contactPerson', sql.NVarChar, vendor.contactPerson?.trim() || null);
          insertRequest.input('status', sql.NVarChar, vendor.status || 'Active');
          insertRequest.input('createdAt', sql.DateTime, new Date());
          insertRequest.input('updatedAt', sql.DateTime, new Date());
          
          const insertResult = await insertRequest.query(`
            INSERT INTO Vendors (Name, Email, Phone, ContactPerson, Status, CreatedAt, UpdatedAt)
            OUTPUT INSERTED.Id
            VALUES (@name, @email, @phone, @contactPerson, @status, @createdAt, @updatedAt)
          `);

          results.success++;
          results.successItems.push({
            index: i + 1,
            data: vendor,
            id: insertResult.recordset[0].Id
          });

        } catch (error) {
          console.error(`Import error for vendor ${i + 1}:`, error);
          results.failed++;
          results.errors.push({
            index: i + 1,
            data: vendor,
            error: error.message
          });
        }
      }

      res.status(results.success > 0 ? 201 : 400).json({
        success: results.success > 0,
        message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
        results: results
      });

    } catch (error) {
      console.error('Bulk import vendors error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error during bulk import', 
        error: error.message 
      });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  },

  // Update vendor
  updateVendor: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { id } = req.params;
      const {
        name, email, phone, contactPerson, status
      } = req.body;

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and Email are required fields'
        });
      }

      // Check if another vendor with same name exists (excluding current one)
      const checkRequest = pool.request();
      checkRequest.input('name', sql.NVarChar, name.trim());
      checkRequest.input('currentId', sql.Int, id);
      const existingVendor = await checkRequest.query('SELECT Id FROM Vendors WHERE LOWER(Name) = LOWER(@name) AND Id != @currentId');
      
      if (existingVendor.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Another vendor with name "${name}" already exists`
        });
      }

      // Process multiple emails
      let processedEmail = email;
      if (typeof email === 'string') {
        processedEmail = email.split(/[,;]/)
          .map(e => e.trim())
          .filter(e => e.length > 0)
          .join(', ');
      }
      
      const request = pool.request();
      request.input('id', sql.Int, id);
      request.input('name', sql.NVarChar, name.trim());
      request.input('email', sql.NVarChar, processedEmail);
      request.input('phone', sql.NVarChar, phone?.trim() || null);
      request.input('contactPerson', sql.NVarChar, contactPerson?.trim() || null);
      request.input('status', sql.NVarChar, status || 'Active');
      request.input('updatedAt', sql.DateTime, new Date());
      
      const result = await request.query(`
        UPDATE Vendors 
        SET Name = @name, Email = @email, Phone = @phone, 
            ContactPerson = @contactPerson, Status = @status, UpdatedAt = @updatedAt
        WHERE Id = @id
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Vendor not found' 
        });
      }
      
      // Get the updated vendor
      const getRequest = pool.request();
      getRequest.input('id', sql.Int, id);
      const getResult = await getRequest.query('SELECT * FROM Vendors WHERE Id = @id');
      
      res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: getResult.recordset[0]
      });
    } catch (error) {
      console.error('Update vendor error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating vendor', 
        error: error.message 
      });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  },

  // Delete vendor (PERMANENT DELETE)
  deleteVendor: async (req, res) => {
    let pool;
    try {
      const { id } = req.params;
      console.log('========================================');
      console.log('PERMANENT DELETE REQUEST RECEIVED');
      console.log('Vendor ID to delete:', id);
      console.log('ID type:', typeof id);
      console.log('========================================');
      
      // Validate ID
      const vendorId = parseInt(id);
      if (isNaN(vendorId)) {
        console.error('Invalid ID format:', id);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid vendor ID format' 
        });
      }

      pool = await sql.connect(dbConfig);
      console.log('Database connected successfully');
      
      // First, check if vendor exists and get details
      const checkRequest = pool.request();
      checkRequest.input('id', sql.Int, vendorId);
      const checkResult = await checkRequest.query('SELECT Id, Name, Status FROM Vendors WHERE Id = @id');
      
      console.log('Vendor lookup result:', checkResult.recordset);
      
      if (checkResult.recordset.length === 0) {
        console.error('Vendor not found with ID:', vendorId);
        return res.status(404).json({ 
          success: false, 
          message: 'Vendor not found' 
        });
      }

      const vendorName = checkResult.recordset[0].Name;
      console.log('Found vendor to delete:', vendorName);
      
      // Perform the PERMANENT DELETE
      const deleteRequest = pool.request();
      deleteRequest.input('id', sql.Int, vendorId);
      
      console.log('Executing DELETE query...');
      const deleteResult = await deleteRequest.query(`
        DELETE FROM Vendors WHERE Id = @id
      `);
      
      console.log('Delete completed - rows affected:', deleteResult.rowsAffected[0]);
      
      // Verify the deletion
      const verifyRequest = pool.request();
      verifyRequest.input('id', sql.Int, vendorId);
      const verifyResult = await verifyRequest.query('SELECT Id FROM Vendors WHERE Id = @id');
      
      console.log('Verification result (should be empty):', verifyResult.recordset);
      console.log('========================================');
      
      if (deleteResult.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Failed to delete vendor' 
        });
      }
      
      res.json({
        success: true,
        message: 'Vendor permanently deleted successfully',
        data: {
          id: vendorId,
          name: vendorName,
          deleted: true
        }
      });
    } catch (error) {
      console.error('========================================');
      console.error('DELETE VENDOR ERROR:');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('========================================');
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting vendor', 
        error: error.message 
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
          console.log('Database connection closed');
        } catch (closeError) {
          console.error('Error closing connection:', closeError);
        }
      }
    }
  },

  // Get vendor statistics
  getVendorStats: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      
      const request = pool.request();
      const result = await request.query(`
        SELECT 
          COUNT(*) as Total,
          SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) as Active,
          SUM(CASE WHEN Status = 'Inactive' THEN 1 ELSE 0 END) as Inactive,
          COUNT(CASE WHEN CreatedAt >= DATEADD(day, -30, GETDATE()) THEN 1 END) as RecentlyAdded
        FROM Vendors
      `);
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('Get vendor stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving vendor statistics', 
        error: error.message 
      });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  }
};

module.exports = vendorController;