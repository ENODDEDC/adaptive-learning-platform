# Course Card Height Consistency Fix

## Problem
Course cards in the masonry grid had inconsistent heights because:
1. Cards with schedules were taller than cards without schedules
2. Grid items used `align-self: start` which allowed different heights
3. No minimum height constraint was set

## Solution

### CSS Changes (globals.css)

#### 1. Changed Grid Item Alignment
```css
/* Before */
.masonry-grid > * {
  align-self: start;  /* Allows different heights */
}

/* After */
.masonry-grid > * {
  align-self: stretch;  /* Forces all items to same height in row */
  min-height: 420px;    /* Ensures minimum consistent height */
}
```

#### 2. Added Flexbox to Card Content
```css
/* Ensure card content fills height */
.masonry-grid > * > div {
  height: 100%;
  display: flex;
  flex-direction: column;
}
```

### How It Works

1. **`align-self: stretch`**: Makes all grid items in the same row stretch to match the tallest item
2. **`min-height: 420px`**: Sets a baseline minimum height for all cards
3. **Flexbox on card content**: Ensures the inner card div fills the full height of the grid item
4. **Existing `h-full` on card**: The card already had `h-full` class, which works with the parent height

### Visual Result

#### Before (Inconsistent Heights)
```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Card 1  │  │ Card 2  │  │ Card 3  │
│         │  │         │  │         │
│         │  │ Schedule│  │         │
└─────────┘  │         │  └─────────┘
             │         │
             └─────────┘
```

#### After (Consistent Heights)
```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Card 1  │  │ Card 2  │  │ Card 3  │
│         │  │         │  │         │
│         │  │ Schedule│  │         │
│         │  │         │  │         │
│         │  │         │  │         │
└─────────┘  └─────────┘  └─────────┘
```

## Technical Details

### Grid Behavior
- CSS Grid with `align-self: stretch` makes items in the same row equal height
- Each row can have different heights based on content
- Minimum height ensures no card is too small

### Flexbox Behavior
- Card content uses `flex flex-col` to distribute space vertically
- Metrics section has `mt-auto` to push to bottom
- Content sections expand to fill available space

## Benefits

✅ **Visual Consistency**: All cards in a row have the same height
✅ **Professional Look**: Clean, aligned grid layout
✅ **Flexible Content**: Cards adapt to content while maintaining consistency
✅ **Responsive**: Works across all screen sizes and sidebar states

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile browsers: Full support

---

**Status**: ✅ Implemented
**Date**: November 12, 2025
**Impact**: Medium - Improves visual consistency
