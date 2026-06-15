const sql = require('mssql');
require('dotenv').config();

async function fixSchema() {
  try {
    const pool = await sql.connect(process.env.DATABASE_URL || {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_DATABASE,
      options: { encrypt: true, trustServerCertificate: true }
    });
    
    // Add ResumeFileData to CandidateDocument
    console.log("Adding ResumeFileData to CandidateDocument...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[recruit].[CandidateDocument]') AND name = 'ResumeFileData')
      BEGIN
          ALTER TABLE [recruit].[CandidateDocument] ADD ResumeFileData VARBINARY(MAX) NULL;
          PRINT 'Added ResumeFileData';
      END
    `);
    
    // Create CandidateDocumentParseRun table
    console.log("Creating CandidateDocumentParseRun table...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('[recruit].[CandidateDocumentParseRun]'))
      BEGIN
          CREATE TABLE [recruit].[CandidateDocumentParseRun] (
              RunId BIGINT IDENTITY(1,1) PRIMARY KEY,
              DocumentId BIGINT NULL,
              ParserVendor NVARCHAR(100) NULL,
              Status NVARCHAR(50) NULL,
              RawPayloadJson NVARCHAR(MAX) NULL,
              ExtractedEmail NVARCHAR(255) NULL,
              ExtractedPhone NVARCHAR(50) NULL,
              StartedOn DATETIME NULL,
              CompletedOn DATETIME NULL
          );
          PRINT 'Created CandidateDocumentParseRun';
      END
    `);
    
    console.log("Schema fix complete.");
    pool.close();
  } catch(e) {
    console.error(e);
  }
}

fixSchema();
