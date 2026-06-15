require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkRoles() {
    try {
        const pool = await poolPromise;
        
        console.log("--- Unique MemberRole in core.TeamMember ---");
        const roles = await pool.request().query("SELECT DISTINCT MemberRole FROM core.TeamMember");
        console.log(roles.recordset.map(r => r.MemberRole));

        console.log("\n--- Sample data from Recruiters ---");
        const recruiters = await pool.request().query("SELECT TOP 5 * FROM Recruiters");
        console.table(recruiters.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRoles();
