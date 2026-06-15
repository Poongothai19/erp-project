const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/poong/Downloads/PROPHECY_ERP/PROPHECY_ERP_LATEST-dev/BackEnd/.env' });
const dbConfig = { user: process.env.DB_USER, password: process.env.DB_PASSWORD, server: process.env.DB_SERVER, database: process.env.DB_NAME, options: { encrypt: false, enableArithAbort: true } };

async function run() {
    try {
        await sql.connect(dbConfig);
        // Fix all India-based roles to have Offshore category and sequential Job IDs
        // First, get all offshore roles that need fixing
        const badRoles = await sql.query("SELECT id, jobId, country, roleCategory FROM RecruitmentRoles WHERE (country = 'India' OR country = 'IN') AND (roleCategory != 'Offshore' OR roleCategory IS NULL)");
        console.log('Roles to fix:', badRoles.recordset);
        
        // Update all India roles to Offshore
        const updateResult = await sql.query("UPDATE RecruitmentRoles SET roleCategory = 'Offshore' WHERE country = 'India' OR country = 'IN'");
        console.log('Updated rows:', updateResult.rowsAffected);
        
        // Now fix job IDs - get all offshore roles with non-numeric job IDs
        const offshoreRoles = await sql.query("SELECT id, jobId, role, country FROM RecruitmentRoles WHERE roleCategory = 'Offshore' ORDER BY createdAt ASC");
        console.log('All offshore roles:', offshoreRoles.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        sql.close();
    }
}
run();
