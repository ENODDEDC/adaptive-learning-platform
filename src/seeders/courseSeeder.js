import mongoose from 'mongoose';
import Course from '../models/Course.js';
import User from '../models/User.js';
import connectMongoDB from '../config/mongoConfig.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const sampleCourses = [
  {
    subject: 'Introduction to Computer Science',
    section: 'CS101',
    teacherName: 'Dr. Sarah Johnson',
    coverColor: '#3b82f6',
  },
  {
    subject: 'Advanced Mathematics',
    section: 'MATH201',
    teacherName: 'Prof. Michael Chen',
    coverColor: '#10b981',
  },
  {
    subject: 'Data Structures and Algorithms',
    section: 'CS301',
    teacherName: 'Dr. Emily Rodriguez',
    coverColor: '#f59e0b',
  },
  {
    subject: 'Web Development Fundamentals',
    section: 'WEB101',
    teacherName: 'Prof. David Kim',
    coverColor: '#8b5cf6',
  },
  {
    subject: 'Database Design and Management',
    section: 'DB201',
    teacherName: 'Dr. Lisa Thompson',
    coverColor: '#ef4444',
  },
  {
    subject: 'Software Engineering Principles',
    section: 'SE301',
    teacherName: 'Prof. James Wilson',
    coverColor: '#06b6d4',
  }
];

const seedCourses = async () => {
  await connectMongoDB();

  try {
    // Find an admin user to create courses for
    const adminUser = await User.findOne({ role: 'super admin' });

    if (!adminUser) {
      console.log('No admin user found. Please run admin seeder first.');
      return;
    }

    console.log('Seeding courses for user:', adminUser.email);

    for (const courseData of sampleCourses) {
      const existingCourse = await Course.findOne({
        subject: courseData.subject,
        createdBy: adminUser._id
      });

      if (!existingCourse) {
        const uniqueKey = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newCourse = await Course.create({
          ...courseData,
          uniqueKey,
          createdBy: adminUser._id,
          enrolledUsers: [adminUser._id] // Enroll the admin user in the course
        });

        console.log(`Course "${courseData.subject}" created successfully.`);
      } else {
        console.log(`Course "${courseData.subject}" already exists.`);
      }
    }

    console.log('Course seeding completed!');
  } catch (error) {
    console.error('Course seeding failed:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedCourses().catch(err => {
  console.error('Course seeder failed:', err);
  mongoose.disconnect();
});