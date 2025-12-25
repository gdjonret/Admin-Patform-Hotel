import http from './http';

// Get all rooms
export const getAllRooms = async () => {
  try {
    const [roomsResponse, roomTypesResponse] = await Promise.all([
      http.get('/api/admin/rooms'),
      http.get('/api/admin/room-types')
    ]);
    
    const rooms = roomsResponse.data;
    const roomTypes = roomTypesResponse.data;
    
    // Transform backend data structure to match our frontend model
    return rooms.map(room => {
      const roomType = roomTypes.find(rt => rt.id === room.roomTypeId);
      
      return {
        id: room.id,
        number: room.number,
        roomTypeId: room.roomTypeId,
        type: roomType?.name || 'Unknown',
        capacity: roomType?.capacity || 2,  // Get capacity from room type
        price: roomType?.baseRate || 0,  // Get price from room type
        status: mapRoomStatus(room.status),
        amenities: getAmenitiesFromRoomType(roomType)
      };
    });
  } catch (error) {
    console.error('Error fetching room types:', error);
    throw error;
  }
};

// Helper function to map backend status to frontend status
const mapRoomStatus = (backendStatus) => {
  switch(backendStatus) {
    case 'AVAILABLE': return 'Available';
    case 'RESERVED': return 'Reserved';
    case 'OCCUPIED': return 'Occupied';
    case 'MAINTENANCE': return 'Maintenance';
    default: return 'Unknown';
  }
};

// Helper function to map frontend status to backend status
const mapToBackendStatus = (frontendStatus) => {
  switch(frontendStatus) {
    case 'Available': return 'AVAILABLE';
    case 'Reserved': return 'RESERVED';
    case 'Occupied': return 'OCCUPIED';
    case 'Maintenance': return 'MAINTENANCE';
    default: return 'AVAILABLE';
  }
};

// Helper function to get amenities from room type
const getAmenitiesFromRoomType = (roomType) => {
  if (!roomType || !roomType.amenitiesJson) {
    return [];
  }
  
  try {
    // Parse amenities from JSON string
    const amenities = JSON.parse(roomType.amenitiesJson);
    return Array.isArray(amenities) ? amenities : [];
  } catch (error) {
    console.warn('Failed to parse amenities JSON:', error);
    return [];
  }
};

// Get a single room by ID
export const getRoomById = async (roomId) => {
  try {
    const [roomResponse, roomTypesResponse] = await Promise.all([
      http.get(`/api/admin/rooms/${roomId}`),
      http.get('/api/admin/room-types')
    ]);
    
    const room = roomResponse.data;
    const roomType = roomTypesResponse.data.find(rt => rt.id === room.roomTypeId);
    
    // Transform backend data to frontend model
    return {
      id: room.id,
      type: roomType?.name || 'Unknown',
      capacity: roomType?.capacity || 2,  // Get capacity from room type
      price: roomType?.baseRate || 0,  // Get price from room type
      status: mapRoomStatus(room.status),
      amenities: getAmenitiesFromRoomType(roomType),
      number: room.number,
      roomTypeId: room.roomTypeId
    };
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    throw error;
  }
};

// Create a new room
export const createRoom = async (roomData) => {
  try {
    // Transform frontend model to backend model
    const backendRoomData = {
      number: roomData.number || roomData.id.toString(),
      roomTypeId: roomData.roomTypeId,
      amenities: roomData.amenities ? roomData.amenities.join(',') : '',
      status: mapToBackendStatus(roomData.status)
    };
    
    const response = await http.post('/api/admin/rooms', backendRoomData);
    
    // Fetch room types to get the name
    const roomTypesResponse = await http.get('/api/admin/room-types');
    const roomType = roomTypesResponse.data.find(rt => rt.id === response.data.roomTypeId);
    
    // Return the transformed data for the frontend
    return {
      id: response.data.id,
      number: response.data.number,
      roomTypeId: response.data.roomTypeId,
      type: roomType?.name || 'Unknown',
      capacity: roomType?.capacity || 2,  // Get capacity from room type
      price: roomType?.baseRate || 0,
      status: mapRoomStatus(response.data.status),
      amenities: response.data.amenities ? response.data.amenities.split(',') : []
    };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

// Update an existing room
export const updateRoom = async (roomId, roomData) => {
  try {
    // Transform frontend model to backend model
    const backendRoomData = {
      number: roomData.number || roomData.id.toString(),
      roomTypeId: roomData.roomTypeId,
      amenities: roomData.amenities ? roomData.amenities.join(',') : '',
      status: mapToBackendStatus(roomData.status)
    };
    
    // Use PUT endpoint to update all room properties
    await http.put(`/api/admin/rooms/${roomId}`, backendRoomData);
    
    return {
      success: true,
      data: roomData
    };
  } catch (error) {
    console.error(`Error updating room ${roomId}:`, error);
    throw error;
  }
};

// Delete a room
export const deleteRoom = async (roomId) => {
  try {
    // Use DELETE endpoint to actually remove the room
    await http.delete(`/api/admin/rooms/${roomId}`);
    
    // Return success response
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error deleting room ${roomId}:`, error);
    throw error;
  }
};

// Check if a room is available for a given date range
export const checkRoomAvailability = async (roomId, checkInDate, checkOutDate) => {
  try {
    const response = await http.get('/api/admin/rooms/availability', {
      params: {
        roomId,
        checkInDate,
        checkOutDate
      }
    });
    
    return response.data; // { available: boolean, message: string, roomNumber: string }
  } catch (error) {
    console.error('Error checking room availability:', error);
    // FIXED: Fail closed - assume NOT available on any error
    // This prevents assigning rooms when we can't verify availability
    if (error.response?.status === 404) {
      throw new Error('Availability check endpoint not available. Cannot verify room availability.');
    }
    // For other errors, also fail closed
    return {
      available: false,
      message: error?.response?.data?.message || 'Cannot verify availability - please check backend connection',
      roomNumber: null
    };
  }
};

// Get available rooms for a date range
export const getAvailableRooms = async (checkInDate, checkOutDate, roomTypeId = null) => {
  try {
    const params = { checkInDate, checkOutDate };
    if (roomTypeId) params.roomTypeId = roomTypeId;
    
    const response = await http.get('/api/admin/rooms/available', { params });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    // FIXED: Don't return all rooms on error - return empty array (safe)
    // This prevents showing occupied rooms as available
    if (error.response?.status === 404) {
      throw new Error('Available rooms endpoint not implemented. Cannot retrieve available rooms.');
    }
    // For other errors, return empty array
    console.warn('Cannot fetch available rooms, returning empty list for safety');
    return [];
  }
};
