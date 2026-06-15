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

async function testRecruiters() {
    try {
        let pool = await sql.connect(config);
        
        const result = await pool.request().query(`
            SELECT TOP 10 id, name, email, userId FROM Recruiters WHERE userId = 10
        `);
        console.log(result.recordset);

        await pool.close();
    } catch (err) {
        console.error("Failed:", err.message);
    }
}

testRecruiters();
