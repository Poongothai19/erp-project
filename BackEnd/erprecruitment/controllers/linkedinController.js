// // erprecruitment/controllers/linkedinController.js

// exports.handleLinkedInPost = async (req, res) => {
//   try {
//     console.log('=== LINKEDIN POST REQUEST RECEIVED ===');
//     console.log('Full URL:', req.originalUrl);
//     console.log('Query parameters:', req.query);
//     console.log('Headers:', req.headers);
    
//     const { 
//       role, 
//       company, 
//       location, 
//       experience, 
//       description, 
//       currency, 
//       minRate, 
//       maxRate 
//     } = req.query;
    
//     // Validate required parameters
//     if (!role || !company) {
//       console.log('❌ Missing required parameters - role or company');
//       console.log('Received - role:', role, 'company:', company);
      
//       // Redirect to LinkedIn with a generic message
//       return res.redirect('https://www.linkedin.com/feed/');
//     }

//     // Build the job description
//     const salaryInfo = (currency && minRate && maxRate) 
//       ? `💰 Budget: ${currency} ${minRate} - ${maxRate}`
//       : '';
    
//     const experienceInfo = experience 
//       ? `💼 Experience: ${experience}` 
//       : '';

//     // Create the job post content
//     const jobPostContent = `🚀 We're hiring! ${role}

// 📍 Location: ${location || 'Multiple Locations'}
// 🏢 Company: ${company}
// ${experienceInfo ? experienceInfo + '\n' : ''}${salaryInfo ? salaryInfo + '\n' : ''}
// ${description || 'Exciting opportunity with competitive compensation. Join our dynamic team!'}

// Interested candidates can apply through our portal.

// #hiring #careers #jobopportunity #${role.replace(/\s+/g, '')} #${company.replace(/\s+/g, '')} #jobs #recruitment`;

//     console.log('✅ Generated Job Post Content:');
//     console.log(jobPostContent);
    
//     // Create pre-filled LinkedIn post URL
//     // Note: LinkedIn's share URL has limitations, but this is the closest we can get
//     const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://prophechyerp.duckdns.org')}&summary=${encodeURIComponent(jobPostContent)}`;

//     console.log('✅ Generated LinkedIn Share URL');
//     console.log('Redirecting to LinkedIn...');
    
//     // Redirect to LinkedIn share page
//     res.redirect(linkedinShareUrl);
    
//   } catch (error) {
//     console.error('=== LINKEDIN POST ERROR ===');
//     console.error('Error message:', error.message);
//     console.error('Error stack:', error.stack);
//     console.error('Request URL:', req.originalUrl);
//     console.error('Request Query:', req.query);
    
//     // Fallback to regular LinkedIn feed
//     console.log('⚠️  Redirecting to LinkedIn feed as fallback');
//     res.redirect('https://www.linkedin.com/feed/');
//   }
// };


// erprecruitment/controllers/linkedinController.js
exports.handleLinkedInPost = async (req, res) => {
  try {
    console.log('=== LINKEDIN POST REQUEST RECEIVED ===');
    console.log('Query parameters:', req.query);
    
    const { 
      role, 
      company, 
      location, 
      experience, 
      description, 
      currency, 
      minRate, 
      maxRate,
      applyUrl,
      applyEmail 
    } = req.query;
    
    // Validate required parameters
    if (!role || !company) {
      console.log('❌ Missing required parameters');
      return res.redirect('https://www.linkedin.com/feed/');
    }

    // Build the job description - Format like LinkedIn's hiring posts
    const experienceInfo = experience || 'Not specified';
    const locationInfo = location || 'Multiple Locations';
    const salaryInfo = (currency && minRate && maxRate) 
      ? `${currency} ${minRate} - ${maxRate}`
      : 'Competitive';
    
    // Clean experience info - remove currency codes that might be appended
    const cleanExperience = experienceInfo.replace(/[#¤][a-zA-Z]{2,3}=[A-Z]{3}$/g, '').trim();
    
    // Build application info
    let applyInfo = '';
    if (applyUrl) {
      applyInfo = `\n\n🔗 Apply here: ${applyUrl}`;
    } else if (applyEmail) {
      applyInfo = `\n\n📧 Apply: ${applyEmail}`;
    } else {
      applyInfo = '\n\nIf you are interested, please share your profiles to:\nraja@prophecytechs.com';
    }

    // Create LinkedIn-style hiring post
    const jobPostContent = `We're #hiring a new ${role} in ${locationInfo}. Apply today or share this post with your network.

📍 Location: ${locationInfo}
🏢 Client: ${company}
💼 Experience: ${cleanExperience}
💰 Compensation: ${salaryInfo}

${description || 'Exciting opportunity with competitive compensation. Join our dynamic team!'}${applyInfo}

#hiring #recruitment #${role.replace(/\s+/g, '')} #${company.replace(/\s+/g, '')} #careers #jobopportunity #jobs`;

    console.log('✅ Generated Job Post Content');
    
    // Return HTML page with user-initiated copy
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Post to LinkedIn - ${role}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 650px;
            width: 100%;
            overflow: hidden;
            animation: slideUp 0.4s ease;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .header {
            background: linear-gradient(135deg, #0077b5 0%, #00a0dc 100%);
            color: white;
            padding: 35px 30px;
            text-align: center;
          }
          
          .linkedin-logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: bounce 2s ease-in-out infinite;
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          .linkedin-logo svg {
            width: 40px;
            height: 40px;
            fill: #0077b5;
          }
          
          .header h1 {
            font-size: 26px;
            margin-bottom: 8px;
            font-weight: 600;
          }
          
          .header p {
            opacity: 0.95;
            font-size: 15px;
          }
          
          .content {
            padding: 35px 30px;
          }
          
          .status-box {
            background: #d4edda;
            border-left: 4px solid #28a745;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 15px;
          }
          
          .status-box.warning {
            background: #fff3cd;
            border-left-color: #ffc107;
          }
          
          .status-box.info {
            background: #e7f3ff;
            border-left-color: #0077b5;
          }
          
          .status-icon {
            font-size: 32px;
            flex-shrink: 0;
          }
          
          .status-text {
            flex: 1;
          }
          
          .status-text strong {
            display: block;
            margin-bottom: 5px;
            font-size: 16px;
          }
          
          .status-text p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
          
          .job-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          }
          
          .job-title {
            font-size: 20px;
            color: #0077b5;
            margin-bottom: 15px;
            font-weight: 700;
          }
          
          .job-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
          }
          
          .detail-item {
            color: #666;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .instructions {
            background: #e7f3ff;
            border-left: 4px solid #0077b5;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
          }
          
          .instructions h3 {
            color: #0077b5;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
          }
          
          .instructions ol {
            margin-left: 20px;
            color: #2c3e50;
          }
          
          .instructions li {
            margin: 10px 0;
            line-height: 1.6;
          }
          
          .instructions strong {
            color: #0077b5;
          }
          
          .post-preview-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .post-preview {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            white-space: pre-wrap;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #2c3e50;
            max-height: 250px;
            overflow-y: auto;
            resize: vertical;
            min-height: 300px;
            min-width:100%
          }
          
          .post-preview:focus {
            border-color: #0077b5;
            box-shadow: 0 0 0 3px rgba(0, 119, 181, 0.1);
            outline: none;
          }
          
          .edit-notice {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
            font-style: italic;
          }
          
          .button-group {
            display: flex;
            gap: 12px;
            margin-top: 30px;
            flex-wrap: wrap;
          }
          
          .btn {
            flex: 1;
            min-width: 200px;
            padding: 18px 32px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
          }
          
          .btn:active {
            transform: translateY(0);
          }
          
          .btn-primary {
            background: #0077b5;
            color: white;
            position: relative;
            overflow: hidden;
          }
          
          .btn-primary::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }
          
          .btn-primary:hover::before {
            width: 300px;
            height: 300px;
          }
          
          .btn-primary:hover {
            background: #005885;
          }
          
          .btn-secondary {
            background: #6c757d;
            color: white;
          }
          
          .btn-secondary:hover {
            background: #5a6268;
          }
          
          @media (max-width: 600px) {
            .button-group {
              flex-direction: column;
            }
            
            .btn {
              width: 100%;
            }
            
            .job-details {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="linkedin-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <h1>Ready to Post on LinkedIn</h1>
            <p>Your job posting is ready to share</p>
          </div>
          
          <div class="content">
            <div class="status-box info" id="statusBox">
              <div class="status-icon">👋</div>
              <div class="status-text">
                <strong>Welcome!</strong>
                <p>You can edit the content below before copying.</p>
              </div>
            </div>
            
            <div class="job-info">
              <div class="job-title">${role}</div>
              <div class="job-details">
                <div class="detail-item">🏢 <strong>Client:</strong> ${company}</div>
                <div class="detail-item">📍 <strong>Location:</strong> ${locationInfo}</div>
                <div class="detail-item">💼 <strong>Experience:</strong> ${cleanExperience}</div>
                <div class="detail-item">💰 <strong>Salary:</strong> ${salaryInfo}</div>
              </div>
            </div>
            
            <div class="post-preview-label">Content Preview (Editable):</div>
            <textarea class="post-preview" id="postContent" placeholder="Edit your LinkedIn post content here...">${jobPostContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
       
            
            <div class="button-group">
              
              <button class="btn btn-primary" onclick="copyAndOpenLinkedIn()" id="mainBtn">
                Copy & Open LinkedIn
              </button>
            </div>
          </div>
        </div>
        
        <script>
          let postContent = ${JSON.stringify(jobPostContent)};
          let isCopied = false;
          
          // Update postContent when user edits the textarea
          document.getElementById('postContent').addEventListener('input', function(e) {
            postContent = e.target.value;
            console.log('Content updated by user');
          });
          
          // Function to copy to clipboard
          async function copyToClipboard() {
            try {
              // Get the current content from the textarea
              const currentContent = document.getElementById('postContent').value;
              
              // Try modern clipboard API first
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(currentContent);
                isCopied = true;
                showCopySuccess();
                console.log('✅ Content copied successfully');
                return true;
              } else {
                // Fallback for older browsers
                return fallbackCopy(currentContent);
              }
            } catch (error) {
              console.error('Clipboard API failed:', error);
              return fallbackCopy(document.getElementById('postContent').value);
            }
          }
          
          function fallbackCopy(content) {
            try {
              const textArea = document.createElement('textarea');
              textArea.value = content;
              textArea.style.position = 'fixed';
              textArea.style.top = '-9999px';
              textArea.style.left = '-9999px';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              
              const successful = document.execCommand('copy');
              document.body.removeChild(textArea);
              
              if (successful) {
                isCopied = true;
                showCopySuccess();
                console.log('✅ Content copied via fallback');
                return true;
              } else {
                showCopyError();
                return false;
              }
            } catch (err) {
              console.error('❌ Copy failed:', err);
              showCopyError();
              return false;
            }
          }
          
          function showCopySuccess() {
            const statusBox = document.getElementById('statusBox');
            statusBox.className = 'status-box';
            statusBox.innerHTML = \`
              <div class="status-icon">✅</div>
              <div class="status-text">
                <strong>Copied Successfully!</strong>
                <p>Content is ready to paste on LinkedIn.</p>
              </div>
            \`;
          }
          
          function showCopyError() {
            const statusBox = document.getElementById('statusBox');
            statusBox.className = 'status-box warning';
            statusBox.innerHTML = \`
              <div class="status-icon">⚠️</div>
              <div class="status-text">
                <strong>Copy Failed</strong>
                <p>Please manually select and copy the text from the preview above.</p>
              </div>
            \`;
          }
          
          function copyContentOnly() {
            copyToClipboard();
          }
          
          async function copyAndOpenLinkedIn() {
            // First, copy the content
            const copied = await copyToClipboard();
            
            if (!copied) {
              alert('Failed to copy content. Please try the "Copy Content" button or manually copy the text.');
              return;
            }
            
            // Update status
            const statusBox = document.getElementById('statusBox');
            statusBox.className = 'status-box';
            statusBox.innerHTML = \`
              <div class="status-icon">🚀</div>
              <div class="status-text">
                <strong>Opening LinkedIn...</strong>
                <p>Paste the content (Ctrl+V or Cmd+V) when LinkedIn opens!</p>
              </div>
            \`;
            
            // Small delay to ensure copy completes
            setTimeout(() => {
              // Open LinkedIn
              const linkedinWindow = window.open('https://www.linkedin.com/feed/', '_blank', 'noopener,noreferrer');
              
              if (!linkedinWindow || linkedinWindow.closed || typeof linkedinWindow.closed === 'undefined') {
                // Popup was blocked
                statusBox.className = 'status-box warning';
                statusBox.innerHTML = \`
                  
                \`;
              } else {
                // Success - LinkedIn opened
                statusBox.className = 'status-box';
                statusBox.innerHTML = \`
                  <div class="status-icon">✅</div>
                  <div class="status-text">
                    <strong>LinkedIn Opened!</strong>
                    <p>Click "Start a post" on LinkedIn and paste (Ctrl+V or Cmd+V)!</p>
                  </div>
                \`;
              }
            }, 100);
          }
          
          // Auto-focus the textarea for easy editing
          document.getElementById('postContent').focus();
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('=== LINKEDIN POST ERROR ===');
    console.error('Error:', error.message);
    res.redirect('https://www.linkedin.com/feed/');
  }
};