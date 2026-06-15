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
        const result = await pool.request().query("SELECT id, name FROM Recruiters WHERE name = 'admin'");
        console.log("Admin recruiter:", result.recordset);
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
    }
}

runTestQuery();
