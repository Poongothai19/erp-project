const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

async function checkDb() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");
        const result = await sql.query(`
            SELECT TOP 5 * FROM [recruit].[Candidate] ORDER BY CandidateId DESC
        `);
        console.log("Candidate records:");
        console.log(JSON.stringify(result.recordset, null, 2));

        const result2 = await sql.query(`
            SELECT TOP 5 * FROM [recruit].[CandidateIdentity] ORDER BY CandidateIdentityId DESC
        `);
        console.log("Candidate Identity records:");
        console.log(JSON.stringify(result2.recordset, null, 2));

        await sql.close();
    } catch (err) {
        console.error("DB Error", err);
    }
}

checkDb();
