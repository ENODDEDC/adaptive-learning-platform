# Profile Picture Upload - Debugging Guide

## How to Debug the Upload Issue

### 1. Open Browser Console
- Press F12 or right-click and select "Inspect"
- Go to the "Console" tab

### 2. Try Uploading a Picture
When you upload a picture, you should see these console logs:

**Client-side logs (in browser console):**
```
Crop complete: { croppedArea: {...}, croppedAreaPixels: {...} }
Starting crop process...
Cropped area pixels: {...}
Cropped blob created: Blob {...}
Sending upload request...
Response status: 200
Response data: { message: "...", imageUrl: "...", user: {...} }
Upload successful, updating image...
Image update callback received: https://...
```

**Server-side logs (in terminal/server console):**
```
📸 Profile picture upload request received
✅ MongoDB connected
🔐 Token verified: Yes
👤 User ID: ...
📁 File received: Yes (12345 bytes, image/jpeg)
📦 Buffer created: 12345 bytes
☁️ Uploading to Backblaze: ...
✅ Upload successful: https://...
💾 Updating user profile in database...
✅ Profile picture updated successfully
🖼️ New image URL: https://...
```

### 3. Common Issues and Solutions

#### Issue: "No authentication token found"
**Solution:** Make sure you're logged in. Check if cookies are enabled.

#### Issue: "No file provided"
**Solution:** The file might not be getting to the server. Check:
- Browser console for any errors during blob creation
- Network tab to see if the FormData is being sent correctly

#### Issue: "Failed to upload file to Backblaze"
**Solution:** Check your environment variables:
- `B2_ENDPOINT`
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`

#### Issue: Image uploads but doesn't show
**Solution:** 
- Check if the URL is being returned correctly
- Verify the image URL is accessible
- Check browser console for CORS errors
- Make sure the `/api/files/[key]` endpoint is working

### 4. Check Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Try uploading
4. Look for the request to `/api/auth/profile/picture`
5. Check:
   - Request payload (should contain the image file)
   - Response (should contain imageUrl)
   - Status code (should be 200)

### 5. Verify Environment Variables
Run this in your terminal:
```bash
echo %B2_ENDPOINT%
echo %B2_KEY_ID%
echo %B2_BUCKET_NAME%
```

All should return values (not empty).

### 6. Test Backblaze Connection
Create a test file at `src/app/test-profile-upload/page.js`:
```javascript
'use client';
import { useState } from 'react';

export default function TestUpload() {
  const [result, setResult] = useState('');

  const testUpload = async () => {
    try {
      // Create a simple test blob
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      
      const formData = new FormData();
      formData.append('profilePicture', blob, 'test.jpg');
      
      const res = await fetch('/api/auth/profile/picture', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <button 
        onClick={testUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Test Upload
      </button>
      <pre className="mt-4 p-4 bg-gray-100 rounded">{result}</pre>
    </div>
  );
}
```

Then visit: `http://localhost:3000/test-profile-upload`

### 7. Check if Image is Saved in Database
After uploading, check your MongoDB database:
```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: "your-email@example.com" }, { profilePicture: 1 })
```

Should return:
```json
{
  "_id": "...",
  "profilePicture": "https://..."
}
```

## Quick Fix Checklist
- [ ] Browser console shows no errors
- [ ] Server console shows upload logs
- [ ] Network tab shows 200 response
- [ ] Response contains imageUrl
- [ ] Database has profilePicture field updated
- [ ] Image URL is accessible in browser
- [ ] Page refreshes after upload (onUpdate is called)
