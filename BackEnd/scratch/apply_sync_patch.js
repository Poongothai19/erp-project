const sql = require('mssql');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const targetConfig = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function applyPatch() {
    try {
        console.log('Connecting to target server (66.179.82.107)...');
        const pool = await sql.connect(targetConfig);
        console.log('Connected.');

        const patchPath = path.join(__dirname, 'db_sync_patch_full.sql');
        const patchContent = fs.readFileSync(patchPath, 'utf8');

        // Split by GO
        const batches = patchContent.split(/\bGO\b/i);

        console.log(`Executing ${batches.length} batches...`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i].trim();
            if (batch) {
                try {
                    await pool.request().query(batch);
                } catch (batchErr) {
                    console.error(`Error in batch ${i + 1}:`, batchErr.message);
                    console.error('Batch content:', batch);
                    // Continue with next batch or stop? Usually stop on schema changes if dependent.
                    // But here they are mostly independent IF NOT EXISTS checks.
                }
            }
        }

        console.log('Patch application completed.');
        await pool.close();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

applyPatch();
