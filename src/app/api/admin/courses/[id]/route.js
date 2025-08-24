import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';

// Helper function to verify admin token
const verifyAdminToken = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') {
      return decoded.id;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export async function GET(req, { params }) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const course = await Course.findById(id)
      .populate('createdBy', 'name email role')
      .populate('enrolledUsers', 'name email role')
      .lean();

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching single course:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}