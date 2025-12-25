import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MdWifi, MdTv, MdAcUnit, MdLocalBar, MdLandscape } from "react-icons/md";
import {
  DEFAULT_CHECKOUT_TIME,
  fmtNiceYmdFR,
  nightsBetweenYmd,
  todayYmdTZ,
  isSameDayYmd,
  isAfterYmd,
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
import eventBus, { EVENTS } from "../../../../utils/eventBus";
import { useTaxCalculation } from "../../../../hooks/useTaxCalculation";
import { useRole } from "../../../../hooks/useRole";

/**
 * Props:
 * - reservation: {
 *     id, reference,
{{ ... }}
 *     checkInDate: "YYYY-MM-DD",
 *     checkOutDate: "YYYY-MM-DD",
 *     (optionally) checkInTime: "HH:mm"
 *   }
 * - onConfirm: async (payload) => void   // caller performs API call
 * - onClose: () => void
 */
export default function CheckOutConfirmModal({ reservation, onConfirm, onClose }) {
  const { calculateTaxes } = useTaxCalculation();
  const { isAdmin } = useRole();
  
  // Start with empty time - staff must enter actual departure time
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [apiError, setApiError] = useState("");
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Default values
  const defaultValues = {
    currency: reservation.currency || "FCFA",
    nightlyRate: reservation.pricePerNight || 25000,
    discount: 0,
    lateCheckoutFee: 0,
    depositPaid: reservation.amountPaid || 0, // Use existing amountPaid from reservation
  };

  // Editable pricing state
  const [currency] = useState(defaultValues.currency); // Read-only, from reservation
  const [nightlyRate, setNightlyRate] = useState(defaultValues.nightlyRate);
  const [discount, setDiscount] = useState(defaultValues.discount);
  const [lateCheckoutFee, setLateCheckoutFee] = useState(defaultValues.lateCheckoutFee);
  const [depositPaid] = useState(reservation.amountPaid || 0); // Use existing amountPaid
  const [paymentType, setPaymentType] = useState("none"); // "full", "partial", or "none"
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [internalNotes, setInternalNotes] = useState("");
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [confirmationType, setConfirmationType] = useState(""); // "paid" or "unpaid"
  const [showNotes, setShowNotes] = useState(false);
  const [billingMethod, setBillingMethod] = useState("reserved"); // "actual" or "reserved" - default to reserved for revenue protection
  
  // Always start with empty charges list
  const [incidentals, setIncidentals] = useState([]);

  const hotelToday = useMemo(() => todayYmdTZ("Africa/Ndjamena"), []);
  
  // Ensure there is a portal root (fallback to body)
  const portalTarget = document.getElementById("modal-root") || document.body;
  
  // Add body scroll lock when modal is open
  useEffect(() => {
    if (!reservation) return;
    
    previouslyFocusedRef.current = document.activeElement;
    document.body.classList.add("modal-open");
    
    const dialogEl = dialogRef.current;
    if (dialogEl) {
      dialogEl.focus();
    }
    
    return () => {
      document.body.classList.remove("modal-open");
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [reservation]);

  // Note: Charges are not persisted to localStorage - each checkout starts fresh
  
  // Handle hours input
  const handleHoursChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      if (value.length <= 2 && parseInt(value || '0', 10) <= 23) {
        setHours(value);
        if (value.length === 2) {
          document.getElementById('minutes-input-checkout').focus();
        }
      }
    }
  };
  
  // Handle minutes input
  const handleMinutesChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      if (value.length <= 2 && parseInt(value || '0', 10) <= 59) {
        setMinutes(value);
      }
    }
  };
  
  // Get time string
  const getTimeString = () => {
    const h = hours.padStart(2, '0');
    const m = minutes.padStart(2, '0');
    return `${h}:${m}`;
  };

  // Calculate charges (before early return)
  const checkInDate = reservation?.checkInDate || "";
  const checkOutDate = reservation?.checkOutDate || "";
  const reservedNights = checkInDate && checkOutDate ? nightsBetweenYmd(checkInDate, checkOutDate) || 1 : 1;
  const actualNights = checkInDate && hotelToday ? nightsBetweenYmd(checkInDate, hotelToday) || 1 : reservedNights;
  const isEarlyCheckout = checkOutDate && isBeforeYmd(hotelToday, checkOutDate);
  const isLateCheckout = checkOutDate && isAfterYmd(hotelToday, checkOutDate);
  
  // Use billing method to determine which nights to charge
  const nights = isEarlyCheckout && billingMethod === "actual" ? actualNights : 
                 isLateCheckout ? actualNights : 
                 reservedNights;
  const roomSubtotal = nights * nightlyRate;
  const incidentalsTotal = incidentals.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  // FIXED: Calculate taxes (include late checkout fee in extra charges)
  const totalExtraCharges = incidentalsTotal + lateCheckoutFee;
  const taxBreakdown = nightlyRate && nights ? calculateTaxes(nightlyRate, nights, totalExtraCharges) : null;
  
  // Calculate subtotal before tax
  const subtotalBeforeTax = Math.max(0, roomSubtotal + incidentalsTotal + lateCheckoutFee - discount);
  
  // Grand total includes taxes
  const grandTotal = taxBreakdown ? taxBreakdown.grandTotal : subtotalBeforeTax;
  const balanceDue = Math.max(0, grandTotal - depositPaid);
  
  // Auto-set payment amount when payment type changes
  useEffect(() => {
    if (paymentType === 'full') {
      setPaymentAmount(balanceDue);
    } else if (paymentType === 'partial') {
      setPaymentAmount(0); // Reset for user input
    } else if (paymentType === 'none') {
      setPaymentAmount(0);
    }
  }, [paymentType, balanceDue]);
  
  // FIXED: Validate discount doesn't exceed subtotal
  useEffect(() => {
    const maxDiscount = roomSubtotal + incidentalsTotal + lateCheckoutFee;
    if (discount > maxDiscount) {
      setDiscount(maxDiscount);
    }
  }, [discount, roomSubtotal, incidentalsTotal, lateCheckoutFee]);
  
  // Handle payment type change
  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (type === 'full') {
      setPaymentAmount(balanceDue);
      setPaymentStatus('PAID');
    } else if (type === 'partial') {
      setPaymentAmount(0);
      setPaymentStatus('PARTIAL');
    } else if (type === 'none') {
      setPaymentAmount(0);
      setPaymentStatus('PENDING');
    }
  };

  if (!reservation) return null;
  const {
    reference,
    checkInDate: rawCheckInDate,
    checkOutDate: rawCheckOutDate,
    guestName,
    roomType,
    roomNumber,
  } = reservation;

  // Format money with proper spacing (e.g., "20 000 FCFA")
  const fmtMoney = (amt) => {
    const formatted = amt.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${formatted} ${currency}`;
  };

  // FIXED: Charges handlers with strict validation
  const updateIncidental = (idx, key, value) => {
    setIncidentals(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      
      if (key === "amount") {
        const numValue = Number(value) || 0;
        // Prevent negative amounts in real-time
        return { ...it, amount: Math.max(0, numValue) };
      }
      
      return { ...it, [key]: value };
    }));
  };
  const addIncidental = () => setIncidentals(prev => [...prev, { label: "", amount: 0 }]);
  const removeIncidental = (idx) => setIncidentals(prev => prev.filter((_, i) => i !== idx));

  // Reset to defaults
  const resetToDefaults = () => {
    // currency is read-only from reservation
    setNightlyRate(defaultValues.nightlyRate);
    setDiscount(defaultValues.discount);
    setLateCheckoutFee(defaultValues.lateCheckoutFee);
  };
  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setApiError("");
    
    // FIXED: Validate charges don't have negative amounts
    const invalidCharge = incidentals.find(inc => inc.amount < 0);
    if (invalidCharge) {
      setErr("Les frais supplémentaires ne peuvent pas être négatifs");
      return;
    }
    
    // FIXED: Validate discount doesn't exceed subtotal
    const maxDiscount = roomSubtotal + incidentalsTotal + lateCheckoutFee;
    if (discount > maxDiscount) {
      setErr(`La réduction (${fmtMoney(discount)}) ne peut pas dépasser le sous-total (${fmtMoney(maxDiscount)})`);
      return;
    }
    
    if (!hours || !minutes) {
      setErr("Veuillez entrer l'heure de check-out (heures et minutes)");
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
    
    // Validate partial payment amount
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
    
    // Determine confirmation type based on payment
    if (balanceDue > 0) {
      if (paymentType === 'full') {
        setConfirmationType("paid");
      } else if (paymentType === 'partial') {
        setConfirmationType("partial");
      } else {
        setConfirmationType("unpaid");
      }
      setShowPaymentConfirm(true);
      return;
    }

    // No balance due, proceed directly
    proceedWithCheckOut();
  }
  
  async function proceedWithCheckOut() {
    const timeString = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    
    // Calculate amount paid based on payment type (cumulative)
    const calculatedAmountPaid = paymentType === 'full' ? (depositPaid + balanceDue) : 
                                  paymentType === 'partial' ? (depositPaid + Number(paymentAmount)) : 
                                  depositPaid;

    try {
      setSubmitting(true);
      
      // Filter out charges with zero amount and prepare JSON
      const validCharges = incidentals.filter(inc => inc.amount > 0 && inc.label.trim());
      const chargesJson = JSON.stringify(validCharges);
      
      await onConfirm?.({
        id: reservation.id,
        reference,
        checkOutDate,
        checkOutTime: timeString,
        // NEW: Complete checkout data
        actualCheckOutDate: hotelToday, // When guest actually left
        actualNights: nights, // Calculated actual nights (based on billing method)
        billingMethod: isEarlyCheckout ? billingMethod : 'reserved', // Which billing method was used
        finalTotalPrice: grandTotal, // Final amount charged
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        amountPaid: calculatedAmountPaid,
        chargesJson: chargesJson, // Send charges as JSON string
        internalNotes: internalNotes // FIXED: Save internal notes
      });
      
      // Emit event to refresh guest table
      eventBus.emit(EVENTS.GUEST_UPDATED);
      
      onClose?.();
    } catch (e2) {
      const errorMsg = e2?.response?.data?.message || e2?.message || 'Unknown error occurred';
      setApiError(`Check-out failed: ${errorMsg}`);
      setErr(e2?.message || "Failed to complete check-out. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const modalContent = (
    <div className="checkin-modal-overlay" onClick={onClose}>
      <div 
        className="checkin-modal" 
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-out-title"
        tabIndex={-1}
      >
        <h2 id="check-out-title">Check-Out Client</h2>

        <div className="checkout-grid">
          {/* Left Column */}
          <div className="checkout-left">
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
                    <label className="info-label">Date de Check-In</label>
                    <div className="info-value">
                      {checkInDate ? fmtNiceYmdFR(checkInDate) : 'Aucune date de check-in'}
                    </div>
                  </div>
                  <div className="info-group">
                    <label className="info-label">Date de Check-Out</label>
                    <div className="info-value">
                      {checkOutDate ? fmtNiceYmdFR(checkOutDate) : 'Aucune date de check-out'}
                    </div>
                    {checkOutDate && isSameDayYmd(checkOutDate, hotelToday) && (
                      <span className="today-badge">Today</span>
                    )}
                    {checkOutDate && isBeforeYmd(hotelToday, checkOutDate) && (
                      <span className="early-departure-badge" style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        marginLeft: '8px'
                      }}>
                        Départ Anticipé ({nightsBetweenYmd(hotelToday, checkOutDate)} jours en avance)
                      </span>
                    )}
                    {checkOutDate && isAfterYmd(hotelToday, checkOutDate) && (
                      <span className="late-departure-badge" style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        marginLeft: '8px'
                      }}>
                        Late Departure ({nightsBetweenYmd(checkOutDate, hotelToday)} days late)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="info-section">
                  <div className="info-group">
                    <label className="info-label">Durée du Séjour</label>
                    <div className="info-value">
                      {checkInDate && checkOutDate ? (
                        <>
                          {nightsBetweenYmd(checkInDate, checkOutDate) || 1} nights (Reserved)
                          {isBeforeYmd(hotelToday, checkOutDate) && checkInDate && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#1e40af', 
                              marginLeft: '8px',
                              fontWeight: '500'
                            }}>
                              (Réel: {nightsBetweenYmd(checkInDate, hotelToday)} nuits)
                            </span>
                          )}
                          {isAfterYmd(hotelToday, checkOutDate) && checkInDate && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#991b1b', 
                              marginLeft: '8px',
                              fontWeight: '500'
                            }}>
                              (Réel: {nightsBetweenYmd(checkInDate, hotelToday)} nuits - Dépassement)
                            </span>
                          )}
                        </>
                      ) : "—"}
                    </div>
                  </div>
                  <div className="info-group">
                    <label className="info-label">Numéro de Chambre</label>
                    <div className="info-value room-number">
                      {roomNumber ? `#${roomNumber}` : 'Non assignée'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing and Summary Grid */}
            <div className="pricing-summary-grid">
              {/* Left: Pricing, Charges, Deposit */}
              <div className="pricing-controls">
                {/* Stay & Pricing */}
                <div className="pricing-card">
                  <div className="pricing-header">
                    <h3 className="pricing-title">Séjour & Tarification</h3>
                    <button type="button" onClick={resetToDefaults} className="btn-reset">Réinitialiser</button>
                  </div>
                  <div className="pricing-grid">
                    <div className="pricing-field">
                      <label className="pricing-label">Devise</label>
                      <input 
                        type="text" 
                        className="pricing-input" 
                        value="FCFA" 
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="pricing-field">
                      <label className="pricing-label">Nuits</label>
                      <input 
                        type="number" 
                        className="pricing-input" 
                        value={nights} 
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="pricing-field">
                      <label className="pricing-label">Tarif par nuit</label>
                      <input 
                        type="number" 
                        className="pricing-input" 
                        value={nightlyRate} 
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="pricing-grid-2">
                    {/* Only admins can add discounts */}
                    {isAdmin && (
                      <div className="pricing-field">
                        <label className="pricing-label">Réduction</label>
                        <input 
                          type="number" 
                          className="pricing-input" 
                          value={discount} 
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            // FIXED: Validate discount in real-time (prevent negative and exceeding subtotal)
                            const maxDiscount = roomSubtotal + incidentalsTotal + lateCheckoutFee;
                            const validValue = Math.max(0, Math.min(value, maxDiscount));
                            setDiscount(validValue);
                          }}
                          min="0"
                          max={roomSubtotal + incidentalsTotal + lateCheckoutFee}
                        />
                      </div>
                    )}
                    <div className="pricing-field">
                      <label className="pricing-label">Frais de départ tardif</label>
                      <input 
                        type="number" 
                        className="pricing-input" 
                        value={lateCheckoutFee} 
                        onChange={(e) => setLateCheckoutFee(Math.max(0, Number(e.target.value) || 0))}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

            {/* Charges */}
            <div className="incidentals-card">
              <div className="incidentals-header">
                <h3 className="incidentals-title">Frais Supplémentaires</h3>
                <button type="button" onClick={addIncidental} className="btn-add-incidental">+ Add</button>
              </div>
              <div className="incidentals-list">
                {incidentals.length === 0 && (
                  <p className="incidentals-empty">Aucun supplément ajouté.</p>
                )}
                {incidentals.map((item, idx) => (
                  <div key={idx} className="incidental-row">
                    <input
                      type="text"
                      placeholder="ex: Mini-bar, Blanchisserie"
                      className="incidental-label-input"
                      value={item.label}
                      onChange={(e) => updateIncidental(idx, "label", e.target.value)}
                    />
                    <input
                      type="number"
                      className="incidental-amount-input"
                      value={item.amount}
                      onChange={(e) => updateIncidental(idx, "amount", e.target.value)}
                    />
                    <span className="incidental-formatted">{fmtMoney(Number(item.amount) || 0)}</span>
                    <button 
                      type="button"
                      onClick={() => removeIncidental(idx)} 
                      className="btn-remove-incidental"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Deposit - Hidden (always 0) */}
            {false && (
            <div className="deposit-card">
              <h3 className="deposit-title">Deposit</h3>
              <div className="deposit-content">
                <div className="deposit-field">
                  <label className="deposit-label">Deposit / Prepaid</label>
                  <input 
                    type="number" 
                    className="deposit-input" 
                    value={depositPaid} 
                    onChange={() => {}}
                  />
                </div>
                <div className="deposit-display">{fmtMoney(depositPaid)}</div>
              </div>
            </div>
            )}

            {/* Internal Notes */}
            <div className="notes-card">
              <div className="notes-header">
                <h3 className="notes-title">Notes internes</h3>
                <button 
                  type="button" 
                  onClick={() => setShowNotes(!showNotes)} 
                  className="btn-toggle-notes"
                >
                  {showNotes ? '− Masquer' : '+ Ajouter'}
                </button>
              </div>
              {showNotes && (
                <div className="notes-field">
                  <textarea
                    className="notes-textarea"
                    placeholder="Notez les remarques sur les dommages, clés rendues, plaque d'immatriculation, etc. (non imprimé sur le reçu)"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
              </div>

              {/* Right: Charges Summary */}
              <div className="charges-summary-card">
                <h3 className="charges-summary-title">Résumé des Frais</h3>
                
                {/* Billing Method Toggle - Only show for early checkout */}
                {isEarlyCheckout && (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#0c4a6e',
                      marginBottom: '12px'
                    }}>
                      Méthode de Facturation (Départ Anticipé):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ 
                        display: 'grid',
                        gridTemplateColumns: '20px 1fr',
                        gap: '12px',
                        cursor: 'pointer',
                        alignItems: 'start'
                      }}>
                        <input
                          type="radio"
                          name="billingMethod"
                          value="actual"
                          checked={billingMethod === "actual"}
                          onChange={(e) => setBillingMethod(e.target.value)}
                          style={{ 
                            width: '18px',
                            height: '18px',
                            marginTop: '1px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ 
                          fontSize: '14px', 
                          color: '#0c4a6e', 
                          lineHeight: '1.5',
                          fontWeight: '500'
                        }}>
                          Facturer le séjour réel ({actualNights} {actualNights === 1 ? 'nuit' : 'nuits'})
                        </span>
                      </label>
                      <label style={{ 
                        display: 'grid',
                        gridTemplateColumns: '20px 1fr',
                        gap: '12px',
                        cursor: 'pointer',
                        alignItems: 'start'
                      }}>
                        <input
                          type="radio"
                          name="billingMethod"
                          value="reserved"
                          checked={billingMethod === "reserved"}
                          onChange={(e) => setBillingMethod(e.target.value)}
                          style={{ 
                            width: '18px',
                            height: '18px',
                            marginTop: '1px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ 
                          fontSize: '14px', 
                          color: '#0c4a6e', 
                          lineHeight: '1.5',
                          fontWeight: '500'
                        }}>
                          Facturer la réservation complète ({reservedNights} {reservedNights === 1 ? 'nuit' : 'nuits'})
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                
                {/* Late Checkout Notice - Automatic charge for overstay */}
                {isLateCheckout && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#991b1b'
                  }}>
                    <strong>Départ Tardif:</strong> Facturation du séjour réel ({actualNights} {actualNights === 1 ? 'nuit' : 'nuits'}) au lieu de la réservation ({reservedNights} {reservedNights === 1 ? 'nuit' : 'nuits'}). Le client est resté {actualNights - reservedNights} {actualNights - reservedNights === 1 ? 'nuit' : 'nuits'} supplémentaire(s).
                  </div>
                )}
                
                <dl className="charges-list">
                  <div className="charge-row">
                    <dt className="charge-label">
                      Chambre ({nights} {nights === 1 ? 'nuit' : 'nuits'} × {fmtMoney(nightlyRate)})
                      {isEarlyCheckout && (
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>
                          ({billingMethod === "actual" ? "Séjour réel" : "Réservation complète"})
                        </span>
                      )}
                    </dt>
                    <dd className="charge-value">{fmtMoney(roomSubtotal)}</dd>
                  </div>
                  
                  {/* Show supplements with header and details */}
                  {incidentals.length > 0 && incidentalsTotal > 0 && (
                    <>
                      <div className="charge-row" style={{ fontWeight: '600', marginTop: '8px' }}>
                        <dt className="charge-label">Frais Supplémentaires</dt>
                        <dd className="charge-value">{fmtMoney(incidentalsTotal)}</dd>
                      </div>
                      {incidentals.map((item, idx) => (
                        item.amount > 0 && item.label && (
                          <div key={idx} className="charge-row" style={{ fontSize: '0.9em', color: '#6b7280' }}>
                            <dt className="charge-label" style={{ paddingLeft: '20px', fontStyle: 'italic' }}>
                              • {item.label}
                            </dt>
                            <dd className="charge-value">{fmtMoney(item.amount)}</dd>
                          </div>
                        )
                      ))}
                    </>
                  )}
                  
                  {lateCheckoutFee > 0 && (
                    <div className="charge-row">
                      <dt className="charge-label">Frais de départ tardif</dt>
                      <dd className="charge-value">{fmtMoney(lateCheckoutFee)}</dd>
                    </div>
                  )}
                  
                  {discount > 0 && (
                    <div className="charge-row">
                      <dt className="charge-label">Réduction</dt>
                      <dd className="charge-value discount-value">- {fmtMoney(discount)}</dd>
                    </div>
                  )}
                  
                  <div className="charges-divider"></div>
                  
                  <div className="charge-row">
                    <dt className="charge-label">Sous-total</dt>
                    <dd className="charge-value-bold">{fmtMoney(subtotalBeforeTax)}</dd>
                  </div>
                  
                  {/* Tax Breakdown */}
                  {taxBreakdown && taxBreakdown.taxes && taxBreakdown.taxes.length > 0 && (
                    <>
                      {taxBreakdown.taxes.map((tax, index) => (
                        <div key={index} className="charge-row" style={{ fontSize: '0.9em', color: '#6b7280' }}>
                          <dt className="charge-label" style={{ fontStyle: 'italic' }}>
                            {tax.name} ({tax.type === 'PERCENTAGE' ? `${tax.rate}%` : `${tax.rate.toLocaleString()} FCFA`})
                          </dt>
                          <dd className="charge-value">{fmtMoney(tax.amount)}</dd>
                        </div>
                      ))}
                      <div className="charge-row" style={{ fontWeight: '600', paddingTop: '8px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                        <dt className="charge-label">Total Taxes</dt>
                        <dd className="charge-value-bold">{fmtMoney(taxBreakdown.totalTaxes)}</dd>
                      </div>
                      <div className="charges-divider"></div>
                    </>
                  )}
                  
                  <div className="charge-row total-row">
                    <dt className="charge-label-total">Total</dt>
                    <dd className="charge-value-total">{fmtMoney(grandTotal)}</dd>
                  </div>
                  
                  {/* Deposit section hidden - always 0 */}
                  {depositPaid > 0 && (
                    <>
                      <div className="charges-divider"></div>
                      
                      <div className="charge-row">
                        <dt className="charge-label">Acompte / Prépayé</dt>
                        <dd className="charge-value">{fmtMoney(depositPaid)}</dd>
                      </div>
                      
                      <div className="charge-row balance-row">
                        <dt className="balance-label">Solde dû</dt>
                        <dd className="balance-value">{fmtMoney(balanceDue)}</dd>
                      </div>
                    </>
                  )}
                </dl>
                
                {/* Payment Fields - Only show if balance > 0 */}
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
                    marginTop: '12px',
                    textAlign: 'center',
                    color: '#166534',
                    fontWeight: '500'
                  }}>
                    ✓ Entièrement Payé - Aucun solde dû
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="section">
          <div className="check-in-time-section">
            <h3>Heure de Départ</h3>
            <p className="section-description">Enregistrez l'heure de départ réelle de ce client</p>
            
            <TimeInput
              hours={hours}
              minutes={minutes}
              onHoursChange={setHours}
              onMinutesChange={setMinutes}
              label="Heure de Check-Out (format 24h)"
              hint="Heure de check-out standard: 11:00"
            />
          </div>

          {err && <p className="error-message">{err}</p>}
          {apiError && (
            <div className="error-banner" role="alert" style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
              color: '#c33'
            }}>
              <strong>Error:</strong> {apiError}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-checkout" disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="small" color="#fff" />
                  <span style={{ marginLeft: '8px' }}>Processing...</span>
                </>
              ) : "Check-out"}
            </button>
          </div>
          <p className="checkout-note">
            En complétant le check-out, vous confirmez que la chambre a été inspectée, les clés rendues et les suppléments vérifiés.
          </p>
        </form>
          </div>
        </div>
      </div>
      
      {/* Payment Confirmation Modal */}
      <PaymentConfirmModal
        show={showPaymentConfirm}
        onClose={() => setShowPaymentConfirm(false)}
        onConfirm={() => {
          setShowPaymentConfirm(false);
          proceedWithCheckOut();
        }}
        type={confirmationType}
        amount={fmtMoney(balanceDue)}
        paymentAmount={paymentAmount}
        paymentMethod={paymentMethod}
        remainingBalance={balanceDue - paymentAmount}
        context="checkout"
      />
    </div>
  );
  
  // Use createPortal to render the modal outside the normal DOM hierarchy
  return createPortal(modalContent, portalTarget);
}
