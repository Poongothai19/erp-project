// controllers/candidateController.js - WITH FULL RESUME UPLOAD
const sql = require('mssql');
const { dbConfig } = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Helper functions for priority conversion
const getPriorityValue = (priorityText) => {
  if (typeof priorityText === 'number') return priorityText;
  if (typeof priorityText === 'string') {
    const priority = priorityText.trim();
    switch (priority) {
      case 'High': return 1;
      case 'Medium': return 2;
      case 'Low': return 3;
      default: return 2;
    }
  }
  return 2;
};

const getPriorityText = (priorityValue) => {
  const priority = typeof priorityValue === 'string' ? parseInt(priorityValue) : priorityValue;
  switch (priority) {
    case 1: return 'High';
    case 2: return 'Medium';
    case 3: return 'Low';
    default: return 'Medium';
  }
};

const candidateController = {
  testConnection: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const result = await sql.query('SELECT 1 as test');
      res.json({
        success: true,
        message: 'Database connection successful',
        data: result.recordset
      });
    } catch (error) {
      console.error('Database connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      });
    }
  },

  getAllCandidates: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { name, skills, experience, location, priority, status } = req.query;
      
      console.log('Get candidates query parameters:', req.query);
      
      // Don't select the Resume binary data in list view for performance
      let query = 'SELECT Id, Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, ResumeFileName, ResumeContentType, CreatedAt, UpdatedAt FROM Candidates WHERE 1=1';
      let inputs = [];
      
      if (name && name.trim()) {
        query += ' AND Name LIKE @name';
        inputs.push({ name: 'name', type: sql.NVarChar, value: `%${name.trim()}%` });
      }
      
      if (skills && skills.trim()) {
        query += ' AND Skills LIKE @skills';
        inputs.push({ name: 'skills', type: sql.NVarChar, value: `%${skills.trim()}%` });
      }
      
      if (experience && !isNaN(experience)) {
        query += ' AND Experience >= @experience';
        inputs.push({ name: 'experience', type: sql.Int, value: parseInt(experience) });
      }
      
      if (location && location.trim()) {
        query += ' AND Location LIKE @location';
        inputs.push({ name: 'location', type: sql.NVarChar, value: `%${location.trim()}%` });
      }
      
      if (priority && priority.trim()) {
        const priorityValue = getPriorityValue(priority.trim());
        query += ' AND Priority = @priority';
        inputs.push({ name: 'priority', type: sql.Int, value: priorityValue });
      }
      
      if (status && status.trim()) {
        query += ' AND Status = @status';
        inputs.push({ name: 'status', type: sql.NVarChar, value: status.trim() });
      }
      
      query += ' ORDER BY CreatedAt DESC';
      
      const request = new sql.Request();
      inputs.forEach(input => {
        request.input(input.name, input.type, input.value);
      });
      
      const result = await request.query(query);
      
      // Add Resume field with filename for frontend compatibility
      const candidates = result.recordset.map(candidate => ({
        ...candidate,
        Resume: candidate.ResumeFileName // For frontend compatibility
      }));
      
      res.json({
        success: true,
        data: candidates,
        count: candidates.length,
        filters: { name, skills, experience, location, priority, status }
      });
    } catch (error) {
      console.error('Get all candidates error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving candidates', 
        error: error.message 
      });
    }
  },

  searchByName: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { name } = req.query;
      
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name parameter is required and cannot be empty'
        });
      }
      
      const request = new sql.Request();
      request.input('name', sql.NVarChar, `%${name.trim()}%`);
      
      const result = await request.query(`
        SELECT Id, Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, ResumeFileName, ResumeContentType, CreatedAt, UpdatedAt
        FROM Candidates 
        WHERE Name LIKE @name 
        ORDER BY Name ASC
      `);
      
      const candidates = result.recordset.map(candidate => ({
        ...candidate,
        Resume: candidate.ResumeFileName
      }));
      
      res.json({
        success: true,
        data: candidates,
        count: candidates.length,
        searchTerm: name.trim()
      });
    } catch (error) {
      console.error('Search by name error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error searching candidates by name', 
        error: error.message 
      });
    }
  },

  getCandidateById: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      
      // Don't include Resume binary data unless specifically needed
      const result = await request.query('SELECT Id, Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, ResumeFileName, ResumeContentType, CreatedAt, UpdatedAt FROM Candidates WHERE Id = @id');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Candidate not found' 
        });
      }
      
      const candidate = {
        ...result.recordset[0],
        Resume: result.recordset[0].ResumeFileName
      };
      
      res.json({
        success: true,
        data: candidate
      });
    } catch (error) {
      console.error('Get candidate by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving candidate', 
        error: error.message 
      });
    }
  },

  createCandidate: async (req, res) => {
    try {
      console.log('=== CREATE CANDIDATE DEBUG ===');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file ? req.file.filename : 'No file');
      
      await sql.connect(dbConfig);
      
      const {
        name, Name,
        email, Email, 
        phone, Phone,
        skills, Skills,
        experience, Experience,
        location, Location,
        priority, Priority,
        visaStatus, VisaStatus,
        status, Status
      } = req.body;

      const candidateData = {
        name: Name || name,
        email: Email || email,
        phone: Phone || phone,
        skills: Skills || skills,
        experience: Experience || experience,
        location: Location || location,
        priority: Priority || priority,
        visaStatus: VisaStatus || visaStatus,
        status: Status || status || 'Available'
      };

      // Validate required fields
      if (!candidateData.name || !candidateData.email || !candidateData.phone || 
          !candidateData.skills || !candidateData.experience || !candidateData.location || 
          !candidateData.priority || !candidateData.visaStatus) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided'
        });
      }

      // Check if email already exists
      const checkRequest = new sql.Request();
      checkRequest.input('email', sql.NVarChar, candidateData.email);
      const checkResult = await checkRequest.query('SELECT Id FROM Candidates WHERE Email = @email');
      
      if (checkResult.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Candidate with this email already exists'
        });
      }
      
      const priorityValue = getPriorityValue(candidateData.priority);
      
      const request = new sql.Request();
      request.input('name', sql.NVarChar, candidateData.name);
      request.input('email', sql.NVarChar, candidateData.email);
      request.input('phone', sql.NVarChar, candidateData.phone);
      const skillsString = Array.isArray(candidateData.skills) ? candidateData.skills.join(', ') : candidateData.skills;
      request.input('skills', sql.NVarChar, skillsString);
      request.input('experience', sql.Int, parseInt(candidateData.experience));
      request.input('location', sql.NVarChar, candidateData.location);
      request.input('priority', sql.Int, priorityValue);
      request.input('visaStatus', sql.NVarChar, candidateData.visaStatus);
      request.input('status', sql.NVarChar, candidateData.status);
      
      // FIXED: Store complete resume file as binary
      let resumeBuffer = null;
      let resumeFileName = null;
      let resumeContentType = null;
      
      if (req.file) {
        const filePath = req.file.path;
        resumeBuffer = fs.readFileSync(filePath);
        resumeFileName = req.file.originalname;
        resumeContentType = req.file.mimetype;
        
        // Delete the temporary file after reading
        fs.unlinkSync(filePath);
        
        console.log('Resume uploaded:', resumeFileName, 'Size:', resumeBuffer.length, 'bytes');
      }
      
      request.input('resume', sql.VarBinary, resumeBuffer);
      request.input('resumeFileName', sql.NVarChar, resumeFileName);
      request.input('resumeContentType', sql.NVarChar, resumeContentType);
      
      const insertQuery = `
        INSERT INTO Candidates (Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, Resume, ResumeFileName, ResumeContentType)
        OUTPUT INSERTED.Id, INSERTED.Priority
        VALUES (@name, @email, @phone, @skills, @experience, @location, @priority, @visaStatus, @status, @resume, @resumeFileName, @resumeContentType)
      `;
      
      const result = await request.query(insertQuery);
      const candidateId = result.recordset[0].Id;
      
      // Get the created candidate
      const getRequest = new sql.Request();
      getRequest.input('id', sql.Int, candidateId);
      const getResult = await getRequest.query('SELECT Id, Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, ResumeFileName, ResumeContentType, CreatedAt, UpdatedAt FROM Candidates WHERE Id = @id');
      
      const createdCandidate = {
        ...getResult.recordset[0],
        Resume: getResult.recordset[0].ResumeFileName
      };
      
      res.status(201).json({
        success: true,
        message: 'Candidate created successfully',
        data: createdCandidate
      });
    } catch (error) {
      console.error('Create candidate error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating candidate: ' + error.message, 
        error: error.message
      });
    }
  },

  updateCandidate: async (req, res) => {
    try {
      console.log('=== UPDATE CANDIDATE DEBUG ===');
      
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const {
        name, Name,
        email, Email, 
        phone, Phone,
        skills, Skills,
        experience, Experience,
        location, Location,
        priority, Priority,
        visaStatus, VisaStatus,
        status, Status
      } = req.body;

      const candidateData = {
        name: Name || name,
        email: Email || email,
        phone: Phone || phone,
        skills: Skills || skills,
        experience: Experience || experience,
        location: Location || location,
        priority: Priority || priority,
        visaStatus: VisaStatus || visaStatus,
        status: Status || status
      };
      
      // Check if candidate exists
      const currentRequest = new sql.Request();
      currentRequest.input('id', sql.Int, id);
      const currentResult = await currentRequest.query('SELECT Id FROM Candidates WHERE Id = @id');
      
      if (currentResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Candidate not found' 
        });
      }
      
      const priorityValue = getPriorityValue(candidateData.priority);
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      request.input('name', sql.NVarChar, candidateData.name);
      request.input('email', sql.NVarChar, candidateData.email);
      request.input('phone', sql.NVarChar, candidateData.phone);
      request.input('skills', sql.NVarChar, Array.isArray(candidateData.skills) ? candidateData.skills.join(', ') : candidateData.skills);
      request.input('experience', sql.Int, parseInt(candidateData.experience));
      request.input('location', sql.NVarChar, candidateData.location);
      request.input('priority', sql.Int, priorityValue);
      request.input('visaStatus', sql.NVarChar, candidateData.visaStatus);
      request.input('status', sql.NVarChar, candidateData.status);
      request.input('updatedAt', sql.DateTime, new Date());
      
      let updateQuery = `
        UPDATE Candidates 
        SET Name = @name, Email = @email, Phone = @phone, Skills = @skills, 
            Experience = @experience, Location = @location, Priority = @priority, 
            VisaStatus = @visaStatus, Status = @status, UpdatedAt = @updatedAt
      `;
      
      // FIXED: Update resume if new file uploaded
      if (req.file) {
        const filePath = req.file.path;
        const resumeBuffer = fs.readFileSync(filePath);
        const resumeFileName = req.file.originalname;
        const resumeContentType = req.file.mimetype;
        
        // Delete temporary file
        fs.unlinkSync(filePath);
        
        request.input('resume', sql.VarBinary, resumeBuffer);
        request.input('resumeFileName', sql.NVarChar, resumeFileName);
        request.input('resumeContentType', sql.NVarChar, resumeContentType);
        
        updateQuery += `, Resume = @resume, ResumeFileName = @resumeFileName, ResumeContentType = @resumeContentType`;
      }
      
      updateQuery += ` WHERE Id = @id`;
      
      await request.query(updateQuery);
      
      // Get the updated candidate
      const getRequest = new sql.Request();
      getRequest.input('id', sql.Int, id);
      const getResult = await getRequest.query('SELECT Id, Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, ResumeFileName, ResumeContentType, CreatedAt, UpdatedAt FROM Candidates WHERE Id = @id');
      
      const updatedCandidate = {
        ...getResult.recordset[0],
        Resume: getResult.recordset[0].ResumeFileName
      };
      
      res.json({
        success: true,
        message: 'Candidate updated successfully',
        data: updatedCandidate
      });
    } catch (error) {
      console.error('Update candidate error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating candidate: ' + error.message, 
        error: error.message 
      });
    }
  },

  deleteCandidate: async (req, res) => {
    try {
      console.log('=== DELETE CANDIDATE DEBUG ===');
      
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid candidate ID provided'
        });
      }
      
      const candidateId = parseInt(id);
      
      const getRequest = new sql.Request();
      getRequest.input('id', sql.Int, candidateId);
      const getResult = await getRequest.query('SELECT Id, Name FROM Candidates WHERE Id = @id');
      
      if (getResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Candidate not found' 
        });
      }
      
      const candidate = getResult.recordset[0];
      
      // Delete from database (resume is deleted automatically)
      const deleteRequest = new sql.Request();
      deleteRequest.input('id', sql.Int, candidateId);
      const deleteResult = await deleteRequest.query('DELETE FROM Candidates WHERE Id = @id');
      
      if (deleteResult.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Candidate not found or already deleted' 
        });
      }
      
      res.json({
        success: true,
        message: 'Candidate deleted successfully',
        deletedCandidate: {
          id: candidateId,
          name: candidate.Name
        }
      });
      
    } catch (error) {
      console.error('Delete candidate error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting candidate: ' + error.message, 
        error: error.message
      });
    }
  },

downloadResume: async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== DOWNLOAD RESUME DEBUG ===');
    console.log('Candidate ID:', id);
    
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('id', sql.Int, id);
    
    const result = await request.query('SELECT Resume, ResumeFileName, ResumeContentType, Name FROM Candidates WHERE Id = @id');
    
    if (result.recordset.length === 0 || !result.recordset[0].Resume) {
      console.log('Resume not found for candidate ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    const resume = result.recordset[0].Resume;
    let fileName = result.recordset[0].ResumeFileName;
    const storedContentType = result.recordset[0].ResumeContentType;
    const candidateName = result.recordset[0].Name;
    
    // Read file signature to determine actual file type
    const firstFourBytes = resume.slice(0, 4);
    const signature = firstFourBytes.toString('hex').toUpperCase();
    
    console.log('File analysis:', {
      originalFileName: fileName,
      storedContentType: storedContentType,
      fileSignature: signature,
      fileSize: resume.length
    });
    
    // Determine actual content type and extension from file signature
    let contentType;
    let fileExtension;
    
    if (signature.startsWith('504B0304')) {
      // DOCX file (ZIP-based format)
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = '.docx';
      console.log('Detected: DOCX file');
    } else if (signature.startsWith('D0CF11E0')) {
      // DOC file (older Word format)
      contentType = 'application/msword';
      fileExtension = '.doc';
      console.log('Detected: DOC file');
    } else if (signature.startsWith('25504446')) {
      // PDF file
      contentType = 'application/pdf';
      fileExtension = '.pdf';
      console.log('Detected: PDF file');
    } else {
      // Fallback to stored content type
      console.warn('Unknown file signature, using stored content type');
      contentType = storedContentType || 'application/octet-stream';
      fileExtension = fileName ? ('.' + fileName.split('.').pop()) : '';
    }
    
    // Ensure filename has correct extension
    if (fileName) {
      // Remove existing extension and add correct one
      const baseFileName = fileName.replace(/\.[^.]+$/, '');
      fileName = baseFileName + fileExtension;
    } else {
      // Create filename from candidate name if missing
      fileName = `${candidateName.replace(/\s+/g, '_')}_resume${fileExtension}`;
    }
    
    console.log('Serving file:', {
      fileName: fileName,
      contentType: contentType,
      size: resume.length
    });
    
    // Set response headers - CRITICAL for correct download behavior
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', resume.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the file
    res.send(Buffer.from(resume));
    console.log('✓ File download initiated successfully');
    
  } catch (error) {
    console.error('Download resume error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Error downloading resume', 
        error: error.message 
      });
    }
  }
},

// Add this to your candidateController.js for debugging
getDiagnostics: async (req, res) => {
  try {
    const { id } = req.params;
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('id', sql.Int, id);
    
    const result = await request.query(`
      SELECT 
        Id,
        Name,
        ResumeFileName,
        ResumeContentType,
        DATALENGTH(Resume) as ResumeSize,
        CONVERT(VARCHAR(MAX), CONVERT(VARBINARY(8), SUBSTRING(Resume, 1, 8)), 2) as FileSignature,
        CASE 
          WHEN CONVERT(VARBINARY(4), SUBSTRING(Resume, 1, 4)) = 0x504B0304 THEN 'DOCX/ZIP'
          WHEN CONVERT(VARBINARY(4), SUBSTRING(Resume, 1, 4)) = 0x25504446 THEN 'PDF'
          WHEN CONVERT(VARBINARY(8), SUBSTRING(Resume, 1, 8)) = 0xD0CF11E0A1B11AE1 THEN 'DOC'
          ELSE 'Unknown'
        END as DetectedType
      FROM Candidates 
      WHERE Id = @id
    `);
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
},

  searchBySkills: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { skills } = req.query;
      
      if (!skills) {
        return res.status(400).json({
          success: false,
          message: 'Skills parameter is required'
        });
      }
      
      const request = new sql.Request();
      request.input('skills', sql.NVarChar, `%${skills}%`);
      
      const result = await request.query(`
        SELECT Id, Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, ResumeFileName, ResumeContentType, CreatedAt, UpdatedAt
        FROM Candidates 
        WHERE Skills LIKE @skills 
        ORDER BY Experience DESC
      `);
      
      const candidates = result.recordset.map(candidate => ({
        ...candidate,
        Resume: candidate.ResumeFileName
      }));
      
      res.json({
        success: true,
        data: candidates,
        count: candidates.length
      });
    } catch (error) {
      console.error('Search by skills error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error searching candidates', 
        error: error.message 
      });
    }
  },

  getAvailableCandidates: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      
      const request = new sql.Request();
      request.input('status', sql.NVarChar, 'Available');
      
      const result = await request.query(`
        SELECT Id, Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, ResumeFileName, ResumeContentType, CreatedAt, UpdatedAt
        FROM Candidates 
        WHERE Status = @status 
        ORDER BY CreatedAt DESC
      `);
      
      const candidates = result.recordset.map(candidate => ({
        ...candidate,
        Resume: candidate.ResumeFileName
      }));
      
      res.json({
        success: true,
        data: candidates,
        count: candidates.length
      });
    } catch (error) {
      console.error('Get available candidates error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving available candidates', 
        error: error.message 
      });
    }
  },

  getCandidatesByPriority: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { priority } = req.params;
      
      if (!['High', 'Medium', 'Low'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority. Must be High, Medium, or Low'
        });
      }
      
      const priorityValue = getPriorityValue(priority);
      
      const request = new sql.Request();
      request.input('priority', sql.Int, priorityValue);
      
      const result = await request.query(`
        SELECT Id, Name, Email, Phone, Skills, Experience, Location, Priority, VisaStatus, Status, ResumeFileName, ResumeContentType, CreatedAt, UpdatedAt
        FROM Candidates 
        WHERE Priority = @priority 
        ORDER BY CreatedAt DESC
      `);
      
      const candidates = result.recordset.map(candidate => ({
        ...candidate,
        Resume: candidate.ResumeFileName
      }));
      
      res.json({
        success: true,
        data: candidates,
        count: candidates.length
      });
    } catch (error) {
      console.error('Get candidates by priority error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving candidates by priority', 
        error: error.message 
      });
    }
  }
};

module.exports = candidateController;