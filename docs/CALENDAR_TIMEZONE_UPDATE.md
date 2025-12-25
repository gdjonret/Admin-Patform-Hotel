# Calendar/DatePicker Timezone Update

**Date:** October 5, 2025  
**Status:** ⚠️ NEEDS MANUAL FIX

---

## Issue Found

You're absolutely right! The calendar date pickers are using **browser's local date**, not **Chad's date**.

### Current Problem

```javascript
// ReservationForm.js & EditReservationModal.js
const todayLocal = (() => {
  const t = new Date();  // ❌ Uses browser timezone!
  t.setHours(0, 0, 0, 0);
  return t;
})();
```

**Impact:**
- Browser in New York at 11 PM → Shows Oct 5
- Chad is already Oct 6 (UTC+1)
- User can't book for "today" in Chad!

---

## ✅ Solution

### Update Both Files

**Files to fix:**
1. `src/components/ReservationForm.js`
2. `src/components/Reservations/modals/EditReservationModal.js`

---

### Fix #1: ReservationForm.js

**Step 1: Add import**
```javascript
import { todayYmdTZ, parseYmd } from "../lib/dates";
```

**Step 2: Replace todayLocal**
```javascript
// OLD - Uses browser timezone
const todayLocal = (() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
})();

// NEW - Uses Chad timezone
const getTodayChad = () => {
  const todayYmd = todayYmdTZ('Africa/Ndjamena'); // e.g., "2025-10-05"
  return parseYmd(todayYmd); // Convert to Date object at midnight
};

const todayLocal = getTodayChad();
```

**Step 3: Update minDate in DatePicker**
```javascript
<DatePicker
  selected={arrivalDateObj}
  onChange={(date) => setField("arrivalDate", toDateStrLocal(date))}
  dateFormat="yyyy-MM-dd"
  placeholderText="Select arrival date"
  minDate={todayLocal}  // ✅ Now uses Chad's today
  customInput={<CustomInput />}
/>
```

---

### Fix #2: EditReservationModal.js

**Step 1: Add import**
```javascript
import { todayYmdTZ, parseYmd } from "../../../lib/dates";
```

**Step 2: Update minDate in both DatePickers**
```javascript
// Check-in DatePicker
<DatePicker
  selected={checkInDate}
  onChange={(date) => setFormData(prev => ({ ...prev, checkIn: toDateStrLocal(date) }))}
  dateFormat="yyyy-MM-dd"
  placeholderText="Select check-in date"
  minDate={parseYmd(todayYmdTZ('Africa/Ndjamena'))}  // ✅ Chad's today
  customInput={<CustomInput />}
/>

// Check-out DatePicker
<DatePicker
  selected={checkOutDate}
  onChange={(date) => setFormData(prev => ({ ...prev, checkOut: toDateStrLocal(date) }))}
  dateFormat="yyyy-MM-dd"
  placeholderText="Select check-out date"
  minDate={checkInDate || parseYmd(todayYmdTZ('Africa/Ndjamena'))}  // ✅ Chad's today
  customInput={<CustomInput />}
/>
```

---

## How It Works

### Before Fix
```
Browser in New York: 11:00 PM Oct 5
Chad time: 5:00 AM Oct 6

Calendar minDate: Oct 5 (browser's today)
❌ User can't book for Oct 6 (Chad's today)!
```

### After Fix
```
Browser in New York: 11:00 PM Oct 5
Chad time: 5:00 AM Oct 6

Calendar minDate: Oct 6 (Chad's today)
✅ User can book starting from Oct 6!
```

---

## Testing

### Test Case 1: Late Night Booking

**Setup:**
1. Set browser to New York timezone
2. Set time to 11:00 PM
3. Open booking form

**Before Fix:**
- minDate shows Oct 5 ❌
- Can book for Oct 5 (yesterday in Chad!)

**After Fix:**
- minDate shows Oct 6 ✅
- Can only book from Oct 6 (today in Chad)

---

### Test Case 2: Early Morning Booking

**Setup:**
1. Set browser to Tokyo timezone (UTC+9)
2. Set time to 2:00 AM
3. Open booking form

**Before Fix:**
- minDate shows tomorrow (Tokyo time) ❌
- Can't book for today in Chad!

**After Fix:**
- minDate shows today (Chad time) ✅
- Can book for today in Chad

---

## Why This Matters

### Scenario: International Guest

**Guest in New York books at 11 PM:**

**Before Fix:**
```
Browser: Oct 5, 11 PM
Chad: Oct 6, 5 AM
Calendar allows: Oct 5 ❌
Result: Guest books for "yesterday" in Chad!
```

**After Fix:**
```
Browser: Oct 5, 11 PM
Chad: Oct 6, 5 AM
Calendar allows: Oct 6 ✅
Result: Guest books for "today" in Chad!
```

---

## Complete Implementation

### ReservationForm.js (Lines 1-100)

```javascript
import React, { useMemo, useReducer, useState, forwardRef } from "react";
import "../styles/reservation-form.css";
import { createBookingFromPublicForm } from "../api/bookings";
import { MdPerson, MdPhone, MdEmail, MdHome, MdCalendarToday, MdPeople, MdPayment, MdComment, MdArrowForward, MdArrowBack, MdCheck, MdHotel, MdEventAvailable } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useRooms } from "../context/RoomContext";
import { todayYmdTZ, parseYmd } from "../lib/dates";  // ← ADD THIS

// ... existing code ...

const toDateStrLocal = (dateObj) => {
  if (!dateObj) return "";
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateStrLocal = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

// Get today in Chad timezone
const getTodayChad = () => {
  const todayYmd = todayYmdTZ('Africa/Ndjamena'); // e.g., "2025-10-05"
  return parseYmd(todayYmd); // Convert to Date object at midnight
};

const todayLocal = getTodayChad();  // ← REPLACE OLD todayLocal
```

---

### EditReservationModal.js (Lines 1-10)

```javascript
import React, { useState, useEffect, forwardRef } from "react";
import { createPortal } from "react-dom";
import { Button, Stack, IconButton } from "@mui/material";
import { MdClose, MdPerson, MdPhone, MdEmail, MdHome, MdCalendarToday, MdPeople, MdPayment, MdComment } from "react-icons/md";
import LoadingSpinner from "../../common/LoadingSpinner";
import "../../../styles/modern-form.css";
import { todayYmdTZ, parseYmd } from "../../../lib/dates";  // ← ADD THIS

// DATE PICKER
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
```

---

### EditReservationModal.js (Lines 228-250)

```javascript
<div className="form-grid form-grid-2">
  <Field label="Check-in Date" error={errors.checkIn} required={true} icon={<MdCalendarToday />}>
    <DatePicker
      selected={checkInDate}
      onChange={(date) => setFormData(prev => ({ ...prev, checkIn: toDateStrLocal(date) }))}
      dateFormat="yyyy-MM-dd"
      placeholderText="Select check-in date"
      minDate={parseYmd(todayYmdTZ('Africa/Ndjamena'))}  // ← ADD THIS
      customInput={<CustomInput />}
    />
  </Field>

  <Field label="Check-out Date" error={errors.checkOut} required={true} icon={<MdCalendarToday />}>
    <DatePicker
      selected={checkOutDate}
      onChange={(date) => setFormData(prev => ({ ...prev, checkOut: toDateStrLocal(date) }))}
      dateFormat="yyyy-MM-dd"
      placeholderText="Select check-out date"
      minDate={checkInDate || parseYmd(todayYmdTZ('Africa/Ndjamena'))}  // ← ADD THIS
      customInput={<CustomInput />}
    />
  </Field>
</div>
```

---

## Summary

### What Needs to Change

| File | Change | Lines |
|------|--------|-------|
| ReservationForm.js | Add import | Line 10 |
| ReservationForm.js | Replace todayLocal | Lines 93-100 |
| EditReservationModal.js | Add import | Line 8 |
| EditReservationModal.js | Update check-in minDate | Line 235 |
| EditReservationModal.js | Update check-out minDate | Line 247 |

**Total:** 2 files, 5 changes

---

### Benefits

✅ **Consistent dates** - Calendar uses Chad's today  
✅ **No timezone bugs** - Works for international guests  
✅ **Accurate bookings** - Can't book for "yesterday"  
✅ **Better UX** - Dates match hotel operations  

---

### Status

⚠️ **NEEDS MANUAL FIX** - I attempted the changes but there was a syntax error in EditReservationModal.js

**Please apply the changes manually using the code examples above.**

---

**Identified by:** User  
**Date:** October 5, 2025  
**Priority:** HIGH (affects booking accuracy)
