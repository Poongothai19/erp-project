require('dotenv').config();
const { poolPromise } = require('./config/db');

async function updateSchema() {
    try {
        const pool = await poolPromise;
        
        // Check if userId already exists
        const checkCol = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Recruiters' AND COLUMN_NAME = 'userId'
        `);
        
        if (checkCol.recordset.length === 0) {
            console.log("Adding userId column to Recruiters table...");
            await pool.request().query(`
                ALTER TABLE Recruiters ADD userId INT NULL;
            `);
            console.log("Column added.");
            
            // Backfill data: match userinfo.username with Recruiters.name to populate userId
            console.log("Backfilling userId data...");
            await pool.request().query(`
                UPDATE r
                SET r.userId = u.id
                FROM Recruiters r
                INNER JOIN userinfo u ON r.name = u.username
                WHERE r.userId IS NULL;
            `);
            console.log("Backfill complete.");
        } else {
            console.log("userId column already exists.");
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
updateSchema();
