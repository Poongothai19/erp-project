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

async function testConnection() {
    try {
        console.log("Connecting to live DB...");
        let pool = await sql.connect(config);
        console.log("Connected successfully.");
        
        console.log("Checking for [recruit].[Candidate] table...");
        const result = await pool.request().query("SELECT TOP 1 * FROM [recruit].[Candidate]");
        console.log("Query successful. Record found:", result.recordset.length > 0);
        
        await pool.close();
    } catch (err) {
        console.error("Connection failed:", err.message);
        if (err.info) {
            console.error("Error Info:", err.info);
        }
    }
}

testConnection();
