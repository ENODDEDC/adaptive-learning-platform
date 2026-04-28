import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import backblazeService from '@/services/backblazeService';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// PATCH - Update item
export async function PATCH(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id, moduleId, itemId } = params;
    const body = await request.json();
    const { title, isPreview, videoDuration } = body;

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
        message: 'Only the course creator can update items' 
      }, { status: 403 });
    }

    // Find module
    const module = course.modules.id(moduleId);
    if (!module) {
      return NextResponse.json({ 
        success: false,
        message: 'Module not found' 
      }, { status: 404 });
    }

    // Find item
    const item = module.items.id(itemId);
    if (!item) {
      return NextResponse.json({ 
        success: false,
        message: 'Item not found' 
      }, { status: 404 });
    }

    // Update item
    if (title !== undefined) {
      item.title = title.trim();
    }
    if (isPreview !== undefined) {
      item.isPreview = isPreview;
    }
    if (videoDuration !== undefined && item.type === 'video') {
      item.videoDuration = videoDuration;
      // Recalculate total duration
      course.totalDuration = course.calculateTotalDuration();
    }

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Item updated successfully',
      item
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to update item',
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete item
export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id, moduleId, itemId } = params;

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
        message: 'Only the course creator can delete items' 
      }, { status: 403 });
    }

    // Find module
    const module = course.modules.id(moduleId);
    if (!module) {
      return NextResponse.json({ 
        success: false,
        message: 'Module not found' 
      }, { status: 404 });
    }

    // Find item
    const item = module.items.id(itemId);
    if (!item) {
      return NextResponse.json({ 
        success: false,
        message: 'Item not found' 
      }, { status: 404 });
    }

    // Extract file key from URL for deletion
    let fileKey = null;
    if (item.type === 'video' && item.videoUrl) {
      // Extract key from URL like /api/files/public-courses/123/modules/456/video.mp4
      const match = item.videoUrl.match(/\/api\/files\/(.+)/);
      if (match) {
        fileKey = decodeURIComponent(match[1]);
      }
    } else if (item.type === 'file' && item.fileUrl) {
      const match = item.fileUrl.match(/\/api\/files\/(.+)/);
      if (match) {
        fileKey = decodeURIComponent(match[1]);
      }
    }

    // Delete file from Backblaze
    if (fileKey) {
      try {
        await backblazeService.deleteFile(fileKey);
        console.log('✅ File deleted from Backblaze:', fileKey);
      } catch (error) {
        console.error('⚠️ Failed to delete file from Backblaze:', error);
        // Continue with item deletion even if file deletion fails
      }
    }

    // Remove item from module
    module.items.pull(itemId);

    // Update course totals
    course.totalItems = course.calculateTotalItems();
    course.totalDuration = course.calculateTotalDuration();

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Item deleted successfully',
      courseStats: {
        totalItems: course.totalItems,
        totalDuration: course.totalDuration,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to delete item',
      error: error.message 
    }, { status: 500 });
  }
}
