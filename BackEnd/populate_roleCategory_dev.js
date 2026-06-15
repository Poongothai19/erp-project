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
        console.log('Connected!');

        // Set Offshore for India roles
        const offshoreResult = await sql.query(`
            UPDATE RecruitmentRoles 
            SET roleCategory = 'Offshore' 
            WHERE country = 'India' OR country = 'IN'
        `);
        console.log(`✅ Set Offshore for India roles: ${offshoreResult.rowsAffected[0]} rows`);

        // Set Onsite for all other roles that are still null
        const onsiteResult = await sql.query(`
            UPDATE RecruitmentRoles 
            SET roleCategory = 'Onsite' 
            WHERE roleCategory IS NULL
        `);
        console.log(`✅ Set Onsite for remaining roles: ${onsiteResult.rowsAffected[0]} rows`);

        // Verify counts
        const counts = await sql.query(`
            SELECT roleCategory, COUNT(*) as total 
            FROM RecruitmentRoles 
            GROUP BY roleCategory
        `);
        console.log('\nRoleCategory distribution in dev DB:');
        console.dir(counts.recordset);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        sql.close();
    }
}
run();
