const { poolPromise, sql } = require("../../config/db");

// Test endpoint
exports.testAPI = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Resource Management API is working",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Test API error:", error);
        res.status(500).json({
            success: false,
            message: "API error",
            error: error.message
        });
    }
};

// Get all resources - UPDATED FOR NEW CATEGORIES
exports.getAllResources = async (req, res) => {
    console.log('📋 Getting all resources...');
    try {
        const pool = await poolPromise;
        const { type, status, role, company, search, page = 1, limit = 50 } = req.query;

        console.log('Query params:', { type, status, role, company, search, page, limit });

        // Check if table exists
        const tableExists = await pool.request().query(`
            SELECT COUNT(*) as tableCount 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'ResourceManagement'
        `);

        if (tableExists.recordset[0].tableCount === 0) {
            console.log('⚠️ ResourceManagement table does not exist');
            return res.status(200).json({
                success: true,
                data: [],
                pagination: {
                    page: 1,
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0
                },
                message: "Resource table not created yet. Please run initial sync."
            });
        }

        // Check if table is empty
        const recordCount = await pool.request().query(`SELECT COUNT(*) as count FROM ResourceManagement`);
        
        if (recordCount.recordset[0].count === 0) {
            console.log('⚠️ ResourceManagement table is empty');
            return res.status(200).json({
                success: true,
                data: [],
                pagination: {
                    page: 1,
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0
                },
                message: "No resources found. Run sync first."
            });
        }

        // Build query with EXACT columns from your table
        let query = `
            SELECT 
                Id,
                Name,
                ResourceType,
                PhoneNumber,
                EmailId,
                Company,
                Role,
                Status,
                SourceTable as Source,
                EmployeeId,
                CreatedAt,
                Department,
                Position
            FROM ResourceManagement 
            WHERE IsActive = 1
        `;

        const params = [];
        
        // Handle new category mapping
      // In the getAllResources function, update the type handling section:

// Handle new category mapping
if (type && type !== 'all' && type !== 'All') {
    if (type === 'InternalEmployee') {
        // Internal employees: Admin, Manager, Employee from userinfo and company tables
        query += ` AND (
            ResourceType IN ('Admin', 'Manager', 'Employee')
            OR SourceTable IN ('userinfo', 'ProphecyConsultingEmployees', 'ProphecyOffshoreEmployees', 'CognifyarEmployees')
        )`;
    } else if (type === 'ExternalEmployee') {
        // FIXED: External employees - ONLY ExternalUser from userinfo AND ResumeSubmission
        // DO NOT include Employees
        query += ` AND (
            (ResourceType = 'ExternalUser' AND SourceTable = 'userinfo')
            OR ResourceType = 'ResumeSubmission'
            OR SourceTable = 'Resume Submission'
        )`;
    } else if (type === 'Candidate') {
        query += ` AND ResourceType = 'Candidate'`;
    } else {
        query += ` AND ResourceType = @type`;
        params.push({ name: 'type', type: sql.NVarChar, value: type });
    }
}

        if (status && status !== 'All') {
            query += ` AND Status = @status`;
            params.push({ name: 'status', type: sql.NVarChar, value: status });
        }

        if (role && role !== 'All') {
            query += ` AND Role = @role`;
            params.push({ name: 'role', type: sql.NVarChar, value: role });
        }

        if (company && company !== 'All') {
            query += ` AND Company = @company`;
            params.push({ name: 'company', type: sql.NVarChar, value: company });
        }

        if (search) {
            query += ` AND (
                Name LIKE @search OR 
                EmailId LIKE @search OR 
                PhoneNumber LIKE @search OR
                EmployeeId LIKE @search OR
                Role LIKE @search
            )`;
            params.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
        const countRequest = pool.request();
        params.forEach(param => countRequest.input(param.name, param.type, param.value));
        
        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total || 0;

        // Add pagination
        const offset = (page - 1) * limit;
        query += ` ORDER BY 
            CASE WHEN ResourceType = 'Admin' THEN 1
                 WHEN ResourceType = 'Manager' THEN 2
                 WHEN ResourceType = 'Employee' THEN 3
                 WHEN ResourceType = 'ExternalUser' THEN 4
                 WHEN ResourceType = 'Candidate' THEN 5
                 ELSE 6 END,
            Name ASC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        
        params.push({ name: 'offset', type: sql.Int, value: parseInt(offset) });
        params.push({ name: 'limit', type: sql.Int, value: parseInt(limit) });

        // Execute main query
        const request = pool.request();
        params.forEach(param => request.input(param.name, param.type, param.value));
        
        const result = await request.query(query);

        console.log(`✅ Found ${result.recordset.length} resources`);

        res.status(200).json({
            success: true,
            data: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit) || 1
            }
        });
    } catch (error) {
        console.error("❌ Error fetching resources:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
            success: false, 
            message: "Server error while fetching resources", 
            error: error.message,
            details: error.code
        });
    }
};

// Get resource statistics - UPDATED FOR NEW CATEGORIES
// Replace the entire getResourceStats function in resourceController.js with this:

exports.getResourceStats = async (req, res) => {
    console.log('📊 Getting resource stats...');
    try {
        const pool = await poolPromise;

        // Check if table exists
        const tableExists = await pool.request().query(`
            SELECT COUNT(*) as tableCount 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'ResourceManagement'
        `);

        if (tableExists.recordset[0].tableCount === 0) {
            return res.status(200).json({
                success: true,
                stats: {
                    total: 0,
                    byType: [],
                    byRole: [],
                    byCompany: [],
                    byStatus: []
                }
            });
        }

        // Get total count
        const totalResult = await pool.request().query(`
            SELECT COUNT(*) as total FROM ResourceManagement WHERE IsActive = 1
        `);

        // Get breakdown by ResourceType
        const typeResult = await pool.request().query(`
            SELECT ResourceType as type, COUNT(*) as count 
            FROM ResourceManagement 
            WHERE IsActive = 1
            GROUP BY ResourceType
            ORDER BY COUNT(*) DESC
        `);

        // Calculate INTERNAL EMPLOYEES
        const internalEmployeesCount = await pool.request().query(`
            SELECT COUNT(*) as count FROM ResourceManagement 
            WHERE IsActive = 1 AND (
                ResourceType IN ('Admin', 'Manager', 'Employee', 'Candidate')
                OR SourceTable IN ('userinfo', 'ProphecyOffshoreEmployees', 'CognifyarEmployees', 'Candidates')
            )
        `);

        // Calculate EXTERNAL (External Users + Resume Submissions COMBINED)
        const externalEmployeesCount = await pool.request().query(`
            SELECT COUNT(*) as count FROM ResourceManagement 
            WHERE IsActive = 1 AND (
                (ResourceType = 'ExternalUser' AND SourceTable = 'userinfo')
                OR ResourceType = 'ResumeSubmission'
                OR SourceTable = 'Resume Submission'
            )
        `);

        // Calculate Resume Submissions separately (for info/breakdown)
        const resumeSubmissionsCount = await pool.request().query(`
            SELECT COUNT(*) as count FROM ResourceManagement 
            WHERE IsActive = 1 AND (
                ResourceType = 'ResumeSubmission'
                OR SourceTable = 'Resume Submission'
            )
        `);

        // Calculate Candidates separately
        const candidatesCount = await pool.request().query(`
            SELECT COUNT(*) as count FROM ResourceManagement 
            WHERE IsActive = 1 AND ResourceType = 'Candidate'
        `);

        // Get breakdown by Role
        const roleResult = await pool.request().query(`
            SELECT Role, COUNT(*) as count 
            FROM ResourceManagement 
            WHERE IsActive = 1 AND Role IS NOT NULL
            GROUP BY Role
            ORDER BY COUNT(*) DESC
        `);

        // Get breakdown by Company
        const companyResult = await pool.request().query(`
            SELECT Company, COUNT(*) as count 
            FROM ResourceManagement 
            WHERE IsActive = 1 AND Company IS NOT NULL
            GROUP BY Company
            ORDER BY COUNT(*) DESC
        `);

        // Get breakdown by Status
        const statusResult = await pool.request().query(`
            SELECT Status, COUNT(*) as count 
            FROM ResourceManagement 
            WHERE IsActive = 1 AND Status IS NOT NULL
            GROUP BY Status
            ORDER BY COUNT(*) DESC
        `);

        const stats = {
            total: totalResult.recordset[0].total,
            byType: typeResult.recordset,
            byRole: roleResult.recordset,
            byCompany: companyResult.recordset,
            byStatus: statusResult.recordset,
            // New categories
            InternalEmployees: internalEmployeesCount.recordset[0].count,
            ExternalEmployees: externalEmployeesCount.recordset[0].count,
            ResumeSubmissions: resumeSubmissionsCount.recordset[0].count,
            Candidates: candidatesCount.recordset[0].count,
            
            // For backward compatibility
            TotalResources: totalResult.recordset[0].total,
            InternalCount: internalEmployeesCount.recordset[0].count,
            ExternalCount: externalEmployeesCount.recordset[0].count,
            ResumeSubmissionCount: resumeSubmissionsCount.recordset[0].count,
            CandidateCount: candidatesCount.recordset[0].count
        };

        console.log('✅ Stats calculated:', {
            total: stats.total,
            internal: stats.InternalEmployees,
            external: stats.ExternalEmployees,
            candidates: stats.Candidates,
            resumeSubmissions: stats.ResumeSubmissions
        });

        res.status(200).json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error("❌ Error fetching resource stats:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error while fetching stats", 
            error: error.message 
        });
    }
};

// Get sync status - FIXED VERSION (no SyncStatus column)
exports.getSyncStatus = async (req, res) => {
    console.log('🔄 Getting sync status...');
    try {
        const pool = await poolPromise;

        // Check if table exists
        const tableExists = await pool.request().query(`
            SELECT COUNT(*) as tableCount 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'ResourceManagement'
        `);

        if (tableExists.recordset[0].tableCount === 0) {
            return res.status(200).json({
                success: true,
                exists: false,
                count: 0,
                lastUpdated: null
            });
        }

        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as count,
                MAX(UpdatedAt) as lastUpdated
            FROM ResourceManagement
            WHERE IsActive = 1
        `);

        res.status(200).json({
            success: true,
            exists: true,
            count: result.recordset[0].count,
            lastUpdated: result.recordset[0].lastUpdated
        });
    } catch (error) {
        console.error("❌ Error getting sync status:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Manual sync - COMPLETE VERSION with all categories

exports.manualSync = async (req, res) => {
    console.log('🔄 Starting manual sync...');
    try {
        const pool = await poolPromise;

        // Clear existing data first
        await pool.request().query(`DELETE FROM ResourceManagement`);
        console.log('✔ Cleared existing data');

        let totalImported = 0;
        let internalCount = 0;
        let externalCount = 0;
        let candidateCount = 0;

        // IMPORT INTERNAL EMPLOYEES
        console.log('👥 Importing Internal Employees...');
        
        // 1. Import from userinfo (Admin, Manager, Employee - EXCLUDE ExternalUser)
        let userResult;
        try {
            const recruitersCheck = await pool.request().query(`
                SELECT COUNT(*) as tableCount 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Recruiters'
            `);

            if (recruitersCheck.recordset[0].tableCount > 0) {
                userResult = await pool.request().query(`
                    INSERT INTO ResourceManagement (
                        Name, ResourceType, PhoneNumber, EmailId, Company, Role, Status, 
                        SourceTable, SourceId, EmployeeId, CreatedAt, UpdatedAt, IsActive
                    )
                    SELECT 
                        u.username as Name,
                        CASE 
                            WHEN LOWER(u.role) = 'admin' THEN 'Admin'
                            WHEN LOWER(u.role) IN ('manager', 'teamlead') THEN 'Manager'
                            WHEN LOWER(u.role) = 'employee' THEN 'Employee'
                            ELSE 'Employee'
                        END as ResourceType,
                        COALESCE(r.phone, NULL) as PhoneNumber,
                        COALESCE(r.email, NULL) as EmailId,
                        'Prophecy ERP' as Company,
                        u.role as Role,
                        'Active' as Status,
                        'userinfo' as SourceTable,
                        u.id as SourceId,
                        u.EmployeeId,
                        GETDATE() as CreatedAt,
                        GETDATE() as UpdatedAt,
                        1 as IsActive
                    FROM userinfo u
                    LEFT JOIN Recruiters r ON LOWER(u.username) = LOWER(r.name)
                    WHERE LOWER(u.role) IN ('admin', 'manager', 'teamlead', 'employee')
                `);
            } else {
                userResult = await pool.request().query(`
                    INSERT INTO ResourceManagement (
                        Name, ResourceType, PhoneNumber, EmailId, Company, Role, Status, 
                        SourceTable, SourceId, EmployeeId, CreatedAt, UpdatedAt, IsActive
                    )
                    SELECT 
                        username as Name,
                        CASE 
                            WHEN LOWER(role) = 'admin' THEN 'Admin'
                            WHEN LOWER(role) IN ('manager', 'teamlead') THEN 'Manager'
                            WHEN LOWER(role) = 'employee' THEN 'Employee'
                            ELSE 'Employee'
                        END as ResourceType,
                        NULL as PhoneNumber,
                        NULL as EmailId,
                        'Prophecy ERP' as Company,
                        role as Role,
                        'Active' as Status,
                        'userinfo' as SourceTable,
                        id as SourceId,
                        EmployeeId,
                        GETDATE() as CreatedAt,
                        GETDATE() as UpdatedAt,
                        1 as IsActive
                    FROM userinfo
                    WHERE LOWER(role) IN ('admin', 'manager', 'teamlead', 'employee')
                `);
            }
            internalCount += userResult.rowsAffected[0];
            totalImported += userResult.rowsAffected[0];
            console.log(`✔ Imported ${userResult.rowsAffected[0]} internal users from userinfo`);
        } catch (error) {
            console.error("✘ Error importing from userinfo:", error.message);
            userResult = { rowsAffected: [0] };
        }

        // 2. Import from company tables (ProphecyOffshoreEmployees, CognifyarEmployees)
        const companies = [
            { table: 'ProphecyOffshoreEmployees', name: 'Prophecy Offshore' },
            { table: 'CognifyarEmployees', name: 'Cognifyar' }
        ];

        for (const company of companies) {
            try {
                const query = `
                    INSERT INTO ResourceManagement (
                        Name, ResourceType, PhoneNumber, EmailId, Company, Role, Status, 
                        SourceTable, SourceId, EmployeeId, Department, CreatedAt, UpdatedAt, IsActive
                    )
                    SELECT 
                        Name,
                        'Employee' as ResourceType,
                        Phone as PhoneNumber,
                        Email as EmailId,
                        '${company.name}' as Company,
                        Position as Role,
                        COALESCE(Status, 'Active') as Status,
                        '${company.table}' as SourceTable,
                        Id as SourceId,
                        EmployeeId,
                        Department,
                        GETDATE() as CreatedAt,
                        GETDATE() as UpdatedAt,
                        1 as IsActive
                    FROM ${company.table}
                `;
                
                const result = await pool.request().query(query);
                internalCount += result.rowsAffected[0];
                totalImported += result.rowsAffected[0];
                console.log(`✔ Imported ${result.rowsAffected[0]} from ${company.table}`);
            } catch (error) {
                console.error(`✘ Error importing from ${company.table}:`, error.message);
            }
        }

        // 3. Import from Candidates table
        console.log('👥 Importing Candidates to Internal...');
        try {
            const candidatesCheck = await pool.request().query(`
                SELECT COUNT(*) as tableCount 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Candidates'
            `);

            if (candidatesCheck.recordset[0].tableCount > 0) {
                const candidatesResult = await pool.request().query(`
                    INSERT INTO ResourceManagement (
                        Name, ResourceType, PhoneNumber, EmailId, Company, Role, Status, 
                        SourceTable, SourceId, CreatedAt, UpdatedAt, IsActive
                    )
                    SELECT 
                        Name,
                        'Candidate' as ResourceType,
                        Phone as PhoneNumber,
                        Email as EmailId,
                        'Internal' as Company,
                        'Candidate' as Role,
                        COALESCE(Status, 'Available') as Status,
                        'Candidates' as SourceTable,
                        id as SourceId,
                        GETDATE() as CreatedAt,
                        GETDATE() as UpdatedAt,
                        1 as IsActive
                    FROM Candidates
                `);
                candidateCount += candidatesResult.rowsAffected[0];
                internalCount += candidatesResult.rowsAffected[0];
                totalImported += candidatesResult.rowsAffected[0];
                console.log(`✔ Imported ${candidatesResult.rowsAffected[0]} from Candidates`);
            }
        } catch (error) {
            console.error('✘ Error importing from Candidates:', error.message);
        }

        // IMPORT EXTERNAL EMPLOYEES
        console.log('👥 Importing External Employees...');
        
        // 4. Import external users from userinfo (ExternalUser role ONLY)
        let externalUsersResult;
        try {
            const recruitersCheck = await pool.request().query(`
                SELECT COUNT(*) as tableCount 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Recruiters'
            `);

            if (recruitersCheck.recordset[0].tableCount > 0) {
                externalUsersResult = await pool.request().query(`
                    INSERT INTO ResourceManagement (
                        Name, ResourceType, PhoneNumber, EmailId, Company, Role, Status, 
                        SourceTable, SourceId, EmployeeId, CreatedAt, UpdatedAt, IsActive
                    )
                    SELECT 
                        u.username as Name,
                        'ExternalUser' as ResourceType,
                        COALESCE(r.phone, NULL) as PhoneNumber,
                        COALESCE(r.email, NULL) as EmailId,
                        'Prophecy ERP' as Company,
                        u.role as Role,
                        'Active' as Status,
                        'userinfo' as SourceTable,
                        u.id as SourceId,
                        u.EmployeeId,
                        GETDATE() as CreatedAt,
                        GETDATE() as UpdatedAt,
                        1 as IsActive
                    FROM userinfo u
                    LEFT JOIN Recruiters r ON LOWER(u.username) = LOWER(r.name)
                    WHERE LOWER(u.role) = 'external user'
                `);
            } else {
                externalUsersResult = await pool.request().query(`
                    INSERT INTO ResourceManagement (
                        Name, ResourceType, PhoneNumber, EmailId, Company, Role, Status, 
                        SourceTable, SourceId, EmployeeId, CreatedAt, UpdatedAt, IsActive
                    )
                    SELECT 
                        username as Name,
                        'ExternalUser' as ResourceType,
                        NULL as PhoneNumber,
                        NULL as EmailId,
                        'Prophecy ERP' as Company,
                        role as Role,
                        'Active' as Status,
                        'userinfo' as SourceTable,
                        id as SourceId,
                        EmployeeId,
                        GETDATE() as CreatedAt,
                        GETDATE() as UpdatedAt,
                        1 as IsActive
                    FROM userinfo
                    WHERE LOWER(role) = 'external user'
                `);
            }
            externalCount += externalUsersResult.rowsAffected[0];
            totalImported += externalUsersResult.rowsAffected[0];
            console.log(`✔ Imported ${externalUsersResult.rowsAffected[0]} external users from userinfo`);
        } catch (error) {
            console.error("✘ Error importing external users:", error.message);
            externalUsersResult = { rowsAffected: [0] };
        }

        // 5. Import from Resume Submission
        let resumeCount = 0;
        try {
            const resumeCheck = await pool.request().query(`
                SELECT COUNT(*) as tableCount 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Resume Submission'
            `);

            if (resumeCheck.recordset[0].tableCount > 0) {
                const resumeResult = await pool.request().query(`
                    INSERT INTO ResourceManagement (
                        Name, ResourceType, PhoneNumber, EmailId, Company, Role, Status, 
                        SourceTable, SourceId, CreatedAt, UpdatedAt, IsActive
                    )
                    SELECT 
                        CONCAT(ISNULL(FirstName, ''), ' ', ISNULL(LastName, '')) as Name,
                        'ResumeSubmission' as ResourceType,
                        COALESCE(PhoneNumber1, NULL) as PhoneNumber,
                        COALESCE(EmailID, NULL) as EmailId,
                        'External' as Company,
                        COALESCE(JobRoleApplied, 'Resume Submission') as Role,
                        COALESCE(Status, 'Available') as Status,
                        'Resume Submission' as SourceTable,
                        Resume_ID as SourceId,
                        GETDATE() as CreatedAt,
                        GETDATE() as UpdatedAt,
                        1 as IsActive
                    FROM [Resume Submission]
                `);
                resumeCount += resumeResult.rowsAffected[0];
                totalImported += resumeResult.rowsAffected[0];
                console.log(`✔ Imported ${resumeResult.rowsAffected[0]} from Resume Submission`);
            }
        } catch (error) {
            console.error('✘ Error importing from Resume Submission:', error.message);
        }

        console.log(`🎉 Total resources imported: ${totalImported}`);
        console.log('📊 Breakdown:');
        console.log(`   - Internal Employees: ${internalCount}`);
        console.log(`   - External Employees: ${externalCount}`);
        console.log(`   - Resume Submissions: ${resumeCount}`);

        res.status(200).json({
            success: true,
            message: `Sync completed successfully. Imported ${totalImported} resources.`,
            totalImported: totalImported,
            breakdown: {
                internalEmployees: internalCount,
                externalEmployees: externalCount,
                resumeSubmissions: resumeCount,
                candidates: candidateCount
            }
        });
    } catch (error) {
        console.error("✘ Manual sync error:", error);
        res.status(500).json({
            success: false,
            message: "Sync error",
            error: error.message,
            suggestion: "Make sure all source tables exist and have the correct columns"
        });
    }
};
// Get resource by ID
exports.getResourceById = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { id } = req.params;

        const result = await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query(`
                SELECT * 
                FROM ResourceManagement 
                WHERE Id = @id AND IsActive = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Resource not found" 
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error("Error fetching resource:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Test endpoint to check database connection
exports.testDB = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Test connection
        const testResult = await pool.request().query('SELECT 1 as test');
        
        // Check all source tables
        const tables = [
            'userinfo',
            'ProphecyConsultingEmployees',
            'ProphecyOffshoreEmployees',
            'CognifyarEmployees',
            'Candidates',
            'ResumeSubmissions',
            'ResourceManagement'
        ];

        const tableStatus = [];
        
        for (const table of tables) {
            try {
                const check = await pool.request().query(`
                    SELECT COUNT(*) as count 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_NAME = '${table}'
                `);
                tableStatus.push({
                    table: table,
                    exists: check.recordset[0].count > 0
                });
            } catch (error) {
                tableStatus.push({
                    table: table,
                    exists: false,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Database connection successful",
            database: "Connected",
            tableStatus: tableStatus
        });
    } catch (error) {
        console.error("Database test error:", error);
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
};

// Update resource status
exports.updateResourceStatus = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE ResourceManagement 
                SET Status = @status, UpdatedAt = GETDATE()
                WHERE Id = @id
            `);

        res.status(200).json({
            success: true,
            message: "Resource status updated successfully"
        });
    } catch (error) {
        console.error("Error updating resource:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};



// Debug endpoint to check source tables
exports.debugTables = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const tables = [
            'userinfo',
            'ProphecyConsultingEmployees',
            'ProphecyOffshoreEmployees',
            'CognifyarEmployees',
            'Candidates',
            'ResumeSubmissions',
            'ResourceManagement'
        ];

        const tableDetails = [];
        
        for (const table of tables) {
            try {
                // Check if table exists
                const existsQuery = await pool.request().query(`
                    SELECT COUNT(*) as tableCount 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_NAME = '${table}'
                `);
                
                const exists = existsQuery.recordset[0].tableCount > 0;
                
                if (exists) {
                    // Get column names
                    const columnsQuery = await pool.request().query(`
                        SELECT COLUMN_NAME, DATA_TYPE 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = '${table}'
                        ORDER BY ORDINAL_POSITION
                    `);
                    
                    tableDetails.push({
                        table: table,
                        exists: true,
                        columns: columnsQuery.recordset.map(c => ({ 
                            name: c.COLUMN_NAME, 
                            type: c.DATA_TYPE 
                        }))
                    });
                } else {
                    tableDetails.push({
                        table: table,
                        exists: false,
                        columns: []
                    });
                }
            } catch (error) {
                tableDetails.push({
                    table: table,
                    exists: false,
                    error: error.message,
                    columns: []
                });
            }
        }

        res.status(200).json({
            success: true,
            tables: tableDetails
        });
    } catch (error) {
        console.error("Debug tables error:", error);
        res.status(500).json({
            success: false,
            message: "Debug error",
            error: error.message
        });
    }
};

// Get filter options
exports.getFilterOptions = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Check if table exists
        const tableExists = await pool.request().query(`
            SELECT COUNT(*) as tableCount 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'ResourceManagement'
        `);

        if (tableExists.recordset[0].tableCount === 0) {
            return res.status(200).json({
                success: true,
                types: [],
                roles: [],
                companies: [],
                statuses: []
            });
        }

        const typesResult = await pool.request().query(`
            SELECT DISTINCT ResourceType as value 
            FROM ResourceManagement 
            WHERE IsActive = 1 AND ResourceType IS NOT NULL
            ORDER BY ResourceType
        `);

        const rolesResult = await pool.request().query(`
            SELECT DISTINCT Role as value 
            FROM ResourceManagement 
            WHERE IsActive = 1 AND Role IS NOT NULL
            ORDER BY Role
        `);

        const companiesResult = await pool.request().query(`
            SELECT DISTINCT Company as value 
            FROM ResourceManagement 
            WHERE IsActive = 1 AND Company IS NOT NULL
            ORDER BY Company
        `);

        const statusesResult = await pool.request().query(`
            SELECT DISTINCT Status as value 
            FROM ResourceManagement 
            WHERE IsActive = 1 AND Status IS NOT NULL
            ORDER BY Status
        `);

        res.status(200).json({
            success: true,
            types: typesResult.recordset.map(r => r.value),
            roles: rolesResult.recordset.map(r => r.value),
            companies: companiesResult.recordset.map(r => r.value),
            statuses: statusesResult.recordset.map(r => r.value)
        });
    } catch (error) {
        console.error("Error fetching filter options:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};