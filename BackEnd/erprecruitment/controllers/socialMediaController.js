const { sql, poolPromise } = require('../../config/db');
const axios = require('axios');

// Get all configurations for the logged-in user
exports.getConfigurations = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('RecruiterID', sql.Int, req.user.id) // Assuming req.user contains the logged-in user's info
            .query(`
                SELECT 
                    ConfigID, PlatformName, ClientID, ProfileID, OrganizationID, 
                    PageID, InstagramBusinessAccountID, PostingModeAllowed, 
                    ConnectionStatus, LastVerifiedDate, IsActive
                FROM RecruiterSocialMediaConfig 
                WHERE RecruiterID = @RecruiterID
            `);

        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching social configs:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Add or update a configuration
exports.saveConfiguration = async (req, res) => {
    let {
        PlatformName, ClientID, ClientSecret, AccessToken, RefreshToken,
        ProfileID, OrganizationID, PageID, InstagramBusinessAccountID, PostingModeAllowed
    } = req.body;

    try {
        const pool = await poolPromise;

        // Check if config exists and get existing data
        const checkResult = await pool.request()
            .input('RecruiterID', sql.Int, req.user.id)
            .input('PlatformName', sql.VarChar, PlatformName)
            .query(`SELECT * FROM RecruiterSocialMediaConfig WHERE RecruiterID = @RecruiterID AND PlatformName = @PlatformName`);

        const existingConfig = checkResult.recordset.length > 0 ? checkResult.recordset[0] : null;

        // Ensure we don't overwrite passwords with undefined if they weren't sent from UI
        const finalClientSecret = ClientSecret !== undefined ? ClientSecret : (existingConfig ? existingConfig.ClientSecretEncrypted : null);
        const finalAccessToken = AccessToken !== undefined ? AccessToken : (existingConfig ? existingConfig.AccessTokenEncrypted : null);
        const finalRefreshToken = RefreshToken !== undefined ? RefreshToken : (existingConfig ? existingConfig.RefreshTokenEncrypted : null);

        let connectionStatus = existingConfig ? existingConfig.ConnectionStatus : 'Not Configured';

        // Automatically fetch LinkedIn Profile ID if Access Token is provided
        let finalProfileID = ProfileID !== undefined ? ProfileID : (existingConfig ? existingConfig.ProfileID : null);
        if (PlatformName === 'LinkedIn' && finalAccessToken) {
            try {
                // If a NEW AccessToken was passed, fetch the ID to verify it
                if (AccessToken !== undefined) {
                    try {
                        const meResponse = await axios.get('https://api.linkedin.com/v2/me', {
                            headers: { 'Authorization': `Bearer ${finalAccessToken}` }
                        });
                        finalProfileID = meResponse.data.id;
                        connectionStatus = 'Connected';
                    } catch (meErr) {
                        if (meErr.response && (meErr.response.status === 403 || meErr.response.status === 401)) {
                            // Fallback to userinfo endpoint for OIDC tokens
                            const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
                                headers: { 'Authorization': `Bearer ${finalAccessToken}` }
                            });
                            finalProfileID = userInfoResponse.data.sub;
                            connectionStatus = 'Connected';
                        } else {
                            throw meErr;
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch LinkedIn Profile ID:", err.response ? err.response.data : err.message);
                return res.status(400).json({ success: false, message: 'Invalid LinkedIn Access Token. Could not verify profile.' });
            }
        } else if (AccessToken !== undefined && finalAccessToken) {
            // For other platforms, if a new token is provided, mark as connected
            connectionStatus = 'Connected';
        }

        if (existingConfig) {
            // Update existing
            await pool.request()
                .input('RecruiterID', sql.Int, req.user.id)
                .input('PlatformName', sql.VarChar, PlatformName)
                .input('ClientID', sql.VarChar, ClientID)
                .input('ClientSecretEncrypted', sql.Text, finalClientSecret)
                .input('AccessTokenEncrypted', sql.Text, finalAccessToken)
                .input('RefreshTokenEncrypted', sql.Text, finalRefreshToken)
                .input('ProfileID', sql.VarChar, finalProfileID)
                .input('OrganizationID', sql.VarChar, OrganizationID)
                .input('PageID', sql.VarChar, PageID)
                .input('InstagramBusinessAccountID', sql.VarChar, InstagramBusinessAccountID)
                .input('PostingModeAllowed', sql.VarChar, PostingModeAllowed || 'Both')
                .input('ConnectionStatus', sql.VarChar, connectionStatus)
                .input('UpdatedBy', sql.VarChar, req.user.username)
                .query(`
                    UPDATE RecruiterSocialMediaConfig SET
                        ClientID = @ClientID,
                        ClientSecretEncrypted = @ClientSecretEncrypted,
                        AccessTokenEncrypted = @AccessTokenEncrypted,
                        RefreshTokenEncrypted = @RefreshTokenEncrypted,
                        ProfileID = @ProfileID,
                        OrganizationID = @OrganizationID,
                        PageID = @PageID,
                        InstagramBusinessAccountID = @InstagramBusinessAccountID,
                        PostingModeAllowed = @PostingModeAllowed,
                        ConnectionStatus = @ConnectionStatus,
                        LastVerifiedDate = GETDATE(),
                        UpdatedBy = @UpdatedBy,
                        UpdatedDate = GETDATE()
                    WHERE RecruiterID = @RecruiterID AND PlatformName = @PlatformName
                `);
        } else {
            // Insert new
            await pool.request()
                .input('RecruiterID', sql.Int, req.user.id)
                .input('PlatformName', sql.VarChar, PlatformName)
                .input('ClientID', sql.VarChar, ClientID)
                .input('ClientSecretEncrypted', sql.Text, finalClientSecret)
                .input('AccessTokenEncrypted', sql.Text, finalAccessToken)
                .input('RefreshTokenEncrypted', sql.Text, finalRefreshToken)
                .input('ProfileID', sql.VarChar, finalProfileID)
                .input('OrganizationID', sql.VarChar, OrganizationID)
                .input('PageID', sql.VarChar, PageID)
                .input('InstagramBusinessAccountID', sql.VarChar, InstagramBusinessAccountID)
                .input('PostingModeAllowed', sql.VarChar, PostingModeAllowed || 'Both')
                .input('ConnectionStatus', sql.VarChar, connectionStatus)
                .input('CreatedBy', sql.VarChar, req.user.username)
                .query(`
                    INSERT INTO RecruiterSocialMediaConfig 
                    (RecruiterID, PlatformName, ClientID, ClientSecretEncrypted, AccessTokenEncrypted, RefreshTokenEncrypted, 
                     ProfileID, OrganizationID, PageID, InstagramBusinessAccountID, PostingModeAllowed, CreatedBy, IsActive, ConnectionStatus)
                    VALUES 
                    (@RecruiterID, @PlatformName, @ClientID, @ClientSecretEncrypted, @AccessTokenEncrypted, @RefreshTokenEncrypted,
                     @ProfileID, @OrganizationID, @PageID, @InstagramBusinessAccountID, @PostingModeAllowed, @CreatedBy, 1, @ConnectionStatus)
                `);
        }

        res.status(200).json({ success: true, message: 'Configuration saved successfully' });
    } catch (error) {
        console.error('Error saving config:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Daily validation logic (can be exported and used in authController)
exports.validateSocialMediaConnections = async (recruiterId) => {
    try {
        const pool = await poolPromise;
        const configs = await pool.request()
            .input('RecruiterID', sql.Int, recruiterId)
            .query(`
                SELECT * FROM RecruiterSocialMediaConfig 
                WHERE RecruiterID = @RecruiterID AND IsActive = 1
                AND (CAST(LastVerifiedDate AS DATE) < CAST(GETDATE() AS DATE) OR LastVerifiedDate IS NULL)
            `);

        for (const config of configs.recordset) {
            console.log(`Validating token for ${config.PlatformName}...`);
            // Here you would add the actual API call to LinkedIn/Meta to check if the token is valid.
            // Example for LinkedIn: GET https://api.linkedin.com/v2/me using config.AccessTokenEncrypted

            // Assuming successful for now
            await pool.request()
                .input('ConfigID', sql.BigInt, config.ConfigID)
                .query(`UPDATE RecruiterSocialMediaConfig SET LastVerifiedDate = GETDATE(), ConnectionStatus = 'Connected' WHERE ConfigID = @ConfigID`);
        }
    } catch (error) {
        console.error('Error in daily validation:', error);
    }
};

// Post to Social Media
exports.postJob = async (req, res) => {
    const { jobId, platforms, postingLevels, customText, frontendUrl } = req.body;

    // Clean up FRONTEND_URL from env if it has a trailing slash
    let envFrontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : "https://devprophecyerp.com";

    // Fallback to env frontend URL if frontendUrl is not provided
    let baseLink = frontendUrl || envFrontendUrl;
    
    // Facebook API will reject localhost URLs with "Invalid URL", so fallback to valid URL for testing
    if (baseLink.includes('localhost') || baseLink.includes('127.0.0.1')) {
        baseLink = envFrontendUrl;
    }
    
    const jobLink = `${baseLink}/job/${jobId}`;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({ success: false, message: 'No platforms selected for posting.' });
    }

    try {
        const pool = await poolPromise;

        // 1. Fetch Job Details
        const jobResult = await pool.request()
            .input('id', sql.Int, jobId)
            .query(`SELECT role, location, experience FROM RecruitmentRoles WHERE id = @id`);

        if (jobResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        const job = jobResult.recordset[0];

        // Ensure cleanRole and default post text
        const cleanRole = job.role ? job.role.replace(/[^a-zA-Z0-9]/g, '') : 'TechRole';
        const defaultPostText = `We’re Hiring – ${job.role}\n\nProphecy Technologies is looking for an experienced ${job.role} to join our growing team.\n\n📍 Location: ${job.location}\n💼 Experience: ${job.experience}\n\n📩 Apply now by sending your resume to:\nonsitejobs@prophecytechs.com\n\nFeel free to share this opportunity with your network.\n\n#Hiring #Jobs #Careers #${cleanRole} #TechJobs #Recruitment #NowHiring`;
        const postText = customText || defaultPostText;

        const results = [];

        for (const platform of platforms) {
            try {
                let postUrn = '';
                let postUrl = '';

                if (platform === 'FacebookCognifyar') {
                    const accessToken = process.env.COGNIFYAR_META_ACCESS_TOKEN;
                    const pageId = process.env.COGNIFYAR_FB_PAGE_ID;
                    
                    if (!accessToken || !pageId) {
                        throw new Error('Cognifyar Facebook credentials are missing in env.');
                    }
                    
                    const fbUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
                    const response = await axios.post(fbUrl, {
                        message: postText,
                        link: jobLink,
                        access_token: accessToken
                    });
                    postUrn = response.data.id;
                    postUrl = `https://facebook.com/${postUrn}`;
                } else {
                    // Fetch User Config for Platform to check IsActive
                    const configResult = await pool.request()
                        .input('RecruiterID', sql.Int, req.user.id)
                        .input('PlatformName', sql.VarChar, platform)
                        .query(`SELECT AccessTokenEncrypted, ProfileID, PageID, InstagramBusinessAccountID, IsActive FROM RecruiterSocialMediaConfig WHERE RecruiterID = @RecruiterID AND PlatformName = @PlatformName`);

                    if (configResult.recordset.length === 0 || configResult.recordset[0].IsActive === false || configResult.recordset[0].IsActive === 0) {
                        results.push({ platform, success: false, message: 'Account not connected or is paused by the recruiter' });
                        continue;
                    }

                    const config = configResult.recordset[0];
                    let accessToken = config.AccessTokenEncrypted;

                if (platform === 'LinkedIn_Prophecy' || platform === 'LinkedIn_Cognifyar' || platform === 'LinkedIn') {
                    // Get correct token and profile ID based on platform
                    let linkedInAccessToken = '';
                    let profileId = '';
                    let isCompanyPage = false;
                    
                    if (platform === 'LinkedIn_Prophecy') {
                        linkedInAccessToken = process.env.LINKEDIN_PROPHECY_ACCESS_TOKEN;
                        profileId = process.env.LINKEDIN_PROPHECY_ORGANIZATION_ID;
                        isCompanyPage = true;
                    } else if (platform === 'LinkedIn_Cognifyar') {
                        linkedInAccessToken = process.env.LINKEDIN_COGNIFYAR_ACCESS_TOKEN;
                        profileId = process.env.LINKEDIN_COGNIFYAR_ORGANIZATION_ID;
                        isCompanyPage = true;
                    } else {
                        // Personal LinkedIn uses the token from DB
                        linkedInAccessToken = config.AccessTokenEncrypted;
                        profileId = config.ProfileID;
                        isCompanyPage = false;
                    }

                    if (!linkedInAccessToken || !profileId) {
                        throw new Error(`Credentials are missing for ${platform}.`);
                    }

                    const linkedInUrl = 'https://api.linkedin.com/v2/ugcPosts';
                    const authorUrn = isCompanyPage ? `urn:li:organization:${profileId}` : `urn:li:person:${profileId}`;
                    
                    const payload = {
                        "author": authorUrn,
                        "lifecycleState": "PUBLISHED",
                        "specificContent": {
                            "com.linkedin.ugc.ShareContent": {
                                "shareCommentary": { "text": postText },
                                "shareMediaCategory": "ARTICLE",
                                "media": [{
                                    "status": "READY",
                                    "description": { "text": "Apply for this job" },
                                    "originalUrl": jobLink,
                                    "title": { "text": `Prophecy Technologies Careers - ${job.role}` }
                                }]
                            }
                        },
                        "visibility": { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
                    };

                    const response = await axios.post(linkedInUrl, payload, {
                        headers: {
                            'Authorization': `Bearer ${linkedInAccessToken}`,
                            'Content-Type': 'application/json',
                            'X-Restli-Protocol-Version': '2.0.0'
                        }
                    });

                    postUrn = response.data.id;
                    postUrl = `https://www.linkedin.com/feed/update/${postUrn}`;

                } else if (platform === 'Facebook') {
                    accessToken = process.env.META_ACCESS_TOKEN || accessToken;
                    const pageId = process.env.FB_PAGE_ID || config.PageID;
                    if (!pageId) throw new Error('Facebook Page ID is missing in configuration or env.');

                    const fbUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
                    const response = await axios.post(fbUrl, {
                        message: postText,
                        link: jobLink,
                        access_token: accessToken
                    });

                    postUrn = response.data.id;
                    postUrl = `https://facebook.com/${postUrn}`;

                } else if (platform === 'Instagram') {
                    accessToken = process.env.META_ACCESS_TOKEN || accessToken;
                    const igAccountId = process.env.IG_ACCOUNT_ID || config.InstagramBusinessAccountID;
                    if (!igAccountId) throw new Error('Instagram Business Account ID is missing in configuration or env.');

                    // Instagram requires an image. We use a default Prophecy tech hiring image
                    const defaultImageUrl = 'https://prophecytechs.com/wp-content/uploads/2023/10/prophecy-logo.png';

                    // Step 1: Create media container
                    const mediaUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
                    const mediaResponse = await axios.post(mediaUrl, null, {
                        params: {
                            image_url: defaultImageUrl,
                            caption: postText,
                            access_token: accessToken
                        }
                    });

                    const containerId = mediaResponse.data.id;

                    // Step 2: Publish media container
                    const publishUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`;
                    const publishResponse = await axios.post(publishUrl, null, {
                        params: {
                            creation_id: containerId,
                            access_token: accessToken
                        }
                    });

                    postUrn = publishResponse.data.id;
                    postUrl = `https://instagram.com/p/${postUrn}`; // Not a real IG link but a placeholder
                }

                } // End else block for non-FacebookCognifyar platforms

                // Log Success
                await pool.request()
                    .input('JobID', sql.Int, jobId)
                    .input('RecruiterID', sql.Int, req.user.id)
                    .input('PlatformName', sql.VarChar, platform === 'FacebookCognifyar' ? 'Facebook (Cognifyar)' : platform)
                    .input('PostingLevel', sql.VarChar, 'Personal') // or Organization depending on config
                    .input('PostContent', sql.NVarChar, postText)
                    .input('ExternalPostID', sql.VarChar, postUrn)
                    .input('PostURL', sql.NVarChar, postUrl)
                    .input('PostStatus', sql.VarChar, 'Success')
                    .query(`
                        INSERT INTO JobSocialPostHistory 
                        (JobID, RecruiterID, PlatformName, PostingLevel, PostContent, ExternalPostID, PostURL, PostStatus, PostedDate)
                        VALUES (@JobID, @RecruiterID, @PlatformName, @PostingLevel, @PostContent, @ExternalPostID, @PostURL, @PostStatus, GETDATE())
                    `);

                results.push({ platform, success: true, postUrl });

            } catch (err) {
                console.error(`Error posting to ${platform}:`, err.response ? err.response.data : err.message);

                // Log Failure
                try {
                    await pool.request()
                        .input('JobID', sql.Int, jobId)
                        .input('RecruiterID', sql.Int, req.user.id)
                        .input('PlatformName', sql.VarChar, platform === 'FacebookCognifyar' ? 'Facebook (Cognifyar)' : platform)
                        .input('PostStatus', sql.VarChar, 'Failed')
                        .input('ErrorMessage', sql.NVarChar, err.response ? JSON.stringify(err.response.data) : err.message)
                        .query(`
                            INSERT INTO JobSocialPostHistory 
                            (JobID, RecruiterID, PlatformName, PostStatus, ErrorMessage, PostedDate)
                            VALUES (@JobID, @RecruiterID, @PlatformName, @PostStatus, @ErrorMessage, GETDATE())
                        `);
                } catch (dbErr) {
                    console.error('DB Logging error:', dbErr);
                }

                results.push({ platform, success: false, message: err.message });
            }
        } // End loop

        const successfulPosts = results.filter(r => r.success);

        if (successfulPosts.length === 0) {
            const reasons = results.map(r => `${r.platform}: ${r.message}`).join(' | ');
            return res.status(400).json({ success: false, message: `Failed to post. ${reasons}`, details: results });
        }

        res.status(200).json({
            success: true,
            message: `Successfully posted to ${successfulPosts.length} platform(s).`,
            details: results
        });

    } catch (error) {
        console.error('Fatal Post Job Error:', error);
        res.status(500).json({ success: false, message: 'Server error during posting process.', error: error.message });
    }
};

// Toggle platform active status
exports.togglePlatformStatus = async (req, res) => {
    const { platformName } = req.params;

    try {
        const pool = await poolPromise;

        // Check current status
        const currentResult = await pool.request()
            .input('RecruiterID', sql.Int, req.user.id)
            .input('PlatformName', sql.VarChar, platformName)
            .query(`SELECT IsActive FROM RecruiterSocialMediaConfig WHERE RecruiterID = @RecruiterID AND PlatformName = @PlatformName`);

        if (currentResult.recordset.length === 0) {
            // If configuration doesn't exist, create it with IsActive = 1
            await pool.request()
                .input('RecruiterID', sql.Int, req.user.id)
                .input('PlatformName', sql.VarChar, platformName)
                .input('CreatedBy', sql.VarChar, req.user.username)
                .query(`
                    INSERT INTO RecruiterSocialMediaConfig 
                    (RecruiterID, PlatformName, ClientID, ClientSecretEncrypted, AccessTokenEncrypted, RefreshTokenEncrypted, 
                     ProfileID, OrganizationID, PageID, InstagramBusinessAccountID, PostingModeAllowed, CreatedBy, IsActive, ConnectionStatus)
                    VALUES 
                    (@RecruiterID, @PlatformName, '', '', '', '',
                     '', '', '', '', 'Organization', @CreatedBy, 1, 'Connected')
                `);
            return res.status(200).json({
                success: true,
                message: `Successfully enabled ${platformName}`,
                isActive: 1
            });
        }

        const currentIsActive = currentResult.recordset[0].IsActive;
        const newIsActive = currentIsActive ? 0 : 1;

        await pool.request()
            .input('RecruiterID', sql.Int, req.user.id)
            .input('PlatformName', sql.VarChar, platformName)
            .input('IsActive', sql.Bit, newIsActive)
            .query(`UPDATE RecruiterSocialMediaConfig SET IsActive = @IsActive, UpdatedDate = GETDATE() WHERE RecruiterID = @RecruiterID AND PlatformName = @PlatformName`);

        res.status(200).json({
            success: true,
            message: `Successfully ${newIsActive ? 'enabled' : 'disabled'} ${platformName}`,
            isActive: newIsActive
        });
    } catch (error) {
        console.error('Error toggling config:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
