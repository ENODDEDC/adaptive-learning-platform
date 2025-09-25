'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const Tooltip = ({
  content,
  children,
  type = 'info',
  position = 'top',
  delay = 300,
  className = '',
  showIcon = true,
  persistent = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const getIcon = () => {
    switch (type) {
      case 'help':
        return <QuestionMarkCircleIcon className="w-4 h-4" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'success':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'tip':
        return <LightBulbIcon className="w-4 h-4" />;
      default:
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getTooltipStyles = () => {
    const baseStyles = 'absolute z-50 px-3 py-2 text-xs font-medium rounded-lg shadow-lg transition-all duration-200 ease-out max-w-xs pointer-events-none';

    const typeStyles = {
      info: 'bg-blue-600 text-white',
      help: 'bg-gray-600 text-white',
      warning: 'bg-yellow-600 text-white',
      success: 'bg-green-600 text-white',
      tip: 'bg-purple-600 text-white'
    };

    const positionStyles = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    return `${baseStyles} ${typeStyles[type]} ${positionStyles[position]} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`;
  };

  const getArrowStyles = () => {
    const baseArrow = 'absolute w-2 h-2 transform rotate-45';

    const arrowPositions = {
      top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1',
      left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1',
      right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1'
    };

    const typeArrowColors = {
      info: 'bg-blue-600',
      help: 'bg-gray-600',
      warning: 'bg-yellow-600',
      success: 'bg-green-600',
      tip: 'bg-purple-600'
    };

    return `${baseArrow} ${arrowPositions[position]} ${typeArrowColors[type]}`;
  };

  useEffect(() => {
    if (persistent) {
      setIsVisible(true);
      return;
    }

    if (isHovered) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, persistent, delay]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    if (persistent) {
      setIsVisible(!isVisible);
    }
  };


  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children || (
        <button
          type="button"
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
            type === 'help'
              ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              : type === 'warning'
              ? 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100'
              : type === 'success'
              ? 'text-green-400 hover:text-green-600 hover:bg-green-100'
              : type === 'tip'
              ? 'text-purple-400 hover:text-purple-600 hover:bg-purple-100'
              : 'text-blue-400 hover:text-blue-600 hover:bg-blue-100'
          }`}
          aria-label={`${type} tooltip`}
        >
          {showIcon && getIcon()}
        </button>
      )}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={getTooltipStyles()}
          role="tooltip"
        >
          <div className="relative">
            {content}
            <div className={getArrowStyles()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;