const { poolPromise, sql } = require("../../config/db");

/**
 * Helper to get Monday of a given date (UTC)
 */
const getMondayOfDate = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); 
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
};

/**
 * Synchronize Punch duration to TimesheetEntry
 */
const syncPunchToTimesheet = async (pool, employeeId, entityId, userId, punchDate) => {
  console.log(`[SYNC-PUNCH] Starting sync for EmpID: ${employeeId}, Date: ${punchDate}`);
  try {
    // 1. Calculate total hours for today from all IN/OUT pairs
    const punchResult = await pool.request()
      .input("empId", sql.BigInt, employeeId)
      .input("date", sql.Date, punchDate)
      .query(`
        SELECT PunchType, PunchTimeUtc 
        FROM [hrm].[TimePunch] 
        WHERE EmployeeId = @empId AND PunchDate = @date AND IsDeleted = 0
        ORDER BY PunchTimeUtc ASC
      `);
    
    const punches = punchResult.recordset;
    console.log(`[SYNC-PUNCH] Found ${punches.length} punches for today`);

    let totalMs = 0;
    let lastInTime = null;

    for (const p of punches) {
      if (p.PunchType === 'IN') {
        lastInTime = new Date(p.PunchTimeUtc);
      } else if (p.PunchType === 'OUT' && lastInTime) {
        totalMs += (new Date(p.PunchTimeUtc) - lastInTime);
        lastInTime = null;
      }
    }

    if (totalMs <= 0) {
      console.log(`[SYNC-PUNCH] No complete IN/OUT pairs found or duration is zero. skipping sync.`);
      return;
    }

    // Convert to hours and round to 2 decimal places
    const hoursWorked = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
    console.log(`[SYNC-PUNCH] Calculated hours worked: ${hoursWorked}`);

    // 2. Determine Week boundaries
    const monday = getMondayOfDate(punchDate);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    console.log(`[SYNC-PUNCH] Week period: ${monday.toISOString().split('T')[0]} to ${sunday.toISOString().split('T')[0]}`);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 3. Find or Create Timesheet
      let timesheetId;
      const tsCheck = await transaction.request()
        .input("empId", sql.BigInt, employeeId)
        .input("monday", sql.Date, monday)
        .query(`SELECT TimesheetId FROM [hrm].[Timesheet] WHERE EmployeeId = @empId AND WeekStartDate = @monday`);

      if (tsCheck.recordset.length > 0) {
        timesheetId = tsCheck.recordset[0].TimesheetId;
        console.log(`[SYNC-PUNCH] Found existing timesheet ID: ${timesheetId}`);
      } else {
        console.log(`[SYNC-PUNCH] Creating new DRAFT timesheet...`);
        const tsInsert = await transaction.request()
          .input("empId", sql.BigInt, employeeId)
          .input("entityId", sql.BigInt, entityId)
          .input("monday", sql.Date, monday)
          .input("sunday", sql.Date, sunday)
          .input("userId", sql.BigInt, userId)
          .query(`
            INSERT INTO [hrm].[Timesheet] (EmployeeId, EntityId, WeekStartDate, WeekEndDate, StatusCode, TotalHours, CreatedAtUtc, CreatedByUserId)
            VALUES (@empId, @entityId, @monday, @sunday, 'DRAFT', 0, SYSUTCDATETIME(), @userId);
            SELECT SCOPE_IDENTITY() as id;
          `);
        timesheetId = tsInsert.recordset[0].id;
        console.log(`[SYNC-PUNCH] Created new timesheet ID: ${timesheetId}`);
      }

      // 4. Upsert TimesheetEntry for today
      console.log(`[SYNC-PUNCH] Upserting entry for ${punchDate} with ${hoursWorked} hours...`);
      await transaction.request()
        .input("tid", sql.BigInt, timesheetId)
        .input("date", sql.Date, punchDate)
        .input("hours", sql.Decimal(5, 2), hoursWorked)
        .input("userId", sql.BigInt, userId)
        .query(`
          IF EXISTS (SELECT 1 FROM [hrm].[TimesheetEntry] WHERE TimesheetId = @tid AND EntryDate = @date)
          BEGIN
            UPDATE [hrm].[TimesheetEntry] 
            SET HoursWorked = @hours, Notes = 'Updated via Time Punch', UpdatedAtUtc = SYSUTCDATETIME(), UpdatedByUserId = @userId
            WHERE TimesheetId = @tid AND EntryDate = @date
          END
          ELSE
          BEGIN
            INSERT INTO [hrm].[TimesheetEntry] (TimesheetId, EntryDate, HoursWorked, HourType, Notes, CreatedAtUtc, CreatedByUserId)
            VALUES (@tid, @date, @hours, 'REGULAR', 'Recorded via Time Punch', SYSUTCDATETIME(), @userId)
          END
        `);

      // 5. Update TotalHours in Timesheet
      await transaction.request()
        .input("tid", sql.BigInt, timesheetId)
        .query(`
          UPDATE [hrm].[Timesheet]
          SET TotalHours = (SELECT ISNULL(SUM(HoursWorked), 0) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = @tid)
          WHERE TimesheetId = @tid
        `);

      await transaction.commit();
      console.log(`[SYNC-PUNCH] SUCCESS: Synced ${hoursWorked} hours for Emp ${employeeId} on ${punchDate}`);
    } catch (err) {
      await transaction.rollback();
      console.error(`[SYNC-PUNCH] Transaction failed:`, err.message);
      throw err;
    }
  } catch (error) {
    console.error("[SYNC-PUNCH-FATAL-ERROR]", error);
  }
};

/**
 * Controller for handling [hrm].[TimePunch] operations
 */
const timePunchController = {
  /**
   * Handle Clock-In and Clock-Out
   */
  punch: async (req, res) => {
    try {
      const { employeeId, punchType, latitude, longitude, manualReason } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      if (!employeeId || !punchType) {
        return res.status(400).json({ success: false, message: "EmployeeId and PunchType are required" });
      }

      if (!['IN', 'OUT'].includes(punchType.toUpperCase())) {
        return res.status(400).json({ success: false, message: "PunchType must be IN or OUT" });
      }

      const pool = await poolPromise;
      let resolvedEmpId = employeeId;

      // 0. Resolve Numeric EmployeeId if a string code is provided
      if (isNaN(employeeId)) {
        const resolveResult = await pool.request()
          .input("empCode", sql.NVarChar, employeeId)
          .query("SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @empCode AND IsDeleted = 0");
        
        if (resolveResult.recordset.length === 0) {
          return res.status(404).json({ success: false, message: `Employee with code ${employeeId} not found` });
        }
        resolvedEmpId = resolveResult.recordset[0].EmployeeId;
      }

      // 1. Verify Employee exists and has TimePunchEnabled
      const empResult = await pool.request()
        .input("empId", sql.BigInt, resolvedEmpId)
        .query(`
          SELECT EntityId, TimePunchEnabled, EmployeeType 
          FROM [hrm].[Employee] 
          WHERE EmployeeId = @empId AND IsDeleted = 0
        `);

      if (empResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: "Employee record not found" });
      }

      const employee = empResult.recordset[0];
      // Update checkResult and INSERT to use resolvedEmpId
      if (!employee.TimePunchEnabled) {
        return res.status(403).json({ success: false, message: "Time punching is not enabled for this employee" });
      }

      // 2. Check for existing punch today of same type (Phase 1 restriction: once per day)
      const today = new Date().toISOString().split('T')[0];
      const checkResult = await pool.request()
        .input("empId", sql.BigInt, resolvedEmpId)
        .input("type", sql.NVarChar, punchType.toUpperCase())
        .input("today", sql.Date, today)
        .query(`
          SELECT TimePunchId FROM [hrm].[TimePunch]
          WHERE EmployeeId = @empId AND PunchType = @type AND PunchDate = @today AND IsDeleted = 0
        `);

      if (checkResult.recordset.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `You have already clocked ${punchType.toLowerCase()} for today (${today}).` 
        });
      }

      // 3. Perform the punch
      const result = await pool.request()
        .input("empId", sql.BigInt, resolvedEmpId)
        .input("entityId", sql.BigInt, employee.EntityId)
        .input("type", sql.NVarChar, punchType.toUpperCase())
        .input("punchTime", sql.DateTime2, new Date())
        .input("punchDate", sql.Date, today)
        .input("ip", sql.NVarChar, ipAddress)
        .input("lat", sql.Decimal(9, 6), latitude || null)
        .input("lon", sql.Decimal(9, 6), longitude || null)
        .input("isManual", sql.Bit, manualReason ? 1 : 0)
        .input("reason", sql.NVarChar, manualReason || null)
        .input("userId", sql.BigInt, userId)
        .query(`
          INSERT INTO [hrm].[TimePunch] (
            EmployeeId, EntityId, PunchType, PunchTimeUtc, PunchDate, 
            IpAddress, LocationLatitude, LocationLongitude, 
            PunchSource, IsManualEntry, ManualEntryReason, 
            CreatedAtUtc, CreatedByUserId
          )
          OUTPUT INSERTED.TimePunchId, INSERTED.PunchTimeUtc
          VALUES (
            @empId, @entityId, @type, SYSUTCDATETIME(), @punchDate, 
            @ip, @lat, @lon, 
            'WEB', @isManual, @reason, 
            SYSUTCDATETIME(), @userId
          )
        `);

      res.status(201).json({
        success: true,
        message: `Successfully clocked ${punchType.toLowerCase()}`,
        data: result.recordset[0]
      });

      // 4. If Clock Out, Sync to Timesheet
      if (punchType.toUpperCase() === 'OUT') {
        syncPunchToTimesheet(pool, resolvedEmpId, employee.EntityId, userId, today)
          .catch(err => console.error("Async Sync Error:", err));
      }

    } catch (error) {
      console.error("❌ Time Punch Error:", error);
      res.status(500).json({ success: false, message: "Error processing time punch", error: error.message });
    }
  },

  /**
   * Get punch status for today
   */
  getTodayStatus: async (req, res) => {
    try {
      const { employeeId } = req.params;
      if (!employeeId) return res.status(400).json({ success: false, message: "EmployeeId is required" });

      const pool = await poolPromise;
      let resolvedEmpId = employeeId;

      // Resolve Numeric EmployeeId if a string code is provided
      if (isNaN(employeeId)) {
        const resolveResult = await pool.request()
          .input("empCode", sql.NVarChar, employeeId)
          .query("SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @empCode AND IsDeleted = 0");
        
        if (resolveResult.recordset.length === 0) return res.json({ success: true, data: { punches: [] } });
        resolvedEmpId = resolveResult.recordset[0].EmployeeId;
      }

      const today = new Date().toISOString().split('T')[0];

      const result = await pool.request()
        .input("empId", sql.BigInt, resolvedEmpId)
        .input("today", sql.Date, today)
        .query(`
          SELECT PunchType, PunchTimeUtc, IsManualEntry
          FROM [hrm].[TimePunch]
          WHERE EmployeeId = @empId AND PunchDate = @today AND IsDeleted = 0
          ORDER BY PunchTimeUtc ASC
        `);

      const status = {
        hasClockedIn: result.recordset.some(p => p.PunchType === 'IN'),
        hasClockedOut: result.recordset.some(p => p.PunchType === 'OUT'),
        punches: result.recordset,
        serverTime: new Date()
      };

      res.json({ success: true, data: status });
    } catch (error) {
      console.error("❌ Get Status Error:", error);
      res.status(500).json({ success: false, message: "Error retrieving punch status" });
    }
  },

  /**
   * Get punch history for an employee
   */
  getHistory: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { limit = 30 } = req.query;
      
      const pool = await poolPromise;
      let resolvedEmpId = employeeId;

      // Resolve Numeric EmployeeId if a string code is provided
      if (isNaN(employeeId)) {
        const resolveResult = await pool.request()
          .input("empCode", sql.NVarChar, employeeId)
          .query("SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @empCode AND IsDeleted = 0");
        
        if (resolveResult.recordset.length === 0) return res.json({ success: true, data: [] });
        resolvedEmpId = resolveResult.recordset[0].EmployeeId;
      }

      const result = await pool.request()
        .input("empId", sql.BigInt, resolvedEmpId)
        .input("limit", sql.Int, parseInt(limit))
        .query(`
          SELECT TOP (@limit) *
          FROM [hrm].[TimePunch]
          WHERE EmployeeId = @empId AND IsDeleted = 0
          ORDER BY PunchDate DESC, PunchTimeUtc DESC
        `);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      console.error("❌ Get History Error:", error);
      res.status(500).json({ success: false, message: "Error retrieving punch history" });
    }
  }
};

module.exports = timePunchController;
