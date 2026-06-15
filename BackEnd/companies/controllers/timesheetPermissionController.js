// companies/controllers/timesheetPermissionController.js
const { poolPromise, sql } = require("../../config/db");

/**
 * Timesheet Permission Controller
 * Refactored for HRM Centralized Schema [hrm].[Employee]
 */

// Grant editing permission for submitted timesheets
const grantEditingPermission = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { employeeId, allowEditing } = req.body;
    const managerId = req.user?.id;
    const userRole = req.user?.role;
    
    // ✅ ROLE CHECK: Only admins allowed to grant/revoke permissions
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only administrators can grant or revoke timesheet editing permissions"
      });
    }

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const resolvedId = parseInt(employeeId);
    const isNum = !isNaN(resolvedId);

    // Check if employee exists in hrm.Employee
    const employeeCheck = await pool.request();
    if (isNum) {
      employeeCheck.input('employeeId', sql.Int, resolvedId);
      await employeeCheck.query(`
        SELECT e.EmployeeId, TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name
        FROM [hrm].[Employee] e
        JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        WHERE e.EmployeeId = @employeeId
      `);
    } else {
      employeeCheck.input('employeeCode', sql.NVarChar, employeeId);
      await employeeCheck.query(`
        SELECT e.EmployeeId, TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name
        FROM [hrm].[Employee] e
        JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        WHERE e.EmployeeCode = @employeeCode
      `);
    }

    if (employeeCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const employee = employeeCheck.recordset[0];
    const bitValue = allowEditing ? 1 : 0;

    try {
      // Check if permission record exists
      const permissionCheck = await pool.request()
        .input('employeeId', sql.BigInt, employee.EmployeeId)
        .query(`SELECT PermissionId FROM [hrm].[TimesheetPermission] WHERE EmployeeId = @employeeId`);

      if (permissionCheck.recordset.length > 0) {
        await pool.request()
          .input('employeeId', sql.BigInt, employee.EmployeeId)
          .input('allowEditing', sql.Bit, bitValue)
          .input('managerId', sql.Int, managerId)
          .input('reason', sql.NVarChar, allowEditing ? 'Permission Granted' : 'Permission Revoked')
          .query(`
            UPDATE [hrm].[TimesheetPermission]
            SET AllowEditing = @allowEditing,
                GrantedBy = @managerId,
                Reason = @reason,
                UpdatedAtUtc = SYSUTCDATETIME()
            WHERE EmployeeId = @employeeId
          `);
      } else {
        await pool.request()
          .input('employeeId', sql.BigInt, employee.EmployeeId)
          .input('allowEditing', sql.Bit, bitValue)
          .input('managerId', sql.Int, managerId)
          .input('reason', sql.NVarChar, allowEditing ? 'Permission Granted' : 'Permission Revoked')
          .query(`
            INSERT INTO [hrm].[TimesheetPermission] (EmployeeId, AllowEditing, GrantedBy, Reason, GrantedAtUtc, UpdatedAtUtc)
            VALUES (@employeeId, @allowEditing, @managerId, @reason, SYSUTCDATETIME(), SYSUTCDATETIME())
          `);
      }
    } catch (tblErr) {
      console.warn('Cannot save permission, table missing:', tblErr.message);
      return res.status(200).json({
        success: true,
        message: "Note: Explicit permissions require the [hrm].[TimesheetPermission] table. Defaulting to standard lock behavior.",
        data: { employeeId: employee.EmployeeId, employeeName: employee.Name, allowEditing: true }
      });
    }

    res.status(200).json({
      success: true,
      message: allowEditing ? "Permission granted" : "Permission revoked",
      data: {
        employeeId: employee.EmployeeId,
        employeeName: employee.Name,
        allowEditing,
        grantedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error granting permission:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Check editing permission for current user
const checkEditingPermission = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Step 1: Get employee info and TimesheetRequired flag via userinfo
    const userRequest = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId, u.username, ISNULL(e.TimesheetRequired, 1) as TimesheetRequired
        FROM userinfo u
        JOIN [hrm].[Employee] e ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId AND e.IsDeleted = 0
      `);

    if (userRequest.recordset.length === 0) {
      return res.status(200).json({ success: true, allowEditing: false, message: "Employee not found", timesheetRequired: false });
    }

    const { EmployeeId, username, TimesheetRequired } = userRequest.recordset[0];

    // Step 2: Check permission table (graceful fallback if table doesn't exist)
    let allowEditing = true; // Default: allow editing
    let permissionInfo = null;

    try {
      const permissionRequest = await pool.request()
        .input('employeeId', sql.BigInt, EmployeeId)
        .query(`
          SELECT TOP 1 PermissionId, AllowEditing, GrantedAtUtc, Reason
          FROM [hrm].[TimesheetPermission] 
          WHERE EmployeeId = @employeeId
          ORDER BY GrantedAtUtc DESC
        `);

      if (permissionRequest.recordset.length > 0) {
        const permission = permissionRequest.recordset[0];
        allowEditing = !!permission.AllowEditing;
        permissionInfo = {
          permissionId: permission.PermissionId,
          reason: permission.Reason,
          grantedAt: permission.GrantedAtUtc,
          allowEditing: allowEditing
        };
      }
    } catch (permErr) {
      // Table may not exist yet — return default permissive response
      console.warn('TimesheetPermission table not found, defaulting to allowEditing=true:', permErr.message);
    }

    res.status(200).json({
      success: true,
      allowEditing: allowEditing,
      employeeId: EmployeeId,
      username: username,
      timesheetRequired: !!TimesheetRequired,
      permission: permissionInfo
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    // Return safe default so the UI doesn't break
    res.status(200).json({ success: true, allowEditing: true, permission: null });
  }
};

// Get employee editing permission status (for manager view)
const getEmployeeEditingPermission = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const employeeResult = await pool.request()
      .input('employeeId', sql.Int, parseInt(employeeId))
      .query(`
        SELECT e.EmployeeId, TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name
        FROM [hrm].[Employee] e
        JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        WHERE e.EmployeeId = @employeeId AND e.IsDeleted = 0
      `);

    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const employee = employeeResult.recordset[0];

    let hasPermission = false;
    let permission = null;
    let allowEditing = false;

    try {
      const permissionResult = await pool.request()
        .input('employeeId', sql.Int, employee.EmployeeId)
        .query(`
          SELECT TOP 1 PermissionId, AllowEditing, GrantedAtUtc, Reason
          FROM [hrm].[TimesheetPermission] 
          WHERE EmployeeId = @employeeId
          ORDER BY GrantedAtUtc DESC
        `);

      hasPermission = permissionResult.recordset.length > 0;
      permission = hasPermission ? permissionResult.recordset[0] : null;
      allowEditing = hasPermission ? !!permission.AllowEditing : true;
    } catch (tblErr) {
      console.warn('TimesheetPermission table not found, defaulting to allowEditing=true:', tblErr.message);
      allowEditing = true;
    }

    res.status(200).json({
      success: true,
      hasPermission: hasPermission,
      permission: permission,
      allowEditing: allowEditing,
      employee: employee
    });
  } catch (error) {
    console.error('Error fetching employee permission:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  checkEditingPermission,
  grantEditingPermission,
  getEmployeeEditingPermission
};