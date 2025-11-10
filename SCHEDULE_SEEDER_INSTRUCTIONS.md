# Schedule Seeder Instructions

## Purpose
This seeder adds random schedules to all existing courses in the database that don't have schedules yet.

## How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run seed:schedules
```

### Option 2: Direct node command
```bash
node src/seeders/scheduleSeeder.js
```

## What it does

1. Connects to MongoDB
2. Finds all courses without schedules
3. For each course, generates 1-3 random schedules with:
   - Random days (Monday-Sunday)
   - Random time slots (8:00 AM - 5:30 PM)
   - No duplicate days per course
4. Updates the courses in the database

## Example Output
```
Connected to MongoDB
Found 5 courses without schedules
Updated course: Introduction to Computer Science (CS101-A) with 2 schedules
Updated course: Data Structures (CS201-B) with 3 schedules
Updated course: Web Development (WEB301-A) with 1 schedules
Updated course: Database Systems (DB401-C) with 2 schedules
Updated course: Machine Learning (ML501-A) with 3 schedules

✅ Successfully added schedules to 5 courses!
```

## Schedule Format
Each schedule includes:
- `day`: Day of the week (Monday-Sunday)
- `startTime`: Start time in HH:MM format (e.g., "09:00")
- `endTime`: End time in HH:MM format (e.g., "10:30")

## Example Generated Schedules
```javascript
[
  { day: "Monday", startTime: "09:00", endTime: "10:30" },
  { day: "Wednesday", startTime: "14:00", endTime: "15:30" },
  { day: "Friday", startTime: "10:00", endTime: "11:30" }
]
```

## Notes
- The seeder only updates courses that have no schedules
- Each course gets 1-3 random schedules
- No duplicate days within a single course
- Time slots are realistic (8 AM - 5:30 PM)
- The seeder is safe to run multiple times (won't duplicate schedules)

## After Running
1. Restart your Next.js development server
2. Visit http://localhost:3000/home
3. You should see schedules displayed on all course cards
4. Visit http://localhost:3000/schedule to see the schedule page
