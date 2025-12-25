# Early Check-In Validation Fix

## Issue Identified
The check-in validation was preventing guests from checking in before their reservation date, which is too restrictive for hotel operations.

### Problem Scenario
- **Today**: October 5, 2025
- **Reservation check-in date**: October 7, 2025
- **Previous behavior**: ❌ Blocked check-in with error "L'arrivée ne peut pas être dans le passé"
- **Expected behavior**: ✅ Allow early check-in (common hotel practice)

## Root Cause
The `validateStay()` function in `src/lib/dates.js` was checking if the check-in date is before today and rejecting it. This validation is appropriate for **creating new reservations** but too strict for **checking in existing reservations**.

## Solution Implemented

### 1. Updated `validateStay()` Function (src/lib/dates.js)
Added a new optional parameter `skipPastDateCheck` to allow bypassing the past date validation:

```javascript
export function validateStay({
  checkInDate,
  checkOutDate,
  checkInTime,
  checkOutTime,
  tz = "Europe/Paris",
  skipPastDateCheck = false, // NEW: Allow skipping past date check for check-in process
}) {
  const errors = {};
  const today = todayYmdTZ(tz);

  if (!checkInDate) errors.checkInDate = "Date d'arrivée requise";
  if (!checkOutDate) errors.checkOutDate = "Date de départ requise";

  // Only validate against past dates if not skipped (for new reservations)
  // Skip this check during check-in to allow early arrivals
  if (!skipPastDateCheck && checkInDate && isBeforeYmd(checkInDate, today)) {
    errors.checkInDate = "L'arrivée ne peut pas être dans le passé";
  }
  
  // ... rest of validation
}
```

### 2. Updated CheckInConfirmModal (src/components/Reservations/modals/CheckInConfirmModal.js)
Modified the check-in validation to skip the past date check:

```javascript
const { ok, errors } = validateStay({
  checkInDate,
  checkOutDate,
  checkInTime: timeString,
  tz: "Europe/Paris",
  skipPastDateCheck: true, // Allow checking in before the reservation date (early arrivals)
});
```

## What This Fixes

### ✅ Now Allowed
1. **Early Check-In**: Guest with October 7 reservation can check in on October 5
2. **Same-Day Check-In**: Guest can check in on their reservation date
3. **Late Check-In**: Guest can check in after their reservation date (late arrival)

### ✅ Still Validated
1. Check-out date must be after check-in date
2. Same-day stays require check-out time after check-in time
3. Required fields validation

### ✅ Unchanged Behavior
- **New Reservation Creation**: Still validates that check-in date cannot be in the past
- **Edit Reservation**: Still uses the standard validation

## Files Modified
1. `/src/lib/dates.js` - Added `skipPastDateCheck` parameter to `validateStay()`
2. `/src/components/Reservations/modals/CheckInConfirmModal.js` 
   - Updated to use `skipPastDateCheck: true`
   - Added automatic calculation for actual nights on early arrivals (lines 166-171)
   - Added early arrival notice in booking summary (lines 595-607)
   - Added "Actual stay" indicator in room charge label (lines 613-617)

## Testing Recommendations
1. Create a reservation for a future date (e.g., October 7 - October 10, 3 nights)
2. Try to check in the guest today (e.g., October 5)
3. Verify that check-in is allowed without date validation errors
4. **Verify booking summary shows:**
   - Early arrival notice: "Charging for actual stay (5 nights) instead of reserved (3 nights)"
   - Room charge: "5 nights × 25,000 FCFA (Actual stay)"
   - Correct total based on 5 nights, not 3
5. Verify that other validations still work (room assignment, time validation, etc.)

## Impact
- **Positive**: Hotels can now handle early arrivals without workarounds
- **No Breaking Changes**: Existing reservation creation and editing still validates dates properly
- **Backward Compatible**: The `skipPastDateCheck` parameter defaults to `false`, maintaining existing behavior for other use cases
