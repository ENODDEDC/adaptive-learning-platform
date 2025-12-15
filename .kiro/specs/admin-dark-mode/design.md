# Design Document

## Overview

This design document outlines the implementation approach for adding dark mode support to the entire admin panel with a simplified 3-color palette. The solution uses Tailwind CSS's built-in dark mode support with a class-based strategy, React context for theme management, and localStorage for persistence.

## Architecture

### Theme Management Architecture

```
┌─────────────────────────────────────────┐
│         ThemeProvider Context           │
│  - Current theme state (light/dark)     │
│  - Toggle function                      │
│  - localStorage persistence             │
└──────────────┬──────────────────────────┘
               │
               ├──────────────┬──────────────┬──────────────┐
               │              │              │              │
         ┌─────▼─────┐  ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
         │ Dashboard │  │  Users  │   │ Courses │   │  Feed   │
         │   Page    │  │  Page   │   │  Page   │   │  Page   │
         └───────────┘  └─────────┘   └─────────┘   └─────────┘
```

### Color Palette System

**Light Mode:**
- Primary: Purple-600 (#9333ea)
- Accent: Indigo-600 (#4f46e5)
- Neutral: Gray-500 (#6b7280)
- Background: White/Gray-50
- Text: Gray-900/Gray-700
- Borders: Gray-200

**Dark Mode:**
- Primary: Purple-500 (#a855f7)
- Accent: Indigo-500 (#6366f1)
- Neutral: Gray-400 (#9ca3af)
- Background: Gray-900/Gray-800
- Text: Gray-100/Gray-300
- Borders: Gray-700

## Components and Interfaces

### 1. ThemeContext Provider

**Location:** `src/contexts/ThemeContext.js`

**Purpose:** Manages global theme state and provides theme toggle functionality

**Interface:**
```javascript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

**Implementation Details:**
- Uses React Context API
- Stores theme preference in localStorage with key `admin-theme`
- Applies/removes `dark` class on document root element
- Initializes theme from localStorage or system preference

### 2. ThemeToggle Component

**Location:** `src/components/ThemeToggle.js`

**Purpose:** UI control for switching between themes

**Features:**
- Icon-based toggle (sun/moon icons)
- Smooth transition animation
- Accessible with keyboard navigation
- Shows current theme state

### 3. Admin Layout Wrapper

**Location:** `src/app/admin/layout.js`

**Purpose:** Wraps all admin pages with ThemeProvider

**Responsibilities:**
- Provides theme context to all child components
- Includes ThemeToggle in navigation
- Applies base dark mode classes

## Data Models

### Theme Preference Storage

**localStorage Key:** `admin-theme`

**Values:**
- `"light"` - Light mode
- `"dark"` - Dark mode
- `null` - Use system preference

## Error Handling

### localStorage Errors

**Scenario:** localStorage is unavailable or quota exceeded

**Handling:**
- Fall back to session-only theme state
- Log warning to console
- Continue with default light theme

### Theme Application Errors

**Scenario:** Class manipulation fails

**Handling:**
- Catch errors silently
- Maintain current theme state
- Retry on next toggle

## Testing Strategy

### Unit Tests
- ThemeContext provider state management
- Theme toggle function
- localStorage persistence
- System preference detection

### Integration Tests
- Theme toggle updates all components
- Theme persists across page navigation
- Theme loads correctly on initial render

### Visual Tests
- All components render correctly in dark mode
- Color contrast meets WCAG AA standards
- Hover/focus states visible in both themes
- No color bleeding or inconsistencies

## Implementation Plan

### Phase 1: Foundation (Core Infrastructure)
1. Create ThemeContext and Provider
2. Create ThemeToggle component
3. Update admin layout to include ThemeProvider
4. Configure Tailwind dark mode

### Phase 2: Component Updates (Systematic Styling)
1. Update stat cards with dark mode classes
2. Update navigation and sidebar
3. Update form inputs and buttons
4. Update tables and data displays
5. Update modals and overlays
6. Update cards and containers

### Phase 3: Color Simplification (Palette Cleanup)
1. Replace all blue colors with purple/indigo
2. Replace all green colors with purple/indigo
3. Replace all orange colors with gray
4. Replace all cyan/teal colors with indigo
5. Replace all pink colors with purple
6. Keep red only for destructive actions

### Phase 4: Page-by-Page Implementation
1. Dashboard page
2. Users page
3. Courses page
4. Feed Management page
5. Member Management page
6. Analytics page
7. Settings page

### Phase 5: Polish and Testing
1. Test all pages in both themes
2. Verify accessibility standards
3. Test localStorage persistence
4. Test system preference detection
5. Fix any visual inconsistencies

## Design Decisions

### Why Class-Based Dark Mode?
- More control than media query approach
- Allows user preference override
- Better for admin panels where users may want different settings than system

### Why Context API?
- Simple and built-in to React
- Sufficient for theme state management
- No external dependencies needed
- Easy to test and maintain

### Why 3-Color Palette?
- Reduces visual noise
- Creates professional appearance
- Easier to maintain consistency
- Better for accessibility (fewer color combinations to test)

### Color Mapping Strategy
- Purple: Primary actions, main interactive elements
- Indigo: Secondary actions, informational elements
- Gray: Neutral elements, backgrounds, disabled states
- Red: Reserved for destructive/dangerous actions only
