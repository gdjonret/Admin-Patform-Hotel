// src/components/Reservations/modals/AssignRoomModal.js
import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button, Stack, IconButton, TextField } from "@mui/material";
import { MdClose, MdWifi, MdTv, MdAcUnit, MdLocalBar, MdLandscape } from "react-icons/md";
import { useRooms } from "../../../../context/RoomContext";
import { fmtNiceYmdFR } from "../../../../lib/dates";
import { formatFCFA } from "../../../../lib/formatters";
import "./check-in-modal.css";
import "./assign-room-modal.css";

export default function AssignRoomModal({ open, reservation, availableRooms = [], onClose, onAssign }) {
  const { rooms } = useRooms();
  const [selectedRoom, setSelectedRoom] = useState("");
  const [apiError, setApiError] = useState("");
  const [checking, setChecking] = useState(false);
  
  // Get only available rooms from RoomContext that match the reservation type
  const availableRoomsFromContext = useMemo(() => {
    if (!reservation) return [];
    
    // Filter to only show available rooms that match the reservation type
    return rooms.filter(room => {
      // Check if the room is available
      const isAvailable = room.status === 'Available';
      
      // Handle room type comparison with or without 'Room' suffix
      let typeMatches = false;
      if (!reservation.roomType) {
        typeMatches = true;
      } else {
        // Strip 'Room' suffix if present for comparison
        const reservationType = reservation.roomType.replace(/ Room$/, '');
        typeMatches = room.type === reservationType;
      }
      
      return isAvailable && typeMatches;
    });
  }, [rooms, reservation]);
  
  // Get sorted available rooms (no floor grouping)
  const sortedAvailableRooms = useMemo(() => {
    if (!reservation) return [];
    
    // Use the already filtered rooms that match type and availability
    // Sort rooms by room number
    return availableRoomsFromContext.sort((a, b) => {
      const numA = parseInt(a.number || a.id);
      const numB = parseInt(b.number || b.id);
      return numA - numB;
    });
  }, [availableRoomsFromContext, reservation]);
  
  // Fallback to provided availableRooms if context rooms are empty
  const suggestedRooms = useMemo(() => {
    return availableRoomsFromContext.length > 0 
      ? availableRoomsFromContext.map(room => room.id.toString())
      : (availableRooms.length > 0 ? availableRooms : ["101", "102", "103", "201", "202", "203"]);
  }, [availableRoomsFromContext, availableRooms]);
  
  // Early return if modal is not open or no reservation
  if (!open || !reservation) return null;

  const handleAssign = async () => {
    setApiError("");
    if (!selectedRoom) return;
    
    try {
      setChecking(true);
      
      // Import the availability check function
      const { checkRoomAvailability } = await import('../../../../api/rooms');
      
      // Get the room ID from the selected room number
      const room = getRoomById(selectedRoom);
      if (!room || !room.id) {
        setApiError(`Room ${selectedRoom} not found`);
        return;
      }
      
      // Check availability for the reservation dates
      const checkInDate = reservation.checkIn || reservation.checkInDate;
      const checkOutDate = reservation.checkOut || reservation.checkOutDate;
      
      if (!checkInDate || !checkOutDate) {
        setApiError('Reservation dates are missing');
        return;
      }
      
      // Call the availability check API
      const availabilityResult = await checkRoomAvailability(
        room.id,
        checkInDate,
        checkOutDate
      );
      
      if (!availabilityResult.available) {
        setApiError(availabilityResult.message);
        return;
      }
      
      // If available, proceed with assignment
      onAssign(selectedRoom);
      
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to assign room';
      setApiError(errorMsg);
    } finally {
      setChecking(false);
    }
  };
  
  // Get room details by room number
  const getRoomById = (roomNumber) => {
    return availableRoomsFromContext.find(room => 
      (room.number || room.id.toString()) === roomNumber.toString()
    );
  };
  
  // Get clean room type label without 'Room' suffix
  const getRoomTypeLabel = () => {
    if (!reservation?.roomType) return 'Available';
    // Strip 'Room' suffix if present
    return reservation.roomType.replace(/ Room$/, '');
  };
  
  // Get amenity icon
  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <MdWifi title="WiFi" />;
    if (amenityLower.includes('tv')) return <MdTv title="TV" />;
    if (amenityLower.includes('air') || amenityLower.includes('ac')) return <MdAcUnit title="Air Conditioning" />;
    if (amenityLower.includes('bar')) return <MdLocalBar title="Mini Bar" />;
    if (amenityLower.includes('view')) return <MdLandscape title="View" />;
    return null;
  };

  // Ensure there is a portal root (fallback to body)
  const portalTarget = document.getElementById("modal-root") || document.body;

  const modalContent = (
    <div className="checkin-modal-overlay" onClick={onClose}>
      <div className="checkin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Assigner une Chambre</h2>

        <div className="guest-card">
          <div className="guest-card-header">
            <h3>Détails de la Réservation</h3>
            <div className="confirmation-number">{reservation.reference || reservation.bookingReference}</div>
          </div>
          
          <div className="guest-info-grid">
            <div className="info-section">
              <div className="info-group">
                <label className="info-label">Nom du Client</label>
                <div className="info-value primary">{reservation.guestName || "—"}</div>
              </div>
              <div className="info-group">
                <label className="info-label">Type de Chambre</label>
                <div className="info-value">{reservation.roomType || "—"}</div>
              </div>
            </div>
            
            <div className="info-section">
              <div className="info-group">
                <label className="info-label">Date d'Arrivée</label>
                <div className="info-value">
                  {reservation.checkIn ? fmtNiceYmdFR(reservation.checkIn) : reservation.checkInDate ? fmtNiceYmdFR(reservation.checkInDate) : '—'}
                </div>
              </div>
              <div className="info-group">
                <label className="info-label">Date de Départ</label>
                <div className="info-value">
                  {reservation.checkOut ? fmtNiceYmdFR(reservation.checkOut) : reservation.checkOutDate ? fmtNiceYmdFR(reservation.checkOutDate) : '—'}
                </div>
              </div>
            </div>
            
            <div className="info-section">
              <div className="info-group">
                <label className="info-label">Durée du Séjour</label>
                <div className="info-value">{reservation.nights || 1} nuits</div>
              </div>
              <div className="info-group">
                <label className="info-label">Chambre Actuelle</label>
                <div className="info-value room-number">
                  {selectedRoom ? `#${selectedRoom}` : (reservation.roomNumber ? `#${reservation.roomNumber}` : 'Non assignée')}
                </div>
              </div>
            </div>
          </div>
        </div>
          
          {selectedRoom && getRoomById(selectedRoom) && (
            <div className="selected-room-details">
              <h3>Détails de la Chambre Sélectionnée</h3>
              <div className="room-details-grid">
                <div>
                  <p><strong>Numéro de Chambre:</strong> {selectedRoom}</p>
                  <p><strong>Type de Chambre:</strong> {getRoomById(selectedRoom).type}</p>
                </div>
                <div>
                  <p><strong>Capacité:</strong> {getRoomById(selectedRoom).capacity} personnes</p>
                  <p><strong>Prix:</strong> {formatFCFA(getRoomById(selectedRoom).price)}/nuit</p>
                </div>
                <div className="amenities-list">
                  <p><strong>Équipements:</strong></p>
                  <div className="amenity-icons">
                    {getRoomById(selectedRoom).amenities.map((amenity, index) => (
                      <div key={index} className="amenity-item">
                        <span className="amenity-icon">{getAmenityIcon(amenity)}</span>
                        <span className="amenity-name">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
             {/* <div className="room-assignment-note">
                <p>Assigning this room to <strong>{reservation.guestName}</strong> for stay period:</p>
                <p className="stay-dates">{reservation.checkIn} to {reservation.checkOut}</p>
              </div> */}
            </div>
          )}

          <div className="section">
            <h3>Sélectionnez une Chambre</h3>
            <p className="section-description">Choisissez une chambre disponible pour ce client</p>
            
            {
              <div className="hotel-layout">
                <div className="legend">
                  <div className="legend-item">
                    <span className="status-indicator available"></span> 
                    Chambres {getRoomTypeLabel() !== 'Available' ? `de Type ${getRoomTypeLabel()}` : ''} Disponibles
                  </div>
                </div>
                
                <div className="rooms-grid">
                  {sortedAvailableRooms.map(room => {
                    const roomNumber = room.number || room.id.toString();
                    
                    return (
                      <button
                        key={room.id}
                        className={`room-button ${selectedRoom === roomNumber ? 'selected' : ''} available`}
                        onClick={() => setSelectedRoom(roomNumber)}
                        title={`Chambre ${roomNumber} - ${room.type} - Disponible`}
                      >
                        <div className="room-number">{roomNumber}</div>
                        <div className="room-type">{room.type}</div>
                        <div className="room-price">{formatFCFA(room.price)}</div>
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="room-amenities">
                            {room.amenities.slice(0, 3).map((amenity, index) => (
                              <span key={index} className="amenity-icon">
                                {getAmenityIcon(amenity)}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {sortedAvailableRooms.length === 0 && (
                  <div className="no-rooms-message">
                    <p>Aucune chambre disponible dans le système.</p>
                  </div>
                )}
              </div>
            }
          </div>
        
        {apiError && (
          <div className="error-banner" role="alert" style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px',
            color: '#c33'
          }}>
            <strong>Erreur:</strong> {apiError}
          </div>
        )}
        
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleAssign}
            disabled={!selectedRoom || checking}
          >
            {checking ? 'Vérification de la disponibilité...' : 'Assigner la Chambre'}
          </button>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the modal outside the normal DOM hierarchy
  return createPortal(modalContent, portalTarget);
}
