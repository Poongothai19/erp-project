require('dotenv').config({ path: './.env' });
const { poolPromise, sql } = require('./config/db');

async function syncEmails() {
    try {
        console.log('Connecting to database...');
        const pool = await poolPromise;
        
        console.log('Fetching matches...');
        const result = await pool.request().query(`
            SELECT r.name as recruiter_name, r.email as recruiter_email, u.username as login_name, d.email as user_email, u.id
            FROM Recruiters r
            JOIN userinfo u ON r.name = u.username
            JOIN userdetails d ON u.id = d.id
            WHERE r.email != d.email
        `);
        
        const matches = result.recordset;
        console.log(`Found ${matches.length} recruiters with differing emails.`);
        
        if (matches.length === 0) {
            console.log('All emails are already in sync.');
            return;
        }
        
        console.table(matches.map(m => ({
            Recruiter: m.recruiter_name,
            RecEmail: m.recruiter_email,
            Login: m.login_name,
            UserEmail: m.user_email
        })));
        
        console.log('Updating userdetails emails...');
        for (const match of matches) {
            await pool.request()
                .input('id', sql.Int, match.id)
                .input('email', sql.NVarChar, match.recruiter_email)
                .query('UPDATE userdetails SET email = @email WHERE id = @id');
            console.log(`Updated email for ${match.recruiter_name} to ${match.recruiter_email}`);
        }
        
        console.log('Sync complete!');
    } catch (error) {
        console.error('Error during sync:', error);
    } finally {
        process.exit(0);
    }
}

syncEmails();
