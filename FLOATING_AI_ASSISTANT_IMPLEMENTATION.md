# Floating AI Assistant - Global Implementation

## Overview
A globally accessible AI Assistant button that appears on all LMS pages (excluding the landing page), fixed to the bottom-right of the viewport. The button opens a slide-up panel with AI interaction capabilities.

## Features

### Design
- **Position**: Fixed to bottom-right corner (bottom-8, right-8)
- **Style**: Blue gradient button with rounded pill shape
- **Icon**: Lightbulb icon with pulsing yellow indicator
- **Text**: "AI Assistant" with "Ask me anything" subtitle (appears on hover)
- **Panel**: Slides up from bottom with smooth animation
- **Interactions**: 
  - Click to toggle panel open/close
  - Hover effect with scale animation
  - Rotation animation when opening
  - Glow effect on hover
  - Shadow effects

### Behavior
- **Visibility**: Shows on all authenticated pages (home, courses, schedule, etc.)
- **Hidden on**: Landing page (`/`), login, register, and other auth pages
- **Click Action**: Opens/closes AI Assistant panel
- **Panel Features**:
  - Text input for queries (500 char limit)
  - Three modes: Ask, Research, Text to Docs
  - Submit button to process queries
  - Navigates to appropriate page based on mode
- **Z-index**: Button (50), Panel (40)

## Implementation

### Files Created
1. **src/components/FloatingAIAssistant.js**
   - Standalone component with button and panel
   - Uses Next.js router for navigation
   - Integrates with learning behavior tracker
   - Fully responsive and accessible

### Files Modified
1. **src/components/Layout.js**
   - Imported FloatingAIAssistant component
   - Added component inside the main content wrapper
   - Automatically excluded from auth pages

2. **src/app/home/page.js**
   - Removed duplicate AI Assistant implementation
   - Cleaned up unused state variables (isAIAssistantOpen, selectedMode, promptText)
   - Removed handleSubmit function
   - Now uses global AI Assistant from Layout

## Technical Details

### Component Structure
```jsx
<button> (fixed positioning)
  └── <div> (main button container)
      ├── Icon (lightbulb with pulsing dot)
      ├── Text (title + subtitle)
      └── Arrow (shows on hover)
  └── <div> (glow effect)
```

### Styling
- Tailwind CSS classes
- Gradient: `from-blue-600 to-blue-500`
- Shadow: `shadow-2xl` with blue glow on hover
- Transitions: 300ms ease-out
- Responsive: Works on all screen sizes

### Accessibility
- Proper `aria-label` for screen readers
- Keyboard accessible (button element)
- Clear visual feedback on hover/focus

## Usage

The component is automatically rendered on all LMS pages. No additional setup required.

### Navigation Target
The panel navigates based on selected mode:
- **Ask mode**: `/ask?q={query}`
- **Research mode**: Currently same as Ask
- **Text to Docs mode**: `/text-to-docs?prompt={query}`

To change destinations, modify the `handleSubmit` function in `FloatingAIAssistant.js`

### Customization Options

**Change Position:**
```jsx
className="fixed bottom-8 right-8" // Current
className="fixed bottom-4 left-4"  // Bottom-left
className="fixed top-8 right-8"    // Top-right
```

**Change Colors:**
```jsx
bg-gradient-to-r from-blue-600 to-blue-500  // Current
bg-gradient-to-r from-purple-600 to-pink-500 // Purple-pink
bg-gradient-to-r from-green-600 to-teal-500  // Green-teal
```

**Change Size:**
```jsx
px-6 py-4  // Current (medium)
px-4 py-3  // Small
px-8 py-5  // Large
```

## Testing Checklist

- [ ] Button appears on home page
- [ ] Button appears on courses page
- [ ] Button appears on schedule page
- [ ] Button appears on settings page
- [ ] Button does NOT appear on landing page
- [ ] Button does NOT appear on login page
- [ ] Button does NOT appear on register page
- [ ] Button does NOT appear on admin pages
- [ ] Hover effects work correctly
- [ ] Click opens AI Assistant panel
- [ ] Panel slides up smoothly
- [ ] Text input works and shows character count
- [ ] Mode switching works (Ask, Research, Docs)
- [ ] Submit button is disabled when empty
- [ ] Submit navigates to correct page based on mode
- [ ] Panel closes after submission
- [ ] Close button (X icon) works
- [ ] Button stays fixed during scroll
- [ ] Panel stays fixed during scroll
- [ ] Button is above other content (z-index)
- [ ] Panel is below button (z-index)
- [ ] Responsive on mobile devices
- [ ] Accessible via keyboard
- [ ] No duplicate AI Assistant on home page

## Future Enhancements

1. **Modal Integration**: Open AI chat in a modal instead of navigation
2. **Badge Notifications**: Show unread message count
3. **Quick Actions**: Dropdown menu with common AI tasks
4. **Minimize/Expand**: Collapsible state to save screen space
5. **Context Awareness**: Change icon/text based on current page
6. **Keyboard Shortcut**: Add hotkey (e.g., Ctrl+K) to open assistant

## Notes

- The component is client-side only (`'use client'`)
- Uses Next.js 13+ App Router
- No external dependencies beyond React and Next.js
- Fully compatible with existing layout system
- Does not interfere with sidebar or navbar
