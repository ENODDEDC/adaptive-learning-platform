# Design Document

## Overview

This design document outlines the implementation of a reusable confirmation modal component to replace native JavaScript `window.confirm()` dialogs throughout the application. The component will provide a consistent, accessible, and visually appealing user experience for confirming destructive actions such as leaving courses, deleting classwork, removing users, and archiving courses.

The design leverages the existing Headless UI library (@headlessui/react) already used in the application for modal dialogs, ensuring consistency with other modal components like InviteModal, CreateCourseModal, and ProfileModal.

## Architecture

### Component Structure

```
src/components/
  └── ConfirmationModal.js (new)
  
src/app/courses/[slug]/
  └── page.js (modified)
```

### Technology Stack

- **React**: Component framework
- **Headless UI**: Accessible modal primitives (@headlessui/react Dialog and Transition components)
- **Tailwind CSS**: Styling and animations
- **Heroicons**: Icon library (@heroicons/react/24/outline)

## Components and Interfaces

### ConfirmationModal Component

A reusable modal component that displays confirmation dialogs with customizable content and actions.

#### Props Interface

```typescript
interface ConfirmationModalProps {
  isOpen: boolean;              // Controls modal visibility
  onClose: () => void;          // Callback when modal is closed/cancelled
  onConfirm: () => void;        // Callback when action is confirmed
  title: string;                // Modal title text
  message: string;              // Descriptive message explaining the action
  confirmText?: string;         // Custom text for confirm button (default: "Confirm")
  cancelText?: string;          // Custom text for cancel button (default: "Cancel")
  variant?: 'danger' | 'warning' | 'info'; // Visual style variant (default: 'danger')
  icon?: React.ReactNode;       // Optional custom icon component
  loading?: boolean;            // Shows loading state on confirm button
}
```

#### Component API

```javascript
<ConfirmationModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleDeleteConfirmed}
  title="Delete Course"
  message="Are you sure you want to archive this course? Archived courses can be restored by administrators and will be hidden from students."
  confirmText="Delete Course"
  cancelText="Cancel"
  variant="danger"
/>
```

### Integration Pattern

The course detail page will be refactored to use state management for controlling modal visibility:

```javascript
// State for each confirmation type
const [confirmationModal, setConfirmationModal] = useState({
  isOpen: false,
  type: null,
  data: null
});

// Generic handler to open confirmation
const openConfirmation = (type, data = null) => {
  setConfirmationModal({ isOpen: true, type, data });
};

// Generic handler to close confirmation
const closeConfirmation = () => {
  setConfirmationModal({ isOpen: false, type: null, data: null });
};

// Specific confirmation handlers
const handleConfirmAction = async () => {
  const { type, data } = confirmationModal;
  
  switch (type) {
    case 'leave-course':
      await executeLeaveCourse();
      break;
    case 'delete-course':
      await executeDeleteCourse();
      break;
    case 'remove-user':
      await executeRemoveUser(data.userId, data.role);
      break;
    case 'delete-classwork':
      await executeDeleteClasswork(data.classworkId);
      break;
  }
  
  closeConfirmation();
};
```

## Data Models

### Confirmation Configuration

Each confirmation type will have a predefined configuration:

```javascript
const CONFIRMATION_CONFIGS = {
  'leave-course': {
    title: 'Leave Course',
    message: 'Are you sure you want to leave this course?',
    confirmText: 'Leave Course',
    variant: 'warning',
    icon: <ArrowRightOnRectangleIcon />
  },
  'delete-course': {
    title: 'Delete Course',
    message: 'Are you sure you want to archive this course? Archived courses can be restored by administrators and will be hidden from students.',
    confirmText: 'Delete Course',
    variant: 'danger',
    icon: <ArchiveBoxIcon />
  },
  'remove-user': (role) => ({
    title: 'Remove User',
    message: `Are you sure you want to remove this ${role === 'student' ? 'student' : 'co-teacher'} from the course?`,
    confirmText: 'Remove User',
    variant: 'danger',
    icon: <UserMinusIcon />
  }),
  'delete-classwork': {
    title: 'Delete Classwork',
    message: 'Are you sure you want to delete this classwork?',
    confirmText: 'Delete',
    variant: 'danger',
    icon: <TrashIcon />
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, several properties are redundant:
- Properties 3.2, 4.2, and 5.2 all test that confirming executes the action, which is covered by property 2.2
- Properties 3.3, 4.3, and 5.3 all test that canceling closes the modal, which is covered by property 2.3
- Property 6.1 is essentially the same as 2.3 (cancel closes modal without executing)
- Property 6.4 is essentially the same as 2.2 (confirm executes action and closes modal)

These redundant properties will be consolidated into comprehensive properties that cover all confirmation types.

### Correctness Properties

Property 1: Modal display replaces native dialogs
*For any* destructive action trigger, the system should display a custom modal element in the DOM instead of invoking window.confirm
**Validates: Requirements 1.1**

Property 2: Modal contains required elements
*For any* modal configuration, the rendered modal should contain a title element, a message element, and exactly two button elements
**Validates: Requirements 1.2, 1.3, 1.4**

Property 3: Overlay prevents background interaction
*For any* open confirmation modal, an overlay element should be present and clicking it should trigger the close handler
**Validates: Requirements 1.5**

Property 4: Confirm button executes action
*For any* confirmation modal, clicking the confirm button should call the onConfirm callback and close the modal
**Validates: Requirements 2.2, 3.2, 4.2, 5.2, 6.4**

Property 5: Cancel button closes without executing
*For any* confirmation modal, clicking the cancel button should call the onClose callback without calling onConfirm
**Validates: Requirements 2.3, 3.3, 4.3, 5.3, 6.1**

Property 6: Overlay click closes modal
*For any* open confirmation modal, clicking the overlay should call the onClose callback without calling onConfirm
**Validates: Requirements 6.2**

Property 7: Escape key closes modal
*For any* open confirmation modal, pressing the Escape key should call the onClose callback without calling onConfirm
**Validates: Requirements 6.3**

Property 8: Props customize modal content
*For any* set of props (title, message, confirmText, cancelText), the rendered modal should display those exact values in the corresponding elements
**Validates: Requirements 7.1**

Property 9: Callbacks are invoked correctly
*For any* confirmation modal with onConfirm and onClose callbacks, those callbacks should be invoked when the corresponding buttons are clicked
**Validates: Requirements 7.2**

Property 10: Accessibility attributes present
*For any* rendered confirmation modal, the modal should have appropriate ARIA attributes (role="dialog", aria-modal="true", aria-labelledby)
**Validates: Requirements 7.4**

## Error Handling

### Modal State Management

- **Invalid State**: If modal is opened without required props (title, message, onConfirm, onClose), component should log a warning and not render
- **Callback Errors**: If onConfirm callback throws an error, the modal should remain open and display an error message
- **Async Actions**: Support loading state during async confirm actions to prevent double-submission

### User Input Validation

- **Rapid Clicks**: Prevent multiple confirm button clicks by disabling button during action execution
- **Keyboard Navigation**: Ensure focus trap within modal and proper focus management on open/close

### Edge Cases

- **Modal Already Open**: If attempting to open a modal while one is already open, close the existing modal first
- **Unmounted Component**: Ensure cleanup of event listeners if component unmounts while modal is open
- **Missing Callbacks**: Provide default no-op functions if callbacks are not provided

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Component Rendering**
   - Modal renders with all required elements
   - Props are correctly displayed in the UI
   - Variant styles are applied correctly
   - Loading state displays correctly

2. **User Interactions**
   - Confirm button click calls onConfirm
   - Cancel button click calls onClose
   - Overlay click calls onClose
   - Escape key press calls onClose

3. **Edge Cases**
   - Modal with missing optional props uses defaults
   - Rapid button clicks are prevented
   - Error in onConfirm callback is handled gracefully

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **@testing-library/react** and **@testing-library/user-event** for React component testing:

1. **Modal Display Property** (Property 1)
   - Generate random confirmation types
   - Verify custom modal appears instead of native dialog

2. **Required Elements Property** (Property 2)
   - Generate random modal configurations
   - Verify all required elements are present

3. **Overlay Interaction Property** (Property 3)
   - Generate random modal states
   - Verify overlay exists and handles clicks

4. **Confirm Execution Property** (Property 4)
   - Generate random confirmation scenarios
   - Verify onConfirm is called and modal closes

5. **Cancel Behavior Property** (Property 5)
   - Generate random confirmation scenarios
   - Verify onClose is called without onConfirm

6. **Overlay Close Property** (Property 6)
   - Generate random modal states
   - Verify overlay click closes modal

7. **Keyboard Close Property** (Property 7)
   - Generate random modal states
   - Verify Escape key closes modal

8. **Props Customization Property** (Property 8)
   - Generate random prop combinations
   - Verify all props are rendered correctly

9. **Callback Invocation Property** (Property 9)
   - Generate random callback functions
   - Verify callbacks are invoked correctly

10. **Accessibility Property** (Property 10)
    - Generate random modal configurations
    - Verify ARIA attributes are present

### Integration Testing

Integration tests will verify the modal works correctly within the course detail page:

1. **Leave Course Flow**
   - Click "Leave Course" button
   - Verify modal appears with correct content
   - Click confirm and verify redirect

2. **Delete Course Flow**
   - Click "Delete Course" button
   - Verify modal appears with correct content
   - Click confirm and verify redirect

3. **Remove User Flow**
   - Click remove user button
   - Verify modal appears with role-specific message
   - Click confirm and verify user is removed

4. **Delete Classwork Flow**
   - Click delete classwork button
   - Verify modal appears
   - Click confirm and verify classwork is deleted

### Test Configuration

- **Test Framework**: Jest (already configured in the project)
- **React Testing**: @testing-library/react
- **User Interaction**: @testing-library/user-event
- **Property Testing**: fast-check (to be added)
- **Minimum Iterations**: 100 iterations per property test

## Implementation Notes

### Styling Approach

The ConfirmationModal will follow the existing modal design patterns:

1. **Backdrop**: Semi-transparent overlay with backdrop blur
2. **Container**: White rounded card with shadow
3. **Animations**: Smooth fade-in/scale transitions using Headless UI Transition
4. **Variants**: Color-coded based on action severity
   - `danger`: Red accent for destructive actions (delete, remove)
   - `warning`: Amber accent for cautionary actions (leave, archive)
   - `info`: Blue accent for informational confirmations

### Accessibility Features

1. **Focus Management**: Focus trap within modal, return focus on close
2. **Keyboard Navigation**: Tab through buttons, Escape to close
3. **Screen Readers**: Proper ARIA labels and roles
4. **Color Contrast**: WCAG AA compliant color combinations

### Performance Considerations

1. **Lazy Loading**: Modal content only renders when isOpen is true
2. **Event Listeners**: Cleanup on unmount to prevent memory leaks
3. **Memoization**: Use React.memo for modal component to prevent unnecessary re-renders

## Migration Strategy

### Phase 1: Create Component
1. Create ConfirmationModal component
2. Write unit tests for component
3. Write property-based tests for component

### Phase 2: Integrate in Course Page
1. Add state management for modal
2. Replace window.confirm in handleLeaveCourse
3. Replace window.confirm in handleArchiveCourse
4. Replace window.confirm in handleRemoveUser
5. Replace window.confirm in handleDeleteClasswork

### Phase 3: Verify and Test
1. Run all tests
2. Manual testing of all confirmation flows
3. Accessibility audit with screen reader

### Phase 4: Documentation
1. Add JSDoc comments to component
2. Create usage examples in component file
3. Update any relevant documentation
