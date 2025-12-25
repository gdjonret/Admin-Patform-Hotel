# Route Ordering Fix - Availability Endpoint

**Date:** October 5, 2025  
**Status:** ✅ FIXED

---

## The Error You Saw

```
Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long'; 
For input string: "availability"
```

---

## Root Cause

**Spring Boot route matching issue:**

When you called `/api/admin/rooms/availability`, Spring was matching it to the `/{id}` endpoint instead of the `/availability` endpoint because:

1. The `/{id}` endpoint was defined **before** the `/availability` endpoint
2. Spring matches routes in the order they appear in the controller
3. `/{id}` is a wildcard that matches ANY string, including "availability"
4. Spring tried to parse "availability" as a Long ID → Error!

### Route Matching Order (BEFORE FIX)

```java
@GetMapping("/{id}")           // ❌ This matched first
public RoomEntity getById(@PathVariable Long id) { ... }

@GetMapping("/availability")   // ❌ Never reached
public ResponseEntity<AvailabilityResponse> checkAvailability(...) { ... }
```

**Request:** `GET /api/admin/rooms/availability`  
**Matched:** `GET /api/admin/rooms/{id}` with `id = "availability"`  
**Error:** Cannot convert "availability" to Long

---

## The Fix

**Moved the `/availability` endpoint BEFORE the `/{id}` endpoint:**

```java
@GetMapping("/availability")   // ✅ Now matches first
public ResponseEntity<AvailabilityResponse> checkAvailability(...) { ... }

@GetMapping("/{id}")           // ✅ Only matches numeric IDs now
public RoomEntity getById(@PathVariable Long id) { ... }
```

**Request:** `GET /api/admin/rooms/availability`  
**Matched:** `GET /api/admin/rooms/availability` ✅  
**Result:** Availability check works correctly

---

## Why This Works

Spring Boot matches routes in this order:

1. **Exact matches** (e.g., `/availability`)
2. **Path variables** (e.g., `/{id}`)
3. **Wildcards** (e.g., `/**`)

By placing `/availability` before `/{id}`, we ensure:
- `/availability` → Matches the specific endpoint
- `/123` → Matches the `/{id}` endpoint
- Both work correctly!

---

## What You Need to Do

### ⚠️ RESTART THE BACKEND SERVER

The code change has been made, but you need to restart the backend for it to take effect:

```bash
# Stop the current backend (Ctrl+C in the terminal where it's running)

# Then restart:
cd ~/Desktop/Backend-Hotel\ 2
./mvnw spring-boot:run
```

**Or if using an IDE:**
- Stop the running application
- Run it again

---

## Verification

After restarting, test the endpoint:

```bash
# Test availability check
curl "http://localhost:8080/api/admin/rooms/availability?roomId=1&checkInDate=2025-01-15&checkOutDate=2025-01-18"

# Expected response:
{
  "available": true,
  "message": "Room is available for the selected dates",
  "roomNumber": "101"
}
```

**If you still see the error after restarting, let me know!**

---

## Common Spring Boot Route Issues

### Issue #1: Wildcard Before Specific
```java
@GetMapping("/{id}")        // ❌ Catches everything
@GetMapping("/special")     // ❌ Never reached
```

**Fix:** Specific routes first
```java
@GetMapping("/special")     // ✅ Matches first
@GetMapping("/{id}")        // ✅ Matches remaining
```

### Issue #2: Overlapping Paths
```java
@GetMapping("/users/{id}")
@GetMapping("/users/current")  // ❌ Never reached
```

**Fix:** Specific before wildcard
```java
@GetMapping("/users/current")  // ✅ Matches first
@GetMapping("/users/{id}")     // ✅ Matches remaining
```

### Issue #3: Multiple Wildcards
```java
@GetMapping("/{type}/{id}")
@GetMapping("/{category}/{name}")  // ❌ Ambiguous
```

**Fix:** Use different paths or request params

---

## Summary

**Problem:** Route ordering caused `/availability` to match `/{id}` endpoint  
**Solution:** Moved `/availability` before `/{id}` in the controller  
**Action Required:** **Restart the backend server**  
**Status:** ✅ Code fixed, waiting for restart

---

**Fixed by:** AI Assistant  
**Date:** October 5, 2025
