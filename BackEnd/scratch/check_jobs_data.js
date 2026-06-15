require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkJobs() {
    try {
        const pool = await poolPromise;
        
        console.log("--- RecruitmentRoles Count ---");
        const rrCount = await pool.request().query("SELECT COUNT(*) as count FROM RecruitmentRoles");
        console.log(rrCount.recordset[0].count);

        console.log("\n--- recruit.Job Count ---");
        const jobCount = await pool.request().query("SELECT COUNT(*) as count FROM recruit.Job");
        console.log(jobCount.recordset[0].count);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkJobs();
