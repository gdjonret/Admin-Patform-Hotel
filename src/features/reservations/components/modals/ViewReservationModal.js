import React, { useRef, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { MdContentCopy } from "react-icons/md";
import { fmtNiceYmdFR, nightsBetweenYmd, isSameDayYmd, fmtTime24FR } from "../../../../lib/dates";
import { formatRoomType, formatFCFA } from "../../../../lib/formatters";
import { useRooms } from "../../../../context/RoomContext";
import { fetchReservationById, getPayments } from "../../../../api/reservations";
import PaymentHistoryModal from "./PaymentHistoryModal";
import GuestContactSection from "../../../../components/common/GuestContactSection";
import { useRole } from "../../../../hooks/useRole";
import { useTaxCalculation } from "../../../../hooks/useTaxCalculation";
import "./view-modal.css";

function getFocusable(node) {
  if (!node) return [];
  return Array.from(
    node.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  );
}

function StatusBadge({ status }) {
  // Use the same status mapping as the main Reservations page
  const getStatusInfo = (status) => {
    const statusMap = {
      'PENDING': { class: 'pending', text: 'En Attente' },
      'CONFIRMED': { class: 'confirmed', text: 'Confirmée' },
      'CHECKED_IN': { class: 'checked_in', text: 'Checked In' },
      'IN_HOUSE': { class: 'checked_in', text: 'En Séjour' },
      'CHECKED_OUT': { class: 'checked-out', text: 'Checked Out' },
      'CANCELLED': { class: 'cancelled', text: 'Annulée' },
      'NO_SHOW': { class: 'no-show', text: 'Absent' }
    };
    return statusMap[status] || { class: 'confirmed', text: status || 'Inconnu' };
  };
  
  const statusInfo = getStatusInfo(status);
  
  return (
    <span className={`status-badge ${statusInfo.class}`}>
      {statusInfo.text}
    </span>
  );
}

export default function ViewReservationModal({
  open,
  reservation,
  currentTab,
  onClose,
  onCheckIn,
  onAssignRoom,
  onCheckOut,
  onAddCharge,
  onRecordPayment,
  onEdit,
  onViewReceipt,
  onConfirm,
  onRefreshParent, // Optional callback to refresh parent data
}) {
  // Get room price information from context
  const { getRoomPrice } = useRooms();
  const { isAdmin } = useRole();
  const { calculateTaxes } = useTaxCalculation();
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const portalTarget = document.getElementById("modal-root") || document.body;
  
  // Payment History Modal state
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [refreshedReservation, setRefreshedReservation] = useState(reservation);
  const [paymentCount, setPaymentCount] = useState(0);
  
  // Debug: Log every render
  const renderCount = React.useRef(0);
  renderCount.current++;
  console.log(`🎨 ViewReservationModal render #${renderCount.current}`);

  // Fetch payment count and refresh reservation when modal opens
  useEffect(() => {
    if (open && reservation?.id) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservation?.id]);
  
  // Update refreshed reservation when parent updates the reservation prop
  useEffect(() => {
    if (reservation) {
      console.log('🔄 ViewReservationModal: Reservation prop changed!');
      console.log('   _refreshKey:', reservation._refreshKey);
      console.log('   amountPaid:', reservation.amountPaid);
      console.log('   totalPrice:', reservation.totalPrice);
      console.log('   Current refreshedReservation amountPaid:', refreshedReservation?.amountPaid);
      
      // Force a new object to trigger re-render
      setRefreshedReservation({ ...reservation });
      
      // Also refresh payment count when reservation updates
      if (reservation.id) {
        fetchPaymentCount();
      }
      
      console.log('   ✅ Updated refreshedReservation');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation, reservation?._refreshKey]);

  const fetchPaymentCount = async () => {
    try {
      const payments = await getPayments(reservation.id);
      setPaymentCount(payments?.length || 0);
    } catch (error) {
      console.error('Error fetching payment count:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      const updated = await fetchReservationById(reservation.id);
      setRefreshedReservation(updated);
      await fetchPaymentCount();
      // Also notify parent to refresh if callback provided
      onRefreshParent?.();
    } catch (error) {
      console.error('Error refreshing reservation:', error);
    }
  };

  // ---- Modal lifecycle: scroll lock, focus, ESC, focus trap
  useEffect(() => {
    // Only run the effect if the modal is open and reservation exists
    if (!open || !reservation) return;
    previouslyFocusedRef.current = document.activeElement;
    document.body.classList.add("modal-open");

    const first = getFocusable(dialogRef.current)[0] || dialogRef.current;
    first && first.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === "Tab") {
        const nodes = getFocusable(dialogRef.current);
        if (!nodes.length) return;
        const firstEl = nodes[0];
        const lastEl = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.classList.remove("modal-open");
      previouslyFocusedRef.current?.focus?.();
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onClose, open, reservation]);

  // Early return if modal is not open or no reservation data
  if (!open || !reservation) return null;

  // Use refreshed reservation data if available
  const currentReservation = refreshedReservation || reservation;

  const {
    reference,
    bookingReference,
    status,
    guestName,
    guestEmail,
    guestPhone,
    roomType,
    roomNumber,
    checkIn, // ISO or YMD string depending on your table shape
    checkOut,
    checkInDate, // if you store YMD separately, we will fall back below
    checkOutDate,
    checkInTime, // "HH:mm" (24h, optional)
    checkOutTime, // "HH:mm" (24h, optional)
    adults,
    kids,
    paymentMethod,
    paymentStatus,
    specialRequest,
    balance,
    createdAt,
    confirmedAt,
    checkedInAt,
    checkedOutAt,
    cancelledAt,
    cancellationReason,
    roomPrice,
    pricePerNight,
    totalPrice,
    amountPaid,
  } = currentReservation;
  
  // Use bookingReference if reference is not available
  const displayReference = reference || bookingReference;
  
  // Map to expected field names for compatibility
  const email = guestEmail;
  const phone = guestPhone;
  const guests = { adults, kids };

  // Normalize date fields to YMD for display helpers (prefer explicit YMD if present)
  const inYmd = checkInDate || (typeof checkIn === "string" ? checkIn.slice(0, 10) : "");
  const outYmd = checkOutDate || (typeof checkOut === "string" ? checkOut.slice(0, 10) : "");
  
  // Calculate nights and room charges
  const nights = nightsBetweenYmd(inYmd, outYmd) || 0;
  const actualRoomPrice = roomPrice || pricePerNight || (roomType ? getRoomPrice(roomType) : 0);
  const roomCharge = actualRoomPrice * nights;
  
  // FIXED: Only calculate taxes for active reservations (not checked out or cancelled)
  // For past/completed reservations, use the stored totalPrice (which already includes taxes if they were applied)
  const isPastReservation = status === 'CHECKED_OUT' || status === 'CANCELLED';
  const taxBreakdown = (!isPastReservation && actualRoomPrice && nights) ? calculateTaxes(actualRoomPrice, nights, 0) : null;
  
  // Use stored totalPrice for past reservations, calculated total for active ones
  const displayTotal = totalPrice || (taxBreakdown ? taxBreakdown.grandTotal : roomCharge) || balance || 0;

  // Calculate outstanding balance using the total with taxes
  const totalCharges = displayTotal;
  const paidAmount = amountPaid || 0;
  const outstandingBalance = totalCharges - paidAmount;
  
  console.log(`💵 Calculated values:`, {
    totalCharges,
    paidAmount,
    outstandingBalance,
    displayTotal,
    taxBreakdown: taxBreakdown ? { grandTotal: taxBreakdown.grandTotal, totalTaxes: taxBreakdown.totalTaxes } : null,
    source: refreshedReservation ? 'refreshedReservation' : 'reservation'
  });

  const copyRef = () => {
    if (displayReference) {
      navigator.clipboard.writeText(displayReference)
        .then(() => alert('Reference copied'))
        .catch(err => console.error('Could not copy reference: ', err));
    }
  };

  const body = (
    <div className="view-modal-wrapper" onClick={onClose}>
      <div
        className="view-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="head">
          <div className="reservation-title">Détails de la Réservation</div>
          <div className="inline">
            <div className="ref">Réf: <strong id="ref">{displayReference || "—"}</strong>
              <button className="copy" onClick={copyRef}><MdContentCopy size={14} /> Copier</button>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>
        
        {/* No-Show Warning Banner */}
        {status === 'NO_SHOW' && (
          <div className="no-show-banner">
            <div className="banner-icon">⚠️</div>
            <div className="banner-content">
              <strong>Client Absent</strong>
              <p>Ce client n'est pas arrivé pour sa réservation. La réservation a été automatiquement annulée à minuit.</p>
            </div>
          </div>
        )}
        
        {/* Cancelled Warning Banner */}
        {status === 'CANCELLED' && reservation.cancellationReason && (
          <div className="cancelled-banner">
            <div className="banner-icon">ℹ️</div>
            <div className="banner-content">
              <strong>Réservation Annulée</strong>
              <p>{reservation.cancellationReason}</p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="body">
          {/* LEFT: details */}
          <div className="stack">
            <div className="section">
              <h2>Client & Réservation</h2>
              
              <div className="grid" style={{ marginBottom: '12px' }}>
                <div className="item">
                  <span className="k">Client</span>
                  <span className="v">{guestName || "—"}</span>
                </div>
                <div className="item">
                  <span className="k">Contact</span>
                  <span className="v" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>{email || "—"}</span>
                    {phone && <span>{phone}</span>}
                  </span>
                </div>
                <div className="item">
                  <span className="k">Chambre</span>
                  <span className="v" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>{formatRoomType(roomType)}</span>
                    {roomNumber && <span>Chambre {roomNumber}</span>}
                  </span>
                </div>
                <div className="item">
                  <span className="k">Personnes</span>
                  <span className="v">
                    {guests?.adults ?? "—"} Adulte{guests?.adults !== 1 ? 's' : ''}
                    {typeof guests?.kids === "number" ? ` • ${guests.kids} Enfant${guests.kids !== 1 ? 's' : ''}` : ""}
                  </span>
                </div>
              </div>
              
              <div className="timeline">
                <div className="tl">
                  <div className="dot"></div>
                  <div>
                    <h3>Arrivée</h3>
                    <p>{inYmd ? fmtNiceYmdFR(inYmd) : "—"} {checkInTime ? `• ${fmtTime24FR(checkInTime)}` : ""}</p>
                    <p className="muted">Arrivée anticipée sous réserve de disponibilité.</p>
                  </div>
                </div>
                <div className="tl">
                  <div className="dot" style={{ background: '#10b981' }}></div>
                  <div>
                    <h3>Départ</h3>
                    <p>{outYmd ? fmtNiceYmdFR(outYmd) : "—"} {checkOutTime ? `• ${fmtTime24FR(checkOutTime)}` : ""}</p>
                    <p className="muted">Le départ tardif peut entraîner des frais.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact & Address Information */}
            <GuestContactSection reservation={currentReservation} email={email} phone={phone} />
            
            {specialRequest && (
              <div className="section">
                <h2>Demandes Spéciales</h2>
                <p className="muted">{specialRequest}</p>
              </div>
            )}
          </div>
          
          {/* RIGHT: price & actions */}
          <div className="stack">
            <div className="section">
              <h2>Charges</h2>
              {/* Display room charges with taxes */}
              {(() => {
                return (
                  <>
                    <div className="price-row">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="muted">Chambre</span>
                        <span className="muted" style={{ fontSize: '0.85em' }}>({formatRoomType(roomType)})</span>
                      </div>
                      <strong>{actualRoomPrice ? formatFCFA(actualRoomPrice) : "—"}</strong>
                    </div>
                    <div className="price-row">
                      <span className="muted">Nuits</span>
                      <strong>{nights || "—"}</strong>
                    </div>
                    <div className="price-row">
                      <span className="muted">Total Chambre</span>
                      <strong>{roomCharge > 0 ? `${Number(roomCharge).toLocaleString()} FCFA` : "—"}</strong>
                    </div>
                    
                    {/* Tax Breakdown */}
                    {taxBreakdown && taxBreakdown.taxes && taxBreakdown.taxes.length > 0 && (
                      <>
                        <div className="price-divider" style={{ 
                          height: '1px', 
                          background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)', 
                          margin: '12px 0' 
                        }}></div>
                        {taxBreakdown.taxes.map((tax, index) => (
                          <div key={index} className="price-row" style={{ fontSize: '0.9em', color: '#6b7280' }}>
                            <span className="muted" style={{ fontStyle: 'italic' }}>
                              {tax.name} ({tax.type === 'PERCENTAGE' ? `${tax.rate}%` : `${tax.rate.toLocaleString()} FCFA`})
                            </span>
                            <strong>{(tax.amount || 0).toLocaleString()} FCFA</strong>
                          </div>
                        ))}
                        <div className="price-row" style={{ fontWeight: '600', paddingTop: '8px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                          <span className="muted">Total Taxes</span>
                          <strong>{(taxBreakdown.totalTaxes || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div className="price-divider" style={{ 
                          height: '1px', 
                          background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)', 
                          margin: '12px 0' 
                        }}></div>
                      </>
                    )}
                    
                    <div className="price-row total">
                      <span>Total des Frais</span>
                      <strong>{displayTotal > 0 ? `${Number(displayTotal).toLocaleString()} FCFA` : "—"}</strong>
                    </div>
                    {/* Only show payment details for tabs where payment is relevant */}
                    {(() => {
                      // Check if current tab allows payment details
                      const tabAllowsPayment = currentTab && ['arrivals', 'in-house', 'departures', 'past', 'all'].includes(currentTab.toLowerCase());
                      
                      // For "All" tab, also check booking status - don't show for PENDING/UPCOMING/CANCELLED/NO_SHOW
                      const statusAllowsPayment = currentTab?.toLowerCase() === 'all' 
                        ? status && !['PENDING', 'CANCELLED', 'NO_SHOW'].includes(status)
                        : true;
                      
                      // Also hide payment details for cancelled and no-show bookings regardless of tab
                      const isClosedBooking = status && ['CANCELLED', 'NO_SHOW'].includes(status);
                      
                      const showPaymentDetails = tabAllowsPayment && statusAllowsPayment && !isClosedBooking;
                      
                      // Show special message for cancelled/no-show bookings
                      if (isClosedBooking) {
                        return (
                          <div className="price-row" style={{ 
                            borderTop: '1px solid #e5e7eb', 
                            paddingTop: '12px', 
                            marginTop: '12px',
                            fontStyle: 'italic',
                            color: '#6b7280'
                          }}>
                            <span>Aucun frais dû (réservation {status === 'NO_SHOW' ? 'absent' : 'annulée'})</span>
                          </div>
                        );
                      }
                      
                      if (!showPaymentDetails) {
                        return null;
                      }
                      
                      return (
                        <>
                          <div className="price-row" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }}>
                            <span className="muted">Montant Payé</span>
                            <strong style={{ color: '#10b981' }}>
                              {paidAmount > 0 ? `${Number(paidAmount).toLocaleString()} FCFA` : "0 FCFA"}
                            </strong>
                          </div>
                          <div className="price-row total" style={{ 
                            padding: '10px 0'
                          }}>
                            <span style={{ 
                              color: '#1f2937',
                              fontWeight: '600'
                            }}>
                              Solde Restant
                            </span>
                            <strong style={{ 
                              color: outstandingBalance > 0 ? '#dc2626' : '#10b981',
                              fontSize: '17px'
                            }}>
                              {Number(outstandingBalance).toLocaleString()} FCFA
                            </strong>
                          </div>
                        </>
                      );
                    })()}
                  </>
                );
              })()}
              <div style={{ marginTop: '10px' }} className="muted">Méthode de paiement: {paymentMethod || "—"} {paymentStatus ? `• ${paymentStatus}` : ""}</div>
            </div>
            
            <div className="section">
              <h2>Chronologie du Statut</h2>
              <div className="timeline">
                <div className="tl">
                  <div className="dot"></div>
                  <div>
                    <h3>Créée</h3>
                    <p>{createdAt ? new Date(createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Ndjamena' }) : "—"}</p>
                  </div>
                </div>
                {reservation.confirmedAt && (
                  <div className="tl">
                    <div className="dot"></div>
                    <div>
                      <h3>Confirmée</h3>
                      <p>{new Date(reservation.confirmedAt).toLocaleString('fr-FR', { timeZone: 'Africa/Ndjamena' })}</p>
                    </div>
                  </div>
                )}
                {(status === 'IN_HOUSE' || status === 'CHECKED_OUT' || reservation.checkedInAt) && (
                  <div className="tl">
                    <div className="dot"></div>
                    <div>
                      <h3>Arrivé</h3>
                      <p>{reservation.checkedInAt ? new Date(reservation.checkedInAt).toLocaleString('fr-FR', { timeZone: 'Africa/Ndjamena' }) : "—"}</p>
                    </div>
                  </div>
                )}
                {(status === 'CHECKED_OUT' || reservation.checkedOutAt) && (
                  <div className="tl">
                    <div className="dot"></div>
                    <div>
                      <h3>Parti</h3>
                      <p>{reservation.checkedOutAt ? new Date(reservation.checkedOutAt).toLocaleString('fr-FR', { timeZone: 'Africa/Ndjamena' }) : "—"}</p>
                    </div>
                  </div>
                )}
                {status === 'CANCELLED' && reservation.cancelledAt && (
                  <div className="tl">
                    <div className="dot cancelled"></div>
                    <div>
                      <h3>Annulée</h3>
                      <p>{new Date(reservation.cancelledAt).toLocaleString('fr-FR', { timeZone: 'Africa/Ndjamena' })}</p>
                      {reservation.cancellationReason && (
                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                          Raison: {reservation.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {status === 'NO_SHOW' && reservation.cancelledAt && (
                  <div className="tl">
                    <div className="dot no-show"></div>
                    <div>
                      <h3>Annulée</h3>
                      <p>{new Date(reservation.cancelledAt).toLocaleString('fr-FR', { timeZone: 'Africa/Ndjamena' })}</p>
                      {reservation.cancellationReason && (
                        <p style={{ fontSize: '0.85rem', color: '#dd6b20', marginTop: '4px', fontWeight: '500' }}>
                          Raison: {reservation.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="foot">
          {/* Actions by status */}
          {status === "PENDING" && (
            <>
              <button className="btn success" onClick={() => onConfirm?.(reservation)}>
                ✓ Confirmer la Réservation
              </button>
            </>
          )}

          {status === "CONFIRMED" && (
            <>
              {/* Enregistrer Paiement - Admin Only */}
              {isAdmin && (
                <button 
                  className={outstandingBalance > 0 ? "btn success" : "btn"} 
                  onClick={() => setShowPaymentHistory(true)} 
                  style={{ position: 'relative' }}
                >
                  {outstandingBalance > 0 ? 'Enregistrer Paiement' : 'Historique des Paiements'}
                  {paymentCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600'
                    }}>
                      {paymentCount}
                    </span>
                  )}
                </button>
              )}
              <button className="btn" onClick={() => onCheckIn?.(reservation)} style={{ backgroundColor: '#52c41a', color: 'white' }}>
                Check-in
              </button>
            </>
          )}

          {status === "IN_HOUSE" && (
            <>
              <button className="btn" onClick={() => onCheckOut?.(reservation)}>
                Départ
              </button>
              <button className="btn" onClick={() => onAddCharge?.(reservation)}>
                Ajouter des Frais
              </button>
              {/* Enregistrer Paiement - Admin Only */}
              {isAdmin && (
                <button 
                  className={outstandingBalance > 0 ? "btn success" : "btn"} 
                  onClick={() => setShowPaymentHistory(true)} 
                  style={{ position: 'relative' }}
                >
                  {outstandingBalance > 0 ? 'Enregistrer Paiement' : 'Historique des Paiements'}
                  {paymentCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600'
                    }}>
                      {paymentCount}
                    </span>
                  )}
                </button>
              )}
              <button className="btn" onClick={() => onViewReceipt?.(reservation)}>
                Voir le Reçu
              </button>
            </>
          )}

          {status === "CHECKED_OUT" && (
            <>
              <button className="btn" onClick={() => setShowPaymentHistory(true)} style={{ position: 'relative' }}>
                Historique des Paiements
                {paymentCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600'
                  }}>
                    {paymentCount}
                  </span>
                )}
              </button>
              <button className="btn" onClick={() => onViewReceipt?.(reservation)}>
                Voir le Reçu
              </button>
            </>
          )}
          
          <button className="btn warn" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
      
      {/* Payment History Modal */}
      {showPaymentHistory && (
        <PaymentHistoryModal
          open={showPaymentHistory}
          reservation={currentReservation}
          onClose={() => setShowPaymentHistory(false)}
          onAddPayment={() => {
            setShowPaymentHistory(false);
            onRecordPayment?.(reservation);
          }}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );

  return createPortal(body, portalTarget);
}
