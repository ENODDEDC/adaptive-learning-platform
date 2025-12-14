# Requirements Document

## Introduction

This document outlines the requirements for implementing comprehensive activity tracking across the learning management system. The Recent Activities feature will provide both students/instructors on their home page and administrators on the admin dashboard with real-time visibility into user actions, system events, and platform usage patterns. The system already has the Activity model and API endpoint in place, but activities are not being logged consistently across all user interactions, and the home page UI needs to display user-specific activities.

## Glossary

- **Activity_System**: The activity tracking and logging system that records user actions and system events
- **Admin_Dashboard**: The administrative interface where all platform activities are displayed
- **Home_Page**: The student/instructor dashboard where user-specific activities are displayed
- **Activity_Log**: A record of a single user action or system event
- **Activity_Category**: A classification of activities (user, course, assignment, form, system, admin)
- **Activity_Type**: The severity or nature of an activity (info, success, warning, error)
- **User_Action**: Any interaction performed by a user that should be tracked
- **System_Event**: Automated or system-generated events that should be logged
- **User_Specific_Activity**: Activities that are relevant to a specific user (their own actions or actions affecting their courses)

## Requirements

### Requirement 1

**User Story:** As a student or instructor, I want to see my recent activities on my home page, so that I can quickly review my recent actions and stay informed about my course interactions

#### Acceptance Criteria

1. WHEN a user performs any tracked action, THE Activity_System SHALL create an Activity_Log within 1 second
2. WHEN an Activity_Log is created, THE Activity_System SHALL include the user reference, action type, target information, timestamp, and metadata
3. WHEN the Home_Page loads, THE Activity_System SHALL retrieve and display the 5 most recent User_Specific_Activity logs for the logged-in user
4. WHEN a user views the Recent Activities section on Home_Page, THE Home_Page SHALL display each activity with action description, target name, relative time, and category badge
5. IF no activities exist for the user, THEN THE Home_Page SHALL display an empty state message "No recent activity" with appropriate icon

### Requirement 1.1

**User Story:** As an administrator, I want to see all platform activities in real-time on the admin dashboard, so that I can monitor platform usage and identify issues quickly

#### Acceptance Criteria

1. WHEN the Admin_Dashboard loads, THE Activity_System SHALL retrieve and display the 6 most recent Activity_Logs from all users
2. WHEN an administrator views the Recent Activities section, THE Admin_Dashboard SHALL display each activity with user name, action description, target name, relative time, and category badge
3. IF no activities exist in the database, THEN THE Admin_Dashboard SHALL display an empty state message with appropriate icon
4. WHEN an administrator clicks "View all", THE Admin_Dashboard SHALL navigate to a dedicated activities page
5. WHEN the activities page loads, THE Activity_System SHALL display all activities with pagination

### Requirement 2

**User Story:** As an administrator, I want user authentication activities to be tracked, so that I can monitor login patterns and security events

#### Acceptance Criteria

1. WHEN a user successfully registers, THE Activity_System SHALL log a "user_registered" activity with type "success" and category "user"
2. WHEN a user successfully logs in, THE Activity_System SHALL log a "user_login" activity with type "info" and category "user"
3. WHEN a user logs out, THE Activity_System SHALL log a "user_logout" activity with type "info" and category "user"
4. WHEN a user changes their password, THE Activity_System SHALL log a "password_changed" activity with type "success" and category "user"
5. WHEN a user updates their profile, THE Activity_System SHALL log a "profile_updated" activity with type "success" and category "user"

### Requirement 3

**User Story:** As an administrator, I want course-related activities to be tracked, so that I can monitor course management and student engagement

#### Acceptance Criteria

1. WHEN an instructor creates a course, THE Activity_System SHALL log a "course_created" activity with type "success" and category "course"
2. WHEN an instructor updates a course, THE Activity_System SHALL log a "course_updated" activity with type "info" and category "course"
3. WHEN an instructor deletes a course, THE Activity_System SHALL log a "course_deleted" activity with type "warning" and category "course"
4. WHEN a student enrolls in a course, THE Activity_System SHALL log a "course_enrolled" activity with type "success" and category "course"
5. WHEN a student completes a course, THE Activity_System SHALL log a "course_completed" activity with type "success" and category "course"

### Requirement 4

**User Story:** As an administrator, I want assignment and submission activities to be tracked, so that I can monitor student progress and instructor grading

#### Acceptance Criteria

1. WHEN a student submits an assignment, THE Activity_System SHALL log an "assignment_submitted" activity with type "success" and category "assignment"
2. WHEN an instructor grades an assignment, THE Activity_System SHALL log an "assignment_graded" activity with type "info" and category "assignment"
3. WHEN an activity is logged, THE Activity_System SHALL include the assignment name as the target name
4. WHEN an activity is logged, THE Activity_System SHALL include relevant metadata such as score or submission status

### Requirement 5

**User Story:** As an administrator, I want administrative actions to be tracked, so that I can maintain an audit trail of system changes

#### Acceptance Criteria

1. WHEN an administrator creates a user account, THE Activity_System SHALL log an "admin_action" activity with type "info" and category "admin"
2. WHEN an administrator modifies user permissions, THE Activity_System SHALL log an "admin_action" activity with type "warning" and category "admin"
3. WHEN an administrator deletes a user account, THE Activity_System SHALL log an "admin_action" activity with type "warning" and category "admin"
4. WHEN an admin activity is logged, THE Activity_System SHALL include a descriptive message in the description field
5. WHEN an admin activity is logged, THE Activity_System SHALL include the affected user or resource in the target name

### Requirement 6

**User Story:** As a system, I want to automatically clean up old activity logs, so that the database does not grow unbounded

#### Acceptance Criteria

1. WHEN the Activity_System logs a new activity, THE Activity_System SHALL check if the total activity count exceeds 1000
2. IF the activity count exceeds 1000, THEN THE Activity_System SHALL delete the oldest activities to maintain a maximum of 1000 records
3. WHEN activities are deleted, THE Activity_System SHALL delete them in chronological order (oldest first)
4. WHEN the cleanup process runs, THE Activity_System SHALL complete within 2 seconds
5. WHEN activities are deleted, THE Activity_System SHALL not affect the logging of new activities

### Requirement 7

**User Story:** As a user, I want the Recent Activities section to show only activities relevant to me, so that I can focus on my own course interactions

#### Acceptance Criteria

1. WHEN the Home_Page fetches activities, THE Activity_System SHALL filter activities where the user is the actor OR the activity affects a course the user is enrolled in
2. WHEN displaying activities on Home_Page, THE Activity_System SHALL show activities in reverse chronological order (newest first)
3. WHEN a user enrolls in a course, THE Activity_System SHALL log a "course_enrolled" activity
4. WHEN a user submits an assignment, THE Activity_System SHALL log an "assignment_submitted" activity
5. WHEN a user's assignment is graded, THE Activity_System SHALL include that activity in the user's activity feed

### Requirement 8

**User Story:** As a developer, I want a reusable utility function for logging activities, so that I can easily track activities from any part of the application

#### Acceptance Criteria

1. THE Activity_System SHALL provide a utility function named "logActivity" that accepts activity parameters
2. WHEN the logActivity function is called, THE Activity_System SHALL validate all required parameters (user, action, targetType, targetId, targetName, category)
3. WHEN the logActivity function is called with valid parameters, THE Activity_System SHALL create an Activity_Log in the database
4. IF the logActivity function is called with invalid parameters, THEN THE Activity_System SHALL log an error and not create an Activity_Log
5. WHEN the logActivity function completes, THE Activity_System SHALL return the created activity object or null on failure
