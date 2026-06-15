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
        console.log("Listing all tables...");
        const tables = await pool.request().query("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
        console.log("Tables:", tables.recordset);
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
        console.error("Message:", err.message);
    }
}

runTestQuery();
