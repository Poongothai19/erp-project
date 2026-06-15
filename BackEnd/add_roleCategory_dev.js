const sql = require('mssql');

// Dev server config from .env
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

        // Check if column already exists
        const check = await sql.query(`
            SELECT COUNT(*) as cnt 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'RecruitmentRoles' AND COLUMN_NAME = 'roleCategory'
        `);

        if (check.recordset[0].cnt > 0) {
            console.log('✅ roleCategory column already exists in dev DB!');
        } else {
            await sql.query("ALTER TABLE RecruitmentRoles ADD roleCategory nvarchar(50) DEFAULT 'Onsite'");
            console.log('✅ Successfully added roleCategory column to dev DB!');
        }

        // Verify
        const verify = await sql.query(`
            SELECT TOP 5 id, role, country, roleCategory 
            FROM RecruitmentRoles 
            ORDER BY createdAt DESC
        `);
        console.log('Sample rows from dev DB:');
        console.dir(verify.recordset);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        sql.close();
    }
}
run();
