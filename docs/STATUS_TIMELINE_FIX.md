# Status Timeline Fix - Timestamp Tracking

**Date:** October 5, 2025  
**Status:** ✅ IMPLEMENTED

---

## Problem Solved

### Before Fix
```
Status Timeline:
✓ Created: Oct 5, 2025 2:46 PM  ✅
✓ Confirmed: —                  ❌ No timestamp
✓ Checked In: —                 ❌ No timestamp
✓ Checked Out: —                ❌ No timestamp
```

### After Fix
```
Status Timeline:
✓ Created: Oct 5, 2025 2:46 PM      ✅
✓ Confirmed: Oct 5, 2025 3:15 PM   ✅ Real timestamp
✓ Checked In: Oct 5, 2025 3:30 PM  ✅ Real timestamp
✓ Checked Out: Oct 5, 2025 4:00 PM ✅ Real timestamp
✓ Cancelled: Oct 5, 2025 3:45 PM   ✅ Shows if cancelled
```

---

## Changes Made

### 1. Database: New Timestamp Columns

**Migration:** `V15__add_status_timestamps.sql`

**New Columns:**
- `confirmed_at` (TIMESTAMPTZ) - When booking was confirmed
- `checked_in_at` (TIMESTAMPTZ) - When guest checked in
- `checked_out_at` (TIMESTAMPTZ) - When guest checked out
- `cancelled_at` (TIMESTAMPTZ) - When booking was cancelled

**Features:**
- ✅ Nullable (not required)
- ✅ Timezone-aware (TIMESTAMPTZ)
- ✅ Backfills existing data
- ✅ Documented with SQL comments

---

### 2. Backend Entity: Added Fields

**File:** `BookingEntity.java` (lines 115-126)

```java
// Status Change Timestamps
@Column(name = "confirmed_at", columnDefinition = "timestamptz")
private OffsetDateTime confirmedAt;

@Column(name = "checked_in_at", columnDefinition = "timestamptz")
private OffsetDateTime checkedInAt;

@Column(name = "checked_out_at", columnDefinition = "timestamptz")
private OffsetDateTime checkedOutAt;

@Column(name = "cancelled_at", columnDefinition = "timestamptz")
private OffsetDateTime cancelledAt;
```

**Added Getters/Setters:** Lines 213-223

---

### 3. Backend Controller: Set Timestamps

**File:** `AdminBookingController.java`

**Check-in Endpoint (line 125):**
```java
booking.setStatus(BookingStatus.CHECKED_IN);
booking.setCheckedInAt(OffsetDateTime.now());  // ✅ Set timestamp
```

**Check-out Endpoint (line 184):**
```java
booking.setStatus(BookingStatus.CHECKED_OUT);
booking.setCheckedOutAt(OffsetDateTime.now());  // ✅ Set timestamp
```

**Status Update Endpoint (lines 305-309):**
```java
if (status == BookingStatus.CONFIRMED) {
    booking.setConfirmedAt(OffsetDateTime.now());  // ✅ Set timestamp
} else if (status == BookingStatus.CANCELLED) {
    booking.setCancelledAt(OffsetDateTime.now());  // ✅ Set timestamp
}
```

---

### 4. Frontend: Display Timestamps

**File:** `ViewReservationModal.js` (lines 271-318)

**Before:**
```javascript
<h3>Confirmed</h3>
<p>—</p>  {/* ❌ Hardcoded */}
```

**After:**
```javascript
<h3>Confirmed</h3>
<p>{reservation.confirmedAt ? new Date(reservation.confirmedAt).toLocaleString() : "—"}</p>
```

**Applied to:**
- ✅ Confirmed timestamp
- ✅ Checked In timestamp
- ✅ Checked Out timestamp
- ✅ Cancelled timestamp (NEW - now shows cancelled events)

---

## Timeline Logic

### Display Rules

**Created:**
- Always shown
- Uses `createdAt` field

**Confirmed:**
- Shows if status is not PENDING OR if `confirmedAt` exists
- Uses `confirmedAt` field

**Checked In:**
- Shows if status is IN_HOUSE, CHECKED_OUT, or if `checkedInAt` exists
- Uses `checkedInAt` field

**Checked Out:**
- Shows if status is CHECKED_OUT or if `checkedOutAt` exists
- Uses `checkedOutAt` field

**Cancelled:**
- Shows if status is CANCELLED or if `cancelledAt` exists
- Uses `cancelledAt` field
- Special styling (red dot)

---

## Data Backfill

The migration script backfills existing bookings:

### CONFIRMED Bookings
```sql
SET confirmed_at = COALESCE(updated_at, created_at)
```

### CHECKED_IN Bookings
```sql
SET confirmed_at = COALESCE(updated_at, created_at),
    checked_in_at = COALESCE(updated_at, created_at)
```

### CHECKED_OUT Bookings
```sql
SET confirmed_at = created_at,
    checked_in_at = created_at,
    checked_out_at = COALESCE(updated_at, created_at)
```

### CANCELLED Bookings
```sql
SET cancelled_at = COALESCE(updated_at, created_at)
```

**Note:** Backfilled timestamps are approximate (based on updatedAt/createdAt)

---

## Installation Steps

### 1. Stop Backend
```bash
# Press Ctrl+C in backend terminal
```

### 2. Run Migration
```bash
cd ~/Desktop/Backend-Hotel\ 2
./mvnw flyway:migrate
```

**Expected Output:**
```
Successfully applied 1 migration to schema "public"
- V15__add_status_timestamps.sql
```

### 3. Restart Backend
```bash
./mvnw spring-boot:run
```

**Expected:** Server starts without errors

### 4. Verify Migration
```bash
# Check if columns exist
psql -d your_database -c "\d bookings"
```

Look for:
- confirmed_at | timestamp with time zone
- checked_in_at | timestamp with time zone
- checked_out_at | timestamp with time zone
- cancelled_at | timestamp with time zone

---

## Testing

### Test New Bookings

1. **Create a new booking**
   - Timeline shows: Created 

2. **Confirm the booking**
   - Timeline shows: Created , Confirmed 

3. **Check-in the guest**
   - Timeline shows: Created , Confirmed , Checked In 

4. **Check-out the guest**
   - Timeline shows: Created , Confirmed , Checked In , Checked Out 

5. **Cancel the booking**
   - Timeline shows: Created , Confirmed , Cancelled 

## Problem
The Status Timeline in the View Reservation Modal was only showing the "Created" timestamp with a date, while "Confirmed", "Checked In", and "Checked Out" showed "—" (dash) instead of actual timestamps.

## Root Cause
The backend `Booking` domain model was missing the timestamp fields (`confirmedAt`, `checkedInAt`, `checkedOutAt`, `cancelledAt`). These fields existed in `BookingEntity` (database layer) and were being set by the controller, but they weren't mapped to the domain model returned in API responses.

## Solution

### Backend Changes (Backend-Hotel 2)

**File: `src/main/java/org/example/backendhotel/domain/model/Booking.java`**

1. Added timestamp fields to the domain model:
```java
// Status change timestamps
private OffsetDateTime confirmedAt;
private OffsetDateTime checkedInAt;
private OffsetDateTime checkedOutAt;
private OffsetDateTime cancelledAt;
```

2. Added corresponding getters and setters for all four timestamp fields.

### How It Works

1. **BookingEntity** (database layer) already had the timestamp columns (lines 115-126)
2. **AdminBookingController** sets these timestamps when status changes:
   - `confirmedAt` - set when status changes to CONFIRMED (line 381)
   - `checkedInAt` - set when check-in endpoint is called (line 125)
   - `checkedOutAt` - set when check-out endpoint is called (line 184)
   - `cancelledAt` - set when status changes to CANCELLED (line 383)
3. **BookingMapper** (MapStruct) automatically maps these fields from entity to domain model
4. **API Response** now includes all timestamp fields
5. **Frontend** (useReservations.js) already maps these fields (lines 69-72)
6. **ViewReservationModal** displays timestamps in Status Timeline (lines 281-316)

### API Response Example

Before fix:
```json
{
  "id": 78,
  "status": "CONFIRMED",
  "createdAt": "2025-10-04T22:51:29.010704Z"
  // confirmedAt, checkedInAt, checkedOutAt were missing
}
```

After fix:
```json
{
  "id": 78,
  "bookingReference": "HLP251005-07F0",
  "status": "CONFIRMED",
  "createdAt": "2025-10-04T22:51:29.010704Z",
  "confirmedAt": "2025-10-05T10:05:42.797524Z",
  "checkedInAt": null,
  "checkedOutAt": null,
  "cancelledAt": null
}
```

## Files Modified

**Backend (Backend-Hotel 2):**
- `src/main/java/org/example/backendhotel/domain/model/Booking.java`
  - Added 4 timestamp fields (confirmedAt, checkedInAt, checkedOutAt, cancelledAt)
  - Added 8 getter/setter methods

## Status
Backend rebuilt and running on port 8080
Timestamps now included in all booking API responses
Status Timeline now displays all status change timestamps with actual dates/times
MapStruct automatically handles field mapping from entity to domain model

## Testing
Verified with API call:
```bash
curl 'http://localhost:8080/api/admin/bookings?size=1' | jq '.content[0] | {id, status, createdAt, confirmedAt, checkedInAt, checkedOutAt}'
---

## Benefits

### For Users
- ✅ See exact time of each status change
- ✅ Track booking history
- ✅ Better audit trail
- ✅ Shows cancelled events

### For Operations
- ✅ Track check-in/check-out times
- ✅ Measure processing times
- ✅ Audit compliance
- ✅ Dispute resolution

### For Developers
- ✅ Better debugging
- ✅ Analytics data
- ✅ Performance monitoring

---

## Troubleshooting

### Migration Fails

**Error:** "Column already exists"

**Solution:**
```sql
-- Manually check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('confirmed_at', 'checked_in_at', 'checked_out_at', 'cancelled_at');
```

If they exist, skip migration or modify script to use `IF NOT EXISTS`.

### Timestamps Still Show "—"

**Cause:** Backend not restarted after migration

**Solution:** Restart backend

### Old Bookings Show Wrong Times

**Expected:** Backfilled timestamps are approximate (based on updatedAt)

**Solution:** This is normal for existing data. New bookings will have accurate timestamps.

---

## Summary

### ✅ What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| Confirmed timestamp | ❌ Always "—" | ✅ Real time |
| Checked-in timestamp | ❌ Always "—" | ✅ Real time |
| Checked-out timestamp | ❌ Always "—" | ✅ Real time |
| Cancelled events | ❌ Not shown | ✅ Shown with time |
| Timeline accuracy | ❌ 25% (1/4) | ✅ 100% (4/4) |

### Status

**Status Timeline is now COMPLETE!** ✅

---

## Next Steps

1. **Run migration:** `./mvnw flyway:migrate`
2. **Restart backend:** `./mvnw spring-boot:run`
3. **Test timeline:** Create → Confirm → Check-in → Check-out
4. **Verify:** All timestamps appear correctly

---

**Implemented by:** AI Assistant  
**Date:** October 5, 2025  
**Status:** ✅ READY (after migration)
