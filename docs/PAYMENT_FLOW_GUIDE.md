# Payment System Flow Guide

## Visual Flow Diagrams

### 1. Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     BOOKING CREATED                              │
│  Total: 100,000 FCFA | Paid: 0 | Status: Unpaid | Balance: 100k │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Admin clicks    │
                    │ "View Booking"  │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              VIEW RESERVATION MODAL                              │
│                                                                  │
│  Guest: John Doe                                                │
│  Room: 102                                                      │
│                                                                  │
│  💰 PAYMENT DETAILS                                             │
│  ├─ Total Price:        100,000 FCFA                           │
│  ├─ Amount Paid:              0 FCFA                           │
│  └─ Outstanding:        100,000 FCFA (RED)                     │
│                                                                  │
│  [Record Payment] ← Button visible (balance > 0)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Admin clicks    │
                    │ Record Payment  │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PAYMENT MODAL                                  │
│                                                                  │
│  Guest: John Doe                                                │
│  Room: 102                                                      │
│  Total Charges:    100,000 FCFA                                │
│  Amount Paid:            0 FCFA                                │
│  Outstanding:      100,000 FCFA (RED)                          │
│                                                                  │
│  Payment Amount: [50000____] FCFA                              │
│  Payment Method: [Cash ▼]                                      │
│  Notes: [First installment_______]                             │
│                                                                  │
│  New Outstanding: 50,000 FCFA                                  │
│                                                                  │
│  [Cancel]  [Record Payment]                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Submit Payment  │
                    │ Backend API     │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND PROCESSING                                  │
│                                                                  │
│  1. Validate amount > 0                           ✓             │
│  2. Check amountPaid + payment <= totalPrice      ✓             │
│  3. Update amountPaid: 0 + 50,000 = 50,000                     │
│  4. Calculate status:                                           │
│     - 50,000 >= 100,000? No                                    │
│     - 50,000 > 0? Yes → Status = "Partial"                     │
│  5. Save booking                                  ✓             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              VIEW RESERVATION MODAL (UPDATED)                    │
│                                                                  │
│  💰 PAYMENT DETAILS                                             │
│  ├─ Total Price:        100,000 FCFA                           │
│  ├─ Amount Paid:         50,000 FCFA (GREEN)                   │
│  └─ Outstanding:         50,000 FCFA (RED)                     │
│                                                                  │
│  Status: [PARTIAL]                                             │
│  [Record Payment] ← Still visible (balance > 0)                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Critical Fix: Charge After Full Payment

```
BEFORE FIX (INCORRECT):
┌─────────────────────────────────────────────────────────────────┐
│  Booking: 100,000 FCFA | Paid: 100,000 | Status: Paid          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Add 20k charge  │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Total: 120,000 | Paid: 100,000 | Status: Paid ❌               │
│  Outstanding: 20,000 FCFA                                       │
│  [Record Payment] button HIDDEN (status = Paid) ❌              │
└─────────────────────────────────────────────────────────────────┘

AFTER FIX (CORRECT):
┌─────────────────────────────────────────────────────────────────┐
│  Booking: 100,000 FCFA | Paid: 100,000 | Status: Paid          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Add 20k charge  │
                    │ + Recalculate   │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Total: 120,000 | Paid: 100,000 | Status: Partial ✓            │
│  Outstanding: 20,000 FCFA (RED)                                │
│  [Record Payment] button VISIBLE ✓                             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Payment Status State Machine

```
                    ┌─────────┐
                    │ UNPAID  │
                    │ Paid: 0 │
                    └─────────┘
                         │
                         │ Record any payment
                         ↓
                    ┌─────────┐
              ┌────→│ PARTIAL │←────┐
              │     │ 0<Paid<T│     │
              │     └─────────┘     │
              │          │          │
    Add charge│          │          │Add charge
    (increases│          │Pay full  │(increases
    total)    │          │balance   │total)
              │          ↓          │
              │     ┌─────────┐     │
              └─────│  PAID   │─────┘
                    │ Paid≥T  │
                    └─────────┘

Legend:
T = Total Price
Paid = Amount Paid
```

---

### 4. UI Color Coding

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT DISPLAY                               │
│                                                                  │
│  UNPAID (Outstanding = Total):                                  │
│  └─ Outstanding: 100,000 FCFA 🔴 RED (#dc2626)                 │
│                                                                  │
│  PARTIAL (0 < Outstanding < Total):                             │
│  ├─ Amount Paid: 50,000 FCFA 🟢 GREEN (#10b981)                │
│  └─ Outstanding: 50,000 FCFA 🔴 RED (#dc2626)                  │
│                                                                  │
│  PAID (Outstanding = 0):                                        │
│  ├─ Amount Paid: 100,000 FCFA 🟢 GREEN (#10b981)               │
│  └─ Outstanding: 0 FCFA 🟢 GREEN (#10b981)                     │
│                                                                  │
│  Background colors:                                             │
│  ├─ Outstanding > 0: Light Red (#fef2f2)                       │
│  └─ Outstanding = 0: Light Green (#f0fdf4)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Validation Flow

```
USER ENTERS PAYMENT AMOUNT
         ↓
    ┌─────────┐
    │ Amount? │
    └─────────┘
         ↓
    Is amount > 0?
    ├─ No → ❌ "Amount must be greater than 0"
    └─ Yes
         ↓
    amount > outstanding?
    ├─ Yes → ❌ "Cannot exceed outstanding balance"
    └─ No
         ↓
    Payment method selected?
    ├─ No → ❌ "Please select payment method"
    └─ Yes
         ↓
    ✅ SUBMIT TO BACKEND
         ↓
    Backend validates again
    ├─ amount <= 0? → ❌ 400 Error
    ├─ amount > outstanding? → ❌ 400 Error
    └─ Valid → ✅ Process payment
         ↓
    Update booking
    ├─ amountPaid += amount
    ├─ Update paymentStatus
    └─ Save to database
         ↓
    Return updated booking
         ↓
    Frontend updates UI
    ├─ Show success toast
    ├─ Close modal
    ├─ Refresh reservation data
    └─ Update outstanding balance display
```

---

### 6. Multiple Partial Payments Example

```
Step 1: Initial Booking
┌──────────────────────────────────────┐
│ Total: 150,000 | Paid: 0 | Unpaid   │
│ Outstanding: 150,000 FCFA            │
└──────────────────────────────────────┘

Step 2: First Payment (50,000)
┌──────────────────────────────────────┐
│ Total: 150,000 | Paid: 50,000        │
│ Status: Partial                      │
│ Outstanding: 100,000 FCFA            │
└──────────────────────────────────────┘

Step 3: Second Payment (50,000)
┌──────────────────────────────────────┐
│ Total: 150,000 | Paid: 100,000       │
│ Status: Partial                      │
│ Outstanding: 50,000 FCFA             │
└──────────────────────────────────────┘

Step 4: Final Payment (50,000)
┌──────────────────────────────────────┐
│ Total: 150,000 | Paid: 150,000       │
│ Status: Paid ✓                       │
│ Outstanding: 0 FCFA                  │
│ [Record Payment] button hidden       │
└──────────────────────────────────────┘
```

---

### 7. Charge and Payment Interaction

```
Timeline View:

Day 1: Booking Created
├─ Total: 100,000 FCFA
├─ Paid: 0
└─ Status: Unpaid

Day 2: Guest Checks In, Pays Deposit
├─ Payment: 50,000 FCFA
├─ Total: 100,000 FCFA
├─ Paid: 50,000 FCFA
└─ Status: Partial

Day 3: Room Service Charge
├─ Charge: 15,000 FCFA
├─ Total: 115,000 FCFA (↑)
├─ Paid: 50,000 FCFA
└─ Status: Partial (recalculated)

Day 4: Minibar Charge
├─ Charge: 10,000 FCFA
├─ Total: 125,000 FCFA (↑)
├─ Paid: 50,000 FCFA
└─ Status: Partial (recalculated)

Day 5: Guest Checks Out, Pays Balance
├─ Payment: 75,000 FCFA
├─ Total: 125,000 FCFA
├─ Paid: 125,000 FCFA
└─ Status: Paid ✓
```

---

## Quick Reference

### Payment Status Rules
```
Unpaid:  amountPaid = 0
Partial: 0 < amountPaid < totalPrice
Paid:    amountPaid >= totalPrice
```

### Outstanding Balance Formula
```
outstandingBalance = totalPrice - amountPaid
```

### Button Visibility
```
Show "Record Payment" button when: outstandingBalance > 0
Hide "Record Payment" button when: outstandingBalance <= 0
```

### Color Codes
```
Red (#dc2626):     Unpaid/Outstanding
Green (#10b981):   Paid/Completed
Light Red (#fef2f2):   Background for outstanding
Light Green (#f0fdf4): Background for paid
```

---

## API Endpoints

### Record Payment
```
POST /api/admin/bookings/{id}/payments

Request:
{
  "amount": 50000.00,
  "paymentMethod": "Cash",
  "notes": "Partial payment"
}

Response:
{
  "id": 1,
  "totalPrice": 100000.00,
  "amountPaid": 50000.00,
  "paymentStatus": "Partial",
  ...
}
```

### Add Charge
```
POST /api/admin/bookings/{id}/charges

Request:
{
  "amount": 20000.00,
  "description": "Room service",
  "category": "ROOM_SERVICE"
}

Response:
{
  "id": 1,
  "totalPrice": 120000.00,  // Updated
  "amountPaid": 100000.00,
  "paymentStatus": "Partial", // Recalculated!
  ...
}
```

---

## Testing Commands

### Run automated test:
```bash
cd ~/Documents/Admin-platform
./test-payment-logic.sh
```

### Manual API test:
```bash
# Record payment
curl -X POST http://localhost:8080/api/admin/bookings/1/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "paymentMethod": "Cash", "notes": "Test"}'

# Add charge
curl -X POST http://localhost:8080/api/admin/bookings/1/charges \
  -H "Content-Type: application/json" \
  -d '{"amount": 20000, "description": "Room service", "category": "ROOM_SERVICE"}'
```

---

*Last Updated: 2025-10-06*
*All flows verified and tested*
