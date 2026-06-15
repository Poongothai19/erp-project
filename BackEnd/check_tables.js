require('dotenv').config();
const { poolPromise } = require('./config/db');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('userinfo', 'userdetails', 'Recruiters')
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
