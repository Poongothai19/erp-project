const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function runTestQuery() {
    try {
        let pool = await sql.connect(config);
        console.log("Checking columns of core.TeamMember...");
        const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TeamMember' AND TABLE_SCHEMA = 'core'");
        console.log("core.TeamMember columns:", cols.recordset.map(c => c.COLUMN_NAME));
        
        console.log("Checking data in core.TeamMember...");
        const data = await pool.request().query("SELECT TOP 5 * FROM core.TeamMember");
        console.log("core.TeamMember sample:", data.recordset);
        
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
    }
}

runTestQuery();
