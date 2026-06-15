require('dotenv').config();
const { poolPromise } = require('../config/db');

async function checkSchema() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'hrm' AND TABLE_NAME = 'Timesheet'
    `);
    console.log('Columns in [hrm].[Timesheet]:', result.recordset.map(c => c.COLUMN_NAME).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkSchema();
