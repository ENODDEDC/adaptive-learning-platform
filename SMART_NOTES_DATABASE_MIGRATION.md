# Smart Notes Database Migration

## Overview
Smart Notes have been migrated from localStorage to MongoDB database, making them truly global and accessible across all pages.

## Key Changes

### 1. Database Integration
- **Before**: Notes were stored in localStorage with keys like `smart-notes-{userId}-{courseId}-{contentId}`
- **After**: Notes are stored in MongoDB and accessible globally across all pages

### 2. Global Accessibility
- Notes are now **truly global** - create a note on any page and see it everywhere
- No more page-specific or course-specific filtering
- All your notes are always visible and accessible

### 3. API Endpoints

#### GET `/api/notes`
Fetch all notes for the authenticated user
- Query params: `courseId`, `contentId` (optional, for future filtering)
- Returns: Array of all user's notes

#### POST `/api/notes`
Create a new note
- Body: `{ content, position, size, courseId, contentId, type }`
- Returns: Created note object

#### PUT `/api/notes/[id]`
Update an existing note
- Body: `{ content, position, size }`
- Returns: Updated note object

#### DELETE `/api/notes/[id]`
Delete a note
- Returns: Success message

### 4. Automatic Migration
- Old localStorage notes are automatically cleared on first load
- Migration status is tracked in `localStorage.getItem('smart-notes-migrated')`
- Users will need to recreate their notes (old data is cleared for clean start)

### 5. Features
- ✅ Real-time saving to database
- ✅ Optimistic UI updates
- ✅ Drag and drop with position persistence
- ✅ Resize with size persistence
- ✅ Global visibility across all pages
- ✅ Smooth 60fps animations with RAF
- ✅ Auto-save on position/size changes

## Database Schema

```javascript
{
  userId: ObjectId,           // Owner of the note
  courseId: ObjectId,         // Optional - for future filtering
  contentId: String,          // 'global' for global notes
  content: String,            // Note text content
  position: { x, y, page },   // Position on screen
  size: { width, height },    // Note dimensions
  type: 'floating',           // Note type
  isArchived: Boolean,        // Soft delete
  createdAt: Date,
  updatedAt: Date
}
```

## Usage

### Creating a Note
1. Click the unified floating button (bottom-right)
2. Select "Smart Notes"
3. Click the "+" button
4. Type your note and click "Save"

### Moving a Note
- Click and drag the note header to move it
- Position is automatically saved to database

### Resizing a Note
- Drag the resize handle (bottom-right corner)
- Size is automatically saved to database

### Deleting a Note
- Click the trash icon in the note header
- Confirms before deletion

## Technical Details

### Component: `SimpleSmartNotes.js`
- Fetches all notes on mount (global)
- Optimistic UI updates for better UX
- Auto-saves position/size changes
- Uses `requestAnimationFrame` for smooth 60fps dragging

### Model: `Note.js`
- Mongoose schema with indexes for performance
- Compound indexes on `userId`, `courseId`, `contentId`
- Soft delete with `isArchived` flag

### Cleanup: `clearOldNotes.js`
- Auto-runs on first load
- Clears all `smart-notes-*` localStorage keys
- Sets migration flag to prevent re-running

## Future Enhancements
- [ ] Note sharing between users
- [ ] Note categories and tags
- [ ] Search and filter notes
- [ ] Export notes to PDF/Markdown
- [ ] Rich text formatting
- [ ] Attach notes to specific content sections
- [ ] Collaborative editing
