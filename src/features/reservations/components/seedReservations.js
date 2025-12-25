import { atMidnight } from "../../lib/dates";

// ---- date helpers ----
const formatYMD = (date) => new Date(date).toISOString().split("T")[0];
const addDays = (baseDate, n) => formatYMD(new Date(baseDate.getTime() + n * 24 * 60 * 60 * 1000));

// baseline dates
const today = atMidnight(new Date());
const tomorrow = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
const fiveDaysLater = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
const tenDaysLater = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

// formatted strings
const todayStr = formatYMD(today);
const tomorrowStr = formatYMD(tomorrow);
const threeDaysAgoStr = formatYMD(threeDaysAgo);
const fiveDaysAgoStr = formatYMD(fiveDaysAgo);
const fiveDaysLaterStr = formatYMD(fiveDaysLater);
const tenDaysLaterStr = formatYMD(tenDaysLater);

// ---- initial rows (exactly your data) ----
const seed = [
  // Arrivals (today and tomorrow)
  {
    id: 1001,
    reference: "HLP250830-AB12",
    guestName: "John Smith",
    roomType: "DELUXE SINGLE ROOM",
    roomNumber: "101",
    checkIn: todayStr, // Today
    checkOut: fiveDaysLaterStr,
    status: "CONFIRMED",
    paymentStatus: "Paid",
    notes: "Early check-in requested",
    checkInTime: "",
    balance: 0
  },
  {
    id: 1002,
    reference: "HLP250831-CD34",
    guestName: "Sarah Johnson",
    roomType: "STANDARD SINGLE ROOM",
    roomNumber: "205",
    checkIn: tomorrowStr, // Tomorrow
    checkOut: fiveDaysLaterStr,
    status: "CONFIRMED",
    paymentStatus: "Pending",
    notes: "Business traveler, late checkout"
  },

  // In-house guests
  {
    id: 1003,
    reference: "HLP250825-EF56",
    guestName: "Robert Johnson",
    roomType: "DELUXE SINGLE ROOM",
    roomNumber: "301",
    checkIn: threeDaysAgoStr,
    checkOut: tomorrowStr,
    status: "CHECKED_IN",
    paymentStatus: "Paid",
    notes: "VIP guest",
    checkInTime: "2:30 PM",
    balance: 150.0
  },
  {
    id: 1004,
    reference: "HLP250826-GH78",
    guestName: "Emily Wilson",
    roomType: "STANDARD SINGLE ROOM",
    roomNumber: "402",
    checkIn: fiveDaysAgoStr,
    checkOut: todayStr,
    status: "CHECKED_IN",
    paymentStatus: "Paid",
    notes: "Family of 4, extra bed requested",
    checkInTime: "3:15 PM",
    balance: 75.5
  },

  // Departures (checking out today)
  {
    id: 1005,
    reference: "HLP250823-IJ90",
    guestName: "Michael Brown",
    roomType: "STANDARD SINGLE ROOM",
    roomNumber: "105",
    checkIn: threeDaysAgoStr,
    checkOut: todayStr, // Today
    status: "CHECKED_IN",
    paymentStatus: "Paid",
    notes: "Late checkout requested",
    checkInTime: "1:45 PM",
    balance: 0
  },
  {
    id: 1006,
    reference: "HLP250824-KL12",
    guestName: "Jennifer Davis",
    roomType: "DELUXE SINGLE ROOM",
    roomNumber: "202",
    checkIn: fiveDaysAgoStr,
    checkOut: todayStr, // Today
    status: "CHECKED_IN",
    paymentStatus: "Pending",
    notes: "",
    checkInTime: "4:00 PM",
    balance: 250.75
  },

  // Upcoming reservations
  {
    id: 1007,
    reference: "HLP250905-MN34",
    guestName: "David Wilson",
    roomType: "DELUXE SINGLE ROOM",
    roomNumber: "",
    checkIn: fiveDaysLaterStr,
    checkOut: tenDaysLaterStr,
    status: "CONFIRMED",
    paymentStatus: "Pending",
    notes: "Business trip, high-floor room preferred"
  },
  {
    id: 1008,
    reference: "HLP250910-OP56",
    guestName: "Lisa Anderson",
    roomType: "DELUXE SINGLE ROOM",
    roomNumber: "",
    checkIn: tenDaysLaterStr,
    checkOut: addDays(tenDaysLater, 5),
    status: "CONFIRMED",
    paymentStatus: "Paid",
    notes: "Honeymoon couple, special decoration requested"
  },

  // Past stays
  {
    id: 1009,
    reference: "HLP250815-QR78",
    guestName: "Thomas Miller",
    roomType: "STANDARD SINGLE ROOM",
    roomNumber: "304",
    checkIn: addDays(fiveDaysAgo, -10),
    checkOut: addDays(fiveDaysAgo, -5),
    status: "CHECKED_OUT",
    paymentStatus: "Paid",
    notes: "Regular guest",
    checkInTime: "2:00 PM",
    checkOutTime: "11:30 AM",
    balance: 0
  },
  {
    id: 1010,
    reference: "HLP250810-ST90",
    guestName: "Amanda Clark",
    roomType: "STANDARD SINGLE ROOM",
    roomNumber: "401",
    checkIn: addDays(fiveDaysAgo, -15),
    checkOut: addDays(fiveDaysAgo, -8),
    status: "CHECKED_OUT",
    paymentStatus: "Paid",
    notes: "Family vacation",
    checkInTime: "3:30 PM",
    checkOutTime: "10:15 AM",
    balance: 0
  },

  // Cancelled
  {
    id: 1011,
    reference: "HLP250820-UV12",
    guestName: "Richard Taylor",
    roomType: "DELUXE SINGLE ROOM",
    roomNumber: "",
    checkIn: addDays(fiveDaysAgo, -5),
    checkOut: fiveDaysAgoStr,
    status: "CANCELLED",
    notes: "Cancelled due to emergency",
    cancellationDate: "2025-08-18"
  }
];

export default seed;
