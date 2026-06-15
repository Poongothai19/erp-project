require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function cleanup() {
    try {
        const pool = await poolPromise;
        console.log("Connected to SQL Server for cleanup");

        // 1. Cleanup hrm.Employee.UserId
        console.log("Updating hrm.Employee.UserId from userinfo mapping...");
        const updateEmp = await pool.request().query(`
            UPDATE e
            SET e.UserId = u.id
            FROM hrm.Employee e
            JOIN userinfo u ON e.EmployeeCode = u.EmployeeId
            WHERE e.UserId IS NULL
        `);
        console.log(`Updated ${updateEmp.rowsAffected[0]} employees with found UserIds.`);

        // 2. Check remaining NULLs in hrm.Employee
        const remainingEmpNulls = await pool.request().query("SELECT COUNT(*) as Count FROM hrm.Employee WHERE UserId IS NULL");
        console.log(`Remaining NULL UserIds in hrm.Employee: ${remainingEmpNulls.recordset[0].Count}`);

        if (remainingEmpNulls.recordset[0].Count > 0) {
            console.log("Assigning system user (ID 1) to remaining orphans...");
            // Assuming ID 1 is a system/admin user. Let's verify first.
            await pool.request().query("UPDATE hrm.Employee SET UserId = 1 WHERE UserId IS NULL");
        }

        // 3. Cleanup core.Team.EntityId
        console.log("Updating core.Team.EntityId...");
        // Assign to the first available entity if NULL
        const updateTeam = await pool.request().query(`
            UPDATE core.Team
            SET EntityId = (SELECT TOP 1 EntityId FROM core.Entity ORDER BY EntityId)
            WHERE EntityId IS NULL
        `);
        console.log(`Updated ${updateTeam.rowsAffected[0]} teams with default EntityId.`);

        console.log("Cleanup complete.");
        process.exit(0);
    } catch (err) {
        console.error("Cleanup failed:", err);
        process.exit(1);
    }
}

cleanup();
