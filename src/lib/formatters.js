// src/lib/formatters.js

// Format currency (e.g. USD, EUR, CFA)
export function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

// Format FCFA currency (West African CFA franc)
export function formatFCFA(amount) {
  if (amount === null || amount === undefined) return "0 FCFA";
  
  const num = Number(amount);
  if (isNaN(num)) return "0 FCFA";
  
  // Format with thousands separator and no decimals (FCFA doesn't use decimals)
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num) + " FCFA";
}

// Format balance (alias for FCFA)
export function formatBalance(amount) {
  return formatFCFA(amount);
}

// Format phone numbers (basic, can extend for locales)
export function formatPhone(number) {
  return number.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

// Format guest name (capitalize first/last)
export function formatGuestName(first, last) {
  return `${first} ${last}`.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format room type (return as-is from database)
export function formatRoomType(roomType) {
  if (!roomType) return "—";
  
  // Return the room type exactly as stored in the database
  return roomType;
}

// Get short room type label (for compact displays)
export function getShortRoomType(roomType) {
  if (!roomType) return "—";
  
  // Extract just the main type (e.g., "DELUXE SINGLE ROOM" -> "Deluxe")
  const mainType = roomType
    .replace(/\s+SINGLE\s+/i, ' ')
    .replace(/\s+ROOM$/i, '')
    .trim()
    .split(' ')[0];
  
  return mainType.charAt(0).toUpperCase() + mainType.slice(1).toLowerCase();
}