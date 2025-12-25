# Price Calculation & Balance Display Review

## Executive Summary

After comprehensive review of price calculations and balance displays across all tabs, I've identified **3 CRITICAL ISSUES** that need immediate attention.

---

## 🔴 CRITICAL ISSUES FOUND

### Issue #1: Inconsistent Balance vs TotalPrice Usage

**Problem:** The system uses BOTH `balance` and `totalPrice` fields inconsistently across the codebase.

**Evidence:**

**Frontend - useReservations.js (line 50):**
```javascript
balance: booking.totalPrice || 0,
```
Sets `balance` = `totalPrice` from backend

**Frontend - Reservations.js (lines 1218, 1237):**
```javascript
<td>{formatFCFA(reservation.balance || 0)}</td>
```
Displays `balance` in In-House and Departures tabs

**Frontend - ViewReservationModal.js (line 130):**
```javascript
const totalCharges = totalPrice || balance || 0;
```
Falls back to `balance` if `totalPrice` not available

**Frontend - PaymentModal.js (line 21):**
```javascript
const totalPrice = parseFloat(reservation.totalPrice || reservation.balance || 0);
```
Also falls back to `balance`

**Impact:** 
- **HIGH** - Creates confusion about which field is the source of truth
- Balance and totalPrice can get out of sync
- Outstanding balance calculations may be incorrect

**Root Cause:**
The `balance` field appears to be a legacy field that duplicates `totalPrice`. The system should use ONE field consistently.

---

### Issue #2: Balance Not Updated When Charges Added

**Problem:** When charges are added via `addCharge` function, it updates the local `balance` field but this doesn't sync with backend's `totalPrice`.

**Evidence:**

**Frontend - useReservations.js (line 103-104):**
```javascript
const addCharge = (id, amount) =>
  setReservations(prev => prev.map(x => x.id === id ? { ...x, balance: Number(x.balance || 0) + Number(amount) } : x));
```

**Frontend - Reservations.js (line 1546-1548):**
```javascript
// Update local state with new balance
const amt = parseFloat(chargeData.amount);
addCharge(currentReservation.id, amt);
```

**Then later (line 1563):**
```javascript
balance: updatedBooking.totalPrice || (Number(prev.currentReservation.balance || 0) + amt)
```

**Issues:**
1. Updates `balance` locally before backend response
2. Falls back to manual calculation if backend doesn't return totalPrice
3. Creates potential for `balance` and `totalPrice` to diverge

**Impact:**
- **HIGH** - Balance shown in tabs may not match actual totalPrice
- Outstanding balance calculations will be wrong
- Payment system will use incorrect amounts

---

### Issue #3: Outstanding Balance Not Displayed in Tabs

**Problem:** The In-House and Departures tabs show "Balance" but this is actually `totalPrice`, NOT outstanding balance.

**Current Display:**

**In-House Tab (line 1218):**
```javascript
<td style={{ fontWeight: '500' }}>{formatFCFA(reservation.balance || 0)}</td>
```
Column header: "Balance"
Shows: `reservation.balance` (which is `totalPrice`)

**Departures Tab (line 1237):**
```javascript
<td style={{ fontWeight: '500' }}>{formatFCFA(reservation.balance || 0)}</td>
```
Column header: "Balance"
Shows: `reservation.balance` (which is `totalPrice`)

**What It Should Show:**
```javascript
const outstandingBalance = (reservation.totalPrice || 0) - (reservation.amountPaid || 0);
<td>{formatFCFA(outstandingBalance)}</td>
```

**Impact:**
- **CRITICAL** - Admins see total charges, not what's actually owed
- Cannot quickly identify which guests have outstanding payments
- Defeats the purpose of the payment tracking system

**Example Scenario:**
- Guest booking: 100,000 FCFA
- Guest paid: 60,000 FCFA
- **Current display:** "Balance: 100,000 FCFA" ❌
- **Should display:** "Outstanding: 40,000 FCFA" ✅

---

## 📊 Current State Analysis

### How Prices Flow Through the System

```
1. BOOKING CREATION
   ├─ Backend: totalPrice set (e.g., 100,000 FCFA)
   ├─ Backend: pricePerNight set
   ├─ Backend: amountPaid = 0 (default)
   └─ Backend: paymentStatus = "Unpaid"
   
2. FRONTEND RECEIVES DATA
   ├─ useReservations.js transforms:
   │  ├─ totalPrice: booking.totalPrice
   │  ├─ balance: booking.totalPrice  ← DUPLICATE!
   │  └─ amountPaid: booking.amountPaid || 0
   
3. CHARGE ADDED
   ├─ Backend: totalPrice += charge amount
   ├─ Backend: paymentStatus recalculated (after our fix)
   ├─ Frontend: addCharge() updates balance locally
   └─ Frontend: refetch() gets new totalPrice
   
4. PAYMENT RECORDED
   ├─ Backend: amountPaid += payment amount
   ├─ Backend: paymentStatus updated
   ├─ Frontend: refetch() gets new amountPaid
   └─ Frontend: Outstanding = totalPrice - amountPaid
   
5. DISPLAY IN TABS
   ├─ In-House: Shows "balance" (= totalPrice)  ❌
   ├─ Departures: Shows "balance" (= totalPrice)  ❌
   └─ ViewModal: Calculates outstanding correctly ✅
```

---

## 🔍 Tab-by-Tab Analysis

### Pending Tab
**Columns:** Reference, Guest, Room Type, Check-in, Check-out, Actions
**Price Display:** ❌ NONE
**Status:** ✅ OK - No price display needed at this stage

---

### Arrivals Tab
**Columns:** Reference, Guest, Room Type, Room, Check-in, Actions
**Price Display:** ❌ NONE
**Status:** ⚠️ MISSING - Should show expected total or outstanding balance

**Recommendation:** Add "Expected Charges" column
```javascript
<th>Expected Charges</th>
...
<td>{formatFCFA(reservation.totalPrice || 0)}</td>
```

---

### In-House Tab ⚠️
**Columns:** Room, Guest, Nights, Check-in Time, **Balance**, Actions
**Current Display:** `reservation.balance` (= totalPrice)
**Status:** ❌ INCORRECT

**Problem:**
- Column says "Balance" but shows total charges
- Doesn't account for payments made
- Admin can't see outstanding amount

**Should Display:**
```javascript
<th>Outstanding</th>
...
const outstanding = (reservation.totalPrice || 0) - (reservation.amountPaid || 0);
<td style={{ 
  fontWeight: '500',
  color: outstanding > 0 ? '#dc2626' : '#10b981'
}}>
  {formatFCFA(outstanding)}
</td>
```

---

### Departures Tab ⚠️
**Columns:** Room, Guest, Check-in, Check-out, **Balance**, Actions
**Current Display:** `reservation.balance` (= totalPrice)
**Status:** ❌ INCORRECT

**Problem:** Same as In-House tab

**Should Display:** Outstanding balance (totalPrice - amountPaid)

---

### Upcoming Tab
**Columns:** Reference, Guest, Room Type, Check-in, Check-out, Actions
**Price Display:** ❌ NONE
**Status:** ⚠️ MISSING - Should show expected total

---

### Past Tab
**Columns:** Reference, Guest, Room Type, Check-in, Check-out, Status, Actions
**Price Display:** ❌ NONE
**Status:** ⚠️ MISSING - Should show final total and payment status

---

### Cancelled Tab
**Columns:** Reference, Guest, Room Type, Planned Stay, Status, Actions
**Price Display:** ❌ NONE
**Status:** ✅ OK - No price display needed

---

### All Tab
**Columns:** Reference, Guest, Room Type, Check-in, Check-out, Status, Actions
**Price Display:** ❌ NONE
**Status:** ⚠️ MISSING - Should show total/outstanding based on status

---

## 💰 Price Calculation Points

### 1. Initial Booking Creation
**Location:** Backend - When booking is created
**Calculation:** 
```java
totalPrice = pricePerNight * numberOfNights
```
**Status:** ✅ Correct (handled by frontend before submission)

---

### 2. Check-In Price Adjustment
**Location:** Backend - AdminBookingController.java (lines 154-158)
**Code:**
```java
if (request.updatedTotalPrice() != null) {
    booking.setFinalTotalPrice(request.updatedTotalPrice());
    booking.setTotalPrice(request.updatedTotalPrice());
}
```

**Status:** ✅ Correct - Allows price adjustment for early/late check-in

---

### 3. Adding Charges
**Location:** Backend - AdminBookingController.java (lines 388-401)
**Code:**
```java
BigDecimal currentTotal = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
BigDecimal newTotal = currentTotal.add(request.amount());
booking.setTotalPrice(newTotal);

// Recalculate payment status (our fix)
BigDecimal amountPaid = booking.getAmountPaid() != null ? booking.getAmountPaid() : BigDecimal.ZERO;
if (amountPaid.compareTo(newTotal) >= 0) {
    booking.setPaymentStatus("Paid");
} else if (amountPaid.compareTo(BigDecimal.ZERO) > 0) {
    booking.setPaymentStatus("Partial");
} else {
    booking.setPaymentStatus("Unpaid");
}
```

**Status:** ✅ Correct - Adds to totalPrice and recalculates payment status

---

### 4. Check-Out Price Adjustment
**Location:** Backend - AdminBookingController.java (lines 261-265)
**Code:**
```java
if (request.finalTotalPrice() != null) {
    booking.setFinalTotalPrice(request.finalTotalPrice());
    booking.setTotalPrice(request.finalTotalPrice());
}
```

**Status:** ✅ Correct - Allows final price adjustment at checkout

---

### 5. Recording Payments
**Location:** Backend - AdminBookingController.java (lines 442-466)
**Code:**
```java
BigDecimal currentPaid = booking.getAmountPaid() != null ? booking.getAmountPaid() : BigDecimal.ZERO;
BigDecimal newAmountPaid = currentPaid.add(request.amount());
booking.setAmountPaid(newAmountPaid);

// Update payment status
if (newAmountPaid.compareTo(totalPrice) >= 0) {
    booking.setPaymentStatus("Paid");
} else {
    booking.setPaymentStatus("Partial");
}
```

**Status:** ✅ Correct - Accumulates payments and updates status

---

### 6. Outstanding Balance Calculation
**Location:** Frontend - ViewReservationModal.js (lines 129-132)
**Code:**
```javascript
const totalCharges = totalPrice || balance || 0;
const paidAmount = amountPaid || 0;
const outstandingBalance = totalCharges - paidAmount;
```

**Status:** ⚠️ PARTIALLY CORRECT - Works in modal but uses fallback to `balance`

---

## 🎯 Recommended Fixes

### Fix #1: Remove `balance` Field, Use Only `totalPrice`

**Priority:** HIGH

**Changes Needed:**

**1. useReservations.js - Remove balance field:**
```javascript
// REMOVE THIS LINE:
balance: booking.totalPrice || 0,

// Keep only:
totalPrice: booking.totalPrice,
amountPaid: booking.amountPaid || 0,
```

**2. Update all references to use totalPrice:**
- Reservations.js: Replace `reservation.balance` with `reservation.totalPrice`
- ViewReservationModal.js: Remove fallback to `balance`
- PaymentModal.js: Remove fallback to `balance`

---

### Fix #2: Display Outstanding Balance in Tabs

**Priority:** CRITICAL

**In-House Tab - Reservations.js (around line 1218):**
```javascript
// Change column header
<th>Outstanding</th>

// Change display
const outstanding = (reservation.totalPrice || 0) - (reservation.amountPaid || 0);
<td style={{ 
  fontWeight: '500',
  color: outstanding > 0 ? '#dc2626' : '#10b981'
}}>
  {formatFCFA(outstanding)}
</td>
```

**Departures Tab - Reservations.js (around line 1237):**
```javascript
// Same changes as In-House tab
const outstanding = (reservation.totalPrice || 0) - (reservation.amountPaid || 0);
<td style={{ 
  fontWeight: '500',
  color: outstanding > 0 ? '#dc2626' : '#10b981'
}}>
  {formatFCFA(outstanding)}
</td>
```

---

### Fix #3: Add Price Columns to Other Tabs

**Priority:** MEDIUM

**Arrivals Tab - Add Expected Charges:**
```javascript
<th>Expected Charges</th>
...
<td>{formatFCFA(reservation.totalPrice || 0)}</td>
```

**Past Tab - Add Final Total & Payment Status:**
```javascript
<th>Final Total</th>
<th>Payment Status</th>
...
<td>{formatFCFA(reservation.totalPrice || 0)}</td>
<td>
  <span className={`payment-status ${reservation.paymentStatus?.toLowerCase()}`}>
    {reservation.paymentStatus || 'Unknown'}
  </span>
</td>
```

---

### Fix #4: Remove Local Balance Updates

**Priority:** HIGH

**useReservations.js - Update addCharge function:**
```javascript
// CURRENT (WRONG):
const addCharge = (id, amount) =>
  setReservations(prev => prev.map(x => x.id === id ? { ...x, balance: Number(x.balance || 0) + Number(amount) } : x));

// SHOULD BE (rely on backend):
const addCharge = (id, amount) =>
  setReservations(prev => prev.map(x => x.id === id ? { ...x, totalPrice: Number(x.totalPrice || 0) + Number(amount) } : x));

// OR BETTER: Just refetch from backend
const addCharge = () => {
  // Don't update locally, let refetch handle it
};
```

---

### Fix #5: Simplify Outstanding Balance Calculation

**Priority:** MEDIUM

**ViewReservationModal.js - Remove fallback:**
```javascript
// CURRENT:
const totalCharges = totalPrice || balance || 0;

// SHOULD BE:
const totalCharges = totalPrice || 0;
```

**PaymentModal.js - Remove fallback:**
```javascript
// CURRENT:
const totalPrice = parseFloat(reservation.totalPrice || reservation.balance || 0);

// SHOULD BE:
const totalPrice = parseFloat(reservation.totalPrice || 0);
```

---

## 📋 Summary of Findings

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| balance vs totalPrice inconsistency | HIGH | Data sync issues | Needs fix |
| Outstanding not shown in tabs | CRITICAL | Admins can't see what's owed | Needs fix |
| Local balance updates | HIGH | Can diverge from backend | Needs fix |
| Missing price columns | MEDIUM | Incomplete information | Enhancement |
| Fallback to balance field | MEDIUM | Unnecessary complexity | Cleanup |

---

## ✅ What's Working Correctly

1. ✅ Backend totalPrice calculation
2. ✅ Backend charge addition
3. ✅ Backend payment recording
4. ✅ Backend payment status updates (after our fix)
5. ✅ ViewReservationModal outstanding calculation
6. ✅ PaymentModal outstanding calculation
7. ✅ Check-in/checkout price adjustments

---

## 🎯 Action Plan

### Phase 1: Critical Fixes (Do First)
1. **Display outstanding balance in In-House tab** (not total)
2. **Display outstanding balance in Departures tab** (not total)
3. **Remove balance field from useReservations transformation**
4. **Update all balance references to use totalPrice**

### Phase 2: Cleanup (Do Second)
5. **Remove fallbacks to balance in modals**
6. **Update addCharge to not modify local state**
7. **Rely on backend refetch for updated prices**

### Phase 3: Enhancements (Optional)
8. **Add Expected Charges column to Arrivals tab**
9. **Add Final Total & Payment Status to Past tab**
10. **Add color coding for outstanding amounts**

---

## 🧪 Testing Checklist

After fixes are applied, test:

- [ ] In-House tab shows outstanding (totalPrice - amountPaid)
- [ ] Departures tab shows outstanding (totalPrice - amountPaid)
- [ ] Outstanding turns green when fully paid
- [ ] Outstanding turns red when unpaid/partial
- [ ] Adding charge updates outstanding correctly
- [ ] Recording payment updates outstanding correctly
- [ ] No references to `balance` field remain
- [ ] All tabs display correct price information
- [ ] ViewReservationModal still calculates correctly
- [ ] PaymentModal still calculates correctly

---

## 📊 Expected Behavior After Fixes

### In-House Tab Example
```
Room | Guest      | Nights | Check-in | Outstanding | Actions
102  | John Doe   | 3      | 14:30    | 40,000 🔴  | [Check-out] [Add Charge]
103  | Jane Smith | 2      | 15:00    | 0 🟢       | [Check-out] [Add Charge]
```

### Departures Tab Example
```
Room | Guest      | Check-in  | Check-out | Outstanding | Actions
102  | John Doe   | Oct 1     | Oct 4     | 20,000 🔴  | [Check-out] [View]
103  | Jane Smith | Oct 2     | Oct 4     | 0 🟢       | [Check-out] [View]
```

---

*Review completed: 2025-10-06*
*Critical issues identified: 3*
*Fixes required: 5*
*Status: Awaiting implementation*
