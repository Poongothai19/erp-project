require('dotenv').config();
const { sql, poolPromise } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        console.log("Checking userdetails for 'jelin'...");
        const res = await pool.request().query("SELECT * FROM userdetails WHERE email LIKE '%jelin%' OR firstName LIKE '%jelin%' OR lastName LIKE '%jelin%'");
        console.log("userdetails:", res.recordset);

        console.log("\nChecking userinfo for 'jelin'...");
        const res2 = await pool.request().query("SELECT * FROM userinfo WHERE username LIKE '%jelin%'");
        console.log("userinfo:", res2.recordset);
        
        console.log("\nChecking Recruiters for 'jelin'...");
        const res3 = await pool.request().query("SELECT * FROM Recruiters WHERE email LIKE '%jelin%' OR name LIKE '%jelin%'");
        console.log("Recruiters:", res3.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
