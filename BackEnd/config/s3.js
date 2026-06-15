const AWS = require('aws-sdk');
require('dotenv').config();

// Setup S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Upload file to S3
const uploadFile = async (file, folder = 'recruitment') => {
  try {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const key = `${folder}/resumes/${timestamp}-${originalName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    };

    const result = await s3.upload(params).promise();
    
    console.log('✅ File uploaded to S3:', result.Location);
    return {
      url: result.Location,
      key: key,
      fileName: originalName
    };
    
  } catch (error) {
    console.error('❌ S3 Upload Error:', error);
    throw error;
  }
};

// Delete file from S3
const deleteFile = async (fileKey) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    };
    
    await s3.deleteObject(params).promise();
    console.log('✅ File deleted from S3:', fileKey);
    return true;
  } catch (error) {
    console.error('❌ S3 Delete Error:', error);
    throw error;
  }
};

// Get file from S3 - FIXED: This function exists and is exported
const getFile = async (fileKey) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    };
    
    const result = await s3.getObject(params).promise();
    return result;
  } catch (error) {
    console.error('❌ S3 Get File Error:', error);
    throw error;
  }
};

// Generate signed URL for temporary access
const getSignedUrl = async (fileKey, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Expires: expiresIn
    };
    
    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (error) {
    console.error('❌ S3 Signed URL Error:', error);
    throw error;
  }
};

// FIXED: Export all functions including getFile
module.exports = { 
  uploadFile, 
  deleteFile, 
  getFile,  // Make sure this is included
  getSignedUrl,
  s3 
};