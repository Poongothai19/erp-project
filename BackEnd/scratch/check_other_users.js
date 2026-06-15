const sql = require('mssql');
const config = {
  user: 'sa', password: 'Strong!12345', server: '66.179.82.107',
  database: 'Jobpost', options: { encrypt: true, trustServerCertificate: true }
};

async function checkUser(pool, nameOrEmail) {
  console.log(`\n========================================`);
  console.log(`Checking for User: ${nameOrEmail}`);
  console.log(`========================================`);

  const users = await pool.request()
    .input('searchTerm', sql.NVarChar, `%${nameOrEmail}%`)
    .query(`
      SELECT u.id, u.username, u.role, d.email 
      FROM userinfo u 
      LEFT JOIN userdetails d ON u.id = d.id
      WHERE u.username LIKE @searchTerm OR d.email LIKE @searchTerm
         OR u.id IN (SELECT userId FROM Recruiters WHERE name LIKE @searchTerm)
    `);

  if (users.recordset.length === 0) {
    console.log(`No user found matching: ${nameOrEmail}`);
    return;
  }

  const user = users.recordset[0];
  console.log(`Found User: id=${user.id}, username=${user.username}, role=${user.role}`);

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
    .input('username', sql.NVarChar, user.username)
    .input('userId', sql.Int, user.id)
    .query(newQuery);

  console.log(`\n=== Jobs ${user.username} Will See Now (After Fix) ===`);
  if (result.recordset.length === 0) {
     console.log('No jobs found. Dashboard will be empty.');
  } else {
     console.table(result.recordset.slice(0, 10)); // Show top 10
     console.log(`\n... and ${Math.max(0, result.recordset.length - 10)} more jobs`);
  }
}

async function run() {
  const pool = await sql.connect(config);
  await checkUser(pool, 'vibitha');
  await pool.close();
}

run().catch(console.error);
