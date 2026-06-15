require('dotenv').config();
const { poolPromise, sql } = require('../config/db');

async function checkInvoiceSchema() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ERP_Invoices'
      ORDER BY ORDINAL_POSITION
    `);
    
    result.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME} | ${col.DATA_TYPE} | ${col.IS_NULLABLE}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkInvoiceSchema();
