require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkConstraints() {
    try {
        const pool = await poolPromise;
        
        console.log("--- Check Constraints for core.TeamMember ---");
        const result = await pool.request().query(`
            SELECT definition 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('core.TeamMember')
        `);
        console.table(result.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkConstraints();
