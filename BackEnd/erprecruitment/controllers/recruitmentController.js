const { poolPromise, sql } = require("../../config/db");

// Add this import for email service
// const { sendEmailSMTP2GO } = require('../utils/emailService');

const { sendEmailWithFallback } = require('../utils/emailService');




// Helper function to get user email preference
const getUserEmailPreference = async (username) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .query(`
        SELECT ISNULL(d.emailNotifications, 1) as emailNotifications
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        WHERE u.username = @username
           OR u.id = (SELECT TOP 1 userId FROM Recruiters WHERE name = @username)
      `);
    
    if (result.recordset.length === 0) {
      console.log(`âš ï¸ User ${username} not found, defaulting to NO email`);
      return false; // Default to false (no email)
    }
    
    const rawValue = result.recordset[0].emailNotifications;
    const shouldSendEmail = rawValue === 1 || rawValue === true;
    
    console.log(`ðŸ“§ Email preference for ${username}: ${shouldSendEmail ? 'YES (send email)' : 'NO (skip email)'} [raw: ${rawValue}]`);
    
    return shouldSendEmail;
  } catch (error) {
    console.error('âŒ Error fetching email preference:', error);
    return false; // Default to false on error (safer)
  }
};

// Helper function to get user email
const getUserEmail = async (username) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .query(`
        SELECT d.email 
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        WHERE u.username = @username
           OR u.id = (SELECT TOP 1 userId FROM Recruiters WHERE name = @username)
      `);
    
    return result.recordset.length > 0 ? result.recordset[0].email : null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
};

// Update the getAllRoles function to include assignment times
// Update the getAllRoles function to include pagination and server-side filtering
exports.getAllRoles = async (req, res) => {
  try {
    const pool = await poolPromise;
    const currentUserRole = req.user.role;
    const currentUsername = req.user.username;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || null;
    const limit = parseInt(req.query.limit) || 15;
    const offset = page ? (page - 1) * limit : 0;
    
    // Filter parameters
    const { status, urgency, searchTerm, days, locations } = req.query;

    let whereConditions = ['1=1'];
    let params = {};

    // Role-based filters (Security/Visibility)
    if (currentUserRole === 'user') {
      whereConditions.push(`(
        EXISTS (
          SELECT 1 FROM RoleRecruiterAssignments rra 
          JOIN Recruiters rec ON rra.recruiterId = rec.id
          WHERE rra.roleId = rr.id 
          AND rec.userId = @userId 
          AND rra.isActive = 1
        )
        OR rr.assignTo = @username 
        OR rr.assignTo IN (SELECT name FROM Recruiters WHERE userId = @userId)
      )`);
      params.username = currentUsername;
      params.userId = req.user.id || req.user.userId;
    } else if (currentUserRole === 'teamlead') {
      whereConditions.push(`(
        rr.createdBy = @username
        OR rr.createdBy IN (SELECT name FROM Recruiters WHERE userId = @userId)
        OR rr.assignTo = @username
        OR rr.assignTo IN (SELECT name FROM Recruiters WHERE userId = @userId)
        OR EXISTS (
          SELECT 1 FROM RoleRecruiterAssignments rra 
          JOIN Recruiters rec ON rra.recruiterId = rec.id
          WHERE rra.roleId = rr.id 
          AND rec.userId = @userId 
          AND rra.isActive = 1
        )
      )`);
      params.username = currentUsername;
      params.userId = req.user.id || req.user.userId;
    }

    // Status filter
    if (status) {
      whereConditions.push(`rr.status = @status`);
      params.status = status;
    }

    // Urgency filter
    if (urgency) {
      whereConditions.push(`rr.urgency = @urgency`);
      params.urgency = urgency;
    }

    // Search term filter
    if (searchTerm) {
      whereConditions.push(`(
        rr.role LIKE @searchTerm OR 
        rr.client LIKE @searchTerm OR 
        rr.city LIKE @searchTerm OR 
        rr.state LIKE @searchTerm OR 
        rr.jobId LIKE @searchTerm OR
        rr.systemId LIKE @searchTerm
      )`);
      params.searchTerm = `%${searchTerm}%`;
    }

    // Date filter (days)
    if (days) {
      whereConditions.push(`rr.createdAt >= DATEADD(day, -@days, GETDATE())`);
      params.days = parseInt(days);
    }

    // Location filter
    if (locations && locations.length > 0) {
      // locations comes as comma-separated string from frontend
      const locationArray = Array.isArray(locations) 
        ? locations 
        : locations.split(',');
      
      if (locationArray.length > 0 && locationArray[0] !== '') {
        const locationConditions = locationArray.map((loc, idx) => {
          const [city, state] = loc.split('|'); // Format: "city|state"
          const paramName = `city_${idx}`;
          const stateParamName = `state_${idx}`;
          
          if (city && state) {
             params[paramName] = city;
             params[stateParamName] = state;
             return `(rr.city = @${paramName} AND rr.state = @${stateParamName})`;
          } else if (city) {
             params[paramName] = city;
             return `(rr.city = @${paramName})`;
          }
          return '1=1';
        }).join(' OR ');
        
        if (locationConditions !== '1=1') {
           whereConditions.push(`(${locationConditions})`);
        }
      }
    }

    // Card Location filter (Onsite vs Offshore)
    const { cardLocation } = req.query;
    if (cardLocation === 'Offshore') {
      whereConditions.push(`(rr.country LIKE '%India%' OR rr.country = 'IN')`);
    } else if (cardLocation === 'Onsite') {
      whereConditions.push(`(rr.country NOT LIKE '%India%' AND rr.country != 'IN' OR rr.country IS NULL)`);
    }

    const whereClause = whereConditions.join(' AND ');

    const appWhereClause = whereClause.replace(/rr\./g, 'roles.');

    // 1. Get Total Count and Global Stats
const statsQuery = `
  SELECT 
    COUNT(DISTINCT rr.id) as totalCount,
    COUNT(DISTINCT CASE WHEN rr.status = 'Active' THEN rr.id ELSE NULL END) as activeRoles,
    COUNT(DISTINCT CASE WHEN rr.urgency IN ('Critical', 'High') THEN rr.id ELSE NULL END) as urgentRoles,
    (
      SELECT COUNT(*) 
      FROM Applications a 
      WHERE a.roleId IN (
        SELECT id 
        FROM RecruitmentRoles roles 
        WHERE ${appWhereClause}
      )
    ) as totalApplications
  FROM RecruitmentRoles rr
  WHERE ${whereClause}
`;
    
    const statsRequest = pool.request();
    Object.keys(params).forEach(key => statsRequest.input(key, params[key]));
    const statsResult = await statsRequest.query(statsQuery);
    
    const { totalCount, activeRoles, urgentRoles, totalApplications } = statsResult.recordset[0];
    const stats = {
      totalRoles: totalCount,
      activeRoles: activeRoles || 0,
      urgentRoles: urgentRoles || 0,
      totalApplications: totalApplications || 0
    };

    // 2. Get Paginated Data
    let query = `
      SELECT
        rr.id, rr.jobId, rr.gbamsId, rr.systemId, rr.role, rr.roleType,
        rr.country, rr.state, rr.city, rr.currency,
        rr.minRate, rr.maxRate, rr.client, rr.clientPOC, rr.roleLocation,
        rr.experience, rr.urgency, rr.status, rr.assignTo,
        rr.jobDescription, rr.recruiterLead, rr.recruiter,
        rr.effectiveFrom, rr.createdBy, rr.createdAt,  
        rr.startDate, rr.endDate, rr.profilesNeeded,
        rr.expensePaid, rr.specialNotes, rr.visaTypes,
        rr.vendor,
        r.name AS recruiterName,
        (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id) AS applicationCount,
        (
          SELECT STRING_AGG(
            CONCAT(
              '{"id":', rec.id, 
              ',"name":"', rec.name, 
              '","role":"', ISNULL(rec.role, ''), 
              '","assignedBy":"', ISNULL(rra.assignedBy, ''), 
              '","assignedAt":"', ISNULL(CONVERT(VARCHAR, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt)), 127), ''),
              '"}' 
            ), ','
          )
          FROM RoleRecruiterAssignments rra
          JOIN Recruiters rec ON rra.recruiterId = rec.id
          WHERE rra.roleId = rr.id AND rra.isActive = 1
        ) AS assignedRecruiters
      FROM RecruitmentRoles rr
      LEFT JOIN Recruiters r ON rr.recruiter = r.id
      WHERE ${whereClause}
      ORDER BY rr.createdAt DESC
    `;

    // Apply pagination if page is provided
    if (page !== null) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      params.offset = offset;
      params.limit = limit;
    }

    const dataRequest = pool.request();
    Object.keys(params).forEach(key => dataRequest.input(key, params[key]));
    const result = await dataRequest.query(query);
    
    const processedResult = result.recordset.map(role => ({
      ...role,
      assignedRecruiters: role.assignedRecruiters ? 
        JSON.parse(`[${role.assignedRecruiters}]`.replace(/}{/g, '},{')) : []
    }));

    // Return structured response if paginated, otherwise return array (for backward compatibility)
    if (page !== null) {
      res.status(200).json({
        data: processedResult,
        totalCount,
        stats,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        itemsPerPage: limit
      });
    } else {
      res.status(200).json(processedResult);
    }
  } catch (error) {
    console.error("Error fetching recruitment roles:", error);
    res.status(500).json({ message: "Server error while fetching roles", error });
  }
};
// Add this function to recruitmentController.js
// Complete downloadRolesReport function - Replace your existing one
exports.downloadRolesReport = async (req, res) => {
  try {
    console.log('=== DOWNLOAD ROLES REPORT START ===');
    console.log('User:', req.user.username, 'Role:', req.user.role);
    console.log('Query params:', req.query);
    console.log('Body:', req.body);
    
    const pool = await poolPromise;
    const currentUserRole = req.user.role;
    const currentUsername = req.user.username;
    
    // Handle both GET (query) and POST (body) for columns
    let { period, columns = [] } = req.query;
    if (req.method === 'POST' && req.body.columns) {
      columns = req.body.columns;
    }
    
    console.log('Period:', period);
    console.log('Columns:', columns);
    console.log('Columns type:', typeof columns, 'Is array:', Array.isArray(columns));

    // Build the base query
    let rolesQuery = '';
    let whereConditions = [];
    let rolesParams = {};
    
    // Base SELECT clause
const selectClause = `
  SELECT 
    rr.id,
    rr.jobId,
    rr.systemId,
    rr.role,
    rr.roleType,
    rr.client,
    rr.clientPOC,
    rr.country,
    rr.state,
    rr.city,
    rr.roleLocation,
    rr.roleCategory,
    rr.location,
    rr.experience,
    rr.urgency,
    rr.status,
    rr.assignTo,
    rr.currency,
    rr.minRate,
    rr.maxRate,
    rr.startDate,
    rr.endDate,
    rr.profilesNeeded,
    rr.createdAt as createdAt,
    rr.createdBy,
    rr.visaTypes,
    rr.gbamsId,
    rr.vendor,  // ADD THIS LINE
    (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id) as TotalApplications,
    (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id AND status = 'Applied') as AppliedCount,
    (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id AND status = 'Hired') as HiredCount,
    (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id AND currentStep >= 3 AND currentStep <= 6) as InterviewsCount
  FROM RecruitmentRoles rr
`;

    // Add role-based conditions
    if (currentUserRole === 'admin' || currentUserRole === 'manager') {
      console.log('User is admin/manager - showing all roles');
    } else if (currentUserRole === 'teamlead') {
      whereConditions.push(`(
        rr.assignTo = @username 
        OR rr.assignTo IN (SELECT name FROM Recruiters WHERE userId = @userId)
        OR rr.createdBy = @username
        OR rr.createdBy IN (SELECT name FROM Recruiters WHERE userId = @userId)
        OR EXISTS (
          SELECT 1 FROM RoleRecruiterAssignments rra 
          JOIN Recruiters rec ON rra.recruiterId = rec.id
          WHERE rra.roleId = rr.id 
          AND rec.userId = @userId 
          AND rra.isActive = 1
        )
      )`);
      rolesParams.username = currentUsername;
      rolesParams.userId = req.user.id || req.user.userId;
      console.log('User is teamlead - filtering by username:', currentUsername);
    } else if (currentUserRole === 'user') {
      whereConditions.push(`(
        rr.assignTo = @username
        OR rr.assignTo IN (SELECT name FROM Recruiters WHERE userId = @userId)
        OR EXISTS (
          SELECT 1 FROM RoleRecruiterAssignments rra 
          JOIN Recruiters rec ON rra.recruiterId = rec.id
          WHERE rra.roleId = rr.id 
          AND rec.userId = @userId 
          AND rra.isActive = 1
        )
      )`);
      rolesParams.username = currentUsername;
      rolesParams.userId = req.user.id || req.user.userId;
      console.log('User is regular user - filtering by username:', currentUsername);
    }

    // Add date filtering conditions
    if (period === 'daily') {
      whereConditions.push(`CAST(rr.createdAt AS DATE) = CAST(GETDATE() AS DATE)`);
      console.log('Filtering by daily period');
    } else if (period === 'weekly') {
      whereConditions.push(`rr.createdAt >= DATEADD(DAY, -7, GETDATE())`);
      console.log('Filtering by weekly period');
    } else if (period === 'monthly') {
      whereConditions.push(`rr.createdAt >= DATEADD(MONTH, -1, GETDATE())`);
      console.log('Filtering by monthly period');
    } else {
      console.log('No period filter applied - showing all data');
    }

    // Construct the complete query
    rolesQuery = selectClause;
    if (whereConditions.length > 0) {
      rolesQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    rolesQuery += ` ORDER BY rr.createdAt DESC`;

    console.log('Final query:', rolesQuery);
    console.log('Query parameters:', rolesParams);

    console.log('Executing roles query...');
    
    // Execute roles query
    const rolesRequest = pool.request();
    Object.keys(rolesParams).forEach(key => {
      rolesRequest.input(key, sql.NVarChar, rolesParams[key]);
    });
    
    const rolesResult = await rolesRequest.query(rolesQuery);
    console.log('Found', rolesResult.recordset.length, 'roles');
    
    // DEBUG: Log first role to see structure
    if (rolesResult.recordset.length > 0) {
      console.log('First role structure:', JSON.stringify(rolesResult.recordset[0], null, 2));
    }

    // Now get applications for these roles
    const roleIds = rolesResult.recordset.map(role => role.id);
    let applicationsResult = { recordset: [] };
    
    if (roleIds.length > 0) {
      // Create parameters for role IDs
      const roleIdParams = roleIds.map((_, index) => `@roleId${index}`).join(',');
      const applicationsQuery = `
        SELECT 
          a.*,
          a.appliedAt as appliedAt, 
          (SELECT COUNT(*) FROM ApplicationResumes ar WHERE ar.applicationId = a.id) as ResumeCount
        FROM Applications a 
        WHERE a.roleId IN (${roleIdParams})
        ORDER BY a.appliedAt DESC
      `;
      const applicationsRequest = pool.request();
      roleIds.forEach((id, index) => {
        applicationsRequest.input(`roleId${index}`, sql.Int, id);
      });
      
      console.log('Executing applications query...');
      applicationsResult = await applicationsRequest.query(applicationsQuery);
      console.log('Found', applicationsResult.recordset.length, 'applications');
    }

    // Get assigned recruiters for all roles
    let assignedRecruitersResult = { recordset: [] };
    if (roleIds.length > 0) {
      const roleIdParams = roleIds.map((_, index) => `@roleId${index}`).join(',');
      const recruitersQuery = `
        SELECT 
          rra.roleId,
          STRING_AGG(rec.name, ', ') as AssignedRecruiters
        FROM RoleRecruiterAssignments rra
        JOIN Recruiters rec ON rra.recruiterId = rec.id
        WHERE rra.roleId IN (${roleIdParams})
        AND rra.isActive = 1
        GROUP BY rra.roleId
      `;
      
      const recruitersRequest = pool.request();
      roleIds.forEach((id, index) => {
        recruitersRequest.input(`roleId${index}`, sql.Int, id);
      });
      
      console.log('Executing recruiters query...');
      assignedRecruitersResult = await recruitersRequest.query(recruitersQuery);
    }

    // Create lookup maps
    const applicationsMap = {};
    applicationsResult.recordset.forEach(app => {
      if (!applicationsMap[app.roleId]) {
        applicationsMap[app.roleId] = [];
      }
      applicationsMap[app.roleId].push(app);
    });

    const recruitersMap = {};
    assignedRecruitersResult.recordset.forEach(rec => {
      recruitersMap[rec.roleId] = rec.AssignedRecruiters;
    });

    console.log('Generating CSV data...');
    
    // Define column mappings
    const columnMappings = {
      'roleId': { header: 'Role ID', getValue: (role, app) => role.id || '' },
      'jobId': { header: 'Job ID', getValue: (role, app) => role.jobId || '' },
      'systemId': { header: 'System ID', getValue: (role, app) => role.systemId || '' },
      'role': { header: 'Role Name', getValue: (role, app) => role.role || '' },
      'roleType': { header: 'Role Type', getValue: (role, app) => role.roleType || '' },
      'client': { header: 'Client', getValue: (role, app) => role.client || '' },
      'clientPOC': { header: 'Client POC', getValue: (role, app) => role.clientPOC || '' },
      'location': { 
        header: 'Location', 
        getValue: (role, app) => {
          if (!role.city && !role.state && !role.country) {
            return 'N/A';
          }
          try {
            const cities = role.city ? role.city.split(',').map(c => c.trim()).filter(c => c) : [];
            const states = role.state ? role.state.split(',').map(s => s.trim()).filter(s => s) : [];
            const country = role.country || '';

            if (cities.length > 0 && states.length > 0 && cities.length === states.length) {
              return cities.map((city, index) => 
                `${city}, ${states[index]}, ${country}`
              ).join(' | ');
            }
            
            if (cities.length > 0) {
              const cityStatePairs = cities.map(city => {
                const matchingState = states.length > 0 ? states[0] : (role.state || '');
                return `${city}, ${matchingState}, ${country}`;
              });
              return cityStatePairs.join(' | ');
            }

            return `${role.city || ''}, ${role.state || ''}, ${role.country || ''}`.replace(/^,\s*|\s*,/g, '').trim();
          } catch (error) {
            console.error('Error formatting location:', error);
            return `${role.city || ''}, ${role.state || ''}, ${role.country || ''}`.replace(/^,\s*|\s*,/g, '').trim();
          }
        }
      },
      'roleLocation': { header: 'Work Mode', getValue: (role, app) => role.roleLocation || '' },
      'experience': { header: 'Experience', getValue: (role, app) => role.experience || '' },
      'urgency': { header: 'Urgency', getValue: (role, app) => role.urgency || '' },
      'status': { header: 'Role Status', getValue: (role, app) => role.status || '' },
      'assignTo': { header: 'Role Owner', getValue: (role, app) => role.assignTo || '' },
      'currency': { header: 'Currency', getValue: (role, app) => role.currency || '' },
      'vendor': { header: 'Vendor', getValue: (role, app) => role.vendor || '' },
      'minRate': { header: 'Min Rate', getValue: (role, app) => role.minRate || '' },
      'maxRate': { header: 'Max Rate', getValue: (role, app) => role.maxRate || '' },
      'startDate': { 
        header: 'Start Date', 
        getValue: (role, app) => {
          if (!role.startDate) return '';
          try {
            const date = new Date(role.startDate);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
          } catch (error) {
            console.error('Error formatting startDate:', error);
            return '';
          }
        }
      },
      'endDate': { 
        header: 'End Date', 
        getValue: (role, app) => {
          if (!role.endDate) return '';
          try {
            const date = new Date(role.endDate);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
          } catch (error) {
            console.error('Error formatting endDate:', error);
            return '';
          }
        }
      },
      'profilesNeeded': { header: 'Profiles Needed', getValue: (role, app) => role.profilesNeeded || '' },
      'createdAt': { 
        header: 'Role Created At', 
        getValue: (role, app) => {
          if (!role.createdAt) return '';
          try {
            const date = new Date(role.createdAt);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleString('en-IN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });
          } catch (error) {
            console.error('Error formatting createdAt:', error);
            return '';
          }
        }
      },
      'createdBy': { header: 'Created By', getValue: (role, app) => role.createdBy || '' },
      'visaTypes': { header: 'Visa Types', getValue: (role, app) => role.visaTypes || '' },
      'gbamsId': { header: 'GBAMS ID', getValue: (role, app) => role.gbamsId || '' },
      'totalApplications': { header: 'Total Applications', getValue: (role, app) => role.TotalApplications || 0 },
      'appliedCount': { header: 'Applied Count', getValue: (role, app) => role.AppliedCount || 0 },
      'hiredCount': { header: 'Hired Count', getValue: (role, app) => role.HiredCount || 0 },
      'interviewsCount': { header: 'Interviews Count', getValue: (role, app) => role.InterviewsCount || 0 },
      'assignedRecruiters': { header: 'Assigned Recruiters', getValue: (role, app) => recruitersMap[role.id] || '' },
      'applicationId': { header: 'Application ID', getValue: (role, app) => app ? app.id || '' : '' },
      'candidateName': { header: 'Candidate Name', getValue: (role, app) => app ? app.name || '' : '' },
      'candidateEmail': { header: 'Candidate Email', getValue: (role, app) => app ? app.email || '' : '' },
      'candidatePhone': { header: 'Candidate Phone', getValue: (role, app) => app ? app.phone || '' : '' },
      'candidateExperience': { header: 'Candidate Experience', getValue: (role, app) => app ? app.experience || '' : '' },
      'currentCompany': { header: 'Current Company', getValue: (role, app) => app ? app.currentCompany || '' : '' },
      'expectedSalary': { header: 'Expected Salary', getValue: (role, app) => app ? app.expectedSalary || '' : '' },
      'candidateLocation': { header: 'Candidate Location', getValue: (role, app) => app ? app.location || '' : '' },
      'applicationStatus': { header: 'Application Status', getValue: (role, app) => app ? app.status || '' : '' },
      'appliedAt': { 
        header: 'Applied At', 
        getValue: (role, app) => {
          if (!app || !app.appliedAt) return '';
          try {
            const date = new Date(app.appliedAt);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleString('en-IN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });
          } catch (error) {
            console.error('Error formatting appliedAt:', error);
            return '';
          }
        }
      },
      'submittedBy': { header: 'Submitted By', getValue: (role, app) => app ? app.submittedBy || '' : '' },
      'resumeCount': { header: 'Resume Count', getValue: (role, app) => app ? app.ResumeCount || 0 : '' }
    };

    // Convert columns array (ensure it's always an array)
    let selectedColumns = Array.isArray(columns) ? columns : (columns ? [columns] : []);
    
    console.log('Selected columns for export:', selectedColumns);
    console.log('Selected columns length:', selectedColumns.length);
    
    // If no columns selected, use all columns
    if (selectedColumns.length === 0) {
      selectedColumns = Object.keys(columnMappings);
      console.log('No columns specified - using all columns:', selectedColumns);
    }

    // Generate CSV data with selected columns only
    // Separate columns into role-level and application-level
    const roleOnlyColumns = [
      'roleId', 'jobId', 'systemId', 'role', 'roleType', 'client', 'clientPOC',
      'location', 'roleLocation', 'roleCategory', 'experience', 'urgency', 'status', 'assignTo',
      'currency', 'minRate', 'maxRate', 'startDate', 'endDate', 'profilesNeeded',
      'createdAt', 'createdBy', 'visaTypes', 'gbamsId', 'totalApplications',
      'appliedCount', 'hiredCount', 'interviewsCount', 'assignedRecruiters'
    ];

    const applicationColumns = [
      'applicationId', 'candidateName', 'candidateEmail', 'candidatePhone',
      'candidateExperience', 'currentCompany', 'expectedSalary', 'candidateLocation',
      'applicationStatus', 'appliedAt', 'submittedBy', 'resumeCount'
    ];

    // Check if user selected any application columns
    const hasApplicationColumns = selectedColumns.some(col => applicationColumns.includes(col));

    // Generate CSV data
    const csvData = [];

    // Add headers based on selected columns
    const headers = selectedColumns.map(colId => columnMappings[colId]?.header || colId);
    csvData.push(headers);

    console.log('CSV Headers:', headers);
    console.log('Has application columns:', hasApplicationColumns);

    // Add data rows
    rolesResult.recordset.forEach(role => {
      const roleApplications = applicationsMap[role.id] || [];
      
      if (!hasApplicationColumns || roleApplications.length === 0) {
        // Create one row per role (no application details selected or no applications exist)
        const row = selectedColumns.map(colId => {
          const mapping = columnMappings[colId];
          if (!mapping) return '';
          
          // For application columns when not including application details, show empty
          if (applicationColumns.includes(colId)) {
            return '';
          }
          
          return mapping.getValue(role, null);
        });
        csvData.push(row);
      } else {
        // User selected application columns AND this role has applications
        // Create one row per application
        roleApplications.forEach(app => {
          const row = selectedColumns.map(colId => {
            const mapping = columnMappings[colId];
            return mapping ? mapping.getValue(role, app) : '';
          });
          csvData.push(row);
        });
      }
    });

    console.log('Total CSV rows (including header):', csvData.length);
    console.log('Data rows:', csvData.length - 1);

    console.log('Converting to CSV...');
    
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Set response headers for CSV download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const periodSuffix = period ? `_${period}` : '';
    const roleSuffix = currentUserRole !== 'admin' && currentUserRole !== 'manager' ? `_${currentUsername}` : '';
    const filename = `recruitment_report${periodSuffix}${roleSuffix}_${timestamp}.csv`;

    console.log('Sending CSV file:', filename);
    console.log('CSV size:', csvContent.length, 'characters');
    console.log('Selected columns:', selectedColumns);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(csvContent);
    
    console.log('=== DOWNLOAD ROLES REPORT COMPLETE ===');

  } catch (error) {
    console.error("=== ERROR GENERATING ROLES REPORT ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("User:", req.user?.username, "Role:", req.user?.role);
    
    res.status(500).json({ 
      message: "Server error while generating report", 
      error: error.message 
    });
  }
};
exports.getRoleById = async (req, res) => {
  const roleId = req.params.id;
  
  try {
    const pool = await poolPromise;
    const roleResult = await pool.request()
      .input("id", sql.Int, roleId)
      .query(`
        SELECT 
          rr.*, 
          r.name AS recruiterName,
          (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id) AS applicationCount
        FROM RecruitmentRoles rr
        LEFT JOIN Recruiters r ON rr.recruiter = r.id
        WHERE rr.id = @id
      `);
    
    if (roleResult.recordset.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }
    
    const role = roleResult.recordset[0];
    
    // Check if current user is authorized to view this role
    if (req.user.role === 'user' && role.assignTo !== req.user.username) {
      // Also check if user is assigned via RoleRecruiterAssignments
      const userId = req.user.id || req.user.userId;
      const assignmentCheck = await pool.request()
        .input('roleId', sql.Int, roleId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 1 FROM RoleRecruiterAssignments rra
          JOIN Recruiters rec ON rra.recruiterId = rec.id
          WHERE rra.roleId = @roleId
          AND rec.userId = @userId
          AND rra.isActive = 1
        `);
      
      if (assignmentCheck.recordset.length === 0) {
        return res.status(403).json({ message: "Unauthorized to view this role" });
      }
    }
    
    // Get applications for this role
    const appsResult = await pool.request()
      .input("roleId", sql.Int, roleId)
      .query(`
        SELECT * FROM Applications 
        WHERE roleId = @roleId
        ORDER BY appliedAt DESC
      `);
    
    role.applications = appsResult.recordset;
    
    res.status(200).json(role);
  } catch (error) {
    console.error("Error fetching role details:", error);
    res.status(500).json({ message: "Server error while fetching role", error });
  }
};
// Updated createRole function with GBAMS_ID
exports.createRole = async (req, res) => {
  const {
    jobId,
    gbamsId,
    role,
    roleType,
    country,
    state,
    city,
    currency,
    minRate,
    maxRate,
    client,
    clientPOC,
    roleLocation,
    roleCategory,
    experience,
    urgency,
    status,
    assignTo,
    jobDescription,
    effectiveFrom,
    startDate,
    endDate,
    profilesNeeded,
    expensePaid,
    specialNotes,
    visaTypes,
    createdBy,
    vendor,
  } = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Auto-generate Job ID for Offshore roles if not provided, or enforce sequence
    let finalJobId = jobId || '';
    const isOffshore = (roleCategory || '').trim().toLowerCase() === 'offshore';
    
    if (isOffshore) {
      const maxOffshoreJobIdResult = await pool.request()
        .query("SELECT ISNULL(MAX(TRY_CAST(jobId AS INT)), 0) as maxId FROM RecruitmentRoles WHERE LOWER(LTRIM(RTRIM(roleCategory))) = 'offshore'");
      
      const nextId = maxOffshoreJobIdResult.recordset[0].maxId + 1;
      finalJobId = nextId.toString();
    } else if (finalJobId && finalJobId.trim() !== '') {
      // Check if Job ID already exists ONLY if jobId is provided (and it's not Offshore being auto-generated)
      const existingRole = await pool.request()
        .input("jobId", sql.NVarChar, finalJobId)
        .query("SELECT id FROM RecruitmentRoles WHERE jobId = @jobId");
      
      if (existingRole.recordset.length > 0) {
        return res.status(409).json({ message: "A role with this Job ID already exists" });
      }
    }
    
    // Process states - convert array to comma-separated string if needed
    let statesString = '';
    if (state) {
      if (Array.isArray(state)) {
        statesString = state.join(', ');
      } else {
        statesString = state;
      }
    }
    
    // Process cities - convert array to comma-separated string if needed
    let citiesString = '';
    if (city) {
      if (Array.isArray(city)) {
        citiesString = city.join(', ');
      } else {
        citiesString = city;
      }
    }
    
    // Create location pairs with pipe separator
let location = '';
if (roleLocation === 'Remote') {
  // For remote roles, store as "Remote, country"
  location = `Remote, ${country || ''}`;
} else if (citiesString || statesString) {
  const citiesArray = citiesString ? citiesString.split(',').map(c => c.trim()).filter(c => c) : [];
  const statesArray = statesString ? statesString.split(',').map(s => s.trim()).filter(s => s) : [];
  
  const locationPairs = [];
  
  // Handle case where we have multiple cities but only one state, or vice versa
  if (citiesArray.length === statesArray.length) {
    // Perfect case: city and state arrays have same length
    for (let i = 0; i < citiesArray.length; i++) {
      const currentCity = citiesArray[i] || '';
      const currentState = statesArray[i] || '';
      if (currentCity && currentState) {
        locationPairs.push(`${currentCity}, ${currentState}, ${country || ''}`);
      }
    }
  } else if (citiesArray.length > 0 && statesArray.length === 1) {
    // Multiple cities, one state (most common case)
    for (let i = 0; i < citiesArray.length; i++) {
      const currentCity = citiesArray[i] || '';
      const currentState = statesArray[0] || '';
      if (currentCity) {
        locationPairs.push(`${currentCity}, ${currentState}, ${country || ''}`);
      }
    }
  } else if (statesArray.length > 0 && citiesArray.length === 1) {
    // Multiple states, one city
    for (let i = 0; i < statesArray.length; i++) {
      const currentCity = citiesArray[0] || '';
      const currentState = statesArray[i] || '';
      if (currentState) {
        locationPairs.push(`${currentCity}, ${currentState}, ${country || ''}`);
      }
    }
  }
  
  location = locationPairs.join(' | ');
  
  // If no pairs were created, use fallback
  if (!location) {
    location = `${citiesString || ''}, ${statesString || ''}, ${country || ''}`
      .replace(/^,\s*|,\s*$/g, '')
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
  }
} else {
  // No cities or states provided
  location = `${citiesString || ''}, ${statesString || ''}, ${country || ''}`
    .replace(/^,\s*|,\s*$/g, '')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}
    
    // Process visaTypes - convert array to comma-separated string if needed
    let visaTypesString = '';
    if (visaTypes) {
      if (Array.isArray(visaTypes)) {
        visaTypesString = visaTypes.join(', ');
      } else {
        visaTypesString = visaTypes;
      }
    }
    
    const result = await pool.request()
      .input("jobId", sql.NVarChar, finalJobId)
      .input("gbamsId", sql.NVarChar, gbamsId || null)
      .input("role", sql.NVarChar, role || '')
      .input("roleType", sql.NVarChar, roleType || '')
      .input("location", sql.NVarChar, location || 'Not specified')
      .input("country", sql.NVarChar, country || '')
      .input("state", sql.NVarChar, statesString || '')
      .input("city", sql.NVarChar, citiesString || '')
      .input("currency", sql.NVarChar, currency || 'INR')
      .input("minRate", sql.Decimal(12,2), minRate || 0)
      .input("maxRate", sql.Decimal(12,2), maxRate || 0)
      // .input("rate", sql.Decimal(12,2), ((minRate || 0) + (maxRate || 0)) / 2 || 0) // âœ… Added from 2nd code
      .input("client", sql.NVarChar, client || '')
      .input("clientPOC", sql.NVarChar, clientPOC || '')
      .input("roleLocation", sql.NVarChar, roleLocation || '')
      .input("roleCategory", sql.NVarChar, roleCategory || 'Onsite')
      .input("experience", sql.NVarChar, experience || '')
      .input("urgency", sql.NVarChar, urgency || 'Normal')
      .input("status", sql.NVarChar, status || 'Active')
      .input("assignTo", sql.NVarChar, assignTo || null)
      .input("jobDescription", sql.NVarChar(sql.MAX), jobDescription || null)
      .input("effectiveFrom", sql.Date, effectiveFrom || new Date().toISOString())
      .input("startDate", sql.Date, startDate || null)
      .input("endDate", sql.Date, endDate || null)
      .input("profilesNeeded", sql.Int, profilesNeeded || 1)
      .input("expensePaid", sql.Bit, expensePaid || false)
      .input("specialNotes", sql.NVarChar(sql.MAX), specialNotes || null)
      .input("visaTypes", sql.NVarChar, visaTypesString || null)
      .input("createdBy", sql.NVarChar, createdBy || req.user.username || 'Unknown')
      .input("vendor", sql.NVarChar, vendor || null)
      .query(`
        INSERT INTO RecruitmentRoles (
          jobId, gbamsId, role, roleType, location, country, state, city, currency, minRate, maxRate, client,
          clientPOC, roleLocation, roleCategory, experience, urgency, status, assignTo,
          jobDescription, effectiveFrom, startDate, endDate, profilesNeeded, 
          expensePaid, specialNotes, visaTypes, createdBy, vendor
        )
        VALUES (
          @jobId, @gbamsId, @role, @roleType, @location, @country, @state, @city, @currency, @minRate, @maxRate, @client,
          @clientPOC, @roleLocation, @roleCategory, @experience, @urgency, @status, @assignTo,
          @jobDescription, @effectiveFrom, @startDate, @endDate, @profilesNeeded,
          @expensePaid, @specialNotes, @visaTypes, @createdBy, @vendor
        );
        SELECT SCOPE_IDENTITY() AS newId;
      `);
    
    const newId = result.recordset[0].newId;
    
    // Generate system ID
    const systemId = `JOB-${newId.toString().padStart(5, '0')}`;
    await pool.request()
      .input("id", sql.Int, newId)
      .input("systemId", sql.NVarChar, systemId)
      .query(`
        UPDATE RecruitmentRoles 
        SET systemId = @systemId 
        WHERE id = @id
      `);


       // âœ… ADD NOTIFICATION FOR ASSIGNED TEAMLEAD
    if (assignTo) {
      await exports.createNotification(
        assignTo,
        `New role "${role}" assigned to you by ${req.user.username}`,
        'new_role',
        {
          roleId: newId,
          roleName: role,
          client: client,
          assignedBy: req.user.username
        },
        req.user.username
      );
    }
    
    // âœ… ADD NOTIFICATION FOR MANAGERS/ADMINS ABOUT NEW ROLE
    if (req.user.role === 'teamlead' || req.user.role === 'user') {
      // Get all managers and admins
      const managersResult = await pool.request()
        .query(`
          SELECT username FROM userinfo 
          WHERE role IN ('manager', 'admin')
        `);
      
      for (const manager of managersResult.recordset) {
        await exports.createNotification(
          manager.username,
          `New role "${role}" created by ${req.user.username}`,
          'new_role_created',
          {
            roleId: newId,
            roleName: role,
            client: client,
            createdBy: req.user.username
          },
          req.user.username
        );
      }
    }
    
    res.status(201).json({ 
      message: "Role created successfully",
      roleId: newId,
      systemId: systemId
    });
  } catch (error) {
    console.error("Error creating recruitment role:", error);
    res.status(500).json({ message: "Server error while creating role", error: error.message });
  }
};

exports.updateRole = async (req, res) => {
  const roleId = req.params.id;
  const {
    jobId,
    gbamsId,
    role,
    roleType,
    country,
    state,
    city,
    currency,
    minRate,
    maxRate,
    client,
    clientPOC,
    roleLocation,
    roleCategory,
    experience,
    urgency,
    status,
    assignTo,
    jobDescription,
    effectiveFrom,
    startDate,
    endDate,
    profilesNeeded,
    expensePaid,
    specialNotes,
    visaTypes,
    vendor,
  } = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if role exists and user has permission
    const roleCheck = await pool.request()
      .input("id", sql.Int, roleId)
      .input("username", sql.NVarChar, req.user.username)
      .query(`
        SELECT 
          rr.assignTo, 
          rr.createdBy,
          rec.id as currentUserRecruiterId
        FROM RecruitmentRoles rr
        LEFT JOIN Recruiters rec ON rec.userId = (SELECT id FROM userinfo WHERE username = @username) AND rec.isActive = 1
        WHERE rr.id = @id
      `);
    
    if (roleCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }
    
    const existingRole = roleCheck.recordset[0];
    
    // Authorization check - UPDATED to include team lead
    if (req.user.role === 'user') {
      // Regular users can only update roles assigned to them
      if (existingRole.assignTo !== req.user.username) {
        return res.status(403).json({ message: "Unauthorized to update this role" });
      }
    } else if (req.user.role === 'teamlead') {
      // Team leads can update roles they created, assigned to them, or where they are assigned as recruiter
      const canUpdate = existingRole.createdBy === req.user.username ||
                       existingRole.assignTo === req.user.username;
      
      // Also check if team lead is assigned as a recruiter to this role
      if (!canUpdate) {
        const recruiterCheck = await pool.request()
          .input("roleId", sql.Int, roleId)
          .input("recruiterId", sql.Int, existingRole.currentUserRecruiterId)
          .query(`
            SELECT COUNT(*) as count
            FROM RoleRecruiterAssignments
            WHERE roleId = @roleId 
            AND recruiterId = @recruiterId 
            AND isActive = 1
          `);
        
        if (recruiterCheck.recordset[0].count === 0) {
          return res.status(403).json({ 
            message: "Team leads can only update roles they created, are assigned to, or are assigned as recruiters" 
          });
        }
      }
    }
    // Managers and admins have full access (no additional checks needed)
    
    // Process states - convert array to comma-separated string if needed
    let statesString = '';
    if (state) {
      if (Array.isArray(state)) {
        statesString = state.join(', ');
      } else {
        statesString = state;
      }
    }
    
    // Process cities - convert array to comma-separated string if needed
    let citiesString = '';
    if (city) {
      if (Array.isArray(city)) {
        citiesString = city.join(', ');
      } else {
        citiesString = city;
      }
    }
    
// Create location pairs with pipe separator
let location = '';
if (roleLocation === 'Remote') {
  // For remote roles, store as "Remote, country"
  location = `Remote, ${country || ''}`;
} else if (citiesString || statesString) {
  const citiesArray = citiesString ? citiesString.split(',').map(c => c.trim()).filter(c => c) : [];
  const statesArray = statesString ? statesString.split(',').map(s => s.trim()).filter(s => s) : [];
  
  const locationPairs = [];
  
  // Handle case where we have multiple cities but only one state, or vice versa
  if (citiesArray.length === statesArray.length) {
    // Perfect case: city and state arrays have same length
    for (let i = 0; i < citiesArray.length; i++) {
      const currentCity = citiesArray[i] || '';
      const currentState = statesArray[i] || '';
      if (currentCity && currentState) {
        locationPairs.push(`${currentCity}, ${currentState}, ${country || ''}`);
      }
    }
  } else if (citiesArray.length > 0 && statesArray.length === 1) {
    // Multiple cities, one state (most common case)
    for (let i = 0; i < citiesArray.length; i++) {
      const currentCity = citiesArray[i] || '';
      const currentState = statesArray[0] || '';
      if (currentCity) {
        locationPairs.push(`${currentCity}, ${currentState}, ${country || ''}`);
      }
    }
  } else if (statesArray.length > 0 && citiesArray.length === 1) {
    // Multiple states, one city
    for (let i = 0; i < statesArray.length; i++) {
      const currentCity = citiesArray[0] || '';
      const currentState = statesArray[i] || '';
      if (currentState) {
        locationPairs.push(`${currentCity}, ${currentState}, ${country || ''}`);
      }
    }
  }
  
  location = locationPairs.join(' | ');
  
  // If no pairs were created, use fallback
  if (!location) {
    location = `${citiesString || ''}, ${statesString || ''}, ${country || ''}`
      .replace(/^,\s*|,\s*$/g, '')
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
  }
} else {
  // No cities or states provided
  location = `${citiesString || ''}, ${statesString || ''}, ${country || ''}`
    .replace(/^,\s*|,\s*$/g, '')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}
    
    // Process visaTypes - convert array to comma-separated string if needed
    let visaTypesString = '';
    if (visaTypes) {
      if (Array.isArray(visaTypes)) {
        visaTypesString = visaTypes.join(', ');
      } else {
        visaTypesString = visaTypes;
      }
    }
    
    // Update the role
    await pool.request()
      .input("id", sql.Int, roleId)
      .input("gbamsId", sql.NVarChar, gbamsId || null)
      .input("role", sql.NVarChar, role || '')
      .input("roleType", sql.NVarChar, roleType || '')
      .input("location", sql.NVarChar, location || 'Not specified')
      .input("country", sql.NVarChar, country || '')
      .input("state", sql.NVarChar, statesString || '')
      .input("city", sql.NVarChar, citiesString || '')
      .input("currency", sql.NVarChar, currency || 'INR')
      .input("minRate", sql.Decimal(12,2), minRate || 0)
      .input("maxRate", sql.Decimal(12,2), maxRate || 0)
      // .input("rate", sql.Decimal(12,2), ((minRate || 0) + (maxRate || 0)) / 2 || 0) // âœ… Added from 2nd code
      .input("client", sql.NVarChar, client || '')
      .input("clientPOC", sql.NVarChar, clientPOC || '')
      .input("roleLocation", sql.NVarChar, roleLocation || '')
      .input("roleCategory", sql.NVarChar, roleCategory || 'Onsite')
      .input("experience", sql.NVarChar, experience || '')
      .input("urgency", sql.NVarChar, urgency || 'Normal')
      .input("status", sql.NVarChar, status || 'Active')
      .input("assignTo", sql.NVarChar, assignTo || null)
      .input("jobDescription", sql.NVarChar(sql.MAX), jobDescription || null)
      .input("effectiveFrom", sql.Date, effectiveFrom || new Date().toISOString())
      .input("startDate", sql.Date, startDate || null)
      .input("endDate", sql.Date, endDate || null)
      .input("profilesNeeded", sql.Int, profilesNeeded || 1)
      .input("expensePaid", sql.Bit, expensePaid || false)
      .input("specialNotes", sql.NVarChar(sql.MAX), specialNotes || null)
      .input("visaTypes", sql.NVarChar, visaTypesString || null)
      .input("vendor", sql.NVarChar, vendor || null)
      .query(`
        UPDATE RecruitmentRoles
        SET 
          gbamsId = @gbamsId,
          role = @role,
          roleType = @roleType,
          location = @location,
          country = @country,
          state = @state,
          city = @city,
          currency = @currency,
        
          minRate = @minRate,
          maxRate = @maxRate,
          client = @client,
          clientPOC = @clientPOC,
          roleLocation = @roleLocation,
          roleCategory = @roleCategory,
          experience = @experience,
          urgency = @urgency,
          status = @status,
          assignTo = @assignTo,
          jobDescription = @jobDescription,
          effectiveFrom = @effectiveFrom,
          startDate = @startDate,
          endDate = @endDate,
          profilesNeeded = @profilesNeeded,
          expensePaid = @expensePaid,
          specialNotes = @specialNotes,
          visaTypes = @visaTypes,
          vendor = @vendor,
          updatedAt = GETDATE()
        WHERE id = @id
      `);
    
    res.status(200).json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Error updating recruitment role:", error);
    res.status(500).json({ message: "Server error while updating role", error: error.message });
  }
};
exports.deleteRole = async (req, res) => {
  const roleId = req.params.id;
  const forceDelete = req.query.force === 'true';
  
  try {
    const pool = await poolPromise;
    
    // Check if user has permission to delete - UPDATED to include team lead
    if (req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'teamlead') {
      return res.status(403).json({ message: "Only managers, admins, and team leads can delete roles" });
    }
    
    // Check if role exists and get details
    const roleCheck = await pool.request()
      .input("id", sql.Int, roleId)
      .input("username", sql.NVarChar, req.user.username)
      .query(`
        SELECT 
          rr.id, 
          rr.role, 
          rr.jobId,
          rr.createdBy,
          rr.assignTo,
          rec.id as currentUserRecruiterId
        FROM RecruitmentRoles rr
        LEFT JOIN Recruiters rec ON rec.userId = (SELECT id FROM userinfo WHERE username = @username) AND rec.isActive = 1
        WHERE rr.id = @id
      `);
    
    if (roleCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }
    
    const role = roleCheck.recordset[0];
    
    // Authorization check for team lead
    if (req.user.role === 'teamlead') {
      const canDelete = role.createdBy === req.user.username ||
                       role.assignTo === req.user.username;
      
      // Also check if team lead is assigned as a recruiter to this role
      if (!canDelete) {
        const recruiterCheck = await pool.request()
          .input("roleId", sql.Int, roleId)
          .input("recruiterId", sql.Int, role.currentUserRecruiterId)
          .query(`
            SELECT COUNT(*) as count
            FROM RoleRecruiterAssignments
            WHERE roleId = @roleId 
            AND recruiterId = @recruiterId 
            AND isActive = 1
          `);
        
        if (recruiterCheck.recordset[0].count === 0) {
          return res.status(403).json({ 
            message: "Team leads can only delete roles they created, are assigned to, or are assigned as recruiters" 
          });
        }
      }
    }
    // Managers and admins have full access (no additional checks needed)
    
    // Check if there are any applications for this role
    const applicationCheck = await pool.request()
      .input("roleId", sql.Int, roleId)
      .query("SELECT COUNT(*) as count FROM Applications WHERE roleId = @roleId");
    
    const applicationCount = applicationCheck.recordset[0].count;
    
    if (applicationCount > 0 && !forceDelete) {
      return res.status(409).json({ 
        message: `Cannot delete role with ${applicationCount} existing application(s). Use force=true to delete with applications.` 
      });
    }
    
    // Begin transaction for safe deletion
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Delete application resumes first if forceDelete is true
      if (forceDelete && applicationCount > 0) {
        await transaction.request()
          .input("roleId", sql.Int, roleId)
          .query(`
            DELETE FROM ApplicationResumes 
            WHERE applicationId IN (
              SELECT id FROM Applications WHERE roleId = @roleId
            )
          `);
        
        // Delete applications
        await transaction.request()
          .input("roleId", sql.Int, roleId)
          .query("DELETE FROM Applications WHERE roleId = @roleId");
      }
      
      // Delete role recruiter assignments
      await transaction.request()
        .input("roleId", sql.Int, roleId)
        .query("DELETE FROM RoleRecruiterAssignments WHERE roleId = @roleId");
      
      // Delete the role
      await transaction.request()
        .input("id", sql.Int, roleId)
        .query("DELETE FROM RecruitmentRoles WHERE id = @id");
      
      await transaction.commit();
      
      res.status(200).json({ 
        message: forceDelete ? 
          "Role and all associated applications deleted successfully" : 
          "Role deleted successfully",
        deletedRole: {
          id: role.id,
          jobId: role.jobId,
          role: role.role
        },
        deletedBy: req.user.username,
        deletedByRole: req.user.role
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error("Error deleting recruitment role:", error);
    res.status(500).json({ message: "Server error while deleting role", error: error.message });
  }
};

// Alternative delete function that also deletes applications
exports.deleteRoleWithApplications = async (req, res) => {
  const roleId = req.params.id;
  const { forceDelete } = req.body; // Optional parameter to force delete with applications
  
  try {
    const pool = await poolPromise;
    
    // Check if user is manager (only managers can delete roles)
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: "Only managers can delete roles" });
    }
    
    // Check if role exists
    const roleCheck = await pool.request()
      .input("id", sql.Int, roleId)
      .query("SELECT id, role, jobId FROM RecruitmentRoles WHERE id = @id");
    
    if (roleCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }
    
    const role = roleCheck.recordset[0];
    
    // Begin transaction for safe deletion
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Delete applications first (if forceDelete is true)
      if (forceDelete) {
        await transaction.request()
          .input("roleId", sql.Int, roleId)
          .query("DELETE FROM Applications WHERE roleId = @roleId");
      }
      
      // Delete the role
      await transaction.request()
        .input("id", sql.Int, roleId)
        .query("DELETE FROM RecruitmentRoles WHERE id = @id");
      
      await transaction.commit();
      
      res.status(200).json({ 
        message: forceDelete ? 
          "Role and all associated applications deleted successfully" : 
          "Role deleted successfully",
        deletedRole: {
          id: role.id,
          jobId: role.jobId,
          role: role.role
        }
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error("Error deleting recruitment role:", error);
    res.status(500).json({ message: "Server error while deleting role", error: error.message });
  }
};


// Replace the downloadRecruiterPerformanceReport function in recruitmentController.js

exports.downloadRecruiterPerformanceReport = async (req, res) => {
  try {
    console.log('=== DOWNLOAD RECRUITER NIGHT SHIFT PERFORMANCE REPORT START ===');
    console.log('User:', req.user.username, 'Role:', req.user.role);
    
    const pool = await poolPromise;
    const { period } = req.query;
    
    console.log('Period:', period);
    
    // Validate period
    if (!['weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ message: "Invalid period. Use 'weekly' or 'monthly'" });
    }

    // Build the query to get night shift role assignments
    let performanceQuery = `
      SELECT 
        r.name as recruiterName,
        rr.id as roleId,
        rr.jobId,
        rr.role as roleName,
        rr.client,
        -- Convert to IST and format the date
        CONVERT(VARCHAR, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt)), 120) as assignedDateIST,
        DATEPART(YEAR, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt))) as assignedYear,
        DATEPART(MONTH, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt))) as assignedMonth,
        DATEPART(WEEK, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt))) as assignedWeek,
        DATEPART(DAY, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt))) as assignedDay,
        -- Get hour in IST for verification
        DATEPART(HOUR, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt))) as assignedHourIST,
        (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id) as applicationCount
      FROM RoleRecruiterAssignments rra
      JOIN Recruiters r ON rra.recruiterId = r.id
      JOIN RecruitmentRoles rr ON rra.roleId = rr.id
      WHERE rra.isActive = 1 
      AND r.isActive = 1 
      AND (r.role = 'user' OR r.role = 'teamlead')
      -- Filter for night shift: 6:30 PM to 6:00 AM IST
      AND (
        DATEPART(HOUR, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt))) >= 18 
        OR DATEPART(HOUR, DATEADD(HOUR, 5, DATEADD(MINUTE, 30, rra.assignedAt))) < 6
      )
    `;

    // Add date filtering based on period
    if (period === 'weekly') {
      performanceQuery += ` AND rra.assignedAt >= DATEADD(DAY, -7, GETDATE())`;
    } else if (period === 'monthly') {
      performanceQuery += ` AND rra.assignedAt >= DATEADD(MONTH, -1, GETDATE())`;
    }

    performanceQuery += `
      ORDER BY r.name, rra.assignedAt DESC
    `;

    console.log('Performance Query:', performanceQuery);

    // Execute the performance query
    const performanceResult = await pool.request().query(performanceQuery);
    console.log('Found', performanceResult.recordset.length, 'night shift role assignments');

    // Group data by recruiter
    const recruiterData = {};
    performanceResult.recordset.forEach(record => {
      if (!recruiterData[record.recruiterName]) {
        recruiterData[record.recruiterName] = [];
      }
      recruiterData[record.recruiterName].push(record);
    });

    // Generate CSV data
    const csvData = [];
    
    // Headers
    const headers = [
      'Recruiter Name',
      'Assignment Date (IST)',
      'Job ID',
      'Role Name',
      'Client',
      'Applications Submitted',
      'Assignment Hour (IST)'
    ];
    csvData.push(headers);

    // Data rows - one row per role assignment
    Object.keys(recruiterData).sort().forEach(recruiterName => {
      const assignments = recruiterData[recruiterName];
      
      assignments.forEach(assignment => {
        const row = [
          recruiterName,
          assignment.assignedDateIST ? new Date(assignment.assignedDateIST).toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'N/A',
          assignment.jobId || 'N/A',
          assignment.roleName || 'N/A',
          assignment.client || 'N/A',
          assignment.applicationCount || 0,
          `${assignment.assignedHourIST}:00` // Show hour for verification
        ];
        csvData.push(row);
      });
      
      // Add summary row for each recruiter
      const totalRoles = assignments.length;
      const totalApplications = assignments.reduce((sum, a) => sum + (a.applicationCount || 0), 0);
      
      csvData.push([
        `${recruiterName} - TOTAL`,
        `${totalRoles} roles assigned`,
        '',
        '',
        '',
        totalApplications,
        ''
      ]);
      
      // Add empty row for spacing
      csvData.push([]);
    });

    // Add grand total at the end
    const totalAssignments = performanceResult.recordset.length;
    const grandTotalApplications = performanceResult.recordset.reduce(
      (sum, r) => sum + (r.applicationCount || 0), 0
    );
    
    csvData.push([
      'GRAND TOTAL',
      `${totalAssignments} night shift role assignments`,
      '',
      '',
      '',
      grandTotalApplications,
      ''
    ]);

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Set response headers for CSV download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `recruiter_night_shift_${period}_${timestamp}.csv`;

    console.log('Sending CSV file:', filename);
    console.log('CSV size:', csvContent.length, 'characters');
    console.log('Total night shift assignments:', totalAssignments);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(csvContent);
    
    console.log('=== DOWNLOAD RECRUITER NIGHT SHIFT PERFORMANCE REPORT COMPLETE ===');

  } catch (error) {
    console.error("=== ERROR GENERATING RECRUITER NIGHT SHIFT PERFORMANCE REPORT ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({ 
      message: "Server error while generating recruiter night shift performance report", 
      error: error.message 
    });
  }
};


// Replace your existing assignMultipleRecruiters function with this one:
exports.assignMultipleRecruiters = async (req, res) => {
  console.log('=== assignMultipleRecruiters FUNCTION CALLED ===');
  console.log('Request params:', { roleId: req.params.id, recruiterIds: req.body.recruiterIds });
  console.log('User info:', { username: req.user.username, role: req.user.role, userId: req.user.userId });
  
  const roleId = req.params.id;
  const { recruiterIds } = req.body;

  try {
    const pool = await poolPromise;

    // Validate input
    if (!Array.isArray(recruiterIds) || recruiterIds.length === 0) {
      return res.status(400).json({ message: "Please provide at least one recruiter ID" });
    }

    // Check user role authorization
    if (req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'teamlead') {
      return res.status(403).json({ message: "Only managers, admins and team leads can assign recruiters" });
    }

    // Get role details
    const roleCheck = await pool.request()
      .input("roleId", sql.Int, roleId)
      .input("username", sql.NVarChar, req.user.username)
      .query(`
        SELECT 
          r.id, 
          r.assignTo, 
          r.recruiterLead, 
          r.recruiter, 
          r.createdBy,
          r.role as roleName,
          r.client,
          r.jobId,
          r.systemId,
          r.experience,
          r.location,
          r.currency,
          r.minRate,
          r.maxRate,
          r.urgency,
          rec.name as recruiterName,
          rec.id as currentUserRecruiterId
        FROM RecruitmentRoles r
        LEFT JOIN Recruiters rec ON rec.userId = (SELECT id FROM userinfo WHERE username = @username) AND rec.isActive = 1
        WHERE r.id = @roleId
      `);

    if (roleCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    const role = roleCheck.recordset[0];

    // Validate recruiters exist and get their email addresses
    const recruiterCheckQuery = `
      SELECT id, name, email, role FROM Recruiters 
      WHERE id IN (${recruiterIds.map((_, index) => `@recruiterId${index}`).join(',')})
      AND isActive = 1
    `;
    
    const recruiterCheckRequest = pool.request();
    recruiterIds.forEach((id, index) => {
      recruiterCheckRequest.input(`recruiterId${index}`, sql.Int, id);
    });

    const recruiterResult = await recruiterCheckRequest.query(recruiterCheckQuery);

    if (recruiterResult.recordset.length !== recruiterIds.length) {
      return res.status(404).json({ message: "One or more recruiters not found or inactive" });
    }

    // Get existing assignments to preserve original assignment times
    const existingAssignments = await pool.request()
      .input("roleId", sql.Int, roleId)
      .query(`
        SELECT recruiterId, assignedBy, assignedAt
        FROM RoleRecruiterAssignments 
        WHERE roleId = @roleId AND isActive = 1
      `);

    const existingAssignmentMap = {};
    existingAssignments.recordset.forEach(assignment => {
      existingAssignmentMap[assignment.recruiterId] = {
        assignedBy: assignment.assignedBy,
        assignedAt: assignment.assignedAt
      };
    });

    // Database transaction
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();

      // Remove existing assignments
      await transaction.request()
        .input("roleId", sql.Int, roleId)
        .query("DELETE FROM RoleRecruiterAssignments WHERE roleId = @roleId");

      // Add new assignments with proper timing
      const assignmentResults = [];
      const currentTime = new Date();
      
      for (const recruiterId of recruiterIds) {
        const existingAssignment = existingAssignmentMap[recruiterId];
        const assignedBy = req.user.username;
        const assignedAt = existingAssignment ? existingAssignment.assignedAt : currentTime;

        await transaction.request()
          .input("roleId", sql.Int, roleId)
          .input("recruiterId", sql.Int, recruiterId)
          .input("assignedBy", sql.NVarChar, assignedBy)
          .input("assignedAt", sql.DateTime, assignedAt)
          .query(`
            INSERT INTO RoleRecruiterAssignments (roleId, recruiterId, assignedBy, assignedAt, isActive)
            VALUES (@roleId, @recruiterId, @assignedBy, @assignedAt, 1)
          `);

        assignmentResults.push({
          recruiterId,
          assignedBy,
          assignedAt,
          isNewAssignment: !existingAssignment
        });
      }

      // Update main role table
      const primaryRecruiter = recruiterResult.recordset[0];
      await transaction.request()
        .input("roleId", sql.Int, roleId)
        .input("primaryRecruiterId", sql.Int, primaryRecruiter.id)
        .query(`
          UPDATE RecruitmentRoles
          SET recruiter = @primaryRecruiterId,
              updatedAt = GETDATE()
          WHERE id = @roleId
        `);

      await transaction.commit();
      console.log('Transaction committed successfully');

      // Prepare response with assignment details
      const assignedRecruitersWithTime = recruiterResult.recordset.map(recruiter => {
        const assignment = assignmentResults.find(a => a.recruiterId === recruiter.id);
        return {
          id: recruiter.id,
          name: recruiter.name,
          role: recruiter.role,
          assignedBy: assignment.assignedBy,
          assignedAt: assignment.assignedAt,
          isNewAssignment: assignment.isNewAssignment
        };
      });

      // âœ… CREATE NOTIFICATIONS FOR ASSIGNED RECRUITERS
      try {
        const assignedBy = req.user.username;
        
        for (const recruiter of recruiterResult.recordset) {
          // Check if this is a new assignment
          const assignment = assignmentResults.find(a => a.recruiterId === recruiter.id);
          const isNewAssignment = assignment.isNewAssignment;
          
          // Send notification to recruiter
          await exports.createNotification(
            recruiter.name,
            isNewAssignment 
              ? `New role "${role.roleName}" assigned to you by ${assignedBy}`
              : `Role "${role.roleName}" assignment updated by ${assignedBy}`,
            'role_assigned',
            {
              roleId: parseInt(roleId),
              roleName: role.roleName,
              client: role.client,
              jobId: role.jobId,
              systemId: role.systemId,
              experience: role.experience,
              location: role.location,
              currency: role.currency,
              minRate: role.minRate,
              maxRate: role.maxRate,
              urgency: role.urgency,
              assignedBy: assignedBy,
              assignedAt: assignment.assignedAt.toISOString(),
              isNewAssignment: isNewAssignment
            },
            assignedBy
          );
          
          console.log(`âœ… Notification sent to recruiter: ${recruiter.name} (${isNewAssignment ? 'new' : 'updated'})`);
        }
        
        console.log(`âœ… Sent ${recruiterResult.recordset.length} role assignment notifications`);
      } catch (notificationError) {
        console.error('âŒ Error creating assignment notifications:', notificationError);
        // Don't fail the assignment if notifications fail
      }

      // Send email notifications with user preference check
const assignedRecruiterNames = recruiterResult.recordset.map(r => r.name);
let emailsSent = 0;

for (const recruiter of recruiterResult.recordset) {
  if (recruiter.email) {
    try {
      // âœ… CHECK EMAIL PREFERENCE FIRST
      const shouldSendEmail = await getUserEmailPreference(recruiter.name);
      
      if (shouldSendEmail) {
        // Only send email if preference is YES
        const emailSubject = `New Role Assignment - ${role.roleName} at ${role.client}`;
        const emailMessage = `Dear ${recruiter.name},

You have been assigned to a new recruitment role:

Role Details:

- Role: ${role.roleName}
- Client: ${role.client}
- Job ID: ${role.jobId || 'N/A'}
- System ID: ${role.systemId || 'N/A'}
- Experience Required: ${role.experience || 'Not specified'}
- Location: ${role.location || 'Not specified'}
- Budget: ${role.currency || 'INR'} ${role.minRate || 0} - ${role.maxRate || 0}
- Urgency: ${role.urgency || 'Normal'}

Assignment Details:

- Assigned By: ${req.user.username}
- Assigned On: ${new Date().toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

Other Assigned Recruiters: ${assignedRecruiterNames.filter(name => name !== recruiter.name).join(', ') || 'None'}

Please log into the recruitment system to view complete role details and start sourcing candidates.

Best regards,
Prophecy Technologies Recruitment Team`;

        await sendEmailWithFallback(recruiter.email, emailSubject, emailMessage, {
          roleName: role.roleName,
          client: role.client,
          location: role.location,
          experience: role.experience,
          currency: role.currency,
          minRate: role.minRate,
          maxRate: role.maxRate
        });

        emailsSent++;
        console.log(`âœ… Email sent to ${recruiter.name} (${recruiter.email})`);
      } else {
        console.log(`â„¹ï¸ User ${recruiter.name} has email notifications OFF - skipping email`);
      }
    } catch (emailError) {
      console.error(`âŒ Error processing email for ${recruiter.name}:`, emailError.message);
    }
  }
}

// Update response to show how many emails were actually sent
res.status(200).json({
  message: "Recruiters assigned successfully and notifications sent",
  assignedRecruiters: assignedRecruitersWithTime,
  primaryRecruiter: {
    id: primaryRecruiter.id,
    name: primaryRecruiter.name
  },
  roleOwner: role.assignTo,
  assignmentTime: currentTime,
  emailsSent: emailsSent,
  notificationsSent: recruiterResult.recordset.length,
  summary: `System notifications sent to ${recruiterResult.recordset.length} recruiter(s). Emails sent to ${emailsSent} recruiter(s) based on their email preferences.`
});

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error("Error in assignMultipleRecruiters:", error);
    res.status(500).json({ 
      message: "Server error while assigning recruiters", 
      error: error.message 
    });
  }
};

// Add function to get assigned recruiters
exports.getRoleRecruiters = async (req, res) => {
  const roleId = req.params.id;
  
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input("roleId", sql.Int, roleId)
      .query(`
        SELECT r.id, r.name, r.email, rra.assignedAt, rra.assignedBy
        FROM RoleRecruiterAssignments rra
        JOIN Recruiters r ON rra.recruiterId = r.id
        WHERE rra.roleId = @roleId AND rra.isActive = 1
        ORDER BY rra.assignedAt ASC
      `);
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching role recruiters:", error);
    res.status(500).json({ message: "Server error while fetching recruiters", error });
  }
};


// Helper function to determine SQL type
function getSqlType(value) {
  if (typeof value === 'string') {
    return sql.NVarChar;
  } else if (typeof value === 'number') {
    return Number.isInteger(value) ? sql.Int : sql.Decimal;
  } else if (value instanceof Date) {
    return sql.DateTime;
  } else if (typeof value === 'boolean') {
    return sql.Bit;
  }
  return sql.NVarChar;
}


// Notification functions
exports.createNotification = async (userId, message, type, data, createdBy) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input("userId", sql.NVarChar, userId)
      .input("message", sql.NVarChar, message)
      .input("type", sql.NVarChar, type)
      .input("data", sql.NVarChar, JSON.stringify(data || {}))
      .input("createdBy", sql.NVarChar, createdBy || 'System')
      .query(`
        INSERT INTO Notifications (userId, message, type, data, createdBy)
        VALUES (@userId, @message, @type, @data, @createdBy)
      `);
    
    console.log(`âœ… Notification created for ${userId}: ${message}`);
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const pool = await poolPromise;
    const currentUsername = req.user.username;
    
    const result = await pool.request()
      .input("userId", sql.NVarChar, currentUsername)
      .query(`
        SELECT 
          id, 
          message, 
          type, 
          data,
          isRead,
          createdBy,
          createdAt,
          readAt
        FROM Notifications 
        WHERE userId = @userId 
        ORDER BY createdAt DESC
        OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
      `);
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error while fetching notifications", error });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const pool = await poolPromise;
    const notificationId = req.params.id;
    const currentUsername = req.user.username;
    
    await pool.request()
      .input("id", sql.Int, notificationId)
      .input("userId", sql.NVarChar, currentUsername)
      .query(`
        UPDATE Notifications 
        SET isRead = 1, readAt = GETDATE()
        WHERE id = @id AND userId = @userId
      `);
    
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error while updating notification", error });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const pool = await poolPromise;
    const currentUsername = req.user.username;
    
    await pool.request()
      .input("userId", sql.NVarChar, currentUsername)
      .query(`
        UPDATE Notifications 
        SET isRead = 1, readAt = GETDATE()
        WHERE userId = @userId AND isRead = 0
      `);
    
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error while updating notifications", error });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const pool = await poolPromise;
    const currentUsername = req.user.username;
    
    const result = await pool.request()
      .input("userId", sql.NVarChar, currentUsername)
      .query(`
        SELECT COUNT(*) as unreadCount
        FROM Notifications 
        WHERE userId = @userId AND isRead = 0
      `);
    
    res.status(200).json({ unreadCount: result.recordset[0].unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Server error while fetching unread count", error });
  }
};



// PUBLIC ENDPOINT - No authentication required for job portal
const getPublicRoles = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT
        rr.id, 
        rr.jobId, 
        rr.gbamsId, 
        rr.systemId, 
        rr.role, 
        rr.roleType,
        rr.city,
        rr.state,
        rr.country,
        rr.currency,
        rr.minRate, 
        rr.maxRate, 
        rr.client, 
        rr.clientPOC, 
        rr.roleLocation,
        rr.roleCategory,
        rr.experience, 
        rr.urgency, 
        rr.status, 
        rr.jobDescription, 
        rr.jobDescription as description,
        rr.visaTypes,
        rr.createdAt as postedDate,
        (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id) AS applicationCount
      FROM RecruitmentRoles rr
      WHERE rr.status = 'Active'
      ORDER BY rr.createdAt DESC
    `;

    const result = await pool.request().query(query);
    
    console.log('getPublicRoles - Total roles fetched:', result.recordset.length);
    
    const processedResult = result.recordset.map(role => {
      // Build location string from city, state, country
      let location = '';
      const locationParts = [];
      
      if (role.city) {
        // Handle comma-separated multiple cities
        const cities = role.city.split(',').map(c => c.trim()).filter(c => c);
        if (cities.length > 0) {
          locationParts.push(cities.join(', '));
        }
      }
      
      if (role.state) {
        // Handle comma-separated multiple states
        const states = role.state.split(',').map(s => s.trim()).filter(s => s);
        if (states.length > 0) {
          locationParts.push(states.join(', '));
        }
      }
      
      if (role.country) {
        locationParts.push(role.country);
      }
      
      location = locationParts.join(', ');
      
      return {
        ...role,
        location: location || 'Not specified',
        description: role.description || role.jobDescription || '',
        roleLocation: role.roleLocation || 'Onsite' // Ensure work mode has default
      };
    });

    res.status(200).json(processedResult);
  } catch (error) {
    console.error("Error fetching public recruitment roles:", error);
    res.status(500).json({ 
      message: "Server error while fetching roles", 
      error: error.message 
    });
  }
};

const getPublicRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const query = `
      SELECT
        rr.id, 
        rr.jobId, 
        rr.gbamsId, 
        rr.systemId, 
        rr.role, 
        rr.roleType,
        rr.city,
        rr.state,
        rr.country,
        rr.currency,
        rr.minRate, 
        rr.maxRate, 
        rr.client, 
        rr.clientPOC, 
        rr.roleLocation,
        rr.roleCategory,
        rr.experience, 
        rr.urgency, 
        rr.status, 
        rr.jobDescription, 
        rr.jobDescription as description,
        rr.visaTypes,
        rr.createdAt as postedDate,
        (SELECT COUNT(*) FROM Applications WHERE roleId = rr.id) AS applicationCount
      FROM RecruitmentRoles rr
      WHERE rr.id = @id AND rr.status = 'Active'
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Job not found or no longer active" });
    }
    
    const role = result.recordset[0];
    
    // Build location string from city, state, country
    let location = '';
    const locationParts = [];
    
    if (role.city) {
      const cities = role.city.split(',').map(c => c.trim()).filter(c => c);
      if (cities.length > 0) {
        locationParts.push(cities.join(', '));
      }
    }
    
    if (role.state) {
      const states = role.state.split(',').map(s => s.trim()).filter(s => s);
      if (states.length > 0) {
        locationParts.push(states.join(', '));
      }
    }
    
    if (role.country) {
      locationParts.push(role.country);
    }
    
    if (locationParts.length > 0) {
      location = locationParts.join(', ');
    }
    
    role.location = location;

    res.status(200).json(role);
  } catch (error) {
    console.error("Error fetching public recruitment role by id:", error);
    res.status(500).json({ 
      message: "Server error while fetching role details", 
      error: error.message 
    });
  }
};

exports.getPublicRoles = getPublicRoles;
exports.getPublicRoleById = getPublicRoleById;



// Add this to your recruitmentController.js file

// NEW FUNCTION: Handle status change notifications
exports.notifyStatusChange = async (req, res) => {
  try {
    const { roleId, oldStatus, newStatus, roleName, jobId, client, notifiedBy } = req.body;

    console.log('=== STATUS CHANGE NOTIFICATION ===');
    console.log('Role ID:', roleId);
    console.log('Status Change:', `${oldStatus} â†’ ${newStatus}`);
    console.log('Role Name:', roleName);
    console.log('Job ID:', jobId);
    console.log('Notified By:', notifiedBy);

    // Only send notifications if status actually changed
    if (oldStatus === newStatus) {
      return res.status(200).json({ 
        message: 'Status unchanged, no notification sent',
        notificationsSent: 0
      });
    }

    const pool = await poolPromise;

    // Get the role details to find all relevant users
    const roleDetails = await pool.request()
      .input('roleId', sql.Int, roleId)
      .query(`
        SELECT 
          rr.id,
          rr.assignTo,
          rr.createdBy,
          rr.role,
          rr.client,
          rr.jobId,
          rr.systemId
        FROM RecruitmentRoles rr
        WHERE rr.id = @roleId
      `);

    if (roleDetails.recordset.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const role = roleDetails.recordset[0];

    // Get all assigned recruiters for this role
    const assignedRecruitersResult = await pool.request()
      .input('roleId', sql.Int, roleId)
      .query(`
        SELECT DISTINCT rec.name, rec.id
        FROM RoleRecruiterAssignments rra
        JOIN Recruiters rec ON rra.recruiterId = rec.id
        WHERE rra.roleId = @roleId AND rra.isActive = 1
      `);

    // Get all managers and admins
    const managersResult = await pool.request()
      .query(`
        SELECT username FROM userinfo 
        WHERE role IN ('manager', 'admin')
      `);

    // Collect all users who should be notified
    const notificationRecipients = new Set();

    // Add role owner (assignTo)
    if (role.assignTo) {
      notificationRecipients.add(role.assignTo);
    }

    // Add role creator
    if (role.createdBy) {
      notificationRecipients.add(role.createdBy);
    }

    // Add all assigned recruiters
    assignedRecruitersResult.recordset.forEach(recruiter => {
      notificationRecipients.add(recruiter.name);
    });

    // Add all managers and admins
    managersResult.recordset.forEach(manager => {
      notificationRecipients.add(manager.username);
    });

    // Remove the user who made the change from notifications
    notificationRecipients.delete(notifiedBy);

    console.log('Recipients for notification:', Array.from(notificationRecipients));

    // Determine notification message based on status change
    let message = '';
    let notificationType = 'status_changed';

    switch (newStatus.toLowerCase()) {
      case 'cancelled':
        message = `Role "${roleName}" (Job ID: ${jobId}) has been CANCELLED by ${notifiedBy}`;
        notificationType = 'role_cancelled';
        break;
      case 'on hold':
        message = `Role "${roleName}" (Job ID: ${jobId}) has been put ON HOLD by ${notifiedBy}`;
        notificationType = 'role_on_hold';
        break;
      case 'inactive':
        message = `Role "${roleName}" (Job ID: ${jobId}) has been marked INACTIVE by ${notifiedBy}`;
        notificationType = 'role_inactive';
        break;
      case 'closed':
        message = `Role "${roleName}" (Job ID: ${jobId}) has been CLOSED by ${notifiedBy}`;
        notificationType = 'role_closed';
        break;
      case 'active':
        message = `Role "${roleName}" (Job ID: ${jobId}) has been reactivated by ${notifiedBy}`;
        notificationType = 'role_reactivated';
        break;
      default:
        message = `Role "${roleName}" (Job ID: ${jobId}) status changed from ${oldStatus} to ${newStatus} by ${notifiedBy}`;
    }

    // Prepare notification data
    const notificationData = {
      roleId: roleId,
      roleName: roleName,
      jobId: jobId,
      systemId: role.systemId,
      client: client,
      oldStatus: oldStatus,
      newStatus: newStatus,
      changedBy: notifiedBy,
      changedAt: new Date().toISOString()
    };

    // Send notification to each recipient with email preference check
let notificationsSent = 0;
let emailsSentCount = 0;

for (const recipient of notificationRecipients) {
  try {
    // Always send system notification
    const inserted = await exports.createNotification(
      recipient,
      message,
      notificationType,
      notificationData,
      notifiedBy
    );

    if (inserted) {
      notificationsSent++;
      console.log(`âœ… System notification sent to ${recipient}`);
    }
    
    // Only send email if user wants it
    const shouldSendEmail = await getUserEmailPreference(recipient);
    
    if (shouldSendEmail) {
      const userEmail = await getUserEmail(recipient);
      if (userEmail) {
        const emailSubject = `Role Status Changed: ${roleName}`;
        const emailMessage = `Dear ${recipient},

The following role status has been changed:

Role: ${roleName}
Job ID: ${jobId}
Client: ${client}
Old Status: ${oldStatus}
New Status: ${newStatus}
Changed By: ${notifiedBy}
Changed At: ${new Date().toLocaleString()}

Please log into the system for more details.

Best regards,
Prophecy Technologies Recruitment Team`;

        await sendEmailWithFallback(userEmail, emailSubject, emailMessage, {
          roleName: roleName,
          client: client,
          jobId: jobId,
          oldStatus: oldStatus,
          newStatus: newStatus
        });
        
        emailsSentCount++;
        console.log(`âœ… Email sent to ${recipient}`);
      }
    } else {
      console.log(`â„¹ï¸ Email notifications OFF for ${recipient} - system notification only`);
    }
  } catch (error) {
    console.error(`âŒ Error with ${recipient}:`, error);
  }
}

console.log(`\n=== NOTIFICATION SUMMARY ===`);
console.log(`System notifications: ${notificationsSent}`);
console.log(`Emails sent: ${emailsSentCount}`);
console.log(`Status: ${oldStatus} â†’ ${newStatus}`);
console.log(`Job ID: ${jobId}`);
console.log(`Role: ${roleName}`);
console.log('==============================\n');

// Update response
res.status(200).json({
  message: `Notifications sent - ${notificationsSent} system notification(s), ${emailsSentCount} email(s)`,
  notificationsSent: notificationsSent,
  emailsSent: emailsSentCount,
  recipients: Array.from(notificationRecipients),
  roleDetails: {
    roleId: roleId,
    roleName: roleName,
    jobId: jobId,
    oldStatus: oldStatus,
    newStatus: newStatus
  }
});
  } catch (error) {
    console.error('âŒ Error in notifyStatusChange:', error);
    res.status(500).json({
      message: 'Error sending status change notification',
      error: error.message
    });
  }
};
