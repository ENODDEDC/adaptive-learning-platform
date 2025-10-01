import { NextResponse } from 'next/server';
import connectMongo from '@/config/mongoConfig';
import { Form } from '@/models/Form';
import { verifyToken } from '@/utils/auth';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const { id } = params;
    const { responses } = await request.json();

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    }

    // Check if form allows multiple responses or if user has already submitted
    if (!form.settings.allowMultipleResponses) {
      const existingResponse = form.responses.find(
        response => response.studentId.toString() === payload.userId
      );
      if (existingResponse) {
        return NextResponse.json({ 
          message: 'You have already submitted this form' 
        }, { status: 400 });
      }
    }

    // Convert responses object to array format
    const answersArray = Object.entries(responses).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    // Add the response to the form
    const newResponse = {
      studentId: payload.userId,
      answers: answersArray,
      submittedAt: new Date(),
      isComplete: true
    };

    form.responses.push(newResponse);
    await form.save();

    return NextResponse.json({
      message: 'Form submitted successfully',
      responseId: newResponse._id
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}