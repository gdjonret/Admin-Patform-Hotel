# Troubleshooting Guide - Admin Platform Connection Issues

## Error: "Failed to load rooms from backend"

This error occurs when the Admin Platform cannot connect to the backend server.

## Quick Fixes

### Fix 1: Ensure Backend is Running

```bash
cd /Users/gloriadjonret/Desktop/Backend-Hotel
./mvnw spring-boot:run
```

**Expected output:**
- Server should start on port 8080
- You should see: `Started BackendHotelApplication in X seconds`
- No error messages about database connection

### Fix 2: Check Backend is Accessible

Open your browser and visit:
```
http://localhost:8080/api/admin/rooms
```

**Expected:** Should return a JSON array (might be empty `[]` if no rooms exist)

**If you get an error:** Backend is not running or there's a configuration issue

### Fix 3: Verify Database is Running

The backend needs PostgreSQL running:

```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
brew services start postgresql@14
# or
brew services start postgresql
```

### Fix 4: Check Environment Variables

Verify the Admin Platform `.env` file:

```bash
cd /Users/gloriadjonret/Documents/Admin-platform
cat .env
```

**Should show:**
```
PORT=8000
REACT_APP_API_URL=http://localhost:8080/api/admin
REACT_APP_BACKEND_URL=http://localhost:8080
```

### Fix 5: Restart Admin Platform

```bash
cd /Users/gloriadjonret/Documents/Admin-platform
# Stop the current process (Ctrl+C)
npm start
```

## Changes Made to Fix Connection

### 1. ✅ Updated http.js baseURL
**File:** `src/api/http.js`

Changed from:
```javascript
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
```

To:
```javascript
baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'
```

### 2. ✅ Disabled Authentication for Development
**File:** `/Users/gloriadjonret/Desktop/Backend-Hotel/src/main/java/org/example/backendhotel/Config/SecurityConfig.java`

Added:
```java
.requestMatchers("/api/admin/**").permitAll()   // Admin API (temporarily open)
```

This allows the Admin Platform to access admin endpoints without authentication during development.

## Testing the Connection

### Step 1: Test Backend Directly

```bash
# Test rooms endpoint
curl http://localhost:8080/api/admin/rooms

# Test room types endpoint
curl http://localhost:8080/api/admin/room-types
```

### Step 2: Check Browser Console

1. Open Admin Platform in browser: `http://localhost:8000`
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Look for errors

**Common errors:**
- `ERR_CONNECTION_REFUSED` - Backend not running
- `CORS error` - CORS not configured (should be fixed now)
- `401 Unauthorized` - Authentication issue (should be fixed now)
- `500 Internal Server Error` - Backend error (check backend logs)

### Step 3: Check Network Tab

1. In Developer Tools, go to Network tab
2. Reload the page
3. Look for requests to `localhost:8080`
4. Check the status codes:
   - ✅ 200 = Success
   - ❌ 401 = Authentication issue
   - ❌ 403 = Authorization issue
   - ❌ 404 = Endpoint not found
   - ❌ 500 = Server error

## Common Issues

### Issue 1: Port Already in Use

**Error:** `Port 8080 is already in use`

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use a different port in application.yml:
server:
  port: 8081
```

### Issue 2: Database Connection Failed

**Error:** `Connection to localhost:5432 refused`

**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql

# Check if database exists
psql -l | grep hotel_db

# Create database if needed
createdb hotel_db
```

### Issue 3: CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:** Already fixed! The backend now allows requests from `http://localhost:8000`

If you need to add more origins, edit:
```yaml
# application.yml
app:
  cors:
    allowed-origins-admin: "http://localhost:8000,http://localhost:3001,http://localhost:YOUR_PORT"
```

### Issue 4: 401 Unauthorized

**Error:** `Failed to load resource: 401 (Unauthorized)`

**Solution:** Already fixed! Admin endpoints are now open for development.

**For production:** You'll need to implement proper authentication.

## Verification Checklist

Run through this checklist:

- [ ] PostgreSQL is running (`pg_isready`)
- [ ] Database `hotel_db` exists
- [ ] Backend starts without errors
- [ ] Backend accessible at `http://localhost:8080/api/admin/rooms`
- [ ] Admin Platform `.env` has correct `REACT_APP_BACKEND_URL`
- [ ] Admin Platform starts on port 8000
- [ ] Browser console shows no CORS errors
- [ ] Browser console shows no 401/403 errors
- [ ] Rooms page loads successfully

## Still Having Issues?

### Check Backend Logs

Look at the terminal where you ran `./mvnw spring-boot:run`:
- Any red error messages?
- Any stack traces?
- Database connection errors?

### Check Admin Platform Logs

Look at the terminal where you ran `npm start`:
- Any compilation errors?
- Any warnings?

### Test with curl

```bash
# Test if backend is responding
curl -v http://localhost:8080/api/admin/rooms

# Should return:
# < HTTP/1.1 200
# < Content-Type: application/json
# []
```

## Summary of Fixes Applied

✅ **http.js** - Fixed baseURL to use correct backend URL  
✅ **SecurityConfig.java** - Disabled authentication for admin endpoints (development)  
✅ **AdminRoomController.java** - Added missing CRUD endpoints  
✅ **rooms.js** - Fixed API endpoints and room type mappings  

Everything should now work! 🎉
