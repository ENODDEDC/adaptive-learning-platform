import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import backblazeService from '@/services/backblazeService';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { validateFileSize } from '@/config/uploadLimits';

// POST - Add item (video or file) to module
export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id, moduleId } = params;
    const formData = await request.formData();
    
    const type = formData.get('type'); // 'video' or 'file'
    const title = formData.get('title');
    const file = formData.get('file');
    const isPreview = formData.get('isPreview') === 'true';

    // Validation
    if (!type || !title || !file) {
      return NextResponse.json({ 
        success: false,
        message: 'Type, title, and file are required' 
      }, { status: 400 });
    }

    if (!['video', 'file'].includes(type)) {
      return NextResponse.json({ 
        success: false,
        message: 'Type must be either "video" or "file"' 
      }, { status: 400 });
    }

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
        message: 'Only the course creator can add content' 
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

    // Validate file size
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      return NextResponse.json({
        success: false,
        message: sizeValidation.error,
        fileName: file.name,
        limit: sizeValidation.limit,
      }, { status: 413 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Backblaze
    const folder = `public-courses/${id}/modules/${moduleId}`;
    const uploadResult = await backblazeService.uploadFile(
      buffer,
      file.name,
      file.type,
      folder
    );

    // Calculate next order number
    const nextOrder = module.items.length > 0 
      ? Math.max(...module.items.map(i => i.order)) + 1 
      : 1;

    // Create new item
    const newItem = {
      type,
      title: title.trim(),
      order: nextOrder,
      isPreview,
    };

    // Add type-specific fields
    if (type === 'video') {
      newItem.videoUrl = uploadResult.url;
      newItem.videoDuration = parseInt(formData.get('duration') || '0');
      newItem.videoThumbnail = formData.get('thumbnail') || null;
    } else if (type === 'file') {
      newItem.fileUrl = uploadResult.url;
      newItem.fileName = uploadResult.originalName;
      newItem.fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      newItem.fileSize = uploadResult.size;
    }

    // Add item to module
    module.items.push(newItem);

    // Update course totals
    course.totalItems = course.calculateTotalItems();
    course.totalDuration = course.calculateTotalDuration();

    await course.save();

    // Get the created item (last one added)
    const createdItem = module.items[module.items.length - 1];

    return NextResponse.json({ 
      success: true,
      message: `${type === 'video' ? 'Video' : 'File'} added successfully`,
      item: createdItem,
      courseStats: {
        totalItems: course.totalItems,
        totalDuration: course.totalDuration,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to add item',
      error: error.message 
    }, { status: 500 });
  }
}

// PATCH - Reorder items within module
export async function PATCH(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id, moduleId } = params;
    const body = await request.json();
    const { itemOrders } = body; // Array of { itemId, order }

    if (!itemOrders || !Array.isArray(itemOrders)) {
      return NextResponse.json({ 
        success: false,
        message: 'itemOrders array is required' 
      }, { status: 400 });
    }

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
        message: 'Only the course creator can reorder items' 
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

    // Update item orders
    itemOrders.forEach(({ itemId, order }) => {
      const item = module.items.id(itemId);
      if (item) {
        item.order = order;
      }
    });

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Items reordered successfully',
      items: module.items
    }, { status: 200 });

  } catch (error) {
    console.error('Error reordering items:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to reorder items',
      error: error.message 
    }, { status: 500 });
  }
}
