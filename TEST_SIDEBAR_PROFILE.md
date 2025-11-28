# Test Sidebar Profile Picture

## 🧪 Testing Steps

### Step 1: Check Browser Console

1. Open browser console (F12)
2. Refresh the page
3. Look for these logs:

```
👤 Sidebar - User data fetched: { ... }
🖼️ Sidebar - Profile picture: http://localhost:3000/api/files/...
🔍 Sidebar - Has profile picture? true
```

### Step 2: If Profile Picture is `undefined`

The API might not be returning it. Let's test directly:

1. Open a new browser tab
2. Go to: `http://localhost:3000/api/auth/profile`
3. You should see JSON with `profilePicture` field

**Expected:**
```json
{
  "_id": "...",
  "name": "Joedelmar",
  "surname": "Rosero",
  "email": "joedemarrosero.1724@gmail.com",
  "profilePicture": "http://localhost:3000/api/files/profile-pictures%2F...",
  ...
}
```

**If `profilePicture` is missing:**
- The field is not in the database
- Run the upload again

### Step 3: Check Database Directly

Run this command to see what's in the database:

```bash
node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ email: 'joedemarrosero.1724@gmail.com' });
  console.log('User profile picture:', user?.profilePicture);
  console.log('Full user:', JSON.stringify(user, null, 2));
  process.exit(0);
});
"
```

### Step 4: Force Clear Everything

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear Next.js cache
rmdir /s /q .next

# 3. Restart dev server
npm run dev
```

### Step 5: Test Image URL Directly

1. Copy the profile picture URL from console or API response
2. Paste it in a new browser tab
3. The image should load

**If it doesn't load:**
- You might not be logged in in that tab
- The file might not exist in Backblaze

### Step 6: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Find the request to `/api/auth/profile`
5. Click on it
6. Check the Response tab
7. Look for `profilePicture` field

### Step 7: Verify Image Element

1. Open DevTools (F12)
2. Go to Elements tab
3. Find the sidebar avatar
4. Look for the `<img>` tag
5. Check if it has the `src` attribute

**Expected:**
```html
<img 
  src="http://localhost:3000/api/files/profile-pictures%2F..." 
  alt="Profile" 
  class="object-cover w-full h-full"
>
```

## 🔍 What to Look For

### Console Logs

**Good:**
```
👤 Sidebar - User data fetched: {...}
🖼️ Sidebar - Profile picture: http://localhost:3000/api/files/...
🔍 Sidebar - Has profile picture? true
✅ Sidebar - Profile picture loaded successfully
```

**Bad:**
```
👤 Sidebar - User data fetched: {...}
🖼️ Sidebar - Profile picture: undefined
🔍 Sidebar - Has profile picture? false
```

**Very Bad:**
```
❌ Sidebar - Failed to fetch user: Error: ...
```

## 🐛 Common Issues

### Issue 1: API Returns `undefined`

**Check:**
```bash
# Check database
node scripts/fix-profile-picture-urls.js
```

**Fix:**
- Upload profile picture again
- Make sure it saves successfully

### Issue 2: API Returns URL But Image Doesn't Load

**Check:**
- Open the URL in new tab
- Look for 401/404 errors

**Fix:**
- Make sure you're logged in
- Check Backblaze credentials
- Verify file exists

### Issue 3: Image Loads But Doesn't Show

**Check:**
- Inspect element
- Look for CSS issues
- Check if img tag exists

**Fix:**
- Check CSS classes
- Verify z-index
- Check overflow/visibility

## 📝 Quick Checklist

- [ ] Console shows user data fetched
- [ ] Console shows profile picture URL
- [ ] Console shows "Has profile picture? true"
- [ ] API endpoint returns profilePicture
- [ ] Image URL loads in new tab
- [ ] Network tab shows correct response
- [ ] Elements tab shows img tag
- [ ] No console errors

## 🆘 If Still Not Working

1. **Copy and send:**
   - Console logs (all of them)
   - API response from `/api/auth/profile`
   - Database query result
   - Network tab screenshot

2. **Try:**
   - Different browser
   - Incognito mode
   - Clear all cookies
   - Log out and back in

3. **Last resort:**
   - Delete profile picture from database
   - Upload completely new one
   - Restart everything
