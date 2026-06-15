const { poolPromise, sql } = require("../../config/db");
const https = require('https');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// ✅ SMTP Email Helper Function (Using SendGrid)
const sendEmailViaSMTP = async (emailData) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 465,
            secure: true, // Use SSL
            auth: {
                user: 'apikey', // SendGrid uses 'apikey' as the username
                pass: process.env.SENDGRID_API_KEY
            }
        });

        const mailOptions = {
            from: `"${process.env.SENDGRID_FROM_NAME || 'Prophecy ERP'}" <${process.env.SENDGRID_FROM_EMAIL}>`,
            to: emailData.to,
            cc: emailData.cc,
            subject: emailData.subject,
            html: emailData.html,
            attachments: []
        };

        // Add the invoice PDF
        if (emailData.pdfBase64) {
            mailOptions.attachments.push({
                filename: emailData.pdfFilename || 'Invoice.pdf',
                content: emailData.pdfBase64,
                encoding: 'base64'
            });
        }

        // Add extra attachments (timesheets, etc.)
        if (emailData.extraAttachments && emailData.extraAttachments.length > 0) {
            emailData.extraAttachments.forEach(att => {
                mailOptions.attachments.push({
                    filename: att.filename,
                    content: att.content,
                    encoding: 'base64',
                    contentType: att.type || 'application/octet-stream'
                });
            });
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent via SMTP:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error in sendEmailViaSMTP:', error);
        return { 
            success: false, 
            error: error.message,
            stack: error.stack,
            code: error.code
        };
    }
};

// Helper to handle transaction
const runInTransaction = async (work) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const result = await work(transaction);
        await transaction.commit();
        return result;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

const createInvoice = async (req, res) => {
    try {
        const pool = await poolPromise;
        console.log('═══════════════════════════════════════');
        console.log('🎯 createInvoice (ERP Module) CALLED');
        console.log('═══════════════════════════════════════');

        let invoiceData = req.body;
        if (req.body.invoiceData && typeof req.body.invoiceData === 'string') {
            invoiceData = JSON.parse(req.body.invoiceData);
        }

        const missingFields = [];
        if (!invoiceData.invoiceNo?.trim()) missingFields.push('invoiceNo');
        if (!invoiceData.companyName?.trim()) missingFields.push('companyName');
        if (!invoiceData.invoiceDate) missingFields.push('invoiceDate');
        if (!invoiceData.dueDate) missingFields.push('dueDate');

        if (missingFields.length > 0) {
            return res.status(400).json({ success: false, message: `Missing fields: ${missingFields.join(', ')}` });
        }

        const result = await runInTransaction(async (transaction) => {
            const invoiceRequest = new sql.Request(transaction);
            const insertInvoiceQuery = `
                INSERT INTO ERP_Invoices (
                    InvoiceNo, InvoiceDate, DueDate, Terms, Currency, CompanyName, Email, Phone, CcEmail,
                    BillingStreet1, BillingStreet2, BillingCity, BillingState, BillingZipCode, BillingCountry,
                    ShippingStreet1, ShippingStreet2, ShippingCity, ShippingState, ShippingZipCode, ShippingCountry, ShippingSameAsBilling,
                    CompanyPan, CompanyGst, CustomerPan, CustomerGst, IgstRate, IgstAmount,
                    BankAccountName, BankName, BankAccountNo, BankBranch, BankIfscCode,
                    NoteToCustomer, MemoOnStatement, Status, Subtotal, TotalAmount
                ) VALUES (
                    @InvoiceNo, @InvoiceDate, @DueDate, @Terms, @Currency, @CompanyName, @Email, @Phone, @CcEmail,
                    @BillingStreet1, @BillingStreet2, @BillingCity, @BillingState, @BillingZipCode, @BillingCountry,
                    @ShippingStreet1, @ShippingStreet2, @ShippingCity, @ShippingState, @ShippingZipCode, @ShippingCountry, @ShippingSameAsBilling,
                    @CompanyPan, @CompanyGst, @CustomerPan, @CustomerGst, @IgstRate, @IgstAmount,
                    @BankAccountName, @BankName, @BankAccountNo, @BankBranch, @BankIfscCode,
                    @NoteToCustomer, @MemoOnStatement, @Status, @Subtotal, @TotalAmount
                );
                SELECT SCOPE_IDENTITY() AS id;
            `;

            invoiceRequest.input('InvoiceNo', sql.NVarChar, invoiceData.invoiceNo);
            invoiceRequest.input('InvoiceDate', sql.Date, new Date(invoiceData.invoiceDate));
            invoiceRequest.input('DueDate', sql.Date, new Date(invoiceData.dueDate));
            invoiceRequest.input('Terms', sql.NVarChar, invoiceData.terms);
            invoiceRequest.input('Currency', sql.NVarChar, invoiceData.currency || 'INR');
            invoiceRequest.input('CompanyName', sql.NVarChar, invoiceData.companyName);
            invoiceRequest.input('Email', sql.NVarChar, invoiceData.email);
            invoiceRequest.input('Phone', sql.NVarChar, invoiceData.phone);
            invoiceRequest.input('CcEmail', sql.NVarChar, invoiceData.ccEmail);
            
            invoiceRequest.input('BillingStreet1', sql.NVarChar, invoiceData.billingAddress?.street1);
            invoiceRequest.input('BillingStreet2', sql.NVarChar, invoiceData.billingAddress?.street2);
            invoiceRequest.input('BillingCity', sql.NVarChar, invoiceData.billingAddress?.city);
            invoiceRequest.input('BillingState', sql.NVarChar, invoiceData.billingAddress?.state);
            invoiceRequest.input('BillingZipCode', sql.NVarChar, invoiceData.billingAddress?.zipCode);
            invoiceRequest.input('BillingCountry', sql.NVarChar, invoiceData.billingAddress?.country);
            
            invoiceRequest.input('ShippingStreet1', sql.NVarChar, invoiceData.shippingAddress?.street1);
            invoiceRequest.input('ShippingStreet2', sql.NVarChar, invoiceData.shippingAddress?.street2);
            invoiceRequest.input('ShippingCity', sql.NVarChar, invoiceData.shippingAddress?.city);
            invoiceRequest.input('ShippingState', sql.NVarChar, invoiceData.shippingAddress?.state);
            invoiceRequest.input('ShippingZipCode', sql.NVarChar, invoiceData.shippingAddress?.zipCode);
            invoiceRequest.input('ShippingCountry', sql.NVarChar, invoiceData.shippingAddress?.country);
            invoiceRequest.input('ShippingSameAsBilling', sql.Bit, invoiceData.shippingAddress?.sameAsBilling ? 1 : 0);
            
            invoiceRequest.input('CompanyPan', sql.NVarChar, invoiceData.companyPan);
            invoiceRequest.input('CompanyGst', sql.NVarChar, invoiceData.companyGst);
            invoiceRequest.input('CustomerPan', sql.NVarChar, invoiceData.customerPan);
            invoiceRequest.input('CustomerGst', sql.NVarChar, invoiceData.customerGst);
            invoiceRequest.input('IgstRate', sql.Decimal(5, 2), invoiceData.igstRate ?? 0);
            invoiceRequest.input('IgstAmount', sql.Decimal(18, 2), invoiceData.igstAmount || 0.00);
            
            invoiceRequest.input('BankAccountName', sql.NVarChar, invoiceData.bankDetails?.accountName);
            invoiceRequest.input('BankName', sql.NVarChar, invoiceData.bankDetails?.bankName);
            invoiceRequest.input('BankAccountNo', sql.NVarChar, invoiceData.bankDetails?.accountNo);
            invoiceRequest.input('BankBranch', sql.NVarChar, invoiceData.bankDetails?.branch);
            invoiceRequest.input('BankIfscCode', sql.NVarChar, invoiceData.bankDetails?.ifscCode);
            
            invoiceRequest.input('NoteToCustomer', sql.NVarChar, invoiceData.noteToCustomer);
            invoiceRequest.input('MemoOnStatement', sql.NVarChar, invoiceData.memoOnStatement);
            invoiceRequest.input('Status', sql.NVarChar, invoiceData.status || 'Draft');
            invoiceRequest.input('Subtotal', sql.Decimal(18, 2), parseFloat(invoiceData.totals?.subtotal || 0));
            invoiceRequest.input('TotalAmount', sql.Decimal(18, 2), parseFloat(invoiceData.totals?.total || 0));

            const invoiceRes = await invoiceRequest.query(insertInvoiceQuery);
            const invoiceId = invoiceRes.recordset[0].id;

            if (invoiceData.items && invoiceData.items.length > 0) {
                for (const item of invoiceData.items) {
                    const itemRequest = new sql.Request(transaction);
                    const insertItemQuery = `
                        INSERT INTO ERP_InvoiceItems (
                            InvoiceId, ProductService, Description, ServiceDate, Qty, Rate, Amount,
                            ProductType, Sku, Category, IncomeAccount, PurchaseFromVendor
                        ) VALUES (
                            @InvoiceId, @ProductService, @Description, @ServiceDate, @Qty, @Rate, @Amount,
                            @ProductType, @Sku, @Category, @IncomeAccount, @PurchaseFromVendor
                        )
                    `;
                    itemRequest.input('InvoiceId', sql.Int, invoiceId);
                    itemRequest.input('ProductService', sql.NVarChar, item.productService);
                    itemRequest.input('Description', sql.NVarChar, item.description);
                    itemRequest.input('ServiceDate', sql.Date, item.serviceDate ? new Date(item.serviceDate) : null);
                    itemRequest.input('Qty', sql.Decimal(18, 2), item.qty || 1);
                    itemRequest.input('Rate', sql.Decimal(18, 2), item.rate || 0);
                    itemRequest.input('Amount', sql.Decimal(18, 2), item.amount || 0);
                    itemRequest.input('ProductType', sql.NVarChar, item.productType);
                    itemRequest.input('Sku', sql.NVarChar, item.sku);
                    itemRequest.input('Category', sql.NVarChar, item.category);
                    itemRequest.input('IncomeAccount', sql.NVarChar, item.incomeAccount);
                    itemRequest.input('PurchaseFromVendor', sql.Bit, item.purchaseFromVendor ? 1 : 0);
                    await itemRequest.query(insertItemQuery);
                }
            }

            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const attachRequest = new sql.Request(transaction);
                    const insertAttachQuery = `
                        INSERT INTO ERP_InvoiceAttachments (InvoiceId, FileName, FileSize, FileType, FilePath) 
                        VALUES (@InvoiceId, @FileName, @FileSize, @FileType, @FilePath)
                    `;
                    attachRequest.input('InvoiceId', sql.Int, invoiceId);
                    attachRequest.input('FileName', sql.NVarChar, file.originalname);
                    attachRequest.input('FileSize', sql.BigInt, file.size);
                    attachRequest.input('FileType', sql.NVarChar, file.mimetype);
                    attachRequest.input('FilePath', sql.NVarChar, file.path);
                    await attachRequest.query(insertAttachQuery);
                }
            }
            return invoiceId;
        });

        res.status(201).json({ success: true, message: 'Invoice created successfully', data: { id: result } });
    } catch (error) {
        console.error('❌ Error in createInvoice:', error);
        res.status(500).json({ success: false, message: 'Error creating invoice', error: error.message });
    }
};

const getInvoices = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM ERP_Invoices ORDER BY CreatedAt DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching invoices', error: error.message });
    }
};

const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const invoiceResult = await pool.request().input('Id', sql.Int, id).query('SELECT * FROM ERP_Invoices WHERE Id = @Id');
        if (invoiceResult.recordset.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
        
        const itemsResult = await pool.request().input('InvoiceId', sql.Int, id).query('SELECT * FROM ERP_InvoiceItems WHERE InvoiceId = @InvoiceId');
        const attachResult = await pool.request().input('InvoiceId', sql.Int, id).query('SELECT * FROM ERP_InvoiceAttachments WHERE InvoiceId = @InvoiceId');
        
        const invoice = invoiceResult.recordset[0];
        const formattedInvoice = {
            id: invoice.Id,
            invoiceNo: invoice.InvoiceNo,
            invoiceDate: invoice.InvoiceDate,
            dueDate: invoice.DueDate,
            terms: invoice.Terms,
            currency: invoice.Currency,
            companyName: invoice.CompanyName,
            email: invoice.Email,
            phone: invoice.Phone,
            ccEmail: invoice.CcEmail,
            billingAddress: {
                street1: invoice.BillingStreet1, street2: invoice.BillingStreet2,
                city: invoice.BillingCity, state: invoice.BillingState,
                zipCode: invoice.BillingZipCode, country: invoice.BillingCountry
            },
            shippingAddress: {
                street1: invoice.ShippingStreet1, street2: invoice.ShippingStreet2,
                city: invoice.ShippingCity, state: invoice.ShippingState,
                zipCode: invoice.ShippingZipCode, country: invoice.ShippingCountry,
                sameAsBilling: invoice.ShippingSameAsBilling
            },
            companyPan: invoice.CompanyPan, companyGst: invoice.CompanyGst,
            customerPan: invoice.CustomerPan, customerGst: invoice.CustomerGst,
            igstRate: invoice.IgstRate, igstAmount: invoice.IgstAmount,
            bankDetails: {
                accountName: invoice.BankAccountName, bankName: invoice.BankName,
                accountNo: invoice.BankAccountNo, branch: invoice.BankBranch,
                ifscCode: invoice.BankIfscCode
            },
            noteToCustomer: invoice.NoteToCustomer, memoOnStatement: invoice.MemoOnStatement,
            status: invoice.Status,
            totals: { subtotal: invoice.Subtotal, total: invoice.TotalAmount, igstRate: invoice.IgstRate, igstAmount: invoice.IgstAmount },
            items: itemsResult.recordset.map(item => ({
                productService: item.ProductService, description: item.Description, serviceDate: item.ServiceDate,
                qty: item.Qty, rate: item.Rate, amount: item.Amount, productType: item.ProductType,
                sku: item.Sku, category: item.Category, incomeAccount: item.IncomeAccount, purchaseFromVendor: item.PurchaseFromVendor
            })),
            timesheets: attachResult.recordset.map(att => ({
                id: att.Id, 
                name: att.FileName, 
                size: att.FileSize, 
                type: att.FileType, 
                path: att.FilePath,
                url: `/uploads/invoice-attachments/${path.basename(att.FilePath)}`
            }))
        };
        res.json({ success: true, data: formattedInvoice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching invoice detail', error: error.message });
    }
};

const sendInvoiceEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { pdfBase64, pdfFilename, extraAttachments } = req.body;
        const pool = await poolPromise;
        console.log('📧 sendInvoiceEmail CALLED, ID:', id);

        // 1. Get full invoice details
        const invoiceResult = await pool.request().input('Id', sql.Int, id).query('SELECT * FROM ERP_Invoices WHERE Id = @Id');
        if (invoiceResult.recordset.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
        const invoice = invoiceResult.recordset[0];

        // 2. Wrap HTML around PDF message
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #019d88; margin: 0;">Invoicing Details</h1>
                    <p style="color: #666; margin: 5px 0;">Invoice #${invoice.InvoiceNo}</p>
                </div>
                
                <p>Dear <strong>${invoice.CompanyName}</strong>,</p>
                <p>Please find the attached invoice PDF and related documents for your records.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Amount Due:</strong> ${invoice.Currency || 'INR'} ${parseFloat(invoice.TotalAmount).toFixed(2)}</p>
                    <p><strong>Due Date:</strong> ${new Date(invoice.DueDate).toLocaleDateString()}</p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                    <p>If you have any questions, please contact us at accounts@prophecytechs.com</p>
                </div>
            </div>
        `;

        // 3. Fetch all attachments stored on server for this invoice
        const attachResult = await pool.request().input('InvoiceId', sql.Int, id).query('SELECT * FROM ERP_InvoiceAttachments WHERE InvoiceId = @InvoiceId');
        const finalExtraAttachments = [...(extraAttachments || [])];

        for (const record of attachResult.recordset) {
            try {
                if (fs.existsSync(record.FilePath)) {
                    const content = fs.readFileSync(record.FilePath).toString('base64');
                    // Avoid duplicating if client already sent it
                    if (!finalExtraAttachments.some(a => a.filename === record.FileName)) {
                        finalExtraAttachments.push({
                            content: content,
                            filename: record.FileName,
                            type: record.FileType || 'application/octet-stream'
                        });
                    }
                }
            } catch (err) {
                console.error(`⚠️ Could not read file ${record.FilePath} for email:`, err);
            }
        }

        // 4. Send Email
        const emailResult = await sendEmailViaSMTP({
            to: invoice.Email,
            cc: invoice.CcEmail,
            subject: `Invoice #${invoice.InvoiceNo} from Prophecy Consulting Inc`,
            html: htmlContent,
            pdfBase64: pdfBase64,
            pdfFilename: pdfFilename || `Invoice-${invoice.InvoiceNo}.pdf`,
            extraAttachments: finalExtraAttachments
        });

        if (emailResult.success) {
            // 4. Update Status to 'Sent'
            await pool.request().input('Id', sql.Int, id).query("UPDATE ERP_Invoices SET Status = 'Sent', UpdatedAt = GETDATE() WHERE Id = @Id");
            res.json({ success: true, message: 'Email sent successfully via Gmail and status updated' });
        } else {
            console.error('❌ SMTP Error DETAILS:', emailResult.error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send email via SMTP', 
                error: emailResult.error,
                details: emailResult.error // Add this to the response so the frontend can see it
            });
        }
    } catch (error) {
        console.error('❌ Error sending invoice email:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const updateInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const pool = await poolPromise;
        console.log('🎯 updateInvoiceStatus CALLED, ID:', id, 'New Status:', status);

        const result = await pool.request()
            .input('Id', sql.Int, id)
            .input('Status', sql.NVarChar, status)
            .query("UPDATE ERP_Invoices SET Status = @Status, UpdatedAt = GETDATE() WHERE Id = @Id");

        if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('❌ Error updating invoice status:', error);
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        let invoiceData = req.body;
        if (req.body.invoiceData && typeof req.body.invoiceData === 'string') {
            invoiceData = JSON.parse(req.body.invoiceData);
        }
        
        await runInTransaction(async (transaction) => {
            const updateRequest = new sql.Request(transaction);
            const updateQuery = `
                UPDATE ERP_Invoices SET
                    InvoiceNo = @InvoiceNo, InvoiceDate = @InvoiceDate, DueDate = @DueDate, Terms = @Terms, Currency = @Currency, 
                    CompanyName = @CompanyName, Email = @Email, Phone = @Phone, CcEmail = @CcEmail,
                    BillingStreet1 = @BillingStreet1, BillingStreet2 = @BillingStreet2, BillingCity = @BillingCity, 
                    BillingState = @BillingState, BillingZipCode = @BillingZipCode, BillingCountry = @BillingCountry,
                    ShippingStreet1 = @ShippingStreet1, ShippingStreet2 = @ShippingStreet2, ShippingCity = @ShippingCity, 
                    ShippingState = @ShippingState, ShippingZipCode = @ShippingZipCode, ShippingCountry = @ShippingCountry, 
                    ShippingSameAsBilling = @ShippingSameAsBilling,
                    CompanyPan = @CompanyPan, CompanyGst = @CompanyGst, CustomerPan = @CustomerPan, CustomerGst = @CustomerGst, 
                    IgstRate = @IgstRate, IgstAmount = @IgstAmount,
                    BankAccountName = @BankAccountName, BankName = @BankName, BankAccountNo = @BankAccountNo, 
                    BankBranch = @BankBranch, BankIfscCode = @BankIfscCode,
                    NoteToCustomer = @NoteToCustomer, MemoOnStatement = @MemoOnStatement, Status = @Status, 
                    Subtotal = @Subtotal, TotalAmount = @TotalAmount,
                    UpdatedAt = GETDATE()
                WHERE Id = @Id
            `;
            updateRequest.input('Id', sql.Int, id);
            updateRequest.input('InvoiceNo', sql.NVarChar, invoiceData.invoiceNo);
            updateRequest.input('InvoiceDate', sql.Date, new Date(invoiceData.invoiceDate));
            updateRequest.input('DueDate', sql.Date, new Date(invoiceData.dueDate));
            updateRequest.input('Terms', sql.NVarChar, invoiceData.terms);
            updateRequest.input('Currency', sql.NVarChar, invoiceData.currency || 'INR');
            updateRequest.input('CompanyName', sql.NVarChar, invoiceData.companyName);
            updateRequest.input('Email', sql.NVarChar, invoiceData.email);
            updateRequest.input('Phone', sql.NVarChar, invoiceData.phone);
            updateRequest.input('CcEmail', sql.NVarChar, invoiceData.ccEmail);
            updateRequest.input('BillingStreet1', sql.NVarChar, invoiceData.billingAddress?.street1);
            updateRequest.input('BillingStreet2', sql.NVarChar, invoiceData.billingAddress?.street2);
            updateRequest.input('BillingCity', sql.NVarChar, invoiceData.billingAddress?.city);
            updateRequest.input('BillingState', sql.NVarChar, invoiceData.billingAddress?.state);
            updateRequest.input('BillingZipCode', sql.NVarChar, invoiceData.billingAddress?.zipCode);
            updateRequest.input('BillingCountry', sql.NVarChar, invoiceData.billingAddress?.country);
            updateRequest.input('ShippingStreet1', sql.NVarChar, invoiceData.shippingAddress?.street1);
            updateRequest.input('ShippingStreet2', sql.NVarChar, invoiceData.shippingAddress?.street2);
            updateRequest.input('ShippingCity', sql.NVarChar, invoiceData.shippingAddress?.city);
            updateRequest.input('ShippingState', sql.NVarChar, invoiceData.shippingAddress?.state);
            updateRequest.input('ShippingZipCode', sql.NVarChar, invoiceData.shippingAddress?.zipCode);
            updateRequest.input('ShippingCountry', sql.NVarChar, invoiceData.shippingAddress?.country);
            updateRequest.input('ShippingSameAsBilling', sql.Bit, invoiceData.shippingAddress?.sameAsBilling ? 1 : 0);
            updateRequest.input('CompanyPan', sql.NVarChar, invoiceData.companyPan);
            updateRequest.input('CompanyGst', sql.NVarChar, invoiceData.companyGst);
            updateRequest.input('CustomerPan', sql.NVarChar, invoiceData.customerPan);
            updateRequest.input('CustomerGst', sql.NVarChar, invoiceData.customerGst);
            updateRequest.input('IgstRate', sql.Decimal(5, 2), invoiceData.igstRate ?? 0);
            updateRequest.input('IgstAmount', sql.Decimal(18, 2), invoiceData.igstAmount || 0.00);
            updateRequest.input('BankAccountName', sql.NVarChar, invoiceData.bankDetails?.accountName);
            updateRequest.input('BankName', sql.NVarChar, invoiceData.bankDetails?.bankName);
            updateRequest.input('BankAccountNo', sql.NVarChar, invoiceData.bankDetails?.accountNo);
            updateRequest.input('BankBranch', sql.NVarChar, invoiceData.bankDetails?.branch);
            updateRequest.input('BankIfscCode', sql.NVarChar, invoiceData.bankDetails?.ifscCode);
            updateRequest.input('NoteToCustomer', sql.NVarChar, invoiceData.noteToCustomer);
            updateRequest.input('MemoOnStatement', sql.NVarChar, invoiceData.memoOnStatement);
            updateRequest.input('Status', sql.NVarChar, invoiceData.status);
            updateRequest.input('Subtotal', sql.Decimal(18, 2), parseFloat(invoiceData.totals?.subtotal || 0));
            updateRequest.input('TotalAmount', sql.Decimal(18, 2), parseFloat(invoiceData.totals?.total || 0));
            await updateRequest.query(updateQuery);

            const deleteItemsRequest = new sql.Request(transaction);
            await deleteItemsRequest.input('InvoiceId', sql.Int, id).query('DELETE FROM ERP_InvoiceItems WHERE InvoiceId = @InvoiceId');
            if (invoiceData.items && invoiceData.items.length > 0) {
                for (const item of invoiceData.items) {
                    const itemRequest = new sql.Request(transaction);
                    const insertItemQuery = `
                        INSERT INTO ERP_InvoiceItems (InvoiceId, ProductService, Description, ServiceDate, Qty, Rate, Amount, ProductType, Sku, Category, IncomeAccount, PurchaseFromVendor)
                        VALUES (@InvoiceId, @ProductService, @Description, @ServiceDate, @Qty, @Rate, @Amount, @ProductType, @Sku, @Category, @IncomeAccount, @PurchaseFromVendor)
                    `;
                    itemRequest.input('InvoiceId', sql.Int, id);
                    itemRequest.input('ProductService', sql.NVarChar, item.productService);
                    itemRequest.input('Description', sql.NVarChar, item.description);
                    itemRequest.input('ServiceDate', sql.Date, item.serviceDate ? new Date(item.serviceDate) : null);
                    itemRequest.input('Qty', sql.Decimal(18, 2), item.qty || 1);
                    itemRequest.input('Rate', sql.Decimal(18, 2), item.rate || 0);
                    itemRequest.input('Amount', sql.Decimal(18, 2), item.amount || 0);
                    itemRequest.input('ProductType', sql.NVarChar, item.productType);
                    itemRequest.input('Sku', sql.NVarChar, item.sku);
                    itemRequest.input('Category', sql.NVarChar, item.category);
                    itemRequest.input('IncomeAccount', sql.NVarChar, item.incomeAccount);
                    itemRequest.input('PurchaseFromVendor', sql.Bit, item.purchaseFromVendor ? 1 : 0);
                    await itemRequest.query(insertItemQuery);
                }
            }
            
            // Handle attachments - only add new ones, don't delete existing ones
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    // Check if this file already exists in database
                    const existingCheck = await new sql.Request(transaction)
                        .input('InvoiceId', sql.Int, id)
                        .input('FileName', sql.NVarChar, file.originalname)
                        .query('SELECT Id FROM ERP_InvoiceAttachments WHERE InvoiceId = @InvoiceId AND FileName = @FileName');
                    
                    if (existingCheck.recordset.length === 0) {
                        const attachRequest = new sql.Request(transaction);
                        const insertAttachQuery = `
                            INSERT INTO ERP_InvoiceAttachments (InvoiceId, FileName, FileSize, FileType, FilePath) 
                            VALUES (@InvoiceId, @FileName, @FileSize, @FileType, @FilePath)
                        `;
                        attachRequest.input('InvoiceId', sql.Int, id);
                        attachRequest.input('FileName', sql.NVarChar, file.originalname);
                        attachRequest.input('FileSize', sql.BigInt, file.size);
                        attachRequest.input('FileType', sql.NVarChar, file.mimetype);
                        attachRequest.input('FilePath', sql.NVarChar, file.path);
                        await attachRequest.query(insertAttachQuery);
                    }
                }
            }
        });
        res.json({ success: true, message: 'Invoice updated successfully' });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ success: false, message: 'Error updating invoice', error: error.message });
    }
};

const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // First get all attachments to delete files from disk
        const attachments = await pool.request()
            .input('InvoiceId', sql.Int, id)
            .query('SELECT FilePath FROM ERP_InvoiceAttachments WHERE InvoiceId = @InvoiceId');
        
        // Delete files from disk
        for (const att of attachments.recordset) {
            if (att.FilePath && fs.existsSync(att.FilePath)) {
                fs.unlinkSync(att.FilePath);
            }
        }
        
        // Delete invoice (cascade will delete items and attachments)
        const result = await pool.request().input('Id', sql.Int, id).query('DELETE FROM ERP_Invoices WHERE Id = @Id');
        if (result.rowsAffected[0] === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ success: false, message: 'Error deleting invoice', error: error.message });
    }
};

const deleteInvoiceAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;
        const pool = await poolPromise;
        
        // First get the file path to delete from disk
        const attachmentResult = await pool.request()
            .input('Id', sql.Int, attachmentId)
            .input('InvoiceId', sql.Int, id)
            .query('SELECT FilePath FROM ERP_InvoiceAttachments WHERE Id = @Id AND InvoiceId = @InvoiceId');
        
        if (attachmentResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Attachment not found' });
        }
        
        const filePath = attachmentResult.recordset[0].FilePath;
        
        // Delete from database
        await pool.request()
            .input('Id', sql.Int, attachmentId)
            .query('DELETE FROM ERP_InvoiceAttachments WHERE Id = @Id');
        
        // Delete file from disk if exists
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        res.json({ success: true, message: 'Attachment deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting attachment:', error);
        res.status(500).json({ success: false, message: 'Error deleting attachment', error: error.message });
    }
};

const getNextInvoiceNumber = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Fetch the most recent invoice number
        const result = await pool.request().query("SELECT TOP 1 InvoiceNo FROM ERP_Invoices WHERE InvoiceNo LIKE 'INV-%' ORDER BY Id DESC");
        
        let nextNo = 'INV-0001';
        if (result.recordset.length > 0) {
            const lastNo = result.recordset[0].InvoiceNo;
            // Attempt to parse numeric part: INV-0001 -> 1
            const match = lastNo.match(/INV-(\d+)/);
            if (match) {
                const lastNum = parseInt(match[1]);
                nextNo = `INV-${(lastNum + 1).toString().padStart(4, '0')}`;
            } else {
                // If it doesn't match the pattern (e.g., from the old random generator), 
                // just start/continue with a standard format
                nextNo = 'INV-0001';
            }
        }
        res.json({ success: true, nextInvoiceNo: nextNo });
    } catch (error) {
        console.error('❌ Error in getNextInvoiceNumber:', error);
        res.status(500).json({ success: false, message: 'Error generating next invoice number' });
    }
};

const getInvoiceMetadata = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // 1. Fetch Unique Customers (using latest record for each company to get addresses/details)
        const customersResult = await pool.request().query(`
            SELECT DISTINCT 
                CompanyName, Email, Phone, CcEmail, 
                BillingStreet1, BillingStreet2, BillingCity, BillingState, BillingZipCode, BillingCountry,
                ShippingStreet1, ShippingStreet2, ShippingCity, ShippingState, ShippingZipCode, ShippingCountry, ShippingSameAsBilling,
                CompanyPan, CompanyGst, CustomerPan, CustomerGst,
                BankAccountName, BankName, BankAccountNo, BankBranch, BankIfscCode
            FROM ERP_Invoices 
            WHERE CompanyName IS NOT NULL AND CompanyName != ''
            AND Id IN (SELECT MAX(Id) FROM ERP_Invoices GROUP BY CompanyName)
            ORDER BY CompanyName
        `);
        
        // 2. Fetch Unique Products (using latest record for each ProductService)
        const productsResult = await pool.request().query(`
            SELECT DISTINCT 
                ProductService, Description, Rate, Qty, ServiceDate, ProductType, Sku, Category, IncomeAccount, PurchaseFromVendor
            FROM ERP_InvoiceItems 
            WHERE ProductService IS NOT NULL AND ProductService != ''
            AND Id IN (SELECT MAX(Id) FROM ERP_InvoiceItems GROUP BY ProductService)
            ORDER BY ProductService
        `);
        
        res.json({ 
            success: true, 
            customers: customersResult.recordset.map(c => ({
                name: c.CompanyName, email: c.Email, phone: c.Phone, ccEmail: c.CcEmail,
                companyPan: c.CompanyPan, companyGst: c.CompanyGst, customerPan: c.CustomerPan, customerGst: c.CustomerGst,
                billingAddress: {
                    street1: c.BillingStreet1, street2: c.BillingStreet2, city: c.BillingCity, 
                    state: c.BillingState, zipCode: c.BillingZipCode, country: c.BillingCountry
                },
                shippingAddress: {
                    street1: c.ShippingStreet1, street2: c.ShippingStreet2, city: c.ShippingCity, 
                    state: c.ShippingState, zipCode: c.ShippingZipCode, country: c.ShippingCountry, 
                    sameAsBilling: c.ShippingSameAsBilling
                },
                bankDetails: {
                    accountName: c.BankAccountName, bankName: c.BankName, accountNo: c.BankAccountNo,
                    branch: c.BankBranch, ifscCode: c.BankIfscCode
                }
            })),
            products: productsResult.recordset.map(p => ({
                name: p.ProductService, description: p.Description, rate: p.Rate,
                qty: p.Qty, serviceDate: p.ServiceDate,
                type: p.ProductType, sku: p.Sku, category: p.Category,
                incomeAccount: p.IncomeAccount, purchaseFromVendor: p.PurchaseFromVendor
            }))
        });
    } catch (error) {
        console.error('❌ Error in getInvoiceMetadata:', error);
        res.status(500).json({ success: false, message: 'Error fetching metadata' });
    }
};

module.exports = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    updateInvoiceStatus,
    sendInvoiceEmail,
    deleteInvoice,
    deleteInvoiceAttachment,
    getNextInvoiceNumber,
    getInvoiceMetadata
};