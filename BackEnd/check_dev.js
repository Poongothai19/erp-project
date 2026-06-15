const sql = require('mssql');

const devConfig = {
    user: 'sa',
    password: 'Strong!1234',
    server: '65.38.99.253',
    database: 'JobPost_DEV',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkDevSchema() {
    try {
        console.log("Checking dev server...");
        const pool = await sql.connect(devConfig);
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Recruiters' AND COLUMN_NAME = 'userid'
        `);
        console.log(result.recordset);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDevSchema();
