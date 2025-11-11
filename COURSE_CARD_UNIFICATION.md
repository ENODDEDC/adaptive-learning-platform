# Course Card Design Unification

## Overview
Unified the course card design between the home page (`/home`) and courses page (`/courses`) to provide a consistent user experience across the platform.

## Problem
- Home page had a custom inline course card design with schedules
- Courses page was using `ProfessionalCourseCard` component with different styling
- Inconsistent user experience when navigating between pages
- Users expected the same card design everywhere

## Solution
Replaced the `ProfessionalCourseCard` component usage in `/courses` page with the same inline card design from the home page.

## Changes Made

### File Modified
**src/app/courses/page.js**

### Card Design Features
The unified card design includes:

1. **Colored Header Section**
   - Dynamic background color based on course theme
   - Gradient overlay for depth
   - Subtle white circle decoration
   - Section badge with icon
   - Course title with text shadow for readability

2. **Content Section**
   - Instructor avatar with initials
   - Instructor name and label
   - Two metric cards:
     - Materials count (purple theme)
     - Students count (blue theme)

3. **Interactive Features**
   - Hover effects (lift and shadow)
   - Drag and drop support
   - Smooth transitions
   - Border highlight on drag over

4. **Responsive Design**
   - Flexible layout
   - Truncated text for long names
   - Proper spacing and padding

### Color System
The card uses a sophisticated color normalization system:

**Hex to Tailwind Mapping:**
- `#60a5fa` → `bg-blue-400`
- `#a78bfa` → `bg-purple-400`
- `#f472b6` → `bg-pink-400`
- `#34d399` → `bg-emerald-400`
- `#fb923c` → `bg-orange-400`
- `#f87171` → `bg-red-400`
- `#2dd4bf` → `bg-teal-400`
- `#818cf8` → `bg-indigo-400`

**Color Variations:**
Each color has three variations:
- Base: Main header color
- Lighter: For backgrounds (50 shade)
- Darker: For accents (600 shade)
- Text: For text elements (700 shade)

### Layout Structure
```
Link (draggable)
└── Card Container
    ├── Colored Header
    │   ├── Gradient Overlay
    │   ├── Decoration Circle
    │   ├── Section Badge
    │   └── Course Title
    └── Content Section
        ├── Instructor Info
        │   ├── Avatar (initials)
        │   └── Name
        └── Metrics Row
            ├── Materials Card
            └── Students Card
```

### Drag and Drop Integration
The card maintains all drag and drop functionality:
- `draggable` attribute
- `onDragStart` - Initiates drag
- `onDragOver` - Allows drop
- `onDragEnter` - Visual feedback
- `onDragLeave` - Remove feedback
- `onDragEnd` - Cleanup
- `onDrop` - Handle reordering

### Visual States
1. **Default**: Clean white card with subtle border
2. **Hover**: Lifts up, enhanced shadow, darker border
3. **Drag Over**: Blue border with ring effect
4. **Dragging**: Reduced opacity (handled by drag handlers)

## Benefits

1. **Consistency**: Same card design across all pages
2. **Familiarity**: Users see the same interface everywhere
3. **Maintainability**: Single source of truth for card design
4. **Professional**: Polished, cohesive user experience
5. **Accessibility**: Clear visual hierarchy and readable text

## Differences from Home Page

### Removed Features
- Schedule display (not needed in courses list view)
- Expand/collapse schedule functionality
- Assignment count metric (simplified to just materials and students)

### Kept Features
- All visual styling
- Color system
- Instructor display
- Metrics cards
- Hover effects
- Drag and drop

### Why These Changes?
- **Schedule**: Takes up space and is better shown in detail view
- **Assignments**: Simplified metrics for cleaner look
- **Focus**: Emphasize core information (materials and students)

## Technical Details

### Color Normalization
```javascript
const normalizeColor = (colorValue) => {
  // Handles bg- classes, hex colors, and fallbacks
  // Returns consistent Tailwind class
};
```

### Color Variations
```javascript
const getColorVariations = (colorClass) => {
  // Maps base color to lighter, darker, and text variants
  // Returns object with all variations
};
```

### Inline Implementation
The card is implemented inline (not as a separate component) to:
- Reduce component complexity
- Keep drag/drop logic in one place
- Allow easy customization per page
- Maintain performance

## Testing Checklist

- [x] Cards display correctly on `/courses` page
- [x] Colors match home page design
- [x] Hover effects work
- [x] Drag and drop functionality preserved
- [x] Instructor initials display correctly
- [x] Metrics show correct counts
- [x] Links navigate to course detail page
- [x] Responsive on different screen sizes
- [x] No console errors
- [x] Smooth transitions

## Future Enhancements

1. **Component Extraction**: Create a shared `UnifiedCourseCard` component
2. **Schedule Toggle**: Add optional schedule display
3. **More Metrics**: Progress bar, due dates, etc.
4. **Customization**: Allow per-page metric selection
5. **Animations**: Add micro-interactions
6. **Themes**: Support light/dark mode
7. **Badges**: Show "New", "Updated", etc.

## Conclusion

The course cards now provide a consistent, professional experience across the platform. Users will see the same familiar design whether they're on the home page or browsing all courses, improving usability and reducing cognitive load.
