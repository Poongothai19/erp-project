require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkTeams() {
    try {
        const pool = await poolPromise;
        
        console.log("--- Existing Teams ---");
        const teams = await pool.request().query("SELECT TOP 5 * FROM core.Team");
        console.table(teams.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTeams();
