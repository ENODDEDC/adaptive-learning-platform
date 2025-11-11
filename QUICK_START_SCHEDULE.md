# Quick Start - Course Schedule Feature

## 🚀 Run This Command Now!

Open your terminal and run:

```bash
npm run seed:schedules
```

This will add random schedules to all your existing courses.

## 📋 What You'll See

```
Connected to MongoDB
Found X courses without schedules
Updated course: Introduction to Computer Science (CS101-A) with 2 schedules
Updated course: Data Structures (CS201-B) with 3 schedules
...
✅ Successfully added schedules to X courses!
```

## 🔄 After Running the Seeder

1. **Restart your dev server** (if it's running):
   - Press `Ctrl+C` to stop
   - Run `npm run dev` to start again

2. **Check the home page**:
   - Go to http://localhost:3000/home
   - You should see schedules on all course cards!

3. **Check the schedule page**:
   - Go to http://localhost:3000/schedule
   - Should display all courses with their schedules

4. **Try creating a new course**:
   - Click "Create Course"
   - Notice: One schedule is already added by default
   - You can add more schedules
   - Submit button is disabled if you remove all schedules

## ✅ What Changed

### Before:
- Courses had no schedules
- Schedule was optional when creating courses
- Course cards didn't show schedule info

### After:
- ✅ All courses now have schedules (after running seeder)
- ✅ Schedules are **REQUIRED** when creating new courses
- ✅ Course cards display schedules beautifully
- ✅ Default schedule added automatically in create form

## 🎨 What It Looks Like

### On Course Card:
```
┌─────────────────────────────┐
│  📅 SCHEDULE                │
│  Mon  09:00 - 10:00         │
│  Wed  14:00 - 15:30         │
│  +1 more                    │
└─────────────────────────────┘
```

### In Create Course Modal:
```
Class Schedule *
[+ Add Schedule]

┌─────────────────────────────┐
│ Monday ▼  09:00  10:00  [X] │
│ Wednesday ▼  14:00  15:30 [X]│
└─────────────────────────────┘
```

## 🐛 Troubleshooting

### Seeder doesn't run?
- Make sure MongoDB is running
- Check your `.env.local` has correct MongoDB connection string

### Schedules don't show on cards?
- Restart your dev server
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors

### Can't create course without schedule?
- This is intentional! Schedules are now required
- At least one schedule must be added

## 📞 Need Help?

Check these files for more details:
- `SCHEDULE_FEATURE_COMPLETE.md` - Full feature documentation
- `SCHEDULE_SEEDER_INSTRUCTIONS.md` - Detailed seeder instructions
- `COURSE_SCHEDULE_FEATURE.md` - Original implementation notes
