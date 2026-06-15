const sql = require('mssql');
const { dbConfig } = require('../../config/db');

const onboardingCompanyController = {
  // Get all companies for onboarding
  getAllCompanies: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      
      const result = await sql.query(`
        SELECT 
          Id, 
          Name, 
          ClientId,
          Address,
          Type,
          AccountManager,
          Employees,
          Status,
          CreatedAt,
          UpdatedAt,
          Logo
        FROM Companies 
        WHERE Status = 'Active'
        ORDER BY Name
      `);
      
      const companies = result.recordset.map(company => ({
        id: company.Id,
        name: company.Name,
        clientId: company.ClientId,
        address: company.Address,
        type: company.Type,
        accountManager: company.AccountManager,
        employees: company.Employees || 0,
        status: company.Status,
        createdAt: company.CreatedAt,
        updatedAt: company.UpdatedAt,
        logoPath: company.Logo
      }));
      
      res.json({
        success: true,
        data: companies
      });
    } catch (error) {
      console.error('Error getting companies:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving companies: ' + error.message 
      });
    }
  },

  // Get company logo
  getCompanyLogo: async (req, res) => {
    try {
      const { id } = req.params;
      await sql.connect(dbConfig);
      
      const result = await sql.query(`
        SELECT Logo FROM Companies WHERE Id = ${id}
      `);

      if (result.recordset.length === 0 || !result.recordset[0].Logo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Logo not found' 
        });
      }

      res.set('Content-Type', 'image/png');
      res.send(result.recordset[0].Logo);
    } catch (error) {
      console.error('Error getting logo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving logo: ' + error.message 
      });
    }
  },

  // Get company by ID
  getCompanyById: async (req, res) => {
    try {
      const { id } = req.params;
      await sql.connect(dbConfig);
      
      const result = await sql.query(`
        SELECT 
          Id, 
          Name, 
          ClientId,
          Address,
          Type,
          AccountManager,
          Employees,
          Status,
          CreatedAt,
          UpdatedAt,
          Logo
        FROM Companies 
        WHERE Id = ${id}
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found' 
        });
      }

      const company = result.recordset[0];
      
      res.json({
        success: true,
        data: {
          id: company.Id,
          name: company.Name,
          clientId: company.ClientId,
          address: company.Address,
          type: company.Type,
          accountManager: company.AccountManager,
          employees: company.Employees || 0,
          status: company.Status,
          createdAt: company.CreatedAt,
          updatedAt: company.UpdatedAt,
          logoPath: company.Logo
        }
      });
    } catch (error) {
      console.error('Error getting company:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving company: ' + error.message 
      });
    }
  }
};

module.exports = onboardingCompanyController