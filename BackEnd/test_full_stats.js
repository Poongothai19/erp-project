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

async function testStatsQuery() {
    try {
        let pool = await sql.connect(config);
        const username = 'abinesh@prophecytechs.com';
        let whereConditions = ['1=1'];
        let params = { username: username };

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

        const whereClause = whereConditions.join(' AND ');
        const appWhereClause = whereClause.replace(/rr\./g, 'roles.');

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
        
        console.log("Running Full Stats Query...");
        const statsRequest = pool.request();
        Object.keys(params).forEach(key => statsRequest.input(key, params[key]));
        
        try {
            const statsResult = await statsRequest.query(statsQuery);
            console.log("Total roles:", statsResult.recordset[0]);
        } catch (e) {
            console.error("Stats Query failed:", e);
        }

        await pool.close();
    } catch (err) {
        console.error("Overall Failed:", err.message);
    }
}

testStatsQuery();
