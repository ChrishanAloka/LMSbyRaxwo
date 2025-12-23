import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Configure S3 Client with proper region and endpoint
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name with extension
 * @param {string} mimetype - File mimetype
 * @returns {Promise<string>} - S3 object key
 */
export const uploadToS3 = async (fileBuffer, fileName, mimetype) => {
  try {
    // Generate unique file name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const key = `uploads/${uniqueSuffix}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
      // Note: ACL is deprecated in newer AWS accounts
      // Use bucket policy for public access instead
      // ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return the S3 URL (public URL) - using correct format for the region
    // For eu-north-1 and other regions, use the region-specific endpoint
    const publicUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    
    // Provide more detailed error information
    if (error.name === 'PermanentRedirect') {
      console.error('PermanentRedirect error - Bucket region might be incorrect');
      console.error('Current region:', AWS_REGION);
      console.error('Bucket:', BUCKET_NAME);
      throw new Error(`S3 region mismatch. Please verify the bucket is in region: ${AWS_REGION}`);
    }
    
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} fileUrl - Full S3 URL or object key
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (fileUrl) => {
  try {
    // Extract key from URL if full URL is provided
    let key = fileUrl;
    if (fileUrl.includes('.amazonaws.com/')) {
      key = fileUrl.split('.amazonaws.com/')[1];
    } else if (fileUrl.startsWith('/uploads/')) {
      key = fileUrl.substring(1); // Remove leading '/'
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Deleted file from S3: ${key}`);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    // Don't throw error - file might not exist
  }
};

/**
 * Get signed URL for private files (temporary access)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
export const getSignedUrlForFile = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
};

