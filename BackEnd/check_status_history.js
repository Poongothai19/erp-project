const sql = require('mssql');
require('dotenv').config();

async function check() {
  try {
    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      port: parseInt(process.env.DB_PORT || '1433'),
      database: process.env.DB_NAME,
      options: { encrypt: true, trustServerCertificate: true }
    });
    
    const result = await pool.request().query(
      "SELECT c.name, c.is_nullable, t.name AS type FROM sys.columns c JOIN sys.tables tb ON c.object_id = tb.object_id JOIN sys.schemas s ON tb.schema_id = s.schema_id JOIN sys.types t ON c.user_type_id = t.user_type_id WHERE tb.name = 'CandidateStatusHistory' AND s.name = 'recruit' ORDER BY c.column_id"
    );
    
    console.log('\n✅ CandidateStatusHistory actual columns:');
    result.recordset.forEach(r => {
      console.log(`  ${r.name} (${r.type}) - nullable: ${r.is_nullable ? 'YES' : 'NO'}`);
    });
    
    pool.close();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
check();
