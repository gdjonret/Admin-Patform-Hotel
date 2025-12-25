# Early Check-Out UI Enhancement

## Visual Indicators Added

### **Scenario: Guest Leaves Early**
- **Reservation Check-Out**: October 10, 2025
- **Today's Date**: October 7, 2025
- **Guest leaves**: 3 days early

---

## UI Display

### **Check-Out Modal Now Shows:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Guest Check-Out                          │
├─────────────────────────────────────────────────────────────┤
│  Reservation Details                    #HLP251007-A3B2     │
│                                                             │
│  Guest Name                Room Type                        │
│  John Doe                  Deluxe                          │
│                                                             │
│  Check-In Date                                             │
│  ven. 5 oct. 2025                                          │
│                                                             │
│  Check-Out Date                                            │
│  ven. 10 oct. 2025  🔵 Early Departure (3 days early)     │
│                                                             │
│  Length of Stay                                            │
│  5 nights (Reserved)  (Actual: 2 nights)                   │
│                                                             │
│  Room Number                                               │
│  #102                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## What Each Indicator Shows

### 1. **Early Departure Badge** 🔵
- **Color**: Blue background (#dbeafe)
- **Text**: Dark blue (#1e40af)
- **Shows**: "Early Departure (X days early)"
- **When**: Today is before the reservation check-out date

### 2. **Reserved vs Actual Nights**
- **Shows**: "5 nights (Reserved)" + "Actual: 2 nights"
- **Purpose**: Staff can see both values for billing decisions
- **Flexibility**: No automatic calculation - staff decides charges

### 3. **Visual Hierarchy**
- Original reservation info remains prominent
- Early departure indicators are informational
- Blue color indicates "informational" (vs amber for early arrival)

---

## Different Scenarios

### **On-Time Departure** (Oct 10 = Oct 10)
```
Check-Out Date: ven. 10 oct. 2025  [Today]
Length of Stay: 5 nights (Reserved)
```

### **Early Departure** (Oct 7 for Oct 10)
```
Check-Out Date: ven. 10 oct. 2025  🔵 Early Departure (3 days early)
Length of Stay: 5 nights (Reserved)  (Actual: 2 nights)
```

### **Late Departure** (Oct 12 for Oct 10)
```
Check-Out Date: ven. 10 oct. 2025
Length of Stay: 5 nights (Reserved)  (Actual: 7 nights)
```
*Note: Late departure would show more actual nights*

---

## Billing Method Toggle ✅ IMPLEMENTED

### **Interactive Billing Selection**
When guest checks out early, staff sees a billing method selector:

```
┌─────────────────────────────────────────────────┐
│ Billing Method (Early Departure):               │
│ ● Charge actual stay (2 nights)                │
│ ○ Charge full reservation (5 nights)           │
└─────────────────────────────────────────────────┘
```

### **How It Works**
✅ **Toggle only appears** for early checkouts  
✅ **Defaults to "actual stay"** (guest-friendly)  
✅ **Updates charges live** when selection changes  
✅ **Clear labels** show exact nights for each option  
✅ **Visual indicator** in room charge line shows which method is active  

### **Charges Summary Updates**
```
Room (2 nights × 25,000 FCFA) (Actual stay) = 50,000 FCFA
```
or
```
Room (5 nights × 25,000 FCFA) (Full reservation) = 125,000 FCFA
```

### **When You Define Policy**
Later, you can:
- Change the default selection based on your policy
- Remove the toggle and auto-apply your policy
- Add a third option for "partial refund with penalty"

---

## Color Scheme Comparison

| Scenario | Badge Color | Text Color | Meaning |
|----------|-------------|------------|---------|
| Early Arrival | #fef3c7 (Amber) | #92400e | Attention - May need extra charges |
| Early Departure | #dbeafe (Blue) | #1e40af | Information - May need refund/adjustment |
| Today | (existing) | (existing) | Current day indicator |

---

## Benefits

✅ **Staff Awareness**: Immediately see early departures  
✅ **Billing Flexibility**: Shows both reserved and actual nights  
✅ **No Policy Lock-in**: Decide charges case-by-case  
✅ **Data Collection**: Track early departures to inform future policy  
✅ **Audit Trail**: Clear record of what was reserved vs actual  

---

## Files Modified

1. `/src/components/Reservations/modals/CheckOutConfirmModal.js`
   - Added `isBeforeYmd` import (line 3)
   - Added billing method state (line 54)
   - Updated charge calculation logic (lines 145-152)
   - Added early departure badge (lines 287-299)
   - Added actual nights calculation (lines 310-319)
   - Added billing method toggle UI (lines 502-548)
   - Added billing indicator in room charge label (lines 554-558)

---

## Next Steps (Optional)

When you define your early checkout policy, we can add:
1. **Policy selector** - Choose refund/no-refund/penalty
2. **Automatic calculation** - Based on selected policy
3. **Admin settings** - Configure default policy
4. **Notes field** - Document reason for early departure
