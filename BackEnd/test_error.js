const sql = require('mssql');
require('dotenv').config();

async function checkColumns() {
  try {
    const pool = await sql.connect(process.env.DATABASE_URL || {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_DATABASE,
      options: { encrypt: true, trustServerCertificate: true }
    });
    
    // Check CandidateDocument columns
    let result = await pool.request().query("SELECT c.name FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'CandidateDocument' AND s.name = 'recruit'");
    console.log('CandidateDocument columns:', result.recordset.map(r => r.name).join(', '));
    
    // Check if ResumeFileData exists
    console.log('ResumeFileData exists?', result.recordset.some(r => r.name === 'ResumeFileData'));
    
    // Check CandidateDocumentParseRun
    result = await pool.request().query("SELECT c.name FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'CandidateDocumentParseRun' AND s.name = 'recruit'");
    console.log('CandidateDocumentParseRun columns:', result.recordset.map(r => r.name).join(', '));
    
    pool.close();
  } catch(e) {
    console.error(e);
  }
}

checkColumns();
