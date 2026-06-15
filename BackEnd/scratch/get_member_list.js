require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function getMemberMemberList() {
    try {
        const pool = await poolPromise;
        
        const query = `
            SELECT 
                r.name AS RecruiterName, 
                r.email, 
                r.role AS RecruiterRole,
                CASE WHEN u.id IS NOT NULL THEN 'MATCHED' ELSE 'NO USER ACCOUNT' END AS SystemStatus,
                u.username AS SystemUsername
            FROM Recruiters r
            LEFT JOIN userdetails ud ON r.email = ud.email
            LEFT JOIN userinfo u ON ud.id = u.id
            ORDER BY SystemStatus DESC, r.name ASC
        `;
        
        const result = await pool.request().query(query);
        console.table(result.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getMemberMemberList();
