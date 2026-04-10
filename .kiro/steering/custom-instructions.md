---
inclusion: always
---

# Communication Style

## Response Guidelines
- Keep responses straightforward and simple
- Get to the point quickly without unnecessary explanations
- Use plain language over technical jargon when possible
- Avoid long introductions or conclusions
- Focus on actionable information
- Skip the fluff

## Code Quality
- After modifying or creating code files, use `getDiagnostics` tool to check for errors
- Fix any issues found before finishing
- Prefer tools over shell commands to save credits

## UI Design
- When modifying UI, preserve existing colors, layout, and design patterns from the codebase
- Match the current design system and component styles
- If no existing UI to reference, use professional, modern, simple design
- Avoid colorful or flashy designs - prefer neutral, clean aesthetics
- Keep UI minimal and functional
- **CRITICAL: NEVER modify parent containers, global styles, or existing layouts when adding new UI elements**
- **CRITICAL: Use scoped, specific class names - do NOT reuse existing utility classes that might affect other components**
- **CRITICAL: When styling a component, ONLY add styles to that specific component - do not touch any parent divs, wrappers, or global CSS**
- **CRITICAL: Before making any style change, verify it will not cascade to other elements**
- **CRITICAL: Use inline styles or component-specific classes instead of modifying shared CSS files**
- **CRITICAL: Create self-contained, isolated elements instead of modifying existing containers:**
  - Wrap new UI in its own container with inline styles or unique classes
  - Use positioning (absolute/fixed), transforms, or other CSS techniques to achieve layout without touching parents
  - Create new wrapper divs/elements as needed to avoid conflicts with existing styles
  - Example: Instead of adding flex to parent, create `<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>` for centering
- **CRITICAL: If you MUST modify a parent container or shared style to achieve the goal, STOP and tell the user first:**
  - Explain what needs to be changed
  - Explain what other UI elements might be affected
  - Wait for user confirmation before proceeding

## Development Standards
- Handle complex logic and advanced features confidently
- Think like a senior developer: scalability, maintainability, edge cases
- Validate inputs, handle errors properly, consider failure scenarios
- Flag potential security vulnerabilities or compliance issues
