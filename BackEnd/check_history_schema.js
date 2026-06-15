const sql = require('mssql');
require('dotenv').config();

async function check() {
  try {
    const pool = await sql.connect(process.env.DATABASE_URL || {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_DATABASE,
      options: { encrypt: true, trustServerCertificate: true }
    });
    const result = await pool.request().query("SELECT c.name, c.is_nullable FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'CandidateStatusHistory' AND s.name = 'recruit'");
    console.log(result.recordset);
    pool.close();
  } catch(e) {
    console.error(e);
  }
}
check();
