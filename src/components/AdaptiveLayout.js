'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAdaptiveLayout } from '../context/AdaptiveLayoutContext';

const AdaptiveLayout = ({
  children,
  componentType = 'courses',
  trackInteractions = true,
  adaptiveMode = true
}) => {
  const {
    userBehavior,
    trackInteraction,
    updateLayoutPreference
  } = useAdaptiveLayout();

  const [layoutMetrics, setLayoutMetrics] = useState({
    viewportWidth: 0,
    viewportHeight: 0,
    interactionCount: 0,
    adaptationScore: 0
  });

  const containerRef = useRef(null);
  const interactionTimeoutRef = useRef(null);

  // Track viewport changes for responsive adaptations
  useEffect(() => {
    const updateViewportMetrics = () => {
      setLayoutMetrics(prev => ({
        ...prev,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }));
    };

    updateViewportMetrics();
    window.addEventListener('resize', updateViewportMetrics);

    return () => window.removeEventListener('resize', updateViewportMetrics);
  }, []);

  // Track user interactions with debouncing
  const handleInteraction = (interactionType, details = {}) => {
    if (!trackInteractions) return;

    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }

    // Debounce interaction tracking
    interactionTimeoutRef.current = setTimeout(() => {
      trackInteraction(interactionType, details);
      setLayoutMetrics(prev => ({
        ...prev,
        interactionCount: prev.interactionCount + 1
      }));
    }, 300);
  };

  // Apply adaptive layout styles based on user behavior
  const getAdaptiveStyles = () => {
    const { layoutPreferences } = userBehavior;
    const styles = {};

    // Card size adaptation
    switch (layoutPreferences.cardSize) {
      case 'small':
        styles['--card-min-height'] = '320px';
        styles['--card-padding'] = '1rem';
        break;
      case 'large':
        styles['--card-min-height'] = '480px';
        styles['--card-padding'] = '1.5rem';
        break;
      case 'adaptive':
        // Adapt based on viewport and behavior
        if (layoutMetrics.viewportWidth < 768) {
          styles['--card-min-height'] = '280px';
          styles['--card-padding'] = '0.75rem';
        } else if (userBehavior.interactionPatterns.mostClickedCourses.length > 5) {
          styles['--card-min-height'] = '420px';
          styles['--card-padding'] = '1.25rem';
        } else {
          styles['--card-min-height'] = '360px';
          styles['--card-padding'] = '1rem';
        }
        break;
      default: // medium
        styles['--card-min-height'] = '380px';
        styles['--card-padding'] = '1rem';
    }

    // Grid columns adaptation
    if (layoutPreferences.gridColumns !== 'auto') {
      styles['--grid-columns'] = layoutPreferences.gridColumns;
    } else {
      // Auto-adapt based on viewport and behavior
      if (layoutMetrics.viewportWidth < 640) {
        styles['--grid-columns'] = '1';
      } else if (layoutMetrics.viewportWidth < 1024) {
        styles['--grid-columns'] = userBehavior.interactionPatterns.compactMode ? '2' : 'auto';
      } else {
        styles['--grid-columns'] = userBehavior.interactionPatterns.compactMode ? '3' : 'auto';
      }
    }

    // Compact mode adaptations
    if (layoutPreferences.compactMode) {
      styles['--grid-gap'] = '0.75rem';
      styles['--header-height'] = '3rem';
      styles['--font-scale'] = '0.9';
    } else {
      styles['--grid-gap'] = '1.5rem';
      styles['--header-height'] = '4rem';
      styles['--font-scale'] = '1';
    }

    return styles;
  };

  // Get adaptive layout className
  const getAdaptiveClassName = () => {
    const { layoutPreferences } = userBehavior;
    const classes = ['adaptive-layout'];

    if (layoutPreferences.compactMode) {
      classes.push('adaptive-layout--compact');
    }

    if (layoutPreferences.cardSize === 'large') {
      classes.push('adaptive-layout--large-cards');
    } else if (layoutPreferences.cardSize === 'small') {
      classes.push('adaptive-layout--small-cards');
    }

    if (layoutPreferences.showProgress) {
      classes.push('adaptive-layout--show-progress');
    }

    if (layoutPreferences.showThumbnails) {
      classes.push('adaptive-layout--show-thumbnails');
    }

    return classes.join(' ');
  };

  // Add interaction tracking to children
  const addInteractionTracking = (childElement) => {
    if (!trackInteractions || !childElement) return childElement;

    // Clone the element to add tracking props
    return React.cloneElement(childElement, {
      onClick: (e) => {
        // Call original onClick if it exists
        if (childElement.props.onClick) {
          childElement.props.onClick(e);
        }

        // Track interaction based on element type
        const target = e.target;
        if (target.closest('[data-course-id]')) {
          const courseElement = target.closest('[data-course-id]');
          const courseId = courseElement.dataset.courseId;
          const courseName = courseElement.dataset.courseName || courseElement.dataset.courseTitle ||
                            courseElement.dataset.courseSubject || courseElement.dataset.courseSubject ||
                            'Unknown Course';
          handleInteraction('course_click', {
            courseId,
            courseName,
            courseTitle: courseName,
            courseSubject: courseName
          });
        } else if (target.closest('[data-action]')) {
          const action = target.closest('[data-action]').dataset.action;
          handleInteraction('action_performed', { action });
        } else if (target.closest('[data-feature]')) {
          const feature = target.closest('[data-feature]').dataset.feature;
          handleInteraction('feature_usage', { feature });
        }
      },
      onMouseEnter: (e) => {
        if (childElement.props.onMouseEnter) {
          childElement.props.onMouseEnter(e);
        }

        // Track hover interactions
        const target = e.target;
        if (target.closest('[data-track-hover]')) {
          const hoverTarget = target.closest('[data-track-hover]').dataset.trackHover;
          handleInteraction('hover_interaction', { target: hoverTarget });
        }
      }
    });
  };

  // Wrap children with interaction tracking and adaptive wrapper
  const childrenWithTracking = React.Children.map(children, addInteractionTracking);

  const adaptiveStyles = getAdaptiveStyles();
  const adaptiveClassName = getAdaptiveClassName();

  return (
    <div className="adaptive-layout-container">
      <div
        ref={containerRef}
        className={adaptiveClassName}
        style={adaptiveStyles}
        data-adaptive-mode={adaptiveMode}
        data-layout-preferences={JSON.stringify(userBehavior.layoutPreferences)}
      >
        {childrenWithTracking}
      </div>
    </div>
  );
};

// Adaptive layout CSS-in-JS styles
const adaptiveLayoutStyles = `
  .adaptive-layout {
    --card-min-height: 380px;
    --card-padding: 1rem;
    --grid-columns: auto;
    --grid-gap: 1.5rem;
    --header-height: 4rem;
    --font-scale: 1;

    min-height: 100vh;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .adaptive-layout--compact {
    --grid-gap: 0.75rem;
    --header-height: 3rem;
    --font-scale: 0.9;
  }

  .adaptive-layout--large-cards {
    --card-min-height: 480px;
    --card-padding: 1.5rem;
  }

  .adaptive-layout--small-cards {
    --card-min-height: 320px;
    --card-padding: 0.75rem;
  }

  .adaptive-layout--show-progress .course-progress {
    opacity: 1;
    transform: scaleY(1);
  }

  .adaptive-layout--show-thumbnails .course-thumbnail {
    opacity: 1;
    transform: scale(1);
  }

  /* Responsive grid adaptation */
  .adaptive-layout-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  @media (max-width: 640px) {
    .adaptive-layout {
      --grid-columns: 1;
      --grid-gap: 0.75rem;
    }
  }

  @media (min-width: 641px) and (max-width: 1024px) {
    .adaptive-layout {
      --grid-columns: var(--grid-columns, 2);
    }
  }

  @media (min-width: 1025px) {
    .adaptive-layout {
      --grid-columns: var(--grid-columns, 3);
    }
  }

  /* Smooth transitions for layout changes */
  .adaptive-layout * {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Adaptive card sizing */
  .adaptive-layout .course-card {
    min-height: var(--card-min-height);
    padding: var(--card-padding);
    font-size: calc(0.875rem * var(--font-scale));
  }

  .adaptive-layout .course-card h3 {
    font-size: calc(1.125rem * var(--font-scale));
  }

  .adaptive-layout .course-card .progress-text {
    font-size: calc(0.75rem * var(--font-scale));
  }

  /* Adaptive grid */
  .adaptive-layout .courses-grid {
    display: grid;
    grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
    gap: var(--grid-gap);
    width: 100%;
  }

  /* Adaptive header */
  .adaptive-layout .page-header {
    min-height: var(--header-height);
    padding: calc(var(--header-height) / 4) 0;
  }

  /* Adaptive spacing */
  .adaptive-layout .section-spacing {
    margin: calc(var(--grid-gap) * 1.5) 0;
  }

  .adaptive-layout .element-spacing {
    margin: calc(var(--grid-gap) * 0.5) 0;
  }

  /* Adaptive animations */
  @keyframes adaptive-layout-change {
    0% {
      opacity: 0.8;
      transform: scale(0.98);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .adaptive-layout-container[data-adaptive-mode="true"] .adaptive-layout {
    animation: adaptive-layout-change 0.3s ease-out;
  }

  /* Adaptive loading states */
  .adaptive-layout.skeleton {
    opacity: 0.7;
  }

  .adaptive-layout.skeleton .skeleton-card {
    animation-duration: 1.5s;
  }

  /* Adaptive focus states */
  .adaptive-layout *:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Adaptive hover states */
  .adaptive-layout .course-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  .adaptive-layout--compact .course-card:hover {
    transform: translateY(-2px) scale(1.01);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = adaptiveLayoutStyles;
  document.head.appendChild(styleSheet);
}

export default AdaptiveLayout;