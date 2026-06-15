const { poolPromise, sql } = require("../../config/db");

// Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        id,
        companyName,
        contactPerson,
        email,
        phone,
        status,
        isDirectClient,
        created,
        hrTeam,
        onboardingComplaints,
        accounts,
        createdBy,
        createdAt,
        updatedAt
      FROM VendorManagement 
      ORDER BY companyName
    `);
    
    // Parse JSON strings back to objects
    const vendors = result.recordset.map(vendor => ({
      ...vendor,
      hrTeam: vendor.hrTeam ? JSON.parse(vendor.hrTeam) : [],
      onboardingComplaints: vendor.onboardingComplaints ? JSON.parse(vendor.onboardingComplaints) : [],
      accounts: vendor.accounts ? JSON.parse(vendor.accounts) : []
    }));
    
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Server error while fetching vendors", error });
  }
};

// Get vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          id,
          companyName,
          contactPerson,
          email,
          phone,
          status,
          isDirectClient,
          created,
          hrTeam,
          onboardingComplaints,
          accounts,
          createdBy,
          createdAt,
          updatedAt
        FROM VendorManagement 
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    const vendor = result.recordset[0];
    // Parse JSON strings back to objects
    vendor.hrTeam = vendor.hrTeam ? JSON.parse(vendor.hrTeam) : [];
    vendor.onboardingComplaints = vendor.onboardingComplaints ? JSON.parse(vendor.onboardingComplaints) : [];
    vendor.accounts = vendor.accounts ? JSON.parse(vendor.accounts) : [];
    
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ message: "Server error while fetching vendor", error });
  }
};

// Create new vendor
exports.createVendor = async (req, res) => {
  const {
    companyName,
    contactPerson,
    email,
    phone,
    status,
    isDirectClient,
    hrTeam,
    onboardingComplaints,
    accounts
  } = req.body;
  
  try {
    const pool = await poolPromise;
    const currentUser = req.user?.email || 'system';
    
    // Check if vendor with same email already exists
    const emailCheck = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM VendorManagement WHERE email = @email");
    
    if (emailCheck.recordset.length > 0) {
      return res.status(409).json({ message: "Vendor with this email already exists" });
    }
    
    const result = await pool.request()
      .input("companyName", sql.NVarChar, companyName)
      .input("contactPerson", sql.NVarChar, contactPerson || '')
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone || '')
      .input("status", sql.NVarChar, status || 'ACTIVE')
      .input("isDirectClient", sql.Bit, isDirectClient || false)
      .input("hrTeam", sql.NVarChar, JSON.stringify(hrTeam || []))
      .input("onboardingComplaints", sql.NVarChar, JSON.stringify(onboardingComplaints || []))
      .input("accounts", sql.NVarChar, JSON.stringify(accounts || []))
      .input("createdBy", sql.NVarChar, currentUser)
      .query(`
        INSERT INTO VendorManagement (
          companyName, contactPerson, email, phone, status, 
          isDirectClient, hrTeam, onboardingComplaints, accounts, createdBy
        )
        OUTPUT INSERTED.*
        VALUES (
          @companyName, @contactPerson, @email, @phone, @status,
          @isDirectClient, @hrTeam, @onboardingComplaints, @accounts, @createdBy
        )
      `);
    
    const newVendor = result.recordset[0];
    // Parse JSON strings back to objects
    newVendor.hrTeam = newVendor.hrTeam ? JSON.parse(newVendor.hrTeam) : [];
    newVendor.onboardingComplaints = newVendor.onboardingComplaints ? JSON.parse(newVendor.onboardingComplaints) : [];
    newVendor.accounts = newVendor.accounts ? JSON.parse(newVendor.accounts) : [];
    
    res.status(201).json({ 
      message: "Vendor created successfully", 
      vendor: newVendor 
    });
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({ message: "Server error while creating vendor", error });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  const { id } = req.params;
  const {
    companyName,
    contactPerson,
    email,
    phone,
    status,
    isDirectClient,
    hrTeam,
    onboardingComplaints,
    accounts
  } = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if vendor exists
    const vendorCheck = await pool.request()
      .input('id', sql.Int, id)
      .query("SELECT id FROM VendorManagement WHERE id = @id");
    
    if (vendorCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    // Check if email is already used by another vendor
    const emailCheck = await pool.request()
      .input("id", sql.Int, id)
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM VendorManagement WHERE email = @email AND id != @id");
    
    if (emailCheck.recordset.length > 0) {
      return res.status(409).json({ message: "Vendor with this email already exists" });
    }
    
    await pool.request()
      .input("id", sql.Int, id)
      .input("companyName", sql.NVarChar, companyName)
      .input("contactPerson", sql.NVarChar, contactPerson || '')
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone || '')
      .input("status", sql.NVarChar, status || 'ACTIVE')
      .input("isDirectClient", sql.Bit, isDirectClient || false)
      .input("hrTeam", sql.NVarChar, JSON.stringify(hrTeam || []))
      .input("onboardingComplaints", sql.NVarChar, JSON.stringify(onboardingComplaints || []))
      .input("accounts", sql.NVarChar, JSON.stringify(accounts || []))
      .input("updatedAt", sql.DateTime, new Date())
      .query(`
        UPDATE VendorManagement 
        SET 
          companyName = @companyName,
          contactPerson = @contactPerson,
          email = @email,
          phone = @phone,
          status = @status,
          isDirectClient = @isDirectClient,
          hrTeam = @hrTeam,
          onboardingComplaints = @onboardingComplaints,
          accounts = @accounts,
          updatedAt = @updatedAt
        WHERE id = @id
      `);
    
    res.status(200).json({ message: "Vendor updated successfully" });
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ message: "Server error while updating vendor", error });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Check if vendor exists
    const vendorCheck = await pool.request()
      .input('id', sql.Int, id)
      .query("SELECT id FROM VendorManagement WHERE id = @id");
    
    if (vendorCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    await pool.request()
      .input('id', sql.Int, id)
      .query("DELETE FROM VendorManagement WHERE id = @id");
    
    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ message: "Server error while deleting vendor", error });
  }
};

// Get vendor statistics
exports.getVendorStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const totalResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM VendorManagement
    `);
    
    const activeResult = await pool.request().query(`
      SELECT COUNT(*) as active FROM VendorManagement WHERE status = 'ACTIVE'
    `);
    
    const inactiveResult = await pool.request().query(`
      SELECT COUNT(*) as inactive FROM VendorManagement WHERE status = 'INACTIVE'
    `);
    
    const directClientsResult = await pool.request().query(`
      SELECT COUNT(*) as directClients FROM VendorManagement WHERE isDirectClient = 1
    `);
    
    res.status(200).json({
      totalVendors: totalResult.recordset[0].total,
      activeVendors: activeResult.recordset[0].active,
      inactiveVendors: inactiveResult.recordset[0].inactive,
      directClients: directClientsResult.recordset[0].directClients
    });
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    res.status(500).json({ message: "Server error while fetching vendor stats", error });
  }
};