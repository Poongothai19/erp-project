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
        console.log("Checking recruit.JobRecruiterAssignment...");
        const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'JobRecruiterAssignment' AND TABLE_SCHEMA = 'recruit'");
        console.log("recruit.JobRecruiterAssignment columns:", cols.recordset.map(c => c.COLUMN_NAME));
        
        const data = await pool.request().query("SELECT TOP 5 * FROM recruit.JobRecruiterAssignment");
        console.log("recruit.JobRecruiterAssignment sample:", data.recordset);
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
    }
}

runTestQuery();
