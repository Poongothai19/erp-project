const { poolPromise, sql } = require("../../config/db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Helper to get Monday of a given date (UTC)
const getMondayOfDate = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); 
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/timesheets');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'external-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware for file upload - Exported early to prevent route errors
exports.uploadMiddleware = upload.single('timesheetFile');

// markWeekSubmitted is now a no-op - Exported early
exports.markWeekSubmitted = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Week submission is tracked via the timesheet submit endpoint",
    alreadySubmitted: false
  });
};


// SendGrid API Helper Function
const sendEmailViaSendGrid = async (emailData) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return { success: false, error: 'SendGrid API key not configured' };

    const payload = JSON.stringify({
      personalizations: [{ to: [{ email: emailData.to }], subject: emailData.subject }],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        name: process.env.SENDGRID_FROM_NAME || 'Prophecy'
      },
      content: [{ type: 'text/html', value: emailData.html }]
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            console.error(`[SENDGRID-ERROR] Status: ${res.statusCode}, Body: ${responseBody}`);
            resolve({ success: false, error: `Status ${res.statusCode}: ${responseBody}` });
          }
        });
      });

      req.on('error', (error) => {
        console.error("[SENDGRID-REQ-ERROR]", error);
        reject(error);
      });
      req.write(payload);
      req.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getFrontendURL = (req) => {
  // Priority 1: Origin from request (dynamic)
  if (req && req.get('origin')) return req.get('origin');
  
  // Priority 2: Configured FRONTEND_URL
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.trim();
  
  // Priority 3: Default fallback
  return 'http://localhost:218';
};

/**
 * Notify supervisors when a timesheet is submitted
 */
const notifySupervisors = async (pool, timesheetId, req) => {
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, timesheetId)
      .query(`
        SELECT 
            t.WeekStartDate,
            t.WeekEndDate,
            t.TotalHours,
            TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as EmployeeName,
            COALESCE(sup_email.IdentityValue, sup_ud.email) as SupervisorEmail,
            COALESCE(bkp_email.IdentityValue, bkp_ud.email) as BackupSupervisorEmail,
            (SELECT MIN(EntryDate) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId AND (HoursWorked > 0 OR HourType NOT IN ('REGULAR', 'Regular'))) as ActualStartDate,
            (SELECT MAX(EntryDate) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId AND (HoursWorked > 0 OR HourType NOT IN ('REGULAR', 'Regular'))) as ActualEndDate
        FROM [hrm].[Timesheet] t
        JOIN [hrm].[Employee] e ON t.EmployeeId = e.EmployeeId
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        -- Supervisor Join
        LEFT JOIN [hrm].[Employee] sup ON e.SupervisorEmployeeId = sup.EmployeeId
        LEFT JOIN [recruit].[CandidateIdentity] sup_email ON sup.CandidateId = sup_email.CandidateId 
            AND LOWER(sup_email.IdentityType) = 'email' AND sup_email.IsPrimary = 1
        LEFT JOIN [dbo].[userinfo] sup_u ON sup.EmployeeCode = sup_u.EmployeeId
        LEFT JOIN [dbo].[userdetails] sup_ud ON sup_u.id = sup_ud.id
        -- Backup Supervisor Join
        LEFT JOIN [hrm].[Employee] bkp ON e.BackupSupervisorEmployeeId = bkp.EmployeeId
        LEFT JOIN [recruit].[CandidateIdentity] bkp_email ON bkp.CandidateId = bkp_email.CandidateId 
            AND LOWER(bkp_email.IdentityType) = 'email' AND bkp_email.IsPrimary = 1
        LEFT JOIN [dbo].[userinfo] bkp_u ON bkp.EmployeeCode = bkp_u.EmployeeId
        LEFT JOIN [dbo].[userdetails] bkp_ud ON bkp_u.id = bkp_ud.id
        WHERE t.TimesheetId = @id
      `);

    if (result.recordset.length === 0) return;

    const data = result.recordset[0];
    const { EmployeeName, WeekStartDate, WeekEndDate, TotalHours, SupervisorEmail, BackupSupervisorEmail, ActualStartDate, ActualEndDate } = data;
    
    // Format dates for email
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(ActualStartDate || WeekStartDate);
    const endDateStr = formatDate(ActualEndDate || WeekEndDate);
    
    // Filter out null/undefined emails and deduplicate
    const emails = [...new Set([SupervisorEmail, BackupSupervisorEmail].filter(email => email && email.trim() !== ''))];
    
    if (emails.length === 0) {
      console.log(`[NOTIFY-SUPERVISOR] No valid supervisor emails found for timesheet ID: ${timesheetId}`);
      return;
    }

    const frontendUrl = getFrontendURL(req);
    const approvalLink = `${frontendUrl}/login?redirect=/timesheet-approvals`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #1e3a8a; padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">Timesheet Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; color: #ffffff;">Action Required: Review Pending</p>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p style="font-size: 16px; margin-top: 0;">Hello,</p>
          <p style="font-size: 16px;">This is an automated notification to inform you that <strong>${EmployeeName}</strong> has submitted their timesheet for your review.</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 18px;">Timesheet Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #64748b; width: 40%;">Employee:</td>
                <td style="padding: 5px 0; font-weight: 600;">${EmployeeName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Period Start:</td>
                <td style="padding: 5px 0; font-weight: 600;">${startDateStr}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Period End:</td>
                <td style="padding: 5px 0; font-weight: 600;">${endDateStr}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Total Hours:</td>
                <td style="padding: 5px 0; font-weight: 600; color: #10b981;">${TotalHours} Hours</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 30px;">Please click the button below to view and approve/reject this timesheet in the portal:</p>
          
          <div style="text-align: center;">
            <a href="${approvalLink}" style="display: inline-block; padding: 14px 30px; background: #1e3a8a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background 0.3s ease;">Review & Approve</a>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
          <p style="margin: 0;">This is an automated message from Prophecy ERP System.</p>
          <p style="margin: 5px 0 0 0;">&copy; 2026 Prophecy Technologies. All rights reserved.</p>
        </div>
      </div>
    `;

    for (const email of emails) {
      const emailResult = await sendEmailViaSendGrid({
        to: email,
        subject: `Timesheet Submitted: ${EmployeeName} (Week of ${startDateStr})`,
        html: htmlContent
      });
      
      if (emailResult.success) {
        console.log(`[NOTIFY-SUPERVISOR] Notification email successfully sent to ${email} for Timesheet ID: ${timesheetId}`);
      } else {
        console.error(`[NOTIFY-SUPERVISOR] Failed to send email to ${email}:`, emailResult.error);
      }
    }
  } catch (error) {
    console.error("[NOTIFY-SUPERVISOR] Error in notifySupervisors background process:", error);
  }
};


exports.getUserTimesheets = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.id;
    const { month, year, status } = req.query;
    console.log(`[TIMESHEET-CONTROLLER] Fetching timesheets for user ID: ${userId} (Month: ${month}, Year: ${year})`);
    
    // 1. Resolve the REAL numeric EmployeeId from hrm.Employee
    // We join on EmployeeCode because userinfo.EmployeeId stores the string code (e.g. 'PC2691')
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId, e.EntityId, e.IsDeleted, e.EmployeeCode
        FROM [hrm].[Employee] e 
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode 
        WHERE u.id = @userId
      `);

    if (userResult.recordset.length === 0) {
      console.warn(`[TIMESHEET-CONTROLLER] 404: No employee record found for user ID: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: "User or Employee record not found. Please ensure your account is linked to an active employee record.",
        diagnostic: { userId, reason: "Employee join failed on EmployeeCode" }
      });
    }
    
    const { EmployeeId, IsDeleted, EmployeeCode } = userResult.recordset[0];
    
    if (IsDeleted) {
      console.warn(`[TIMESHEET-CONTROLLER] Warning: User ${userId} is linked to a DELETED employee record (${EmployeeCode})`);
    }


    // 2. Build the query for timesheets
    let query = `
      SELECT 
        t.TimesheetId as id,
        t.TimesheetId as Id,
        t.EmployeeId,
        t.EntityId as CompanyId,
        t.WeekStartDate as PeriodStart,
        t.WeekStartDate,
        t.WeekEndDate,
        t.StatusCode as Status,
        t.TotalHours,
        (SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId) as OvertimeHours,
        t.Notes
      FROM [hrm].[Timesheet] t
      WHERE t.EmployeeId = @employeeId
    `;
    
    const request = pool.request().input("employeeId", sql.BigInt, EmployeeId);

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      // Look back 6 days from the 1st to catch weeks starting in the previous month
      const startDate = new Date(y, m - 1, 1);
      startDate.setDate(startDate.getDate() - 6);
      const endDate = new Date(y, m, 0); 
      
      query += ` AND t.WeekStartDate >= @startDate AND t.WeekStartDate <= @endDate`;
      request.input("startDate", sql.Date, startDate);
      request.input("endDate", sql.Date, endDate);
    }

    if (status) {
      query += ` AND t.StatusCode = @status`;
      request.input("status", sql.NVarChar, status.toUpperCase());
    }

    query += ` ORDER BY t.WeekStartDate DESC`;

    const result = await request.query(query);
    console.log(`[TIMESHEET-CONTROLLER] Found ${result.recordset.length} timesheets for EmployeeId: ${EmployeeId}`);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("[TIMESHEET-CONTROLLER] Error fetching timesheets:", error);
    res.status(500).json({ success: false, message: "Server error while fetching timesheets", error: error.message });
  }
};


exports.getTimesheetById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const timesheetId = req.params.id;

    const timesheetResult = await pool.request()
      .input("id", sql.BigInt, timesheetId)
      .query(`
        SELECT 
          t.TimesheetId as id,
          t.TimesheetId as Id,
          t.*,
          t.WeekStartDate as PeriodStart,
          t.WeekEndDate as PeriodEnd,
          t.StatusCode as Status
        FROM [hrm].[Timesheet] t
        WHERE t.TimesheetId = @id
      `);

    if (timesheetResult.recordset.length === 0) return res.status(404).json({ message: "Timesheet not found" });
    const timesheet = timesheetResult.recordset[0];

    const entriesResult = await pool.request()
      .input("timesheetId", sql.BigInt, timesheetId)
      .query(`
        SELECT 
          TimesheetEntryId as Id,
          EntryDate as Date,
          HoursWorked as Hours,
          Notes as Description,
          HourType
        FROM [hrm].[TimesheetEntry] 
        WHERE TimesheetId = @timesheetId 
        ORDER BY EntryDate
      `);
 
    timesheet.entries = entriesResult.recordset.map(entry => ({
      ...entry,
      IsLeave: entry.HourType?.toUpperCase() === 'LEAVE' || entry.HourType?.toUpperCase() === 'LEAVE',
      IsHoliday: entry.HourType?.toUpperCase() === 'HOLIDAY' || entry.HourType?.toUpperCase() === 'HOLIDAY'
    }));
    res.status(200).json(timesheet);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.saveInternalTimesheet = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.id;
    const { entries, notes, weekStartDate } = req.body;

    if (!entries || !Array.isArray(entries)) return res.status(400).json({ success: false, message: "Invalid entries" });

    // 1. Resolve Monday of the week
    let monday;
    if (weekStartDate) {
      monday = getMondayOfDate(weekStartDate);
    } else if (entries.length > 0) {
      const firstEntryDate = entries[0].date;
      const dateObj = typeof firstEntryDate === 'number' ? new Date(req.body.year, req.body.month - 1, firstEntryDate) : new Date(firstEntryDate);
      monday = getMondayOfDate(dateObj);
    } else {
      return res.status(400).json({ success: false, message: "Could not determine week period" });
    }

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    // 2. Get Employee Info
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId, e.EntityId, ISNULL(e.TimesheetRequired, 1) as TimesheetRequired
        FROM [hrm].[Employee] e 
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode 
        WHERE u.id = @userId
      `);

    if (userResult.recordset.length === 0) return res.status(404).json({ success: false, message: "Employee not found" });
    const { EmployeeId, EntityId, TimesheetRequired } = userResult.recordset[0];

    // ✅ ENFORCEMENT: Block if timesheet not required
    if (TimesheetRequired === false) {
      return res.status(403).json({ 
        success: false, 
        message: "Timesheet submission is not required for your role. Submission blocked." 
      });
    }

    const totalHours = entries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
    const overtimeHours = entries.reduce((sum, entry) => {
      const h = parseFloat(entry.hours) || 0;
      return sum + Math.max(0, h - 8);
    }, 0);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 3. Check for existing weekly timesheet
      const existing = await transaction.request()
        .input("empId", sql.BigInt, EmployeeId)
        .input("monday", sql.Date, monday)
        .query(`SELECT TimesheetId FROM [hrm].[Timesheet] WHERE EmployeeId = @empId AND WeekStartDate = @monday`);

      let timesheetId;
      if (existing.recordset.length > 0) {
        timesheetId = existing.recordset[0].TimesheetId;
        await transaction.request()
          .input("id", sql.BigInt, timesheetId)
          .input("total", sql.Decimal(6, 2), totalHours)
          .input("notes", sql.NVarChar, notes || null)
          .input("userId", sql.BigInt, userId)
          .query(`
            UPDATE [hrm].[Timesheet] 
            SET TotalHours = @total, Notes = @notes, UpdatedAtUtc = SYSUTCDATETIME(), UpdatedByUserId = @userId 
            WHERE TimesheetId = @id
          `);
        await transaction.request().input("tid", sql.BigInt, timesheetId).query(`DELETE FROM [hrm].[TimesheetEntry] WHERE TimesheetId = @tid`);
      } else {
        const insertResult = await transaction.request()
          .input("empId", sql.BigInt, EmployeeId)
          .input("entityId", sql.BigInt, EntityId)
          .input("monday", sql.Date, monday)
          .input("sunday", sql.Date, sunday)
          .input("total", sql.Decimal(6, 2), totalHours)
          .input("notes", sql.NVarChar, notes || null)
          .input("userId", sql.BigInt, userId)
          .query(`
            INSERT INTO [hrm].[Timesheet] (EmployeeId, EntityId, WeekStartDate, WeekEndDate, StatusCode, TotalHours, Notes, CreatedAtUtc, CreatedByUserId)
            VALUES (@empId, @entityId, @monday, @sunday, 'DRAFT', @total, @notes, SYSUTCDATETIME(), @userId);
            SELECT SCOPE_IDENTITY() AS newId;
          `);
        timesheetId = insertResult.recordset[0].newId;
      }

      // 4. Insert Entries
      for (const entry of entries) {
        const dateObj = typeof entry.date === 'number' ? new Date(Date.UTC(req.body.year, req.body.month - 1, entry.date)) : new Date(entry.date);
        await transaction.request()
          .input("tid", sql.BigInt, timesheetId)
          .input("date", sql.Date, dateObj)
          .input("hours", sql.Decimal(5, 2), entry.hours)
          .input("type", sql.NVarChar, (entry.dayType || 'REGULAR').toUpperCase())
          .input("notes", sql.NVarChar, entry.task || entry.description || null)
          .input("userId", sql.BigInt, userId)
          .query(`
            INSERT INTO [hrm].[TimesheetEntry] (TimesheetId, EntryDate, HoursWorked, HourType, Notes, CreatedAtUtc, CreatedByUserId)
            VALUES (@tid, @date, @hours, @type, @notes, SYSUTCDATETIME(), @userId)
          `);
      }

      await transaction.commit();
      res.status(200).json({ success: true, timesheetId });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitTimesheet = async (req, res) => {
  try {
    const pool = await poolPromise;
    const timesheetId = req.params.id;
    const userId = req.user.id;
    const userName = req.user.username || 'Employee';

    const check = await pool.request()
      .input("id", sql.BigInt, timesheetId)
      .query(`
        SELECT t.StatusCode, e.TimesheetRequired 
        FROM [hrm].[Timesheet] t
        JOIN [hrm].[Employee] e ON t.EmployeeId = e.EmployeeId
        WHERE t.TimesheetId = @id
      `);

    if (check.recordset.length === 0) return res.status(404).json({ message: "Timesheet not found" });
    const { StatusCode: fromStatus, TimesheetRequired } = check.recordset[0];

    // ✅ ENFORCEMENT: Block if timesheet not required
    if (TimesheetRequired === false) {
      return res.status(403).json({ 
        success: false, 
        message: "Timesheet submission is not required for your role. Submission blocked." 
      });
    }

    await pool.request()
      .input("id", sql.BigInt, timesheetId)
      .input("userId", sql.BigInt, userId)
      .query(`
        UPDATE [hrm].[Timesheet] 
        SET StatusCode = 'SUBMITTED', SubmittedAtUtc = SYSUTCDATETIME(), SubmittedByUserId = @userId, UpdatedAtUtc = SYSUTCDATETIME() 
        WHERE TimesheetId = @id
      `);

    // Audit Trail
    await pool.request()
      .input("tid", sql.BigInt, timesheetId)
      .input("from", sql.NVarChar, fromStatus)
      .input("userName", sql.NVarChar, userName)
      .input("userId", sql.BigInt, userId)
      .query(`
        INSERT INTO [hrm].[TimesheetStatusHistory] (TimesheetId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
        VALUES (@tid, @from, 'SUBMITTED', SYSUTCDATETIME(), @userId, @userName, 'Timesheet submitted by employee')
      `);

    // Trigger Supervisor Notifications (Async - don't block response)
    notifySupervisors(pool, timesheetId, req).catch(err => console.error("Async Notify Error:", err));

    res.status(200).json({ success: true, message: "Submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadExternalTimesheet = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // 1. Get Employee/Entity Info
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId, e.EntityId, ISNULL(e.TimesheetRequired, 1) as TimesheetRequired
        FROM userinfo u
        JOIN [hrm].[Employee] e ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Employee record not found. Please ensure your account is linked to an active employee record." });
    }

    const { EmployeeId, EntityId, TimesheetRequired } = userResult.recordset[0];

    // ✅ ENFORCEMENT: Block if timesheet not required
    if (TimesheetRequired === false) {
      return res.status(403).json({ 
        success: false, 
        message: "Timesheet submission is not required for your role. Upload blocked." 
      });
    }


    // Calculate current week Monday/Sunday
    const now = new Date();
    const monday = getMondayOfDate(now);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    // 2. Insert into [core].[Document] as requested by USER
    const ext = path.extname(file.originalname).replace('.', '');
    const docResult = await pool.request()
      .input('oname', sql.NVarChar, file.originalname)
      .input('sname', sql.NVarChar, file.filename)
      .input('ext', sql.NVarChar, ext)
      .input('mime', sql.NVarChar, file.mimetype)
      .input('size', sql.BigInt, file.size)
      .input('provider', sql.NVarChar, 'LOCAL')
      .input('locator', sql.NVarChar, file.path)
      .input('userId', sql.BigInt, userId)
      .query(`
        INSERT INTO [core].[Document] (
          OriginalFileName, SystemFileName, FileExtension, MimeType, 
          FileSizeBytes, StorageProvider, StorageLocator, 
          UploadedByUserId, UploadedAtUtc, IsDeleted
        )
        VALUES (
          @oname, @sname, @ext, @mime, 
          @size, @provider, @locator, 
          @userId, SYSUTCDATETIME(), 0
        );
        SELECT SCOPE_IDENTITY() AS DocumentId;
      `);

    const coreDocumentId = docResult.recordset[0].DocumentId;

    // 3. Insert into [hrm].[Timesheet] as an 'External' submission
    // We store the file info in Notes using a prefix for display, but now referencing CoreDocumentId
    const fileMetadata = `ATTACHMENT:${file.originalname}|${file.path}|CORE_DOC_ID:${coreDocumentId}`;


    // 3. Start Transaction for centralized storage synchronization
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Step A: Check for existing weekly timesheet
      const existingResult = await transaction.request()
        .input("empId", sql.BigInt, EmployeeId)
        .input("monday", sql.Date, monday)
        .query(`SELECT TimesheetId, StatusCode FROM [hrm].[Timesheet] WHERE EmployeeId = @empId AND WeekStartDate = @monday`);

      let timesheetId;
      if (existingResult.recordset.length > 0) {
        // UPDATE EXISTING RECORD
        timesheetId = existingResult.recordset[0].TimesheetId;
        const prevStatus = existingResult.recordset[0].StatusCode;

        // ✅ SECURITY: Do not overwrite if already APPROVED
        if (prevStatus === 'APPROVED') {
           console.log(`ℹ️ Timesheet ${timesheetId} is already APPROVED. Skipping Timesheet record update, but saving document.`);
        } else {
          await transaction.request()
            .input("id", sql.BigInt, timesheetId)
            .input("total", sql.Decimal(6, 2), req.body.totalHours || 0)
            .input("notes", sql.NVarChar, fileMetadata)
            .input("userId", sql.BigInt, userId)
            .query(`
              UPDATE [hrm].[Timesheet] 
              SET StatusCode = 'SUBMITTED', 
                  TotalHours = @total, 
                  Notes = CAST(ISNULL(Notes, '') AS NVARCHAR(MAX)) + ' | ' + @notes, 
                  UpdatedAtUtc = SYSUTCDATETIME(), 
                  UpdatedByUserId = @userId,
                  SubmittedAtUtc = SYSUTCDATETIME(),
                  SubmittedByUserId = @userId
              WHERE TimesheetId = @id
            `);

          // Audit Trail for Update
          await transaction.request()
            .input("tid", sql.BigInt, timesheetId)
            .input("from", sql.NVarChar, prevStatus)
            .input("userId", sql.BigInt, userId)
            .input("userName", sql.NVarChar, req.user?.username || 'Employee')
            .query(`
              INSERT INTO [hrm].[TimesheetStatusHistory] (TimesheetId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
              VALUES (@tid, @from, 'SUBMITTED', SYSUTCDATETIME(), @userId, @userName, 'External timesheet file re-uploaded and updated')
            `);
        }
      } else {
        // INSERT NEW RECORD
        const result = await transaction.request()
          .input("empId", sql.BigInt, EmployeeId)
          .input("entityId", sql.BigInt, EntityId)
          .input("monday", sql.Date, monday)
          .input("sunday", sql.Date, sunday)
          .input("status", sql.NVarChar, 'SUBMITTED')
          .input("total", sql.Decimal(6, 2), req.body.totalHours || 0)
          .input("notes", sql.NVarChar, fileMetadata)
          .input("userId", sql.BigInt, userId)
          .query(`
            INSERT INTO [hrm].[Timesheet] (
              EmployeeId, EntityId, WeekStartDate, WeekEndDate, 
              StatusCode, TotalHours, Notes, 
              CreatedAtUtc, CreatedByUserId, SubmittedAtUtc, SubmittedByUserId
            )
            VALUES (
              @empId, @entityId, @monday, @sunday, 
              @status, @total, @notes, 
              SYSUTCDATETIME(), @userId, SYSUTCDATETIME(), @userId
            );
            SELECT SCOPE_IDENTITY() AS newId;
          `);

        timesheetId = result.recordset[0].newId;

        // Audit Trail for New Record
        await transaction.request()
          .input("tid", sql.BigInt, timesheetId)
          .input("userId", sql.BigInt, userId)
          .input("userName", sql.NVarChar, req.user?.username || 'Employee')
          .query(`
            INSERT INTO [hrm].[TimesheetStatusHistory] (TimesheetId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
            VALUES (@tid, 'DRAFT', 'SUBMITTED', SYSUTCDATETIME(), @userId, @userName, 'External timesheet file uploaded and submitted')
          `);
      }

      // Step B: SYNCHRONIZE WITH [hrm].[EmployeeDocument] (Centralization)
      // Check if this core document is already linked to this employee
      const empDocCheck = await transaction.request()
        .input("empId", sql.BigInt, EmployeeId)
        .input("coreId", sql.Int, coreDocumentId)
        .query(`SELECT DocumentId FROM [hrm].[EmployeeDocument] WHERE EmployeeId = @empId AND CoreDocumentId = @coreId`);

      if (empDocCheck.recordset.length === 0) {
        await transaction.request()
          .input("empId", sql.BigInt, EmployeeId)
          .input("coreId", sql.Int, coreDocumentId)
          .input("userId", sql.BigInt, userId)
          .input("notes", sql.NVarChar, `Timesheet for week starting ${monday.toISOString().split('T')[0]}`)
          .query(`
            INSERT INTO [hrm].[EmployeeDocument] (
              EmployeeId, DocumentType, IsActive, IsDeleted, Notes, 
              UpdatedAtUtc, UpdatedByUserId, 
              CoreDocumentId
            )
            VALUES (
              @empId, 'Timesheet', 1, 0, @notes, 
              SYSUTCDATETIME(), @userId, 
              @coreId
            )
          `);
      }

      await transaction.commit();
      console.log(`✅ External timesheet synced with [hrm].[EmployeeDocument] for Employee ${EmployeeId}`);

      // Trigger Supervisor Notifications (Async - don't block response)
      notifySupervisors(pool, timesheetId).catch(err => console.error("Async Notify Error (External):", err));

      res.status(200).json({
        success: true,
        message: "External timesheet uploaded and submitted successfully",
        data: {
          timesheetId,
          coreDocumentId,
          fileName: file.originalname,
          weekStarting: monday.toISOString().split('T')[0]
        }
      });

    } catch (transError) {
      await transaction.rollback();
      throw transError;
    }

  } catch (error) {
    console.error("❌ Error uploading external timesheet:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during file upload", 
      error: error.message 
    });
  }
};

exports.getUploadHistory = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.id;

    // Get Employee Info
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e 
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode 
        WHERE u.id = @userId
      `);

    if (userResult.recordset.length === 0) return res.status(404).json({ success: false, message: "Employee record not found" });
    const employeeId = userResult.recordset[0].EmployeeId;

    // Fetch history from hrm.EmployeeDocument to show ALL uploads
    const result = await pool.request()
      .input("employeeId", sql.BigInt, employeeId)
      .query(`
        SELECT 
          ed.DocumentId as Id,
          d.OriginalFileName as FileName,
          d.UploadedAtUtc as UploadDate,
          ISNULL(t.StatusCode, 'SUBMITTED') as Status,
          t.WeekStartDate as PeriodStart,
          t.WeekEndDate as PeriodEnd
        FROM [hrm].[EmployeeDocument] ed
        JOIN [core].[Document] d ON ed.CoreDocumentId = d.DocumentId
        LEFT JOIN [hrm].[Timesheet] t ON t.EmployeeId = ed.EmployeeId 
             AND t.Notes LIKE '%CORE_DOC_ID:' + CAST(ed.CoreDocumentId as VARCHAR) + '%'
        WHERE ed.EmployeeId = @employeeId 
          AND ed.DocumentType = 'Timesheet' 
          AND ed.IsDeleted = 0
        ORDER BY d.UploadedAtUtc DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error fetching upload history:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.deleteExternalTimesheet = async (req, res) => {
  try {
    const pool = await poolPromise;
    const documentId = req.params.id; // This is now EmployeeDocument ID
    const userId = req.user.id;

    // Soft delete in EmployeeDocument and Core.Document
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const findResult = await transaction.request()
        .input("id", sql.Int, parseInt(documentId))
        .query("SELECT CoreDocumentId FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");

      if (findResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: "Document record not found" });
      }

      const coreId = findResult.recordset[0].CoreDocumentId;

      // Soft delete EmployeeDocument
      await transaction.request()
        .input("id", sql.Int, parseInt(documentId))
        .query("UPDATE [hrm].[EmployeeDocument] SET IsDeleted = 1 WHERE DocumentId = @id");

      // Soft delete CoreDocument
      if (coreId) {
        await transaction.request()
          .input("coreId", sql.Int, coreId)
          .query("UPDATE [core].[Document] SET IsDeleted = 1 WHERE DocumentId = @coreId");
      }

      await transaction.commit();
      res.status(200).json({ success: true, message: "Upload deleted successfully" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("❌ Error deleting external upload:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.downloadExternalTimesheet = async (req, res) => {
  try {
    const pool = await poolPromise;
    const documentId = req.params.id;

    const result = await pool.request()
      .input("id", sql.Int, parseInt(documentId))
      .query(`
        SELECT d.OriginalFileName, d.StorageLocator 
        FROM [hrm].[EmployeeDocument] ed
        JOIN [core].[Document] d ON ed.CoreDocumentId = d.DocumentId
        WHERE ed.DocumentId = @id
      `);

    if (result.recordset.length === 0) return res.status(404).json({ message: "File record not found" });

    const fileName = result.recordset[0].OriginalFileName;
    const storageLocator = result.recordset[0].StorageLocator;

    if (!fs.existsSync(storageLocator)) {
        return res.status(404).json({ message: "Physical file not found on server" });
    }

    res.download(storageLocator, fileName);
  } catch (error) {
    console.error("❌ Error downloading external file:", error);
    res.status(500).json({ message: "Server error during download" });
  }
};

exports.getTimesheetEntries = async (req, res) => {
  const timesheetId = req.params.id;
  
  try {
    const pool = await poolPromise;
    
    const entriesResult = await pool.request()
      .input("timesheetId", sql.BigInt, timesheetId)
      .query(`
        SELECT 
          TimesheetEntryId as Id,
          TimesheetId,
          EntryDate as Date,
          HoursWorked as Hours,
          HourType,
          Notes as Task
        FROM [hrm].[TimesheetEntry]
        WHERE TimesheetId = @timesheetId
        ORDER BY EntryDate ASC
      `);

    res.status(200).json({
      success: true,
      entries: entriesResult.recordset.map(entry => ({
        ...entry,
        IsLeave: entry.HourType?.toUpperCase() === 'LEAVE',
        IsHoliday: entry.HourType?.toUpperCase() === 'HOLIDAY'
      })),
      count: entriesResult.recordset.length
    });
  } catch (error) {
    console.error("Error fetching timesheet entries:", error);
    res.status(500).json({ success: false, message: "Server error while fetching timesheet entries", error: error.message });
  }
};

exports.deleteTimesheet = async (req, res) => {
  const timesheetId = req.params.id;
  
  try {
    const pool = await poolPromise;
    
    // Check if timesheet exists and get its status
    const checkResult = await pool.request()
      .input("id", sql.BigInt, timesheetId)
      .query(`SELECT StatusCode FROM [hrm].[Timesheet] WHERE TimesheetId = @id`);

    const userRole = req.user?.role?.toLowerCase();
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';

    if (checkResult.recordset.length > 0 && 
        !isAdminOrManager && // Only restrict for regular employees
        checkResult.recordset[0].StatusCode !== 'DRAFT' && 
        checkResult.recordset[0].StatusCode !== 'SUBMITTED') {
      return res.status(400).json({ success: false, message: "Only Draft or Submitted timesheets can be deleted" });
    }

    // Use a transaction to clean up related data
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Delete related entries
      await transaction.request()
        .input("id", sql.BigInt, timesheetId)
        .query(`DELETE FROM [hrm].[TimesheetEntry] WHERE TimesheetId = @id`);

      // 2. Delete related status history
      await transaction.request()
        .input("id", sql.BigInt, timesheetId)
        .query(`DELETE FROM [hrm].[TimesheetStatusHistory] WHERE TimesheetId = @id`);

      // 3. Delete the timesheet itself
      await transaction.request()
        .input("id", sql.BigInt, timesheetId)
        .query(`DELETE FROM [hrm].[Timesheet] WHERE TimesheetId = @id`);

      await transaction.commit();
      res.status(200).json({
        success: true,
        message: "Timesheet and related data deleted successfully"
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Error deleting timesheet:", error);
    res.status(500).json({ success: false, message: "Server error while deleting timesheet", error: error.message });
  }
};


exports.getSubmittedWeeks = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    // Get employee ID for the current user
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e 
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode 
        WHERE u.id = @userId AND ISNULL(e.IsDeleted, 0) = 0
      `);


    if (userResult.recordset.length === 0) {
      return res.status(200).json({ success: true, submittedStartDates: [], submittedWeeks: [] });
    }

    const { EmployeeId } = userResult.recordset[0];

    // Get month/year from query params (optional, default to current)
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Fetch all SUBMITTED timesheets for this employee in this month
    const result = await pool.request()
      .input("empId", sql.BigInt, EmployeeId)
      .input("month", sql.Int, month)
      .input("year", sql.Int, year)
      .query(`
        SELECT WeekStartDate
        FROM [hrm].[Timesheet]
        WHERE EmployeeId = @empId
          AND StatusCode = 'SUBMITTED'
          AND ISNULL(IsDeleted, 0) = 0
          AND MONTH(WeekStartDate) = @month
          AND YEAR(WeekStartDate) = @year
      `);

    const submittedStartDates = result.recordset.map(row =>
      new Date(row.WeekStartDate).toISOString().split('T')[0]
    );

    res.status(200).json({
      success: true,
      submittedStartDates,
      submittedWeeks: []  // Legacy field kept for frontend compatibility
    });
  } catch (error) {
    console.error("Error fetching submitted weeks:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


