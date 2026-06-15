const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function testUserAndRoles() {
    try {
        let pool = await sql.connect(config);
        
        console.log("Fetching user...");
        const userResult = await pool.request().query(`
            SELECT id, username, role FROM userinfo WHERE id = 10
        `);
        console.log(userResult.recordset);

        const username = userResult.recordset[0].username;
        const role = userResult.recordset[0].role;
        console.log("Username:", username, "Role:", role);

        let whereConditions = ['1=1'];
        let params = {};

        if (role === 'user') {
            whereConditions.push(`(
              EXISTS (
                SELECT 1 FROM RoleRecruiterAssignments rra 
                JOIN Recruiters rec ON rra.recruiterId = rec.id
                WHERE rra.roleId = rr.id 
                AND rec.userId = (SELECT id FROM userinfo WHERE username = @username) 
                AND rra.isActive = 1
              )
              OR rr.assignTo = @username 
              OR rr.assignTo IS NULL
            )`);
            params.username = username;
        } else if (role === 'teamlead') {
            whereConditions.push(`(
              rr.createdBy = @username
              OR rr.assignTo = @username
              OR EXISTS (
                SELECT 1 FROM RoleRecruiterAssignments rra 
                JOIN Recruiters rec ON rra.recruiterId = rec.id
                WHERE rra.roleId = rr.id 
                AND rec.userId = (SELECT id FROM userinfo WHERE username = @username) 
                AND rra.isActive = 1
              )
              OR rr.assignTo IS NULL
            )`);
            params.username = username;
        }

        const whereClause = whereConditions.join(' AND ');
        const appWhereClause = whereClause.replace(/rr\./g, 'roles.');

        const statsQuery = `
          SELECT 
            COUNT(DISTINCT rr.id) as totalCount
          FROM RecruitmentRoles rr
          WHERE ${whereClause}
        `;
        
        console.log("Running Stats Query...");
        const statsRequest = pool.request();
        Object.keys(params).forEach(key => statsRequest.input(key, params[key]));
        
        const statsResult = await statsRequest.query(statsQuery);
        console.log("Total roles:", statsResult.recordset[0].totalCount);

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
                  ',"name":"', REPLACE(REPLACE(rec.name, '"', '\\"'), CHAR(13)+CHAR(10), ' '), 
                  '","role":"', ISNULL(REPLACE(rec.role, '"', '\\"'), ''), 
                  '","assignedBy":"', ISNULL(REPLACE(rra.assignedBy, '"', '\\"'), ''), 
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

        console.log("Running Data Query...");
        const dataRequest = pool.request();
        Object.keys(params).forEach(key => dataRequest.input(key, params[key]));
        
        const result = await dataRequest.query(query);
        console.log("Roles fetched:", result.recordset.length);

        // Try parsing JSON for each role to see if it throws!
        result.recordset.forEach(role => {
            if (role.assignedRecruiters) {
                try {
                    JSON.parse(`[${role.assignedRecruiters}]`.replace(/}{/g, '},{'));
                } catch (e) {
                    console.error("JSON PARSE ERROR on role ID:", role.id);
                    console.error("Raw string:", role.assignedRecruiters);
                }
            }
        });

        await pool.close();
    } catch (err) {
        console.error("Failed:", err.message);
    }
}

testUserAndRoles();
