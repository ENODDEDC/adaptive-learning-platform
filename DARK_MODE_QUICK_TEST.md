# Dark Mode Quick Test Guide

## 🚀 Quick 5-Minute Verification

This guide helps you quickly verify the dark mode implementation is working correctly.

---

## Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/admin/login`

3. Login with admin credentials

---

## ✅ Quick Test Steps

### 1. Theme Toggle (30 seconds)

1. Look for the **sun/moon icon** in the **top-right corner**
2. Click it
3. **Expected**: Page switches from light to dark theme instantly
4. Click again
5. **Expected**: Page switches back to light theme

**Pass Criteria**: ✅ Theme switches smoothly without page reload

---

### 2. Persistence Test (30 seconds)

1. Set theme to **dark mode**
2. Press **F5** to refresh the page
3. **Expected**: Page loads in dark mode (no flash of light theme)
4. Navigate to `/admin/users`
5. **Expected**: Still in dark mode

**Pass Criteria**: ✅ Theme persists across refreshes and navigation

---

### 3. Visual Check - Dashboard (1 minute)

Navigate to `/admin/dashboard` in dark mode:

- [ ] Background is dark (not white)
- [ ] Text is light colored and readable
- [ ] Stat cards have dark backgrounds
- [ ] Charts/heatmap is visible
- [ ] Buttons are visible and styled
- [ ] No white flashes or glitches

**Pass Criteria**: ✅ All elements visible and properly styled

---

### 4. Visual Check - Users Page (1 minute)

Navigate to `/admin/users` in dark mode:

- [ ] User table has dark background
- [ ] Table rows have hover effect
- [ ] Search input is styled
- [ ] Role badges are visible
- [ ] Pagination controls work

**Pass Criteria**: ✅ All elements visible and properly styled

---

### 5. Visual Check - Courses Page (1 minute)

Navigate to `/admin/courses` in dark mode:

- [ ] Course cards have dark backgrounds
- [ ] Search and filters are styled
- [ ] Course images are visible
- [ ] Badges are readable
- [ ] Modals (if opened) are styled

**Pass Criteria**: ✅ All elements visible and properly styled

---

### 6. Color Palette Check (30 seconds)

Look across all pages for:

- [ ] Purple used for primary actions
- [ ] Indigo used for secondary actions
- [ ] Gray used for neutral elements
- [ ] Red only for delete/destructive actions
- [ ] No blue, green, orange colors

**Pass Criteria**: ✅ Only purple, indigo, gray, and red colors used

---

### 7. Accessibility Check (30 seconds)

1. Press **Tab** key multiple times
2. Navigate to theme toggle button
3. Press **Enter** or **Space**
4. **Expected**: Theme toggles

**Pass Criteria**: ✅ Theme toggle is keyboard accessible

---

## 🎯 Overall Pass Criteria

**All 7 tests must pass** for the implementation to be considered complete.

### If Any Test Fails:

1. Check browser console for errors
2. Clear localStorage: `localStorage.clear()`
3. Refresh and try again
4. If still failing, report the issue

---

## 📊 Test Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Theme Toggle | ☐ Pass ☐ Fail | |
| 2. Persistence | ☐ Pass ☐ Fail | |
| 3. Dashboard | ☐ Pass ☐ Fail | |
| 4. Users Page | ☐ Pass ☐ Fail | |
| 5. Courses Page | ☐ Pass ☐ Fail | |
| 6. Color Palette | ☐ Pass ☐ Fail | |
| 7. Accessibility | ☐ Pass ☐ Fail | |

**Overall Result**: ☐ PASS ☐ FAIL

**Tested By**: _______________  
**Date**: _______________

---

## 🐛 Common Issues & Solutions

### Issue: Theme doesn't persist
**Solution**: Check if localStorage is enabled in browser

### Issue: White flash on page load
**Solution**: Clear browser cache and reload

### Issue: Some elements not styled
**Solution**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Toggle button not visible
**Solution**: Check if you're on the login page (it's excluded)

---

## ✨ Expected Behavior

### Light Mode
- White/light gray backgrounds
- Dark text
- Colorful accents (purple, indigo)
- Clean, bright appearance

### Dark Mode
- Dark gray backgrounds (gray-900, gray-800)
- Light text (gray-100, gray-300)
- Slightly lighter accents
- Easy on the eyes in low light

---

## 📝 Notes

- Login page (`/admin/login`) intentionally has no dark mode
- Theme preference is stored in localStorage as `admin-theme`
- System preference is detected on first visit
- All transitions are smooth (200ms duration)

---

**Quick Test Complete!** ✅

If all tests pass, the dark mode implementation is working correctly.
