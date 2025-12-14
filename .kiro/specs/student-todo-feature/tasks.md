# Implementation Plan: Student To-Do Feature

## Task List

- [x] 1. Create backend API endpoint for student to-do list

  - [x] 1.1 Create `/api/students/todo/route.js` endpoint


    - Implement GET handler to fetch all pending tasks for authenticated student
    - Aggregate assignments from all enrolled courses
    - Aggregate forms from all enrolled courses
    - Filter out submitted assignments and completed forms
    - Calculate priority for each task based on due date
    - Transform data to unified task format
    - Return sorted and categorized task list with counts
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 1.2 Create `/api/students/todo/count/route.js` endpoint

    - Implement lightweight GET handler for task count only
    - Return total count of pending tasks for badge display
    - Optimize query to count without fetching full task details
    - _Requirements: 11.1, 11.2_
  
  - [x] 1.3 Add authentication and authorization middleware

    - Verify user is authenticated
    - Verify user has student role
    - Return 401 for unauthenticated requests
    - Return 403 for non-student users
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create ToDoCard component

  - [x] 2.1 Create `src/components/ToDoCard.js` component file


    - Accept task prop with all required fields
    - Implement card layout with priority border
    - Display course badge with course name
    - Display task title and description
    - Display due date with relative time formatting
    - Display status badge (not started, draft)
    - Add priority indicator with appropriate color
    - Implement hover effects for interactivity
    - Add onClick handler for navigation
    - Make component responsive for mobile and desktop
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 2.2 Implement priority color system

    - Add red styling for overdue tasks
    - Add orange styling for due soon tasks
    - Add blue styling for upcoming tasks
    - Use Tailwind CSS classes for consistent styling
    - Ensure color contrast meets WCAG standards
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 2.3 Add accessibility features

    - Add proper ARIA labels for screen readers
    - Implement keyboard navigation support
    - Add focus indicators for keyboard users
    - Include text labels alongside color indicators
    - Use semantic HTML elements
    - _Requirements: 5.5, 12.4, 12.5_

- [x] 3. Create PrioritySection component

  - [x] 3.1 Create `src/components/PrioritySection.js` component file


    - Accept priority type and tasks array as props
    - Display section header with priority label
    - Display task count for the section
    - Render grid of ToDoCard components
    - Add priority icon to section header
    - Apply appropriate color scheme based on priority
    - Handle empty section state (hide if no tasks)
    - _Requirements: 4.1, 4.2, 4.3, 9.4, 9.5_
  
  - [x] 3.2 Implement responsive grid layout

    - Use CSS Grid for card layout
    - Single column on mobile devices
    - Two columns on tablet devices
    - Three columns on desktop devices
    - Maintain consistent spacing between cards
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 4. Create ToDoTab component

  - [x] 4.1 Create `src/components/ToDoTab.js` component file


    - Accept user and courseDetails props
    - Initialize state for loading, error, and tasks
    - Implement fetchPendingTasks function to call API
    - Implement categorizeTasks function to group by priority
    - Implement handleTaskClick function for navigation
    - Implement refreshTasks function for updates
    - Add useEffect to fetch data on component mount
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 3.1, 6.1, 6.2, 6.3, 6.4, 6.5, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 4.2 Implement loading state

    - Display loading spinner while fetching data
    - Show loading message
    - Maintain layout structure during loading
    - _Requirements: 8.1_
  
  - [x] 4.3 Implement error state

    - Display error message when fetch fails
    - Show retry button
    - Handle different error types (network, server)
    - Implement retry functionality
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [x] 4.4 Implement empty state

    - Display friendly message when no pending tasks
    - Show positive encouragement message
    - Include appropriate icon or illustration
    - Maintain consistent styling with other states
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 4.5 Render priority sections

    - Render PrioritySection for overdue tasks
    - Render PrioritySection for due soon tasks
    - Render PrioritySection for upcoming tasks
    - Pass appropriate tasks to each section
    - Pass handleTaskClick to sections
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Integrate To-Do tab into course page

  - [x] 5.1 Update `src/app/courses/[slug]/page.js` to add To-Do tab


    - Add "To-Do" tab to tab navigation array
    - Add conditional rendering to show tab only for students
    - Add tab click handler to set activeTab to 'todo'
    - Add active state styling for To-Do tab
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 5.2 Add ToDoTab component rendering

    - Import ToDoTab component
    - Add conditional rendering when activeTab is 'todo'
    - Pass user prop to ToDoTab
    - Pass courseDetails prop to ToDoTab
    - Pass isInstructor prop to ToDoTab
    - _Requirements: 1.2, 1.5_
  
  - [x] 5.3 Implement task count badge on tab


    - Fetch task count from API endpoint
    - Display badge with count on To-Do tab
    - Update badge when tasks are completed
    - Hide badge when count is zero
    - Limit display to "99+" for large counts
    - Style badge to be visually distinct
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 6. Implement task navigation functionality

  - [x] 6.1 Add navigation logic for assignments

    - Detect assignment type tasks
    - Navigate to `/submissions/[assignmentId]` for assignments
    - Pass assignment ID in URL
    - Preserve course context in navigation
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [x] 6.2 Add navigation logic for forms

    - Detect form type tasks
    - Navigate to `/forms/[formId]` for forms
    - Pass form ID in URL
    - Preserve course context in navigation
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 7. Implement real-time updates

  - [x] 7.1 Add refresh logic on tab activation

    - Detect when To-Do tab becomes active
    - Trigger data refresh when tab is activated
    - Avoid unnecessary refreshes when already active
    - _Requirements: 10.4_
  
  - [x] 7.2 Add refresh logic after task completion

    - Listen for task completion events
    - Refresh to-do list when student returns from submission
    - Update task count badge
    - Maintain scroll position during refresh
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 8. Add utility functions and helpers

  - [x] 8.1 Create priority calculation utility


    - Create `src/utils/taskPriority.js` file
    - Implement calculatePriority function
    - Handle overdue detection (due date < now)
    - Handle due soon detection (due date within 3 days)
    - Handle upcoming categorization
    - Handle null due dates (default to upcoming)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 8.2 Create date formatting utility


    - Create relative time formatting function
    - Format due dates as "Due in X days"
    - Format overdue dates as "X days overdue"
    - Handle today and tomorrow specially
    - Use date-fns library for consistency
    - _Requirements: 2.3, 2.5_

- [x] 9. Style and polish UI


  - [x] 9.1 Apply consistent styling across components

    - Use existing Tailwind theme colors
    - Match styling of other course tabs
    - Ensure consistent spacing and padding
    - Apply hover and focus states
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 9.2 Add animations and transitions

    - Add fade-in animation for task cards
    - Add hover transitions for interactive elements
    - Add loading spinner animation
    - Keep animations subtle and performant
    - _Requirements: 6.1, 6.2_
  
  - [x] 9.3 Optimize for mobile devices

    - Test on mobile viewport sizes
    - Ensure touch targets are adequate size
    - Adjust spacing for mobile screens
    - Test scrolling behavior
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 10. Testing and validation
  - [ ] 10.1 Test API endpoint functionality
    - Test with student user having pending tasks
    - Test with student user having no pending tasks
    - Test with student not enrolled in any courses
    - Test authentication and authorization
    - Test error handling for database failures
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 10.2 Test component rendering
    - Test ToDoCard with different task types
    - Test ToDoCard with different priorities
    - Test PrioritySection with multiple tasks
    - Test ToDoTab with all states (loading, error, empty, populated)
    - Test responsive behavior at different screen sizes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 12.1, 12.2, 12.3_
  
  - [ ] 10.3 Test navigation functionality
    - Test clicking assignment cards navigates correctly
    - Test clicking form cards navigates correctly
    - Test navigation preserves course context
    - Test back navigation returns to To-Do tab
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 10.4 Test real-time updates
    - Test task removal after submission
    - Test badge count updates
    - Test refresh on tab activation
    - Test scroll position preservation
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2_
  
  - [ ] 10.5 Test accessibility
    - Test keyboard navigation through all interactive elements
    - Test screen reader announcements
    - Test focus indicators visibility
    - Test color contrast ratios
    - Test with browser accessibility tools
    - _Requirements: 5.5, 12.4, 12.5_

- [ ] 11. Documentation and cleanup
  - [ ] 11.1 Add code comments
    - Document complex logic in API endpoint
    - Add JSDoc comments to component props
    - Document utility functions
    - Add inline comments for clarity
    - _Requirements: All_
  
  - [ ] 11.2 Update user documentation
    - Document To-Do feature in user guide
    - Add screenshots of To-Do tab
    - Explain priority system to users
    - Document how to navigate to tasks
    - _Requirements: All_
