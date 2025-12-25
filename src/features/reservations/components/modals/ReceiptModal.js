import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { fmtNiceYmdFR, nightsBetweenYmd } from "../../../../lib/dates";
import { formatRoomType } from "../../../../lib/formatters";
import { useTaxCalculation } from "../../../../hooks/useTaxCalculation";
import { useRooms } from "../../../../context/RoomContext";
import "./receipt-modal.css";

export default function ReceiptModal({ open, reservation, onClose }) {
  const { calculateTaxes } = useTaxCalculation();
  const { getRoomPrice } = useRooms();
  const dialogRef = useRef(null);
  const portalTarget = document.getElementById("modal-root") || document.body;

  if (!open || !reservation) return null;

  const {
    reference,
    bookingReference,
    guestName,
    guestEmail,
    guestPhone,
    roomType,
    roomNumber,
    checkInDate,
    checkOutDate,
    pricePerNight,
    totalPrice,
    finalTotalPrice,
    priceBeforeTax,
    taxAmount,
    taxBreakdown,
    amountPaid,
    paymentMethod,
    paymentStatus,
    currency = "FCFA",
    chargesJson,
    actualCheckInDate,
    actualCheckOutDate,
    actualNights,
    status,
  } = reservation;

  const displayReference = reference || bookingReference;
  
  // FIXED: Use actual stay data for checked-out guests, booking data for others
  const isGuestCheckedOut = status === 'CHECKED_OUT' || status === 'CHECKED_IN';
  const effectiveCheckInDate = actualCheckInDate || checkInDate;
  const effectiveCheckOutDate = actualCheckOutDate || checkOutDate;
  const effectiveNights = actualNights || nightsBetweenYmd(effectiveCheckInDate, effectiveCheckOutDate) || 0;
  
  const actualRoomPrice = pricePerNight || (roomType ? getRoomPrice(roomType) : 0);
  const roomCharge = actualRoomPrice * effectiveNights;
  
  // Parse charges from JSON
  let charges = [];
  try {
    if (chargesJson) {
      charges = JSON.parse(chargesJson);
      console.log('📋 Parsed charges:', charges);
      console.log('📋 chargesJson raw:', chargesJson);
    }
  } catch (e) {
    console.error('Error parsing charges JSON:', e);
    console.error('chargesJson value:', chargesJson);
  }
  
  // Calculate total charges amount
  const chargesTotal = charges.reduce((sum, charge) => sum + (charge.amount || charge.price || 0), 0);
  
  console.log('💰 Charges total:', chargesTotal);
  console.log('💰 Effective nights:', effectiveNights);
  console.log('💰 Room charge:', roomCharge);
  
  // FIXED: Use stored tax data for checked-out guests, calculate for others
  let displayTaxBreakdown = null;
  let calculatedTotal;
  
  if (isGuestCheckedOut && taxBreakdown) {
    // Use stored tax breakdown for checked-out guests
    try {
      displayTaxBreakdown = JSON.parse(taxBreakdown);
      console.log('📋 Using stored tax breakdown:', displayTaxBreakdown);
    } catch (e) {
      console.error('Error parsing stored tax breakdown:', e);
      displayTaxBreakdown = null;
    }
  }
  
  if (!displayTaxBreakdown) {
    // Calculate taxes including charges (FIXED: was hardcoded to 0)
    displayTaxBreakdown = actualRoomPrice && effectiveNights 
      ? calculateTaxes(actualRoomPrice, effectiveNights, chargesTotal)
      : null;
    console.log('📋 Calculated fresh tax breakdown:', displayTaxBreakdown);
  }
  
  // FIXED: Use final total price for checked-out guests, calculated total for others
  if (isGuestCheckedOut && finalTotalPrice) {
    calculatedTotal = finalTotalPrice;
    console.log('💰 Using final total price:', calculatedTotal);
  } else if (displayTaxBreakdown) {
    calculatedTotal = displayTaxBreakdown.grandTotal;
    console.log('💰 Using calculated grand total:', calculatedTotal);
  } else {
    calculatedTotal = totalPrice || roomCharge;
    console.log('💰 Using fallback total:', calculatedTotal);
  }
  
  const balance = calculatedTotal - (amountPaid || 0);

  const formatMoney = (amount) => {
    return `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const body = (
    <div className="receipt-overlay" onClick={onClose}>
      <div
        className="receipt-modal"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
      >
        {/* Receipt Header */}
        <div className="receipt-header">
          <div className="hotel-info">
            <h1 className="hotel-name">Hôtel Le Process</h1>
            <p className="hotel-address">N'Djamena, Tchad</p>
            <p className="hotel-contact">Tél: +235 XX XX XX XX | Email: contact@leprocess.td</p>
          </div>
          <div className="receipt-title">
            <h2>REÇU</h2>
            <p className="receipt-number">N° {displayReference}</p>
            <p className="receipt-date">{today}</p>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Guest Information */}
        <div className="receipt-section">
          <h3 className="section-title">Informations Client</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Nom:</span>
              <span className="info-value">{guestName}</span>
            </div>
            {guestEmail && (
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{guestEmail}</span>
              </div>
            )}
            {guestPhone && (
              <div className="info-row">
                <span className="info-label">Téléphone:</span>
                <span className="info-value">{guestPhone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Stay Information */}
        <div className="receipt-section">
          <h3 className="section-title">Détails du Séjour</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Chambre:</span>
              <span className="info-value">{roomNumber ? `#${roomNumber}` : '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Type:</span>
              <span className="info-value">{formatRoomType(roomType)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Arrivée:</span>
              <span className="info-value">{effectiveCheckInDate ? fmtNiceYmdFR(effectiveCheckInDate) : '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Départ:</span>
              <span className="info-value">{effectiveCheckOutDate ? fmtNiceYmdFR(effectiveCheckOutDate) : '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nuits:</span>
              <span className="info-value">{effectiveNights}</span>
            </div>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Charges Breakdown */}
        <div className="receipt-section">
          <h3 className="section-title">Détail des Frais</h3>
          <table className="charges-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="charge-description">Hébergement</div>
                  <div className="charge-details">
                    {effectiveNights} {effectiveNights === 1 ? 'nuit' : 'nuits'} × {formatMoney(pricePerNight)}
                  </div>
                </td>
                <td className="text-right">{formatMoney(roomCharge)}</td>
              </tr>
              {/* Show itemized charges if available */}
              {charges.length > 0 && (
                <>
                  <tr>
                    <td colSpan="2" style={{ paddingTop: '16px', paddingBottom: '8px' }}>
                      <div className="charge-description" style={{ fontSize: '15px', fontWeight: '600' }}>
                        Frais Supplémentaires
                      </div>
                    </td>
                  </tr>
                  {charges.map((charge, index) => (
                    <tr key={index}>
                      <td style={{ paddingLeft: '24px' }}>
                        <div className="charge-details" style={{ fontSize: '14px' }}>
                          • {charge.label || charge.name || charge.description || charge.service || 'Service'}
                        </div>
                      </td>
                      <td className="text-right">{formatMoney(charge.amount || charge.price || 0)}</td>
                    </tr>
                  ))}
                </>
              )}
              
              {/* Tax Breakdown */}
              {displayTaxBreakdown && displayTaxBreakdown.taxes && displayTaxBreakdown.taxes.length > 0 && (
                <>
                  <tr>
                    <td colSpan="2" style={{ paddingTop: '16px', paddingBottom: '8px', borderTop: '1px dashed #e5e7eb' }}>
                      <div className="charge-description" style={{ fontSize: '15px', fontWeight: '600' }}>
                        Taxes
                      </div>
                    </td>
                  </tr>
                  {displayTaxBreakdown.taxes.map((tax, index) => (
                    <tr key={index}>
                      <td style={{ paddingLeft: '24px' }}>
                        <div className="charge-details" style={{ fontSize: '14px' }}>
                          • {tax.name} ({tax.type === 'PERCENTAGE' ? `${tax.rate}%` : `${tax.rate.toLocaleString()} FCFA`})
                        </div>
                      </td>
                      <td className="text-right">{formatMoney(tax.amount)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="subtotal-row">
                <td><strong>Total</strong></td>
                <td className="text-right"><strong>{formatMoney(calculatedTotal)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="receipt-divider"></div>

        {/* Payment Summary */}
        <div className="receipt-section">
          <h3 className="section-title">Résumé des Paiements</h3>
          <div className="payment-summary">
            <div className="payment-row">
              <span className="payment-label">Total:</span>
              <span className="payment-value total">{formatMoney(calculatedTotal)}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Montant Payé:</span>
              <span className="payment-value paid">{formatMoney(amountPaid)}</span>
            </div>
            {paymentMethod && (
              <div className="payment-row">
                <span className="payment-label">Méthode:</span>
                <span className="payment-value">{paymentMethod}</span>
              </div>
            )}
            <div className="payment-row balance-row">
              <span className="payment-label">Solde Restant:</span>
              <span className={`payment-value ${balance > 0 ? 'outstanding' : 'paid'}`}>
                {formatMoney(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <p className="footer-note">Merci de votre visite à l'Hôtel Le Process</p>
          <p className="footer-note">Ce reçu a été généré électroniquement</p>
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions no-print">
          <button className="btn-receipt close" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(body, portalTarget);
}
