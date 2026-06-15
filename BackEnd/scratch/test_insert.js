const sql = require('mssql');

const dbConfig = {
  user: "sa",
  password: "Strong!1234",
  server: "65.38.99.253",
  database: "JobPost_DEV",
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  }
};

async function run() {
  try {
    await sql.connect(dbConfig);
    console.log('Connected');
    
    const candResult = await sql.query(`
          INSERT INTO [recruit].[Candidate] (FirstName, MiddleName, LastName, CandidateCode, JobTitle, CreatedOn)
          OUTPUT INSERTED.CandidateId
          VALUES ('Metha', NULL, 'Test', 'EMP-' + LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 8), 'Position', SYSUTCDATETIME())
    `);
    console.log(JSON.stringify(candResult.recordset, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
