import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import connectDB from '@/config/mongoConfig';
import AdaptivePreferences from '@/models/AdaptivePreferences';
import UserBehavior from '@/models/UserBehavior';

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
    const { clientData, lastSync, conflictResolution = 'server_wins' } = body;

    await connectDB();

    let preferences = await AdaptivePreferences.findOne({ userId });

    if (!preferences) {
      // Create new preferences if none exist
      preferences = new AdaptivePreferences({
        userId: session.user.id,
        ...clientData
      });
      await preferences.save();

      return NextResponse.json({
        success: true,
        action: 'created',
        serverData: {
          layoutPreferences: preferences.layoutPreferences,
          interactionPatterns: preferences.interactionPatterns,
          adaptiveSettings: preferences.adaptiveSettings,
          lastAdaptation: preferences.lastAdaptation,
          version: preferences.version
        },
        serverTimestamp: new Date()
      });
    }

    const serverTimestamp = new Date();
    let action = 'updated';
    let hasConflicts = false;

    // Check for conflicts
    if (lastSync && preferences.syncStatus.lastSync > new Date(lastSync)) {
      hasConflicts = true;

      if (conflictResolution === 'client_wins') {
        // Merge client data with server data
        preferences.layoutPreferences = {
          ...preferences.layoutPreferences,
          ...clientData.layoutPreferences
        };

        preferences.interactionPatterns = mergeInteractionPatterns(
          preferences.interactionPatterns,
          clientData.interactionPatterns
        );

        preferences.adaptiveSettings = {
          ...preferences.adaptiveSettings,
          ...clientData.adaptiveSettings
        };

        action = 'merged_client_wins';
      } else if (conflictResolution === 'server_wins') {
        // Keep server data, discard client changes
        action = 'server_wins';
      } else {
        // Manual resolution needed
        return NextResponse.json({
          success: false,
          conflict: true,
          serverData: {
            layoutPreferences: preferences.layoutPreferences,
            interactionPatterns: preferences.interactionPatterns,
            adaptiveSettings: preferences.adaptiveSettings,
            lastAdaptation: preferences.lastAdaptation,
            version: preferences.version
          },
          clientData,
          serverTimestamp: preferences.syncStatus.lastSync,
          message: 'Conflict detected. Please resolve manually.'
        }, { status: 409 });
      }
    } else {
      // No conflicts, update with client data
      preferences.layoutPreferences = {
        ...preferences.layoutPreferences,
        ...clientData.layoutPreferences
      };

      preferences.interactionPatterns = mergeInteractionPatterns(
        preferences.interactionPatterns,
        clientData.interactionPatterns
      );

      preferences.adaptiveSettings = {
        ...preferences.adaptiveSettings,
        ...clientData.adaptiveSettings
      };

      if (clientData.lastAdaptation) {
        preferences.lastAdaptation = clientData.lastAdaptation;
      }
    }

    // Update sync status
    preferences.syncStatus.needsSync = false;
    preferences.syncStatus.lastSync = serverTimestamp;
    preferences.syncStatus.conflictResolved = !hasConflicts;
    preferences.version += 1;

    await preferences.save();

    // Get recent behavior data for client
    const recentBehavior = await UserBehavior.find({
      userId,
      timestamp: { $gte: lastSync ? new Date(lastSync) : new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ timestamp: -1 })
    .limit(100);

    return NextResponse.json({
      success: true,
      action,
      serverData: {
        layoutPreferences: preferences.layoutPreferences,
        interactionPatterns: preferences.interactionPatterns,
        adaptiveSettings: preferences.adaptiveSettings,
        lastAdaptation: preferences.lastAdaptation,
        version: preferences.version
      },
      recentBehavior: recentBehavior.map(b => ({
        id: b._id,
        interactionType: b.interactionType,
        details: b.details,
        timestamp: b.timestamp
      })),
      serverTimestamp,
      hasConflicts
    });

  } catch (error) {
    console.error('Error syncing adaptive data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function mergeInteractionPatterns(serverPatterns, clientPatterns) {
  const merged = { ...serverPatterns };

  // Merge most clicked courses
  if (clientPatterns.mostClickedCourses) {
    const serverCourseMap = new Map(
      merged.mostClickedCourses.map(c => [c.courseId.toString(), c])
    );

    clientPatterns.mostClickedCourses.forEach(clientCourse => {
      const courseId = clientCourse.courseId.toString();
      const serverCourse = serverCourseMap.get(courseId);

      if (serverCourse) {
        // Merge click counts and take latest timestamp
        serverCourse.clickCount += clientCourse.clickCount;
        if (clientCourse.lastClicked > serverCourse.lastClicked) {
          serverCourse.lastClicked = clientCourse.lastClicked;
        }
      } else {
        merged.mostClickedCourses.push(clientCourse);
      }
    });

    // Re-sort and limit
    merged.mostClickedCourses.sort((a, b) => b.clickCount - a.clickCount);
    merged.mostClickedCourses = merged.mostClickedCourses.slice(0, 20);
  }

  // Merge favorite actions
  if (clientPatterns.favoriteActions) {
    clientPatterns.favoriteActions.forEach(action => {
      if (!merged.favoriteActions.includes(action)) {
        merged.favoriteActions.push(action);
      }
    });
  }

  // Merge time spent on features
  if (clientPatterns.timeSpentOnFeatures) {
    Object.entries(clientPatterns.timeSpentOnFeatures).forEach(([feature, time]) => {
      const currentTime = merged.timeSpentOnFeatures.get(feature) || 0;
      merged.timeSpentOnFeatures.set(feature, currentTime + time);
    });
  }

  // Merge navigation patterns
  if (clientPatterns.navigationPatterns) {
    merged.navigationPatterns.push(...clientPatterns.navigationPatterns);
    merged.navigationPatterns = merged.navigationPatterns.slice(-50);
  }

  // Merge preferred view modes
  if (clientPatterns.preferredViewModes) {
    Object.entries(clientPatterns.preferredViewModes).forEach(([viewMode, count]) => {
      const currentCount = merged.preferredViewModes.get(viewMode) || 0;
      merged.preferredViewModes.set(viewMode, currentCount + count);
    });
  }

  // Merge filter usage
  if (clientPatterns.filterUsage) {
    Object.entries(clientPatterns.filterUsage).forEach(([filter, count]) => {
      const currentCount = merged.filterUsage.get(filter) || 0;
      merged.filterUsage.set(filter, currentCount + count);
    });
  }

  // Add client frequencies
  if (clientPatterns.searchFrequency) {
    merged.searchFrequency += clientPatterns.searchFrequency;
  }

  if (clientPatterns.dragDropFrequency) {
    merged.dragDropFrequency += clientPatterns.dragDropFrequency;
  }

  return merged;
}