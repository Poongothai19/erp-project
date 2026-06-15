const sql = require('mssql');

const prodConfig = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    port: 1433,
    database: 'Jobpost',
    options: { encrypt: false, enableArithAbort: true }
};

async function runProdMigration() {
    try {
        console.log('Connecting to PROD server 66.179.82.107 / Jobpost...');
        await sql.connect(prodConfig);
        console.log('Connected!');

        // 1. Add column if not exists
        console.log('Checking if roleCategory column exists...');
        const colCheck = await sql.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'RecruitmentRoles' AND COLUMN_NAME = 'roleCategory'
        `);
        
        if (colCheck.recordset.length === 0) {
            console.log('Adding roleCategory column to RecruitmentRoles...');
            await sql.query(`ALTER TABLE RecruitmentRoles ADD roleCategory NVARCHAR(50) NULL`);
            console.log('Column added.');
        } else {
            console.log('Column roleCategory already exists.');
        }

        // 2. Populate Data (India -> Offshore, Others -> Onsite)
        console.log('\nUpdating Offshore roles...');
        const updateOffshore = await sql.query(`
            UPDATE RecruitmentRoles 
            SET roleCategory = 'Offshore' 
            WHERE country LIKE '%India%' OR country = 'IN'
        `);
        console.log(`Updated ${updateOffshore.rowsAffected[0]} roles to Offshore.`);

        console.log('Updating Onsite roles...');
        const updateOnsite = await sql.query(`
            UPDATE RecruitmentRoles 
            SET roleCategory = 'Onsite' 
            WHERE roleCategory IS NULL OR (country NOT LIKE '%India%' AND country != 'IN')
        `);
        console.log(`Updated ${updateOnsite.rowsAffected[0]} roles to Onsite.`);

        // 3. Re-assign sequential Job IDs to Offshore roles
        console.log('\nFetching current Offshore roles to fix Job IDs...');
        const offshoreRoles = await sql.query(`
            SELECT id, jobId, role, country, createdAt 
            FROM RecruitmentRoles 
            WHERE roleCategory = 'Offshore' 
            ORDER BY createdAt ASC
        `);
        
        let seq = 1;
        for (const role of offshoreRoles.recordset) {
            const request = new sql.Request();
            request.input('id', sql.Int, role.id);
            request.input('jobId', sql.NVarChar, seq.toString());
            await request.query("UPDATE RecruitmentRoles SET jobId = @jobId WHERE id = @id");
            console.log(`PROD Role id=${role.id} "${role.role}" => jobId: ${seq}`);
            seq++;
        }
        
        console.log(`\n✅ PROD Migration Complete!`);
        console.log(`   Assigned sequential Job IDs 1-${seq - 1} to Offshore roles.`);

    } catch (err) {
        console.error('❌ PROD Error:', err.message);
    } finally {
        sql.close();
    }
}

runProdMigration();
