/**
 * Debug Panel for Cold Start Interest Tracking
 * Shows real-time interest metrics for development/testing
 */

import React from 'react';

const ColdStartDebugPanel = ({ 
  interestData, 
  currentMode, 
  shouldShowOverlay, 
  overlayTriggeredFor,
  getCurrentModeData 
}) => {
  const currentData = getCurrentModeData();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-[10000]">
      <h3 className="font-bold mb-2">🧠 Interest Tracking Debug</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Current Mode:</strong> {currentMode || 'None'}
        </div>
        
        <div>
          <strong>Overlay Status:</strong> {shouldShowOverlay ? '✅ Active' : '❌ Inactive'}
        </div>
        
        <div>
          <strong>Triggered For:</strong> {overlayTriggeredFor || 'None'}
        </div>

        {currentData && (
          <div className="border-t border-gray-600 pt-2 mt-2">
            <div><strong>Interest Score:</strong> {(currentData.interestScore || 0).toFixed(3)}</div>
            <div><strong>Total Time:</strong> {Math.round(currentData.totalTime / 1000)}s</div>
            <div><strong>Visits:</strong> {currentData.visits}</div>
            <div><strong>Max Scroll:</strong> {currentData.maxScrollDepth}%</div>
            <div><strong>Text Selections:</strong> {currentData.textSelections}</div>
            <div><strong>Mouse Hover:</strong> {Math.round(currentData.mouseHoverTime / 1000)}s</div>
          </div>
        )}

        <div className="text-xs opacity-75 mt-2">
          Threshold: 0.7 for overlay trigger
        </div>
      </div>
    </div>
  );
};

export default ColdStartDebugPanel;