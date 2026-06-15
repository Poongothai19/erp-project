// controllers/invoiceController.js - Complete Invoice Management Controller
const { poolPromise, sql } = require("../../config/db");

// Create Invoice for a company
const createInvoice = async (req, res) => {
  try {
    const pool = await poolPromise;
    const companyId = req.params.companyId;
    
    console.log('═══════════════════════════════════════');
    console.log('🎯 createInvoice CALLED');
    console.log('═══════════════════════════════════════');
    console.log('Company ID:', companyId);
    console.log('User ID:', req.user?.id);
    console.log('Timestamp:', new Date().toISOString());

    const {
      invoiceNumber,
      contractorId,
      contractorName,
      companyName,
      email,
      amount,
      issueDate,
      dueDate,
      description,
      paymentTerms,
      status,
      notes
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!invoiceNumber?.trim()) missingFields.push('invoiceNumber');
    if (!contractorId) missingFields.push('contractorId');
    if (!contractorName?.trim()) missingFields.push('contractorName');
    if (!amount || parseFloat(amount) <= 0) missingFields.push('amount');
    if (!issueDate) missingFields.push('issueDate');
    if (!dueDate) missingFields.push('dueDate');
    if (!description?.trim()) missingFields.push('description');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    console.log('✅ Validation passed');
    console.log('📝 Creating invoice with data:', {
      invoiceNumber,
      contractorName,
      amount,
      status
    });

    // Check if invoice number already exists
    const checkInvoiceQuery = `
      SELECT Id FROM Invoices WHERE InvoiceNumber = @invoiceNumber
    `;
    
    const existingInvoice = await pool.request()
      .input('invoiceNumber', sql.NVarChar, invoiceNumber.trim())
      .query(checkInvoiceQuery);

    if (existingInvoice.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists'
      });
    }

    const insertQuery = `
      INSERT INTO Invoices (
        CompanyId,
        InvoiceNumber,
        ContractorId,
        ContractorName,
        CompanyName,
        Email,
        Amount,
        IssueDate,
        DueDate,
        Description,
        PaymentTerms,
        Status,
        Notes,
        CreatedAt,
        UpdatedAt
      ) VALUES (
        @companyId,
        @invoiceNumber,
        @contractorId,
        @contractorName,
        @companyName,
        @email,
        @amount,
        @issueDate,
        @dueDate,
        @description,
        @paymentTerms,
        @status,
        @notes,
        GETDATE(),
        GETDATE()
      )
      SELECT SCOPE_IDENTITY() as Id
    `;

    const result = await pool.request()
      .input('companyId', sql.Int, parseInt(companyId))
      .input('invoiceNumber', sql.NVarChar, invoiceNumber.trim())
      .input('contractorId', sql.Int, parseInt(contractorId))
      .input('contractorName', sql.NVarChar, contractorName.trim())
      .input('companyName', sql.NVarChar, companyName?.trim() || '')
      .input('email', sql.NVarChar, email?.trim() || '')
      .input('amount', sql.Decimal(10, 2), parseFloat(amount))
      .input('issueDate', sql.DateTime, new Date(issueDate))
      .input('dueDate', sql.DateTime, new Date(dueDate))
      .input('description', sql.NVarChar, description.trim())
      .input('paymentTerms', sql.NVarChar, paymentTerms || 'Net 30')
      .input('status', sql.NVarChar, status || 'Draft')
      .input('notes', sql.NVarChar, notes?.trim() || '')
      .query(insertQuery);

    const invoiceId = result.recordset[0].Id;

    console.log('✅ Invoice created successfully');
    console.log('📊 New Invoice ID:', invoiceId);
    console.log('═══════════════════════════════════════\n');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        id: invoiceId,
        invoiceNumber,
        contractorName,
        amount,
        status
      }
    });
  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ ERROR CREATING INVOICE');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════\n');

    res.status(500).json({
      success: false,
      message: 'Server error while creating invoice',
      error: error.message
    });
  }
};

// Get all Invoices for a company
const getCompanyInvoices = async (req, res) => {
  try {
    const pool = await poolPromise;
    const companyId = req.params.companyId;

    console.log('═══════════════════════════════════════');
    console.log('🎯 getCompanyInvoices CALLED');
    console.log('═══════════════════════════════════════');
    console.log('Company ID:', companyId);
    console.log('Timestamp:', new Date().toISOString());

    const query = `
      SELECT 
        Id,
        CompanyId,
        InvoiceNumber,
        ContractorId,
        ContractorName,
        CompanyName,
        Email,
        Amount,
        IssueDate,
        DueDate,
        Description,
        PaymentTerms,
        Status,
        Notes,
        CreatedAt,
        UpdatedAt
      FROM Invoices
      WHERE CompanyId = @companyId
      ORDER BY CreatedAt DESC
    `;

    console.log('📝 Executing SQL Query...');

    const result = await pool.request()
      .input('companyId', sql.Int, parseInt(companyId))
      .query(query);

    console.log('✅ Query executed successfully');
    console.log('📊 Records found:', result.recordset.length);

    if (result.recordset.length > 0) {
      console.log('📋 First record sample:', JSON.stringify(result.recordset[0], null, 2));
      console.log('📊 Status breakdown:');
      const statusCounts = result.recordset.reduce((acc, record) => {
        acc[record.Status] = (acc[record.Status] || 0) + 1;
        return acc;
      }, {});
      console.log('   ', statusCounts);
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ RETURNING INVOICES');
    console.log('═══════════════════════════════════════\n');

    res.status(200).json({
      success: true,
      data: result.recordset,
      count: result.recordset.length,
      companyId: parseInt(companyId)
    });
  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ ERROR FETCHING INVOICES');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════\n');

    res.status(500).json({
      success: false,
      message: 'Server error while fetching invoices',
      error: error.message
    });
  }
};

// Get specific Invoice details
const getInvoiceDetails = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, invoiceId } = req.params;

    console.log('📋 Getting invoice details:', { companyId, invoiceId });

    const query = `
      SELECT 
        Id,
        CompanyId,
        InvoiceNumber,
        ContractorId,
        ContractorName,
        CompanyName,
        Email,
        Amount,
        IssueDate,
        DueDate,
        Description,
        PaymentTerms,
        Status,
        Notes,
        CreatedAt,
        UpdatedAt
      FROM Invoices
      WHERE Id = @invoiceId AND CompanyId = @companyId
    `;

    const result = await pool.request()
      .input('invoiceId', sql.Int, parseInt(invoiceId))
      .input('companyId', sql.Int, parseInt(companyId))
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    console.log('✅ Invoice details retrieved');

    res.status(200).json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching invoice details',
      error: error.message
    });
  }
};

// Update Invoice
const updateInvoice = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, invoiceId } = req.params;

    console.log('🔄 Updating invoice:', { companyId, invoiceId });

    const {
      invoiceNumber,
      contractorId,
      contractorName,
      companyName,
      email,
      amount,
      issueDate,
      dueDate,
      description,
      paymentTerms,
      status,
      notes
    } = req.body;

    // Verify invoice exists and belongs to company
    const checkQuery = `
      SELECT Id FROM Invoices 
      WHERE Id = @invoiceId AND CompanyId = @companyId
    `;

    const checkResult = await pool.request()
      .input('invoiceId', sql.Int, parseInt(invoiceId))
      .input('companyId', sql.Int, parseInt(companyId))
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found for this company'
      });
    }

    console.log('✅ Invoice verified');

    // Check if invoice number already exists (excluding current invoice)
    if (invoiceNumber) {
      const checkInvoiceQuery = `
        SELECT Id FROM Invoices 
        WHERE InvoiceNumber = @invoiceNumber AND Id != @invoiceId
      `;
      
      const existingInvoice = await pool.request()
        .input('invoiceNumber', sql.NVarChar, invoiceNumber.trim())
        .input('invoiceId', sql.Int, parseInt(invoiceId))
        .query(checkInvoiceQuery);

      if (existingInvoice.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invoice number already exists'
        });
      }
    }

    const updateQuery = `
      UPDATE Invoices
      SET 
        InvoiceNumber = @invoiceNumber,
        ContractorId = @contractorId,
        ContractorName = @contractorName,
        CompanyName = @companyName,
        Email = @email,
        Amount = @amount,
        IssueDate = @issueDate,
        DueDate = @dueDate,
        Description = @description,
        PaymentTerms = @paymentTerms,
        Status = @status,
        Notes = @notes,
        UpdatedAt = GETDATE()
      WHERE Id = @invoiceId AND CompanyId = @companyId
    `;

    await pool.request()
      .input('invoiceId', sql.Int, parseInt(invoiceId))
      .input('companyId', sql.Int, parseInt(companyId))
      .input('invoiceNumber', sql.NVarChar, invoiceNumber.trim())
      .input('contractorId', sql.Int, parseInt(contractorId))
      .input('contractorName', sql.NVarChar, contractorName.trim())
      .input('companyName', sql.NVarChar, companyName?.trim() || '')
      .input('email', sql.NVarChar, email?.trim() || '')
      .input('amount', sql.Decimal(10, 2), parseFloat(amount))
      .input('issueDate', sql.DateTime, new Date(issueDate))
      .input('dueDate', sql.DateTime, new Date(dueDate))
      .input('description', sql.NVarChar, description.trim())
      .input('paymentTerms', sql.NVarChar, paymentTerms || 'Net 30')
      .input('status', sql.NVarChar, status || 'Draft')
      .input('notes', sql.NVarChar, notes?.trim() || '')
      .query(updateQuery);

    console.log('✅ Invoice updated successfully');

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating invoice',
      error: error.message
    });
  }
};

// Delete Invoice
const deleteInvoice = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, invoiceId } = req.params;

    console.log('🗑️ Deleting invoice:', { companyId, invoiceId });

    // Verify invoice exists and belongs to company
    const checkQuery = `
      SELECT Id, InvoiceNumber FROM Invoices 
      WHERE Id = @invoiceId AND CompanyId = @companyId
    `;

    const checkResult = await pool.request()
      .input('invoiceId', sql.Int, parseInt(invoiceId))
      .input('companyId', sql.Int, parseInt(companyId))
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found for this company'
      });
    }

    const invoiceNumber = checkResult.recordset[0].InvoiceNumber;
    console.log('✅ Invoice verified:', invoiceNumber);

    // Delete invoice
    const deleteQuery = `
      DELETE FROM Invoices 
      WHERE Id = @invoiceId AND CompanyId = @companyId
    `;

    await pool.request()
      .input('invoiceId', sql.Int, parseInt(invoiceId))
      .input('companyId', sql.Int, parseInt(companyId))
      .query(deleteQuery);

    console.log('✅ Invoice deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting invoice',
      error: error.message
    });
  }
};

// Get Invoice Statistics for a company
const getInvoiceStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const companyId = req.params.companyId;

    console.log('📊 Getting invoice statistics for company:', companyId);

    const query = `
      SELECT 
        COUNT(*) as totalInvoices,
        SUM(CASE WHEN Status = 'Draft' THEN 1 ELSE 0 END) as draftCount,
        SUM(CASE WHEN Status = 'Sent' THEN 1 ELSE 0 END) as sentCount,
        SUM(CASE WHEN Status = 'Paid' THEN 1 ELSE 0 END) as paidCount,
        SUM(CASE WHEN Status = 'Overdue' THEN 1 ELSE 0 END) as overdueCount,
        SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END) as cancelledCount,
        SUM(Amount) as totalAmount,
        AVG(Amount) as averageAmount,
        MIN(Amount) as minAmount,
        MAX(Amount) as maxAmount,
        SUM(CASE WHEN Status = 'Paid' THEN Amount ELSE 0 END) as paidAmount,
        SUM(CASE WHEN Status IN ('Sent', 'Overdue') THEN Amount ELSE 0 END) as outstandingAmount
      FROM Invoices
      WHERE CompanyId = @companyId
    `;

    const result = await pool.request()
      .input('companyId', sql.Int, parseInt(companyId))
      .query(query);

    const stats = result.recordset[0] || {
      totalInvoices: 0,
      draftCount: 0,
      sentCount: 0,
      paidCount: 0,
      overdueCount: 0,
      cancelledCount: 0,
      totalAmount: 0,
      averageAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0
    };

    console.log('✅ Invoice stats retrieved:', stats);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching invoice statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching invoice statistics',
      error: error.message
    });
  }
};

// Update invoice status
const updateInvoiceStatus = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, invoiceId } = req.params;
    const { status } = req.body;

    console.log('🔄 Updating invoice status:', { companyId, invoiceId, status });

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const updateQuery = `
      UPDATE Invoices
      SET 
        Status = @status,
        UpdatedAt = GETDATE()
      WHERE Id = @invoiceId AND CompanyId = @companyId
    `;

    const result = await pool.request()
      .input('invoiceId', sql.Int, parseInt(invoiceId))
      .input('companyId', sql.Int, parseInt(companyId))
      .input('status', sql.NVarChar, status)
      .query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    console.log('✅ Invoice status updated successfully');

    res.status(200).json({
      success: true,
      message: 'Invoice status updated successfully'
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating invoice status',
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  createInvoice,
  getCompanyInvoices,
  getInvoiceDetails,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  updateInvoiceStatus
};