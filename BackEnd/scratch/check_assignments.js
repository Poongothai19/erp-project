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
        console.log("Checking RoleRecruiterAssignments...");
        const data = await pool.request().query("SELECT TOP 5 * FROM RoleRecruiterAssignments");
        console.log("RoleRecruiterAssignments sample:", data.recordset);
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
    }
}

runTestQuery();
