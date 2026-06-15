// controllers/requirementController.js
const sql = require('mssql');
// Update this path to match your actual config location
const { dbConfig } = require('../../config/db'); // Changed from '../config/db' to '../../config/db'

const requirementController = {
  // Get all requirements
  getAllRequirements: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      
      const request = pool.request();
      const result = await request.query(`
        SELECT * FROM Requirements 
        ORDER BY CreatedAt DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get all requirements error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving requirements', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Get single requirement by ID
  getRequirementById: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = pool.request();
      request.input('id', sql.Int, id);
      
      const result = await request.query('SELECT * FROM Requirements WHERE Id = @id');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Requirement not found' 
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('Get requirement by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving requirement', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Create new requirement - FIXED VERSION
  createRequirement: async (req, res) => {
    let pool;
    try {
      console.log('Create requirement request body:', req.body);
      
      pool = await sql.connect(dbConfig);
      const {
        jobTitle, skills, client, location, rate, duration,
        status = 'Open', jobDescription, experience, jobType, priority = 'Medium'
      } = req.body;

      // Validate required fields
      if (!jobTitle || !skills || !client || !location || !rate || !duration || !experience || !jobType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields. Please provide: jobTitle, skills, client, location, rate, duration, experience, jobType'
        });
      }
      
      const request = pool.request();
      request.input('jobTitle', sql.NVarChar(255), jobTitle);
      request.input('skills', sql.NVarChar(1000), Array.isArray(skills) ? skills.join(', ') : skills);
      request.input('client', sql.NVarChar(255), client);
      request.input('location', sql.NVarChar(255), location);
      request.input('rate', sql.NVarChar(100), rate);
      request.input('duration', sql.NVarChar(100), duration);
      request.input('status', sql.NVarChar(50), status);
      request.input('jobDescription', sql.NText, jobDescription || '');
      request.input('experience', sql.NVarChar(100), experience);
      request.input('jobType', sql.NVarChar(100), jobType);
      request.input('priority', sql.NVarChar(50), priority);
      request.input('createdAt', sql.DateTime, new Date());
      request.input('updatedAt', sql.DateTime, new Date());
      
      const result = await request.query(`
        INSERT INTO Requirements (
          JobTitle, Skills, Client, Location, Rate, Duration, 
          Status, JobDescription, Experience, JobType, Priority,
          CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.Id
        VALUES (
          @jobTitle, @skills, @client, @location, @rate, @duration, 
          @status, @jobDescription, @experience, @jobType, @priority,
          @createdAt, @updatedAt
        )
      `);
      
      const requirementId = result.recordset[0].Id;
      console.log('Created requirement with ID:', requirementId);
      
      // Get the created requirement
      const getRequest = pool.request();
      getRequest.input('id', sql.Int, requirementId);
      const getResult = await getRequest.query('SELECT * FROM Requirements WHERE Id = @id');
      
      res.status(201).json({
        success: true,
        message: 'Requirement created successfully',
        data: getResult.recordset[0]
      });
    } catch (error) {
      console.error('Create requirement error:', {
        message: error.message,
        stack: error.stack,
        number: error.number,
        code: error.code
      });
      
      // Handle specific SQL Server errors
      let errorMessage = 'Error creating requirement';
      if (error.number === 2) {
        errorMessage = 'Database connection failed';
      } else if (error.number === 515) {
        errorMessage = 'Required field is missing or null';
      } else if (error.number === 8152) {
        errorMessage = 'Data too long for field';
      }
      
      res.status(500).json({ 
        success: false, 
        message: errorMessage, 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error closing pool:', closeError);
        }
      }
    }
  },

  // Update requirement
  updateRequirement: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { id } = req.params;
      const {
        jobTitle, skills, client, location, rate, duration,
        status, jobDescription, experience, jobType, priority
      } = req.body;
      
      const request = pool.request();
      request.input('id', sql.Int, id);
      request.input('jobTitle', sql.NVarChar(255), jobTitle);
      request.input('skills', sql.NVarChar(1000), Array.isArray(skills) ? skills.join(', ') : skills);
      request.input('client', sql.NVarChar(255), client);
      request.input('location', sql.NVarChar(255), location);
      request.input('rate', sql.NVarChar(100), rate);
      request.input('duration', sql.NVarChar(100), duration);
      request.input('status', sql.NVarChar(50), status);
      request.input('jobDescription', sql.NText, jobDescription);
      request.input('experience', sql.NVarChar(100), experience);
      request.input('jobType', sql.NVarChar(100), jobType);
      request.input('priority', sql.NVarChar(50), priority);
      request.input('updatedAt', sql.DateTime, new Date());
      
      const result = await request.query(`
        UPDATE Requirements 
        SET JobTitle = @jobTitle, Skills = @skills, Client = @client, Location = @location, 
            Rate = @rate, Duration = @duration, Status = @status, JobDescription = @jobDescription,
            Experience = @experience, JobType = @jobType, Priority = @priority, UpdatedAt = @updatedAt
        WHERE Id = @id
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Requirement not found' 
        });
      }
      
      // Get the updated requirement
      const getRequest = pool.request();
      getRequest.input('id', sql.Int, id);
      const getResult = await getRequest.query('SELECT * FROM Requirements WHERE Id = @id');
      
      res.json({
        success: true,
        message: 'Requirement updated successfully',
        data: getResult.recordset[0]
      });
    } catch (error) {
      console.error('Update requirement error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating requirement', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Delete requirement
  deleteRequirement: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { id } = req.params;
      
      // Check if requirement has any submissions
      const checkRequest = pool.request();
      checkRequest.input('requirementId', sql.Int, id);
      const checkResult = await checkRequest.query(`
        SELECT COUNT(*) as SubmissionCount 
        FROM Submissions 
        WHERE RequirementId = @requirementId
      `);
      
      if (checkResult.recordset[0].SubmissionCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete requirement with existing submissions. Please update status instead.'
        });
      }
      
      const request = pool.request();
      request.input('id', sql.Int, id);
      
      const result = await request.query('DELETE FROM Requirements WHERE Id = @id');
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Requirement not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Requirement deleted successfully'
      });
    } catch (error) {
      console.error('Delete requirement error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting requirement', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Find matching candidates for a requirement
  findMatchingCandidates: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { id } = req.params;
      
      // Get requirement details
      const reqRequest = pool.request();
      reqRequest.input('id', sql.Int, id);
      const reqResult = await reqRequest.query('SELECT * FROM Requirements WHERE Id = @id');
      
      if (reqResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Requirement not found' 
        });
      }
      
      const requirement = reqResult.recordset[0];
      const requiredSkills = requirement.Skills.split(',').map(skill => skill.trim().toLowerCase());
      
      // Find matching candidates - adjust table name if different
      const candRequest = pool.request();
      candRequest.input('status', sql.NVarChar, 'Available');
      
      // Try different possible candidate table names
      let candidateQuery = `
        SELECT * FROM Candidates 
        WHERE Status = @status 
        ORDER BY Experience DESC
      `;
      
      let candResult;
      try {
        candResult = await candRequest.query(candidateQuery);
      } catch (tableError) {
        // If Candidates table doesn't exist, try Resume_Submission or other tables
        try {
          candidateQuery = `
            SELECT Resume_ID as Id, FirstName + ' ' + LastName as Name, EmailID as Email, 
                   Skills, Experience, CurrentLocation as Location, Status, Availability
            FROM Resume_Submission 
            ORDER BY Experience DESC
          `;
          candResult = await candRequest.query(candidateQuery);
        } catch (resumeError) {
          // Return empty result if no candidate tables found
          return res.json({
            success: true,
            requirement: {
              id: requirement.Id,
              jobTitle: requirement.JobTitle,
              skills: requirement.Skills.split(',').map(skill => skill.trim()),
              experience: requirement.Experience,
              location: requirement.Location,
              priority: requirement.Priority
            },
            matchedCandidates: [],
            count: 0,
            message: 'No candidate data available'
          });
        }
      }
      
      // Calculate match scores
      const matchedCandidates = candResult.recordset.map(candidate => {
        const candidateSkills = (candidate.Skills || '').split(',').map(skill => skill.trim().toLowerCase());
        
        // Calculate skill match percentage
        const matchingSkills = requiredSkills.filter(reqSkill => 
          candidateSkills.some(candSkill => 
            candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
          )
        );
        
        // Base match score on skill overlap
        let matchScore = Math.round((matchingSkills.length / requiredSkills.length) * 100);
        
        // Bonus points for experience alignment
        const experienceMatch = requirement.Experience.toLowerCase();
        const candExp = candidate.Experience || 0;
        if (experienceMatch.includes('0-2') && candExp <= 2) matchScore += 5;
        else if (experienceMatch.includes('2-4') && candExp >= 2 && candExp <= 4) matchScore += 5;
        else if (experienceMatch.includes('3-5') && candExp >= 3 && candExp <= 5) matchScore += 5;
        else if (experienceMatch.includes('5-7') && candExp >= 5 && candExp <= 7) matchScore += 5;
        else if (experienceMatch.includes('7-10') && candExp >= 7 && candExp <= 10) matchScore += 5;
        else if (experienceMatch.includes('10+') && candExp >= 10) matchScore += 5;
        
        // Location bonus (exact match or remote)
        if (requirement.Location.toLowerCase().includes('remote') || 
            (candidate.Location || '').toLowerCase() === requirement.Location.toLowerCase()) {
          matchScore += 3;
        }
        
        // Cap at 100
        matchScore = Math.min(matchScore, 100);
        
        return {
          id: candidate.Id || candidate.Resume_ID,
          name: candidate.Name || `${candidate.FirstName} ${candidate.LastName}`,
          email: candidate.Email || candidate.EmailID,
          skills: candidateSkills,
          experience: candExp,
          location: candidate.Location || candidate.CurrentLocation,
          availability: candidate.Availability,
          visaStatus: candidate.VisaStatus,
          matchScore: matchScore,
          matchingSkills: matchingSkills
        };
      }).filter(candidate => candidate.matchScore >= 25) // Only show candidates with 25%+ match
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15); // Top 15 matches
      
      res.json({
        success: true,
        requirement: {
          id: requirement.Id,
          jobTitle: requirement.JobTitle,
          skills: requirement.Skills.split(',').map(skill => skill.trim()),
          experience: requirement.Experience,
          location: requirement.Location,
          priority: requirement.Priority
        },
        matchedCandidates: matchedCandidates,
        count: matchedCandidates.length
      });
    } catch (error) {
      console.error('Find matching candidates error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error finding matching candidates', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Get requirements by status
  getRequirementsByStatus: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { status } = req.params;
      
      const request = pool.request();
      request.input('status', sql.NVarChar, status);
      
      const result = await request.query(`
        SELECT * FROM Requirements 
        WHERE Status = @status 
        ORDER BY Priority DESC, CreatedAt DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get requirements by status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving requirements', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Get requirements with submission counts
  getRequirementsWithStats: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      
      const request = pool.request();
      const result = await request.query(`
        SELECT r.*, 
               COALESCE(s.SubmissionCount, 0) as SubmissionCount,
               COALESCE(s.InterviewCount, 0) as InterviewCount,
               COALESCE(s.SelectedCount, 0) as SelectedCount
        FROM Requirements r
        LEFT JOIN (
          SELECT RequirementId, 
                 COUNT(*) as SubmissionCount,
                 COUNT(CASE WHEN Status IN ('Interview Scheduled', 'Selected', 'Joined') THEN 1 END) as InterviewCount,
                 COUNT(CASE WHEN Status IN ('Selected', 'Joined') THEN 1 END) as SelectedCount
          FROM Submissions 
          GROUP BY RequirementId
        ) s ON r.Id = s.RequirementId
        ORDER BY r.Priority DESC, r.CreatedAt DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get requirements with stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving requirements with statistics', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Update requirement status only
  updateRequirementStatus: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['Open', 'In Progress', 'On Hold', 'Closed', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ')
        });
      }
      
      const request = pool.request();
      request.input('id', sql.Int, id);
      request.input('status', sql.NVarChar, status);
      request.input('updatedAt', sql.DateTime, new Date());
      
      const result = await request.query(`
        UPDATE Requirements 
        SET Status = @status, UpdatedAt = @updatedAt
        WHERE Id = @id
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Requirement not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Requirement status updated successfully'
      });
    } catch (error) {
      console.error('Update requirement status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating requirement status', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Search requirements by skills or client
  searchRequirements: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const { query, status = 'Open' } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      const request = pool.request();
      request.input('searchQuery', sql.NVarChar, `%${query}%`);
      request.input('status', sql.NVarChar, status);
      
      const result = await request.query(`
        SELECT * FROM Requirements 
        WHERE (Skills LIKE @searchQuery 
               OR JobTitle LIKE @searchQuery 
               OR Client LIKE @searchQuery)
        AND Status = @status
        ORDER BY Priority DESC, CreatedAt DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length,
        searchQuery: query
      });
    } catch (error) {
      console.error('Search requirements error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error searching requirements', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  },

  // Get requirements summary by client
  getRequirementsSummaryByClient: async (req, res) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      
      const request = pool.request();
      const result = await request.query(`
        SELECT Client,
               COUNT(*) as TotalRequirements,
               COUNT(CASE WHEN Status = 'Open' THEN 1 END) as OpenRequirements,
               COUNT(CASE WHEN Status = 'Closed' THEN 1 END) as ClosedRequirements,
               COUNT(CASE WHEN Status = 'In Progress' THEN 1 END) as InProgressRequirements
        FROM Requirements 
        GROUP BY Client
        ORDER BY TotalRequirements DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      console.error('Get requirements summary by client error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving requirements summary', 
        error: error.message 
      });
    } finally {
      if (pool) pool.close();
    }
  }
};

module.exports = requirementController;