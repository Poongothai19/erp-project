const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
  user: "sa",
  password: "Strong!1234",
  server: "65.38.99.253",
  database: "JobPost_DEV",
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  }
};

async function migrate() {
  try {
    console.log('🚀 Starting Full Migration: Companies -> core.Entity + Address + Employees');
    await sql.connect(dbConfig);

    const companiesResult = await sql.query('SELECT * FROM Companies');
    const companies = companiesResult.recordset;
    console.log(`Found ${companies.length} companies to migrate.`);

    for (const company of companies) {
      console.log(`\n📦 Processing: ${company.Name} (${company.ClientId})`);

      // 2. Insert or Update into core.Entity
      const entityRequest = new sql.Request();
      entityRequest.input('name', sql.NVarChar, company.Name);
      entityRequest.input('code', sql.NVarChar, company.ClientId);
      entityRequest.input('isActive', sql.Bit, company.Status === 'Active' ? 1 : 0);
      entityRequest.input('createdAt', sql.DateTime2, company.CreatedAt || new Date());
      
      const entityInsert = await entityRequest.query(`
        IF NOT EXISTS (SELECT 1 FROM core.Entity WHERE EntityCode = @code)
        BEGIN
            INSERT INTO core.Entity (EntityName, EntityCode, IsActive, CreatedAtUtc, IsDeleted)
            OUTPUT INSERTED.EntityId
            VALUES (@name, @code, @isActive, @createdAt, 0)
        END
        ELSE
        BEGIN
            UPDATE core.Entity SET EntityName = @name, IsActive = @isActive WHERE EntityCode = @code;
            SELECT EntityId FROM core.Entity WHERE EntityCode = @code;
        END
      `);

      const entityId = entityInsert.recordset[0].EntityId;
      console.log(`   - Entity ID: ${entityId}`);

      // 3. Migrate Address
      if (company.Address) {
        console.log(`   - Migrating Address: ${company.Address}`);
        const addressRequest = new sql.Request();
        addressRequest.input('line1', sql.NVarChar, company.Address);
        
        const addrCheck = await addressRequest.query("SELECT AddressId FROM core.Address WHERE Line1 = @line1");
        let addressId;
        
        if (addrCheck.recordset.length === 0) {
            const addressInsert = await addressRequest.query(`
              INSERT INTO core.Address (Line1)
              OUTPUT INSERTED.AddressId
              VALUES (@line1)
            `);
            addressId = addressInsert.recordset[0].AddressId;
        } else {
            addressId = addrCheck.recordset[0].AddressId;
        }

        const linkRequest = new sql.Request();
        linkRequest.input('entityId', sql.BigInt, entityId);
        linkRequest.input('addressId', sql.BigInt, addressId);
        await linkRequest.query(`
          IF NOT EXISTS (SELECT 1 FROM core.EntityAddress WHERE EntityId = @entityId AND AddressId = @addressId)
          BEGIN
              INSERT INTO core.EntityAddress (EntityId, AddressId, AddressType, EntityType, IsPrimary, CreatedAtUtc)
              VALUES (@entityId, @addressId, 'OFFICE', 'COMPANY', 1, GETUTCDATE())
          END
        `);
        console.log(`   - Address linked.`);
      }

      // 4. Migrate Employees from legacy tables
      let legacyTable = '';
      if (company.Name.includes('Cognifyar')) legacyTable = 'CognifyarEmployees';
      else if (company.Name.includes('Consulting')) legacyTable = 'ProphecyConsultingEmployees';
      else if (company.Name.includes('Offshore')) legacyTable = 'ProphecyOffshoreEmployees';

      if (legacyTable) {
          console.log(`   - Migrating Employees from legacy table: ${legacyTable}`);
          
          const legacyEmpRequest = new sql.Request();
          const legacyEmpResult = await legacyEmpRequest.query(`SELECT * FROM ${legacyTable}`);
          const legacyEmployees = legacyEmpResult.recordset;
          console.log(`   - Found ${legacyEmployees.length} employees to move.`);

          for (const emp of legacyEmployees) {
              // Split name into first and last if needed
              let firstName = emp.FirstName || '';
              let lastName = emp.LastName || '';
              if (!firstName && emp.Name) {
                  const parts = emp.Name.trim().split(' ');
                  firstName = parts[0];
                  lastName = parts.slice(1).join(' ');
              }

              const empRequest = new sql.Request();
              empRequest.input('firstName', sql.NVarChar, firstName);
              empRequest.input('lastName', sql.NVarChar, lastName);
              empRequest.input('email', sql.NVarChar, emp.Email || '');
              // Try different ID columns
              const empCode = emp.EmployeeId || emp.Id || '';
              empRequest.input('code', sql.NVarChar, empCode.toString());
              empRequest.input('entityId', sql.BigInt, entityId);
              empRequest.input('status', sql.NVarChar, emp.Status || 'Active');

              try {
                  await empRequest.query(`
                    IF NOT EXISTS (SELECT 1 FROM hrm.Employee WHERE EmployeeCode = @code)
                    BEGIN
                        INSERT INTO hrm.Employee (EmployeeCode, EntityId, EmploymentStatus, EmployeeType, StartDate, CreatedAtUtc, IsDeleted)
                        VALUES (@code, @entityId, @status, 'INTERNAL', GETUTCDATE(), GETUTCDATE(), 0)
                    END
                    ELSE
                    BEGIN
                        UPDATE hrm.Employee SET EntityId = @entityId WHERE EmployeeCode = @code;
                    END
                  `);
              } catch (empErr) {
                  console.error(`     ⚠️ Failed to migrate employee ${empCode}:`, empErr.message);
              }
          }
          console.log(`   - Employee migration for ${company.Name} done.`);
      }
    }

    console.log('\n🎉 Full Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
