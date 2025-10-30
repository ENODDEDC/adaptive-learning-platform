# Global Learning Button Debug Guide

## Complete Flow Trace

### 1. Button Click (CleanPDFViewer.js)
```
User clicks "Global" button
↓
CleanPDFViewer button onClick fires
↓
Console: "🔘 Global Learning button clicked in CleanPDFViewer"
Console: "📞 Calling onGlobalLearningClick: function"
↓
Calls onGlobalLearningClick()
```

### 2. Handler Execution (PdfPreviewWithAI.js)
```
handleGlobalLearningClick() executes
↓
Console: "🌍 === GLOBAL LEARNING BUTTON CLICKED ==="
Console: "📊 Current state: { showGlobalLearning, pdfContent, isGlobalLearningLoading }"
↓
Step 1: setIsGlobalLearningLoading(true)
Console: "🔄 Step 1: Setting loading state..."
↓
Step 2: Extract PDF content
Console: "📄 Step 2: Extracting PDF content..."
Console: "✅ Content extracted, length: XXXX"
↓
Step 3: Analyze content for educational value
Console: "🔍 Step 3: Analyzing content for educational value..."
Console: "📊 Analysis result: { isEducational, reasoning, contentType, confidence }"
↓
If NOT educational → Show error and STOP
If educational → Continue
↓
Step 4: setPdfContent(extractedContent)
Console: "✅ Step 4: Content approved! Setting PDF content..."
↓
Step 5: setShowGlobalLearning(true) ← THIS IS THE KEY!
Console: "🎯 Step 5: Setting showGlobalLearning to TRUE..."
Console: "✅ === GLOBAL LEARNING SHOULD NOW BE VISIBLE ==="
↓
Step 6: setIsGlobalLearningLoading(false)
Console: "🏁 Step 6: Clearing loading state..."
```

### 3. Modal Rendering (GlobalLearning.js)
```
GlobalLearning component re-renders
↓
Console: "🌍 GlobalLearning render - isActive: true, docxContent length: XXXX"
↓
Check: if (!isActive) return null
↓
If isActive is FALSE:
  Console: "❌ GlobalLearning NOT rendering (isActive is false)"
  Returns null (modal doesn't show)
↓
If isActive is TRUE:
  Console: "✅ GlobalLearning IS rendering!"
  Renders the modal with z-[10001]
```

### 4. Modal Props (PdfPreviewWithAI.js line ~1204)
```jsx
<GlobalLearning
  isActive={showGlobalLearning}  ← Should be TRUE after button click
  onClose={() => setShowGlobalLearning(false)}
  docxContent={pdfContent}       ← Should contain extracted PDF text
  fileName={fileName}
/>
```

## What to Check in Console

When you click the Global button, you should see this sequence:

1. ✅ `🔘 Global Learning button clicked in CleanPDFViewer`
2. ✅ `📞 Calling onGlobalLearningClick: function`
3. ✅ `🌍 === GLOBAL LEARNING BUTTON CLICKED ===`
4. ✅ `📊 Current state: ...`
5. ✅ `🔄 Step 1: Setting loading state...`
6. ✅ `📄 Step 2: Extracting PDF content...`
7. ✅ `✅ Content extracted, length: XXXX`
8. ✅ `🔍 Step 3: Analyzing content for educational value...`
9. ✅ `📊 Analysis result: ...`
10. ✅ `✅ Step 4: Content approved! Setting PDF content...`
11. ✅ `🎯 Step 5: Setting showGlobalLearning to TRUE...`
12. ✅ `✅ === GLOBAL LEARNING SHOULD NOW BE VISIBLE ===`
13. ✅ `🏁 Step 6: Clearing loading state...`
14. ✅ `🌍 GlobalLearning render - isActive: true, docxContent length: XXXX`
15. ✅ `✅ GlobalLearning IS rendering!`

## Possible Issues

### Issue 1: Button click not firing
- **Symptom**: No console logs at all
- **Cause**: Button might be covered by another element
- **Check**: Inspect the button with browser DevTools

### Issue 2: Handler not executing
- **Symptom**: See button click log but not handler logs
- **Cause**: onGlobalLearningClick prop not passed correctly
- **Check**: Verify PdfPreviewWithAI passes the prop to CleanPDFViewer

### Issue 3: Content extraction fails
- **Symptom**: Logs stop at "Step 2" or show error
- **Cause**: PDF extraction API failing
- **Check**: Network tab for /api/pdf-extract request

### Issue 4: Content not educational
- **Symptom**: Logs stop at "Step 3" with warning
- **Cause**: AI analysis determines content is not educational
- **Check**: The analysis result in console

### Issue 5: Modal doesn't render
- **Symptom**: All logs show but modal not visible
- **Cause**: 
  - showGlobalLearning state not updating
  - GlobalLearning component not receiving isActive prop
  - Z-index issue (modal behind other elements)
- **Check**: 
  - React DevTools to see showGlobalLearning state
  - GlobalLearning render logs
  - Browser inspector for z-index conflicts

## Testing Steps

1. Open your PDF viewer page
2. Open browser console (F12)
3. Click the "Global" button (orange/red gradient)
4. Watch the console logs appear in sequence
5. Report which step fails or if modal appears

## Files Modified

1. `src/components/PdfPreviewWithAI.js` - Added debug logs to handleGlobalLearningClick
2. `src/components/GlobalLearning.js` - Added debug logs to render check
3. `src/components/CleanPDFViewer.js` - Added debug logs to button click
