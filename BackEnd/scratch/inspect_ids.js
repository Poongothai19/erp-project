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
        console.log("Checking userinfo and Recruiters...");
        
        const users = await pool.request().query("SELECT TOP 5 id, username, EmployeeId FROM userinfo");
        console.log("userinfo sample:", users.recordset);
        
        const recruiters = await pool.request().query("SELECT TOP 5 id, name FROM Recruiters");
        console.log("Recruiters sample:", recruiters.recordset);
        
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
        console.error("Message:", err.message);
    }
}

runTestQuery();
