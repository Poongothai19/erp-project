require('dotenv').config();
const { poolPromise, sql } = require('../config/db');

async function checkInvoices() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 5 Id, InvoiceNo, CompanyName, CreatedAt 
      FROM ERP_Invoices 
      ORDER BY Id DESC
    `);
    
    console.log('\n--- Recent Invoices ---');
    console.table(result.recordset);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkInvoices();
