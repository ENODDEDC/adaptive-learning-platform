import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import UserPreference from '@/models/UserPreference';
import User from '@/models/User';

// GET /api/user/preferences - Get user preferences
export async function GET(request) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await UserPreference.findOne({ userId: decoded.userId });

    if (!preferences) {
      // Create default preferences for new user
      preferences = await UserPreference.create({
        userId: decoded.userId,
        layoutPreferences: {
          cardSize: 'medium',
          gridColumns: 'auto',
          compactMode: false,
          showProgress: true,
          showStats: true,
          theme: 'auto',
          animationSpeed: 'normal'
        },
        adaptiveSettings: {
          autoAdjustLayout: true,
          learningRate: 0.1,
          confidenceThreshold: 0.7
        }
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/preferences - Update user preferences
export async function POST(request) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { layoutPreferences, adaptiveSettings, manualOverride } = body;

    let preferences = await UserPreference.findOne({ userId: decoded.userId });

    if (!preferences) {
      preferences = new UserPreference({ userId: decoded.userId });
    }

    // Update layout preferences
    if (layoutPreferences) {
      Object.assign(preferences.layoutPreferences, layoutPreferences);
      if (manualOverride) {
        preferences.learningMetrics.manualOverrides += 1;
      }
    }

    // Update adaptive settings
    if (adaptiveSettings) {
      Object.assign(preferences.adaptiveSettings, adaptiveSettings);
    }

    // Update learning metrics
    preferences.learningMetrics.lastUpdated = new Date();

    await preferences.save();

    return NextResponse.json({
      success: true,
      preferences,
      message: manualOverride ? 'Preferences updated manually' : 'Preferences updated'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}