const sql = require('mssql');

const devConfig = {
    user: 'sa',
    password: 'Strong!1234',
    server: '65.38.99.253',
    database: 'JobPost_DEV',
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

const prodConfig = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

async function compareUserInfo() {
    try {
        console.log("Checking dev userinfo...");
        const devPool = await sql.connect(devConfig);
        const devResult = await devPool.request().query("SELECT id, username FROM userinfo WHERE username IN ('abinesh', 'vasanth', 'rishi')");
        console.log("Dev userinfo:", devResult.recordset);

        console.log("\nChecking prod userinfo...");
        const prodPool = await sql.connect(prodConfig);
        const prodResult = await prodPool.request().query("SELECT id, username FROM userinfo WHERE username IN ('abinesh', 'vasanth', 'rishi')");
        console.log("Prod userinfo:", prodResult.recordset);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

compareUserInfo();
