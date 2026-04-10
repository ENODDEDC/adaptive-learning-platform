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

## MANDATORY Search Protocol (FOLLOW THIS EXACTLY)

⚠️ **BEFORE ANSWERING ANY QUESTION ABOUT CODE/UI, ASK YOURSELF:**
"Have I used grepSearch with the user's exact words yet?"
- If NO → STOP and use grepSearch NOW
- If YES and found nothing → Try 2-3 more search variations before responding

When user asks about ANY UI element, text, behavior, or code:

**STEP 1: Use grepSearch IMMEDIATELY (NOT OPTIONAL)**
- Search for the EXACT words the user mentions
- Example: User says "loading text" → grepSearch for "Loading" in src directory
- Example: User says "what shows when I click" → grepSearch for "onClick" in that component
- grepSearch works on ANY file size - use it first, always
- ⚠️ If you skip this step, you are failing the user

**STEP 2: If grepSearch finds it**
- Read the specific file and line numbers from results
- Quote the EXACT code found
- Answer the user's question with the actual code

**STEP 3: If file is truncated when reading**
- Read in chunks: lines 1-1000, then 1001-2000, then 2001-3000, etc.
- Keep reading until you find the code
- NEVER say "I can't find it" if the file has more lines to read
- ⚠️ Truncated file = incomplete search, keep reading
- ⚠️ **CRITICAL: If grepSearch shows line 990 but you only read to line 600, YOU MUST READ MORE**
- **Example: grepSearch finds "Loading Course Details" at line 990 → read lines 900-1100 to see it**

**STEP 4: If still not found after thorough search**
- Try 2-3 different search patterns (case variations, partial words)
- Search in parent/related components
- Check imported components
- Only then say "not found" and explain what you searched

**FORBIDDEN RESPONSES (will frustrate user):**
- ❌ "I don't see any loading state"
- ❌ "It's handled by the framework"
- ❌ "There's no custom code for that"
- ❌ Any answer without using grepSearch first

**REQUIRED RESPONSES:**
- ✅ "Found it at line X: [exact code quote]"
- ✅ "Searched 3 patterns, checked 5 files, not found in codebase"
- ✅ Always show what you searched for

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
