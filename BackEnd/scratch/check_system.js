require('dotenv').config();
const { poolPromise, sql } = require('../config/db');

async function checkSystem() {
  try {
    const pool = await poolPromise;

    console.log('--- USERS SEARCH ---');
    const users = await pool.request().query(`
      SELECT u.id, u.username, u.EmployeeId, u.role, ud.email
      FROM userinfo u
      LEFT JOIN userdetails ud ON u.id = ud.id
      WHERE u.username IN ('Singaravel', 'poongo', 'reshma', 'Ram')
    `);
    console.log('Users:', JSON.stringify(users.recordset, null, 2));

    console.log('\n--- ACTIVE EMPLOYEES ---');
    const result = await pool.request().query(`
      SELECT TOP 10 * FROM ExternalTimesheetFiles
    `);
    console.log('ExternalTimesheetFiles Sample:', JSON.stringify(result.recordset, null, 2));




    console.log('\n--- JOIN TEST (AS IN AuthRoutes.js) ---');
    const joinTest = await pool.request().query(`
      SELECT u.username, u.EmployeeId as User_EmpId, e.EmployeeId as Table_PK, e.EmployeeCode, e.IsDeleted
      FROM userinfo u
      LEFT JOIN [hrm].[Employee] e ON u.EmployeeId = e.EmployeeCode
      WHERE u.username IN ('Singaravel', 'poongo', 'reshma', 'Ram')
    `);
    console.log('Join Test Result:', JSON.stringify(joinTest.recordset, null, 2));

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

checkSystem();
