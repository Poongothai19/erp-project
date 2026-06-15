const sql = require('mssql');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: false, trustServerCertificate: true }
};

async function testToken() {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .query("SELECT AccessTokenEncrypted FROM RecruiterSocialMediaConfig WHERE PlatformName = 'LinkedIn' AND RecruiterID = 7");
        
        if (result.recordset.length === 0) {
            console.log("No token found for user 7");
            process.exit(1);
        }
        
        const token = result.recordset[0].AccessTokenEncrypted;
        console.log("Found token, prefix:", token.substring(0, 15));
        
        try {
            console.log("Checking token introspection (me)...");
            const me = await axios.get('https://api.linkedin.com/v2/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Me result:", me.data.id);
        } catch (e) {
            console.log("Me failed:", e.response ? e.response.status : e.message);
        }

        try {
            console.log("Checking organizations this token can manage...");
            const acls = await axios.get('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            console.log("Organizations:", JSON.stringify(acls.data, null, 2));
        } catch (e) {
            console.log("Organizations check failed:", e.response ? e.response.data : e.message);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

testToken();
