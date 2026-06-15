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

async function testControllerLogic() {
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

        const dataRequest = pool.request();
        Object.keys(params).forEach(key => dataRequest.input(key, params[key]));
        
        const result = await dataRequest.query(query);
        console.log("Roles fetched:", result.recordset.length);

        const processedResult = result.recordset.map(role => {
            try {
                return {
                    ...role,
                    assignedRecruiters: role.assignedRecruiters ? 
                        JSON.parse(`[${role.assignedRecruiters}]`.replace(/}{/g, '},{')) : []
                };
            } catch (e) {
                console.error("JSON PARSE ERROR! Role ID:", role.id);
                console.error("String:", `[${role.assignedRecruiters}]`.replace(/}{/g, '},{'));
                throw e;
            }
        });
        console.log("Processed perfectly.");
        
        await pool.close();
    } catch (err) {
        console.error("Failed:", err);
    }
}

testControllerLogic();
