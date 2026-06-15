require('dotenv').config();
const { poolPromise, sql } = require('../config/db');

async function checkUser() {
  try {
    const pool = await poolPromise;
    const userId = 6;

    console.log(`Checking user ID ${userId}...`);
    
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.id, u.username, u.EmployeeId, ud.email
        FROM userinfo u
        LEFT JOIN userdetails ud ON u.id = ud.id
        WHERE u.id = @userId
      `);
    
    console.log('User Record:', JSON.stringify(userResult.recordset, null, 2));
    
    if (userResult.recordset.length > 0) {
      const userEmpId = userResult.recordset[0].EmployeeId;
      console.log(`Searching for employee with Code/Id matching: ${userEmpId}`);
      
      const empResult = await pool.request()
        .input('empId', sql.NVarChar, userEmpId)
        .query(`
          SELECT EmployeeId, EmployeeCode, EntityId, IsDeleted 
          FROM [hrm].[Employee] 
          WHERE EmployeeCode = @empId OR CAST(EmployeeId AS NVARCHAR(50)) = @empId
        `);
      
      console.log('Employee Records:', JSON.stringify(empResult.recordset, null, 2));
    }
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUser();
