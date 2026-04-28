import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// GET - Get course content with student progress
export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;

    // Find course
    const course = await PublicCourse.findById(id)
      .populate('createdBy', 'name surname profilePicture email')
      .lean();

    if (!course) {
      return NextResponse.json({ 
        success: false,
        message: 'Course not found' 
      }, { status: 404 });
    }

    // Check if user is enrolled or is the creator
    const isCreator = course.createdBy._id.toString() === payload.userId;
    const isEnrolled = course.enrolledStudents?.some(
      studentId => studentId.toString() === payload.userId
    );

    if (!isCreator && !isEnrolled) {
      return NextResponse.json({ 
        success: false,
        message: 'You must be enrolled to access course content' 
      }, { status: 403 });
    }

    // Get student progress
    const progress = course.studentProgress?.find(
      p => p.userId.toString() === payload.userId
    );

    // Format modules with completion status
    const modulesWithProgress = course.modules?.map(module => ({
      _id: module._id,
      title: module.title,
      description: module.description,
      order: module.order,
      items: module.items?.map(item => {
        const isCompleted = progress?.completedItems?.includes(item._id.toString());
        
        return {
          _id: item._id,
          type: item.type,
          title: item.title,
          order: item.order,
          videoUrl: item.videoUrl,
          videoDuration: item.videoDuration,
          videoThumbnail: item.videoThumbnail,
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          fileType: item.fileType,
          fileSize: item.fileSize,
          isPreview: item.isPreview,
          isCompleted,
        };
      }).sort((a, b) => a.order - b.order) || [],
    })).sort((a, b) => a.order - b.order) || [];

    return NextResponse.json({ 
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        coverImage: course.coverImage,
        coverColor: course.coverColor,
        category: course.category,
        level: course.level,
        instructorName: course.instructorName,
        instructorProfilePicture: course.createdBy?.profilePicture || null,
        totalModules: course.totalModules || 0,
        totalItems: course.totalItems || 0,
        totalDuration: course.totalDuration || 0,
        modules: modulesWithProgress,
        isCreator,
        isEnrolled,
      },
      progress: progress ? {
        completedItems: progress.completedItems || [],
        lastAccessedItem: progress.lastAccessedItem,
        completionPercentage: progress.completionPercentage || 0,
        certificateIssued: progress.certificateIssued || false,
        enrolledAt: progress.enrolledAt,
        completedAt: progress.completedAt,
      } : null,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching course content:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch course content',
      error: error.message 
    }, { status: 500 });
  }
}
