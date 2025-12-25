# Payment Recording System - Testing Guide

## Prerequisites
- Backend running on port 8080
- Frontend running on port 3000
- Database migration V18 applied

## Test Scenarios

### 1. View Outstanding Balance
**Steps:**
1. Navigate to Reservations page
2. Click on any reservation to view details
3. Verify the ViewReservationModal shows:
   - Total Price
   - Amount Paid
   - Outstanding Balance (in red if unpaid/partial, green if paid)
   - Payment Status badge

**Expected:**
- Outstanding balance = Total Price - Amount Paid
- "Record Payment" button visible if balance > 0

### 2. Record Full Payment
**Steps:**
1. Open a reservation with outstanding balance
2. Click "Record Payment" button
3. PaymentModal opens showing:
   - Total Price: 150,000 XAF
   - Amount Paid: 0 XAF
   - Outstanding Balance: 150,000 XAF
4. Enter:
   - Amount: 150000
   - Payment Method: Cash
   - Notes: "Full payment received"
5. Click "Record Payment"

**Expected:**
- Success toast message
- Modal closes
- ViewReservationModal updates:
  - Amount Paid: 150,000 XAF
  - Outstanding Balance: 0 XAF (green)
  - Payment Status: "Paid"
  - "Record Payment" button disappears

### 3. Record Partial Payment
**Steps:**
1. Open a reservation with 150,000 XAF total
2. Click "Record Payment"
3. Enter:
   - Amount: 50000
   - Payment Method: Credit Card
   - Notes: "First installment"
4. Click "Record Payment"

**Expected:**
- Success toast
- ViewReservationModal shows:
  - Amount Paid: 50,000 XAF
  - Outstanding Balance: 100,000 XAF (red)
  - Payment Status: "Partial"
  - "Record Payment" button still visible

### 4. Record Second Partial Payment
**Steps:**
1. On same reservation from Test 3
2. Click "Record Payment" again
3. Modal shows:
   - Total Price: 150,000 XAF
   - Amount Paid: 50,000 XAF
   - Outstanding Balance: 100,000 XAF
4. Enter:
   - Amount: 100000
   - Payment Method: Cash
   - Notes: "Final payment"
5. Click "Record Payment"

**Expected:**
- Success toast
- ViewReservationModal shows:
  - Amount Paid: 150,000 XAF
  - Outstanding Balance: 0 XAF (green)
  - Payment Status: "Paid"
  - "Record Payment" button disappears

### 5. Prevent Overpayment
**Steps:**
1. Open reservation with 100,000 XAF outstanding
2. Click "Record Payment"
3. Enter:
   - Amount: 150000 (more than outstanding)
   - Payment Method: Cash
4. Click "Record Payment"

**Expected:**
- Error toast: "Payment amount exceeds outstanding balance"
- Modal stays open
- No changes to reservation

### 6. Validate Negative Amount
**Steps:**
1. Open any reservation
2. Click "Record Payment"
3. Enter:
   - Amount: -50000
   - Payment Method: Cash
4. Click "Record Payment"

**Expected:**
- Error message: "Payment amount must be greater than zero"
- Modal stays open
- No changes to reservation

### 7. Test All Payment Methods
**Steps:**
1. Record payments using each method:
   - Cash
   - Credit Card
   - Debit Card
   - Bank Transfer
   - Mobile Payment

**Expected:**
- All methods work correctly
- Payment method saved and displayed

### 8. Test Empty Amount
**Steps:**
1. Open payment modal
2. Leave amount field empty
3. Click "Record Payment"

**Expected:**
- Validation error
- Form prevents submission

### 9. Backend API Test (Optional)
**Using curl or Postman:**

```bash
# Record payment
curl -X POST http://localhost:8080/api/admin/bookings/1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000.00,
    "paymentMethod": "Cash",
    "notes": "Test payment"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "amountPaid": 50000.00,
  "paymentStatus": "Partial",
  "paymentMethod": "Cash",
  ...
}
```

### 10. Database Verification
**Check database:**

```sql
-- Verify migration applied
SELECT * FROM flyway_schema_history WHERE version = '18';

-- Check bookings table structure
\d bookings;

-- Verify amount_paid column exists
SELECT id, total_price, amount_paid, payment_status 
FROM bookings 
LIMIT 5;
```

**Expected:**
- Migration V18 in flyway_schema_history
- amount_paid column exists with NUMERIC(12,2) type
- Default value 0 for existing records

## Edge Cases to Test

### 11. Zero Amount Payment
- Try to record 0 amount
- Should be rejected

### 12. Very Large Amount
- Try amount with many decimal places (e.g., 50000.12345)
- Should round to 2 decimal places

### 13. Multiple Quick Payments
- Record several payments in quick succession
- All should be processed correctly
- Total should sum correctly

### 14. Payment on Cancelled Reservation
- Try to record payment on cancelled booking
- Should work (in case of refunds tracking)

### 15. Payment on Checked-Out Reservation
- Record payment after checkout
- Should work (for late charges)

## Common Issues & Solutions

### Issue: "Record Payment" button not showing
**Solution:** Check that outstanding balance > 0

### Issue: Payment not updating UI
**Solution:** Check browser console for API errors

### Issue: Migration not applied
**Solution:** 
```bash
cd ~/Desktop/Backend-Hotel\ 2
./mvnw flyway:migrate
```

### Issue: Backend error "column amount_paid does not exist"
**Solution:** Restart backend to apply migration

### Issue: Frontend shows NaN for balance
**Solution:** Check that amountPaid is initialized to 0 in useReservations

## Success Criteria

✅ All 15 test scenarios pass
✅ No console errors in browser
✅ No backend errors in logs
✅ Database correctly stores payment data
✅ UI updates in real-time
✅ Validation prevents invalid payments
✅ Multiple partial payments sum correctly
✅ Payment status updates automatically

## Performance Checks

- Payment recording should complete in < 1 second
- UI should update immediately after success
- No memory leaks after multiple operations
- Modal animations smooth

## Browser Compatibility

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

All features should work identically across browsers.
