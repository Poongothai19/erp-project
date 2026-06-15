// Bench_Sales/controllers/externalSubmissionController.js
const sql = require('mssql');
const { dbConfig } = require('../../config/db');

const externalSubmissionController = {
  // Import CSV/Excel data from request body (NO FILE UPLOAD - receives JSON data)
  importExternalSubmissions: async (req, res) => {
    try {
      const { data } = req.body;

      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No data provided. Please send an array of submission objects.'
        });
      }

      console.log('Received data rows:', data.length);

      // Validate and transform data
      const transformedData = data.map((row, index) => {
        const candidateName = row.name || row.Name || row.CandidateName || row['Candidate Name'];
        const role = row.role || row.Role || row.Position;
        const client = row.client || row.Client;

        if (!candidateName || !role || !client) {
          console.warn(`Row ${index + 1}: Missing required fields`, row);
          return null;
        }

        // Parse date - FIXED for YYYY-MM-DD format from frontend
        let submissionDate = row.date || row.Date || row.SubmissionDate || row['Submission Date'];
        let parsedDate = new Date();
        
        if (submissionDate && submissionDate.trim() !== '') {
          console.log(`Row ${index + 1}: Raw date value: ${submissionDate}`);
          
          try {
            // If it comes as YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(submissionDate)) {
              // Parse as YYYY-MM-DD and create date at noon UTC to avoid timezone issues
              const [year, month, day] = submissionDate.split('-');
              parsedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
              console.log(`Row ${index + 1}: Parsed YYYY-MM-DD format. Date: ${parsedDate}`);
            } else {
              // Try parsing as general date
              const tempDate = new Date(submissionDate);
              if (!isNaN(tempDate.getTime())) {
                parsedDate = tempDate;
                console.log(`Row ${index + 1}: Parsed as general date format. Date: ${parsedDate}`);
              } else {
                console.warn(`Row ${index + 1}: Invalid date format, using today's date`);
                parsedDate = new Date();
              }
            }
          } catch (e) {
            console.warn(`Row ${index + 1}: Date parsing error: ${e.message}, using today's date`);
            parsedDate = new Date();
          }
        } else {
          console.log(`Row ${index + 1}: No date provided, using today's date`);
          parsedDate = new Date();
        }

        // Validate and normalize status
        const statusValue = row.status || row.Status || 'Submitted';
        const validStatuses = ['Submitted', 'Interview Scheduled', 'Selected', 'Joined', 'Rejected'];
        const normalizedStatus = validStatuses.find(s => 
          s.toLowerCase() === statusValue.toLowerCase()
        ) || 'Submitted';

        return {
          candidateName: candidateName.toString().trim(),
          role: role.toString().trim(),
          rate: (row.rate || row.Rate || '').toString().trim(),
          client: client.toString().trim(),
          location: (row.location || row.Location || '').toString().trim(),
          vendorName: (row.vendorName || row.VendorName || row['Vendor Name'] || '').toString().trim(),
          vendorMail: (row.vendorMail || row.VendorMail || row['Vendor Mail'] || row['Vendor Email'] || '').toString().trim(),
          vendorContact: (row.vendorContact || row.VendorContact || row['Vendor Contact'] || row['Vendor Phone'] || '').toString().trim(),
          vendorCompany: (row.vendorCompany || row.VendorCompany || row['Vendor Company'] || '').toString().trim(),
          status: normalizedStatus,
          submissionDate: parsedDate
        };
      }).filter(item => item !== null);

      console.log('Valid rows:', transformedData.length);

      if (transformedData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid data found. Please ensure your data has: name, role, and client fields',
          totalRows: data.length,
          validRows: 0
        });
      }

      // Insert data into database
      await sql.connect(dbConfig);
      const transaction = new sql.Transaction();
      await transaction.begin();

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      try {
        for (let i = 0; i < transformedData.length; i++) {
          const rowData = transformedData[i];
          
          try {
            console.log(`Inserting row ${i + 1}: ${rowData.candidateName}, Date: ${rowData.submissionDate}`);
            
            // Insert into ExternalSubmissions
            const request = new sql.Request(transaction);
            request.input('candidateName', sql.NVarChar(255), rowData.candidateName);
            request.input('role', sql.NVarChar(255), rowData.role);
            request.input('rate', sql.NVarChar(100), rowData.rate || null);
            request.input('client', sql.NVarChar(255), rowData.client);
            request.input('location', sql.NVarChar(255), rowData.location || null);
            request.input('vendorName', sql.NVarChar(255), rowData.vendorName || null);
            request.input('vendorMail', sql.NVarChar(255), rowData.vendorMail || null);
            request.input('vendorContact', sql.NVarChar(50), rowData.vendorContact || null);
            request.input('vendorCompany', sql.NVarChar(255), rowData.vendorCompany || null);
            request.input('status', sql.NVarChar(50), rowData.status);
            request.input('submissionDate', sql.DateTime, rowData.submissionDate);
            
            await request.query(`
              INSERT INTO ExternalSubmissions 
              (CandidateName, Role, Rate, Client, Location, VendorName, VendorMail, VendorContact, VendorCompany, Status, SubmissionDate)
              VALUES (@candidateName, @role, @rate, @client, @location, @vendorName, @vendorMail, @vendorContact, @vendorCompany, @status, @submissionDate)
            `);

            // Handle vendor if vendor info is provided
            if (rowData.vendorCompany || rowData.vendorName) {
              const vendorNameToUse = rowData.vendorCompany || rowData.vendorName;
              
              try {
                const checkVendorRequest = new sql.Request(transaction);
                checkVendorRequest.input('vendorName', sql.NVarChar, vendorNameToUse.trim());
                const vendorResult = await checkVendorRequest.query(`
                  SELECT Id FROM Vendors WHERE LOWER(Name) = LOWER(@vendorName)
                `);

                if (vendorResult.recordset.length > 0) {
                  const vendorId = vendorResult.recordset[0].Id;
                  
                  if (rowData.vendorMail || rowData.vendorContact || rowData.vendorName) {
                    const updateVendorRequest = new sql.Request(transaction);
                    updateVendorRequest.input('id', sql.Int, vendorId);
                    updateVendorRequest.input('email', sql.NVarChar, rowData.vendorMail || '');
                    updateVendorRequest.input('phone', sql.NVarChar, rowData.vendorContact || '');
                    updateVendorRequest.input('contactPerson', sql.NVarChar, rowData.vendorName || '');
                    updateVendorRequest.input('updatedAt', sql.DateTime, new Date());
                    
                    await updateVendorRequest.query(`
                      UPDATE Vendors 
                      SET Email = CASE WHEN @email != '' THEN @email ELSE Email END,
                          Phone = CASE WHEN @phone != '' THEN @phone ELSE Phone END,
                          ContactPerson = CASE WHEN @contactPerson != '' THEN @contactPerson ELSE ContactPerson END,
                          UpdatedAt = @updatedAt
                      WHERE Id = @id
                    `);
                  }
                } else {
                  const createVendorRequest = new sql.Request(transaction);
                  createVendorRequest.input('name', sql.NVarChar, vendorNameToUse.trim());
                  createVendorRequest.input('email', sql.NVarChar, rowData.vendorMail || '');
                  createVendorRequest.input('phone', sql.NVarChar, rowData.vendorContact || '');
                  createVendorRequest.input('contactPerson', sql.NVarChar, rowData.vendorName || '');
                  createVendorRequest.input('status', sql.NVarChar, 'Active');
                  createVendorRequest.input('createdAt', sql.DateTime, new Date());
                  createVendorRequest.input('updatedAt', sql.DateTime, new Date());
                  
                  await createVendorRequest.query(`
                    INSERT INTO Vendors (Name, Email, Phone, ContactPerson, Status, CreatedAt, UpdatedAt)
                    VALUES (@name, @email, @phone, @contactPerson, @status, @createdAt, @updatedAt)
                  `);
                }
              } catch (vendorError) {
                console.error('Error managing vendor:', vendorError.message);
              }
            }

            successCount++;
          } catch (rowError) {
            errorCount++;
            errors.push({
              row: i + 1,
              data: rowData.candidateName,
              error: rowError.message
            });
            console.error(`Error inserting row ${i + 1}:`, rowError.message);
          }
        }

        await transaction.commit();

        res.json({
          success: true,
          message: `Import completed: ${successCount} successful, ${errorCount} failed`,
          successCount,
          errorCount,
          totalRows: data.length,
          validRows: transformedData.length,
          errors: errors.length > 0 ? errors : undefined
        });

      } catch (transactionError) {
        await transaction.rollback();
        throw transactionError;
      }

    } catch (error) {
      console.error('Import external submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error importing external submissions',
        error: error.message
      });
    }
  },

  // Get all external submissions
  getAllExternalSubmissions: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      
      const request = new sql.Request();
      const result = await request.query(`
        SELECT * FROM ExternalSubmissions
        ORDER BY SubmissionDate DESC, CreatedAt DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get all external submissions error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving external submissions', 
        error: error.message 
      });
    }
  },

  // Get single external submission by ID
  getExternalSubmissionById: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      
      const result = await request.query(`
        SELECT * FROM ExternalSubmissions
        WHERE Id = @id
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'External submission not found' 
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('Get external submission by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving external submission', 
        error: error.message 
      });
    }
  },

  // Create new external submission
  createExternalSubmission: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const {
        candidateName, role, rate, client, location,
        vendorName, vendorMail, vendorContact, vendorCompany,
        status = 'Submitted', submissionDate
      } = req.body;
      
      console.log('Received data:', req.body);
      
      // Validate required fields
      if (!candidateName || !role || !client) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing: candidateName, role, and client are required'
        });
      }
      
      // Handle date properly
      let parsedDate;
      if (submissionDate) {
        parsedDate = new Date(submissionDate);
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date();
        }
      } else {
        parsedDate = new Date();
      }

      // Start transaction
      const transaction = new sql.Transaction();
      await transaction.begin();

      try {
        // Insert into ExternalSubmissions
        const extRequest = new sql.Request(transaction);
        extRequest.input('candidateName', sql.NVarChar(255), candidateName);
        extRequest.input('role', sql.NVarChar(255), role);
        extRequest.input('rate', sql.NVarChar(100), rate || null);
        extRequest.input('client', sql.NVarChar(255), client);
        extRequest.input('location', sql.NVarChar(255), location || null);
        extRequest.input('vendorName', sql.NVarChar(255), vendorName || null);
        extRequest.input('vendorMail', sql.NVarChar(255), vendorMail || null);
        extRequest.input('vendorContact', sql.NVarChar(50), vendorContact || null);
        extRequest.input('vendorCompany', sql.NVarChar(255), vendorCompany || null);
        extRequest.input('status', sql.NVarChar(50), status);
        extRequest.input('submissionDate', sql.DateTime, parsedDate);
        
        const extResult = await extRequest.query(`
          INSERT INTO ExternalSubmissions 
          (CandidateName, Role, Rate, Client, Location, VendorName, VendorMail, VendorContact, VendorCompany, Status, SubmissionDate)
          OUTPUT INSERTED.*
          VALUES (@candidateName, @role, @rate, @client, @location, @vendorName, @vendorMail, @vendorContact, @vendorCompany, @status, @submissionDate)
        `);
        
        const externalSubmissionId = extResult.recordset[0].Id;
        console.log('External submission created with ID:', externalSubmissionId);

        // Manage vendor in Vendors table if vendor info is provided
        let vendorId = null;
        
        if (vendorCompany || vendorName) {
          const vendorNameToUse = vendorCompany || vendorName;
          
          try {
            const checkVendorRequest = new sql.Request(transaction);
            checkVendorRequest.input('vendorName', sql.NVarChar, vendorNameToUse.trim());
            const vendorResult = await checkVendorRequest.query(`
              SELECT Id FROM Vendors WHERE LOWER(Name) = LOWER(@vendorName)
            `);

            if (vendorResult.recordset.length > 0) {
              vendorId = vendorResult.recordset[0].Id;
              console.log('Found existing vendor:', vendorId);
              
              if (vendorMail || vendorContact || vendorName) {
                const updateVendorRequest = new sql.Request(transaction);
                updateVendorRequest.input('id', sql.Int, vendorId);
                updateVendorRequest.input('email', sql.NVarChar, vendorMail || '');
                updateVendorRequest.input('phone', sql.NVarChar, vendorContact || '');
                updateVendorRequest.input('contactPerson', sql.NVarChar, vendorName || '');
                updateVendorRequest.input('updatedAt', sql.DateTime, new Date());
                
                await updateVendorRequest.query(`
                  UPDATE Vendors 
                  SET Email = CASE WHEN @email != '' THEN @email ELSE Email END,
                      Phone = CASE WHEN @phone != '' THEN @phone ELSE Phone END,
                      ContactPerson = CASE WHEN @contactPerson != '' THEN @contactPerson ELSE ContactPerson END,
                      UpdatedAt = @updatedAt
                  WHERE Id = @id
                `);
                console.log('Updated vendor with new info');
              }
            } else {
              const createVendorRequest = new sql.Request(transaction);
              createVendorRequest.input('name', sql.NVarChar, vendorNameToUse.trim());
              createVendorRequest.input('email', sql.NVarChar, vendorMail || '');
              createVendorRequest.input('phone', sql.NVarChar, vendorContact || '');
              createVendorRequest.input('contactPerson', sql.NVarChar, vendorName || '');
              createVendorRequest.input('status', sql.NVarChar, 'Active');
              createVendorRequest.input('createdAt', sql.DateTime, new Date());
              createVendorRequest.input('updatedAt', sql.DateTime, new Date());
              
              const newVendor = await createVendorRequest.query(`
                INSERT INTO Vendors (Name, Email, Phone, ContactPerson, Status, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.Id
                VALUES (@name, @email, @phone, @contactPerson, @status, @createdAt, @updatedAt)
              `);
              vendorId = newVendor.recordset[0].Id;
              console.log('Created new vendor:', vendorId);
            }
          } catch (vendorError) {
            console.error('Error managing vendor:', vendorError.message);
          }
        }

        await transaction.commit();
        
        res.status(201).json({
          success: true,
          message: vendorId 
            ? 'External submission created and vendor synced successfully' 
            : 'External submission created successfully',
          id: externalSubmissionId,
          vendorId: vendorId,
          data: extResult.recordset[0]
        });

      } catch (transactionError) {
        console.error('Transaction error:', transactionError);
        await transaction.rollback();
        throw transactionError;
      }
      
    } catch (error) {
      console.error('Create external submission error:', error);
      console.error('Full error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating external submission', 
        error: error.message,
        details: error.toString()
      });
    }
  },

  // Update external submission - FIXED VERSION
  updateExternalSubmission: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      const {
        candidateName, role, rate, client, location,
        vendorName, vendorMail, vendorContact, vendorCompany,
        status, submissionDate
      } = req.body;

      const transaction = new sql.Transaction();
      await transaction.begin();

      try {
        // First check if the submission exists
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('id', sql.Int, id);
        const checkResult = await checkRequest.query(`
          SELECT * FROM ExternalSubmissions WHERE Id = @id
        `);

        if (checkResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'External submission not found'
          });
        }

        // Update without OUTPUT clause to avoid trigger conflict
        const extRequest = new sql.Request(transaction);
        extRequest.input('id', sql.Int, id);
        extRequest.input('candidateName', sql.NVarChar, candidateName);
        extRequest.input('role', sql.NVarChar, role);
        extRequest.input('rate', sql.NVarChar, rate);
        extRequest.input('client', sql.NVarChar, client);
        extRequest.input('location', sql.NVarChar, location);
        extRequest.input('vendorName', sql.NVarChar, vendorName);
        extRequest.input('vendorMail', sql.NVarChar, vendorMail);
        extRequest.input('vendorContact', sql.NVarChar, vendorContact);
        extRequest.input('vendorCompany', sql.NVarChar, vendorCompany);
        extRequest.input('status', sql.NVarChar, status);
        extRequest.input('submissionDate', sql.DateTime, submissionDate ? new Date(submissionDate) : null);
        
        await extRequest.query(`
          UPDATE ExternalSubmissions 
          SET CandidateName = @candidateName,
              Role = @role,
              Rate = @rate,
              Client = @client,
              Location = @location,
              VendorName = @vendorName,
              VendorMail = @vendorMail,
              VendorContact = @vendorContact,
              VendorCompany = @vendorCompany,
              Status = @status,
              SubmissionDate = @submissionDate
          WHERE Id = @id
        `);

        // Get the updated record separately
        const getUpdatedRequest = new sql.Request(transaction);
        getUpdatedRequest.input('id', sql.Int, id);
        const updatedResult = await getUpdatedRequest.query(`
          SELECT * FROM ExternalSubmissions WHERE Id = @id
        `);

        // Manage vendor if vendor info is provided
        if (vendorCompany || vendorName) {
          const vendorNameToUse = vendorCompany || vendorName;
          
          try {
            const checkVendorRequest = new sql.Request(transaction);
            checkVendorRequest.input('vendorName', sql.NVarChar, vendorNameToUse.trim());
            const vendorResult = await checkVendorRequest.query(`
              SELECT Id FROM Vendors WHERE LOWER(Name) = LOWER(@vendorName)
            `);

            if (vendorResult.recordset.length > 0) {
              const vendorId = vendorResult.recordset[0].Id;
              
              if (vendorMail || vendorContact || vendorName) {
                const updateVendorRequest = new sql.Request(transaction);
                updateVendorRequest.input('id', sql.Int, vendorId);
                updateVendorRequest.input('email', sql.NVarChar, vendorMail || '');
                updateVendorRequest.input('phone', sql.NVarChar, vendorContact || '');
                updateVendorRequest.input('contactPerson', sql.NVarChar, vendorName || '');
                updateVendorRequest.input('updatedAt', sql.DateTime, new Date());
                
                await updateVendorRequest.query(`
                  UPDATE Vendors 
                  SET Email = CASE WHEN @email != '' THEN @email ELSE Email END,
                      Phone = CASE WHEN @phone != '' THEN @phone ELSE Phone END,
                      ContactPerson = CASE WHEN @contactPerson != '' THEN @contactPerson ELSE ContactPerson END,
                      UpdatedAt = @updatedAt
                  WHERE Id = @id
                `);
              }
            } else {
              const createVendorRequest = new sql.Request(transaction);
              createVendorRequest.input('name', sql.NVarChar, vendorNameToUse.trim());
              createVendorRequest.input('email', sql.NVarChar, vendorMail || '');
              createVendorRequest.input('phone', sql.NVarChar, vendorContact || '');
              createVendorRequest.input('contactPerson', sql.NVarChar, vendorName || '');
              createVendorRequest.input('status', sql.NVarChar, 'Active');
              createVendorRequest.input('createdAt', sql.DateTime, new Date());
              createVendorRequest.input('updatedAt', sql.DateTime, new Date());
              
              await createVendorRequest.query(`
                INSERT INTO Vendors (Name, Email, Phone, ContactPerson, Status, CreatedAt, UpdatedAt)
                VALUES (@name, @email, @phone, @contactPerson, @status, @createdAt, @updatedAt)
              `);
            }
          } catch (vendorError) {
            console.error('Error managing vendor:', vendorError.message);
          }
        }

        await transaction.commit();

        res.json({
          success: true,
          message: 'External submission updated successfully',
          data: updatedResult.recordset[0]
        });

      } catch (transactionError) {
        await transaction.rollback();
        throw transactionError;
      }

    } catch (error) {
      console.error('Update external submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating external submission',
        error: error.message
      });
    }
  },

  // Update external submission status - FIXED VERSION
  updateExternalSubmissionStatus: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const validStatuses = ['Submitted', 'Interview Scheduled', 'Selected', 'Joined', 'Rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const transaction = new sql.Transaction();
      await transaction.begin();

      try {
        // First check if exists
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('id', sql.Int, id);
        const checkResult = await checkRequest.query(`
          SELECT * FROM ExternalSubmissions WHERE Id = @id
        `);

        if (checkResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'External submission not found'
          });
        }

        // Update without OUTPUT clause
        const updateRequest = new sql.Request(transaction);
        updateRequest.input('id', sql.Int, id);
        updateRequest.input('status', sql.NVarChar, status);

        await updateRequest.query(`
          UPDATE ExternalSubmissions
          SET Status = @status
          WHERE Id = @id
        `);

        // Get updated record separately
        const getUpdatedRequest = new sql.Request(transaction);
        getUpdatedRequest.input('id', sql.Int, id);
        const updatedResult = await getUpdatedRequest.query(`
          SELECT * FROM ExternalSubmissions WHERE Id = @id
        `);

        await transaction.commit();

        res.json({
          success: true,
          message: 'Status updated successfully',
          data: updatedResult.recordset[0]
        });

      } catch (transactionError) {
        await transaction.rollback();
        throw transactionError;
      }

    } catch (error) {
      console.error('Update external submission status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating external submission status',
        error: error.message
      });
    }
  },

  // Delete external submission - FIXED VERSION
  deleteExternalSubmission: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;

      const transaction = new sql.Transaction();
      await transaction.begin();

      try {
        // First get the record to return
        const getRequest = new sql.Request(transaction);
        getRequest.input('id', sql.Int, id);
        const getResult = await getRequest.query(`
          SELECT * FROM ExternalSubmissions WHERE Id = @id
        `);

        if (getResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'External submission not found'
          });
        }

        const deletedRecord = getResult.recordset[0];

        // Delete without OUTPUT clause
        const deleteRequest = new sql.Request(transaction);
        deleteRequest.input('id', sql.Int, id);

        await deleteRequest.query(`
          DELETE FROM ExternalSubmissions
          WHERE Id = @id
        `);

        await transaction.commit();

        res.json({
          success: true,
          message: 'External submission deleted successfully',
          data: deletedRecord
        });

      } catch (transactionError) {
        await transaction.rollback();
        throw transactionError;
      }

    } catch (error) {
      console.error('Delete external submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting external submission',
        error: error.message
      });
    }
  },

  // Search external submissions
  searchExternalSubmissions: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { query, status, client, vendor } = req.query;

      let sqlQuery = `SELECT * FROM ExternalSubmissions WHERE 1=1`;
      const request = new sql.Request();

      if (query) {
        sqlQuery += ` AND (
          CandidateName LIKE @query OR 
          Role LIKE @query OR 
          Client LIKE @query OR
          VendorCompany LIKE @query OR
          VendorName LIKE @query
        )`;
        request.input('query', sql.NVarChar, `%${query}%`);
      }

      if (status) {
        sqlQuery += ` AND Status = @status`;
        request.input('status', sql.NVarChar, status);
      }

      if (client) {
        sqlQuery += ` AND Client LIKE @client`;
        request.input('client', sql.NVarChar, `%${client}%`);
      }

      if (vendor) {
        sqlQuery += ` AND (VendorCompany LIKE @vendor OR VendorName LIKE @vendor)`;
        request.input('vendor', sql.NVarChar, `%${vendor}%`);
      }

      sqlQuery += ` ORDER BY SubmissionDate DESC, CreatedAt DESC`;

      const result = await request.query(sqlQuery);

      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });

    } catch (error) {
      console.error('Search external submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching external submissions',
        error: error.message
      });
    }
  },

  // Get external submissions summary/statistics
  getExternalSubmissionsSummary: async (req, res) => {
    try {
      await sql.connect(dbConfig);

      const request = new sql.Request();
      const result = await request.query(`
        SELECT 
          COUNT(*) as TotalSubmissions,
          SUM(CASE WHEN Status = 'Submitted' THEN 1 ELSE 0 END) as Submitted,
          SUM(CASE WHEN Status = 'Interview Scheduled' THEN 1 ELSE 0 END) as InterviewScheduled,
          SUM(CASE WHEN Status = 'Selected' THEN 1 ELSE 0 END) as Selected,
          SUM(CASE WHEN Status = 'Joined' THEN 1 ELSE 0 END) as Joined,
          SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) as Rejected,
          COUNT(DISTINCT Client) as TotalClients,
          COUNT(DISTINCT VendorCompany) as TotalVendors
        FROM ExternalSubmissions
      `);

      res.json({
        success: true,
        data: result.recordset[0]
      });

    } catch (error) {
      console.error('Get external submissions summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving external submissions summary',
        error: error.message
      });
    }
  },

  // Get external submissions by status
  getExternalSubmissionsByStatus: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { status } = req.params;

      const validStatuses = ['Submitted', 'Interview Scheduled', 'Selected', 'Joined', 'Rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const request = new sql.Request();
      request.input('status', sql.NVarChar, status);

      const result = await request.query(`
        SELECT * FROM ExternalSubmissions
        WHERE Status = @status
        ORDER BY SubmissionDate DESC, CreatedAt DESC
      `);

      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length,
        status: status
      });

    } catch (error) {
      console.error('Get external submissions by status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving external submissions by status',
        error: error.message
      });
    }
  }
};

module.exports = externalSubmissionController;