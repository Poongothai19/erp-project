require('dotenv').config();
const { poolPromise, sql } = require('../config/db');

async function checkInvoiceSchema() {
  try {
    const pool = await poolPromise;
    console.log('✅ Connected to database');

    const tables = ['ERP_Invoices', 'ERP_InvoiceItems', 'ERP_InvoiceAttachments'];
    
    for (const table of tables) {
      console.log(`\n--- Checking table: ${table} ---`);
      try {
        const result = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = '${table}'
        `);
        
        if (result.recordset.length === 0) {
          console.log(`❌ Table '${table}' DOES NOT EXIST!`);
        } else {
          console.log(`Table exists with ${result.recordset.length} columns.`);
          console.table(result.recordset);
        }
      } catch (err) {
        console.error(`❌ Error checking table ${table}:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkInvoiceSchema();
