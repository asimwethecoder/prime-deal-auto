# Price Display Fix - Bugfix Design

## Overview

Car prices display incorrectly across the frontend, showing values like "R290.00" instead of "R290 000". The root cause is that PostgreSQL DECIMAL(12,2) returns prices as strings like "290000.00", and the `formatPrice` function in `frontend/lib/utils/format.ts` doesn't handle this properly—it passes the value directly to `toLocaleString()` without converting to an integer or suppressing decimal places.

The fix involves updating `formatPrice` to convert input to an integer and use `toLocaleString` with `{ maximumFractionDigits: 0 }` to ensure consistent whole-number formatting.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug—when `formatPrice` receives a price value (string or number with decimals) and formats it without integer conversion
- **Property (P)**: The desired behavior—prices display as whole numbers with space thousands separator and R prefix (e.g., "R290 000")
- **Preservation**: Existing admin dashboard formatting, mileage formatting, and API value handling that must remain unchanged
- **formatPrice**: The function in `frontend/lib/utils/format.ts` that formats numeric prices for display
- **DECIMAL(12,2)**: PostgreSQL column type that returns values as strings with two decimal places (e.g., "290000.00")

## Bug Details

### Bug Condition

The bug manifests when the `formatPrice` function receives a price value from the API. PostgreSQL DECIMAL(12,2) columns return values as strings like "290000.00". The current implementation passes this directly to `toLocaleString()` without:
1. Converting the string to a number
2. Rounding to an integer
3. Suppressing decimal places in the output

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PriceValue (string | number)
  OUTPUT: boolean
  
  RETURN (typeof input === 'string' AND input contains decimal point)
         OR (typeof input === 'number' AND input has fractional component)
         OR formatPrice does not enforce integer conversion
         OR toLocaleString options do not include maximumFractionDigits: 0
END FUNCTION
```

### Examples

- Input: `"290000.00"` (string from PostgreSQL) → Current: "R290 000,00" or "R290.00" → Expected: "R290 000"
- Input: `290000.00` (number with decimals) → Current: "R290 000,00" → Expected: "R290 000"
- Input: `290000` (integer) → Current: "R290 000" → Expected: "R290 000" (works correctly)
- Input: `0` (edge case) → Expected: "R0"

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Admin dashboard price display must continue to work correctly
- `formatMileage` function must continue to format mileage with thousands separators and "km" suffix
- Price values in API requests (filters, sorting) must continue to be sent as numeric values
- HeroSearch component abbreviated prices (e.g., "R250k", "R1M") must continue to work

**Scope:**
All inputs that do NOT involve the `formatPrice` function should be completely unaffected by this fix. This includes:
- Mileage formatting via `formatMileage`
- Date formatting via `formatDate` and `formatRelativeTime`
- Admin form price input handling
- API request/response price values

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Missing Type Coercion**: The `formatPrice` function accepts `price: number` but PostgreSQL DECIMAL returns strings. When a string like "290000.00" is passed, JavaScript may not handle it correctly.

2. **Missing Integer Conversion**: Even when the value is a number, if it has a fractional component (e.g., `290000.00`), `toLocaleString()` will include decimal places in the output.

3. **Missing toLocaleString Options**: The current implementation doesn't specify `maximumFractionDigits: 0`, so the locale's default decimal handling applies.

4. **Inconsistent Data Flow**: Some components may receive price as a string from the API response, while the function signature expects a number.

## Correctness Properties

Property 1: Bug Condition - Price Format Correctness

_For any_ price value (string or number, with or without decimals) passed to `formatPrice`, the fixed function SHALL return a string matching the pattern `R[0-9 ]+` (R prefix followed by digits and spaces only, no decimals), with space as thousands separator.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Price Formatting Behavior

_For any_ input that is NOT processed by `formatPrice` (mileage values, dates, API request values), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for non-price formatting.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `frontend/lib/utils/format.ts`

**Function**: `formatPrice`

**Specific Changes**:

1. **Accept string or number input**: Change the parameter type from `number` to `number | string` to handle PostgreSQL DECIMAL strings.

2. **Convert to number**: Use `Number()` or `parseFloat()` to convert string inputs to numbers.

3. **Round to integer**: Use `Math.round()` to ensure the value is a whole number (handles floating-point precision issues).

4. **Suppress decimals in output**: Add `{ maximumFractionDigits: 0 }` option to `toLocaleString()`.

5. **Update formatToZAR alias**: Ensure the alias continues to reference the updated function.

**Updated Implementation**:
```typescript
export function formatPrice(price: number | string): string {
  const numericPrice = Math.round(Number(price));
  return `R${numericPrice.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that call `formatPrice` with various input types (strings with decimals, numbers with decimals, integers) and assert the output format. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **String with decimals**: `formatPrice("290000.00")` should return "R290 000" (will fail on unfixed code)
2. **Number with decimals**: `formatPrice(290000.00)` should return "R290 000" (may fail on unfixed code)
3. **Large price string**: `formatPrice("1500000.00")` should return "R1 500 000" (will fail on unfixed code)
4. **Zero price**: `formatPrice(0)` should return "R0" (may pass on unfixed code)

**Expected Counterexamples**:
- String inputs produce incorrect output or NaN
- Decimal places appear in formatted output
- Possible causes: missing type coercion, missing integer conversion, missing toLocaleString options

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := formatPrice_fixed(input)
  ASSERT result matches pattern "R[0-9 ]+"
  ASSERT result does not contain "." or ","
  ASSERT formatPrice_fixed("290000.00") = "R290 000"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT formatMileage_original(input) = formatMileage_fixed(input)
  ASSERT formatDate_original(input) = formatDate_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for integer inputs and mileage formatting, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Integer Input Preservation**: Verify `formatPrice(290000)` continues to return "R290 000"
2. **Mileage Formatting Preservation**: Verify `formatMileage(50000)` continues to return "50 000 km"
3. **Date Formatting Preservation**: Verify `formatDate` continues to work correctly
4. **formatToZAR Alias Preservation**: Verify the alias continues to work identically to `formatPrice`

### Unit Tests

- Test `formatPrice` with string inputs ("290000.00", "1500000.00", "0.00")
- Test `formatPrice` with number inputs (290000, 290000.00, 0)
- Test edge cases (negative prices, very large prices, NaN handling)
- Test that `formatMileage` continues to work correctly

### Property-Based Tests

- Generate random price values (integers and decimals) and verify output matches pattern `R[0-9 ]+`
- Generate random integer prices and verify output is identical before and after fix
- Test that all formatted prices have no decimal separator

### Integration Tests

- Test car detail page displays prices correctly
- Test CarCard component displays prices correctly
- Test admin dashboard continues to display prices correctly
