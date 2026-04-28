import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// POST - Create new module
export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;
    const body = await request.json();
    const { title, description } = body;

    // Validation
    if (!title) {
      return NextResponse.json({ 
        success: false,
        message: 'Module title is required' 
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
        message: 'Only the course creator can add modules' 
      }, { status: 403 });
    }

    // Calculate next order number
    const nextOrder = course.modules.length > 0 
      ? Math.max(...course.modules.map(m => m.order)) + 1 
      : 1;

    // Create new module
    const newModule = {
      title: title.trim(),
      description: description?.trim() || '',
      order: nextOrder,
      items: [],
    };

    course.modules.push(newModule);
    await course.save();

    // Get the created module (last one added)
    const createdModule = course.modules[course.modules.length - 1];

    return NextResponse.json({ 
      success: true,
      message: 'Module created successfully',
      module: createdModule
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to create module',
      error: error.message 
    }, { status: 500 });
  }
}

// PATCH - Reorder modules
export async function PATCH(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;
    const body = await request.json();
    const { moduleOrders } = body; // Array of { moduleId, order }

    if (!moduleOrders || !Array.isArray(moduleOrders)) {
      return NextResponse.json({ 
        success: false,
        message: 'moduleOrders array is required' 
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
        message: 'Only the course creator can reorder modules' 
      }, { status: 403 });
    }

    // Update module orders
    moduleOrders.forEach(({ moduleId, order }) => {
      const module = course.modules.id(moduleId);
      if (module) {
        module.order = order;
      }
    });

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Modules reordered successfully',
      modules: course.modules
    }, { status: 200 });

  } catch (error) {
    console.error('Error reordering modules:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to reorder modules',
      error: error.message 
    }, { status: 500 });
  }
}
