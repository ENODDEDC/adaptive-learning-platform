import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import connectDB from '@/config/mongoConfig';
import AdaptivePreferences from '@/models/AdaptivePreferences';

export async function GET() {
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

    await connectDB();

    let preferences = await AdaptivePreferences.findOne({ userId });

    if (!preferences) {
      // Create default preferences if none exist
      preferences = new AdaptivePreferences({
        userId: session.user.id,
        layoutPreferences: {
          cardSize: 'medium',
          gridColumns: 'auto',
          sortOrder: 'custom',
          showProgress: true,
          showThumbnails: true,
          compactMode: false,
          sidebarCollapsed: false
        },
        interactionPatterns: {
          mostClickedCourses: [],
          favoriteActions: [],
          timeSpentOnFeatures: {},
          navigationPatterns: [],
          preferredViewModes: {},
          searchFrequency: 0,
          filterUsage: {},
          dragDropFrequency: 0
        },
        adaptiveSettings: {
          learningRate: 0.1,
          minInteractions: 5,
          adaptationThreshold: 0.7,
          resetInterval: 7 * 24 * 60 * 60 * 1000
        }
      });

      await preferences.save();
    }

    return NextResponse.json({
      success: true,
      preferences: {
        layoutPreferences: preferences.layoutPreferences,
        interactionPatterns: preferences.interactionPatterns,
        adaptiveSettings: preferences.adaptiveSettings,
        lastAdaptation: preferences.lastAdaptation,
        version: preferences.version
      }
    });

  } catch (error) {
    console.error('Error fetching adaptive preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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
    const { layoutPreferences, adaptiveSettings, reset } = body;

    await connectDB();

    let preferences = await AdaptivePreferences.findOne({ userId });

    if (!preferences) {
      preferences = new AdaptivePreferences({ userId: session.user.id });
    }

    if (reset) {
      // Reset to defaults
      preferences.layoutPreferences = {
        cardSize: 'medium',
        gridColumns: 'auto',
        sortOrder: 'custom',
        showProgress: true,
        showThumbnails: true,
        compactMode: false,
        sidebarCollapsed: false
      };
      preferences.interactionPatterns = {
        mostClickedCourses: [],
        favoriteActions: [],
        timeSpentOnFeatures: {},
        navigationPatterns: [],
        preferredViewModes: {},
        searchFrequency: 0,
        filterUsage: {},
        dragDropFrequency: 0
      };
      preferences.lastAdaptation = null;
      preferences.version += 1;
    } else {
      // Update specific preferences
      if (layoutPreferences) {
        preferences.layoutPreferences = {
          ...preferences.layoutPreferences,
          ...layoutPreferences
        };
      }

      if (adaptiveSettings) {
        preferences.adaptiveSettings = {
          ...preferences.adaptiveSettings,
          ...adaptiveSettings
        };
      }

      preferences.version += 1;
    }

    // Mark for sync
    preferences.syncStatus.needsSync = true;
    preferences.syncStatus.lastSync = new Date();

    await preferences.save();

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        layoutPreferences: preferences.layoutPreferences,
        adaptiveSettings: preferences.adaptiveSettings,
        version: preferences.version
      }
    });

  } catch (error) {
    console.error('Error updating adaptive preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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

    await connectDB();

    await AdaptivePreferences.deleteOne({ userId });

    return NextResponse.json({
      success: true,
      message: 'Adaptive preferences reset successfully'
    });

  } catch (error) {
    console.error('Error resetting adaptive preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}