const sql = require('mssql');
const config = {
  user: 'sa', password: 'Strong!12345', server: '66.179.82.107',
  database: 'Jobpost', options: { encrypt: true, trustServerCertificate: true }
};

async function run() {
  const pool = await sql.connect(config);

  const username = 'jelin@prophecytechs.com';
  const userId = 994;

  const newQuery = `
    SELECT rr.id, rr.jobId, rr.role, rr.assignTo, rr.status, rr.createdAt
    FROM RecruitmentRoles rr
    WHERE (
        EXISTS (
          SELECT 1 FROM RoleRecruiterAssignments rra 
          JOIN Recruiters rec ON rra.recruiterId = rec.id
          WHERE rra.roleId = rr.id 
          AND rec.userId = @userId 
          AND rra.isActive = 1
        )
        OR rr.assignTo = @username 
        OR rr.assignTo IN (SELECT name FROM Recruiters WHERE userId = @userId)
    )
    ORDER BY rr.createdAt DESC
  `;

  const result = await pool.request()
    .input('username', sql.NVarChar, username)
    .input('userId', sql.Int, userId)
    .query(newQuery);

  console.log('=== Jobs Jelin Will See Now (After Fix) ===');
  if (result.recordset.length === 0) {
     console.log('No jobs found for Jelin. Her dashboard will be empty.');
  } else {
     console.table(result.recordset);
  }

  await pool.close();
}

run().catch(console.error);
