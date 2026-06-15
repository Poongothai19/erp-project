const sql = require('mssql');

const prodConfig = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

async function updateProdUserIds() {
    try {
        console.log("Connecting to production server...");
        const pool = await sql.connect(prodConfig);
        console.log("✅ Connected. Updating userId in Recruiters table...");

        const result = await pool.request().query(`
            UPDATE r
            SET r.userId = u.id
            FROM Recruiters r
            INNER JOIN userinfo u ON r.name = u.username
        `);
        console.log(`Updated ${result.rowsAffected} rows in Recruiters table.`);
        
        const checkResult = await pool.request().query("SELECT TOP 5 id, name, userId FROM Recruiters WHERE name IN ('abinesh', 'vasanth')");
        console.log("Check updated data:", checkResult.recordset);

        process.exit(0);
    } catch (e) {
        console.error("Error updating userId:", e);
        process.exit(1);
    }
}

updateProdUserIds();
