'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';

const PresentationViewer = ({ htmlContent, title, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [slideThumbnails, setSlideThumbnails] = useState([]);
  const [showThumbnails, setShowThumbnails] = useState(false);
  
  const containerRef = useRef(null);
  const slideRefs = useRef([]);
  const playIntervalRef = useRef(null);

  useEffect(() => {
    if (htmlContent) {
      processPresentationContent();
    }
  }, [htmlContent]);

  useEffect(() => {
    // Auto-play functionality
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        nextSlide();
      }, 5000); // 5 seconds per slide
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentSlide]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        previousSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isFullscreen) {
          exitFullscreen();
        } else if (onClose) {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, isFullscreen, isPlaying]);

  const processPresentationContent = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const presentationContainer = tempDiv.querySelector('.presentation-container');
    if (presentationContainer) {
      const slides = presentationContainer.querySelectorAll('.slide');
      setTotalSlides(slides.length);
      
      // Generate thumbnails
      const thumbnails = Array.from(slides).map((slide, index) => ({
        index: index + 1,
        content: slide.innerHTML.substring(0, 200) + '...', // Preview text
        title: slide.querySelector('h1, h2, h3')?.textContent || `Slide ${index + 1}`
      }));
      setSlideThumbnails(thumbnails);
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(prev + 1, totalSlides));
  };

  const previousSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 1));
  };

  const goToSlide = (slideNumber) => {
    setCurrentSlide(Math.max(1, Math.min(slideNumber, totalSlides)));
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current?.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current?.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setIsFullscreen(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getCurrentSlideContent = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const slides = tempDiv.querySelectorAll('.slide');
    return slides[currentSlide - 1]?.innerHTML || '';
  };

  const renderSlide = () => {
    const slideContent = getCurrentSlideContent();
    return (
      <div 
        className="slide-content"
        dangerouslySetInnerHTML={{ __html: slideContent }}
      />
    );
  };

  const renderControls = () => (
    <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
      <div className="flex items-center gap-4">
        <button
          onClick={previousSlide}
          disabled={currentSlide === 1}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <span className="text-sm font-medium">
          {currentSlide} / {totalSlides}
        </span>
        
        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
        >
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>
        
        <button
          onClick={toggleMute}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
        >
          {isMuted ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
        >
          {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  const renderThumbnails = () => (
    <div className="absolute left-0 top-0 h-full w-64 bg-gray-800 text-white overflow-y-auto z-10">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Slides</h3>
        <div className="space-y-2">
          {slideThumbnails.map((thumbnail, index) => (
            <button
              key={index}
              onClick={() => goToSlide(thumbnail.index)}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                thumbnail.index === currentSlide 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="text-sm font-medium mb-1">{thumbnail.title}</div>
              <div className="text-xs text-gray-300 line-clamp-2">
                {thumbnail.content}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="w-full bg-gray-200 h-1">
      <div 
        className="bg-blue-600 h-1 transition-all duration-300"
        style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
      />
    </div>
  );

  if (!htmlContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-white ${isFullscreen ? 'h-screen w-screen' : 'h-[75vh] w-full'} flex flex-col`}
    >
      {renderProgressBar()}
      
      <div className="flex-1 relative overflow-hidden">
        {/* Main slide area */}
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            {renderSlide()}
          </div>
        </div>
        
        {/* Thumbnails sidebar */}
        {showThumbnails && renderThumbnails()}
      </div>
      
      {renderControls()}
      
      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-20 right-4 text-xs text-gray-500 bg-black bg-opacity-50 text-white p-2 rounded">
        <div>← → Navigate | Space Play/Pause | F Fullscreen | Esc Exit</div>
      </div>
    </div>
  );
};

export default PresentationViewer;
