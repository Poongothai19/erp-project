const { poolPromise, sql } = require("../../config/db");

// Update the getAllRecruiters function in recruiterController.js

exports.getAllRecruiters = async (req, res) => {
  try {
    const pool = await poolPromise;
    const currentUserRole = req.user.role;
    const currentUserId = req.user.userId;
    
    let query = `
      SELECT id, name, email, phone, specialization, isActive, role
      FROM Recruiters
      WHERE isActive = 1
    `;
    
    // Enhanced filtering logic
    if (currentUserRole === 'teamlead') {
      // Team leads can now see regular users AND other team leads (including themselves)
      query += ` AND role IN ('user', 'teamlead')`;
      // REMOVED: AND id != @currentUserId (to allow self-assignment)
    } else if (currentUserRole === 'manager' || currentUserRole === 'admin') {
      // Managers and admins can see all recruiters
      query += ` AND role IN ('user', 'teamlead')`;
    } else if (currentUserRole === 'user') {
      // Regular users should only see other regular users, not themselves
      query += ` AND role = 'user' AND id != @currentUserId`;
    }
    
    query += ` ORDER BY name`;
    
    const request = pool.request();
    
    // Add currentUserId parameter only for regular users
    if (currentUserRole === 'user') {
      request.input('currentUserId', sql.Int, currentUserId);
    }
    
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching recruiters:", error);
    res.status(500).json({ message: "Server error while fetching recruiters", error });
  }
};

exports.createRecruiter = async (req, res) => {
  const { name, email, phone, specialization } = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if email already exists
    const emailCheck = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM Recruiters WHERE email = @email");
    
    if (emailCheck.recordset.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }
    
    await pool.request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone)
      .input("specialization", sql.NVarChar, specialization)
      .query(`
        INSERT INTO Recruiters (name, email, phone, specialization)
        VALUES (@name, @email, @phone, @specialization)
      `);
    
    res.status(201).json({ message: "Recruiter created successfully" });
  } catch (error) {
    console.error("Error creating recruiter:", error);
    res.status(500).json({ message: "Server error while creating recruiter", error });
  }
};

exports.getRecruiterStats = async (req, res) => {
  const recruiterId = req.params.id;
  
  try {
    const pool = await poolPromise;
    
    // Get assigned roles count
    const rolesResult = await pool.request()
      .input("recruiterId", sql.Int, recruiterId)
      .query(`
        SELECT COUNT(*) AS assignedRoles
        FROM RecruitmentRoles
        WHERE recruiter = @recruiterId AND status = 'Active'
      `);
    
    // Get applications in progress
    const appsResult = await pool.request()
      .input("recruiterId", sql.Int, recruiterId)
      .query(`
        SELECT COUNT(DISTINCT a.id) AS activeApplications
        FROM Applications a
        JOIN RecruitmentRoles rr ON a.roleId = rr.id
        WHERE rr.recruiter = @recruiterId AND a.status NOT IN ('Hired', 'Rejected')
      `);
    
    // Get hired count
    const hiredResult = await pool.request()
      .input("recruiterId", sql.Int, recruiterId)
      .query(`
        SELECT COUNT(DISTINCT a.id) AS hiredCount
        FROM Applications a
        JOIN RecruitmentRoles rr ON a.roleId = rr.id
        WHERE rr.recruiter = @recruiterId AND a.status = 'Hired'
      `);
    
    res.status(200).json({
      assignedRoles: rolesResult.recordset[0].assignedRoles,
      activeApplications: appsResult.recordset[0].activeApplications,
      hiredCount: hiredResult.recordset[0].hiredCount
    });
  } catch (error) {
    console.error("Error fetching recruiter stats:", error);
    res.status(500).json({ message: "Server error while fetching stats", error });
  }
};