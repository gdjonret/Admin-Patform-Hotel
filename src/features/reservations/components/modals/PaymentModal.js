// src/components/reservations/modals/PaymentModal.js
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button, Stack, IconButton } from "@mui/material";
import { MdClose, MdPayment, MdAttachMoney, MdDescription } from "react-icons/md";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import { useTaxCalculation } from "../../../../hooks/useTaxCalculation";
import { nightsBetweenYmd } from "../../../../lib/dates";
import { useRooms } from "../../../../context/RoomContext";
import "../../../../styles/shared/modern-form.css";

export default function PaymentModal({ open, reservation, onClose, onSubmit }) {
  const { calculateTaxes } = useTaxCalculation();
  const { getRoomPrice } = useRooms();
  // For now, no edit mode until backend is ready
  const isEditing = false;
  
  const [form, setForm] = useState({ 
    amount: "", 
    paymentMethod: "Cash", 
    notes: "" 
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!open || !reservation) return null;

  // Calculate total with taxes
  const checkInDate = reservation?.checkInDate || reservation?.checkIn?.slice(0, 10) || '';
  const checkOutDate = reservation?.checkOutDate || reservation?.checkOut?.slice(0, 10) || '';
  const nights = nightsBetweenYmd(checkInDate, checkOutDate) || 0;
  const roomPrice = reservation?.roomPrice || reservation?.pricePerNight || (reservation?.roomType ? getRoomPrice(reservation.roomType) : 0);
  const taxBreakdown = roomPrice && nights ? calculateTaxes(roomPrice, nights, 0) : null;
  const totalPrice = parseFloat(taxBreakdown ? taxBreakdown.grandTotal : (reservation.totalPrice || 0));
  const amountPaid = parseFloat(reservation.amountPaid || 0);
  const outstanding = totalPrice - amountPaid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const e = {};
    
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      e.amount = "Veuillez entrer un montant valide";
    } else if (!isEditing && amount > outstanding) {
      e.amount = `Le paiement ne peut pas dépasser le solde (${outstanding.toFixed(0)} FCFA)`;
    }
    
    if (!form.paymentMethod?.trim()) {
      e.paymentMethod = "Veuillez sélectionner une méthode";
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      await onSubmit?.(form);
      // Reset form on success
      setForm({ amount: "", paymentMethod: "Cash", notes: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const portalTarget = document.getElementById("modal-root") || document.body;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', border: 'none', outline: 'none', overflow: 'hidden' }}>
        <div className="modal-header" style={{ background: '#059669', color: 'white', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MdPayment size={24} />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              Enregistrer Paiement
            </h3>
          </div>
          <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: "white" }}>
            <MdClose />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="modal-body">
            <div className="form-section">
              {/* Reservation Summary Card - Compact */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{reservation.guestName}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Chambre: {reservation.roomNumber || 'Non assignée'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Total: {totalPrice.toLocaleString()} FCFA</div>
                    <div style={{ fontSize: '12px', color: '#10b981' }}>Payé: {amountPaid.toLocaleString()} FCFA</div>
                  </div>
                </div>
                
                <div style={{
                  background: '#f3f4f6',
                  borderLeft: `4px solid ${outstanding > 0 ? '#6b7280' : '#10b981'}`,
                  padding: '8px 12px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>Solde Restant</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: outstanding > 0 ? '#dc2626' : '#10b981' }}>
                    {outstanding.toLocaleString()} FCFA
                  </div>
                </div>
              </div>

              {/* Amount and Payment Method in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-field">
                  <label className="form-label required" style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdAttachMoney size={16} />
                    Montant (FCFA)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    className="form-input"
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      transition: 'border-color 0.2s'
                    }}
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Montant"
                    step="1"
                    min="0"
                    max={outstanding}
                    autoFocus
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  {errors.amount && <p className="form-error" style={{ color: '#dc2626', fontSize: '12px', marginTop: '2px' }}>{errors.amount}</p>}
                </div>

                <div className="form-field">
                  <label className="form-label required" style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdPayment size={16} />
                    Méthode
                  </label>
                  <select
                    name="paymentMethod"
                    className="form-input"
                    style={{
                      fontSize: '14px',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    value={form.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="Cash">💵 Espèces</option>
                    <option value="Mobile Money">📱 Mobile Money</option>
                    <option value="Card">💳 Carte</option>
                    <option value="Bank Transfer">🏦 Virement</option>
                    <option value="Check">📝 Chèque</option>
                    <option value="Other">➕ Autre</option>
                  </select>
                  {errors.paymentMethod && <p className="form-error" style={{ color: '#dc2626', fontSize: '12px', marginTop: '2px' }}>{errors.paymentMethod}</p>}
                </div>
              </div>
              
              {/* Quick Amount Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, amount: outstanding.toString() }))}
                  style={{
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.target.style.background = '#e5e7eb'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#f3f4f6'; }}
                >
                  Solde Complet
                </button>
                {outstanding > 50000 && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, amount: (outstanding / 2).toFixed(0) }))}
                    style={{
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = '#e5e7eb'; }}
                    onMouseLeave={(e) => { e.target.style.background = '#f3f4f6'; }}
                  >
                    Moitié
                  </button>
                )}
              </div>


              <div className="form-field">
                <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MdDescription size={16} />
                  Notes (Optionnel)
                </label>
                <textarea
                  name="notes"
                  className="form-textarea"
                  style={{
                    fontSize: '13px',
                    padding: '8px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Notes..."
                  rows={2}
                />
              </div>

              {/* New Balance Preview */}
              {form.amount && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  background: (outstanding - parseFloat(form.amount || 0)) <= 0 ? '#f0fdf4' : '#fef3c7',
                  border: `2px solid ${(outstanding - parseFloat(form.amount || 0)) <= 0 ? '#86efac' : '#fcd34d'}`,
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Nouveau Solde</div>
                    {(outstanding - parseFloat(form.amount || 0)) <= 0 && (
                      <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>✓ Entièrement Payé</div>
                    )}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: (outstanding - parseFloat(form.amount || 0)) <= 0 ? '#10b981' : '#f59e0b' }}>
                    {(outstanding - parseFloat(form.amount || 0)).toFixed(0).toLocaleString()} FCFA
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                type="button" 
                variant="outlined" 
                color="inherit" 
                onClick={onClose}
                disabled={submitting}
                sx={{ textTransform: 'none', fontSize: '15px', padding: '10px 24px' }}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="success"
                disabled={submitting}
                sx={{ textTransform: 'none', fontSize: '15px', padding: '10px 24px', fontWeight: '600' }}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="small" color="#fff" />
                    <span style={{ marginLeft: '8px' }}>Enregistrement...</span>
                  </>
                ) : '✓ Enregistrer Paiement'}
              </Button>
            </Stack>
          </div>
        </form>
      </div>
    </div>,
    portalTarget
  );
}
