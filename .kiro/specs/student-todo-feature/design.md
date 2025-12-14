# Design Document: Student To-Do Feature

## Overview

The Student To-Do feature provides a centralized interface for students to view and manage all pending assignments and forms across their enrolled courses. The feature integrates seamlessly into the existing course page structure as a new tab, displaying tasks with priority-based sorting and visual urgency indicators.

## Architecture

### Component Structure

```
CourseDetailPage (src/app/courses/[slug]/page.js)
├── Tab Navigation
│   ├── Stream Tab
│   ├── Classwork Tab
│   ├── To-Do Tab (NEW)
│   ├── Content Tab
│   ├── People Tab
│   └── Marks Tab
└── Tab Content
    └── ToDoTab Component (NEW)
        ├── ToDoHeader
        ├── LoadingState
        ├── ErrorState
        ├── EmptyState
        └── ToDoList
            ├── PrioritySection (Overdue)
            ├── PrioritySection (Due Soon)
            └── PrioritySection (Upcoming)
                └── ToDoCard (multiple)
```

### Data Flow

1. **Initial Load**: When the To-Do tab is activated, fetch all assignments and forms for the student
2. **Data Aggregation**: Combine assignments and forms from all enrolled courses
3. **Filtering**: Filter out completed/submitted items
4. **Prioritization**: Categorize items by due date urgency
5. **Rendering**: Display prioritized items with appropriate visual indicators
6. **Updates**: Refresh data when returning to the tab or after task completion

## Components and Interfaces

### 1. ToDoTab Component

**Location**: `src/components/ToDoTab.js`

**Purpose**: Main container component for the To-Do feature

**Props**:
```javascript
{
  user: Object,              // Current user object
  courseDetails: Object,     // Current course details (optional, for context)
  isInstructor: Boolean      // Whether user is instructor (should not see this tab)
}
```

**State**:
```javascript
{
  loading: Boolean,
  error: String | null,
  pendingTasks: Array,       // Combined assignments and forms
  taskCounts: {
    overdue: Number,
    dueSoon: Number,
    upcoming: Number,
    total: Number
  }
}
```

**Key Methods**:
- `fetchPendingTasks()`: Fetches all pending assignments and forms
- `categorizeTasks()`: Sorts tasks into priority categories
- `handleTaskClick(task)`: Navigates to task completion page
- `refreshTasks()`: Refetches data after updates

### 2. ToDoCard Component

**Location**: `src/components/ToDoCard.js`

**Purpose**: Individual task card displaying assignment or form details

**Props**:
```javascript
{
  task: {
    _id: String,
    title: String,
    type: 'assignment' | 'form',
    courseId: Object,
    courseName: String,
    dueDate: Date | null,
    priority: 'overdue' | 'dueSoon' | 'upcoming',
    status: 'not_started' | 'draft',
    description: String
  },
  onClick: Function
}
```

**Visual Design**:
- Card with hover effect
- Priority indicator (colored left border)
- Course badge
- Title and description
- Due date with relative time ("Due in 2 days")
- Status badge
- Click to navigate

### 3. PrioritySection Component

**Location**: `src/components/PrioritySection.js`

**Purpose**: Groups tasks by priority level with section header

**Props**:
```javascript
{
  priority: 'overdue' | 'dueSoon' | 'upcoming',
  tasks: Array,
  onTaskClick: Function
}
```

**Visual Design**:
- Section header with priority label and count
- Priority icon and color
- Collapsible section (optional enhancement)
- Grid layout of ToDoCard components

## Data Models

### Task Object (Unified Interface)

```javascript
{
  _id: String,
  type: 'assignment' | 'form',
  title: String,
  description: String,
  courseId: String,
  courseName: String,
  courseSlug: String,
  dueDate: Date | null,
  createdAt: Date,
  priority: 'overdue' | 'dueSoon' | 'upcoming',
  status: 'not_started' | 'draft',
  
  // Assignment-specific
  assignmentType: 'assignment' | 'quiz' | 'material' | 'topic',
  attachments: Array,
  
  // Form-specific
  questionCount: Number,
  isActive: Boolean
}
```

### API Response Structure

**Endpoint**: `GET /api/students/todo`

```javascript
{
  success: Boolean,
  tasks: [
    {
      // Task objects as defined above
    }
  ],
  counts: {
    overdue: Number,
    dueSoon: Number,
    upcoming: Number,
    total: Number
  }
}
```

## API Endpoints

### 1. Get Student To-Do List

**Endpoint**: `GET /api/students/todo`

**Authentication**: Required (student only)

**Query Parameters**: None

**Response**:
```javascript
{
  success: true,
  tasks: [...],
  counts: {
    overdue: 2,
    dueSoon: 5,
    upcoming: 8,
    total: 15
  }
}
```

**Logic**:
1. Get all courses where user is enrolled
2. For each course:
   - Fetch all assignments
   - Fetch all active forms
3. Filter assignments:
   - Exclude if submission exists with status "submitted"
   - Include if no submission or submission status is "draft"
4. Filter forms:
   - Exclude if response exists with isComplete: true
   - Include if no response or response is incomplete
5. Transform to unified task format
6. Calculate priority for each task
7. Sort by priority and due date
8. Return aggregated results

### 2. Get Task Count (for Badge)

**Endpoint**: `GET /api/students/todo/count`

**Authentication**: Required (student only)

**Response**:
```javascript
{
  success: true,
  count: 15
}
```

**Purpose**: Lightweight endpoint for updating badge count without fetching full task list

## Priority Calculation Logic

```javascript
function calculatePriority(dueDate) {
  if (!dueDate) return 'upcoming';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffInMs = due - now;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  if (diffInDays < 0) return 'overdue';
  if (diffInDays <= 3) return 'dueSoon';
  return 'upcoming';
}
```

## Visual Design Specifications

### Priority Colors

- **Overdue**: Red (#EF4444)
  - Border: `border-l-4 border-red-500`
  - Badge: `bg-red-100 text-red-800`
  - Icon: Exclamation circle

- **Due Soon**: Orange (#F59E0B)
  - Border: `border-l-4 border-orange-500`
  - Badge: `bg-orange-100 text-orange-800`
  - Icon: Clock

- **Upcoming**: Blue (#3B82F6)
  - Border: `border-l-4 border-blue-500`
  - Badge: `bg-blue-100 text-blue-800`
  - Icon: Calendar

### Card Layout

```
┌─────────────────────────────────────────┐
│ [Priority Border]                       │
│                                         │
│  [Course Badge]          [Status Badge] │
│                                         │
│  Assignment Title                       │
│  Brief description...                   │
│                                         │
│  📅 Due: Tomorrow at 11:59 PM          │
│  🕐 2 days remaining                   │
│                                         │
└─────────────────────────────────────────┘
```

### Tab Badge

- Position: Top-right of "To-Do" tab text
- Style: Small circular badge with count
- Color: Red background for overdue items, blue otherwise
- Max display: "99+"

## Error Handling

### Network Errors

```javascript
{
  type: 'network',
  message: 'Unable to load tasks. Please check your connection.',
  action: 'retry'
}
```

### Server Errors

```javascript
{
  type: 'server',
  message: 'Something went wrong. Please try again later.',
  action: 'retry'
}
```

### No Courses Enrolled

```javascript
{
  type: 'no_courses',
  message: 'You are not enrolled in any courses yet.',
  action: 'browse_courses'
}
```

### Error Display

- Friendly error message
- Retry button
- Optional support link
- Error icon
- Maintain layout structure

## Testing Strategy

### Unit Tests

1. **Priority Calculation**
   - Test overdue detection
   - Test due soon threshold (3 days)
   - Test upcoming categorization
   - Test null due date handling

2. **Task Filtering**
   - Test submitted assignment exclusion
   - Test draft assignment inclusion
   - Test completed form exclusion
   - Test incomplete form inclusion

3. **Data Transformation**
   - Test assignment to task conversion
   - Test form to task conversion
   - Test course name resolution

### Integration Tests

1. **API Endpoint**
   - Test with enrolled student
   - Test with no enrolled courses
   - Test with mixed pending/completed tasks
   - Test authentication requirement

2. **Component Integration**
   - Test tab navigation
   - Test task click navigation
   - Test loading states
   - Test error states
   - Test empty states

### User Acceptance Tests

1. **Student Workflow**
   - Student can see To-Do tab
   - Student can view all pending tasks
   - Student can click task to navigate
   - Student sees updated list after submission
   - Student sees correct priority indicators

2. **Instructor Verification**
   - Instructor does not see To-Do tab
   - Instructor can still access other tabs

3. **Responsive Design**
   - Test on mobile (320px - 767px)
   - Test on tablet (768px - 1023px)
   - Test on desktop (1024px+)

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Only fetch to-do data when tab is activated
2. **Caching**: Cache task list for 5 minutes to reduce API calls
3. **Pagination**: If task count exceeds 50, implement pagination
4. **Debouncing**: Debounce refresh calls to prevent excessive requests
5. **Memoization**: Use React.memo for ToDoCard components

### Expected Load

- Average student: 10-20 pending tasks
- Maximum expected: 50-100 pending tasks
- API response time target: < 500ms
- Initial render time target: < 200ms

## Accessibility

### WCAG 2.1 AA Compliance

1. **Color Contrast**: All text meets 4.5:1 contrast ratio
2. **Keyboard Navigation**: All interactive elements keyboard accessible
3. **Screen Readers**: Proper ARIA labels and semantic HTML
4. **Focus Indicators**: Visible focus states on all interactive elements
5. **Alternative Text**: Icons have text labels, not just color

### Specific Implementations

- Priority indicators use both color AND text labels
- Due dates include relative time in accessible format
- Task cards have proper heading hierarchy
- Error messages are announced to screen readers
- Loading states have aria-live regions

## Migration and Rollout

### Phase 1: Backend Implementation
- Create API endpoint
- Implement task aggregation logic
- Add priority calculation
- Test with sample data

### Phase 2: Frontend Components
- Create ToDoTab component
- Create ToDoCard component
- Create PrioritySection component
- Implement loading/error/empty states

### Phase 3: Integration
- Add To-Do tab to course page
- Wire up API calls
- Implement navigation
- Add task count badge

### Phase 4: Testing and Refinement
- User acceptance testing
- Performance optimization
- Accessibility audit
- Bug fixes

### Phase 5: Deployment
- Deploy to staging
- Monitor performance
- Gather user feedback
- Deploy to production

## Future Enhancements

1. **Filtering and Sorting**
   - Filter by course
   - Filter by type (assignments vs forms)
   - Custom sort options

2. **Task Management**
   - Mark tasks as "in progress"
   - Add personal notes to tasks
   - Set personal reminders

3. **Calendar Integration**
   - Export to calendar
   - Calendar view of tasks
   - Sync with external calendars

4. **Notifications**
   - Push notifications for due dates
   - Email reminders
   - In-app notifications

5. **Analytics**
   - Track completion rates
   - Time management insights
   - Productivity metrics
