# Document Viewer Tour Integration Guide

## Overview
The DocumentViewerTour component has been created and is ready for integration. This guide explains how to add it to your document viewer.

## Files Created
- ✅ `src/components/DocumentViewerTour.js` - Tour component with 9 steps

## Integration Steps

### Step 1: Add data-tour attributes to learning mode buttons

Find where your 8 learning mode buttons are rendered (they appear at the top of the document viewer in your screenshot). Add the following `data-tour` attributes to each button:

```javascript
// Wrap all 8 buttons in a container
<div data-tour="learning-modes" className="flex gap-2">
  
  <button data-tour="ai-narrator" onClick={handleAINarratorClick}>
    AI Narrator
  </button>
  
  <button data-tour="visual-learning" onClick={handleVisualLearningClick}>
    Visual Learning
  </button>
  
  <button data-tour="step-by-step" onClick={handleStepByStepClick}>
    Step-by-Step
  </button>
  
  <button data-tour="big-picture" onClick={handleBigPictureClick}>
    Big Picture
  </button>
  
  <button data-tour="hands-on" onClick={handleHandsOnClick}>
    Hands-On
  </button>
  
  <button data-tour="theory" onClick={handleTheoryClick}>
    Theory
  </button>
  
  <button data-tour="practice" onClick={handlePracticeClick}>
    Practice
  </button>
  
  <button data-tour="reflect" onClick={handleReflectClick}>
    Reflect
  </button>
  
</div>
```

### Step 2: Add tour state to your document viewer component

```javascript
import { useState } from 'react';
import DocumentViewerTour from '@/components/DocumentViewerTour';

// Inside your component
const [showTour, setShowTour] = useState(false);
```

### Step 3: Add "Take a Tour" button

Add this button near your document viewer header (next to close button or in toolbar):

```javascript
<button 
  onClick={() => setShowTour(true)}
  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  Take a Tour
</button>
```

### Step 4: Render the DocumentViewerTour component

Add this at the end of your component's return statement (before the closing tag):

```javascript
return (
  <>
    {/* Your existing document viewer JSX */}
    
    {/* Document Viewer Tour */}
    <DocumentViewerTour 
      show={showTour} 
      onComplete={() => setShowTour(false)} 
    />
  </>
);
```

## Tour Steps

The tour will guide users through:

1. **8 AI Learning Modes** - Overview of all modes
2. **AI Narrator** - Audio narration feature
3. **Visual Learning** - Visual representations
4. **Step-by-Step** - Sequential learning
5. **Big Picture** - Holistic view
6. **Hands-On** - Practical exercises
7. **Theory** - Conceptual foundations
8. **Practice** - Practice questions
9. **Reflect** - Reflective learning

## Features

- ✅ Automatic display on first visit
- ✅ Manual replay via "Take a Tour" button
- ✅ Spotlight effects on each button
- ✅ Smart positioning
- ✅ localStorage tracking
- ✅ Step navigation with progress

## Testing

1. Clear localStorage: `localStorage.removeItem('hasSeenDocumentViewerTour')`
2. Open a document in the viewer
3. Tour should auto-start after 1 second
4. Click "Take a Tour" button to replay

## Customization

To customize tour content, edit `src/components/DocumentViewerTour.js` and modify the `steps` array.

## Need Help?

If you need assistance finding where the learning mode buttons are rendered, check these files:
- `src/components/ContentViewer.client.js`
- `src/components/PdfPreviewWithAI.js`
- `src/components/DocxPreviewWithAI.js`
- Any custom document viewer components

The buttons should be in the component that renders when you open a document in full view mode.
