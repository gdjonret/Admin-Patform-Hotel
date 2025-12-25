import React from "react";
import '../../features/reservations/components/modals/check-in-modal.css';

/**
 * Reusable Payment Confirmation Modal
 * @param {boolean} show - Whether to show the modal
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler
 * @param {string} type - "paid", "partial", or "unpaid"
 * @param {string} amount - Formatted amount string (e.g., "FCFA 26,250")
 * @param {string} context - "checkin" or "checkout"
 * @param {number} paymentAmount - Amount being paid now
 * @param {string} paymentMethod - Payment method
 * @param {number} remainingBalance - Remaining balance after payment
 */
export default function PaymentConfirmModal({ 
  show, 
  onClose, 
  onConfirm, 
  type, 
  amount,
  context = "checkout",
  paymentAmount = 0,
  paymentMethod = "Cash",
  remainingBalance = 0
}) {
  if (!show) return null;

  const titles = {
    paid: "Confirmer le Paiement Complet",
    partial: "Confirmer le Paiement Partiel",
    unpaid: "Confirmer Sans Paiement"
  };

  const buttonText = {
    paid: "Confirmer & Enregistrer",
    partial: "Confirmer & Enregistrer",
    unpaid: "Continuer Sans Paiement"
  };

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <div className={`confirm-icon ${type}`}>
            {type === "paid" ? "✓" : "⚠"}
          </div>
          <h3 className="confirm-title">{titles[type]}</h3>
        </div>
        
        <div className="confirm-body">
          {type !== 'unpaid' ? (
            <div style={{ 
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Montant Payé:</span>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#10b981' }}>
                  {paymentAmount.toLocaleString()} FCFA
                </span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Méthode:</span>
                <span style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                  {paymentMethod}
                </span>
              </div>
              {remainingBalance > 0 && (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Solde Restant:</span>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#dc2626' }}>
                    {remainingBalance.toLocaleString()} FCFA
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid #fcd34d'
            }}>
              <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                Aucun paiement enregistré. Le client paiera plus tard.
              </p>
              <div style={{ 
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #fcd34d'
              }}>
                <span style={{ color: '#92400e', fontSize: '13px' }}>Solde Dû:</span>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#d97706', marginLeft: '8px' }}>
                  {amount}
                </span>
              </div>
            </div>
          )}
          <p className="confirm-message" style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
            {type === 'paid' && '✓ Paiement complet confirmé'}
            {type === 'partial' && '⚠️ Paiement partiel - Le client devra payer le solde restant'}
            {type === 'unpaid' && '⚠️ Aucun paiement - Le client paiera plus tard'}
          </p>
        </div>
        
        <div className="confirm-actions">
          <button className="btn-confirm-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`btn-confirm-proceed ${type}`}
            onClick={onConfirm}
          >
            {buttonText[type]}
          </button>
        </div>
      </div>
    </div>
  );
}
