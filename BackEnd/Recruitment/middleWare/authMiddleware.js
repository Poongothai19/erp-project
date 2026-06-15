



// const jwt = require("jsonwebtoken");
// const { poolPromise, sql } = require("../../config/db");
// require("dotenv").config();

// exports.authenticateToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) {
//       console.log("❌ No token provided.");
//       return res.status(401).json({ error: "Access denied. No token provided." });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
//       if (err) {
//         console.error("❌ Token verification failed:", err.message);
//         return res.status(403).json({ error: "Invalid or expired token." });
//       }

//       try {
//         const pool = await poolPromise;
        
//         // Fetch FRESH user data from database
//         const result = await pool.request()
//           .input('userId', sql.Int, decoded.id || decoded.userId)
//           .query(`
//             SELECT 
//               u.id,
//               u.username,
//               u.role,
//               u.EmployeeId,
//               u.profile,
//               ud.firstName,
//               ud.lastName,
//               ud.email
//             FROM userinfo u
//             LEFT JOIN userdetails ud ON u.id = ud.id
//             WHERE u.id = @userId
//           `);
        
//         if (result.recordset.length === 0) {
//           return res.status(404).json({ error: 'User not found' });
//         }

//         const user = result.recordset[0];
        
//         console.log("✅ Token Verified. Extracted User:", {
//           id: user.id,
//           username: user.username,
//           role: user.role,
//           EmployeeId: user.EmployeeId
//         });
        
//         // Attach fresh user data to request with consistent structure
//         req.user = {
//           id: user.id,
//           userId: user.id,
//           username: user.username,
//           email: user.email,
//           role: user.role ? user.role.toLowerCase() : 'employee',
//           EmployeeId: user.EmployeeId,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           profile: user.profile
//         };
        
//         next();
//       } catch (dbError) {
//         console.error('❌ Database error in auth middleware:', dbError);
//         return res.status(500).json({ error: 'Database error during authentication' });
//       }
//     });
//   } catch (error) {
//     console.error('❌ Authentication error:', error);
//     return res.status(500).json({ error: 'Server error during authentication' });
//   }
// };

// // Optional: Role-based authorization middleware
// exports.authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({ error: "Authentication required" });
//     }
    
//     const userRole = req.user.role.toLowerCase();
//     const allowedRoles = roles.map(role => role.toLowerCase());
    
//     if (!allowedRoles.includes(userRole)) {
//       return res.status(403).json({ 
//         error: "Access denied. Insufficient permissions.",
//         required: roles,
//         current: req.user.role
//       });
//     }
    
//     next();
//   };
// };

// // Admin only middleware
// exports.adminOnly = (req, res, next) => {
//   if (!req.user || req.user.role !== 'admin') {
//     return res.status(403).json({ error: "Access denied. Admin role required." });
//   }
//   next();
// };

// // Manager and Admin middleware
// exports.managerOrAdmin = (req, res, next) => {
//   if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
//     return res.status(403).json({ error: "Access denied. Manager or Admin role required." });
//   }
//   next();
// };





// authMiddleware.js - CORRECTED VERSION
const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../../config/db");
require("dotenv").config();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      console.log("❌ No token provided.");
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error("❌ Token verification failed:", err.message);
        return res.status(403).json({ error: "Invalid or expired token." });
      }

      try {
        const pool = await poolPromise;
        
        // Fetch FRESH user data from database
        const result = await pool.request()
          .input('userId', sql.Int, decoded.id || decoded.userId)
          .query(`
            SELECT 
              u.id,
              u.username,
              u.role,
              u.EmployeeId,
              u.profile,
              ud.firstName,
              ud.lastName,
              ud.email
            FROM userinfo u
            LEFT JOIN userdetails ud ON u.id = ud.id
            WHERE u.id = @userId
          `);
        
        if (result.recordset.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = result.recordset[0];
        
        console.log("✅ Token Verified. Extracted User:", {
          id: user.id,
          username: user.username,
          role: user.role,
          EmployeeId: user.EmployeeId
        });
        
        // Attach fresh user data to request with consistent structure
        req.user = {
          id: user.id,
          userId: user.id, // For backward compatibility
          username: user.username,
          email: user.email,
          role: user.role ? user.role.toLowerCase() : 'employee', // Normalize role
          EmployeeId: user.EmployeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          profile: user.profile
        };
        
        next();
      } catch (dbError) {
        console.error('❌ Database error in auth middleware:', dbError);
        return res.status(500).json({ error: 'Database error during authentication' });
      }
    });
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
};

// Optional: Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(role => role.toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Access denied. Insufficient permissions.",
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Admin or Super Admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied. Admin or Super Admin role required." });
  }
  next();
};

// Manager, Admin and Super Admin middleware
const managerOrAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'manager', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied. Manager, Admin or Super Admin role required." });
  }
  next();
};

module.exports = { 
  authenticateToken, 
  authenticate: authenticateToken, // Compatibility alias
  authMiddleware: authenticateToken, // Compatibility alias
  authorizeRoles, 
  adminOnly, 
  managerOrAdmin 
};