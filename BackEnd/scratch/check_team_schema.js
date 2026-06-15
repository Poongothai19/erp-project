require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkSchema() {
    try {
        const pool = await poolPromise;
        
        console.log("--- core.Team ---");
        const teamCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'core' AND TABLE_NAME = 'Team'");
        console.log(teamCols.recordset.map(r => r.COLUMN_NAME));

        console.log("\n--- core.TeamMember ---");
        const teamMemberCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'core' AND TABLE_NAME = 'TeamMember'");
        console.log(teamMemberCols.recordset.map(r => r.COLUMN_NAME));

        console.log("\n--- Recruiters ---");
        const recruitersCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Recruiters'");
        console.log(recruitersCols.recordset.map(r => r.COLUMN_NAME));

        console.log("\n--- RoleRecruiterAssignments ---");
        const rraCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RoleRecruiterAssignments'");
        console.log(rraCols.recordset.map(r => r.COLUMN_NAME));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
