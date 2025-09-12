import connectMongoDB from '@/config/mongoConfig';
import Announcement from '@/models/Announcement';
import Course from '@/models/Course';
import Notification from '@/models/Notification';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { getUserIdFromToken } from '@/services/authService';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  console.log('=== POST ANNOUNCEMENT REQUEST START ===');
  try {
    console.log('Verifying token...');
    const payload = await verifyToken();
    console.log('Token verification result:', payload ? 'success' : 'failed');
    if (!payload) {
      console.log('No payload, returning 401');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;
    console.log('User ID from token:', userId);

    const { id: courseId } = await params;
    console.log('Course ID from params:', courseId);
    const { content } = await request.json();
    console.log('Content from request:', content);

    console.log('Connecting to MongoDB...');
    await connectMongoDB();
    console.log('MongoDB connection established');
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    console.log('Announcement collection name:', mongoose.connection.db.collection('announcements').collectionName);

    console.log('Looking up course:', courseId);
    const course = await Course.findById(courseId);
    console.log('Course lookup result:', course ? 'found' : 'not found');
    if (!course) {
      console.log('Course not found, returning 404');
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    console.log('Course details:', { id: course._id, subject: course.subject, createdBy: course.createdBy });

    // Only the course creator can post announcements
    console.log('Checking authorization...');
    console.log('Course createdBy:', course.createdBy.toString());
    console.log('User ID:', userId);
    if (course.createdBy.toString() !== userId) {
      console.log('Authorization failed, returning 403');
      return NextResponse.json({ message: 'Forbidden: Only instructors can post announcements' }, { status: 403 });
    }
    console.log('Authorization passed');

    console.log('Creating announcement with data:', { courseId, content, postedBy: userId });

    let newAnnouncement;
    try {
      console.log('Preparing document for insert...');
      // Convert courseId to ObjectId to match the schema and ensure proper querying
      const doc = {
        courseId: new mongoose.Types.ObjectId(courseId),
        content,
        postedBy: new mongoose.Types.ObjectId(userId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Document to insert:', doc);

      console.log('Performing direct insert...');
      const result = await mongoose.connection.db.collection('announcements').insertOne(doc);
      console.log('Direct insert result:', result);
      console.log('Insert acknowledged:', result.acknowledged);
      console.log('Inserted ID:', result.insertedId);

      newAnnouncement = { ...doc, _id: result.insertedId };
      console.log('New announcement object:', newAnnouncement);

      console.log('Verifying insertion...');
      // Verify by querying the DB using same connection
      const verifyAnnouncement = await mongoose.connection.db.collection('announcements').findOne({ _id: newAnnouncement._id });
      console.log('Verification query result:', verifyAnnouncement ? 'Found in DB' : 'Not found in DB');
      if (verifyAnnouncement) {
        console.log('Verified announcement:', verifyAnnouncement);
      }

      // List all announcements
      const allAnnouncements = await mongoose.connection.db.collection('announcements').find({}).toArray();
      console.log('Total announcements in collection:', allAnnouncements.length);
      console.log('All announcement IDs:', allAnnouncements.map(a => a._id.toString()));

      // Also check total count via Mongoose
      const count = await Announcement.countDocuments();
      console.log('Total announcements via Mongoose:', count);
    } catch (saveError) {
      console.error('Error during announcement save operation:', saveError);
      console.error('Save error details:', {
        message: saveError.message,
        stack: saveError.stack,
        name: saveError.name
      });
      throw saveError;
    }

    // Create notifications for all enrolled users
    console.log('Creating notifications...');
    console.log('Enrolled users count:', course.enrolledUsers.length);
    console.log('Enrolled users:', course.enrolledUsers);

    const notificationPromises = course.enrolledUsers.map(async (enrolledUserId) => {
      console.log('Creating notification for user:', enrolledUserId);
      try {
        const notification = await Notification.create({
          recipient: enrolledUserId,
          sender: newAnnouncement.postedBy,
          course: courseId,
          type: 'announcement',
          message: `New announcement in ${course.subject}: "${content.substring(0, 50)}..."`,
          link: `/courses/${courseId}/announcements/${newAnnouncement._id}`,
        });
        console.log('Notification created successfully for user:', enrolledUserId);
        return notification;
      } catch (notifError) {
        console.error('Error creating notification for user:', enrolledUserId, notifError);
        return null; // Don't fail the whole operation for one notification
      }
    });

    console.log('Waiting for all notification promises...');
    const notifications = await Promise.all(notificationPromises);
    const successfulNotifications = notifications.filter(n => n !== null);
    console.log('Notifications created successfully:', successfulNotifications.length);
    console.log('Failed notifications:', notifications.length - successfulNotifications.length);

    console.log('Announcement creation successful, returning response...');
    console.log('Final announcement ID:', newAnnouncement._id);
    return NextResponse.json({ message: 'Announcement posted', announcement: newAnnouncement }, { status: 201 });
  } catch (error) {
    console.error('=== CREATE ANNOUNCEMENT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    console.log('=== END ERROR LOG ===');
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  console.log('=== GET ANNOUNCEMENTS REQUEST START ===');
  try {
    console.log('Verifying token...');
    const payload = await verifyToken();
    console.log('Token verification result:', payload ? 'success' : 'failed');
    if (!payload) {
      console.log('No payload, returning 401');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;
    console.log('User ID from token:', userId);

    const { id: courseId } = await params;
    console.log('Course ID from params:', courseId);

    console.log('Connecting to MongoDB...');
    await connectMongoDB();
    console.log('MongoDB connected successfully.');
    console.log('Mongoose connection readyState:', mongoose.connection.readyState);
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    console.log('Announcement collection name:', Announcement.collection.name);

    console.log('Looking up course:', courseId);
    const course = await Course.findById(courseId);
    console.log('Course lookup result:', course ? 'found' : 'not found');
    if (!course) {
      console.log('Course not found, returning 404');
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    console.log('Course details:', { id: course._id, subject: course.subject, createdBy: course.createdBy });

    // Check if the user is either the creator or enrolled in the course
    const isCreator = course.createdBy.toString() === userId;
    const isEnrolled = course.enrolledUsers.includes(userId);
    console.log('Authorization check - isCreator:', isCreator, 'isEnrolled:', isEnrolled);

    if (!isCreator && !isEnrolled) {
      console.log('Authorization failed, returning 403');
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    console.log('Authorization passed');

    console.log('Querying announcements for courseId:', courseId);
    const announcements = await Announcement.find({ courseId })
      .populate('postedBy', 'name')
      .populate('attachments') // Populate the attachments with full Content data
      .sort({ createdAt: -1 });

    console.log('Announcements query result count:', announcements.length);
    console.log('Announcements data:', announcements.map(a => ({
      id: a._id,
      content: a.content?.substring(0, 50) + '...',
      postedBy: a.postedBy?.name || 'Unknown',
      createdAt: a.createdAt
    })));

    // Also check total count in collection
    const totalCount = await Announcement.countDocuments();
    console.log('Total announcements in collection:', totalCount);

    console.log('Get announcements successful, returning response...');
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('=== GET ANNOUNCEMENTS ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    console.log('=== END GET ERROR LOG ===');
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectMongoDB();
    const { id: courseId } = params;
    const { announcementId, pinned } = await request.json();

    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.createdBy.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    announcement.pinned = pinned;
    await announcement.save();

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectMongoDB();
    const { id: courseId } = params;
    const { announcementId } = await request.json();

    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.createdBy.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await Announcement.findByIdAndDelete(announcementId);

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}