# Profile Picture Upload - Quick Start

## 🚀 Test It Right Now!

### Option 1: Test Page (Recommended First)
1. Go to: **http://localhost:3000/test-profile-picture**
2. Click **"Test Upload"** button
3. Watch the result box
4. If successful, you'll see the uploaded image

**This tells you if the API works!**

---

### Option 2: Settings Page
1. Go to: **http://localhost:3000/settings**
2. Click the **camera icon** on the profile picture
3. Select an image file
4. Drag and zoom to adjust
5. Click **"Save"**
6. Watch for toast notification (top-right)

---

## 🔍 What to Check

### Open Browser Console (F12)
You should see logs like:
```
🚀 Starting crop process...
✂️ Creating cropped blob...
✅ Cropped blob created: { size: 12345, type: 'image/jpeg' }
📡 Sending upload request...
✅ Upload successful!
```

### Check Server Terminal
You should see logs like:
```
📸 Profile picture upload request received
✅ MongoDB connected
☁️ Uploading to Backblaze...
✅ Upload successful
```

---

## ❌ If It Doesn't Work

### 1. Check Environment Variables
Make sure `.env.local` has:
```env
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_KEY_ID=005...
B2_APPLICATION_KEY=K005...
B2_BUCKET_NAME=your-bucket-name
```

**Then restart your dev server!**

### 2. Check Console Logs
- Browser console (F12) → Look for errors
- Server terminal → Look for errors

### 3. Use Test Page
- Go to `/test-profile-picture`
- Click "Test Upload"
- See exact error message

### 4. Read Troubleshooting Guide
See: **PROFILE_PICTURE_TROUBLESHOOTING.md**

---

## ✅ Success Indicators

You'll know it worked when:
- ✅ Toast notification says "Profile picture updated!"
- ✅ Image appears in the profile picture area
- ✅ Image appears in the page header
- ✅ Console shows "✨ Upload process complete!"
- ✅ Server shows "✅ Profile picture updated successfully"

---

## 📝 Quick Checklist

Before testing:
- [ ] Dev server is running
- [ ] You're logged in
- [ ] Environment variables are set
- [ ] Browser console is open (F12)
- [ ] Server terminal is visible

---

## 🎯 Expected Behavior

1. **Click camera icon** → File picker opens
2. **Select image** → Crop modal appears
3. **Adjust crop** → Preview updates in real-time
4. **Click Save** → Toast shows "Uploading..."
5. **Wait 1-3 seconds** → Toast shows "Profile picture updated!"
6. **Modal closes** → Image updates in UI
7. **Check header** → Image appears there too

---

## 💡 Pro Tips

- **Use test page first** → Verifies API works
- **Watch the console** → Emoji logs show progress
- **Check both consoles** → Browser AND server
- **Wait for toast** → Don't close modal too fast
- **Try test image first** → Before using real photo

---

## 🆘 Still Not Working?

1. Visit `/test-profile-picture`
2. Copy the result
3. Copy browser console logs
4. Copy server console logs
5. Check PROFILE_PICTURE_TROUBLESHOOTING.md

The logs will tell you exactly what's wrong!

---

## 🎉 That's It!

The feature is ready. Just test it and check the logs if something goes wrong. The emoji logs make it easy to see where the process is at any moment.

**Happy uploading! 📸**
