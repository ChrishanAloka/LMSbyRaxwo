import 'dotenv/config';
import { S3Client, GetBucketLocationCommand } from '@aws-sdk/client-s3';

const checkBucketLocation = async () => {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('Checking bucket location...');
    console.log('Bucket:', process.env.AWS_S3_BUCKET_NAME);
    console.log('Configured region:', process.env.AWS_REGION);

    const command = new GetBucketLocationCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
    });

    const response = await s3Client.send(command);
    const actualRegion = response.LocationConstraint || 'us-east-1'; // us-east-1 returns null
    
    console.log('\n✓ Bucket location check successful!');
    console.log('Actual bucket region:', actualRegion);
    console.log('Configured region:', process.env.AWS_REGION);
    
    if (actualRegion !== process.env.AWS_REGION) {
      console.log('\n⚠ WARNING: Region mismatch!');
      console.log(`Update your .env file: AWS_REGION=${actualRegion}`);
    } else {
      console.log('\n✓ Regions match!');
    }
  } catch (error) {
    console.error('\n✗ Failed to check bucket location');
    console.error('Error:', error.message);
  }
};

checkBucketLocation();

