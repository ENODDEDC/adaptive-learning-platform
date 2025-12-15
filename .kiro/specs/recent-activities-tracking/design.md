# Design Document

## Overview

The Recent Activities feature will provide real-time visibility into user actions across the learning management system. This design implements activity tracking and display for both the student/instructor home page and the admin dashboard. The system leverages the existing Activity model and API infrastructure while adding comprehensive activity logging throughout the application and implementing the UI components to display activities.

### Key Design Goals

1. **User-Centric Display**: Show users only activities relevant to them on the home page
2. **Comprehensive Tracking**: Log all significant user actions across the platform
3. **Performance**: Efficient queries to fetch and display activities without impacting page load times
4. **Scalability**: Automatic cleanup of old activities to prevent database bloat
5. **Reusability**: Create utility functions that can be easily integrated across the codebase

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Home Page (Student/Instructor)  │  Admin Dashboard          │
│  - Recent Activities Widget      │  - Recent Activities Panel│
│  - User-specific activities      │  - All platform activities│
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  /api/activities (user-specific)                            │
│  /api/admin/activities (all activities)                     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ActivityLogger Utility                                      │
│  - logUserRegistration()                                     │
│  - logUserLogin()                                            │
│  - logCourseCreated()                                        │
│  - logCourseEnrolled()                                       │
│  - logAssignmentSubmitted()                                  │
│  - logAssignmentGraded()                                     │
│  - ... (other activity logging methods)                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  Activity Model (MongoDB)                                    │
│  - user (ref)                                                │
│  - action (enum)                                             │
│  - targetType, targetId, targetName                          │
│  - description, metadata                                     │
│  - type, category                                            │
│  - timestamps                                                │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend Components

#### Home Page Recent Activities Widget

**Location**: `src/app/home/page.js`

**Component Structure**:
```jsx
<div className="recent-activities-section">
  <div className="header">
    <Icon />
    <h2>Recent Activities</h2>
  </div>
  <div className="activities-list">
    {activities.map(activity => (
      <ActivityCard
        key={activity.id}
        user={activity.user}
        action={activity.action}
        target={activity.target}
        time={activity.time}
        category={activity.category}
        type={activity.type}
      />
    ))}
  </div>
  {activities.length === 0 && <EmptyState />}
</div>
```

**State Management**:
- `recentActivities`: Array of activity objects
- `loadingActivities`: Boolean for loading state
- `activitiesError`: String for error messages

**Data Fetching**:
```javascript
const fetchRecentActivities = async () => {
  try {
    const response = await fetch('/api/activities?limit=5');
    if (response.ok) {
      const data = await response.json();
      setRecentActivities(data);
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    setActivitiesError('Failed to load activities');
  }
};
```

#### Admin Dashboard Recent Activities Panel

**Location**: `src/app/admin/dashboard/page.js` (already exists)

**Current Implementation**: The admin dashboard already has the UI implemented. We just need to ensure activities are being logged so data appears.

### 2. API Endpoints

#### User-Specific Activities Endpoint

**New Endpoint**: `GET /api/activities`

**Purpose**: Fetch activities relevant to the logged-in user

**Query Parameters**:
- `limit` (optional): Number of activities to return (default: 10)

**Response Format**:
```json
[
  {
    "id": "activity_id",
    "user": "John Doe",
    "action": "enrolled in",
    "target": "Introduction to React",
    "time": "2 hours ago",
    "type": "success",
    "category": "course",
    "description": "John Doe enrolled in Introduction to React",
    "timestamp": "2025-12-15T10:30:00Z"
  }
]
```

**Implementation**:
```javascript
// src/app/api/activities/route.js
export async function GET(request) {
  const user = await verifyToken(); // Get logged-in user
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  // Fetch activities where:
  // 1. User is the actor
  // 2. OR activity affects a course the user is enrolled in
  const activities = await Activity.getUserActivities(user.userId, limit);
  
  return NextResponse.json(formatActivities(activities));
}
```

#### Admin Activities Endpoint

**Existing Endpoint**: `GET /api/admin/activities` (already implemented)

**No changes needed** - This endpoint already fetches all activities for admin dashboard.

### 3. Activity Model Extensions

**Location**: `src/models/Activity.js`

**New Static Method**: `getUserActivities`

```javascript
activitySchema.statics.getUserActivities = async function(userId, limit = 10) {
  try {
    // Get user's enrolled courses
    const User = mongoose.model('User');
    const Course = mongoose.model('Course');
    
    const user = await User.findById(userId);
    if (!user) return [];
    
    // Find courses where user is enrolled or is the creator
    const courses = await Course.find({
      $or: [
        { enrolledUsers: userId },
        { createdBy: userId }
      ]
    }).select('_id');
    
    const courseIds = courses.map(c => c._id);
    
    // Fetch activities where:
    // 1. User is the actor
    // 2. OR activity targets a course the user is involved in
    const activities = await this.find({
      $or: [
        { user: userId },
        { 
          targetType: 'course',
          targetId: { $in: courseIds }
        }
      ]
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return activities;
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
};
```

### 4. Activity Logger Utility

**Location**: `src/utils/activityLogger.js` (already exists, needs extensions)

**Current Implementation**: The ActivityLogger already has some methods like `logUserRegistration`, `logCourseCreated`, etc.

**New Methods to Add**:

```javascript
class ActivityLogger {
  // ... existing methods ...

  // User login activity
  static async logUserLogin(userId) {
    try {
      await Activity.logActivity({
        user: userId,
        action: 'user_login',
        targetType: 'user',
        targetId: userId,
        targetName: 'Account',
        description: 'User logged in',
        type: 'info',
        category: 'user'
      });
    } catch (error) {
      console.error('Error logging user login:', error);
    }
  }

  // Course enrollment activity
  static async logCourseEnrolled(userId, courseId, courseName) {
    try {
      await Activity.logActivity({
        user: userId,
        action: 'course_enrolled',
        targetType: 'course',
        targetId: courseId,
        targetName: courseName,
        description: `User enrolled in ${courseName}`,
        type: 'success',
        category: 'course'
      });
    } catch (error) {
      console.error('Error logging course enrollment:', error);
    }
  }

  // Assignment submission activity
  static async logAssignmentSubmitted(userId, assignmentId, assignmentName, courseId) {
    try {
      await Activity.logActivity({
        user: userId,
        action: 'assignment_submitted',
        targetType: 'assignment',
        targetId: assignmentId,
        targetName: assignmentName,
        description: `User submitted assignment: ${assignmentName}`,
        type: 'success',
        category: 'assignment',
        metadata: { courseId }
      });
    } catch (error) {
      console.error('Error logging assignment submission:', error);
    }
  }

  // Assignment grading activity
  static async logAssignmentGraded(instructorId, studentId, assignmentId, assignmentName, score) {
    try {
      await Activity.logActivity({
        user: instructorId,
        action: 'assignment_graded',
        targetType: 'assignment',
        targetId: assignmentId,
        targetName: assignmentName,
        description: `Assignment graded: ${assignmentName} (Score: ${score})`,
        type: 'info',
        category: 'assignment',
        metadata: { studentId, score }
      });
    } catch (error) {
      console.error('Error logging assignment grading:', error);
    }
  }

  // Profile update activity
  static async logProfileUpdated(userId) {
    try {
      await Activity.logActivity({
        user: userId,
        action: 'profile_updated',
        targetType: 'user',
        targetId: userId,
        targetName: 'Profile',
        description: 'User updated their profile',
        type: 'success',
        category: 'user'
      });
    } catch (error) {
      console.error('Error logging profile update:', error);
    }
  }

  // Password change activity
  static async logPasswordChanged(userId) {
    try {
      await Activity.logActivity({
        user: userId,
        action: 'password_changed',
        targetType: 'user',
        targetId: userId,
        targetName: 'Security',
        description: 'User changed their password',
        type: 'success',
        category: 'user'
      });
    } catch (error) {
      console.error('Error logging password change:', error);
    }
  }
}

export default ActivityLogger;
```

## Data Models

### Activity Schema (Existing)

The Activity model already exists with the following structure:

```javascript
{
  user: ObjectId (ref: 'User'),
  action: String (enum),
  targetType: String (enum: ['course', 'user', 'assignment', 'form', 'system']),
  targetId: ObjectId,
  targetName: String,
  description: String,
  metadata: Mixed,
  ipAddress: String,
  userAgent: String,
  type: String (enum: ['info', 'success', 'warning', 'error']),
  category: String (enum: ['user', 'course', 'assignment', 'form', 'system', 'admin']),
  timestamps: true
}
```

**Indexes** (already exist):
- `createdAt: -1` (for recent activities)
- `user: 1, createdAt: -1` (for user-specific queries)
- `action: 1, createdAt: -1` (for action filtering)
- `category: 1, createdAt: -1` (for category filtering)

## Integration Points

### Where to Add Activity Logging

1. **Authentication Routes**:
   - `src/app/api/auth/login/route.js` - Add `logUserLogin()` after successful login
   - `src/app/api/auth/register/route.js` - Already has `logUserRegistration()`
   - `src/app/api/auth/reset-password/route.js` - Add `logPasswordChanged()`

2. **Course Routes**:
   - `src/app/api/courses/route.js` - Add `logCourseCreated()` when creating courses
   - `src/app/api/courses/[id]/enroll/route.js` - Add `logCourseEnrolled()` when enrolling
   - `src/app/api/admin/courses/route.js` - Already has activity logging for admin actions

3. **Assignment Routes**:
   - `src/app/api/assignments/submit/route.js` - Add `logAssignmentSubmitted()`
   - `src/app/api/assignments/grade/route.js` - Add `logAssignmentGraded()`

4. **User Profile Routes**:
   - `src/app/api/user/profile/route.js` - Add `logProfileUpdated()` when updating profile

## Error Handling

### Activity Logging Failures

**Strategy**: Activity logging should never cause the main operation to fail

```javascript
try {
  await ActivityLogger.logCourseCreated(userId, course);
} catch (activityError) {
  console.error('Error logging activity:', activityError);
  // Don't throw - continue with the main operation
}
```

### API Error Responses

**User Activities Endpoint**:
- 401: Unauthorized (no valid token)
- 500: Server error (database issues)

**Empty State Handling**:
- Return empty array `[]` if no activities found
- Frontend displays appropriate empty state message

## Testing Strategy

### Unit Tests

1. **Activity Logger Tests**:
   - Test each logging method creates correct activity record
   - Test error handling doesn't throw
   - Test metadata is properly stored

2. **Activity Model Tests**:
   - Test `getUserActivities()` returns correct activities
   - Test filtering by user and enrolled courses
   - Test automatic cleanup of old activities

### Integration Tests

1. **API Endpoint Tests**:
   - Test `/api/activities` returns user-specific activities
   - Test authentication requirement
   - Test limit parameter works correctly

2. **End-to-End Tests**:
   - Test activity appears after user action (e.g., course enrollment)
   - Test activity displays correctly on home page
   - Test admin dashboard shows all activities

### Manual Testing Checklist

- [ ] Register new user - activity appears
- [ ] Login - activity appears
- [ ] Enroll in course - activity appears
- [ ] Submit assignment - activity appears
- [ ] Update profile - activity appears
- [ ] Check home page shows only user's activities
- [ ] Check admin dashboard shows all activities
- [ ] Verify empty state displays when no activities
- [ ] Verify relative time formatting ("2 hours ago")
- [ ] Verify category badges display correctly

## Performance Considerations

### Database Queries

1. **Indexes**: Leverage existing indexes on `createdAt`, `user`, and `category`
2. **Limit Results**: Always use `.limit()` to prevent fetching too many records
3. **Lean Queries**: Use `.lean()` for read-only operations to improve performance

### Caching Strategy

**Not implemented in initial version** - Activities are real-time and change frequently. If performance becomes an issue, consider:
- Redis caching for recent activities (5-minute TTL)
- Client-side caching with SWR or React Query

### Automatic Cleanup

The Activity model already implements automatic cleanup:
- Keeps only last 1000 activities
- Cleanup runs automatically when new activity is logged
- Prevents unbounded database growth

## UI/UX Design

### Home Page Activities Widget

**Visual Design**:
- Clean, card-based layout
- Icon indicators for activity type
- Color-coded category badges
- Relative time stamps ("2 hours ago")
- Empty state with friendly message

**Responsive Design**:
- Mobile: Stack activities vertically
- Tablet/Desktop: Show in sidebar or dedicated section

**Interactions**:
- Hover effects on activity cards
- Click to view more details (future enhancement)
- Smooth loading states

### Activity Card Component

```jsx
<div className="activity-card">
  <div className="activity-icon">
    {/* Icon based on type */}
  </div>
  <div className="activity-content">
    <p className="activity-text">
      <span className="user-name">{user}</span> {action} <span className="target">{target}</span>
    </p>
    <div className="activity-meta">
      <span className="time">{time}</span>
      <span className="category-badge">{category}</span>
    </div>
  </div>
</div>
```

## Security Considerations

1. **Authorization**: Users can only see their own activities (enforced in API)
2. **Data Sanitization**: Activity descriptions don't expose sensitive information
3. **Rate Limiting**: Activity logging doesn't create performance vulnerabilities
4. **Privacy**: IP addresses and user agents stored but not displayed to users

## Future Enhancements

1. **Activity Filtering**: Allow users to filter by category on home page
2. **Activity Details**: Click activity to see full details
3. **Notifications**: Real-time notifications for important activities
4. **Activity Search**: Search through activity history
5. **Export**: Export activity logs for record-keeping
6. **Analytics**: Aggregate activity data for insights

## Migration Plan

### Phase 1: Core Implementation
1. Create user activities API endpoint
2. Add `getUserActivities()` method to Activity model
3. Extend ActivityLogger with new methods
4. Implement home page UI component

### Phase 2: Integration
1. Add activity logging to authentication routes
2. Add activity logging to course routes
3. Add activity logging to assignment routes
4. Add activity logging to profile routes

### Phase 3: Testing & Polish
1. Test all activity logging points
2. Verify UI displays correctly
3. Test performance with large datasets
4. Fix any bugs or issues

### Phase 4: Deployment
1. Deploy to staging environment
2. Monitor for errors
3. Deploy to production
4. Monitor activity logs
