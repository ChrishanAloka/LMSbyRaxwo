# How to Test AWS S3 Implementation

## Method 1: Quick Test with Test Endpoint (Easiest)

### Step 1: Start your backend server
```bash
npm start
```

### Step 2: Test S3 Upload
Open your browser or use Postman/curl:

**Using Browser:**
- Go to: `https://lms-f679.onrender.com/api/test/s3-upload`
- Or use POST method to: `https://lms-f679.onrender.com/api/test/s3-upload`

**Using curl:**
```bash
curl -X POST https://lms-f679.onrender.com/api/test/s3-upload
```

**Using Postman:**
- Method: POST
- URL: `https://lms-f679.onrender.com/api/test/s3-upload`
- Click Send

### Step 3: Check the Response
You should get a response like:
```json
{
  "success": true,
  "message": "S3 upload test successful!",
  "imageUrl": "https://raxwo-lms.s3.eu-north-1.amazonaws.com/uploads/1234567890-123456789-test-image.png"
}
```

### Step 4: Verify in Browser
1. Copy the `imageUrl` from the response
2. Paste it in your browser
3. If you see a small image (1x1 pixel), S3 upload is working! ✅

### Step 5: Check S3 Bucket
1. Go to AWS Console → S3
2. Open your bucket: `raxwo-lms`
3. Navigate to `uploads/` folder
4. You should see a file named like: `1234567890-123456789-test-image.png`

---

## Method 2: Test with Real Image Upload (Subject Creation)

### Step 1: Start your backend server
```bash
npm start
```

### Step 2: Use your frontend
1. Go to your admin panel
2. Navigate to Subjects page
3. Click "Add Subject" or "Create Subject"
4. Fill in the form:
   - Name: Test Subject
   - Description: Testing S3 upload
   - Upload an image (choose any image file)
   - Other required fields
5. Submit the form

### Step 3: Check the Response
- The subject should be created successfully
- Check the response - the `image` field should contain an S3 URL like:
  ```
  https://raxwo-lms.s3.eu-north-1.amazonaws.com/uploads/...
  ```

### Step 4: Verify Image Display
1. Check if the image displays in your frontend
2. If it shows, S3 is working! ✅
3. If it doesn't show, check browser console for errors

### Step 5: Check S3 Bucket
1. Go to AWS Console → S3 → `raxwo-lms`
2. Check the `uploads/` folder
3. You should see your uploaded image file

---

## Method 3: Check Server Logs

When you upload an image, check your server console for:
- ✅ Success: No errors, image URL returned
- ❌ Error: Look for error messages like:
  - "Access Denied" → Check bucket permissions
  - "Invalid credentials" → Check .env file
  - "Bucket not found" → Check bucket name

---

## Troubleshooting

### Image doesn't display in browser
**Problem:** Image URL returns 403 Forbidden or Access Denied

**Solution:**
1. Go to S3 bucket → Permissions
2. Edit "Block public access" → Uncheck all
3. Add bucket policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::raxwo-lms/*"
    }
  ]
}
```

### Upload fails with "Access Denied"
**Problem:** IAM user doesn't have permissions

**Solution:**
1. Go to IAM → Users → Your user
2. Attach policy: `AmazonS3FullAccess` (or custom policy with PutObject, GetObject, DeleteObject permissions)

### Upload fails with "Invalid credentials"
**Problem:** Wrong credentials in .env

**Solution:**
1. Check `.env` file
2. Verify:
   - `AWS_ACCESS_KEY_ID` is correct
   - `AWS_SECRET_ACCESS_KEY` is correct
   - `AWS_REGION` matches your bucket region
   - `AWS_S3_BUCKET_NAME` matches your bucket name

---

## Expected Results

✅ **Success Indicators:**
- Test endpoint returns success with imageUrl
- Image displays in browser when you open the URL
- File appears in S3 bucket
- Subject creation/update works with image upload
- Image displays in frontend

❌ **Failure Indicators:**
- Error messages in console
- 403 Forbidden when accessing image URL
- Image doesn't appear in S3 bucket
- Upload fails with error

---

## Quick Checklist

- [ ] Server is running
- [ ] .env file has correct AWS credentials
- [ ] Test endpoint works (`/api/test/s3-upload`)
- [ ] Image URL opens in browser
- [ ] File appears in S3 bucket
- [ ] Real upload (subject creation) works
- [ ] Image displays in frontend

---

## Remove Test Routes (After Testing)

Once you've confirmed everything works, you can remove the test routes from `server.js`:
- Remove: `app.post('/api/test/s3-upload', testS3Upload);`
- Remove: `app.delete('/api/test/s3-delete', testS3Delete);`
- Remove: `import { testS3Upload, testS3Delete } from './controllers/testS3Controller.js';`

Or keep them for future testing - they're harmless.

