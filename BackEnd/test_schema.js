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

async function testSchema() {
    try {
        let pool = await sql.connect(config);
        
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'RecruitmentRoles' AND COLUMN_NAME IN ('createdBy', 'assignTo')
        `);
        console.log(result.recordset);

        await pool.close();
    } catch (err) {
        console.error("Failed:", err.message);
    }
}

testSchema();
