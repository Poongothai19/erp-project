const sql = require('mssql');

const devConfig = {
    user: 'sa',
    password: 'Strong!1234',
    server: '65.38.99.253',
    database: 'JobPost_DEV',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const prodConfig = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function compareData() {
    try {
        console.log("Checking dev Recruiters table...");
        const devPool = await sql.connect(devConfig);
        const devResult = await devPool.request().query("SELECT TOP 5 id, name, email, userId FROM Recruiters WHERE userId IS NOT NULL");
        console.log("Dev Sample:", devResult.recordset);

        console.log("\nChecking prod Recruiters table...");
        const prodPool = await sql.connect(prodConfig);
        const prodResult = await prodPool.request().query("SELECT TOP 5 id, name, email, userId FROM Recruiters");
        console.log("Prod Sample:", prodResult.recordset);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

compareData();
