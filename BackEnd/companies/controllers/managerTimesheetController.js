// const { poolPromise, sql } = require("../../config/db");
// const employeeController = require("./employeeController");

// // Helper function to format dates
// const formatDate = (date) => {
//   if (!date) return null;
//   return new Date(date).toISOString().split('T')[0];
// };

// /**
//  * Manager Timesheet Management Controller
//  * Schema-aligned for [hrm] module (2026-04-15 DDL)
//  */

// // Get all pending timesheets across all companies
// exports.getPendingTimesheetsAllCompanies = async (req, res) => {
//   try {
//     const pool = await poolPromise;
    
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     // Get the numeric EmployeeId of the requester
//     const userResult = await pool.request()
//       .input('userId', sql.Int, userId)
//       .query(`
//         SELECT e.EmployeeId 
//         FROM [hrm].[Employee] e WITH (NOLOCK)
//         JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
//         WHERE u.id = @userId
//       `);
//     const requesterEmployeeId = userResult.recordset[0]?.EmployeeId || null;

//     // ✅ RULE:
//     // - super_admin -> see ALL pending timesheets (including admin ones)
//     // - admin, manager, teamlead, team_lead → see pending timesheets (usually excluding admins/self unless they are super_admin)
//     // - regular employee who is a supervisor → see ONLY their subordinates' timesheets
//     const isPrivilegedRole = ['admin', 'super_admin', 'manager', 'teamlead', 'team_lead'].includes(userRole);

//     let supervisorFilterSQL = '';
//     if (userRole === 'super_admin') {
//       supervisorFilterSQL = '';
//     } else if (isPrivilegedRole) {
//       supervisorFilterSQL = `AND e.EmployeeCode NOT IN (SELECT EmployeeId FROM userinfo WHERE role = 'admin' OR role = 'super_admin')`;
//     } else if (requesterEmployeeId) {
//       supervisorFilterSQL = `AND (
//         e.SupervisorEmployeeId = @requesterId OR 
//         e.BackupSupervisorEmployeeId = @requesterId
//       )`;
//     }

//     const query = `
//       SELECT 
//         t.TimesheetId as id,
//         t.TimesheetId as Id,
//         t.EmployeeId,
//         e.EmployeeCode,
//         t.EntityId as CompanyId,
//         t.WeekStartDate as periodStart,
//         t.WeekEndDate as periodEnd,
//         t.TotalHours,
//         (SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WITH (NOLOCK) WHERE TimesheetId = t.TimesheetId) as OvertimeHours,
//         'Pending' as status,
//         t.StatusCode,
//         t.SubmittedAtUtc as SubmittedDate,
//         t.CreatedAtUtc as CreatedAt,
//         TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as employeeName,
//         ci_email.IdentityValue as EmployeeEmail,
//         ci_phone.IdentityValue as EmployeePhone,
//         c.JobTitle as Position,
//         comp.EntityName as CompanyName,
//         t.Approver,
//         t.Notes
//       FROM [hrm].[Timesheet] t WITH (NOLOCK)
//       JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
//       LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
//       LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//       LEFT JOIN [recruit].[CandidateIdentity] ci_phone WITH (NOLOCK) ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
//       LEFT JOIN [core].[Entity] comp WITH (NOLOCK) ON t.EntityId = comp.EntityId
//       WHERE t.StatusCode = 'SUBMITTED'
//       AND (t.Notes IS NULL OR t.Notes NOT LIKE 'ATTACHMENT:%')
//       ${supervisorFilterSQL}
//       ORDER BY t.SubmittedAtUtc DESC, t.CreatedAtUtc DESC
//     `;

//     const result = await pool.request()
//       .input('requesterId', sql.Int, requesterEmployeeId)
//       .query(query);


//     // Map result to detect attachments
//     const dataWithAttachments = result.recordset.map(row => {
//       const hasAttachment = row.Notes && row.Notes.startsWith('ATTACHMENT:');
//       let fileName = null;
//       if (hasAttachment) {
//         fileName = row.Notes.replace('ATTACHMENT:', '').split('|')[0];
//       }
//       return {
//         ...row,
//         hasAttachment,
//         fileName
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: dataWithAttachments,
//       count: dataWithAttachments.length
//     });
//   } catch (error) {
//     console.error('Error fetching all pending timesheets:', error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // Get all timesheets for a specific company
// exports.getCompanyTimesheets = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const companyId = req.params.companyId;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     // Get the numeric EmployeeId of the requester
//     const userResult = await pool.request()
//       .input('userId', sql.Int, userId)
//       .query(`
//         SELECT e.EmployeeId 
//         FROM [hrm].[Employee] e WITH (NOLOCK)
//         JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
//         WHERE u.id = @userId
//       `);
//     const requesterEmployeeId = userResult.recordset[0]?.EmployeeId || null;

//     // ✅ RULE:
//     // - super_admin -> see ALL timesheets
//     // - admin, manager, teamlead, team_lead → see timesheets (usually excluding peer admins)
//     // - regular employee who is a supervisor → see ONLY their subordinates' timesheets
//     const isPrivilegedRole = ['admin', 'super_admin', 'manager', 'teamlead', 'team_lead'].includes(userRole);

//     // Only apply supervisor filtering for regular employees who happen to be supervisors
//     let supervisorFilterSQL = '';
//     if (userRole === 'super_admin') {
//       supervisorFilterSQL = '';
//     } else if (isPrivilegedRole) {
//       supervisorFilterSQL = `AND e.EmployeeCode NOT IN (SELECT EmployeeId FROM userinfo WHERE role = 'admin' OR role = 'super_admin')`;
//     } else if (requesterEmployeeId) {
//       supervisorFilterSQL = `AND (
//         e.SupervisorEmployeeId = @requesterId OR 
//         e.BackupSupervisorEmployeeId = @requesterId
//       )`;
//     }

//     const query = `
//       SELECT 
//         t.TimesheetId as id,
//         t.TimesheetId as Id,
//         t.EmployeeId,
//         e.EmployeeCode,
//         t.EntityId as CompanyId,
//         t.WeekStartDate as periodStart,
//         t.WeekEndDate as periodEnd,
//         t.TotalHours,
//         (SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId) as OvertimeHours,
//         CASE 
//           WHEN t.StatusCode = 'SUBMITTED' THEN 'Pending'
//           WHEN t.StatusCode = 'APPROVED' THEN 'Approved'
//           WHEN t.StatusCode = 'REJECTED' THEN 'Rejected'
//           ELSE t.StatusCode
//         END as status,
//         t.Notes,
//         t.SubmittedAtUtc as SubmittedDate,
//         t.CreatedAtUtc as CreatedAt,
//         t.UpdatedAtUtc as UpdatedAt,
//         t.ApprovedByEmployeeId as ApprovedBy,
//         t.ApprovedAtUtc as ApprovedAt,
//         t.Approver,
//         TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as employeeName,
//         ci_email.IdentityValue as EmployeeEmail,
//         ci_phone.IdentityValue as EmployeePhone,
//         c.JobTitle as Position,
//         comp.EntityName as CompanyName
//       FROM [hrm].[Timesheet] t WITH (NOLOCK)
//       JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
//       LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
//       LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//       LEFT JOIN [recruit].[CandidateIdentity] ci_phone WITH (NOLOCK) ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
//       LEFT JOIN [core].[Entity] comp WITH (NOLOCK) ON t.EntityId = comp.EntityId
//       WHERE t.EntityId = @companyId AND t.StatusCode != 'DRAFT'
//       AND (t.Notes IS NULL OR t.Notes NOT LIKE 'ATTACHMENT:%')
//       ${supervisorFilterSQL}
//       ORDER BY 
//         CASE 
//           WHEN t.StatusCode = 'SUBMITTED' THEN 1
//           WHEN t.StatusCode = 'APPROVED' THEN 2
//           WHEN t.StatusCode = 'REJECTED' THEN 3
//           ELSE 4
//         END,
//         t.WeekStartDate DESC, 
//         t.CreatedAtUtc DESC
//     `;

//     const result = await pool.request()
//       .input('companyId', sql.BigInt, companyId)
//       .input('requesterId', sql.Int, requesterEmployeeId)
//       .query(query);


//     // Map result to detect attachments
//     const dataWithAttachments = result.recordset.map(row => {
//       const hasAttachment = row.Notes && row.Notes.startsWith('ATTACHMENT:');
//       let fileName = null;
//       if (hasAttachment) {
//         fileName = row.Notes.replace('ATTACHMENT:', '').split('|')[0];
//       }
//       return {
//         ...row,
//         hasAttachment,
//         fileName
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: dataWithAttachments,
//       count: dataWithAttachments.length,
//       companyId: parseInt(companyId)
//     });
//   } catch (error) {
//     console.error('Error fetching company timesheets:', error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // Get timesheet statistics
// exports.getTimesheetStats = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const companyId = req.params.companyId;
    
//     const query = `
//       SELECT 
//         COUNT(*) as totalTimesheets,
//         SUM(CASE WHEN StatusCode = 'SUBMITTED' THEN 1 ELSE 0 END) as pendingCount,
//         SUM(CASE WHEN StatusCode = 'APPROVED' THEN 1 ELSE 0 END) as approvedCount,
//         SUM(CASE WHEN StatusCode = 'REJECTED' THEN 1 ELSE 0 END) as rejectedCount,
//         SUM(TotalHours) as totalHours,
//         SUM(ISNULL((SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId), 0)) as totalOvertime
//       FROM [hrm].[Timesheet]
//       WHERE EntityId = @companyId AND StatusCode != 'DRAFT'
//     `;

//     const result = await pool.request()
//       .input('companyId', sql.BigInt, companyId)
//       .query(query);

//     res.status(200).json({
//       success: true,
//       data: result.recordset[0] || {
//         totalTimesheets: 0,
//         pendingCount: 0,
//         approvedCount: 0,
//         rejectedCount: 0,
//         totalHours: 0
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching timesheet stats:', error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // Get specific timesheet details
// exports.getTimesheetDetails = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { companyId, timesheetId } = req.params;
    
//     const query = `
//       SELECT 
//         t.TimesheetId as id,
//         t.TimesheetId as Id,
//         t.EmployeeId,
//         e.EmployeeCode,
//         t.EntityId as CompanyId,
//         t.WeekStartDate as periodStart,
//         t.WeekEndDate as periodEnd,
//         t.TotalHours,
//         (SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId) as OvertimeHours,
//         CASE 
//           WHEN t.StatusCode = 'SUBMITTED' THEN 'Pending'
//           WHEN t.StatusCode = 'APPROVED' THEN 'Approved'
//           WHEN t.StatusCode = 'REJECTED' THEN 'Rejected'
//           ELSE t.StatusCode
//         END as status,
//         t.Notes,
//         t.SubmittedAtUtc as SubmittedDate,
//         t.CreatedAtUtc as CreatedAt,
//         t.UpdatedAtUtc as UpdatedAt,
//         t.ApprovedByEmployeeId as ApprovedBy,
//         t.ApprovedAtUtc as ApprovedAt,
//         TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as employeeName,
//         ci_email.IdentityValue as EmployeeEmail,
//         c.JobTitle as Position
//       FROM [hrm].[Timesheet] t
//       JOIN [hrm].[Employee] e ON t.EmployeeId = e.EmployeeId
//       LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//       LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//       WHERE t.TimesheetId = @timesheetId AND t.EntityId = @companyId
//     `;

//     const result = await pool.request()
//       .input('timesheetId', sql.BigInt, timesheetId)
//       .input('companyId', sql.BigInt, companyId)
//       .query(query);

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ success: false, message: "Timesheet not found" });
//     }

//     const timesheet = result.recordset[0];

//     // Align with hrm.TimesheetEntry column names
//     const entriesQuery = `
//       SELECT 
//         TimesheetEntryId as Id, 
//         EntryDate as Date, 
//         HoursWorked as Hours, 
//         Notes as Task,
//         HourType
//       FROM [hrm].[TimesheetEntry]
//       WHERE TimesheetId = @timesheetId
//       ORDER BY EntryDate ASC
//     `;

//     const entriesResult = await pool.request()
//       .input('timesheetId', sql.BigInt, timesheetId)
//       .query(entriesQuery);

//     timesheet.entries = entriesResult.recordset;

//     // Detect attachment
//     timesheet.hasAttachment = timesheet.Notes && timesheet.Notes.startsWith('ATTACHMENT:');
//     if (timesheet.hasAttachment) {
//       timesheet.fileName = timesheet.Notes.replace('ATTACHMENT:', '').split('|')[0];
//     }

//     res.status(200).json({ success: true, data: timesheet });
//   } catch (error) {
//     console.error('Error fetching timesheet details:', error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // Approve a timesheet
// exports.approveTimesheet = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { companyId, timesheetId } = req.params;
//     const userId = req.user?.id;
//     const userName = req.user?.username || 'HR Manager';

//     const userResult = await pool.request()
//       .input('userId', sql.Int, userId)
//       .query(`
//         SELECT e.EmployeeId 
//         FROM [hrm].[Employee] e
//         JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
//         WHERE u.id = @userId
//       `);
//     const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;

//     // Get timesheet owner's supervisor info
//     const timesheetCheck = await pool.request()
//       .input('id', sql.BigInt, timesheetId)
//       .query(`
//         SELECT t.EmployeeId as OwnerId, e.SupervisorEmployeeId, e.BackupSupervisorEmployeeId, t.StatusCode
//         FROM [hrm].[Timesheet] t WITH (NOLOCK)
//         JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
//         WHERE t.TimesheetId = @id
//       `);

    
//     if (timesheetCheck.recordset.length === 0) {
//       return res.status(404).json({ success: false, message: "Timesheet not found" });
//     }

//     const { SupervisorEmployeeId, BackupSupervisorEmployeeId, StatusCode: fromStatus } = timesheetCheck.recordset[0];
//     const userRole = req.user?.role;

//     // Authorization Check: Super Admin or Admin or assigned Supervisor/Backup
//     const isAuthorized = (userRole === 'super_admin') || 
//                          (userRole === 'admin') || 
//                          (SupervisorEmployeeId && approverEmployeeId === SupervisorEmployeeId) || 
//                          (BackupSupervisorEmployeeId && approverEmployeeId === BackupSupervisorEmployeeId) ||
//                          (!SupervisorEmployeeId && !BackupSupervisorEmployeeId); // Allow any manager if no supervisor assigned

//     if (!isAuthorized) {
//       return res.status(403).json({ 
//         success: false, 
//         message: "Access Denied: You are not the assigned Supervisor or Backup Supervisor for this employee." 
//       });
//     }

//     // Update timesheet
//     await pool.request()
//       .input('timesheetId', sql.BigInt, timesheetId)
//       .input('approverEmpId', sql.BigInt, approverEmployeeId)
//       .input('approverUserId', sql.BigInt, userId)
//       .input('userName', sql.NVarChar, userName)

//       .query(`
//         UPDATE [hrm].[Timesheet]
//         SET StatusCode = 'APPROVED',
//             ApprovedByEmployeeId = @approverEmpId,
//             ApprovedAtUtc = SYSUTCDATETIME(),
//             Approver = @userName,
//             UpdatedAtUtc = SYSUTCDATETIME(),
//             UpdatedByUserId = @approverUserId
//         WHERE TimesheetId = @timesheetId
//       `);

//     // Log status history (Audit Trail)
//     await pool.request()
//       .input('timesheetId', sql.BigInt, timesheetId)
//       .input('from', sql.NVarChar, fromStatus)
//       .input('to', sql.NVarChar, 'APPROVED')
//       .input('userId', sql.BigInt, userId)
//       .input('userName', sql.NVarChar, userName)
//       .query(`
//         INSERT INTO [hrm].[TimesheetStatusHistory] 
//         (TimesheetId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
//         VALUES (@timesheetId, @from, @to, SYSUTCDATETIME(), @userId, @userName, 'Timesheet approved by manager')
//       `);

//     res.status(200).json({ success: true, message: "Timesheet approved successfully" });
//   } catch (error) {
//     console.error('Error approving timesheet:', error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // Reject a timesheet
// exports.rejectTimesheet = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { companyId, timesheetId } = req.params;
//     const userId = req.user?.id;
//     const userName = req.user?.username || 'HR Manager';
//     const reason = req.body.reason || req.body.notes || 'No reason provided';

//     // Get approver employee record
//     const userResult = await pool.request()
//       .input('userId', sql.Int, userId)
//       .query(`
//         SELECT e.EmployeeId 
//         FROM [hrm].[Employee] e
//         JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
//         WHERE u.id = @userId
//       `);
//     const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;

//     // Get timesheet owner's supervisor info
//     const timesheetCheck = await pool.request()
//       .input('id', sql.BigInt, timesheetId)
//       .query(`
//         SELECT 
//           t.EmployeeId as OwnerId, 
//           e.SupervisorEmployeeId, 
//           e.BackupSupervisorEmployeeId, 
//           t.StatusCode,
//           t.WeekStartDate,
//           t.WeekEndDate,
//           TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as EmployeeName,
//           ci_email.IdentityValue as EmployeeEmail
//         FROM [hrm].[Timesheet] t WITH (NOLOCK)
//         JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
//         LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
//         LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId 
//           AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//         WHERE t.TimesheetId = @id
//       `);

    
//     if (timesheetCheck.recordset.length === 0) {
//       return res.status(404).json({ success: false, message: "Timesheet not found" });
//     }

//     const { SupervisorEmployeeId, BackupSupervisorEmployeeId, StatusCode: fromStatus } = timesheetCheck.recordset[0];
//     const userRole = req.user?.role;

//     // Authorization Check
//     const isAuthorized = (userRole === 'super_admin') || 
//                          (userRole === 'admin') || 
//                          (SupervisorEmployeeId && approverEmployeeId === SupervisorEmployeeId) || 
//                          (BackupSupervisorEmployeeId && approverEmployeeId === BackupSupervisorEmployeeId) ||
//                          (!SupervisorEmployeeId && !BackupSupervisorEmployeeId);

//     if (!isAuthorized) {
//       return res.status(403).json({ 
//         success: false, 
//         message: "Access Denied: You are not the assigned Supervisor or Backup Supervisor for this employee." 
//       });
//     }

//     await pool.request()
//       .input('id', sql.BigInt, timesheetId)
//       .input('userId', sql.BigInt, userId)
//       .input('notes', sql.NVarChar, reason)
//       .input('userName', sql.NVarChar, userName)

//       .query(`
//         UPDATE [hrm].[Timesheet]
//         SET StatusCode = 'REJECTED',
//             Notes = @notes,
//             Approver = @userName,
//             UpdatedAtUtc = SYSUTCDATETIME(),
//             UpdatedByUserId = @userId
//         WHERE TimesheetId = @id
//       `);

//     // Audit trail
//     await pool.request()
//       .input('timesheetId', sql.BigInt, timesheetId)
//       .input('from', sql.NVarChar, fromStatus)
//       .input('to', sql.NVarChar, 'REJECTED')
//       .input('userId', sql.BigInt, userId)
//       .input('userName', sql.NVarChar, userName)
//       .input('reason', sql.NVarChar, reason)
//       .query(`
//         INSERT INTO [hrm].[TimesheetStatusHistory] 
//         (TimesheetId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
//         VALUES (@timesheetId, @from, @to, SYSUTCDATETIME(), @userId, @userName, @reason)
//       `);

//     res.status(200).json({ success: true, message: "Timesheet rejected successfully" });

//     // Send Rejection Email (Async)
//     if (timesheetCheck.recordset.length > 0) {
//       const data = timesheetCheck.recordset[0];
//       if (data.EmployeeEmail) {
//         employeeController.sendTimesheetRejectionEmail({
//           to: data.EmployeeEmail,
//           employeeName: data.EmployeeName || 'Employee',
//           periodStart: formatDate(data.WeekStartDate),
//           periodEnd: formatDate(data.WeekEndDate),
//           reason: reason
//         }).catch(err => console.error('Error sending rejection email:', err));
//       }
//     }
//   } catch (error) {
//     console.error('Error rejecting timesheet:', error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // Bulk approve timesheets
// exports.bulkApproveTimesheets = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { timesheetIds } = req.body;
//     const userId = req.user?.id;
//     const userName = req.user?.username || 'HR Manager';

//     if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No timesheet IDs provided" });
//     }

//     const userResult = await pool.request()
//       .input('userId', sql.Int, userId)
//       .query(`
//         SELECT e.EmployeeId 
//         FROM [hrm].[Employee] e
//         JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
//         WHERE u.id = @userId
//       `);
//     const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;
//     const userRole = req.user?.role;

//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       for (const id of timesheetIds) {
//         // Authorization check for each timesheet
//         const authCheck = await transaction.request()
//           .input('id', sql.BigInt, id)
//           .query(`
//             SELECT e.SupervisorEmployeeId, e.BackupSupervisorEmployeeId
//             FROM [hrm].[Timesheet] t WITH (NOLOCK)
//             JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
//             WHERE t.TimesheetId = @id
//           `);

        
//         if (authCheck.recordset.length > 0) {
//           const { SupervisorEmployeeId, BackupSupervisorEmployeeId } = authCheck.recordset[0];
//           const isAuthorized = (userRole === 'super_admin') || (userRole === 'admin') || 
//                                (SupervisorEmployeeId && approverEmployeeId === SupervisorEmployeeId) || 
//                                (BackupSupervisorEmployeeId && approverEmployeeId === BackupSupervisorEmployeeId) ||
//                                (!SupervisorEmployeeId && !BackupSupervisorEmployeeId);

//           if (!isAuthorized) {
//             throw new Error(`Unauthorized to approve timesheet ID ${id}. You are not the assigned supervisor.`);
//           }
//         }

//         await transaction.request()

//           .input('id', sql.BigInt, id)
//           .input('approverEmpId', sql.BigInt, approverEmployeeId)
//           .input('userId', sql.BigInt, userId)
//           .input('userName', sql.NVarChar, userName)
//           .query(`
//             UPDATE [hrm].[Timesheet]
//             SET StatusCode = 'APPROVED',
//                 ApprovedByEmployeeId = @approverEmpId,
//                 ApprovedAtUtc = SYSUTCDATETIME(),
//                 Approver = @userName,
//                 UpdatedAtUtc = SYSUTCDATETIME(),
//                 UpdatedByUserId = @userId
//             WHERE TimesheetId = @id
//           `);

//         await transaction.request()
//           .input('id', sql.BigInt, id)
//           .input('userId', sql.BigInt, userId)
//           .input('userName', sql.NVarChar, userName)
//           .query(`
//             INSERT INTO [hrm].[TimesheetStatusHistory] 
//             (TimesheetId, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
//             VALUES (@id, 'APPROVED', SYSUTCDATETIME(), @userId, @userName, 'Bulk approved via Manager Dashboard')
//           `);
//       }
//       await transaction.commit();
//       res.status(200).json({ success: true, message: `Successfully approved ${timesheetIds.length} timesheets` });
//     } catch (err) {
//       await transaction.rollback();
//       throw err;
//     }
//   } catch (error) {
//     console.error('Bulk approve error:', error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // Bulk reject timesheets
// exports.bulkRejectTimesheets = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { timesheetIds, reason } = req.body;
//     const userId = req.user?.id;
//     const userName = req.user?.username || 'HR Manager';
//     const notes = reason || 'Bulk rejected by manager';

//     if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No timesheet IDs provided" });
//     }

//     const userResult = await pool.request()
//       .input('userId', sql.Int, userId)
//       .query(`
//         SELECT e.EmployeeId 
//         FROM [hrm].[Employee] e
//         JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
//         WHERE u.id = @userId
//       `);
//     const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;
//     const userRole = req.user?.role;

//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       for (const id of timesheetIds) {
//         // Authorization check for each timesheet
//         const authCheck = await transaction.request()
//           .input('id', sql.BigInt, id)
//           .query(`
//             SELECT 
//               e.SupervisorEmployeeId, 
//               e.BackupSupervisorEmployeeId,
//               t.WeekStartDate,
//               t.WeekEndDate,
//               TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as EmployeeName,
//               ci_email.IdentityValue as EmployeeEmail
//             FROM [hrm].[Timesheet] t WITH (NOLOCK)
//             JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
//             LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
//             LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId 
//               AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//             WHERE t.TimesheetId = @id
//           `);

        
//         if (authCheck.recordset.length > 0) {
//           const { SupervisorEmployeeId, BackupSupervisorEmployeeId } = authCheck.recordset[0];
//           const isAuthorized = (userRole === 'super_admin') || (userRole === 'admin') || 
//                                (SupervisorEmployeeId && approverEmployeeId === SupervisorEmployeeId) || 
//                                (BackupSupervisorEmployeeId && approverEmployeeId === BackupSupervisorEmployeeId) ||
//                                (!SupervisorEmployeeId && !BackupSupervisorEmployeeId);

//           if (!isAuthorized) {
//             throw new Error(`Unauthorized to reject timesheet ID ${id}. You are not the assigned supervisor.`);
//           }
//         }

//         await transaction.request()

//           .input('id', sql.BigInt, id)
//           .input('userId', sql.BigInt, userId)
//           .input('notes', sql.NVarChar, notes)
//           .input('userName', sql.NVarChar, userName)
//           .query(`
//             UPDATE [hrm].[Timesheet]
//             SET StatusCode = 'REJECTED',
//                 Notes = @notes,
//                 Approver = @userName,
//                 UpdatedAtUtc = SYSUTCDATETIME(),
//                 UpdatedByUserId = @userId
//             WHERE TimesheetId = @id
//           `);

//         await transaction.request()
//           .input('id', sql.BigInt, id)
//           .input('userId', sql.BigInt, userId)
//           .input('userName', sql.NVarChar, userName)
//           .input('reason', sql.NVarChar, notes)
//           .query(`
//             INSERT INTO [hrm].[TimesheetStatusHistory] 
//             (TimesheetId, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
//             VALUES (@id, 'REJECTED', SYSUTCDATETIME(), @userId, @userName, @reason)
//           `);

//         // Prepare email notification (outside transaction but inside loop for simplicity)
//         if (authCheck.recordset.length > 0) {
//           const data = authCheck.recordset[0];
//           if (data.EmployeeEmail) {
//             employeeController.sendTimesheetRejectionEmail({
//               to: data.EmployeeEmail,
//               employeeName: data.EmployeeName || 'Employee',
//               periodStart: formatDate(data.WeekStartDate),
//               periodEnd: formatDate(data.WeekEndDate),
//               reason: notes
//             }).catch(err => console.error(`Error sending bulk rejection email for ${id}:`, err));
//           }
//         }
//       }
//       await transaction.commit();
//       res.status(200).json({ success: true, message: `Successfully rejected ${timesheetIds.length} timesheets` });
//     } catch (err) {
//       await transaction.rollback();
//       throw err;
//     }
//   } catch (error) {
//     console.error('Bulk reject error:', error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // Delete a timesheet (Manager/Admin action)
// exports.deleteTimesheet = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { timesheetId } = req.params;
//     const userRole = req.user?.role?.toLowerCase();
    
//     // Check if timesheet exists
//     const checkResult = await pool.request()
//       .input("id", sql.BigInt, timesheetId)
//       .query(`SELECT StatusCode FROM [hrm].[Timesheet] WHERE TimesheetId = @id`);

//     if (checkResult.recordset.length === 0) {
//       return res.status(404).json({ success: false, message: "Timesheet not found" });
//     }

//     const isAdminOrManager = userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager' || userRole === 'teamlead' || userRole === 'team_lead';

//     if (!isAdminOrManager) {
//       return res.status(403).json({ success: false, message: "Access Denied: Only managers, admins or super admins can delete timesheets." });
//     }

//     // Use a transaction to clean up related data
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       // 1. Delete related entries
//       await transaction.request()
//         .input("id", sql.BigInt, timesheetId)
//         .query(`DELETE FROM [hrm].[TimesheetEntry] WHERE TimesheetId = @id`);

//       // 2. Delete related status history
//       await transaction.request()
//         .input("id", sql.BigInt, timesheetId)
//         .query(`DELETE FROM [hrm].[TimesheetStatusHistory] WHERE TimesheetId = @id`);

//       // 3. Delete the timesheet itself
//       await transaction.request()
//         .input("id", sql.BigInt, timesheetId)
//         .query(`DELETE FROM [hrm].[Timesheet] WHERE TimesheetId = @id`);

//       await transaction.commit();
//       res.status(200).json({
//         success: true,
//         message: "Timesheet and related data deleted successfully"
//       });
//     } catch (err) {
//       await transaction.rollback();
//       throw err;
//     }
//   } catch (error) {
//     console.error("Error deleting timesheet:", error);
//     res.status(500).json({ success: false, message: "Server error while deleting timesheet", error: error.message });
//   }
// };




const { poolPromise, sql } = require("../../config/db");
const employeeController = require("./employeeController");

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Manager Timesheet Management Controller
 * Schema-aligned for [hrm] module (2026-04-15 DDL)
 */

// Get all pending timesheets across all companies
exports.getPendingTimesheetsAllCompanies = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the numeric EmployeeId of the requester
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e WITH (NOLOCK)
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId
      `);
    const requesterEmployeeId = userResult.recordset[0]?.EmployeeId || null;

    // ✅ RULE:
    // - super_admin -> see ALL pending timesheets (including admin ones)
    // - admin, manager, teamlead, team_lead → see pending timesheets (usually excluding admins/self unless they are super_admin)
    // - regular employee who is a supervisor → see ONLY their subordinates' timesheets
    const isPrivilegedRole = ['admin', 'super_admin', 'manager', 'teamlead', 'team_lead'].includes(userRole);

    let supervisorFilterSQL = '';
    if (userRole === 'super_admin') {
      supervisorFilterSQL = '';
    } else if (isPrivilegedRole) {
      supervisorFilterSQL = `AND e.EmployeeCode NOT IN (SELECT EmployeeId FROM userinfo WHERE role = 'admin' OR role = 'super_admin')`;
    } else if (requesterEmployeeId) {
      supervisorFilterSQL = `AND (
        e.SupervisorEmployeeId = @requesterId OR 
        e.BackupSupervisorEmployeeId = @requesterId
      )`;
    }

    const query = `
      SELECT 
        t.TimesheetId as id,
        t.TimesheetId as Id,
        t.EmployeeId,
        e.EmployeeCode,
        t.EntityId as CompanyId,
        t.WeekStartDate as periodStart,
        t.WeekEndDate as periodEnd,
        t.TotalHours,
        (SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WITH (NOLOCK) WHERE TimesheetId = t.TimesheetId) as OvertimeHours,
        'Pending' as status,
        t.StatusCode,
        t.SubmittedAtUtc as SubmittedDate,
        t.CreatedAtUtc as CreatedAt,
        TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as employeeName,
        ci_email.IdentityValue as EmployeeEmail,
        ci_phone.IdentityValue as EmployeePhone,
        c.JobTitle as Position,
        comp.EntityName as CompanyName,
        COALESCE(
          NULLIF(TRIM(CONCAT(app_c.FirstName, ' ', ISNULL(app_c.MiddleName + ' ', ''), app_c.LastName)), ''),
          NULLIF(TRIM(CONCAT(app_ud.firstName, ' ', app_ud.lastName)), ''),
          CASE WHEN t.StatusCode != 'SUBMITTED' THEN NULLIF(TRIM(CONCAT(upd_ud.firstName, ' ', upd_ud.lastName)), '') ELSE NULL END,
          '—'
        ) as ApproverName,
        TRIM(CONCAT(sup_c.FirstName, ' ', ISNULL(sup_c.MiddleName + ' ', ''), sup_c.LastName)) as PrimarySupervisorName,
        e.SupervisorEmployeeId,
        e.BackupSupervisorEmployeeId,
        t.Notes
      FROM [hrm].[Timesheet] t WITH (NOLOCK)
      JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
      LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
      LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
      LEFT JOIN [recruit].[CandidateIdentity] ci_phone WITH (NOLOCK) ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
      LEFT JOIN [core].[Entity] comp WITH (NOLOCK) ON t.EntityId = comp.EntityId
      LEFT JOIN [hrm].[Employee] app_e WITH (NOLOCK) ON t.ApprovedByEmployeeId = app_e.EmployeeId
      LEFT JOIN [recruit].[Candidate] app_c WITH (NOLOCK) ON app_e.CandidateId = app_c.CandidateId
      LEFT JOIN [dbo].[userinfo] app_u WITH (NOLOCK) ON app_e.EmployeeCode = app_u.EmployeeId
      LEFT JOIN [dbo].[userdetails] app_ud WITH (NOLOCK) ON app_u.id = app_ud.id
      LEFT JOIN [dbo].[userinfo] upd_u WITH (NOLOCK) ON t.UpdatedByUserId = upd_u.id
      LEFT JOIN [dbo].[userdetails] upd_ud WITH (NOLOCK) ON upd_u.id = upd_ud.id
      LEFT JOIN [hrm].[Employee] sup_e WITH (NOLOCK) ON e.SupervisorEmployeeId = sup_e.EmployeeId
      LEFT JOIN [recruit].[Candidate] sup_c WITH (NOLOCK) ON sup_e.CandidateId = sup_c.CandidateId
      WHERE t.StatusCode = 'SUBMITTED'
      AND (t.Notes IS NULL OR t.Notes NOT LIKE 'ATTACHMENT:%')
      ${supervisorFilterSQL}
      ORDER BY t.SubmittedAtUtc DESC, t.CreatedAtUtc DESC
    `;

    const result = await pool.request()
      .input('requesterId', sql.Int, requesterEmployeeId)
      .query(query);


    // Map result to detect attachments
    const dataWithAttachments = result.recordset.map(row => {
      const hasAttachment = row.Notes && row.Notes.startsWith('ATTACHMENT:');
      let fileName = null;
      if (hasAttachment) {
        fileName = row.Notes.replace('ATTACHMENT:', '').split('|')[0];
      }
      return {
        ...row,
        hasAttachment,
        fileName
      };
    });

    res.status(200).json({
      success: true,
      data: dataWithAttachments,
      count: dataWithAttachments.length
    });
  } catch (error) {
    console.error('Error fetching all pending timesheets:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all timesheets for a specific company
exports.getCompanyTimesheets = async (req, res) => {
  try {
    const pool = await poolPromise;
    const companyId = req.params.companyId;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the numeric EmployeeId of the requester
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e WITH (NOLOCK)
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId
      `);
    const requesterEmployeeId = userResult.recordset[0]?.EmployeeId || null;

    // ✅ RULE:
    // - super_admin -> see ALL timesheets
    // - admin, manager, teamlead, team_lead → see timesheets (usually excluding peer admins)
    // - regular employee who is a supervisor → see ONLY their subordinates' timesheets
    const isPrivilegedRole = ['admin', 'super_admin', 'manager', 'teamlead', 'team_lead'].includes(userRole);

    // Only apply supervisor filtering for regular employees who happen to be supervisors
    let supervisorFilterSQL = '';
    if (userRole === 'super_admin') {
      supervisorFilterSQL = '';
    } else if (isPrivilegedRole) {
      supervisorFilterSQL = `AND e.EmployeeCode NOT IN (SELECT EmployeeId FROM userinfo WHERE role = 'admin' OR role = 'super_admin')`;
    } else if (requesterEmployeeId) {
      supervisorFilterSQL = `AND (
        e.SupervisorEmployeeId = @requesterId OR 
        e.BackupSupervisorEmployeeId = @requesterId
      )`;
    }

    const query = `
      SELECT 
        t.TimesheetId as id,
        t.TimesheetId as Id,
        t.EmployeeId,
        e.EmployeeCode,
        t.EntityId as CompanyId,
        t.WeekStartDate as periodStart,
        t.WeekEndDate as periodEnd,
        t.TotalHours,
        (SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId) as OvertimeHours,
        CASE 
          WHEN t.StatusCode = 'SUBMITTED' THEN 'Pending'
          WHEN t.StatusCode = 'APPROVED' THEN 'Approved'
          WHEN t.StatusCode = 'REJECTED' THEN 'Rejected'
          ELSE t.StatusCode
        END as status,
        t.Notes,
        t.SubmittedAtUtc as SubmittedDate,
        t.CreatedAtUtc as CreatedAt,
        t.UpdatedAtUtc as UpdatedAt,
        t.ApprovedByEmployeeId as ApprovedBy,
        t.ApprovedAtUtc as ApprovedAt,
        COALESCE(
          NULLIF(TRIM(CONCAT(app_c.FirstName, ' ', ISNULL(app_c.MiddleName + ' ', ''), app_c.LastName)), ''),
          NULLIF(TRIM(CONCAT(app_ud.firstName, ' ', app_ud.lastName)), ''),
          CASE WHEN t.StatusCode != 'SUBMITTED' THEN NULLIF(TRIM(CONCAT(upd_ud.firstName, ' ', upd_ud.lastName)), '') ELSE NULL END,
          '—'
        ) as ApproverName,
        TRIM(CONCAT(sup_c.FirstName, ' ', ISNULL(sup_c.MiddleName + ' ', ''), sup_c.LastName)) as PrimarySupervisorName,
        e.SupervisorEmployeeId,
        e.BackupSupervisorEmployeeId,
        TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as employeeName,
        ci_email.IdentityValue as EmployeeEmail,
        ci_phone.IdentityValue as EmployeePhone,
        c.JobTitle as Position,
        comp.EntityName as CompanyName
      FROM [hrm].[Timesheet] t WITH (NOLOCK)
      JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
      LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
      LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
      LEFT JOIN [recruit].[CandidateIdentity] ci_phone WITH (NOLOCK) ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
      LEFT JOIN [core].[Entity] comp WITH (NOLOCK) ON t.EntityId = comp.EntityId
      LEFT JOIN [hrm].[Employee] app_e WITH (NOLOCK) ON t.ApprovedByEmployeeId = app_e.EmployeeId
      LEFT JOIN [recruit].[Candidate] app_c WITH (NOLOCK) ON app_e.CandidateId = app_c.CandidateId
      LEFT JOIN [dbo].[userinfo] app_u WITH (NOLOCK) ON app_e.EmployeeCode = app_u.EmployeeId
      LEFT JOIN [dbo].[userdetails] app_ud WITH (NOLOCK) ON app_u.id = app_ud.id
      LEFT JOIN [dbo].[userinfo] upd_u WITH (NOLOCK) ON t.UpdatedByUserId = upd_u.id
      LEFT JOIN [dbo].[userdetails] upd_ud WITH (NOLOCK) ON upd_u.id = upd_ud.id
      LEFT JOIN [hrm].[Employee] sup_e WITH (NOLOCK) ON e.SupervisorEmployeeId = sup_e.EmployeeId
      LEFT JOIN [recruit].[Candidate] sup_c WITH (NOLOCK) ON sup_e.CandidateId = sup_c.CandidateId
      WHERE t.EntityId = @companyId AND t.StatusCode != 'DRAFT'
      AND (t.Notes IS NULL OR t.Notes NOT LIKE 'ATTACHMENT:%')
      ${supervisorFilterSQL}
      ORDER BY 
        CASE 
          WHEN t.StatusCode = 'SUBMITTED' THEN 1
          WHEN t.StatusCode = 'APPROVED' THEN 2
          WHEN t.StatusCode = 'REJECTED' THEN 3
          ELSE 4
        END,
        t.WeekStartDate DESC, 
        t.CreatedAtUtc DESC
    `;

    const result = await pool.request()
      .input('companyId', sql.BigInt, companyId)
      .input('requesterId', sql.Int, requesterEmployeeId)
      .query(query);


    // Map result to detect attachments
    const dataWithAttachments = result.recordset.map(row => {
      const hasAttachment = row.Notes && row.Notes.startsWith('ATTACHMENT:');
      let fileName = null;
      if (hasAttachment) {
        fileName = row.Notes.replace('ATTACHMENT:', '').split('|')[0];
      }
      return {
        ...row,
        hasAttachment,
        fileName
      };
    });

    res.status(200).json({
      success: true,
      data: dataWithAttachments,
      count: dataWithAttachments.length,
      companyId: parseInt(companyId)
    });
  } catch (error) {
    console.error('Error fetching company timesheets:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get timesheet statistics
exports.getTimesheetStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const companyId = req.params.companyId;
    
    const query = `
      SELECT 
        COUNT(*) as totalTimesheets,
        SUM(CASE WHEN StatusCode = 'SUBMITTED' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN StatusCode = 'APPROVED' THEN 1 ELSE 0 END) as approvedCount,
        SUM(CASE WHEN StatusCode = 'REJECTED' THEN 1 ELSE 0 END) as rejectedCount,
        SUM(TotalHours) as totalHours,
        SUM(ISNULL((SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId), 0)) as totalOvertime
      FROM [hrm].[Timesheet]
      WHERE EntityId = @companyId AND StatusCode != 'DRAFT'
    `;

    const result = await pool.request()
      .input('companyId', sql.BigInt, companyId)
      .query(query);

    res.status(200).json({
      success: true,
      data: result.recordset[0] || {
        totalTimesheets: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        totalHours: 0
      }
    });
  } catch (error) {
    console.error('Error fetching timesheet stats:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get specific timesheet details
exports.getTimesheetDetails = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, timesheetId } = req.params;
    
    const query = `
      SELECT 
        t.TimesheetId as id,
        t.TimesheetId as Id,
        t.EmployeeId,
        e.EmployeeCode,
        t.EntityId as CompanyId,
        t.WeekStartDate as periodStart,
        t.WeekEndDate as periodEnd,
        t.TotalHours,
        (SELECT SUM(CASE WHEN HoursWorked > 8 THEN HoursWorked - 8 ELSE 0 END) FROM [hrm].[TimesheetEntry] WHERE TimesheetId = t.TimesheetId) as OvertimeHours,
        CASE 
          WHEN t.StatusCode = 'SUBMITTED' THEN 'Pending'
          WHEN t.StatusCode = 'APPROVED' THEN 'Approved'
          WHEN t.StatusCode = 'REJECTED' THEN 'Rejected'
          ELSE t.StatusCode
        END as status,
        t.Notes,
        t.SubmittedAtUtc as SubmittedDate,
        t.CreatedAtUtc as CreatedAt,
        t.UpdatedAtUtc as UpdatedAt,
        t.ApprovedByEmployeeId as ApprovedBy,
        t.ApprovedAtUtc as ApprovedAt,
        COALESCE(
          NULLIF(TRIM(CONCAT(app_c.FirstName, ' ', ISNULL(app_c.MiddleName + ' ', ''), app_c.LastName)), ''),
          CASE WHEN t.StatusCode != 'SUBMITTED' THEN NULLIF(TRIM(CONCAT(upd_ud.firstName, ' ', upd_ud.lastName)), '') ELSE NULL END,
          '—'
        ) as ApproverName,
        TRIM(CONCAT(sup_c.FirstName, ' ', ISNULL(sup_c.MiddleName + ' ', ''), sup_c.LastName)) as PrimarySupervisorName,
        e.SupervisorEmployeeId,
        e.BackupSupervisorEmployeeId,
        TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as employeeName,
        ci_email.IdentityValue as EmployeeEmail,
        c.JobTitle as Position
      FROM [hrm].[Timesheet] t
      JOIN [hrm].[Employee] e ON t.EmployeeId = e.EmployeeId
      LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
      LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
      LEFT JOIN [hrm].[Employee] app_e ON t.ApprovedByEmployeeId = app_e.EmployeeId
      LEFT JOIN [recruit].[Candidate] app_c ON app_e.CandidateId = app_c.CandidateId
      LEFT JOIN [dbo].[userinfo] upd_u ON t.UpdatedByUserId = upd_u.id
      LEFT JOIN [dbo].[userdetails] upd_ud ON upd_u.id = upd_ud.id
      LEFT JOIN [hrm].[Employee] sup_e ON e.SupervisorEmployeeId = sup_e.EmployeeId
      LEFT JOIN [recruit].[Candidate] sup_c ON sup_e.CandidateId = sup_c.CandidateId
      WHERE t.TimesheetId = @timesheetId AND t.EntityId = @companyId
    `;

    const result = await pool.request()
      .input('timesheetId', sql.BigInt, timesheetId)
      .input('companyId', sql.BigInt, companyId)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Timesheet not found" });
    }

    const timesheet = result.recordset[0];

    // Align with hrm.TimesheetEntry column names
    const entriesQuery = `
      SELECT 
        TimesheetEntryId as Id, 
        EntryDate as Date, 
        HoursWorked as Hours, 
        Notes as Task,
        HourType
      FROM [hrm].[TimesheetEntry]
      WHERE TimesheetId = @timesheetId
      ORDER BY EntryDate ASC
    `;

    const entriesResult = await pool.request()
      .input('timesheetId', sql.BigInt, timesheetId)
      .query(entriesQuery);

    timesheet.entries = entriesResult.recordset;

    // Detect attachment
    timesheet.hasAttachment = timesheet.Notes && timesheet.Notes.startsWith('ATTACHMENT:');
    if (timesheet.hasAttachment) {
      timesheet.fileName = timesheet.Notes.replace('ATTACHMENT:', '').split('|')[0];
    }

    res.status(200).json({ success: true, data: timesheet });
  } catch (error) {
    console.error('Error fetching timesheet details:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Approve a timesheet
exports.approveTimesheet = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, timesheetId } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.username || 'HR Manager';

    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          e.EmployeeId,
          TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as FullName
        FROM [hrm].[Employee] e 
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode 
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        WHERE u.id = @userId
      `);
    const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;
    const approverFullName = req.body.Approver || userResult.recordset[0]?.FullName || userName;

    // Get timesheet owner's supervisor info and candidate details for notification
    const timesheetCheck = await pool.request()
      .input('id', sql.BigInt, timesheetId)
      .query(`
        SELECT 
          t.EmployeeId as OwnerId, 
          e.SupervisorEmployeeId, 
          e.BackupSupervisorEmployeeId, 
          t.StatusCode,
          t.WeekStartDate,
          t.WeekEndDate,
          TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as EmployeeName,
          ci_email.IdentityValue as EmployeeEmail
        FROM [hrm].[Timesheet] t WITH (NOLOCK)
        JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
        LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId 
          AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
        WHERE t.TimesheetId = @id
      `);

    
    if (timesheetCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Timesheet not found" });
    }

    const { SupervisorEmployeeId, BackupSupervisorEmployeeId, StatusCode: fromStatus } = timesheetCheck.recordset[0];
    const userRole = req.user?.role;

    // Authorization Check: Super Admin or Admin or assigned Supervisor/Backup
    const isAuthorized = (userRole === 'super_admin') || 
                         (userRole === 'admin') || 
                         (SupervisorEmployeeId && approverEmployeeId === SupervisorEmployeeId) || 
                         (BackupSupervisorEmployeeId && approverEmployeeId === BackupSupervisorEmployeeId) ||
                         (!SupervisorEmployeeId && !BackupSupervisorEmployeeId); // Allow any manager if no supervisor assigned

    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: You are not the assigned Supervisor or Backup Supervisor for this employee." 
      });
    }

    // Update timesheet
    await pool.request()
      .input('timesheetId', sql.BigInt, timesheetId)
      .input('approverEmpId', sql.BigInt, approverEmployeeId)
      .input('approverUserId', sql.BigInt, userId)
      .input('approverName', sql.NVarChar, approverFullName)

      .query(`
        UPDATE [hrm].[Timesheet]
        SET StatusCode = 'APPROVED',
            ApprovedByEmployeeId = @approverEmpId,
            ApprovedAtUtc = SYSUTCDATETIME(),
            UpdatedAtUtc = SYSUTCDATETIME(),
            UpdatedByUserId = @approverUserId
        WHERE TimesheetId = @timesheetId
      `);

    // Log status history (Audit Trail)
    await pool.request()
      .input('timesheetId', sql.BigInt, timesheetId)
      .input('from', sql.NVarChar, fromStatus)
      .input('to', sql.NVarChar, 'APPROVED')
      .input('userId', sql.BigInt, userId)
      .input('userName', sql.NVarChar, userName)
      .query(`
        INSERT INTO [hrm].[TimesheetStatusHistory] 
        (TimesheetId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
        VALUES (@timesheetId, @from, @to, SYSUTCDATETIME(), @userId, @userName, 'Timesheet approved by manager')
      `);

    res.status(200).json({ success: true, message: "Timesheet approved successfully" });

    // Send Approval Email (Async)
    if (timesheetCheck.recordset.length > 0) {
      const data = timesheetCheck.recordset[0];
      if (data.EmployeeEmail) {
        employeeController.sendTimesheetApprovalEmail({
          to: data.EmployeeEmail,
          employeeName: data.EmployeeName || 'Employee',
          periodStart: formatDate(data.WeekStartDate),
          periodEnd: formatDate(data.WeekEndDate)
        }).catch(err => console.error('Error sending approval email:', err));
      }
    }
  } catch (error) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Reject a timesheet
exports.rejectTimesheet = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, timesheetId } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.username || 'HR Manager';
    const reason = req.body.reason || req.body.notes || 'No reason provided';

    // Get approver employee record
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          e.EmployeeId,
          TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as FullName
        FROM [hrm].[Employee] e 
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode 
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        WHERE u.id = @userId
      `);
    const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;
    const approverFullName = req.body.Approver || userResult.recordset[0]?.FullName || userName;

    // Get timesheet owner's supervisor info
    const timesheetCheck = await pool.request()
      .input('id', sql.BigInt, timesheetId)
      .query(`
        SELECT 
          t.EmployeeId as OwnerId, 
          e.SupervisorEmployeeId, 
          e.BackupSupervisorEmployeeId, 
          t.StatusCode,
          t.WeekStartDate,
          t.WeekEndDate,
          TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as EmployeeName,
          ci_email.IdentityValue as EmployeeEmail
        FROM [hrm].[Timesheet] t WITH (NOLOCK)
        JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
        LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId 
          AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
        WHERE t.TimesheetId = @id
      `);

    
    if (timesheetCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Timesheet not found" });
    }

    const { SupervisorEmployeeId, BackupSupervisorEmployeeId, StatusCode: fromStatus } = timesheetCheck.recordset[0];
    const userRole = req.user?.role;

    // Authorization Check
    const isAuthorized = (userRole === 'super_admin') || 
                         (userRole === 'admin') || 
                         (SupervisorEmployeeId && approverEmployeeId === SupervisorEmployeeId) || 
                         (BackupSupervisorEmployeeId && approverEmployeeId === BackupSupervisorEmployeeId) ||
                         (!SupervisorEmployeeId && !BackupSupervisorEmployeeId);

    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: You are not the assigned Supervisor or Backup Supervisor for this employee." 
      });
    }

    await pool.request()
      .input('id', sql.BigInt, timesheetId)
      .input('userId', sql.BigInt, userId)
      .input('notes', sql.NVarChar, reason)
      .input('approverName', sql.NVarChar, approverFullName)

      .input('approverEmpId', sql.BigInt, approverEmployeeId)
      .query(`
        UPDATE [hrm].[Timesheet]
        SET StatusCode = 'REJECTED',
            Notes = @notes,
            ApprovedByEmployeeId = @approverEmpId,
            UpdatedAtUtc = SYSUTCDATETIME(),
            UpdatedByUserId = @userId
        WHERE TimesheetId = @id
      `);

    // Audit trail
    await pool.request()
      .input('timesheetId', sql.BigInt, timesheetId)
      .input('from', sql.NVarChar, fromStatus)
      .input('to', sql.NVarChar, 'REJECTED')
      .input('userId', sql.BigInt, userId)
      .input('userName', sql.NVarChar, userName)
      .input('reason', sql.NVarChar, reason)
      .query(`
        INSERT INTO [hrm].[TimesheetStatusHistory] 
        (TimesheetId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
        VALUES (@timesheetId, @from, @to, SYSUTCDATETIME(), @userId, @userName, @reason)
      `);

    res.status(200).json({ success: true, message: "Timesheet rejected successfully" });

    // Send Rejection Email (Async)
    if (timesheetCheck.recordset.length > 0) {
      const data = timesheetCheck.recordset[0];
      if (data.EmployeeEmail) {
        employeeController.sendTimesheetRejectionEmail({
          to: data.EmployeeEmail,
          employeeName: data.EmployeeName || 'Employee',
          periodStart: formatDate(data.WeekStartDate),
          periodEnd: formatDate(data.WeekEndDate),
          reason: reason
        }).catch(err => console.error('Error sending rejection email:', err));
      }
    }
  } catch (error) {
    console.error('Error rejecting timesheet:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Bulk approve timesheets
exports.bulkApproveTimesheets = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { timesheetIds } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.username || 'HR Manager';

    if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({ success: false, message: "No timesheet IDs provided" });
    }

    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId
      `);
    const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;
    const userRole = req.user?.role;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const id of timesheetIds) {
        // Authorization check for each timesheet
        const authCheck = await transaction.request()
          .input('id', sql.BigInt, id)
          .query(`
            SELECT e.SupervisorEmployeeId, e.BackupSupervisorEmployeeId
            FROM [hrm].[Timesheet] t WITH (NOLOCK)
            JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
            WHERE t.TimesheetId = @id
          `);

        
        if (authCheck.recordset.length > 0) {
          const { SupervisorEmployeeId, BackupSupervisorEmployeeId } = authCheck.recordset[0];
          const isAuthorized = (userRole === 'super_admin') || (userRole === 'admin') || 
                               (SupervisorEmployeeId && approverEmployeeId === SupervisorEmployeeId) || 
                               (BackupSupervisorEmployeeId && approverEmployeeId === BackupSupervisorEmployeeId) ||
                               (!SupervisorEmployeeId && !BackupSupervisorEmployeeId);

          if (!isAuthorized) {
            throw new Error(`Unauthorized to approve timesheet ID ${id}. You are not the assigned supervisor.`);
          }
        }

        await transaction.request()

          .input('id', sql.BigInt, id)
          .input('approverEmpId', sql.BigInt, approverEmployeeId)
          .input('userId', sql.BigInt, userId)
          .input('userName', sql.NVarChar, userName)
          .query(`
            UPDATE [hrm].[Timesheet]
            SET StatusCode = 'APPROVED',
                ApprovedByEmployeeId = @approverEmpId,
                ApprovedAtUtc = SYSUTCDATETIME(),
                UpdatedAtUtc = SYSUTCDATETIME(),
                UpdatedByUserId = @userId
            WHERE TimesheetId = @id
          `);

        await transaction.request()
          .input('id', sql.BigInt, id)
          .input('userId', sql.BigInt, userId)
          .input('userName', sql.NVarChar, userName)
          .query(`
            INSERT INTO [hrm].[TimesheetStatusHistory] 
            (TimesheetId, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
            VALUES (@id, 'APPROVED', SYSUTCDATETIME(), @userId, @userName, 'Bulk approved via Manager Dashboard')
          `);
      }
      await transaction.commit();
      res.status(200).json({ success: true, message: `Successfully approved ${timesheetIds.length} timesheets` });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Bulk reject timesheets
exports.bulkRejectTimesheets = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { timesheetIds, reason } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.username || 'HR Manager';
    const notes = reason || 'Bulk rejected by manager';

    if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({ success: false, message: "No timesheet IDs provided" });
    }

    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId
      `);
    const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;
    const userRole = req.user?.role;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const id of timesheetIds) {
        // Authorization check for each timesheet
        const authCheck = await transaction.request()
          .input('id', sql.BigInt, id)
          .query(`
            SELECT 
              e.SupervisorEmployeeId, 
              e.BackupSupervisorEmployeeId,
              t.WeekStartDate,
              t.WeekEndDate,
              TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as EmployeeName,
              ci_email.IdentityValue as EmployeeEmail
            FROM [hrm].[Timesheet] t WITH (NOLOCK)
            JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
            LEFT JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
            LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId 
              AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
            WHERE t.TimesheetId = @id
          `);

        
        if (authCheck.recordset.length > 0) {
          const { SupervisorEmployeeId, BackupSupervisorEmployeeId } = authCheck.recordset[0];
          const isAuthorized = (userRole === 'super_admin') || (userRole === 'admin') || 
                               (SupervisorEmployeeId && approverEmployeeId === SupervisorEmployeeId) || 
                               (BackupSupervisorEmployeeId && approverEmployeeId === BackupSupervisorEmployeeId) ||
                               (!SupervisorEmployeeId && !BackupSupervisorEmployeeId);

          if (!isAuthorized) {
            throw new Error(`Unauthorized to reject timesheet ID ${id}. You are not the assigned supervisor.`);
          }
        }

        await transaction.request()

          .input('id', sql.BigInt, id)
          .input('userId', sql.BigInt, userId)
          .input('notes', sql.NVarChar, notes)
          .input('userName', sql.NVarChar, userName)
          .input('approverEmpId', sql.BigInt, approverEmployeeId)
          .query(`
            UPDATE [hrm].[Timesheet]
            SET StatusCode = 'REJECTED',
                Notes = @notes,
                ApprovedByEmployeeId = @approverEmpId,
                UpdatedAtUtc = SYSUTCDATETIME(),
                UpdatedByUserId = @userId
            WHERE TimesheetId = @id
          `);

        await transaction.request()
          .input('id', sql.BigInt, id)
          .input('userId', sql.BigInt, userId)
          .input('userName', sql.NVarChar, userName)
          .input('reason', sql.NVarChar, notes)
          .query(`
            INSERT INTO [hrm].[TimesheetStatusHistory] 
            (TimesheetId, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
            VALUES (@id, 'REJECTED', SYSUTCDATETIME(), @userId, @userName, @reason)
          `);

        // Prepare email notification (outside transaction but inside loop for simplicity)
        if (authCheck.recordset.length > 0) {
          const data = authCheck.recordset[0];
          if (data.EmployeeEmail) {
            employeeController.sendTimesheetRejectionEmail({
              to: data.EmployeeEmail,
              employeeName: data.EmployeeName || 'Employee',
              periodStart: formatDate(data.WeekStartDate),
              periodEnd: formatDate(data.WeekEndDate),
              reason: notes
            }).catch(err => console.error(`Error sending bulk rejection email for ${id}:`, err));
          }
        }
      }
      await transaction.commit();
      res.status(200).json({ success: true, message: `Successfully rejected ${timesheetIds.length} timesheets` });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a timesheet (Manager/Admin action)
exports.deleteTimesheet = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { timesheetId } = req.params;
    const userRole = req.user?.role?.toLowerCase();
    
    // Check if timesheet exists
    const checkResult = await pool.request()
      .input("id", sql.BigInt, timesheetId)
      .query(`SELECT StatusCode FROM [hrm].[Timesheet] WHERE TimesheetId = @id`);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Timesheet not found" });
    }

    const isAdminOrManager = userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager' || userRole === 'teamlead' || userRole === 'team_lead';

    if (!isAdminOrManager) {
      return res.status(403).json({ success: false, message: "Access Denied: Only managers, admins or super admins can delete timesheets." });
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


// Update timesheet entries (Supervisor/Admin action)
exports.updateTimesheetEntries = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);
  try {
    const { timesheetId } = req.params;
    const { entries } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role?.toLowerCase();
    const userName = req.user?.username || 'Manager';

    if (!Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: "Entries must be an array" });
    }

    const pool = await poolPromise;

    // 1. Authorization check
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId
      `);
    const requesterEmployeeId = userResult.recordset[0]?.EmployeeId || null;

    const timesheetCheck = await pool.request()
      .input('id', sql.BigInt, timesheetId)
      .query(`
        SELECT t.EmployeeId as OwnerId, e.SupervisorEmployeeId, e.BackupSupervisorEmployeeId, t.StatusCode
        FROM [hrm].[Timesheet] t WITH (NOLOCK)
        JOIN [hrm].[Employee] e WITH (NOLOCK) ON t.EmployeeId = e.EmployeeId
        WHERE t.TimesheetId = @id
      `);

    if (timesheetCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Timesheet not found" });
    }

    const { SupervisorEmployeeId, BackupSupervisorEmployeeId, StatusCode } = timesheetCheck.recordset[0];

    const isAuthorized = (userRole === 'super_admin') || 
                         (userRole === 'admin') || 
                         (SupervisorEmployeeId && requesterEmployeeId === SupervisorEmployeeId) || 
                         (BackupSupervisorEmployeeId && requesterEmployeeId === BackupSupervisorEmployeeId);

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Access Denied: You are not authorized to edit this timesheet." });
    }

    if (StatusCode === 'APPROVED') {
      return res.status(400).json({ success: false, message: "Cannot edit an already approved timesheet." });
    }

    // 2. Perform updates in a transaction
    await transaction.begin();

    let totalHours = 0;
    let overtimeHours = 0;

    for (const entry of entries) {
      // Skip invalid entries or entries with string "undefined" IDs
      if (!entry.id || entry.id === 'undefined') continue;

      const hours = parseFloat(entry.hours) || 0;
      const hourType = entry.hourType || 'REGULAR';
      totalHours += hours;
      if (hours > 8) overtimeHours += (hours - 8);

      await transaction.request()
        .input('entryId', sql.BigInt, entry.id)
        .input('timesheetId', sql.BigInt, timesheetId)
        .input('hours', sql.Decimal(5, 2), hours)
        .input('hourType', sql.NVarChar, hourType)
        .input('notes', sql.NVarChar, entry.task || entry.description || null)
        .input('userId', sql.BigInt, userId)
        .query(`
          UPDATE [hrm].[TimesheetEntry]
          SET HoursWorked = @hours,
              Notes = @notes,
              HourType = @hourType,
              UpdatedAtUtc = SYSUTCDATETIME(),
              UpdatedByUserId = @userId
          WHERE TimesheetEntryId = @entryId AND TimesheetId = @timesheetId
        `);
    }

    // Update the main timesheet record
    await transaction.request()
      .input('id', sql.BigInt, timesheetId)
      .input('total', sql.Decimal(6, 2), totalHours)
      .input('userId', sql.BigInt, userId)
      .query(`
        UPDATE [hrm].[Timesheet]
        SET TotalHours = @total,
            UpdatedAtUtc = SYSUTCDATETIME(),
            UpdatedByUserId = @userId
        WHERE TimesheetId = @id
      `);

    // Audit trail
    await transaction.request()
      .input('id', sql.BigInt, timesheetId)
      .input('userId', sql.BigInt, userId)
      .input('userName', sql.NVarChar, userName)
      .input('StatusCode', sql.NVarChar, StatusCode)
      .query(`
        INSERT INTO [hrm].[TimesheetStatusHistory] 
        (TimesheetId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserId, ChangedByUserName, ReasonText)
        VALUES (@id, @StatusCode, @StatusCode, SYSUTCDATETIME(), @userId, @userName, 'Timesheet entries modified by supervisor')
      `);

    await transaction.commit();

    res.status(200).json({ 
      success: true, 
      message: "Timesheet entries updated successfully",
      totalHours: totalHours,
      overtimeHours: overtimeHours
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error updating timesheet entries:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
