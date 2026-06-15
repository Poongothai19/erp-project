require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");
const fs = require('fs');
const path = require('path');

async function runPatch() {
    try {
        const pool = await poolPromise;
        console.log("Connected to SQL Server");

        const sqlPath = path.resolve(__dirname, 'apply_gap_patch_part2.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log("Applying patch...");
        
        // Split by GO if necessary, but here we can try running it as one block 
        // since sp_rename might need its own batch in some cases.
        // But for simplicity, let's try one block.
        
        const result = await pool.request().batch(sqlContent);
        console.log("Patch applied successfully!");
        
        process.exit(0);
    } catch (err) {
        console.error("Patch execution failed:", err);
        process.exit(1);
    }
}

runPatch();
