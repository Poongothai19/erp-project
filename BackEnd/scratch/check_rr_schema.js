require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkSchema() {
    try {
        const pool = await poolPromise;
        
        console.log("--- RecruitmentRoles ---");
        const rrCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RecruitmentRoles'");
        console.log(rrCols.recordset.map(r => r.COLUMN_NAME));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
