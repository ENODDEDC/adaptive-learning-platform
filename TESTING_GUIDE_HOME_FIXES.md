# Testing Guide - Home Page Fixes

## Prerequisites
- Make sure the development server is running: `npm run dev`
- Ensure you're logged in to the application
- Navigate to `http://localhost:3000/home`

## Test 1: Create Course Functionality

### Steps:
1. On the home page, locate the "+" button in the top-right area of the courses section
2. Click the "+" button to open the dropdown menu
3. Click "Create Course" from the menu
4. The Create Course modal should appear

### In the Modal:
5. Enter a course subject (e.g., "Introduction to Computer Science")
6. Enter a section (optional, e.g., "CS-101")
7. Select a color by clicking on one of the 8 color options
   - The selected color should show a checkmark
   - You can change the color by clicking a different one
8. Click "Create Course" button

### Expected Results:
- The button should show "Creating..." with a spinning icon
- After successful creation:
  - An alert should appear: "Course created successfully!"
  - The page should refresh automatically
  - The new course should appear in your courses list with the selected color

### Error Cases to Test:
- Try submitting without a subject (button should be disabled)
- Try submitting while not logged in (should show error)

## Test 2: View All Button

### Steps:
1. On the home page, scroll to the courses section
2. If you have more than 2 courses, you'll see pagination dots
3. At the bottom of the courses section, locate the "View All" button
4. Click the "View All" button

### Expected Results:
- You should be navigated to `/courses` page
- All your courses should be displayed in a grid layout
- The URL should change to `http://localhost:3000/courses`

## Test 3: User Display Name

### Steps:
1. On the home page, look at the welcome header at the top
2. Check the greeting message

### Expected Results:
- The greeting should show: "Good morning/afternoon/evening, [Your Full Name]!"
- Your full name should be displayed correctly (first name + surname)
- The greeting should change based on the time of day:
  - Before 12 PM: "Good morning"
  - 12 PM - 5 PM: "Good afternoon"
  - After 5 PM: "Good evening"

## Test 4: Course Display After Creation

### Steps:
1. Create a new course following Test 1
2. After the page refreshes, locate your new course in the list

### Expected Results:
- The course should appear with:
  - The subject you entered as the title
  - The section code you entered
  - The color you selected as the background
  - A "Creator" badge indicating you created it
  - Your name as the instructor

## Test 5: Modal Keyboard Navigation

### Steps:
1. Open the Create Course modal
2. Press `Escape` key

### Expected Results:
- The modal should close
- You should be back on the home page

### Additional Test:
1. Open the modal again
2. The "Course Subject" field should automatically be focused
3. You can tab through the fields

## Common Issues and Solutions

### Issue: Modal doesn't open
**Solution:** Check browser console for errors. Ensure you're logged in.

### Issue: "Create Course" button is disabled
**Solution:** Make sure you've entered a course subject (required field).

### Issue: Course not appearing after creation
**Solution:** 
- Check if the page refreshed
- Manually refresh the page (F5)
- Check browser console for API errors

### Issue: View All button doesn't work
**Solution:** 
- Check browser console for navigation errors
- Ensure the `/courses` route exists
- Try manually navigating to `http://localhost:3000/courses`

### Issue: User name shows "User" instead of actual name
**Solution:** 
- Check if you're properly logged in
- Verify your user profile has `name` and `surname` fields
- Check browser console for profile API errors

## API Endpoints Being Used

1. **GET /api/auth/profile**
   - Fetches user information
   - Should return: `{ name, surname, email, ... }`

2. **POST /api/courses**
   - Creates a new course
   - Payload: `{ subject, section, teacherName, coverColor }`
   - Should return: `{ message, course }`

3. **GET /api/courses**
   - Fetches all user courses
   - Should return: `{ courses: [...] }`

## Browser Console Checks

Open browser DevTools (F12) and check:
- No red errors in Console tab
- Network tab shows successful API calls (200 status)
- Application tab shows authentication cookie is present

## Success Criteria

All tests pass when:
- ✅ Create Course modal opens and closes properly
- ✅ Course creation succeeds with proper feedback
- ✅ New courses appear immediately after creation
- ✅ Color picker works and applies selected color
- ✅ View All button navigates to courses page
- ✅ User's full name displays correctly
- ✅ No console errors appear during testing
