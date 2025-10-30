/**
 * Learning Behavior Tracker
 * Client-side utility for tracking student interactions with learning modes
 * Implements FSLSM-based behavior tracking for ML classification
 */

class LearningBehaviorTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.currentMode = null;
    this.modeStartTime = null;
    this.contentStartTime = null;
    this.currentContentId = null;
    this.behaviorData = this.initializeBehaviorData();
    this.batchQueue = [];
    this.batchInterval = null;
    this.BATCH_SIZE = 5;
    this.BATCH_TIMEOUT = 30000; // 30 seconds
    
    // Start batch processing
    this.startBatchProcessing();
    
    // Track page visibility for accurate time tracking
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.currentMode) {
          this.trackModeEnd(this.currentMode);
        }
      });
    }
  }
  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Initialize behavior data structure
   */
  initializeBehaviorData() {
    return {
      sessionId: this.sessionId,
      modeUsage: {
        aiNarrator: { count: 0, totalTime: 0, lastUsed: null },
        visualLearning: { count: 0, totalTime: 0, lastUsed: null },
        sequentialLearning: { count: 0, totalTime: 0, lastUsed: null },
        globalLearning: { count: 0, totalTime: 0, lastUsed: null },
        sensingLearning: { count: 0, totalTime: 0, lastUsed: null },
        intuitiveLearning: { count: 0, totalTime: 0, lastUsed: null },
        activeLearning: { count: 0, totalTime: 0, lastUsed: null },
        reflectiveLearning: { count: 0, totalTime: 0, lastUsed: null }
      },
      contentInteractions: [],
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
      deviceInfo: this.getDeviceInfo()
    };
  }
  
  /**
   * Get device information
   */
  getDeviceInfo() {
    if (typeof window === 'undefined') return {};
    
    return {
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
  
  /**
   * Track learning mode start
   */
  trackModeStart(modeName) {
    // End previous mode if exists
    if (this.currentMode) {
      this.trackModeEnd(this.currentMode);
    }
    
    this.currentMode = modeName;
    this.modeStartTime = Date.now();
    
    // Increment count
    if (this.behaviorData.modeUsage[modeName]) {
      this.behaviorData.modeUsage[modeName].count += 1;
      this.behaviorData.modeUsage[modeName].lastUsed = new Date();
    }
    
    console.log(`📊 Tracking started: ${modeName}`);
  }
  
  /**
   * Track learning mode end
   */
  trackModeEnd(modeName) {
    if (!this.modeStartTime || this.currentMode !== modeName) return;
    
    const duration = Date.now() - this.modeStartTime;
    
    // Update total time
    if (this.behaviorData.modeUsage[modeName]) {
      this.behaviorData.modeUsage[modeName].totalTime += duration;
    }
    
    // Add to batch queue
    this.addToBatch({
      type: 'mode_usage',
      mode: modeName,
      duration,
      timestamp: new Date()
    });
    
    console.log(`📊 Tracking ended: ${modeName} (${(duration / 1000).toFixed(1)}s)`);
    
    this.currentMode = null;
    this.modeStartTime = null;
  }
  
  /**
   * Track content view start
   */
  trackContentView(contentId, contentType) {
    this.currentContentId = contentId;
    this.contentStartTime = Date.now();
    
    console.log(`📄 Content view started: ${contentType}`);
  }
  
  /**
   * Track content view end
   */
  trackContentViewEnd(completionRate = 0) {
    if (!this.contentStartTime || !this.currentContentId) return;
    
    const viewDuration = Date.now() - this.contentStartTime;
    
    const interaction = {
      contentId: this.currentContentId,
      viewDuration,
      completionRate,
      timestamp: new Date()
    };
    
    this.behaviorData.contentInteractions.push(interaction);
    
    this.addToBatch({
      type: 'content_interaction',
      ...interaction
    });
    
    console.log(`📄 Content view ended: ${(viewDuration / 1000).toFixed(1)}s, ${completionRate}% complete`);
    
    this.currentContentId = null;
    this.contentStartTime = null;
  }
  
  /**
   * Track content scroll depth
   */
  trackContentScroll(scrollDepth) {
    if (!this.currentContentId) return;
    
    this.addToBatch({
      type: 'content_scroll',
      contentId: this.currentContentId,
      scrollDepth,
      timestamp: new Date()
    });
  }
  
  /**
   * Track quiz completion
   */
  trackQuizCompletion(quizData) {
    this.behaviorData.activityEngagement.quizzesCompleted += 1;
    
    this.addToBatch({
      type: 'quiz_completed',
      ...quizData,
      timestamp: new Date()
    });
    
    console.log('✅ Quiz completed');
  }
  
  /**
   * Track practice question attempt
   */
  trackPracticeQuestion() {
    this.behaviorData.activityEngagement.practiceQuestionsAttempted += 1;
    
    this.addToBatch({
      type: 'practice_question',
      timestamp: new Date()
    });
  }
  
  /**
   * Track discussion participation
   */
  trackDiscussionParticipation() {
    this.behaviorData.activityEngagement.discussionParticipation += 1;
    
    this.addToBatch({
      type: 'discussion_participation',
      timestamp: new Date()
    });
    
    console.log('💬 Discussion participation tracked');
  }
  
  /**
   * Track reflection journal entry
   */
  trackReflectionEntry() {
    this.behaviorData.activityEngagement.reflectionJournalEntries += 1;
    
    this.addToBatch({
      type: 'reflection_entry',
      timestamp: new Date()
    });
    
    console.log('📝 Reflection entry tracked');
  }
  
  /**
   * Track visual diagram view
   */
  trackVisualDiagramView() {
    this.behaviorData.activityEngagement.visualDiagramsViewed += 1;
    
    this.addToBatch({
      type: 'visual_diagram_view',
      timestamp: new Date()
    });
  }
  
  /**
   * Track hands-on lab completion
   */
  trackHandsOnLabCompletion() {
    this.behaviorData.activityEngagement.handsOnLabsCompleted += 1;
    
    this.addToBatch({
      type: 'hands_on_lab_completed',
      timestamp: new Date()
    });
    
    console.log('🔬 Hands-on lab completed');
  }
  
  /**
   * Track concept exploration
   */
  trackConceptExploration() {
    this.behaviorData.activityEngagement.conceptExplorationsCount += 1;
    
    this.addToBatch({
      type: 'concept_exploration',
      timestamp: new Date()
    });
  }
  
  /**
   * Track sequential step completion
   */
  trackSequentialStepCompletion() {
    this.behaviorData.activityEngagement.sequentialStepsCompleted += 1;
    
    this.addToBatch({
      type: 'sequential_step_completed',
      timestamp: new Date()
    });
  }
  
  /**
   * Add event to batch queue
   */
  addToBatch(event) {
    this.batchQueue.push(event);
    
    // Send immediately if batch is full
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.sendBatch();
    }
  }
  
  /**
   * Start batch processing interval
   */
  startBatchProcessing() {
    this.batchInterval = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.sendBatch();
      }
    }, this.BATCH_TIMEOUT);
  }
  
  /**
   * Send batch of events to backend
   */
  async sendBatch() {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    try {
      const response = await fetch('/api/learning-behavior/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: batch,
          behaviorData: this.behaviorData
        })
      });
      
      if (!response.ok) {
        console.error('Failed to send behavior data:', response.statusText);
        // Re-queue failed events
        this.batchQueue.unshift(...batch);
      } else {
        console.log(`📤 Sent ${batch.length} behavior events`);
      }
    } catch (error) {
      console.error('Error sending behavior data:', error);
      // Re-queue failed events
      this.batchQueue.unshift(...batch);
    }
  }
  
  /**
   * Force send all pending data
   */
  async flush() {
    // End current mode if active
    if (this.currentMode) {
      this.trackModeEnd(this.currentMode);
    }
    
    // Send all pending batches
    await this.sendBatch();
  }
  
  /**
   * Clean up
   */
  destroy() {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    this.flush();
  }
}

// Create singleton instance
let trackerInstance = null;

export function getLearningBehaviorTracker() {
  if (typeof window === 'undefined') return null;
  
  if (!trackerInstance) {
    trackerInstance = new LearningBehaviorTracker();
  }
  
  return trackerInstance;
}

/**
 * Simple tracking function for component use
 * @param {string} eventType - Type of event (e.g., 'mode_activated', 'tab_switched')
 * @param {object} data - Event data
 */
export function trackBehavior(eventType, data = {}) {
  if (typeof window === 'undefined') return;
  
  const tracker = getLearningBehaviorTracker();
  if (!tracker) return;
  
  // Add event to batch queue with type and data
  tracker.addToBatch({
    type: eventType,
    ...data,
    timestamp: new Date()
  });
  
  console.log(`[LearningTracker] ${eventType}:`, data);
}

export default LearningBehaviorTracker;
