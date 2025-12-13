# Implementation Plan

- [x] 1. Modify Google Sign-In API to check for existing users





  - Update `/api/auth/google-signin/route.js` to check if user exists before creating account
  - Return `requiresRegistration: true` flag when user doesn't exist
  - Return temporary Google data (email, googleId, photoURL, displayName) for new users
  - Maintain existing login flow for users who already have accounts
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Update login page to handle registration redirect





  - Modify `handleGoogleSignIn` function in `/login/page.js` to check for `requiresRegistration` flag
  - Store temporary Google data in sessionStorage when new user detected
  - Redirect to `/complete-registration` page for new users
  - Maintain existing flow for returning users
  - _Requirements: 1.1, 5.1_

- [x] 3. Create complete registration page




  - [x] 3.1 Create page structure and layout


    - Create `/app/(auth)/complete-registration/page.js` with neural network background matching existing auth pages
    - Implement responsive layout with proper spacing and styling
    - Add navigation header with Intelevo logo
    - _Requirements: 1.1, 4.1, 5.2_

  - [x] 3.2 Implement form components


    - Add read-only email field displaying Google-provided email with verification badge
    - Create name input fields (first name, middle name, last name, suffix)
    - Add role selection dropdown with options: student, instructor, admin
    - Display Google profile picture preview
    - Pre-populate name fields from Google displayName
    - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.3 Add form validation and submission


    - Validate required fields (first name, last name, role)
    - Implement form submission handler
    - Add loading states during submission
    - Handle success and error responses
    - Clear sessionStorage after successful registration
    - _Requirements: 1.5, 3.3, 5.3, 5.4_

  - [x] 3.4 Implement cancel and redirect logic


    - Add cancel button that returns to login page
    - Redirect to login if no Google temp data exists in sessionStorage
    - Redirect to dashboard after successful registration
    - _Requirements: 5.5_

- [x] 4. Create complete registration API endpoint






  - Create `/api/auth/complete-google-registration/route.js` endpoint
  - Validate all required fields (name, surname, role)
  - Check for duplicate email (race condition protection)
  - Create user document with Google data and user-provided information
  - Set `isVerified: true` and `authProvider: 'google'`
  - Generate JWT token and set httpOnly cookie
  - Return success response with token and user data
  - _Requirements: 1.5, 3.1, 3.2, 3.3, 3.4_

- [x] 5. Add error handling and user feedback





  - Implement error handling for OAuth failures in login page
  - Add error messages for validation failures on registration page
  - Handle duplicate email errors with appropriate messaging
  - Display loading indicators during async operations
  - Add success messages before redirects
  - _Requirements: 3.5, 5.1, 5.2, 5.3, 5.4_

- [x] 6. Add security measures





  - Implement input sanitization on server-side
  - Validate email format matches Google-provided email
  - Enforce role enum constraints
  - Add rate limiting to registration endpoint
  - Clear sensitive data from sessionStorage after use
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Write integration tests






  - Test complete flow for new Google user (OAuth → Registration → Dashboard)
  - Test existing Google user login flow
  - Test abandoned registration scenario
  - Test error scenarios (duplicate email, missing fields, invalid role)
  - Test session data handling and cleanup
  - _Requirements: All_
