const { poolPromise, sql } = require("../../config/db");
const bcrypt = require('bcryptjs');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const currentUserRole = req.user.role;
    
    let query = `
      SELECT 
        id, username, email, firstName, lastName, phone, mobile, address,
        role, status, lastLogin, lastLogout, createdAt, updatedAt
      FROM Users
    `;
    
    // Non-admins can only see active users
    if (currentUserRole !== 'admin') {
      query += ` WHERE status = 'active'`;
    }
    
    query += ` ORDER BY createdAt DESC`;
    
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users", error });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  const userId = req.params.id;
  
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, userId)
      .query(`
        SELECT 
          id, username, email, firstName, lastName, phone, mobile, address,
          role, status, lastLogin, lastLogout, createdAt, updatedAt
        FROM Users
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const user = result.recordset[0];
    
    // Check permissions (only admin or same user can view)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: "Unauthorized to view this user" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error while fetching user", error });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    phone,
    mobile,
    address,
    role,
    status
  } = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if username or email already exists
    const existingUser = await pool.request()
      .input("username", sql.NVarChar, username)
      .input("email", sql.NVarChar, email)
      .query(`
        SELECT id FROM Users 
        WHERE username = @username OR email = @email
      `);
    
    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ message: "Username or email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .input("email", sql.NVarChar, email)
      .input("password", sql.NVarChar, hashedPassword)
      .input("firstName", sql.NVarChar, firstName)
      .input("lastName", sql.NVarChar, lastName)
      .input("phone", sql.NVarChar, phone || null)
      .input("mobile", sql.NVarChar, mobile || null)
      .input("address", sql.NVarChar, address || null)
      .input("role", sql.NVarChar, role || 'user')
      .input("status", sql.NVarChar, status || 'active')
      .input("createdBy", sql.Int, req.user.id)
      .query(`
        INSERT INTO Users (
          username, email, password, firstName, lastName, 
          phone, mobile, address, role, status, createdBy
        )
        VALUES (
          @username, @email, @password, @firstName, @lastName,
          @phone, @mobile, @address, @role, @status, @createdBy
        );
        SELECT SCOPE_IDENTITY() AS newId;
      `);
    
    const newId = result.recordset[0].newId;
    
    res.status(201).json({ 
      message: "User created successfully",
      userId: newId
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error while creating user", error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if user exists
    const userCheck = await pool.request()
      .input("id", sql.Int, userId)
      .query("SELECT id, role FROM Users WHERE id = @id");
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const existingUser = userCheck.recordset[0];
    
    // Check permissions (only admin or same user can update)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: "Unauthorized to update this user" });
    }
    
    // Non-admins can't change role or status
    if (req.user.role !== 'admin') {
      delete updates.role;
      delete updates.status;
    }
    
    // Build dynamic update query
    let updateFields = [];
    let inputs = [];
    
    Object.keys(updates).forEach((key, index) => {
      if (key !== 'id' && key !== 'password') {
        updateFields.push(`${key} = @${key}`);
        inputs.push({ name: key, type: getSqlType(updates[key]), value: updates[key] });
      }
    });
    
    // Handle password update separately
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updateFields.push("password = @password");
      inputs.push({ name: 'password', type: sql.NVarChar, value: hashedPassword });
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    
    const request = pool.request()
      .input("id", sql.Int, userId)
      .input("updatedBy", sql.Int, req.user.id);
    
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    await request.query(`
      UPDATE Users
      SET ${updateFields.join(', ')}, updatedAt = GETDATE(), updatedBy = @updatedBy
      WHERE id = @id
    `);
    
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error while updating user", error: error.message });
  }
};

// Delete user - HARD DELETE
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  
  try {
    const pool = await poolPromise;
    
    // Check if user exists
    const userCheck = await pool.request()
      .input("id", sql.Int, userId)
      .query("SELECT id, firstName, lastName FROM Users WHERE id = @id");
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userToDelete = userCheck.recordset[0];
    
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can delete users" });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    
    // Hard delete - completely remove the user from database
    await pool.request()
      .input("id", sql.Int, userId)
      .query(`DELETE FROM Users WHERE id = @id`);
    
    res.status(200).json({ 
      message: "User permanently deleted successfully",
      deletedUser: `${userToDelete.firstName} ${userToDelete.lastName}`
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user", error: error.message });
  }
};

// Helper function to determine SQL type
function getSqlType(value) {
  if (typeof value === 'string') {
    return sql.NVarChar;
  } else if (typeof value === 'number') {
    return Number.isInteger(value) ? sql.Int : sql.Decimal;
  } else if (value instanceof Date) {
    return sql.DateTime;
  } else if (typeof value === 'boolean') {
    return sql.Bit;
  }
  return sql.NVarChar;
}