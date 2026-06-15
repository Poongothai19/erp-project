const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/poong/Downloads/PROPHECY_ERP/PROPHECY_ERP_LATEST-dev/BackEnd/.env' });
const dbConfig = { user: process.env.DB_USER, password: process.env.DB_PASSWORD, server: process.env.DB_SERVER, database: process.env.DB_NAME, options: { encrypt: false, enableArithAbort: true } };

async function run() {
    try {
        await sql.connect(dbConfig);
        
        // Get all offshore roles ordered by createdAt to assign sequential IDs
        const offshoreRoles = await sql.query(`
            SELECT id, jobId, role, createdAt 
            FROM RecruitmentRoles 
            WHERE roleCategory = 'Offshore' 
            ORDER BY createdAt ASC
        `);
        
        console.log(`Found ${offshoreRoles.recordset.length} offshore roles`);
        
        // Reassign sequential IDs starting from 1
        let seq = 1;
        for (const role of offshoreRoles.recordset) {
            const request = new sql.Request();
            request.input('id', sql.Int, role.id);
            request.input('jobId', sql.NVarChar, seq.toString());
            await request.query("UPDATE RecruitmentRoles SET jobId = @jobId WHERE id = @id");
            console.log(`Role id=${role.id} "${role.role}" => jobId: ${seq}`);
            seq++;
        }
        
        console.log(`\nDone! Assigned sequential IDs 1-${seq-1} to ${offshoreRoles.recordset.length} offshore roles.`);
    } catch (err) {
        console.error(err);
    } finally {
        sql.close();
    }
}
run();
