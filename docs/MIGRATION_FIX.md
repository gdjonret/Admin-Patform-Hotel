# Migration V16 Fix

**Issue:** Migration failed because database uses VARCHAR for room status, not ENUM

**Error:**
```
ERROR: type "room_status" does not exist
```

## Root Cause

The database schema uses `VARCHAR(16)` for room status, not a PostgreSQL ENUM type.

**From V1__init.sql:**
```sql
create table if not exists rooms (
    ...
    status varchar(16) not null  -- ← VARCHAR, not ENUM!
);
```

## Fix Applied

Updated `V16__add_reserved_room_status.sql` to work with VARCHAR:

### Before (WRONG):
```sql
ALTER TYPE room_status ADD VALUE 'RESERVED' AFTER 'AVAILABLE';  -- ❌ Fails
```

### After (CORRECT):
```sql
-- Update existing data
UPDATE rooms r
SET status = 'RESERVED'
WHERE status = 'OCCUPIED'
  AND EXISTS (...);

-- Add check constraint
ALTER TABLE rooms ADD CONSTRAINT rooms_status_check 
  CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'));
```

## Now Run Migration

```bash
cd ~/Desktop/Backend-Hotel\ 2
./mvnw spring-boot:run
```

**Expected:** Migration succeeds, server starts ✅

## What the Migration Does

1. ✅ Updates existing OCCUPIED rooms to RESERVED (if guest not checked in)
2. ✅ Adds check constraint to validate status values
3. ✅ Adds comment documenting status meanings

**Status:** ✅ FIXED - Ready to run
