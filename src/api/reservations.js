import http from './http';

// Map frontend tab names to backend enum values
const mapTabToBackend = (tab) => {
  const mapping = {
    'Pending': 'PENDING',
    'arrivals': 'ARRIVALS',
    'in-house': 'IN_HOUSE',
    'departures': 'DEPARTURES',
    'upcoming': 'UPCOMING',
    'past': 'PAST',
    'cancelled': 'CANCELLED',
    'all': 'ALL'
  };
  return mapping[tab] || 'ALL';
};

// Get all reservations/bookings
export const getAllReservations = async () => {
  try {
    const response = await http.get('/api/admin/bookings?size=1000'); // Get all bookings
    return response.data.content || []; // Extract content from paginated response
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};

// Get reservations by tab (uses backend filtering)
export const getReservationsByTab = async (tab) => {
  try {
    const backendTab = mapTabToBackend(tab);
    const response = await http.get(`/api/admin/bookings?tab=${backendTab}&size=1000`);
    return response.data.content || [];
  } catch (error) {
    console.error('Error fetching reservations by tab:', error);
    throw error;
  }
};

// Create a new reservation
export const createReservation = async (reservationData) => {
  try {
    const response = await http.post('/api/admin/bookings', reservationData);
    return response.data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

// Update a reservation
export const updateReservation = async (id, reservationData) => {
  try {
    // Helper to ensure date is in YYYY-MM-DD format
    const formatDate = (date) => {
      if (!date) return null;
      
      // If it's already a string in YYYY-MM-DD format, return it
      if (typeof date === 'string') {
        // Check if it's already in the right format
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date;
        }
        // Try to parse it as a date
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, '0');
          const d = String(parsed.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      }
      
      // If it's a Date object
      if (date instanceof Date && !isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      
      // If it's an object with date properties (like moment or dayjs)
      if (typeof date === 'object' && date !== null) {
        // Try to convert to Date
        const dateStr = date.toString();
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, '0');
          const d = String(parsed.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      }
      
      return null;
    };
    
    // Helper to extract string value from object or string
    const getString = (value) => {
      if (typeof value === 'object' && value !== null) {
        return value.name || value.value || value.line1 || '';
      }
      return value || '';
    };
    
    // Extract address fields properly
    const addressObj = reservationData.address || {};
    const addressLine = typeof addressObj === 'string' ? addressObj : (addressObj.line1 || '');
    const city = typeof addressObj === 'string' ? '' : (addressObj.city || reservationData.city || '');
    const country = typeof addressObj === 'string' ? '' : (addressObj.country || reservationData.country || '');
    const zipCode = typeof addressObj === 'string' ? '' : (addressObj.postalCode || reservationData.zipCode || '');
    
    // Map frontend data to backend DTO format
    const payload = {
      guestName: getString(reservationData.guestName),
      guestEmail: getString(reservationData.email),
      guestPhone: getString(reservationData.phone),
      checkInDate: formatDate(reservationData.checkIn),
      checkOutDate: formatDate(reservationData.checkOut),
      roomType: typeof reservationData.roomType === 'object' ? reservationData.roomType?.name : reservationData.roomType,
      adults: parseInt(reservationData.guests?.adults || reservationData.adults) || 1,
      kids: parseInt(reservationData.guests?.kids || reservationData.kids) || 0,
      specialRequests: getString(reservationData.specialRequest || reservationData.specialRequests),
      address: addressLine,
      city: city,
      country: country,
      zipCode: zipCode
    };
    
    console.log('=== UPDATE RESERVATION ===');
    console.log('Original data:', reservationData);
    console.log('Formatted payload:', payload);
    console.log('Check-in date:', payload.checkInDate);
    console.log('Check-out date:', payload.checkOutDate);
    
    const response = await http.put(`/api/admin/bookings/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating reservation:', error);
    console.error('Error details:', error.response?.data);
    
    // Extract error message from backend
    const errorMessage = typeof error.response?.data === 'string' 
      ? error.response.data 
      : error.response?.data?.message || error.message || 'Failed to update reservation';
    
    // Throw error with user-friendly message
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

// Delete a reservation
export const deleteReservation = async (id) => {
  try {
    await http.delete(`/api/admin/bookings/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting reservation:', error);
    
    // Extract error message from backend
    const errorMessage = typeof error.response?.data === 'string' 
      ? error.response.data 
      : error.response?.data?.message || error.message || 'Failed to delete reservation';
    
    // Throw error with user-friendly message
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

// Cancel a reservation (update status to CANCELLED)
export const cancelReservation = async (id) => {
  try {
    const response = await http.put(`/api/admin/bookings/${id}/status`, { status: 'CANCELLED' });
    return response.data;
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    throw error;
  }
};

// Confirm a reservation (update status to CONFIRMED)
export const confirmReservation = async (id) => {
  try {
    const response = await http.put(`/api/admin/bookings/${id}/status`, { status: 'CONFIRMED' });
    return response.data;
  } catch (error) {
    console.error('Error confirming reservation:', error);
    throw error;
  }
};

// Assign room to reservation
export const assignRoom = async (bookingId, roomId) => {
  try {
    console.log('Assigning room - bookingId:', bookingId, 'roomId:', roomId, 'type:', typeof roomId);
    const payload = { roomId: Number(roomId) };
    console.log('Payload:', payload);
    const response = await http.post(`/api/admin/bookings/${bookingId}/assign-room`, payload);
    return response.data;
  } catch (error) {
    console.error('Error assigning room:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

// Auto-assign room to reservation
export const autoAssignRoom = async (bookingId) => {
  try {
    const response = await http.post(`/api/admin/bookings/${bookingId}/auto-assign-room`);
    return response.data;
  } catch (error) {
    console.error('Error auto-assigning room:', error);
    throw error;
  }
};

// Check-in a reservation
export const checkInReservation = async (bookingId, checkInData) => {
  try {
    // Support both old format (string) and new format (object)
    const payload = typeof checkInData === 'string' 
      ? { checkInTime: checkInData }
      : {
          checkInTime: checkInData.checkInTime,
          actualCheckInDate: checkInData.actualCheckInDate,
          actualNights: checkInData.actualNights,
          updatedTotalPrice: checkInData.updatedTotalPrice,
          paymentMethod: checkInData.paymentMethod,
          paymentStatus: checkInData.paymentStatus,
          amountPaid: checkInData.amountPaid
        };
    
    const response = await http.post(`/api/admin/bookings/${bookingId}/check-in`, payload);
    return response.data;
  } catch (error) {
    console.error('Error checking in reservation:', error);
    throw error;
  }
};

// Check-out a reservation
export const checkOutReservation = async (bookingId, checkOutData) => {
  try {
    // Support both old format (string) and new format (object)
    const payload = typeof checkOutData === 'string'
      ? { checkOutTime: checkOutData }
      : {
          checkOutTime: checkOutData.checkOutTime,
          actualCheckOutDate: checkOutData.actualCheckOutDate,
          actualNights: checkOutData.actualNights,
          billingMethod: checkOutData.billingMethod,
          finalTotalPrice: checkOutData.finalTotalPrice,
          paymentMethod: checkOutData.paymentMethod,
          paymentStatus: checkOutData.paymentStatus,
          amountPaid: checkOutData.amountPaid
        };

    if (checkOutData && typeof checkOutData !== 'string' && checkOutData.chargesJson) {
      payload.chargesJson = typeof checkOutData.chargesJson === 'string'
        ? checkOutData.chargesJson
        : JSON.stringify(checkOutData.chargesJson);
    }

    const response = await http.post(`/api/admin/bookings/${bookingId}/check-out`, payload);
    return response.data;
  } catch (error) {
    console.error('Error checking out reservation:', error);
    throw error;
  }
};

// Add charge to a reservation
export const addCharge = async (bookingId, chargeData) => {
  try {
    const response = await http.post(`/api/admin/bookings/${bookingId}/charges`, {
      amount: parseFloat(chargeData.amount),
      description: chargeData.description,
      category: chargeData.category
    });
    return response.data;
  } catch (error) {
    console.error('Error adding charge:', error);
    throw error;
  }
};

// Record payment for a reservation
export const recordPayment = async (bookingId, paymentData) => {
  try {
    const response = await http.post(`/api/admin/bookings/${bookingId}/payments`, {
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.paymentMethod,
      notes: paymentData.notes
    });
    return response.data;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

// Get all payments for a booking
export const getPayments = async (bookingId) => {
  try {
    const response = await http.get(`/api/admin/bookings/${bookingId}/payments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

// Update a payment
export const updatePayment = async (bookingId, paymentId, paymentData) => {
  try {
    const response = await http.put(`/api/admin/bookings/${bookingId}/payments/${paymentId}`, {
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.paymentMethod,
      notes: paymentData.notes
    });
    return response.data;
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
};

// Delete a payment
export const deletePayment = async (bookingId, paymentId) => {
  try {
    const response = await http.delete(`/api/admin/bookings/${bookingId}/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

// Fetch single reservation by ID
export const fetchReservationById = async (bookingId) => {
  try {
    const response = await http.get(`/api/admin/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reservation:', error);
    throw error;
  }
};
