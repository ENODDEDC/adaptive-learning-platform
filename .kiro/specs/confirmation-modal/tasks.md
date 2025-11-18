# Implementation Plan

- [ ] 1. Set up testing infrastructure
  - Install fast-check library for property-based testing
  - Configure Jest for React component testing
  - Verify @testing-library/react and @testing-library/user-event are available
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Create ConfirmationModal component
  - [x] 2.1 Create component file with TypeScript-style JSDoc
    - Create src/components/ConfirmationModal.js
    - Define prop types with JSDoc comments
    - Set up component structure with Headless UI Dialog
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Implement modal UI and styling
    - Add backdrop overlay with blur effect
    - Create modal container with animations
    - Add icon display based on variant prop
    - Style title and message sections
    - Create confirm and cancel buttons with variant styling
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 2.3 Implement interaction handlers
    - Add onClick handler for confirm button
    - Add onClick handler for cancel button
    - Add onClick handler for overlay
    - Add Escape key handler
    - Implement loading state for async actions
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 2.4 Add accessibility features
    - Add ARIA attributes (role, aria-modal, aria-labelledby)
    - Implement focus trap
    - Add focus management on open/close
    - Ensure keyboard navigation works correctly
    - _Requirements: 7.4_

  - [ ]* 2.5 Write property test for modal display
    - **Property 1: Modal display replaces native dialogs**
    - **Validates: Requirements 1.1**

  - [ ]* 2.6 Write property test for required elements
    - **Property 2: Modal contains required elements**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ]* 2.7 Write property test for overlay interaction
    - **Property 3: Overlay prevents background interaction**
    - **Validates: Requirements 1.5**

  - [ ]* 2.8 Write property test for confirm button
    - **Property 4: Confirm button executes action**
    - **Validates: Requirements 2.2, 3.2, 4.2, 5.2, 6.4**

  - [ ]* 2.9 Write property test for cancel button
    - **Property 5: Cancel button closes without executing**
    - **Validates: Requirements 2.3, 3.3, 4.3, 5.3, 6.1**

  - [ ]* 2.10 Write property test for overlay click
    - **Property 6: Overlay click closes modal**
    - **Validates: Requirements 6.2**

  - [ ]* 2.11 Write property test for Escape key
    - **Property 7: Escape key closes modal**
    - **Validates: Requirements 6.3**

  - [ ]* 2.12 Write property test for props customization
    - **Property 8: Props customize modal content**
    - **Validates: Requirements 7.1**

  - [ ]* 2.13 Write property test for callback invocation
    - **Property 9: Callbacks are invoked correctly**
    - **Validates: Requirements 7.2**

  - [ ]* 2.14 Write property test for accessibility
    - **Property 10: Accessibility attributes present**
    - **Validates: Requirements 7.4**

- [ ] 3. Checkpoint - Ensure component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create confirmation configurations
  - [x] 4.1 Define confirmation type constants
    - Create configuration object for each confirmation type
    - Define titles, messages, button labels, and variants
    - Add icon components for each type
    - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [x] 5. Integrate modal into course detail page
  - [x] 5.1 Add modal state management
    - Add confirmationModal state to track open/closed and type
    - Create openConfirmation helper function
    - Create closeConfirmation helper function
    - Create handleConfirmAction function with switch statement
    - _Requirements: 2.1, 3.1, 4.1, 5.1_

  - [x] 5.2 Replace window.confirm in handleLeaveCourse
    - Remove window.confirm call
    - Update to use openConfirmation('leave-course')
    - Move API logic to executeLeaveCourse function
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.3 Replace window.confirm in handleArchiveCourse
    - Remove window.confirm call
    - Update to use openConfirmation('delete-course')
    - Move API logic to executeArchiveCourse function
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.4 Replace window.confirm in handleRemoveUser
    - N/A - Remove user functionality not found in current implementation
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.5 Replace window.confirm in handleDeleteClasswork
    - Remove window.confirm call
    - Update to use openConfirmation('delete-classwork', { classworkId })
    - Move API logic to executeDeleteClasswork function
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.6 Render ConfirmationModal component
    - Import ConfirmationModal component
    - Add ConfirmationModal to JSX with appropriate props
    - Wire up confirmation modal state and handlers
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 6. Write integration tests for course page
  - Test leave course flow end-to-end
  - Test delete course flow end-to-end
  - Test remove user flow end-to-end
  - Test delete classwork flow end-to-end
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [ ] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


## Additional Implementation

Beyond the original spec, the confirmation modal was also integrated into:

- [x] **ClassworkTab Component** (`src/components/ClassworkTab.js`)
  - Replaced window.confirm for delete classwork action
  - Added confirmation modal state and handlers
  - Integrated modal into component JSX

- [x] **StreamTab Component** (`src/components/StreamTab.js`)
  - Replaced window.confirm for delete announcement action (2 locations)
  - Added confirmation modal state and handlers
  - Integrated modal into component JSX

These additional integrations ensure a consistent confirmation experience across all course-related destructive actions in the application.
