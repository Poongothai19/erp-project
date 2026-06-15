// Bench_Sales/controllers/submissionController.js
const sql = require('mssql');
const { dbConfig } = require('../../config/db');

const submissionController = {
  // Get all submissions with candidate and requirement details
  getAllSubmissions: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      
      const request = new sql.Request();
      const result = await request.query(`
        SELECT s.*, 
               c.Name as CandidateName, c.Skills as CandidateSkills, c.Email as CandidateEmail, c.Phone as CandidatePhone,
               r.JobTitle, r.Client, r.Location, r.Rate, r.Duration, r.Experience, r.JobType, r.Priority,
               v.Name as VendorName
        FROM Submissions s
        LEFT JOIN Candidates c ON s.CandidateId = c.Id
        LEFT JOIN Requirements r ON s.RequirementId = r.Id
        LEFT JOIN Vendors v ON s.VendorId = v.Id
        ORDER BY s.CreatedAt DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get all submissions error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving submissions', 
        error: error.message 
      });
    }
  },

  // Get single submission by ID
  getSubmissionById: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      
      const result = await request.query(`
        SELECT s.*, 
               c.Name as CandidateName, c.Skills as CandidateSkills, c.Email as CandidateEmail, c.Phone as CandidatePhone,
               r.JobTitle, r.Client, r.Location, r.Rate, r.Duration, r.Experience, r.JobType, r.Priority, r.Skills as RequiredSkills,
               v.Name as VendorName
        FROM Submissions s
        LEFT JOIN Candidates c ON s.CandidateId = c.Id
        LEFT JOIN Requirements r ON s.RequirementId = r.Id
        LEFT JOIN Vendors v ON s.VendorId = v.Id
        WHERE s.Id = @id
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Submission not found' 
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      console.error('Get submission by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving submission', 
        error: error.message 
      });
    }
  },

  // Create new submission
  createSubmission: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const {
        candidateId, requirementId, vendorId, status = 'Submitted',
        response, nextStep, interviewDate, feedbackNotes
      } = req.body;
      
      const request = new sql.Request();
      request.input('candidateId', sql.Int, candidateId);
      request.input('requirementId', sql.Int, requirementId);
      request.input('vendorId', sql.Int, vendorId);
      request.input('status', sql.NVarChar, status);
      request.input('response', sql.NVarChar, response || 'Waiting');
      request.input('nextStep', sql.DateTime, nextStep ? new Date(nextStep) : null);
      request.input('interviewDate', sql.DateTime, interviewDate ? new Date(interviewDate) : null);
      request.input('feedbackNotes', sql.NText, feedbackNotes);
      
      const result = await request.query(`
        INSERT INTO Submissions (CandidateId, RequirementId, VendorId, Status, Response, NextStep, InterviewDate, FeedbackNotes)
        OUTPUT INSERTED.Id
        VALUES (@candidateId, @requirementId, @vendorId, @status, @response, @nextStep, @interviewDate, @feedbackNotes)
      `);
      
      const submissionId = result.recordset[0].Id;
      
      // Get the created submission with related data
      const getRequest = new sql.Request();
      getRequest.input('id', sql.Int, submissionId);
      const getResult = await getRequest.query(`
        SELECT s.*, 
               c.Name as CandidateName, c.Skills as CandidateSkills, c.Email as CandidateEmail, c.Phone as CandidatePhone,
               r.JobTitle, r.Client, r.Location, r.Rate, r.Duration, r.Experience, r.JobType, r.Priority,
               v.Name as VendorName
        FROM Submissions s
        LEFT JOIN Candidates c ON s.CandidateId = c.Id
        LEFT JOIN Requirements r ON s.RequirementId = r.Id
        LEFT JOIN Vendors v ON s.VendorId = v.Id
        WHERE s.Id = @id
      `);
      
      res.status(201).json({
        success: true,
        message: 'Submission created successfully',
        data: getResult.recordset[0]
      });
    } catch (error) {
      console.error('Create submission error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating submission', 
        error: error.message 
      });
    }
  },

  // Update submission - CORRECTED VERSION FOR ACTUAL DB STRUCTURE
  updateSubmission: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      console.log('Update submission request for ID:', id);
      console.log('Request body:', req.body);
      
      const {
        candidate, jobTitle, skills, vendor, location, rate, duration, experience, jobType, priority,
        status, response, nextStep, interviewDate, feedbackNotes, candidateEmail, candidatePhone, matchScore, date
      } = req.body;

      // Start a transaction for updating multiple tables
      const transaction = new sql.Transaction();
      await transaction.begin();

      try {
        // Update Submissions table (only fields that exist in your schema)
        const submissionRequest = new sql.Request(transaction);
        submissionRequest.input('id', sql.Int, id);
        submissionRequest.input('status', sql.NVarChar, status);
        submissionRequest.input('response', sql.NVarChar, response);
        submissionRequest.input('nextStep', sql.DateTime, nextStep ? new Date(nextStep) : null);
        submissionRequest.input('interviewDate', sql.DateTime, interviewDate ? new Date(interviewDate) : null);
        submissionRequest.input('feedbackNotes', sql.NText, feedbackNotes);
        submissionRequest.input('submissionDate', sql.DateTime, date ? new Date(date) : null);
        submissionRequest.input('updatedAt', sql.DateTime, new Date());
        
        const submissionResult = await submissionRequest.query(`
          UPDATE Submissions 
          SET Status = @status, Response = @response, NextStep = @nextStep,
              InterviewDate = @interviewDate, FeedbackNotes = @feedbackNotes, 
              SubmissionDate = @submissionDate, UpdatedAt = @updatedAt
          WHERE Id = @id
        `);

        console.log('Submission table update result:', submissionResult.rowsAffected);

        // Get the submission to find related candidate and requirement IDs
        const getSubmissionRequest = new sql.Request(transaction);
        getSubmissionRequest.input('id', sql.Int, id);
        const submissionData = await getSubmissionRequest.query(`
          SELECT CandidateId, RequirementId, VendorId FROM Submissions WHERE Id = @id
        `);

        if (submissionData.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({ 
            success: false, 
            message: 'Submission not found' 
          });
        }

        const { CandidateId, RequirementId, VendorId } = submissionData.recordset[0];

        // Check if Candidates table exists and has the columns we need
        try {
          // Update Candidate if candidate info is provided
          if (candidate || candidateEmail || candidatePhone || skills) {
            const candidateRequest = new sql.Request(transaction);
            candidateRequest.input('candidateId', sql.Int, CandidateId);
            candidateRequest.input('name', sql.NVarChar, candidate);
            candidateRequest.input('email', sql.NVarChar, candidateEmail);
            candidateRequest.input('phone', sql.NVarChar, candidatePhone);
            candidateRequest.input('skills', sql.NText, Array.isArray(skills) ? skills.join(', ') : skills);
            
            const candidateResult = await candidateRequest.query(`
              UPDATE Candidates 
              SET Name = COALESCE(@name, Name), 
                  Email = COALESCE(@email, Email), 
                  Phone = COALESCE(@phone, Phone),
                  Skills = COALESCE(@skills, Skills)
              WHERE Id = @candidateId
            `);
            console.log('Candidate table update result:', candidateResult.rowsAffected);
          }
        } catch (candidateError) {
          console.log('Candidate table update skipped:', candidateError.message);
        }

        // Check if Requirements table exists and has the columns we need
        try {
          // Update Requirement if job/requirement info is provided
          if (jobTitle || location || rate || duration || experience || jobType || priority) {
            const requirementRequest = new sql.Request(transaction);
            requirementRequest.input('requirementId', sql.Int, RequirementId);
            requirementRequest.input('jobTitle', sql.NVarChar, jobTitle);
            requirementRequest.input('location', sql.NVarChar, location);
            requirementRequest.input('rate', sql.NVarChar, rate);
            requirementRequest.input('duration', sql.NVarChar, duration);
            requirementRequest.input('experience', sql.NVarChar, experience);
            requirementRequest.input('jobType', sql.NVarChar, jobType);
            requirementRequest.input('priority', sql.NVarChar, priority);
            
            const requirementResult = await requirementRequest.query(`
              UPDATE Requirements 
              SET JobTitle = COALESCE(@jobTitle, JobTitle),
                  Location = COALESCE(@location, Location),
                  Rate = COALESCE(@rate, Rate),
                  Duration = COALESCE(@duration, Duration),
                  Experience = COALESCE(@experience, Experience),
                  JobType = COALESCE(@jobType, JobType),
                  Priority = COALESCE(@priority, Priority)
              WHERE Id = @requirementId
            `);
            console.log('Requirement table update result:', requirementResult.rowsAffected);
          }
        } catch (requirementError) {
          console.log('Requirement table update skipped:', requirementError.message);
        }

        // Check if Vendors table exists and has the columns we need
        try {
          // Update Vendor if vendor info is provided
          if (vendor) {
            const vendorRequest = new sql.Request(transaction);
            vendorRequest.input('vendorId', sql.Int, VendorId);
            vendorRequest.input('name', sql.NVarChar, vendor);
            
            const vendorResult = await vendorRequest.query(`
              UPDATE Vendors 
              SET Name = @name
              WHERE Id = @vendorId
            `);
            console.log('Vendor table update result:', vendorResult.rowsAffected);
          }
        } catch (vendorError) {
          console.log('Vendor table update skipped:', vendorError.message);
        }

        // Commit the transaction
        await transaction.commit();

        // Get the updated submission with all related data
        const getRequest = new sql.Request();
        getRequest.input('id', sql.Int, id);
        const getResult = await getRequest.query(`
          SELECT s.*, 
                 c.Name as CandidateName, c.Skills as CandidateSkills, c.Email as CandidateEmail, c.Phone as CandidatePhone,
                 r.JobTitle, r.Client, r.Location, r.Rate, r.Duration, r.Experience, r.JobType, r.Priority,
                 v.Name as VendorName
          FROM Submissions s
          LEFT JOIN Candidates c ON s.CandidateId = c.Id
          LEFT JOIN Requirements r ON s.RequirementId = r.Id
          LEFT JOIN Vendors v ON s.VendorId = v.Id
          WHERE s.Id = @id
        `);

        console.log('Final updated submission data:', getResult.recordset[0]);

        res.json({
          success: true,
          message: 'Submission updated successfully',
          data: getResult.recordset[0]
        });

      } catch (transactionError) {
        await transaction.rollback();
        throw transactionError;
      }

    } catch (error) {
      console.error('Update submission error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating submission', 
        error: error.message 
      });
    }
  },

  // Delete submission
  deleteSubmission: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      
      const result = await request.query('DELETE FROM Submissions WHERE Id = @id');
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Submission not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Submission deleted successfully'
      });
    } catch (error) {
      console.error('Delete submission error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting submission', 
        error: error.message 
      });
    }
  },

  // Update submission status (for Kanban drag-drop)
  updateSubmissionStatus: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { id } = req.params;
      const { status } = req.body;
      
      console.log('Updating submission status:', { id, status });
      
      const request = new sql.Request();
      request.input('id', sql.Int, id);
      request.input('status', sql.NVarChar, status);
      request.input('updatedAt', sql.DateTime, new Date());
      
      const result = await request.query(`
        UPDATE Submissions 
        SET Status = @status, UpdatedAt = @updatedAt
        WHERE Id = @id
      `);
      
      console.log('Status update rows affected:', result.rowsAffected[0]);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Submission not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Submission status updated successfully'
      });
    } catch (error) {
      console.error('Update submission status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating submission status', 
        error: error.message 
      });
    }
  },

  // Get submissions by status
  getSubmissionsByStatus: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { status } = req.params;
      
      const request = new sql.Request();
      request.input('status', sql.NVarChar, status);
      
      const result = await request.query(`
        SELECT s.*, 
               c.Name as CandidateName, c.Skills as CandidateSkills, c.Email as CandidateEmail, c.Phone as CandidatePhone,
               r.JobTitle, r.Client, r.Location, r.Rate, r.Duration, r.Experience, r.JobType, r.Priority,
               v.Name as VendorName
        FROM Submissions s
        LEFT JOIN Candidates c ON s.CandidateId = c.Id
        LEFT JOIN Requirements r ON s.RequirementId = r.Id
        LEFT JOIN Vendors v ON s.VendorId = v.Id
        WHERE s.Status = @status
        ORDER BY s.CreatedAt DESC
      `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      console.error('Get submissions by status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving submissions', 
        error: error.message 
      });
    }
  },

  // Bulk submit candidates to vendor
  bulkSubmitCandidates: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      const { candidateIds, vendorId, requirementId } = req.body;
      
      if (!candidateIds || candidateIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one candidate must be selected'
        });
      }
      
      const submissions = [];
      
      for (const candidateId of candidateIds) {
        const request = new sql.Request();
        request.input('candidateId', sql.Int, candidateId);
        request.input('requirementId', sql.Int, requirementId);
        request.input('vendorId', sql.Int, vendorId);
        request.input('status', sql.NVarChar, 'Submitted');
        request.input('response', sql.NVarChar, 'Waiting');
        
        const result = await request.query(`
          INSERT INTO Submissions (CandidateId, RequirementId, VendorId, Status, Response)
          OUTPUT INSERTED.Id
          VALUES (@candidateId, @requirementId, @vendorId, @status, @response)
        `);
        
        submissions.push(result.recordset[0].Id);
      }
      
      res.status(201).json({
        success: true,
        message: `${submissions.length} candidates submitted successfully`,
        submissionIds: submissions
      });
    } catch (error) {
      console.error('Bulk submit candidates error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error submitting candidates', 
        error: error.message 
      });
    }
  },

  // Get submissions data for Kanban board
  getKanbanData: async (req, res) => {
    try {
      await sql.connect(dbConfig);
      
      const request = new sql.Request();
      const result = await request.query(`
        SELECT s.Id, s.Status, s.SubmissionDate, s.NextStep, s.Response, s.InterviewDate,
               c.Name as CandidateName, c.Skills as CandidateSkills,
               v.Name as VendorName,
               r.JobTitle
        FROM Submissions s
        LEFT JOIN Candidates c ON s.CandidateId = c.Id
        LEFT JOIN Requirements r ON s.RequirementId = r.Id
        LEFT JOIN Vendors v ON s.VendorId = v.Id
        ORDER BY s.CreatedAt DESC
      `);
      
      // Group submissions by status
      const statusGroups = {
        'Submitted': [],
        'Shortlisted': [],
        'Interview Scheduled': [],
        'Selected': [],
        'Joined': [],
        'Rejected': []
      };
      
      result.recordset.forEach(submission => {
        const status = submission.Status || 'Submitted';
        if (statusGroups[status]) {
          statusGroups[status].push({
            id: submission.Id,
            candidate: submission.CandidateName,
            skills: submission.CandidateSkills ? submission.CandidateSkills.split(', ') : [],
            vendor: submission.VendorName,
            jobTitle: submission.JobTitle,
            date: submission.SubmissionDate ? submission.SubmissionDate.toISOString().split('T')[0] : null,
            nextStep: submission.NextStep ? submission.NextStep.toISOString().split('T')[0] : null,
            response: submission.Response,
            interviewDate: submission.InterviewDate ? submission.InterviewDate.toISOString().split('T')[0] : null,
            status: submission.Status
          });
        }
      });
      
      res.json({
        success: true,
        data: statusGroups
      });
    } catch (error) {
      console.error('Get Kanban data error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving Kanban data', 
        error: error.message 
      });
    }
  }
};

module.exports = submissionController;