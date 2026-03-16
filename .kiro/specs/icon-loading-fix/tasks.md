# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Lucide Icons Make Unnecessary Network Requests
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: Lucide icon names like "check", "arrow-left", "x"
  - Test that `DynamicIcon name="check"` does NOT make a HEAD request to `/icons/check.svg`
  - Test that `DynamicIcon name="check"` does NOT show a loading state before rendering
  - Test that `DynamicIcon name="check"` renders the Lucide Check icon immediately
  - Bug Condition: `getLucideIcon(name) IS NOT NULL AND NOT svgExistsInPublicIcons(name)`
  - Expected Behavior: Lucide icons resolve synchronously without network requests or loading states
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists: HEAD request is made, loading state shown)
  - Document counterexamples found (e.g., "DynamicIcon name='check' makes HEAD request to /icons/check.svg returning 404")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Custom SVG Loading Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `DynamicIcon name="audi-svgrepo-com"` loads SVG from `/icons/audi-svgrepo-com.svg` on unfixed code
  - Observe: `DynamicIcon name="nonexistent"` shows "?" placeholder on unfixed code
  - Observe: Props (width, height, className, aria-hidden) are applied correctly on unfixed code
  - Write property-based test: for all non-Lucide icon names, behavior matches original component
  - Test custom SVG icons (brand logos) continue to load correctly
  - Test fallback placeholder shows for icons not in Lucide or custom SVGs
  - Test all props continue to be applied correctly
  - Preservation scope: All inputs where `getLucideIcon(name) IS NULL` (non-Lucide icons)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix DynamicIcon component to check Lucide icons first

  - [x] 3.1 Implement the fix in DynamicIcon.tsx
    - Add module-level SVG existence cache (`Map<string, boolean>`) to prevent duplicate HEAD requests
    - Check Lucide icons FIRST (synchronous) before any async operations
    - If Lucide icon exists, render immediately without network request or loading state
    - Only show loading state when checking for custom SVGs (non-Lucide icons)
    - For non-Lucide icons: check cache → if miss, make HEAD request → cache result → render
    - Optimize resolution order: Lucide → cache check → HEAD request
    - _Bug_Condition: getLucideIcon(name) IS NOT NULL AND NOT svgExistsInPublicIcons(name)_
    - _Expected_Behavior: Lucide icons render immediately without network requests or loading states_
    - _Preservation: Custom SVG loading, fallback placeholder, and prop handling unchanged_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Lucide Icons Resolve Synchronously
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - no HEAD requests, no loading state for Lucide icons)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Custom SVG Loading Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm custom SVG icons still load correctly
    - Confirm fallback placeholder still works
    - Confirm all props still applied correctly

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify no 404 errors in browser console for Lucide icons like "check"
  - Verify Checkbox component renders without network errors
  - Verify brand icons (audi, bmw, etc.) still load correctly
