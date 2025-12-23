import 'dotenv/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Test if an image URL is accessible
const testImageUrl = async (imageUrl) => {
  try {
    console.log('Testing image URL:', imageUrl);
    
    // Extract bucket and key from URL
    const urlMatch = imageUrl.match(/https:\/\/([^\.]+)\.s3\.([^\.]+)\.amazonaws\.com\/(.+)/);
    
    if (!urlMatch) {
      console.error('Invalid S3 URL format');
      return;
    }
    
    const [, bucket, region, key] = urlMatch;
    
    console.log('Bucket:', bucket);
    console.log('Region:', region);
    console.log('Key:', key);
    
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    console.log('\n✓ Image is accessible!');
    console.log('Content-Type:', response.ContentType);
    console.log('Content-Length:', response.ContentLength, 'bytes');
    console.log('\nTo test in browser, open this URL:');
    console.log(imageUrl);
    
  } catch (error) {
    console.error('\n✗ Image is NOT accessible');
    console.error('Error:', error.message);
    
    if (error.name === 'NoSuchKey') {
      console.error('\nThe file does not exist in S3');
    } else if (error.name === 'AccessDenied') {
      console.error('\nAccess denied - Bucket policy needs to be configured');
      console.error('See FIX_S3_IMAGE_DISPLAY.md for instructions');
    } else {
      console.error('\nCheck:');
      console.error('1. Bucket policy allows public read');
      console.error('2. Block public access is disabled');
      console.error('3. Image URL is correct');
    }
  }
};

// Get image URL from command line argument
const imageUrl = process.argv[2];

if (!imageUrl) {
  console.log('Usage: node scripts/testImageUrl.js <image-url>');
  console.log('Example: node scripts/testImageUrl.js https://raxwo-lms.s3.us-east-1.amazonaws.com/uploads/123-test.jpg');
  process.exit(1);
}

testImageUrl(imageUrl);

