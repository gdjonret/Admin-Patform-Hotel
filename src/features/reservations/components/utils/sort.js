export function sortReservations(arr, sortConfig) {
  // Handle empty or invalid arrays
  if (!arr || !Array.isArray(arr)) return [];
  
  // If no sort config or key, return a copy of the original array
  if (!sortConfig?.key) return [...arr];
  
  const { key, direction } = sortConfig;
  const dir = direction === "ascending" ? 1 : -1;

  return [...arr].sort((a, b) => {
    // Handle cases where objects might be missing properties
    if (!a || !b) return 0;
    
    const A = a[key];
    const B = b[key];
    
    // Handle null/undefined values - always sort them to the end
    if (A == null && B == null) return 0;
    if (A == null) return 1; // null values go to the end
    if (B == null) return -1;
    
    // Date sorting
    if (key === "checkIn" || key === "checkOut") {
      try {
        const dateA = new Date(A);
        const dateB = new Date(B);
        
        // Check if dates are valid
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dir * (dateA - dateB);
      } catch (error) {
        console.error("Error sorting dates:", error);
        return 0;
      }
    }
    
    // String sorting
    if (typeof A === "string" && typeof B === "string") {
      return dir * A.localeCompare(B, undefined, { sensitivity: 'base' });
    }
    
    // Number sorting
    if (typeof A === "number" && typeof B === "number") {
      return dir * (A - B);
    }
    
    // Fallback for mixed types - convert to strings
    return dir * String(A).localeCompare(String(B));
  });
}
  