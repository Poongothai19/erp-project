// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const path = require("path");
// const fs = require("fs");
// const { poolPromise, sql } = require("./config/db");

// const app = express();
// const timesheetRoutes = require('./Accounts/routes/timesheetRoutes');

// // ✅ FIXED CORS CONFIGURATION - Allow specific origin, not wildcard
// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
//     const allowedOrigins = [
//       'http://localhost:218',
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'http://127.0.0.1:218',
//       'http://127.0.0.1:3000',
//       'https://prophechyerp.duckdns.org',  // ADD THIS
//       'https://hub.prophecytechs.com',      // ADD THIS
//       'https://devprophecyerp.com'
//     ];

//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       console.log('❌ Origin not allowed by CORS:', origin);
//       callback(null, true); // Still allow it but log it
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   credentials: true, // Allow credentials (cookies, authorization headers)
//   allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//   exposedHeaders: ["Content-Length", "X-JSON"],
//   maxAge: 86400, // Cache preflight response for 24 hours
//   preflightContinue: false,
//   optionsSuccessStatus: 204 
// };

// app.use(cors(corsOptions));

// // ✅ Handle preflight requests explicitly
// app.options('*', cors(corsOptions));

// // ✅ CRITICAL: Handle track-logout BEFORE body-parser
// // This allows us to read raw body for beacon requests
// app.use('/api/auth/track-logout', express.text({ type: 'application/json', limit: '10mb' }));

// // ✅ Body Parsers (after special route handling)
// app.use(express.json({ limit: '50mb' }));
// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// // ✅ FIXED: Ensure upload directory exists
// const uploadsDir = path.join(__dirname, 'uploads', 'resumes');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
//   console.log('📁 Created uploads directory:', uploadsDir);
// }

// // ✅ Static file serving for resumes
// app.use('/uploads/resumes', (req, res, next) => {
//   console.log('📄 Static file request:', req.path);
//   next();
// }, express.static(uploadsDir, {
//   setHeaders: (res, filePath, stat) => {
//     const ext = path.extname(filePath).toLowerCase();

//     if (ext === '.pdf') {
//       res.set('Content-Type', 'application/pdf');
//     } else if (ext === '.doc') {
//       res.set('Content-Type', 'application/msword');
//     } else if (ext === '.docx') {
//       res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
//     }

//     res.set('Content-Disposition', 'inline');
//     res.set('Cache-Control', 'no-cache');
//   }
// }));

// // ✅ Static file serving for company logos
// const companyLogosDir = path.join(__dirname, 'uploads', 'company-logos');
// if (!fs.existsSync(companyLogosDir)) {
//   fs.mkdirSync(companyLogosDir, { recursive: true });
//   console.log('📁 Created company logos directory:', companyLogosDir);
// }

// app.use('/uploads/company-logos', (req, res, next) => {
//   console.log('🖼️  Logo file request:', req.path);
//   next();
// }, express.static(companyLogosDir, {
//   setHeaders: (res, filePath, stat) => {
//     const ext = path.extname(filePath).toLowerCase();

//     if (ext === '.png') {
//       res.set('Content-Type', 'image/png');
//     } else if (ext === '.jpg' || ext === '.jpeg') {
//       res.set('Content-Type', 'image/jpeg');
//     } else if (ext === '.gif') {
//       res.set('Content-Type', 'image/gif');
//     } else if (ext === '.webp') {
//       res.set('Content-Type', 'image/webp');
//     }

//     res.set('Content-Disposition', 'inline');
//     res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
//   }
// }));

// // ✅ Additional static routes
// app.use("/api/resume-uploads", express.static(path.join(__dirname, "Resume-Submission", "uploads")));

// // ✅ API Routes
// app.use("/api/auth", require("./Recruitment/routes/AuthRoutes"));
// app.use("/api/recruitment/roles", require("./erprecruitment/routes/recruitmentRoutes"));
// app.use("/api/recruitment", require("./erprecruitment/routes/recruitmentRoutesPublic"));
// app.use("/api/recruitment/recruiters", require("./erprecruitment/routes/recruiterRoutes"));
// app.use("/api/recruitment/applications", require("./erprecruitment/routes/applicationRoutes"));
// app.use("/api/resumes", require("./Resume-Submission/routes/resumeRoutes"));
// app.use("/api/users", require("./erprecruitment/routes/userRoutes"));
// app.use("/api/dashboard", require("./Bench_Sales/routes/dashboardRoutes"));
// app.use("/api/candidates", require("./Bench_Sales/routes/candidateRoutes"));

// // ✅ ADDED: LinkedIn Routes
// app.use("/api/linkedin", require("./erprecruitment/routes/linkedin"));
// // app.use("/api/vendor-management", require("./erprecruitment/routes/vendorManagementRoutes"));
// try {
//   const requirementRoutes = require("./Bench_Sales/routes/requirementRoutes");
//   app.use("/api/requirements", requirementRoutes);
// } catch (error) {
//   console.error('Error loading requirement routes:', error.message);
// }

// app.use("/api/submissions", require("./Bench_Sales/routes/submissionRoutes"));
// app.use('/api/external-submissions', require('./Bench_Sales/routes/externalSubmissionRoutes'));
// app.use("/api/vendors", require("./Bench_Sales/routes/vendorRoutes"));
// app.use("/api/hotlist", require("./Bench_Sales/routes/hotlistRoutes"));

// // app.use('/api/msa', require('./MSA/routes/msaRoutes'));
// // ===================================================
// // COMPANIES ROUTES (NEW)
// // ===================================================
// console.log('🏢 Registering Companies Routes...');
// try {
//   const companyRoutes = require("./companies/routes/companyRoutes");
//   app.use("/api/companies", companyRoutes);
//   console.log('✅ Company routes registered at /api/companies');
// } catch (error) {
//   console.error('❌ Error loading company routes:', error.message);
//   app.use("/api/companies", (req, res) => {
//     res.status(500).json({
//       success: false,
//       message: "Company routes not configured properly",
//       error: error.message
//     });
//   });
// }

// // ===================================================
// // EMPLOYEE ROUTES (NEW)
// // ===================================================
// console.log('👔 Registering Employee Routes...');
// try {
//   const employeeRoutes = require("./companies/routes/employeeRoutes");
//   app.use("/api/employees", employeeRoutes);
//   console.log('✅ Employee routes registered at /api/employees');
// } catch (error) {
//   console.error('❌ Error loading employee routes:', error.message);
//   app.use("/api/employees", (req, res) => {
//     res.status(500).json({
//       success: false,
//       message: "Employee routes not configured properly",
//       error: error.message
//     });
//   });
// }

// // ✅ ADDED: Onboarding Routes
// console.log('📋 Registering Onboarding Routes...');
// try {
//   // Changed from erprecruitment to Accounts
//   const onboardingRoutes = require("./Accounts/routes/onboardingRoutes");
//   app.use("/api/onboarding", onboardingRoutes);
//   console.log('✅ Onboarding routes registered at /api/onboarding');
//   console.log('   ✓ GET    /');
//   console.log('   ✓ GET    /my-submissions');
//   console.log('   ✓ GET    /:id');
//   console.log('   ✓ POST   /');
//   console.log('   ✓ PUT    /:id');
//   console.log('   ✓ DELETE /:id');
//   console.log('   ✓ PATCH  /:id/status');
//   console.log('   ✓ GET    /stats\n');
// } catch (error) {
//   console.error('❌ Error loading onboarding routes:', error.message);
//   app.use("/api/onboarding", (req, res) => {
//     res.status(500).json({
//       success: false,
//       message: "Onboarding routes not configured properly",
//       error: error.message
//     });
//   });
// }

// // ===================================================
// // TIMESHEET ROUTES - CRITICAL: ORDER MATTERS!
// // PERMISSION ROUTES MUST BE REGISTERED FIRST!!!
// // ===================================================
// console.log('⏰ Registering Timesheet Routes...');
// console.log('   📌 Route order is CRITICAL for proper routing!\n');

// // 0️⃣ PERMISSION ROUTES (MUST BE FIRST - BEFORE ALL OTHER TIMESHEET ROUTES)
// // This MUST be registered FIRST because /check-editing-permission 
// // needs to match before /:id patterns
// console.log('🔐 Registering Timesheet Permission Routes FIRST...');
// try {
//   const timesheetPermissionRoutes = require("./companies/routes/timesheetPermissionRoutes");
//   app.use("/api/timesheets", timesheetPermissionRoutes);
//   console.log('✅ Timesheet permission routes registered at /api/timesheets');
//   console.log('   ✓ GET  /check-editing-permission');
//   console.log('   ✓ POST /grant-editing-permission');
//   console.log('   ✓ GET  /employee-permission/:employeeId\n');
// } catch (error) {
//   console.error('❌ Error loading timesheet permission routes:', error.message);
//   console.error('   Stack:', error.stack);
// }

// // 2️⃣ MANAGER Timesheet Routes (MUST BE SECOND)
// // Handles: /api/timesheets/company/:companyId/..., /api/timesheets/all/pending
// console.log('👨‍💼 Registering Manager Timesheet Routes...');
// try {
//   const managerTimesheetRoutes = require("./companies/routes/managerTimesheet");
//   app.use("/api/timesheets", managerTimesheetRoutes);
//   console.log('✅ Manager timesheet routes registered at /api/timesheets');
//   console.log('   ✓ GET  /all/pending');
//   console.log('   ✓ GET  /company/:companyId/*');
//   console.log('   ✓ POST /bulk/approve');
//   console.log('   ✓ POST /bulk/reject\n');
// } catch (error) {
//   console.error('❌ Error loading manager timesheet routes:', error.message);
//   console.error('   Stack:', error.stack);
// }

// // 3️⃣ USER Timesheet Routes (MUST BE THIRD)
// // Handles: /api/timesheets/internal, /api/timesheets/external, etc.
// console.log('👤 Registering User Timesheet Routes...');
// try {
//   app.use("/api/timesheets", timesheetRoutes);
//   console.log('✅ User timesheet routes registered at /api/timesheets');
//   console.log('   ✓ POST /internal');
//   console.log('   ✓ POST /external');
//   console.log('   ✓ GET  /history\n');
// } catch (error) {
//   console.error('❌ Error loading user timesheet routes:', error.message);
//   console.error('   Stack:', error.stack);
//   app.use("/api/timesheets", (req, res, next) => {
//     if (req.path === '/internal' || req.path === '/external' || req.path === '/history') {
//       return res.status(500).json({
//         success: false,
//         message: "User timesheet routes not configured properly",
//         error: error.message
//       });
//     }
//     next();
//   });
// }

// console.log('🤝 Registering C2C Contractor Routes...');
// try {
//   const c2cRoutes = require("./companies/routes/c2cRoutes");
//   app.use("/api/c2c", c2cRoutes);
//   console.log('✅ C2C contractor routes registered at /api/c2c');
//   console.log('   ✓ POST   /company/:companyId');
//   console.log('   ✓ GET    /company/:companyId');
//   console.log('   ✓ GET    /company/:companyId/stats');
//   console.log('   ✓ GET    /company/:companyId/:contractorId');
//   console.log('   ✓ PUT    /company/:companyId/:contractorId');
//   console.log('   ✓ DELETE /company/:companyId/:contractorId\n');
// } catch (error) {
//   console.error('❌ Error loading C2C contractor routes:', error.message);
//   app.use("/api/c2c", (req, res) => {
//     res.status(500).json({
//       success: false,
//       message: "C2C contractor routes not configured properly",
//       error: error.message
//     });
//   });
// }

// // ===================================
// // ✅ ERP Invoice Module (UNIQUE)
// // ===================================
// console.log('🧾 Registering ERP Invoice Module Routes...');
// try {
//   const erpInvoiceRoutes = require("./InvoiceModule/routes/erpInvoiceRoutes");
//   app.use("/api/erp-invoices", erpInvoiceRoutes);
//   console.log('✅ ERP Invoice module routes registered at /api/erp-invoices');
// } catch (error) {
//   console.error('❌ Error loading ERP invoice module routes:', error.message);
// }


// // ===================================================
// // INVOICE ROUTES (NEW)
// // ===================================================
// console.log('🧾 Registering Invoice Routes...');
// try {
//   const invoiceRoutes = require("./companies/routes/invoiceRoutes");
//   app.use("/api/invoices", invoiceRoutes);
//   console.log('✅ Invoice routes registered at /api/invoices');
//   console.log('   ✓ POST   /company/:companyId');
//   console.log('   ✓ GET    /company/:companyId');
//   console.log('   ✓ GET    /company/:companyId/stats');
//   console.log('   ✓ GET    /company/:companyId/:invoiceId');
//   console.log('   ✓ PUT    /company/:companyId/:invoiceId');
//   console.log('   ✓ PATCH  /company/:companyId/:invoiceId/status');
//   console.log('   ✓ DELETE /company/:companyId/:invoiceId\n');
// } catch (error) {
//   console.error('❌ Error loading invoice routes:', error.message);
//   app.use("/api/invoices", (req, res) => {
//     res.status(500).json({
//       success: false,
//       message: "Invoice routes not configured properly",
//       error: error.message
//     });
//   });
// }

// console.log('📊 Registering Accounts Routes...');
// try {
//   const accountsRoutes = require("./Accounts/routes/accountsRoutes");
//   app.use("/api/accounts", accountsRoutes);
//   console.log('✅ Accounts routes registered at /api/accounts');
//   console.log('   ✓ GET  /my-details');
//   console.log('   ✓ GET  /my-statements');
//   console.log('   ✓ GET  /my-reports\n');
// } catch (error) {
//   console.error('❌ Error loading accounts routes:', error.message);
//   app.use("/api/accounts", (req, res) => {
//     res.status(500).json({
//       success: false,
//       message: "Accounts routes not configured properly",
//       error: error.message
//     });
//   });
// }

// // 📊 Accounts Routes
// console.log('📊 Registering Accounts Routes...');

// app.use('/uploads/timesheets', express.static(path.join(__dirname, 'uploads', 'timesheets')));

// // ===================================================
// // ✅ H1B ROUTES - ADMIN ONLY (NEW - CRITICAL!)
// // ===================================================

// console.log('📋 Registering H1B Routes...');
// try {
//   const h1bRoutes = require("./H1B/routes/h1bRoutes");
//   app.use("/api/h1b", h1bRoutes);
//   console.log('✅ H1B routes registered at /api/h1b');
//   console.log('   ✓ POST   /upload (PUBLIC)');
//   console.log('   ✓ POST   /submissions (PUBLIC)');
//   console.log('   ✓ GET    /submissions (NO AUTH)');
//   console.log('   ✓ GET    /submissions/:id (NO AUTH)');
//   console.log('   ✓ PUT    /submissions/:id (NO AUTH)');
//   console.log('   ✓ GET    /statistics (NO AUTH)\n');
// } catch (error) {
//   console.error('❌ Error loading H1B routes:', error.message);
//   console.error('Stack:', error.stack);
//   app.use("/api/h1b", (req, res) => {
//     res.status(500).json({
//       success: false,
//       message: "H1B routes not configured properly",
//       error: error.message
//     });
//   });
// }

// // ✅ Debug routes
// app.get('/api/debug/uploads', (req, res) => {
//   try {
//     const files = fs.readdirSync(uploadsDir);
//     res.json({
//       directory: uploadsDir,
//       files: files,
//       count: files.length
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Cannot read upload directory',
//       directory: uploadsDir,
//       message: error.message
//     });
//   }
// });



// // ===================================================
// // ATS ROUTES (APPLICANT TRACKING SYSTEM) - NEW
// // ===================================================
// console.log('📋 Registering ATS Routes...');
// try {
//   // CORRECT PATH: ATS folder is at BackEnd root, not in Recruitment
//   const atsRoutes = require("./ATS/routes/atsRoutes");
//   app.use("/api/ats", atsRoutes);
//   console.log('✅ ATS routes registered at /api/ats');
//   console.log('   ✓ POST   /apply (public - candidate form submission)');
//   console.log('   ✓ GET    /applicants (protected - get all applicants)');
//   console.log('   ✓ GET    /applicants/:id (protected)');
//   console.log('   ✓ GET    /position/:position (protected)');
//   console.log('   ✓ GET    /download-resume/:id (protected)');
//   console.log('   ✓ GET    /statistics/dashboard (protected)');
//   console.log('   ✓ PUT    /applicants/:id (protected)');
//   console.log('   ✓ DELETE /applicants/:id (protected)\n');
// } catch (error) {
//   console.error('❌ Error loading ATS routes:', error.message);
//   console.error('Stack:', error.stack);
//   app.use("/api/ats", (req, res) => {
//     res.status(500).json({
//       success: false,
//       message: "ATS routes not configured properly",
//       error: error.message
//     });
//   });
// }

// // ✅ Debug endpoint for logos
// app.get('/api/debug/logos', (req, res) => {
//   try {
//     const files = fs.readdirSync(companyLogosDir);
//     res.json({
//       directory: companyLogosDir,
//       files: files,
//       count: files.length,
//       accessUrl: 'http://localhost:5000/uploads/company-logos/'
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Cannot read company logos directory',
//       directory: companyLogosDir,
//       message: error.message
//     });
//   }
// });

// const multer = require('multer');
// const uploadTest = multer({ storage: multer.memoryStorage() });

// // Test S3 Connection
// app.get('/api/test-s3', async (req, res) => {
//   try {
//     const AWS = require('aws-sdk');
//     const s3 = new AWS.S3({
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//       region: process.env.AWS_REGION
//     });

//     // Test connection
//     await s3.headBucket({ Bucket: process.env.AWS_BUCKET_NAME }).promise();

//     // List files in bucket
//     const files = await s3.listObjectsV2({ 
//       Bucket: process.env.AWS_BUCKET_NAME,
//       MaxKeys: 10 
//     }).promise();

//     res.json({ 
//       success: true, 
//       message: '✅ S3 Connection Successful!',
//       bucket: process.env.AWS_BUCKET_NAME,
//       region: process.env.AWS_REGION,
//       fileCount: files.Contents ? files.Contents.length : 0,
//       files: files.Contents || []
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: '❌ S3 Connection Failed',
//       error: error.message,
//       details: error.code
//     });
//   }
// });

// // Test S3 Upload
// app.post('/api/test-s3-upload', uploadTest.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const { uploadFile } = require('./config/s3');
//     const fileUrl = await uploadFile(req.file, 'test');

//     res.json({ 
//       success: true, 
//       message: '✅ File uploaded to S3!',
//       url: fileUrl 
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       error: error.message 
//     });
//   }
// });

// // ✅ Route Debugging Endpoint (Development Only)
// if (process.env.NODE_ENV !== 'production') {
//   app.get("/api/debug/routes", (req, res) => {
//     const routes = [];
//     app._router.stack.forEach((middleware) => {
//       if (middleware.route) {
//         routes.push({
//           path: middleware.route.path,
//           methods: Object.keys(middleware.route.methods)
//         });
//       } else if (middleware.name === 'router') {
//         middleware.handle.stack.forEach((handler) => {
//           if (handler.route) {
//             const path = middleware.regexp.source
//               .replace('\\/?', '')
//               .replace('(?=\\/|$)', '')
//               .replace(/\\\//g, '/');
//             routes.push({
//               path: path + handler.route.path,
//               methods: Object.keys(handler.route.methods)
//             });
//           }
//         });
//       }
//     });
//     res.json({ routes });
//   });
// }

// // ===================================================
// // ENHANCED ERROR HANDLER
// // ===================================================
// app.use((err, req, res, next) => {
//   console.error('\n❌ ERROR CAUGHT:');
//   console.error('Time:', new Date().toISOString());
//   console.error('Path:', req.path);
//   console.error('Method:', req.method);
//   console.error('Error:', err.message);
//   console.error('Stack:', err.stack);

//   res.status(err.status || 500).json({
//     error: {
//       message: err.message || "Internal Server Error",
//       status: err.status || 500,
//       path: req.path,
//       timestamp: new Date().toISOString()
//     }
//   });
// });

// // ===================================================
// // IMPROVED 404 HANDLER FOR API ROUTES
// // ===================================================
// app.use("/api/*", (req, res) => {
//   console.warn(`⚠️  404 Not Found: ${req.method} ${req.originalUrl}`);
//   res.status(404).json({
//     error: {
//       message: "API endpoint not found",
//       endpoint: req.originalUrl,
//       method: req.method,
//       timestamp: new Date().toISOString()
//     }
//   });
// });

// // ===================================================
// // ✅ DYNAMIC SEO FOR JOB ROLES
// // ===================================================
// // LinkedIn crawler doesn't execute JavaScript, 
// // so we need to inject meta tags into index.html on the server side
// app.get("/job/:jobId", async (req, res, next) => {
//   const { jobId } = req.params;

//   // Skip if it's an API request or static file (this shouldn't happen with the route pattern)
//   if (req.path.includes('/api/')) return next();

//   try {
//     const pool = await poolPromise;
//     const result = await pool.request()
//       .input("id", sql.Int, jobId)
//       .query(`
//         SELECT role, location, roleLocation, jobDescription
//         FROM RecruitmentRoles 
//         WHERE id = @id
//       `);

//     if (result.recordset.length > 0) {
//       const job = result.recordset[0];

//       // Try to find the production index.html
//       const possibleIndexPaths = [
//         path.join(__dirname, "../client/build", "index.html"),
//         path.join(__dirname, "../FrontEnd/my-app/build", "index.html"),
//         path.join(__dirname, "client/build", "index.html")
//       ];

//       let indexPath = possibleIndexPaths.find(p => fs.existsSync(p));

//       if (indexPath) {
//         let htmlContent = fs.readFileSync(indexPath, "utf8");

//         const title = `Position: ${job.role || 'Job Opportunity'}`;
//         const location = job.location || 'Multiple Locations';
//         const workMode = job.roleLocation || 'Onsite';
//         const description = `Location: ${location} | Work Mode: ${workMode}`;

//         // Dynamically determine the base URL for the logo
//         const protocol = req.protocol === 'https' || req.get('X-Forwarded-Proto') === 'https' ? 'https' : 'http';
//         const host = req.get('host');
//         const baseUrl = `${protocol}://${host}`;

//         const logoUrl = `${baseUrl}/logo192.png`;
//         const jobUrl = `${baseUrl}/job/${jobId}`;

//         // Define dynamic meta tags
//         const metaTags = `
//           <title>${title}</title>
//           <meta name="description" content="${description}" />
//           <meta property="og:title" content="${title}" />
//           <meta property="og:description" content="${description}" />
//           <meta property="og:image" content="${logoUrl}" />
//           <meta property="og:image:secure_url" content="${logoUrl}" />
//           <meta property="og:image:type" content="image/png" />
//           <meta property="og:url" content="${jobUrl}" />
//           <meta property="og:type" content="website" />
//           <meta property="og:site_name" content="Prophecy Technologies" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="${title}" />
//           <meta name="twitter:description" content="${description}" />
//           <meta name="twitter:image" content="${logoUrl}" />
//         `;

//         // Inject tags into index.html: replace <title> or insert before </head>
//         if (htmlContent.includes('<title>')) {
//           htmlContent = htmlContent.replace(/<title>.*?<\/title>/, metaTags);
//         } else {
//           htmlContent = htmlContent.replace('</head>', `${metaTags}\n</head>`);
//         }

//         console.log(`🚀 Serving dynamic SEO for job ID ${jobId}: ${title}`);
//         return res.send(htmlContent);
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error serving dynamic SEO:", error.message);
//   }

//   // Continue to standard static serving if anything fails
//   next();
// });

// // ===================================================
// // STATIC FILES FOR PRODUCTION
// // ===================================================
// if (process.env.NODE_ENV === "production") {
//   // Use a more robust check for path
//   const buildPath = fs.existsSync(path.join(__dirname, "../client/build")) 
//     ? path.join(__dirname, "../client/build")
//     : path.join(__dirname, "../FrontEnd/my-app/build");

//   app.use(express.static(buildPath));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(buildPath, "index.html"));
//   });
// }

// // ===================================================
// // START SERVER
// // ===================================================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
//   console.log(`📁 Resume files served at: http://localhost:${PORT}/uploads/resumes/`);
//   console.log(`📂 Upload directory: ${uploadsDir}`);
//   console.log(`🔒 CORS enabled for: http://localhost:218`);
//   console.log(`🔒 Session tracking enabled with beacon support`);
//   console.log(`🔗 LinkedIn routes enabled at: /api/linkedin`);
//   console.log(`📋 H1B routes enabled at: /api/h1b (Admin only)`);

//   try {
//     const files = fs.readdirSync(uploadsDir);
//     console.log(`📋 Found ${files.length} existing files`);
//   } catch (error) {
//     console.log('⚠️ Could not read upload directory:', error.message);
//   }
// });


require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { poolPromise, sql } = require("./config/db");

const app = express();
const timesheetRoutes = require('./Accounts/routes/timesheetRoutes');

// ✅ FIXED CORS CONFIGURATION - Allow specific origin, not wildcard
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    const allowedOrigins = [
      'http://localhost:218',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:218',
      'http://127.0.0.1:3000',
      'https://prophechyerp.duckdns.org',  // ADD THIS
      'https://hub.prophecytechs.com',      // ADD THIS
      'https://devprophecyerp.com'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origin not allowed by CORS:', origin);
      callback(null, true); // Still allow it but log it
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true, // Allow credentials (cookies, authorization headers)
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Length", "X-JSON"],
  maxAge: 86400, // Cache preflight response for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));



// ✅ CRITICAL: Handle track-logout BEFORE body-parser
// This allows us to read raw body for beacon requests
app.use('/api/auth/track-logout', express.text({ type: 'application/json', limit: '10mb' }));

// ✅ Body Parsers (after special route handling)
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ✅ FIXED: Ensure upload directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// ✅ Static file serving for resumes
app.use('/uploads/resumes', (req, res, next) => {
  console.log('📄 Static file request:', req.path);
  next();
}, express.static(uploadsDir, {
  setHeaders: (res, filePath, stat) => {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      res.set('Content-Type', 'application/pdf');
    } else if (ext === '.doc') {
      res.set('Content-Type', 'application/msword');
    } else if (ext === '.docx') {
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }

    res.set('Content-Disposition', 'inline');
    res.set('Cache-Control', 'no-cache');
  }
}));

// ✅ Static file serving for company logos
const companyLogosDir = path.join(__dirname, 'uploads', 'company-logos');
if (!fs.existsSync(companyLogosDir)) {
  fs.mkdirSync(companyLogosDir, { recursive: true });
  console.log('📁 Created company logos directory:', companyLogosDir);
}

app.use('/uploads/company-logos', (req, res, next) => {
  console.log('🖼️  Logo file request:', req.path);
  next();
}, express.static(companyLogosDir, {
  setHeaders: (res, filePath, stat) => {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.png') {
      res.set('Content-Type', 'image/png');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.set('Content-Type', 'image/jpeg');
    } else if (ext === '.gif') {
      res.set('Content-Type', 'image/gif');
    } else if (ext === '.webp') {
      res.set('Content-Type', 'image/webp');
    }

    res.set('Content-Disposition', 'inline');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  }
}));

// ✅ Additional static routes
app.use("/api/resume-uploads", express.static(path.join(__dirname, "Resume-Submission", "uploads")));

// ✅ API Routes
app.use("/api/auth", require("./Recruitment/routes/AuthRoutes"));
app.use("/api/recruitment/roles", require("./erprecruitment/routes/recruitmentRoutes"));
app.use("/api/recruitment", require("./erprecruitment/routes/recruitmentRoutesPublic"));
app.use("/api/recruitment/recruiters", require("./erprecruitment/routes/recruiterRoutes"));
app.use("/api/recruitment/applications", require("./erprecruitment/routes/applicationRoutes"));
app.use("/api/resumes", require("./Resume-Submission/routes/resumeRoutes"));
app.use("/api/users", require("./erprecruitment/routes/userRoutes"));
app.use("/api/dashboard", require("./Bench_Sales/routes/dashboardRoutes"));
app.use("/api/candidates", require("./Bench_Sales/routes/candidateRoutes"));

// ✅ ADDED: LinkedIn Routes
app.use("/api/linkedin", require("./erprecruitment/routes/linkedin"));

// ✅ ADDED: Social Media Integrations Routes
app.use("/api/social", require("./erprecruitment/routes/socialMediaRoutes"));
// app.use("/api/vendor-management", require("./erprecruitment/routes/vendorManagementRoutes"));
try {
  const requirementRoutes = require("./Bench_Sales/routes/requirementRoutes");
  app.use("/api/requirements", requirementRoutes);
} catch (error) {
  console.error('Error loading requirement routes:', error.message);
}

app.use("/api/submissions", require("./Bench_Sales/routes/submissionRoutes"));
app.use('/api/external-submissions', require('./Bench_Sales/routes/externalSubmissionRoutes'));
app.use("/api/vendors", require("./Bench_Sales/routes/vendorRoutes"));
app.use("/api/hotlist", require("./Bench_Sales/routes/hotlistRoutes"));

app.use('/api/msa', require('./MSA/routes/msaRoutes'));
// ===================================================
// COMPANIES ROUTES (NEW)
// ===================================================
console.log('🏢 Registering Companies Routes...');
try {
  const companyRoutes = require("./companies/routes/companyRoutes");
  app.use("/api/companies", companyRoutes);
  console.log('✅ Company routes registered at /api/companies');
} catch (error) {
  console.error('❌ Error loading company routes:', error.message);
  app.use("/api/companies", (req, res) => {
    res.status(500).json({
      success: false,
      message: "Company routes not configured properly",
      error: error.message
    });
  });
}

// ===================================================
// EMPLOYEE ROUTES (NEW)
// ===================================================
console.log('👔 Registering Employee Routes...');
try {
  const employeeRoutes = require("./companies/routes/employeeRoutes");
  app.use("/api/employees", employeeRoutes);
  console.log('✅ Employee routes registered at /api/employees');
} catch (error) {
  console.error('❌ Error loading employee routes:', error.message);
  app.use("/api/employees", (req, res) => {
    res.status(500).json({
      success: false,
      message: "Employee routes not configured properly",
      error: error.message
    });
  });
}

// ✅ ADDED: Employee Document Routes (S3 Integration)
console.log('📂 Registering Employee Document Routes...');
try {
  const employeeDocumentRoutes = require("./companies/routes/employeeDocumentRoutes");
  app.use("/api/employee-documents", employeeDocumentRoutes);
  console.log('✅ Employee document routes registered at /api/employee-documents');
} catch (error) {
  console.error('❌ Error loading employee document routes:', error.message);
}

// ===================================================
// ✅ ONBOARDING MODULE ROUTES (NEW)
// ===================================================
try {
  app.use("/api/onboarding-companies", require("./onboarding-module/routes/onboardingCompanyRoutes"));
  app.use("/api/onboarding-employees", require("./onboarding-module/routes/onboardingEmployeeRoutes"));
  app.use("/api/onboarding-employers", require("./onboarding-module/routes/onboardingEmployerRoutes"));
  app.use("/api/onboarding-tracking", require("./onboarding-module/routes/onboardingTrackingRoutes"));
  app.use("/api/onboarding-workflow-employees", require("./onboarding-module/routes/onboardingWorkflowEmployeeRoutes"));
  app.use("/api/onboarding-workflow", require("./onboarding-workflow/routes/onboardingRoutes"));
} catch (error) {
  console.error('❌ Error loading onboarding module routes:', error.message);
}




// ===================================================
// TIMESHEET ROUTES - CRITICAL: ORDER MATTERS!
// PERMISSION ROUTES MUST BE REGISTERED FIRST!!!
// ===================================================
console.log('⏰ Registering Timesheet Routes...');
console.log('   📌 Route order is CRITICAL for proper routing!\n');

// 0️⃣ PERMISSION ROUTES (MUST BE FIRST - BEFORE ALL OTHER TIMESHEET ROUTES)
// This MUST be registered FIRST because /check-editing-permission 
// needs to match before /:id patterns
console.log('🔐 Registering Timesheet Permission Routes FIRST...');
try {
  const timesheetPermissionRoutes = require("./companies/routes/timesheetPermissionRoutes");
  app.use("/api/timesheets", timesheetPermissionRoutes);
  console.log('✅ Timesheet permission routes registered at /api/timesheets');
  console.log('   ✓ GET  /check-editing-permission');
  console.log('   ✓ POST /grant-editing-permission');
  console.log('   ✓ GET  /employee-permission/:employeeId\n');
} catch (error) {
  console.error('❌ Error loading timesheet permission routes:', error.message);
  console.error('   Stack:', error.stack);
}

// 2️⃣ MANAGER Timesheet Routes (MUST BE SECOND)
// Handles: /api/timesheets/company/:companyId/..., /api/timesheets/all/pending
console.log('👨‍💼 Registering Manager Timesheet Routes...');
try {
  const managerTimesheetRoutes = require("./companies/routes/managerTimesheet");
  app.use("/api/timesheets", managerTimesheetRoutes);
  console.log('✅ Manager timesheet routes registered at /api/timesheets');
  console.log('   ✓ GET  /all/pending');
  console.log('   ✓ GET  /company/:companyId/*');
  console.log('   ✓ POST /bulk/approve');
  console.log('   ✓ POST /bulk/reject\n');
} catch (error) {
  console.error('❌ Error loading manager timesheet routes:', error.message);
  console.error('   Stack:', error.stack);
}

// 3️⃣ USER Timesheet Routes (MUST BE THIRD)
// Handles: /api/timesheets/internal, /api/timesheets/external, etc.
console.log('👤 Registering User Timesheet Routes...');
try {
  app.use("/api/timesheets", timesheetRoutes);
  console.log('✅ User timesheet routes registered at /api/timesheets');
  console.log('   ✓ POST /internal');
  console.log('   ✓ POST /external');
  console.log('   ✓ GET  /history\n');
} catch (error) {
  console.error('❌ Error loading user timesheet routes:', error.message);
  console.error('   Stack:', error.stack);
  app.use("/api/timesheets", (req, res, next) => {
    if (req.path === '/internal' || req.path === '/external' || req.path === '/history') {
      return res.status(500).json({
        success: false,
        message: "User timesheet routes not configured properly",
        error: error.message
      });
    }
    next();
  });
}

console.log('🤝 Registering C2C Contractor Routes...');
try {
  const c2cRoutes = require("./companies/routes/c2cRoutes");
  app.use("/api/c2c", c2cRoutes);
  console.log('✅ C2C contractor routes registered at /api/c2c');
  console.log('   ✓ POST   /company/:companyId');
  console.log('   ✓ GET    /company/:companyId');
  console.log('   ✓ GET    /company/:companyId/stats');
  console.log('   ✓ GET    /company/:companyId/:contractorId');
  console.log('   ✓ PUT    /company/:companyId/:contractorId');
  console.log('   ✓ DELETE /company/:companyId/:contractorId\n');
} catch (error) {
  console.error('❌ Error loading C2C contractor routes:', error.message);
  app.use("/api/c2c", (req, res) => {
    res.status(500).json({
      success: false,
      message: "C2C contractor routes not configured properly",
      error: error.message
    });
  });
}


// ===================================
// ✅ ERP Invoice Module (UNIQUE)
// ===================================
console.log('🧾 Registering ERP Invoice Module Routes...');
try {
  const erpInvoiceRoutes = require("./InvoiceModule/routes/erpInvoiceRoutes");
  app.use("/api/erp-invoices", erpInvoiceRoutes);
  console.log('✅ ERP Invoice module routes registered at /api/erp-invoices');
} catch (error) {
  console.error('❌ Error loading ERP invoice module routes:', error.message);
}



// ===================================================
// INVOICE ROUTES (NEW)
// ===================================================
console.log('🧾 Registering Invoice Routes...');
try {
  const invoiceRoutes = require("./companies/routes/invoiceRoutes");
  app.use("/api/invoices", invoiceRoutes);
  console.log('✅ Invoice routes registered at /api/invoices');
  console.log('   ✓ POST   /company/:companyId');
  console.log('   ✓ GET    /company/:companyId');
  console.log('   ✓ GET    /company/:companyId/stats');
  console.log('   ✓ GET    /company/:companyId/:invoiceId');
  console.log('   ✓ PUT    /company/:companyId/:invoiceId');
  console.log('   ✓ PATCH  /company/:companyId/:invoiceId/status');
  console.log('   ✓ DELETE /company/:companyId/:invoiceId\n');
} catch (error) {
  console.error('❌ Error loading invoice routes:', error.message);
  app.use("/api/invoices", (req, res) => {
    res.status(500).json({
      success: false,
      message: "Invoice routes not configured properly",
      error: error.message
    });
  });
}

console.log('📊 Registering Accounts Routes...');
try {
  const accountsRoutes = require("./Accounts/routes/accountsRoutes");
  app.use("/api/accounts", accountsRoutes);
  console.log('✅ Accounts routes registered at /api/accounts');
  console.log('   ✓ GET  /my-details');
  console.log('   ✓ GET  /my-statements');
  console.log('   ✓ GET  /my-reports\n');
} catch (error) {
  console.error('❌ Error loading accounts routes:', error.message);
  app.use("/api/accounts", (req, res) => {
    res.status(500).json({
      success: false,
      message: "Accounts routes not configured properly",
      error: error.message
    });
  });
}

// 📊 Accounts Routes
console.log('📊 Registering Accounts Routes...');

app.use('/uploads/timesheets', express.static(path.join(__dirname, 'uploads', 'timesheets')));

// ===================================================
// ✅ H1B ROUTES - ADMIN ONLY (NEW - CRITICAL!)
// ===================================================

console.log('📋 Registering H1B Routes...');
try {
  const h1bRoutes = require("./H1B/routes/h1bRoutes");
  app.use("/api/h1b", h1bRoutes);
  console.log('✅ H1B routes registered at /api/h1b');
  console.log('   ✓ POST   /upload (PUBLIC)');
  console.log('   ✓ POST   /submissions (PUBLIC)');
  console.log('   ✓ GET    /submissions (NO AUTH)');
  console.log('   ✓ GET    /submissions/:id (NO AUTH)');
  console.log('   ✓ PUT    /submissions/:id (NO AUTH)');
  console.log('   ✓ GET    /statistics (NO AUTH)\n');
} catch (error) {
  console.error('❌ Error loading H1B routes:', error.message);
  console.error('Stack:', error.stack);
  app.use("/api/h1b", (req, res) => {
    res.status(500).json({
      success: false,
      message: "H1B routes not configured properly",
      error: error.message
    });
  });
}

// ✅ Debug routes
app.get('/api/debug/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({
      directory: uploadsDir,
      files: files,
      count: files.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cannot read upload directory',
      directory: uploadsDir,
      message: error.message
    });
  }
});



// ===================================================
// ATS ROUTES (APPLICANT TRACKING SYSTEM) - NEW
// ===================================================
console.log('📋 Registering ATS Routes...');
try {
  // CORRECT PATH: ATS folder is at BackEnd root, not in Recruitment
  const atsRoutes = require("./ATS/routes/atsRoutes");
  app.use("/api/ats", atsRoutes);
  console.log('✅ ATS routes registered at /api/ats');
  console.log('   ✓ POST   /apply (public - candidate form submission)');
  console.log('   ✓ GET    /applicants (protected - get all applicants)');
  console.log('   ✓ GET    /applicants/:id (protected)');
  console.log('   ✓ GET    /position/:position (protected)');
  console.log('   ✓ GET    /download-resume/:id (protected)');
  console.log('   ✓ GET    /statistics/dashboard (protected)');
  console.log('   ✓ PUT    /applicants/:id (protected)');
  console.log('   ✓ DELETE /applicants/:id (protected)\n');
} catch (error) {
  console.error('❌ Error loading ATS routes:', error.message);
  console.error('Stack:', error.stack);
  app.use("/api/ats", (req, res) => {
    res.status(500).json({
      success: false,
      message: "ATS routes not configured properly",
      error: error.message
    });
  });
}

// ✅ Debug endpoint for logos
app.get('/api/debug/logos', (req, res) => {
  try {
    const files = fs.readdirSync(companyLogosDir);
    res.json({
      directory: companyLogosDir,
      files: files,
      count: files.length,
      accessUrl: 'http://localhost:5000/uploads/company-logos/'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cannot read company logos directory',
      directory: companyLogosDir,
      message: error.message
    });
  }
});

const multer = require('multer');
const uploadTest = multer({ storage: multer.memoryStorage() });

// Test S3 Connection
app.get('/api/test-s3', async (req, res) => {
  try {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });

    // Test connection
    await s3.headBucket({ Bucket: process.env.AWS_BUCKET_NAME }).promise();

    // List files in bucket
    const files = await s3.listObjectsV2({
      Bucket: process.env.AWS_BUCKET_NAME,
      MaxKeys: 10
    }).promise();

    res.json({
      success: true,
      message: '✅ S3 Connection Successful!',
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
      fileCount: files.Contents ? files.Contents.length : 0,
      files: files.Contents || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ S3 Connection Failed',
      error: error.message,
      details: error.code
    });
  }
});

// Test S3 Upload
app.post('/api/test-s3-upload', uploadTest.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { uploadFile } = require('./config/s3');
    const fileUrl = await uploadFile(req.file, 'test');

    res.json({
      success: true,
      message: '✅ File uploaded to S3!',
      url: fileUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Route Debugging Endpoint (Development Only)
if (process.env.NODE_ENV !== 'production') {
  app.get("/api/debug/routes", (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            const path = middleware.regexp.source
              .replace('\\/?', '')
              .replace('(?=\\/|$)', '')
              .replace(/\\\//g, '/');
            routes.push({
              path: path + handler.route.path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });
    res.json({ routes });
  });
}

// ===================================================
// ENHANCED ERROR HANDLER
// ===================================================
app.use((err, req, res, next) => {
  console.error('\n❌ ERROR CAUGHT:');
  console.error('Time:', new Date().toISOString());
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      status: err.status || 500,
      path: req.path,
      timestamp: new Date().toISOString()
    }
  });
});

// ===================================================
// IMPROVED 404 HANDLER FOR API ROUTES
// ===================================================
app.use("/api/*", (req, res) => {
  console.warn(`⚠️  404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: {
      message: "API endpoint not found",
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
});

// ===================================================
// ✅ DYNAMIC SEO FOR JOB ROLES
// ===================================================
// LinkedIn crawler doesn't execute JavaScript, 
// so we need to inject meta tags into index.html on the server side
app.get("/job/:jobId", async (req, res, next) => {
  const { jobId } = req.params;

  // Skip if it's an API request or static file (this shouldn't happen with the route pattern)
  if (req.path.includes('/api/')) return next();

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, jobId)
      .query(`
        SELECT role, location, roleLocation, jobDescription
        FROM RecruitmentRoles 
        WHERE id = @id
      `);

    if (result.recordset.length > 0) {
      const job = result.recordset[0];

      // Try to find the production index.html
      const possibleIndexPaths = [
        path.join(__dirname, "../client/build", "index.html"),
        path.join(__dirname, "../FrontEnd/my-app/build", "index.html"),
        path.join(__dirname, "client/build", "index.html")
      ];

      let indexPath = possibleIndexPaths.find(p => fs.existsSync(p));

      if (indexPath) {
        let htmlContent = fs.readFileSync(indexPath, "utf8");

        const title = `Position: ${job.role || 'Job Opportunity'}`;
        const location = job.location || 'Multiple Locations';
        const workMode = job.roleLocation || 'Onsite';
        const description = `Location: ${location} | Work Mode: ${workMode}`;

        // Dynamically determine the base URL for the logo
        const protocol = req.protocol === 'https' || req.get('X-Forwarded-Proto') === 'https' ? 'https' : 'http';
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        const logoUrl = `${baseUrl}/logo192.png`;
        const jobUrl = `${baseUrl}/job/${jobId}`;

        // Define dynamic meta tags
        const metaTags = `
          <title>${title}</title>
          <meta name="description" content="${description}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${logoUrl}" />
          <meta property="og:image:secure_url" content="${logoUrl}" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:url" content="${jobUrl}" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Prophecy Technologies" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${logoUrl}" />
        `;

        // Inject tags into index.html: replace <title> or insert before </head>
        if (htmlContent.includes('<title>')) {
          htmlContent = htmlContent.replace(/<title>.*?<\/title>/, metaTags);
        } else {
          htmlContent = htmlContent.replace('</head>', `${metaTags}\n</head>`);
        }

        console.log(`🚀 Serving dynamic SEO for job ID ${jobId}: ${title}`);
        return res.send(htmlContent);
      }
    }
  } catch (error) {
    console.error("❌ Error serving dynamic SEO:", error.message);
  }

  // Continue to standard static serving if anything fails
  next();
});


// ===================================================
// STATIC FILES FOR PRODUCTION
// ===================================================
if (process.env.NODE_ENV === "production") {
  // Use a more robust check for path
  const buildPath = fs.existsSync(path.join(__dirname, "../client/build"))
    ? path.join(__dirname, "../client/build")
    : path.join(__dirname, "../FrontEnd/my-app/build");

  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// ===================================================
// START SERVER
// ===================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Resume files served at: http://localhost:${PORT}/uploads/resumes/`);
  console.log(`📂 Upload directory: ${uploadsDir}`);
  console.log(`🔒 CORS enabled for: http://localhost:218`);
  console.log(`🔒 Session tracking enabled with beacon support`);
  console.log(`🔗 LinkedIn routes enabled at: /api/linkedin`);
  console.log(`📋 H1B routes enabled at: /api/h1b (Admin only)`);

  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`📋 Found ${files.length} existing files`);
  } catch (error) {
    console.log('⚠️ Could not read upload directory:', error.message);
  }
});