import connectMongoDB from '@/config/mongoConfig';
import Cluster from '@/models/Cluster';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const body = await request.json();
    console.log('Received request body:', body);

    const { name, section, coverColor, courseIds } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Cluster name is required' }, { status: 400 });
    }

    // Generate unique class code
    const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    let validatedCourseIds = [];

    // Validate that courses exist and belong to the user
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      console.log('Validating courseIds:', courseIds);

      // Get all courses the user has access to
      const userCourses = await Course.find({
        $or: [
          { createdBy: userId },
          { enrolledUsers: userId }
        ]
      });

      console.log('User has access to courses:', userCourses.map(c => ({ id: c._id.toString(), subject: c.subject })));

      // Filter courseIds to only include courses the user has access to
      const userCourseIds = userCourses.map(c => c._id.toString());
      validatedCourseIds = courseIds.filter(id => userCourseIds.includes(id));

      console.log('Validated course IDs:', validatedCourseIds);
      console.log('Filtered out invalid courses:', courseIds.filter(id => !userCourseIds.includes(id)));
    }

    const newCluster = await Cluster.create({
      name: name.trim(),
      section: section || null,
      classCode,
      coverColor: coverColor || '#60a5fa',
      courses: validatedCourseIds,
      createdBy: userId,
    });

    console.log('Created cluster:', newCluster);

    return NextResponse.json({ message: 'Cluster created successfully', cluster: newCluster }, { status: 201 });
  } catch (error) {
    console.error('Create Cluster Error:', error);
    return NextResponse.json({
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const clusters = await Cluster.find({
      $or: [
        { createdBy: userId },
        { enrolledUsers: userId }
      ]
    }).populate('courses', 'subject section coverColor').populate('createdBy', 'name');

    return NextResponse.json({ clusters });
  } catch (error) {
    console.error('Get Clusters Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}