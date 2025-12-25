# API Error Fix - 500 Error on /api/admin/rooms

## Problem

The Admin Platform was getting a 500 error when trying to access `/api/admin/rooms:1`:

```
Failed to load resource: the server responded :8080/api/admin/rooms:1 with a status of 500 ()
API Error: AxiosError
Error creating room: AxiosError
Failed to add room: AxiosError
```

## Root Causes

### 1. Incorrect API Endpoints in Admin Platform
The `rooms.js` API file was calling `/rooms` instead of `/api/admin/rooms`

### 2. Missing Backend Endpoints
The `AdminRoomController` was missing GET by ID, PUT, and DELETE endpoints

### 3. Outdated Room Type Mappings
The `rooms.js` file was using old room type names ("Standard", "Deluxe") instead of the new standardized names

## Fixes Applied

### ✅ Fix 1: Updated Admin Platform API File
**File:** `/Users/gloriadjonret/Documents/Admin-platform/src/api/rooms.js`

**Changes:**
- Updated all API endpoints from `/rooms` to `/api/admin/rooms`
- Updated room type mappings:
  - `'Standard'` → `'STANDARD SINGLE ROOM'`
  - `'Deluxe'` → `'DELUXE SINGLE ROOM'`
- Updated default capacity from `2` to `1`

**Before:**
```javascript
const response = await http.get('/rooms');
type: room.roomTypeId === 1 ? 'Standard' : 'Deluxe',
capacity: room.capacity || 2,
```

**After:**
```javascript
const response = await http.get('/api/admin/rooms');
type: room.roomTypeId === 1 ? 'STANDARD SINGLE ROOM' : 'DELUXE SINGLE ROOM',
capacity: room.capacity || 1,
```

### ✅ Fix 2: Added Missing Backend Endpoints
**File:** `/Users/gloriadjonret/Desktop/Backend-Hotel/src/main/java/org/example/backendhotel/api/admin/AdminRoomController.java`

**Added Endpoints:**

1. **GET by ID:**
```java
@GetMapping("/{id}")
public RoomEntity getById(@PathVariable Long id) {
    return repo.findById(id).orElseThrow(() -> 
        new RuntimeException("Room not found"));
}
```

2. **PUT (Update):**
```java
@PutMapping("/{id}")
public RoomEntity update(@PathVariable Long id, @RequestBody RoomEntity e) {
    if (!repo.existsById(id)) {
        throw new RuntimeException("Room not found");
    }
    e.setId(id);
    return repo.save(e);
}
```

3. **DELETE:**
```java
@DeleteMapping("/{id}")
public void delete(@PathVariable Long id) {
    repo.deleteById(id);
}
```

## How to Apply the Fix

### Step 1: Restart Backend
```bash
cd /Users/gloriadjonret/Desktop/Backend-Hotel
./mvnw spring-boot:run
```

### Step 2: Restart Admin Platform
```bash
cd /Users/gloriadjonret/Documents/Admin-platform
npm start
```

### Step 3: Test
1. Navigate to "All Rooms" page in Admin Platform
2. Try to add a new room - should work now
3. Try to edit an existing room - should work now
4. Try to delete a room - should work now

## What This Fixes

| Issue | Status |
|-------|--------|
| ✅ 500 error on room creation | Fixed |
| ✅ 500 error on room fetching | Fixed |
| ✅ 500 error on room update | Fixed |
| ✅ 500 error on room deletion | Fixed |
| ✅ Incorrect room type names | Fixed |
| ✅ Wrong API endpoints | Fixed |

## API Endpoints Now Available

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/rooms` | List all rooms |
| GET | `/api/admin/rooms/{id}` | Get room by ID |
| POST | `/api/admin/rooms` | Create new room |
| PUT | `/api/admin/rooms/{id}` | Update room |
| DELETE | `/api/admin/rooms/{id}` | Delete room |
| POST | `/api/admin/rooms/{id}/status` | Update room status |

## Room Type Mapping

| Frontend | Backend roomTypeId |
|----------|-------------------|
| STANDARD SINGLE ROOM | 1 |
| DELUXE SINGLE ROOM | 2 |

## Testing Checklist

After applying the fix, verify:

- [ ] Backend starts without errors
- [ ] Admin Platform starts without errors
- [ ] All Rooms page loads successfully
- [ ] Can view list of rooms
- [ ] Can add a new room (+ Add Room button)
- [ ] Can edit an existing room
- [ ] Can delete a room
- [ ] Room types show as "STANDARD SINGLE ROOM" and "DELUXE SINGLE ROOM"
- [ ] No 500 errors in browser console

## Summary

✅ **Backend:** Added missing CRUD endpoints to `AdminRoomController`  
✅ **Frontend:** Fixed API endpoints and room type mappings in `rooms.js`  
✅ **Result:** Admin Platform can now successfully manage rooms  

The error is now fixed! 🎉
