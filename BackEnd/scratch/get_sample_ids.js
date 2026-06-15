require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function getSampleUserIds() {
    try {
        const pool = await poolPromise;
        
        const emails = [
            'abinesh@prophecytechs.com',
            'arun.b@prophecytechs.com',
            'Aruna@gmail.com',
            'avneesh.s@prophecytechs.com',
            'edwin@example.com'
        ];
        
        const query = `
            SELECT u.id as UserId, ud.email, u.username, r.role
            FROM userdetails ud
            JOIN userinfo u ON ud.id = u.id
            JOIN Recruiters r ON ud.email = r.email
            WHERE ud.email IN (${emails.map(e => `'${e}'`).join(',')})
        `;
        
        const result = await pool.request().query(query);
        console.table(result.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getSampleUserIds();
