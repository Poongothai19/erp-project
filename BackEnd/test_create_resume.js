const { createResume } = require('./Resume-Submission/controllers/resumeController');

async function test() {
  const req = {
    user: { id: 1, userId: 1 },
    body: {
      FirstName: 'Test',
      LastName: 'Candidate',
      EmailID: 'test_candidate@example.com',
      Phone: '1234567890',
      CurrentLocation: 'US',
      JobTitle: 'Software Engineer',
      CandidateStatus: 'Available'
    },
    file: {
      buffer: Buffer.from('test resume content'),
      originalname: 'test_resume.pdf',
      mimetype: 'application/pdf',
      size: 19
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Response Status:', this.statusCode);
      console.log('Response Data:', JSON.stringify(data, null, 2));
    }
  };

  try {
    await createResume(req, res);
  } catch (err) {
    console.error('Uncaught Error:', err);
  }
}

test();
