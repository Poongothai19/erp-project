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

async function migrateRoles() {
    try {
        console.log("Connecting to live DB...");
        let pool = await sql.connect(config);
        console.log("Connected. Starting migration...");

        // Start transaction
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update assignTo
            const assignToResult = await transaction.request().query(`
                UPDATE rr
                SET rr.assignTo = CAST(u.id AS VARCHAR(100))
                FROM RecruitmentRoles rr
                JOIN userinfo u ON rr.assignTo = u.username
                WHERE rr.assignTo NOT LIKE '%[^a-zA-Z]%' OR rr.assignTo LIKE '%@%'
            `);
            console.log(`Updated ${assignToResult.rowsAffected[0]} rows for assignTo.`);

            // Update createdBy
            const createdByResult = await transaction.request().query(`
                UPDATE rr
                SET rr.createdBy = CAST(u.id AS VARCHAR(50))
                FROM RecruitmentRoles rr
                JOIN userinfo u ON rr.createdBy = u.username
                WHERE rr.createdBy NOT LIKE '%[^a-zA-Z]%' OR rr.createdBy LIKE '%@%'
            `);
            console.log(`Updated ${createdByResult.rowsAffected[0]} rows for createdBy.`);

            // Commit transaction
            await transaction.commit();
            console.log("Migration successful!");
        } catch (err) {
            console.error("Migration failed during queries. Rolling back...");
            await transaction.rollback();
            throw err;
        }

        await pool.close();
    } catch (err) {
        console.error("Connection or overall migration failed:", err.message);
    }
}

migrateRoles();
