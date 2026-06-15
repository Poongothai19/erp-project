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
    console.log('Connected to DB');
    
    const result = await sql.query("UPDATE hrm.Employee SET EntityId = 6 WHERE EntityId = 7");
    console.log('Updated rows (7 -> 6):', result.rowsAffected[0]);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
