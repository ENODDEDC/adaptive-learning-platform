import connectMongo from '@/config/mongoConfig';
import Activity from '@/models/Activity';
import User from '@/models/User';

/**
 * Seed initial activities for testing the dashboard
 */
export async function seedActivities() {
  try {
    await connectMongo();

    // Check if activities already exist
    const existingActivities = await Activity.countDocuments();
    if (existingActivities > 0) {
      console.log('Activities already exist, skipping seeder');
      return;
    }

    // Get some users for activity creation
    const users = await User.find({}).limit(5).lean();
    if (users.length === 0) {
      console.log('No users found, cannot seed activities');
      return;
    }

    const activities = [
      {
        user: users[0]._id,
        action: 'user_registered',
        targetType: 'user',
        targetId: users[0]._id,
        targetName: `${users[0].name} ${users[0].surname}`,
        description: `New user registered: ${users[0].email}`,
        category: 'user',
        type: 'success'
      },
      {
        user: users[0]._id,
        action: 'user_login',
        targetType: 'user',
        targetId: users[0]._id,
        targetName: `${users[0].name} ${users[0].surname}`,
        description: `User logged in: ${users[0].email}`,
        category: 'user',
        type: 'info'
      },
      {
        user: users[0]._id,
        action: 'course_created',
        targetType: 'course',
        targetId: '507f1f77bcf86cd799439011', // Mock course ID
        targetName: 'Introduction to Programming',
        description: 'Course created: Introduction to Programming',
        category: 'course',
        type: 'success'
      },
      {
        user: users[0]._id,
        action: 'course_enrolled',
        targetType: 'course',
        targetId: '507f1f77bcf86cd799439011',
        targetName: 'Introduction to Programming',
        description: 'Enrolled in course: Introduction to Programming',
        category: 'course',
        type: 'success'
      },
      {
        user: users[0]._id,
        action: 'assignment_submitted',
        targetType: 'assignment',
        targetId: '507f1f77bcf86cd799439012',
        targetName: 'First Programming Assignment',
        description: 'Submitted assignment: First Programming Assignment',
        category: 'assignment',
        type: 'success'
      },
      {
        user: users[0]._id,
        action: 'profile_updated',
        targetType: 'user',
        targetId: users[0]._id,
        targetName: `${users[0].name} ${users[0].surname}`,
        description: 'Updated profile information',
        category: 'user',
        type: 'info'
      }
    ];

    // Add timestamps to make activities appear at different times
    activities.forEach((activity, index) => {
      const createdAt = new Date();
      createdAt.setMinutes(createdAt.getMinutes() - (index * 15)); // Spread activities over last 1.5 hours
      activity.createdAt = createdAt;
    });

    await Activity.insertMany(activities);
    console.log('✅ Activities seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding activities:', error);
  }
}