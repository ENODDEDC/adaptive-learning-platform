import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import Assignment from '@/models/Assignment';
import { Form } from '@/models/Form';
import Submission from '@/models/Submission';
import { verifyToken } from '@/utils/auth';

/**
 * GET /api/students/todo/count
 * Lightweight endpoint to get the count of pending tasks for badge display
 */
export async function GET(request) {
  try {
    console.log('🔢 TODO COUNT API: Fetching task count...');
    
    // Verify authentication
    const payload = await verifyToken();
    if (!payload) {
      console.error('❌ TODO COUNT API: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const studentId = payload.userId;
    console.log('✅ TODO COUNT API: Authenticated student:', studentId);
    
    // Connect to database
    await connectMongoDB();
    
    // Get all courses where student is enrolled
    const enrolledCourses = await Course.find({
      enrolledUsers: studentId,
      isArchived: { $ne: true }
    }).select('_id');
    
    if (enrolledCourses.length === 0) {
      console.log('ℹ️ TODO COUNT API: No enrolled courses');
      return NextResponse.json({
        success: true,
        count: 0
      }, { status: 200 });
    }
    
    const courseIds = enrolledCourses.map(course => course._id);
    
    // Count assignments
    const assignmentCount = await Assignment.countDocuments({
      courseId: { $in: courseIds },
      type: { $in: ['assignment', 'quiz'] }
    });
    
    // Get submitted assignment IDs
    const submittedAssignments = await Submission.find({
      studentId,
      status: 'submitted'
    }).distinct('assignmentId');
    
    // Pending assignments = total assignments - submitted assignments
    const pendingAssignmentCount = assignmentCount - submittedAssignments.length;
    
    // Count forms
    const forms = await Form.find({
      courseId: { $in: courseIds },
      isActive: true
    }).select('_id responses');
    
    // Count pending forms (not completed by student)
    const pendingFormCount = forms.filter(form => {
      const studentResponse = form.responses?.find(
        response => response.studentId?.toString() === studentId
      );
      return !studentResponse || !studentResponse.isComplete;
    }).length;
    
    const totalCount = Math.max(0, pendingAssignmentCount) + pendingFormCount;
    
    console.log('✅ TODO COUNT API: Total count:', totalCount);
    console.log('📊 TODO COUNT API: Breakdown - Assignments:', pendingAssignmentCount, 'Forms:', pendingFormCount);
    
    return NextResponse.json({
      success: true,
      count: totalCount
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ TODO COUNT API Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
