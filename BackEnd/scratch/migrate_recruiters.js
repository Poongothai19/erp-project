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

async function migrate() {
    try {
        let pool = await sql.connect(config);
        console.log("Adding userId column to Recruiters...");
        try {
            await pool.request().query("ALTER TABLE Recruiters ADD userId INT");
            console.log("Column added.");
        } catch (e) {
            console.log("Column might already exist or error:", e.message);
        }
        
        console.log("Populating userId from userinfo...");
        await pool.request().query(`
            UPDATE r
            SET r.userId = u.id
            FROM Recruiters r
            JOIN userinfo u ON r.name = u.username
            WHERE r.userId IS NULL
        `);
        console.log("Migration complete.");
        
        const result = await pool.request().query("SELECT id, name, userId FROM Recruiters");
        console.log("Updated Recruiters:", result.recordset);
        
        await pool.close();
    } catch (err) {
        console.error("MIGRATION FAILED!", err.message);
    }
}

migrate();
