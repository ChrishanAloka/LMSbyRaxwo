# Fix S3 Images Not Displaying in Frontend

## Problem
Images upload to S3 successfully but don't display in the frontend. This is usually a **bucket permissions** or **CORS** issue.

## Solution: Configure S3 Bucket for Public Access

### Step 1: Enable Public Access

1. Go to **AWS Console** → **S3**
2. Click on your bucket: **`raxwo-lms`**
3. Go to **Permissions** tab
4. Scroll to **Block public access (bucket settings)**
5. Click **Edit**
6. **Uncheck all 4 options**:
   - ☐ Block all public access
   - ☐ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ☐ Block public access to buckets and objects granted through any access control lists (ACLs)
   - ☐ Block public access to buckets and objects granted through new public bucket or access point policies
7. Click **Save changes**
8. Type **`confirm`** and click **Confirm**

### Step 2: Add Bucket Policy for Public Read Access

1. Still in **Permissions** tab
2. Scroll to **Bucket policy**
3. Click **Edit**
4. Paste this policy:

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

5. Click **Save changes**

### Step 3: Configure CORS (Cross-Origin Resource Sharing)

1. Still in **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Paste this configuration:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://your-frontend-domain.com"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

**Important:** Replace `https://your-frontend-domain.com` with your actual frontend domain URL (if you have one deployed).

5. Click **Save changes**

### Step 4: Test the Image URL

1. After uploading an image, check the response from your backend
2. You should get an S3 URL like:
   ```
   https://raxwo-lms.s3.us-east-1.amazonaws.com/uploads/1234567890-123456789-filename.jpg
   ```
3. **Copy this URL** and paste it directly in your browser
4. If you see the image → ✅ Bucket policy is working!
5. If you see "Access Denied" → Check Step 1 and 2 again

### Step 5: Check Browser Console

1. Open your frontend in browser
2. Open **Developer Tools** (F12)
3. Go to **Console** tab
4. Look for errors like:
   - `CORS policy: No 'Access-Control-Allow-Origin' header` → Fix CORS (Step 3)
   - `403 Forbidden` → Fix bucket policy (Step 2)
   - `Access Denied` → Fix public access (Step 1)

## Quick Checklist

- [ ] Block public access is disabled (Step 1)
- [ ] Bucket policy added for public read (Step 2)
- [ ] CORS configured (Step 3)
- [ ] Image URL opens in browser directly (Step 4)
- [ ] No CORS errors in browser console (Step 5)

## Alternative: Use Signed URLs (For Private Images)

If you want to keep images private, you can use signed URLs instead. This requires updating the backend to generate signed URLs when serving image data.

## Troubleshooting

### Still not working?

1. **Check the image URL format:**
   - Should be: `https://raxwo-lms.s3.us-east-1.amazonaws.com/uploads/...`
   - If it's different, check your S3 service configuration

2. **Verify bucket name:**
   - Make sure it's exactly: `raxwo-lms`
   - Check in AWS Console

3. **Check IAM permissions:**
   - Your IAM user needs `s3:PutObject` and `s3:GetObject` permissions
   - Verify in IAM → Users → Your user → Permissions

4. **Clear browser cache:**
   - Sometimes cached errors persist
   - Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

5. **Test with curl:**
   ```bash
   curl -I https://raxwo-lms.s3.us-east-1.amazonaws.com/uploads/your-image-name.jpg
   ```
   - Should return `200 OK` if public access is working
   - Should return `403 Forbidden` if not configured

## Security Note

Making the bucket publicly readable means anyone with the URL can access the images. This is fine for public content like course images, but if you need private images, use signed URLs instead.

