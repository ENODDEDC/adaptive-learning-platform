import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import connectDB from '@/config/mongoConfig';
import UserBehavior from '@/models/UserBehavior';
import AdaptivePreferences from '@/models/AdaptivePreferences';

export async function POST(request) {
  try {
    const token = (await cookies()).get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { interactionType, details, deviceInfo } = body;

    if (!interactionType) {
      return NextResponse.json({ error: 'Interaction type is required' }, { status: 400 });
    }

    await connectDB();

    // Generate session ID if not provided
    const sessionId = details.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save behavior data
    const behaviorData = new UserBehavior({
      userId,
      sessionId,
      interactionType,
      details,
      deviceInfo: deviceInfo || {},
      timestamp: new Date()
    });

    await behaviorData.save();

    // Update adaptive preferences based on behavior
    await updateAdaptivePreferences(userId, interactionType, details);

    return NextResponse.json({
      success: true,
      message: 'Behavior recorded successfully',
      sessionId
    });

  } catch (error) {
    console.error('Error recording user behavior:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateAdaptivePreferences(userId, interactionType, details) {
  try {
    // Get or create adaptive preferences
    let preferences = await AdaptivePreferences.findOne({ userId });

    if (!preferences) {
      preferences = new AdaptivePreferences({ userId });
    }

    const now = new Date();

    // Update interaction patterns based on behavior
    switch (interactionType) {
      case 'course_click':
        const courseId = details.courseId;
        if (courseId) {
          const existingCourse = preferences.interactionPatterns.mostClickedCourses.find(
            c => c.courseId.toString() === courseId
          );

          if (existingCourse) {
            existingCourse.clickCount += 1;
            existingCourse.lastClicked = now;
          } else {
            preferences.interactionPatterns.mostClickedCourses.push({
              courseId,
              clickCount: 1,
              lastClicked: now
            });
          }

          // Keep only top 20 most clicked courses
          preferences.interactionPatterns.mostClickedCourses.sort(
            (a, b) => b.clickCount - a.clickCount
          );
          preferences.interactionPatterns.mostClickedCourses =
            preferences.interactionPatterns.mostClickedCourses.slice(0, 20);
        }
        break;

      case 'action_performed':
        const action = details.action;
        if (action && !preferences.interactionPatterns.favoriteActions.includes(action)) {
          preferences.interactionPatterns.favoriteActions.push(action);
        }
        break;

      case 'feature_usage':
        const feature = details.feature;
        const duration = details.duration || 0;
        if (feature) {
          const currentTime = preferences.interactionPatterns.timeSpentOnFeatures.get(feature) || 0;
          preferences.interactionPatterns.timeSpentOnFeatures.set(feature, currentTime + duration);
        }
        break;

      case 'navigation':
        const path = details.path;
        if (path) {
          preferences.interactionPatterns.navigationPatterns.push(path);
          // Keep only last 50 navigation events
          preferences.interactionPatterns.navigationPatterns =
            preferences.interactionPatterns.navigationPatterns.slice(-50);
        }
        break;

      case 'view_mode_change':
        const viewMode = details.viewMode;
        if (viewMode) {
          const currentCount = preferences.interactionPatterns.preferredViewModes.get(viewMode) || 0;
          preferences.interactionPatterns.preferredViewModes.set(viewMode, currentCount + 1);
        }
        break;

      case 'search':
        preferences.interactionPatterns.searchFrequency += 1;
        break;

      case 'filter_used':
        const filter = details.filter;
        if (filter) {
          const currentCount = preferences.interactionPatterns.filterUsage.get(filter) || 0;
          preferences.interactionPatterns.filterUsage.set(filter, currentCount + 1);
        }
        break;

      case 'drag_drop':
        preferences.interactionPatterns.dragDropFrequency += 1;
        break;
    }

    // Mark for sync
    preferences.syncStatus.needsSync = true;
    preferences.syncStatus.lastSync = now;

    await preferences.save();

  } catch (error) {
    console.error('Error updating adaptive preferences:', error);
    // Don't throw error to avoid breaking the main behavior tracking
  }
}