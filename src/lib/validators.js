// src/lib/validators.js

// Email validation (RFC 5322 compliant)
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Phone number validation (international format with +)
export function isValidPhone(phone) {
  if (!phone) return true; // Optional field
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Must start with + and have 10-15 digits
  return /^\+\d{10,15}$/.test(cleaned);
}

// Non-empty string check
export function isRequired(value) {
  return value != null && String(value).trim() !== "";
}

// Check-in / Check-out validation
export function isValidDateRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return false;
  return new Date(checkOut) > new Date(checkIn);
}

// Room number validation
export function isValidRoomNumber(roomNumber) {
  if (!roomNumber) return false;
  // Alphanumeric, 1-10 characters
  return /^[A-Za-z0-9]{1,10}$/.test(String(roomNumber).trim());
}

// Time validation (HH:MM format, 24-hour)
export function isValidTime24(time) {
  if (!time) return false;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

// Guest name validation
export function isValidGuestName(name) {
  if (!name) return false;
  const trimmed = name.trim();
  // At least 2 characters, letters, spaces, hyphens, apostrophes
  return /^[a-zA-ZÀ-ÿ\s\-']{2,100}$/.test(trimmed);
}

// Postal code validation (flexible for international)
export function isValidPostalCode(code) {
  if (!code) return true; // Optional
  const trimmed = String(code).trim();
  // 3-10 alphanumeric characters
  return /^[A-Za-z0-9\s\-]{3,10}$/.test(trimmed);
}

// Price/amount validation
export function isValidAmount(amount) {
  if (amount === null || amount === undefined || amount === '') return false;
  const num = Number(amount);
  return !isNaN(num) && num >= 0 && num <= 999999.99;
}

// Number of guests validation
export function isValidGuestCount(count) {
  const num = Number(count);
  return Number.isInteger(num) && num >= 1 && num <= 20;
}

// Comprehensive form validation
export function validateReservationForm(formData) {
  const errors = {};

  // Guest name
  if (!isRequired(formData.guestName)) {
    errors.guestName = 'Guest name is required';
  } else if (!isValidGuestName(formData.guestName)) {
    errors.guestName = 'Please enter a valid name (2-100 characters, letters only)';
  }

  // Email
  if (!isRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone (optional but must be valid if provided)
  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number with country code (e.g., +1234567890)';
  }

  // Check-in date
  if (!isRequired(formData.checkIn)) {
    errors.checkIn = 'Check-in date is required';
  }

  // Check-out date
  if (!isRequired(formData.checkOut)) {
    errors.checkOut = 'Check-out date is required';
  } else if (!isValidDateRange(formData.checkIn, formData.checkOut)) {
    errors.checkOut = 'Check-out must be after check-in';
  }

  // Room type
  if (!isRequired(formData.roomType)) {
    errors.roomType = 'Room type is required';
  }

  // Number of guests
  if (formData.guests) {
    if (formData.guests.adults && !isValidGuestCount(formData.guests.adults)) {
      errors.adults = 'Number of adults must be between 1 and 20';
    }
    if (formData.guests.kids !== undefined && formData.guests.kids !== null) {
      const kids = Number(formData.guests.kids);
      if (isNaN(kids) || kids < 0 || kids > 20) {
        errors.kids = 'Number of kids must be between 0 and 20';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Check-in validation
export function validateCheckIn(checkInTime, roomNumber) {
  const errors = {};

  if (!checkInTime) {
    errors.checkInTime = 'Check-in time is required';
  } else if (!isValidTime24(checkInTime)) {
    errors.checkInTime = 'Please enter a valid time (HH:MM format, 24-hour)';
  }

  // Room number is optional during check-in (can be assigned later)
  if (roomNumber && !isValidRoomNumber(roomNumber)) {
    errors.roomNumber = 'Please enter a valid room number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Check-out validation
export function validateCheckOut(checkOutTime) {
  const errors = {};

  if (!checkOutTime) {
    errors.checkOutTime = 'Check-out time is required';
  } else if (!isValidTime24(checkOutTime)) {
    errors.checkOutTime = 'Please enter a valid time (HH:MM format, 24-hour)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Sanitize input (prevent XSS)
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 500); // Limit length
}

// Validate special requests
export function isValidSpecialRequest(text) {
  if (!text) return true; // Optional
  return text.length <= 1000;
}