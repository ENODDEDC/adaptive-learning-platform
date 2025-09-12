import connectMongoDB from '@/config/mongoConfig';
import Cluster from '@/models/Cluster';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;
    const { id } = params;

    await connectMongoDB();
    const { courseId } = await request.json();

    const cluster = await Cluster.findById(id);
    if (!cluster) {
      return NextResponse.json({ message: 'Cluster not found' }, { status: 404 });
    }

    if (cluster.createdBy.toString() !== userId) {
      return NextResponse.json({ message: 'Unauthorized to modify this cluster' }, { status: 403 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    if (course.createdBy.toString() !== userId) {
      return NextResponse.json({ message: 'You can only add your own courses to clusters' }, { status: 403 });
    }

    if (cluster.courses.includes(courseId)) {
      return NextResponse.json({ message: 'Course already in cluster' }, { status: 400 });
    }

    cluster.courses.push(courseId);
    await cluster.save();

    return NextResponse.json({ message: 'Course added to cluster', cluster }, { status: 200 });
  } catch (error) {
    console.error('Add Course to Cluster Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}