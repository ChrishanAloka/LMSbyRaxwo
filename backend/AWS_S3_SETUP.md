# AWS S3 Setup Instructions

## Step 1: Add AWS Credentials to .env File

Add the following environment variables to your `.env` file in the root of the backend project:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

### Important Notes:
- Replace `your_access_key_id_here` with your actual AWS Access Key ID
- Replace `your_secret_access_key_here` with your actual AWS Secret Access Key
- Replace `us-east-1` with your S3 bucket's region (e.g., `ap-south-1`, `eu-west-1`, etc.)
- Replace `your-bucket-name` with your actual S3 bucket name

## Step 2: Configure S3 Bucket for Public Access (Optional)

If you want images to be publicly accessible:

1. Go to your S3 bucket in AWS Console
2. Click on **Permissions** tab
3. Under **Block public access**, click **Edit** and uncheck all options (or configure as needed)
4. Under **Bucket policy**, add this policy (replace `your-bucket-name`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Step 3: Configure CORS (If Needed)

If your frontend is on a different domain:

1. Go to your S3 bucket → **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Add this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-frontend-domain.com"],
    "ExposeHeaders": []
  }
]
```

Replace `http://localhost:3000` and `https://your-frontend-domain.com` with your actual frontend URLs.

## Step 4: Test the Implementation

1. Start your backend server
2. Try uploading an image through your frontend
3. Check your S3 bucket to verify the image was uploaded
4. Verify the image displays correctly in your frontend

## Troubleshooting

### Error: "Access Denied"
- Check that your IAM user has the correct permissions
- Verify your access key and secret key are correct
- Ensure the bucket name in `.env` matches your actual bucket name

### Error: "Invalid region"
- Verify the region in `.env` matches your bucket's region
- Common regions: `us-east-1`, `us-west-2`, `eu-west-1`, `ap-south-1`

### Images not displaying
- Check if bucket has public read access (if using public URLs)
- Verify CORS configuration if frontend is on different domain
- Check browser console for CORS errors

## What Changed

- **Multer**: Now uses memory storage instead of disk storage
- **Subject Controller**: Uploads images to S3 instead of local `uploads/` folder
- **S3 Service**: New service file handles all S3 operations (upload, delete, signed URLs)

## File Structure

```
services/
  └── s3Service.js          # S3 upload/delete functions
controllers/
  └── subjectController.js   # Updated to use S3
routes/
  └── subjectRoutes.js       # Updated multer config
```

