import React from "react";
import '../../features/reservations/components/modals/check-in-modal.css';

/**
 * Reusable Payment Method and Status Fields
 * @param {string} paymentType - "full", "partial", or "none"
 * @param {function} onPaymentTypeChange - Handler for payment type change
 * @param {number} paymentAmount - Payment amount
 * @param {function} onPaymentAmountChange - Handler for payment amount change
 * @param {number} totalAmount - Total amount due
 * @param {string} paymentMethod - Selected payment method
 * @param {function} onPaymentMethodChange - Handler for payment method change
 * @param {string} paymentStatus - "Paid", "Partial", or "Unpaid"
 * @param {function} onPaymentStatusChange - Handler for payment status change
 */
export default function PaymentFields({ 
  paymentType = "none",
  onPaymentTypeChange,
  paymentAmount = 0,
  onPaymentAmountChange,
  totalAmount = 0,
  paymentMethod, 
  onPaymentMethodChange, 
  paymentStatus, 
  onPaymentStatusChange 
}) {
  return (
    <>
      {/* Payment Type Selection */}
      <div className="payment-type-section" style={{ marginBottom: '16px' }}>
        <label className="payment-label" style={{ marginBottom: '12px', display: 'block', fontWeight: '600' }}>Options de Paiement</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px', 
            border: `2px solid ${paymentType === 'full' ? '#10b981' : '#e5e7eb'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: paymentType === 'full' ? '#f0fdf4' : 'transparent',
            transition: 'all 0.2s',
            gap: '12px'
          }}>
            <input
              type="radio"
              name="paymentType"
              value="full"
              checked={paymentType === 'full'}
              onChange={(e) => onPaymentTypeChange(e.target.value)}
              style={{ margin: 0, flexShrink: 0, width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '500', flex: 1 }}>Paiement Complet ({totalAmount.toLocaleString()} FCFA)</span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px', 
            border: `2px solid ${paymentType === 'partial' ? '#f59e0b' : '#e5e7eb'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: paymentType === 'partial' ? '#fffbeb' : 'transparent',
            transition: 'all 0.2s',
            gap: '12px'
          }}>
            <input
              type="radio"
              name="paymentType"
              value="partial"
              checked={paymentType === 'partial'}
              onChange={(e) => onPaymentTypeChange(e.target.value)}
              style={{ margin: 0, flexShrink: 0, width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '500', flex: 1 }}>Paiement Partiel</span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px', 
            border: `2px solid ${paymentType === 'none' ? '#6b7280' : '#e5e7eb'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: paymentType === 'none' ? '#f9fafb' : 'transparent',
            transition: 'all 0.2s',
            gap: '12px'
          }}>
            <input
              type="radio"
              name="paymentType"
              value="none"
              checked={paymentType === 'none'}
              onChange={(e) => onPaymentTypeChange(e.target.value)}
              style={{ margin: 0, flexShrink: 0, width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '500', flex: 1 }}>Payer Plus Tard</span>
          </label>
        </div>
      </div>

      {/* Payment Amount - Show only for full or partial */}
      {(paymentType === 'full' || paymentType === 'partial') && (
        <>
          <div className="payment-amount-section" style={{ marginBottom: '16px' }}>
            <label className="payment-label">Montant (FCFA)</label>
            <input
              type="number"
              className="payment-input"
              value={paymentAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  onPaymentAmountChange('');
                } else {
                  const numValue = Number(value);
                  // Limit to maximum balance due
                  if (numValue <= totalAmount) {
                    onPaymentAmountChange(numValue);
                  }
                }
              }}
              min="0"
              max={totalAmount}
              readOnly={paymentType === 'full'}
              placeholder={paymentType === 'partial' ? 'Entrer le montant' : ''}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '700',
                backgroundColor: paymentType === 'full' ? '#f3f4f6' : 'white',
                color: '#1f2937',
                appearance: 'textfield',
                MozAppearance: 'textfield',
                WebkitAppearance: 'none'
              }}
            />
          </div>

          {/* Payment Method */}
          <div className="payment-method-section">
            <label className="payment-label" style={{ 
              marginBottom: '8px', 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '15px',
              color: '#374151'
            }}>
              <span style={{ fontSize: '20px' }}>💳</span>
              Méthode de Paiement
            </label>
            <select 
              className="payment-select" 
              value={paymentMethod} 
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option>Cash</option>
              <option>Credit Card</option>
              <option>Debit Card</option>
              <option>Mobile Money</option>
              <option>Bank Transfer</option>
            </select>
          </div>
          
          {/* Status Indicator */}
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            backgroundColor: paymentType === 'full' ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${paymentType === 'full' ? '#86efac' : '#fcd34d'}`,
            borderRadius: '8px',
            fontSize: '13px',
            color: paymentType === 'full' ? '#166534' : '#92400e',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {paymentType === 'full' ? '✓' : '⚠️'}
            {paymentType === 'full' 
              ? 'Full payment - No balance remaining' 
              : `Partial payment - ${(totalAmount - (paymentAmount || 0)).toLocaleString()} FCFA remaining`
            }
          </div>
        </>
      )}
    </>
  );
}
