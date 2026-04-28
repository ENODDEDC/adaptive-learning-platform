import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Content from '@/models/Content';
import { getUserFromToken } from '@/services/authService';
import Course from '@/models/Course';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function GET(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user?.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();
    const { id } = await params;

    // Verify user has access to this course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    const isCreator = course.createdBy.toString() === user.userId;
    const isEnrolled = course.enrolledUsers?.some(uid => uid.toString() === user.userId);
    const isCoTeacher = course.coTeachers?.includes(user.userId);

    if (!isAdmin && !isCreator && !isEnrolled && !isCoTeacher) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Aggregate total file size for all Content documents in this course
    // Exclude video-link type (no actual storage used)
    const result = await Content.aggregate([
      {
        $match: {
          courseId: course._id,
          contentType: { $ne: 'video-link' }
        }
      },
      {
        $group: {
          _id: null,
          totalBytes: { $sum: '$fileSize' },
          fileCount: { $sum: 1 }
        }
      }
    ]);

    const totalBytes = result[0]?.totalBytes || 0;
    const fileCount = result[0]?.fileCount || 0;

    return NextResponse.json({
      success: true,
      totalBytes,
      fileCount,
      formatted: formatBytes(totalBytes)
    });

  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
