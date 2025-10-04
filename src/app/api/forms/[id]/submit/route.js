import { NextResponse } from 'next/server';
import connectMongo from '@/config/mongoConfig';
import { Form } from '@/models/Form';
import { verifyToken } from '@/utils/auth';
import { calculateFormScore, formatQuestionResultForDisplay } from '@/utils/formScoring';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      console.error('Form submission failed: No valid token found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('Form submission - User ID:', payload.userId, 'Form ID:', params.id);

    await connectMongo();
    const { id } = params;

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { responses } = body;

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ message: 'Missing or invalid responses object' }, { status: 400 });
    }

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
          message: 'You have already submitted this form. Multiple responses are not allowed for this form.',
          code: 'DUPLICATE_SUBMISSION'
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

    // Calculate scores if the form is configured to show results
    let scoreResult = null;
    if (form.settings?.showResultsAfterSubmission) {
      scoreResult = calculateFormScore(form.questions, responses);

      // Format results for display
      scoreResult.questionResults = scoreResult.questionResults.map(result => {
        const question = form.questions.find(q => q.id === result.questionId);
        return {
          ...result,
          ...formatQuestionResultForDisplay(result, question?.type)
        };
      });
    }

    form.responses.push(newResponse);
    await form.save();

    const response = {
      message: 'Form submitted successfully',
      responseId: newResponse._id
    };

    // Include score results if enabled
    if (scoreResult) {
      response.score = scoreResult;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error submitting form:', error);
    console.error('Error stack:', error.stack);

    // Provide more specific error messages based on error type
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error.name === 'ValidationError') {
      errorMessage = 'Form data validation failed';
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid form ID';
      statusCode = 400;
    }

    return NextResponse.json(
      { message: errorMessage, error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: statusCode }
    );
  }
}