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

async function runTestQuery() {
    try {
        let pool = await sql.connect(config);
        console.log("Checking emails...");
        
        const users = await pool.request().query(`
            SELECT u.id, u.username, d.email 
            FROM userinfo u 
            JOIN userdetails d ON u.id = d.id 
            WHERE u.username IN ('vasanth', 'abinesh')
        `);
        console.log("userdetails email:", users.recordset);
        
        const recruiters = await pool.request().query(`
            SELECT id, name, email 
            FROM Recruiters 
            WHERE name IN ('vasanth', 'abinesh')
        `);
        console.log("Recruiters email:", recruiters.recordset);
        
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
    }
}

runTestQuery();
