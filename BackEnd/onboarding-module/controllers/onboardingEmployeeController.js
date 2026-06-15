const sql = require('mssql');
const { dbConfig } = require('../../config/db');
const bcrypt = require('bcrypt');

// Helper to get employee table based on company ID
const getEmployeeTable = (companyId) => {
  const tableMap = {
    5: 'CognifyarEmployees',
    2: 'ProphecyConsultingEmployees',
    3: 'ProphecyOffshoreEmployees'
  };
  return tableMap[parseInt(companyId)] || 'CognifyarEmployees';
};

const onboardingEmployeeController = {
  // Get all employees for a company - SIMPLE QUERY without onboarding columns
  getAllEmployees: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId } = req.params;
      
      const tableName = getEmployeeTable(companyId);
      
      // Simple query - only existing columns
      const query = `
        SELECT Id, EmployeeId, Name, Email, Phone, Department, Position,
               EmploymentType, Status, HireDate, StreetAddress, City, State, ZipCode,
               CreatedAt, UpdatedAt
        FROM ${tableName} 
        ORDER BY CreatedAt DESC
      `;
      
      const result = await sql.query(query);
      
      const employees = result.recordset.map(emp => ({
        id: emp.Id,
        employeeId: emp.EmployeeId || '',
        name: emp.Name || '',
        email: emp.Email || '',
        phone: emp.Phone || '',
        department: emp.Department || '',
        position: emp.Position || '',
        employmentType: emp.EmploymentType || 'Full-time',
        status: emp.Status || 'Active',
        hireDate: emp.HireDate,
        streetAddress: emp.StreetAddress || '',
        city: emp.City || '',
        state: emp.State || '',
        zipCode: emp.ZipCode || '',
        createdAt: emp.CreatedAt,
        updatedAt: emp.UpdatedAt
      }));
      
      res.json({
        success: true,
        data: employees,
        count: employees.length
      });
    } catch (error) {
      console.error('Error getting employees:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employees: ' + error.message 
      });
    }
  },

  // Create new employee - WITHOUT any onboarding columns
  createEmployee: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId } = req.params;
      
      const {
        name, email, department, employeeId,
        position, hireDate, phone,
        streetAddress, city, state, zipCode,
        username, password
        // REMOVED onboardingSteps and templateId
      } = req.body;

      console.log('Creating employee with data:', {
        name, email, department, employeeId
      });

      // Validate required fields
      if (!name || !email || !department || !employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Name, Email, Department, and Employee ID are required'
        });
      }

      const tableName = getEmployeeTable(companyId);
      const normalizedEmail = email.toLowerCase();

      // Check if employee exists
      const checkResult = await sql.query(`
        SELECT Id FROM ${tableName} 
        WHERE Email = '${normalizedEmail}' OR EmployeeId = '${employeeId.replace(/'/g, "''")}'
      `);
      
      if (checkResult.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Employee with this email or ID already exists in this company'
        });
      }

      let userAuthId = null;

      // Create user account if username/password provided
      if (username && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userResult = await sql.query(`
          INSERT INTO userinfo (username, password, role, EmployeeId)
          OUTPUT INSERTED.id
          VALUES (
            '${username.replace(/'/g, "''")}', 
            '${hashedPassword}', 
            'employee', 
            '${employeeId.replace(/'/g, "''")}'
          )
        `);
        
        userAuthId = userResult.recordset[0].id;

        const nameParts = name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await sql.query(`
          INSERT INTO userdetails (id, firstName, lastName, email)
          VALUES (
            ${userAuthId}, 
            N'${firstName.replace(/'/g, "''")}', 
            N'${lastName.replace(/'/g, "''")}', 
            '${normalizedEmail}'
          )
        `);
      }

      // Simple insert WITHOUT onboarding columns
      const insertQuery = `
        INSERT INTO ${tableName} (
          EmployeeId, Name, Email, Phone, Department, Position,
          HireDate, StreetAddress, City, State, ZipCode,
          CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.Id
        VALUES (
          '${employeeId.replace(/'/g, "''")}', 
          N'${name.replace(/'/g, "''")}', 
          '${normalizedEmail}', 
          '${phone ? phone.replace(/'/g, "''") : ''}', 
          N'${department.replace(/'/g, "''")}', 
          N'${position ? position.replace(/'/g, "''") : ''}', 
          ${hireDate ? `'${hireDate}'` : 'NULL'},
          N'${streetAddress ? streetAddress.replace(/'/g, "''") : ''}', 
          N'${city ? city.replace(/'/g, "''") : ''}', 
          N'${state ? state.replace(/'/g, "''") : ''}', 
          '${zipCode ? zipCode.replace(/'/g, "''") : ''}',
          GETDATE(), GETDATE()
        )
      `;
      
      console.log('Insert query:', insertQuery);
      const result = await sql.query(insertQuery);
      
      const newId = result.recordset[0].Id;

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: {
          id: newId,
          employeeId,
          name,
          email: normalizedEmail,
          department,
          position
        }
      });

    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating employee: ' + error.message 
      });
    }
  },

  // Get employee by ID - SIMPLE query
  getEmployeeById: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      
      const tableName = getEmployeeTable(companyId);
      
      const query = `
        SELECT Id, EmployeeId, Name, Email, Phone, Department, Position,
               EmploymentType, Status, HireDate, StreetAddress, City, State, ZipCode,
               CreatedAt, UpdatedAt
        FROM ${tableName} 
        WHERE Id = ${employeeId}
      `;
      
      const result = await sql.query(query);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Employee not found' 
        });
      }
      
      const emp = result.recordset[0];
      
      res.json({
        success: true,
        data: {
          id: emp.Id,
          employeeId: emp.EmployeeId,
          name: emp.Name,
          email: emp.Email,
          phone: emp.Phone,
          department: emp.Department,
          position: emp.Position,
          employmentType: emp.EmploymentType,
          status: emp.Status,
          hireDate: emp.HireDate,
          streetAddress: emp.StreetAddress,
          city: emp.City,
          state: emp.State,
          zipCode: emp.ZipCode,
          createdAt: emp.CreatedAt,
          updatedAt: emp.UpdatedAt
        }
      });
    } catch (error) {
      console.error('Error getting employee:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employee: ' + error.message 
      });
    }
  },

  // Update employee
  updateEmployee: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      
      const {
        name, email, phone, department, position,
        hireDate, streetAddress, city, state, zipCode,
        status
      } = req.body;
      
      const tableName = getEmployeeTable(companyId);
      const normalizedEmail = email.toLowerCase();
      
      await sql.query(`
        UPDATE ${tableName} 
        SET Name = N'${name.replace(/'/g, "''")}',
            Email = '${normalizedEmail}',
            Phone = '${phone ? phone.replace(/'/g, "''") : ''}',
            Department = N'${department.replace(/'/g, "''")}',
            Position = N'${position ? position.replace(/'/g, "''") : ''}',
            HireDate = ${hireDate ? `'${hireDate}'` : 'NULL'},
            StreetAddress = N'${streetAddress ? streetAddress.replace(/'/g, "''") : ''}',
            City = N'${city ? city.replace(/'/g, "''") : ''}',
            State = N'${state ? state.replace(/'/g, "''") : ''}',
            ZipCode = '${zipCode ? zipCode.replace(/'/g, "''") : ''}',
            Status = '${status ? status.replace(/'/g, "''") : 'Active'}',
            UpdatedAt = GETDATE()
        WHERE Id = ${employeeId}
      `);

      res.json({
        success: true,
        message: 'Employee updated successfully'
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating employee: ' + error.message 
      });
    }
  },

  // Delete employee
  deleteEmployee: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      
      const tableName = getEmployeeTable(companyId);
      
      await sql.query(`
        DELETE FROM ${tableName} WHERE Id = ${employeeId}
      `);

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting employee: ' + error.message 
      });
    }
  },

  // Update employee onboarding status (Placeholder)
  updateEmployeeOnboarding: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Onboarding update received (placeholder)'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};


module.exports = onboardingEmployeeController;