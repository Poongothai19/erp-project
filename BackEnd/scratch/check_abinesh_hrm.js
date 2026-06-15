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
        console.log("Checking hrm.Employee for Abinesh...");
        const data = await pool.request().query("SELECT EmployeeId, EmployeeCode, UserId FROM hrm.Employee WHERE EmployeeCode = 'PC0227'");
        console.log("Abinesh in hrm.Employee:", data.recordset);
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
    }
}

runTestQuery();
