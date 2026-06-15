const sql = require('mssql');

// Dev server config
const devConfig = {
    user: 'sa',
    password: 'Strong!1234',
    server: '65.38.99.253',
    port: 1433,
    database: 'JobPost_DEV',
    options: { encrypt: false, enableArithAbort: true }
};

async function run() {
    try {
        console.log('Connecting to dev server 65.38.99.253 / JobPost_DEV ...');
        await sql.connect(devConfig);
        console.log('Connected!\n');

        // Show current offshore roles
        const current = await sql.query(`
            SELECT id, jobId, role, country, createdAt 
            FROM RecruitmentRoles 
            WHERE roleCategory = 'Offshore' 
            ORDER BY createdAt ASC
        `);
        console.log('Current offshore roles in dev DB:');
        console.dir(current.recordset);

        // Reassign sequential IDs starting from 1
        let seq = 1;
        for (const role of current.recordset) {
            const request = new sql.Request();
            request.input('id', sql.Int, role.id);
            request.input('jobId', sql.NVarChar, seq.toString());
            await request.query("UPDATE RecruitmentRoles SET jobId = @jobId WHERE id = @id");
            console.log(`Role id=${role.id} "${role.role}" => jobId: ${seq}`);
            seq++;
        }

        console.log(`\n✅ Done! Assigned sequential IDs 1-${seq - 1} to ${current.recordset.length} offshore roles in DEV DB.`);
        console.log(`   Next new offshore role will get Job ID: ${seq}`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        sql.close();
    }
}
run();
