import connectMongoDB from '@/config/mongoConfig';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function PUT(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { id } = params;
    
    // Check if the request contains FormData (file upload) or JSON
    const contentType = request.headers.get('content-type');
    let title, description, dueDate, type, attachmentFiles, existingAttachments;

    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData (file upload)
      const formData = await request.formData();
      title = formData.get('title');
      description = formData.get('description');
      dueDate = formData.get('dueDate');
      type = formData.get('type');
      attachmentFiles = formData.getAll('attachments');
      existingAttachments = formData.get('existingAttachments');
    } else {
      // Handle JSON data
      const data = await request.json();
      title = data.title;
      description = data.description;
      dueDate = data.dueDate;
      type = data.type;
      existingAttachments = data.attachments;
    }

    const classwork = await Assignment.findById(id);
    if (!classwork) {
      return NextResponse.json({ message: 'Classwork not found' }, { status: 404 });
    }

    // Verify that the user is the creator or a co-teacher of the course
    const course = await Course.findById(classwork.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // TODO: Implement co-teacher check once coTeachers field is added to Course model
    if (course.createdBy.toString() !== userId) {
        return NextResponse.json({ message: 'Forbidden: Only course creator can update classwork' }, { status: 403 });
    }

    let attachmentIds = [];

    // Handle existing attachments
    if (existingAttachments) {
      try {
        const existingAttachmentsArray = JSON.parse(existingAttachments);
        attachmentIds = existingAttachmentsArray.map(att => att._id || att);
      } catch (e) {
        // If parsing fails, treat as array of IDs
        attachmentIds = Array.isArray(existingAttachments) ? existingAttachments : [];
      }
    }

    // Handle new file uploads
    if (attachmentFiles && attachmentFiles.length > 0) {
      const Content = (await import('@/models/Content')).default;
      const path = (await import('path')).default;
      const fs = (await import('fs/promises')).default;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses', classwork.courseId.toString());
      await fs.mkdir(uploadDir, { recursive: true });

      for (const file of attachmentFiles) {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        const fileUrl = `/uploads/courses/${classwork.courseId}/${fileName}`;

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, fileBuffer);

        const newContent = new Content({
          courseId: classwork.courseId,
          title: fileName,
          originalName: file.name,
          filename: fileName,
          filePath: fileUrl,
          contentType: 'material',
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: userId,
        });
        
        await newContent.save();
        attachmentIds.push(newContent._id);
      }
    }

    const updatedClasswork = await Assignment.findByIdAndUpdate(
      id,
      {
        title,
        description,
        dueDate: dueDate || null,
        type,
        attachments: attachmentIds
      },
      { new: true }
    ).populate('attachments');

    return NextResponse.json({ message: 'Classwork updated', classwork: updatedClasswork }, { status: 200 });
  } catch (error) {
    console.error('Update Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { id } = params;

    const classwork = await Assignment.findById(id);
    if (!classwork) {
      return NextResponse.json({ message: 'Classwork not found' }, { status: 404 });
    }

    // Verify that the user is the creator or a co-teacher of the course
    const course = await Course.findById(classwork.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // TODO: Implement co-teacher check once coTeachers field is added to Course model
    if (course.createdBy.toString() !== userId) {
        return NextResponse.json({ message: 'Forbidden: Only course creator can delete classwork' }, { status: 403 });
    }

    await Assignment.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Classwork deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
