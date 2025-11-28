# Sidebar Profile Picture - Debugging Guide

## 🔍 Issue: Profile Picture Not Showing in Sidebar

If the profile picture is not showing in the sidebar, follow these debugging steps:

## 📋 Debugging Steps

### Step 1: Check Browser Console

Open your browser console (F12) and look for these logs:

**Expected logs when working:**
```
👤 Sidebar - User data fetched: { name: "...", email: "...", profilePicture: "http://..." }
🖼️ Sidebar - Profile picture: http://localhost:3000/api/files/profile-pictures%2F...
✅ Sidebar - Profile picture loaded successfully
```

**If you see:**
```
👤 Sidebar - User data fetched: { name: "...", email: "...", profilePicture: undefined }
```
→ The profile picture is not in the database

**If you see:**
```
❌ Sidebar - Profile picture failed to load: http://...
```
→ The image URL is broken or inaccessible

### Step 2: Verify Profile Picture in Database

Run this script to check:
```bash
node scripts/fix-profile-picture-urls.js
```

This will show you if the profile picture URL exists and is correct.

### Step 3: Check API Response

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Find the request to `/api/auth/profile`
5. Check the response - should include `profilePicture` field

**Expected response:**
```json
{
  "_id": "...",
  "name": "John",
  "email": "john@example.com",
  "profilePicture": "http://localhost:3000/api/files/profile-pictures%2F...",
  ...
}
```

### Step 4: Verify Image URL is Accessible

1. Copy the profilePicture URL from console
2. Paste it in a new browser tab
3. The image should load

**If image doesn't load:**
- Check if you're logged in (endpoint requires auth)
- Verify the file exists in Backblaze
- Check for CORS errors

### Step 5: Clear Cache

The API service has caching. Try:

1. **Hard refresh:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear browser cache**
3. **Restart dev server**

### Step 6: Check if Profile Picture Was Uploaded

1. Go to Settings page
2. Check if profile picture shows there
3. If not, upload a new one
4. Go back to home/courses page
5. Check sidebar

## 🔧 Common Issues & Solutions

### Issue 1: Profile Picture Not in Database

**Symptoms:**
- Console shows `profilePicture: undefined`
- Sidebar shows initial letter only

**Solution:**
1. Go to Settings
2. Upload a profile picture
3. Wait for success message
4. Refresh the page

### Issue 2: Double Slash in URL

**Symptoms:**
- Console shows URL with `//api/files`
- Image fails to load

**Solution:**
```bash
node scripts/fix-profile-picture-urls.js
```

### Issue 3: Image URL Not Accessible

**Symptoms:**
- Console shows 401 or 404 error
- Image fails to load

**Solution:**
- Make sure you're logged in
- Check if `/api/files/[key]` endpoint is working
- Verify Backblaze credentials

### Issue 4: Cached Old Data

**Symptoms:**
- Uploaded new picture but old one shows
- Or no picture shows even after upload

**Solution:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Restart dev server

### Issue 5: Image Loads But Doesn't Show

**Symptoms:**
- Console shows "Profile picture loaded successfully"
- But image not visible in sidebar

**Solution:**
- Check CSS classes (overflow-hidden, object-cover)
- Inspect element to see if img tag exists
- Check if image has width/height

## 🧪 Test Checklist

- [ ] Open browser console (F12)
- [ ] Refresh the page
- [ ] Check for user data log
- [ ] Check for profilePicture field
- [ ] Check for image load success/error
- [ ] Verify image URL in new tab
- [ ] Check Network tab for API response
- [ ] Try hard refresh
- [ ] Try uploading new picture
- [ ] Check database directly

## 📝 Console Logs to Look For

### Success Case:
```
👤 Sidebar - User data fetched: {...}
🖼️ Sidebar - Profile picture: http://localhost:3000/api/files/...
✅ Sidebar - Profile picture loaded successfully
```

### Failure Cases:

**No profile picture in database:**
```
👤 Sidebar - User data fetched: {...}
🖼️ Sidebar - Profile picture: undefined
```

**Image failed to load:**
```
👤 Sidebar - User data fetched: {...}
🖼️ Sidebar - Profile picture: http://...
❌ Sidebar - Profile picture failed to load: http://...
```

**API fetch failed:**
```
❌ Sidebar - Failed to fetch user: Error: ...
```

## 🔄 Quick Fix Steps

1. **Upload profile picture:**
   - Go to Settings
   - Click camera icon
   - Upload and crop image
   - Click Save

2. **Fix database URLs:**
   ```bash
   node scripts/fix-profile-picture-urls.js
   ```

3. **Clear cache:**
   - Hard refresh (Ctrl+Shift+R)
   - Or restart dev server

4. **Check console:**
   - Open F12
   - Look for the logs above
   - Follow the error messages

## 💡 Tips

- **Always check console first** - it will tell you exactly what's wrong
- **Hard refresh** after uploading new picture
- **Check Network tab** to see actual API responses
- **Verify image URL** by opening it in new tab
- **Run fix script** if URLs have double slashes

## 🆘 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Copy these from console:**
   - User data log
   - Profile picture URL
   - Any error messages

2. **Check these:**
   - Is the image URL correct?
   - Does it have double slashes?
   - Is the file in Backblaze?
   - Are you logged in?

3. **Try this:**
   - Log out and back in
   - Upload a new picture
   - Run the fix script
   - Restart everything

The console logs will tell you exactly what's happening at each step!
