// controllers/c2cController.js - REFACTORED to use CRM, HRM, and Core schemas

const { poolPromise, sql } = require("../../config/db");

// ✅ Helper: Process department contacts into JSON
const processContactsArray = (contacts) => {
  if (!contacts) return null;
  if (typeof contacts === 'string') {
    try { contacts = JSON.parse(contacts); } catch (e) { return null; }
  }
  if (!Array.isArray(contacts)) return null;
  const validContacts = contacts.filter(c => c && (c.name || c.email || c.phone));
  return validContacts.length > 0 ? JSON.stringify(validContacts) : null;
};

// ✅ Helper: Ensure Company exists in [crm].[Company]
const ensureCrmCompany = async (transaction, companyName, isVendor, isClient, taxId = null, website = null, industry = null) => {
  const request = new sql.Request(transaction);
  request.input('name', sql.NVarChar(255), companyName.trim());
  
  // Check if exists
  const checkResult = await request.query(`
    SELECT CompanyId FROM [crm].[Company] WHERE CompanyName = @name
  `);

  if (checkResult.recordset.length > 0) {
    const companyId = checkResult.recordset[0].CompanyId;
    // Update flags and info if needed
    const updateRequest = new sql.Request(transaction);
    updateRequest.input('id', sql.Int, companyId);
    updateRequest.input('isVendor', sql.Bit, isVendor ? 1 : 0);
    updateRequest.input('isClient', sql.Bit, isClient ? 1 : 0);
    updateRequest.input('website', sql.NVarChar(255), website);
    updateRequest.input('industry', sql.NVarChar(100), industry);
    await updateRequest.query(`
      UPDATE [crm].[Company] 
      SET IsVendor = CASE WHEN @isVendor = 1 THEN 1 ELSE IsVendor END,
          IsClient = CASE WHEN @isClient = 1 THEN 1 ELSE IsClient END,
          Website = ISNULL(@website, Website),
          IndustryCode = ISNULL(@industry, IndustryCode),
          UpdatedAtUtc = GETUTCDATE()
      WHERE CompanyId = @id
    `);
    return companyId;
  }

  // Create new
  const insertRequest = new sql.Request(transaction);
  const companyCode = `CRM-${companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  
  insertRequest.input('code', sql.NVarChar(50), companyCode);
  insertRequest.input('name', sql.NVarChar(255), companyName.trim());
  insertRequest.input('isVendor', sql.Bit, isVendor ? 1 : 0);
  insertRequest.input('isClient', sql.Bit, isClient ? 1 : 0);
  insertRequest.input('taxId', sql.NVarChar(50), taxId);
  insertRequest.input('website', sql.NVarChar(255), website);
  insertRequest.input('industry', sql.NVarChar(100), industry);
  
  const insertResult = await insertRequest.query(`
    INSERT INTO [crm].[Company] (CompanyCode, CompanyName, IsVendor, IsClient, TaxId, Website, IndustryCode, CreatedAtUtc, UpdatedAtUtc, StatusCode)
    OUTPUT INSERTED.CompanyId
    VALUES (@code, @name, @isVendor, @isClient, @taxId, @website, @industry, GETUTCDATE(), GETUTCDATE(), 'ACTIVE');
  `);
  return insertResult.recordset[0].CompanyId;
};

// ✅ Helper: Ensure Candidate and Employee exist
const ensureEmployee = async (transaction, contractorName, email, phone, entityId, workAuth = null, linkedInUrl = null, hireDate = null) => {
  const names = contractorName.trim().split(' ');
  const firstName = names[0];
  const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Contractor';

  const request = new sql.Request(transaction);
  request.input('email', sql.NVarChar(255), email.trim());

  // Check recruit.CandidateIdentity for email
  const candCheck = await request.query(`
    SELECT CandidateId FROM [recruit].[CandidateIdentity] 
    WHERE IdentityValue = @email AND IdentityType = 'Email' AND IsPrimary = 1
  `);

  let candidateId;
  if (candCheck.recordset.length > 0) {
    candidateId = candCheck.recordset[0].CandidateId;
    
    // Update candidate info
    const candUpdate = new sql.Request(transaction);
    candUpdate.input('cid', sql.Int, candidateId);
    candUpdate.input('workAuth', sql.NVarChar(100), workAuth);
    candUpdate.input('linkedIn', sql.NVarChar(255), linkedInUrl);
    await candUpdate.query(`
      UPDATE [recruit].[Candidate] 
      SET WorkAuthorization = ISNULL(@workAuth, WorkAuthorization),
          LinkedInUrl = ISNULL(@linkedIn, LinkedInUrl),
          ModifiedOn = GETUTCDATE()
      WHERE CandidateId = @cid
    `);
  } else {
    // Create Candidate
    const candInsert = new sql.Request(transaction);
    const candCode = `CAN-${Date.now()}`;
    candInsert.input('code', sql.NVarChar(50), candCode);
    candInsert.input('fname', sql.NVarChar(100), firstName);
    candInsert.input('lname', sql.NVarChar(100), lastName);
    candInsert.input('workAuth', sql.NVarChar(100), workAuth);
    candInsert.input('linkedIn', sql.NVarChar(255), linkedInUrl);
    const candResult = await candInsert.query(`
      INSERT INTO [recruit].[Candidate] (CandidateCode, FirstName, LastName, WorkAuthorization, LinkedInUrl, CreatedOn, ModifiedOn, CandidateStatus)
      OUTPUT INSERTED.CandidateId
      VALUES (@code, @fname, @lname, @workAuth, @linkedIn, GETUTCDATE(), GETUTCDATE(), 'ACTIVE')
    `);
    candidateId = candResult.recordset[0].CandidateId;

    // Create Identity (Email)
    const identInsert = new sql.Request(transaction);
    identInsert.input('cid', sql.Int, candidateId);
    identInsert.input('email', sql.NVarChar(255), email.trim());
    await identInsert.query(`
      INSERT INTO [recruit].[CandidateIdentity] (CandidateId, IdentityType, IdentityValue, IsPrimary)
      VALUES (@cid, 'Email', @email, 1)
    `);

    // Create Identity (Phone)
    if (phone) {
      const phoneInsert = new sql.Request(transaction);
      phoneInsert.input('cid', sql.Int, candidateId);
      phoneInsert.input('phone', sql.NVarChar(20), phone.trim());
      await phoneInsert.query(`
        INSERT INTO [recruit].[CandidateIdentity] (CandidateId, IdentityType, IdentityValue, IsPrimary)
        VALUES (@cid, 'Phone', @phone, 0)
      `);
    }
  }

  // Check hrm.Employee
  const empCheck = new sql.Request(transaction);
  empCheck.input('cid', sql.Int, candidateId);
  empCheck.input('entid', sql.Int, entityId);
  const empResult = await empCheck.query(`
    SELECT EmployeeId FROM [hrm].[Employee] WITH (UPDLOCK, HOLDLOCK)
    WHERE CandidateId = @cid AND EntityId = @entid AND IsDeleted = 0
  `);

  if (empResult.recordset.length > 0) {
    const employeeId = empResult.recordset[0].EmployeeId;
    if (hireDate && !isNaN(new Date(hireDate).getTime())) {
      const empUpdate = new sql.Request(transaction);
      empUpdate.input('eid', sql.Int, employeeId);
      empUpdate.input('hireDate', sql.Date, new Date(hireDate));
      await empUpdate.query(`UPDATE [hrm].[Employee] SET HireDate = @hireDate WHERE EmployeeId = @eid`);
    }
    return employeeId;
  }

  // Create Employee
  const empInsert = new sql.Request(transaction);
  empInsert.input('cid', sql.Int, candidateId);
  empInsert.input('entid', sql.Int, entityId);
  empInsert.input('code', sql.NVarChar(50), `C2C-${Date.now()}`);
  
  // Validate hireDate
  const validHireDate = (hireDate && !isNaN(new Date(hireDate).getTime())) ? new Date(hireDate) : new Date();
  empInsert.input('hireDate', sql.Date, validHireDate);
  const finalEmp = await empInsert.query(`
    INSERT INTO [hrm].[Employee] (CandidateId, EntityId, EmployeeCode, EmployeeType, StartDate, EmploymentStatus, HireDate, CreatedAtUtc, IsDeleted)
    OUTPUT INSERTED.EmployeeId
    VALUES (@cid, @entid, @code, 'C2C', GETUTCDATE(), 'ACTIVE', @hireDate, GETUTCDATE(), 0)
  `);
  return finalEmp.recordset[0].EmployeeId;
};

// Create C2C Contractor
const createC2CContractor = async (req, res) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  
  try {
    const internalEntityId = parseInt(req.params.companyId); 
    const {
      contractorName, companyName, email, phone, streetAddress, apartmentSuite,
      city, state, zipCode, ein, stateOfIncorporation, bankAccountHolder,
      bankAccountNumber, bankRoutingNumber, bankName, paymentMode, paymentTerms,
      poStartDate, poEndDate, billRate, c2cBillRate, clientName,
      implementationPartner, status, notes, hrContacts, onboardingContacts, accountsContacts,
      jobTitle, workAuthorization, linkedInUrl, vendorWebsite, vendorIndustry, hireDate
    } = req.body;

    await transaction.begin();

    // 1. Ensure Vendor Company exists
    const vendorId = await ensureCrmCompany(transaction, companyName, true, false, ein, vendorWebsite, vendorIndustry);

    // 2. Ensure Client Company exists (if provided)
    let clientId = null;
    if (clientName) {
      clientId = await ensureCrmCompany(transaction, clientName, false, true);
    }

    // 3. Ensure Candidate/Employee exists
    const employeeId = await ensureEmployee(transaction, contractorName, email, phone, internalEntityId, workAuthorization, linkedInUrl, hireDate);

    // 4. Create Deployment
    const metadata = {
      vendorId,
      implementationPartner,
      bankDetails: { bankName, bankAccountHolder, bankAccountNumber, bankRoutingNumber, paymentMode, paymentTerms },
      contacts: {
        hr: processContactsArray(hrContacts),
        onboarding: processContactsArray(onboardingContacts),
        accounts: processContactsArray(accountsContacts)
      },
      address: { streetAddress, apartmentSuite, city, state, zipCode },
      stateOfIncorporation,
      c2cBillRate,
      notes,
      vendorWebsite,
      vendorIndustry,
      linkedInUrl,
      workAuthorization,
      jobTitle // Storing for redundancy
    };

    const deployInsert = new sql.Request(transaction);
    deployInsert.input('empId', sql.Int, employeeId);
    deployInsert.input('entId', sql.Int, internalEntityId);
    deployInsert.input('clientId', sql.Int, clientId);
    deployInsert.input('title', sql.NVarChar(255), jobTitle || 'C2C Contractor');
    deployInsert.input('start', sql.DateTime2, new Date(poStartDate));
    deployInsert.input('end', sql.DateTime2, new Date(poEndDate));
    deployInsert.input('rate', sql.Decimal(10, 2), parseFloat(billRate));
    const normalizedStatus = (status && status.toUpperCase() === 'INACTIVE') ? 'INACTIVE' : 'ACTIVE';
    deployInsert.input('status', sql.NVarChar(50), normalizedStatus);
    deployInsert.input('notes', sql.NVarChar(sql.MAX), JSON.stringify(metadata));

    const result = await deployInsert.query(`
      INSERT INTO [hrm].[Deployment] (
        EmployeeId, EntityId, ClientId, PlacedJobTitle, StartDate, EndDate, 
        BillRate, StatusCode, Notes, CreatedAtUtc, IsDeleted
      )
      OUTPUT INSERTED.DeploymentId
      VALUES (@empId, @entId, @clientId, @title, @start, @end, @rate, @status, @notes, GETUTCDATE(), 0)
    `);

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'C2C contractor created successfully',
      data: { id: result.recordset[0].DeploymentId }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error creating C2C:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all C2C contractors for an internal entity
const getCompanyC2Cs = async (req, res) => {
  try {
    const pool = await poolPromise;
    const internalEntityId = parseInt(req.params.companyId);

    const query = `
      SELECT 
        d.DeploymentId as id,
        d.DeploymentId,
        d.EmployeeId,
        d.EntityId as InternalEntityId,
        d.ClientId,
        ISNULL(d.PlacedJobTitle, 'C2C Contractor') as jobTitle,
        d.StartDate as poStartDate,
        d.EndDate as poEndDate,
        d.BillRate as billRate,
        CASE 
          WHEN d.StatusCode = 'ACTIVE' THEN 'Active' 
          WHEN d.StatusCode = 'INACTIVE' THEN 'Inactive' 
          ELSE d.StatusCode 
        END as status,
        d.Notes as metadata,
        c.FirstName + ' ' + c.LastName as contractorName,
        c.WorkAuthorization as workAuthorization,
        c.LinkedInUrl as linkedInUrl,
        ci_email.IdentityValue as email,
        ci_phone.IdentityValue as phone,
        client.CompanyName as clientName,
        vendor.CompanyName as vendorName,
        vendor.CompanyName as companyName,
        vendor.Website as vendorWebsite,
        vendor.IndustryCode as vendorIndustry,
        e.HireDate as hireDate
      FROM [hrm].[Deployment] d
      INNER JOIN [hrm].[Employee] e ON d.EmployeeId = e.EmployeeId
      INNER JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
      LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
      LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
      LEFT JOIN [crm].[Company] client ON d.ClientId = client.CompanyId
      LEFT JOIN [crm].[Company] vendor ON vendor.CompanyId = TRY_CAST(JSON_VALUE(d.Notes, '$.vendorId') AS INT)
      WHERE d.EntityId = @entId AND d.IsDeleted = 0
      ORDER BY d.CreatedAtUtc DESC
    `;

    const result = await pool.request()
      .input('entId', sql.Int, internalEntityId)
      .query(query);

    const processed = result.recordset.map(row => {
      let meta = {};
      try { meta = JSON.parse(row.metadata || '{}'); } catch (e) {}
      
      return {
        ...row,
        ...meta,
        ...meta.bankDetails,
        ...meta.address,
        // Ensure table values take precedence over metadata fallbacks if they exist
        jobTitle: row.jobTitle || meta.jobTitle,
        workAuthorization: row.workAuthorization || meta.workAuthorization,
        linkedInUrl: row.linkedInUrl || meta.linkedInUrl,
        vendorWebsite: row.vendorWebsite || meta.vendorWebsite,
        vendorIndustry: row.vendorIndustry || meta.vendorIndustry,
        hrContacts: meta.contacts?.hr ? JSON.parse(meta.contacts.hr) : [],
        onboardingContacts: meta.contacts?.onboarding ? JSON.parse(meta.contacts.onboarding) : [],
        accountsContacts: meta.contacts?.accounts ? JSON.parse(meta.contacts.accounts) : []
      };
    });

    res.status(200).json({ success: true, data: processed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get specific C2C details
const getC2CDetails = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { contractorId } = req.params;

    const query = `
      SELECT 
        d.DeploymentId as id, d.*,
        c.FirstName + ' ' + c.LastName as contractorName,
        c.WorkAuthorization as workAuthorization,
        c.LinkedInUrl as linkedInUrl,
        ci_email.IdentityValue as email,
        ci_phone.IdentityValue as phone,
        client.CompanyName as clientName,
        vendor.Website as vendorWebsite,
        vendor.IndustryCode as vendorIndustry,
        e.HireDate as hireDate
      FROM [hrm].[Deployment] d
      INNER JOIN [hrm].[Employee] e ON d.EmployeeId = e.EmployeeId
      INNER JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
      LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
      LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
      LEFT JOIN [crm].[Company] client ON d.ClientId = client.CompanyId
      LEFT JOIN [crm].[Company] vendor ON vendor.CompanyId = TRY_CAST(JSON_VALUE(d.Notes, '$.vendorId') AS INT)
      WHERE d.DeploymentId = @id
    `;

    const result = await pool.request()
      .input('id', sql.Int, parseInt(contractorId))
      .query(query);

    if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Not found' });

    const row = result.recordset[0];
    let meta = {};
    try { meta = JSON.parse(row.Notes || '{}'); } catch (e) {}

    const data = {
      ...row,
      ...meta,
      ...meta.bankDetails,
      ...meta.address,
      jobTitle: row.PlacedJobTitle || meta.jobTitle || 'C2C Contractor',
      workAuthorization: row.workAuthorization || meta.workAuthorization,
      linkedInUrl: row.linkedInUrl || meta.linkedInUrl,
      vendorWebsite: row.vendorWebsite || meta.vendorWebsite,
      vendorIndustry: row.vendorIndustry || meta.vendorIndustry,
      poStartDate: row.StartDate,
      poEndDate: row.EndDate,
      billRate: row.BillRate,
      status: row.StatusCode === 'ACTIVE' ? 'Active' : (row.StatusCode === 'INACTIVE' ? 'Inactive' : row.StatusCode),
      hrContacts: meta.contacts?.hr ? JSON.parse(meta.contacts.hr) : [],
      onboardingContacts: meta.contacts?.onboarding ? JSON.parse(meta.contacts.onboarding) : [],
      accountsContacts: meta.contacts?.accounts ? JSON.parse(meta.contacts.accounts) : []
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update C2C Contractor
const updateC2CContractor = async (req, res) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    const { companyId, contractorId } = req.params;
    const {
      contractorName, companyName, email, phone, streetAddress, apartmentSuite,
      city, state, zipCode, ein, stateOfIncorporation, bankAccountHolder,
      bankAccountNumber, bankRoutingNumber, bankName, paymentMode, paymentTerms,
      poStartDate, poEndDate, billRate, c2cBillRate, clientName,
      implementationPartner, status, notes, hrContacts, onboardingContacts, accountsContacts,
      jobTitle, workAuthorization, linkedInUrl, vendorWebsite, vendorIndustry, hireDate
    } = req.body;

    await transaction.begin();

    // Fetch existing data to avoid overwriting with NULL if missing in request
    const existingReq = new sql.Request(transaction);
    existingReq.input('id', sql.Int, contractorId);
    const existingResult = await existingReq.query(`
      SELECT d.PlacedJobTitle, d.Notes, e.HireDate, c.WorkAuthorization, c.LinkedInUrl 
      FROM [hrm].[Deployment] d
      INNER JOIN [hrm].[Employee] e ON d.EmployeeId = e.EmployeeId
      INNER JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
      WHERE d.DeploymentId = @id
    `);
    
    if (existingResult.recordset.length === 0) throw new Error('Deployment not found');
    const existing = existingResult.recordset[0];
    let existingMeta = {};
    try { existingMeta = JSON.parse(existing.Notes || '{}'); } catch (e) {}

    // Use existing values as fallbacks
    const finalJobTitle = jobTitle || existing.PlacedJobTitle || existingMeta.jobTitle || 'C2C Contractor';
    const finalWorkAuth = workAuthorization || existing.WorkAuthorization || existingMeta.workAuthorization;
    const finalLinkedIn = linkedInUrl || existing.LinkedInUrl || existingMeta.linkedInUrl;
    const finalHireDate = hireDate || existing.HireDate;
    const finalVendorWebsite = vendorWebsite || existingMeta.vendorWebsite;
    const finalVendorIndustry = vendorIndustry || existingMeta.vendorIndustry;

    // 1. Ensure Vendor Company exists
    const vendorId = await ensureCrmCompany(transaction, companyName, true, false, ein, finalVendorWebsite, finalVendorIndustry);
    
    let clientId = null;
    if (clientName) clientId = await ensureCrmCompany(transaction, clientName, false, true);

    // 2. Update Employee/Candidate info
    await ensureEmployee(transaction, contractorName, email, phone, parseInt(companyId), finalWorkAuth, finalLinkedIn, finalHireDate);

    const metadata = {
      ...existingMeta, // Preserve existing metadata fields not handled here
      vendorId,
      implementationPartner: implementationPartner !== undefined ? implementationPartner : existingMeta.implementationPartner,
      bankDetails: { 
        bankName: bankName || existingMeta.bankDetails?.bankName, 
        bankAccountHolder: bankAccountHolder || existingMeta.bankDetails?.bankAccountHolder, 
        bankAccountNumber: bankAccountNumber || existingMeta.bankDetails?.bankAccountNumber, 
        bankRoutingNumber: bankRoutingNumber || existingMeta.bankDetails?.bankRoutingNumber, 
        paymentMode: paymentMode || existingMeta.bankDetails?.paymentMode, 
        paymentTerms: paymentTerms || existingMeta.bankDetails?.paymentTerms 
      },
      contacts: {
        hr: hrContacts ? processContactsArray(hrContacts) : existingMeta.contacts?.hr,
        onboarding: onboardingContacts ? processContactsArray(onboardingContacts) : existingMeta.contacts?.onboarding,
        accounts: accountsContacts ? processContactsArray(accountsContacts) : existingMeta.contacts?.accounts
      },
      address: { 
        streetAddress: streetAddress || existingMeta.address?.streetAddress, 
        apartmentSuite: apartmentSuite !== undefined ? apartmentSuite : existingMeta.address?.apartmentSuite, 
        city: city || existingMeta.address?.city, 
        state: state || existingMeta.address?.state, 
        zipCode: zipCode || existingMeta.address?.zipCode 
      },
      stateOfIncorporation: stateOfIncorporation || existingMeta.stateOfIncorporation,
      c2cBillRate: c2cBillRate || existingMeta.c2cBillRate,
      notes: notes !== undefined ? notes : existingMeta.notes,
      vendorWebsite: finalVendorWebsite,
      vendorIndustry: finalVendorIndustry,
      linkedInUrl: finalLinkedIn,
      workAuthorization: finalWorkAuth,
      jobTitle: finalJobTitle
    };

    const updateRequest = new sql.Request(transaction);
    updateRequest.input('id', sql.Int, contractorId);
    updateRequest.input('entId', sql.Int, parseInt(companyId));
    updateRequest.input('clientId', sql.Int, clientId);
    updateRequest.input('title', sql.NVarChar(255), finalJobTitle);
    updateRequest.input('start', sql.DateTime2, poStartDate ? new Date(poStartDate) : undefined);
    updateRequest.input('end', sql.DateTime2, poEndDate ? new Date(poEndDate) : undefined);
    updateRequest.input('rate', sql.Decimal(10, 2), billRate ? parseFloat(billRate) : undefined);
    const normalizedStatus = (status && status.toUpperCase() === 'INACTIVE') ? 'INACTIVE' : 
                             (status && status.toUpperCase() === 'ACTIVE') ? 'ACTIVE' : undefined;
    updateRequest.input('status', sql.NVarChar(50), normalizedStatus);
    updateRequest.input('notes', sql.NVarChar(sql.MAX), JSON.stringify(metadata));

    await updateRequest.query(`
      UPDATE [hrm].[Deployment]
      SET ClientId = ISNULL(@clientId, ClientId), 
          PlacedJobTitle = ISNULL(@title, PlacedJobTitle), 
          StartDate = ISNULL(@start, StartDate), 
          EndDate = ISNULL(@end, EndDate), 
          BillRate = ISNULL(@rate, BillRate), 
          StatusCode = ISNULL(@status, StatusCode), 
          Notes = @notes, 
          UpdatedAtUtc = GETUTCDATE()
      WHERE DeploymentId = @id AND EntityId = @entId
    `);

    await transaction.commit();
    res.status(200).json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error updating C2C:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete C2C Contractor
const deleteC2CContractor = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, contractorId } = req.params;
    await pool.request()
      .input('id', sql.Int, parseInt(contractorId))
      .input('entId', sql.Int, parseInt(companyId))
      .query("UPDATE [hrm].[Deployment] SET IsDeleted = 1, StatusCode = 'INACTIVE', UpdatedAtUtc = GETUTCDATE() WHERE DeploymentId = @id AND EntityId = @entId");
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get C2C statistics
const getC2CStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const internalEntityId = parseInt(req.params.companyId);

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN StatusCode = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN StatusCode = 'INACTIVE' THEN 1 ELSE 0 END) as inactive
      FROM [hrm].[Deployment]
      WHERE EntityId = @entId AND IsDeleted = 0
    `;

    const result = await pool.request()
      .input('entId', sql.Int, internalEntityId)
      .query(query);

    res.status(200).json({ 
      success: true, 
      data: result.recordset[0] || { total: 0, active: 0, inactive: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createC2CContractor,
  getCompanyC2Cs,
  getC2CDetails,
  updateC2CContractor,
  deleteC2CContractor,
  getC2CStats
};