import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectMongoDB from '../config/mongoConfig.js';
import Course from '../models/Course.js';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env.local') });

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const timeSlots = [
  { start: '08:00', end: '09:30' },
  { start: '09:00', end: '10:30' },
  { start: '10:00', end: '11:30' },
  { start: '11:00', end: '12:30' },
  { start: '13:00', end: '14:30' },
  { start: '14:00', end: '15:30' },
  { start: '15:00', end: '16:30' },
  { start: '16:00', end: '17:30' },
];

function getRandomSchedules() {
  const numSchedules = Math.floor(Math.random() * 3) + 1; // 1-3 schedules
  const schedules = [];
  const usedDays = new Set();

  for (let i = 0; i < numSchedules; i++) {
    // Get a random day that hasn't been used
    let day;
    let attempts = 0;
    do {
      day = days[Math.floor(Math.random() * days.length)];
      attempts++;
    } while (usedDays.has(day) && attempts < 10);

    if (usedDays.has(day)) continue; // Skip if we couldn't find a unique day
    usedDays.add(day);

    // Get a random time slot
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

    schedules.push({
      day,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
    });
  }

  return schedules;
}

async function seedSchedules() {
  try {
    await connectMongoDB();
    console.log('Connected to MongoDB');

    // Find all courses without schedules or with empty schedules
    const courses = await Course.find({
      $or: [
        { schedules: { $exists: false } },
        { schedules: { $size: 0 } }
      ]
    });

    console.log(`Found ${courses.length} courses without schedules`);

    let updated = 0;
    for (const course of courses) {
      const schedules = getRandomSchedules();
      await Course.findByIdAndUpdate(course._id, { schedules });
      console.log(`Updated course: ${course.subject} (${course.section}) with ${schedules.length} schedules`);
      updated++;
    }

    console.log(`\n✅ Successfully added schedules to ${updated} courses!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding schedules:', error);
    process.exit(1);
  }
}

seedSchedules();
