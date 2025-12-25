# Room Status Not Updating - Root Cause Analysis

**Date:** October 5, 2025  
**Issue:** Room status not updating correctly when room becomes free

---

## Problem Description

When a room is assigned to a booking, it's marked as OCCUPIED immediately, even before the guest checks in. This causes issues with room availability.

---

## Root Cause

### Current Room Status Enum

```java
public enum RoomStatus {
    AVAILABLE,    // Room is ready and available for booking
    OCCUPIED,     // Room is currently occupied by a guest
    MAINTENANCE   // Room is under maintenance and unavailable
}
```

**Missing:** RESERVED status for rooms that are assigned but guest hasn't checked in yet!

---

## Current Flow (INCORRECT)

### Scenario: Booking for Tomorrow

```
Day 1 (Today):
1. Create booking for tomorrow
2. Assign room 101
   → Room 101 status = OCCUPIED ❌ (WRONG!)
   
Day 2 (Check-in day):
3. Guest checks in
   → Room 101 status = OCCUPIED (already was)
   
Day 3 (Check-out day):
4. Guest checks out
   → Room 101 status = AVAILABLE ✅
```

**Problem:** Room shows as OCCUPIED even though guest hasn't arrived yet!

---

## Impact

### 1. Room Appears Unavailable
- Room 101 assigned to booking for tomorrow
- Room 101 shows as OCCUPIED today
- Can't assign Room 101 to walk-in guest today
- Even though room is physically empty!

### 2. Housekeeping Confusion
- Housekeeping sees room as OCCUPIED
- But room is actually empty
- Wastes time checking empty rooms

### 3. Availability Reports Wrong
- Reports show fewer available rooms
- Affects revenue management
- Incorrect occupancy rates

---

## Correct Flow (SHOULD BE)

### With RESERVED Status

```
Day 1 (Today):
1. Create booking for tomorrow
2. Assign room 101
   → Room 101 status = RESERVED ✅
   
Day 2 (Check-in day):
3. Guest checks in
   → Room 101 status = OCCUPIED ✅
   
Day 3 (Check-out day):
4. Guest checks out
   → Room 101 status = AVAILABLE ✅
```

**Benefit:** Room status accurately reflects physical state!

---

## Code Analysis

### Where Room Status is Set

#### 1. Assign Room (RoomAssignmentService.java:84)
```java
// 7. Update room status to OCCUPIED
room.setStatus(RoomStatus.OCCUPIED);  // ❌ WRONG!
roomRepo.save(room);
```

**Should be:**
```java
// 7. Update room status to RESERVED
room.setStatus(RoomStatus.RESERVED);  // ✅ CORRECT
roomRepo.save(room);
```

---

#### 2. Check-in (AdminBookingController.java:131-138)
```java
// Update room status to OCCUPIED if room is assigned
if (booking.getRoomId() != null) {
    var roomOpt = roomJpaRepo.findById(booking.getRoomId());
    if (roomOpt.isPresent()) {
        var room = roomOpt.get();
        room.setStatus(RoomStatus.OCCUPIED);  // ✅ CORRECT
        roomJpaRepo.save(room);
    }
}
```

**This is correct!**

---

#### 3. Check-out (AdminBookingController.java:190-198)
```java
// Update room status to AVAILABLE if room is assigned
if (booking.getRoomId() != null) {
    var roomOpt = roomJpaRepo.findById(booking.getRoomId());
    if (roomOpt.isPresent()) {
        var room = roomOpt.get();
        room.setStatus(RoomStatus.AVAILABLE);  // ✅ CORRECT
        roomJpaRepo.save(room);
    }
}
```

**This is correct!**

---

#### 4. Unassign Room (RoomAssignmentService.java:167)
```java
// Set room status back to AVAILABLE
room.setStatus(RoomStatus.AVAILABLE);  // ✅ CORRECT
roomRepo.save(room);
```

**This is correct!**

---

#### 5. Cancel Booking (AdminBookingController.java:356-362)
```java
// If booking is cancelled, set room status back to AVAILABLE
if (status == BookingStatus.CANCELLED && booking.getRoomId() != null) {
    var roomOpt = roomJpaRepo.findById(booking.getRoomId());
    if (roomOpt.isPresent()) {
        var room = roomOpt.get();
        room.setStatus(RoomStatus.AVAILABLE);  // ✅ CORRECT
        roomJpaRepo.save(room);
    }
}
```

**This is correct!**

---

## Solution Options

### Option 1: Add RESERVED Status (RECOMMENDED)

**Changes Required:**
1. Add RESERVED to RoomStatus enum
2. Update assign room to use RESERVED
3. Update database migration
4. Update frontend to display RESERVED status

**Pros:**
- ✅ Accurate room status
- ✅ Better availability tracking
- ✅ Housekeeping clarity
- ✅ Industry standard

**Cons:**
- ⚠️ Requires database migration
- ⚠️ Requires frontend updates

---

### Option 2: Keep Room AVAILABLE Until Check-in (QUICK FIX)

**Changes Required:**
1. Don't change room status when assigning
2. Only set to OCCUPIED on check-in

**Pros:**
- ✅ No database migration
- ✅ Quick fix

**Cons:**
- ❌ Can't tell which rooms are reserved
- ❌ Might assign same room to multiple bookings
- ❌ Conflict detection relies only on booking table

---

### Option 3: Use Booking Status Instead (WORKAROUND)

**Changes Required:**
1. Don't update room status on assign
2. Check booking table for room availability

**Pros:**
- ✅ No enum changes
- ✅ Works with current code

**Cons:**
- ❌ Room status doesn't reflect reality
- ❌ More complex queries
- ❌ Performance impact

---

## Recommended Solution: Option 1

### Step 1: Add RESERVED Status

**File:** `RoomStatus.java`

```java
public enum RoomStatus {
    AVAILABLE,    // Room is ready and available for booking
    RESERVED,     // Room is assigned to a booking but guest hasn't checked in
    OCCUPIED,     // Room is currently occupied by a guest
    MAINTENANCE   // Room is under maintenance and unavailable
}
```

---

### Step 2: Database Migration

**File:** `V16__add_reserved_room_status.sql`

```sql
-- V16: Add RESERVED status to room_status enum

-- Note: PostgreSQL doesn't support adding enum values in a transaction
-- This must be run separately

-- Add RESERVED to the enum
ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'RESERVED' BEFORE 'OCCUPIED';

-- Update existing rooms that are assigned but not checked in
-- (This is a one-time data fix)
UPDATE rooms r
SET status = 'RESERVED'
WHERE status = 'OCCUPIED'
  AND EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.room_id = r.id
      AND b.status IN ('PENDING', 'CONFIRMED')
      AND b.status NOT IN ('CHECKED_IN', 'IN_HOUSE')
  );
```

---

### Step 3: Update Assign Room Logic

**File:** `RoomAssignmentService.java` (line 84)

```java
// 7. Update room status to RESERVED (not OCCUPIED)
room.setStatus(RoomStatus.RESERVED);
roomRepo.save(room);
```

---

### Step 4: Update Auto-Assign Logic

**File:** `RoomAssignmentService.java` (line 137)

```java
// Update room status to RESERVED (not OCCUPIED)
room.setStatus(RoomStatus.RESERVED);
roomRepo.save(room);
```

---

### Step 5: Update Room Availability Check

**File:** `RoomAssignmentService.java` (line 56)

```java
// 4. Validate room status (should be AVAILABLE)
if (room.getStatus() != RoomStatus.AVAILABLE) {
    throw new IllegalStateException(
        "Room " + room.getNumber() + " is not available. Current status: " + room.getStatus() +
        ". Please choose a different room or wait until it becomes available."
    );
}
```

**This stays the same** - only AVAILABLE rooms can be assigned.

---

### Step 6: Update Frontend Display

**File:** Frontend room status display

Add RESERVED status styling:
```javascript
const getStatusColor = (status) => {
  switch(status) {
    case 'AVAILABLE': return '#10b981'; // Green
    case 'RESERVED': return '#f59e0b';  // Orange (NEW)
    case 'OCCUPIED': return '#ef4444';  // Red
    case 'MAINTENANCE': return '#6b7280'; // Gray
    default: return '#6b7280';
  }
};
```

---

## Testing Plan

### Test Case 1: Assign Room Before Check-in

1. Create booking for tomorrow
2. Assign room 101
3. **Check:** Room 101 status = RESERVED ✅
4. **Check:** Room 101 NOT available for other bookings ✅
5. Guest checks in tomorrow
6. **Check:** Room 101 status = OCCUPIED ✅

---

### Test Case 2: Check-out Updates Status

1. Guest in room 101 checks out
2. **Check:** Room 101 status = AVAILABLE ✅
3. **Check:** Room 101 appears in available rooms list ✅

---

### Test Case 3: Unassign Room

1. Room 101 assigned to booking (status = RESERVED)
2. Unassign room from booking
3. **Check:** Room 101 status = AVAILABLE ✅

---

### Test Case 4: Cancel Booking

1. Room 101 assigned to booking (status = RESERVED)
2. Cancel the booking
3. **Check:** Room 101 status = AVAILABLE ✅

---

## Alternative: Quick Fix Without RESERVED

If you don't want to add RESERVED status, here's a quick fix:

### Keep Room AVAILABLE Until Check-in

**File:** `RoomAssignmentService.java` (line 83-85)

```java
// 6. Assign room and denormalize room number for display
booking.setRoomId(roomId);
booking.setRoomNumber(room.getNumber());
bookingRepo.save(booking);

// 7. DON'T update room status yet - wait until check-in
// room.setStatus(RoomStatus.OCCUPIED);  // ❌ Remove this
// roomRepo.save(room);                   // ❌ Remove this
```

**Pros:**
- ✅ Quick fix
- ✅ No migration needed

**Cons:**
- ❌ Room shows as AVAILABLE even though it's assigned
- ❌ Might confuse staff
- ❌ Relies entirely on booking conflict detection

---

## Recommendation

**Use Option 1: Add RESERVED Status**

**Reasoning:**
- Industry standard (hotels use RESERVED status)
- Accurate room tracking
- Better for reporting
- Clearer for staff
- Worth the migration effort

**Estimated Effort:**
- Backend: 30 minutes
- Migration: 10 minutes
- Frontend: 20 minutes
- Testing: 30 minutes
- **Total: 1.5 hours**

---

## Summary

### Current Problem
- ❌ Room set to OCCUPIED when assigned
- ❌ Room appears unavailable even when empty
- ❌ Confusing for staff and reports

### Root Cause
- Missing RESERVED status in enum
- Wrong status set on room assignment

### Solution
- ✅ Add RESERVED status
- ✅ Use RESERVED when assigning room
- ✅ Use OCCUPIED only on check-in
- ✅ Use AVAILABLE on check-out/unassign/cancel

---

**Which solution would you like to implement?**
1. **Add RESERVED status** (recommended, 1.5 hours)
2. **Quick fix** (don't update status on assign, 5 minutes)
