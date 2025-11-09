# React Prop Warning Fix

## Problem
React was showing warnings about unrecognized props on DOM elements:
```
React does not recognize the `upcomingTasksExpanded` prop on a DOM element
React does not recognize the `setUpcomingTasksExpanded` prop on a DOM element
React does not recognize the `sidebarCollapsed` prop on a DOM element
```

## Root Cause
In `Layout.js`, we were using `React.cloneElement` to pass props to children:

```javascript
// ❌ Problem: Passes props to ALL children, including DOM elements
{React.cloneElement(children, {
  upcomingTasksExpanded,
  setUpcomingTasksExpanded,
  sidebarCollapsed: sidebarState,
  setSidebarCollapsed: setIsSidebarCollapsed
})}
```

When the child is a DOM element (like `<div>`), React complains because these are not valid HTML attributes.

## Solution
Check if the child is a React component before cloning:

```javascript
// ✅ Solution: Only pass props to React components, not DOM elements
{React.isValidElement(children) && typeof children.type !== 'string'
  ? React.cloneElement(children, {
      upcomingTasksExpanded,
      setUpcomingTasksExpanded,
      sidebarCollapsed: sidebarState,
      setSidebarCollapsed: setIsSidebarCollapsed
    })
  : children}
```

### How It Works

**Check 1: `React.isValidElement(children)`**
- Ensures the child is a valid React element
- Returns `false` for `null`, `undefined`, strings, numbers

**Check 2: `typeof children.type !== 'string'`**
- Ensures the child is a React component, not a DOM element
- DOM elements have string types: `'div'`, `'span'`, `'button'`
- React components have function/class types

**Result:**
- ✅ Props passed to React components (like `CourseDetailPage`)
- ✅ Props NOT passed to DOM elements (like `<div>`)
- ✅ No React warnings

## Technical Details

### Element Types in React

```javascript
// DOM element - type is string
<div /> // children.type === 'div'

// React component - type is function/class
<CourseDetailPage /> // children.type === CourseDetailPage (function)
```

### Why This Matters

**DOM Elements:**
- Only accept standard HTML attributes
- Custom props cause React warnings
- Props are ignored by browser

**React Components:**
- Accept any props
- Props are used in component logic
- No warnings

## Code Changes

### src/components/Layout.js

```diff
  <main className={`h-full ${contentOverflow}`}>
-   {React.cloneElement(children, {
-     upcomingTasksExpanded,
-     setUpcomingTasksExpanded,
-     sidebarCollapsed: sidebarState,
-     setSidebarCollapsed: setIsSidebarCollapsed
-   })}
+   {React.isValidElement(children) && typeof children.type !== 'string'
+     ? React.cloneElement(children, {
+         upcomingTasksExpanded,
+         setUpcomingTasksExpanded,
+         sidebarCollapsed: sidebarState,
+         setSidebarCollapsed: setIsSidebarCollapsed
+       })
+     : children}
  </main>
```

## Benefits

✅ **No More Warnings**: Console is clean
✅ **Proper Prop Passing**: Only to components that need them
✅ **Better Performance**: No unnecessary prop spreading
✅ **Type Safety**: Prevents prop misuse
✅ **Cleaner Code**: More explicit about what receives props

## Testing

- [x] Navigate to `/home` - No warnings
- [x] Navigate to `/courses` - No warnings
- [x] Navigate to `/courses/[id]` - Props received correctly
- [x] Sidebar collapse/expand - Works correctly
- [x] Upcoming tasks expand/collapse - Works correctly
- [x] Console is clean - No React warnings

## Related Files
- `src/components/Layout.js` - Fixed prop passing logic

## Best Practices Applied

1. **Type Checking**: Always check element type before cloning
2. **Defensive Programming**: Handle both components and DOM elements
3. **Clean Console**: No warnings in production
4. **Explicit Intent**: Clear what receives props and why

## Result

The console is now clean with no React warnings, and props are only passed to components that actually need them! ✨
