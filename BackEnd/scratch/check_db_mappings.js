const sql = require('mssql');
const config = {
  user: 'sa', password: 'Strong!12345', server: '66.179.82.107',
  database: 'Jobpost', options: { encrypt: true, trustServerCertificate: true }
};

async function run() {
  const pool = await sql.connect(config);

  console.log('=== Checking Mismatches between userinfo and Recruiters ===');
  const mismatches = await pool.request().query(`
    SELECT r.id as recruiterId, r.name, r.role as recruiterRole, r.userId, 
           u.id as userinfoId, u.username, u.role as userinfoRole
    FROM Recruiters r
    LEFT JOIN userinfo u ON r.userId = u.id
    WHERE u.id IS NULL
  `);
  
  if (mismatches.recordset.length > 0) {
     console.log('Found Recruiters with invalid userId (not in userinfo):');
     console.table(mismatches.recordset);
  } else {
     console.log('All Recruiters have a valid userId in userinfo. No orphans found.');
  }

  console.log('\n=== Checking Mismatched Names/Roles between the two tables ===');
  const diffs = await pool.request().query(`
    SELECT r.id as recruiterId, r.name as recruiterName, r.userId, 
           u.username as userinfoUsername
    FROM Recruiters r
    JOIN userinfo u ON r.userId = u.id
    WHERE REPLACE(LOWER(r.name), ' ', '') NOT LIKE '%' + REPLACE(LOWER(SUBSTRING(u.username, 1, CHARINDEX('@', u.username + '@') - 1)), '.', '') + '%'
  `);
  
  if (diffs.recordset.length > 0) {
     console.log('Found Recruiters whose name doesnt match their userinfo email/username:');
     console.table(diffs.recordset.slice(0, 15)); // sample 15
  } else {
     console.log('No obvious mismatches in names found.');
  }

  console.log('\n=== Checking why some jobs have assignTo = NULL ===');
  const nullAssignTo = await pool.request().query(`
    SELECT createdBy, COUNT(*) as count
    FROM RecruitmentRoles
    WHERE assignTo IS NULL
    GROUP BY createdBy
  `);
  console.table(nullAssignTo.recordset);

  // Check the full table of Roles where assignTo is NULL
  const sampleNulls = await pool.request().query(`
    SELECT TOP 10 id, jobId, role, assignTo, createdBy, createdAt
    FROM RecruitmentRoles
    WHERE assignTo IS NULL
    ORDER BY createdAt DESC
  `);
  console.log('\n=== Sample 10 recent roles with assignTo = NULL ===');
  console.table(sampleNulls.recordset);

  await pool.close();
}

run().catch(console.error);
