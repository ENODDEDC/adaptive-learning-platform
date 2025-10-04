import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongo from '@/config/mongoConfig';
import Course from '@/models/Course';
import { Form } from '@/models/Form';

export async function POST(request, { params }) {
  try {
    // Get token from cookies instead of Authorization header
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized - No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ message: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log('Creating form for user:', userId);

    try {
      await connectMongo();
      console.log('=== DATABASE CONNECTION DEBUG ===');
      console.log('Database connected successfully');
      console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    } catch (dbError) {
      console.error('=== DATABASE CONNECTION FAILED ===');
      console.error('Database connection failed:', dbError);
      console.error('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { title, description, questions, type, settings } = requestBody;
    const { id: courseId } = params;

    console.log('=== FORM CREATION API DEBUG ===');
    console.log('Form data received:', { title, description, questionsCount: questions?.length, courseId, settings });
    console.log('Sample question data:', questions?.[0] ? {
      id: questions[0].id,
      title: questions[0].title,
      type: questions[0].type,
      correctAnswer: questions[0].correctAnswer,
      points: questions[0].points,
      options: questions[0].options
    } : 'No questions');

    // Validate required fields
    if (!title || !questions || !courseId) {
      return NextResponse.json({
        message: 'Missing required fields: title, questions, and courseId are required'
      }, { status: 400 });
    }

    // Verify the course exists and user has access
    let course;
    try {
      course = await Course.findById(courseId);
      if (!course) {
        return NextResponse.json({ message: 'Course not found' }, { status: 404 });
      }
      console.log('Course found:', course._id, 'Instructors:', course.instructors);
    } catch (courseError) {
      console.error('Error finding course:', courseError);
      return NextResponse.json({ message: 'Error accessing course' }, { status: 500 });
    }

    // Check if user is instructor or admin
    const isInstructor = course.instructors?.some(instructor => instructor.toString() === userId) ||
                        course.createdBy.toString() === userId;

    console.log('User access check:', { userId, isInstructor, courseCreatedBy: course.createdBy });

    if (!isInstructor) {
      return NextResponse.json({ message: 'Access denied. Instructor access required.' }, { status: 403 });
    }

    // Create the form
    const form = new Form({
      title,
      description,
      questions,
      type: 'form',
      courseId,
      createdBy: userId,
      isActive: true,
      settings: settings || {}
    });

    let savedForm;
    try {
      savedForm = await form.save();
      console.log('=== FORM SAVED DEBUG ===');
      console.log('Saved form questions:', savedForm.questions.map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        correctAnswer: q.correctAnswer,
        points: q.points,
        options: q.options
      })));
      console.log('=== FORM SAVED SUCCESSFULLY ===');
      console.log('Saved form ID:', savedForm._id);
      console.log('Saved questions:', savedForm.questions.map(q => ({
        id: q.id,
        title: q.title,
        correctAnswer: q.correctAnswer,
        points: q.points
      })));
    } catch (saveError) {
      console.error('=== FORM SAVE ERROR ===');
      console.error('Error saving form:', saveError);
      return NextResponse.json({ message: 'Failed to save form to database', error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Form created successfully',
      form: {
        _id: savedForm._id,
        title: savedForm.title,
        description: savedForm.description,
        type: savedForm.type,
        questions: savedForm.questions,
        settings: savedForm.settings,
        createdAt: savedForm.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error creating form:', error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    // Get token from cookies instead of Authorization header
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    await connectMongo();

    const { id: courseId } = params;

    // Verify the course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Get all forms for this course
    const forms = await Form.find({ courseId, isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ forms }, { status: 200 });

  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}