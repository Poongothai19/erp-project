const companyController = require('../companies/controllers/companyController');

async function test() {
    console.log('Testing getAllCompanies...');
    const req = { query: {} };
    const res = {
        status: function(s) { this.statusCode = s; return this; },
        json: function(d) { 
            console.log('Response Status:', this.statusCode || 200);
            console.log('Response Data:', JSON.stringify(d, null, 2));
        }
    };

    try {
        await companyController.getAllCompanies(req, res);
    } catch (err) {
        console.error('Test failed with error:', err);
    }
    process.exit(0);
}

test();
