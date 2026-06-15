// // // erprecruitment/utils/emailService.js
// // const https = require('https');

// // // SendGrid email sender (using your API key)
// // const sendEmailSendGrid = (to, subject, message) => {
// //   return new Promise((resolve, reject) => {
// //     const postData = JSON.stringify({
// //       personalizations: [{
// //         to: [{ email: to }]
// //       }],
// //       from: {
// //         email: 'kal@prophecytechs.com',
// //         name: 'Prophecy Technologies'
// //       },
// //       subject: subject,
// //       content: [
// //         {
// //           type: 'text/plain',
// //           value: message
// //         },
// //         {
// //           type: 'text/html',
// //           value: `
// //             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
// //               <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
// //                 <h1 style="margin: 0; font-size: 24px;">Prophecy Technologies</h1>
           
// //               </div>
              
// //               <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #e9ecef;">
// //                 <h2 style="color: #2c3e50; margin-top: 0;">Role Assignment Notification</h2>
                
// //                 <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; margin: 20px 0;">
// //                   ${message.replace(/\n/g, '<br>')}
// //                 </div>
                
// //                 <hr style="border: 1px solid #eee; margin: 20px 0;">
                
// //                 <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
// //                   This is an automated notification from Prophecy Technologies Recruitment System.<br>
// //                   Please do not reply to this email.
// //                 </p>
// //               </div>
// //             </div>
// //           `
// //         }
// //       ]
// //     });

// //     const options = {
// //       hostname: 'api.sendgrid.com',
// //       port: 443,
// //       path: '/v3/mail/send',
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //         'Authorization': 'Bearer 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',
// //         'Content-Length': Buffer.byteLength(postData)
// //       }
// //     };

// //     const req = https.request(options, (res) => {
// //       let data = '';
      
// //       res.on('data', (chunk) => {
// //         data += chunk;
// //       });
      
// //       res.on('end', () => {
// //         console.log(`SendGrid Response Status: ${res.statusCode}`);
// //         if (res.statusCode === 202 || res.statusCode === 200) {
// //           console.log('Email sent successfully via SendGrid');
// //           resolve('Email sent successfully via SendGrid');
// //         } else {
// //           console.error('SendGrid error response:', data);
// //           reject(new Error(`SendGrid failed with status: ${res.statusCode} - ${data}`));
// //         }
// //       });
// //     });

// //     req.on('error', (error) => {
// //       console.error('SendGrid request error:', error);
// //       reject(error);
// //     });

// //     req.write(postData);
// //     req.end();
// //   });
// // };

// // // SMTP2GO email sender (backup option)
// // const sendEmailSMTP2GO = (to, subject, message) => {
// //   return new Promise((resolve, reject) => {
// //     const postData = JSON.stringify({
// //       api_key: 'api-A4BDFA70148847B0A07E7C28D2C34057',
// //       to: [to],
// //       sender: 'kal@prophecytechs.com',
// //       subject: subject,
// //       text_body: message,
// //       html_body: `
// //         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
// //           <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
// //             <h1 style="margin: 0; font-size: 24px;">Prophecy Technologies</h1>
// //             <p style="margin: 5px 0 0 0; opacity: 0.9;">Recruitment Management System</p>
// //           </div>
          
// //           <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #e9ecef;">
// //             <h2 style="color: #2c3e50; margin-top: 0;">Role Assignment Notification</h2>
            
// //             <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; margin: 20px 0;">
// //               ${message.replace(/\n/g, '<br>')}
// //             </div>
            
// //             <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
// //               This is an automated notification from Prophecy Technologies Recruitment System.<br>
// //               Please do not reply to this email.
// //             </p>
// //           </div>
// //         </div>
// //       `
// //     });

// //     const options = {
// //       hostname: 'api.smtp2go.com',
// //       port: 443,
// //       path: '/v3/email/send',
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //         'Content-Length': Buffer.byteLength(postData)
// //       }
// //     };

// //     const req = https.request(options, (res) => {
// //       let data = '';
      
// //       res.on('data', (chunk) => {
// //         data += chunk;
// //       });
      
// //       res.on('end', () => {
// //         try {
// //           const response = JSON.parse(data);
// //           if (res.statusCode === 200 && response.data) {
// //             resolve('Email sent successfully via SMTP2GO');
// //           } else {
// //             reject(new Error(`SMTP2GO failed: ${response.error || 'Unknown error'}`));
// //           }
// //         } catch (e) {
// //           reject(new Error(`SMTP2GO response parsing failed: ${e.message}`));
// //         }
// //       });
// //     });

// //     req.on('error', (error) => {
// //       reject(error);
// //     });

// //     req.write(postData);
// //     req.end();
// //   });
// // };

// // // Fallback email sender - tries SendGrid first, then SMTP2GO
// // const sendEmailWithFallback = async (to, subject, message) => {
// //   try {
// //     console.log(`Attempting to send email to ${to} via SendGrid...`);
// //     await sendEmailSendGrid(to, subject, message);
// //     return { success: true, service: 'SendGrid' };
// //   } catch (error) {
// //     console.error('SendGrid failed:', error.message);
// //     console.log('Trying SMTP2GO as fallback...');
    
// //     try {
// //       await sendEmailSMTP2GO(to, subject, message);
// //       return { success: true, service: 'SMTP2GO' };
// //     } catch (error2) {
// //       console.error('SMTP2GO also failed:', error2.message);
// //       throw new Error('All email services failed');
// //     }
// //   }
// // };

// // // Test function
// // const testEmail = async () => {
// //   try {
// //     console.log('Testing SendGrid email service...');
    
// //     // Test 1: External email
// //     await sendEmailSendGrid(
// //       'dshalu5@gmail.com',
// //       'SendGrid Test - External',
// //       'This is a test email to external domain (Gmail).'
// //     );
// //     console.log('Test 1 passed: External email sent');
    
// //     // Test 2: Internal email
// //     await sendEmailSendGrid(
// //       'ashok@prophecytechs.com',
// //       'SendGrid Test - Internal',
// //       'This is a test email to internal domain (prophecytechs.com).'
// //     );
// //     console.log('Test 2 passed: Internal email sent');
    
// //     return true;
// //   } catch (error) {
// //     console.error('Email test failed:', error.message);
// //     return false;
// //   }
// // };

// // module.exports = {
// //   sendEmailSendGrid,
// //   sendEmailSMTP2GO,
// //   sendEmailWithFallback,
// //   testEmail
// // };



// // erprecruitment/utils/emailService.js
// const https = require('https');

// // Get base URL from environment or use default
// const getBaseUrl = () => {
//   return process.env.BASE_URL || 'http://localhost:5000';
// };

// // SendGrid email sender (using your API key)
// const sendEmailSendGrid = (to, subject, message, roleData = {}) => {
//   return new Promise((resolve, reject) => {
//     const baseUrl = getBaseUrl();
    
//     // Build LinkedIn post URL with proper encoding
//     const linkedInUrl = `${baseUrl}/api/linkedin/post?` + 
//       `role=${encodeURIComponent(roleData.roleName || '')}` +
//       `&company=${encodeURIComponent(roleData.client || '')}` +
//       `&location=${encodeURIComponent(roleData.location || '')}` +
//       `&experience=${encodeURIComponent(roleData.experience || '')}` +
//       `&currency=${encodeURIComponent(roleData.currency || '')}` +
//       `&minRate=${encodeURIComponent(roleData.minRate || '')}` +
//       `&maxRate=${encodeURIComponent(roleData.maxRate || '')}`;

//     console.log('Generated LinkedIn URL:', linkedInUrl);
    
//     const postData = JSON.stringify({
//       personalizations: [{
//         to: [{ email: to }]
//       }],
//       from: {
//         email: process.env.SENDGRID_FROM_EMAIL || 'praveen@prophecytechs.com',
//         name: process.env.SENDGRID_FROM_NAME || 'Prophecy Technologies'
//       },
//       subject: subject,
//       content: [
//         {
//           type: 'text/plain',
//           value: `${message}

// 📢 POST ON LINKEDIN:
// ${linkedInUrl}

// Best regards,
// Prophecy Technologies Recruitment Team`
//         },
//         {
//           type: 'text/html',
//           value: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//               <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
//                 <h1 style="margin: 0; font-size: 24px;">Prophecy Technologies</h1>
//               </div>
              
//               <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #e9ecef;">
//                 <h2 style="color: #2c3e50; margin-top: 0;">Role Assignment Notification</h2>
                
//                 <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; margin: 20px 0;">
//                   ${message.replace(/\n/g, '<br>')}
//                 </div>
                
//                 <!-- LinkedIn Post Button -->
//                 <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
//                   <a href="${linkedInUrl}" 
//                      target="_blank"
//                      style="background-color: #0077b5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 10px;">
//                     📢 Post on LinkedIn
//                   </a>
//                   <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
//                     One-click job posting to your LinkedIn profile
//                   </p>
//                   <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
//                     <em>Note: You'll be redirected to LinkedIn to complete the post</em>
//                   </p>
//                 </div>
                
//                 <hr style="border: 1px solid #eee; margin: 20px 0;">
                
//                 <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
//                   This is an automated notification from Prophecy Technologies Recruitment System.<br>
//                   Please do not reply to this email.
//                 </p>
//               </div>
//             </div>
//           `
//         }
//       ]
//     });

//     const options = {
//       hostname: 'api.sendgrid.com',
//       port: 443,
//       path: '/v3/mail/send',
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
//         'Content-Length': Buffer.byteLength(postData)
//       }
//     };

//     const req = https.request(options, (res) => {
//       let data = '';
      
//       res.on('data', (chunk) => {
//         data += chunk;
//       });
      
//       res.on('end', () => {
//         console.log(`SendGrid Response Status: ${res.statusCode}`);
//         if (res.statusCode === 202 || res.statusCode === 200) {
//           console.log('Email sent successfully via SendGrid');
//           resolve('Email sent successfully via SendGrid');
//         } else {
//           console.error('SendGrid error response:', data);
//           reject(new Error(`SendGrid failed with status: ${res.statusCode} - ${data}`));
//         }
//       });
//     });

//     req.on('error', (error) => {
//       console.error('SendGrid request error:', error);
//       reject(error);
//     });

//     req.write(postData);
//     req.end();
//   });
// };

// // SMTP2GO email sender (backup option)
// const sendEmailSMTP2GO = (to, subject, message, roleData = {}) => {
//   return new Promise((resolve, reject) => {
//     const baseUrl = getBaseUrl();
    
//     // Build LinkedIn post URL with proper encoding
//     const linkedInUrl = `${baseUrl}/api/linkedin/post?` + 
//       `role=${encodeURIComponent(roleData.roleName || '')}` +
//       `&company=${encodeURIComponent(roleData.client || '')}` +
//       `&location=${encodeURIComponent(roleData.location || '')}` +
//       `&experience=${encodeURIComponent(roleData.experience || '')}` +
//       `&currency=${encodeURIComponent(roleData.currency || '')}` +
//       `&minRate=${encodeURIComponent(roleData.minRate || '')}` +
//       `&maxRate=${encodeURIComponent(roleData.maxRate || '')}`;
    
//     const postData = JSON.stringify({
//       api_key: 'api-A4BDFA70148847B0A07E7C28D2C34057',
//       to: [to],
//       sender: 'kal@prophecytechs.com',
//       subject: subject,
//       text_body: `${message}

// 📢 POST ON LINKEDIN:
// ${linkedInUrl}

// Best regards,
// Prophecy Technologies Recruitment Team`,
//       html_body: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//           <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
//             <h1 style="margin: 0; font-size: 24px;">Prophecy Technologies</h1>
//             <p style="margin: 5px 0 0 0; opacity: 0.9;">Recruitment Management System</p>
//           </div>
          
//           <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #e9ecef;">
//             <h2 style="color: #2c3e50; margin-top: 0;">Role Assignment Notification</h2>
            
//             <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; margin: 20px 0;">
//               ${message.replace(/\n/g, '<br>')}
//             </div>
            
//             <!-- LinkedIn Post Button -->
//             <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
//               <a href="${linkedInUrl}" 
//                  target="_blank"
//                  style="background-color: #0077b5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 10px;">
//                 📢 Post on LinkedIn
//               </a>
//               <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
//                 One-click job posting to your LinkedIn profile
//               </p>
//               <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
//                 <em>Note: You'll be redirected to LinkedIn to complete the post</em>
//               </p>
//             </div>
            
//             <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
//               This is an automated notification from Prophecy Technologies Recruitment System.<br>
//               Please do not reply to this email.
//             </p>
//           </div>
//         </div>
//       `
//     });

//     const options = {
//       hostname: 'api.smtp2go.com',
//       port: 443,
//       path: '/v3/email/send',
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Content-Length': Buffer.byteLength(postData)
//       }
//     };

//     const req = https.request(options, (res) => {
//       let data = '';
      
//       res.on('data', (chunk) => {
//         data += chunk;
//       });
      
//       res.on('end', () => {
//         try {
//           const response = JSON.parse(data);
//           if (res.statusCode === 200 && response.data) {
//             resolve('Email sent successfully via SMTP2GO');
//           } else {
//             reject(new Error(`SMTP2GO failed: ${response.error || 'Unknown error'}`));
//           }
//         } catch (e) {
//           reject(new Error(`SMTP2GO response parsing failed: ${e.message}`));
//         }
//       });
//     });

//     req.on('error', (error) => {
//       reject(error);
//     });

//     req.write(postData);
//     req.end();
//   });
// };

// // Fallback email sender - tries SendGrid first, then SMTP2GO
// const sendEmailWithFallback = async (to, subject, message, roleData = {}) => {
//   try {
//     console.log(`Attempting to send email to ${to} via SendGrid...`);
//     await sendEmailSendGrid(to, subject, message, roleData);
//     return { success: true, service: 'SendGrid' };
//   } catch (error) {
//     console.error('SendGrid failed:', error.message);
//     console.log('Trying SMTP2GO as fallback...');
    
//     try {
//       await sendEmailSMTP2GO(to, subject, message, roleData);
//       return { success: true, service: 'SMTP2GO' };
//     } catch (error2) {
//       console.error('SMTP2GO also failed:', error2.message);
//       throw new Error('All email services failed');
//     }
//   }
// };

// // Test function
// const testEmail = async () => {
//   try {
//     console.log('Testing SendGrid email service...');
//     console.log('Using base URL:', getBaseUrl());
    
//     // Test 1: External email
//     await sendEmailSendGrid(
//       'dshalu5@gmail.com',
//       'SendGrid Test - External',
//       'This is a test email to external domain (Gmail).',
//       {
//         roleName: 'Software Engineer',
//         client: 'Prophecy Technologies',
//         location: 'Chennai, Tamil Nadu',
//         experience: '5 years',
//         currency: 'INR',
//         minRate: '50000',
//         maxRate: '80000'
//       }
//     );
//     console.log('Test 1 passed: External email sent');
    
//     // Test 2: Internal email
//     await sendEmailSendGrid(
//       'ashok@prophecytechs.com',
//       'SendGrid Test - Internal',
//       'This is a test email to internal domain (prophecytechs.com).',
//       {
//         roleName: 'Senior Developer',
//         client: 'Prophecy Tech',
//         location: 'Bangalore',
//         experience: '7 years',
//         currency: 'INR',
//         minRate: '80000',
//         maxRate: '120000'
//       }
//     );
//     console.log('Test 2 passed: Internal email sent');
    
//     return true;
//   } catch (error) {
//     console.error('Email test failed:', error.message);
//     return false;
//   }
// };

// module.exports = {
//   sendEmailSendGrid,
//   sendEmailSMTP2GO,
//   sendEmailWithFallback,
//   testEmail
// };




// erprecruitment/utils/emailService.js
const https = require('https');
const nodemailer = require('nodemailer');

// Get base URL from environment or use default
// Get base URL from environment or use appropriate URL
const getBaseUrl = () => {
  // Priority order:
  // 1. Environment variable
  // 2. NODE_ENV detection
  // 3. Default to production URL
  
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  if (process.env.NODE_ENV === 'development') {
    return "http://localhost:5000";
  }
  
  // Production default
  return "https://prophechyerp.duckdns.org";
};

// Helper function to check if email is internal
const isInternalEmail = (email) => {
  return email && email.toLowerCase().endsWith('@prophecytechs.com');
};

// ===== ZOHO SMTP FOR INTERNAL EMAILS =====
const sendEmailZoho = (to, subject, message, roleData = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const baseUrl = getBaseUrl();
      
      // Build LinkedIn post URL
      const linkedInUrl = `${baseUrl}/api/linkedin/post?` + 
        `role=${encodeURIComponent(roleData.roleName || '')}` +
        `&company=${encodeURIComponent(roleData.client || '')}` +
        `&location=${encodeURIComponent(roleData.location || '')}` +
        `&experience=${encodeURIComponent(roleData.experience || '')}` +
        `&currency=${encodeURIComponent(roleData.currency || '')}` +
        `&minRate=${encodeURIComponent(roleData.minRate || '')}` +
        `&maxRate=${encodeURIComponent(roleData.maxRate || '')}`;

      console.log('📧 Sending INTERNAL email via Zoho SMTP');
      console.log(`   From: ${process.env.ZOHO_EMAIL}`);
      console.log(`   To: ${to}`);

      // Create Zoho SMTP transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.zoho.com',
        port: 465,
        secure: true, // use SSL
        auth: {
          user: process.env.ZOHO_EMAIL,
          pass: process.env.ZOHO_PASSWORD
        },
        tls: {
          rejectUnauthorized: true
        }
      });

      // Verify connection
      await transporter.verify();
      console.log('✅ Zoho SMTP connection verified');

      // HTML email content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Prophecy Technologies</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #e9ecef;">
            <h2 style="color: #2c3e50; margin-top: 0;">Role Assignment Notification</h2>
            
            <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <!-- LinkedIn Post Button -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
              <a href="${linkedInUrl}" 
                 target="_blank"
                 style="background-color: #0077b5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 10px;">
                📢 Post on LinkedIn
              </a>
              <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                One-click job posting to your LinkedIn profile
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                <em>Note: You'll be redirected to LinkedIn to complete the post</em>
              </p>
            </div>
            
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              This is an automated notification from Prophecy Technologies Recruitment System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `;

      // Plain text content
      const textContent = `${message}

📢 POST ON LINKEDIN:
${linkedInUrl}

Best regards,
Prophecy Technologies Recruitment Team`;

      // Send email
      const info = await transporter.sendMail({
        from: `"Prophecy Technologies" <${process.env.ZOHO_EMAIL}>`,
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log('✅ Email sent via Zoho SMTP');
      console.log(`   Message ID: ${info.messageId}`);
      resolve('Email sent successfully via Zoho SMTP');

    } catch (error) {
      console.error('❌ Zoho SMTP error:', error.message);
      reject(error);
    }
  });
};

// ===== SENDGRID FOR EXTERNAL EMAILS =====
const sendEmailSendGrid = (to, subject, message, roleData = {}) => {
  return new Promise((resolve, reject) => {
    const baseUrl = getBaseUrl();
    
    // Build LinkedIn post URL with proper encoding
    const linkedInUrl = `${baseUrl}/api/linkedin/post?` + 
      `role=${encodeURIComponent(roleData.roleName || '')}` +
      `&company=${encodeURIComponent(roleData.client || '')}` +
      `&location=${encodeURIComponent(roleData.location || '')}` +
      `&experience=${encodeURIComponent(roleData.experience || '')}` +
      `&currency=${encodeURIComponent(roleData.currency || '')}` +
      `&minRate=${encodeURIComponent(roleData.minRate || '')}` +
      `&maxRate=${encodeURIComponent(roleData.maxRate || '')}`;

    console.log('📧 Sending EXTERNAL email via SendGrid');
    console.log(`   To: ${to}`);
    
    const postData = JSON.stringify({
      personalizations: [{
        to: [{ email: to }]
      }],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'praveen@prophecytechs.com',
        name: process.env.SENDGRID_FROM_NAME || 'Prophecy Technologies'
      },
      reply_to: {
        email: process.env.ZOHO_EMAIL || 'recruitment@prophecytechs.com',
        name: 'Prophecy Technologies Recruitment Team'
      },
      subject: subject,
      content: [
        {
          type: 'text/plain',
          value: `${message}

📢 POST ON LINKEDIN:
${linkedInUrl}

Best regards,
Prophecy Technologies Recruitment Team`
        },
        {
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">Prophecy Technologies</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #e9ecef;">
                <h2 style="color: #2c3e50; margin-top: 0;">Role Assignment Notification</h2>
                
                <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; margin: 20px 0;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                
                <!-- LinkedIn Post Button -->
                <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
                  <a href="${linkedInUrl}" 
                     target="_blank"
                     style="background-color: #0077b5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 10px;">
                    📢 Post on LinkedIn
                  </a>
                  <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                    One-click job posting to your LinkedIn profile
                  </p>
                  <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                    <em>Note: You'll be redirected to LinkedIn to complete the post</em>
                  </p>
                </div>
                
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                
                <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                  This is an automated notification from Prophecy Technologies Recruitment System.<br>
                  Please do not reply to this email.
                </p>
              </div>
            </div>
          `
        }
      ],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true }
      },
      mail_settings: {
        bypass_list_management: { enable: false },
        sandbox_mode: { enable: false }
      }
    });

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`SendGrid Response Status: ${res.statusCode}`);
        if (res.statusCode === 202 || res.statusCode === 200) {
          console.log('✅ Email sent successfully via SendGrid');
          resolve('Email sent successfully via SendGrid');
        } else {
          console.error('❌ SendGrid error response:', data);
          reject(new Error(`SendGrid failed with status: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ SendGrid request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// ===== SMTP2GO (BACKUP) =====
const sendEmailSMTP2GO = (to, subject, message, roleData = {}) => {
  return new Promise((resolve, reject) => {
    const baseUrl = getBaseUrl();
    
    const linkedInUrl = `${baseUrl}/api/linkedin/post?` + 
      `role=${encodeURIComponent(roleData.roleName || '')}` +
      `&company=${encodeURIComponent(roleData.client || '')}` +
      `&location=${encodeURIComponent(roleData.location || '')}` +
      `&experience=${encodeURIComponent(roleData.experience || '')}` +
      `&currency=${encodeURIComponent(roleData.currency || '')}` +
      `&minRate=${encodeURIComponent(roleData.minRate || '')}` +
      `&maxRate=${encodeURIComponent(roleData.maxRate || '')}`;
    
    console.log('📧 Sending email via SMTP2GO (backup)');
    console.log(`   To: ${to}`);
    
    const postData = JSON.stringify({
      api_key: 'api-A4BDFA70148847B0A07E7C28D2C34057',
      to: [to],
      sender: 'kal@prophecytechs.com',
      subject: subject,
      text_body: `${message}

📢 POST ON LINKEDIN:
${linkedInUrl}

Best regards,
Prophecy Technologies Recruitment Team`,
      html_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Prophecy Technologies</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #e9ecef;">
            <h2 style="color: #2c3e50; margin-top: 0;">Role Assignment Notification</h2>
            
            <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
              <a href="${linkedInUrl}" 
                 target="_blank"
                 style="background-color: #0077b5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 10px;">
                📢 Post on LinkedIn
              </a>
              <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                One-click job posting to your LinkedIn profile
              </p>
            </div>
            
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              This is an automated notification from Prophecy Technologies Recruitment System.
            </p>
          </div>
        </div>
      `
    });

    const options = {
      hostname: 'api.smtp2go.com',
      port: 443,
      path: '/v3/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.data) {
            console.log('✅ Email sent successfully via SMTP2GO');
            resolve('Email sent successfully via SMTP2GO');
          } else {
            console.error('❌ SMTP2GO error:', response.error || 'Unknown error');
            reject(new Error(`SMTP2GO failed: ${response.error || 'Unknown error'}`));
          }
        } catch (e) {
          console.error('❌ SMTP2GO response parsing failed:', e.message);
          reject(new Error(`SMTP2GO response parsing failed: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ SMTP2GO request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// ===== SMART ROUTING WITH FALLBACK =====
const sendEmailWithFallback = async (to, subject, message, roleData = {}) => {
  const isInternal = isInternalEmail(to);
  
  console.log('=== EMAIL SENDING ATTEMPT ===');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Is Internal: ${isInternal}`);
  
  // INTERNAL EMAILS: Use Zoho SMTP
  if (isInternal) {
    console.log('🔵 Routing: INTERNAL → Using Zoho SMTP');
    try {
      await sendEmailZoho(to, subject, message, roleData);
      console.log('✅ Internal email sent successfully via Zoho SMTP');
      return { success: true, service: 'Zoho SMTP' };
    } catch (error) {
      console.error('❌ Zoho SMTP failed:', error.message);
      console.log('🔄 Fallback: Trying SendGrid...');
      
      try {
        await sendEmailSendGrid(to, subject, message, roleData);
        console.log('✅ Email sent via SendGrid (fallback)');
        return { success: true, service: 'SendGrid' };
      } catch (error2) {
        console.error('❌ SendGrid also failed:', error2.message);
        throw new Error('All email services failed for internal email');
      }
    }
  } 
  // EXTERNAL EMAILS: Use SendGrid
  else {
    console.log('🟢 Routing: EXTERNAL → Using SendGrid');
    try {
      await sendEmailSendGrid(to, subject, message, roleData);
      console.log('✅ External email sent successfully via SendGrid');
      return { success: true, service: 'SendGrid' };
    } catch (error) {
      console.error('❌ SendGrid failed:', error.message);
      console.log('🔄 Fallback: Trying SMTP2GO...');
      
      try {
        await sendEmailSMTP2GO(to, subject, message, roleData);
        console.log('✅ Email sent via SMTP2GO (fallback)');
        return { success: true, service: 'SMTP2GO' };
      } catch (error2) {
        console.error('❌ SMTP2GO also failed:', error2.message);
        throw new Error('All email services failed for external email');
      }
    }
  }
};

// Test function
const testEmail = async () => {
  try {
    console.log('🧪 Testing email service...');
    console.log('Using base URL:', getBaseUrl());
    
    // Test 1: Internal email (Zoho to Zoho)
    console.log('\n--- Test 1: INTERNAL Email (praveen → hari) ---');
    await sendEmailWithFallback(
      'hari@prophecytechs.com',
      'Test - Internal Email via Zoho SMTP',
      'This is a test email from praveen@prophecytechs.com to hari@prophecytechs.com using Zoho SMTP.',
      {
        roleName: 'Senior Developer',
        client: 'Prophecy Technologies',
        location: 'Bangalore',
        experience: '7 years',
        currency: 'INR',
        minRate: '80000',
        maxRate: '120000'
      }
    );
    console.log('✅ Test 1 passed: Internal email sent\n');
    
    // Test 2: External email
    console.log('--- Test 2: EXTERNAL Email (Gmail) ---');
    await sendEmailWithFallback(
      'dshalu5@gmail.com',
      'Test - External Email via SendGrid',
      'This is a test email to external domain (Gmail).',
      {
        roleName: 'Software Engineer',
        client: 'Prophecy Technologies',
        location: 'Chennai',
        experience: '5 years',
        currency: 'INR',
        minRate: '50000',
        maxRate: '80000'
      }
    );
    console.log('✅ Test 2 passed: External email sent\n');
    
    console.log('🎉 All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    return false;
  }
};

module.exports = {
  sendEmailSendGrid,
  sendEmailSMTP2GO,
  sendEmailZoho,
  sendEmailWithFallback,
  testEmail,
  isInternalEmail
};