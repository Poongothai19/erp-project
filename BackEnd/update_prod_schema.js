const sql = require('mssql');

const prodConfig = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function updateProdSchema() {
    try {
        console.log("Connecting to production server...");
        const pool = await sql.connect(prodConfig);
        console.log("✅ Connected to Production SQL Server successfully");

        await pool.request().query(`
            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'userId' AND Object_ID = Object_ID(N'Recruiters'))
            BEGIN
                ALTER TABLE Recruiters ADD userId INT;
                SELECT 'Column userId added successfully.' AS StatusMessage;
            END
            ELSE
            BEGIN
                SELECT 'Column userId already exists.' AS StatusMessage;
            END
        `);
        console.log("Production schema updated successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error updating schema:", e);
        process.exit(1);
    }
}

updateProdSchema();
