# Bugfix Requirements Document

## Introduction

Car prices display incorrectly across the frontend, showing values like "R290.00" instead of the correct "R290 000". The backend correctly stores and returns prices (e.g., 290000), but the frontend formatting produces incorrect output. This affects user trust and makes the site appear broken, as prices look like R290 instead of R290,000.

The admin dashboard displays prices correctly ("R290 000"), indicating the bug is isolated to specific frontend components or a data type handling issue in the price formatting utility.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a car price is displayed on the car detail page THEN the system shows the price with incorrect decimal formatting (e.g., "R290.00" instead of "R290 000")

1.2 WHEN a car price is displayed on the CarCard component THEN the system shows the price with incorrect decimal formatting (e.g., "R290.00" instead of "R290 000")

1.3 WHEN the formatPrice utility receives a price value from the API THEN the system may receive a string representation of a DECIMAL(12,2) value (e.g., "290000.00") which gets parsed as a float and formatted with decimals

1.4 WHEN toLocaleString('en-ZA') is called on a price value with decimal places THEN the system includes the decimal portion in the output (e.g., 290.00 → "R290,00" or "R290.00")

### Expected Behavior (Correct)

2.1 WHEN a car price is displayed on the car detail page THEN the system SHALL show the price as a whole number with space as thousands separator and R prefix (e.g., "R290 000")

2.2 WHEN a car price is displayed on the CarCard component THEN the system SHALL show the price as a whole number with space as thousands separator and R prefix (e.g., "R290 000")

2.3 WHEN the formatPrice utility receives a price value THEN the system SHALL convert it to an integer (Math.round or Math.floor) before formatting to ensure no decimal places appear

2.4 WHEN toLocaleString('en-ZA') is called for price formatting THEN the system SHALL use options to suppress decimal places: `{ maximumFractionDigits: 0 }`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the admin dashboard displays car prices THEN the system SHALL CONTINUE TO show prices correctly formatted as "R290 000"

3.2 WHEN the formatMileage utility formats mileage values THEN the system SHALL CONTINUE TO format mileage correctly with thousands separators and "km" suffix

3.3 WHEN prices are submitted via the admin car creation form THEN the system SHALL CONTINUE TO accept and store prices as numeric values

3.4 WHEN the HeroSearch component displays price filter options THEN the system SHALL CONTINUE TO show abbreviated prices (e.g., "R250k", "R1M")

3.5 WHEN prices are used in API requests (filters, sorting) THEN the system SHALL CONTINUE TO send numeric values without formatting

## Root Cause Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type PriceDisplayInput
  OUTPUT: boolean
  
  // Bug occurs when price value has decimal places or is not explicitly
  // converted to integer before formatting
  RETURN X.price has decimal component OR
         formatPrice does not enforce integer conversion OR
         toLocaleString options do not suppress decimals
END FUNCTION
```

### Property Specification

```pascal
// Property: Fix Checking - Price Display Format
FOR ALL X WHERE isBugCondition(X) DO
  result ← formatPrice'(X.price)
  ASSERT result matches pattern "R[0-9 ]+" (no decimals)
  ASSERT result uses space as thousands separator
  ASSERT formatPrice'(290000) = "R290 000"
  ASSERT formatPrice'(290000.00) = "R290 000"
  ASSERT formatPrice'("290000.00") = "R290 000"
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  // Admin dashboard, mileage formatting, API values unchanged
  ASSERT F(X) = F'(X)
END FOR
```

## Technical Notes

- Database schema: `price DECIMAL(12, 2)` - PostgreSQL returns this as string "290000.00"
- Current formatPrice: `return \`R${price.toLocaleString('en-ZA')}\``
- Fix location: `frontend/lib/utils/format.ts` - formatPrice function
- South African locale (en-ZA) uses space as thousands separator, comma as decimal separator
- Car prices should never show cents/decimals in this application
