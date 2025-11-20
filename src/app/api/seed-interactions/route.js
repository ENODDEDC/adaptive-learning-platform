import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LearningBehavior from '@/models/LearningBehavior';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import { verifyToken } from '@/lib/auth';

/**
 * Seed 49 interactions for demo/defense purposes
 * This allows you to reach 50 interactions with just 1 more manual interaction
 */
export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;

    await connectDB();

    const { count = 49, realistic = false } = await request.json();

    // Check current interaction count
    const existingCount = await LearningBehavior.countDocuments({ userId });
    
    // Allow up to 250 total interactions for testing
    const MAX_TOTAL = 250;
    
    if (existingCount >= MAX_TOTAL) {
      return NextResponse.json({
        success: false,
        message: `User already has ${existingCount} interactions. Reset profile first if needed.`,
        currentCount: existingCount
      }, { status: 400 });
    }

    // Calculate how many to add (don't exceed MAX_TOTAL)
    const toAdd = Math.min(count, MAX_TOTAL - existingCount);
    
    if (toAdd <= 0) {
      return NextResponse.json({
        success: false,
        message: `User already has ${existingCount} interactions. Maximum is ${MAX_TOTAL}.`,
        currentCount: existingCount
      }, { status: 400 });
    }

    // Generate diverse realistic interactions with proper modeUsage structure
    const interactions = [];
    const now = new Date();
    
    // Learning mode mapping - different weights based on realistic flag
    let modeMapping;
    
    if (realistic) {
      // Simulate a real user with clear Visual-Active-Sensing-Sequential preferences
      modeMapping = {
        visualLearning: { name: 'Visual Learning', weight: 35 },      // Strong visual preference
        activeLearning: { name: 'Active Learning', weight: 30 },      // Strong active preference
        sensingLearning: { name: 'Sensing Learning', weight: 25 },    // Moderate sensing preference
        sequentialLearning: { name: 'Sequential Learning', weight: 20 }, // Moderate sequential
        aiNarrator: { name: 'AI Narrator', weight: 8 },               // Low verbal
        reflectiveLearning: { name: 'Reflective Learning', weight: 7 }, // Low reflective
        intuitiveLearning: { name: 'Intuitive Learning', weight: 5 },  // Low intuitive
        globalLearning: { name: 'Global Learning', weight: 5 }         // Low global
      };
    } else {
      // Balanced/random distribution (current behavior)
      modeMapping = {
        aiNarrator: { name: 'AI Narrator', weight: 10 },
        visualLearning: { name: 'Visual Learning', weight: 15 },
        sequentialLearning: { name: 'Sequential Learning', weight: 12 },
        globalLearning: { name: 'Global Learning', weight: 10 },
        sensingLearning: { name: 'Sensing Learning', weight: 13 },
        intuitiveLearning: { name: 'Intuitive Learning', weight: 11 },
        activeLearning: { name: 'Active Learning', weight: 15 },
        reflectiveLearning: { name: 'Reflective Learning', weight: 14 }
      };
    }

    const modeKeys = Object.keys(modeMapping);

    for (let i = 0; i < toAdd; i++) {
      // Select a random learning mode based on weights
      const totalWeight = Object.values(modeMapping).reduce((sum, m) => sum + m.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedMode = modeKeys[0];
      
      for (const [key, mode] of Object.entries(modeMapping)) {
        random -= mode.weight;
        if (random <= 0) {
          selectedMode = key;
          break;
        }
      }

      // Create modeUsage structure with 1 interaction in the selected mode
      const modeUsage = {};
      modeKeys.forEach(mode => {
        modeUsage[mode] = {
          count: mode === selectedMode ? 1 : 0,
          totalTime: mode === selectedMode ? Math.floor(Math.random() * 180000) + 30000 : 0, // 30-210 seconds in ms
          lastUsed: mode === selectedMode ? new Date(now.getTime() - (toAdd - i) * 60000 * 5) : undefined
        };
      });

      // Create realistic interaction data with proper structure
      const interaction = {
        userId,
        sessionId: `seed-session-${Math.floor(i / 10)}`, // Group into sessions
        timestamp: new Date(now.getTime() - (toAdd - i) * 60000 * 5), // Spread over time (5 min intervals)
        
        // Proper modeUsage structure
        modeUsage,
        
        // AI Assistant usage (some interactions)
        aiAssistantUsage: Math.random() > 0.7 ? {
          askMode: { count: 0, totalTime: 0 },
          researchMode: { count: 0, totalTime: 0 },
          textToDocsMode: { count: 0, totalTime: 0 },
          totalInteractions: 0,
          averagePromptLength: 0,
          totalPromptLength: 0
        } : undefined,
        
        // Content interactions
        contentInteractions: [],
        
        // Activity engagement
        activityEngagement: {
          quizzesCompleted: Math.random() > 0.8 ? 1 : 0,
          practiceQuestionsAttempted: Math.random() > 0.7 ? 1 : 0,
          discussionParticipation: Math.random() > 0.85 ? 1 : 0,
          reflectionJournalEntries: selectedMode === 'reflectiveLearning' ? 1 : 0,
          visualDiagramsViewed: selectedMode === 'visualLearning' ? 1 : 0,
          handsOnLabsCompleted: selectedMode === 'activeLearning' ? 1 : 0,
          conceptExplorationsCount: Math.random() > 0.75 ? 1 : 0,
          sequentialStepsCompleted: selectedMode === 'sequentialLearning' ? 1 : 0
        },
        
        // Learning pace
        learningPace: {
          averageSessionDuration: Math.floor(Math.random() * 1800000) + 600000, // 10-40 min
          preferredTimeOfDay: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
          breakFrequency: Math.floor(Math.random() * 3),
          contentConsumptionSpeed: ['slow', 'moderate', 'fast'][Math.floor(Math.random() * 3)]
        },
        
        // Device info
        deviceInfo: {
          platform: Math.random() > 0.3 ? 'desktop' : 'mobile',
          userAgent: 'Seeded Data',
          screenSize: '1920x1080',
          timezone: 'Asia/Manila'
        },
        
        metadata: {
          seeded: true,
          seedBatch: new Date().toISOString(),
          purpose: 'defense-demo',
          selectedMode
        }
      };

      interactions.push(interaction);
    }

    // Insert all interactions
    const result = await LearningBehavior.insertMany(interactions);

    // Get updated count
    const newCount = await LearningBehavior.countDocuments({ userId });

    // Update the user's profile with aggregated stats
    const profile = await LearningStyleProfile.getOrCreate(userId);
    
    // Initialize aggregatedStats if not exists
    if (!profile.aggregatedStats) {
      profile.aggregatedStats = {
        modeUsage: {
          aiNarrator: { count: 0, totalTime: 0 },
          visualLearning: { count: 0, totalTime: 0 },
          sequentialLearning: { count: 0, totalTime: 0 },
          globalLearning: { count: 0, totalTime: 0 },
          sensingLearning: { count: 0, totalTime: 0 },
          intuitiveLearning: { count: 0, totalTime: 0 },
          activeLearning: { count: 0, totalTime: 0 },
          reflectiveLearning: { count: 0, totalTime: 0 }
        },
        aiAssistantUsage: {
          askMode: { count: 0, totalTime: 0 },
          researchMode: { count: 0, totalTime: 0 },
          textToDocsMode: { count: 0, totalTime: 0 },
          totalInteractions: 0,
          totalPromptLength: 0
        },
        activityEngagement: {
          quizzesCompleted: 0,
          practiceQuestionsAttempted: 0,
          discussionParticipation: 0,
          reflectionJournalEntries: 0,
          visualDiagramsViewed: 0,
          handsOnLabsCompleted: 0,
          conceptExplorationsCount: 0,
          sequentialStepsCompleted: 0
        },
        lastAggregatedDate: new Date(),
        lastProcessedBehaviorId: null,
        totalInteractionsProcessed: 0
      };
    }
    
    // Aggregate all seeded interactions into profile
    const allBehaviors = await LearningBehavior.find({ userId });
    let totalInteractions = 0;
    
    // Reset aggregates
    Object.keys(profile.aggregatedStats.modeUsage).forEach(mode => {
      profile.aggregatedStats.modeUsage[mode] = { count: 0, totalTime: 0 };
    });
    
    // Recalculate from all behaviors
    allBehaviors.forEach(behavior => {
      Object.keys(behavior.modeUsage).forEach(mode => {
        if (profile.aggregatedStats.modeUsage[mode]) {
          profile.aggregatedStats.modeUsage[mode].count += behavior.modeUsage[mode].count;
          profile.aggregatedStats.modeUsage[mode].totalTime += behavior.modeUsage[mode].totalTime;
          totalInteractions += behavior.modeUsage[mode].count;
        }
      });
      
      if (behavior.aiAssistantUsage) {
        profile.aggregatedStats.aiAssistantUsage.totalInteractions += behavior.aiAssistantUsage.totalInteractions || 0;
        totalInteractions += behavior.aiAssistantUsage.totalInteractions || 0;
      }
    });
    
    profile.aggregatedStats.totalInteractionsProcessed = totalInteractions;
    profile.dataQuality.totalInteractions = totalInteractions;
    profile.dataQuality.sufficientForML = totalInteractions >= 10;
    profile.dataQuality.dataCompleteness = Math.min(100, (totalInteractions / 200) * 100);
    profile.dataQuality.lastDataUpdate = new Date();
    
    await profile.save();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.length} interactions`,
      data: {
        added: result.length,
        previousCount: existingCount,
        currentCount: newCount,
        totalInteractions,
        remainingToClassification: Math.max(0, 50 - totalInteractions),
        readyForClassification: totalInteractions >= 50
      }
    });

  } catch (error) {
    console.error('Error seeding interactions:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET endpoint to check current status
export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;

    await connectDB();

    const currentCount = await LearningBehavior.countDocuments({ userId });
    const seededCount = await LearningBehavior.countDocuments({ 
      userId, 
      'metadata.seeded': true 
    });

    // Get total interactions from profile (more accurate)
    const profile = await LearningStyleProfile.findOne({ userId });
    const totalInteractions = profile?.aggregatedStats?.totalInteractionsProcessed || 
                             profile?.dataQuality?.totalInteractions || 
                             await LearningBehavior.getTotalInteractions(userId);

    return NextResponse.json({
      success: true,
      data: {
        userId: userId.toString(),
        totalInteractions,
        seededInteractions: seededCount,
        realInteractions: currentCount - seededCount,
        remainingToClassification: Math.max(0, 50 - totalInteractions),
        readyForClassification: totalInteractions >= 50
      }
    });

  } catch (error) {
    console.error('Error checking interactions:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
