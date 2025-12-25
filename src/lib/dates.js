// src/lib/dates.js
// -----------------------------------------------------------------------------
// Core YMD helpers (string "YYYY-MM-DD") — timezone-safe for business logic
// -----------------------------------------------------------------------------

export const DEFAULT_CHECKIN_TIME = "12:00";
export const DEFAULT_CHECKOUT_TIME = "12:00";

export function toYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(ymd) {
  // Create Date at LOCAL midnight for display/UI only
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function todayYmdTZ(tz = "Africa/Ndjamena") {
  // Today in hotel TZ as Y-M-D string (Chad timezone)
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [{ value: y }, , { value: m }, , { value: d }] = fmt.formatToParts(now);
  return `${y}-${m}-${d}`;
}

export function addDaysYmd(ymd, days) {
  const dt = parseYmd(ymd);
  dt.setDate(dt.getDate() + Number(days || 0));
  return toYmd(dt);
}

export function cmpYmd(a, b) {
  // -1, 0, 1
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function isBeforeYmd(a, b) {
  return cmpYmd(a, b) < 0;
}

export function isAfterYmd(a, b) {
  return cmpYmd(a, b) > 0;
}

export function isSameDayYmd(a, b) {
  return cmpYmd(a, b) === 0;
}

export function nightsBetweenYmd(inYmd, outYmd) {
  if (!inYmd || !outYmd) return 0;
  const a = parseYmd(inYmd);
  const b = parseYmd(outYmd);
  const ms = b - a;
  return Math.max(0, Math.round(ms / 86400000));
}

// Formatting
export function fmtNiceYmdFR(ymd) {
  if (!ymd) return "";
  const dt = parseYmd(ymd);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dt);
}

export function fmtShortFR(ymd) {
  if (!ymd) return "";
  const dt = parseYmd(ymd);
  return new Intl.DateTimeFormat("fr-FR").format(dt);
}

export function fmtTime24FR(hhmm) {
  if (!hhmm) return "";
  
  try {
    // Handle different time formats
    let hours = 0;
    let minutes = 0;
    
    if (typeof hhmm === 'string') {
      if (hhmm.includes(':')) {
        // Handle "HH:MM" format
        const [h = "00", m = "00"] = hhmm.split(":");
        hours = parseInt(h, 10);
        minutes = parseInt(m, 10);
      } else if (hhmm.includes(' ')) {
        // Handle "1:30 PM" format
        const timeParts = hhmm.match(/([0-9]{1,2})[:.]*([0-9]{0,2})\s*([AP]M)?/i);
        if (timeParts) {
          hours = parseInt(timeParts[1], 10);
          minutes = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
          const isPM = timeParts[3] && timeParts[3].toUpperCase() === 'PM';
          
          // Convert to 24-hour format
          if (isPM && hours < 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
        }
      } else {
        // Try to parse as a number
        const timeValue = parseInt(hhmm, 10);
        if (!isNaN(timeValue)) {
          hours = Math.floor(timeValue / 100);
          minutes = timeValue % 100;
        }
      }
    }
    
    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn(`Invalid time format: ${hhmm}`);
      return "";
    }
    
    const dt = new Date();
    dt.setHours(hours, minutes, 0, 0);
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dt);
  } catch (error) {
    console.error(`Error formatting time ${hhmm}:`, error);
    return "";
  }
}

// Validation consistent with your rules
export function validateStay({
  checkInDate,
  checkOutDate,
  checkInTime,   // "HH:mm" optional
  checkOutTime,  // "HH:mm" optional
  tz = "Africa/Ndjamena",
  skipPastDateCheck = false, // Allow skipping past date check for check-in process
}) {
  const errors = {};

  const today = todayYmdTZ(tz);

  if (!checkInDate) errors.checkInDate = "Date d'arrivée requise";
  if (!checkOutDate) errors.checkOutDate = "Date de départ requise";

  // Only validate against past dates if not skipped (for new reservations)
  // Skip this check during check-in to allow early arrivals
  if (!skipPastDateCheck && checkInDate && isBeforeYmd(checkInDate, today)) {
    errors.checkInDate = "L'arrivée ne peut pas être dans le passé";
  }
  
  if (checkInDate && checkOutDate && !isAfterYmd(checkOutDate, checkInDate)) {
    errors.checkOutDate = "Le départ doit être après l'arrivée";
  }

  // Same-day rule if both times provided
  if (checkInDate && checkOutDate && isSameDayYmd(checkInDate, checkOutDate)) {
    if (checkInTime && checkOutTime) {
      if (checkOutTime <= checkInTime) {
        errors.checkOutTime = "L'heure de départ doit être après l'heure d'arrivée";
      }
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

// References
export function makeReference(ymd) {
  const d = ymd
    ? ymd.replaceAll("-", "").slice(2)
    : new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HLP${d}-${rand}`;
}

// -----------------------------------------------------------------------------
// 🔁 Compatibility shims (keep old imports working)
// -----------------------------------------------------------------------------

// Old: atMidnight(Date|string) -> Date (local midnight)
export function atMidnight(d) {
  if (!d) return parseYmd(toYmd(new Date()));
  if (typeof d === "string") return parseYmd(d); // assume "YYYY-MM-DD"
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Old: isSameDay(a, b) where a/b can be Date or "YYYY-MM-DD"
export function isSameDay(a, b) {
  const A = typeof a === "string" ? parseYmd(a) : atMidnight(a);
  const B = typeof b === "string" ? parseYmd(b) : atMidnight(b);
  return A.getTime() === B.getTime();
}

// Old: isToday(dateStr, today?) — both can be Date or "YYYY-MM-DD"
export function isToday(dateLike, todayLike = todayYmdTZ()) {
  const dYmd =
    typeof dateLike === "string" ? dateLike : toYmd(atMidnight(dateLike));
  const tYmd =
    typeof todayLike === "string" ? todayLike : toYmd(atMidnight(todayLike));
  return isSameDayYmd(dYmd, tYmd);
}

// Old: isTomorrow(dateStr, today?)
export function isTomorrow(dateLike, todayLike = todayYmdTZ()) {
  const tYmd =
    typeof todayLike === "string" ? todayLike : toYmd(atMidnight(todayLike));
  const tomorrow = addDaysYmd(tYmd, 1);
  const dYmd =
    typeof dateLike === "string" ? dateLike : toYmd(atMidnight(dateLike));
  return isSameDayYmd(dYmd, tomorrow);
}

// Old: isFuture(dateStr, today?)
export function isFuture(dateLike, todayLike = todayYmdTZ()) {
  const dYmd =
    typeof dateLike === "string" ? dateLike : toYmd(atMidnight(dateLike));
  const tYmd =
    typeof todayLike === "string" ? todayLike : toYmd(atMidnight(todayLike));
  return isAfterYmd(dYmd, tYmd);
}

// Old: nightsBetween(inStr, outStr)
export function nightsBetween(inStr, outStr) {
  return nightsBetweenYmd(inStr, outStr);
}

// Additional utility functions for consistent date handling

/**
 * Format a date as YYYY-MM-DD
 * @param {Date|string} date - Date object or date string
 * @returns {string} Date in YYYY-MM-DD format
 */
export function formatYMD(date) {
  if (!date) return '';
  
  try {
    // If it's already a YYYY-MM-DD string, return it
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Otherwise convert to Date and format
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      console.warn(`Invalid date: ${date}`);
      return '';
    }
    
    return toYmd(d);
  } catch (error) {
    console.error(`Error formatting date ${date}:`, error);
    return '';
  }
}

/**
 * Get current date and time in a consistent format
 * @returns {Object} Object with date and time properties
 */
export function getCurrentDateTime() {
  const now = new Date();
  return {
    date: toYmd(now),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    iso: now.toISOString(),
    timestamp: now.getTime()
  };
}

/**
 * Format timestamp in Chad timezone (Africa/Ndjamena)
 * @param {Date|string} timestamp - The timestamp to format
 * @param {string} locale - Locale for formatting (default: 'fr-FR' for French)
 * @returns {string} Formatted timestamp in Chad time
 */
export function formatChadTime(timestamp, locale = 'fr-FR') {
  if (!timestamp) return '—';
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(date.getTime())) {
    console.warn(`Invalid timestamp: ${timestamp}`);
    return '—';
  }
  
  return date.toLocaleString(locale, { 
    timeZone: 'Africa/Ndjamena',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get current time in Chad timezone
 * @returns {Date} Current date/time in Chad timezone
 */
export function getNowChad() {
  // Get current UTC time
  const now = new Date();
  
  // Convert to Chad timezone string, then parse back to Date
  const chadTimeString = now.toLocaleString('en-US', { 
    timeZone: 'Africa/Ndjamena',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  return new Date(chadTimeString);
}

/**
 * Format a date for display in a consistent way
 * @param {string} dateStr - Date string in any format
 * @param {string} format - Format type ('short', 'medium', 'long')
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr, format = 'medium') {
  if (!dateStr) return '';
  
  try {
    const date = typeof dateStr === 'string' ? 
      (dateStr.includes('-') ? parseYmd(dateStr) : new Date(dateStr)) : 
      dateStr;
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'medium':
      default:
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
    }
  } catch (error) {
    console.error(`Error formatting date ${dateStr}:`, error);
    return '';
  }
}
