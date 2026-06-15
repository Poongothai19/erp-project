const sql = require('mssql');
const { dbConfig } = require('../../config/db');

const onboardingTrackingController = {
  // Get onboarding steps for an employee
  getEmployeeOnboarding: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      
      const result = await sql.query(`
        SELECT * FROM EmployeeOnboarding 
        WHERE CompanyId = ${companyId} AND EmployeeId = ${employeeId}
      `);
      
      if (result.recordset.length === 0) {
        return res.json({
          success: true,
          data: {
            onboardingSteps: [],
            onboardingStatus: 'Not Started',
            onboardingProgress: 0
          }
        });
      }
      
      const record = result.recordset[0];
      
      res.json({
        success: true,
        data: {
          id: record.Id,
          templateId: record.TemplateId,
          onboardingSteps: record.OnboardingSteps ? JSON.parse(record.OnboardingSteps) : [],
          onboardingStatus: record.OnboardingStatus,
          onboardingProgress: record.OnboardingProgress,
          currentStepIndex: record.CurrentStepIndex,
          createdAt: record.CreatedAt,
          updatedAt: record.UpdatedAt
        }
      });
    } catch (error) {
      console.error('Error getting employee onboarding:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employee onboarding: ' + error.message 
      });
    }
  },

  // Create or update onboarding for an employee
  saveEmployeeOnboarding: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      
      const {
        employeeTable,
        templateId,
        onboardingSteps,
        onboardingStatus,
        onboardingProgress,
        currentStepIndex
      } = req.body;

      // Check if record exists
      const checkResult = await sql.query(`
        SELECT Id FROM EmployeeOnboarding 
        WHERE CompanyId = ${companyId} AND EmployeeId = ${employeeId}
      `);
      
      const stepsJson = onboardingSteps ? 
        JSON.stringify(onboardingSteps).replace(/'/g, "''") : '[]';
      
      if (checkResult.recordset.length > 0) {
        // Update existing
        const recordId = checkResult.recordset[0].Id;
        
        let updateQuery = `
          UPDATE EmployeeOnboarding 
          SET UpdatedAt = GETDATE()
        `;
        
        if (employeeTable) {
          updateQuery += `, EmployeeTable = '${employeeTable.replace(/'/g, "''")}'`;
        }
        
        if (templateId) {
          updateQuery += `, TemplateId = ${templateId}`;
        }
        
        if (onboardingSteps) {
          updateQuery += `, OnboardingSteps = '${stepsJson}'`;
        }
        
        if (onboardingStatus) {
          updateQuery += `, OnboardingStatus = '${onboardingStatus.replace(/'/g, "''")}'`;
        }
        
        if (onboardingProgress !== undefined) {
          updateQuery += `, OnboardingProgress = ${onboardingProgress}`;
        }
        
        if (currentStepIndex !== undefined) {
          updateQuery += `, CurrentStepIndex = ${currentStepIndex}`;
        }
        
        updateQuery += ` WHERE Id = ${recordId}`;
        
        await sql.query(updateQuery);
        
        res.json({
          success: true,
          message: 'Employee onboarding updated successfully'
        });
      } else {
        // Create new
        const insertQuery = `
          INSERT INTO EmployeeOnboarding (
            CompanyId, EmployeeId, EmployeeTable, TemplateId, 
            OnboardingSteps, OnboardingStatus, OnboardingProgress, 
            CurrentStepIndex, CreatedAt, UpdatedAt
          )
          OUTPUT INSERTED.Id
          VALUES (
            ${companyId},
            ${employeeId},
            '${employeeTable ? employeeTable.replace(/'/g, "''") : 'Unknown'}',
            ${templateId ? templateId : 'NULL'},
            '${stepsJson}',
            '${onboardingStatus ? onboardingStatus.replace(/'/g, "''") : 'Pending'}',
            ${onboardingProgress !== undefined ? onboardingProgress : 0},
            ${currentStepIndex !== undefined ? currentStepIndex : 0},
            GETDATE(),
            GETDATE()
          )
        `;
        
        const result = await sql.query(insertQuery);
        
        res.status(201).json({
          success: true,
          message: 'Employee onboarding created successfully',
          data: { id: result.recordset[0].Id }
        });
      }
    } catch (error) {
      console.error('Error saving employee onboarding:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error saving employee onboarding: ' + error.message 
      });
    }
  },

  // Update a specific step as completed
  completeStep: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId, employeeId } = req.params;
      const { stepIndex } = req.body;
      
      // Get current onboarding data
      const getResult = await sql.query(`
        SELECT OnboardingSteps, OnboardingProgress, CurrentStepIndex 
        FROM EmployeeOnboarding 
        WHERE CompanyId = ${companyId} AND EmployeeId = ${employeeId}
      `);
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Onboarding record not found'
        });
      }
      
      const record = getResult.recordset[0];
      const steps = record.OnboardingSteps ? JSON.parse(record.OnboardingSteps) : [];
      
      // Mark step as completed
      if (steps[stepIndex]) {
        steps[stepIndex].completed = true;
        steps[stepIndex].completedAt = new Date().toISOString();
      }
      
      // Calculate progress
      const completedCount = steps.filter(s => s.completed).length;
      const progress = Math.round((completedCount / steps.length) * 100);
      
      // Find next incomplete step
      const nextStepIndex = steps.findIndex((s, idx) => !s.completed && idx > stepIndex);
      const newCurrentStepIndex = nextStepIndex !== -1 ? nextStepIndex : stepIndex;
      
      // Determine status
      const status = completedCount === steps.length ? 'Completed' : 'In Progress';
      
      // Update database
      const stepsJson = JSON.stringify(steps).replace(/'/g, "''");
      
      await sql.query(`
        UPDATE EmployeeOnboarding 
        SET OnboardingSteps = '${stepsJson}',
            OnboardingStatus = '${status}',
            OnboardingProgress = ${progress},
            CurrentStepIndex = ${newCurrentStepIndex},
            UpdatedAt = GETDATE()
        WHERE CompanyId = ${companyId} AND EmployeeId = ${employeeId}
      `);
      
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

  // Get all employees with onboarding status for a company
  getAllWithOnboarding: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { companyId } = req.params;
      
      // Get employees from the company-specific table
      const tableMap = {
        5: 'CognifyarEmployees',
        2: 'ProphecyConsultingEmployees',
        3: 'ProphecyOffshoreEmployees'
      };
      
      const tableName = tableMap[parseInt(companyId)] || 'CognifyarEmployees';
      
      const employeesResult = await sql.query(`
        SELECT Id, EmployeeId, Name, Email, Phone, Department, Position,
               EmploymentType, Status, HireDate
        FROM ${tableName} 
        ORDER BY CreatedAt DESC
      `);
      
      // Get onboarding data for all employees
      const employeeIds = employeesResult.recordset.map(e => e.Id).join(',');
      
      let onboardingMap = {};
      if (employeeIds.length > 0) {
        const onboardingResult = await sql.query(`
          SELECT EmployeeId, OnboardingStatus, OnboardingProgress, OnboardingSteps
          FROM EmployeeOnboarding 
          WHERE CompanyId = ${companyId} AND EmployeeId IN (${employeeIds})
        `);
        
        onboardingResult.recordset.forEach(record => {
          onboardingMap[record.EmployeeId] = {
            onboardingStatus: record.OnboardingStatus,
            onboardingProgress: record.OnboardingProgress,
            onboardingSteps: record.OnboardingSteps ? JSON.parse(record.OnboardingSteps) : []
          };
        });
      }
      
      // Combine data
      const employees = employeesResult.recordset.map(emp => ({
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
        onboardingStatus: onboardingMap[emp.Id]?.onboardingStatus || 'Not Started',
        onboardingProgress: onboardingMap[emp.Id]?.onboardingProgress || 0,
        onboardingSteps: onboardingMap[emp.Id]?.onboardingSteps || [],
        hasOnboarding: !!onboardingMap[emp.Id]
      }));
      
      res.json({
        success: true,
        data: employees,
        count: employees.length
      });
    } catch (error) {
      console.error('Error getting employees with onboarding:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employees: ' + error.message 
      });
    }
  }
};

module.exports = onboardingTrackingController;