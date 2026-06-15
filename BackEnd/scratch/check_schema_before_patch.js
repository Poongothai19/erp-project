require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { poolPromise, sql } = require("../config/db");

async function checkSchema() {
    try {
        const pool = await poolPromise;
        
        console.log("Checking columns for recruit.Candidate:");
        const candidateCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'Candidate'");
        console.log(candidateCols.recordset.map(r => r.COLUMN_NAME));

        console.log("\nChecking columns for recruit.CandidateIdentity:");
        const identityCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'CandidateIdentity'");
        console.log(identityCols.recordset.map(r => r.COLUMN_NAME));

        console.log("\nChecking columns for hrm.Timesheet:");
        const timesheetCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'hrm' AND TABLE_NAME = 'Timesheet'");
        console.log(timesheetCols.recordset.map(r => r.COLUMN_NAME));

        console.log("\nChecking columns for hrm.Employee:");
        const employeeCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'hrm' AND TABLE_NAME = 'Employee'");
        console.log(employeeCols.recordset.map(r => r.COLUMN_NAME));
        
        const employeeNulls = await pool.request().query("SELECT COUNT(*) as NullCount FROM hrm.Employee WHERE UserId IS NULL");
        console.log("NULL UserId count in hrm.Employee:", employeeNulls.recordset[0].NullCount);

        const teamNulls = await pool.request().query("SELECT COUNT(*) as NullCount FROM core.Team WHERE EntityId IS NULL");
        console.log("NULL EntityId count in core.Team:", teamNulls.recordset[0].NullCount);

        console.log("\nChecking columns for recruit.SubmissionResume:");
        const submissionCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'SubmissionResume'");
        console.log(submissionCols.recordset.map(r => r.COLUMN_NAME));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
