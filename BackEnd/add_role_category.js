const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/poong/Downloads/PROPHECY_ERP/PROPHECY_ERP_LATEST-dev/BackEnd/.env' });
const dbConfig = { user: process.env.DB_USER, password: process.env.DB_PASSWORD, server: process.env.DB_SERVER, database: process.env.DB_NAME, options: { encrypt: false, enableArithAbort: true } };

async function run() {
    try {
        await sql.connect(dbConfig);
        await sql.query("ALTER TABLE RecruitmentRoles ADD roleCategory nvarchar(50) DEFAULT 'Onsite'");
        console.log("Successfully added roleCategory column!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        sql.close();
    }
}
run();
