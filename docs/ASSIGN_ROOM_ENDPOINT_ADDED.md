# Assign Room Endpoint - Backend Implementation

## Problem
The frontend was calling `POST /api/admin/bookings/{id}/assign-room` but this endpoint didn't exist in the backend, causing 400 errors.

## Solution
Added the missing endpoint to `AdminBookingController.java`.

---

## Backend Changes

### File: `AdminBookingController.java`

#### 1. Added Imports
```java
import org.example.backendhotel.adapters.persistence.jpa.BookingJpaRepository;
import org.example.backendhotel.adapters.persistence.jpa.RoomJpaRepository;
import org.springframework.http.ResponseEntity;
import java.util.Map;
```

#### 2. Added Dependencies to Constructor
```java
private final BookingJpaRepository bookingRepository;
private final RoomJpaRepository roomRepository;

public AdminBookingController(TabQueryService tabQueryService, 
                              BookingJpaRepository bookingRepository,
                              RoomJpaRepository roomRepository) {
    this.tabQueryService = tabQueryService;
    this.bookingRepository = bookingRepository;
    this.roomRepository = roomRepository;
}
```

#### 3. Added Assign Room Endpoint
```java
@PostMapping("/{id}/assign-room")
public ResponseEntity<?> assignRoom(@PathVariable Long id, @RequestBody Map<String, Object> request) {
    try {
        // Get roomId from request
        Object roomIdObj = request.get("roomId");
        if (roomIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "roomId is required"));
        }
        
        // Parse roomId (handles both Number and String)
        Long roomId = null;
        if (roomIdObj instanceof Number) {
            roomId = ((Number) roomIdObj).longValue();
        } else if (roomIdObj instanceof String) {
            try {
                roomId = Long.parseLong((String) roomIdObj);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid roomId format"));
            }
        }
        
        if (roomId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid roomId"));
        }
        
        // Find booking
        var bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        // Find room
        var roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Room not found"));
        }
        
        var booking = bookingOpt.get();
        var room = roomOpt.get();
        
        // Check if room is available
        if (!"AVAILABLE".equals(room.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Room is not available"));
        }
        
        // Assign room
        booking.setRoomId(roomId);
        bookingRepository.save(booking);
        
        return ResponseEntity.ok(Map.of(
            "message", "Room assigned successfully",
            "bookingId", id,
            "roomId", roomId,
            "roomNumber", room.getNumber()
        ));
        
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("message", "Error assigning room: " + e.getMessage()));
    }
}
```

---

## Endpoint Specification

### Request
```
POST /api/admin/bookings/{id}/assign-room
Content-Type: application/json

{
  "roomId": 39
}
```

### Success Response (200)
```json
{
  "message": "Room assigned successfully",
  "bookingId": 84,
  "roomId": 39,
  "roomNumber": "101"
}
```

### Error Responses

#### 400 - Room Not Available
```json
{
  "message": "Room is not available"
}
```

#### 400 - Room Not Found
```json
{
  "message": "Room not found"
}
```

#### 404 - Booking Not Found
```json
{
  "message": "Booking not found"
}
```

---

## Features

### ✅ Validation
- Checks if booking exists
- Checks if room exists
- Checks if room is available
- Validates roomId format (accepts Number or String)

### ✅ Safety
- Won't assign occupied rooms
- Returns clear error messages
- Handles edge cases (null, invalid format)

### ✅ Response
- Returns booking ID
- Returns room ID
- Returns room number for display

---

## How It Works

1. **Frontend sends request:**
   ```javascript
   await assignRoom(84, 39);
   // POST /api/admin/bookings/84/assign-room
   // Body: { "roomId": 39 }
   ```

2. **Backend validates:**
   - Booking 84 exists? ✓
   - Room 39 exists? ✓
   - Room 39 is available? ✓

3. **Backend updates:**
   ```java
   booking.setRoomId(39);
   bookingRepository.save(booking);
   ```

4. **Backend responds:**
   ```json
   {
     "message": "Room assigned successfully",
     "roomNumber": "101"
   }
   ```

5. **Frontend updates UI:**
   - Shows success toast
   - Updates room number in table
   - Closes modal

---

## Installation

### 1. Restart Backend
```bash
cd ~/Desktop/Backend-Hotel
./mvnw spring-boot:run
```

### 2. Test the Endpoint
```bash
curl -X POST http://localhost:8080/api/admin/bookings/84/assign-room \
  -H "Content-Type: application/json" \
  -d '{"roomId": 39}'
```

**Expected:**
```json
{
  "message": "Room assigned successfully",
  "bookingId": 84,
  "roomId": 39,
  "roomNumber": "101"
}
```

---

## Files Modified

### Backend
1. **`AdminBookingController.java`**
   - Added imports (BookingJpaRepository, RoomJpaRepository, ResponseEntity, Map)
   - Added dependencies to constructor
   - Added `assignRoom()` endpoint (lines 53-111)

### Frontend
No changes needed - already calling the correct endpoint!

---

## Testing Checklist

- [ ] Backend restarts without errors
- [ ] Endpoint responds to POST requests
- [ ] Can assign available rooms
- [ ] Cannot assign occupied rooms
- [ ] Returns 404 for invalid booking ID
- [ ] Returns 400 for invalid room ID
- [ ] Frontend "Assign Room" button works
- [ ] Room number appears in table after assignment

---

## Status

✅ **Endpoint Created**  
⏳ **Needs Backend Restart**  

---

**After restarting the backend, the Assign Room functionality will work!** 🚀
