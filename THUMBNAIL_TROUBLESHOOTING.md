# Thumbnail Generation Troubleshooting Guide

## Problem
Thumbnails are not being generated for uploaded PDF files.

## Root Causes Identified

### 1. **Async Thumbnail Generation Not Logging Errors**
The thumbnail generation in `upload/route.js` was fire-and-forget, meaning errors were silently swallowed.

### 2. **Internal API Call Issues**
The code was trying to call the thumbnail API via HTTP using `NEXT_PUBLIC_BASE_URL`, which might fail in production if:
- The URL is not properly set
- Internal network calls are blocked
- The service is trying to call itself before it's fully ready

### 3. **Missing Environment Variable**
The `RENDER_EXTERNAL_URL` was not set in render.yaml for proper internal API routing.

## Fixes Applied

### 1. Enhanced Error Logging in Upload Route
- Added detailed logging for thumbnail generation attempts
- Added timeout handling (30 seconds)
- Added better error messages with stack traces
- Now logs the full URL being called

### 2. Improved URL Resolution
Changed from:
```javascript
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
```

To:
```javascript
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : (process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
```

### 3. Enhanced PDF Thumbnail Route Logging
Added detailed logging for:
- File key being used
- Bucket name
- Endpoint URL
- Credential availability
- Download progress

### 4. Added Thumbnail Key Field
Updated Content model to include `thumbnailKey` field for better tracking.

### 5. Updated render.yaml
Added `RENDER_EXTERNAL_URL` environment variable.

## How to Diagnose

### Step 1: Check Your Uploaded File
```bash
node scripts/check-uploaded-file.js test
```

This will show you:
- File details
- Cloud storage information
- Thumbnail status
- Command to manually generate thumbnail if missing

### Step 2: Check Render Logs
Look for these log patterns:

**Upload Success:**
```
✅ All files uploaded successfully
📦 Upload results summary
```

**Thumbnail Generation Attempt:**
```
🖼️ Triggering thumbnail generation for [contentId] via /api/pdf-thumbnail
🌐 Thumbnail API URL: [url]
```

**Thumbnail Generation Success:**
```
✅ Thumbnail generated successfully for [contentId]
```

**Thumbnail Generation Failure:**
```
❌ Thumbnail generation failed for [contentId]
```

### Step 3: Manual Thumbnail Generation
If a file is missing a thumbnail, you can generate it manually:

```bash
node scripts/test-thumbnail-generation.js <contentId> <fileKey>
```

Example:
```bash
node scripts/test-thumbnail-generation.js 674601234567890abcdef123 "classwork/1732627186285_test.pdf"
```

## Environment Variables to Check on Render

Make sure these are set in your Render dashboard:

1. **NEXT_PUBLIC_BASE_URL** - Your production URL (e.g., `https://your-app.onrender.com`)
2. **RENDER_EXTERNAL_URL** - Same as above, without `https://` (e.g., `your-app.onrender.com`)
3. **B2_KEY_ID** - Your Backblaze B2 key ID
4. **B2_APPLICATION_KEY** - Your Backblaze B2 application key
5. **B2_BUCKET_NAME** - Your bucket name (INTELEVO)
6. **B2_ENDPOINT** - Your B2 endpoint (https://s3.us-east-005.backblazeb2.com)

## Testing Locally

### 1. Upload a Test File
1. Go to your app
2. Upload a PDF file named "test.pdf"
3. Watch the console logs

### 2. Check the Logs
You should see:
```
🚀 Upload API called
✅ Content record created in MongoDB: [id]
🖼️ Triggering thumbnail generation for [id] via /api/pdf-thumbnail
📋 Thumbnail request data: { fileKey: '...', contentId: '...', mimeType: '...' }
🌐 Thumbnail API URL: http://localhost:3000/api/pdf-thumbnail
```

Then in the thumbnail API:
```
🚀 PDF Thumbnail API called - Creating single-page PDF thumbnail
📥 Downloading original PDF from Backblaze...
🔑 Using file key: classwork/...
✅ Original PDF downloaded successfully
✂️ Extracting first page to create thumbnail PDF...
☁️ Uploading thumbnail PDF to Backblaze...
✅ PDF thumbnail uploaded successfully
💾 Updating Content document with thumbnail URL...
✅ Content document updated successfully with thumbnail URL
```

## Common Issues

### Issue 1: "File not found in storage"
**Cause:** The file key doesn't match what's in Backblaze
**Solution:** Check the `cloudStorage.key` field in MongoDB matches the actual file in B2

### Issue 2: "Access denied to file"
**Cause:** Backblaze credentials are incorrect or expired
**Solution:** Verify B2_KEY_ID and B2_APPLICATION_KEY in environment variables

### Issue 3: "Thumbnail generation timeout"
**Cause:** The API call is taking too long or hanging
**Solution:** Check network connectivity and Backblaze B2 status

### Issue 4: "Rate limit exceeded"
**Cause:** Too many thumbnail generation requests
**Solution:** Wait 1 minute and try again (rate limit: 10 requests per minute per IP)

## Next Steps

1. **Deploy the fixes** to Render
2. **Set RENDER_EXTERNAL_URL** in Render dashboard
3. **Upload a new test file** and watch the logs
4. **Check existing files** with the diagnostic script
5. **Manually generate missing thumbnails** if needed

## Monitoring

After deployment, monitor these metrics:
- Thumbnail generation success rate
- Average generation time
- Backblaze B2 API call count
- Error rates in logs

## Support

If issues persist:
1. Share the full logs from Render (especially around upload time)
2. Run the diagnostic script and share output
3. Check Backblaze B2 dashboard for file existence
4. Verify all environment variables are set correctly
