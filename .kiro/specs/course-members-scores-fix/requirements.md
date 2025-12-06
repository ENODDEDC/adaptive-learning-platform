# Requirements Document

## Introduction

This document outlines the requirements for fixing the Members and Scores tabs in the course detail page from the teacher/course owner perspective. The current implementation shows placeholder data in the Scores tab and needs proper backend integration to display real student submissions, grades, and statistics.

## Glossary

- **Course Owner**: The user who created the course (identified by `createdBy` field)
- **Co-Teacher**: A user with teaching privileges in the course (listed in `coTeachers` array)
- **Instructor**: Either a Course Owner or Co-Teacher
- **Student**: A user enrolled in the course (listed in `enrolledUsers` array)
- **Submission**: A student's work submitted for an assignment
- **Grade**: A numerical score (0-100) assigned to a submission by an instructor
- **Assignment**: A classwork item that students can submit work for
- **Scores Tab**: The UI tab that displays student grades and submission statistics
- **Members Tab**: The UI tab that displays all course participants (teachers and students)

## Requirements

### Requirement 1: Display Real Submission Data in Scores Tab

**User Story:** As an instructor, I want to see actual student submissions and grades in the Scores tab, so that I can track student performance accurately.

#### Acceptance Criteria

1. WHEN the Instructor navigates to the Scores tab, THE System SHALL fetch all submissions for all assignments in the course from the backend API
2. WHEN submissions are loaded, THE System SHALL display each submission with the student name, assignment title, actual grade (if graded), and submission status
3. IF a submission has a grade value, THEN THE System SHALL display the numerical grade in the Score column
4. IF a submission does not have a grade value, THEN THE System SHALL display "—" or "Not Graded" in the Score column
5. WHEN displaying submission status, THE System SHALL show "Submitted" for submissions with status "submitted", "Draft" for submissions with status "draft", and "Not Submitted" for students who have not created a submission

### Requirement 2: Calculate and Display Course Statistics

**User Story:** As an instructor, I want to see aggregate statistics about student performance, so that I can understand overall class progress at a glance.

#### Acceptance Criteria

1. WHEN the Scores tab loads with submission data, THE System SHALL calculate the average grade across all graded submissions
2. WHEN calculating average grade, THE System SHALL only include submissions that have a grade value greater than or equal to 0
3. WHEN the Scores tab loads with submission data, THE System SHALL calculate the submission rate as the percentage of assignments that have been submitted
4. WHEN displaying the average grade, THE System SHALL show the value rounded to one decimal place
5. WHEN displaying the submission rate, THE System SHALL show the value as a percentage rounded to the nearest whole number

### Requirement 3: Filter and Sort Scores Data

**User Story:** As an instructor, I want to filter and sort the scores table, so that I can find specific information quickly.

#### Acceptance Criteria

1. WHEN the Instructor selects a filter option from the assignment type dropdown, THE System SHALL display only submissions for assignments matching the selected type
2. WHEN the Instructor selects "All assignments" from the filter dropdown, THE System SHALL display submissions for all assignment types
3. WHEN the Instructor selects a sort option, THE System SHALL reorder the table rows according to the selected criteria
4. THE System SHALL provide sort options including "Newest", "Oldest", "Highest Grade", and "Lowest Grade"
5. WHEN sorting by grade, THE System SHALL place ungraded submissions at the end of the list

### Requirement 4: Handle Empty States Gracefully

**User Story:** As an instructor, I want to see helpful messages when there is no data, so that I understand why the table is empty.

#### Acceptance Criteria

1. WHEN there are no assignments in the course, THE System SHALL display a message "No assignments created yet" in the Scores tab
2. WHEN there are assignments but no submissions, THE System SHALL display a message "No submissions yet" in the Scores tab
3. WHEN there are no enrolled students, THE System SHALL display a message "No students enrolled" in the Scores tab
4. WHEN displaying empty state messages, THE System SHALL include an icon and helpful text explaining the situation
5. THE System SHALL display the empty state message in place of the scores table

### Requirement 5: Optimize Members Tab Performance

**User Story:** As an instructor, I want the Members tab to load quickly and display accurate information, so that I can manage course participants efficiently.

#### Acceptance Criteria

1. WHEN the Instructor navigates to the Members tab, THE System SHALL fetch the current list of teachers and students from the backend API
2. WHEN displaying member information, THE System SHALL show the user's profile picture, name, email, role badge, status indicator, and join date
3. WHEN a member has a profile picture, THE System SHALL display the image with proper error handling
4. IF a profile picture fails to load, THEN THE System SHALL display the user's initials as a fallback
5. WHEN the Instructor uses the search input, THE System SHALL filter the members list to show only users whose name or email matches the search query

### Requirement 6: Implement Real-time Data Refresh

**User Story:** As an instructor, I want the Scores and Members tabs to show current data, so that I always see the latest information without manually refreshing the page.

#### Acceptance Criteria

1. WHEN the Instructor switches to the Scores tab, THE System SHALL fetch the latest submission data from the API
2. WHEN the Instructor switches to the Members tab, THE System SHALL fetch the latest member list from the API
3. WHEN a new submission is created or graded, THE System SHALL update the Scores tab data within 5 seconds if the tab is currently active
4. WHEN a new member joins or leaves the course, THE System SHALL update the Members tab data within 5 seconds if the tab is currently active
5. THE System SHALL display a loading indicator while fetching data to provide visual feedback to the user

### Requirement 7: Display Submission Details on Click

**User Story:** As an instructor, I want to click on a submission row to see more details, so that I can review student work and provide feedback.

#### Acceptance Criteria

1. WHEN the Instructor clicks on a submission row in the Scores tab, THE System SHALL navigate to the submission detail page
2. WHEN navigating to the submission detail page, THE System SHALL pass the submission ID as a URL parameter
3. THE System SHALL maintain the current tab state when the user returns from the submission detail page
4. WHEN the submission has attachments, THE System SHALL display an attachment icon in the row
5. WHEN the submission has feedback, THE System SHALL display a feedback icon in the row
