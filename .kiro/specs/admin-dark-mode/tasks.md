# Implementation Plan

- [x] 1. Set up theme infrastructure




  - Create ThemeContext provider with theme state management
  - Implement localStorage persistence for theme preference
  - Add system preference detection on initial load
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 1.1 Create ThemeContext


  - Write `src/contexts/ThemeContext.js` with React Context
  - Implement theme state (light/dark)
  - Implement toggleTheme function
  - Add localStorage get/set logic
  - Add document root class manipulation (add/remove 'dark')
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 1.2 Create ThemeToggle component


  - Write `src/components/ThemeToggle.js`
  - Add sun/moon icon SVGs
  - Implement toggle button with onClick handler
  - Add smooth transition animations
  - Add keyboard accessibility (Enter/Space keys)
  - _Requirements: 1.1, 1.5_

- [x] 1.3 Update admin layout


  - Modify `src/app/admin/layout.js` to wrap with ThemeProvider
  - Add ThemeToggle component to navigation/header
  - Ensure all admin routes are wrapped
  - _Requirements: 1.1, 1.5_

- [x] 2. Simplify color palette across all pages




  - Replace varied colors with 3-color palette (Purple, Indigo, Gray)
  - Update all stat cards, buttons, and badges
  - Keep red only for destructive actions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2.1 Update admin courses page colors


  - Replace blue stat card icons with purple
  - Replace green stat card icons with indigo
  - Replace orange stat card icons with gray
  - Update all button colors to purple/indigo/gray
  - Update badge colors to match palette
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2.2 Update admin users page colors



  - Replace blue elements with purple
  - Replace green elements with indigo
  - Update stat cards to use consistent palette
  - Update role badges to use purple/indigo/gray
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2.3 Update admin dashboard colors


  - Simplify stat card colors to purple/indigo/gray
  - Update chart colors if present
  - Update all action buttons
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2.4 Update feed management page colors


  - Replace varied badge colors with palette
  - Update filter buttons
  - Update action buttons
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2.5 Update member management page colors




  - Update role badges to purple/indigo/gray
  - Update action buttons
  - Update stat cards
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Add dark mode classes to admin courses page



  - Add dark mode background classes (dark:bg-gray-900, dark:bg-gray-800)
  - Add dark mode text classes (dark:text-gray-100, dark:text-gray-300)
  - Add dark mode border classes (dark:border-gray-700)
  - Update stat cards, search inputs, filters, course cards, modals
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_


- [x] 3.1 Update courses page container and layout

  - Add `dark:bg-gray-900` to main container
  - Add `dark:text-gray-100` to headings
  - Add `dark:text-gray-300` to descriptions
  - _Requirements: 3.1, 3.2, 3.3, 3.4_


- [x] 3.2 Update courses page stat cards
  - Add `dark:bg-gray-800` to card backgrounds
  - Add `dark:border-gray-700` to card borders
  - Add `dark:text-gray-100` to stat numbers
  - Add `dark:text-gray-400` to stat labels
  - _Requirements: 3.1, 3.8, 4.3_

- [x] 3.3 Update courses page search and filters

  - Add `dark:bg-gray-800` to search container
  - Add `dark:bg-gray-700` to input backgrounds
  - Add `dark:text-gray-100` to input text
  - Add `dark:border-gray-600` to input borders
  - Add `dark:placeholder-gray-500` to placeholders
  - _Requirements: 3.1, 3.7, 4.5_


- [x] 3.4 Update courses page course cards
  - Add `dark:bg-gray-800` to card backgrounds
  - Add `dark:border-gray-700` to card borders
  - Add `dark:text-gray-100` to course titles
  - Add `dark:text-gray-400` to course descriptions
  - Add `dark:hover:bg-gray-750` to hover states
  - _Requirements: 3.1, 3.8, 5.2_


- [x] 3.5 Update courses page modals
  - Add `dark:bg-gray-800` to modal backgrounds
  - Add `dark:border-gray-700` to modal borders
  - Update modal header backgrounds
  - Update modal content text colors
  - _Requirements: 3.1, 3.6_

- [x] 3.6 Update courses page pagination







  - Add dark mode classes to pagination controls
  - Update button backgrounds and borders
  - Update active page indicator
  - _Requirements: 3.1, 3.7_

- [x] 4. Add dark mode classes to admin users page





  - Add dark mode to page container, stat cards, search, table, modals
  - Follow same pattern as courses page
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 4.1 Update users page layout and stats


  - Add dark mode classes to main container
  - Update stat cards with dark backgrounds
  - Update text colors for dark mode
  - _Requirements: 3.1, 3.2, 3.3, 3.8_


- [x] 4.2 Update users page table

  - Add `dark:bg-gray-800` to table background
  - Add `dark:border-gray-700` to table borders
  - Add `dark:bg-gray-750` to table header
  - Add `dark:hover:bg-gray-700` to row hover
  - Add dark mode to table cells and text
  - _Requirements: 3.1, 3.8, 4.6_

- [x] 4.3 Update users page forms and modals


  - Add dark mode to create user modal
  - Update form inputs with dark backgrounds
  - Update form labels and placeholders
  - _Requirements: 3.1, 3.6, 3.7, 4.5_

- [x] 5. Add dark mode classes to admin dashboard page





  - Add dark mode to all dashboard components
  - Update charts if present
  - Update widgets and cards
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 6. Add dark mode classes to feed management page





  - Add dark mode to feed list, filters, tabs
  - Update announcement cards
  - Update activity items
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 7. Add dark mode classes to member management page





  - Add dark mode to member list, filters, stats
  - Update member cards
  - Update role change modal
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 8. Add dark mode classes to remaining admin pages





  - Add dark mode to Analytics page
  - Add dark mode to Settings page
  - Add dark mode to any other admin pages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 9. Test and polish dark mode implementation





  - Test theme toggle functionality
  - Test localStorage persistence
  - Verify all pages in both themes
  - Check accessibility contrast ratios
  - Fix any visual inconsistencies
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
