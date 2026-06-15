require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function analyzeRecruiters() {
    try {
        const pool = await poolPromise;
        
        console.log("--- ALL RECRUITERS ---");
        const recruiters = await pool.request().query("SELECT * FROM Recruiters");
        console.table(recruiters.recordset);

        console.log("\n--- RECRUITERS BY ROLE ---");
        const roleDist = await pool.request().query("SELECT role, COUNT(*) as count FROM Recruiters GROUP BY role");
        console.table(roleDist.recordset);

        console.log("\n--- RECRUITERS MATCHING USERINFO (By Email) ---");
        const matches = await pool.request().query(`
            SELECT r.name as RecruiterName, r.email, u.username as SystemUsername, u.role as SystemRole
            FROM Recruiters r
            JOIN userdetails ud ON r.email = ud.email
            JOIN userinfo u ON ud.id = u.id
        `);
        console.table(matches.recordset);

        console.log("\n--- RECRUITERS NOT MATCHING ANY USER ---");
        const noMatches = await pool.request().query(`
            SELECT r.name, r.email, r.role
            FROM Recruiters r
            LEFT JOIN userdetails ud ON r.email = ud.email
            WHERE ud.id IS NULL
        `);
        console.table(noMatches.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

analyzeRecruiters();
