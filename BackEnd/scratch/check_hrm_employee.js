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
        console.log("Checking hrm.Employee...");
        const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employee' AND TABLE_SCHEMA = 'hrm'");
        console.log("hrm.Employee columns:", cols.recordset.map(c => c.COLUMN_NAME));
        
        const data = await pool.request().query("SELECT TOP 5 EmployeeId, EmployeeCode, FirstName FROM hrm.Employee");
        console.log("hrm.Employee sample:", data.recordset);
        
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
    }
}

runTestQuery();
