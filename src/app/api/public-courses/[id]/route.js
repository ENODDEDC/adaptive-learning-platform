import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// GET - Get single course details
export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;

    const course = await PublicCourse.findById(id)
      .populate('createdBy', 'name surname profilePicture email')
      .lean();

    if (!course) {
      return NextResponse.json({ 
        success: false,
        message: 'Course not found' 
      }, { status: 404 });
    }

    // Check if user is the creator or enrolled student
    const isCreator = course.createdBy._id.toString() === payload.userId;
    const isEnrolled = course.enrolledStudents?.some(
      studentId => studentId.toString() === payload.userId
    );

    if (!isCreator && !isEnrolled && !course.isPublished) {
      return NextResponse.json({ 
        success: false,
        message: 'Access denied' 
      }, { status: 403 });
    }

    // Get student progress if enrolled
    let studentProgress = null;
    if (isEnrolled || isCreator) {
      studentProgress = course.studentProgress?.find(
        p => p.userId.toString() === payload.userId
      );
    }

    return NextResponse.json({ 
      success: true,
      course: {
        ...course,
        isCreator,
        isEnrolled,
        studentProgress,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch course',
      error: error.message 
    }, { status: 500 });
  }
}

// PATCH - Update course
export async function PATCH(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;
    const body = await request.json();

    // Find course
    const course = await PublicCourse.findById(id);
    if (!course) {
      return NextResponse.json({ 
        success: false,
        message: 'Course not found' 
      }, { status: 404 });
    }

    // Check if user is the creator
    if (course.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ 
        success: false,
        message: 'Only the course creator can update this course' 
      }, { status: 403 });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'category', 'level', 
      'coverColor', 'coverImage', 'isPublished', 'isArchived'
    ];

    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        course[field] = body[field];
      }
    });

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Course updated successfully',
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        coverColor: course.coverColor,
        coverImage: course.coverImage,
        isPublished: course.isPublished,
        isArchived: course.isArchived,
        updatedAt: course.updatedAt,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to update course',
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete course
export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;

    // Find course
    const course = await PublicCourse.findById(id);
    if (!course) {
      return NextResponse.json({ 
        success: false,
        message: 'Course not found' 
      }, { status: 404 });
    }

    // Check if user is the creator
    if (course.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ 
        success: false,
        message: 'Only the course creator can delete this course' 
      }, { status: 403 });
    }

    // Check if course has enrolled students
    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      return NextResponse.json({ 
        success: false,
        message: 'Cannot delete course with enrolled students. Archive it instead.' 
      }, { status: 400 });
    }

    await PublicCourse.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true,
      message: 'Course deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to delete course',
      error: error.message 
    }, { status: 500 });
  }
}
