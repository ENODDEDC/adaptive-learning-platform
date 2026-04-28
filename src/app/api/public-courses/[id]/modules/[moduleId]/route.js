import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// PATCH - Update module
export async function PATCH(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id, moduleId } = params;
    const body = await request.json();
    const { title, description } = body;

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
        message: 'Only the course creator can update modules' 
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

    // Update module
    if (title !== undefined) {
      module.title = title.trim();
    }
    if (description !== undefined) {
      module.description = description.trim();
    }

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Module updated successfully',
      module
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to update module',
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete module
export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id, moduleId } = params;

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
        message: 'Only the course creator can delete modules' 
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

    // Check if module has items
    if (module.items && module.items.length > 0) {
      return NextResponse.json({ 
        success: false,
        message: 'Cannot delete module with content. Remove all videos and files first.' 
      }, { status: 400 });
    }

    // Remove module using pull
    course.modules.pull(moduleId);
    
    // Recalculate totals
    course.totalItems = course.calculateTotalItems();
    course.totalDuration = course.calculateTotalDuration();
    
    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Module deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to delete module',
      error: error.message 
    }, { status: 500 });
  }
}
