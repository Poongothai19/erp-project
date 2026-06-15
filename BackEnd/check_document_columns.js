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

async function checkColumns() {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CandidateDocument' AND TABLE_SCHEMA = 'recruit'
        `);
        console.log("Columns in [recruit].[CandidateDocument]:");
        console.log(result.recordset.map(r => r.COLUMN_NAME).join(', '));
        await pool.close();
    } catch (err) {
        console.error("Failed:", err.message);
    }
}

checkColumns();
