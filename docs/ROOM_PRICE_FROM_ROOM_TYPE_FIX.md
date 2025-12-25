# Room Price from Room Type Fix

## Issue
Room prices were not being displayed in the Assign Room modal because the `getAllRooms()` function wasn't including the price from the room type.

## Problem

### Before
**File:** `src/api/rooms.js` - `getAllRooms()` function

```javascript
return rooms.map(room => {
  const roomType = roomTypes.find(rt => rt.id === room.roomTypeId);
  
  return {
    id: room.id,
    number: room.number,
    roomTypeId: room.roomTypeId,
    type: roomType?.name || 'Unknown',
    capacity: roomType?.capacity || 2,
    // ❌ MISSING: price field
    status: mapRoomStatus(room.status),
    amenities: room.amenities ? room.amenities.split(',').map(a => a.trim()) : []
  };
});
```

**Result:** Rooms had no `price` property, causing:
- AssignRoomModal to crash when accessing `room.price`
- No price display in room selection

## Solution

### After
**File:** `src/api/rooms.js` - `getAllRooms()` function

```javascript
return rooms.map(room => {
  const roomType = roomTypes.find(rt => rt.id === room.roomTypeId);
  
  return {
    id: room.id,
    number: room.number,
    roomTypeId: room.roomTypeId,
    type: roomType?.name || 'Unknown',
    capacity: roomType?.capacity || 2,
    price: roomType?.baseRate || 0,  // ✅ ADDED: Get price from room type
    status: mapRoomStatus(room.status),
    amenities: room.amenities ? room.amenities.split(',').map(a => a.trim()) : []
  };
});
```

## How It Works

### Data Flow

1. **Backend stores prices in room_types table:**
   ```sql
   room_types:
   - id: 1
   - name: "DELUXE SINGLE ROOM"
   - base_rate: 25000  ← Price stored here
   - capacity: 2
   ```

2. **Rooms reference room types:**
   ```sql
   rooms:
   - id: 101
   - number: "101"
   - room_type_id: 1  ← Links to room type
   - status: "AVAILABLE"
   ```

3. **Frontend fetches both and joins:**
   ```javascript
   const [roomsResponse, roomTypesResponse] = await Promise.all([
     http.get('/api/admin/rooms'),
     http.get('/api/admin/room-types')
   ]);
   
   // Find matching room type
   const roomType = roomTypes.find(rt => rt.id === room.roomTypeId);
   
   // Get price from room type
   price: roomType?.baseRate || 0
   ```

4. **Result:**
   ```javascript
   {
     id: 101,
     number: "101",
     type: "Deluxe",
     price: 25000,  // ✅ From room type
     capacity: 2,
     status: "Available"
   }
   ```

## Why This Approach?

### ✅ Advantages

1. **Single Source of Truth**
   - Price is defined once in room_types table
   - All rooms of same type have same price
   - Easy to update prices (change once, affects all rooms)

2. **Consistency**
   - All Deluxe rooms cost the same
   - No price discrepancies between rooms

3. **Easier Management**
   - Change room type price → all rooms updated
   - No need to update individual rooms

### Example

```
Room Type: DELUXE SINGLE ROOM
Base Rate: 25,000 FCFA

Rooms using this type:
- Room 101 → 25,000 FCFA
- Room 102 → 25,000 FCFA
- Room 201 → 25,000 FCFA

If you change base_rate to 30,000:
- All three rooms now cost 30,000 FCFA
```

## Files Modified

1. **`src/api/rooms.js`** (line 24)
   - Added `price: roomType?.baseRate || 0` to getAllRooms() mapping

## Related Functions

The price is now correctly included in:

1. **`getAllRooms()`** ✅ - Returns all rooms with prices
2. **`getRoomById()`** ✅ - Already had price (line 80)
3. **`createRoom()`** ✅ - Already had price (line 116)

## Testing

### Test in Assign Room Modal

1. Go to **Arrivals** tab
2. Click **"Assign Room"** button
3. View available rooms

**Expected:**
```
Room 101
Deluxe
25 000 FCFA  ← Price now displays

Room 102
Standard
15 000 FCFA  ← Price now displays
```

### Verify Price Source

Check that price comes from room type:

```javascript
// In browser console
const rooms = await getAllRooms();
console.log(rooms[0]);

// Should show:
{
  id: 101,
  number: "101",
  type: "Deluxe",
  price: 25000,  // ✅ From room type baseRate
  capacity: 2
}
```

## Database Schema

### room_types table
```sql
CREATE TABLE room_types (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,  ← Price stored here
  capacity INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### rooms table
```sql
CREATE TABLE rooms (
  id BIGSERIAL PRIMARY KEY,
  number VARCHAR(10) NOT NULL UNIQUE,
  room_type_id BIGINT REFERENCES room_types(id),  ← Links to price
  status VARCHAR(20) NOT NULL,
  amenities TEXT
);
```

## Benefits

✅ **Prices now display** - AssignRoomModal shows correct prices  
✅ **Consistent pricing** - All rooms of same type cost the same  
✅ **Easy updates** - Change room type price once  
✅ **No crashes** - Price field always exists (defaults to 0)  
✅ **Proper formatting** - Uses formatFCFA for display  

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Price in getAllRooms()** | ❌ Missing | ✅ Included |
| **Price source** | ❌ Undefined | ✅ room_types.base_rate |
| **AssignRoomModal** | ❌ Crashes | ✅ Works |
| **Price display** | ❌ "0 FCFA" | ✅ "25 000 FCFA" |
| **Consistency** | ❌ N/A | ✅ Same type = same price |

---

**Status:** ✅ FIXED  
**Date:** October 5, 2025  
**Impact:** Room prices now correctly imported from room types
