# Test Data Guide

## Summary
Successfully added 13 test bookings across all tabs to demonstrate the payment system functionality.

---

## 📊 Test Bookings by Tab

### 1. PENDING Tab (2 bookings)

**Alice Johnson**
- Check-in: 3 days from now
- Check-out: 5 days from now
- Room Type: Deluxe Room
- Total: 150,000 FCFA
- Status: PENDING
- **Test:** View modal should NOT show payment details

**Bob Williams**
- Check-in: 5 days from now
- Check-out: 7 days from now
- Room Type: Standard Room
- Total: 100,000 FCFA
- Status: PENDING
- **Test:** Confirm booking to move to Arrivals

---

### 2. ARRIVALS Tab (2 bookings)

**Carol Martinez** (No deposit)
- Check-in: TODAY
- Check-out: 3 days from now
- Room Type: Suite
- Total: 300,000 FCFA
- Amount Paid: 0 FCFA
- **Test:** Should show "300,000 FCFA" (no deposit info)

**David Chen** (With deposit)
- Check-in: TODAY
- Check-out: 2 days from now
- Room Type: Deluxe Room
- Total: 150,000 FCFA
- Amount Paid: 50,000 FCFA (deposit)
- **Test:** Should show "150,000 FCFA (100,000 due at check-in)"

---

### 3. IN-HOUSE Tab (2 guests)

**Emma Davis** (Partial payment + charges)
- Room: 101 (or assigned)
- Check-in: Yesterday
- Check-out: 2 days from now
- Original Total: 225,000 FCFA
- Charges Added: 25,000 FCFA (room service)
- New Total: 250,000 FCFA
- Amount Paid: 150,000 FCFA
- **Outstanding: 100,000 FCFA (RED)**
- **Test:** 
  - View modal shows outstanding balance
  - Can add more charges
  - Can record payment

**Frank Wilson** (Fully paid)
- Room: 102 (or assigned)
- Check-in: Yesterday
- Check-out: Tomorrow
- Total: 100,000 FCFA
- Amount Paid: 100,000 FCFA
- **Outstanding: 0 FCFA (GREEN)**
- **Test:**
  - View modal shows 0 outstanding (green)
  - Record Payment button hidden
  - Can still add charges (will create outstanding)

---

### 4. DEPARTURES Tab (2 guests)

**Grace Taylor** (Outstanding balance)
- Room: 103 (or assigned)
- Check-in: Yesterday
- Check-out: TODAY
- Total: 100,000 FCFA
- Amount Paid: 60,000 FCFA
- **Outstanding: 40,000 FCFA (RED)**
- **Test:**
  - Shows outstanding in red
  - Can record final payment
  - Can check out

**Henry Brown** (Fully paid)
- Room: 104 (or assigned)
- Check-in: Yesterday
- Check-out: TODAY
- Total: 75,000 FCFA
- Amount Paid: 75,000 FCFA
- **Outstanding: 0 FCFA (GREEN)**
- **Test:**
  - Shows 0 outstanding in green
  - Can check out immediately
  - No payment needed

---

### 5. UPCOMING Tab (2 bookings)

**Ivy Anderson**
- Check-in: 5 days from now
- Check-out: 7 days from now
- Room Type: Suite
- Total: 200,000 FCFA
- Status: CONFIRMED
- **Test:** View modal should NOT show payment details

**Jack Thompson**
- Check-in: 7 days from now
- Check-out: 10 days from now
- Room Type: Deluxe Room
- Total: 225,000 FCFA
- Status: CONFIRMED
- **Test:** Can edit or cancel

---

### 6. PAST Tab (2 bookings)

**Karen White** (Fully paid)
- Check-in: 7 days ago
- Check-out: 5 days ago
- Room: 105
- Total: 100,000 FCFA
- Amount Paid: 100,000 FCFA
- **Payment Status: Paid ✓ (GREEN)**
- **Test:** Shows "Paid" in green

**Leo Garcia** (Outstanding balance)
- Check-in: 7 days ago
- Check-out: 5 days ago
- Room: 106
- Total: 150,000 FCFA
- Amount Paid: 100,000 FCFA
- **Payment Status: Partial (50,000 due) (YELLOW)**
- **Test:** Shows "Partial (50,000 due)" in yellow

---

### 7. CANCELLED Tab (1 booking)

**Maria Lopez**
- Check-in: 3 days from now (was planned)
- Check-out: 5 days from now (was planned)
- Room Type: Suite
- Total: 200,000 FCFA
- Status: CANCELLED
- **Test:** View modal should NOT show payment details

---

## 🧪 Testing Scenarios

### Test 1: Conditional Payment Display

**Steps:**
1. Go to **Pending** tab
2. Click "View" on Alice Johnson
3. **Expected:** NO payment details shown (only Total Charges)

4. Go to **In-House** tab
5. Click "View" on Emma Davis
6. **Expected:** Shows Amount Paid and Outstanding Balance (red)

---

### Test 2: Color Coding

**In-House Tab:**
- Emma Davis: Outstanding 100,000 FCFA → **RED**
- Frank Wilson: Outstanding 0 FCFA → **GREEN**

**Departures Tab:**
- Grace Taylor: Outstanding 40,000 FCFA → **RED**
- Henry Brown: Outstanding 0 FCFA → **GREEN**

**Past Tab:**
- Karen White: Payment Status "Paid" → **GREEN**
- Leo Garcia: Payment Status "Partial (50,000 due)" → **YELLOW**

---

### Test 3: Arrivals Tab Enhanced Display

**Carol Martinez (no deposit):**
```
Expected Charges
300,000 FCFA
```

**David Chen (with deposit):**
```
Expected Charges
150,000 FCFA
(100,000 due at check-in)
```

---

### Test 4: Record Payment

**Steps:**
1. Go to **In-House** tab
2. Click "View" on Emma Davis
3. Click "Record Payment"
4. Enter 50,000 FCFA
5. Submit
6. **Expected:** Outstanding reduces to 50,000 FCFA

---

### Test 5: Add Charge

**Steps:**
1. Go to **In-House** tab
2. Click "View" on Frank Wilson (fully paid)
3. Click "Add Charge"
4. Add 20,000 FCFA for "Minibar"
5. Submit
6. **Expected:** 
   - Total becomes 120,000 FCFA
   - Outstanding becomes 20,000 FCFA (red)
   - Payment status changes to "Partial"
   - Record Payment button appears

---

### Test 6: Check-Out with Outstanding

**Steps:**
1. Go to **Departures** tab
2. Click "Check-out" on Grace Taylor
3. **Expected:** Modal shows 40,000 FCFA outstanding
4. Can record payment before checkout
5. Or checkout with unpaid balance

---

### Test 7: Past Tab Payment Status

**Steps:**
1. Go to **Past** tab
2. **Expected to see:**
   - Karen White: "Paid ✓" in green
   - Leo Garcia: "Partial (50,000 due)" in yellow
3. Click "View" on Leo Garcia
4. **Expected:** Shows payment details with outstanding

---

## 🎨 Visual Reference

### In-House Tab Display
```
Room | Guest        | Nights | Check-in | Outstanding   | Actions
101  | Emma Davis   | 3      | 14:30    | 100,000 🔴   | [Check-out] [Charge]
102  | Frank Wilson | 2      | 15:00    | 0 🟢         | [Check-out] [Charge]
```

### Departures Tab Display
```
Room | Guest        | Check-in  | Check-out | Outstanding  | Actions
103  | Grace Taylor | Oct 5     | Oct 6     | 40,000 🔴   | [Check-out] [View]
104  | Henry Brown  | Oct 5     | Oct 6     | 0 🟢        | [Check-out] [View]
```

### Past Tab Display
```
Ref  | Guest        | Room | Stay      | Final Total  | Payment Status        | Actions
B011 | Karen White  | 105  | Sep 29-Oct 3 | 100,000   | Paid ✓ 🟢           | [View] [Receipt]
B012 | Leo Garcia   | 106  | Sep 29-Oct 3 | 150,000   | Partial (50k) 🟡    | [View] [Receipt]
```

---

## 🔄 Quick Actions to Test

### 1. Check-In Flow
- Go to Arrivals → Check-in Carol Martinez
- Should move to In-House tab
- Can then add charges and payments

### 2. Payment Recording
- In-House → Emma Davis → Record Payment
- Try partial payment (50,000)
- Try full payment (100,000)

### 3. Charge Addition
- In-House → Frank Wilson → Add Charge
- Add 20,000 for minibar
- Watch outstanding appear

### 4. Check-Out Flow
- Departures → Grace Taylor → Check-out
- See outstanding balance warning
- Can record payment first

### 5. Confirm Booking
- Pending → Alice Johnson → Confirm
- Should move to Arrivals tab

---

## 📝 Expected Behaviors

### Payment Details Visibility

| Tab | Show Payment Details? | Reason |
|-----|----------------------|--------|
| Pending | ❌ No | Not confirmed |
| Arrivals | ✅ Yes | Check deposit |
| In-House | ✅ Yes | Collect payments |
| Departures | ✅ Yes | Final settlement |
| Upcoming | ❌ No | Future booking |
| Past | ✅ Yes | Historical record |
| Cancelled | ❌ No | Cancelled |

### Color Coding

| Color | Meaning | Where |
|-------|---------|-------|
| 🔴 Red | Outstanding > 0 | In-House, Departures |
| 🟢 Green | Paid / Outstanding = 0 | In-House, Departures, Past |
| 🟡 Yellow | Partial Payment | Past |

---

## 🗑️ Clean Up Test Data

To remove all test bookings and start fresh:

```bash
# Delete all bookings (use with caution!)
curl -X DELETE http://localhost:8080/api/admin/bookings/all
```

Or delete individually through the UI.

---

## 🔄 Re-run Test Data

To add test data again:

```bash
cd ~/Documents/Admin-platform
./add-test-bookings.sh
```

---

## 📊 Summary

**Total Test Bookings:** 13

- ✅ Pending: 2
- ✅ Arrivals: 2 (1 with deposit, 1 without)
- ✅ In-House: 2 (1 partial, 1 paid)
- ✅ Departures: 2 (1 outstanding, 1 paid)
- ✅ Upcoming: 2
- ✅ Past: 2 (1 paid, 1 outstanding)
- ✅ Cancelled: 1

**Payment Scenarios Covered:**
- No payment
- Partial payment
- Full payment
- Payment with charges
- Outstanding balance
- Deposit handling

**All features ready to test!** 🎉

---

*Test data created: 2025-10-06*
*Script: add-test-bookings.sh*
*Ready for comprehensive testing*
