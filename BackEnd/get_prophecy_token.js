const express = require('express');
const axios = require('axios');

const app = express();
const port = 3001;

// Prophecy Credentials provided
const CLIENT_ID = '86l99c25jnes20';
const CLIENT_SECRET = 'WPL_AP1.5xLJw7AGzpdGgN8x.cStgnQ==';
const REDIRECT_URI = 'http://localhost:3001/callback';

// Scopes required for posting on behalf of an organization
const SCOPES = 'w_organization_social r_organization_social rw_organization_admin';

app.get('/', (req, res) => {
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=123456&scope=${encodeURIComponent(SCOPES)}`;
    console.log('Redirecting to LinkedIn for authorization...');
    res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
        console.error(`\nAuthorization Error: ${error} - ${req.query.error_description}`);
        return res.send(`Authorization failed: ${req.query.error_description}`);
    }

    if (!code) {
        return res.send('No code returned from LinkedIn.');
    }

    try {
        console.log('Authorization code received. Exchanging for Access Token...');
        const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
            params: {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('\n================ SUCCESS ================');
        console.log('Here is your Prophecy Access Token:\n');
        console.log(response.data.access_token);
        console.log('\nToken expires in:', response.data.expires_in, 'seconds');
        console.log('=========================================\n');

        res.send('Success! The Access Token has been printed in your terminal. You can safely close this browser window.');
        
        // Gracefully stop the server after printing the token
        setTimeout(() => process.exit(0), 1500);
    } catch (err) {
        console.error('\nFailed to get access token:', err.response ? err.response.data : err.message);
        res.send('Error getting access token. Please check the terminal for details.');
        setTimeout(() => process.exit(1), 1500);
    }
});

app.listen(port, () => {
    console.log(`\n=== LinkedIn Token Generator for Prophecy ===`);
    console.log(`Waiting for authorization...`);
    console.log(`\nACTION REQUIRED BEFORE PROCEEDING:`);
    console.log(`1. Go to your LinkedIn Developer Portal (Auth Tab) for the Prophecy app.`);
    console.log(`2. Under 'OAuth 2.0 settings', add this exact Authorized redirect URL:`);
    console.log(`   http://localhost:3001/callback`);
    console.log(`\nOnce the redirect URL is added, open this link in your browser:`);
    console.log(`http://localhost:3001`);
});
