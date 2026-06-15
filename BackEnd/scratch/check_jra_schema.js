require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkSchema() {
    try {
        const pool = await poolPromise;
        
        console.log("--- recruit.JobRecruiterAssignment ---");
        const jraCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'JobRecruiterAssignment'");
        console.log(jraCols.recordset.map(r => r.COLUMN_NAME));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
