import { isToday, isTomorrow, isFuture } from "../../../lib/dates";

export function getFilteredReservations(list, { activeTab, filterStatus, searchTerm, today }) {
  // Handle null or undefined list
  if (!list || !Array.isArray(list)) return [];
  
  // Create a safe copy to work with
  let filtered = [...list];

  // Apply tab-specific filters
  switch (activeTab) {
    case "Pending":
      filtered = filtered.filter(r => r.status === "PENDING");
      break;
    case "arrivals":
      filtered = filtered.filter(r => 
        r.status === "CONFIRMED" && 
        r.checkIn && 
        (isToday(r.checkIn, today) || isTomorrow(r.checkIn, today))
      );
      break;
    case "in-house":
      filtered = filtered.filter(r => r.status === "CHECKED_IN");
      break;
    case "departures":
      filtered = filtered.filter(r => 
        r.status === "CHECKED_IN" && 
        r.checkOut && 
        isToday(r.checkOut, today)
      );
      break;
    case "upcoming":
      filtered = filtered.filter(r => 
        r.status === "CONFIRMED" && 
        r.checkIn && 
        isFuture(r.checkIn, today) && 
        !isToday(r.checkIn, today) && 
        !isTomorrow(r.checkIn, today)
      );
      break;
    case "past":
      filtered = filtered.filter(r => r.status === "CHECKED_OUT");
      break;
    case "cancelled":
      filtered = filtered.filter(r => r.status === "CANCELLED");
      break;
    case "all":
      // No initial filtering for "all" tab
      break;
    default:
      // Default to showing all if tab is unknown
      console.warn(`Unknown tab: ${activeTab}, showing all reservations`);
      break;
  }

  // Apply status filter for the 'all' tab
  if (filterStatus && filterStatus !== "All" && activeTab === "all") {
    filtered = filtered.filter(r => r.status === filterStatus);
  }

  // Apply search term filter if provided
  if (searchTerm && searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(r => {
      // Safely check each field with null/undefined handling
      const guestName = (r.guestName || "").toLowerCase();
      const reference = (r.reference || "").toLowerCase();
      const roomNumber = (r.roomNumber || "").toLowerCase();
      const roomType = (r.roomType || "").toLowerCase();
      
      return guestName.includes(term) || 
             reference.includes(term) || 
             roomNumber.includes(term) || 
             roomType.includes(term);
    });
  }

  return filtered;
}
