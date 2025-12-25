import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllRooms, createRoom as apiCreateRoom, updateRoom as apiUpdateRoom, deleteRoom as apiDeleteRoom } from '../api/rooms';
import eventBus, { EVENTS } from '../utils/eventBus';

const RoomContext = createContext();

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch rooms function (can be called manually)
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await getAllRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load rooms from backend.\nPlease check your backend connection.');
      // Empty array if API fails - no fallback data
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch rooms on mount and listen for room updates
  useEffect(() => {
    fetchRooms();
    
    // Listen for room update events
    const unsubscribeRoomUpdated = eventBus.on(EVENTS.ROOM_UPDATED, () => {
      fetchRooms();
    });
    
    // Listen for room type events (affects room data)
    const unsubscribeRoomTypeCreated = eventBus.on(EVENTS.ROOM_TYPE_CREATED, () => {
      console.log('🔄 Room type created - refreshing rooms...');
      fetchRooms();
    });
    
    const unsubscribeRoomTypeUpdated = eventBus.on(EVENTS.ROOM_TYPE_UPDATED, () => {
      console.log('🔄 Room type updated - refreshing rooms...');
      fetchRooms();
    });
    
    const unsubscribeRoomTypeDeleted = eventBus.on(EVENTS.ROOM_TYPE_DELETED, () => {
      console.log('🔄 Room type deleted - refreshing rooms...');
      fetchRooms();
    });
    
    return () => {
      unsubscribeRoomUpdated();
      unsubscribeRoomTypeCreated();
      unsubscribeRoomTypeUpdated();
      unsubscribeRoomTypeDeleted();
    };
  }, []);

  // Get unique room types with their prices
  const getRoomTypes = () => {
    const typeMap = new Map();
    rooms.forEach(room => {
      if (!typeMap.has(room.type)) {
        typeMap.set(room.type, {
          type: room.type,
          price: room.price,
          capacity: room.capacity
        });
      }
    });
    return Array.from(typeMap.values());
  };

  // Get price for a specific room type
  const getRoomPrice = (roomType) => {
    const room = rooms.find(r => r.type === roomType);
    return room ? room.price : 0;
  };

  // Update room data
  const updateRoom = async (updatedRoom) => {
    try {
      // Call API to update room
      const result = await apiUpdateRoom(updatedRoom.id, updatedRoom);
      
      // Update local state
      if (result.success) {
        setRooms(prevRooms => 
          prevRooms.map(room => 
            room.id === updatedRoom.id ? updatedRoom : room
          )
        );
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update room on the server' };
      }
    } catch (err) {
      console.error('Failed to update room:', err);
      return { success: false, error: err.message };
    }
  };

  // Add new room
  const addRoom = async (newRoom) => {
    try {
      // Call API to create room
      const createdRoom = await apiCreateRoom(newRoom);
      
      // Update local state with the returned room (which might have server-generated ID)
      setRooms(prevRooms => [...prevRooms, createdRoom]);
      return { success: true, room: createdRoom };
    } catch (err) {
      console.error('Failed to add room:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete room
  const deleteRoom = async (roomId) => {
    try {
      // Call API to delete room
      await apiDeleteRoom(roomId);
      
      // Update local state
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      return { success: true };
    } catch (err) {
      console.error('Failed to delete room:', err);
      
      // Extract error message from response
      let errorMessage = 'Échec de la suppression de la chambre';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    rooms,
    loading,
    error,
    setRooms,
    getRoomTypes,
    getRoomPrice,
    updateRoom,
    addRoom,
    deleteRoom,
    refetch: fetchRooms // Expose refetch function
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};
