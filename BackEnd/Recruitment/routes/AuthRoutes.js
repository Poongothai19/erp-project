






// // module.exports = router;
// const express = require("express");
// const { login, getCurrentUser } = require("../controllers/authController");
// const { authenticateToken } = require("../middleWare/authMiddleware");
// const { poolPromise, sql } = require("../../config/db");
// const bcrypt = require("bcrypt");
// const fs = require("fs");
// const path = require("path");
// const crypto = require("crypto");
// const https = require("https");

// const router = express.Router();
// const { 
//   trackLogin, 
//   trackLogout, 
//   getUserSessionHistory, 
//   getUserSessionStats,
//   getActiveSessions 
// } = require("../../erprecruitment/controllers/loginTrackingController");

// // ✅ CORRECT NORMALIZATION FUNCTION
// function normalizeEmailNotifications(value) {
//   if (value === null || value === undefined) {
//     return true;
//   }
//   if (value === 0 || value === false || value === '0' || value === 'false') {
//     return false;
//   }
//   return true;
// }

// // Get Frontend URL (same as Employee Controller)
// const getFrontendURL = () => {
//   if (process.env.FRONTEND_URL) {
//     return process.env.FRONTEND_URL;
//   }
//   // Fallback based on NODE_ENV
//   if (process.env.NODE_ENV === 'production') {
//     return 'https://prophechyerp.duckdns.org';
//   }
//   return 'http://localhost:3000';
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

// // ==================== LOGIN ROUTE - ENHANCED ====================
// router.post("/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       return res.status(400).json({ error: "Email/Username and password are required" });
//     }

//     const pool = await poolPromise;

//     // Query user by username OR email
//     const userResult = await pool
//       .request()
//       .input("username", sql.NVarChar, username.trim().toLowerCase())
//       .query(`
//         SELECT 
//           u.id,
//           u.username,
//           u.password,
//           u.role,
//           u.EmployeeId,
//           u.profile,
//           d.firstName,
//           d.lastName,
//           d.email,
//           d.emailNotifications
//         FROM userinfo u
//         LEFT JOIN userdetails d ON u.id = d.id
//         WHERE LOWER(u.username) = LOWER(@username) 
//           OR LOWER(d.email) = LOWER(@username)
//       `);

//     if (userResult.recordset.length === 0) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const user = userResult.recordset[0];

//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     // Generate JWT token with proper payload
//     const jwt = require("jsonwebtoken");
//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         role: user.role
//       },
//       process.env.JWT_SECRET || "your-secret-key",
//       { expiresIn: "24h" }
//     );

//     console.log("✅ Login successful for:", user.username);

//     // ✅ Normalize emailNotifications
//     const emailNotifications = normalizeEmailNotifications(user.emailNotifications);

//     res.status(200).json({
//       success: true,
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         role: user.role,
//         EmployeeId: user.EmployeeId,
//         firstName: user.firstName || "",
//         lastName: user.lastName || "",
//         profile: user.profile || "",
//         emailNotifications: emailNotifications
//       }
//     });

//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ error: "Server error during login" });
//   }
// });

// // Get current user route - CORRECTED
// router.get('/me', authenticateToken, async (req, res) => {
//   try {
//     const pool = await poolPromise;

//     console.log('📥 GET /me endpoint called for user:', req.user.id);

//     // Fetch complete user data WITH emailNotifications
//     const result = await pool.request()
//       .input('userId', sql.Int, req.user.id)
//       .query(`
//         SELECT 
//           u.id,
//           u.username,
//           u.role,
//           u.EmployeeId,
//           u.profile,
//           ud.firstName,
//           ud.lastName,
//           ud.email,
//           ud.phone,
//           ud.mobile,
//           ud.fax,
//           ud.website,
//           ud.dob,
//           ud.street,
//           ud.city,
//           ud.province,
//           ud.postalCode,
//           ud.country,
//           ud.alias,
//           ud.signature,
//           ud.emailNotifications
//         FROM userinfo u
//         LEFT JOIN userdetails ud ON u.id = ud.id
//         WHERE u.id = @userId
//       `);

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     const user = result.recordset[0];

//     // ✅ Normalize emailNotifications
//     const emailNotifications = normalizeEmailNotifications(user.emailNotifications);

//     console.log('✅ GET /me - emailNotifications:', emailNotifications);

//     // Return user data with EmployeeId and emailNotifications
//     res.json({
//       success: true,
//       id: user.id,
//       username: user.username,
//       email: user.email,
//       role: user.role,
//       EmployeeId: user.EmployeeId,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       alias: user.alias,
//       phone: user.phone,
//       mobile: user.mobile,
//       fax: user.fax,
//       website: user.website,
//       dob: user.dob,
//       street: user.street,
//       city: user.city,
//       province: user.province,
//       postalCode: user.postalCode,
//       country: user.country,
//       profile: user.profile || "",
//       signature: user.signature,
//       emailNotifications: emailNotifications,  // ✅ ADDED
//       view: user.role === 'manager' ? 'manager' : 'employee'
//     });
//   } catch (error) {
//     console.error('Error fetching current user:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error while fetching user data' 
//     });
//   }
// });

// // ==================== SIGN UP ROUTE ====================
// router.post("/signup", async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       return res.status(400).json({ error: "Email and password are required" });
//     }

//     // ✅ ADDED: Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(username)) {
//       return res.status(400).json({ error: "Please enter a valid email address" });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({ error: "Password must be at least 6 characters long" });
//     }

//     const pool = await poolPromise;

//     // Check if username already exists
//     const existingUser = await pool
//       .request()
//       .input("username", sql.NVarChar, username.trim().toLowerCase())
//       .query("SELECT id FROM userinfo WHERE LOWER(username) = LOWER(@username)");

//     if (existingUser.recordset.length > 0) {
//       return res.status(400).json({ error: "Email already registered" });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Start transaction
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       const userInfoRequest = new sql.Request(transaction);
//       const userResult = await userInfoRequest
//         .input("username", sql.NVarChar, username.trim().toLowerCase())
//         .input("password", sql.NVarChar, hashedPassword)
//         .input("role", sql.NVarChar, "External user")
//         .input("profile", sql.NVarChar, "")
//         .query(`
//           INSERT INTO userinfo (username, password, role, profile)
//           OUTPUT INSERTED.id
//           VALUES (@username, @password, @role, @profile)
//         `);

//       const userId = userResult.recordset[0].id;

//       // Extract first and last name from email if possible
//       const emailParts = username.split('@')[0].split('.');
//       const firstName = emailParts[0] || "";
//       const lastName = emailParts[1] || "";

//       // Insert into userdetails with default values
//       const userDetailsRequest = new sql.Request(transaction);
//       await userDetailsRequest
//         .input("id", sql.Int, userId)
//         .input("firstName", sql.NVarChar, firstName)
//         .input("lastName", sql.NVarChar, lastName)
//         .input("email", sql.NVarChar, username.trim().toLowerCase())
//         .query(`
//           INSERT INTO userdetails (id, firstName, lastName, email)
//           VALUES (@id, @firstName, @lastName, @email)
//         `);

//       await transaction.commit();

//       res.status(201).json({ 
//         message: "Account created successfully! You can now login.",
//         userId: userId,
//         email: username.trim().toLowerCase()
//       });

//     } catch (transactionError) {
//       await transaction.rollback();
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error("Signup Error:", error);
//     res.status(500).json({ error: "Error creating account" });
//   }
// });

// // ==================== FORGOT PASSWORD ROUTES ====================

// // 1. REQUEST PASSWORD RESET
// router.post("/request-reset", async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ error: "Email is required" });
//     }

//     const pool = await poolPromise;

//     // Check if user exists
//     const userResult = await pool
//       .request()
//       .input("email", sql.NVarChar, email.trim().toLowerCase())
//       .query(`
//         SELECT u.id, u.username, d.firstName, d.email
//         FROM userinfo u
//         INNER JOIN userdetails d ON u.id = d.id
//         WHERE LTRIM(RTRIM(LOWER(d.email))) = @email
//       `);

//     console.log('Password reset request for email:', email);
//     console.log('User found:', userResult.recordset.length > 0);

//     if (userResult.recordset.length === 0) {
//       console.log('No user found with email:', email);
//       return res.status(200).json({ 
//         message: "If an account with that email exists, a password reset link has been sent." 
//       });
//     }

//     const user = userResult.recordset[0];
//     console.log('Found user:', user.username, 'Email:', user.email);

//     if (!user.email || user.email.trim() === '') {
//       console.log('User exists but has no email address in database');
//       return res.status(200).json({ 
//         message: "If an account with that email exists, a password reset link has been sent." 
//       });
//     }

//     // Generate reset token
//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

//     // Store token in database
//     await pool
//       .request()
//       .input("userId", sql.Int, user.id)
//       .input("resetToken", sql.NVarChar, resetToken)
//       .input("resetTokenExpiry", sql.DateTime, resetTokenExpiry)
//       .query(`
//         UPDATE userinfo
//         SET resetToken = @resetToken, resetTokenExpiry = @resetTokenExpiry
//         WHERE id = @userId
//       `);

//     // Create reset link - using getFrontendURL()
//     const frontendURL = getFrontendURL();
//     const resetLink = `${frontendURL}/forgot-password?token=${resetToken}`;

//     console.log('Sending reset email to:', user.email);
//     console.log('Reset link:', resetLink);

//     // Email HTML content
//     const htmlContent = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//         <div style="background-color: #17a2b8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
//           <h1 style="color: white; margin: 0;">Password Reset Request</h1>
//         </div>

//         <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
//           <p style="color: #333; font-size: 16px; line-height: 1.6;">
//             Hello ${user.firstName || user.username || 'User'},
//           </p>

//           <p style="color: #666; font-size: 16px; line-height: 1.6;">
//             You requested to reset your password for your Prophecy account. Click the button below to reset it:
//           </p>

//           <div style="margin: 30px 0; text-align: center;">
//             <a href="${resetLink}" 
//                style="background-color: #17a2b8; 
//                       color: white; 
//                       padding: 15px 30px; 
//                       text-decoration: none; 
//                       border-radius: 5px;
//                       display: inline-block;
//                       font-weight: bold;
//                       font-size: 16px;">
//               Reset Password
//             </a>
//           </div>

//           <p style="color: #666; font-size: 14px; line-height: 1.6;">
//             Or copy and paste this link into your browser:
//           </p>
//           <p style="color: #17a2b8; word-break: break-all; font-size: 12px;">
//             ${resetLink}
//           </p>

//           <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

//           <p style="color: #999; font-size: 12px; line-height: 1.6;">
//             This link will expire in 1 hour for security reasons.<br>
//             If you didn't request this, please ignore this email.<br><br>
//             <strong>This is an automated message. Please do not reply to this email.</strong>
//           </p>
//         </div>
//       </div>
//     `;

//     // Send email using SendGrid API via HTTPS
//     const emailResult = await sendEmailViaSendGrid({
//       to: user.email.trim(),
//       subject: "Password Reset Request - Prophecy",
//       html: htmlContent
//     });

//     if (emailResult.success) {
//       console.log('✅ Reset email sent successfully to:', user.email);
//     } else {
//       console.error('❌ Failed to send reset email:', emailResult.error);
//     }

//     res.status(200).json({ 
//       message: "Password reset link has been sent to your email.",
//       emailSent: emailResult.success,
//       emailError: emailResult.error || null
//     });

//   } catch (error) {
//     console.error("Request reset error:", error);
//     res.status(500).json({ error: "Error sending reset request." });
//   }
// });

// // 2. VERIFY RESET TOKEN
// router.post("/verify-reset-token", async (req, res) => {
//   try {
//     const { token } = req.body;

//     if (!token) {
//       return res.status(400).json({ error: "Token is required" });
//     }

//     const pool = await poolPromise;

//     const result = await pool
//       .request()
//       .input("token", sql.NVarChar, token)
//       .query(`
//         SELECT 
//           u.id, 
//           u.username, 
//           u.resetToken, 
//           u.resetTokenExpiry,
//           d.firstName,
//           d.lastName,
//           d.email
//         FROM userinfo u
//         INNER JOIN userdetails d ON u.id = d.id
//         WHERE u.resetToken = @token
//       `);

//     if (result.recordset.length === 0) {
//       return res.status(400).json({ error: "Invalid reset token" });
//     }

//     const user = result.recordset[0];

//     if (new Date() > new Date(user.resetTokenExpiry)) {
//       return res.status(400).json({ error: "Reset token has expired" });
//     }

//     res.status(200).json({
//       id: user.id,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       username: user.username
//     });

//   } catch (error) {
//     console.error("Verify token error:", error);
//     res.status(500).json({ error: "Error verifying token" });
//   }
// });

// // 3. RESET PASSWORD
// router.post("/reset-password", async (req, res) => {
//   try {
//     const { token, newPassword } = req.body;

//     if (!token || !newPassword) {
//       return res.status(400).json({ error: "Token and new password are required" });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ error: "Password must be at least 6 characters long" });
//     }

//     const pool = await poolPromise;

//     const userResult = await pool
//       .request()
//       .input("token", sql.NVarChar, token)
//       .query(`
//         SELECT id, resetToken, resetTokenExpiry
//         FROM userinfo
//         WHERE resetToken = @token
//       `);

//     if (userResult.recordset.length === 0) {
//       return res.status(400).json({ error: "Invalid reset token" });
//     }

//     const user = userResult.recordset[0];

//     if (new Date() > new Date(user.resetTokenExpiry)) {
//       return res.status(400).json({ error: "Reset token has expired" });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     await pool
//       .request()
//       .input("userId", sql.Int, user.id)
//       .input("password", sql.NVarChar, hashedPassword)
//       .query(`
//         UPDATE userinfo
//         SET password = @password,
//             resetToken = NULL,
//             resetTokenExpiry = NULL
//         WHERE id = @userId
//       `);

//     res.status(200).json({ 
//       message: "Password has been reset successfully" 
//     });

//   } catch (error) {
//     console.error("Reset password error:", error);
//     res.status(500).json({ error: "Error resetting password" });
//   }
// });

// // ==================== END FORGOT PASSWORD ROUTES ====================

// // Track login (call this after successful login)
// router.post("/track-login", authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const trackingId = await trackLogin(userId);

//     res.status(200).json({ 
//       message: "Login tracked successfully",
//       trackingId: trackingId 
//     });
//   } catch (error) {
//     console.error("Error tracking login:", error);
//     res.status(500).json({ error: "Failed to track login" });
//   }
// });

// // Track logout
// router.post("/track-logout", async (req, res) => {
//   try {
//     let trackingId;
//     let isBeacon = false;

//     console.log('📥 Logout request received');
//     console.log('Content-Type:', req.headers['content-type']);
//     console.log('Body type:', typeof req.body);

//     // Handle text body (from our middleware)
//     if (typeof req.body === 'string') {
//       console.log('📦 Processing text body (beacon request)');
//       isBeacon = true;
//       try {
//         const parsed = JSON.parse(req.body);
//         trackingId = parsed.trackingId;
//         console.log('✅ Parsed tracking ID from beacon:', trackingId);
//       } catch (parseError) {
//         console.error('❌ Error parsing beacon body:', parseError);
//         return res.status(400).json({ error: "Invalid beacon data" });
//       }
//     } 
//     // Handle regular JSON body
//     else if (req.body && req.body.trackingId) {
//       console.log('✅ Using regular JSON body');
//       trackingId = req.body.trackingId;
//     } else {
//       console.log('❌ No tracking ID in request');
//       return res.status(400).json({ error: "Tracking ID required" });
//     }

//     if (!trackingId) {
//       console.log('❌ Tracking ID is null or undefined');
//       return res.status(400).json({ error: "Tracking ID required" });
//     }

//     const pool = await poolPromise;
//     const trackingIdInt = parseInt(trackingId);

//     console.log('🔄 Processing logout for session ID:', trackingIdInt);

//     // Check if session exists
//     const checkResult = await pool
//       .request()
//       .input("trackingId", sql.Int, trackingIdInt)
//       .query(`
//         SELECT id, user_id, login_time, logout_time
//         FROM login_logout_tracking 
//         WHERE id = @trackingId
//       `);

//     if (checkResult.recordset.length === 0) {
//       console.log('⚠️ Session not found:', trackingIdInt);
//       return res.status(404).json({ message: "Session not found" });
//     }

//     const session = checkResult.recordset[0];
//     console.log('📊 Session details:', {
//       id: session.id,
//       userId: session.user_id,
//       hasLogout: !!session.logout_time
//     });

//     if (session.logout_time) {
//       console.log('⚠️ Session already closed');
//       return res.status(200).json({ message: "Session already closed" });
//     }

//     // Update session with logout time
//     const updateResult = await pool
//       .request()
//       .input("trackingId", sql.Int, trackingIdInt)
//       .query(`
//         UPDATE login_logout_tracking 
//         SET 
//           logout_time = GETDATE(),
//           session_duration_minutes = DATEDIFF(MINUTE, login_time, GETDATE())
//         WHERE id = @trackingId
//       `);

//     console.log('📝 Update result - Rows affected:', updateResult.rowsAffected[0]);

//     if (updateResult.rowsAffected[0] > 0) {
//       console.log('✅ Logout tracked successfully for session:', trackingIdInt);

//       // Verify the update
//       const verifyResult = await pool
//         .request()
//         .input("trackingId", sql.Int, trackingIdInt)
//         .query(`
//           SELECT logout_time, session_duration_minutes
//           FROM login_logout_tracking 
//           WHERE id = @trackingId
//         `);

//       if (verifyResult.recordset.length > 0) {
//         const updated = verifyResult.recordset[0];
//         console.log('✅ Verified - Logout time:', updated.logout_time);
//         console.log('✅ Verified - Duration:', updated.session_duration_minutes, 'minutes');
//       }

//       res.status(200).json({ 
//         message: "Logout tracked successfully",
//         sessionId: trackingIdInt,
//         isBeacon: isBeacon
//       });
//     } else {
//       console.log('❌ Update failed - no rows affected');
//       res.status(500).json({ error: "Failed to update session" });
//     }

//   } catch (error) {
//     console.error("❌ Error in track-logout:", error);
//     console.error("Error stack:", error.stack);
//     res.status(500).json({ 
//       error: "Failed to track logout",
//       details: error.message 
//     });
//   }
// });

// // Get user session history
// router.get("/user-sessions/:userId", authenticateToken, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { period = 'daily', page = 1, limit = 10 } = req.query;

//     // Check permissions
//     const requestingUser = req.user;
//     if (requestingUser.role !== 'admin' && requestingUser.role !== 'manager' && requestingUser.userId !== parseInt(userId)) {
//       return res.status(403).json({ error: "Access denied" });
//     }

//     const sessionHistory = await getUserSessionHistory(parseInt(userId), period, parseInt(page), parseInt(limit));

//     res.status(200).json(sessionHistory);
//   } catch (error) {
//     console.error("Error fetching session history:", error);
//     res.status(500).json({ error: "Failed to fetch session history" });
//   }
// });

// // Get user session statistics
// router.get("/user-session-stats/:userId", authenticateToken, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { period = 'monthly' } = req.query;

//     // Check permissions
//     const requestingUser = req.user;
//     if (requestingUser.role !== 'admin' && requestingUser.role !== 'manager' && requestingUser.userId !== parseInt(userId)) {
//       return res.status(403).json({ error: "Access denied" });
//     }

//     const sessionStats = await getUserSessionStats(parseInt(userId), period);

//     res.status(200).json(sessionStats);
//   } catch (error) {
//     console.error("Error fetching session stats:", error);
//     res.status(500).json({ error: "Failed to fetch session statistics" });
//   }
// });

// // Get active sessions (admin/manager only)
// router.get("/active-sessions", authenticateToken, async (req, res) => {
//   try {
//     const requestingUser = req.user;

//     // Only allow admins and managers to see active sessions
//     if (requestingUser.role !== 'admin' && requestingUser.role !== 'manager') {
//       return res.status(403).json({ error: "Access denied" });
//     }

//     const activeSessions = await getActiveSessions();

//     res.status(200).json({ activeSessions });
//   } catch (error) {
//     console.error("Error fetching active sessions:", error);
//     res.status(500).json({ error: "Failed to fetch active sessions" });
//   }
// });

// // ADD THIS NEW ENDPOINT TO AuthRoutes.js
// router.post("/create-user", authenticateToken, async (req, res) => {
//   try {
//     const requestingUser = req.user;

//     // Only allow admins and managers to create new users
//     if (requestingUser.role !== 'admin' && requestingUser.role !== 'manager') {
//       return res.status(403).json({ error: "Access denied. Admin or Manager role required." });
//     }

//     const {
//       firstName,
//       lastName,
//       email,
//       phone,
//       mobile,
//       street,
//       city = '',
//       province = '',
//       country = '',
//       postalCode = '',
//       role,
//       username,
//       password
//     } = req.body;

//     // ✅ ADDED: Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ error: "Invalid email address" });
//     }

//     // ✅ USE EMAIL AS USERNAME IF NOT PROVIDED
//     const finalUsername = username || email.trim().toLowerCase();

//     // Validate required fields
//     if (!firstName || !lastName || !email || !password) {
//       return res.status(400).json({ error: "First Name, Last Name, Email, and Password are required!" });
//     }

//     const pool = await poolPromise;

//     // Check if username or email already exists
//     const existingUserCheck = await pool
//       .request()
//       .input("username", sql.NVarChar, finalUsername)
//       .input("email", sql.NVarChar, email.trim().toLowerCase())
//       .query(`
//         SELECT u.username, d.email 
//         FROM userinfo u 
//         LEFT JOIN userdetails d ON u.id = d.id 
//         WHERE LOWER(u.username) = LOWER(@username) OR LOWER(d.email) = LOWER(@email)
//       `);

//     if (existingUserCheck.recordset.length > 0) {
//       return res.status(409).json({ error: "Username or email already exists" });
//     }

//     // Start transaction
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 10);

//       // Insert into userinfo table first
//       const userInfoResult = await new sql.Request(transaction)
//         .input("username", sql.NVarChar, finalUsername)
//         .input("password", sql.NVarChar, hashedPassword)
//         .input("role", sql.NVarChar, role)
//         .input("profile", sql.NVarChar, '') // Default empty profile
//         .query(`
//           INSERT INTO userinfo (username, password, role, profile)
//           OUTPUT INSERTED.id
//           VALUES (@username, @password, @role, @profile)
//         `);

//       const newUserId = userInfoResult.recordset[0].id;

//       // Insert into userdetails table
//       await new sql.Request(transaction)
//         .input("id", sql.Int, newUserId)
//         .input("firstName", sql.NVarChar, firstName)
//         .input("lastName", sql.NVarChar, lastName)
//         .input("email", sql.NVarChar, email.trim().toLowerCase())
//         .input("phone", sql.NVarChar, phone || '')
//         .input("mobile", sql.NVarChar, mobile || '')
//         .input("street", sql.NVarChar, street || '')
//         .input("city", sql.NVarChar, city)
//         .input("province", sql.NVarChar, province)
//         .input("country", sql.NVarChar, country)
//         .input("postalCode", sql.NVarChar, postalCode)
//         .input("createdBy", sql.Int, requestingUser.userId)
//         .query(`
//           INSERT INTO userdetails (
//             id, firstName, lastName, email, phone, mobile, 
//             street, city, province, country, postalCode, 
//             created_at, createdBy
//           )
//           VALUES (
//             @id, @firstName, @lastName, @email, @phone, @mobile,
//             @street, @city, @province, @country, @postalCode,
//             GETDATE(), @createdBy
//           )
//         `);

//       // Commit transaction
//       await transaction.commit();

//       res.status(201).json({
//         message: "User created successfully",
//         userId: newUserId,
//         user: {
//           id: newUserId,
//           username: finalUsername,
//           firstName: firstName,
//           lastName: lastName,
//           email: email.trim().toLowerCase(),
//           role: role
//         }
//       });

//     } catch (transactionError) {
//       // Rollback transaction on error
//       await transaction.rollback();
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error("Error creating user:", error);
//     res.status(500).json({ 
//       message: "Server error while creating user", 
//       error: error.message 
//     });
//   }
// });

// // Get specific user by ID (with role-based access control)
// router.get("/user/:userId", authenticateToken, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const requestingUser = req.user;

//     console.log('📥 GET /user/:userId endpoint called for user:', userId);

//     // Role-based access control
//     if (requestingUser.role === 'admin') {
//       // Admins can access any user
//     } else if (requestingUser.role === 'manager') {
//       // Managers can only access other managers and themselves
//       const pool = await poolPromise;
//       const targetUserResult = await pool
//         .request()
//         .input("id", sql.Int, userId)
//         .query("SELECT role FROM userinfo WHERE id = @id");

//       if (targetUserResult.recordset.length === 0) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       const targetUserRole = targetUserResult.recordset[0].role;
//       if (targetUserRole !== 'manager' && parseInt(userId) !== requestingUser.userId) {
//         return res.status(403).json({ error: "Access denied. Managers can only view manager accounts." });
//       }
//     } else {
//       // Regular users can only access their own data
//       if (requestingUser.userId !== parseInt(userId)) {
//         return res.status(403).json({ error: "Access denied. You can only view your own profile." });
//       }
//     }

//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .input("id", sql.Int, userId)
//       .query(`
//         SELECT 
//           u.id, 
//           u.username, 
//           u.role, 
//           u.profile,
//           u.EmployeeId,
//           d.firstName,
//           d.lastName,
//           d.alias,
//           d.email,
//           d.phone,
//           d.mobile,
//           d.fax,
//           d.website,
//           d.dob,
//           d.street,
//           d.city,
//           d.province,
//           d.postalCode,
//           d.country,
//           d.signature,
//           d.emailNotifications,
//           d.created_at,
//           d.updated_at
//         FROM userinfo u
//         INNER JOIN userdetails d ON u.id = d.id
//         WHERE u.id = @id
//       `);

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const user = result.recordset[0];

//     // ✅ Normalize emailNotifications
//     const emailNotifications = normalizeEmailNotifications(user.emailNotifications);

//     console.log('✅ GET /user/:userId - emailNotifications:', emailNotifications);

//     res.status(200).json({
//       id: user.id,
//       username: user.username,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       alias: user.alias,
//       email: user.email,
//       phone: user.phone,
//       mobile: user.mobile,
//       fax: user.fax,
//       website: user.website,
//       dob: user.dob,
//       street: user.street,
//       city: user.city,
//       province: user.province,
//       postalCode: user.postalCode,
//       country: user.country,
//       role: user.role,
//       EmployeeId: user.EmployeeId,
//       profile: user.profile || "",
//       signature: user.signature,
//       emailNotifications: emailNotifications,  // ✅ ADDED
//       created_at: user.created_at,
//       updated_at: user.updated_at,
//       view: user.role === 'manager' ? 'manager' : 'employee'
//     });
//   } catch (error) {
//     console.error("Error fetching user by ID:", error);
//     res.status(500).json({ message: "Server error while fetching user data" });
//   }
// });

// // UPDATE USER PROFILE - FIXED WITH emailNotifications
// router.put("/user/:userId", authenticateToken, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const requestingUser = req.user;
//     const updateData = req.body;

//     console.log('\n╔════════════════════════════════════════╗');
//     console.log('║      UPDATE USER ENDPOINT CALLED        ║');
//     console.log('╚════════════════════════════════════════╝');
//     console.log('User ID:', userId);
//     console.log('emailNotifications in request:', updateData.emailNotifications);

//     // Role-based access control
//     if (requestingUser.role === 'admin') {
//       // Admins can update any user
//     } else if (requestingUser.role === 'manager') {
//       // Managers can only update other managers and themselves
//       const pool = await poolPromise;
//       const targetUserResult = await pool
//         .request()
//         .input("id", sql.Int, userId)
//         .query("SELECT role FROM userinfo WHERE id = @id");

//       if (targetUserResult.recordset.length === 0) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       const targetUserRole = targetUserResult.recordset[0].role;
//       if (targetUserRole !== 'manager' && parseInt(userId) !== requestingUser.userId) {
//         return res.status(403).json({ error: "Access denied. Managers can only update manager accounts." });
//       }
//     } else {
//       // Regular users can only update their own data
//       if (requestingUser.userId !== parseInt(userId)) {
//         return res.status(403).json({ error: "Access denied. You can only update your own profile." });
//       }
//     }

//     const pool = await poolPromise;

//     // Start a transaction
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       // Update userdetails table
//       const updateFields = [];
//       const request = new sql.Request(transaction);
//       request.input("id", sql.Int, userId);

//       // Build dynamic update query based on provided fields
//       if (updateData.firstName !== undefined) {
//         updateFields.push("firstName = @firstName");
//         request.input("firstName", sql.NVarChar, updateData.firstName);
//       }
//       if (updateData.lastName !== undefined) {
//         updateFields.push("lastName = @lastName");
//         request.input("lastName", sql.NVarChar, updateData.lastName);
//       }
//       if (updateData.alias !== undefined) {
//         updateFields.push("alias = @alias");
//         request.input("alias", sql.NVarChar, updateData.alias);
//       }
//       if (updateData.email !== undefined) {
//         updateFields.push("email = @email");
//         request.input("email", sql.NVarChar, updateData.email);
//       }
//       if (updateData.phone !== undefined) {
//         updateFields.push("phone = @phone");
//         request.input("phone", sql.NVarChar, updateData.phone);
//       }
//       if (updateData.mobile !== undefined) {
//         updateFields.push("mobile = @mobile");
//         request.input("mobile", sql.NVarChar, updateData.mobile);
//       }
//       if (updateData.fax !== undefined) {
//         updateFields.push("fax = @fax");
//         request.input("fax", sql.NVarChar, updateData.fax);
//       }
//       if (updateData.website !== undefined) {
//         updateFields.push("website = @website");
//         request.input("website", sql.NVarChar, updateData.website);
//       }
//       if (updateData.dob !== undefined) {
//         updateFields.push("dob = @dob");
//         request.input("dob", sql.DateTime, updateData.dob);
//       }
//       if (updateData.street !== undefined) {
//         updateFields.push("street = @street");
//         request.input("street", sql.NVarChar, updateData.street);
//       }
//       if (updateData.city !== undefined) {
//         updateFields.push("city = @city");
//         request.input("city", sql.NVarChar, updateData.city);
//       }
//       if (updateData.province !== undefined) {
//         updateFields.push("province = @province");
//         request.input("province", sql.NVarChar, updateData.province);
//       }
//       if (updateData.postalCode !== undefined) {
//         updateFields.push("postalCode = @postalCode");
//         request.input("postalCode", sql.NVarChar, updateData.postalCode);
//       }
//       if (updateData.country !== undefined) {
//         updateFields.push("country = @country");
//         request.input("country", sql.NVarChar, updateData.country);
//       }
//       if (updateData.signature !== undefined) {
//         updateFields.push("signature = @signature");
//         request.input("signature", sql.NVarChar, updateData.signature);
//       }

//       // ✅ CRITICAL: Handle emailNotifications
//       if (updateData.emailNotifications !== undefined) {
//         updateFields.push("emailNotifications = @emailNotifications");
//         const emailNotificationsValue = updateData.emailNotifications === true ? 1 : 0;
//         request.input("emailNotifications", sql.Bit, emailNotificationsValue);
//         console.log('📧 Updating emailNotifications to:', emailNotificationsValue);
//       }

//       // ✅ ADDED: Password update functionality
//       if (updateData.password !== undefined && updateData.password.trim()) {
//         const hashedPassword = await bcrypt.hash(updateData.password, 10);
//         const userInfoRequest = new sql.Request(transaction);
//         userInfoRequest.input("id", sql.Int, userId);
//         userInfoRequest.input("password", sql.NVarChar, hashedPassword);
//         await userInfoRequest.query(`UPDATE userinfo SET password = @password WHERE id = @id`);
//         console.log('✅ Password updated successfully');
//       }

//       // Add updated_at timestamp
//       updateFields.push("updated_at = @updated_at");
//       request.input("updated_at", sql.DateTime, new Date());

//       if (updateFields.length > 1) { // More than just updated_at
//         const updateQuery = `
//           UPDATE userdetails 
//           SET ${updateFields.join(', ')}
//           WHERE id = @id
//         `;
//         console.log('✅ Executing update query');
//         await request.query(updateQuery);
//         console.log('✅ Database updated successfully');
//       }

//       // Update userinfo table if profile is being updated
//       if (updateData.profile !== undefined) {
//         const userInfoRequest = new sql.Request(transaction);
//         userInfoRequest.input("id", sql.Int, userId);
//         userInfoRequest.input("profile", sql.NVarChar, updateData.profile);

//         await userInfoRequest.query(`
//           UPDATE userinfo 
//           SET profile = @profile
//           WHERE id = @id
//         `);
//       }

//       // Update role if provided (only admins can change roles)
//       if (updateData.role !== undefined && requestingUser.role === 'admin') {
//         const roleUpdateRequest = new sql.Request(transaction);
//         roleUpdateRequest.input("id", sql.Int, userId);
//         roleUpdateRequest.input("role", sql.NVarChar, updateData.role);

//         await roleUpdateRequest.query(`
//           UPDATE userinfo 
//           SET role = @role
//           WHERE id = @id
//         `);
//       }

//       // Commit transaction
//       await transaction.commit();
//       console.log('✅ Transaction committed');

//       // ✅ FETCH UPDATED USER DATA - NOW WITH emailNotifications
//       console.log('📥 Fetching updated user data from database...');
//       const updatedUserResult = await pool
//         .request()
//         .input("id", sql.Int, userId)
//         .query(`
//           SELECT 
//             u.id, 
//             u.username, 
//             u.role, 
//             u.profile,
//             u.EmployeeId,
//             d.firstName,
//             d.lastName,
//             d.alias,
//             d.email,
//             d.phone,
//             d.mobile,
//             d.fax,
//             d.website,
//             d.dob,
//             d.street,
//             d.city,
//             d.province,
//             d.postalCode,
//             d.country,
//             d.signature,
//             d.emailNotifications,
//             d.created_at,
//             d.updated_at
//           FROM userinfo u
//           INNER JOIN userdetails d ON u.id = d.id
//           WHERE u.id = @id
//         `);

//       if (updatedUserResult.recordset.length === 0) {
//         return res.status(404).json({ error: "User not found after update" });
//       }

//       const updatedUser = updatedUserResult.recordset[0];

//       console.log('📊 Data fetched from DB:', {
//         username: updatedUser.username,
//         emailNotifications_DB: updatedUser.emailNotifications,
//         type: typeof updatedUser.emailNotifications
//       });

//       // ✅ Normalize emailNotifications
//       const emailNotifications = normalizeEmailNotifications(updatedUser.emailNotifications);

//       console.log('✅ Normalized emailNotifications:', emailNotifications);

//       // ✅ BUILD RESPONSE WITH emailNotifications
//       const responseBody = {
//         message: "User updated successfully",
//         id: updatedUser.id,
//         username: updatedUser.username,
//         firstName: updatedUser.firstName,
//         lastName: updatedUser.lastName,
//         alias: updatedUser.alias,
//         email: updatedUser.email,
//         phone: updatedUser.phone,
//         mobile: updatedUser.mobile,
//         fax: updatedUser.fax,
//         website: updatedUser.website,
//         dob: updatedUser.dob,
//         street: updatedUser.street,
//         city: updatedUser.city,
//         province: updatedUser.province,
//         postalCode: updatedUser.postalCode,
//         country: updatedUser.country,
//         role: updatedUser.role,
//         EmployeeId: updatedUser.EmployeeId,
//         profile: updatedUser.profile || "",
//         signature: updatedUser.signature,
//         emailNotifications: emailNotifications,  // ✅ MUST BE HERE
//         created_at: updatedUser.created_at,
//         updated_at: updatedUser.updated_at,
//         view: updatedUser.role === 'manager' ? 'manager' : 'employee'
//       };

//       console.log('\n📤 RESPONSE BEING SENT:');
//       console.log('├─ username:', responseBody.username);
//       console.log('├─ emailNotifications:', responseBody.emailNotifications);
//       console.log('├─ type:', typeof responseBody.emailNotifications);
//       console.log('└─ has field:', 'emailNotifications' in responseBody);

//       console.log('\n╔════════════════════════════════════════╗');
//       console.log('║      SENDING RESPONSE TO CLIENT         ║');
//       console.log('╚════════════════════════════════════════╝\n');

//       res.status(200).json(responseBody);

//     } catch (transactionError) {
//       // Rollback transaction on error
//       await transaction.rollback();
//       console.error('❌ Transaction error:', transactionError);
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error("❌ Error updating user:", error);
//     res.status(500).json({ 
//       message: "Server error while updating user data",
//       error: error.message 
//     });
//   }
// });

// // Get users by role with enhanced role-based access control
// router.get("/role/:role", authenticateToken, async (req, res) => {
//   try {
//     const { role } = req.params;
//     const currentUserRole = req.user.role;

//     // Enhanced role-based access control
//     if (currentUserRole === 'admin') {
//       // Admins can access any role
//     } else if (currentUserRole === 'manager') {
//       // Managers can only access manager role data
//       if (role !== 'manager') {
//         return res.status(403).json({ error: "Access denied. Managers can only view manager accounts." });
//       }
//     } else {
//       // Regular users cannot access role-based endpoints
//       return res.status(403).json({ error: "Access denied. Insufficient permissions." });
//     }

//     if (!role) {
//       return res.status(400).json({ error: "Role is required!" });
//     }

//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .input("role", sql.NVarChar, role)
//       .query(`
//         SELECT 
//           u.id,
//           u.username,
//           u.role,
//           u.profile,
//           u.EmployeeId,
//           d.firstName,
//           d.lastName,
//           d.alias,
//           d.email,
//           d.phone,
//           d.mobile,
//           d.fax,
//           d.website,
//           d.dob,
//           d.street,
//           d.city,
//           d.province,
//           d.postalCode,
//           d.country,
//           d.created_at,
//           d.updated_at
//         FROM userinfo u
//         JOIN userdetails d ON u.id = d.id
//         WHERE LOWER(u.role) = LOWER(@role)
//         ORDER BY d.firstName, d.lastName
//       `);

//     res.status(200).json({ users: result.recordset });
//   } catch (error) {
//     console.error("Error fetching users by role:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.get("/users", authenticateToken, async (req, res) => {
//   try {
//     const currentUserRole = req.user.role;
//     const currentUserId = req.user.userId;

//     let query;
//     let queryParams = {};

//     if (currentUserRole === 'admin') {
//       // Admins can see all users with login/logout data
//       query = `
//         SELECT 
//           u.id, 
//           u.username, 
//           u.role, 
//           u.profile,
//           u.EmployeeId,
//           d.firstName,
//           d.lastName,
//           d.email,
//           d.phone,
//           d.mobile,
//           d.fax,
//           d.website,
//           d.dob,
//           d.street,
//           d.city,
//           d.province,
//           d.postalCode,
//           d.country,
//           d.signature,
//           d.emailNotifications,
//           (SELECT TOP 1 login_time 
//            FROM login_logout_tracking 
//            WHERE user_id = u.id 
//            ORDER BY login_time DESC) as lastLogin,
//           (SELECT TOP 1 logout_time 
//            FROM login_logout_tracking 
//            WHERE user_id = u.id 
//            AND logout_time IS NOT NULL 
//            ORDER BY logout_time DESC) as lastLogout,
//           CASE WHEN EXISTS (
//             SELECT 1 FROM login_logout_tracking 
//             WHERE user_id = u.id 
//             AND id = (
//               SELECT TOP 1 id 
//               FROM login_logout_tracking 
//               WHERE user_id = u.id 
//               ORDER BY login_time DESC
//             )
//             AND logout_time IS NULL
//           ) THEN 1 ELSE 0 END as hasActiveSession
//         FROM userinfo u
//         JOIN userdetails d ON u.id = d.id
//         ORDER BY d.firstName, d.lastName
//       `;
//     } else if (currentUserRole === 'manager') {
//       // Managers can only see manager role users
//       query = `
//         SELECT 
//           u.id, 
//           u.username, 
//           u.role, 
//           u.profile,
//           u.EmployeeId,
//           d.firstName,
//           d.lastName,
//           d.email,
//           d.phone,
//           d.mobile,
//           d.fax,
//           d.website,
//           d.dob,
//           d.street,
//           d.city,
//           d.province,
//           d.postalCode,
//           d.country,
//           d.signature,
//           d.emailNotifications,
//           (SELECT TOP 1 login_time 
//            FROM login_logout_tracking 
//            WHERE user_id = u.id 
//            ORDER BY login_time DESC) as lastLogin,
//           (SELECT TOP 1 logout_time 
//            FROM login_logout_tracking 
//            WHERE user_id = u.id 
//            AND logout_time IS NOT NULL 
//            ORDER BY logout_time DESC) as lastLogout,
//           CASE WHEN EXISTS (
//             SELECT 1 FROM login_logout_tracking 
//             WHERE user_id = u.id 
//             AND id = (
//               SELECT TOP 1 id 
//               FROM login_logout_tracking 
//               WHERE user_id = u.id 
//               ORDER BY login_time DESC
//             )
//             AND logout_time IS NULL
//           ) THEN 1 ELSE 0 END as hasActiveSession
//         FROM userinfo u
//         JOIN userdetails d ON u.id = d.id
//         WHERE LOWER(u.role) = 'manager'
//         ORDER BY d.firstName, d.lastName
//       `;
//     } else {
//       // Regular users can only see their own data
//       query = `
//         SELECT 
//           u.id, 
//           u.username, 
//           u.role, 
//           u.profile,
//           u.EmployeeId,
//           d.firstName,
//           d.lastName,
//           d.email,
//           d.phone,
//           d.mobile,
//           d.fax,
//           d.website,
//           d.dob,
//           d.street,
//           d.city,
//           d.province,
//           d.postalCode,
//           d.country,
//           d.signature,
//           d.emailNotifications,
//           (SELECT TOP 1 login_time 
//            FROM login_logout_tracking 
//            WHERE user_id = u.id 
//            ORDER BY login_time DESC) as lastLogin,
//           (SELECT TOP 1 logout_time 
//            FROM login_logout_tracking 
//            WHERE user_id = u.id 
//            AND logout_time IS NOT NULL 
//            ORDER BY logout_time DESC) as lastLogout,
//           CASE WHEN EXISTS (
//             SELECT 1 FROM login_logout_tracking 
//             WHERE user_id = u.id 
//             AND id = (
//               SELECT TOP 1 id 
//               FROM login_logout_tracking 
//               WHERE user_id = u.id 
//               ORDER BY login_time DESC
//             )
//             AND logout_time IS NULL
//           ) THEN 1 ELSE 0 END as hasActiveSession
//         FROM userinfo u
//         JOIN userdetails d ON u.id = d.id
//         WHERE u.id = @userId
//         ORDER BY d.firstName, d.lastName
//       `;
//       queryParams.userId = currentUserId;
//     }

//     const pool = await poolPromise;
//     const request = pool.request();

//     if (queryParams.userId) {
//       request.input("userId", sql.Int, queryParams.userId);
//     }

//     const result = await request.query(query);

//     console.log("✅ GET /users query result sample:", {
//       totalUsers: result.recordset.length,
//       firstUser: result.recordset[0] ? {
//         id: result.recordset[0].id,
//         name: `${result.recordset[0].firstName} ${result.recordset[0].lastName}`,
//         emailNotifications: result.recordset[0].emailNotifications
//       } : 'No users found'
//     });

//     const users = result.recordset.map(user => ({
//       id: user.id,
//       username: user.username,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       phone: user.phone,
//       mobile: user.mobile,
//       fax: user.fax,
//       website: user.website,
//       dob: user.dob,
//       street: user.street,
//       city: user.city,
//       province: user.province,
//       postalCode: user.postalCode,
//       country: user.country,
//       role: user.role,
//       EmployeeId: user.EmployeeId,
//       profile: user.profile || "",
//       signature: user.signature,
//       emailNotifications: normalizeEmailNotifications(user.emailNotifications),  // ✅ NORMALIZE
//       lastLogin: user.lastLogin,
//       lastLogout: user.lastLogout,
//       status: user.hasActiveSession ? 'online' : 'offline'
//     }));

//     res.status(200).json({ users: users });
//   } catch (error) {
//     console.error("Error fetching users with role-based access:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // ==================== DELETE USER (Admin Only) ====================
// router.delete("/user/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Check if user is admin
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ error: "Only admins can delete users" });
//     }

//     // Prevent admin from deleting themselves
//     if (req.user.id === parseInt(id)) {
//       return res.status(400).json({ error: "You cannot delete your own account" });
//     }

//     const pool = await poolPromise;

//     // Check if user exists
//     const userCheck = await pool
//       .request()
//       .input("id", sql.Int, id)
//       .query(`
//         SELECT u.id, d.firstName, d.lastName
//         FROM userinfo u
//         INNER JOIN userdetails d ON u.id = d.id
//         WHERE u.id = @id
//       `);

//     if (userCheck.recordset.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const userToDelete = userCheck.recordset[0];

//     // Hard delete - remove user from all related tables first
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       const userId = parseInt(id);

//       // Step 1: Delete from login_logout_tracking (related table with FK)
//       const loginLogRequest = new sql.Request(transaction);
//       await loginLogRequest
//         .input("userId", sql.Int, userId)
//         .query(`DELETE FROM login_logout_tracking WHERE user_id = @userId`);

//       console.log(`✅ Deleted login_logout_tracking records for user ${userId}`);

//       // Step 2: Delete from any other related tables (add more if needed)
//       // Example: timesheets, submissions, etc.
//       // const timesheetsRequest = new sql.Request(transaction);
//       // await timesheetsRequest
//       //   .input("userId", sql.Int, userId)
//       //   .query(`DELETE FROM timesheets WHERE user_id = @userId`);

//       // Step 3: Delete from userdetails
//       const userDetailsRequest = new sql.Request(transaction);
//       await userDetailsRequest
//         .input("id", sql.Int, userId)
//         .query(`DELETE FROM userdetails WHERE id = @id`);

//       console.log(`✅ Deleted userdetails for user ${userId}`);

//       // Step 4: Delete from userinfo
//       const userInfoRequest = new sql.Request(transaction);
//       await userInfoRequest
//         .input("id", sql.Int, userId)
//         .query(`DELETE FROM userinfo WHERE id = @id`);

//       console.log(`✅ Deleted userinfo for user ${userId}`);

//       await transaction.commit();

//       console.log(`✅ User permanently deleted: ${userToDelete.firstName} ${userToDelete.lastName}`);

//       res.status(200).json({
//         success: true,
//         message: "User permanently deleted successfully",
//         deletedUser: `${userToDelete.firstName} ${userToDelete.lastName}`,
//         details: {
//           userId: userId,
//           loginLogsDeleted: true,
//           userDetailsDeleted: true,
//           userInfoDeleted: true
//         }
//       });

//     } catch (transactionError) {
//       await transaction.rollback();
//       console.error("Transaction error:", transactionError);
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error("Error deleting user:", error);

//     // Provide more helpful error messages
//     if (error.message.includes("REFERENCE constraint")) {
//       return res.status(400).json({ 
//         error: "Cannot delete user - has related records in system",
//         details: error.message,
//         solution: "Contact administrator to handle this deletion"
//       });
//     }

//     res.status(500).json({ 
//       error: "Error deleting user", 
//       message: error.message 
//     });
//   }
// });

// // Get current user's relevant dashboard data
// router.get("/dashboard", authenticateToken, async (req, res) => {
//   try {
//     const currentUserRole = req.user.role;
//     const currentUserId = req.user.userId;

//     let query;
//     let title;

//     if (currentUserRole === 'admin') {
//       query = `
//         SELECT 
//           u.id, u.username, u.role, u.profile,
//           u.EmployeeId,
//           d.firstName, d.lastName, d.email, d.phone, d.mobile
//         FROM userinfo u
//         JOIN userdetails d ON u.id = d.id
//         ORDER BY d.firstName, d.lastName
//       `;
//       title = "Admin Dashboard - All Users";
//     } else if (currentUserRole === 'manager') {
//       query = `
//         SELECT 
//           u.id, u.username, u.role, u.profile,
//           u.EmployeeId,
//           d.firstName, d.lastName, d.email, d.phone, d.mobile
//         FROM userinfo u
//         JOIN userdetails d ON u.id = d.id
//         WHERE LOWER(u.role) = 'manager'
//         ORDER BY d.firstName, d.lastName
//       `;
//       title = "Manager Dashboard - Manager Users";
//     } else {
//       query = `
//         SELECT 
//           u.id, u.username, u.role, u.profile,
//           u.EmployeeId,
//           d.firstName, d.lastName, d.email, d.phone, d.mobile
//         FROM userinfo u
//         JOIN userdetails d ON u.id = d.id
//         WHERE u.id = @userId
//       `;
//       title = "User Dashboard - Your Profile";
//     }

//     const pool = await poolPromise;
//     const request = pool.request();

//     if (currentUserRole !== 'admin' && currentUserRole !== 'manager') {
//       request.input("userId", sql.Int, currentUserId);
//     }

//     const result = await request.query(query);

//     res.status(200).json({ 
//       users: result.recordset,
//       title: title,
//       userRole: currentUserRole
//     });
//   } catch (error) {
//     console.error("Error fetching dashboard data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });




// // Add this to your authRoutes.js file

// // ==================== GOOGLE SIGN UP ENDPOINT ====================
// router.post("/google-signup", async (req, res) => {
//   try {
//     const { email, name, googleToken } = req.body;

//     if (!email || !googleToken) {
//       return res.status(400).json({ error: "Email and Google token are required" });
//     }

//     // Verify Google token (optional but recommended for security)
//     let decodedToken;
//     try {
//       decodedToken = JSON.parse(Buffer.from(googleToken.split('.')[1], 'base64').toString());

//       // Verify token expiration
//       if (decodedToken.exp * 1000 < Date.now()) {
//         return res.status(401).json({ error: "Google token has expired" });
//       }

//       // Verify email matches
//       if (decodedToken.email !== email) {
//         return res.status(401).json({ error: "Email mismatch in token" });
//       }

//       console.log("✅ Google token verified for email:", email);
//     } catch (tokenError) {
//       console.error("Token verification error:", tokenError);
//       return res.status(401).json({ error: "Invalid Google token" });
//     }

//     // Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ error: "Invalid email address" });
//     }

//     const pool = await poolPromise;

//     // Check if user already exists (by email)
//     const existingUser = await pool
//       .request()
//       .input("email", sql.NVarChar, email.trim().toLowerCase())
//       .query(`
//         SELECT u.id, u.username, u.role, d.firstName, d.lastName
//         FROM userinfo u
//         INNER JOIN userdetails d ON u.id = d.id
//         WHERE LOWER(d.email) = LOWER(@email)
//       `);

//     // If user exists with same email, log them in (no signup needed)
//     if (existingUser.recordset.length > 0) {
//       const user = existingUser.recordset[0];
//       console.log("✅ Existing user found. Logging in:", user.username);

//       // Generate JWT token
//       const jwt = require("jsonwebtoken");
//       const token = jwt.sign(
//         {
//           id: user.id,
//           username: user.username,
//           role: user.role
//         },
//         process.env.JWT_SECRET || "your-secret-key",
//         { expiresIn: "24h" }
//       );

//       return res.status(200).json({
//         success: true,
//         message: "Welcome back!",
//         token,
//         isNewUser: false,
//         user: {
//           id: user.id,
//           username: user.username,
//           email: email.trim().toLowerCase(),
//           role: user.role,
//           firstName: user.firstName || "",
//           lastName: user.lastName || "",
//           profile: ""
//         }
//       });
//     }

//     // New user - Create account
//     console.log("✅ New user. Creating account for:", email);

//     // Parse name into first and last name
//     const nameParts = name ? name.trim().split(' ') : ['', ''];
//     const firstName = nameParts[0] || '';
//     const lastName = nameParts.slice(1).join(' ') || '';

//     // Use email as username
//     const username = email.trim().toLowerCase();

//     // Start transaction for atomic operation
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       // Insert into userinfo table
//       const userInfoRequest = new sql.Request(transaction);
//       const userResult = await userInfoRequest
//         .input("username", sql.NVarChar, username)
//         .input("password", sql.NVarChar, "GOOGLE_SIGNIN") // Placeholder for Google signin
//         .input("role", sql.NVarChar, "External user")
//         .input("profile", sql.NVarChar, "")
//         .query(`
//           INSERT INTO userinfo (username, password, role, profile)
//           OUTPUT INSERTED.id
//           VALUES (@username, @password, @role, @profile)
//         `);

//       const userId = userResult.recordset[0].id;

//       // Insert into userdetails table
//       const userDetailsRequest = new sql.Request(transaction);
//       await userDetailsRequest
//         .input("id", sql.Int, userId)
//         .input("firstName", sql.NVarChar, firstName)
//         .input("lastName", sql.NVarChar, lastName)
//         .input("email", sql.NVarChar, email.trim().toLowerCase())
//         .query(`
//           INSERT INTO userdetails (id, firstName, lastName, email)
//           VALUES (@id, @firstName, @lastName, @email)
//         `);

//       await transaction.commit();

//       console.log("✅ New user account created. User ID:", userId);

//       // Generate JWT token for the new user
//       const jwt = require("jsonwebtoken");
//       const token = jwt.sign(
//         {
//           id: userId,
//           username: username,
//           role: "External user"
//         },
//         process.env.JWT_SECRET || "your-secret-key",
//         { expiresIn: "24h" }
//       );

//       res.status(201).json({
//         success: true,
//         message: "Account created successfully via Google Sign Up!",
//         token,
//         isNewUser: true,
//         user: {
//           id: userId,
//           username: username,
//           email: email.trim().toLowerCase(),
//           role: "External user",
//           firstName: firstName,
//           lastName: lastName,
//           profile: ""
//         }
//       });

//     } catch (transactionError) {
//       await transaction.rollback();
//       console.error("Transaction error:", transactionError);
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error("Google Signup Error:", error);

//     // Handle specific SQL errors
//     if (error.message.includes("UNIQUE constraint")) {
//       return res.status(409).json({ error: "Email already registered" });
//     }

//     res.status(500).json({ 
//       error: "Error during Google signup",
//       details: error.message 
//     });
//   }
// });

// // ==================== GOOGLE LOGIN ENDPOINT ====================
// router.post("/google-login", async (req, res) => {
//   try {
//     const { email, googleToken } = req.body;

//     if (!email || !googleToken) {
//       return res.status(400).json({ error: "Email and Google token are required" });
//     }

//     // Verify Google token
//     let decodedToken;
//     try {
//       decodedToken = JSON.parse(Buffer.from(googleToken.split('.')[1], 'base64').toString());

//       if (decodedToken.exp * 1000 < Date.now()) {
//         return res.status(401).json({ error: "Google token has expired" });
//       }

//       if (decodedToken.email !== email) {
//         return res.status(401).json({ error: "Email mismatch in token" });
//       }

//       console.log("✅ Google token verified for login");
//     } catch (tokenError) {
//       console.error("Token verification error:", tokenError);
//       return res.status(401).json({ error: "Invalid Google token" });
//     }

//     const pool = await poolPromise;

//     // Find user by email
//     const userResult = await pool
//       .request()
//       .input("email", sql.NVarChar, email.trim().toLowerCase())
//       .query(`
//         SELECT 
//           u.id,
//           u.username,
//           u.password,
//           u.role,
//           u.EmployeeId,
//           u.profile,
//           d.firstName,
//           d.lastName,
//           d.email,
//           d.emailNotifications
//         FROM userinfo u
//         LEFT JOIN userdetails d ON u.id = d.id
//         WHERE LOWER(d.email) = LOWER(@email)
//       `);

//     if (userResult.recordset.length === 0) {
//       return res.status(401).json({ error: "User not found. Please sign up first." });
//     }

//     const user = userResult.recordset[0];

//     // Verify the user was created via Google (password should be GOOGLE_SIGNIN)
//     // If not, user exists but didn't use Google signup
//     if (user.password !== "GOOGLE_SIGNIN") {
//       console.log("⚠️ User exists but wasn't created via Google. Allowing login anyway.");
//     }

//     // Generate JWT token
//     const jwt = require("jsonwebtoken");
//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         role: user.role
//       },
//       process.env.JWT_SECRET || "your-secret-key",
//       { expiresIn: "24h" }
//     );

//     console.log("✅ Google Login successful for:", user.username);

//     // Normalize emailNotifications
//     const emailNotifications = normalizeEmailNotifications(user.emailNotifications);

//     res.status(200).json({
//       success: true,
//       message: "Login successful!",
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         role: user.role,
//         EmployeeId: user.EmployeeId,
//         firstName: user.firstName || "",
//         lastName: user.lastName || "",
//         profile: user.profile || "",
//         emailNotifications: emailNotifications
//       }
//     });

//   } catch (error) {
//     console.error("Google Login Error:", error);
//     res.status(500).json({ 
//       error: "Error during Google login",
//       details: error.message 
//     });
//   }
// });

// module.exports = router;



const express = require("express");
const {
  login,
  getCurrentUser,
  getUserById,
  updateUser,
  getAllUsers,
  getUsersByRole,
  getRecentActivities,
  getDashboardStats
} = require("../controllers/authController");
const { authenticateToken } = require("../middleWare/authMiddleware");
const { poolPromise, sql } = require("../../config/db");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const router = express.Router();
const {
  trackLogin,
  trackLogout,
  getUserSessionHistory,
  getUserSessionStats,
  getActiveSessions
} = require("../../erprecruitment/controllers/loginTrackingController");
const socialMediaController = require("../../erprecruitment/controllers/socialMediaController");

// Dashboard and activity routes
router.get("/users/recent-activities", authenticateToken, getRecentActivities);
router.get("/dashboard-stats", authenticateToken, getDashboardStats);

// ✅ CORRECT NORMALIZATION FUNCTION
function normalizeEmailNotifications(value) {
  if (value === null || value === undefined) {
    return true;
  }
  if (value === 0 || value === false || value === '0' || value === 'false') {
    return false;
  }
  return true;
}

// Get Frontend URL (same as Employee Controller)
const getFrontendURL = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  // Fallback based on NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'https://prophechyerp.duckdns.org';
  }
  return 'http://localhost:3000';
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

// ==================== LOGIN ROUTE - ENHANCED ====================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Email/Username and password are required" });
    }

    const pool = await poolPromise;

    // Query user by username OR email
    const userResult = await pool
      .request()
      .input("username", sql.NVarChar, username.trim().toLowerCase())
      .query(`
        SELECT 
          u.id,
          u.username,
          u.password,
          u.role,
          u.EmployeeId,
          u.profile,
          d.firstName,
          d.lastName,
          d.email,
          d.emailNotifications
        FROM userinfo u
        LEFT JOIN userdetails d ON u.id = d.id
        WHERE LOWER(u.username) = LOWER(@username) 
          OR LOWER(d.email) = LOWER(@username)
      `);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.recordset[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token with proper payload
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    console.log("✅ Login successful for:", user.username);

    // ✅ Check if user is a supervisor for anyone
    let isSupervisor = false;
    if (user.EmployeeId) {
      const supervisorCheck = await pool.request()
        .input('empCode', sql.NVarChar, user.EmployeeId)
        .query(`
          SELECT 1 FROM [hrm].[Employee] e WITH (NOLOCK)
          WHERE EXISTS (
            SELECT 1 FROM [hrm].[Employee] sub WITH (NOLOCK)
            WHERE sub.SupervisorEmployeeId = e.EmployeeId OR sub.BackupSupervisorEmployeeId = e.EmployeeId
          ) AND e.EmployeeCode = @empCode
        `);
      isSupervisor = supervisorCheck.recordset.length > 0;
    }

    // ✅ Normalize emailNotifications
    const emailNotifications = normalizeEmailNotifications(user.emailNotifications);

    // Trigger Daily Social Media Connection Validation (Fire and Forget)
    if (user.id) {
      socialMediaController.validateSocialMediaConnections(user.id).catch(err => {
        console.error('Error validating social media connections in background:', err);
      });
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        EmployeeId: user.EmployeeId,
        isSupervisor: isSupervisor, // ✅ ADDED
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profile: user.profile || "",
        emailNotifications: emailNotifications
      }
    });


  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Get current user route - CORRECTED
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;

    console.log('📥 GET /me endpoint called for user:', req.user.id);

    // Fetch complete user data WITH emailNotifications
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT 
          u.id,
          u.username,
          u.role,
          u.EmployeeId,
          u.profile,
          ud.firstName,
          ud.lastName,
          ud.email,
          ud.phone,
          ud.mobile,
          ud.fax,
          ud.website,
          ud.dob,
          ud.street,
          ud.city,
          ud.province,
          ud.postalCode,
          ud.country,
          ud.alias,
          ud.signature,
          ud.emailNotifications
        FROM userinfo u
        LEFT JOIN userdetails ud ON u.id = ud.id
        WHERE u.id = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.recordset[0];

    // ✅ Check if user is a supervisor for anyone
    let isSupervisor = false;
    if (user.EmployeeId) {
      const supervisorCheck = await pool.request()
        .input('empCode', sql.NVarChar, user.EmployeeId)
        .query(`
          SELECT 1 FROM [hrm].[Employee] e WITH (NOLOCK)
          WHERE EXISTS (
            SELECT 1 FROM [hrm].[Employee] sub WITH (NOLOCK)
            WHERE sub.SupervisorEmployeeId = e.EmployeeId OR sub.BackupSupervisorEmployeeId = e.EmployeeId
          ) AND e.EmployeeCode = @empCode
        `);
      isSupervisor = supervisorCheck.recordset.length > 0;
    }

    // ✅ Normalize emailNotifications
    const emailNotifications = normalizeEmailNotifications(user.emailNotifications);

    console.log('✅ GET /me - isSupervisor:', isSupervisor);

    // Return user data with EmployeeId and emailNotifications
    res.json({
      success: true,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      EmployeeId: user.EmployeeId,
      isSupervisor: isSupervisor, // ✅ ADDED
      firstName: user.firstName,
      lastName: user.lastName,
      alias: user.alias,
      phone: user.phone,
      mobile: user.mobile,
      fax: user.fax,
      website: user.website,
      dob: user.dob,
      street: user.street,
      city: user.city,
      province: user.province,
      postalCode: user.postalCode,
      country: user.country,
      profile: user.profile || "",
      signature: user.signature,
      emailNotifications: emailNotifications,
      view: (user.role === 'manager' || isSupervisor) ? 'manager' : 'employee' // ✅ UPDATED
    });

  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user data'
    });
  }
});

// ==================== SIGN UP ROUTE ====================
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // ✅ ADDED: Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const pool = await poolPromise;

    // Check if username already exists
    const existingUser = await pool
      .request()
      .input("username", sql.NVarChar, username.trim().toLowerCase())
      .query("SELECT id FROM userinfo WHERE LOWER(username) = LOWER(@username)");

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const userInfoRequest = new sql.Request(transaction);
      const userResult = await userInfoRequest
        .input("username", sql.NVarChar, username.trim().toLowerCase())
        .input("password", sql.NVarChar, hashedPassword)
        .input("role", sql.NVarChar, "External user")
        .input("profile", sql.NVarChar, "")
        .query(`
          INSERT INTO userinfo (username, password, role, profile)
          OUTPUT INSERTED.id
          VALUES (@username, @password, @role, @profile)
        `);

      const userId = userResult.recordset[0].id;

      // Extract first and last name from email if possible
      const emailParts = username.split('@')[0].split('.');
      const firstName = emailParts[0] || "";
      const lastName = emailParts[1] || "";

      // Insert into userdetails with default values
      const userDetailsRequest = new sql.Request(transaction);
      await userDetailsRequest
        .input("id", sql.Int, userId)
        .input("firstName", sql.NVarChar, firstName)
        .input("lastName", sql.NVarChar, lastName)
        .input("email", sql.NVarChar, username.trim().toLowerCase())
        .query(`
          INSERT INTO userdetails (id, firstName, lastName, email)
          VALUES (@id, @firstName, @lastName, @email)
        `);

      await transaction.commit();

      res.status(201).json({
        message: "Account created successfully! You can now login.",
        userId: userId,
        email: username.trim().toLowerCase()
      });

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Error creating account" });
  }
});

// ==================== FORGOT PASSWORD ROUTES ====================

// 1. REQUEST PASSWORD RESET
router.post("/request-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const pool = await poolPromise;

    // Check if user exists
    const userResult = await pool
      .request()
      .input("email", sql.NVarChar, email.trim().toLowerCase())
      .query(`
        SELECT u.id, u.username, d.firstName, d.email
        FROM userinfo u
        INNER JOIN userdetails d ON u.id = d.id
        WHERE LTRIM(RTRIM(LOWER(d.email))) = @email
      `);

    console.log('Password reset request for email:', email);
    console.log('User found:', userResult.recordset.length > 0);

    if (userResult.recordset.length === 0) {
      console.log('No user found with email:', email);
      return res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    const user = userResult.recordset[0];
    console.log('Found user:', user.username, 'Email:', user.email);

    if (!user.email || user.email.trim() === '') {
      console.log('User exists but has no email address in database');
      return res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store token in database
    await pool
      .request()
      .input("userId", sql.Int, user.id)
      .input("resetToken", sql.NVarChar, resetToken)
      .input("resetTokenExpiry", sql.DateTime, resetTokenExpiry)
      .query(`
        UPDATE userinfo
        SET resetToken = @resetToken, resetTokenExpiry = @resetTokenExpiry
        WHERE id = @userId
      `);

    // Create reset link - using getFrontendURL()
    const frontendURL = getFrontendURL();
    const resetLink = `${frontendURL}/forgot-password?token=${resetToken}`;

    console.log('Sending reset email to:', user.email);
    console.log('Reset link:', resetLink);

    // Email HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #17a2b8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hello ${user.firstName || user.username || 'User'},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You requested to reset your password for your Prophecy account. Click the button below to reset it:
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetLink}" 
               style="background-color: #17a2b8; 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #17a2b8; word-break: break-all; font-size: 12px;">
            ${resetLink}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            This link will expire in 1 hour for security reasons.<br>
            If you didn't request this, please ignore this email.<br><br>
            <strong>This is an automated message. Please do not reply to this email.</strong>
          </p>
        </div>
      </div>
    `;

    // Send email using SendGrid API via HTTPS
    const emailResult = await sendEmailViaSendGrid({
      to: user.email.trim(),
      subject: "Password Reset Request - Prophecy",
      html: htmlContent
    });

    if (emailResult.success) {
      console.log('✅ Reset email sent successfully to:', user.email);
    } else {
      console.error('❌ Failed to send reset email:', emailResult.error);
    }

    res.status(200).json({
      message: "Password reset link has been sent to your email.",
      emailSent: emailResult.success,
      emailError: emailResult.error || null
    });

  } catch (error) {
    console.error("Request reset error:", error);
    res.status(500).json({ error: "Error sending reset request." });
  }
});

// 2. VERIFY RESET TOKEN
router.post("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("token", sql.NVarChar, token)
      .query(`
        SELECT 
          u.id, 
          u.username, 
          u.resetToken, 
          u.resetTokenExpiry,
          d.firstName,
          d.lastName,
          d.email
        FROM userinfo u
        INNER JOIN userdetails d ON u.id = d.id
        WHERE u.resetToken = @token
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const user = result.recordset[0];

    if (new Date() > new Date(user.resetTokenExpiry)) {
      return res.status(400).json({ error: "Reset token has expired" });
    }

    res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username
    });

  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({ error: "Error verifying token" });
  }
});

// 3. RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const pool = await poolPromise;

    const userResult = await pool
      .request()
      .input("token", sql.NVarChar, token)
      .query(`
        SELECT id, resetToken, resetTokenExpiry
        FROM userinfo
        WHERE resetToken = @token
      `);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const user = userResult.recordset[0];

    if (new Date() > new Date(user.resetTokenExpiry)) {
      return res.status(400).json({ error: "Reset token has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool
      .request()
      .input("userId", sql.Int, user.id)
      .input("password", sql.NVarChar, hashedPassword)
      .query(`
        UPDATE userinfo
        SET password = @password,
            resetToken = NULL,
            resetTokenExpiry = NULL
        WHERE id = @userId
      `);

    res.status(200).json({
      message: "Password has been reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Error resetting password" });
  }
});

// ==================== END FORGOT PASSWORD ROUTES ====================

// Track login (call this after successful login)
router.post("/track-login", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trackingId = await trackLogin(userId);

    res.status(200).json({
      message: "Login tracked successfully",
      trackingId: trackingId
    });
  } catch (error) {
    console.error("Error tracking login:", error);
    res.status(500).json({ error: "Failed to track login" });
  }
});

// Track logout
router.post("/track-logout", async (req, res) => {
  try {
    let trackingId;
    let isBeacon = false;

    console.log('📥 Logout request received');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body type:', typeof req.body);

    // Handle text body (from our middleware)
    if (typeof req.body === 'string') {
      console.log('📦 Processing text body (beacon request)');
      isBeacon = true;
      try {
        const parsed = JSON.parse(req.body);
        trackingId = parsed.trackingId;
        console.log('✅ Parsed tracking ID from beacon:', trackingId);
      } catch (parseError) {
        console.error('❌ Error parsing beacon body:', parseError);
        return res.status(400).json({ error: "Invalid beacon data" });
      }
    }
    // Handle regular JSON body
    else if (req.body && req.body.trackingId) {
      console.log('✅ Using regular JSON body');
      trackingId = req.body.trackingId;
    } else {
      console.log('❌ No tracking ID in request');
      return res.status(400).json({ error: "Tracking ID required" });
    }

    if (!trackingId) {
      console.log('❌ Tracking ID is null or undefined');
      return res.status(400).json({ error: "Tracking ID required" });
    }

    const pool = await poolPromise;
    const trackingIdInt = parseInt(trackingId);

    console.log('🔄 Processing logout for session ID:', trackingIdInt);

    // Check if session exists
    const checkResult = await pool
      .request()
      .input("trackingId", sql.Int, trackingIdInt)
      .query(`
        SELECT id, user_id, login_time, logout_time
        FROM login_logout_tracking 
        WHERE id = @trackingId
      `);

    if (checkResult.recordset.length === 0) {
      console.log('⚠️ Session not found:', trackingIdInt);
      return res.status(404).json({ message: "Session not found" });
    }

    const session = checkResult.recordset[0];
    console.log('📊 Session details:', {
      id: session.id,
      userId: session.user_id,
      hasLogout: !!session.logout_time
    });

    if (session.logout_time) {
      console.log('⚠️ Session already closed');
      return res.status(200).json({ message: "Session already closed" });
    }

    // Update session with logout time
    const updateResult = await pool
      .request()
      .input("trackingId", sql.Int, trackingIdInt)
      .query(`
        UPDATE login_logout_tracking 
        SET 
          logout_time = GETDATE(),
          session_duration_minutes = DATEDIFF(MINUTE, login_time, GETDATE())
        WHERE id = @trackingId
      `);

    console.log('📝 Update result - Rows affected:', updateResult.rowsAffected[0]);

    if (updateResult.rowsAffected[0] > 0) {
      console.log('✅ Logout tracked successfully for session:', trackingIdInt);

      // Verify the update
      const verifyResult = await pool
        .request()
        .input("trackingId", sql.Int, trackingIdInt)
        .query(`
          SELECT logout_time, session_duration_minutes
          FROM login_logout_tracking 
          WHERE id = @trackingId
        `);

      if (verifyResult.recordset.length > 0) {
        const updated = verifyResult.recordset[0];
        console.log('✅ Verified - Logout time:', updated.logout_time);
        console.log('✅ Verified - Duration:', updated.session_duration_minutes, 'minutes');
      }

      res.status(200).json({
        message: "Logout tracked successfully",
        sessionId: trackingIdInt,
        isBeacon: isBeacon
      });
    } else {
      console.log('❌ Update failed - no rows affected');
      res.status(500).json({ error: "Failed to update session" });
    }

  } catch (error) {
    console.error("❌ Error in track-logout:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to track logout",
      details: error.message
    });
  }
});

// Get user session history
router.get("/user-sessions/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'daily', page = 1, limit = 10 } = req.query;

    // Check permissions
    const requestingUser = req.user;
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'manager' && requestingUser.userId !== parseInt(userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const sessionHistory = await getUserSessionHistory(parseInt(userId), period, parseInt(page), parseInt(limit));

    res.status(200).json(sessionHistory);
  } catch (error) {
    console.error("Error fetching session history:", error);
    res.status(500).json({ error: "Failed to fetch session history" });
  }
});

// Get user session statistics
router.get("/user-session-stats/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'monthly' } = req.query;

    // Check permissions
    const requestingUser = req.user;
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'manager' && requestingUser.userId !== parseInt(userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const sessionStats = await getUserSessionStats(parseInt(userId), period);

    res.status(200).json(sessionStats);
  } catch (error) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ error: "Failed to fetch session statistics" });
  }
});

// Get active sessions (admin/manager only)
router.get("/active-sessions", authenticateToken, async (req, res) => {
  try {
    const requestingUser = req.user;

    // Only allow admins and managers to see active sessions
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'manager') {
      return res.status(403).json({ error: "Access denied" });
    }

    const activeSessions = await getActiveSessions();

    res.status(200).json({ activeSessions });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ error: "Failed to fetch active sessions" });
  }
});

// ADD THIS NEW ENDPOINT TO AuthRoutes.js
router.post("/create-user", authenticateToken, async (req, res) => {
  try {
    const requestingUser = req.user;

    // Only allow admins and managers to create new users
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'manager') {
      return res.status(403).json({ error: "Access denied. Admin or Manager role required." });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      mobile,
      street,
      city = '',
      province = '',
      country = '',
      postalCode = '',
      role,
      username,
      password,
      employeeId
    } = req.body;

    // ✅ ADDED: Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // ✅ USE EMAIL AS USERNAME IF NOT PROVIDED
    const finalUsername = username || email.trim().toLowerCase();

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "First Name, Last Name, Email, and Password are required!" });
    }

    const pool = await poolPromise;

    // Check if username or email already exists
    const existingUserCheck = await pool
      .request()
      .input("username", sql.NVarChar, finalUsername)
      .input("email", sql.NVarChar, email.trim().toLowerCase())
      .query(`
        SELECT u.username, d.email 
        FROM userinfo u 
        LEFT JOIN userdetails d ON u.id = d.id 
        WHERE LOWER(u.username) = LOWER(@username) OR LOWER(d.email) = LOWER(@email)
      `);

    if (existingUserCheck.recordset.length > 0) {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into userinfo table first
      const userInfoResult = await new sql.Request(transaction)
        .input("username", sql.NVarChar, finalUsername)
        .input("password", sql.NVarChar, hashedPassword)
        .input("role", sql.NVarChar, role)
        .input("employeeId", sql.NVarChar, employeeId || null)
        .input("profile", sql.NVarChar, '') // Default empty profile
        .query(`
          INSERT INTO userinfo (username, password, role, profile, EmployeeId)
          OUTPUT INSERTED.id
          VALUES (@username, @password, @role, @profile, @employeeId)
        `);

      const newUserId = userInfoResult.recordset[0].id;

      // Insert into userdetails table
      await new sql.Request(transaction)
        .input("id", sql.Int, newUserId)
        .input("firstName", sql.NVarChar, firstName)
        .input("lastName", sql.NVarChar, lastName)
        .input("email", sql.NVarChar, email.trim().toLowerCase())
        .input("phone", sql.NVarChar, phone || '')
        .input("mobile", sql.NVarChar, mobile || '')
        .input("street", sql.NVarChar, street || '')
        .input("city", sql.NVarChar, city)
        .input("province", sql.NVarChar, province)
        .input("country", sql.NVarChar, country)
        .input("postalCode", sql.NVarChar, postalCode)
        .input("createdBy", sql.Int, requestingUser.userId)
        .query(`
          INSERT INTO userdetails (
            id, firstName, lastName, email, phone, mobile, 
            street, city, province, country, postalCode, 
            created_at, createdBy
          )
          VALUES (
            @id, @firstName, @lastName, @email, @phone, @mobile,
            @street, @city, @province, @country, @postalCode,
            GETDATE(), @createdBy
          )
        `);

      // Commit transaction
      await transaction.commit();

      res.status(201).json({
        message: "User created successfully",
        userId: newUserId,
        user: {
          id: newUserId,
          username: finalUsername,
          firstName: firstName,
          lastName: lastName,
          email: email.trim().toLowerCase(),
          role: role
        }
      });

    } catch (transactionError) {
      // Rollback transaction on error
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      message: "Server error while creating user",
      error: error.message
    });
  }
});

// Get specific user by ID (with role-based access control)
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    console.log('📥 GET /user/:userId endpoint called for user:', userId);

    // Role-based access control
    if (requestingUser.role === 'admin') {
      // Admins can access any user
    } else if (requestingUser.role === 'manager') {
      // Managers can only access other managers and themselves
      const pool = await poolPromise;
      const targetUserResult = await pool
        .request()
        .input("id", sql.Int, userId)
        .query("SELECT role FROM userinfo WHERE id = @id");

      if (targetUserResult.recordset.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const targetUserRole = targetUserResult.recordset[0].role;
      if (targetUserRole !== 'manager' && parseInt(userId) !== requestingUser.userId) {
        return res.status(403).json({ error: "Access denied. Managers can only view manager accounts." });
      }
    } else {
      // Regular users can only access their own data
      if (requestingUser.userId !== parseInt(userId)) {
        return res.status(403).json({ error: "Access denied. You can only view your own profile." });
      }
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, userId)
      .query(`
        SELECT 
          u.id, 
          u.username, 
          u.role, 
          u.profile,
          u.EmployeeId,
          d.firstName,
          d.lastName,
          d.alias,
          d.email,
          d.phone,
          d.mobile,
          d.fax,
          d.website,
          d.dob,
          d.street,
          d.city,
          d.province,
          d.postalCode,
          d.country,
          d.signature,
          d.emailNotifications,
          d.created_at,
          d.updated_at
        FROM userinfo u
        INNER JOIN userdetails d ON u.id = d.id
        WHERE u.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.recordset[0];

    // ✅ Normalize emailNotifications
    const emailNotifications = normalizeEmailNotifications(user.emailNotifications);

    console.log('✅ GET /user/:userId - emailNotifications:', emailNotifications);

    res.status(200).json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      alias: user.alias,
      email: user.email,
      phone: user.phone,
      mobile: user.mobile,
      fax: user.fax,
      website: user.website,
      dob: user.dob,
      street: user.street,
      city: user.city,
      province: user.province,
      postalCode: user.postalCode,
      country: user.country,
      role: user.role,
      EmployeeId: user.EmployeeId,
      profile: user.profile || "",
      signature: user.signature,
      emailNotifications: emailNotifications,  // ✅ ADDED
      created_at: user.created_at,
      updated_at: user.updated_at,
      view: user.role === 'manager' ? 'manager' : 'employee'
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server error while fetching user data" });
  }
});

// UPDATE USER PROFILE - FIXED WITH emailNotifications
router.put("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;
    const updateData = req.body;

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║      UPDATE USER ENDPOINT CALLED        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('User ID:', userId);
    console.log('emailNotifications in request:', updateData.emailNotifications);

    // Role-based access control
    if (requestingUser.role === 'admin') {
      // Admins can update any user
    } else if (requestingUser.role === 'manager') {
      // Managers can only update other managers and themselves
      const pool = await poolPromise;
      const targetUserResult = await pool
        .request()
        .input("id", sql.Int, userId)
        .query("SELECT role FROM userinfo WHERE id = @id");

      if (targetUserResult.recordset.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const targetUserRole = targetUserResult.recordset[0].role;
      if (targetUserRole !== 'manager' && parseInt(userId) !== requestingUser.userId) {
        return res.status(403).json({ error: "Access denied. Managers can only update manager accounts." });
      }
    } else {
      // Regular users can only update their own data
      if (requestingUser.userId !== parseInt(userId)) {
        return res.status(403).json({ error: "Access denied. You can only update your own profile." });
      }
    }

    const pool = await poolPromise;

    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update userdetails table
      const updateFields = [];
      const request = new sql.Request(transaction);
      request.input("id", sql.Int, userId);

      // Build dynamic update query based on provided fields
      if (updateData.firstName !== undefined) {
        updateFields.push("firstName = @firstName");
        request.input("firstName", sql.NVarChar, updateData.firstName);
      }
      if (updateData.lastName !== undefined) {
        updateFields.push("lastName = @lastName");
        request.input("lastName", sql.NVarChar, updateData.lastName);
      }
      if (updateData.alias !== undefined) {
        updateFields.push("alias = @alias");
        request.input("alias", sql.NVarChar, updateData.alias);
      }
      if (updateData.email !== undefined) {
        updateFields.push("email = @email");
        request.input("email", sql.NVarChar, updateData.email);
      }
      if (updateData.phone !== undefined) {
        updateFields.push("phone = @phone");
        request.input("phone", sql.NVarChar, updateData.phone);
      }
      if (updateData.mobile !== undefined) {
        updateFields.push("mobile = @mobile");
        request.input("mobile", sql.NVarChar, updateData.mobile);
      }
      if (updateData.fax !== undefined) {
        updateFields.push("fax = @fax");
        request.input("fax", sql.NVarChar, updateData.fax);
      }
      if (updateData.website !== undefined) {
        updateFields.push("website = @website");
        request.input("website", sql.NVarChar, updateData.website);
      }
      if (updateData.dob !== undefined) {
        updateFields.push("dob = @dob");
        request.input("dob", sql.DateTime, updateData.dob);
      }
      if (updateData.street !== undefined) {
        updateFields.push("street = @street");
        request.input("street", sql.NVarChar, updateData.street);
      }
      if (updateData.city !== undefined) {
        updateFields.push("city = @city");
        request.input("city", sql.NVarChar, updateData.city);
      }
      if (updateData.province !== undefined) {
        updateFields.push("province = @province");
        request.input("province", sql.NVarChar, updateData.province);
      }
      if (updateData.postalCode !== undefined) {
        updateFields.push("postalCode = @postalCode");
        request.input("postalCode", sql.NVarChar, updateData.postalCode);
      }
      if (updateData.country !== undefined) {
        updateFields.push("country = @country");
        request.input("country", sql.NVarChar, updateData.country);
      }
      if (updateData.signature !== undefined) {
        updateFields.push("signature = @signature");
        request.input("signature", sql.NVarChar, updateData.signature);
      }

      // ✅ CRITICAL: Handle emailNotifications
      if (updateData.emailNotifications !== undefined) {
        updateFields.push("emailNotifications = @emailNotifications");
        const emailNotificationsValue = updateData.emailNotifications === true ? 1 : 0;
        request.input("emailNotifications", sql.Bit, emailNotificationsValue);
        console.log('📧 Updating emailNotifications to:', emailNotificationsValue);
      }

      // ✅ ADDED: Password update functionality
      if (updateData.password !== undefined && updateData.password.trim()) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        const userInfoRequest = new sql.Request(transaction);
        userInfoRequest.input("id", sql.Int, userId);
        userInfoRequest.input("password", sql.NVarChar, hashedPassword);
        await userInfoRequest.query(`UPDATE userinfo SET password = @password WHERE id = @id`);
        console.log('✅ Password updated successfully');
      }

      // Add updated_at timestamp
      updateFields.push("updated_at = @updated_at");
      request.input("updated_at", sql.DateTime, new Date());

      if (updateFields.length > 1) { // More than just updated_at
        const updateQuery = `
          UPDATE userdetails 
          SET ${updateFields.join(', ')}
          WHERE id = @id
        `;
        console.log('✅ Executing update query');
        await request.query(updateQuery);
        console.log('✅ Database updated successfully');
      }

      // Update userinfo table if profile is being updated
      if (updateData.profile !== undefined) {
        const userInfoRequest = new sql.Request(transaction);
        userInfoRequest.input("id", sql.Int, userId);
        userInfoRequest.input("profile", sql.NVarChar, updateData.profile);

        await userInfoRequest.query(`
          UPDATE userinfo 
          SET profile = @profile
          WHERE id = @id
        `);
      }

      // Update role if provided (only admins can change roles)
      if (updateData.role !== undefined && requestingUser.role === 'admin') {
        const roleUpdateRequest = new sql.Request(transaction);
        roleUpdateRequest.input("id", sql.Int, userId);
        roleUpdateRequest.input("role", sql.NVarChar, updateData.role);

        await roleUpdateRequest.query(`
          UPDATE userinfo 
          SET role = @role
          WHERE id = @id
        `);
      }

      // Update EmployeeId if provided
      if (updateData.employeeId !== undefined) {
        const empIdRequest = new sql.Request(transaction);
        empIdRequest.input("id", sql.Int, userId);
        empIdRequest.input("employeeId", sql.NVarChar, updateData.employeeId || null);

        await empIdRequest.query(`
          UPDATE userinfo 
          SET EmployeeId = @employeeId
          WHERE id = @id
        `);
        console.log('✅ EmployeeId updated to:', updateData.employeeId);
      }

      // Commit transaction
      await transaction.commit();
      console.log('✅ Transaction committed');

      // ✅ FETCH UPDATED USER DATA - NOW WITH emailNotifications
      console.log('📥 Fetching updated user data from database...');
      const updatedUserResult = await pool
        .request()
        .input("id", sql.Int, userId)
        .query(`
          SELECT 
            u.id, 
            u.username, 
            u.role, 
            u.profile,
            u.EmployeeId,
            d.firstName,
            d.lastName,
            d.alias,
            d.email,
            d.phone,
            d.mobile,
            d.fax,
            d.website,
            d.dob,
            d.street,
            d.city,
            d.province,
            d.postalCode,
            d.country,
            d.signature,
            d.emailNotifications,
            d.created_at,
            d.updated_at
          FROM userinfo u
          INNER JOIN userdetails d ON u.id = d.id
          WHERE u.id = @id
        `);

      if (updatedUserResult.recordset.length === 0) {
        return res.status(404).json({ error: "User not found after update" });
      }

      const updatedUser = updatedUserResult.recordset[0];

      console.log('📊 Data fetched from DB:', {
        username: updatedUser.username,
        emailNotifications_DB: updatedUser.emailNotifications,
        type: typeof updatedUser.emailNotifications
      });

      // ✅ Normalize emailNotifications
      const emailNotifications = normalizeEmailNotifications(updatedUser.emailNotifications);

      console.log('✅ Normalized emailNotifications:', emailNotifications);

      // ✅ BUILD RESPONSE WITH emailNotifications
      const responseBody = {
        message: "User updated successfully",
        id: updatedUser.id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        alias: updatedUser.alias,
        email: updatedUser.email,
        phone: updatedUser.phone,
        mobile: updatedUser.mobile,
        fax: updatedUser.fax,
        website: updatedUser.website,
        dob: updatedUser.dob,
        street: updatedUser.street,
        city: updatedUser.city,
        province: updatedUser.province,
        postalCode: updatedUser.postalCode,
        country: updatedUser.country,
        role: updatedUser.role,
        EmployeeId: updatedUser.EmployeeId,
        profile: updatedUser.profile || "",
        signature: updatedUser.signature,
        emailNotifications: emailNotifications,  // ✅ MUST BE HERE
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        view: updatedUser.role === 'manager' ? 'manager' : 'employee'
      };

      console.log('\n📤 RESPONSE BEING SENT:');
      console.log('├─ username:', responseBody.username);
      console.log('├─ emailNotifications:', responseBody.emailNotifications);
      console.log('├─ type:', typeof responseBody.emailNotifications);
      console.log('└─ has field:', 'emailNotifications' in responseBody);

      console.log('\n╔════════════════════════════════════════╗');
      console.log('║      SENDING RESPONSE TO CLIENT         ║');
      console.log('╚════════════════════════════════════════╝\n');

      res.status(200).json(responseBody);

    } catch (transactionError) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('❌ Transaction error:', transactionError);
      throw transactionError;
    }

  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({
      message: "Server error while updating user data",
      error: error.message
    });
  }
});

// Get users by role with enhanced role-based access control
router.get("/role/:role", authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    const currentUserRole = req.user.role;

    // Enhanced role-based access control
    if (currentUserRole === 'admin') {
      // Admins can access any role
    } else if (currentUserRole === 'manager') {
      // Managers can only access manager role data
      if (role !== 'manager') {
        return res.status(403).json({ error: "Access denied. Managers can only view manager accounts." });
      }
    } else {
      // Regular users cannot access role-based endpoints
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    if (!role) {
      return res.status(400).json({ error: "Role is required!" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("role", sql.NVarChar, role)
      .query(`
        SELECT 
          u.id,
          u.username,
          u.role,
          u.profile,
          u.EmployeeId,
          d.firstName,
          d.lastName,
          d.alias,
          d.email,
          d.phone,
          d.mobile,
          d.fax,
          d.website,
          d.dob,
          d.street,
          d.city,
          d.province,
          d.postalCode,
          d.country,
          d.created_at,
          d.updated_at
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        WHERE LOWER(u.role) = LOWER(@role)
        ORDER BY d.firstName, d.lastName
      `);

    res.status(200).json({ users: result.recordset });
  } catch (error) {
    console.error("Error fetching users by role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/users", authenticateToken, async (req, res) => {
  try {
    const currentUserRole = req.user.role;
    const currentUserId = req.user.userId;

    let query;
    let queryParams = {};

    if (currentUserRole === 'admin') {
      // Admins can see all users with login/logout data
      query = `
        SELECT 
          u.id, 
          u.username, 
          u.role, 
          u.profile,
          u.EmployeeId,
          d.firstName,
          d.lastName,
          d.email,
          d.phone,
          d.mobile,
          d.fax,
          d.website,
          d.dob,
          d.street,
          d.city,
          d.province,
          d.postalCode,
          d.country,
          d.signature,
          d.emailNotifications,
          (SELECT TOP 1 login_time 
           FROM login_logout_tracking 
           WHERE user_id = u.id 
           ORDER BY login_time DESC) as lastLogin,
          (SELECT TOP 1 logout_time 
           FROM login_logout_tracking 
           WHERE user_id = u.id 
           AND logout_time IS NOT NULL 
           ORDER BY logout_time DESC) as lastLogout,
          CASE WHEN EXISTS (
            SELECT 1 FROM login_logout_tracking 
            WHERE user_id = u.id 
            AND id = (
              SELECT TOP 1 id 
              FROM login_logout_tracking 
              WHERE user_id = u.id 
              ORDER BY login_time DESC
            )
            AND logout_time IS NULL
          ) THEN 1 ELSE 0 END as hasActiveSession
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        ORDER BY d.firstName, d.lastName
      `;
    } else if (currentUserRole === 'manager') {
      // Managers can only see manager role users
      query = `
        SELECT 
          u.id, 
          u.username, 
          u.role, 
          u.profile,
          u.EmployeeId,
          d.firstName,
          d.lastName,
          d.email,
          d.phone,
          d.mobile,
          d.fax,
          d.website,
          d.dob,
          d.street,
          d.city,
          d.province,
          d.postalCode,
          d.country,
          d.signature,
          d.emailNotifications,
          (SELECT TOP 1 login_time 
           FROM login_logout_tracking 
           WHERE user_id = u.id 
           ORDER BY login_time DESC) as lastLogin,
          (SELECT TOP 1 logout_time 
           FROM login_logout_tracking 
           WHERE user_id = u.id 
           AND logout_time IS NOT NULL 
           ORDER BY logout_time DESC) as lastLogout,
          CASE WHEN EXISTS (
            SELECT 1 FROM login_logout_tracking 
            WHERE user_id = u.id 
            AND id = (
              SELECT TOP 1 id 
              FROM login_logout_tracking 
              WHERE user_id = u.id 
              ORDER BY login_time DESC
            )
            AND logout_time IS NULL
          ) THEN 1 ELSE 0 END as hasActiveSession
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        WHERE LOWER(u.role) = 'manager'
        ORDER BY d.firstName, d.lastName
      `;
    } else {
      // Regular users can only see their own data
      query = `
        SELECT 
          u.id, 
          u.username, 
          u.role, 
          u.profile,
          u.EmployeeId,
          d.firstName,
          d.lastName,
          d.email,
          d.phone,
          d.mobile,
          d.fax,
          d.website,
          d.dob,
          d.street,
          d.city,
          d.province,
          d.postalCode,
          d.country,
          d.signature,
          d.emailNotifications,
          (SELECT TOP 1 login_time 
           FROM login_logout_tracking 
           WHERE user_id = u.id 
           ORDER BY login_time DESC) as lastLogin,
          (SELECT TOP 1 logout_time 
           FROM login_logout_tracking 
           WHERE user_id = u.id 
           AND logout_time IS NOT NULL 
           ORDER BY logout_time DESC) as lastLogout,
          CASE WHEN EXISTS (
            SELECT 1 FROM login_logout_tracking 
            WHERE user_id = u.id 
            AND id = (
              SELECT TOP 1 id 
              FROM login_logout_tracking 
              WHERE user_id = u.id 
              ORDER BY login_time DESC
            )
            AND logout_time IS NULL
          ) THEN 1 ELSE 0 END as hasActiveSession
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        WHERE u.id = @userId
        ORDER BY d.firstName, d.lastName
      `;
      queryParams.userId = currentUserId;
    }

    const pool = await poolPromise;
    const request = pool.request();

    if (queryParams.userId) {
      request.input("userId", sql.Int, queryParams.userId);
    }

    const result = await request.query(query);

    console.log("✅ GET /users query result sample:", {
      totalUsers: result.recordset.length,
      firstUser: result.recordset[0] ? {
        id: result.recordset[0].id,
        name: `${result.recordset[0].firstName} ${result.recordset[0].lastName}`,
        emailNotifications: result.recordset[0].emailNotifications
      } : 'No users found'
    });

    const users = result.recordset.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      mobile: user.mobile,
      fax: user.fax,
      website: user.website,
      dob: user.dob,
      street: user.street,
      city: user.city,
      province: user.province,
      postalCode: user.postalCode,
      country: user.country,
      role: user.role,
      EmployeeId: user.EmployeeId,
      profile: user.profile || "",
      signature: user.signature,
      emailNotifications: normalizeEmailNotifications(user.emailNotifications),  // ✅ NORMALIZE
      lastLogin: user.lastLogin,
      lastLogout: user.lastLogout,
      status: user.hasActiveSession ? 'online' : 'offline'
    }));

    res.status(200).json({ users: users });
  } catch (error) {
    console.error("Error fetching users with role-based access:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELETE USER (Admin Only) ====================
router.delete("/user/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can delete users" });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const pool = await poolPromise;

    // Check if user exists
    const userCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT u.id, d.firstName, d.lastName
        FROM userinfo u
        INNER JOIN userdetails d ON u.id = d.id
        WHERE u.id = @id
      `);

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userToDelete = userCheck.recordset[0];

    // Hard delete - remove user from all related tables first
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const userId = parseInt(id);

      // Step 1: Delete from login_logout_tracking (related table with FK)
      const loginLogRequest = new sql.Request(transaction);
      await loginLogRequest
        .input("userId", sql.Int, userId)
        .query(`DELETE FROM login_logout_tracking WHERE user_id = @userId`);

      console.log(`✅ Deleted login_logout_tracking records for user ${userId}`);

      // Step 2: Delete from any other related tables (add more if needed)
      // Example: timesheets, submissions, etc.
      // const timesheetsRequest = new sql.Request(transaction);
      // await timesheetsRequest
      //   .input("userId", sql.Int, userId)
      //   .query(`DELETE FROM timesheets WHERE user_id = @userId`);

      // Step 3: Delete from userdetails
      const userDetailsRequest = new sql.Request(transaction);
      await userDetailsRequest
        .input("id", sql.Int, userId)
        .query(`DELETE FROM userdetails WHERE id = @id`);

      console.log(`✅ Deleted userdetails for user ${userId}`);

      // Step 4: Delete from userinfo
      const userInfoRequest = new sql.Request(transaction);
      await userInfoRequest
        .input("id", sql.Int, userId)
        .query(`DELETE FROM userinfo WHERE id = @id`);

      console.log(`✅ Deleted userinfo for user ${userId}`);

      await transaction.commit();

      console.log(`✅ User permanently deleted: ${userToDelete.firstName} ${userToDelete.lastName}`);

      res.status(200).json({
        success: true,
        message: "User permanently deleted successfully",
        deletedUser: `${userToDelete.firstName} ${userToDelete.lastName}`,
        details: {
          userId: userId,
          loginLogsDeleted: true,
          userDetailsDeleted: true,
          userInfoDeleted: true
        }
      });

    } catch (transactionError) {
      await transaction.rollback();
      console.error("Transaction error:", transactionError);
      throw transactionError;
    }

  } catch (error) {
    console.error("Error deleting user:", error);

    // Provide more helpful error messages
    if (error.message.includes("REFERENCE constraint")) {
      return res.status(400).json({
        error: "Cannot delete user - has related records in system",
        details: error.message,
        solution: "Contact administrator to handle this deletion"
      });
    }

    res.status(500).json({
      error: "Error deleting user",
      message: error.message
    });
  }
});

// Get current user's relevant dashboard data
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const currentUserRole = req.user.role;
    const currentUserId = req.user.userId;

    let query;
    let title;

    if (currentUserRole === 'admin') {
      query = `
        SELECT 
          u.id, u.username, u.role, u.profile,
          u.EmployeeId,
          d.firstName, d.lastName, d.email, d.phone, d.mobile
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        ORDER BY d.firstName, d.lastName
      `;
      title = "Admin Dashboard - All Users";
    } else if (currentUserRole === 'manager') {
      query = `
        SELECT 
          u.id, u.username, u.role, u.profile,
          u.EmployeeId,
          d.firstName, d.lastName, d.email, d.phone, d.mobile
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        WHERE LOWER(u.role) = 'manager'
        ORDER BY d.firstName, d.lastName
      `;
      title = "Manager Dashboard - Manager Users";
    } else {
      query = `
        SELECT 
          u.id, u.username, u.role, u.profile,
          u.EmployeeId,
          d.firstName, d.lastName, d.email, d.phone, d.mobile
        FROM userinfo u
        JOIN userdetails d ON u.id = d.id
        WHERE u.id = @userId
      `;
      title = "User Dashboard - Your Profile";
    }

    const pool = await poolPromise;
    const request = pool.request();

    if (currentUserRole !== 'admin' && currentUserRole !== 'manager') {
      request.input("userId", sql.Int, currentUserId);
    }

    const result = await request.query(query);

    res.status(200).json({
      users: result.recordset,
      title: title,
      userRole: currentUserRole
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// Add this to your authRoutes.js file

// ==================== GOOGLE SIGN UP ENDPOINT ====================
router.post("/google-signup", async (req, res) => {
  try {
    const { email, name, googleToken } = req.body;

    if (!email || !googleToken) {
      return res.status(400).json({ error: "Email and Google token are required" });
    }

    // Verify Google token (optional but recommended for security)
    let decodedToken;
    try {
      decodedToken = JSON.parse(Buffer.from(googleToken.split('.')[1], 'base64').toString());

      // Verify token expiration
      if (decodedToken.exp * 1000 < Date.now()) {
        return res.status(401).json({ error: "Google token has expired" });
      }

      // Verify email matches
      if (decodedToken.email !== email) {
        return res.status(401).json({ error: "Email mismatch in token" });
      }

      console.log("✅ Google token verified for email:", email);
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      return res.status(401).json({ error: "Invalid Google token" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const pool = await poolPromise;

    // Check if user already exists (by email)
    const existingUser = await pool
      .request()
      .input("email", sql.NVarChar, email.trim().toLowerCase())
      .query(`
        SELECT u.id, u.username, u.role, d.firstName, d.lastName
        FROM userinfo u
        INNER JOIN userdetails d ON u.id = d.id
        WHERE LOWER(d.email) = LOWER(@email)
      `);

    // If user exists with same email, log them in (no signup needed)
    if (existingUser.recordset.length > 0) {
      const user = existingUser.recordset[0];
      console.log("✅ Existing user found. Logging in:", user.username);

      // Generate JWT token
      const jwt = require("jsonwebtoken");
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      return res.status(200).json({
        success: true,
        message: "Welcome back!",
        token,
        isNewUser: false,
        user: {
          id: user.id,
          username: user.username,
          email: email.trim().toLowerCase(),
          role: user.role,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          profile: ""
        }
      });
    }

    // New user - Create account
    console.log("✅ New user. Creating account for:", email);

    // Parse name into first and last name
    const nameParts = name ? name.trim().split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Use email as username
    const username = email.trim().toLowerCase();

    // Start transaction for atomic operation
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Insert into userinfo table
      const userInfoRequest = new sql.Request(transaction);
      const userResult = await userInfoRequest
        .input("username", sql.NVarChar, username)
        .input("password", sql.NVarChar, "GOOGLE_SIGNIN") // Placeholder for Google signin
        .input("role", sql.NVarChar, "External user")
        .input("profile", sql.NVarChar, "")
        .query(`
          INSERT INTO userinfo (username, password, role, profile)
          OUTPUT INSERTED.id
          VALUES (@username, @password, @role, @profile)
        `);

      const userId = userResult.recordset[0].id;

      // Insert into userdetails table
      const userDetailsRequest = new sql.Request(transaction);
      await userDetailsRequest
        .input("id", sql.Int, userId)
        .input("firstName", sql.NVarChar, firstName)
        .input("lastName", sql.NVarChar, lastName)
        .input("email", sql.NVarChar, email.trim().toLowerCase())
        .query(`
          INSERT INTO userdetails (id, firstName, lastName, email)
          VALUES (@id, @firstName, @lastName, @email)
        `);

      await transaction.commit();

      console.log("✅ New user account created. User ID:", userId);

      // Generate JWT token for the new user
      const jwt = require("jsonwebtoken");
      const token = jwt.sign(
        {
          id: userId,
          username: username,
          role: "External user"
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.status(201).json({
        success: true,
        message: "Account created successfully via Google Sign Up!",
        token,
        isNewUser: true,
        user: {
          id: userId,
          username: username,
          email: email.trim().toLowerCase(),
          role: "External user",
          firstName: firstName,
          lastName: lastName,
          profile: ""
        }
      });

    } catch (transactionError) {
      await transaction.rollback();
      console.error("Transaction error:", transactionError);
      throw transactionError;
    }

  } catch (error) {
    console.error("Google Signup Error:", error);

    // Handle specific SQL errors
    if (error.message.includes("UNIQUE constraint")) {
      return res.status(409).json({ error: "Email already registered" });
    }

    res.status(500).json({
      error: "Error during Google signup",
      details: error.message
    });
  }
});

// ==================== GOOGLE LOGIN ENDPOINT ====================
router.post("/google-login", async (req, res) => {
  try {
    const { email, googleToken } = req.body;

    if (!email || !googleToken) {
      return res.status(400).json({ error: "Email and Google token are required" });
    }

    // Verify Google token
    let decodedToken;
    try {
      decodedToken = JSON.parse(Buffer.from(googleToken.split('.')[1], 'base64').toString());

      if (decodedToken.exp * 1000 < Date.now()) {
        return res.status(401).json({ error: "Google token has expired" });
      }

      if (decodedToken.email !== email) {
        return res.status(401).json({ error: "Email mismatch in token" });
      }

      console.log("✅ Google token verified for login");
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const pool = await poolPromise;

    // Find user by email
    const userResult = await pool
      .request()
      .input("email", sql.NVarChar, email.trim().toLowerCase())
      .query(`
        SELECT 
          u.id,
          u.username,
          u.password,
          u.role,
          u.EmployeeId,
          u.profile,
          d.firstName,
          d.lastName,
          d.email,
          d.emailNotifications
        FROM userinfo u
        LEFT JOIN userdetails d ON u.id = d.id
        WHERE LOWER(d.email) = LOWER(@email)
      `);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: "User not found. Please sign up first." });
    }

    const user = userResult.recordset[0];

    // Verify the user was created via Google (password should be GOOGLE_SIGNIN)
    // If not, user exists but didn't use Google signup
    if (user.password !== "GOOGLE_SIGNIN") {
      console.log("⚠️ User exists but wasn't created via Google. Allowing login anyway.");
    }

    // Generate JWT token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    console.log("✅ Google Login successful for:", user.username);

    // Normalize emailNotifications
    const emailNotifications = normalizeEmailNotifications(user.emailNotifications);

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        EmployeeId: user.EmployeeId,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profile: user.profile || "",
        emailNotifications: emailNotifications
      }
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({
      error: "Error during Google login",
      details: error.message
    });
  }
});

module.exports = router;
