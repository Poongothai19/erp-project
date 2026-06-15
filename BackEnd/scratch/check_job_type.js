require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkObjectType() {
    try {
        const pool = await poolPromise;
        
        const result = await pool.request().query("SELECT TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'Job'");
        console.log("recruit.Job type:", result.recordset[0]?.TABLE_TYPE);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkObjectType();
