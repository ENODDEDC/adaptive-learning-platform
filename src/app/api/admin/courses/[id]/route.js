import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { verifyAdminToken } from '@/utils/auth';

export async function GET(req, context) {
  await connectMongoDB();
  const adminInfo = await verifyAdminToken();
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const adminId = adminInfo.userId;

  // Await params in Next.js 15
  const params = await context.params;
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