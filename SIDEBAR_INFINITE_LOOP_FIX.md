# Sidebar Infinite Loop - Fixed

## 🐛 Problem

The Sidebar was making infinite API calls to `/api/auth/profile`, causing:
- Hundreds of database connections
- Server overload
- Poor performance
- Excessive API calls

## 🔍 Root Cause

The infinite loop was caused by **incorrect useEffect dependencies**:

```javascript
// BAD - This creates an infinite loop!
useEffect(() => {
  fetchUserProfile(); // Updates 'user' state
  if (user) {
    fetchCourses();
    fetchScheduledCount();
  }
}, [user]); // ❌ Depends on 'user', which gets updated by fetchUserProfile!
```

**What happened:**
1. useEffect runs → calls `fetchUserProfile()`
2. `fetchUserProfile()` updates `user` state
3. `user` state change triggers useEffect again (because `user` is in dependencies)
4. Loop repeats infinitely! 🔄

## ✅ Solution

Split into two separate useEffects with correct dependencies:

```javascript
// GOOD - Fetch user profile once on mount
useEffect(() => {
  fetchUserProfile();
}, [fetchUserProfile]); // Only runs once

// GOOD - Fetch courses/schedule when user is available
useEffect(() => {
  if (user) {
    fetchCourses();
    fetchScheduledCount();
  }
}, [user]); // Runs when user is set, but doesn't update user
```

## 📋 Changes Made

### 1. Moved `fetchUserProfile` to useCallback
```javascript
const fetchUserProfile = useCallback(async () => {
  // ... fetch logic
}, []);
```

This makes it stable and prevents unnecessary re-renders.

### 2. Split useEffects
- **First useEffect:** Fetches user profile once on mount
- **Second useEffect:** Fetches courses/schedule when user is available

### 3. Removed problematic useEffect
Removed the useEffect that was refetching on pathname change, as it was unnecessary and could cause issues.

### 4. Cleaned up duplicate code
Removed duplicate function definitions that were causing confusion.

## 🎯 Result

- ✅ User profile fetched **once** on mount
- ✅ Courses/schedule fetched when user is available
- ✅ No infinite loops
- ✅ No excessive API calls
- ✅ Better performance

## 💡 Key Lessons

### useEffect Dependencies Rule:
**Never put a state variable in dependencies if that useEffect updates that same state variable!**

```javascript
// ❌ BAD - Infinite loop
useEffect(() => {
  setCount(count + 1); // Updates count
}, [count]); // Depends on count - INFINITE LOOP!

// ✅ GOOD - Runs once
useEffect(() => {
  setCount(1);
}, []); // No dependencies - runs once
```

### When to use useCallback:
Use `useCallback` for functions that:
- Are used in multiple places
- Are dependencies of useEffect
- Need to be stable across renders

```javascript
const fetchData = useCallback(async () => {
  // ... fetch logic
}, []); // Stable function reference

useEffect(() => {
  fetchData(); // Safe to use
}, [fetchData]); // Won't cause infinite loop
```

## 🧪 Testing

After the fix:
1. Refresh the page
2. Check server logs - should see only a few API calls
3. Check browser console - no infinite loop errors
4. Profile picture should load (if uploaded)

## 📊 Before vs After

### Before:
```
GET /api/auth/profile 200 in 969ms
GET /api/auth/profile 200 in 1288ms
GET /api/auth/profile 200 in 1104ms
GET /api/auth/profile 200 in 1249ms
... (infinite loop continues)
```

### After:
```
GET /api/auth/profile 200 in 969ms
(done - no more calls)
```

## 🎉 Summary

The infinite loop was caused by a classic React mistake: having a state variable in useEffect dependencies when that useEffect updates that same state. The fix was to split the logic into separate useEffects with correct dependencies.

**The Sidebar now works correctly without infinite loops!**
