const sql = require('mssql');
const config = {
  user: 'sa', password: 'Strong!12345', server: '66.179.82.107',
  database: 'Jobpost', options: { encrypt: true, trustServerCertificate: true }
};

async function run() {
  const pool = await sql.connect(config);

  console.log('=== Checking Assignments for 90995-1 and 91574-1 ===');
  const result = await pool.request().query(`
    SELECT rra.id, rra.roleId, rra.recruiterId, rec.name, rec.userId, rr.jobId
    FROM RoleRecruiterAssignments rra
    JOIN Recruiters rec ON rra.recruiterId = rec.id
    JOIN RecruitmentRoles rr ON rra.roleId = rr.id
    WHERE rr.jobId IN ('90995-1', '91574-1')
  `);
  
  if (result.recordset.length === 0) {
     console.log('NO ASSIGNMENTS FOUND! These jobs have zero recruiters assigned.');
  } else {
     console.table(result.recordset);
  }
  
  await pool.close();
}

run().catch(console.error);
