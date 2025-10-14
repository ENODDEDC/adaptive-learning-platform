import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Announcement from '@/models/Announcement';
import Course from '@/models/Course';
import { verifyToken } from '@/utils/auth';

export async function GET(request) {
  try {
    // Verify admin token
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const courseId = searchParams.get('courseId');

    let announcements;

    if (courseId) {
      // Get announcements for specific course
      announcements = await Announcement.find({ courseId })
        .populate('postedBy', 'name email')
        .populate('courseId', 'subject section')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
    } else {
      // Get all announcements across all courses
      announcements = await Announcement.find({})
        .populate('postedBy', 'name email')
        .populate('courseId', 'subject section')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
    }

    const total = courseId
      ? await Announcement.countDocuments({ courseId })
      : await Announcement.countDocuments();

    // Format announcements for frontend display
    const formattedAnnouncements = announcements.map(announcement => ({
      id: announcement._id,
      content: announcement.content,
      postedBy: announcement.postedBy?.name || 'Unknown User',
      courseName: announcement.courseId?.subject || 'Unknown Course',
      courseId: announcement.courseId?._id,
      createdAt: announcement.createdAt,
      pinned: announcement.pinned,
      attachments: announcement.attachments || []
    }));

    return NextResponse.json({
      announcements: formattedAnnouncements,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: formattedAnnouncements.length,
        total: total
      }
    });
  } catch (error) {
    console.error('Error fetching admin announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Verify admin token
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    // Find the announcement first to get course info for logging
    const announcement = await Announcement.findById(announcementId).populate('courseId', 'subject');
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Delete the announcement
    await Announcement.findByIdAndDelete(announcementId);

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
      deletedAnnouncement: {
        id: announcement._id,
        courseName: announcement.courseId?.subject,
        content: announcement.content.substring(0, 100) + '...'
      }
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}