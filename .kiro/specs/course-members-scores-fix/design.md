# Design Document

## Overview

This design document outlines the technical approach for fixing the Members and Scores tabs in the course detail page. The solution focuses on integrating real backend data, implementing proper state management, and creating a responsive UI that handles various data states gracefully.

## Architecture

### Component Structure

```
CourseDetailPage (src/app/courses/[slug]/page.js)
├── Scores Tab Section
│   ├── Statistics Cards (Average Grade, Submission Rate)
│   ├── Filter Controls (Assignment Type, Sort Order)
│   └── Scores Table
│       ├── Table Header
│       ├── Table Body (Submission Rows)
│       └── Empty State
└── Members Tab Section
    ├── Header with Search and Invite Buttons
    └── Members Table
        ├── Table Header
        ├── Teachers Section
        ├── Students Section
        └── Empty State
```

### Data Flow

1. **Initial Load**: When the course page loads, fetch course details including enrolled users
2. **Tab Switch**: When user switches to Scores/Members tab, trigger data fetch if not already loaded
3. **Data Fetching**: Use existing API endpoints to fetch submissions and member data
4. **State Management**: Store fetched data in component state with loading and error states
5. **UI Rendering**: Render tables with real data, applying filters and sorting as needed

## Components and Interfaces

### State Management

The CourseDetailPage component will manage the following additional state:

```javascript
// Scores Tab State
const [submissions, setSubmissions] = useState([]);
const [filteredSubmissions, setFilteredSubmissions] = useState([]);
const [scoresLoading, setScoresLoading] = useState(false);
const [scoresError, setScoresError] = useState('');
const [assignmentFilter, setAssignmentFilter] = useState('all');
const [sortOrder, setSortOrder] = useState('newest');
const [statistics, setStatistics] = useState({
  averageGrade: null,
  submissionRate: null
});

// Members Tab State (already exists, may need enhancements)
const [teachers, setTeachers] = useState([]);
const [students, setStudents] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [filteredMembers, setFilteredMembers] = useState({ teachers: [], students: [] });
```

### API Integration

#### Fetch Submissions for Scores Tab

**Endpoint**: `GET /api/courses/[id]/submissions`

**Request**: 
- Query params: `courseId` (from URL params)
- Headers: Authentication cookie (automatic)

**Response**:
```javascript
{
  submissions: [
    {
      _id: "submission_id",
      assignmentId: {
        _id: "assignment_id",
        title: "Assignment Title",
        type: "assignment" | "quiz" | "material"
      },
      studentId: {
        _id: "student_id",
        name: "Student Name",
        email: "student@example.com"
      },
      status: "draft" | "submitted",
      grade: 85, // or null if not graded
      submittedAt: "2025-12-01T10:00:00Z",
      gradedBy: "teacher_id",
      gradedAt: "2025-12-02T10:00:00Z",
      feedback: "Great work!"
    }
  ]
}
```

**Error Handling**:
- 401: Redirect to login
- 403: Show "Access denied" message
- 404: Show "Course not found" message
- 500: Show "Failed to load submissions" error

#### Fetch Members (Already Implemented)

**Endpoint**: `GET /api/courses/[id]/people`

This endpoint is already implemented and working. No changes needed.

### Functions

#### fetchScoresData()

```javascript
const fetchScoresData = useCallback(async () => {
  if (!courseDetails?._id) return;
  
  setScoresLoading(true);
  setScoresError('');
  
  try {
    const res = await fetch(`/api/courses/${courseDetails._id}/submissions`);
    
    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    setSubmissions(data.submissions || []);
    calculateStatistics(data.submissions || []);
  } catch (err) {
    console.error('Failed to fetch scores:', err);
    setScoresError(err.message);
  } finally {
    setScoresLoading(false);
  }
}, [courseDetails]);
```

#### calculateStatistics()

```javascript
const calculateStatistics = (submissionsData) => {
  // Calculate average grade
  const gradedSubmissions = submissionsData.filter(s => s.grade !== null && s.grade !== undefined);
  const averageGrade = gradedSubmissions.length > 0
    ? (gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length).toFixed(1)
    : null;
  
  // Calculate submission rate
  const submittedCount = submissionsData.filter(s => s.status === 'submitted').length;
  const totalCount = submissionsData.length;
  const submissionRate = totalCount > 0
    ? Math.round((submittedCount / totalCount) * 100)
    : null;
  
  setStatistics({ averageGrade, submissionRate });
};
```

#### filterAndSortSubmissions()

```javascript
useEffect(() => {
  let filtered = [...submissions];
  
  // Apply assignment type filter
  if (assignmentFilter !== 'all') {
    filtered = filtered.filter(s => s.assignmentId?.type === assignmentFilter);
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt);
      case 'oldest':
        return new Date(a.submittedAt || a.createdAt) - new Date(b.submittedAt || b.createdAt);
      case 'highest':
        // Put ungraded at the end
        if (a.grade === null || a.grade === undefined) return 1;
        if (b.grade === null || b.grade === undefined) return -1;
        return b.grade - a.grade;
      case 'lowest':
        // Put ungraded at the end
        if (a.grade === null || a.grade === undefined) return 1;
        if (b.grade === null || b.grade === undefined) return -1;
        return a.grade - b.grade;
      default:
        return 0;
    }
  });
  
  setFilteredSubmissions(filtered);
}, [submissions, assignmentFilter, sortOrder]);
```

#### filterMembers()

```javascript
useEffect(() => {
  if (!searchQuery.trim()) {
    setFilteredMembers({ teachers, students });
    return;
  }
  
  const query = searchQuery.toLowerCase();
  const filteredTeachers = teachers.filter(t => 
    t.name?.toLowerCase().includes(query) || 
    t.email?.toLowerCase().includes(query)
  );
  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(query) || 
    s.email?.toLowerCase().includes(query)
  );
  
  setFilteredMembers({ teachers: filteredTeachers, students: filteredStudents });
}, [teachers, students, searchQuery]);
```

## Data Models

### Submission Model (Existing)

```javascript
{
  _id: ObjectId,
  assignmentId: ObjectId (ref: Assignment),
  studentId: ObjectId (ref: User),
  content: String,
  attachments: [ObjectId] (ref: Content),
  status: "draft" | "submitted",
  submittedAt: Date,
  lastModified: Date,
  workSessionTime: Number,
  progress: Number (0-100),
  grade: Number (0-100),
  gradedBy: ObjectId (ref: User),
  gradedAt: Date,
  feedback: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Assignment Model (Existing)

```javascript
{
  _id: ObjectId,
  title: String,
  type: "assignment" | "quiz" | "material",
  courseId: ObjectId (ref: Course),
  // ... other fields
}
```

### User Model (Existing)

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  profilePicture: String,
  // ... other fields
}
```

## Error Handling

### Loading States

1. **Initial Load**: Show skeleton loaders for tables
2. **Tab Switch**: Show spinner overlay while fetching data
3. **Refresh**: Show subtle loading indicator without blocking UI

### Error States

1. **Network Error**: Display error message with retry button
2. **Authorization Error**: Show "Access denied" message
3. **No Data**: Show appropriate empty state with helpful message
4. **Partial Data**: Show available data with warning about incomplete information

### Error Messages

```javascript
const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to load data. Please try again.',
  UNAUTHORIZED: 'You do not have permission to view this information.',
  NOT_FOUND: 'The requested resource was not found.',
  NO_ASSIGNMENTS: 'No assignments have been created yet.',
  NO_SUBMISSIONS: 'No submissions have been received yet.',
  NO_STUDENTS: 'No students are enrolled in this course.'
};
```

## Testing Strategy

### Unit Tests

1. **calculateStatistics()**: Test with various submission data scenarios
   - All graded submissions
   - Mix of graded and ungraded
   - No graded submissions
   - Empty submissions array

2. **filterAndSortSubmissions()**: Test filtering and sorting logic
   - Filter by assignment type
   - Sort by date (newest/oldest)
   - Sort by grade (highest/lowest)
   - Handle null/undefined grades

3. **filterMembers()**: Test search functionality
   - Search by name
   - Search by email
   - Case-insensitive search
   - Empty search query

### Integration Tests

1. **Scores Tab Data Flow**:
   - Fetch submissions on tab switch
   - Calculate and display statistics
   - Apply filters and sorting
   - Handle empty states

2. **Members Tab Data Flow**:
   - Fetch members on tab switch
   - Display teachers and students
   - Search functionality
   - Invite and remove actions

### Manual Testing Checklist

1. **Scores Tab**:
   - [ ] Verify real submission data is displayed
   - [ ] Check average grade calculation
   - [ ] Check submission rate calculation
   - [ ] Test assignment type filter
   - [ ] Test sort options
   - [ ] Verify empty states
   - [ ] Test loading states
   - [ ] Test error handling

2. **Members Tab**:
   - [ ] Verify member list is accurate
   - [ ] Test search functionality
   - [ ] Verify profile pictures display correctly
   - [ ] Test invite functionality
   - [ ] Test remove functionality
   - [ ] Verify role badges
   - [ ] Test empty states

## UI/UX Considerations

### Scores Tab Improvements

1. **Visual Hierarchy**: Use color coding for grades (green for high, yellow for medium, red for low)
2. **Status Indicators**: Use badges with appropriate colors for submission status
3. **Interactive Rows**: Add hover effects and cursor pointer for clickable rows
4. **Responsive Design**: Ensure table is scrollable on mobile devices
5. **Empty States**: Use friendly illustrations and helpful text

### Members Tab Improvements

1. **Search Debouncing**: Implement 300ms debounce for search input to reduce re-renders
2. **Profile Picture Fallback**: Show initials with consistent color scheme
3. **Role Badges**: Use distinct colors for Owner, Teacher, and Student roles
4. **Action Buttons**: Show remove button only for authorized users
5. **Responsive Layout**: Stack table columns on mobile devices

## Performance Optimizations

1. **Memoization**: Use `useMemo` for expensive calculations (statistics, filtering, sorting)
2. **Debouncing**: Debounce search input to reduce re-renders
3. **Lazy Loading**: Only fetch data when tab is active
4. **Caching**: Cache fetched data to avoid redundant API calls
5. **Pagination**: Consider implementing pagination for large datasets (future enhancement)

## Security Considerations

1. **Authorization**: Verify user has instructor role before showing sensitive data
2. **Data Validation**: Validate all data received from API before rendering
3. **XSS Prevention**: Sanitize user-generated content (names, emails) before display
4. **CSRF Protection**: Use existing authentication cookie mechanism
5. **Rate Limiting**: Respect API rate limits when fetching data

## Accessibility

1. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
2. **Screen Readers**: Add appropriate ARIA labels to tables and buttons
3. **Color Contrast**: Ensure text meets WCAG AA standards for contrast
4. **Focus Indicators**: Provide visible focus indicators for all interactive elements
5. **Semantic HTML**: Use proper table markup with thead, tbody, th, and td elements

## Future Enhancements

1. **Export Functionality**: Allow instructors to export scores as CSV/Excel
2. **Bulk Grading**: Enable grading multiple submissions at once
3. **Grade Distribution Chart**: Show visual representation of grade distribution
4. **Submission Timeline**: Display submission activity over time
5. **Email Notifications**: Notify students when grades are posted
6. **Grade Comments**: Allow inline comments on specific parts of submissions
7. **Rubric Support**: Implement rubric-based grading system
