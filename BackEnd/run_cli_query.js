require('dotenv').config();
const { sql, poolPromise } = require('./config/db');

async function run() {
    try {
        const pool = await poolPromise;
        const query = process.argv[2];
        console.log(`Executing: ${query}`);
        const res = await pool.request().query(query);
        console.log("Result:", res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
