# Debug: Guest Page Not Updating

## Test Steps:

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Go to Guests Page**
3. **Look for these console messages:**
   - `[Guests] Loading guests from API...`
   - `[Guests] Received X guests from API`
   - `Guests component mounted, loading guests...`

4. **Go to Reservations Page**
5. **Check-in or Check-out a booking**
6. **Look for:**
   - `Guest updated event received, refreshing guests...`

7. **Go back to Guests Page**
8. **Look for:**
   - `Guests component mounted, loading guests...`
   - `Page became visible, refreshing guests...`
   - `Window focused, refreshing guests...`

## What to Check:

### If you see NO console messages:
- Frontend not loading properly
- Check for JavaScript errors in console

### If you see messages but data doesn't update:
- API returning old data (caching issue)
- State not updating properly

### If you see "Guest updated event received":
- Event bus is working ✓
- Check if loadGuests() is called after

### If you DON'T see "Guest updated event received":
- Event not being emitted from check-in/checkout
- Event bus import issue

## Quick Fix Test:

1. Go to Guests page
2. Click the **Refresh button** (top right)
3. Does it update? 
   - YES → Event system issue
   - NO → API/caching issue

## API Test:

Open browser console and run:
```javascript
fetch('http://localhost:8080/api/admin/guests')
  .then(r => r.json())
  .then(data => console.log('API returned:', data.length, 'guests'))
```

Should show current guest count.
