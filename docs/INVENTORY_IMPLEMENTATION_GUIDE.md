# Inventory Management Implementation Guide

## 📊 What is Inventory?

Inventory is an **advanced feature** for managing room availability at a daily level. It allows you to:

- ✅ Control how many rooms to sell per day (even if you have more physical rooms)
- ✅ Block rooms for maintenance or special events
- ✅ Track bookings per room type per day
- ✅ Override availability for specific dates

---

## 🏗️ How It Works

### **Database Structure:**

```sql
CREATE TABLE inventory (
    id           BIGSERIAL PRIMARY KEY,
    room_type_id BIGINT NOT NULL,        -- Which room type (Standard, Deluxe)
    inv_date     DATE NOT NULL,          -- Which specific date
    total        INT NOT NULL,           -- Total rooms available to sell
    booked       INT NOT NULL DEFAULT 0, -- How many are reserved
    blocked      INT NOT NULL DEFAULT 0, -- How many are blocked
    UNIQUE (room_type_id, inv_date)
);
```

### **The Formula:**

```
Available = total - booked - blocked
```

**Example for Oct 15, 2025 (Deluxe Rooms):**
- Total: 10 rooms
- Booked: 7 rooms (by guests)
- Blocked: 1 room (maintenance)
- **Available: 2 rooms** ✅

---

## 🎯 Use Cases

### 1. **Maintenance Block**
```
Oct 1-15: Block 3 rooms for renovation
→ blocked = 3
→ Only 7 rooms available instead of 10
```

### 2. **Special Events**
```
Conference on Oct 20: Reserve 5 rooms for group
→ blocked = 5
→ Prevents individual bookings
```

### 3. **Seasonal Adjustments**
```
Low season: total = 8 (keep 2 rooms closed)
High season: total = 10 (open all rooms)
```

### 4. **Overbooking Strategy**
```
Physical rooms: 10
Inventory total: 12 (intentional overbooking)
→ Can sell 2 extra rooms (common in hotels)
```

---

## 📁 Files Created

### **Frontend:**

1. **`src/api/inventory.js`** - API calls for inventory
   - `getInventory(roomTypeId, fromDate, toDate)` - Fetch inventory
   - `getRoomTypes()` - Get room types for dropdown

2. **`src/pages/Inventory.js`** - Inventory management page
   - View inventory by room type and date range
   - Shows total, booked, blocked, available
   - Visual utilization bar

### **Backend:**

3. **`AdminRoomTypeController.java`** - Room types endpoint
   - `GET /api/admin/room-types` - List all active room types
   - `GET /api/admin/room-types/{id}` - Get specific room type

---

## 🔧 Setup Instructions

### **Step 1: Add Inventory Page to Navigation**

Edit your `App.js` or routing file:

```javascript
import Inventory from './pages/Inventory';

// Add to your routes:
<Route path="/inventory" element={<Inventory />} />
```

### **Step 2: Add Navigation Link**

In your sidebar/navigation:

```javascript
<Link to="/inventory">
  <FaWarehouse /> Inventory
</Link>
```

### **Step 3: Update API Base URL**

In `src/api/inventory.js`, make sure the endpoints match:

```javascript
// Should call:
// GET /api/admin/inventory?roomTypeId=1&from=2025-10-01&toExclusive=2025-10-31
// GET /api/admin/room-types
```

### **Step 4: Restart Backend**

The backend already has the inventory endpoints! Just restart:

```bash
cd /Users/gloriadjonret/Desktop/Backend-Hotel\ 2
./mvnw spring-boot:run
```

---

## 🧪 Testing the Inventory Page

### **1. Access the Page**

Navigate to: `http://localhost:3000/inventory`

### **2. What You'll See**

- **Room Type Dropdown:** Standard, Deluxe
- **Date Range Selector:** From/To dates
- **Inventory Table:** Shows daily breakdown

### **3. If No Inventory Records Exist**

You'll see a message:
> "No inventory records found. The system will use room count method."

**This is normal!** Inventory is optional. The system works fine without it.

---

## 📊 Sample Data (Optional)

If you want to test with inventory data, run this SQL:

```sql
-- Create inventory for Deluxe rooms (roomTypeId = 1) for October 2025
INSERT INTO inventory (room_type_id, inv_date, total, booked, blocked) VALUES
(1, '2025-10-01', 10, 0, 0),  -- 10 available
(1, '2025-10-02', 10, 3, 0),  -- 7 available (3 booked)
(1, '2025-10-03', 10, 5, 0),  -- 5 available (5 booked)
(1, '2025-10-04', 10, 7, 1),  -- 2 available (7 booked, 1 blocked)
(1, '2025-10-05', 10, 10, 0), -- 0 available (fully booked)
(1, '2025-10-06', 10, 2, 3);  -- 5 available (2 booked, 3 blocked)

-- Create inventory for Standard rooms (roomTypeId = 2)
INSERT INTO inventory (room_type_id, inv_date, total, booked, blocked) VALUES
(2, '2025-10-01', 5, 0, 0),
(2, '2025-10-02', 5, 2, 0),
(2, '2025-10-03', 5, 3, 0);
```

---

## 🎨 UI Features

### **Inventory Table Columns:**

| Column | Description |
|--------|-------------|
| Date | The specific date |
| Total | Total rooms of this type |
| Booked | Rooms reserved by bookings |
| Blocked | Rooms blocked for maintenance/events |
| Available | Free rooms (Total - Booked - Blocked) |
| Status | Visual bar showing utilization % |

### **Color Coding:**

- 🟢 **Green:** Available rooms (< 80% utilized)
- 🔴 **Red:** High utilization (> 80% utilized)

---

## 🔄 How Inventory Integrates with Bookings

### **When a Booking is Created:**

```java
// In BookingService.createFromPublic()
inventoryRepo.incrementBookedRange(
    roomTypeId,
    checkInDate,
    checkOutDate,
    1  // Reserve 1 room
);
```

This **automatically updates** the `booked` count in inventory!

### **When a Booking is Cancelled:**

```java
inventoryRepo.decrementBookedRange(
    roomTypeId,
    checkInDate,
    checkOutDate,
    1  // Release 1 room
);
```

---

## ⚠️ Important Notes

### **1. Inventory is Optional**

- ✅ System works fine **without** inventory records
- ✅ Falls back to counting physical rooms
- ✅ You can add inventory later when needed

### **2. Inventory vs. Physical Rooms**

- **Physical Rooms:** Actual rooms in your hotel (Room 101, 102, etc.)
- **Inventory:** How many rooms you want to **sell** per day
- They can be **different** (e.g., 10 physical rooms, but only sell 8)

### **3. Auto-Update**

- When bookings are created/cancelled, inventory updates automatically
- You don't need to manually adjust the `booked` count

---

## 🚀 Next Steps

### **Basic Setup (Recommended):**
1. ✅ Add Inventory page to navigation
2. ✅ Restart backend
3. ✅ Test the page (it's okay if no data shows)

### **Advanced Setup (Optional):**
1. Add sample inventory data (SQL above)
2. Create UI for editing inventory (add/update records)
3. Add bulk operations (set inventory for multiple days)

---

## 📝 Summary

**Inventory Management is now available in your admin client!**

- ✅ View daily availability by room type
- ✅ See total, booked, blocked, available counts
- ✅ Visual utilization tracking
- ✅ Fully integrated with backend

**To use it:**
1. Add to navigation
2. Access `/inventory` route
3. Select room type and date range
4. View inventory breakdown

**Remember:** Inventory is optional! Your system works perfectly without it. Add inventory records only when you need advanced availability control.
