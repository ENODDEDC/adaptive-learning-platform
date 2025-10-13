import { NextResponse } from 'next/server';
import connectMongo from '@/config/mongoConfig';
import Activity from '@/models/Activity';

export async function GET(request) {
  try {
    await connectMongo();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    let activities;

    if (category) {
      activities = await Activity.getActivitiesByCategory(category, limit);
    } else {
      activities = await Activity.getRecentActivities(limit);
    }

    // Format activities for frontend display
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      user: activity.user?.name || 'Unknown User',
      action: getActivityActionText(activity.action),
      target: activity.targetName,
      time: getTimeAgo(activity.createdAt),
      type: activity.type,
      category: activity.category,
      description: activity.description,
      timestamp: activity.createdAt
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

function getActivityActionText(action) {
  const actionTexts = {
    'user_registered': 'registered',
    'user_login': 'logged in',
    'user_logout': 'logged out',
    'course_created': 'created course',
    'course_updated': 'updated course',
    'course_deleted': 'deleted course',
    'course_enrolled': 'enrolled in',
    'course_completed': 'completed course',
    'assignment_submitted': 'submitted assignment',
    'assignment_graded': 'graded assignment',
    'form_created': 'created form',
    'form_submitted': 'submitted form',
    'profile_updated': 'updated profile',
    'password_changed': 'changed password',
    'admin_action': 'performed admin action'
  };

  return actionTexts[action] || action;
}

function getTimeAgo(date) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInSeconds = Math.floor((now - activityDate) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return activityDate.toLocaleDateString();
  }
}