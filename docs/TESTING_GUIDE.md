# Testing Guide - Admin Platform Reservation Flow

This guide explains how to test the reservation flow in the admin platform.

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd ~/Desktop/Backend-Hotel\ 2
   ./mvnw spring-boot:run
   ```
   Server should be running on `http://localhost:8080`

2. **Required Tools**
   - `curl` (usually pre-installed)
   - `jq` (JSON processor)
   
   Install jq if needed:
   ```bash
   # macOS
   brew install jq
   
   # Linux
   sudo apt-get install jq
   ```

## Running the Automated Test Script

### Basic Usage

```bash
cd ~/Documents/Admin-platform
./test-reservation-flow.sh
```

This will:
1. Check backend connectivity
2. Test all API endpoints
3. Create a test booking
4. Walk through the complete reservation lifecycle:
   - Create → Confirm → Assign Room → Check-in → Check-out
5. Verify all tabs work correctly
6. Display a summary of test results

### With Cleanup

To automatically delete the test booking after testing:

```bash
./test-reservation-flow.sh --cleanup
```

### Custom Backend URL

If your backend is running on a different port:

```bash
./test-reservation-flow.sh --base-url http://localhost:9090
```

## Test Coverage

The script tests the following:

### ✅ Test 1: Get Room Types
- Endpoint: `GET /api/admin/room-types`
- Verifies room types are configured

### ✅ Test 2: Get All Rooms
- Endpoint: `GET /api/admin/rooms`
- Verifies rooms exist and identifies available rooms

### ✅ Test 3: Create New Booking
- Endpoint: `POST /api/public/bookings`
- Creates a test reservation
- **This is the critical fix we made** - ensures booking creation works

### ✅ Test 4: Get Pending Bookings
- Endpoint: `GET /api/admin/bookings?tab=PENDING`
- Verifies new booking appears in Pending tab

### ✅ Test 5: Confirm Booking
- Endpoint: `PUT /api/admin/bookings/{id}/status`
- Changes status from PENDING → CONFIRMED

### ✅ Test 6: Assign Room
- Endpoint: `POST /api/admin/bookings/{id}/assign-room`
- **This is the critical fix we made** - now passes roomId correctly
- Assigns an available room to the booking

### ✅ Test 7: Check-in Booking
- Endpoint: `POST /api/admin/bookings/{id}/check-in`
- Checks in the guest with current time
- Changes status to CHECKED_IN
- Room status changes to OCCUPIED

### ✅ Test 8: Get In-House Bookings
- Endpoint: `GET /api/admin/bookings?tab=IN_HOUSE`
- Verifies checked-in booking appears in In-House tab

### ✅ Test 9: Check-out Booking
- Endpoint: `POST /api/admin/bookings/{id}/check-out`
- Checks out the guest
- Changes status to CHECKED_OUT
- Room status changes to AVAILABLE

### ✅ Test 10: Get Past Bookings
- Endpoint: `GET /api/admin/bookings?tab=PAST`
- Verifies checked-out booking appears in Past tab

### ✅ Test 11: Verify All Tabs
- Tests all 8 tabs: PENDING, ARRIVALS, IN_HOUSE, DEPARTURES, UPCOMING, PAST, CANCELLED, ALL
- Ensures tab filtering works correctly

## Manual Testing Checklist

After running the automated tests, manually verify these scenarios in the admin UI:

### 1. Create Reservation
- [ ] Open admin platform: `http://localhost:3000`
- [ ] Click "+ New Reservation"
- [ ] Fill in all required fields
- [ ] Submit form
- [ ] Verify reservation appears in Pending tab

### 2. Confirm Reservation
- [ ] Go to Pending tab
- [ ] Click "Confirm" on a reservation
- [ ] Verify reservation moves to Arrivals (if today) or Upcoming

### 3. Assign Room
- [ ] Go to Arrivals tab
- [ ] Click "Assign Room" button
- [ ] Select an available room
- [ ] Confirm selection
- [ ] **Verify no errors appear** (this was the bug we fixed)
- [ ] Verify room number updates in the reservation

### 4. Check-in Guest
- [ ] Go to Arrivals tab
- [ ] Click "Check-in" button
- [ ] Enter check-in time (HH:MM format)
- [ ] Select/confirm room if not already assigned
- [ ] Review payment details
- [ ] Click "Complete Check-In"
- [ ] **Verify error banner appears if there's an issue** (new feature)
- [ ] Verify guest moves to In-House tab

### 5. Add Charges
- [ ] Go to In-House tab
- [ ] Click "Add Charge" on a guest
- [ ] Enter charge details
- [ ] Verify balance updates

### 6. Check-out Guest
- [ ] Go to In-House or Departures tab
- [ ] Click "Check-out" button
- [ ] Review billing summary
- [ ] Add any incidentals
- [ ] Enter check-out time
- [ ] Review payment status
- [ ] Click "Check-out"
- [ ] **Verify error banner appears if there's an issue** (new feature)
- [ ] Verify guest moves to Past tab

### 7. Cancel Reservation
- [ ] Go to any tab with active reservations
- [ ] Click "Cancel" on a reservation
- [ ] Confirm cancellation
- [ ] Verify reservation moves to Cancelled tab

### 8. Tab Navigation
- [ ] Click through all tabs
- [ ] Verify each tab loads without errors
- [ ] Verify correct reservations appear in each tab

## Error Testing

Test these error scenarios to verify error handling:

### 1. Room Assignment Errors
- [ ] Try to assign a room that doesn't exist
- [ ] **Verify error message appears in red banner** (new feature)
- [ ] Verify user-friendly error message

### 2. Check-in Errors
- [ ] Try to check-in without entering time
- [ ] Try to check-in with invalid time (e.g., 25:00)
- [ ] Try to check-in without room assignment
- [ ] **Verify validation errors appear** (new feature)

### 3. Check-out Errors
- [ ] Try to check-out without entering time
- [ ] Try to check-out with invalid time
- [ ] **Verify validation errors appear** (new feature)

### 4. Network Errors
- [ ] Stop the backend server
- [ ] Try to perform any operation
- [ ] **Verify error message appears** (new feature)
- [ ] Verify error is user-friendly, not just console log

## Expected Results

### Success Indicators
- ✅ All automated tests pass
- ✅ No console errors in browser
- ✅ Reservations move between tabs correctly
- ✅ Room status updates (Available ↔ Occupied)
- ✅ Error messages appear in UI (not just console)
- ✅ Room assignment works with room ID (not room number)

### Common Issues

#### Issue: "Room assignment failed"
**Cause:** Room ID vs Room Number mismatch  
**Fix:** ✅ Already fixed in this update  
**Verify:** Room assignment should now work correctly

#### Issue: "No error message shown to user"
**Cause:** Errors only logged to console  
**Fix:** ✅ Already fixed in this update  
**Verify:** Error banners should appear in modals

#### Issue: "Backend not accessible"
**Cause:** Backend server not running  
**Fix:** Start backend with `./mvnw spring-boot:run`

#### Issue: "jq: command not found"
**Cause:** jq not installed  
**Fix:** Install with `brew install jq` (macOS) or `apt-get install jq` (Linux)

## Performance Testing

For load testing, you can run multiple bookings:

```bash
# Create 10 test bookings
for i in {1..10}; do
  ./test-reservation-flow.sh --cleanup
  sleep 2
done
```

## Continuous Integration

To integrate with CI/CD:

```bash
# Run tests and exit with proper code
./test-reservation-flow.sh
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ All tests passed - Ready for deployment"
else
  echo "✗ Tests failed - Do not deploy"
  exit 1
fi
```

## Troubleshooting

### Backend Connection Issues

```bash
# Check if backend is running
curl http://localhost:8080/actuator/health

# Expected response:
# {"status":"UP"}
```

### Database Issues

```bash
# Check database connection in backend logs
# Look for: "HikariPool-1 - Start completed"
```

### Frontend Issues

```bash
# Check if frontend is running
curl http://localhost:3000

# Start frontend if needed
cd ~/Documents/Admin-platform
npm start
```

## Next Steps

After all tests pass:

1. **Enable Authentication**
   - Uncomment `@PreAuthorize` in `AdminBookingController.java`
   - Test with authenticated users

2. **Add More Tests**
   - Test concurrent bookings
   - Test date edge cases
   - Test room availability conflicts

3. **Performance Testing**
   - Test with 100+ bookings
   - Test rapid tab switching
   - Test concurrent user operations

4. **Deploy to Staging**
   - Run full test suite
   - Verify all features work
   - Get user acceptance testing

## Summary of Fixes Applied

### 🔴 Critical Fix #1: Room Assignment Bug
**Problem:** Frontend passed `roomNumber` (string) but backend expected `roomId` (Long)  
**Location:** `Reservations.js` line 383-426  
**Fix:** Now fetches room by number, extracts ID, and passes correct roomId to API  
**Status:** ✅ Fixed

### 🔴 Critical Fix #2: Error Handling
**Problem:** API errors only logged to console, not shown to users  
**Location:** All modals (CheckInConfirmModal, CheckOutConfirmModal, AssignRoomModal)  
**Fix:** Added `apiError` state and red error banner in all modals  
**Status:** ✅ Fixed

### 🔴 Critical Fix #3: Testing Script
**Problem:** No automated way to verify the complete flow  
**Location:** New file `test-reservation-flow.sh`  
**Fix:** Created comprehensive test script covering all endpoints  
**Status:** ✅ Created

---

**Last Updated:** October 5, 2025  
**Version:** 1.0.0  
**Status:** Ready for Testing
