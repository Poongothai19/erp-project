require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function addSampleMembers() {
    try {
        const pool = await poolPromise;
        
        // 1. Ensure Recruitment Team exists
        console.log("Checking Recruitment Team...");
        let teamResult = await pool.request()
            .input('code', sql.NVarChar, 'RECRUIT-NA')
            .query("SELECT TeamId FROM core.Team WHERE TeamCode = @code");
        
        let teamId;
        if (teamResult.recordset.length === 0) {
            console.log("Creating RECRUIT team...");
            const insertTeam = await pool.request()
                .input('code', sql.NVarChar, 'RECRUIT')
                .input('name', sql.NVarChar, 'Recruitment Team')
                .input('type', sql.NVarChar, 'Recruitment')
                .input('entityId', sql.Int, 4)
                .query("INSERT INTO core.Team (TeamCode, TeamName, TeamType, IsActive, CreatedAtUtc, EntityId) OUTPUT INSERTED.TeamId VALUES (@code, @name, @type, 1, GETUTCDATE(), @entityId)");
            teamId = insertTeam.recordset[0].TeamId;
        } else {
            teamId = teamResult.recordset[0].TeamId;
        }
        console.log("TeamId:", teamId);

        // 2. Sample members to add (Mapped to allowed roles: RECRUITER, LEAD)
        const members = [
            { userId: 50, role: 'RECRUITER' }, // Aruna (user)
            { userId: 68, role: 'LEAD' },      // Edwin (teamlead)
            { userId: 114, role: 'RECRUITER' }, // Avneesh (user)
            { userId: 115, role: 'RECRUITER' }, // Arun (user)
            { userId: 120, role: 'RECRUITER' }  // Abinesh (user)
        ];

        for (const member of members) {
            console.log(`Adding member UserId: ${member.userId} with role: ${member.role}...`);
            await pool.request()
                .input('teamId', sql.Int, teamId)
                .input('userId', sql.Int, member.userId)
                .input('role', sql.NVarChar, member.role)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM core.TeamMember WHERE TeamId = @teamId AND UserId = @userId)
                    BEGIN
                        INSERT INTO core.TeamMember (TeamId, UserId, MemberRole, IsActive, CreatedAtUtc, EffectiveFromUtc)
                        VALUES (@teamId, @userId, @role, 1, GETUTCDATE(), GETUTCDATE())
                    END
                    ELSE
                    BEGIN
                        UPDATE core.TeamMember SET MemberRole = @role, IsActive = 1 WHERE TeamId = @teamId AND UserId = @userId
                    END
                `);
        }

        console.log("Successfully added/updated 5 sample members.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

addSampleMembers();
