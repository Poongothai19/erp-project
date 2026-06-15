const { dbConfig } = require('../config/db'); // Fixed path
const sql = require('mssql');

async function checkEmployee() {
  try {
    console.log('Connecting to DB...');
    await sql.connect(dbConfig);
    console.log('Searching for candidate poongothaisingaravel...');
    
    const query = `
      SELECT e.EmployeeId, e.EmployeeCode, e.EntityId, c.CandidateId, c.Email, c.FirstName, c.LastName
      FROM [hrm].[Employee] e
      JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
      WHERE c.Email LIKE '%poon%' OR c.FirstName LIKE '%Poong%'
    `;
    
    const result = await sql.query(query);
    console.log('RESULTS:', JSON.stringify(result.recordset, null, 2));
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

checkEmployee();
