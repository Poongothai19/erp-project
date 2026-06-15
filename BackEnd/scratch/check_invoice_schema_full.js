require('dotenv').config();
const { poolPromise, sql } = require('../config/db');

async function checkInvoiceSchema() {
  try {
    const pool = await poolPromise;
    console.log('✅ Connected to database');

    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ERP_Invoices'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n--- ERP_Invoices Columns ---');
    console.table(result.recordset);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkInvoiceSchema();
