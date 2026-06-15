require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkMapping() {
    try {
        const pool = await poolPromise;
        
        console.log("--- Recruiters that match userinfo by email ---");
        const matchCount = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM Recruiters r
            JOIN userdetails ud ON r.email = ud.email
            JOIN userinfo u ON ud.id = u.id
        `);
        console.log("Matches:", matchCount.recordset[0].count);

        console.log("\n--- Recruiters that DO NOT match userinfo by email ---");
        const noMatch = await pool.request().query(`
            SELECT r.id, r.name, r.email 
            FROM Recruiters r
            LEFT JOIN userdetails ud ON r.email = ud.email
            WHERE ud.id IS NULL
        `);
        console.table(noMatch.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMapping();
