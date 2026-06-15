const sql = require('mssql');
const config = {
  user: 'sa', password: 'Strong!12345', server: '66.179.82.107',
  database: 'Jobpost', options: { encrypt: true, trustServerCertificate: true }
};

async function run() {
  const pool = await sql.connect(config);

  // 1. Find Jelin in userinfo
  const u = await pool.request().query(`
    SELECT u.id, u.username, u.role, d.email 
    FROM userinfo u 
    LEFT JOIN userdetails d ON u.id = d.id
    WHERE u.username LIKE '%elin%'
  `);
  console.log('=== JELIN in userinfo ===');
  console.table(u.recordset);

  // 2. Find Jelin in Recruiters table
  const r = await pool.request().query(`
    SELECT id, name, role, userId FROM Recruiters 
    WHERE name LIKE '%elin%'
  `);
  console.log('=== JELIN in Recruiters ===');
  console.table(r.recordset);

  if (u.recordset.length > 0) {
    const jelinUserId = u.recordset[0].id;
    const jelinUsername = u.recordset[0].username;
    const jelinUserRole = u.recordset[0].role;
    console.log(`\nJelin userId=${jelinUserId}, username=${jelinUsername}, role=${jelinUserRole}`);

    // 3. Check RoleRecruiterAssignments for Jelin
    const rra = await pool.request().input('userId', sql.Int, jelinUserId).query(`
      SELECT rra.roleId, rra.recruiterId, rra.assignedBy, rra.assignedAt, rra.isActive,
             rec.name as recruiterName,
             roles.role as roleName, roles.assignTo, roles.status, roles.createdAt
      FROM RoleRecruiterAssignments rra
      JOIN Recruiters rec ON rra.recruiterId = rec.id
      JOIN RecruitmentRoles roles ON rra.roleId = roles.id
      WHERE rec.userId = @userId
      ORDER BY rra.assignedAt DESC
    `);
    console.log('\n=== RoleRecruiterAssignments for Jelin ===');
    console.table(rra.recordset);

    // 4. Check jobs where assignTo matches Jelin's username
    const assignedRoles = await pool.request().input('username', sql.NVarChar, jelinUsername).query(`
      SELECT id, role, assignTo, status, createdAt 
      FROM RecruitmentRoles 
      WHERE assignTo = @username OR assignTo IS NULL
      ORDER BY createdAt DESC
    `);
    console.log('\n=== Roles where assignTo = Jelin OR IS NULL ===');
    console.table(assignedRoles.recordset);

    // 5. Check how many total NULL assignTo roles exist
    const nullRoles = await pool.request().query(`
      SELECT COUNT(*) as nullCount FROM RecruitmentRoles WHERE assignTo IS NULL
    `);
    console.log('\n=== Roles with NULL assignTo ===');
    console.table(nullRoles.recordset);

    // 6. Show sample of jobs with NULL assignTo
    const sampleNull = await pool.request().query(`
      SELECT TOP 5 id, jobId, role, assignTo, status, createdAt, createdBy
      FROM RecruitmentRoles 
      WHERE assignTo IS NULL
      ORDER BY createdAt DESC
    `);
    console.log('\n=== Sample NULL assignTo roles ===');
    console.table(sampleNull.recordset);
  }

  // 7. Check the specific jobs visible in screenshot (90460-1, 83968-1, 90396-1, AIML Eng: 4, 90915-1, 90017-1)
  const specificJobs = await pool.request().query(`
    SELECT id, jobId, role, assignTo, status, createdAt, createdBy,
      (SELECT STRING_AGG(CONCAT(rec.name, '(id:', rec.id, ')'), ', ')
       FROM RoleRecruiterAssignments rra
       JOIN Recruiters rec ON rra.recruiterId = rec.id
       WHERE rra.roleId = rr.id AND rra.isActive = 1) as assignedRecruiters
    FROM RecruitmentRoles rr
    WHERE rr.jobId IN ('90460-1','83968-1','90396-1','90915-1','90017-1')
       OR rr.id = 4
    ORDER BY rr.createdAt DESC
  `);
  console.log('\n=== Specific Jobs from Screenshot ===');
  console.table(specificJobs.recordset);

  await pool.close();
}

run().catch(console.error);
