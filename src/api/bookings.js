// src/api/bookings.js
import http from './http';

/**
 * Get room type ID from room type name
 */
async function getRoomTypeId(roomTypeName) {
  try {
    const response = await http.get('/api/admin/room-types');
    const roomTypes = response.data;
    
    // Find the room type by name (case-insensitive match)
    const roomType = roomTypes.find(rt => 
      rt.name?.toLowerCase() === roomTypeName?.toLowerCase()
    );
    
    return roomType?.id || null;
  } catch (error) {
    console.error('Error fetching room types:', error);
    return null;
  }
}

/**
 * Create a booking from the public reservation form
 * Calls the backend API at /api/public/bookings
 */
export async function createBookingFromPublicForm(form) {
  try {
    // Get the room type ID from the room type name
    const roomTypeId = await getRoomTypeId(form.roomType);
    
    // Map frontend form data to backend DTO format
    const payload = {
      guestName: `${form.firstName} ${form.lastName}`.trim(),
      guestEmail: form.email,
      guestPhone: form.phone,
      checkInDate: form.arrivalDate,  // "YYYY-MM-DD"
      checkOutDate: form.departureDate, // "YYYY-MM-DD"
      adults: Number(form.adults),
      kids: Number(form.kids || 0),
      roomType: form.roomType,
      roomTypeId: roomTypeId, // Include the room type ID for availability check
      specialRequests: form.specialRequest?.trim() || null,
      city: form.city || null,
      zipCode: form.postalCode || null,
      country: form.country || null,
      source: 'WEB',
      totalPrice: form.totalPrice || 0,
      pricePerNight: form.totalPrice && form.arrivalDate && form.departureDate 
        ? calculatePricePerNight(form.totalPrice, form.arrivalDate, form.departureDate)
        : 0,
      currency: 'XAF'
    };

    // Call the public booking endpoint
    const response = await http.post('/api/public/bookings', payload);
    
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Extract error message from backend response
    const errorMessage = error?.response?.data?.message 
      || error?.response?.data?.error
      || error?.message 
      || 'Failed to create reservation. Please try again.';
    
    throw new Error(errorMessage);
  }
}

/**
 * Calculate price per night from total price and date range
 */
function calculatePricePerNight(totalPrice, checkInDate, checkOutDate) {
  if (!totalPrice || !checkInDate || !checkOutDate) return 0;
  
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  
  return nights > 0 ? totalPrice / nights : totalPrice;
}
