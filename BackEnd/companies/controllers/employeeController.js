// const sql = require('mssql');
// const { dbConfig, poolPromise } = require('../../config/db');
// const bcrypt = require('bcrypt');
// const fs = require('fs');
// const https = require('https');
// const xlsx = require('xlsx');
// const csv = require('csv-parser');
// const path = require('path');

// const parseDate = (dateValue) => {
//   if (!dateValue) return new Date().toISOString().split('T')[0];

//   try {
//     // Handle Excel serial dates
//     if (typeof dateValue === 'number') {
//       const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
//       return excelDate.toISOString().split('T')[0];
//     }

//     // Handle string dates
//     if (typeof dateValue === 'string') {
//       const trimmed = dateValue.trim();
      
//       // YYYY-MM-DD
//       if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
//         return trimmed;
//       }
      
//       // MM/DD/YYYY
//       if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
//         const [month, day, year] = trimmed.split('/');
//         return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//       }
      
//       // DD-MM-YYYY
//       if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
//         const [day, month, year] = trimmed.split('-');
//         return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//       }

//       // Try to parse as standard Date
//       const parsed = new Date(trimmed);
//       if (!isNaN(parsed.getTime())) {
//         return parsed.toISOString().split('T')[0];
//       }
//     }

//     return new Date().toISOString().split('T')[0];
//   } catch (error) {
//     console.warn('Date parsing error:', error);
//     return new Date().toISOString().split('T')[0];
//   }
// };


// const parseNumber = (value) => {
//   if (!value && value !== 0) return 0;

//   try {
//     // Convert to string for processing
//     const str = String(value).trim();
    
//     // Remove currency symbols and commas
//     const cleaned = str.replace(/[$,]/g, '');
    
//     const num = parseFloat(cleaned);
//     return isNaN(num) ? 0 : Math.round(num * 100) / 100;
//   } catch (error) {
//     return 0;
//   }
// };

// const findColumn = (row, columnNames) => {
//   return Object.keys(row).find(key => 
//     columnNames.some(name => key.toLowerCase().includes(name.toLowerCase()))
//   );
// };

// const parseExcelFile = (filePath) => {
//   try {
//     console.log('📊 Parsing Excel file:', filePath);
    
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];
    
//     // Convert to JSON
//     const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
//     console.log('✅ Excel file parsed successfully');
//     console.log('Row count:', jsonData.length);
    
//     return jsonData;
//   } catch (error) {
//     console.error('❌ Excel parsing error:', error);
//     throw new Error('Failed to parse Excel file: ' + error.message);
//   }
// };

// const parseCSVFile = (filePath) => {
//   return new Promise((resolve, reject) => {
//     console.log('📄 Parsing CSV file:', filePath);
    
//     const results = [];
    
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', (data) => {
//         results.push(data);
//       })
//       .on('end', () => {
//         try {
//           console.log('✅ CSV file parsed successfully');
//           console.log('Row count:', results.length);
//           resolve(results);
//         } catch (error) {
//           reject(new Error('Failed to process CSV data: ' + error.message));
//         }
//       })
//       .on('error', (error) => {
//         console.error('❌ CSV parsing error:', error);
//         reject(new Error('Failed to read CSV file: ' + error.message));
//       });
//   });
// };

// const normalizePayrollData = (rawData) => {
//   if (!Array.isArray(rawData) || rawData.length === 0) {
//     throw new Error('File is empty or invalid format');
//   }

//   const normalizedStatements = [];
//   const errors = [];

//   rawData.forEach((row, index) => {
//     try {
//       // Skip empty rows
//       if (!row || Object.keys(row).length === 0) {
//         return;
//       }

//       // Extract data with flexible column naming
//       const dateStr = row[findColumn(row, ['date', 'check date', 'checkdate'])] ||
//                       row[findColumn(row, ['period', 'month'])];
      
//       const periodStr = row[findColumn(row, ['period', 'retention', 'ret.', 'ref'])];
//       const description = row[findColumn(row, ['description', 'desc', 'remarks'])] || '';
      
//       const hours = parseNumber(
//         row[findColumn(row, ['hours', 'hrs', 'worked hours', 'worked'])]
//       );
      
//       const payRate = parseNumber(
//         row[findColumn(row, ['pay rate', 'rate', 'hourly rate', 'payrate', 'hourly'])]
//       );
      
//       const credit = parseNumber(
//         row[findColumn(row, ['credit', 'earnings', 'amount', 'gross'])]
//       );
      
//       const debit = parseNumber(
//         row[findColumn(row, ['debit', 'deduction', 'withdrawal', 'deductions'])]
//       );
      
//       const balance = parseNumber(
//         row[findColumn(row, ['balance', 'net balance', 'running balance', 'net'])]
//       );

//       // Validate required fields
//       if (!dateStr && !description) {
//         errors.push(`Row ${index + 1}: Missing date and description`);
//         return;
//       }

//       // If credit is not provided but hours and payRate are, calculate it
//       let calculatedCredit = credit;
//       if (!credit && hours && payRate) {
//         calculatedCredit = parseNumber(hours * payRate);
//         console.log(`Row ${index + 1}: Calculated credit = ${hours} × ${payRate} = ${calculatedCredit}`);
//       }

//       const statement = {
//         checkDate: parseDate(dateStr),
//         period: String(periodStr || '').trim(),
//         description: String(description).trim(),
//         hours: hours || 0,
//         payRate: payRate || 0,
//         credit: calculatedCredit || 0,
//         debit: debit || 0,
//         balance: balance || 0,
//         sourceRow: index + 1
//       };

//       normalizedStatements.push(statement);

//     } catch (error) {
//       errors.push(`Row ${index + 1}: ${error.message}`);
//     }
//   });

//   console.log(`✅ Normalized ${normalizedStatements.length} payroll statements`);
//   if (errors.length > 0) {
//     console.warn('⚠️ Parsing warnings:', errors);
//   }

//   if (normalizedStatements.length === 0) {
//     throw new Error('No valid payroll statements found in file');
//   }

//   return {
//     success: true,
//     statements: normalizedStatements,
//     totalRecords: normalizedStatements.length,
//     warnings: errors,
//     parseTime: new Date().toISOString()
//   };
// };

// const uploadPayrollStatementFile = async (req, res) => {
//   let filePath = null;
  
//   try {
//     console.log('=== UPLOAD PAYROLL STATEMENT FILE ===');
//     console.log('Params:', req.params);
//     console.log('File:', req.file?.filename);

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'No file uploaded. Please select a CSV or Excel file.'
//       });
//     }

//     const { companyId, employeeId } = req.params;
//     filePath = req.file.path;

//     console.log('📁 File uploaded to:', filePath);
//     console.log('📄 File size:', req.file.size, 'bytes');

//     if (!companyId || !employeeId) {
//       if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//       return res.status(400).json({
//         success: false,
//         message: 'Company ID and Employee ID are required'
//       });
//     }

//     // Parse the file
//     console.log('🔄 Parsing file...');
//     const fileExt = path.extname(req.file.originalname).toLowerCase();
    
//     let rawData;
//     if (fileExt === '.xlsx' || fileExt === '.xls') {
//       rawData = parseExcelFile(filePath);
//     } else if (fileExt === '.csv') {
//       rawData = await parseCSVFile(filePath);
//     } else {
//       if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//       return res.status(400).json({
//         success: false,
//         message: 'Unsupported file type. Please upload CSV or Excel file.'
//       });
//     }

//     // Normalize the data
//     console.log('📊 Normalizing payroll data...');
//     const parsedData = normalizePayrollData(rawData);

//     // Connect to database and insert statements
//     const pool = await poolPromise;
//     const tableName = getEmployeeTable(companyId);

//     const employeeIdInt = parseInt(employeeId, 10);
//     if (isNaN(employeeIdInt)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid Employee ID format'
//       });
//     }

//     // Get employee
//     const empRequest = new sql.Request(pool);
//     empRequest.input('empDbId', sql.Int, employeeIdInt);
//     const empResult = await empRequest.query(`
//       SELECT Id, EmployeeId, Name FROM ${tableName} WHERE Id = @empDbId
//     `);

//     if (!empResult.recordset.length) {
//       return res.status(404).json({
//         success: false,
//         message: 'Employee not found'
//       });
//     }

//     const empCode = empResult.recordset[0].EmployeeId;
//     console.log(`✅ Employee found: ${empResult.recordset[0].Name} (${empCode})`);

//     // Insert all statements
//     console.log('💾 Inserting statements into database...');
//     const insertedStatements = [];
//     const insertErrors = [];

//     for (let i = 0; i < parsedData.statements.length; i++) {
//       try {
//         const stmt = parsedData.statements[i];
        
//         const insertRequest = new sql.Request(pool);
//         insertRequest.input('empCode', sql.NVarChar, empCode);
//         insertRequest.input('compId', sql.Int, parseInt(companyId, 10));
//         insertRequest.input('checkDt', sql.DateTime, new Date(stmt.checkDate));
//         insertRequest.input('per', sql.NVarChar, stmt.period);
//         insertRequest.input('desc', sql.NVarChar, stmt.description);
//         insertRequest.input('hrs', sql.Float, stmt.hours);
//         insertRequest.input('rate', sql.Float, stmt.payRate);
//         insertRequest.input('cred', sql.Float, stmt.credit);
//         insertRequest.input('deb', sql.Float, stmt.debit);
//         insertRequest.input('bal', sql.Float, stmt.balance);

//         const result = await insertRequest.query(`
//           INSERT INTO EmployeePayStructure 
//           (EmployeeId, CompanyId, CheckDate, Period, Description, Hours, PayRate, Credit, Debit, Balance)
//           OUTPUT INSERTED.Id, INSERTED.CheckDate, INSERTED.Description, INSERTED.Credit, INSERTED.Debit, INSERTED.Balance
//           VALUES (@empCode, @compId, @checkDt, @per, @desc, @hrs, @rate, @cred, @deb, @bal)
//         `);

//         insertedStatements.push(result.recordset[0]);
//         console.log(`✅ Row ${i + 1}: Inserted successfully`);

//       } catch (error) {
//         insertErrors.push({
//           row: i + 1,
//           error: error.message
//         });
//         console.error(`❌ Row ${i + 1}: Insert failed -`, error.message);
//       }
//     }

//     // Clean up uploaded file
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//       console.log('🗑️ Temporary file deleted');
//     }

//     console.log(`\n✅ PAYROLL IMPORT COMPLETE`);
//     console.log(`   Total rows in file: ${parsedData.statements.length}`);
//     console.log(`   Successfully imported: ${insertedStatements.length}`);
//     console.log(`   Failed: ${insertErrors.length}`);

//     res.status(201).json({
//       success: true,
//       message: `Payroll statements imported successfully. ${insertedStatements.length}/${parsedData.statements.length} rows processed.`,
//       data: {
//         filename: req.file.originalname,
//         fileSize: req.file.size,
//         importedStatements: insertedStatements.length,
//         failedStatements: insertErrors.length,
//         totalStatements: parsedData.statements.length,
//         warnings: parsedData.warnings,
//         insertedRecords: insertedStatements,
//         errors: insertErrors.length > 0 ? insertErrors : null
//       }
//     });

//   } catch (error) {
//     console.error('❌ Upload payroll statement error:', error);
    
//     // Clean up file on error
//     if (filePath && fs.existsSync(filePath)) {
//       try {
//         fs.unlinkSync(filePath);
//       } catch (e) {
//         console.warn('Could not delete temp file:', e.message);
//       }
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Error processing payroll statement file',
//       error: error.message
//     });
//   }
// };

// // ✅ SendGrid API Helper Function (using https module - no npm package needed)
// const sendEmailViaSendGrid = async (emailData) => {
//   try {
//     const apiKey = process.env.SENDGRID_API_KEY;
    
//     if (!apiKey) {
//       console.warn('⚠️ SENDGRID_API_KEY not set in environment variables');
//       return { success: false, error: 'SendGrid API key not configured' };
//     }

//     const payload = JSON.stringify({
//       personalizations: [
//         {
//           to: [{ email: emailData.to }],
//           subject: emailData.subject
//         }
//       ],
//       from: {
//         email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
//         name: process.env.SENDGRID_FROM_NAME || 'Prophecy'
//       },
//       content: [
//         {
//           type: 'text/html',
//           value: emailData.html
//         }
//       ]
//     });

//     return new Promise((resolve, reject) => {
//       const options = {
//         hostname: 'api.sendgrid.com',
//         port: 443,
//         path: '/v3/mail/send',
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${apiKey}`,
//           'Content-Type': 'application/json',
//           'Content-Length': Buffer.byteLength(payload)
//         }
//       };

//       const req = https.request(options, (res) => {
//         let data = '';

//         res.on('data', (chunk) => {
//           data += chunk;
//         });

//         res.on('end', () => {
//           if (res.statusCode >= 200 && res.statusCode < 300) {
//             console.log('✅ Email sent successfully via SendGrid API');
//             resolve({ success: true });
//           } else {
//             console.error('❌ SendGrid API error:', res.statusCode, data);
//             resolve({ 
//               success: false, 
//               error: `SendGrid returned status ${res.statusCode}`,
//               details: data 
//             });
//           }
//         });
//       });

//       req.on('error', (error) => {
//         console.error('❌ SendGrid request error:', error);
//         reject(error);
//       });

//       req.write(payload);
//       req.end();
//     });
//   } catch (error) {
//     console.error('❌ Error sending email via SendGrid:', error);
//     return { success: false, error: error.message };
//   }
// };

//  const getFrontendURL = () => {
//       if (process.env.FRONTEND_URL) {
//         return process.env.FRONTEND_URL;
//       }
//       // Fallback based on NODE_ENV
//       if (process.env.NODE_ENV === 'production') {
//         return 'https://prophechyerp.duckdns.org';
//       }
//       return 'http://localhost:218';
//     };

// // Send Welcome Email
// // Send Supervisor Assignment Email
// const sendSupervisorAssignmentEmail = async (supervisorId, employeeName, roleType) => {
//   try {
//     const pool = await poolPromise;
//     const supervisorQuery = `
//       SELECT 
//         ci_email.IdentityValue as Email,
//         TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name
//       FROM [hrm].[Employee] e WITH (NOLOCK)
//       JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
//       LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//       WHERE e.EmployeeId = @supervisorId
//     `;
    
//     const supervisorResult = await pool.request()
//       .input('supervisorId', sql.BigInt, typeof supervisorId === 'string' ? parseInt(supervisorId) : supervisorId)
//       .query(supervisorQuery);


//     if (supervisorResult.recordset.length === 0 || !supervisorResult.recordset[0].Email) {
//       console.warn(`⚠️ No email found for supervisor ID ${supervisorId}`);
//       return;
//     }

//     const supervisor = supervisorResult.recordset[0];
//     const frontendURL = getFrontendURL();
//     const loginLink = `${frontendURL}/login`;

//     const htmlContent = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//         <div style="background-color: #17a2b8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
//           <h1 style="color: white; margin: 0;">Supervisor Assignment Notification</h1>
//         </div>
        
//         <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
//           <h2 style="color: #333;">Hello ${supervisor.Name}!</h2>
          
//           <p style="color: #666; font-size: 16px; line-height: 1.6;">
//             You have been assigned as the <strong>${roleType}</strong> for employee <strong>${employeeName}</strong>.
//           </p>
          
//           <p style="color: #666; font-size: 16px; line-height: 1.6;">
//             As their supervisor, you will be responsible for reviewing and approving their timesheets in the ERP system.
//           </p>
          
//           <div style="margin: 30px 0; text-align: center;">
//             <a href="${loginLink}" 
//                style="background-color: #17a2b8; 
//                       color: white; 
//                       padding: 15px 30px; 
//                       text-decoration: none; 
//                       border-radius: 5px;
//                       display: inline-block;
//                       font-weight: bold;
//                       font-size: 16px;">
//               Access Manager Dashboard
//             </a>
//           </div>
          
//           <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
//           <p style="color: #999; font-size: 12px; line-height: 1.6;">
//             <strong>This is an automated message. Please do not reply to this email.</strong>
//           </p>
//         </div>
//       </div>
//     `;

//     const result = await sendEmailViaSendGrid({
//       to: supervisor.Email.trim(),
//       subject: `New Assignment: ${roleType} for ${employeeName}`,
//       html: htmlContent
//     });

//     if (result.success) {
//       console.log(`✅ Supervisor assignment email sent to ${supervisor.Email} for employee ${employeeName}`);
//     } else {
//       console.error(`❌ Failed to send supervisor assignment email:`, result.error);
//     }
//   } catch (error) {
//     console.error('Error in sendSupervisorAssignmentEmail:', error);
//   }
// };

// const sendWelcomeEmail = async (employeeData, companyName, credentials) => {

//   try {
//     const frontendURL = getFrontendURL();
//     const employeePortalLink = `${frontendURL}/login`;

//     const htmlContent = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//         <div style="background-color: #17a2b8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
//           <h1 style="color: white; margin: 0;">Welcome to ${companyName}!</h1>
//         </div>
        
//         <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
//           <h2 style="color: #333;">Hello ${employeeData.name}!</h2>
          
//           <p style="color: #666; font-size: 16px; line-height: 1.6;">
//             We're excited to have you join our team! Your employee account has been successfully created.
//           </p>
          
//           <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h3 style="color: #17a2b8; margin-top: 0;">Your Employee Details:</h3>
//             <table style="width: 100%; color: #666;">
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Employee ID:</strong></td>
//                 <td style="padding: 8px 0;">${employeeData.employeeId}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Name:</strong></td>
//                 <td style="padding: 8px 0;">${employeeData.name}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Email:</strong></td>
//                 <td style="padding: 8px 0;">${employeeData.email}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Department:</strong></td>
//                 <td style="padding: 8px 0;">${employeeData.department}</td>
//               </tr>
//               ${employeeData.position ? `
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Position:</strong></td>
//                 <td style="padding: 8px 0;">${employeeData.position}</td>
//               </tr>
//               ` : ''}
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Employment Type:</strong></td>
//                 <td style="padding: 8px 0;">${employeeData.employmentType}</td>
//               </tr>
//               ${employeeData.hireDate ? `
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Hire Date:</strong></td>
//                 <td style="padding: 8px 0;">${new Date(employeeData.hireDate).toLocaleDateString()}</td>
//               </tr>
//               ` : ''}
//             </table>
//           </div>
          
//           ${credentials ? `
//           <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
//             <h3 style="color: #856404; margin-top: 0;">🔐 Your Login Credentials:</h3>
//             <table style="width: 100%; color: #856404;">
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Username:</strong></td>
//                 <td style="padding: 8px 0; font-family: monospace; background: white; padding: 8px; border-radius: 4px;">${credentials.username}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px 0;"><strong>Password:</strong></td>
//                 <td style="padding: 8px 0; font-family: monospace; background: white; padding: 8px; border-radius: 4px;">${credentials.password}</td>
//               </tr>
//             </table>
//             <p style="color: #856404; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
//               ⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.
//             </p>
//           </div>
//           ` : ''}
          
//           <div style="margin: 30px 0; text-align: center;">
//             <a href="${employeePortalLink}" 
//                style="background-color: #17a2b8; 
//                       color: white; 
//                       padding: 15px 30px; 
//                       text-decoration: none; 
//                       border-radius: 5px;
//                       display: inline-block;
//                       font-weight: bold;
//                       font-size: 16px;">
//               Access Employee Portal
//             </a>
//           </div>
          
//           <p style="color: #666; font-size: 14px; line-height: 1.6;">
//             Click the button above to access your employee portal where you can:
//           </p>
          
//           <ul style="color: #666; font-size: 14px; line-height: 1.8;">
//             <li>View your profile and employment details</li>
//             <li>Submit and manage timesheets</li>
//             <li>Access company resources</li>
//             <li>Update your personal information</li>
//           </ul>
          
//           <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
//             Or copy and paste this link into your browser:
//           </p>
//           <p style="color: #17a2b8; word-break: break-all; font-size: 12px;">
//             ${employeePortalLink}
//           </p>
          
//           <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
//           <p style="color: #999; font-size: 12px; line-height: 1.6;">
//             If you have any questions or need assistance, please contact your HR department.<br><br>
//             <strong>This is an automated message. Please do not reply to this email.</strong>
//           </p>
//         </div>
//       </div>
//     `;

//     const result = await sendEmailViaSendGrid({
//       to: employeeData.email.trim(),
//       subject: `Welcome to ${companyName} - Your Account Details`,
//       html: htmlContent
//     });

//     if (result.success) {
//       console.log('✅ Welcome email sent to:', employeeData.email);
//     } else {
//       console.error('❌ Failed to send welcome email:', result.error);
//     }

//     return result;
//   } catch (error) {
//     console.error('Error in sendWelcomeEmail:', error);
//     return { success: false, error: error.message };
//   }
// };

// const sendTimesheetRejectionEmail = async (emailData) => {
//   try {
//     const { to, employeeName, periodStart, periodEnd, reason } = emailData;
//     const frontendURL = getFrontendURL();
//     const loginLink = `${frontendURL}/login`;

//     const htmlContent = `
//       <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
//         <div style="background-color: #ef4444; padding: 24px; text-align: center;">
//           <h1 style="color: white; margin: 0; font-size: 24px;">Timesheet Rejected</h1>
//         </div>
//         <div style="padding: 32px; background-color: #ffffff;">
//           <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hello ${employeeName},</p>
//           <p style="font-size: 16px; color: #475569; line-height: 1.6;">
//             Your timesheet for the period <strong>${periodStart} to ${periodEnd}</strong> has been rejected.
//           </p>
//           <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 16px; margin: 24px 0;">
//             <h3 style="margin-top: 0; color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Reason for Rejection:</h3>
//             <p style="margin-bottom: 0; color: #b91c1c; font-size: 16px;">${reason || 'No specific reason provided.'}</p>
//           </div>
//           <p style="font-size: 16px; color: #475569; line-height: 1.6;">
//             Please log in to the employee portal to review the feedback, correct the hours, and resubmit for approval.
//           </p>
//           <div style="text-align: center; margin-top: 32px;">
//             <a href="${loginLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">View Timesheet</a>
//           </div>
//         </div>
//         <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
//           <p style="margin: 0; font-size: 12px; color: #94a3b8;">This is an automated notification from Prophecy ERP System.</p>
//         </div>
//       </div>
//     `;

//     return await sendEmailViaSendGrid({
//       to: to.trim(),
//       subject: `Timesheet Rejected: Period ${periodStart} - ${periodEnd}`,
//       html: htmlContent
//     });
//   } catch (error) {
//     console.error('Error in sendTimesheetRejectionEmail:', error);
//     return { success: false, error: error.message };
//   }
// };

// const getEmployeeTable = (companyId) => {
//   // All employees are now in the unified hrm.Employee table
//   return '[hrm].[Employee]';
// };

// const getCompanyName = (companyId) => {
//   const companyMap = {
//     4: 'Prophecy Consulting INC',
//     5: 'Prophecy Offshore',
//     6: 'Cognifyar Technologies',
//     8: 'startup company'
//   };
//   return companyMap[parseInt(companyId)] || 'Prophecy Consulting INC';
// };

// const formatDate = (date) => {
//   if (!date) return null;
//   return new Date(date).toISOString().split('T')[0];
// };

// const employeeController = {
//   testConnection: async (req, res) => {
//     try {
//       const pool = await poolPromise;
//       const result = await sql.query('SELECT 1 as test');
//       res.json({
//         success: true,
//         message: 'Employee database connection successful',
//         data: result.recordset
//       });
//     } catch (error) {
//       console.error('Employee database connection test failed:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Employee database connection failed',
//         error: error.message
//       });
//     }
//   },

//   getCountries: async (req, res) => {
//     try {
//       const pool = await poolPromise;
//       const result = await sql.query(`
//         SELECT CountryId, Iso2, Name
//         FROM [core].[Country]
//         ORDER BY Name ASC
//       `);
//       res.json({ success: true, data: result.recordset });
//     } catch (err) {
//       console.error('getCountries error:', err);
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },

//   getStates: async (req, res) => {
//     try {
//       const { countryId } = req.query;
//       const pool = await poolPromise;
//       const request = new sql.Request(pool);
//       let query = `SELECT StateId, CountryId, Code, Name FROM [core].[StateProvince]`;
//       if (countryId) {
//         request.input('countryId', sql.Int, parseInt(countryId));
//         query += ` WHERE CountryId = @countryId`;
//       }
//       query += ` ORDER BY Name ASC`;
//       const result = await request.query(query);
//       res.json({ success: true, data: result.recordset });
//     } catch (err) {
//       console.error('getStates error:', err);
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },

//   getCities: async (req, res) => {
//     try {
//       const { stateId } = req.query;
//       const pool = await poolPromise;
//       const request = new sql.Request(pool);
//       let query = `SELECT CityId, StateId, Name FROM [core].[City]`;
//       if (stateId) {
//         request.input('stateId', sql.Int, parseInt(stateId));
//         query += ` WHERE StateId = @stateId`;
//       }
//       query += ` ORDER BY Name ASC`;
//       const result = await request.query(query);
//       res.json({ success: true, data: result.recordset });
//     } catch (err) {
//       console.error('getCities error:', err);
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },

//   getAllEmployees: async (req, res) => {
//     try {
//       const pool = await poolPromise;
//       const { companyId } = req.params;
//       const { status, department, search, limit, offset } = req.query;
      
//       if (!companyId) {
//         return res.status(400).json({
//           success: false,
//           message: 'Company ID is required'
//         });
//       }

//       let query = `
//         SELECT 
//           e.EmployeeId as Id,
//           e.EmployeeId,
//           e.EmployeeCode,
//           e.EmployeeCode as [employeeId],
//           e.EmployeeType,
//           e.EntityId,
//           e.CandidateId,
//           e.SupervisorEmployeeId,
//           e.BackupSupervisorEmployeeId,
//           e.HireDate,
//           e.StartDate,
//           e.EndDate,
//           e.EmploymentStatus,
//           e.PayrollSystemId,
//           e.TimesheetRequired,
//           e.HomeAddressId,
//           e.MailingAddressId,
//           e.EmergencyContactName,
//           e.EmergencyContactPhone,
//           e.IsDeleted,
//           e.TimePunchEnabled,
//           e.CreatedAtUtc,
//           e.CreatedByUserId,
//           e.UpdatedAtUtc,
//           e.UpdatedByUserId,
//           c.FirstName,
//           c.MiddleName,
//           c.LastName,
//           TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
//           c.JobTitle as Position,
//           c.JobTitle,
//           ci_email.IdentityValue as Email,
//           ci_phone.IdentityValue as Phone,
//           c.CandidateCode,
//           wa.AuthorizationType as VisaStatus,
//           wa.AuthorizationNumber as VisaNumber,
//           wa.IssueDate as VisaIssueDate,
//           wa.ExpiryDate as VisaExpiryDate,
//           addr.Line1 as StreetAddress,
//           addr.Line2 as ApartmentSuite,
//           addr.CityId as cityId,
//           city.StateId as stateId,
//           state.CountryId as countryId,
//           addr.PostalCode as ZipCode,
//           city.Name as City,
//           state.Code as State,
//           country.Name as Country,
//           TRIM(CONCAT(sc.FirstName, ' ', ISNULL(sc.MiddleName + ' ', ''), sc.LastName)) as SupervisorName,
//           TRIM(CONCAT(bsc.FirstName, ' ', ISNULL(bsc.MiddleName + ' ', ''), bsc.LastName)) as BackupSupervisorName,
//           m_addr.Line1 as MailingStreetAddress,
//           m_addr.Line2 as MailingApartmentSuite,
//           m_addr.CityId as mailingCityId,
//           m_city.StateId as mailingStateId,
//           m_state.CountryId as mailingCountryId,
//           m_addr.PostalCode as MailingZipCode,
//           m_city.Name as MailingCity,
//           m_state.Code as MailingState,
//           m_country.Name as MailingCountry
//         FROM [hrm].[Employee] e
//         LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//         LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//         LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
//         LEFT JOIN [core].[EntityAddress] ea ON ea.EntityId = c.CandidateId AND ea.EntityType = 'CANDIDATE' AND ea.IsPrimary = 1
//         LEFT JOIN [core].[Address] addr ON addr.AddressId = ea.AddressId
//         LEFT JOIN [core].[City] city ON city.CityId = addr.CityId
//         LEFT JOIN [core].[StateProvince] state ON state.StateId = city.StateId
//         LEFT JOIN [core].[Country] country ON country.CountryId = state.CountryId
//         LEFT JOIN (
//           SELECT EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate,
//                  ROW_NUMBER() OVER(PARTITION BY EmployeeId ORDER BY CreatedAtUtc DESC) as rn
//           FROM [hrm].[EmployeeWorkAuthorization]
//           WHERE StatusCode = 'ACTIVE'
//         ) wa ON wa.EmployeeId = e.EmployeeId AND wa.rn = 1
//         LEFT JOIN [hrm].[Employee] s ON e.SupervisorEmployeeId = s.EmployeeId
//         LEFT JOIN [recruit].[Candidate] sc ON s.CandidateId = sc.CandidateId
//         LEFT JOIN [hrm].[Employee] bs ON e.BackupSupervisorEmployeeId = bs.EmployeeId
//         LEFT JOIN [recruit].[Candidate] bsc ON bs.CandidateId = bsc.CandidateId
//         LEFT JOIN [core].[Address] m_addr ON m_addr.AddressId = e.MailingAddressId
//         LEFT JOIN [core].[City] m_city ON m_city.CityId = m_addr.CityId
//         LEFT JOIN [core].[StateProvince] m_state ON m_state.StateId = m_city.StateId
//         LEFT JOIN [core].[Country] m_country ON m_country.CountryId = m_state.CountryId
//         WHERE e.IsDeleted = 0
//       `;
      
//       let inputs = [];
      
//       // ✅ FIX: Only filter by entityId if companyId is NOT 'all' or '0'
//       if (companyId !== 'all' && companyId !== '0') {
//         query += ' AND e.EntityId = @entityId';
//         inputs.push({ name: 'entityId', type: sql.Int, value: parseInt(companyId) });
//       }
      
//       if (status && status !== 'all') {
//         query += ' AND e.EmploymentStatus = @status';
//         inputs.push({ name: 'status', type: sql.NVarChar, value: status });
//       }
      
//       // Note: Department search removed from query as it's missing in hrm.Employee table schema
//       // if (department && department !== 'all') {
//       //   query += ' AND e.Department = @department';
//       //   inputs.push({ name: 'department', type: sql.NVarChar, value: department });
//       // }
      
//       if (search) {
//         query += ` AND (c.FirstName LIKE @search 
//                         OR c.LastName LIKE @search
//                         OR ci_email.IdentityValue LIKE @search 
//                         OR e.EmployeeCode LIKE @search
//                         OR e.JobTitle LIKE @search)`;
//         inputs.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
//       }
      
//       query += ' ORDER BY e.CreatedAtUtc DESC';
      
//       if (limit) {
//         query += ` OFFSET ${offset || 0} ROWS FETCH NEXT ${limit} ROWS ONLY`;
//       }
      
//       const request = new sql.Request(pool);
//       inputs.forEach(input => {
//         request.input(input.name, input.type, input.value);
//       });
      
//       const result = await request.query(query);
      
//       res.json({
//         success: true,
//         data: result.recordset,
//         count: result.recordset.length,
//         companyId: parseInt(companyId)
//       });
//     } catch (error) {
//       console.error('Get all employees error:', error);
//       res.status(500).json({ 
//         success: false, 
//         message: 'Error retrieving employees', 
//         error: error.message 
//       });
//     }
//   },

//   getEmployeeById: async (req, res) => {
//     try {
//       const pool = await poolPromise;
//       const { companyId, employeeId } = req.params;
      
//       if (!companyId || !employeeId) {
//         return res.status(400).json({
//           success: false,
//           message: 'Company ID and Employee ID are required'
//         });
//       }

//       const request = new sql.Request(pool);
//       request.input('entityId', sql.Int, parseInt(companyId));
      
//       // Determine if employeeId is numeric ID or alphanumeric Code
//       const isNumeric = /^\d+$/.test(String(employeeId));
      
//       let query = `
//         SELECT 
//           e.EmployeeId as Id,
//           e.EmployeeId,
//           e.EmployeeCode,
//           e.EmployeeCode as [employeeId],
//           e.EmployeeType,
//           e.EntityId,
//           e.CandidateId,
//           e.SupervisorEmployeeId,
//           e.BackupSupervisorEmployeeId,
//           e.StartDate,
//           e.EndDate,
//           e.EmploymentStatus,
//           e.PayrollSystemId,
//           e.TimesheetRequired,
//           e.EmergencyContactName,
//           e.EmergencyContactPhone,
//           e.IsDeleted,
//           e.TimePunchEnabled,
//           e.CreatedAtUtc,
//           e.CreatedByUserId,
//           e.UpdatedAtUtc,
//           e.UpdatedByUserId,
//           c.FirstName,
//           c.MiddleName,
//           c.LastName,
//           TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name,
//           c.JobTitle as Position,
//           c.JobTitle,
//           ci_email.IdentityValue as Email,
//           ci_phone.IdentityValue as Phone,
//           c.CandidateCode,
//           wa.AuthorizationType as VisaStatus,
//           wa.AuthorizationNumber as VisaNumber,
//           wa.IssueDate as VisaIssueDate,
//           wa.ExpiryDate as VisaExpiryDate,
//           addr.Line1 as StreetAddress,
//           addr.Line2 as ApartmentSuite,
//           addr.CityId as cityId,
//           city.StateId as stateId,
//           state.CountryId as countryId,
//           addr.PostalCode as ZipCode,
//           city.Name as City,
//           state.Code as State,
//           country.Name as Country
//         FROM [hrm].[Employee] e
//         LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//         LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//         LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
//         LEFT JOIN (
//           SELECT EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate,
//                  ROW_NUMBER() OVER(PARTITION BY EmployeeId ORDER BY CreatedAtUtc DESC) as rn
//           FROM [hrm].[EmployeeWorkAuthorization]
//           WHERE StatusCode = 'ACTIVE'
//         ) wa ON wa.EmployeeId = e.EmployeeId AND wa.rn = 1
//         LEFT JOIN [core].[EntityAddress] ea ON ea.EntityId = c.CandidateId AND ea.EntityType = 'CANDIDATE' AND ea.IsPrimary = 1
//         LEFT JOIN [core].[Address] addr ON addr.AddressId = ea.AddressId
//         LEFT JOIN [core].[City] city ON city.CityId = addr.CityId
//         LEFT JOIN [core].[StateProvince] state ON state.StateId = city.StateId
//         LEFT JOIN [core].[Country] country ON country.CountryId = state.CountryId
//         WHERE e.EntityId = @entityId AND e.IsDeleted = 0
//       `;

//       if (isNumeric) {
//         request.input('employeeId', sql.Int, parseInt(employeeId));
//         query += ` AND e.EmployeeId = @employeeId`;
//       } else {
//         request.input('employeeCode', sql.NVarChar, employeeId);
//         query += ` AND e.EmployeeCode = @employeeCode`;
//       }
      
//       const result = await request.query(query);
      
//       if (result.recordset.length === 0) {
//         return res.status(404).json({ 
//           success: false, 
//           message: 'Employee not found' 
//         });
//       }
      
//       res.json({
//         success: true,
//         data: result.recordset[0]
//       });
//     } catch (error) {
//       console.error('Get employee by ID error:', error);
//       res.status(500).json({ 
//         success: false, 
//         message: 'Error retrieving employee', 
//         error: error.message 
//       });
//     }
//   },

// // At the START of createEmployee function, right after destructuring

// createEmployee: async (req, res) => {
//   try {
//     console.log('=== CREATE EMPLOYEE REQUEST (HRM) ===');
//     const { companyId } = req.params;
    
//     // Use shared pool
//     const pool = await poolPromise;
    
//     const {
//       name, email, phone, department, position, employmentType = 'Full-time',
//       status = 'Active', hireDate, 
//       employeeId, username, password,
//       visaStatus, visaNumber, visaIssueDate, visaExpiryDate,
//       streetAddress, apartmentSuite, cityId, stateId, countryId, zipCode,
//       supervisorEmployeeId, backupSupervisorEmployeeId, timesheetRequired,
//       emergencyContactName, emergencyContactPhone,
//       mailingStreetAddress, mailingApartmentSuite, mailingCityId, mailingZipCode,
//       timePunchEnabled
//     } = req.body;

//     const normalizedEmail = email.trim().toLowerCase();

//     // Validation
//     if (!name || !normalizedEmail || !companyId || !employeeId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, Email, EmployeeCode, and Company ID are required'
//       });
//     }

//     const companyName = getCompanyName(companyId);
    
//     // 3. Start Transaction for atomic creation
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       // 1. Check for existing Candidate by Email (inside transaction)
//       const checkRequest = new sql.Request(transaction);
//       checkRequest.input('email', sql.NVarChar, normalizedEmail);
//       const checkResult = await checkRequest.query(`
//         SELECT c.CandidateId FROM [recruit].[CandidateIdentity] ci
//         JOIN [recruit].[Candidate] c ON ci.CandidateId = c.CandidateId
//         WHERE LOWER(ci.IdentityValue) = LOWER(@email) AND ci.IdentityType = 'Email'
//       `);
      
//       let candidateId = checkResult.recordset.length > 0 ? checkResult.recordset[0].CandidateId : null;
      
//       if (candidateId) {
//         // --- SYNC CANDIDATE DETAILS ---
//         // Even if candidate exists, update their Name and Position to match the new Employee entry
//         const candSyncRequest = new sql.Request(transaction);
//         candSyncRequest.input('candId', sql.Int, candidateId);
//         candSyncRequest.input('jobTitle', sql.NVarChar, position ? position.trim() : null);
        
//         const nameParts = name.trim().split(' ');
//         const firstName = nameParts[0];
//         const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
//         const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
        
//         candSyncRequest.input('firstName', sql.NVarChar, firstName);
//         candSyncRequest.input('middleName', sql.NVarChar, middleName);
//         candSyncRequest.input('lastName', sql.NVarChar, lastName);

//         await candSyncRequest.query(`
//           UPDATE [recruit].[Candidate]
//           SET JobTitle = COALESCE(@jobTitle, JobTitle),
//               FirstName = @firstName,
//               MiddleName = COALESCE(@middleName, MiddleName),
//               LastName = @lastName
//           WHERE CandidateId = @candId
//         `);
//         console.log(`[EMPLOYEE-CREATE] Synced existing candidate details for CandidateId: ${candidateId}`);

//         // Check if already an employee in this company
//         const empCheckRequest = new sql.Request(transaction);
//         empCheckRequest.input('candidateId', sql.Int, candidateId);
//         empCheckRequest.input('entityId', sql.Int, parseInt(companyId));
//         const empCheckResult = await empCheckRequest.query(`
//           SELECT EmployeeId FROM [hrm].[Employee] WITH (UPDLOCK, HOLDLOCK)
//           WHERE CandidateId = @candidateId AND EntityId = @entityId AND IsDeleted = 0
//         `);
        
//         if (empCheckResult.recordset.length > 0) {
//           await transaction.rollback();
//           return res.status(409).json({
//             success: false,
//             message: 'An employee with this email already exists in this company'
//           });
//         }
//       }

//       // 2. Check for existing EmployeeCode in this company
//       const codeCheckRequest = new sql.Request(transaction);
//       codeCheckRequest.input('employeeCode', sql.NVarChar, employeeId.trim());
//       codeCheckRequest.input('entityId', sql.Int, parseInt(companyId));
//       const codeCheckResult = await codeCheckRequest.query(`
//         SELECT EmployeeId FROM [hrm].[Employee] WITH (UPDLOCK, HOLDLOCK)
//         WHERE EmployeeCode = @employeeCode AND EntityId = @entityId
//       `);
      
//       if (codeCheckResult.recordset.length > 0) {
//         await transaction.rollback();
//         return res.status(409).json({
//           success: false,
//           message: 'An employee with this Employee Code already exists in this company'
//         });
//       }

//       // Step A: Create Candidate if it doesn't exist
//       if (!candidateId) {
//         const nameParts = name.trim().split(' ');
//         const firstName = nameParts[0];
//         const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
//         const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

//         const candInsert = new sql.Request(transaction);
//         candInsert.input('firstName', sql.NVarChar, firstName);
//         candInsert.input('middleName', sql.NVarChar, middleName);
//         candInsert.input('lastName', sql.NVarChar, lastName);
//         candInsert.input('jobTitle', sql.NVarChar, position ? position.trim() : null);
        
//         const candResult = await candInsert.query(`
//           INSERT INTO [recruit].[Candidate] (FirstName, MiddleName, LastName, CandidateCode, JobTitle, CreatedOn)
//           OUTPUT INSERTED.CandidateId
//           VALUES (@firstName, @middleName, @lastName, 'EMP-' + LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 8), @jobTitle, GETUTCDATE())
//         `);
//         candidateId = candResult.recordset[0].CandidateId;

//         const identInsert = new sql.Request(transaction);
//         identInsert.input('candidateId', sql.Int, candidateId);
//         identInsert.input('email', sql.NVarChar, normalizedEmail);
//         identInsert.input('phone', sql.NVarChar, phone ? phone.trim() : null);

//         await identInsert.query(`
//           INSERT INTO [recruit].[CandidateIdentity] (CandidateId, IdentityType, IdentityValue, IsPrimary)
//           VALUES (@candidateId, 'Email', @email, 1);
          
//           IF @phone IS NOT NULL
//           INSERT INTO [recruit].[CandidateIdentity] (CandidateId, IdentityType, IdentityValue, IsPrimary)
//           VALUES (@candidateId, 'Phone', @phone, 1);
//         `);
//       }

//       // Step B: Create or Update User Account if credentials provided
//       let userAuthId = null;
//       if (username && password) {
//         // Check if user already exists
//         const userCheckReq = new sql.Request(transaction);
//         userCheckReq.input('username', sql.NVarChar, username.trim());
//         const existingUserResult = await userCheckReq.query(`SELECT id FROM userinfo WHERE username = @username`);

//         if (existingUserResult.recordset.length > 0) {
//           // User exists, update EmployeeId only
//           userAuthId = existingUserResult.recordset[0].id;
//           const userUpdateReq = new sql.Request(transaction);
//           userUpdateReq.input('id', sql.Int, userAuthId);
//           userUpdateReq.input('empCode', sql.NVarChar, employeeId.trim());
//           await userUpdateReq.query(`UPDATE userinfo SET EmployeeId = @empCode WHERE id = @id`);
//           console.log(`[EMPLOYEE-CREATE] Updated existing user info for: ${username}`);
//         } else {
//           // User does not exist, insert new record
//           const hashedPassword = await bcrypt.hash(password, 10);
//           const userInsertReq = new sql.Request(transaction);
//           userInsertReq.input('username', sql.NVarChar, username.trim());
//           userInsertReq.input('password', sql.NVarChar, hashedPassword);
//           userInsertReq.input('role', sql.NVarChar, 'employee');
//           userInsertReq.input('empCode', sql.NVarChar, employeeId.trim());
          
//           const userInsertResult = await userInsertReq.query(`
//             INSERT INTO userinfo (username, password, role, EmployeeId)
//             OUTPUT INSERTED.id
//             VALUES (@username, @password, @role, @empCode)
//           `);
//           userAuthId = userInsertResult.recordset[0].id;
//           console.log(`[EMPLOYEE-CREATE] Created new user account for: ${username}`);
//         }

//         // Handle userdetails gracefully
//         const detailRequest = new sql.Request(transaction);
//         detailRequest.input('id', sql.Int, userAuthId);
//         detailRequest.input('email', sql.NVarChar, normalizedEmail);
//         await detailRequest.query(`
//           IF NOT EXISTS (SELECT 1 FROM userdetails WHERE id = @id)
//           BEGIN
//             INSERT INTO userdetails (id, email) VALUES (@id, @email)
//           END
//           ELSE
//           BEGIN
//             UPDATE userdetails SET email = @email WHERE id = @id
//           END
//         `);
//       }

//       // Step C: Insert into hrm.Employee
//       const empRequest = new sql.Request(transaction);
//       empRequest.input('candidateId', sql.Int, candidateId);
//       empRequest.input('entityId', sql.Int, parseInt(companyId));
//       empRequest.input('employeeCode', sql.NVarChar, employeeId.trim());
      
//       let mappedEmployeeType = 'INTERNAL';
//       if (employmentType && employmentType.toUpperCase().includes('C2C')) mappedEmployeeType = 'C2C';
//       else if (employmentType && employmentType.toUpperCase().includes('DEPLOYED')) mappedEmployeeType = 'DEPLOYED';
//       empRequest.input('employeeType', sql.NVarChar, mappedEmployeeType);
      
//       const normalizedStatus = (status && status.toUpperCase() === 'INACTIVE') ? 'INACTIVE' : 
//                                (status && status.toUpperCase() === 'TERMINATED') ? 'TERMINATED' : 'ACTIVE';
//       empRequest.input('status', sql.NVarChar, normalizedStatus);
//       const parsedHireDate = (hireDate && String(hireDate).trim() !== '') ? new Date(hireDate) : new Date();
//       empRequest.input('hireDate', sql.Date, parsedHireDate);
//       empRequest.input('supervisorId', sql.BigInt, supervisorEmployeeId ? parseInt(supervisorEmployeeId) : null);
//       empRequest.input('backupSupervisorId', sql.BigInt, backupSupervisorEmployeeId ? parseInt(backupSupervisorEmployeeId) : null);
//       empRequest.input('timesheetRequired', sql.Bit, !!timesheetRequired ? 1 : 0);
//       empRequest.input('emergencyContactName', sql.NVarChar, emergencyContactName || null);
//       empRequest.input('emergencyContactPhone', sql.NVarChar, emergencyContactPhone || null);
//       empRequest.input('createdBy', sql.Int, req.user?.id || null);

//       const empResult = await empRequest.query(`
//         INSERT INTO [hrm].[Employee] (
//           CandidateId, EntityId, EmployeeCode, 
//           EmployeeType, EmploymentStatus, StartDate, HireDate,
//           SupervisorEmployeeId, BackupSupervisorEmployeeId, TimesheetRequired,
//           EmergencyContactName, EmergencyContactPhone, TimePunchEnabled,
//           CreatedAtUtc, CreatedByUserId
//         )
//         OUTPUT INSERTED.EmployeeId
//         VALUES (
//           @candidateId, @entityId, @employeeCode, 
//           @employeeType, @status, @hireDate, @hireDate,
//           @supervisorId, @backupSupervisorId, @timesheetRequired,
//           @emergencyContactName, @emergencyContactPhone, @timePunchEnabled,
//           SYSUTCDATETIME(), @createdBy
//         )
//       `);
      
//       const newEmployeeDbId = empResult.recordset[0].EmployeeId;

//       // Step C.5: Link Candidate to new Employee ID
//       const updateCandReq = new sql.Request(transaction);
//       updateCandReq.input('candIdVal', sql.Int, candidateId);
//       updateCandReq.input('empDbIdVal', sql.Int, newEmployeeDbId);
//       await updateCandReq.query(`
//         UPDATE [recruit].[Candidate]
//         SET EmployeeId = @empDbIdVal
//         WHERE CandidateId = @candIdVal
//       `);

//       // Step D: Log Status History
//       const histRequest = new sql.Request(transaction);
//       histRequest.input('empId', sql.Int, newEmployeeDbId);
//       histRequest.input('status', sql.NVarChar, status);
//       await histRequest.query(`
//         INSERT INTO [hrm].[EmployeeStatusHistory] (EmployeeId, ToStatus, ChangedAtUtc, ChangedByUserName)
//         VALUES (@empId, @status, SYSUTCDATETIME(), 'System')
//       `);

//       // Step E: Insert Work Authorization
//       if (visaStatus) {
//         const visaReq = new sql.Request(transaction);
//         visaReq.input('employeeId', sql.BigInt, newEmployeeDbId);
//         visaReq.input('authType', sql.NVarChar, visaStatus);
//         visaReq.input('authNum', sql.NVarChar, visaNumber || null);
        
//         let iDate = null;
//         if (visaIssueDate && String(visaIssueDate).trim() !== '') iDate = new Date(visaIssueDate);
//         visaReq.input('iDate', sql.Date, iDate);
        
//         let eDate = null;
//         if (visaExpiryDate && String(visaExpiryDate).trim() !== '') eDate = new Date(visaExpiryDate);
//         visaReq.input('eDate', sql.Date, eDate);

//         await visaReq.query(`
//           INSERT INTO [hrm].[EmployeeWorkAuthorization] (
//             EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate, StatusCode
//           ) VALUES (
//             @employeeId, @authType, @authNum, @iDate, @eDate, 'ACTIVE'
//           )
//         `);
//       }

//       // Step F: Insert Home Address
//       if (streetAddress || cityId || zipCode) {
//         const addrReq = new sql.Request(transaction);
//         addrReq.input('cityId', sql.Int, cityId ? parseInt(cityId) : null);
//         addrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
//         addrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
//         addrReq.input('zipCode', sql.NVarChar, zipCode || null);
        
//         const addrResult = await addrReq.query(`
//           INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
//           OUTPUT INSERTED.AddressId
//           VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
//         `);
//         const newAddressId = addrResult.recordset[0].AddressId;

//         const eaReq = new sql.Request(transaction);
//         eaReq.input('candId', sql.Int, candidateId);
//         eaReq.input('addrId', sql.Int, newAddressId);
//         await eaReq.query(`
//           INSERT INTO [core].[EntityAddress] (EntityType, EntityId, AddressId, AddressType, IsPrimary)
//           VALUES ('CANDIDATE', @candId, @addrId, 'CURRENT', 1)
//         `);

//         // Link to Employee table
//         const linkHomeReq = new sql.Request(transaction);
//         linkHomeReq.input('empId', sql.BigInt, newEmployeeDbId);
//         linkHomeReq.input('addrId', sql.Int, newAddressId);
//         await linkHomeReq.query(`UPDATE [hrm].[Employee] SET HomeAddressId = @addrId WHERE EmployeeId = @empId`);
//       }

//       // Step G: Insert Mailing Address if provided and different
//       if (mailingStreetAddress || mailingCityId || mailingZipCode) {
//         const mAddrReq = new sql.Request(transaction);
//         mAddrReq.input('cityId', sql.Int, mailingCityId ? parseInt(mailingCityId) : null);
//         mAddrReq.input('streetAddress', sql.NVarChar, mailingStreetAddress || null);
//         mAddrReq.input('apartmentSuite', sql.NVarChar, mailingApartmentSuite || null);
//         mAddrReq.input('zipCode', sql.NVarChar, mailingZipCode || null);
        
//         const mAddrResult = await mAddrReq.query(`
//           INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
//           OUTPUT INSERTED.AddressId
//           VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
//         `);
//         const mailingAddressId = mAddrResult.recordset[0].AddressId;

//         const linkMailReq = new sql.Request(transaction);
//         linkMailReq.input('empId', sql.BigInt, newEmployeeDbId);
//         linkMailReq.input('addrId', sql.Int, mailingAddressId);
//         await linkMailReq.query(`UPDATE [hrm].[Employee] SET MailingAddressId = @addrId WHERE EmployeeId = @empId`);
//       }

//       await transaction.commit();
//       console.log('✅ Employee created successfully in hrm schema');

//       // Final Response
//       const responseData = {
//         Id: newEmployeeDbId,
//         EmployeeId: employeeId.trim(),
//         Name: name.trim(),
//         Email: normalizedEmail,
//         Department: department,
//         Position: position,
//         Status: status
//       };

//       const emailPayload = {
//         employeeId: employeeId.trim(),
//         name: name.trim(),
//         email: normalizedEmail,
//         department: department,
//         position: position,
//         employmentType: employmentType,
//         hireDate: hireDate
//       };

//       const credentials = (username && password) ? { username: username.trim(), password: password } : null;
//       await sendWelcomeEmail(emailPayload, companyName, credentials);

//       // Notify Supervisors if assigned
//       if (supervisorEmployeeId) {
//         await sendSupervisorAssignmentEmail(supervisorEmployeeId, name.trim(), 'Primary Supervisor');
//       }
//       if (backupSupervisorEmployeeId) {
//         await sendSupervisorAssignmentEmail(backupSupervisorEmployeeId, name.trim(), 'Backup Supervisor');
//       }

//       res.status(201).json({
//         success: true,
//         message: 'Employee created successfully',
//         data: responseData
//       });

//     } catch (transactionError) {
//       await transaction.rollback();
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error('❌ Create employee error:', error);
//     res.status(500).json({ success: false, message: 'Error creating employee: ' + error.message });
//   }
// },

// // In your employeeController.js, find the updateEmployee function and REPLACE it with this:

//   updateEmployee: async (req, res) => {
//     let connection = null;
//     try {
//       console.log('=== UPDATE EMPLOYEE (HRM) ===');
//       const { companyId, employeeId } = req.params; // Note: employeeId is likely hrm.Employee.EmployeeId (PK)
//       const {
//         name, email, phone, department, position, employmentType,
//         status, hireDate, streetAddress, apartmentSuite, cityId, stateId, countryId, zipCode,
//         visaStatus, visaNumber, visaIssueDate, visaExpiryDate,
//         supervisorEmployeeId, backupSupervisorEmployeeId, timesheetRequired,
//         emergencyContactName, emergencyContactPhone,
//         mailingStreetAddress, mailingApartmentSuite, mailingCityId, mailingZipCode,
//         username, password, employeeId: newEmployeeCode, timePunchEnabled
//       } = req.body;
      
//       if (!companyId || !employeeId) {
//         return res.status(400).json({ success: false, message: 'Company ID and Employee ID are required' });
//       }

//       const pool = await poolPromise;

//       // 1. Fetch current employee and candidate info
//       const fetchRequest = new sql.Request(pool);
//       fetchRequest.input('entityId', sql.Int, parseInt(companyId));
      
//       const isNumeric = /^\d+$/.test(String(employeeId));
//       let fetchQuery = `
//         SELECT 
//           e.EmployeeId, e.EmployeeCode, e.CandidateId, e.EmploymentStatus, 
//           e.StartDate, e.EmployeeType, e.SupervisorEmployeeId, e.BackupSupervisorEmployeeId,
//           c.FirstName, c.LastName, c.JobTitle,
//           ci.IdentityValue as Email
//         FROM [hrm].[Employee] e
//         LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//         LEFT JOIN [recruit].[CandidateIdentity] ci ON ci.CandidateId = c.CandidateId 
//           AND ci.IdentityType = 'Email' AND ci.IsPrimary = 1
//         WHERE e.EntityId = @entityId AND e.IsDeleted = 0
//       `;

//       if (isNumeric) {
//         fetchRequest.input('empId', sql.Int, parseInt(employeeId));
//         fetchQuery += ` AND e.EmployeeId = @empId`;
//       } else {
//         fetchRequest.input('empCode', sql.NVarChar, employeeId);
//         fetchQuery += ` AND e.EmployeeCode = @empCode`;
//       }
      
//       const fetchResult = await fetchRequest.query(fetchQuery);

//       if (fetchResult.recordset.length === 0) {
//         return res.status(404).json({ success: false, message: 'Employee not found' });
//       }

//       const currentEmp = fetchResult.recordset[0];
//       const candidateId = currentEmp.CandidateId;
//       const prevStatus = currentEmp.EmploymentStatus;

//       // 2. Start Transaction
//       const transaction = new sql.Transaction(pool);
//       await transaction.begin();

//       try {
//         // Update Candidate Name
//         if (name) {
//           const nameParts = name.trim().split(' ');
//           const firstName = nameParts[0];
//           const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
//           const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

//           const candUpdate = new sql.Request(transaction);
//           candUpdate.input('candidateId', sql.Int, candidateId);
//           candUpdate.input('firstName', sql.NVarChar, firstName);
//           candUpdate.input('middleName', sql.NVarChar, middleName);
//           candUpdate.input('lastName', sql.NVarChar, lastName);
//           candUpdate.input('jobTitle', sql.NVarChar, position || currentEmp.JobTitle);
//           await candUpdate.query(`
//             UPDATE [recruit].[Candidate] 
//             SET FirstName = @firstName, MiddleName = @middleName, LastName = @lastName, JobTitle = @jobTitle
//             WHERE CandidateId = @candidateId
//           `);
//         }

//         // Update Identities
//         if (email || phone) {
//           const identUpdate = new sql.Request(transaction);
//           identUpdate.input('candidateId', sql.Int, candidateId);
          
//           if (email) {
//             identUpdate.input('email', sql.NVarChar, email.trim().toLowerCase());
//             await identUpdate.query(`
//               UPDATE [recruit].[CandidateIdentity] SET IdentityValue = @email 
//               WHERE CandidateId = @candidateId AND IdentityType = 'Email' AND IsPrimary = 1
//             `);
//           }
          
//           if (phone) {
//             identUpdate.input('phone', sql.NVarChar, phone.trim());
//             await identUpdate.query(`
//               UPDATE [recruit].[CandidateIdentity] SET IdentityValue = @phone 
//               WHERE CandidateId = @candidateId AND IdentityType = 'Phone' AND IsPrimary = 1
//             `);
//           }
//         }

//         // Update HRM Employee
//         const empUpdate = new sql.Request(transaction);
//         empUpdate.input('empId', sql.Int, currentEmp.EmployeeId);
        
//         const empTypeToUse = employmentType || currentEmp.EmployeeType;
//         let mappedUpdateEmployeeType = 'INTERNAL';
//         if (empTypeToUse && typeof empTypeToUse === 'string') {
//           const upperType = empTypeToUse.toUpperCase();
//           if (upperType.includes('C2C')) mappedUpdateEmployeeType = 'C2C';
//           else if (upperType.includes('DEPLOYED')) mappedUpdateEmployeeType = 'DEPLOYED';
//         }
//         empUpdate.input('type', sql.NVarChar, mappedUpdateEmployeeType);
//         empUpdate.input('status', sql.NVarChar, status || currentEmp.EmploymentStatus);
//         empUpdate.input('startDate', sql.Date, hireDate ? new Date(hireDate) : currentEmp.StartDate);
//         empUpdate.input('hireDate', sql.Date, hireDate ? new Date(hireDate) : currentEmp.StartDate);
        
//         const parseId = (id) => (id !== undefined && id !== null && id !== '' && !isNaN(parseInt(id))) ? parseInt(id) : null;
        
//         empUpdate.input('supervisorId', sql.BigInt, parseId(supervisorEmployeeId));
//         empUpdate.input('backupSupervisorId', sql.BigInt, parseId(backupSupervisorEmployeeId));
//         empUpdate.input('timesheetRequired', sql.Bit, !!timesheetRequired ? 1 : 0);
//         empUpdate.input('emergencyName', sql.NVarChar, emergencyContactName || null);
//         empUpdate.input('emergencyPhone', sql.NVarChar, emergencyContactPhone || null);
//         empUpdate.input('updatedBy', sql.Int, req.user?.id || null);
//         empUpdate.input('newCode', sql.NVarChar, newEmployeeCode || currentEmp.EmployeeCode);
//         empUpdate.input('timePunchEnabled', sql.Bit, timePunchEnabled !== undefined ? (!!timePunchEnabled ? 1 : 0) : null);

//         await empUpdate.query(`
//           UPDATE [hrm].[Employee]
//           SET 
//             EmployeeType = @type, 
//             EmploymentStatus = @status, 
//             StartDate = @startDate, 
//             HireDate = @hireDate,
//             SupervisorEmployeeId = @supervisorId,
//             BackupSupervisorEmployeeId = @backupSupervisorId,
//             TimesheetRequired = @timesheetRequired,
//             EmergencyContactName = @emergencyName,
//             EmergencyContactPhone = @emergencyPhone,
//             EmployeeCode = @newCode,
//             TimePunchEnabled = ISNULL(@timePunchEnabled, TimePunchEnabled),
//             UpdatedAtUtc = SYSUTCDATETIME(),
//             UpdatedByUserId = @updatedBy
//           WHERE EmployeeId = @empId
//         `);

//         // --- LOG SUPERVISOR HISTORY ---
//         const newSupId = parseId(supervisorEmployeeId);
//         const newBackupId = parseId(backupSupervisorEmployeeId);
        
//         if ((newSupId !== undefined && newSupId !== currentEmp.SupervisorEmployeeId) || 
//             (newBackupId !== undefined && newBackupId !== currentEmp.BackupSupervisorEmployeeId)) {
          
//           const historyReq = new sql.Request(transaction);
//           historyReq.input('empId', sql.BigInt, currentEmp.EmployeeId);
//           historyReq.input('fromSup', sql.BigInt, currentEmp.SupervisorEmployeeId);
//           historyReq.input('toSup', sql.BigInt, newSupId !== undefined ? newSupId : currentEmp.SupervisorEmployeeId);
//           historyReq.input('fromBackup', sql.BigInt, currentEmp.BackupSupervisorEmployeeId);
//           historyReq.input('toBackup', sql.BigInt, newBackupId !== undefined ? newBackupId : currentEmp.BackupSupervisorEmployeeId);
//           historyReq.input('reason', sql.NVarChar, 'ROUTINE');
//           historyReq.input('userId', sql.BigInt, req.user?.id || null);
//           historyReq.input('userName', sql.NVarChar, req.user?.username || 'System');

//           await historyReq.query(`
//             INSERT INTO [hrm].[EmployeeSupervisorHistory] (
//               EmployeeId, FromSupervisorEmployeeId, ToSupervisorEmployeeId, 
//               FromBackupSupervisorEmployeeId, ToBackupSupervisorEmployeeId, 
//               ChangeReasonCode, ChangedAtUtc, ChangedByUserId, ChangedByUserName
//             ) VALUES (
//               @empId, @fromSup, @toSup, @fromBackup, @toBackup, 'ROUTINE', SYSUTCDATETIME(), @userId, @userName
//             )
//           `);
//           console.log(`✅ Logged supervisor history for EmployeeId: ${currentEmp.EmployeeId}`);
//         }

//         // --- SYNC WITH USERINFO ---
//         const finalEmployeeCode = newEmployeeCode || currentEmp.EmployeeCode;
//         if (finalEmployeeCode) {
//           const userSyncReq = new sql.Request(transaction);
//           userSyncReq.input('empCode', sql.NVarChar, finalEmployeeCode.trim());
//           userSyncReq.input('currentCode', sql.NVarChar, (currentEmp.EmployeeCode || '').trim());
//           userSyncReq.input('email', sql.NVarChar, (email || currentEmp.Email || '').trim().toLowerCase());
          
//           // Try to find user by existing EmployeeId (code), username (email), or userdetails.email
//           const userCheck = await userSyncReq.query(`
//             SELECT TOP 1 u.id 
//             FROM userinfo u
//             LEFT JOIN userdetails d ON u.id = d.id
//             WHERE (u.EmployeeId = @currentCode AND @currentCode <> '')
//                OR (LOWER(u.username) = LOWER(@email) AND @email <> '')
//                OR (LOWER(d.email) = LOWER(@email) AND @email <> '')
//           `);

//           if (userCheck.recordset.length > 0) {
//             const userId = userCheck.recordset[0].id;
//             const userUpdateReq = new sql.Request(transaction);
//             userUpdateReq.input('userId', sql.Int, userId);
//             userUpdateReq.input('empCode', sql.NVarChar, finalEmployeeCode.trim());
            
//             let updateQuery = `UPDATE userinfo SET EmployeeId = @empCode`;
            
//             if (username) {
//               userUpdateReq.input('username', sql.NVarChar, username.trim().toLowerCase());
//               updateQuery += `, username = @username`;
//             }
            
//             if (password && password.trim() !== '') {
//               const bcrypt = require('bcryptjs');
//               const hashedPassword = await bcrypt.hash(password, 10);
//               userUpdateReq.input('password', sql.NVarChar, hashedPassword);
//               updateQuery += `, password = @password`;
//             }
            
//             updateQuery += ` WHERE id = @userId`;
//             await userUpdateReq.query(updateQuery);
//             console.log(`✅ Synced userinfo for UserID ${userId} with EmployeeId ${finalEmployeeCode}`);
//           }
//         }

//         // Notify Supervisors if assignment changed
//         const currentSupervisorId = currentEmp.SupervisorEmployeeId;
//         const currentBackupId = currentEmp.BackupSupervisorEmployeeId;
//         const empDisplayName = name || `${currentEmp.FirstName} ${currentEmp.LastName}`;

//         if (supervisorEmployeeId && parseInt(supervisorEmployeeId) !== currentSupervisorId) {
//           await sendSupervisorAssignmentEmail(supervisorEmployeeId, empDisplayName, 'Primary Supervisor');
//         }
//         if (backupSupervisorEmployeeId && parseInt(backupSupervisorEmployeeId) !== currentBackupId) {
//           await sendSupervisorAssignmentEmail(backupSupervisorEmployeeId, empDisplayName, 'Backup Supervisor');
//         }


//         // 3.5 Update Addresses (Home and Mailing)
        
//         // --- HOME ADDRESS ---
//         let homeAddressId = null;
//         if (streetAddress !== undefined || cityId !== undefined || zipCode !== undefined) {
//           const checkAddrReq = new sql.Request(transaction);
//           checkAddrReq.input('candidateId', sql.Int, candidateId);
//           const addrCheck = await checkAddrReq.query(`
//             SELECT TOP 1 ea.AddressId
//             FROM [core].[EntityAddress] ea
//             WHERE ea.EntityType = 'CANDIDATE' AND ea.EntityId = @candidateId
//             ORDER BY ea.IsPrimary DESC
//           `);

//           if (addrCheck.recordset.length > 0) {
//             homeAddressId = addrCheck.recordset[0].AddressId;
//             const updateAddrReq = new sql.Request(transaction);
//             updateAddrReq.input('addrId', sql.Int, homeAddressId);
//             updateAddrReq.input('cityId', sql.Int, cityId !== undefined && cityId !== null && cityId !== '' ? parseInt(cityId) : null);
//             updateAddrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
//             updateAddrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
//             updateAddrReq.input('zipCode', sql.NVarChar, zipCode || null);
            
//             await updateAddrReq.query(`
//               UPDATE [core].[Address] 
//               SET CityId = ISNULL(@cityId, CityId), 
//                   Line1 = ISNULL(@streetAddress, Line1), 
//                   Line2 = ISNULL(@apartmentSuite, Line2), 
//                   PostalCode = ISNULL(@zipCode, PostalCode)
//               WHERE AddressId = @addrId
//             `);
//           } else if (streetAddress || cityId || zipCode) {
//             const createAddrReq = new sql.Request(transaction);
//             const parseId = (id) => (id !== undefined && id !== null && id !== '' && !isNaN(parseInt(id))) ? parseInt(id) : null;
//             createAddrReq.input('cityId', sql.Int, parseId(cityId));
//             createAddrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
//             createAddrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
//             createAddrReq.input('zipCode', sql.NVarChar, zipCode || null);
//             const addrResult = await createAddrReq.query(`
//               INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
//               OUTPUT INSERTED.AddressId
//               VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
//             `);
//             homeAddressId = addrResult.recordset[0].AddressId;

//             const linkAddrReq = new sql.Request(transaction);
//             linkAddrReq.input('candId', sql.Int, candidateId);
//             linkAddrReq.input('addrId', sql.Int, homeAddressId);
//             await linkAddrReq.query(`
//               INSERT INTO [core].[EntityAddress] (EntityType, EntityId, AddressId, AddressType, IsPrimary)
//               VALUES ('CANDIDATE', @candId, @addrId, 'CURRENT', 1)
//             `);
//           }
          
//           if (homeAddressId) {
//             const linkEmpHome = new sql.Request(transaction);
//             linkEmpHome.input('empId', sql.Int, currentEmp.EmployeeId);
//             linkEmpHome.input('addrId', sql.Int, homeAddressId);
//             await linkEmpHome.query(`UPDATE [hrm].[Employee] SET HomeAddressId = @addrId WHERE EmployeeId = @empId`);
//           }
//         }

//         // --- MAILING ADDRESS ---
//         if (mailingStreetAddress || mailingCityId || mailingZipCode) {
//           // Check if mailing address already exists in hrm.Employee
//           const checkMailing = new sql.Request(transaction);
//           checkMailing.input('empId', sql.Int, currentEmp.EmployeeId);
//           const mailResult = await checkMailing.query(`SELECT MailingAddressId FROM [hrm].[Employee] WHERE EmployeeId = @empId`);
          
//           let mailingAddressId = mailResult.recordset.length > 0 ? mailResult.recordset[0].MailingAddressId : null;
          
//           if (mailingAddressId) {
//             const updateMailReq = new sql.Request(transaction);
//             updateMailReq.input('addrId', sql.Int, mailingAddressId);
//             updateMailReq.input('cityId', sql.Int, mailingCityId ? parseInt(mailingCityId) : null);
//             updateMailReq.input('streetAddress', sql.NVarChar, mailingStreetAddress || null);
//             updateMailReq.input('apartmentSuite', sql.NVarChar, mailingApartmentSuite || null);
//             updateMailReq.input('zipCode', sql.NVarChar, mailingZipCode || null);
            
//             await updateMailReq.query(`
//               UPDATE [core].[Address] 
//               SET CityId = ISNULL(@cityId, CityId), 
//                   Line1 = ISNULL(@streetAddress, Line1), 
//                   Line2 = ISNULL(@apartmentSuite, Line2), 
//                   PostalCode = ISNULL(@zipCode, PostalCode)
//               WHERE AddressId = @addrId
//             `);
//           } else {
//             const createMailReq = new sql.Request(transaction);
//             createMailReq.input('cityId', sql.Int, mailingCityId ? parseInt(mailingCityId) : null);
//             createMailReq.input('streetAddress', sql.NVarChar, mailingStreetAddress || null);
//             createMailReq.input('apartmentSuite', sql.NVarChar, mailingApartmentSuite || null);
//             createMailReq.input('zipCode', sql.NVarChar, mailingZipCode || null);
//             const mResult = await createMailReq.query(`
//               INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
//               OUTPUT INSERTED.AddressId
//               VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
//             `);
//             mailingAddressId = mResult.recordset[0].AddressId;
            
//             const linkEmpMail = new sql.Request(transaction);
//             linkEmpMail.input('empId', sql.Int, currentEmp.EmployeeId);
//             linkEmpMail.input('addrId', sql.Int, mailingAddressId);
//             await linkEmpMail.query(`UPDATE [hrm].[Employee] SET MailingAddressId = @addrId WHERE EmployeeId = @empId`);
//           }
//         }

//         // Update Work Authorization
//         if (visaStatus) {
//           const authCheck = new sql.Request(transaction);
//           authCheck.input('employeeId', sql.BigInt, currentEmp.EmployeeId);
//           const authResult = await authCheck.query(`
//             SELECT WorkAuthorizationId FROM [hrm].[EmployeeWorkAuthorization]
//             WHERE EmployeeId = @employeeId AND StatusCode = 'ACTIVE'
//           `);

//           const visaReq = new sql.Request(transaction);
//           visaReq.input('employeeId', sql.BigInt, currentEmp.EmployeeId);
//           visaReq.input('authType', sql.NVarChar, visaStatus);
//           visaReq.input('authNum', sql.NVarChar, visaNumber || null);
          
//           let iDate = null;
//           if (visaIssueDate && String(visaIssueDate).trim() !== '') iDate = new Date(visaIssueDate);
//           visaReq.input('iDate', sql.Date, iDate);
          
//           let eDate = null;
//           if (visaExpiryDate && String(visaExpiryDate).trim() !== '') eDate = new Date(visaExpiryDate);
//           visaReq.input('eDate', sql.Date, eDate);

//           if (authResult.recordset.length > 0) {
//             const authId = authResult.recordset[0].WorkAuthorizationId;
//             visaReq.input('authId', sql.BigInt, authId);
//             await visaReq.query(`
//               UPDATE [hrm].[EmployeeWorkAuthorization]
//               SET AuthorizationType = @authType, AuthorizationNumber = @authNum, IssueDate = @iDate, ExpiryDate = @eDate, UpdatedAtUtc = SYSUTCDATETIME()
//               WHERE WorkAuthorizationId = @authId
//             `);
//           } else {
//             await visaReq.query(`
//               INSERT INTO [hrm].[EmployeeWorkAuthorization] (
//                 EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate, StatusCode
//               ) VALUES (
//                 @employeeId, @authType, @authNum, @iDate, @eDate, 'ACTIVE'
//               )
//             `);
//           }
//         }

//         // Update Address logic
//         if (streetAddress !== undefined || cityId !== undefined || zipCode !== undefined) {
//           const checkAddrReq = new sql.Request(transaction);
//           checkAddrReq.input('candidateId', sql.Int, candidateId);
//           const addrCheck = await checkAddrReq.query(`
//             SELECT TOP 1 ea.AddressId
//             FROM [core].[EntityAddress] ea
//             WHERE ea.EntityType = 'CANDIDATE' AND ea.EntityId = @candidateId
//             ORDER BY ea.IsPrimary DESC
//           `);

//           if (addrCheck.recordset.length > 0) {
//             const existingAddrId = addrCheck.recordset[0].AddressId;
//             const updateAddrReq = new sql.Request(transaction);
//             updateAddrReq.input('addrId', sql.Int, existingAddrId);
//             updateAddrReq.input('cityId', sql.Int, cityId !== undefined && cityId !== null && cityId !== '' ? parseInt(cityId) : null);
//             updateAddrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
//             updateAddrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
//             updateAddrReq.input('zipCode', sql.NVarChar, zipCode || null);
            
//             await updateAddrReq.query(`
//               UPDATE [core].[Address] 
//               SET CityId = ISNULL(@cityId, CityId), 
//                   Line1 = ISNULL(@streetAddress, Line1), 
//                   Line2 = ISNULL(@apartmentSuite, Line2), 
//                   PostalCode = ISNULL(@zipCode, PostalCode)
//               WHERE AddressId = @addrId
//             `);
//           } else if (streetAddress || cityId || zipCode) {
//             // Create new address if none exists
//             const createAddrReq = new sql.Request(transaction);
//             createAddrReq.input('cityId', sql.Int, cityId !== undefined && cityId !== null && cityId !== '' ? parseInt(cityId) : null);
//             createAddrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
//             createAddrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
//             createAddrReq.input('zipCode', sql.NVarChar, zipCode || null);
            
//             const addrResult = await createAddrReq.query(`
//               INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
//               OUTPUT INSERTED.AddressId
//               VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
//             `);
//             const newAddressId = addrResult.recordset[0].AddressId;

//             const linkAddrReq = new sql.Request(transaction);
//             linkAddrReq.input('candId', sql.Int, candidateId);
//             linkAddrReq.input('addrId', sql.Int, newAddressId);
//             await linkAddrReq.query(`
//               INSERT INTO [core].[EntityAddress] (EntityType, EntityId, AddressId, AddressType, IsPrimary)
//               VALUES ('CANDIDATE', @candId, @addrId, 'CURRENT', 1)
//             `);
//           }
//         }

//         // Log Status History if changed
//         if (status && status !== prevStatus) {
//           const historyUpdate = new sql.Request(transaction);
//           historyUpdate.input('empId', sql.Int, parseInt(employeeId));
//           historyUpdate.input('fromStatus', sql.NVarChar, prevStatus);
//           historyUpdate.input('toStatus', sql.NVarChar, status);
//           await historyUpdate.query(`
//             INSERT INTO [hrm].[EmployeeStatusHistory] (EmployeeId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserName)
//             VALUES (@empId, @fromStatus, @toStatus, SYSUTCDATETIME(), 'System')
//           `);
//         }

//         await transaction.commit();
        
//         // Fetch and return full updated employee data (using the same query as getAllEmployees)
//         const finalRequest = new sql.Request(pool);
        
//         // Use the comprehensive query from getAllEmployees to get all fields including joined data
//         const fullQuery = `
//           SELECT 
//             e.EmployeeId as Id,
//             e.EmployeeId,
//             e.EmployeeCode,
//             e.EmployeeCode as [employeeId],
//             e.EmployeeType,
//             e.EntityId,
//             e.CandidateId,
//             e.SupervisorEmployeeId,
//             e.BackupSupervisorEmployeeId,
//             e.HireDate,
//             e.StartDate,
//             e.EndDate,
//             e.EmploymentStatus,
//             e.PayrollSystemId,
//             e.TimesheetRequired,
//             e.HomeAddressId,
//             e.MailingAddressId,
//             e.EmergencyContactName,
//             e.EmergencyContactPhone,
//             e.IsDeleted,
//             e.CreatedAtUtc,
//             e.CreatedByUserId,
//             e.UpdatedAtUtc,
//             e.UpdatedByUserId,
//             c.FirstName,
//             c.MiddleName,
//             c.LastName,
//             TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
//             c.JobTitle as Position,
//             c.JobTitle,
//             ci_email.IdentityValue as Email,
//             ci_phone.IdentityValue as Phone,
//             c.CandidateCode,
//             wa.AuthorizationType as VisaStatus,
//             wa.AuthorizationNumber as VisaNumber,
//             wa.IssueDate as VisaIssueDate,
//             wa.ExpiryDate as VisaExpiryDate,
//             addr.Line1 as StreetAddress,
//             addr.Line2 as ApartmentSuite,
//             addr.CityId as cityId,
//             city.StateId as stateId,
//             state.CountryId as countryId,
//             addr.PostalCode as ZipCode,
//             city.Name as City,
//             state.Code as State,
//             country.Name as Country,
//             TRIM(CONCAT(sc.FirstName, ' ', ISNULL(sc.MiddleName + ' ', ''), sc.LastName)) as SupervisorName,
//             TRIM(CONCAT(bsc.FirstName, ' ', ISNULL(bsc.MiddleName + ' ', ''), bsc.LastName)) as BackupSupervisorName,
//             m_addr.Line1 as MailingStreetAddress,
//             m_addr.Line2 as MailingApartmentSuite,
//             m_addr.CityId as mailingCityId,
//             m_city.StateId as mailingStateId,
//             m_state.CountryId as mailingCountryId,
//             m_addr.PostalCode as MailingZipCode,
//             m_city.Name as MailingCity,
//             m_state.Code as MailingState,
//             m_country.Name as MailingCountry
//           FROM [hrm].[Employee] e
//           LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//           LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//           LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
//           LEFT JOIN [core].[EntityAddress] ea ON ea.EntityId = c.CandidateId AND ea.EntityType = 'CANDIDATE' AND ea.IsPrimary = 1
//           LEFT JOIN [core].[Address] addr ON addr.AddressId = ea.AddressId
//           LEFT JOIN [core].[City] city ON city.CityId = addr.CityId
//           LEFT JOIN [core].[StateProvince] state ON state.StateId = city.StateId
//           LEFT JOIN [core].[Country] country ON country.CountryId = state.CountryId
//           LEFT JOIN (
//             SELECT EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate,
//                    ROW_NUMBER() OVER(PARTITION BY EmployeeId ORDER BY CreatedAtUtc DESC) as rn
//             FROM [hrm].[EmployeeWorkAuthorization]
//             WHERE StatusCode = 'ACTIVE'
//           ) wa ON wa.EmployeeId = e.EmployeeId AND wa.rn = 1
//           LEFT JOIN [hrm].[Employee] s ON e.SupervisorEmployeeId = s.EmployeeId
//           LEFT JOIN [recruit].[Candidate] sc ON s.CandidateId = sc.CandidateId
//           LEFT JOIN [hrm].[Employee] bs ON e.BackupSupervisorEmployeeId = bs.EmployeeId
//           LEFT JOIN [recruit].[Candidate] bsc ON bs.CandidateId = bsc.CandidateId
//           LEFT JOIN [core].[Address] m_addr ON m_addr.AddressId = e.MailingAddressId
//           LEFT JOIN [core].[City] m_city ON m_city.CityId = m_addr.CityId
//           LEFT JOIN [core].[StateProvince] m_state ON m_state.StateId = m_city.StateId
//           LEFT JOIN [core].[Country] m_country ON m_country.CountryId = m_state.CountryId
//           WHERE e.EmployeeId = @empId
//         `;

//         finalRequest.input('empId', sql.Int, currentEmp.EmployeeId);
//         const finalResult = await finalRequest.query(fullQuery);

//         res.json({ 
//           success: true, 
//           message: 'Employee updated successfully',
//           data: finalResult.recordset[0]
//         });

//       } catch (err) {
//         await transaction.rollback();
//         throw err;
//       }

//     } catch (error) {
//       console.error('Update error:', error);
//       res.status(500).json({ success: false, message: 'Error updating employee', error: error.message });
//     } finally {
//       // Shared pool should not be closed
//     }
//   },

//   deleteEmployee: async (req, res) => {
//     try {
//       const pool = await poolPromise;
//       const { companyId, employeeId } = req.params;
//       if (!companyId || !employeeId) {
//         return res.status(400).json({ success: false, message: 'Company ID and Employee ID are required' });
//       }

//       const request = new sql.Request(pool);
//       request.input('entityId', sql.Int, parseInt(companyId));
//       request.input('employeeId', sql.Int, parseInt(employeeId));

//       const result = await request.query(`
//         UPDATE [hrm].[Employee] 
//         SET IsDeleted = 1, UpdatedAtUtc = SYSUTCDATETIME() 
//         WHERE EmployeeId = @employeeId AND EntityId = @entityId
//       `);
      
//       if (result.rowsAffected[0] === 0) {
//         return res.status(404).json({ success: false, message: 'Employee not found' });
//       }
//       res.json({ success: true, message: 'Employee soft-deleted successfully' });
//     } catch (error) {
//       console.error('Delete error:', error);
//       res.status(500).json({ success: false, message: 'Error deleting employee', error: error.message });
//     }
//   },

//   updateEmployeeStatus: async (req, res) => {
//     let connection = null;
//     try {
//       const { companyId, employeeId } = req.params;
//       const { status } = req.body;

//       if (!status) {
//         return res.status(400).json({ success: false, message: 'Status is required' });
//       }

//       const pool = await poolPromise;

//       // Start transaction
//       const transaction = new sql.Transaction(pool);
//       await transaction.begin();

//       try {
//         const request = new sql.Request(transaction);
//         request.input('empId', sql.Int, parseInt(employeeId));
//         request.input('status', sql.NVarChar, status);

//         // Update employee status
//         const updateResult = await request.query(`
//           UPDATE [hrm].[Employee]
//           SET EmploymentStatus = @status, UpdatedAtUtc = SYSUTCDATETIME()
//           WHERE EmployeeId = @empId AND IsDeleted = 0
//         `);

//         if (updateResult.rowsAffected[0] === 0) {
//           await transaction.rollback();
//           return res.status(404).json({ success: false, message: 'Employee not found' });
//         }

//         // Log status history
//         await request.query(`
//           INSERT INTO [hrm].[EmployeeStatusHistory] (EmployeeId, ToStatus, ChangedAtUtc, ChangedByUserName)
//           VALUES (@empId, @status, SYSUTCDATETIME(), 'System')
//         `);

//         await transaction.commit();
//         res.json({ success: true, message: 'Employee status updated successfully', status });
//       } catch (err) {
//         await transaction.rollback();
//         throw err;
//       }
//     } catch (error) {
//       console.error('Update status error:', error);
//       res.status(500).json({ success: false, message: 'Error updating employee status', error: error.message });
//     } finally {
//       // Shared pool should not be closed
//     }
//   },

//   getEmployeesByDepartment: async (req, res) => {
//     try {
//       const pool = await poolPromise;
//       const { companyId, department } = req.params;
      
//       if (!companyId || !department) {
//         return res.status(400).json({ success: false, message: 'Company ID and Department are required' });
//       }

//       const result = await sql.query(`
//         SELECT 
//           e.*, 
//           c.FirstName, c.LastName,
//           TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
//           ci_email.IdentityValue as Email
//         FROM [hrm].[Employee] e
//         LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//         LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//         WHERE e.EntityId = ${parseInt(companyId)} AND e.Department = '${department}' AND e.IsDeleted = 0
//         ORDER BY c.FirstName ASC
//       `);
      
//       res.json({
//         success: true,
//         data: result.recordset,
//         count: result.recordset.length,
//         department: department,
//         companyId: parseInt(companyId)
//       });
//     } catch (error) {
//       console.error('Get employees by department error:', error);
//       res.status(500).json({ success: false, message: 'Error retrieving employees by department', error: error.message });
//     }
//   },

//   searchEmployees: async (req, res) => {
//     try {
//       const pool = await poolPromise;
//       const { companyId } = req.params;
//       const { q, limit = 50 } = req.query;
      
//       if (!companyId) return res.status(400).json({ success: false, message: 'Company ID is required' });
//       if (!q || q.trim().length < 2) return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });

//       const request = new sql.Request(pool);
//       request.input('search', sql.NVarChar, `%${q.trim()}%`);
//       request.input('entityId', sql.Int, parseInt(companyId));
//       request.input('limit', sql.Int, parseInt(limit));
      
//       const result = await request.query(`
//         SELECT TOP (@limit) 
//           e.*, 
//           c.FirstName, c.LastName,
//           TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
//           ci_email.IdentityValue as Email
//         FROM [hrm].[Employee] e
//         LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//         LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//         WHERE e.EntityId = @entityId AND e.IsDeleted = 0
//         AND (c.FirstName LIKE @search OR c.LastName LIKE @search OR ci_email.IdentityValue LIKE @search OR e.EmployeeCode LIKE @search)
//         ORDER BY c.FirstName ASC
//       `);
      
//       res.json({ success: true, data: result.recordset, count: result.recordset.length });
//     } catch (error) {
//       console.error('Search employees error:', error);
//       res.status(500).json({ success: false, message: 'Error searching employees', error: error.message });
//     }
//   },

//   getEmployeeStats: async (req, res) => {
//     try {
//       const pool = await poolPromise;
//       const { companyId } = req.params;
//       if (!companyId) return res.status(400).json({ success: false, message: 'Company ID is required' });

//       const result = await sql.query(`
//         SELECT 
//           COUNT(*) as total,
//           SUM(CASE WHEN e.EmploymentStatus = 'Active' THEN 1 ELSE 0 END) as active,
//           SUM(CASE WHEN e.EmploymentStatus = 'Inactive' THEN 1 ELSE 0 END) as inactive,
//           SUM(CASE WHEN e.EmploymentStatus = 'On Leave' THEN 1 ELSE 0 END) as onLeave,
//           SUM(CASE WHEN e.EmployeeType = 'Full-time' THEN 1 ELSE 0 END) as fullTime,
//           SUM(CASE WHEN e.EmployeeType = 'Part-time' THEN 1 ELSE 0 END) as partTime,
//           SUM(CASE WHEN e.EmployeeType = 'Contract' THEN 1 ELSE 0 END) as contract
//         FROM [hrm].[Employee] e
//         LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//         WHERE e.EntityId = ${parseInt(companyId)} AND e.IsDeleted = 0
//       `);
      
//       res.json({ success: true, data: { ...result.recordset[0], departments: 0 }, companyId: parseInt(companyId) });
//     } catch (error) {
//       console.error('Get employee stats error:', error);
//       res.status(500).json({ success: false, message: 'Error retrieving employee stats', error: error.message });
//     }
//   },

//   getEmployeeDetails: async (req, res) => {
//     try {
//       console.log('=== GET EMPLOYEE DETAILS (HRM) ===');
//       const { companyId, employeeId } = req.params;
      
//       if (!companyId || !employeeId) {
//         return res.status(400).json({ success: false, message: 'Company ID and Employee ID are required' });
//       }

//       const pool = await poolPromise;
//       const request = new sql.Request(pool);
//       request.input('entityId', sql.Int, parseInt(companyId));
      
//       // Determine if employeeId is numeric ID or alphanumeric Code
//       const isNumeric = /^\d+$/.test(String(employeeId));
      
//       let query = `
//         SELECT 
//           e.*,
//           e.EmployeeType as EmploymentType,
//           e.EmploymentStatus as Status,
//           c.FirstName, c.MiddleName, c.LastName,
//           c.JobTitle as Position,
//           TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
//           ci_email.IdentityValue as Email,
//           ci_phone.IdentityValue as Phone
//         FROM [hrm].[Employee] e
//         LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//         LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
//         LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
//         WHERE e.EntityId = @entityId AND e.IsDeleted = 0
//       `;

//       if (isNumeric) {
//         request.input('empId', sql.Int, parseInt(employeeId));
//         query += ` AND e.EmployeeId = @empId`;
//       } else {
//         request.input('empCode', sql.NVarChar, employeeId);
//         query += ` AND e.EmployeeCode = @empCode`;
//       }
      
//       const empResult = await request.query(query);

//       if (empResult.recordset.length === 0) {
//         return res.status(404).json({ success: false, message: 'Employee not found' });
//       }

//       const employee = empResult.recordset[0];
//       const actualDbEmployeeId = employee.EmployeeId;

//       // 2. Get Timesheet Stats (from hrm.Timesheet)
//       const tsRequest = new sql.Request(pool);
//       tsRequest.input('empId', sql.BigInt, actualDbEmployeeId);
//       const tsResult = await tsRequest.query(`
//         SELECT 
//           COUNT(*) as total,
//           SUM(CASE WHEN StatusCode = 'SUBMITTED' AND (Notes IS NULL OR Notes NOT LIKE 'ATTACHMENT:%') THEN 1 ELSE 0 END) as internalPending,
//           SUM(CASE WHEN StatusCode = 'SUBMITTED' AND Notes LIKE 'ATTACHMENT:%' THEN 1 ELSE 0 END) as externalPending,
//           SUM(CASE WHEN StatusCode = 'SUBMITTED' THEN 1 ELSE 0 END) as pending,
//           SUM(CASE WHEN StatusCode = 'APPROVED' THEN 1 ELSE 0 END) as approved,
//           SUM(CASE WHEN StatusCode = 'REJECTED' THEN 1 ELSE 0 END) as rejected
//         FROM [hrm].[Timesheet]
//         WHERE EmployeeId = @empId
//       `);

//       res.json({
//         success: true,
//         data: {
//           employee: employee,
//           stats: {
//             timesheets: tsResult.recordset[0]
//           }
//         }
//       });
//     } catch (error) {
//       console.error('Get details error:', error);
//       res.status(500).json({ success: false, message: 'Error retrieving employee details', error: error.message });
//     }
//   },

//   getEmployeeTimesheets: async (req, res) => {
//     try {
//       const { companyId, employeeId } = req.params;
//       const { status, startDate, endDate } = req.query;
      
//       const pool = await poolPromise;
      
//       // 1. Resolve numeric ID if alphanumeric code was provided
//       let actualDbEmployeeId = parseInt(employeeId);
//       if (isNaN(actualDbEmployeeId)) {
//         const resolveReq = new sql.Request(pool);
//         resolveReq.input('code', sql.NVarChar, employeeId);
//         resolveReq.input('entityId', sql.Int, parseInt(companyId));
//         const resolveRes = await resolveReq.query(`SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @code AND EntityId = @entityId`);
//         if (resolveRes.recordset.length === 0) {
//           return res.status(404).json({ success: false, message: 'Employee not found' });
//         }
//         actualDbEmployeeId = resolveRes.recordset[0].EmployeeId;
//       }

//       const request = new sql.Request(pool);
//       request.input('empId', sql.BigInt, actualDbEmployeeId);
//       request.input('entityId', sql.Int, parseInt(companyId));
      
//       let query = `
//         SELECT 
//           t.TimesheetId as id,
//           t.TimesheetId,
//           t.EmployeeId,
//           t.EntityId as CompanyId,
//           t.WeekStartDate as PeriodStart,
//           t.WeekEndDate as PeriodEnd,
//           t.TotalHours,
//           CASE 
//             WHEN t.StatusCode = 'SUBMITTED' THEN 'Pending'
//             WHEN t.StatusCode = 'APPROVED' THEN 'Approved'
//             WHEN t.StatusCode = 'REJECTED' THEN 'Rejected'
//             ELSE t.StatusCode
//           END as Status,
//           t.CreatedAtUtc as CreatedAt,
//           t.UpdatedAtUtc as UpdatedAt,
//           TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as EmployeeName,
//           c.JobTitle as Position
//         FROM [hrm].[Timesheet] t
//         JOIN [hrm].[Employee] e ON t.EmployeeId = e.EmployeeId
//         JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//         WHERE t.EmployeeId = @empId AND t.EntityId = @entityId AND t.StatusCode != 'DRAFT'
//       `;
      
//       if (status && status !== 'All') {
//         query += ' AND t.StatusCode = @status';
//         request.input('status', sql.NVarChar, status.toUpperCase());
//       }
      
//       if (startDate) {
//         query += ' AND t.WeekStartDate >= @startDate';
//         request.input('startDate', sql.Date, new Date(startDate));
//       }
      
//       if (endDate) {
//         query += ' AND t.WeekEndDate <= @endDate';
//         request.input('endDate', sql.Date, new Date(endDate));
//       }
      
//       query += ' ORDER BY t.WeekStartDate DESC';
      
//       const result = await request.query(query);
      
//       res.json({
//         success: true,
//         data: result.recordset,
//         count: result.recordset.length
//       });
//     } catch (error) {
//       console.error('Get employee timesheets error:', error);
//       res.status(500).json({ success: false, message: 'Error retrieving employee timesheets', error: error.message });
//     }
//   },

//   getEmployeeExternalTimesheets: async (req, res) => {
//     try {
//       const { companyId, employeeId } = req.params;
//       const pool = await poolPromise;

//       // Resolve numeric EmployeeId if code is passed
//       let resolvedEmpId = parseInt(employeeId);
//       if (isNaN(resolvedEmpId)) {
//         const empLookup = await pool.request()
//           .input('code', sql.NVarChar, employeeId)
//           .query('SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @code');
//         if (empLookup.recordset.length > 0) {
//           resolvedEmpId = empLookup.recordset[0].EmployeeId;
//         } else {
//           return res.status(404).json({ success: false, message: 'Employee not found' });
//         }
//       }
      
//       const request = new sql.Request(pool);
//       request.input('empId', sql.BigInt, resolvedEmpId);
//       request.input('entityId', sql.BigInt, parseInt(companyId));
      
//       // Fetch from EmployeeDocument to show ALL uploads
//       const result = await request.query(`
//         SELECT 
//           ed.DocumentId as Id,
//           ed.DocumentId as FileId,
//           d.OriginalFileName as FileName,
//           d.StorageLocator as FilePath,
//           d.FileExtension as FileType,
//           d.UploadedAtUtc as UploadDate,
//           d.UploadedAtUtc as CreatedAt,
//           ISNULL(t.StatusCode, 'SUBMITTED') as Status,
//           t.WeekStartDate as PeriodStart,
//           t.WeekEndDate as PeriodEnd,
//           t.TimesheetId -- May be NULL if orphaned
//         FROM [hrm].[EmployeeDocument] ed
//         JOIN [core].[Document] d ON ed.CoreDocumentId = d.DocumentId
//         JOIN [hrm].[Employee] e ON ed.EmployeeId = e.EmployeeId
//         LEFT JOIN [hrm].[Timesheet] t ON t.EmployeeId = ed.EmployeeId 
//              AND (t.Notes LIKE '%CORE_DOC_ID:' + CAST(ed.CoreDocumentId as VARCHAR) + '%'
//                   OR (t.Notes IS NULL AND ed.Notes LIKE '%' + CAST(t.WeekStartDate as VARCHAR) + '%'))
//         WHERE ed.EmployeeId = @empId 
//           AND e.EntityId = @entityId
//           AND ed.DocumentType = 'Timesheet'
//           AND ed.IsDeleted = 0
//         ORDER BY d.UploadedAtUtc DESC
//       `);
      
//       const data = result.recordset.map(row => {
//         const periodStart = row.PeriodStart ? new Date(row.PeriodStart) : null;
//         let periodStr = 'N/A';
        
//         if (periodStart) {
//           periodStr = `${(periodStart.getMonth() + 1).toString().padStart(2, '0')}/${periodStart.getFullYear()}`;
//         } else if (row.UploadDate) {
//           // Fallback: Use upload month if no specific work period is found
//           const uDate = new Date(row.UploadDate);
//           periodStr = `${(uDate.getMonth() + 1).toString().padStart(2, '0')}/${uDate.getFullYear()}`;
//         }
        
//         return {
//           ...row,
//           Period: periodStr
//         };
//       });

//       res.json({
//         success: true,
//         data: data,
//         count: data.length,
//         message: 'External timesheets retrieved successfully'
//       });
//     } catch (error) {
//       console.error('Get employee external timesheets error:', error);
//       res.status(500).json({ success: false, message: 'Error retrieving external timesheets', error: error.message });
//     }
//   },


//   getEmployeeStatements: async (req, res) => {
//     try {
//       const { companyId, employeeId } = req.params;
//       const pool = await poolPromise;
      
//       const request = new sql.Request(pool);
//       request.input('empId', sql.Int, parseInt(employeeId));
//       request.input('entityId', sql.Int, parseInt(companyId));
      
//       const result = await request.query(`
//         SELECT ps.* 
//         FROM EmployeePayStructure ps
//         JOIN [hrm].[Employee] e ON ps.EmployeeId = e.EmployeeCode
//         WHERE e.EmployeeId = @empId AND e.EntityId = @entityId
//         ORDER BY ps.CheckDate DESC
//       `);
      
//       res.json({ success: true, data: result.recordset || [], count: result.recordset.length });
//     } catch (error) {
//       console.error('Get statements error:', error.message);
//       res.status(500).json({ success: false, message: 'Error retrieving statements' });
//     }
//   },

//   getEmployeeReports: async (req, res) => {
//     try {
//       const { companyId, employeeId } = req.params;
//       const pool = await poolPromise;
      
//       const request = new sql.Request(pool);
//       request.input('empId', sql.Int, parseInt(employeeId));
//       request.input('entityId', sql.Int, parseInt(companyId));
      
//       const result = await request.query(`
//         SELECT er.* 
//         FROM EmployeeReports er
//         JOIN [hrm].[Employee] e ON er.EmployeeId = e.EmployeeCode
//         WHERE e.EmployeeId = @empId AND e.EntityId = @entityId
//         ORDER BY er.UploadDate DESC
//       `);
      
//       res.json({ success: true, data: result.recordset || [], count: result.recordset.length });
//     } catch (error) {
//       console.error('Get reports error:', error.message);
//       res.status(500).json({ success: false, message: 'Error retrieving reports' });
//     }
//   },


// // Replace these three functions in your employeeController.js

// approveExternalTimesheet: async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { companyId, employeeId, timesheetId } = req.params; // timesheetId here is EmployeeDocumentId
//     const managerId = req.user.id;

//     // 1. Resolve numeric EmployeeId if code is passed
//     let resolvedEmpId = parseInt(employeeId);
//     if (isNaN(resolvedEmpId)) {
//       const empLookup = await pool.request()
//         .input('code', sql.NVarChar, employeeId)
//         .query('SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @code');
//       if (empLookup.recordset.length > 0) {
//         resolvedEmpId = empLookup.recordset[0].EmployeeId;
//       } else {
//         return res.status(404).json({ success: false, message: 'Employee not found' });
//       }
//     }

//     // 2. Find the corresponding CoreDocumentId to identify the Timesheet
//     const docInfo = await pool.request()
//       .input("id", sql.Int, parseInt(timesheetId))
//       .query("SELECT CoreDocumentId FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");

//     if (docInfo.recordset.length === 0) {
//       return res.status(404).json({ success: false, message: 'Document record not found' });
//     }

//     const coreId = docInfo.recordset[0].CoreDocumentId;

//     // 3. Get the Manager's EmployeeId (for auditing)
//     const userResult = await pool.request()
//       .input('userId', sql.BigInt, managerId)
//       .query(`
//         SELECT e.EmployeeId 
//         FROM [hrm].[Employee] e 
//         JOIN userinfo u ON u.EmployeeId = e.EmployeeCode 
//         WHERE u.id = @userId
//       `);
//     const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;

//     // 4. Find and Update the Timesheet record
//     // We try to match by Notes containing the CoreDocumentId
//     const result = await pool.request()
//       .input("empId", sql.BigInt, resolvedEmpId)
//       .input("coreSearch", sql.NVarChar, `%CORE_DOC_ID:${coreId}%`)
//       .input("approverId", sql.BigInt, approverEmployeeId)
//       .input("userId", sql.BigInt, managerId)
//       .query(`
//         UPDATE [hrm].[Timesheet] 
//         SET StatusCode = 'APPROVED',
//             UpdatedAtUtc = SYSUTCDATETIME(),
//             UpdatedByUserId = @userId,
//             ApprovedAtUtc = SYSUTCDATETIME(),
//             ApprovedByEmployeeId = @approverId
//         WHERE EmployeeId = @empId AND Notes LIKE @coreSearch
//       `);

//     if (result.rowsAffected[0] === 0) {
//       // FALLBACK: If Notes link is broken (e.g. overwritten by a later upload), 
//       // try to find the timesheet for the same week.
//       // We can get the week from EmployeeDocument.Notes which says "Timesheet for week starting YYYY-MM-DD"
//       const edNotesResult = await pool.request()
//         .input("id", sql.Int, parseInt(timesheetId))
//         .query("SELECT Notes FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");
      
//       const edNotes = edNotesResult.recordset[0]?.Notes || '';
//       const dateMatch = edNotes.match(/\d{4}-\d{2}-\d{2}/);
      
//       if (dateMatch) {
//         const weekStart = dateMatch[0];
//         console.log(`🔍 Fallback: Searching for timesheet for Emp ${resolvedEmpId} starting ${weekStart}`);
        
//         const fallbackResult = await pool.request()
//           .input("empId", sql.BigInt, resolvedEmpId)
//           .input("weekStart", sql.Date, weekStart)
//           .input("approverId", sql.BigInt, approverEmployeeId)
//           .input("userId", sql.BigInt, managerId)
//           .query(`
//             UPDATE [hrm].[Timesheet] 
//             SET StatusCode = 'APPROVED',
//                 UpdatedAtUtc = SYSUTCDATETIME(),
//                 UpdatedByUserId = @userId,
//                 ApprovedAtUtc = SYSUTCDATETIME(),
//                 ApprovedByEmployeeId = @approverId
//             WHERE EmployeeId = @empId AND WeekStartDate = @weekStart
//           `);
          
//         if (fallbackResult.rowsAffected[0] > 0) {
//           return res.json({ success: true, message: 'Timesheet approved successfully (via week match)' });
//         }
//       }

//       return res.status(404).json({ success: false, message: 'Matching weekly timesheet record not found for this file' });
//     }

//     res.json({ success: true, message: 'Timesheet approved successfully' });
//   } catch (error) {
//     console.error('Approve external timesheet error:', error);
//     res.status(500).json({ success: false, message: 'Error approving timesheet', error: error.message });
//   }
// },


// rejectExternalTimesheet: async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { companyId, employeeId, timesheetId } = req.params; // timesheetId here is EmployeeDocumentId
//     const { reason } = req.body;
//     const managerId = req.user.id;

//     // 1. Resolve numeric EmployeeId if code is passed
//     let resolvedEmpId = parseInt(employeeId);
//     if (isNaN(resolvedEmpId)) {
//       const empLookup = await pool.request()
//         .input('code', sql.NVarChar, employeeId)
//         .query('SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @code');
//       if (empLookup.recordset.length > 0) {
//         resolvedEmpId = empLookup.recordset[0].EmployeeId;
//       } else {
//         return res.status(404).json({ success: false, message: 'Employee not found' });
//       }
//     }

//     // 2. Find the corresponding CoreDocumentId
//     const docInfo = await pool.request()
//       .input("id", sql.Int, parseInt(timesheetId))
//       .query("SELECT CoreDocumentId FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");

//     if (docInfo.recordset.length === 0) {
//       return res.status(404).json({ success: false, message: 'Document record not found' });
//     }

//     const coreId = docInfo.recordset[0].CoreDocumentId;

//     // 3. Find and Update the Timesheet record
//     const result = await pool.request()
//       .input("empId", sql.BigInt, resolvedEmpId)
//       .input("coreSearch", sql.NVarChar, `%CORE_DOC_ID:${coreId}%`)
//       .input("userId", sql.BigInt, managerId)
//       .input("reason", sql.NVarChar, reason || 'Rejected by manager')
//       .query(`
//         UPDATE [hrm].[Timesheet] 
//         SET StatusCode = 'REJECTED',
//             UpdatedAtUtc = SYSUTCDATETIME(),
//             UpdatedByUserId = @userId,
//             RejectionReason = @reason
//         WHERE EmployeeId = @empId AND Notes LIKE @coreSearch
//       `);

//     if (result.rowsAffected[0] === 0) {
//       // Fallback: Try match by week
//       const edNotesResult = await pool.request()
//         .input("id", sql.Int, parseInt(timesheetId))
//         .query("SELECT Notes FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");
      
//       const edNotes = edNotesResult.recordset[0]?.Notes || '';
//       const dateMatch = edNotes.match(/\d{4}-\d{2}-\d{2}/);
      
//       if (dateMatch) {
//         const weekStart = dateMatch[0];
//         await pool.request()
//           .input("empId", sql.BigInt, resolvedEmpId)
//           .input("weekStart", sql.Date, weekStart)
//           .input("userId", sql.BigInt, managerId)
//           .input("reason", sql.NVarChar, reason || 'Rejected by manager')
//           .query(`
//             UPDATE [hrm].[Timesheet] 
//             SET StatusCode = 'REJECTED',
//                 UpdatedAtUtc = SYSUTCDATETIME(),
//                 UpdatedByUserId = @userId,
//                 RejectionReason = @reason
//             WHERE EmployeeId = @empId AND WeekStartDate = @weekStart
//           `);
//         return res.json({ success: true, message: 'Timesheet rejected successfully' });
//       }
//     }

//     res.json({ success: true, message: 'Timesheet rejected successfully' });
//   } catch (error) {
//     console.error('Reject external timesheet error:', error);
//     res.status(500).json({ success: false, message: 'Error rejecting timesheet', error: error.message });
//   }
// },

// downloadExternalTimesheet: async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { timesheetId } = req.params; // EmployeeDocument ID
    
//     const result = await pool.request()
//       .input("id", sql.Int, parseInt(timesheetId))
//       .query(`
//         SELECT d.OriginalFileName, d.StorageLocator 
//         FROM [hrm].[EmployeeDocument] ed
//         JOIN [core].[Document] d ON ed.CoreDocumentId = d.DocumentId
//         WHERE ed.DocumentId = @id
//       `);

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ success: false, message: 'File record not found' });
//     }

//     const { OriginalFileName, StorageLocator } = result.recordset[0];

//     if (!fs.existsSync(StorageLocator)) {
//       return res.status(404).json({ success: false, message: 'Physical file not found on server' });
//     }

//     res.download(StorageLocator, OriginalFileName);
//   } catch (error) {
//     console.error('Download external timesheet error:', error);
//     res.status(500).json({ success: false, message: 'Error downloading file', error: error.message });
//   }
// },

// deleteExternalTimesheet: async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { timesheetId } = req.params; // This is EmployeeDocument ID
    
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       const findResult = await transaction.request()
//         .input("id", sql.Int, parseInt(timesheetId))
//         .query("SELECT CoreDocumentId FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");

//       if (findResult.recordset.length === 0) {
//         await transaction.rollback();
//         return res.status(404).json({ success: false, message: "Document record not found" });
//       }

//       const coreId = findResult.recordset[0].CoreDocumentId;

//       // Soft delete EmployeeDocument
//       await transaction.request()
//         .input("id", sql.Int, parseInt(timesheetId))
//         .query("UPDATE [hrm].[EmployeeDocument] SET IsDeleted = 1 WHERE DocumentId = @id");

//       // Soft delete CoreDocument
//       if (coreId) {
//         await transaction.request()
//           .input("coreId", sql.Int, coreId)
//           .query("UPDATE [core].[Document] SET IsDeleted = 1 WHERE DocumentId = @coreId");
//       }

//       await transaction.commit();
//       res.json({ success: true, message: "Timesheet deleted successfully" });
//     } catch (err) {
//       await transaction.rollback();
//       throw err;
//     }
//   } catch (error) {
//     console.error('Delete external timesheet error:', error);
//     res.status(500).json({ success: false, message: 'Error deleting timesheet', error: error.message });
//   }
// },

// deleteReport: async (req, res) => {
//   try {
//     const { companyId, employeeId, reportId } = req.params;

//     const pool = await poolPromise;
//     const request = new sql.Request(pool);
//     request.input('reportId', sql.Int, parseInt(reportId));
    
//     await request.query(`DELETE FROM EmployeeReports WHERE Id=@reportId`);

//     res.json({ success: true, message: 'Report deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error deleting report' });
//   }
// },

// updateStatement: async (req, res) => {
//   try {
//     const { companyId, employeeId, statementId } = req.params;
//     const { checkDate, period, description, hours, payRate, credit, debit, balance } = req.body;

//     const pool = await poolPromise;
//     const tableName = getEmployeeTable(companyId);
    
//     // FIXED: Parse employeeId as integer first
//     const employeeIdInt = parseInt(employeeId, 10);
//     if (isNaN(employeeIdInt)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid Employee ID format' 
//       });
//     }

//     // Get EmployeeId code (string) using integer Id
//     const empRequest = new sql.Request(pool);
//     empRequest.input('id', sql.Int, employeeIdInt);
//     const empResult = await empRequest.query(`SELECT EmployeeId FROM ${tableName} WHERE Id = @id`);
    
//     if (empResult.recordset.length === 0) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Employee not found' 
//       });
//     }
    
//     const employeeIdCode = empResult.recordset[0].EmployeeId;

//     // FIXED: Use sql.NVarChar for EmployeeId (it's a string)
//     const request = new sql.Request(pool);
//     request.input('statementId', sql.Int, parseInt(statementId, 10));
//     request.input('employeeIdCode', sql.NVarChar, employeeIdCode);
//     request.input('checkDate', sql.DateTime, checkDate ? new Date(checkDate) : new Date());
//     request.input('period', sql.NVarChar, period || '');
//     request.input('description', sql.NVarChar, description || '');
//     request.input('hours', sql.Float, hours ? parseFloat(hours) : 0);
//     request.input('payRate', sql.Float, payRate ? parseFloat(payRate) : 0);
//     request.input('credit', sql.Float, credit ? parseFloat(credit) : 0);
//     request.input('debit', sql.Float, debit ? parseFloat(debit) : 0);
//     request.input('balance', sql.Float, balance ? parseFloat(balance) : 0);
    
//     const result = await request.query(`
//       UPDATE EmployeePayStructure 
//       SET CheckDate=@checkDate, 
//           Period=@period, 
//           Description=@description, 
//           Hours=@hours, 
//           PayRate=@payRate, 
//           Credit=@credit, 
//           Debit=@debit, 
//           Balance=@balance 
//       WHERE Id=@statementId AND EmployeeId=@employeeIdCode
//     `);
    
//     if (result.rowsAffected[0] === 0) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Statement not found or no changes made' 
//       });
//     }

//     const getRequest = new sql.Request(pool);
//     getRequest.input('statementId', sql.Int, parseInt(statementId, 10));
//     const getResult = await getRequest.query(`
//       SELECT * FROM EmployeePayStructure WHERE Id=@statementId
//     `);
    
//     res.json({ 
//       success: true, 
//       message: 'Statement updated successfully',
//       data: getResult.recordset[0]
//     });
//   } catch (error) {
//     console.error('Error updating statement:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Error updating statement: ' + error.message
//     });
//   }
// },

// deleteStatement: async (req, res) => {
//   try {
//     const { companyId, employeeId, statementId } = req.params;

//     const pool = await poolPromise;
//     const request = new sql.Request(pool);
//     request.input('statementId', sql.Int, parseInt(statementId));
    
//     await request.query(`DELETE FROM EmployeePayStructure WHERE Id=@statementId`);

//     res.json({ success: true, message: 'Statement deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error deleting statement' });
//   }
// },


// // REPLACE the createStatement method in your employeeController.js with this:

// createStatement: async (req, res) => {
//   try {
//     const { companyId, employeeId } = req.params;
//     const { checkDate, period, description, hours, payRate, credit, debit, balance } = req.body;

//     if (!checkDate || !description) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Check date and description are required fields' 
//       });
//     }

//     const pool = await poolPromise;
//     const tableName = getEmployeeTable(companyId);
    
//     // KEY FIX: Parse as integer ONLY
//     const employeeIdInt = parseInt(employeeId, 10);
//     if (isNaN(employeeIdInt)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid Employee ID - must be numeric' 
//       });
//     }

//     // Step 1: Get employee using INTEGER id
//     const empRequest = new sql.Request(pool);
//     empRequest.input('empDbId', sql.Int, employeeIdInt);
//     const empResult = await empRequest.query(`
//       SELECT Id, EmployeeId FROM ${tableName} WHERE Id = @empDbId
//     `);
    
//     if (!empResult.recordset.length) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Employee not found' 
//       });
//     }
    
//     const empCode = empResult.recordset[0].EmployeeId;

//     // Step 2: Insert using STRING EmployeeId code
//     const req2 = new sql.Request(pool);
//     req2.input('empCode', sql.NVarChar, empCode);
//     req2.input('compId', sql.Int, parseInt(companyId, 10));
//     req2.input('checkDt', sql.DateTime, new Date(checkDate));
//     req2.input('per', sql.NVarChar, period || '');
//     req2.input('desc', sql.NVarChar, description || '');
//     req2.input('hrs', sql.Float, parseFloat(hours) || 0);
//     req2.input('rate', sql.Float, parseFloat(payRate) || 0);
//     req2.input('cred', sql.Float, parseFloat(credit) || 0);
//     req2.input('deb', sql.Float, parseFloat(debit) || 0);
//     req2.input('bal', sql.Float, parseFloat(balance) || 0);
    
//     const result = await req2.query(`
//       INSERT INTO EmployeePayStructure 
//       (EmployeeId, CompanyId, CheckDate, Period, Description, Hours, PayRate, Credit, Debit, Balance)
//       OUTPUT INSERTED.Id
//       VALUES (@empCode, @compId, @checkDt, @per, @desc, @hrs, @rate, @cred, @deb, @bal)
//     `);

//     res.status(201).json({ 
//       success: true, 
//       message: 'Statement created successfully',
//       data: { id: result.recordset[0].Id }
//     });
//   } catch (error) {
//     console.error('Create statement error:', error.message);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Error: ' + error.message
//     });
//   }
// },

// uploadReport: async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No file uploaded' 
//       });
//     }

//     const { companyId, employeeId } = req.params;
//     const pool = await poolPromise;
//     const tableName = getEmployeeTable(companyId);
    
//     // KEY FIX: Parse as integer ONLY
//     const employeeIdInt = parseInt(employeeId, 10);
//     if (isNaN(employeeIdInt)) {
//       if (req.file?.path && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid Employee ID - must be numeric' 
//       });
//     }

//     // Step 1: Get employee using INTEGER id
//     const empRequest = new sql.Request(pool);
//     empRequest.input('empDbId', sql.Int, employeeIdInt);
//     const empResult = await empRequest.query(`
//       SELECT Id, EmployeeId, Name FROM ${tableName} WHERE Id = @empDbId
//     `);
    
//     if (!empResult.recordset.length) {
//       if (req.file?.path && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Employee not found' 
//       });
//     }
    
//     const empCode = empResult.recordset[0].EmployeeId;
//     const empName = empResult.recordset[0].Name;

//     // Step 2: Insert using STRING EmployeeId code
//     const req2 = new sql.Request(pool);
//     req2.input('empCode', sql.NVarChar, empCode);
//     req2.input('compId', sql.Int, parseInt(companyId, 10));
//     req2.input('fname', sql.NVarChar, req.file.originalname);
//     req2.input('fpath', sql.NVarChar, req.file.path);
//     req2.input('fsize', sql.Int, req.file.size);
//     req2.input('desc', sql.NVarChar, req.body.description || '');
//     req2.input('typ', sql.NVarChar, req.body.type || 'Report');
//     req2.input('by', sql.NVarChar, empName);
    
//     await req2.query(`
//       INSERT INTO EmployeeReports 
//       (EmployeeId, CompanyId, FileName, FilePath, FileSize, Description, Type, UploadedBy, UploadDate)
//       VALUES (@empCode, @compId, @fname, @fpath, @fsize, @desc, @typ, @by, GETDATE())
//     `);

//     res.status(201).json({ 
//       success: true, 
//       message: 'Report uploaded successfully' 
//     });
//   } catch (error) {
//     console.error('Upload report error:', error.message);
//     if (req.file?.path && fs.existsSync(req.file.path)) {
//       try { fs.unlinkSync(req.file.path); } catch(e) {}
//     }
//     res.status(500).json({ 
//       success: false, 
//       message: 'Error: ' + error.message
//     });
//   }
// },

// getEmployeePayrollInfo: async (req, res) => {
//   try {
//     const { companyId, employeeId } = req.params;
    
//     console.log('=== GET EMPLOYEE PAYROLL INFO ===');
//     console.log('Company ID:', companyId);
//     console.log('Employee ID:', employeeId);
    
//     const pool = await poolPromise;
//     const tableName = getEmployeeTable(companyId);
    
//     const employeeIdInt = parseInt(employeeId, 10);
//     if (isNaN(employeeIdInt)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid Employee ID format' 
//       });
//     }

//     const request = new sql.Request(pool);
//     request.input('id', sql.Int, employeeIdInt);
    
//     const result = await request.query(`
//       SELECT 
//         e.EmployeeId as Id,
//         e.EmployeeCode as EmployeeId,
//         TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name,
//         ci.IdentityValue as Email,
//         'Hourly' as PayType,
//         'Hourly' as BasisOfPay,
//         'Weekly' as PaySchedule,
//         0 as SeasonalEmployee,
//         0 as OwnerOfficer,
//         0 as SemiMonthlySalary,
//         0 as HourlyRate,
//         NULL as SalaryLastChangedDate,
//         NULL as SalaryLastChangedFrom,
//         NULL as HourlyLastChangedDate,
//         NULL as HourlyLastChangedFrom
//       FROM [hrm].[Employee] e
//       JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
//       LEFT JOIN [recruit].[CandidateIdentity] ci ON ci.CandidateId = c.CandidateId AND ci.IdentityType = 'Email' AND ci.IsPrimary = 1
//       WHERE e.EmployeeId = @id
//     `);
    
//     if (result.recordset.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Employee not found'
//       });
//     }

//     const payrollInfo = result.recordset[0];
    
//     res.json({
//       success: true,
//       data: {
//         employee: {
//           id: payrollInfo.Id,
//           employeeId: payrollInfo.EmployeeId,
//           name: payrollInfo.Name,
//           email: payrollInfo.Email
//         },
//         payrollInfo: {
//           payType: payrollInfo.PayType || 'Hourly',
//           basisOfPay: payrollInfo.BasisOfPay || 'Same as Pay Type',
//           paySchedule: payrollInfo.PaySchedule || 'Monthly',
//           seasonalEmployee: payrollInfo.SeasonalEmployee || 'No',
//           ownerOfficer: payrollInfo.OwnerOfficer || 'No',
//           semiMonthlySalary: payrollInfo.SemiMonthlySalary || 0,
//           hourlyRate: payrollInfo.HourlyRate || 0,
//           salaryHistory: {
//             lastChangedDate: payrollInfo.SalaryLastChangedDate,
//             lastChangedFrom: payrollInfo.SalaryLastChangedFrom
//           },
//           hourlyHistory: {
//             lastChangedDate: payrollInfo.HourlyLastChangedDate,
//             lastChangedFrom: payrollInfo.HourlyLastChangedFrom
//           }
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get payroll info error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error retrieving payroll information',
//       error: error.message
//     });
//   }
// },

// // UPDATE employee payroll info
// updateEmployeePayrollInfo: async (req, res) => {
//   try {
//     const { companyId, employeeId } = req.params;
//     const {
//       payType,
//       basisOfPay,
//       paySchedule,
//       seasonalEmployee,
//       ownerOfficer,
//       semiMonthlySalary,
//       hourlyRate
//     } = req.body;

//     console.log('=== UPDATE EMPLOYEE PAYROLL INFO ===');
//     console.log('Company ID:', companyId);
//     console.log('Employee ID:', employeeId);
//     console.log('New payroll data:', req.body);

//     const pool = await poolPromise;
//     const tableName = getEmployeeTable(companyId);

//     const employeeIdInt = parseInt(employeeId, 10);
//     if (isNaN(employeeIdInt)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid Employee ID format' 
//       });
//     }

//     // Get current employee to check salary changes
//     const checkRequest = new sql.Request(pool);
//     checkRequest.input('id', sql.Int, employeeIdInt);
//     const checkResult = await checkRequest.query(`
//       SELECT SemiMonthlySalary, HourlyRate FROM ${tableName} WHERE Id = @id
//     `);

//     if (checkResult.recordset.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Employee not found'
//       });
//     }

//     const currentEmployee = checkResult.recordset[0];
//     const salaryChanged = semiMonthlySalary && currentEmployee.SemiMonthlySalary !== semiMonthlySalary;
//     const hourlyChanged = hourlyRate && currentEmployee.HourlyRate !== hourlyRate;

//     // Prepare update query
//     const request = new sql.Request(pool);
//     request.input('id', sql.Int, employeeIdInt);
//     request.input('payType', sql.NVarChar, payType || 'Hourly');
//     request.input('basisOfPay', sql.NVarChar, basisOfPay || 'Same as Pay Type');
//     request.input('paySchedule', sql.NVarChar, paySchedule || 'Monthly');
//     request.input('seasonalEmployee', sql.NVarChar, seasonalEmployee || 'No');
//     request.input('ownerOfficer', sql.NVarChar, ownerOfficer || 'No');
//     request.input('semiMonthlySalary', sql.Float, semiMonthlySalary || 0);
//     request.input('hourlyRate', sql.Float, hourlyRate || 0);
//     request.input('updatedAt', sql.DateTime, new Date());

//     let updateQuery = `
//       UPDATE ${tableName}
//       SET PayType = @payType,
//           BasisOfPay = @basisOfPay,
//           PaySchedule = @paySchedule,
//           SeasonalEmployee = @seasonalEmployee,
//           OwnerOfficer = @ownerOfficer,
//           SemiMonthlySalary = @semiMonthlySalary,
//           HourlyRate = @hourlyRate,
//           UpdatedAt = @updatedAt
//     `;

//     // Add salary change tracking
//     if (salaryChanged) {
//       request.input('salaryLastChangedFrom', sql.Float, currentEmployee.SemiMonthlySalary);
//       request.input('salaryLastChangedDate', sql.DateTime, new Date());
//       updateQuery += `,
//         SalaryLastChangedDate = @salaryLastChangedDate,
//         SalaryLastChangedFrom = @salaryLastChangedFrom
//       `;
//       console.log(`✅ Salary changed from ${currentEmployee.SemiMonthlySalary} to ${semiMonthlySalary}`);
//     }

//     // Add hourly change tracking
//     if (hourlyChanged) {
//       request.input('hourlyLastChangedFrom', sql.Float, currentEmployee.HourlyRate);
//       request.input('hourlyLastChangedDate', sql.DateTime, new Date());
//       updateQuery += `,
//         HourlyLastChangedDate = @hourlyLastChangedDate,
//         HourlyLastChangedFrom = @hourlyLastChangedFrom
//       `;
//       console.log(`✅ Hourly rate changed from ${currentEmployee.HourlyRate} to ${hourlyRate}`);
//     }

//     updateQuery += ` WHERE Id = @id`;

//     const result = await request.query(updateQuery);

//     if (result.rowsAffected[0] === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Employee not found or no changes made'
//       });
//     }

//     // Fetch updated employee
//     const getRequest = new sql.Request(pool);
//     getRequest.input('id', sql.Int, employeeIdInt);
//     const getResult = await getRequest.query(`
//       SELECT 
//         Id,
//         EmployeeId,
//         Name,
//         Email,
//         PayType,
//         BasisOfPay,
//         PaySchedule,
//         SeasonalEmployee,
//         OwnerOfficer,
//         SemiMonthlySalary,
//         HourlyRate,
//         SalaryLastChangedDate,
//         SalaryLastChangedFrom,
//         HourlyLastChangedDate,
//         HourlyLastChangedFrom
//       FROM ${tableName} 
//       WHERE Id = @id
//     `);

//     const updatedEmployee = getResult.recordset[0];

//     res.json({
//       success: true,
//       message: 'Payroll information updated successfully',
//       data: {
//         employee: {
//           id: updatedEmployee.Id,
//           employeeId: updatedEmployee.EmployeeId,
//           name: updatedEmployee.Name,
//           email: updatedEmployee.Email
//         },
//         payrollInfo: {
//           payType: updatedEmployee.PayType,
//           basisOfPay: updatedEmployee.BasisOfPay,
//           paySchedule: updatedEmployee.PaySchedule,
//           seasonalEmployee: updatedEmployee.SeasonalEmployee,
//           ownerOfficer: updatedEmployee.OwnerOfficer,
//           semiMonthlySalary: updatedEmployee.SemiMonthlySalary,
//           hourlyRate: updatedEmployee.HourlyRate,
//           salaryHistory: {
//             lastChangedDate: updatedEmployee.SalaryLastChangedDate,
//             lastChangedFrom: updatedEmployee.SalaryLastChangedFrom
//           },
//           hourlyHistory: {
//             lastChangedDate: updatedEmployee.HourlyLastChangedDate,
//             lastChangedFrom: updatedEmployee.HourlyLastChangedFrom
//           }
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Update payroll info error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating payroll information',
//       error: error.message
//     });
//   }
// },

// // GET employee pay structure with calculations
// getEmployeePayStructureData: async (req, res) => {
//   try {
//     const { companyId, employeeId } = req.params;
    
//     const pool = await poolPromise;
//     const tableName = getEmployeeTable(companyId);
    
//     const employeeIdInt = parseInt(employeeId, 10);
//     if (isNaN(employeeIdInt)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid Employee ID format' 
//       });
//     }

//     const request = new sql.Request(pool);
//     request.input('id', sql.Int, employeeIdInt);
    
//     const result = await request.query(`
//       SELECT 
//         SemiMonthlySalary,
//         HourlyRate,
//         PayType,
//         PaySchedule
//       FROM ${tableName} 
//       WHERE Id = @id
//     `);
    
//     if (result.recordset.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Employee not found'
//       });
//     }

//     const employee = result.recordset[0];
    
//     // Calculate values based on semi-monthly salary or hourly rate
//     const semiMonthlySalary = employee.SemiMonthlySalary || 0;
//     const hourlyRate = employee.HourlyRate || 0;
    
//     // Annual calculations
//     const annualSalary = semiMonthlySalary * 24;
//     const biweeklyAmount = annualSalary / 26;
//     const monthlyAmount = annualSalary / 12;
    
//     res.json({
//       success: true,
//       data: {
//         payrollRates: {
//           payType: employee.PayType,
//           paySchedule: employee.PaySchedule,
//           semiMonthlySalary: semiMonthlySalary,
//           hourlyRate: hourlyRate
//         },
//         calculations: {
//           annualSalary: annualSalary,
//           monthlyAmount: monthlyAmount,
//           biweeklyAmount: biweeklyAmount,
//           weeklyAmount: annualSalary / 52,
//           dailyAmount: annualSalary / 260,
//           biweeklyHours: 80,
//           biweeklyPayFromSalary: biweeklyAmount
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get pay structure data error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error retrieving pay structure data',
//       error: error.message
//     });
//   }
// }
// };

// employeeController.uploadPayrollStatementFile = uploadPayrollStatementFile;
// employeeController.sendEmailViaSendGrid = sendEmailViaSendGrid;
// employeeController.sendTimesheetRejectionEmail = sendTimesheetRejectionEmail;

// module.exports = employeeController;


const sql = require('mssql');
const { dbConfig, poolPromise } = require('../../config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const https = require('https');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const path = require('path');

const parseDate = (dateValue) => {
  if (!dateValue) return new Date().toISOString().split('T')[0];

  try {
    // Handle Excel serial dates
    if (typeof dateValue === 'number') {
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    }

    // Handle string dates
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      
      // MM/DD/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const [month, day, year] = trimmed.split('/');
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      
      // DD-MM-YYYY
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
        const [day, month, year] = trimmed.split('-');
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      // Try to parse as standard Date
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }

    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.warn('Date parsing error:', error);
    return new Date().toISOString().split('T')[0];
  }
};


const parseNumber = (value) => {
  if (!value && value !== 0) return 0;

  try {
    // Convert to string for processing
    const str = String(value).trim();
    
    // Remove currency symbols and commas
    const cleaned = str.replace(/[$,]/g, '');
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  } catch (error) {
    return 0;
  }
};

const findColumn = (row, columnNames) => {
  return Object.keys(row).find(key => 
    columnNames.some(name => key.toLowerCase().includes(name.toLowerCase()))
  );
};

const parseExcelFile = (filePath) => {
  try {
    console.log('📊 Parsing Excel file:', filePath);
    
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    console.log('✅ Excel file parsed successfully');
    console.log('Row count:', jsonData.length);
    
    return jsonData;
  } catch (error) {
    console.error('❌ Excel parsing error:', error);
    throw new Error('Failed to parse Excel file: ' + error.message);
  }
};

const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    console.log('📄 Parsing CSV file:', filePath);
    
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        try {
          console.log('✅ CSV file parsed successfully');
          console.log('Row count:', results.length);
          resolve(results);
        } catch (error) {
          reject(new Error('Failed to process CSV data: ' + error.message));
        }
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error);
        reject(new Error('Failed to read CSV file: ' + error.message));
      });
  });
};

const normalizePayrollData = (rawData) => {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('File is empty or invalid format');
  }

  const normalizedStatements = [];
  const errors = [];

  rawData.forEach((row, index) => {
    try {
      // Skip empty rows
      if (!row || Object.keys(row).length === 0) {
        return;
      }

      // Extract data with flexible column naming
      const dateStr = row[findColumn(row, ['date', 'check date', 'checkdate'])] ||
                      row[findColumn(row, ['period', 'month'])];
      
      const periodStr = row[findColumn(row, ['period', 'retention', 'ret.', 'ref'])];
      const description = row[findColumn(row, ['description', 'desc', 'remarks'])] || '';
      
      const hours = parseNumber(
        row[findColumn(row, ['hours', 'hrs', 'worked hours', 'worked'])]
      );
      
      const payRate = parseNumber(
        row[findColumn(row, ['pay rate', 'rate', 'hourly rate', 'payrate', 'hourly'])]
      );
      
      const credit = parseNumber(
        row[findColumn(row, ['credit', 'earnings', 'amount', 'gross'])]
      );
      
      const debit = parseNumber(
        row[findColumn(row, ['debit', 'deduction', 'withdrawal', 'deductions'])]
      );
      
      const balance = parseNumber(
        row[findColumn(row, ['balance', 'net balance', 'running balance', 'net'])]
      );

      // Validate required fields
      if (!dateStr && !description) {
        errors.push(`Row ${index + 1}: Missing date and description`);
        return;
      }

      // If credit is not provided but hours and payRate are, calculate it
      let calculatedCredit = credit;
      if (!credit && hours && payRate) {
        calculatedCredit = parseNumber(hours * payRate);
        console.log(`Row ${index + 1}: Calculated credit = ${hours} × ${payRate} = ${calculatedCredit}`);
      }

      const statement = {
        checkDate: parseDate(dateStr),
        period: String(periodStr || '').trim(),
        description: String(description).trim(),
        hours: hours || 0,
        payRate: payRate || 0,
        credit: calculatedCredit || 0,
        debit: debit || 0,
        balance: balance || 0,
        sourceRow: index + 1
      };

      normalizedStatements.push(statement);

    } catch (error) {
      errors.push(`Row ${index + 1}: ${error.message}`);
    }
  });

  console.log(`✅ Normalized ${normalizedStatements.length} payroll statements`);
  if (errors.length > 0) {
    console.warn('⚠️ Parsing warnings:', errors);
  }

  if (normalizedStatements.length === 0) {
    throw new Error('No valid payroll statements found in file');
  }

  return {
    success: true,
    statements: normalizedStatements,
    totalRecords: normalizedStatements.length,
    warnings: errors,
    parseTime: new Date().toISOString()
  };
};

const uploadPayrollStatementFile = async (req, res) => {
  let filePath = null;
  
  try {
    console.log('=== UPLOAD PAYROLL STATEMENT FILE ===');
    console.log('Params:', req.params);
    console.log('File:', req.file?.filename);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a CSV or Excel file.'
      });
    }

    const { companyId, employeeId } = req.params;
    filePath = req.file.path;

    console.log('📁 File uploaded to:', filePath);
    console.log('📄 File size:', req.file.size, 'bytes');

    if (!companyId || !employeeId) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Company ID and Employee ID are required'
      });
    }

    // Parse the file
    console.log('🔄 Parsing file...');
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    let rawData;
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      rawData = parseExcelFile(filePath);
    } else if (fileExt === '.csv') {
      rawData = await parseCSVFile(filePath);
    } else {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Please upload CSV or Excel file.'
      });
    }

    // Normalize the data
    console.log('📊 Normalizing payroll data...');
    const parsedData = normalizePayrollData(rawData);

    // Connect to database and insert statements
    const pool = await poolPromise;
    const tableName = getEmployeeTable(companyId);

    const employeeIdInt = parseInt(employeeId, 10);
    if (isNaN(employeeIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Employee ID format'
      });
    }

    // Get employee
    const empRequest = new sql.Request(pool);
    empRequest.input('empDbId', sql.Int, employeeIdInt);
    const empResult = await empRequest.query(`
      SELECT Id, EmployeeId, Name FROM ${tableName} WHERE Id = @empDbId
    `);

    if (!empResult.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const empCode = empResult.recordset[0].EmployeeId;
    console.log(`✅ Employee found: ${empResult.recordset[0].Name} (${empCode})`);

    // Insert all statements
    console.log('💾 Inserting statements into database...');
    const insertedStatements = [];
    const insertErrors = [];

    for (let i = 0; i < parsedData.statements.length; i++) {
      try {
        const stmt = parsedData.statements[i];
        
        const insertRequest = new sql.Request(pool);
        insertRequest.input('empCode', sql.NVarChar, empCode);
        insertRequest.input('compId', sql.Int, parseInt(companyId, 10));
        insertRequest.input('checkDt', sql.DateTime, new Date(stmt.checkDate));
        insertRequest.input('per', sql.NVarChar, stmt.period);
        insertRequest.input('desc', sql.NVarChar, stmt.description);
        insertRequest.input('hrs', sql.Float, stmt.hours);
        insertRequest.input('rate', sql.Float, stmt.payRate);
        insertRequest.input('cred', sql.Float, stmt.credit);
        insertRequest.input('deb', sql.Float, stmt.debit);
        insertRequest.input('bal', sql.Float, stmt.balance);

        const result = await insertRequest.query(`
          INSERT INTO EmployeePayStructure 
          (EmployeeId, CompanyId, CheckDate, Period, Description, Hours, PayRate, Credit, Debit, Balance)
          OUTPUT INSERTED.Id, INSERTED.CheckDate, INSERTED.Description, INSERTED.Credit, INSERTED.Debit, INSERTED.Balance
          VALUES (@empCode, @compId, @checkDt, @per, @desc, @hrs, @rate, @cred, @deb, @bal)
        `);

        insertedStatements.push(result.recordset[0]);
        console.log(`✅ Row ${i + 1}: Inserted successfully`);

      } catch (error) {
        insertErrors.push({
          row: i + 1,
          error: error.message
        });
        console.error(`❌ Row ${i + 1}: Insert failed -`, error.message);
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Temporary file deleted');
    }

    console.log(`\n✅ PAYROLL IMPORT COMPLETE`);
    console.log(`   Total rows in file: ${parsedData.statements.length}`);
    console.log(`   Successfully imported: ${insertedStatements.length}`);
    console.log(`   Failed: ${insertErrors.length}`);

    res.status(201).json({
      success: true,
      message: `Payroll statements imported successfully. ${insertedStatements.length}/${parsedData.statements.length} rows processed.`,
      data: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        importedStatements: insertedStatements.length,
        failedStatements: insertErrors.length,
        totalStatements: parsedData.statements.length,
        warnings: parsedData.warnings,
        insertedRecords: insertedStatements,
        errors: insertErrors.length > 0 ? insertErrors : null
      }
    });

  } catch (error) {
    console.error('❌ Upload payroll statement error:', error);
    
    // Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not delete temp file:', e.message);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error processing payroll statement file',
      error: error.message
    });
  }
};

// ✅ SendGrid API Helper Function (using https module - no npm package needed)
const sendEmailViaSendGrid = async (emailData) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ SENDGRID_API_KEY not set in environment variables');
      return { success: false, error: 'SendGrid API key not configured' };
    }

    const payload = JSON.stringify({
      personalizations: [
        {
          to: [{ email: emailData.to }],
          subject: emailData.subject
        }
      ],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        name: process.env.SENDGRID_FROM_NAME || 'Prophecy'
      },
      content: [
        {
          type: 'text/html',
          value: emailData.html
        }
      ]
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Email sent successfully via SendGrid API');
            resolve({ success: true });
          } else {
            console.error('❌ SendGrid API error:', res.statusCode, data);
            resolve({ 
              success: false, 
              error: `SendGrid returned status ${res.statusCode}`,
              details: data 
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ SendGrid request error:', error);
        reject(error);
      });

      req.write(payload);
      req.end();
    });
  } catch (error) {
    console.error('❌ Error sending email via SendGrid:', error);
    return { success: false, error: error.message };
  }
};

 const getFrontendURL = () => {
      if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
      }
      // Fallback based on NODE_ENV
      if (process.env.NODE_ENV === 'production') {
        return 'https://prophechyerp.duckdns.org';
      }
      return 'http://localhost:218';
    };

// Send Welcome Email
// Send Supervisor Assignment Email
const sendSupervisorAssignmentEmail = async (supervisorId, employeeName, roleType) => {
  try {
    const pool = await poolPromise;
    const supervisorQuery = `
      SELECT 
        ci_email.IdentityValue as Email,
        TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name
      FROM [hrm].[Employee] e WITH (NOLOCK)
      JOIN [recruit].[Candidate] c WITH (NOLOCK) ON e.CandidateId = c.CandidateId
      LEFT JOIN [recruit].[CandidateIdentity] ci_email WITH (NOLOCK) ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
      WHERE e.EmployeeId = @supervisorId
    `;
    
    const supervisorResult = await pool.request()
      .input('supervisorId', sql.BigInt, typeof supervisorId === 'string' ? parseInt(supervisorId) : supervisorId)
      .query(supervisorQuery);


    if (supervisorResult.recordset.length === 0 || !supervisorResult.recordset[0].Email) {
      console.warn(`⚠️ No email found for supervisor ID ${supervisorId}`);
      return;
    }

    const supervisor = supervisorResult.recordset[0];
    const frontendURL = getFrontendURL();
    const loginLink = `${frontendURL}/login`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #17a2b8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Supervisor Assignment Notification</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Hello ${supervisor.Name}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You have been assigned as the <strong>${roleType}</strong> for employee <strong>${employeeName}</strong>.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            As their supervisor, you will be responsible for reviewing and approving their timesheets in the ERP system.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            <strong>This is an automated message. Please do not reply to this email.</strong>
          </p>
        </div>
      </div>
    `;

    const result = await sendEmailViaSendGrid({
      to: supervisor.Email.trim(),
      subject: `New Assignment: ${roleType} for ${employeeName}`,
      html: htmlContent
    });

    if (result.success) {
      console.log(`✅ Supervisor assignment email sent to ${supervisor.Email} for employee ${employeeName}`);
    } else {
      console.error(`❌ Failed to send supervisor assignment email:`, result.error);
    }
  } catch (error) {
    console.error('Error in sendSupervisorAssignmentEmail:', error);
  }
};

const sendWelcomeEmail = async (employeeData, companyName, credentials) => {

  try {
    const frontendURL = getFrontendURL();
    const employeePortalLink = `${frontendURL}/login`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #17a2b8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to ${companyName}!</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Hello ${employeeData.name}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We're excited to have you join our team! Your employee account has been successfully created.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #17a2b8; margin-top: 0;">Your Employee Details:</h3>
            <table style="width: 100%; color: #666;">
              <tr>
                <td style="padding: 8px 0;"><strong>Employee ID:</strong></td>
                <td style="padding: 8px 0;">${employeeData.employeeId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Name:</strong></td>
                <td style="padding: 8px 0;">${employeeData.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;">${employeeData.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Department:</strong></td>
                <td style="padding: 8px 0;">${employeeData.department}</td>
              </tr>
              ${employeeData.position ? `
              <tr>
                <td style="padding: 8px 0;"><strong>Position:</strong></td>
                <td style="padding: 8px 0;">${employeeData.position}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0;"><strong>Employment Type:</strong></td>
                <td style="padding: 8px 0;">${employeeData.employmentType}</td>
              </tr>
              ${employeeData.hireDate ? `
              <tr>
                <td style="padding: 8px 0;"><strong>Hire Date:</strong></td>
                <td style="padding: 8px 0;">${new Date(employeeData.hireDate).toLocaleDateString()}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${credentials ? `
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">🔐 Your Login Credentials:</h3>
            <table style="width: 100%; color: #856404;">
              <tr>
                <td style="padding: 8px 0;"><strong>Username:</strong></td>
                <td style="padding: 8px 0; font-family: monospace; background: white; padding: 8px; border-radius: 4px;">${credentials.username}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Password:</strong></td>
                <td style="padding: 8px 0; font-family: monospace; background: white; padding: 8px; border-radius: 4px;">${credentials.password}</td>
              </tr>
            </table>
            <p style="color: #856404; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
              ⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.
            </p>
          </div>
          ` : ''}
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${employeePortalLink}" 
               style="background-color: #17a2b8; 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;">
              Access Employee Portal
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Click the button above to access your employee portal where you can:
          </p>
          
          <ul style="color: #666; font-size: 14px; line-height: 1.8;">
            <li>View your profile and employment details</li>
            <li>Submit and manage timesheets</li>
            <li>Access company resources</li>
            <li>Update your personal information</li>
          </ul>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #17a2b8; word-break: break-all; font-size: 12px;">
            ${employeePortalLink}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            If you have any questions or need assistance, please contact your HR department.<br><br>
            <strong>This is an automated message. Please do not reply to this email.</strong>
          </p>
        </div>
      </div>
    `;

    const result = await sendEmailViaSendGrid({
      to: employeeData.email.trim(),
      subject: `Welcome to ${companyName} - Your Account Details`,
      html: htmlContent
    });

    if (result.success) {
      console.log('✅ Welcome email sent to:', employeeData.email);
    } else {
      console.error('❌ Failed to send welcome email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error in sendWelcomeEmail:', error);
    return { success: false, error: error.message };
  }
};

const sendTimesheetRejectionEmail = async (emailData) => {
  try {
    const { to, employeeName, periodStart, periodEnd, reason } = emailData;
    const frontendURL = getFrontendURL();
    const loginLink = `${frontendURL}/login`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #ef4444; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Timesheet Rejected</h1>
        </div>
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hello ${employeeName},</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Your timesheet for the period <strong>${periodStart} to ${periodEnd}</strong> has been rejected.
          </p>
          <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 16px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Reason for Rejection:</h3>
            <p style="margin-bottom: 0; color: #b91c1c; font-size: 16px;">${reason || 'No specific reason provided.'}</p>
          </div>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Please log in to the employee portal to review the feedback, correct the hours, and resubmit for approval.
          </p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${loginLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">View Timesheet</a>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">This is an automated notification from Prophecy ERP System.</p>
        </div>
      </div>
    `;

    return await sendEmailViaSendGrid({
      to: to.trim(),
      subject: `Timesheet Rejected: Period ${periodStart} - ${periodEnd}`,
      html: htmlContent
    });
  } catch (error) {
    console.error('Error in sendTimesheetRejectionEmail:', error);
    return { success: false, error: error.message };
  }
};

const sendTimesheetApprovalEmail = async (emailData) => {
  try {
    const { to, employeeName, periodStart, periodEnd } = emailData;
    const frontendURL = getFrontendURL();
    const loginLink = `${frontendURL}/login`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #10b981; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Timesheet Approved</h1>
        </div>
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hello ${employeeName},</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Great news! Your timesheet for the period <strong>${periodStart} to ${periodEnd}</strong> has been approved.
          </p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            The approved hours have been recorded in the system. You can view your timesheet history in the employee portal.
          </p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${loginLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Go to Portal</a>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">This is an automated notification from Prophecy ERP System.</p>
        </div>
      </div>
    `;

    return await sendEmailViaSendGrid({
      to: to.trim(),
      subject: `Timesheet Approved: Period ${periodStart} - ${periodEnd}`,
      html: htmlContent
    });
  } catch (error) {
    console.error('Error in sendTimesheetApprovalEmail:', error);
    return { success: false, error: error.message };
  }
};

const getEmployeeTable = (companyId) => {
  // All employees are now in the unified hrm.Employee table
  return '[hrm].[Employee]';
};

const getCompanyName = (companyId) => {
  const companyMap = {
    4: 'Prophecy Consulting INC',
    5: 'Prophecy Offshore',
    6: 'Cognifyar Technologies',
    8: 'startup company'
  };
  return companyMap[parseInt(companyId)] || 'Prophecy Consulting INC';
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

const employeeController = {
  testConnection: async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await sql.query('SELECT 1 as test');
      res.json({
        success: true,
        message: 'Employee database connection successful',
        data: result.recordset
      });
    } catch (error) {
      console.error('Employee database connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Employee database connection failed',
        error: error.message
      });
    }
  },

  getCountries: async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await sql.query(`
        SELECT CountryId, Iso2, Name
        FROM [core].[Country]
        ORDER BY Name ASC
      `);
      res.json({ success: true, data: result.recordset });
    } catch (err) {
      console.error('getCountries error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getStates: async (req, res) => {
    try {
      const { countryId } = req.query;
      const pool = await poolPromise;
      const request = new sql.Request(pool);
      let query = `SELECT StateId, CountryId, Code, Name FROM [core].[StateProvince]`;
      if (countryId) {
        request.input('countryId', sql.Int, parseInt(countryId));
        query += ` WHERE CountryId = @countryId`;
      }
      query += ` ORDER BY Name ASC`;
      const result = await request.query(query);
      res.json({ success: true, data: result.recordset });
    } catch (err) {
      console.error('getStates error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getCities: async (req, res) => {
    try {
      const { stateId } = req.query;
      const pool = await poolPromise;
      const request = new sql.Request(pool);
      let query = `SELECT CityId, StateId, Name FROM [core].[City]`;
      if (stateId) {
        request.input('stateId', sql.Int, parseInt(stateId));
        query += ` WHERE StateId = @stateId`;
      }
      query += ` ORDER BY Name ASC`;
      const result = await request.query(query);
      res.json({ success: true, data: result.recordset });
    } catch (err) {
      console.error('getCities error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getAllEmployees: async (req, res) => {
    try {
      const pool = await poolPromise;
      const { companyId } = req.params;
      const { status, department, search, limit, offset } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      let query = `
        SELECT 
          e.EmployeeId as Id,
          e.EmployeeId,
          e.EmployeeCode,
          e.EmployeeCode as [employeeId],
          e.EmployeeType,
          e.EntityId,
          e.CandidateId,
          e.SupervisorEmployeeId,
          e.BackupSupervisorEmployeeId,
          e.HireDate,
          e.StartDate,
          e.EndDate,
          e.EmploymentStatus,
          e.PayrollSystemId,
          e.TimesheetRequired,
          e.HomeAddressId,
          e.MailingAddressId,
          e.EmergencyContactName,
          e.EmergencyContactPhone,
          e.TimePunchEnabled,
          e.IsDeleted,
          e.CreatedAtUtc,
          e.CreatedByUserId,
          e.UpdatedAtUtc,
          e.UpdatedByUserId,
          c.FirstName,
          c.MiddleName,
          c.LastName,
          TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
          c.JobTitle as Position,
          c.JobTitle,
          ci_email.IdentityValue as Email,
          ci_phone.IdentityValue as Phone,
          c.CandidateCode,
          wa.AuthorizationType as VisaStatus,
          wa.AuthorizationNumber as VisaNumber,
          wa.IssueDate as VisaIssueDate,
          wa.ExpiryDate as VisaExpiryDate,
          addr.Line1 as StreetAddress,
          addr.Line2 as ApartmentSuite,
          addr.CityId as cityId,
          city.StateId as stateId,
          state.CountryId as countryId,
          addr.PostalCode as ZipCode,
          city.Name as City,
          state.Code as State,
          country.Name as Country,
          TRIM(CONCAT(sc.FirstName, ' ', ISNULL(sc.MiddleName + ' ', ''), sc.LastName)) as SupervisorName,
          TRIM(CONCAT(bsc.FirstName, ' ', ISNULL(bsc.MiddleName + ' ', ''), bsc.LastName)) as BackupSupervisorName,
          m_addr.Line1 as MailingStreetAddress,
          m_addr.Line2 as MailingApartmentSuite,
          m_addr.CityId as mailingCityId,
          m_city.StateId as mailingStateId,
          m_state.CountryId as mailingCountryId,
          m_addr.PostalCode as MailingZipCode,
          m_city.Name as MailingCity,
          m_state.Code as MailingState,
          m_country.Name as MailingCountry
        FROM [hrm].[Employee] e
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
        LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
        LEFT JOIN [core].[EntityAddress] ea ON ea.EntityId = c.CandidateId AND ea.EntityType = 'CANDIDATE' AND ea.IsPrimary = 1
        LEFT JOIN [core].[Address] addr ON addr.AddressId = ea.AddressId
        LEFT JOIN [core].[City] city ON city.CityId = addr.CityId
        LEFT JOIN [core].[StateProvince] state ON state.StateId = city.StateId
        LEFT JOIN [core].[Country] country ON country.CountryId = state.CountryId
        LEFT JOIN (
          SELECT EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate,
                 ROW_NUMBER() OVER(PARTITION BY EmployeeId ORDER BY CreatedAtUtc DESC) as rn
          FROM [hrm].[EmployeeWorkAuthorization]
          WHERE StatusCode = 'ACTIVE'
        ) wa ON wa.EmployeeId = e.EmployeeId AND wa.rn = 1
        LEFT JOIN [hrm].[Employee] s ON e.SupervisorEmployeeId = s.EmployeeId
        LEFT JOIN [recruit].[Candidate] sc ON s.CandidateId = sc.CandidateId
        LEFT JOIN [hrm].[Employee] bs ON e.BackupSupervisorEmployeeId = bs.EmployeeId
        LEFT JOIN [recruit].[Candidate] bsc ON bs.CandidateId = bsc.CandidateId
        LEFT JOIN [core].[Address] m_addr ON m_addr.AddressId = e.MailingAddressId
        LEFT JOIN [core].[City] m_city ON m_city.CityId = m_addr.CityId
        LEFT JOIN [core].[StateProvince] m_state ON m_state.StateId = m_city.StateId
        LEFT JOIN [core].[Country] m_country ON m_country.CountryId = m_state.CountryId
        WHERE e.IsDeleted = 0
      `;
      
      let inputs = [];
      
      // ✅ FIX: Only filter by entityId if companyId is NOT 'all' or '0'
      if (companyId !== 'all' && companyId !== '0') {
        query += ' AND e.EntityId = @entityId';
        inputs.push({ name: 'entityId', type: sql.Int, value: parseInt(companyId) });
      }
      
      if (status && status !== 'all') {
        query += ' AND e.EmploymentStatus = @status';
        inputs.push({ name: 'status', type: sql.NVarChar, value: status });
      }
      
      // Note: Department search removed from query as it's missing in hrm.Employee table schema
      // if (department && department !== 'all') {
      //   query += ' AND e.Department = @department';
      //   inputs.push({ name: 'department', type: sql.NVarChar, value: department });
      // }
      
      if (search) {
        query += ` AND (c.FirstName LIKE @search 
                        OR c.LastName LIKE @search
                        OR ci_email.IdentityValue LIKE @search 
                        OR e.EmployeeCode LIKE @search
                        OR e.JobTitle LIKE @search)`;
        inputs.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
      }
      
      query += ' ORDER BY e.CreatedAtUtc DESC';
      
      if (limit) {
        query += ` OFFSET ${offset || 0} ROWS FETCH NEXT ${limit} ROWS ONLY`;
      }
      
      const request = new sql.Request(pool);
      inputs.forEach(input => {
        request.input(input.name, input.type, input.value);
      });
      
      const result = await request.query(query);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length,
        companyId: parseInt(companyId)
      });
    } catch (error) {
      console.error('Get all employees error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employees', 
        error: error.message 
      });
    }
  },

  getEmployeeById: async (req, res) => {
    try {
      const pool = await poolPromise;
      const { companyId, employeeId } = req.params;
      
      if (!companyId || !employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and Employee ID are required'
        });
      }

      const request = new sql.Request(pool);
      request.input('entityId', sql.Int, parseInt(companyId));
      
      // Determine if employeeId is numeric ID or alphanumeric Code
      const isNumeric = /^\d+$/.test(String(employeeId));
      
      let query = `
        SELECT 
          e.EmployeeId as Id,
          e.EmployeeId,
          e.EmployeeCode,
          e.EmployeeCode as [employeeId],
          e.EmployeeType,
          e.EntityId,
          e.CandidateId,
          e.SupervisorEmployeeId,
          e.BackupSupervisorEmployeeId,
          e.StartDate,
          e.EndDate,
          e.EmploymentStatus,
          e.PayrollSystemId,
          e.TimesheetRequired,
          e.EmergencyContactName,
          e.EmergencyContactPhone,
          e.TimePunchEnabled,
          e.IsDeleted,
          e.CreatedAtUtc,
          e.CreatedByUserId,
          e.UpdatedAtUtc,
          e.UpdatedByUserId,
          c.FirstName,
          c.MiddleName,
          c.LastName,
          TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name,
          c.JobTitle as Position,
          c.JobTitle,
          ci_email.IdentityValue as Email,
          ci_phone.IdentityValue as Phone,
          c.CandidateCode,
          wa.AuthorizationType as VisaStatus,
          wa.AuthorizationNumber as VisaNumber,
          wa.IssueDate as VisaIssueDate,
          wa.ExpiryDate as VisaExpiryDate,
          addr.Line1 as StreetAddress,
          addr.Line2 as ApartmentSuite,
          addr.CityId as cityId,
          city.StateId as stateId,
          state.CountryId as countryId,
          addr.PostalCode as ZipCode,
          city.Name as City,
          state.Code as State,
          country.Name as Country
        FROM [hrm].[Employee] e
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
        LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
        LEFT JOIN (
          SELECT EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate,
                 ROW_NUMBER() OVER(PARTITION BY EmployeeId ORDER BY CreatedAtUtc DESC) as rn
          FROM [hrm].[EmployeeWorkAuthorization]
          WHERE StatusCode = 'ACTIVE'
        ) wa ON wa.EmployeeId = e.EmployeeId AND wa.rn = 1
        LEFT JOIN [core].[EntityAddress] ea ON ea.EntityId = c.CandidateId AND ea.EntityType = 'CANDIDATE' AND ea.IsPrimary = 1
        LEFT JOIN [core].[Address] addr ON addr.AddressId = ea.AddressId
        LEFT JOIN [core].[City] city ON city.CityId = addr.CityId
        LEFT JOIN [core].[StateProvince] state ON state.StateId = city.StateId
        LEFT JOIN [core].[Country] country ON country.CountryId = state.CountryId
        WHERE e.EntityId = @entityId AND e.IsDeleted = 0
      `;

      if (isNumeric) {
        request.input('employeeId', sql.Int, parseInt(employeeId));
        query += ` AND e.EmployeeId = @employeeId`;
      } else {
        request.input('employeeCode', sql.NVarChar, employeeId);
        query += ` AND e.EmployeeCode = @employeeCode`;
      }
      
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Employee not found' 
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('Get employee by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving employee', 
        error: error.message 
      });
    }
  },

// At the START of createEmployee function, right after destructuring

createEmployee: async (req, res) => {
  try {
    console.log('=== CREATE EMPLOYEE REQUEST (HRM) ===');
    const { companyId } = req.params;
    
    // Use shared pool
    const pool = await poolPromise;
    
    const {
      name, email, phone, department, position, employmentType = 'Full-time',
      status = 'Active', hireDate, 
      employeeId, username, password,
      visaStatus, visaNumber, visaIssueDate, visaExpiryDate,
      streetAddress, apartmentSuite, cityId, stateId, countryId, zipCode,
      supervisorEmployeeId, backupSupervisorEmployeeId, timesheetRequired,
      emergencyContactName, emergencyContactPhone,
      mailingStreetAddress, mailingApartmentSuite, mailingCityId, mailingZipCode,
      timePunchEnabled
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Validation
    if (!name || !normalizedEmail || !companyId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, EmployeeCode, and Company ID are required'
      });
    }

    const companyName = getCompanyName(companyId);
    
    // 3. Start Transaction for atomic creation
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Check for existing Candidate by Email (inside transaction)
      const checkRequest = new sql.Request(transaction);
      checkRequest.input('email', sql.NVarChar, normalizedEmail);
      const checkResult = await checkRequest.query(`
        SELECT c.CandidateId FROM [recruit].[CandidateIdentity] ci
        JOIN [recruit].[Candidate] c ON ci.CandidateId = c.CandidateId
        WHERE LOWER(ci.IdentityValue) = LOWER(@email) AND ci.IdentityType = 'Email'
      `);
      
      let candidateId = checkResult.recordset.length > 0 ? checkResult.recordset[0].CandidateId : null;
      
      if (candidateId) {
        // --- SYNC CANDIDATE DETAILS ---
        // Even if candidate exists, update their Name and Position to match the new Employee entry
        const candSyncRequest = new sql.Request(transaction);
        candSyncRequest.input('candId', sql.Int, candidateId);
        candSyncRequest.input('jobTitle', sql.NVarChar, position ? position.trim() : null);
        
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
        
        candSyncRequest.input('firstName', sql.NVarChar, firstName);
        candSyncRequest.input('middleName', sql.NVarChar, middleName);
        candSyncRequest.input('lastName', sql.NVarChar, lastName);

        await candSyncRequest.query(`
          UPDATE [recruit].[Candidate]
          SET JobTitle = ISNULL(@jobTitle, JobTitle),
              FirstName = @firstName,
              MiddleName = ISNULL(@middleName, MiddleName),
              LastName = @lastName,
              UpdatedAtUtc = SYSUTCDATETIME()
          WHERE CandidateId = @candId
        `);
        console.log(`[EMPLOYEE-CREATE] Synced existing candidate details for CandidateId: ${candidateId}`);

        // Check if already an employee in this company
        const empCheckRequest = new sql.Request(transaction);
        empCheckRequest.input('candidateId', sql.Int, candidateId);
        empCheckRequest.input('entityId', sql.Int, parseInt(companyId));
        const empCheckResult = await empCheckRequest.query(`
          SELECT EmployeeId FROM [hrm].[Employee] WITH (UPDLOCK, HOLDLOCK)
          WHERE CandidateId = @candidateId AND EntityId = @entityId AND IsDeleted = 0
        `);
        
        if (empCheckResult.recordset.length > 0) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: 'An employee with this email already exists in this company'
          });
        }
      }

      // 2. Check for existing EmployeeCode in this company
      const codeCheckRequest = new sql.Request(transaction);
      codeCheckRequest.input('employeeCode', sql.NVarChar, employeeId.trim());
      codeCheckRequest.input('entityId', sql.Int, parseInt(companyId));
      const codeCheckResult = await codeCheckRequest.query(`
        SELECT EmployeeId FROM [hrm].[Employee] WITH (UPDLOCK, HOLDLOCK)
        WHERE EmployeeCode = @employeeCode AND EntityId = @entityId
      `);
      
      if (codeCheckResult.recordset.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'An employee with this Employee Code already exists in this company'
        });
      }

      // Step A: Create Candidate if it doesn't exist
      if (!candidateId) {
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

        // Get next candidate ID for sequence-based CandidateCode
        const codeResult = await new sql.Request(transaction).query(`
          SELECT ISNULL(MAX(CandidateId), 0) + 1 AS NextId FROM [recruit].[Candidate]
        `);
        const nextId = codeResult.recordset[0].NextId;
        const candidateCode = `CAN-${String(nextId).padStart(6, '0')}`;

        const candInsert = new sql.Request(transaction);
        candInsert.input('firstName', sql.NVarChar, firstName);
        candInsert.input('middleName', sql.NVarChar, middleName);
        candInsert.input('lastName', sql.NVarChar, lastName);
        candInsert.input('candidateCode', sql.NVarChar, candidateCode);
        candInsert.input('jobTitle', sql.NVarChar, position ? position.trim() : null);
        
        const candResult = await candInsert.query(`
          INSERT INTO [recruit].[Candidate] (FirstName, MiddleName, LastName, CandidateCode, JobTitle, CreatedAtUtc)
          OUTPUT INSERTED.CandidateId
          VALUES (@firstName, @middleName, @lastName, @candidateCode, @jobTitle, SYSUTCDATETIME())
        `);
        candidateId = candResult.recordset[0].CandidateId;

        const identInsert = new sql.Request(transaction);
        identInsert.input('candidateId', sql.Int, candidateId);
        identInsert.input('email', sql.NVarChar, normalizedEmail);
        identInsert.input('phone', sql.NVarChar, phone ? phone.trim() : null);

        await identInsert.query(`
          INSERT INTO [recruit].[CandidateIdentity] (CandidateId, IdentityType, IdentityValue, IsPrimary)
          VALUES (@candidateId, 'Email', @email, 1);
          
          IF @phone IS NOT NULL
          INSERT INTO [recruit].[CandidateIdentity] (CandidateId, IdentityType, IdentityValue, IsPrimary)
          VALUES (@candidateId, 'Phone', @phone, 1);
        `);
      }

      // Step B: Create or Update User Account if credentials provided
      let userAuthId = null;
      if (username && password) {
        // Check if user already exists
        const userCheckReq = new sql.Request(transaction);
        userCheckReq.input('username', sql.NVarChar, username.trim());
        const existingUserResult = await userCheckReq.query(`SELECT id FROM userinfo WHERE username = @username`);

        if (existingUserResult.recordset.length > 0) {
          // User exists, update EmployeeId only
          userAuthId = existingUserResult.recordset[0].id;
          const userUpdateReq = new sql.Request(transaction);
          userUpdateReq.input('id', sql.Int, userAuthId);
          userUpdateReq.input('empCode', sql.NVarChar, employeeId.trim());
          await userUpdateReq.query(`UPDATE userinfo SET EmployeeId = @empCode WHERE id = @id`);
          console.log(`[EMPLOYEE-CREATE] Updated existing user info for: ${username}`);
        } else {
          // User does not exist, insert new record
          const hashedPassword = await bcrypt.hash(password, 10);
          const userInsertReq = new sql.Request(transaction);
          userInsertReq.input('username', sql.NVarChar, username.trim());
          userInsertReq.input('password', sql.NVarChar, hashedPassword);
          userInsertReq.input('role', sql.NVarChar, 'employee');
          userInsertReq.input('empCode', sql.NVarChar, employeeId.trim());
          
          const userInsertResult = await userInsertReq.query(`
            INSERT INTO userinfo (username, password, role, EmployeeId)
            OUTPUT INSERTED.id
            VALUES (@username, @password, @role, @empCode)
          `);
          userAuthId = userInsertResult.recordset[0].id;
          console.log(`[EMPLOYEE-CREATE] Created new user account for: ${username}`);
        }

        // Handle userdetails gracefully
        const detailRequest = new sql.Request(transaction);
        detailRequest.input('id', sql.Int, userAuthId);
        detailRequest.input('email', sql.NVarChar, normalizedEmail);
        await detailRequest.query(`
          IF NOT EXISTS (SELECT 1 FROM userdetails WHERE id = @id)
          BEGIN
            INSERT INTO userdetails (id, email) VALUES (@id, @email)
          END
          ELSE
          BEGIN
            UPDATE userdetails SET email = @email WHERE id = @id
          END
        `);
      }

      // Step C: Insert into hrm.Employee
      const empRequest = new sql.Request(transaction);
      empRequest.input('candidateId', sql.Int, candidateId);
      empRequest.input('entityId', sql.Int, parseInt(companyId));
      empRequest.input('employeeCode', sql.NVarChar, employeeId.trim());
      
      let mappedEmployeeType = 'INTERNAL';
      if (employmentType && employmentType.toUpperCase().includes('C2C')) mappedEmployeeType = 'C2C';
      else if (employmentType && employmentType.toUpperCase().includes('DEPLOYED')) mappedEmployeeType = 'DEPLOYED';
      empRequest.input('employeeType', sql.NVarChar, mappedEmployeeType);
      
      const normalizedStatus = (status && status.toUpperCase() === 'INACTIVE') ? 'INACTIVE' : 
                               (status && status.toUpperCase() === 'TERMINATED') ? 'TERMINATED' : 'ACTIVE';
      empRequest.input('status', sql.NVarChar, normalizedStatus);
      const parsedHireDate = (hireDate && String(hireDate).trim() !== '') ? new Date(hireDate) : new Date();
      empRequest.input('hireDate', sql.Date, parsedHireDate);
      empRequest.input('supervisorId', sql.BigInt, supervisorEmployeeId ? parseInt(supervisorEmployeeId) : null);
      empRequest.input('backupSupervisorId', sql.BigInt, backupSupervisorEmployeeId ? parseInt(backupSupervisorEmployeeId) : null);
      empRequest.input('timesheetRequired', sql.Bit, !!timesheetRequired ? 1 : 0);
      empRequest.input('emergencyContactName', sql.NVarChar, emergencyContactName || null);
      empRequest.input('emergencyContactPhone', sql.NVarChar, emergencyContactPhone || null);
      empRequest.input('createdBy', sql.Int, req.user?.id || null);
      empRequest.input('userId', sql.Int, userAuthId);
      empRequest.input('timePunchEnabled', sql.Bit, timePunchEnabled !== undefined ? (!!timePunchEnabled ? 1 : 0) : 1);

      const empResult = await empRequest.query(`
        INSERT INTO [hrm].[Employee] (
          CandidateId, EntityId, EmployeeCode, 
          EmployeeType, EmploymentStatus, StartDate, HireDate,
          SupervisorEmployeeId, BackupSupervisorEmployeeId, TimesheetRequired,
          EmergencyContactName, EmergencyContactPhone, TimePunchEnabled,
          UserId, CreatedAtUtc, CreatedByUserId
        )
        OUTPUT INSERTED.EmployeeId
        VALUES (
          @candidateId, @entityId, @employeeCode, 
          @employeeType, @status, @hireDate, @hireDate,
          @supervisorId, @backupSupervisorId, @timesheetRequired,
          @emergencyContactName, @emergencyContactPhone, @timePunchEnabled,
          @userId, SYSUTCDATETIME(), @createdBy
        )
      `);
      
      const newEmployeeDbId = empResult.recordset[0].EmployeeId;

      // Step C.5: Link Candidate to new Employee ID
      const updateCandReq = new sql.Request(transaction);
      updateCandReq.input('candIdVal', sql.Int, candidateId);
      updateCandReq.input('empDbIdVal', sql.Int, newEmployeeDbId);
      await updateCandReq.query(`
        UPDATE [recruit].[Candidate]
        SET EmployeeId = @empDbIdVal
        WHERE CandidateId = @candIdVal
      `);

      // Step D: Log Status History
      const histRequest = new sql.Request(transaction);
      histRequest.input('empId', sql.Int, newEmployeeDbId);
      histRequest.input('status', sql.NVarChar, status);
      await histRequest.query(`
        INSERT INTO [hrm].[EmployeeStatusHistory] (EmployeeId, ToStatus, ChangedAtUtc, ChangedByUserName)
        VALUES (@empId, @status, SYSUTCDATETIME(), 'System')
      `);

      // Step E: Insert Work Authorization
      if (visaStatus) {
        const visaReq = new sql.Request(transaction);
        visaReq.input('employeeId', sql.BigInt, newEmployeeDbId);
        visaReq.input('authType', sql.NVarChar, visaStatus);
        visaReq.input('authNum', sql.NVarChar, visaNumber || null);
        
        let iDate = null;
        if (visaIssueDate && String(visaIssueDate).trim() !== '') iDate = new Date(visaIssueDate);
        visaReq.input('iDate', sql.Date, iDate);
        
        let eDate = null;
        if (visaExpiryDate && String(visaExpiryDate).trim() !== '') eDate = new Date(visaExpiryDate);
        visaReq.input('eDate', sql.Date, eDate);

        await visaReq.query(`
          INSERT INTO [hrm].[EmployeeWorkAuthorization] (
            EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate, StatusCode
          ) VALUES (
            @employeeId, @authType, @authNum, @iDate, @eDate, 'ACTIVE'
          )
        `);
      }

      // Step F: Insert Home Address
      if (streetAddress || cityId || zipCode) {
        const addrReq = new sql.Request(transaction);
        addrReq.input('cityId', sql.Int, cityId ? parseInt(cityId) : null);
        addrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
        addrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
        addrReq.input('zipCode', sql.NVarChar, zipCode || null);
        
        const addrResult = await addrReq.query(`
          INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
          OUTPUT INSERTED.AddressId
          VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
        `);
        const newAddressId = addrResult.recordset[0].AddressId;

        const eaReq = new sql.Request(transaction);
        eaReq.input('candId', sql.Int, candidateId);
        eaReq.input('addrId', sql.Int, newAddressId);
        await eaReq.query(`
          INSERT INTO [core].[EntityAddress] (EntityType, EntityId, AddressId, AddressType, IsPrimary)
          VALUES ('CANDIDATE', @candId, @addrId, 'CURRENT', 1)
        `);

        // Link to Employee table
        const linkHomeReq = new sql.Request(transaction);
        linkHomeReq.input('empId', sql.BigInt, newEmployeeDbId);
        linkHomeReq.input('addrId', sql.Int, newAddressId);
        await linkHomeReq.query(`UPDATE [hrm].[Employee] SET HomeAddressId = @addrId WHERE EmployeeId = @empId`);
      }

      // Step G: Insert Mailing Address if provided and different
      if (mailingStreetAddress || mailingCityId || mailingZipCode) {
        const mAddrReq = new sql.Request(transaction);
        mAddrReq.input('cityId', sql.Int, mailingCityId ? parseInt(mailingCityId) : null);
        mAddrReq.input('streetAddress', sql.NVarChar, mailingStreetAddress || null);
        mAddrReq.input('apartmentSuite', sql.NVarChar, mailingApartmentSuite || null);
        mAddrReq.input('zipCode', sql.NVarChar, mailingZipCode || null);
        
        const mAddrResult = await mAddrReq.query(`
          INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
          OUTPUT INSERTED.AddressId
          VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
        `);
        const mailingAddressId = mAddrResult.recordset[0].AddressId;

        const linkMailReq = new sql.Request(transaction);
        linkMailReq.input('empId', sql.BigInt, newEmployeeDbId);
        linkMailReq.input('addrId', sql.Int, mailingAddressId);
        await linkMailReq.query(`UPDATE [hrm].[Employee] SET MailingAddressId = @addrId WHERE EmployeeId = @empId`);
      }

      await transaction.commit();
      console.log('✅ Employee created successfully in hrm schema');

      // Final Response
      const responseData = {
        Id: newEmployeeDbId,
        EmployeeId: employeeId.trim(),
        Name: name.trim(),
        Email: normalizedEmail,
        Department: department,
        Position: position,
        Status: status
      };

      const emailPayload = {
        employeeId: employeeId.trim(),
        name: name.trim(),
        email: normalizedEmail,
        department: department,
        position: position,
        employmentType: employmentType,
        hireDate: hireDate
      };

      const credentials = (username && password) ? { username: username.trim(), password: password } : null;
      await sendWelcomeEmail(emailPayload, companyName, credentials);

      // Notify Supervisors if assigned
      if (supervisorEmployeeId) {
        await sendSupervisorAssignmentEmail(supervisorEmployeeId, name.trim(), 'Primary Supervisor');
      }
      if (backupSupervisorEmployeeId) {
        await sendSupervisorAssignmentEmail(backupSupervisorEmployeeId, name.trim(), 'Backup Supervisor');
      }

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: responseData
      });

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Create employee error:', error);
    res.status(500).json({ success: false, message: 'Error creating employee: ' + error.message });
  }
},

// In your employeeController.js, find the updateEmployee function and REPLACE it with this:

  updateEmployee: async (req, res) => {
    let connection = null;
    try {
      console.log('=== UPDATE EMPLOYEE (HRM) ===');
      const { companyId, employeeId } = req.params; // Note: employeeId is likely hrm.Employee.EmployeeId (PK)
      const {
        name, email, phone, department, position, employmentType,
        status, hireDate, streetAddress, apartmentSuite, cityId, stateId, countryId, zipCode,
        visaStatus, visaNumber, visaIssueDate, visaExpiryDate,
        supervisorEmployeeId, backupSupervisorEmployeeId, timesheetRequired,
        emergencyContactName, emergencyContactPhone,
        mailingStreetAddress, mailingApartmentSuite, mailingCityId, mailingZipCode,
        username, password, employeeId: newEmployeeCode, timePunchEnabled
      } = req.body;
      
      if (!companyId || !employeeId) {
        return res.status(400).json({ success: false, message: 'Company ID and Employee ID are required' });
      }

      const pool = await poolPromise;

      // 1. Fetch current employee and candidate info
      const fetchRequest = new sql.Request(pool);
      fetchRequest.input('entityId', sql.Int, parseInt(companyId));
      
      const isNumeric = /^\d+$/.test(String(employeeId));
      let fetchQuery = `
        SELECT 
          e.EmployeeId, e.EmployeeCode, e.CandidateId, e.EmploymentStatus, 
          e.StartDate, e.EmployeeType, c.FirstName, c.LastName, c.JobTitle,
          ci.IdentityValue as Email
        FROM [hrm].[Employee] e
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci ON ci.CandidateId = c.CandidateId 
          AND ci.IdentityType = 'Email' AND ci.IsPrimary = 1
        WHERE e.EntityId = @entityId AND e.IsDeleted = 0
      `;

      if (isNumeric) {
        fetchRequest.input('empId', sql.Int, parseInt(employeeId));
        fetchQuery += ` AND e.EmployeeId = @empId`;
      } else {
        fetchRequest.input('empCode', sql.NVarChar, employeeId);
        fetchQuery += ` AND e.EmployeeCode = @empCode`;
      }
      
      const fetchResult = await fetchRequest.query(fetchQuery);

      if (fetchResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const currentEmp = fetchResult.recordset[0];
      const candidateId = currentEmp.CandidateId;
      const prevStatus = currentEmp.EmploymentStatus;

      // 2. Start Transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Update Candidate Name
        if (name) {
          const nameParts = name.trim().split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
          const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

          const candUpdate = new sql.Request(transaction);
          candUpdate.input('candidateId', sql.Int, candidateId);
          candUpdate.input('firstName', sql.NVarChar, firstName);
          candUpdate.input('middleName', sql.NVarChar, middleName);
          candUpdate.input('lastName', sql.NVarChar, lastName);
          candUpdate.input('jobTitle', sql.NVarChar, position || currentEmp.JobTitle);
          await candUpdate.query(`
            UPDATE [recruit].[Candidate] 
            SET FirstName = @firstName, MiddleName = @middleName, LastName = @lastName, JobTitle = @jobTitle,
                UpdatedAtUtc = SYSUTCDATETIME()
            WHERE CandidateId = @candidateId
          `);
        }

        // Update Identities
        if (email || phone) {
          const identUpdate = new sql.Request(transaction);
          identUpdate.input('candidateId', sql.Int, candidateId);
          
          if (email) {
            identUpdate.input('email', sql.NVarChar, email.trim().toLowerCase());
            await identUpdate.query(`
              UPDATE [recruit].[CandidateIdentity] SET IdentityValue = @email 
              WHERE CandidateId = @candidateId AND IdentityType = 'Email' AND IsPrimary = 1
            `);
          }
          
          if (phone) {
            identUpdate.input('phone', sql.NVarChar, phone.trim());
            await identUpdate.query(`
              UPDATE [recruit].[CandidateIdentity] SET IdentityValue = @phone 
              WHERE CandidateId = @candidateId AND IdentityType = 'Phone' AND IsPrimary = 1
            `);
          }
        }

        // Update HRM Employee
        const empUpdate = new sql.Request(transaction);
        empUpdate.input('empId', sql.Int, currentEmp.EmployeeId);
        
        const empTypeToUse = employmentType || currentEmp.EmployeeType;
        let mappedUpdateEmployeeType = 'INTERNAL';
        if (empTypeToUse && typeof empTypeToUse === 'string') {
          const upperType = empTypeToUse.toUpperCase();
          if (upperType.includes('C2C')) mappedUpdateEmployeeType = 'C2C';
          else if (upperType.includes('DEPLOYED')) mappedUpdateEmployeeType = 'DEPLOYED';
        }
        empUpdate.input('type', sql.NVarChar, mappedUpdateEmployeeType);
        empUpdate.input('status', sql.NVarChar, status || currentEmp.EmploymentStatus);
        empUpdate.input('startDate', sql.Date, hireDate ? new Date(hireDate) : currentEmp.StartDate);
        empUpdate.input('hireDate', sql.Date, hireDate ? new Date(hireDate) : currentEmp.StartDate);
        
        const parseId = (id) => (id !== undefined && id !== null && id !== '' && !isNaN(parseInt(id))) ? parseInt(id) : null;
        
        empUpdate.input('supervisorId', sql.BigInt, parseId(supervisorEmployeeId));
        empUpdate.input('backupSupervisorId', sql.BigInt, parseId(backupSupervisorEmployeeId));
        empUpdate.input('timesheetRequired', sql.Bit, !!timesheetRequired ? 1 : 0);
        empUpdate.input('emergencyName', sql.NVarChar, emergencyContactName || null);
        empUpdate.input('emergencyPhone', sql.NVarChar, emergencyContactPhone || null);
        empUpdate.input('updatedBy', sql.Int, req.user?.id || null);
        empUpdate.input('newCode', sql.NVarChar, newEmployeeCode || currentEmp.EmployeeCode);
        empUpdate.input('timePunchEnabled', sql.Bit, timePunchEnabled !== undefined ? (!!timePunchEnabled ? 1 : 0) : null);

        await empUpdate.query(`
          UPDATE [hrm].[Employee]
          SET 
            EmployeeType = @type, 
            EmploymentStatus = @status, 
            StartDate = @startDate, 
            HireDate = @hireDate,
            SupervisorEmployeeId = @supervisorId,
            BackupSupervisorEmployeeId = @backupSupervisorId,
            TimesheetRequired = @timesheetRequired,
            EmergencyContactName = @emergencyName,
            EmergencyContactPhone = @emergencyPhone,
            EmployeeCode = @newCode,
            TimePunchEnabled = ISNULL(@timePunchEnabled, TimePunchEnabled),
            UpdatedAtUtc = SYSUTCDATETIME(),
            UpdatedByUserId = @updatedBy
          WHERE EmployeeId = @empId
        `);

        // --- SYNC WITH USERINFO ---
        const finalEmployeeCode = newEmployeeCode || currentEmp.EmployeeCode;
        if (finalEmployeeCode) {
          const userSyncReq = new sql.Request(transaction);
          userSyncReq.input('empCode', sql.NVarChar, finalEmployeeCode.trim());
          userSyncReq.input('currentCode', sql.NVarChar, (currentEmp.EmployeeCode || '').trim());
          userSyncReq.input('email', sql.NVarChar, (email || currentEmp.Email || '').trim().toLowerCase());
          
          // Try to find user by existing EmployeeId (code), username (email), or userdetails.email
          const userCheck = await userSyncReq.query(`
            SELECT TOP 1 u.id 
            FROM userinfo u
            LEFT JOIN userdetails d ON u.id = d.id
            WHERE (u.EmployeeId = @currentCode AND @currentCode <> '')
               OR (LOWER(u.username) = LOWER(@email) AND @email <> '')
               OR (LOWER(d.email) = LOWER(@email) AND @email <> '')
          `);

          if (userCheck.recordset.length > 0) {
            const userId = userCheck.recordset[0].id;
            const userUpdateReq = new sql.Request(transaction);
            userUpdateReq.input('userId', sql.Int, userId);
            userUpdateReq.input('empCode', sql.NVarChar, finalEmployeeCode.trim());
            
            let updateQuery = `UPDATE userinfo SET EmployeeId = @empCode`;
            
            if (username) {
              userUpdateReq.input('username', sql.NVarChar, username.trim().toLowerCase());
              updateQuery += `, username = @username`;
            }
            
            if (password && password.trim() !== '') {
              const bcrypt = require('bcryptjs');
              const hashedPassword = await bcrypt.hash(password, 10);
              userUpdateReq.input('password', sql.NVarChar, hashedPassword);
              updateQuery += `, password = @password`;
            }
            
            updateQuery += ` WHERE id = @userId`;
            await userUpdateReq.query(updateQuery);
            console.log(`✅ Synced userinfo for UserID ${userId} with EmployeeId ${finalEmployeeCode}`);
          }
        }

        // Notify Supervisors if assignment changed
        const currentSupervisorId = currentEmp.SupervisorEmployeeId;
        const currentBackupId = currentEmp.BackupSupervisorEmployeeId;
        const empDisplayName = name || `${currentEmp.FirstName} ${currentEmp.LastName}`;

        if (supervisorEmployeeId && parseInt(supervisorEmployeeId) !== currentSupervisorId) {
          await sendSupervisorAssignmentEmail(supervisorEmployeeId, empDisplayName, 'Primary Supervisor');
        }
        if (backupSupervisorEmployeeId && parseInt(backupSupervisorEmployeeId) !== currentBackupId) {
          await sendSupervisorAssignmentEmail(backupSupervisorEmployeeId, empDisplayName, 'Backup Supervisor');
        }


        // 3.5 Update Addresses (Home and Mailing)
        
        // --- HOME ADDRESS ---
        let homeAddressId = null;
        if (streetAddress !== undefined || cityId !== undefined || zipCode !== undefined) {
          const checkAddrReq = new sql.Request(transaction);
          checkAddrReq.input('candidateId', sql.Int, candidateId);
          const addrCheck = await checkAddrReq.query(`
            SELECT TOP 1 ea.AddressId
            FROM [core].[EntityAddress] ea
            WHERE ea.EntityType = 'CANDIDATE' AND ea.EntityId = @candidateId
            ORDER BY ea.IsPrimary DESC
          `);

          if (addrCheck.recordset.length > 0) {
            homeAddressId = addrCheck.recordset[0].AddressId;
            const updateAddrReq = new sql.Request(transaction);
            updateAddrReq.input('addrId', sql.Int, homeAddressId);
            updateAddrReq.input('cityId', sql.Int, cityId !== undefined && cityId !== null && cityId !== '' ? parseInt(cityId) : null);
            updateAddrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
            updateAddrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
            updateAddrReq.input('zipCode', sql.NVarChar, zipCode || null);
            
            await updateAddrReq.query(`
              UPDATE [core].[Address] 
              SET CityId = ISNULL(@cityId, CityId), 
                  Line1 = ISNULL(@streetAddress, Line1), 
                  Line2 = ISNULL(@apartmentSuite, Line2), 
                  PostalCode = ISNULL(@zipCode, PostalCode)
              WHERE AddressId = @addrId
            `);
          } else if (streetAddress || cityId || zipCode) {
            const createAddrReq = new sql.Request(transaction);
            const parseId = (id) => (id !== undefined && id !== null && id !== '' && !isNaN(parseInt(id))) ? parseInt(id) : null;
            createAddrReq.input('cityId', sql.Int, parseId(cityId));
            createAddrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
            createAddrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
            createAddrReq.input('zipCode', sql.NVarChar, zipCode || null);
            const addrResult = await createAddrReq.query(`
              INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
              OUTPUT INSERTED.AddressId
              VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
            `);
            homeAddressId = addrResult.recordset[0].AddressId;

            const linkAddrReq = new sql.Request(transaction);
            linkAddrReq.input('candId', sql.Int, candidateId);
            linkAddrReq.input('addrId', sql.Int, homeAddressId);
            await linkAddrReq.query(`
              INSERT INTO [core].[EntityAddress] (EntityType, EntityId, AddressId, AddressType, IsPrimary)
              VALUES ('CANDIDATE', @candId, @addrId, 'CURRENT', 1)
            `);
          }
          
          if (homeAddressId) {
            const linkEmpHome = new sql.Request(transaction);
            linkEmpHome.input('empId', sql.Int, currentEmp.EmployeeId);
            linkEmpHome.input('addrId', sql.Int, homeAddressId);
            await linkEmpHome.query(`UPDATE [hrm].[Employee] SET HomeAddressId = @addrId WHERE EmployeeId = @empId`);
          }
        }

        // --- MAILING ADDRESS ---
        if (mailingStreetAddress || mailingCityId || mailingZipCode) {
          // Check if mailing address already exists in hrm.Employee
          const checkMailing = new sql.Request(transaction);
          checkMailing.input('empId', sql.Int, currentEmp.EmployeeId);
          const mailResult = await checkMailing.query(`SELECT MailingAddressId FROM [hrm].[Employee] WHERE EmployeeId = @empId`);
          
          let mailingAddressId = mailResult.recordset.length > 0 ? mailResult.recordset[0].MailingAddressId : null;
          
          if (mailingAddressId) {
            const updateMailReq = new sql.Request(transaction);
            updateMailReq.input('addrId', sql.Int, mailingAddressId);
            updateMailReq.input('cityId', sql.Int, mailingCityId ? parseInt(mailingCityId) : null);
            updateMailReq.input('streetAddress', sql.NVarChar, mailingStreetAddress || null);
            updateMailReq.input('apartmentSuite', sql.NVarChar, mailingApartmentSuite || null);
            updateMailReq.input('zipCode', sql.NVarChar, mailingZipCode || null);
            
            await updateMailReq.query(`
              UPDATE [core].[Address] 
              SET CityId = ISNULL(@cityId, CityId), 
                  Line1 = ISNULL(@streetAddress, Line1), 
                  Line2 = ISNULL(@apartmentSuite, Line2), 
                  PostalCode = ISNULL(@zipCode, PostalCode)
              WHERE AddressId = @addrId
            `);
          } else {
            const createMailReq = new sql.Request(transaction);
            createMailReq.input('cityId', sql.Int, mailingCityId ? parseInt(mailingCityId) : null);
            createMailReq.input('streetAddress', sql.NVarChar, mailingStreetAddress || null);
            createMailReq.input('apartmentSuite', sql.NVarChar, mailingApartmentSuite || null);
            createMailReq.input('zipCode', sql.NVarChar, mailingZipCode || null);
            const mResult = await createMailReq.query(`
              INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
              OUTPUT INSERTED.AddressId
              VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
            `);
            mailingAddressId = mResult.recordset[0].AddressId;
            
            const linkEmpMail = new sql.Request(transaction);
            linkEmpMail.input('empId', sql.Int, currentEmp.EmployeeId);
            linkEmpMail.input('addrId', sql.Int, mailingAddressId);
            await linkEmpMail.query(`UPDATE [hrm].[Employee] SET MailingAddressId = @addrId WHERE EmployeeId = @empId`);
          }
        }

        // Update Work Authorization
        if (visaStatus) {
          const authCheck = new sql.Request(transaction);
          authCheck.input('employeeId', sql.BigInt, currentEmp.EmployeeId);
          const authResult = await authCheck.query(`
            SELECT WorkAuthorizationId FROM [hrm].[EmployeeWorkAuthorization]
            WHERE EmployeeId = @employeeId AND StatusCode = 'ACTIVE'
          `);

          const visaReq = new sql.Request(transaction);
          visaReq.input('employeeId', sql.BigInt, currentEmp.EmployeeId);
          visaReq.input('authType', sql.NVarChar, visaStatus);
          visaReq.input('authNum', sql.NVarChar, visaNumber || null);
          
          let iDate = null;
          if (visaIssueDate && String(visaIssueDate).trim() !== '') iDate = new Date(visaIssueDate);
          visaReq.input('iDate', sql.Date, iDate);
          
          let eDate = null;
          if (visaExpiryDate && String(visaExpiryDate).trim() !== '') eDate = new Date(visaExpiryDate);
          visaReq.input('eDate', sql.Date, eDate);

          if (authResult.recordset.length > 0) {
            const authId = authResult.recordset[0].WorkAuthorizationId;
            visaReq.input('authId', sql.BigInt, authId);
            await visaReq.query(`
              UPDATE [hrm].[EmployeeWorkAuthorization]
              SET AuthorizationType = @authType, AuthorizationNumber = @authNum, IssueDate = @iDate, ExpiryDate = @eDate, UpdatedAtUtc = SYSUTCDATETIME()
              WHERE WorkAuthorizationId = @authId
            `);
          } else {
            await visaReq.query(`
              INSERT INTO [hrm].[EmployeeWorkAuthorization] (
                EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate, StatusCode
              ) VALUES (
                @employeeId, @authType, @authNum, @iDate, @eDate, 'ACTIVE'
              )
            `);
          }
        }

        // Update Address logic
        if (streetAddress !== undefined || cityId !== undefined || zipCode !== undefined) {
          const checkAddrReq = new sql.Request(transaction);
          checkAddrReq.input('candidateId', sql.Int, candidateId);
          const addrCheck = await checkAddrReq.query(`
            SELECT TOP 1 ea.AddressId
            FROM [core].[EntityAddress] ea
            WHERE ea.EntityType = 'CANDIDATE' AND ea.EntityId = @candidateId
            ORDER BY ea.IsPrimary DESC
          `);

          if (addrCheck.recordset.length > 0) {
            const existingAddrId = addrCheck.recordset[0].AddressId;
            const updateAddrReq = new sql.Request(transaction);
            updateAddrReq.input('addrId', sql.Int, existingAddrId);
            updateAddrReq.input('cityId', sql.Int, cityId !== undefined && cityId !== null && cityId !== '' ? parseInt(cityId) : null);
            updateAddrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
            updateAddrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
            updateAddrReq.input('zipCode', sql.NVarChar, zipCode || null);
            
            await updateAddrReq.query(`
              UPDATE [core].[Address] 
              SET CityId = ISNULL(@cityId, CityId), 
                  Line1 = ISNULL(@streetAddress, Line1), 
                  Line2 = ISNULL(@apartmentSuite, Line2), 
                  PostalCode = ISNULL(@zipCode, PostalCode)
              WHERE AddressId = @addrId
            `);
          } else if (streetAddress || cityId || zipCode) {
            // Create new address if none exists
            const createAddrReq = new sql.Request(transaction);
            createAddrReq.input('cityId', sql.Int, cityId !== undefined && cityId !== null && cityId !== '' ? parseInt(cityId) : null);
            createAddrReq.input('streetAddress', sql.NVarChar, streetAddress || null);
            createAddrReq.input('apartmentSuite', sql.NVarChar, apartmentSuite || null);
            createAddrReq.input('zipCode', sql.NVarChar, zipCode || null);
            
            const addrResult = await createAddrReq.query(`
              INSERT INTO [core].[Address] (CityId, Line1, Line2, PostalCode)
              OUTPUT INSERTED.AddressId
              VALUES (@cityId, @streetAddress, @apartmentSuite, @zipCode)
            `);
            const newAddressId = addrResult.recordset[0].AddressId;

            const linkAddrReq = new sql.Request(transaction);
            linkAddrReq.input('candId', sql.Int, candidateId);
            linkAddrReq.input('addrId', sql.Int, newAddressId);
            await linkAddrReq.query(`
              INSERT INTO [core].[EntityAddress] (EntityType, EntityId, AddressId, AddressType, IsPrimary)
              VALUES ('CANDIDATE', @candId, @addrId, 'CURRENT', 1)
            `);
          }
        }

        // Log Status History if changed
        if (status && status !== prevStatus) {
          const historyUpdate = new sql.Request(transaction);
          historyUpdate.input('empId', sql.Int, parseInt(employeeId));
          historyUpdate.input('fromStatus', sql.NVarChar, prevStatus);
          historyUpdate.input('toStatus', sql.NVarChar, status);
          await historyUpdate.query(`
            INSERT INTO [hrm].[EmployeeStatusHistory] (EmployeeId, FromStatus, ToStatus, ChangedAtUtc, ChangedByUserName)
            VALUES (@empId, @fromStatus, @toStatus, SYSUTCDATETIME(), 'System')
          `);
        }

        await transaction.commit();
        
        // Fetch and return full updated employee data (using the same query as getAllEmployees)
        const finalRequest = new sql.Request(pool);
        
        // Use the comprehensive query from getAllEmployees to get all fields including joined data
        const fullQuery = `
          SELECT 
            e.EmployeeId as Id,
            e.EmployeeId,
            e.EmployeeCode,
            e.EmployeeCode as [employeeId],
            e.EmployeeType,
            e.EntityId,
            e.CandidateId,
            e.SupervisorEmployeeId,
            e.BackupSupervisorEmployeeId,
            e.HireDate,
            e.StartDate,
            e.EndDate,
            e.EmploymentStatus,
            e.PayrollSystemId,
            e.TimesheetRequired,
            e.HomeAddressId,
            e.MailingAddressId,
            e.EmergencyContactName,
            e.EmergencyContactPhone,
            e.IsDeleted,
            e.CreatedAtUtc,
            e.CreatedByUserId,
            e.UpdatedAtUtc,
            e.UpdatedByUserId,
            c.FirstName,
            c.MiddleName,
            c.LastName,
            TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
            c.JobTitle as Position,
            c.JobTitle,
            ci_email.IdentityValue as Email,
            ci_phone.IdentityValue as Phone,
            c.CandidateCode,
            wa.AuthorizationType as VisaStatus,
            wa.AuthorizationNumber as VisaNumber,
            wa.IssueDate as VisaIssueDate,
            wa.ExpiryDate as VisaExpiryDate,
            addr.Line1 as StreetAddress,
            addr.Line2 as ApartmentSuite,
            addr.CityId as cityId,
            city.StateId as stateId,
            state.CountryId as countryId,
            addr.PostalCode as ZipCode,
            city.Name as City,
            state.Code as State,
            country.Name as Country,
            TRIM(CONCAT(sc.FirstName, ' ', ISNULL(sc.MiddleName + ' ', ''), sc.LastName)) as SupervisorName,
            TRIM(CONCAT(bsc.FirstName, ' ', ISNULL(bsc.MiddleName + ' ', ''), bsc.LastName)) as BackupSupervisorName,
            m_addr.Line1 as MailingStreetAddress,
            m_addr.Line2 as MailingApartmentSuite,
            m_addr.CityId as mailingCityId,
            m_city.StateId as mailingStateId,
            m_state.CountryId as mailingCountryId,
            m_addr.PostalCode as MailingZipCode,
            m_city.Name as MailingCity,
            m_state.Code as MailingState,
            m_country.Name as MailingCountry
          FROM [hrm].[Employee] e
          LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
          LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
          LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
          LEFT JOIN [core].[EntityAddress] ea ON ea.EntityId = c.CandidateId AND ea.EntityType = 'CANDIDATE' AND ea.IsPrimary = 1
          LEFT JOIN [core].[Address] addr ON addr.AddressId = ea.AddressId
          LEFT JOIN [core].[City] city ON city.CityId = addr.CityId
          LEFT JOIN [core].[StateProvince] state ON state.StateId = city.StateId
          LEFT JOIN [core].[Country] country ON country.CountryId = state.CountryId
          LEFT JOIN (
            SELECT EmployeeId, AuthorizationType, AuthorizationNumber, IssueDate, ExpiryDate,
                   ROW_NUMBER() OVER(PARTITION BY EmployeeId ORDER BY CreatedAtUtc DESC) as rn
            FROM [hrm].[EmployeeWorkAuthorization]
            WHERE StatusCode = 'ACTIVE'
          ) wa ON wa.EmployeeId = e.EmployeeId AND wa.rn = 1
          LEFT JOIN [hrm].[Employee] s ON e.SupervisorEmployeeId = s.EmployeeId
          LEFT JOIN [recruit].[Candidate] sc ON s.CandidateId = sc.CandidateId
          LEFT JOIN [hrm].[Employee] bs ON e.BackupSupervisorEmployeeId = bs.EmployeeId
          LEFT JOIN [recruit].[Candidate] bsc ON bs.CandidateId = bsc.CandidateId
          LEFT JOIN [core].[Address] m_addr ON m_addr.AddressId = e.MailingAddressId
          LEFT JOIN [core].[City] m_city ON m_city.CityId = m_addr.CityId
          LEFT JOIN [core].[StateProvince] m_state ON m_state.StateId = m_city.StateId
          LEFT JOIN [core].[Country] m_country ON m_country.CountryId = m_state.CountryId
          WHERE e.EmployeeId = @empId
        `;

        finalRequest.input('empId', sql.Int, currentEmp.EmployeeId);
        const finalResult = await finalRequest.query(fullQuery);

        res.json({ 
          success: true, 
          message: 'Employee updated successfully',
          data: finalResult.recordset[0]
        });

      } catch (err) {
        await transaction.rollback();
        throw err;
      }

    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ success: false, message: 'Error updating employee', error: error.message });
    } finally {
      // Shared pool should not be closed
    }
  },

  deleteEmployee: async (req, res) => {
    try {
      const pool = await poolPromise;
      const { companyId, employeeId } = req.params;
      if (!companyId || !employeeId) {
        return res.status(400).json({ success: false, message: 'Company ID and Employee ID are required' });
      }

      const request = new sql.Request(pool);
      request.input('entityId', sql.Int, parseInt(companyId));
      request.input('employeeId', sql.Int, parseInt(employeeId));

      const result = await request.query(`
        UPDATE [hrm].[Employee] 
        SET IsDeleted = 1, UpdatedAtUtc = SYSUTCDATETIME() 
        WHERE EmployeeId = @employeeId AND EntityId = @entityId
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      res.json({ success: true, message: 'Employee soft-deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ success: false, message: 'Error deleting employee', error: error.message });
    }
  },

  updateEmployeeStatus: async (req, res) => {
    let connection = null;
    try {
      const { companyId, employeeId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      const pool = await poolPromise;

      // Start transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const request = new sql.Request(transaction);
        request.input('empId', sql.Int, parseInt(employeeId));
        request.input('status', sql.NVarChar, status);

        // Update employee status
        const updateResult = await request.query(`
          UPDATE [hrm].[Employee]
          SET EmploymentStatus = @status, UpdatedAtUtc = SYSUTCDATETIME()
          WHERE EmployeeId = @empId AND IsDeleted = 0
        `);

        if (updateResult.rowsAffected[0] === 0) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Log status history
        await request.query(`
          INSERT INTO [hrm].[EmployeeStatusHistory] (EmployeeId, ToStatus, ChangedAtUtc, ChangedByUserName)
          VALUES (@empId, @status, SYSUTCDATETIME(), 'System')
        `);

        await transaction.commit();
        res.json({ success: true, message: 'Employee status updated successfully', status });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ success: false, message: 'Error updating employee status', error: error.message });
    } finally {
      // Shared pool should not be closed
    }
  },

  getEmployeesByDepartment: async (req, res) => {
    try {
      const pool = await poolPromise;
      const { companyId, department } = req.params;
      
      if (!companyId || !department) {
        return res.status(400).json({ success: false, message: 'Company ID and Department are required' });
      }

      const result = await sql.query(`
        SELECT 
          e.*, 
          c.FirstName, c.LastName,
          TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
          ci_email.IdentityValue as Email
        FROM [hrm].[Employee] e
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
        WHERE e.EntityId = ${parseInt(companyId)} AND e.Department = '${department}' AND e.IsDeleted = 0
        ORDER BY c.FirstName ASC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length,
        department: department,
        companyId: parseInt(companyId)
      });
    } catch (error) {
      console.error('Get employees by department error:', error);
      res.status(500).json({ success: false, message: 'Error retrieving employees by department', error: error.message });
    }
  },

  searchEmployees: async (req, res) => {
    try {
      const pool = await poolPromise;
      const { companyId } = req.params;
      const { q, limit = 50 } = req.query;
      
      if (!companyId) return res.status(400).json({ success: false, message: 'Company ID is required' });
      if (!q || q.trim().length < 2) return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });

      const request = new sql.Request(pool);
      request.input('search', sql.NVarChar, `%${q.trim()}%`);
      request.input('entityId', sql.Int, parseInt(companyId));
      request.input('limit', sql.Int, parseInt(limit));
      
      const result = await request.query(`
        SELECT TOP (@limit) 
          e.*, 
          c.FirstName, c.LastName,
          TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
          ci_email.IdentityValue as Email
        FROM [hrm].[Employee] e
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
        WHERE e.EntityId = @entityId AND e.IsDeleted = 0
        AND (c.FirstName LIKE @search OR c.LastName LIKE @search OR ci_email.IdentityValue LIKE @search OR e.EmployeeCode LIKE @search)
        ORDER BY c.FirstName ASC
      `);
      
      res.json({ success: true, data: result.recordset, count: result.recordset.length });
    } catch (error) {
      console.error('Search employees error:', error);
      res.status(500).json({ success: false, message: 'Error searching employees', error: error.message });
    }
  },

  getEmployeeStats: async (req, res) => {
    try {
      const pool = await poolPromise;
      const { companyId } = req.params;
      if (!companyId) return res.status(400).json({ success: false, message: 'Company ID is required' });

      const result = await sql.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN e.EmploymentStatus = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN e.EmploymentStatus = 'Inactive' THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN e.EmploymentStatus = 'On Leave' THEN 1 ELSE 0 END) as onLeave,
          SUM(CASE WHEN e.EmployeeType = 'Full-time' THEN 1 ELSE 0 END) as fullTime,
          SUM(CASE WHEN e.EmployeeType = 'Part-time' THEN 1 ELSE 0 END) as partTime,
          SUM(CASE WHEN e.EmployeeType = 'Contract' THEN 1 ELSE 0 END) as contract
        FROM [hrm].[Employee] e
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        WHERE e.EntityId = ${parseInt(companyId)} AND e.IsDeleted = 0
      `);
      
      res.json({ success: true, data: { ...result.recordset[0], departments: 0 }, companyId: parseInt(companyId) });
    } catch (error) {
      console.error('Get employee stats error:', error);
      res.status(500).json({ success: false, message: 'Error retrieving employee stats', error: error.message });
    }
  },

  getEmployeeDetails: async (req, res) => {
    try {
      console.log('=== GET EMPLOYEE DETAILS (HRM) ===');
      const { companyId, employeeId } = req.params;
      
      if (!companyId || !employeeId) {
        return res.status(400).json({ success: false, message: 'Company ID and Employee ID are required' });
      }

      const pool = await poolPromise;
      const request = new sql.Request(pool);
      request.input('entityId', sql.Int, parseInt(companyId));
      
      // Determine if employeeId is numeric ID or alphanumeric Code
      const isNumeric = /^\d+$/.test(String(employeeId));
      
      let query = `
        SELECT 
          e.*,
          e.EmployeeType as EmploymentType,
          e.EmploymentStatus as Status,
          c.FirstName, c.MiddleName, c.LastName,
          c.JobTitle as Position,
          TRIM(COALESCE(NULLIF(TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)), ''), e.EmployeeCode)) as Name,
          ci_email.IdentityValue as Email,
          ci_phone.IdentityValue as Phone
        FROM [hrm].[Employee] e
        LEFT JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        LEFT JOIN [recruit].[CandidateIdentity] ci_email ON ci_email.CandidateId = c.CandidateId AND ci_email.IdentityType = 'Email' AND ci_email.IsPrimary = 1
        LEFT JOIN [recruit].[CandidateIdentity] ci_phone ON ci_phone.CandidateId = c.CandidateId AND ci_phone.IdentityType = 'Phone' AND ci_phone.IsPrimary = 1
        WHERE e.EntityId = @entityId AND e.IsDeleted = 0
      `;

      if (isNumeric) {
        request.input('empId', sql.Int, parseInt(employeeId));
        query += ` AND e.EmployeeId = @empId`;
      } else {
        request.input('empCode', sql.NVarChar, employeeId);
        query += ` AND e.EmployeeCode = @empCode`;
      }
      
      const empResult = await request.query(query);

      if (empResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const employee = empResult.recordset[0];
      const actualDbEmployeeId = employee.EmployeeId;

      // 2. Get Timesheet Stats (from hrm.Timesheet)
      const tsRequest = new sql.Request(pool);
      tsRequest.input('empId', sql.BigInt, actualDbEmployeeId);
      const tsResult = await tsRequest.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN StatusCode = 'SUBMITTED' AND (Notes IS NULL OR Notes NOT LIKE 'ATTACHMENT:%') THEN 1 ELSE 0 END) as internalPending,
          SUM(CASE WHEN StatusCode = 'SUBMITTED' AND Notes LIKE 'ATTACHMENT:%' THEN 1 ELSE 0 END) as externalPending,
          SUM(CASE WHEN StatusCode = 'SUBMITTED' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN StatusCode = 'APPROVED' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN StatusCode = 'REJECTED' THEN 1 ELSE 0 END) as rejected
        FROM [hrm].[Timesheet]
        WHERE EmployeeId = @empId
      `);

      res.json({
        success: true,
        data: {
          employee: employee,
          stats: {
            timesheets: tsResult.recordset[0]
          }
        }
      });
    } catch (error) {
      console.error('Get details error:', error);
      res.status(500).json({ success: false, message: 'Error retrieving employee details', error: error.message });
    }
  },

  getEmployeeTimesheets: async (req, res) => {
    try {
      const { companyId, employeeId } = req.params;
      const { status, startDate, endDate } = req.query;
      
      const pool = await poolPromise;
      
      // 1. Resolve numeric ID if alphanumeric code was provided
      let actualDbEmployeeId = parseInt(employeeId);
      if (isNaN(actualDbEmployeeId)) {
        const resolveReq = new sql.Request(pool);
        resolveReq.input('code', sql.NVarChar, employeeId);
        resolveReq.input('entityId', sql.Int, parseInt(companyId));
        const resolveRes = await resolveReq.query(`SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @code AND EntityId = @entityId`);
        if (resolveRes.recordset.length === 0) {
          return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        actualDbEmployeeId = resolveRes.recordset[0].EmployeeId;
      }

      const request = new sql.Request(pool);
      request.input('empId', sql.BigInt, actualDbEmployeeId);
      request.input('entityId', sql.Int, parseInt(companyId));
      
      let query = `
        SELECT 
          t.TimesheetId as id,
          t.TimesheetId,
          t.EmployeeId,
          t.EntityId as CompanyId,
          t.WeekStartDate as PeriodStart,
          t.WeekEndDate as PeriodEnd,
          t.TotalHours,
          CASE 
            WHEN t.StatusCode = 'SUBMITTED' THEN 'Pending'
            WHEN t.StatusCode = 'APPROVED' THEN 'Approved'
            WHEN t.StatusCode = 'REJECTED' THEN 'Rejected'
            ELSE t.StatusCode
          END as Status,
          t.CreatedAtUtc as CreatedAt,
          t.UpdatedAtUtc as UpdatedAt,
          TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as EmployeeName,
          c.JobTitle as Position
        FROM [hrm].[Timesheet] t
        JOIN [hrm].[Employee] e ON t.EmployeeId = e.EmployeeId
        JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
        WHERE t.EmployeeId = @empId AND t.EntityId = @entityId AND t.StatusCode != 'DRAFT'
      `;
      
      if (status && status !== 'All') {
        query += ' AND t.StatusCode = @status';
        request.input('status', sql.NVarChar, status.toUpperCase());
      }
      
      if (startDate) {
        query += ' AND t.WeekStartDate >= @startDate';
        request.input('startDate', sql.Date, new Date(startDate));
      }
      
      if (endDate) {
        query += ' AND t.WeekEndDate <= @endDate';
        request.input('endDate', sql.Date, new Date(endDate));
      }
      
      query += ' ORDER BY t.WeekStartDate DESC';
      
      const result = await request.query(query);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get employee timesheets error:', error);
      res.status(500).json({ success: false, message: 'Error retrieving employee timesheets', error: error.message });
    }
  },

  getEmployeeExternalTimesheets: async (req, res) => {
    try {
      const { companyId, employeeId } = req.params;
      const pool = await poolPromise;

      // Resolve numeric EmployeeId if code is passed
      let resolvedEmpId = parseInt(employeeId);
      if (isNaN(resolvedEmpId)) {
        const empLookup = await pool.request()
          .input('code', sql.NVarChar, employeeId)
          .query('SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @code');
        if (empLookup.recordset.length > 0) {
          resolvedEmpId = empLookup.recordset[0].EmployeeId;
        } else {
          return res.status(404).json({ success: false, message: 'Employee not found' });
        }
      }
      
      const request = new sql.Request(pool);
      request.input('empId', sql.BigInt, resolvedEmpId);
      request.input('entityId', sql.BigInt, parseInt(companyId));
      
      // Fetch from EmployeeDocument to show ALL uploads
      const result = await request.query(`
        SELECT 
          ed.DocumentId as Id,
          ed.DocumentId as FileId,
          d.OriginalFileName as FileName,
          d.StorageLocator as FilePath,
          d.FileExtension as FileType,
          d.UploadedAtUtc as UploadDate,
          d.UploadedAtUtc as CreatedAt,
          ISNULL(t.StatusCode, 'SUBMITTED') as Status,
          t.WeekStartDate as PeriodStart,
          t.WeekEndDate as PeriodEnd,
          t.TimesheetId -- May be NULL if orphaned
        FROM [hrm].[EmployeeDocument] ed
        JOIN [core].[Document] d ON ed.CoreDocumentId = d.DocumentId
        JOIN [hrm].[Employee] e ON ed.EmployeeId = e.EmployeeId
        LEFT JOIN [hrm].[Timesheet] t ON t.EmployeeId = ed.EmployeeId 
             AND (t.Notes LIKE '%CORE_DOC_ID:' + CAST(ed.CoreDocumentId as VARCHAR) + '%'
                  OR (t.Notes IS NULL AND ed.Notes LIKE '%' + CAST(t.WeekStartDate as VARCHAR) + '%'))
        WHERE ed.EmployeeId = @empId 
          AND e.EntityId = @entityId
          AND ed.DocumentType = 'Timesheet'
          AND ed.IsDeleted = 0
        ORDER BY d.UploadedAtUtc DESC
      `);
      
      const data = result.recordset.map(row => {
        const periodStart = row.PeriodStart ? new Date(row.PeriodStart) : null;
        let periodStr = 'N/A';
        
        if (periodStart) {
          periodStr = `${(periodStart.getMonth() + 1).toString().padStart(2, '0')}/${periodStart.getFullYear()}`;
        } else if (row.UploadDate) {
          // Fallback: Use upload month if no specific work period is found
          const uDate = new Date(row.UploadDate);
          periodStr = `${(uDate.getMonth() + 1).toString().padStart(2, '0')}/${uDate.getFullYear()}`;
        }
        
        return {
          ...row,
          Period: periodStr
        };
      });

      res.json({
        success: true,
        data: data,
        count: data.length,
        message: 'External timesheets retrieved successfully'
      });
    } catch (error) {
      console.error('Get employee external timesheets error:', error);
      res.status(500).json({ success: false, message: 'Error retrieving external timesheets', error: error.message });
    }
  },


  getEmployeeStatements: async (req, res) => {
    try {
      const { companyId, employeeId } = req.params;
      const pool = await poolPromise;
      
      const request = new sql.Request(pool);
      request.input('empId', sql.Int, parseInt(employeeId));
      request.input('entityId', sql.Int, parseInt(companyId));
      
      const result = await request.query(`
        SELECT ps.* 
        FROM EmployeePayStructure ps
        JOIN [hrm].[Employee] e ON ps.EmployeeId = e.EmployeeCode
        WHERE e.EmployeeId = @empId AND e.EntityId = @entityId
        ORDER BY ps.CheckDate DESC
      `);
      
      res.json({ success: true, data: result.recordset || [], count: result.recordset.length });
    } catch (error) {
      console.error('Get statements error:', error.message);
      res.status(500).json({ success: false, message: 'Error retrieving statements' });
    }
  },

  getEmployeeReports: async (req, res) => {
    try {
      const { companyId, employeeId } = req.params;
      const pool = await poolPromise;
      
      const request = new sql.Request(pool);
      request.input('empId', sql.Int, parseInt(employeeId));
      request.input('entityId', sql.Int, parseInt(companyId));
      
      const result = await request.query(`
        SELECT er.* 
        FROM EmployeeReports er
        JOIN [hrm].[Employee] e ON er.EmployeeId = e.EmployeeCode
        WHERE e.EmployeeId = @empId AND e.EntityId = @entityId
        ORDER BY er.UploadDate DESC
      `);
      
      res.json({ success: true, data: result.recordset || [], count: result.recordset.length });
    } catch (error) {
      console.error('Get reports error:', error.message);
      res.status(500).json({ success: false, message: 'Error retrieving reports' });
    }
  },


// Replace these three functions in your employeeController.js

approveExternalTimesheet: async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, employeeId, timesheetId } = req.params; // timesheetId here is EmployeeDocumentId
    const managerId = req.user.id;

    // 1. Resolve numeric EmployeeId if code is passed
    let resolvedEmpId = parseInt(employeeId);
    if (isNaN(resolvedEmpId)) {
      const empLookup = await pool.request()
        .input('code', sql.NVarChar, employeeId)
        .query('SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @code');
      if (empLookup.recordset.length > 0) {
        resolvedEmpId = empLookup.recordset[0].EmployeeId;
      } else {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
    }

    // 2. Find the corresponding CoreDocumentId to identify the Timesheet
    const docInfo = await pool.request()
      .input("id", sql.Int, parseInt(timesheetId))
      .query("SELECT CoreDocumentId FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");

    if (docInfo.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Document record not found' });
    }

    const coreId = docInfo.recordset[0].CoreDocumentId;

    // 3. Get the Manager's EmployeeId (for auditing)
    const userResult = await pool.request()
      .input('userId', sql.BigInt, managerId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e 
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode 
        WHERE u.id = @userId
      `);
    const approverEmployeeId = userResult.recordset[0]?.EmployeeId || null;

    // 4. Find and Update the Timesheet record
    // We try to match by Notes containing the CoreDocumentId
    const result = await pool.request()
      .input("empId", sql.BigInt, resolvedEmpId)
      .input("coreSearch", sql.NVarChar, `%CORE_DOC_ID:${coreId}%`)
      .input("approverId", sql.BigInt, approverEmployeeId)
      .input("userId", sql.BigInt, managerId)
      .query(`
        UPDATE [hrm].[Timesheet] 
        SET StatusCode = 'APPROVED',
            UpdatedAtUtc = SYSUTCDATETIME(),
            UpdatedByUserId = @userId,
            ApprovedAtUtc = SYSUTCDATETIME(),
            ApprovedByEmployeeId = @approverId
        WHERE EmployeeId = @empId AND Notes LIKE @coreSearch
      `);

    if (result.rowsAffected[0] === 0) {
      // FALLBACK: If Notes link is broken (e.g. overwritten by a later upload), 
      // try to find the timesheet for the same week.
      // We can get the week from EmployeeDocument.Notes which says "Timesheet for week starting YYYY-MM-DD"
      const edNotesResult = await pool.request()
        .input("id", sql.Int, parseInt(timesheetId))
        .query("SELECT Notes FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");
      
      const edNotes = edNotesResult.recordset[0]?.Notes || '';
      const dateMatch = edNotes.match(/\d{4}-\d{2}-\d{2}/);
      
      if (dateMatch) {
        const weekStart = dateMatch[0];
        console.log(`🔍 Fallback: Searching for timesheet for Emp ${resolvedEmpId} starting ${weekStart}`);
        
        const fallbackResult = await pool.request()
          .input("empId", sql.BigInt, resolvedEmpId)
          .input("weekStart", sql.Date, weekStart)
          .input("approverId", sql.BigInt, approverEmployeeId)
          .input("userId", sql.BigInt, managerId)
          .query(`
            UPDATE [hrm].[Timesheet] 
            SET StatusCode = 'APPROVED',
                UpdatedAtUtc = SYSUTCDATETIME(),
                UpdatedByUserId = @userId,
                ApprovedAtUtc = SYSUTCDATETIME(),
                ApprovedByEmployeeId = @approverId
            WHERE EmployeeId = @empId AND WeekStartDate = @weekStart
          `);
          
        if (fallbackResult.rowsAffected[0] > 0) {
          return res.json({ success: true, message: 'Timesheet approved successfully (via week match)' });
        }
      }

      return res.status(404).json({ success: false, message: 'Matching weekly timesheet record not found for this file' });
    }

    res.json({ success: true, message: 'Timesheet approved successfully' });
  } catch (error) {
    console.error('Approve external timesheet error:', error);
    res.status(500).json({ success: false, message: 'Error approving timesheet', error: error.message });
  }
},


rejectExternalTimesheet: async (req, res) => {
  try {
    const pool = await poolPromise;
    const { companyId, employeeId, timesheetId } = req.params; // timesheetId here is EmployeeDocumentId
    const { reason } = req.body;
    const managerId = req.user.id;

    // 1. Resolve numeric EmployeeId if code is passed
    let resolvedEmpId = parseInt(employeeId);
    if (isNaN(resolvedEmpId)) {
      const empLookup = await pool.request()
        .input('code', sql.NVarChar, employeeId)
        .query('SELECT EmployeeId FROM [hrm].[Employee] WHERE EmployeeCode = @code');
      if (empLookup.recordset.length > 0) {
        resolvedEmpId = empLookup.recordset[0].EmployeeId;
      } else {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
    }

    // 2. Find the corresponding CoreDocumentId
    const docInfo = await pool.request()
      .input("id", sql.Int, parseInt(timesheetId))
      .query("SELECT CoreDocumentId FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");

    if (docInfo.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Document record not found' });
    }

    const coreId = docInfo.recordset[0].CoreDocumentId;

    // 3. Find and Update the Timesheet record
    const result = await pool.request()
      .input("empId", sql.BigInt, resolvedEmpId)
      .input("coreSearch", sql.NVarChar, `%CORE_DOC_ID:${coreId}%`)
      .input("userId", sql.BigInt, managerId)
      .input("reason", sql.NVarChar, reason || 'Rejected by manager')
      .query(`
        UPDATE [hrm].[Timesheet] 
        SET StatusCode = 'REJECTED',
            UpdatedAtUtc = SYSUTCDATETIME(),
            UpdatedByUserId = @userId,
            RejectionReason = @reason
        WHERE EmployeeId = @empId AND Notes LIKE @coreSearch
      `);

    if (result.rowsAffected[0] === 0) {
      // Fallback: Try match by week
      const edNotesResult = await pool.request()
        .input("id", sql.Int, parseInt(timesheetId))
        .query("SELECT Notes FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");
      
      const edNotes = edNotesResult.recordset[0]?.Notes || '';
      const dateMatch = edNotes.match(/\d{4}-\d{2}-\d{2}/);
      
      if (dateMatch) {
        const weekStart = dateMatch[0];
        await pool.request()
          .input("empId", sql.BigInt, resolvedEmpId)
          .input("weekStart", sql.Date, weekStart)
          .input("userId", sql.BigInt, managerId)
          .input("reason", sql.NVarChar, reason || 'Rejected by manager')
          .query(`
            UPDATE [hrm].[Timesheet] 
            SET StatusCode = 'REJECTED',
                UpdatedAtUtc = SYSUTCDATETIME(),
                UpdatedByUserId = @userId,
                RejectionReason = @reason
            WHERE EmployeeId = @empId AND WeekStartDate = @weekStart
          `);
        return res.json({ success: true, message: 'Timesheet rejected successfully' });
      }
    }

    res.json({ success: true, message: 'Timesheet rejected successfully' });
  } catch (error) {
    console.error('Reject external timesheet error:', error);
    res.status(500).json({ success: false, message: 'Error rejecting timesheet', error: error.message });
  }
},

downloadExternalTimesheet: async (req, res) => {
  try {
    const pool = await poolPromise;
    const { timesheetId } = req.params; // EmployeeDocument ID
    
    const result = await pool.request()
      .input("id", sql.Int, parseInt(timesheetId))
      .query(`
        SELECT d.OriginalFileName, d.StorageLocator 
        FROM [hrm].[EmployeeDocument] ed
        JOIN [core].[Document] d ON ed.CoreDocumentId = d.DocumentId
        WHERE ed.DocumentId = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'File record not found' });
    }

    const { OriginalFileName, StorageLocator } = result.recordset[0];

    if (!fs.existsSync(StorageLocator)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server' });
    }

    res.download(StorageLocator, OriginalFileName);
  } catch (error) {
    console.error('Download external timesheet error:', error);
    res.status(500).json({ success: false, message: 'Error downloading file', error: error.message });
  }
},

deleteExternalTimesheet: async (req, res) => {
  try {
    const pool = await poolPromise;
    const { timesheetId } = req.params; // This is EmployeeDocument ID
    
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const findResult = await transaction.request()
        .input("id", sql.Int, parseInt(timesheetId))
        .query("SELECT CoreDocumentId FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");

      if (findResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: "Document record not found" });
      }

      const coreId = findResult.recordset[0].CoreDocumentId;

      // Soft delete EmployeeDocument
      await transaction.request()
        .input("id", sql.Int, parseInt(timesheetId))
        .query("UPDATE [hrm].[EmployeeDocument] SET IsDeleted = 1 WHERE DocumentId = @id");

      // Soft delete CoreDocument
      if (coreId) {
        await transaction.request()
          .input("coreId", sql.Int, coreId)
          .query("UPDATE [core].[Document] SET IsDeleted = 1 WHERE DocumentId = @coreId");
      }

      await transaction.commit();
      res.json({ success: true, message: "Timesheet deleted successfully" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Delete external timesheet error:', error);
    res.status(500).json({ success: false, message: 'Error deleting timesheet', error: error.message });
  }
},

deleteReport: async (req, res) => {
  try {
    const { companyId, employeeId, reportId } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('reportId', sql.Int, parseInt(reportId));
    
    await request.query(`DELETE FROM EmployeeReports WHERE Id=@reportId`);

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting report' });
  }
},

updateStatement: async (req, res) => {
  try {
    const { companyId, employeeId, statementId } = req.params;
    const { checkDate, period, description, hours, payRate, credit, debit, balance } = req.body;

    const pool = await poolPromise;
    const tableName = getEmployeeTable(companyId);
    
    // FIXED: Parse employeeId as integer first
    const employeeIdInt = parseInt(employeeId, 10);
    if (isNaN(employeeIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Employee ID format' 
      });
    }

    // Get EmployeeId code (string) using integer Id
    const empRequest = new sql.Request(pool);
    empRequest.input('id', sql.Int, employeeIdInt);
    const empResult = await empRequest.query(`SELECT EmployeeId FROM ${tableName} WHERE Id = @id`);
    
    if (empResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    const employeeIdCode = empResult.recordset[0].EmployeeId;

    // FIXED: Use sql.NVarChar for EmployeeId (it's a string)
    const request = new sql.Request(pool);
    request.input('statementId', sql.Int, parseInt(statementId, 10));
    request.input('employeeIdCode', sql.NVarChar, employeeIdCode);
    request.input('checkDate', sql.DateTime, checkDate ? new Date(checkDate) : new Date());
    request.input('period', sql.NVarChar, period || '');
    request.input('description', sql.NVarChar, description || '');
    request.input('hours', sql.Float, hours ? parseFloat(hours) : 0);
    request.input('payRate', sql.Float, payRate ? parseFloat(payRate) : 0);
    request.input('credit', sql.Float, credit ? parseFloat(credit) : 0);
    request.input('debit', sql.Float, debit ? parseFloat(debit) : 0);
    request.input('balance', sql.Float, balance ? parseFloat(balance) : 0);
    
    const result = await request.query(`
      UPDATE EmployeePayStructure 
      SET CheckDate=@checkDate, 
          Period=@period, 
          Description=@description, 
          Hours=@hours, 
          PayRate=@payRate, 
          Credit=@credit, 
          Debit=@debit, 
          Balance=@balance 
      WHERE Id=@statementId AND EmployeeId=@employeeIdCode
    `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Statement not found or no changes made' 
      });
    }

    const getRequest = new sql.Request(pool);
    getRequest.input('statementId', sql.Int, parseInt(statementId, 10));
    const getResult = await getRequest.query(`
      SELECT * FROM EmployeePayStructure WHERE Id=@statementId
    `);
    
    res.json({ 
      success: true, 
      message: 'Statement updated successfully',
      data: getResult.recordset[0]
    });
  } catch (error) {
    console.error('Error updating statement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating statement: ' + error.message
    });
  }
},

deleteStatement: async (req, res) => {
  try {
    const { companyId, employeeId, statementId } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('statementId', sql.Int, parseInt(statementId));
    
    await request.query(`DELETE FROM EmployeePayStructure WHERE Id=@statementId`);

    res.json({ success: true, message: 'Statement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting statement' });
  }
},


// REPLACE the createStatement method in your employeeController.js with this:

createStatement: async (req, res) => {
  try {
    const { companyId, employeeId } = req.params;
    const { checkDate, period, description, hours, payRate, credit, debit, balance } = req.body;

    if (!checkDate || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Check date and description are required fields' 
      });
    }

    const pool = await poolPromise;
    const tableName = getEmployeeTable(companyId);
    
    // KEY FIX: Parse as integer ONLY
    const employeeIdInt = parseInt(employeeId, 10);
    if (isNaN(employeeIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Employee ID - must be numeric' 
      });
    }

    // Step 1: Get employee using INTEGER id
    const empRequest = new sql.Request(pool);
    empRequest.input('empDbId', sql.Int, employeeIdInt);
    const empResult = await empRequest.query(`
      SELECT Id, EmployeeId FROM ${tableName} WHERE Id = @empDbId
    `);
    
    if (!empResult.recordset.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    const empCode = empResult.recordset[0].EmployeeId;

    // Step 2: Insert using STRING EmployeeId code
    const req2 = new sql.Request(pool);
    req2.input('empCode', sql.NVarChar, empCode);
    req2.input('compId', sql.Int, parseInt(companyId, 10));
    req2.input('checkDt', sql.DateTime, new Date(checkDate));
    req2.input('per', sql.NVarChar, period || '');
    req2.input('desc', sql.NVarChar, description || '');
    req2.input('hrs', sql.Float, parseFloat(hours) || 0);
    req2.input('rate', sql.Float, parseFloat(payRate) || 0);
    req2.input('cred', sql.Float, parseFloat(credit) || 0);
    req2.input('deb', sql.Float, parseFloat(debit) || 0);
    req2.input('bal', sql.Float, parseFloat(balance) || 0);
    
    const result = await req2.query(`
      INSERT INTO EmployeePayStructure 
      (EmployeeId, CompanyId, CheckDate, Period, Description, Hours, PayRate, Credit, Debit, Balance)
      OUTPUT INSERTED.Id
      VALUES (@empCode, @compId, @checkDt, @per, @desc, @hrs, @rate, @cred, @deb, @bal)
    `);

    res.status(201).json({ 
      success: true, 
      message: 'Statement created successfully',
      data: { id: result.recordset[0].Id }
    });
  } catch (error) {
    console.error('Create statement error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message
    });
  }
},

uploadReport: async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { companyId, employeeId } = req.params;
    const pool = await poolPromise;
    const tableName = getEmployeeTable(companyId);
    
    // KEY FIX: Parse as integer ONLY
    const employeeIdInt = parseInt(employeeId, 10);
    if (isNaN(employeeIdInt)) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Employee ID - must be numeric' 
      });
    }

    // Step 1: Get employee using INTEGER id
    const empRequest = new sql.Request(pool);
    empRequest.input('empDbId', sql.Int, employeeIdInt);
    const empResult = await empRequest.query(`
      SELECT Id, EmployeeId, Name FROM ${tableName} WHERE Id = @empDbId
    `);
    
    if (!empResult.recordset.length) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    const empCode = empResult.recordset[0].EmployeeId;
    const empName = empResult.recordset[0].Name;

    // Step 2: Insert using STRING EmployeeId code
    const req2 = new sql.Request(pool);
    req2.input('empCode', sql.NVarChar, empCode);
    req2.input('compId', sql.Int, parseInt(companyId, 10));
    req2.input('fname', sql.NVarChar, req.file.originalname);
    req2.input('fpath', sql.NVarChar, req.file.path);
    req2.input('fsize', sql.Int, req.file.size);
    req2.input('desc', sql.NVarChar, req.body.description || '');
    req2.input('typ', sql.NVarChar, req.body.type || 'Report');
    req2.input('by', sql.NVarChar, empName);
    
    await req2.query(`
      INSERT INTO EmployeeReports 
      (EmployeeId, CompanyId, FileName, FilePath, FileSize, Description, Type, UploadedBy, UploadDate)
      VALUES (@empCode, @compId, @fname, @fpath, @fsize, @desc, @typ, @by, GETDATE())
    `);

    res.status(201).json({ 
      success: true, 
      message: 'Report uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload report error:', error.message);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message
    });
  }
},

getEmployeePayrollInfo: async (req, res) => {
  try {
    const { companyId, employeeId } = req.params;
    
    console.log('=== GET EMPLOYEE PAYROLL INFO ===');
    console.log('Company ID:', companyId);
    console.log('Employee ID:', employeeId);
    
    const pool = await poolPromise;
    const tableName = getEmployeeTable(companyId);
    
    const employeeIdInt = parseInt(employeeId, 10);
    if (isNaN(employeeIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Employee ID format' 
      });
    }

    const request = new sql.Request(pool);
    request.input('id', sql.Int, employeeIdInt);
    
    const result = await request.query(`
      SELECT 
        e.EmployeeId as Id,
        e.EmployeeCode as EmployeeId,
        TRIM(CONCAT(c.FirstName, ' ', ISNULL(c.MiddleName + ' ', ''), c.LastName)) as Name,
        ci.IdentityValue as Email,
        'Hourly' as PayType,
        'Hourly' as BasisOfPay,
        'Weekly' as PaySchedule,
        0 as SeasonalEmployee,
        0 as OwnerOfficer,
        0 as SemiMonthlySalary,
        0 as HourlyRate,
        NULL as SalaryLastChangedDate,
        NULL as SalaryLastChangedFrom,
        NULL as HourlyLastChangedDate,
        NULL as HourlyLastChangedFrom
      FROM [hrm].[Employee] e
      JOIN [recruit].[Candidate] c ON e.CandidateId = c.CandidateId
      LEFT JOIN [recruit].[CandidateIdentity] ci ON ci.CandidateId = c.CandidateId AND ci.IdentityType = 'Email' AND ci.IsPrimary = 1
      WHERE e.EmployeeId = @id
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const payrollInfo = result.recordset[0];
    
    res.json({
      success: true,
      data: {
        employee: {
          id: payrollInfo.Id,
          employeeId: payrollInfo.EmployeeId,
          name: payrollInfo.Name,
          email: payrollInfo.Email
        },
        payrollInfo: {
          payType: payrollInfo.PayType || 'Hourly',
          basisOfPay: payrollInfo.BasisOfPay || 'Same as Pay Type',
          paySchedule: payrollInfo.PaySchedule || 'Monthly',
          seasonalEmployee: payrollInfo.SeasonalEmployee || 'No',
          ownerOfficer: payrollInfo.OwnerOfficer || 'No',
          semiMonthlySalary: payrollInfo.SemiMonthlySalary || 0,
          hourlyRate: payrollInfo.HourlyRate || 0,
          salaryHistory: {
            lastChangedDate: payrollInfo.SalaryLastChangedDate,
            lastChangedFrom: payrollInfo.SalaryLastChangedFrom
          },
          hourlyHistory: {
            lastChangedDate: payrollInfo.HourlyLastChangedDate,
            lastChangedFrom: payrollInfo.HourlyLastChangedFrom
          }
        }
      }
    });
  } catch (error) {
    console.error('Get payroll info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payroll information',
      error: error.message
    });
  }
},

// UPDATE employee payroll info
updateEmployeePayrollInfo: async (req, res) => {
  try {
    const { companyId, employeeId } = req.params;
    const {
      payType,
      basisOfPay,
      paySchedule,
      seasonalEmployee,
      ownerOfficer,
      semiMonthlySalary,
      hourlyRate
    } = req.body;

    console.log('=== UPDATE EMPLOYEE PAYROLL INFO ===');
    console.log('Company ID:', companyId);
    console.log('Employee ID:', employeeId);
    console.log('New payroll data:', req.body);

    const pool = await poolPromise;
    const tableName = getEmployeeTable(companyId);

    const employeeIdInt = parseInt(employeeId, 10);
    if (isNaN(employeeIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Employee ID format' 
      });
    }

    // Get current employee to check salary changes
    const checkRequest = new sql.Request(pool);
    checkRequest.input('id', sql.Int, employeeIdInt);
    const checkResult = await checkRequest.query(`
      SELECT SemiMonthlySalary, HourlyRate FROM ${tableName} WHERE Id = @id
    `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const currentEmployee = checkResult.recordset[0];
    const salaryChanged = semiMonthlySalary && currentEmployee.SemiMonthlySalary !== semiMonthlySalary;
    const hourlyChanged = hourlyRate && currentEmployee.HourlyRate !== hourlyRate;

    // Prepare update query
    const request = new sql.Request(pool);
    request.input('id', sql.Int, employeeIdInt);
    request.input('payType', sql.NVarChar, payType || 'Hourly');
    request.input('basisOfPay', sql.NVarChar, basisOfPay || 'Same as Pay Type');
    request.input('paySchedule', sql.NVarChar, paySchedule || 'Monthly');
    request.input('seasonalEmployee', sql.NVarChar, seasonalEmployee || 'No');
    request.input('ownerOfficer', sql.NVarChar, ownerOfficer || 'No');
    request.input('semiMonthlySalary', sql.Float, semiMonthlySalary || 0);
    request.input('hourlyRate', sql.Float, hourlyRate || 0);
    request.input('updatedAt', sql.DateTime, new Date());

    let updateQuery = `
      UPDATE ${tableName}
      SET PayType = @payType,
          BasisOfPay = @basisOfPay,
          PaySchedule = @paySchedule,
          SeasonalEmployee = @seasonalEmployee,
          OwnerOfficer = @ownerOfficer,
          SemiMonthlySalary = @semiMonthlySalary,
          HourlyRate = @hourlyRate,
          UpdatedAt = @updatedAt
    `;

    // Add salary change tracking
    if (salaryChanged) {
      request.input('salaryLastChangedFrom', sql.Float, currentEmployee.SemiMonthlySalary);
      request.input('salaryLastChangedDate', sql.DateTime, new Date());
      updateQuery += `,
        SalaryLastChangedDate = @salaryLastChangedDate,
        SalaryLastChangedFrom = @salaryLastChangedFrom
      `;
      console.log(`✅ Salary changed from ${currentEmployee.SemiMonthlySalary} to ${semiMonthlySalary}`);
    }

    // Add hourly change tracking
    if (hourlyChanged) {
      request.input('hourlyLastChangedFrom', sql.Float, currentEmployee.HourlyRate);
      request.input('hourlyLastChangedDate', sql.DateTime, new Date());
      updateQuery += `,
        HourlyLastChangedDate = @hourlyLastChangedDate,
        HourlyLastChangedFrom = @hourlyLastChangedFrom
      `;
      console.log(`✅ Hourly rate changed from ${currentEmployee.HourlyRate} to ${hourlyRate}`);
    }

    updateQuery += ` WHERE Id = @id`;

    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or no changes made'
      });
    }

    // Fetch updated employee
    const getRequest = new sql.Request(pool);
    getRequest.input('id', sql.Int, employeeIdInt);
    const getResult = await getRequest.query(`
      SELECT 
        Id,
        EmployeeId,
        Name,
        Email,
        PayType,
        BasisOfPay,
        PaySchedule,
        SeasonalEmployee,
        OwnerOfficer,
        SemiMonthlySalary,
        HourlyRate,
        SalaryLastChangedDate,
        SalaryLastChangedFrom,
        HourlyLastChangedDate,
        HourlyLastChangedFrom
      FROM ${tableName} 
      WHERE Id = @id
    `);

    const updatedEmployee = getResult.recordset[0];

    res.json({
      success: true,
      message: 'Payroll information updated successfully',
      data: {
        employee: {
          id: updatedEmployee.Id,
          employeeId: updatedEmployee.EmployeeId,
          name: updatedEmployee.Name,
          email: updatedEmployee.Email
        },
        payrollInfo: {
          payType: updatedEmployee.PayType,
          basisOfPay: updatedEmployee.BasisOfPay,
          paySchedule: updatedEmployee.PaySchedule,
          seasonalEmployee: updatedEmployee.SeasonalEmployee,
          ownerOfficer: updatedEmployee.OwnerOfficer,
          semiMonthlySalary: updatedEmployee.SemiMonthlySalary,
          hourlyRate: updatedEmployee.HourlyRate,
          salaryHistory: {
            lastChangedDate: updatedEmployee.SalaryLastChangedDate,
            lastChangedFrom: updatedEmployee.SalaryLastChangedFrom
          },
          hourlyHistory: {
            lastChangedDate: updatedEmployee.HourlyLastChangedDate,
            lastChangedFrom: updatedEmployee.HourlyLastChangedFrom
          }
        }
      }
    });
  } catch (error) {
    console.error('Update payroll info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payroll information',
      error: error.message
    });
  }
},

// GET employee pay structure with calculations
getEmployeePayStructureData: async (req, res) => {
  try {
    const { companyId, employeeId } = req.params;
    
    const pool = await poolPromise;
    const tableName = getEmployeeTable(companyId);
    
    const employeeIdInt = parseInt(employeeId, 10);
    if (isNaN(employeeIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Employee ID format' 
      });
    }

    const request = new sql.Request(pool);
    request.input('id', sql.Int, employeeIdInt);
    
    const result = await request.query(`
      SELECT 
        SemiMonthlySalary,
        HourlyRate,
        PayType,
        PaySchedule
      FROM ${tableName} 
      WHERE Id = @id
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employee = result.recordset[0];
    
    // Calculate values based on semi-monthly salary or hourly rate
    const semiMonthlySalary = employee.SemiMonthlySalary || 0;
    const hourlyRate = employee.HourlyRate || 0;
    
    // Annual calculations
    const annualSalary = semiMonthlySalary * 24;
    const biweeklyAmount = annualSalary / 26;
    const monthlyAmount = annualSalary / 12;
    
    res.json({
      success: true,
      data: {
        payrollRates: {
          payType: employee.PayType,
          paySchedule: employee.PaySchedule,
          semiMonthlySalary: semiMonthlySalary,
          hourlyRate: hourlyRate
        },
        calculations: {
          annualSalary: annualSalary,
          monthlyAmount: monthlyAmount,
          biweeklyAmount: biweeklyAmount,
          weeklyAmount: annualSalary / 52,
          dailyAmount: annualSalary / 260,
          biweeklyHours: 80,
          biweeklyPayFromSalary: biweeklyAmount
        }
      }
    });
  } catch (error) {
    console.error('Get pay structure data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pay structure data',
      error: error.message
    });
  }
}
};

employeeController.uploadPayrollStatementFile = uploadPayrollStatementFile;
employeeController.sendEmailViaSendGrid = sendEmailViaSendGrid;
employeeController.sendTimesheetRejectionEmail = sendTimesheetRejectionEmail;
employeeController.sendTimesheetApprovalEmail = sendTimesheetApprovalEmail;

module.exports = employeeController;