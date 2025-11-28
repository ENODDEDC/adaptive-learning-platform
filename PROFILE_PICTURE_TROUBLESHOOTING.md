# Profile Picture Upload - Troubleshooting Guide

## 🚨 If Upload "Doesn't Save"

### Step 1: Test the Upload Independently
Visit: **http://localhost:3000/test-profile-picture**

This test page will:
- ✅ Create a simple test image
- ✅ Upload it to the API
- ✅ Show you the exact response
- ✅ Display the uploaded image
- ✅ Let you verify it's saved in the database

**What to look for:**
- If this works → The API is fine, issue is in the Settings page
- If this fails → Check the error message for clues

---

### Step 2: Check Browser Console
Press **F12** and go to the **Console** tab.

When you upload, you should see these logs with emojis:

```
🚀 Starting crop process...
📐 Cropped area pixels: {...}
✂️ Creating cropped blob...
✅ Cropped blob created: { size: 12345, type: 'image/jpeg' }
📦 FormData created
📡 Sending upload request to /api/auth/profile/picture...
📨 Response received - Status: 200
📄 Response data: {...}
✅ Upload successful!
🔗 New image URL: https://...
🔄 Calling onImageUpdate with: https://...
🧹 Cleaning up modal...
✨ Upload process complete!
```

**If you see an error:**
- Note which emoji/step it fails at
- Check the error message
- Look at the server console too

---

### Step 3: Check Server Console
In your terminal where the dev server is running, you should see:

```
📸 Profile picture upload request received
✅ MongoDB connected
🔐 Token verified: Yes
👤 User ID: 673abc...
📁 File received: Yes (12345 bytes, image/jpeg)
📦 Buffer created: 12345 bytes
☁️ Uploading to Backblaze: ...
✅ Upload successful: https://...
💾 Updating user profile in database...
✅ Profile picture updated successfully
🖼️ New image URL: https://...
```

**Common server errors:**

#### "No authentication token found"
- You're not logged in
- Cookies are disabled
- Token expired → Log out and back in

#### "Failed to upload file to Backblaze"
- Check environment variables (see Step 5)
- Backblaze credentials might be wrong
- Bucket might not exist

#### "User not found"
- Database connection issue
- User ID mismatch

---

### Step 4: Check Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try uploading
4. Find the request to `profile/picture`
5. Click on it

**Check:**
- **Request** tab: Should show FormData with the image
- **Response** tab: Should show `{ message: "...", imageUrl: "...", user: {...} }`
- **Status**: Should be `200 OK`

**If status is not 200:**
- 401 → Not authenticated
- 400 → Bad request (file missing?)
- 500 → Server error (check server console)

---

### Step 5: Verify Environment Variables

Check your `.env.local` file has:

```env
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_KEY_ID=005...
B2_APPLICATION_KEY=K005...
B2_BUCKET_NAME=your-bucket-name
```

**Test in terminal:**
```bash
# Windows CMD
echo %B2_ENDPOINT%
echo %B2_KEY_ID%
echo %B2_BUCKET_NAME%

# Windows PowerShell
$env:B2_ENDPOINT
$env:B2_KEY_ID
$env:B2_BUCKET_NAME
```

All should return values (not empty).

**If empty:**
- Restart your dev server after adding env variables
- Make sure file is named `.env.local` (not `.env.local.txt`)

---

### Step 6: Check if Image URL is Accessible

After upload, copy the image URL from the console and paste it in a new browser tab.

**Expected:**
- Image loads successfully

**If it doesn't load:**
- Check if `/api/files/[key]` endpoint is working
- Verify you're logged in (endpoint requires auth)
- Check for CORS errors in console

---

### Step 7: Verify Database Update

After uploading, check your MongoDB database:

**Using MongoDB Compass:**
1. Connect to your database
2. Find the `users` collection
3. Find your user document
4. Check if `profilePicture` field exists and has a URL

**Using MongoDB Shell:**
```javascript
db.users.findOne(
  { email: "your-email@example.com" },
  { profilePicture: 1, name: 1, email: 1 }
)
```

**Expected result:**
```json
{
  "_id": "...",
  "name": "Your Name",
  "email": "your-email@example.com",
  "profilePicture": "http://localhost:3000/api/files/profile-pictures%2F..."
}
```

**If profilePicture is missing or null:**
- The database update failed
- Check server console for errors
- Verify MongoDB connection is working

---

## 🔍 Common Issues & Solutions

### Issue: "Image uploads but doesn't show in UI"

**Possible causes:**
1. **State not updating** → Check console for "🔄 Calling onImageUpdate"
2. **Image URL broken** → Try opening URL in new tab
3. **Cache issue** → Hard refresh (Ctrl+Shift+R)
4. **Component not re-rendering** → Check if `onUpdate()` is called

**Solution:**
```javascript
// In browser console, check current state:
console.log(document.querySelector('img[alt="Profile"]')?.src);
```

---

### Issue: "Modal closes but nothing happens"

**This means:**
- Upload might have failed silently
- Check console for errors
- Look for toast notification (should appear top-right)

**Solution:**
- Look for the toast message
- Check browser console for the upload logs
- Verify network request was sent

---

### Issue: "Blob is null or undefined"

**This means:**
- Crop area wasn't calculated
- Image didn't load properly

**Solution:**
- Wait a moment after selecting image
- Try adjusting the zoom slider
- Check console for "📐 Cropped area pixels"

---

### Issue: "CORS error when loading image"

**This means:**
- Image URL is from external source
- Backblaze bucket CORS not configured

**Solution:**
- Images should be served through `/api/files/[key]`
- Check if URL starts with your domain
- Verify file endpoint is working

---

## 🎯 Quick Checklist

Before asking for help, verify:

- [ ] Test page works (`/test-profile-picture`)
- [ ] Browser console shows upload logs
- [ ] Server console shows upload logs
- [ ] Network tab shows 200 response
- [ ] Response contains `imageUrl`
- [ ] Image URL is accessible in browser
- [ ] Database has `profilePicture` field
- [ ] Toast notification appears
- [ ] Environment variables are set
- [ ] Logged in with valid session

---

## 📞 Getting Help

If still not working, provide:

1. **Browser console logs** (copy all the emoji logs)
2. **Server console logs** (copy the upload attempt)
3. **Network tab screenshot** (showing the request/response)
4. **Test page result** (what happens at `/test-profile-picture`)
5. **Environment check** (are variables set?)

This will help diagnose the exact issue!
