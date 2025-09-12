import connectMongoDB from '@/config/mongoConfig';
import Cluster from '@/models/Cluster';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { classCode } = await request.json();

    const cluster = await Cluster.findOne({ classCode }).populate('courses');

    if (!cluster) {
      return NextResponse.json({ message: 'Cluster not found' }, { status: 404 });
    }

    if (cluster.createdBy.toString() === userId) {
      return NextResponse.json({ message: 'You are the creator of this cluster' }, { status: 400 });
    }

    if (cluster.enrolledUsers.includes(userId)) {
      return NextResponse.json({ message: 'You are already enrolled in this cluster' }, { status: 400 });
    }

    // Enroll user in all courses in the cluster
    for (const course of cluster.courses) {
      if (!course.enrolledUsers.includes(userId)) {
        course.enrolledUsers.push(userId);
        await course.save();
      }
    }

    // Add user to cluster's enrolledUsers
    cluster.enrolledUsers.push(userId);
    await cluster.save();

    return NextResponse.json({ message: 'Successfully joined cluster and enrolled in all courses', cluster }, { status: 200 });

  } catch (error) {
    console.error('Join Cluster Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}