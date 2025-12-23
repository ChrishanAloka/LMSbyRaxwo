import 'dotenv/config';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

// Test S3 connection
const testS3Connection = async () => {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('Testing S3 connection...');
    console.log('Region:', process.env.AWS_REGION);
    console.log('Bucket:', process.env.AWS_S3_BUCKET_NAME);
    console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');

    // Test connection by listing buckets
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    console.log('\n✓ S3 connection successful!');
    console.log('Available buckets:', response.Buckets.map(b => b.Name).join(', '));
    
    // Check if our bucket exists
    const bucketExists = response.Buckets.some(b => b.Name === process.env.AWS_S3_BUCKET_NAME);
    if (bucketExists) {
      console.log(`✓ Bucket "${process.env.AWS_S3_BUCKET_NAME}" found!`);
    } else {
      console.log(`⚠ Bucket "${process.env.AWS_S3_BUCKET_NAME}" not found in list.`);
      console.log('   Make sure the bucket name is correct and you have access to it.');
    }
  } catch (error) {
    console.error('\n✗ S3 connection failed!');
    console.error('Error:', error.message);
    if (error.name === 'InvalidAccessKeyId') {
      console.error('\nPossible issues:');
      console.error('- Access Key ID is incorrect');
      console.error('- Secret Access Key is incorrect');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('\nPossible issues:');
      console.error('- Secret Access Key is incorrect');
    } else {
      console.error('\nCheck your AWS credentials and region in .env file');
    }
  }
};

testS3Connection();

