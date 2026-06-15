const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/poong/Downloads/PROPHECY_ERP/PROPHECY_ERP_LATEST-dev/BackEnd/.env' });
const dbConfig = { user: process.env.DB_USER, password: process.env.DB_PASSWORD, server: process.env.DB_SERVER, database: process.env.DB_NAME, options: { encrypt: false, enableArithAbort: true } };

async function run() {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query("SELECT TOP 1 id, roleCategory, roleLocation FROM RecruitmentRoles WHERE roleCategory = 'Offshore'");
        console.dir(result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        sql.close();
    }
}
run();
