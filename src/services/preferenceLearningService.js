/**
 * User Preference Learning Service
 * Handles client-side preference learning and layout customization
 */

class PreferenceLearningService {
  constructor() {
    this.interactions = [];
    this.preferences = null;
    this.isLearning = false;
    this.lastAnalysis = null;
    this.analysisInterval = process.env.NODE_ENV === 'production' ? 30000 : 120000; // 30 seconds in production, 2 minutes in development
    this.maxInteractions = 1000; // Keep only recent interactions
  }

  /**
   * Initialize the preference learning service
   */
  async initialize() {
    try {
      await this.loadPreferences();
      this.startLearning();
    } catch (error) {
    }
  }

  /**
   * Load user preferences from the server
   */
  async loadPreferences() {
    try {
      const response = await fetch('/api/user/preferences', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        this.preferences = data.preferences;
        return this.preferences;
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Save preferences to the server
   */
  async savePreferences(preferences, manualOverride = false) {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          layoutPreferences: preferences,
          manualOverride
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.preferences = data.preferences;
        return this.preferences;
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Track a user interaction
   */
  trackInteraction(type, metadata = {}) {
    const interaction = {
      type,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        currentLayout: this.getCurrentLayout()
      }
    };

    this.interactions.push(interaction);

    // Keep only recent interactions
    if (this.interactions.length > this.maxInteractions) {
      this.interactions = this.interactions.slice(-this.maxInteractions);
    }

    // Update preferences with interaction
    if (this.preferences) {
      // If preferences is a plain object (from API), update it locally
      if (typeof this.preferences.updateFromInteraction !== 'function') {
        this.updatePreferencesFromInteraction(interaction);
      } else {
        // If it's a Mongoose model instance, use the instance method
        this.preferences.updateFromInteraction(interaction);
      }
    }

    return interaction;
  }

  /**
   * Get current layout information
   */
  getCurrentLayout() {
    // This would be implemented to detect current layout settings
    return {
      cardSize: 'medium',
      gridColumns: 'auto',
      compactMode: false,
      theme: 'auto'
    };
  }

  /**
   * Start the learning process
   */
  startLearning() {
    if (this.isLearning) return;

    this.isLearning = true;

    // Analyze behavior periodically
    this.analysisTimer = setInterval(() => {
      this.analyzeBehavior();
    }, this.analysisInterval);

    // Listen for layout changes
    this.observeLayoutChanges();

  }

  /**
   * Stop the learning process
   */
  stopLearning() {
    if (!this.isLearning) return;

    this.isLearning = false;

    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }

    // Remove event listeners
    this.cleanup();

  }

  /**
   * Analyze user behavior and generate recommendations
   */
  async analyzeBehavior() {
    if (this.interactions.length < 10) {
      // Need more data for meaningful analysis
      return;
    }

    try {
      const response = await fetch('/api/user/preferences/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          interactions: this.interactions.slice(-100), // Last 100 interactions
          currentLayout: this.getCurrentLayout(),
          timeContext: this.getTimeContext()
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.lastAnalysis = data;

        // Apply recommendations if confidence is high enough
        await this.applyRecommendations(data.recommendations);

        // Trigger preference update event
        this.notifyPreferenceUpdate(data.preferences);
      }
    } catch (error) {
    }
  }

  /**
   * Apply layout recommendations
   */
  async applyRecommendations(recommendations) {
    if (!this.preferences || !this.preferences.adaptiveSettings.autoAdjustLayout) {
      return;
    }

    const highConfidenceRecommendations = recommendations.filter(
      rec => rec.confidence >= this.preferences.adaptiveSettings.confidenceThreshold
    );

    for (const recommendation of highConfidenceRecommendations) {
      await this.applyRecommendation(recommendation);
    }
  }

  /**
   * Apply a single recommendation
   */
  async applyRecommendation(recommendation) {
    const oldPreferences = { ...this.preferences.layoutPreferences };

    switch (recommendation.type) {
      case 'card_size':
        this.preferences.layoutPreferences.cardSize = recommendation.value;
        break;
      case 'compact_mode':
        this.preferences.layoutPreferences.compactMode = recommendation.value;
        break;
      case 'layout':
        this.preferences.interactionPatterns.preferredViewMode = recommendation.value;
        break;
      case 'show_progress':
        this.preferences.layoutPreferences.showProgress = recommendation.value;
        break;
      case 'show_stats':
        this.preferences.layoutPreferences.showStats = recommendation.value;
        break;
    }

    // Save the updated preferences
    await this.savePreferences(this.preferences.layoutPreferences);

    // Record the adaptation
    this.recordAdaptation(recommendation, oldPreferences);

  }

  /**
   * Record an adaptation for learning
   */
  recordAdaptation(recommendation, oldPreferences) {
    if (!this.preferences) return;

    this.preferences.adaptiveSettings.adaptationHistory.push({
      timestamp: new Date(),
      trigger: 'behavior_analysis',
      oldSettings: oldPreferences,
      newSettings: { ...this.preferences.layoutPreferences },
      confidence: recommendation.confidence,
      userFeedback: null
    });
  }

  /**
   * Get time-based context
   */
  getTimeContext() {
    const now = new Date();
    const hour = now.getHours();

    return {
      hour,
      timeSlot: this.getTimeSlot(hour),
      dayOfWeek: now.getDay(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6
    };
  }

  /**
   * Get time slot from hour
   */
  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Observe layout changes
   */
  observeLayoutChanges() {
    // Listen for manual layout changes
    window.addEventListener('layoutChange', (event) => {
      this.handleLayoutChange(event.detail);
    });

    // Listen for user feedback
    window.addEventListener('preferenceFeedback', (event) => {
      this.handleUserFeedback(event.detail);
    });
  }

  /**
   * Handle manual layout changes
   */
  async handleLayoutChange(change) {
    if (!this.preferences) return;

    this.preferences.learningMetrics.manualOverrides += 1;

    // Record the manual change
    this.preferences.adaptiveSettings.adaptationHistory.push({
      timestamp: new Date(),
      trigger: 'manual_override',
      oldSettings: { ...this.preferences.layoutPreferences },
      newSettings: { ...this.preferences.layoutPreferences, ...change },
      confidence: 1.0,
      userFeedback: 'manual'
    });

    await this.savePreferences(change, true);
  }

  /**
   * Handle user feedback on adaptations
   */
  async handleUserFeedback(feedback) {
    if (!this.preferences || !this.lastAnalysis) return;

    // Update the last adaptation with user feedback
    const lastAdaptation = this.preferences.adaptiveSettings.adaptationHistory[
      this.preferences.adaptiveSettings.adaptationHistory.length - 1
    ];

    if (lastAdaptation) {
      lastAdaptation.userFeedback = feedback.type;

      // Adjust learning rate based on feedback
      if (feedback.type === 'negative') {
        this.preferences.adaptiveSettings.learningRate = Math.max(0.01,
          this.preferences.adaptiveSettings.learningRate * 0.9
        );
      } else if (feedback.type === 'positive') {
        this.preferences.adaptiveSettings.learningRate = Math.min(1.0,
          this.preferences.adaptiveSettings.learningRate * 1.1
        );
      }

      await this.preferences.save();
    }
  }

  /**
   * Get current preferences
   */
  getPreferences() {
    return this.preferences;
  }

  /**
   * Get learning statistics
   */
  getLearningStats() {
    if (!this.preferences) return null;

    return {
      totalInteractions: this.preferences.learningMetrics.totalInteractions,
      satisfactionScore: this.preferences.learningMetrics.satisfactionScore,
      learningProgress: this.preferences.learningMetrics.learningProgress,
      manualOverrides: this.preferences.learningMetrics.manualOverrides,
      adaptationsCount: this.preferences.adaptiveSettings.adaptationHistory.length,
      currentLearningRate: this.preferences.adaptiveSettings.learningRate
    };
  }

  /**
   * Notify about preference updates
   */
  notifyPreferenceUpdate(preferences) {
    window.dispatchEvent(new CustomEvent('preferencesUpdated', {
      detail: { preferences }
    }));
  }

  /**
   * Update preferences from interaction (for plain objects from API)
   */
  updatePreferencesFromInteraction(interaction) {
    if (!this.preferences) return;

    // Update learning metrics
    this.preferences.learningMetrics = this.preferences.learningMetrics || {};
    this.preferences.learningMetrics.totalInteractions = (this.preferences.learningMetrics.totalInteractions || 0) + 1;

    // Update feature usage
    this.preferences.featureUsage = this.preferences.featureUsage || {};
    switch (interaction.type) {
      case 'search':
        this.preferences.featureUsage.searchFrequency = (this.preferences.featureUsage.searchFrequency || 0) + 1;
        break;
      case 'filter':
        this.preferences.featureUsage.filterUsage = (this.preferences.featureUsage.filterUsage || 0) + 1;
        break;
      case 'sort':
        this.preferences.featureUsage.sortUsage = (this.preferences.featureUsage.sortUsage || 0) + 1;
        break;
      case 'preview':
        this.preferences.featureUsage.previewUsage = (this.preferences.featureUsage.previewUsage || 0) + 1;
        break;
      case 'drag_drop':
        this.preferences.featureUsage.dragDropUsage = (this.preferences.featureUsage.dragDropUsage || 0) + 1;
        break;
    }

    // Update interaction patterns
    this.preferences.interactionPatterns = this.preferences.interactionPatterns || {};
    this.preferences.interactionPatterns.frequentActions = this.preferences.interactionPatterns.frequentActions || [];

    const existingAction = this.preferences.interactionPatterns.frequentActions.find(
      a => a.action === interaction.type
    );

    if (existingAction) {
      existingAction.count += 1;
      existingAction.lastUsed = new Date();
    } else {
      this.preferences.interactionPatterns.frequentActions.push({
        action: interaction.type,
        count: 1,
        lastUsed: new Date()
      });
    }
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    window.removeEventListener('layoutChange', this.handleLayoutChange);
    window.removeEventListener('preferenceFeedback', this.handleUserFeedback);
  }
}

// Create singleton instance
const preferenceLearningService = new PreferenceLearningService();

export default preferenceLearningService;