# Edit Reservation Troubleshooting Guide

**Date:** October 5, 2025

---

## Error: "Update Failed"

### Possible Causes & Solutions

---

### 1. Backend Not Restarted

**Symptom:** Error: "404 Not Found" or "Cannot PUT /api/admin/bookings/123"

**Cause:** New endpoint not loaded

**Solution:**
```bash
cd ~/Desktop/Backend-Hotel\ 2
# Stop backend (Ctrl+C)
./mvnw spring-boot:run
```

**Verify:**
```bash
curl -X PUT http://localhost:8080/api/admin/bookings/1 \
  -H "Content-Type: application/json" \
  -d '{"guestName":"Test"}'
```

Expected: Should not return 404

---

### 2. Date Format Issue

**Symptom:** Error: "Failed to convert value" or "Invalid date format"

**Cause:** Dates sent as Date objects instead of strings

**Fix Applied:** ✅ Added `formatDate()` function to convert dates to YYYY-MM-DD

**Verify in Console:**
Look for: `Update payload: { checkInDate: "2025-01-15", ... }`

If you see: `checkInDate: Mon Jan 15 2025...` → Date object (BAD)  
Should be: `checkInDate: "2025-01-15"` → String (GOOD)

---

### 3. Missing Required Fields

**Symptom:** Error: "Booking not found" or validation error

**Cause:** Required fields are null or empty

**Check Console Logs:**
```javascript
console.log('Updating reservation:', updatedReservation);
```

**Required Fields:**
- `id` - Must exist
- `guestName` - Must not be empty
- `email` - Must not be empty
- `checkIn` / `checkInDate` - Must be valid date
- `checkOut` / `checkOutDate` - Must be valid date

---

### 4. Field Name Mismatch

**Symptom:** Fields not updating even though no error

**Cause:** Frontend uses different field names than backend

**Field Mapping:**
| Frontend | Backend |
|----------|---------|
| `email` | `guestEmail` |
| `phone` | `guestPhone` |
| `checkIn` | `checkInDate` |
| `checkOut` | `checkOutDate` |
| `specialRequest` | `specialRequests` |
| `address.line1` | `address` |
| `address.city` | `city` |
| `address.country` | `country` |
| `address.postalCode` | `zipCode` |

**Fix Applied:** ✅ API function maps fields correctly

---

### 5. Network Error

**Symptom:** Error: "Network Error" or "ERR_CONNECTION_REFUSED"

**Cause:** Backend not running

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8080/actuator/health

# If not running, start it
cd ~/Desktop/Backend-Hotel\ 2
./mvnw spring-boot:run
```

---

### 6. CORS Error

**Symptom:** Error in browser console about CORS

**Cause:** Frontend and backend on different ports

**Check:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

**Solution:** Backend should have CORS configured (already done)

---

## Debugging Steps

### Step 1: Check Browser Console

Open DevTools (F12) → Console tab

Look for:
```
Updating reservation: { id: 123, guestName: "...", ... }
Update payload: { guestName: "...", guestEmail: "...", ... }
```

### Step 2: Check Network Tab

DevTools → Network tab

Look for:
```
PUT /api/admin/bookings/123
Status: 200 OK (good) or 400/500 (bad)
```

Click on the request to see:
- **Request Payload:** What was sent
- **Response:** What backend returned

### Step 3: Check Backend Logs

In the terminal where backend is running, look for:
```
PUT /api/admin/bookings/123
Error: ...
```

### Step 4: Test Backend Directly

```bash
curl -X PUT http://localhost:8080/api/admin/bookings/1 \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "Test User",
    "guestEmail": "test@example.com",
    "checkInDate": "2025-01-15",
    "checkOutDate": "2025-01-18"
  }'
```

Expected: Should return updated booking JSON

---

## Common Error Messages

### "Booking not found: 123"

**Cause:** Booking ID doesn't exist in database

**Solution:** Check that the booking exists:
```bash
curl http://localhost:8080/api/admin/bookings?tab=ALL
```

### "Invalid date format"

**Cause:** Date not in YYYY-MM-DD format

**Solution:** ✅ Already fixed with `formatDate()` function

### "Guest name is required"

**Cause:** `guestName` is null or empty

**Solution:** Ensure form has guest name filled in

### "Valid email required"

**Cause:** Email is invalid or missing

**Solution:** Ensure form has valid email

---

## Verification Checklist

After making changes, verify:

- [ ] Backend is running on port 8080
- [ ] Frontend is running on port 3000
- [ ] Browser console shows no errors
- [ ] Network tab shows PUT request with 200 status
- [ ] Backend logs show no errors
- [ ] Changes persist after page refresh

---

## Quick Fix Commands

### Restart Backend
```bash
cd ~/Desktop/Backend-Hotel\ 2
# Ctrl+C to stop
./mvnw spring-boot:run
```

### Restart Frontend
```bash
cd ~/Documents/Admin-platform
# Ctrl+C to stop
npm start
```

### Clear Browser Cache
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

## Debug Mode

The code now includes debug logs. Check console for:

```javascript
// Before API call
Updating reservation: { id: 123, ... }

// Payload sent to backend
Update payload: { guestName: "...", guestEmail: "...", ... }

// Response from backend
Update result: { id: 123, ... }
```

If you see an error:
```javascript
Error updating reservation: Error: ...
Error response: { status: 400, data: "..." }
```

---

## Still Not Working?

### 1. Check Exact Error Message

Look in:
- Browser console (F12)
- Network tab → Response
- Backend terminal logs

### 2. Verify Data Format

Console should show:
```javascript
Update payload: {
  guestName: "John Doe",           // ✅ String
  guestEmail: "john@example.com",  // ✅ String
  checkInDate: "2025-01-15",       // ✅ String (not Date object)
  checkOutDate: "2025-01-18",      // ✅ String (not Date object)
  adults: 2,                       // ✅ Number
  kids: 0                          // ✅ Number
}
```

### 3. Test with Minimal Data

Try updating just the name:
```javascript
{
  id: 123,
  guestName: "Test Name",
  email: "test@example.com",
  checkIn: "2025-01-15",
  checkOut: "2025-01-18",
  roomType: "STANDARD SINGLE ROOM"
}
```

---

## Contact Information

If issue persists, provide:
1. Exact error message from console
2. Network tab screenshot (Request + Response)
3. Backend log output
4. What you were trying to update

---

**Updated:** October 5, 2025  
**Status:** Debug logging added, date formatting fixed
