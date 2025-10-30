# ML FSLSM Architecture - Visual Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STUDENT LAYER                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ AI Narrator│  │   Visual   │  │ Sequential │  │   Global   │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Hands-On   │  │  Concept   │  │   Active   │  │ Reflective │   │
│  │    Lab     │  │Constellation│  │  Learning  │  │  Learning  │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (tracks usage)
┌─────────────────────────────────────────────────────────────────────┐
│                    BEHAVIOR TRACKING LAYER                           │
│  learningBehaviorTracker.js                                         │
│  • Mode usage time  • Content interactions  • Activity engagement   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (sends data)
┌─────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API LAYER                               │
│  POST /api/learning-behavior/track                                  │
│  POST /api/learning-style/classify                                  │
│  GET  /api/learning-style/profile                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (stores/retrieves)
┌─────────────────────────────────────────────────────────────────────┐
│                       MONGODB DATABASE                               │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ LearningBehavior │  │LearningStyleProfile│                       │
│  │  (raw data)      │  │  (predictions)    │                        │
│  └──────────────────┘  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘

                              ↓ (calculates features)
┌─────────────────────────────────────────────────────────────────────┐
│                  FEATURE ENGINEERING SERVICE                         │
│  featureEngineeringService.js                                       │
│  • Active/Reflective score  • Sensing/Intuitive score              │
│  • Visual/Verbal score      • Sequential/Global score              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (sends features)
┌─────────────────────────────────────────────────────────────────────┐
│                    ML SERVICE (Python)                               │
│  Flask/FastAPI Server                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  XGBoost Model                                                │  │
│  │  • Active/Reflective classifier                               │  │
│  │  • Sensing/Intuitive classifier                               │  │
│  │  • Visual/Verbal classifier                                   │  │
│  │  • Sequential/Global classifier                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (returns predictions)
┌─────────────────────────────────────────────────────────────────────┐
│                  RECOMMENDATION ENGINE                               │
│  learningStyleClassificationService.js                              │
│  • Generates personalized mode recommendations                      │
│  • Ranks by relevance  • Provides explanations                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (displays)
┌─────────────────────────────────────────────────────────────────────┐
│                         UI COMPONENTS                                │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ LearningStyle        │  │ Personalized         │               │
│  │ Dashboard            │  │ Recommendations      │               │
│  └──────────────────────┘  └──────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## FSLSM Dimension Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FSLSM DIMENSION 1                                 │
│                  ACTIVE ←──────────→ REFLECTIVE                      │
│                                                                       │
│  Active Learning Hub              Reflective Learning                │
│  • Group discussions              • Individual contemplation         │
│  • Immediate practice             • Deep analysis                    │
│  • Hands-on activities            • Journal entries                  │
│                                                                       │
│  Score: -11 (Very Reflective) to +11 (Very Active)                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FSLSM DIMENSION 2                                 │
│                 SENSING ←──────────→ INTUITIVE                       │
│                                                                       │
│  Hands-On Lab                     Concept Constellation              │
│  • Practical exercises            • Pattern discovery                │
│  • Concrete examples              • Abstract concepts                │
│  • Real-world scenarios           • Theoretical frameworks           │
│                                                                       │
│  Score: -11 (Very Intuitive) to +11 (Very Sensing)                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FSLSM DIMENSION 3                                 │
│                  VISUAL ←──────────→ VERBAL                          │
│                                                                       │
│  Visual Learning                  AI Narrator                        │
│  • Diagrams & charts              • Audio narration                  │
│  • Infographics                   • Text explanations                │
│  • Mind maps                      • Written content                  │
│                                                                       │
│  Score: -11 (Very Verbal) to +11 (Very Visual)                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FSLSM DIMENSION 4                                 │
│               SEQUENTIAL ←──────────→ GLOBAL                         │
│                                                                       │
│  Sequential Learning              Global Learning                    │
│  • Step-by-step                   • Big picture overview             │
│  • Linear progression             • Context mapping                  │
│  • Ordered modules                • Holistic view                    │
│                                                                       │
│  Score: -11 (Very Global) to +11 (Very Sequential)                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
1. STUDENT INTERACTION
   ↓
   Student opens "Active Learning Hub"
   Spends 15 minutes
   Participates in 3 discussions
   Completes 2 practice questions

2. BEHAVIOR TRACKING
   ↓
   learningBehaviorTracker.js captures:
   {
     mode: "activeLearning",
     duration: 900000,
     discussions: 3,
     practiceQuestions: 2,
     timestamp: "2025-10-28T10:30:00Z"
   }

3. DATA STORAGE
   ↓
   POST /api/learning-behavior/track
   Stored in MongoDB LearningBehavior collection

4. FEATURE CALCULATION (after 10+ interactions)
   ↓
   featureEngineeringService.js calculates:
   {
     activeLearningUsageRatio: 0.35,
     discussionParticipationRate: 0.8,
     reflectionJournalFrequency: 0.1,
     ...16 more features
   }

5. ML PREDICTION
   ↓
   POST to ML Service: /predict
   XGBoost returns:
   {
     dimensions: {
       activeReflective: 7.5,
       sensingIntuitive: 2.3,
       visualVerbal: -4.2,
       sequentialGlobal: 5.1
     },
     confidence: {
       activeReflective: 0.85,
       sensingIntuitive: 0.62,
       visualVerbal: 0.78,
       sequentialGlobal: 0.71
     }
   }

6. RECOMMENDATION GENERATION
   ↓
   learningStyleClassificationService.js generates:
   [
     {
       mode: "Active Learning Hub",
       priority: 1,
       reason: "You learn best through hands-on activities",
       confidence: 0.85
     },
     {
       mode: "Sequential Learning",
       priority: 2,
       reason: "You prefer step-by-step progression",
       confidence: 0.71
     },
     {
       mode: "AI Narrator",
       priority: 3,
       reason: "You benefit from verbal explanations",
       confidence: 0.78
     }
   ]

7. UI DISPLAY
   ↓
   Student sees:
   • Learning Style Profile dashboard
   • "Recommended for You" badges on modes
   • Personalized explanations
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│  LearningBehavior Collection                                        │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                   │
│    userId: ObjectId,                                                 │
│    sessionId: String,                                                │
│    modeUsage: {                                                      │
│      aiNarrator: { count, totalTime, lastUsed },                    │
│      visualLearning: { count, totalTime, lastUsed },                │
│      sequentialLearning: { count, totalTime, lastUsed },            │
│      globalLearning: { count, totalTime, lastUsed },                │
│      sensingLearning: { count, totalTime, lastUsed },               │
│      intuitiveLearning: { count, totalTime, lastUsed },             │
│      activeLearning: { count, totalTime, lastUsed },                │
│      reflectiveLearning: { count, totalTime, lastUsed }             │
│    },                                                                │
│    contentInteractions: [{                                           │
│      contentId, contentType, viewDuration,                          │
│      completionRate, replayCount, scrollDepth                       │
│    }],                                                               │
│    activityEngagement: {                                             │
│      quizzesCompleted, practiceQuestionsAttempted,                  │
│      discussionParticipation, reflectionJournalEntries              │
│    },                                                                │
│    features: {                                                       │
│      activeScore, reflectiveScore,                                  │
│      sensingScore, intuitiveScore,                                  │
│      visualScore, verbalScore,                                      │
│      sequentialScore, globalScore                                   │
│    },                                                                │
│    timestamp: Date                                                   │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  LearningStyleProfile Collection                                    │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                   │
│    userId: ObjectId,                                                 │
│    dimensions: {                                                     │
│      activeReflective: Number (-11 to +11),                         │
│      sensingIntuitive: Number (-11 to +11),                         │
│      visualVerbal: Number (-11 to +11),                             │
│      sequentialGlobal: Number (-11 to +11)                          │
│    },                                                                │
│    confidence: {                                                     │
│      activeReflective: Number (0-1),                                │
│      sensingIntuitive: Number (0-1),                                │
│      visualVerbal: Number (0-1),                                    │
│      sequentialGlobal: Number (0-1)                                 │
│    },                                                                │
│    recommendedModes: [{                                              │
│      mode: String,                                                   │
│      priority: Number (1-8),                                         │
│      reason: String,                                                 │
│      confidence: Number (0-1)                                        │
│    }],                                                               │
│    classificationMethod: String,                                     │
│    modelVersion: String,                                             │
│    lastPrediction: Date,                                             │
│    userFeedback: [{                                                  │
│      recommendedMode, accepted, rating, timestamp                   │
│    }]                                                                │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## ML Service Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ML SERVICE (Python)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Flask/FastAPI Application (app.py)                         │   │
│  │                                                              │   │
│  │  Endpoints:                                                  │   │
│  │  • POST /predict - Get learning style predictions           │   │
│  │  • GET  /health  - Health check                             │   │
│  │  • POST /retrain - Trigger model retraining (admin)         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  XGBoost Models (models/)                                   │   │
│  │                                                              │   │
│  │  • xgboost_active_reflective.pkl                            │   │
│  │  • xgboost_sensing_intuitive.pkl                            │   │
│  │  • xgboost_visual_verbal.pkl                                │   │
│  │  • xgboost_sequential_global.pkl                            │   │
│  │  • feature_scaler.pkl                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Training Pipeline (training/)                              │   │
│  │                                                              │   │
│  │  • train_model.py - Model training script                   │   │
│  │  • feature_engineering.py - Feature calculation             │   │
│  │  • evaluate_model.py - Model evaluation                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Training Data (data/)                                      │   │
│  │                                                              │   │
│  │  • training_data.csv - Labeled training samples             │   │
│  │  • validation_data.csv - Validation set                     │   │
│  │  • test_data.csv - Test set                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Feature Engineering Pipeline

```
RAW BEHAVIOR DATA
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  FEATURE EXTRACTION                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Active/Reflective Features:                                         │
│  • activeLearningUsageRatio = activeTime / totalTime                │
│  • reflectiveLearningUsageRatio = reflectiveTime / totalTime        │
│  • discussionParticipationRate = discussions / totalDiscussions     │
│  • reflectionJournalFrequency = journals / totalSessions            │
│                                                                       │
│  Sensing/Intuitive Features:                                         │
│  • sensingLearningUsageRatio = sensingTime / totalTime              │
│  • intuitiveLearningUsageRatio = intuitiveTime / totalTime          │
│  • practicalContentPreference = practicalViews / totalViews         │
│  • theoreticalContentPreference = theoreticalViews / totalViews     │
│                                                                       │
│  Visual/Verbal Features:                                             │
│  • visualLearningUsageRatio = visualTime / totalTime                │
│  • aiNarratorUsageRatio = narratorTime / totalTime                  │
│  • diagramViewFrequency = diagramViews / contentViews               │
│  • audioNarrationUsage = audioPlays / totalContent                  │
│                                                                       │
│  Sequential/Global Features:                                         │
│  • sequentialLearningUsageRatio = sequentialTime / totalTime        │
│  • globalLearningUsageRatio = globalTime / totalTime                │
│  • stepByStepCompletion = stepsCompleted / totalSteps               │
│  • overviewFirstBehavior = overviewViews / totalSessions            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
    ↓
FEATURE VECTOR: [0.35, 0.8, 0.1, 0.05, 0.25, 0.15, ...]
    ↓
STANDARDIZATION (StandardScaler)
    ↓
SCALED FEATURES: [0.42, 1.23, -0.87, -1.05, 0.15, -0.32, ...]
    ↓
XGBOOST MODEL
    ↓
PREDICTIONS: {
  activeReflective: 7.5,
  sensingIntuitive: 2.3,
  visualVerbal: -4.2,
  sequentialGlobal: 5.1
}
```

---

**These diagrams provide a visual understanding of how the ML FSLSM system works end-to-end.**
