# Schedule Expand/Collapse Feature

## ✅ What Was Added

Added expand/collapse functionality to the schedule section on course cards.

## 🎯 Features

### 1. Expandable Schedules
- **Default View**: Shows first 2 schedules
- **Collapsed State**: Displays "+X more" button with down arrow
- **Expanded State**: Shows all schedules with "Show less" button and up arrow
- **Toggle**: Click to expand/collapse

### 2. Visual Indicators
- **Down Arrow (▼)**: When collapsed - indicates more content below
- **Up Arrow (▲)**: When expanded - indicates content can be collapsed
- **Hover Effect**: Button changes color on hover (indigo-600 → indigo-700)

### 3. Interaction
- **Click Prevention**: Clicking expand/collapse doesn't navigate to course page
- **Smooth Transition**: Instant expand/collapse (can add animation if needed)
- **Per-Card State**: Each course card maintains its own expand/collapse state

## 🎨 Design

### Collapsed State:
```
📅 SCHEDULE
Mon  09:00 - 10:00
Wed  14:00 - 15:30
+1 more ▼
```

### Expanded State:
```
📅 SCHEDULE
Mon  09:00 - 10:00
Wed  14:00 - 15:30
Fri  11:00 - 12:30
Show less ▲
```

## 💻 Technical Implementation

### State Management:
```javascript
const [expandedSchedules, setExpandedSchedules] = useState({});
```

- Uses object to track expanded state per course ID
- Key: course.id
- Value: boolean (true = expanded, false = collapsed)

### Toggle Function:
```javascript
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  setExpandedSchedules(prev => ({
    ...prev,
    [course.id]: !prev[course.id]
  }));
}}
```

- `e.preventDefault()`: Prevents Link navigation
- `e.stopPropagation()`: Stops event bubbling
- Toggles specific course's expanded state

### Conditional Rendering:
```javascript
{(expandedSchedules[course.id] 
  ? course.schedules 
  : course.schedules.slice(0, 2)
).map((schedule, idx) => (
  // Render schedule
))}
```

## 🎯 User Experience

### Benefits:
1. **Clean Interface**: Cards don't get too tall with many schedules
2. **Quick Overview**: See first 2 schedules at a glance
3. **Full Details**: Expand to see all schedules when needed
4. **Easy Navigation**: Collapse back to save space

### Behavior:
- Only shows expand/collapse if course has more than 2 schedules
- If course has 1-2 schedules, no button appears
- Each card remembers its state independently
- State resets on page refresh (intentional for clean start)

## 🔧 Styling Details

### Button Styling:
```css
className="w-full text-xs text-indigo-600 hover:text-indigo-700 
           font-semibold text-center pt-1 transition-colors 
           flex items-center justify-center gap-1"
```

- **Full Width**: Button spans entire schedule section
- **Small Text**: `text-xs` for compact look
- **Color**: Indigo-600 (matches schedule theme)
- **Hover**: Darker indigo on hover
- **Layout**: Flexbox with centered content and gap
- **Transition**: Smooth color change

### Icon Styling:
```css
className="w-3 h-3"
```

- Small 12px × 12px icons
- Matches text size
- Clear visual indicator

## 📱 Responsive Design

- Works on all screen sizes
- Touch-friendly button size
- Clear visual feedback
- No layout shift on expand/collapse

## 🚀 Testing

### Test Cases:
1. ✅ Course with 1 schedule - No button shown
2. ✅ Course with 2 schedules - No button shown
3. ✅ Course with 3+ schedules - Button shown
4. ✅ Click "+X more" - Expands to show all
5. ✅ Click "Show less" - Collapses back to 2
6. ✅ Multiple cards - Each maintains own state
7. ✅ Click schedule area - Doesn't navigate to course
8. ✅ Click card elsewhere - Navigates to course

## 🎊 Example Usage

### Course with 3 Schedules:
**Initial State:**
```
Mon  09:00 - 10:00
Wed  14:00 - 15:30
+1 more ▼
```

**After Clicking "+1 more":**
```
Mon  09:00 - 10:00
Wed  14:00 - 15:30
Fri  11:00 - 12:30
Show less ▲
```

### Course with 5 Schedules:
**Initial State:**
```
Mon  09:00 - 10:00
Tue  14:00 - 15:30
+3 more ▼
```

**After Clicking "+3 more":**
```
Mon  09:00 - 10:00
Tue  14:00 - 15:30
Wed  10:00 - 11:30
Thu  13:00 - 14:30
Fri  15:00 - 16:30
Show less ▲
```

## 🔮 Future Enhancements (Optional)

- [ ] Smooth animation on expand/collapse
- [ ] Remember expanded state in localStorage
- [ ] Keyboard navigation (Enter/Space to toggle)
- [ ] Accessibility improvements (ARIA labels)
- [ ] Expand all / Collapse all button
- [ ] Transition animation for height change

## ✨ Summary

The schedule section now has a clean, professional expand/collapse feature that:
- Keeps cards compact by default
- Allows viewing all schedules on demand
- Provides clear visual feedback
- Maintains good UX with proper event handling
- Matches the existing design system

Perfect for courses with many class times! 🎉
