'use client';

import React, { useState, useEffect, useCallback } from 'react';

const CourseScoresTab = ({ courseId, isInstructor }) => {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);

  const processScoresData = useCallback((assignmentsList, submissions) => {
    // Group submissions by student
    const studentMap = {};

    submissions.forEach(submission => {
      if (!submission.studentId) return;

      const studentId = submission.studentId._id || submission.studentId;
      const studentName = submission.studentId.name || 'Unknown Student';
      const studentEmail = submission.studentId.email || '';

      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          id: studentId,
          name: studentName,
          email: studentEmail,
          submissions: {},
          totalGrade: 0,
          gradedCount: 0
        };
      }

      // Store submission for this assignment
      const assignmentId = submission.assignmentId._id || submission.assignmentId;
      studentMap[studentId].submissions[assignmentId] = submission;

      // Calculate average grade
      if (submission.grade !== null && submission.grade !== undefined) {
        studentMap[studentId].totalGrade += submission.grade;
        studentMap[studentId].gradedCount += 1;
      }
    });

    // Calculate average for each student
    const studentsList = Object.values(studentMap).map(student => ({
      ...student,
      averageGrade: student.gradedCount > 0 
        ? (student.totalGrade / student.gradedCount).toFixed(2)
        : null
    }));

    setStudents(studentsList);
    setScores(studentsList);
  }, []);

  const fetchScoresData = useCallback(async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // Fetch assignments for the course
      const assignmentsRes = await fetch(`/api/courses/${courseId}/assignments`);
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        const assignmentsList = assignmentsData.assignments.filter(a => a.type === 'assignment');
        setAssignments(assignmentsList);

        // Only fetch submissions if there are assignments
        if (assignmentsList.length > 0) {
          const submissionsRes = await fetch(`/api/courses/${courseId}/submissions`);
          if (submissionsRes.ok) {
            const submissionsData = await submissionsRes.json();
            processScoresData(assignmentsList, submissionsData.submissions);
          }
        } else {
          // No assignments, so no submissions to process
          setStudents([]);
          setScores([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch scores data:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId, processScoresData]);

  useEffect(() => {
    fetchScoresData();
  }, [fetchScoresData]);

  const getSubmissionStatus = (student, assignmentId) => {
    const submission = student.submissions[assignmentId];
    if (!submission) {
      return { status: 'not_submitted', grade: null, className: 'bg-gray-100 text-gray-600' };
    }
    if (submission.grade !== null && submission.grade !== undefined) {
      return { 
        status: 'graded', 
        grade: submission.grade,
        className: submission.grade >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      };
    }
    if (submission.status === 'submitted') {
      return { status: 'submitted', grade: null, className: 'bg-blue-100 text-blue-600' };
    }
    return { status: 'not_submitted', grade: null, className: 'bg-gray-100 text-gray-600' };
  };

  if (!isInstructor) {
    return (
      <div className="p-8 text-center bg-yellow-50 rounded-xl border border-yellow-200">
        <svg className="w-16 h-16 mx-auto mb-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h4 className="text-lg font-medium text-yellow-900 mb-2">Access Restricted</h4>
        <p className="text-yellow-700">Only instructors can view the scores tab.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading scores...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-xl">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h4>
        <p className="text-gray-600">Create assignments to start tracking student scores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Student Scores & Performance</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{assignments.length} Assignment{assignments.length !== 1 ? 's' : ''}</span>
          <span className="mx-2">•</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span>{students.length} Student{students.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h4>
          <p className="text-gray-600">Students will appear here once they join the course.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Student
                </th>
                {assignments.map(assignment => (
                  <th 
                    key={assignment._id} 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap"
                  >
                    <div className="flex flex-col items-center">
                      <span className="truncate max-w-[120px]" title={assignment.title}>
                        {assignment.title}
                      </span>
                      <span className="text-xs text-gray-400 font-normal mt-1">
                        (100 pts)
                      </span>
                    </div>
                  </th>
                ))}
                <th className="sticky right-0 z-10 bg-gray-50 px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap bg-inherit">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  {assignments.map(assignment => {
                    const submissionStatus = getSubmissionStatus(student, assignment._id);
                    return (
                      <td key={assignment._id} className="px-4 py-4 whitespace-nowrap text-center">
                        {submissionStatus.status === 'graded' ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${submissionStatus.className}`}>
                            {submissionStatus.grade}
                          </span>
                        ) : submissionStatus.status === 'submitted' ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${submissionStatus.className}`}>
                            Submitted
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${submissionStatus.className}`}>
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 px-6 py-4 whitespace-nowrap text-center bg-inherit">
                    {student.averageGrade !== null ? (
                      <div className="flex flex-col items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          student.averageGrade >= 70 
                            ? 'bg-green-100 text-green-800' 
                            : student.averageGrade >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {student.averageGrade}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {student.gradedCount}/{assignments.length} graded
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-4 h-4 bg-green-100 rounded"></span>
          <span className="text-gray-600">Graded (≥70)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-4 h-4 bg-red-100 rounded"></span>
          <span className="text-gray-600">Graded (&lt;70)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-4 h-4 bg-blue-100 rounded"></span>
          <span className="text-gray-600">Submitted</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-4 h-4 bg-gray-100 rounded"></span>
          <span className="text-gray-600">Not Submitted</span>
        </div>
      </div>
    </div>
  );
};

export default CourseScoresTab;
