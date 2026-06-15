// BackEnd/MSA/services/docuSignService.js
// COMPLETE DOCUSIGN ESIGNATURE API v2.1 INTEGRATION - FIXED VERSION

const https = require('https');
const path = require('path');
const fs = require('fs');

const docuSignService = {
  // ============================================
  // GET DOCUSIGN ACCESS TOKEN
  // ============================================
  
  getAccessToken: async () => {
    try {
      console.log('🔐 Requesting DocuSign Access Token...');
      
      const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
      const secretKey = process.env.DOCUSIGN_SECRET_KEY;
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
      const authServer = process.env.DOCUSIGN_AUTH_SERVER || 'account-d.docusign.com';
      
      if (!integrationKey || !secretKey || !accountId) {
        console.error('❌ Missing DocuSign credentials in .env file');
        console.log('Required: DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_SECRET_KEY, DOCUSIGN_ACCOUNT_ID');
        throw new Error('DocuSign credentials not configured in environment variables');
      }

      // Create Basic Auth header (Integration Key:Secret Key)
      const credentials = Buffer.from(`${integrationKey}:${secretKey}`).toString('base64');
      
      const postData = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'signature impersonation'
      }).toString();

      return new Promise((resolve, reject) => {
        const options = {
          hostname: authServer,
          port: 443,
          path: '/oauth/token',
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const response = JSON.parse(data);
                console.log('✅ DocuSign Access Token obtained successfully');
                console.log('Token expires in:', response.expires_in, 'seconds');
                resolve(response.access_token);
              } catch (e) {
                reject(new Error(`Failed to parse token response: ${e.message}`));
              }
            } else {
              console.error('❌ Token request failed:', res.statusCode, data);
              reject(new Error(`Token request failed: ${res.statusCode} - ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Token request error:', error.message);
          reject(error);
        });

        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('❌ Error getting access token:', error.message);
      throw error;
    }
  },

  // ============================================
  // CREATE ENVELOPE AND SEND FOR SIGNATURE
  // ============================================
  
  createAndSendEnvelope: async (envelopeData) => {
    try {
      console.log('📨 Creating DocuSign Envelope...');
      
      const {
        fileName,
        fileBuffer,
        fileType,
        recipientEmail,
        recipientName,
        recipientTitle,
        documentId,
        signingToken,
        tabs = [] // Dynamic tabs from frontend
      } = envelopeData;

      // Validate required fields
      if (!fileName || !fileBuffer || !recipientEmail || !recipientName) {
        throw new Error('Missing required envelope data');
      }

      // Get access token
      const accessToken = await docuSignService.getAccessToken();
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
      const baseUrl = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';

      // Prepare document
      const documentBase64 = fileBuffer.toString('base64');
      
      // Get file extension correctly
      const fileExtension = path.extname(fileName).substring(1) || 'pdf';
      
      // Prepare tabs based on frontend input or use defaults
      const signHereTabs = tabs.filter(tab => tab.type === 'signature').map(tab => ({
        documentId: '1',
        pageNumber: tab.pageNumber || '1',
        xPosition: tab.xPosition || '100',
        yPosition: tab.yPosition || '100',
        optional: tab.optional || 'false'
      }));

      const dateSignedTabs = tabs.filter(tab => tab.type === 'date').map(tab => ({
        documentId: '1',
        pageNumber: tab.pageNumber || '1',
        xPosition: tab.xPosition || '100',
        yPosition: tab.yPosition || '130',
        optional: tab.optional || 'false'
      }));

      const initialHereTabs = tabs.filter(tab => tab.type === 'initial').map(tab => ({
        documentId: '1',
        pageNumber: tab.pageNumber || '1',
        xPosition: tab.xPosition || '100',
        yPosition: tab.yPosition || '160',
        optional: tab.optional || 'false'
      }));

      const fullNameTabs = tabs.filter(tab => tab.type === 'name').map(tab => ({
        documentId: '1',
        pageNumber: tab.pageNumber || '1',
        xPosition: tab.xPosition || '200',
        yPosition: tab.yPosition || '100',
        optional: tab.optional || 'false'
      }));

      const emailTabs = tabs.filter(tab => tab.type === 'email').map(tab => ({
        documentId: '1',
        pageNumber: tab.pageNumber || '1',
        xPosition: tab.xPosition || '200',
        yPosition: tab.yPosition || '130',
        optional: tab.optional || 'false'
      }));

      // Create envelope definition
      const envelopeDefinition = {
        emailSubject: `Please sign: ${fileName}`,
        emailBlurb: `You have been requested to sign: ${fileName}. Please review and sign at your earliest convenience.`,
        documents: [
          {
            documentBase64: documentBase64,
            name: fileName,
            fileExtension: fileExtension,
            documentId: '1'
          }
        ],
        recipients: {
          signers: [
            {
              email: recipientEmail,
              name: recipientName,
              clientUserId: signingToken, // Used for embedded signing
              recipientId: '1',
              routingOrder: '1',
              tabs: {
                signHereTabs: signHereTabs.length > 0 ? signHereTabs : [{
                  documentId: '1',
                  pageNumber: '1',
                  xPosition: '100',
                  yPosition: '100',
                  optional: 'false'
                }],
                dateSignedTabs: dateSignedTabs,
                initialHereTabs: initialHereTabs,
                fullNameTabs: fullNameTabs,
                emailTabs: emailTabs
              }
            }
          ]
        },
        eventNotification: {
          url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/msa/docusign/webhook`,
          loggingEnabled: 'true',
          requireAcknowledgment: 'true',
          envelopeEvents: [
            { envelopeEventStatusCode: 'sent' },
            { envelopeEventStatusCode: 'delivered' },
            { envelopeEventStatusCode: 'completed' },
            { envelopeEventStatusCode: 'declined' },
            { envelopeEventStatusCode: 'voided' }
          ],
          recipientEvents: [
            { recipientEventStatusCode: 'sent' },
            { recipientEventStatusCode: 'delivered' },
            { recipientEventStatusCode: 'completed' },
            { recipientEventStatusCode: 'declined' }
          ]
        },
        status: 'sent'
      };

      const payload = JSON.stringify(envelopeDefinition);

      return new Promise((resolve, reject) => {
        const options = {
          hostname: new URL(baseUrl).hostname,
          port: 443,
          path: `/v2.1/accounts/${accountId}/envelopes`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        console.log('📤 Sending envelope to DocuSign API...');

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const response = JSON.parse(data);
                console.log('✅ Envelope created successfully!');
                console.log('Envelope ID:', response.envelopeId);
                resolve({
                  success: true,
                  envelopeId: response.envelopeId,
                  uri: response.uri,
                  statusDateTime: response.statusDateTime
                });
              } catch (e) {
                reject(new Error(`Failed to parse envelope response: ${e.message}`));
              }
            } else {
              console.error('❌ Envelope creation failed:', res.statusCode);
              console.error('Error response:', data);
              reject(new Error(`Envelope creation failed: ${res.statusCode} - ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Envelope request error:', error.message);
          reject(error);
        });

        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.error('❌ Error creating envelope:', error.message);
      throw error;
    }
  },

  // ============================================
  // GET ENVELOPE STATUS
  // ============================================
  
  getEnvelopeStatus: async (envelopeId) => {
    try {
      console.log('📊 Getting envelope status for:', envelopeId);
      
      if (!envelopeId) {
        throw new Error('Envelope ID is required');
      }

      const accessToken = await docuSignService.getAccessToken();
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
      const baseUrl = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';

      return new Promise((resolve, reject) => {
        const options = {
          hostname: new URL(baseUrl).hostname,
          port: 443,
          path: `/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        };

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const response = JSON.parse(data);
                console.log('✅ Envelope status retrieved:', response.status);
                resolve(response);
              } catch (e) {
                reject(new Error(`Failed to parse status response: ${e.message}`));
              }
            } else {
              console.error('❌ Status request failed:', res.statusCode);
              reject(new Error(`Status request failed: ${res.statusCode}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Status request error:', error.message);
          reject(error);
        });

        req.end();
      });
    } catch (error) {
      console.error('❌ Error getting envelope status:', error.message);
      throw error;
    }
  },

  // ============================================
  // CREATE RECIPIENT VIEW (FOR EMBEDDED SIGNING)
  // ============================================
  
  createRecipientView: async (envelopeId, signerEmail, signerName, signingToken) => {
    try {
      console.log('👤 Creating recipient view for embedded signing...');
      
      if (!envelopeId || !signerEmail || !signerName || !signingToken) {
        throw new Error('Missing required parameters for recipient view');
      }

      const accessToken = await docuSignService.getAccessToken();
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
      const baseUrl = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';
      const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:218'}/msa/signing-complete`;

      const recipientView = {
        returnUrl: returnUrl,
        authenticationMethod: 'None',
        clientUserId: signingToken,
        email: signerEmail,
        userName: signerName,
        recipientId: '1'
      };

      const payload = JSON.stringify(recipientView);

      return new Promise((resolve, reject) => {
        const options = {
          hostname: new URL(baseUrl).hostname,
          port: 443,
          path: `/v2.1/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const response = JSON.parse(data);
                console.log('✅ Recipient view created successfully');
                resolve(response.url);
              } catch (e) {
                reject(new Error(`Failed to parse recipient view response: ${e.message}`));
              }
            } else {
              console.error('❌ Recipient view creation failed:', res.statusCode, data);
              reject(new Error(`Recipient view creation failed: ${res.statusCode}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Recipient view error:', error.message);
          reject(error);
        });

        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.error('❌ Error creating recipient view:', error.message);
      throw error;
    }
  },

  // ============================================
  // DOWNLOAD ENVELOPE DOCUMENTS
  // ============================================
  
  downloadEnvelopeDocuments: async (envelopeId) => {
    try {
      console.log('📥 Downloading documents for envelope:', envelopeId);
      
      const accessToken = await docuSignService.getAccessToken();
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
      const baseUrl = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';

      return new Promise((resolve, reject) => {
        const options = {
          hostname: new URL(baseUrl).hostname,
          port: 443,
          path: `/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/pdf'
          }
        };

        const req = https.request(options, (res) => {
          const chunks = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const pdfBuffer = Buffer.concat(chunks);
              console.log('✅ Document downloaded successfully');
              resolve(pdfBuffer);
            } else {
              console.error('❌ Document download failed:', res.statusCode);
              reject(new Error(`Document download failed: ${res.statusCode}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Download error:', error.message);
          reject(error);
        });

        req.end();
      });
    } catch (error) {
      console.error('❌ Error downloading documents:', error.message);
      throw error;
    }
  },

  // ============================================
  // VOID ENVELOPE
  // ============================================
  
  voidEnvelope: async (envelopeId, voidReason = 'Cancelled by sender') => {
    try {
      console.log('⛔ Voiding envelope:', envelopeId);
      
      const accessToken = await docuSignService.getAccessToken();
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
      const baseUrl = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';

      const voidData = {
        status: 'voided',
        voidedReason: voidReason
      };

      const payload = JSON.stringify(voidData);

      return new Promise((resolve, reject) => {
        const options = {
          hostname: new URL(baseUrl).hostname,
          port: 443,
          path: `/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('✅ Envelope voided successfully');
              resolve({ success: true, envelopeId });
            } else {
              console.error('❌ Void envelope failed:', res.statusCode);
              reject(new Error(`Void envelope failed: ${res.statusCode}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.error('❌ Error voiding envelope:', error.message);
      throw error;
    }
  },

  // ============================================
  // LIST ENVELOPES
  // ============================================
  
  listEnvelopes: async (options = {}) => {
    try {
      console.log('📋 Listing envelopes...');
      
      const accessToken = await docuSignService.getAccessToken();
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
      const baseUrl = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';

      const fromDate = options.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const status = options.status || 'sent,completed,delivered,declined';

      const queryParams = new URLSearchParams({
        from_date: fromDate,
        status: status,
        order: 'desc',
        order_by: 'sent_date',
        count: options.limit || '50'
      });

      return new Promise((resolve, reject) => {
        const reqOptions = {
          hostname: new URL(baseUrl).hostname,
          port: 443,
          path: `/v2.1/accounts/${accountId}/envelopes?${queryParams.toString()}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        };

        const req = https.request(reqOptions, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const response = JSON.parse(data);
                console.log('✅ Envelopes listed:', response.envelopes?.length || 0);
                resolve(response);
              } catch (e) {
                reject(new Error(`Failed to parse envelopes response: ${e.message}`));
              }
            } else {
              console.error('❌ List envelopes failed:', res.statusCode);
              reject(new Error(`List envelopes failed: ${res.statusCode}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ List envelopes error:', error.message);
          reject(error);
        });

        req.end();
      });
    } catch (error) {
      console.error('❌ Error listing envelopes:', error.message);
      throw error;
    }
  },

  // ============================================
  // WEBHOOK HANDLER FOR ENVELOPE EVENTS
  // ============================================
  
  handleWebhook: async (webhookData) => {
    try {
      console.log('🔔 DocuSign Webhook Received');
      console.log('Event:', webhookData.event);
      
      // Extract envelope information
      const envelopeId = webhookData.envelopeId || webhookData.envelope?.envelopeId;
      const status = webhookData.status || webhookData.envelope?.status;
      
      console.log('Envelope ID:', envelopeId);
      console.log('Status:', status);
      
      return {
        success: true,
        envelopeId,
        status,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error handling webhook:', error.message);
      throw error;
    }
  }
};

module.exports = docuSignService;