import { NextResponse } from 'next/server';
import connectMongo from '@/config/mongoConfig';
import { Form } from '@/models/Form';
import { verifyToken } from '@/utils/auth';

export async function GET(request, { params }) {
  try {
    await connectMongo();
    const { id } = params;

    const form = await Form.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!form) {
      return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    }

    console.log('=== FORM LOAD API DEBUG ===');
    console.log('Form being sent to frontend:', {
      id: form._id,
      title: form.title,
      questionsCount: form.questions?.length,
      sampleQuestion: form.questions?.[0] ? {
        id: form.questions[0].id,
        title: form.questions[0].title,
        type: form.questions[0].type,
        correctAnswer: form.questions[0].correctAnswer,
        points: form.questions[0].points,
        options: form.questions[0].options
      } : 'No questions'
    });

    return NextResponse.json({ form }, { status: 200 });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    console.log('=== FORM UPDATE DB CONNECTION ===');
    console.log('Database connected for form update');

    const { id } = params;
    const { title, description, questions } = await request.json();

    console.log('=== FORM UPDATE API DEBUG ===');
    console.log('Questions being updated:', questions.map(q => ({
      id: q.id,
      title: q.title,
      type: q.type,
      correctAnswer: q.correctAnswer,
      points: q.points,
      options: q.options
    })));

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    }

    // Check if user is the creator
    if (form.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const updatedForm = await Form.findByIdAndUpdate(
      id,
      { title, description, questions },
      { new: true }
    ).populate('createdBy', 'name email');

    console.log('=== FORM UPDATED DEBUG ===');
    console.log('Updated form questions:', updatedForm.questions.map(q => ({
      id: q.id,
      title: q.title,
      type: q.type,
      correctAnswer: q.correctAnswer,
      points: q.points,
      options: q.options
    })));

    return NextResponse.json({
      message: 'Form updated successfully',
      form: updatedForm
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}