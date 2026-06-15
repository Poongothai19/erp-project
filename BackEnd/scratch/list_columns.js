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
        console.log("Checking columns of userinfo...");
        const userinfoCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'userinfo'");
        console.log("userinfo columns:", userinfoCols.recordset.map(c => c.COLUMN_NAME));
        
        console.log("Checking columns of Recruiters...");
        const recruiterCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Recruiters'");
        console.log("Recruiters columns:", recruiterCols.recordset.map(c => c.COLUMN_NAME));
        
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
        console.error("Message:", err.message);
    }
}

runTestQuery();
