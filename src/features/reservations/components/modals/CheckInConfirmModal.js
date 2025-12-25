import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MdWifi, MdTv, MdAcUnit, MdLocalBar, MdLandscape } from "react-icons/md";
import {
  DEFAULT_CHECKIN_TIME,
  fmtNiceYmdFR,
  nightsBetweenYmd,
  todayYmdTZ,
  isSameDayYmd,
  isBeforeYmd,
  validateStay,
} from "../../../../lib/dates";
import { formatRoomType } from "../../../../lib/formatters";
import "./check-in-modal.css";
import PaymentConfirmModal from "../../../../components/common/PaymentConfirmModal";
import PaymentFields from "../../../../components/common/PaymentFields";
import TimeInput from "../../../../components/common/TimeInput";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import GuestContactInfo from "../../../../components/common/GuestContactInfo";
import { useRooms } from "../../../../context/RoomContext";
import { useTaxCalculation } from "../../../../hooks/useTaxCalculation";
import eventBus, { EVENTS } from "../../../../utils/eventBus";

/**
 * Props:
 * - reservation: {
 *     id, reference,
 *     checkInDate: "YYYY-MM-DD",
 *     checkOutDate: "YYYY-MM-DD",
 *     roomNumber: optional
 *   }
 * - onConfirm: async (payload) => void   // caller performs API call
 * - onClose: () => void
 */
export default function CheckInConfirmModal({ reservation, onConfirm, onClose }) {
  const { calculateTaxes } = useTaxCalculation();
  // Split the default time into hours and minutes
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [apiError, setApiError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [confirmedRoom, setConfirmedRoom] = useState(reservation?.roomNumber || "");
  const [showRoomSection, setShowRoomSection] = useState(false);
  const [roomUpdateMessage, setRoomUpdateMessage] = useState("");
  const [paymentType, setPaymentType] = useState("none"); // "full", "partial", or "none"
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [confirmationType, setConfirmationType] = useState(""); // "paid" or "unpaid"
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  
  // Calculate booking charges
  const nightlyRate = reservation.pricePerNight || 25000;
  const depositPaid = reservation.amountPaid || 0; // Use existing amountPaid from reservation
  
  // Room assignment functionality
  const { rooms } = useRooms();
  
  // Ensure there is a portal root (fallback to body)
  const portalTarget = document.getElementById("modal-root") || document.body;
  
  // Add body scroll lock when modal is open
  useEffect(() => {
    if (!reservation) return;
    
    // Store previously focused element
    previouslyFocusedRef.current = document.activeElement;
    
    // Lock body scroll when modal opens
    document.body.classList.add("modal-open");
    
    // Focus the dialog
    const dialogEl = dialogRef.current;
    if (dialogEl) {
      dialogEl.focus();
    }
    
    // Cleanup: remove class when component unmounts
    return () => {
      document.body.classList.remove("modal-open");
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [reservation]);
  
  // Combine hours and minutes into a time string
  const getTimeString = () => {
    const paddedHours = hours.padStart(2, '0');
    const paddedMinutes = minutes.padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
  };

  const hotelToday = useMemo(() => todayYmdTZ("Africa/Ndjamena"), []);

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
  
  // Helper to normalize room number from different property names
  const getDisplayNumber = (room) =>
    String(room?.number ?? room?.roomNumber ?? room?.id ?? '');
  
  // Get sorted available rooms (no floor grouping)
  const sortedAvailableRooms = useMemo(() => {
    if (!reservation) return [];
    return [...availableRoomsFromContext].sort((a, b) => {
      const numA = parseInt(getDisplayNumber(a).replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(getDisplayNumber(b).replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [availableRoomsFromContext, reservation]);
  
  // Get room details by room number (robust to different property names)
  const getRoomById = (roomNum) => {
    const key = String(roomNum);
    return availableRoomsFromContext.find((room) => {
      const rn = getDisplayNumber(room);
      return rn === key;
    });
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

  // Calculate charges for booking summary (before early return)
  const checkInDate = reservation ? (reservation.checkInDate || (typeof reservation.checkIn === "string" ? reservation.checkIn.slice(0, 10) : "")) : "";
  const checkOutDate = reservation ? (reservation.checkOutDate || (typeof reservation.checkOut === "string" ? reservation.checkOut.slice(0, 10) : "")) : "";
  const reservedNights = checkInDate && checkOutDate ? nightsBetweenYmd(checkInDate, checkOutDate) || 1 : 1;
  const actualNights = hotelToday && checkOutDate ? nightsBetweenYmd(hotelToday, checkOutDate) || 1 : reservedNights;
  const isEarlyArrival = checkInDate && isBeforeYmd(hotelToday, checkInDate);
  const nights = isEarlyArrival ? actualNights : reservedNights;
  const roomSubtotal = nights * nightlyRate;
  
  // Calculate taxes
  const taxBreakdown = nightlyRate && nights ? calculateTaxes(nightlyRate, nights, 0) : null;
  const grandTotal = taxBreakdown ? taxBreakdown.grandTotal : roomSubtotal;
  const balanceDue = Math.max(0, grandTotal - depositPaid);
  
  // Calculate real-time totals including current payment
  const currentPaymentAmount = paymentType === 'none' ? 0 : (paymentAmount || 0);
  const totalPaid = depositPaid + Number(currentPaymentAmount);
  const remainingBalance = Math.max(0, balanceDue - Number(currentPaymentAmount));
  
  // Auto-sync payment status based on amounts (must be before early return)
  useEffect(() => {
    // Don't auto-update if user explicitly chose "Pay Later"
    if (paymentType === 'none') return;
    
    const totalPaid = depositPaid + Number(paymentAmount || 0);
    
    // Update status based on total paid vs grand total
    if (totalPaid >= grandTotal && paymentStatus !== "PAID") {
      setPaymentStatus("PAID");
    } else if (totalPaid > 0 && totalPaid < grandTotal && paymentStatus !== "PARTIAL") {
      setPaymentStatus("PARTIAL");
    } else if (totalPaid === 0 && paymentStatus !== "PENDING" && paymentType !== 'none') {
      setPaymentStatus("PENDING");
    }
  }, [depositPaid, paymentAmount, grandTotal, paymentStatus, paymentType]);
  
  // Handle payment type change
  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    
    if (type === 'full') {
      setPaymentAmount(balanceDue);
      setPaymentStatus('PAID');
    } else if (type === 'partial') {
      setPaymentAmount(0); // Initialize to 0 for partial payment
      setPaymentStatus('PARTIAL');
    } else if (type === 'none') {
      setPaymentAmount(0);
      setPaymentStatus('PENDING');
    }
  };

  if (!reservation) return null;
  const { reference, checkInDate: rawCheckInDate, checkOutDate: rawCheckOutDate, guestName, roomType, roomNumber } = reservation;
  
  // Format money with spaces (e.g., "100 000 FCFA")
  const fmtMoney = (amt) => {
    const formatted = amt.toLocaleString('fr-FR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).replace(/\u202F/g, ' '); // Replace non-breaking space with regular space
    const currency = reservation.currency || 'FCFA';
    return `${formatted} ${currency}`;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setApiError("");
    
    // Validate check-in time
    if (!hours || !minutes) {
      setErr("Veuillez entrer l'heure d'arrivée (heures et minutes)");
      return;
    }
    
    const hoursNum = parseInt(hours, 10);
    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 23) {
      setErr("Veuillez entrer des heures valides (00-23)");
      return;
    }
    
    const minutesNum = parseInt(minutes, 10);
    if (isNaN(minutesNum) || minutesNum < 0 || minutesNum > 59) {
      setErr("Veuillez entrer des minutes valides (00-59)");
      return;
    }
    
    // Validate that a room has been confirmed
    if (!confirmedRoom) {
      setErr("Veuillez sélectionner et confirmer une chambre avant le check-in");
      // Scroll to room selection button and open it if closed
      const roomButton = document.getElementById('room-selection-button');
      if (roomButton) {
        roomButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Open room selection if it's closed
        if (!showRoomSection) {
          setShowRoomSection(true);
        }
      }
      return;
    }
    
    // FIXED: Validate payment amount doesn't exceed balance due
    if (paymentType === 'partial') {
      const amount = Number(paymentAmount);
      if (amount <= 0) {
        setErr("Veuillez entrer un montant de paiement valide");
        return;
      }
      if (amount > balanceDue) {
        setErr(`Le montant du paiement (${fmtMoney(amount)}) dépasse le solde dû (${fmtMoney(balanceDue)})`);
        return;
      }
    }
    
    // FIXED: Validate full payment amount
    if (paymentType === 'full' && paymentAmount > balanceDue) {
      setErr(`Le montant du paiement ne peut pas dépasser le solde dû (${fmtMoney(balanceDue)})`);
      return;
    }
    
    // Show payment confirmation modal
    setShowPaymentConfirm(true);
    return;
  }
  
  async function proceedWithCheckIn() {
    try {
      setSubmitting(true);
      
      // Determine final room number with proper priority
      const finalRoomNumber = confirmedRoom || selectedRoom || roomNumber;
      
      // FIXED: Calculate amount paid with validation
      // Only add new payment amount, don't recalculate from status
      const newPaymentAmount = paymentType === 'none' ? 0 : Number(paymentAmount || 0);
      const calculatedAmountPaid = depositPaid + newPaymentAmount;
      
      // Validate total doesn't exceed grand total
      if (calculatedAmountPaid > grandTotal) {
        setErr(`Le montant total payé (${fmtMoney(calculatedAmountPaid)}) dépasse le total (${fmtMoney(grandTotal)})`);
        setSubmitting(false);
        return;
      }
      
      // Build payload
      const checkInPayload = {
        id: reservation.id,
        reference,
        checkInDate,       // Original reservation date
        checkInTime: getTimeString(), // "HH:mm"
        roomNumber: finalRoomNumber,
        // NEW: Actual check-in data
        actualCheckInDate: hotelToday, // When guest actually arrived
        actualNights: nights, // Calculated actual nights
        updatedTotalPrice: grandTotal, // Actual total charged
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        amountPaid: calculatedAmountPaid
      };
      
      // Debug logging
      console.log('=== CHECK-IN PAYLOAD ===');
      console.log('Payment Status:', paymentStatus);
      console.log('Grand Total:', grandTotal);
      console.log('Deposit Paid:', depositPaid);
      console.log('Calculated Amount Paid:', calculatedAmountPaid);
      console.log('Full Payload:', checkInPayload);
      
      // Send complete check-in data including actual dates and pricing
      await onConfirm?.(checkInPayload);
      
      // Emit events to refresh guest table and dashboard
      eventBus.emit(EVENTS.GUEST_UPDATED);
      eventBus.emit(EVENTS.GUEST_CHECKED_IN, { reservationId: reservation.id });
      
      onClose?.();
    } catch (error) {
      console.error('Error during check-in:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Unknown error occurred';
      setApiError(`Check-in failed: ${errorMsg}`);
      alert(`There was an error processing the check-in. Please try again. Error: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Create the modal content
  const modalContent = (
    <div className="checkin-modal-overlay" onClick={onClose}>
      <div 
        className="checkin-modal" 
        ref={dialogRef} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-in-title"
        tabIndex={-1}
      >
        <h2 id="check-in-title">Arrivée du Client</h2>

        <div className="guest-card">
          <div className="guest-card-header">
            <h3>Détails de la Réservation</h3>
            <div className="confirmation-number">{reference}</div>
          </div>
          
          <div className="guest-info-grid">
            <div className="info-section">
              <div className="info-group">
                <label className="info-label">Nom du Client</label>
                <div className="info-value primary">{guestName || "—"}</div>
              </div>
              <div className="info-group">
                <label className="info-label">Type de Chambre</label>
                <div className="info-value">{formatRoomType(roomType)}</div>
              </div>
            </div>
            
            <div className="info-section">
              <div className="info-group">
                <label className="info-label">Date d'Arrivée</label>
                <div className="info-value">
                  {checkInDate ? fmtNiceYmdFR(checkInDate) : 'Aucune date d\'arrivée'}
                </div>
                {checkInDate && isSameDayYmd(checkInDate, hotelToday) && (
                  <span className="today-badge">Aujourd'hui</span>
                )}
                {checkInDate && isBeforeYmd(hotelToday, checkInDate) && (
                  <span className="early-arrival-badge" style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginLeft: '8px'
                  }}>
                    Arrivée Anticipée ({nightsBetweenYmd(hotelToday, checkInDate)} jours en avance)
                  </span>
                )}
              </div>
              <div className="info-group">
                <label className="info-label">Date de Départ</label>
                <div className="info-value">
                  {checkOutDate ? fmtNiceYmdFR(checkOutDate) : 'Aucune date de départ'}
                </div>
              </div>
            </div>
            
            <div className="info-section">
              <div className="info-group">
                <label className="info-label">Durée du Séjour</label>
                <div className="info-value">
                  {checkInDate && checkOutDate ? (
                    <>
                      {nightsBetweenYmd(checkInDate, checkOutDate) || 1} nuits
                      {isBeforeYmd(hotelToday, checkInDate) && (
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#92400e', 
                          marginLeft: '8px',
                          fontWeight: '500'
                        }}>
                          (Réel: {nightsBetweenYmd(hotelToday, checkOutDate)} nuits)
                        </span>
                      )}
                    </>
                  ) : "—"}
                </div>
              </div>
              <div className="info-group">
                <label className="info-label">Numéro de Chambre</label>
                <div className="info-value room-number">
                  {confirmedRoom ? `#${confirmedRoom}` : selectedRoom ? `#${selectedRoom}` : roomNumber ? `#${roomNumber}` : 'Non assignée'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="section">
          <div className="arrival-verification-container">
            <div className="arrival-time-card">
              <h3>Heure d'Arrivée <span style={{ color: '#dc2626' }}>*</span></h3>
              <p className="section-description">Enregistrez l'heure d'arrivée réelle de ce client (obligatoire)</p>
              
              <TimeInput
                hours={hours}
                minutes={minutes}
                onHoursChange={setHours}
                onMinutesChange={setMinutes}
                label="Heure d'Arrivée (24h) *"
                hint="Heure standard de check-in: 12:00"
                required
              />
            </div>
            
            <div className="verification-card">
              <h3>Vérification Pré-Arrivée</h3>
              <div className="checklist-items">
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  Identification du client vérifiée
                </div>
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  Méthode de paiement sécurisée
                </div>
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  Politiques de l'hôtel expliquées
                </div>
              </div>
            </div>
          </div>
          
          {/* Room Assignment Section */}
          <div className="check-in-time-section">
            <h3>Attribution de Chambre</h3>
            <div className="section-description">
              {confirmedRoom ? 
                <p>✓ Chambre confirmée: <strong style={{ color: '#10b981' }}>#{confirmedRoom}</strong></p> :
                roomNumber ? 
                  <p>Chambre actuelle: <strong>#{roomNumber}</strong> - Vous pouvez la changer ci-dessous si nécessaire.</p> :
                  <p>⚠️ Aucune chambre assignée. Veuillez sélectionner et confirmer une chambre ci-dessous.</p>
              }
            </div>
            
            {sortedAvailableRooms.length > 0 ? (
              <>
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={() => setShowRoomSection(!showRoomSection)}
                  style={{ marginBottom: '15px' }}
                >
                  {showRoomSection ? "Masquer la Sélection de Chambre" : "Sélectionner/Changer de Chambre"}
                </button>
                
                {showRoomSection && (
              <div className="form-section">
                {selectedRoom && getRoomById(selectedRoom) && (
                  <div className="selected-room-details">
                    <h4>Chambre Sélectionnée</h4>
                    <div className="room-details-grid">
                      <div>
                        <p><strong>Numéro de Chambre:</strong> {selectedRoom}</p>
                        <p><strong>Type de Chambre:</strong> {getRoomById(selectedRoom)?.type}</p>
                      </div>
                      <div>
                        <p><strong>Capacité:</strong> {getRoomById(selectedRoom).capacity} personnes</p>
                        <p><strong>Prix:</strong> {getRoomById(selectedRoom).price.toLocaleString()} FCFA/nuit</p>
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
                  </div>
                )}
                
                {roomUpdateMessage && (
                  <div className="room-update-message success">
                    {roomUpdateMessage}
                  </div>
                )}
                
                <div className="hotel-layout">
                  <div className="legend">
                    <div className="legend-item">
                      <span className="status-indicator available"></span> 
                      Chambres {getRoomTypeLabel() !== 'Available' ? `de Type ${getRoomTypeLabel()}` : ''} Disponibles
                    </div>
                  </div>
                  
                  <div className="rooms-grid">
                    {sortedAvailableRooms.map((room) => {
                      const displayNumber = getDisplayNumber(room);
                      
                      return (
                        <button
                          type="button"
                          key={room.id ?? displayNumber}
                          className={`room-button ${selectedRoom === displayNumber ? 'selected' : ''} available`}
                          onClick={() => {
                            if (selectedRoom !== displayNumber) {
                              setConfirmedRoom('');
                              if (roomUpdateMessage) setRoomUpdateMessage('');
                            }
                            setSelectedRoom(displayNumber);
                          }}
                          title={`Chambre ${displayNumber} - ${room.type} - Disponible`}
                        >
                          <div className="room-number">{displayNumber}</div>
                          <div className="room-type">{room.type}</div>
                          <div className="room-price">{room.price?.toLocaleString?.() ?? room.price} FCFA</div>
                          {Array.isArray(room.amenities) && room.amenities.length > 0 && (
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
                
                {/* Room confirmation button appears below room selection */}
                {selectedRoom && (
                  <div className="room-confirm-section">
                    {confirmedRoom && confirmedRoom !== selectedRoom && (
                      <div className="room-warning">
                        Vous avez changé votre sélection de la Chambre #{confirmedRoom} à la Chambre #{selectedRoom}.
                        Veuillez confirmer cette nouvelle sélection.
                      </div>
                    )}
                    <div className="button-confirm-container">
                      <button 
                        type="button" 
                        className="btn secondary" 
                        onClick={async () => {
                          try {
                            // Get room details
                            const room = getRoomById(selectedRoom);
                            if (!room || !room.id) {
                              setErr(`Chambre ${selectedRoom} introuvable`);
                              return;
                            }
                            
                            // Assign the room via API (backend will check availability atomically)
                            const assignResponse = await fetch(`/api/admin/bookings/${reservation.id}/assign-room`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ roomId: room.id })
                            });
                            
                            if (!assignResponse.ok) {
                              const errorText = await assignResponse.text();
                              setErr(errorText || 'Échec de l\'attribution de la chambre');
                              setRoomUpdateMessage('');
                              return;
                            }
                            
                            // Success - room is now assigned in database
                            setConfirmedRoom(selectedRoom);
                            setRoomUpdateMessage(`✓ Chambre #${selectedRoom} assignée avec succès`);
                            setTimeout(() => setRoomUpdateMessage(""), 3000);
                            setErr("");
                            
                            // Emit event to refresh rooms
                            eventBus.emit(EVENTS.ROOM_ASSIGNED);
                          } catch (error) {
                            console.error('Room assignment error:', error);
                            setErr('Échec de l\'attribution de la chambre: ' + error.message);
                          }
                        }}
                      >
                        Confirmer la Sélection de Chambre
                      </button>
                      {confirmedRoom === selectedRoom && (
                        <div className="confirmed-badge">✓ Confirmée</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
              </>
            ) : (
              <div className="no-rooms-message">
                <p>Aucune chambre disponible correspondant à ce type de réservation.</p>
              </div>
            )}
          </div>

          {/* Booking Summary & Payment - Side by Side */}
          <div className="booking-summary-card">
            <h3 className="booking-summary-title">Paiement à l'Arrivée</h3>
            
            {/* Early Arrival Notice */}
            {isEarlyArrival && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#92400e'
              }}>
                <strong>Arrivée Anticipée:</strong> Facturation pour le séjour réel ({actualNights} {actualNights === 1 ? 'nuit' : 'nuits'}) au lieu de la réservation ({reservedNights} {reservedNights === 1 ? 'nuit' : 'nuits'})
              </div>
            )}
            
            {/* Side by Side Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Left: Summary */}
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  RÉSUMÉ
                </h4>
                
                {/* Room Details */}
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '600'
                  }}>
                    Chambre
                  </div>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {roomType || 'Deluxe Single'}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>
                    {nights} {nights === 1 ? 'nuit' : 'nuits'}
                  </div>
                  {isEarlyArrival && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#92400e',
                      fontWeight: '500'
                    }}>
                      ⚠️ Arrivée anticipée: Facturation de {nights} nuits au lieu de {reservedNights} nuits réservées
                    </div>
                  )}
                </div>
                
                {/* Payment Breakdown */}
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Total</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{fmtMoney(grandTotal)}</span>
                  </div>
                  
                  {/* Show current payment if any */}
                  {currentPaymentAmount > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '13px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: '#fffbeb',
                      margin: '-12px -12px 8px -12px',
                      padding: '8px 12px',
                      borderRadius: '8px 8px 0 0'
                    }}>
                      <span style={{ color: '#92400e', fontWeight: '500' }}>
                        + Paiement Maintenant
                      </span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: '#d97706'
                      }}>
                        {fmtMoney(Number(currentPaymentAmount))}
                      </span>
                    </div>
                  )}
                  
                  {totalPaid > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '13px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <span style={{ color: '#6b7280' }}>Total Payé</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: '16px' }}>✓</span>
                        {fmtMoney(totalPaid)}
                      </span>
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: totalPaid > 0 ? '8px' : '0',
                    marginTop: totalPaid > 0 ? '0' : '8px',
                    borderTop: totalPaid > 0 ? 'none' : '1px solid #f3f4f6'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#1f2937',
                      fontSize: '14px'
                    }}>
                      {remainingBalance > 0 ? 'Restant' : 'Solde'}
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: remainingBalance > 0 ? '#dc2626' : '#10b981', 
                      fontSize: '18px'
                    }}>
                      {fmtMoney(remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right: Payment Options */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px'
              }}>
                {balanceDue > 0 ? (
                  <PaymentFields
                    paymentType={paymentType}
                    onPaymentTypeChange={handlePaymentTypeChange}
                    paymentAmount={paymentAmount}
                    onPaymentAmountChange={setPaymentAmount}
                    totalAmount={balanceDue}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    paymentStatus={paymentStatus}
                    onPaymentStatusChange={setPaymentStatus}
                  />
                ) : (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '6px',
                    padding: '12px',
                    textAlign: 'center',
                    color: '#166534',
                    fontWeight: '500'
                  }}>
                    ✓ Entièrement Payé - Aucun solde dû
                  </div>
                )}
              </div>
            </div>
          </div>

          {err && <p className="error">{err}</p>}
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
            <div className="action-note">
              Compléter le Check-In mettra à jour le statut du client à "En Séjour"
            </div>
            
            <div className="button-group">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="small" color="#fff" />
                    <span style={{ marginLeft: '8px' }}>Traitement...</span>
                  </>
                ) : "Compléter le Check-In"}
              </button>
              
              <button
                type="button"
                className="btn cancel"
                onClick={onClose}
                disabled={submitting}
              >
                Annuler
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Payment Confirmation Modal */}
      <PaymentConfirmModal
        show={showPaymentConfirm}
        onClose={() => setShowPaymentConfirm(false)}
        onConfirm={async () => {
          setShowPaymentConfirm(false);
          try {
            await proceedWithCheckIn();
          } catch (roomError) {
            console.error('Error assigning room:', roomError);
            const errorMsg = roomError?.response?.data?.message || roomError?.message || 'Failed to assign room';
            setApiError(`Room assignment failed: ${errorMsg}. Continuing with check-in...`);
            // Continue with check-in even if room assignment fails
          }
        }}
        type={paymentType === 'full' ? 'paid' : paymentType === 'partial' ? 'partial' : 'unpaid'}
        amount={fmtMoney(balanceDue)}
        context="checkin"
        paymentAmount={Number(currentPaymentAmount)}
        paymentMethod={paymentMethod}
        remainingBalance={remainingBalance}
      />
    </div>
  );
  // Use createPortal to render the modal outside the normal DOM hierarchy
  return createPortal(modalContent, portalTarget);
}
