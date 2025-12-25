import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button, IconButton } from "@mui/material";
import { MdClose, MdEdit, MdAttachMoney, MdPayment, MdDescription } from "react-icons/md";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import "../../../../styles/shared/modern-form.css";

export default function EditPaymentModal({ open, payment, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: payment?.amount || "",
    paymentMethod: payment?.paymentMethod || "Cash",
    notes: payment?.notes || ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!open || !payment) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const e = {};
    
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      e.amount = "Veuillez entrer un montant valide";
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
      await onSave?.(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const portalTarget = document.getElementById("modal-root") || document.body;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '500px', width: '90%' }}
      >
        <div className="modal-header" style={{ background: '#059669', color: 'white', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MdEdit size={24} />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Modifier Paiement</h3>
          </div>
          <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: "white" }}>
            <MdClose />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '24px' }}>
            {/* Payment Date Info */}
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              📅 Paiement du: <strong>{formatDate(payment.createdAt || payment.paymentDate)}</strong>
            </div>

            {/* Amount and Payment Method in 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-field">
                <label className="form-label required" style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}>
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
                    borderRadius: '6px'
                  }}
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Montant"
                  step="1"
                  min="0"
                  autoFocus
                />
                {errors.amount && <p className="form-error" style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.amount}</p>}
              </div>

              <div className="form-field">
                <label className="form-label required" style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}>
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
                {errors.paymentMethod && <p className="form-error" style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.paymentMethod}</p>}
              </div>
            </div>

            {/* Notes */}
            <div className="form-field">
              <label className="form-label" style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}>
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

            {/* Warning */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span>Modifier ce paiement recalculera le solde restant</span>
            </div>
          </div>

          <div className="modal-footer" style={{ 
            borderTop: '1px solid #e5e7eb', 
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <Button 
              type="button"
              variant="outlined" 
              color="inherit" 
              onClick={onClose}
              disabled={submitting}
              sx={{ textTransform: 'none', fontSize: '15px' }}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              variant="contained" 
              color="success"
              disabled={submitting}
              sx={{ textTransform: 'none', fontSize: '15px', fontWeight: '600' }}
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="small" color="#fff" />
                  <span style={{ marginLeft: '8px' }}>Enregistrement...</span>
                </>
              ) : '💾 Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget
  );
}
