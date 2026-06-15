// controllers/hotlistController.js - UPDATED VERSION WITH PROPER ORDER SUPPORT
const sql = require('mssql');
const { dbConfig } = require('../../config/db');

const hotlistController = {
  // Test database connection
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

  // Search candidates by role
  searchByRole: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { role } = req.query;
      
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role parameter is required'
        });
      }

      const request = new sql.Request();
      request.input('role', sql.NVarChar, `%${role}%`);
      
      const result = await request.query(`
        SELECT Id, FullName, Role, Exp, State, Relocation, Visa, Priority 
        FROM ProphecyHotlist 
        WHERE Role LIKE @role AND IsActive = 1
        ORDER BY Id ASC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Search by role error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error searching candidates by role', 
        error: error.message 
      });
    }
  },

  // Get candidates by visa status
  getCandidatesByVisa: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { visa } = req.params;
      
      const request = new sql.Request();
      request.input('visa', sql.NVarChar, visa);
      
      const result = await request.query(`
        SELECT Id, FullName, Role, Exp, State, Relocation, Visa, Priority 
        FROM ProphecyHotlist 
        WHERE Visa = @visa AND IsActive = 1
        ORDER BY Id ASC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get candidates by visa error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving candidates by visa status', 
        error: error.message 
      });
    }
  },

  // Get candidates by state
  getCandidatesByState: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { state } = req.params;
      
      const request = new sql.Request();
      request.input('state', sql.NVarChar, state);
      
      const result = await request.query(`
        SELECT Id, FullName, Role, Exp, State, Relocation, Visa, Priority 
        FROM ProphecyHotlist 
        WHERE State = @state AND IsActive = 1
        ORDER BY Id ASC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get candidates by state error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving candidates by state', 
        error: error.message 
      });
    }
  },

  // UPDATED: Get all hotlist candidates with proper ordering support
  getAllHotlistCandidates: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { 
        search, 
        role, 
        exp, 
        state, 
        relocation, 
        visa,
        priority,
        limit = 100,
        offset = 0,
        orderBy = 'CreatedAt',      // CHANGED: Default to CreatedAt for proper order
        orderDirection = 'ASC'      // CHANGED: Default ascending to maintain import order
      } = req.query;
      
      console.log('=== GET ALL CANDIDATES WITH ORDERING ===');
      console.log('Order parameters:', { orderBy, orderDirection });
      
      let query = 'SELECT Id, FullName, Role, Exp, State, Relocation, Visa, Priority, CreatedAt FROM ProphecyHotlist WHERE IsActive = 1';
      let inputs = [];
      
      // Search across multiple fields including Priority
      if (search && search.trim()) {
        query += ` AND (
          FullName LIKE @search OR 
          Role LIKE @search OR 
          Exp LIKE @search OR 
          State LIKE @search OR
          Relocation LIKE @search OR
          Visa LIKE @search OR
          Priority LIKE @search
        )`;
        inputs.push({ name: 'search', type: sql.NVarChar, value: `%${search.trim()}%` });
      }
      
      // Specific filters
      if (role) {
        query += ' AND Role LIKE @role';
        inputs.push({ name: 'role', type: sql.NVarChar, value: `%${role}%` });
      }
      
      if (exp) {
        query += ' AND Exp LIKE @exp';
        inputs.push({ name: 'exp', type: sql.NVarChar, value: `%${exp}%` });
      }
      
      if (state) {
        query += ' AND State = @state';
        inputs.push({ name: 'state', type: sql.NVarChar, value: state });
      }
      
      if (relocation) {
        query += ' AND Relocation LIKE @relocation';
        inputs.push({ name: 'relocation', type: sql.NVarChar, value: `%${relocation}%` });
      }
      
      if (visa) {
        query += ' AND Visa = @visa';
        inputs.push({ name: 'visa', type: sql.NVarChar, value: visa });
      }

      if (priority) {
        query += ' AND Priority = @priority';
        inputs.push({ name: 'priority', type: sql.NVarChar, value: priority });
      }
      
      // UPDATED: Dynamic ordering based on parameters
      const validOrderColumns = ['Id', 'FullName', 'Role', 'Exp', 'State', 'Relocation', 'Visa', 'Priority', 'CreatedAt'];
      const validDirections = ['ASC', 'DESC'];
      
      const safeOrderBy = validOrderColumns.includes(orderBy) ? orderBy : 'CreatedAt';
      const safeOrderDirection = validDirections.includes(orderDirection.toUpperCase()) ? orderDirection.toUpperCase() : 'ASC';
      
      console.log('Final ordering:', { safeOrderBy, safeOrderDirection });
      
      query += ` ORDER BY ${safeOrderBy} ${safeOrderDirection}`;
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      
      inputs.push({ name: 'offset', type: sql.Int, value: parseInt(offset) });
      inputs.push({ name: 'limit', type: sql.Int, value: parseInt(limit) });
      
      const request = new sql.Request();
      inputs.forEach(input => {
        request.input(input.name, input.type, input.value);
      });
      
      console.log('Executing query with ordering...');
      const result = await request.query(query);
      
      console.log(`Retrieved ${result.recordset.length} candidates in ${safeOrderBy} ${safeOrderDirection} order`);
      
      res.json({
        success: true,
        data: result.recordset,
        pagination: {
          total: result.recordset.length,
          count: result.recordset.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        ordering: {
          orderBy: safeOrderBy,
          orderDirection: safeOrderDirection
        }
      });
    } catch (error) {
      console.error('Get all hotlist candidates error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving hotlist candidates', 
        error: error.message 
      });
    }
  },

  // Get single hotlist candidate by ID
  getHotlistCandidateById: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      
      const result = await request.query('SELECT Id, FullName, Role, Exp, State, Relocation, Visa, Priority FROM ProphecyHotlist WHERE Id = @id AND IsActive = 1');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hotlist candidate not found' 
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('Get hotlist candidate by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving hotlist candidate', 
        error: error.message 
      });
    }
  },

  // Create hotlist candidate with Priority support
  createHotlistCandidate: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { fullName, role, exp, state, relocation, visa, priority } = req.body;

      console.log('=== CREATE CANDIDATE WITH PRIORITY ===');
      console.log('Request body:', req.body);

      if (!fullName || !fullName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required'
        });
      }

      // Safe string conversion
      const safeString = (value) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        return String(value).trim();
      };

      const candidateData = {
        fullName: safeString(fullName),
        role: safeString(role),
        exp: safeString(exp),
        state: safeString(state),
        relocation: safeString(relocation),
        visa: safeString(visa),
        priority: safeString(priority) || 'Medium' // Default to Medium
      };

      console.log('Processed candidate data:', candidateData);

      const request = new sql.Request();
      request.input('fullName', sql.NVarChar(255), candidateData.fullName);
      request.input('role', sql.NVarChar(500), candidateData.role);
      request.input('exp', sql.NVarChar(100), candidateData.exp);
      request.input('state', sql.NVarChar(100), candidateData.state);
      request.input('relocation', sql.NVarChar(100), candidateData.relocation);
      request.input('visa', sql.NVarChar(100), candidateData.visa);
      request.input('priority', sql.NVarChar(50), candidateData.priority);

      const insertQuery = `
        INSERT INTO ProphecyHotlist (FullName, Role, Exp, State, Relocation, Visa, Priority, CreatedAt, UpdatedAt, IsActive)
        OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Role, INSERTED.Exp, INSERTED.State, INSERTED.Relocation, INSERTED.Visa, INSERTED.Priority
        VALUES (@fullName, @role, @exp, @state, @relocation, @visa, @priority, GETDATE(), GETDATE(), 1)
      `;

      const result = await request.query(insertQuery);

      if (result.recordset && result.recordset[0]) {
        console.log('Created candidate with priority:', result.recordset[0]);
        
        res.status(201).json({
          success: true,
          message: 'Hotlist candidate created successfully',
          data: result.recordset[0]
        });
      } else {
        throw new Error('No data returned from database after insert');
      }

    } catch (error) {
      console.error('=== CREATE CANDIDATE ERROR ===');
      console.error('Error message:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Error creating hotlist candidate',
        error: error.message
      });
    }
  },

  // Update hotlist candidate with Priority support
  updateHotlistCandidate: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      const { fullName, role, exp, state, relocation, visa, priority } = req.body;
      
      console.log('=== BACKEND UPDATE WITH PRIORITY ===');
      console.log('Update ID:', id);
      console.log('Request body:', req.body);
      
      // Verify candidate exists first
      const checkRequest = new sql.Request();
      checkRequest.input('id', sql.Int, parseInt(id));
      const checkResult = await checkRequest.query(`
        SELECT Id, FullName, Role, Exp, State, Relocation, Visa, Priority
        FROM ProphecyHotlist 
        WHERE Id = @id AND IsActive = 1
      `);
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Candidate not found' 
        });
      }
      
      console.log('Current record in DB:', checkResult.recordset[0]);
      
      // Safe string conversion function
      const safeString = (value) => {
        if (value === null || value === undefined) {
          return '';
        }
        return String(value).trim();
      };
      
      // Process all fields including priority
      const processedData = {
        fullName: safeString(fullName),
        role: safeString(role),
        exp: safeString(exp),
        state: safeString(state),
        relocation: safeString(relocation),
        visa: safeString(visa),
        priority: safeString(priority) || 'Medium'
      };
      
      console.log('Processed data with priority:', processedData);
      
      // Create the update request
      const updateRequest = new sql.Request();
      updateRequest.input('id', sql.Int, parseInt(id));
      updateRequest.input('fullName', sql.NVarChar(255), processedData.fullName);
      updateRequest.input('role', sql.NVarChar(500), processedData.role);
      updateRequest.input('exp', sql.NVarChar(100), processedData.exp);
      updateRequest.input('state', sql.NVarChar(100), processedData.state);
      updateRequest.input('relocation', sql.NVarChar(100), processedData.relocation);
      updateRequest.input('visa', sql.NVarChar(100), processedData.visa);
      updateRequest.input('priority', sql.NVarChar(50), processedData.priority);
      
      console.log('SQL Parameters added successfully with priority');
      
      const updateQuery = `
        UPDATE ProphecyHotlist 
        SET FullName = @fullName,
            Role = @role,
            Exp = @exp,
            State = @state,
            Relocation = @relocation,
            Visa = @visa,
            Priority = @priority,
            UpdatedAt = GETDATE()
        WHERE Id = @id AND IsActive = 1
      `;
      
      console.log('Executing update query with priority...');
      const result = await updateRequest.query(updateQuery);
      
      console.log('Update result - rows affected:', result.rowsAffected[0]);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No rows were updated' 
        });
      }
      
      // Retrieve updated record to confirm changes
      const getRequest = new sql.Request();
      getRequest.input('id', sql.Int, parseInt(id));
      const getResult = await getRequest.query(`
        SELECT Id, FullName, Role, Exp, State, Relocation, Visa, Priority
        FROM ProphecyHotlist 
        WHERE Id = @id
      `);
      
      console.log('Updated record verification with priority:', getResult.recordset[0]);
      
      res.json({
        success: true,
        message: 'Candidate updated successfully',
        data: getResult.recordset[0]
      });
      
    } catch (error) {
      console.error('=== UPDATE ERROR WITH PRIORITY ===');
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      res.status(500).json({ 
        success: false, 
        message: 'Database error occurred',
        error: error.message
      });
    }
  },

  // FIXED: Bulk create with CORRECT ordering to maintain CSV/Excel order (first to last)
  bulkCreateCandidates: async (req, res) => {
    let pool;
    try {
      console.log('\n╔═══════════════════════════════════════╗');
      console.log('║       BULK CREATE CANDIDATES          ║');
      console.log('╚═══════════════════════════════════════╝');
      
      const { candidates } = req.body;

      // INTERNAL VALIDATION - Strict checks
      if (!candidates) {
        console.error('ERROR: No candidates object in request body');
        return res.status(400).json({
          success: false,
          message: 'Request body must contain "candidates" array'
        });
      }

      if (!Array.isArray(candidates)) {
        console.error('ERROR: Candidates is not an array. Type:', typeof candidates);
        return res.status(400).json({
          success: false,
          message: 'Candidates must be an array'
        });
      }

      if (candidates.length === 0) {
        console.error('ERROR: Candidates array is empty');
        return res.status(400).json({
          success: false,
          message: 'Candidates array cannot be empty'
        });
      }

      console.log(`✓ Received ${candidates.length} candidates`);
      console.log(`✓ First candidate: ${candidates[0].fullName}`);

      // Connect to database
      pool = await sql.connect(dbConfig);
      console.log('✓ Database connected\n');

      const baseTimestamp = new Date();
      const successResults = [];
      const errors = [];

      // Process each candidate
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const candidateNum = i + 1;

        try {
          // Get fullName
          const fullName = candidate.fullName ? String(candidate.fullName).trim() : null;

          if (!fullName || fullName === '') {
            errors.push({
              position: candidateNum,
              name: candidate.fullName || '[NO NAME]',
              error: 'Full Name is required and cannot be empty'
            });
            console.log(`[${candidateNum}/${candidates.length}] ✗ Skipped - Missing fullName`);
            continue;
          }

          // Build clean data object
          // Extract number from exp field (e.g., "17+ Years" -> 17)
          let expValue = '';
          if (candidate.exp) {
            const expStr = String(candidate.exp).trim();
            const numberMatch = expStr.match(/\d+/);
            expValue = numberMatch ? numberMatch[0] : '';
          }

          const candidateData = {
            fullName: fullName,
            role: candidate.role ? String(candidate.role).trim() : '',
            exp: expValue,
            state: candidate.state ? String(candidate.state).trim() : '',
            relocation: candidate.relocation ? String(candidate.relocation).trim() : '',
            visa: candidate.visa ? String(candidate.visa).trim() : '',
            priority: candidate.priority ? String(candidate.priority).trim() : 'Medium'
          };

          // Create timestamp to maintain order
          const insertTimestamp = new Date(
            baseTimestamp.getTime() - ((candidates.length - i - 1) * 1000)
          );

          // Create SQL request
          const request = pool.request();
          request.input('fullName', sql.NVarChar(255), candidateData.fullName);
          request.input('role', sql.NVarChar(500), candidateData.role || null);
          request.input('exp', sql.Int, candidateData.exp ? parseInt(candidateData.exp) : null);
          request.input('state', sql.NVarChar(100), candidateData.state || null);
          request.input('relocation', sql.NVarChar(100), candidateData.relocation || null);
          request.input('visa', sql.NVarChar(100), candidateData.visa || null);
          request.input('priority', sql.NVarChar(50), candidateData.priority);
          request.input('insertTime', sql.DateTime2, insertTimestamp);

          const query = `
            INSERT INTO ProphecyHotlist 
              (FullName, Role, Exp, State, Relocation, Visa, Priority, CreatedAt, UpdatedAt, IsActive)
            OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Role, INSERTED.Exp, INSERTED.State, INSERTED.Relocation, INSERTED.Visa, INSERTED.Priority, INSERTED.CreatedAt
            VALUES (@fullName, @role, @exp, @state, @relocation, @visa, @priority, @insertTime, @insertTime, 1)
          `;

          const result = await request.query(query);

          if (result.recordset && result.recordset.length > 0) {
            const inserted = result.recordset[0];
            successResults.push({
              ...inserted,
              originalIndex: i
            });
            console.log(`[${candidateNum}/${candidates.length}] ✓ "${candidateData.fullName}" (ID: ${inserted.Id})`);
          } else {
            throw new Error('No data returned from INSERT');
          }

        } catch (itemError) {
          console.log(`[${candidateNum}/${candidates.length}] ✗ "${candidate.fullName}" - ${itemError.message}`);
          errors.push({
            position: candidateNum,
            name: candidate.fullName || '[NO NAME]',
            error: itemError.message
          });
        }
      }

      // Sort by original index to maintain file order
      const sortedResults = successResults
        .sort((a, b) => a.originalIndex - b.originalIndex)
        .map(({ originalIndex, ...rest }) => rest);

      console.log(`\n╔═══════════════════════════════════════╗`);
      console.log(`║ ✓ Import Complete                     ║`);
      console.log(`║ Success: ${successResults.length}/${candidates.length}                             ║`);
      if (errors.length > 0) {
        console.log(`║ Failed: ${errors.length}                              ║`);
      }
      console.log(`╚═══════════════════════════════════════╝\n`);

      // Send response
      if (successResults.length > 0) {
        return res.status(201).json({
          success: true,
          message: `Successfully imported ${successResults.length} of ${candidates.length} candidates`,
          count: successResults.length,
          successCount: successResults.length,
          errorCount: errors.length,
          data: sortedResults,
          ...(errors.length > 0 && { errors })
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Failed to import any candidates',
          errorCount: errors.length,
          errors: errors
        });
      }

    } catch (error) {
      console.error('\n╔═══════════════════════════════════════╗');
      console.error('║ CRITICAL ERROR                        ║');
      console.error('╚═══════════════════════════════════════╝');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
      
      return res.status(500).json({
        success: false,
        message: 'Server error during bulk import',
        error: error.message
      });

    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (e) {
          console.error('Error closing connection:', e.message);
        }
      }
    }
  },

  // Soft delete hotlist candidate
  deleteHotlistCandidate: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      
      const result = await request.query(`
        UPDATE ProphecyHotlist 
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE Id = @id AND IsActive = 1
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hotlist candidate not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Hotlist candidate deleted successfully'
      });
    } catch (error) {
      console.error('Delete hotlist candidate error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting hotlist candidate', 
        error: error.message 
      });
    }
  },

  // Permanent delete hotlist candidate
  permanentDeleteHotlistCandidate: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      
      const result = await request.query(`
        DELETE FROM ProphecyHotlist 
        WHERE Id = @id
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hotlist candidate not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Hotlist candidate permanently deleted'
      });
    } catch (error) {
      console.error('Permanent delete hotlist candidate error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error permanently deleting hotlist candidate', 
        error: error.message 
      });
    }
  }
};

module.exports = hotlistController;