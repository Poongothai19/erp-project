const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function checkTables() {
    try {
        let pool = await sql.connect(config);
        const tables = [
            '[recruit].[Candidate]',
            '[recruit].[CandidateIdentity]',
            '[recruit].[CandidateDocument]',
            '[core].[EntityAddress]',
            '[core].[Address]',
            '[core].[City]',
            '[core].[StateProvince]',
            '[core].[Country]',
            '[recruit].[CandidateSkill]',
            '[recruit].[Skill]'
        ];

        for (const table of tables) {
            try {
                await pool.request().query(`SELECT TOP 1 * FROM ${table}`);
                console.log(`Table ${table}: OK`);
            } catch (e) {
                console.error(`Table ${table}: FAILED - ${e.message}`);
            }
        }
        
        await pool.close();
    } catch (err) {
        console.error("Connection failed:", err.message);
    }
}

checkTables();
