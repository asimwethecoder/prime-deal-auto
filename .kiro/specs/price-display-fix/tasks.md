# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Price Format with Decimal Inputs
  - **IMPORTANT**: Write this property-based test BEFORE implementing the fix
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - string inputs with decimals ("290000.00") and number inputs with decimals (290000.00)
  - Test that `formatPrice("290000.00")` returns "R290 000" (from Bug Condition in design)
  - Test that `formatPrice(290000.00)` returns "R290 000"
  - Test that `formatPrice("1500000.00")` returns "R1 500 000"
  - Assert output matches pattern `R[0-9 ]+` (no decimals, no commas)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "formatPrice('290000.00') returns 'R290 000,00' instead of 'R290 000'")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Buggy Input Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - **IMPORTANT**: Write these tests BEFORE implementing the fix
  - Observe: `formatPrice(290000)` returns correct value on unfixed code (integer input)
  - Observe: `formatMileage(50000)` returns "50 000 km" on unfixed code
  - Observe: `formatDate` and `formatRelativeTime` work correctly on unfixed code
  - Write property-based test: for all integer price values, output matches pattern `R[0-9 ]+`
  - Write test: `formatMileage` continues to format correctly with "km" suffix
  - Write test: `formatToZAR` alias continues to work identically to `formatPrice`
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for price display formatting bug

  - [x] 3.1 Implement the fix in formatPrice function
    - Update `frontend/lib/utils/format.ts`
    - Change parameter type from `number` to `number | string` to handle PostgreSQL DECIMAL strings
    - Add `Number()` conversion to handle string inputs
    - Add `Math.round()` to ensure integer output
    - Add `{ maximumFractionDigits: 0 }` option to `toLocaleString()`
    - Verify `formatToZAR` alias continues to reference updated function
    - _Bug_Condition: isBugCondition(input) where input is string with decimals OR number with fractional component_
    - _Expected_Behavior: formatPrice returns string matching pattern "R[0-9 ]+" with space thousands separator_
    - _Preservation: formatMileage, formatDate, formatRelativeTime, formatToZAR alias unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Price Format with Decimal Inputs
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify `formatPrice("290000.00")` = "R290 000"
    - Verify `formatPrice(290000.00)` = "R290 000"
    - Verify `formatPrice("1500000.00")` = "R1 500 000"
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Buggy Input Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm `formatPrice(290000)` still returns "R290 000"
    - Confirm `formatMileage(50000)` still returns "50 000 km"
    - Confirm `formatToZAR` alias still works correctly
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite for format utilities
  - Verify bug condition tests pass (fix working)
  - Verify preservation tests pass (no regressions)
  - Ensure all tests pass, ask the user if questions arise
