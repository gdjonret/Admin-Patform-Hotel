import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button, IconButton } from "@mui/material";
import { MdClose, MdWarning, MdDelete } from "react-icons/md";
import { formatFCFA } from "../../../../lib/formatters";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";

export default function DeleteConfirmDialog({ 
  open, 
  payment, 
  currentOutstanding,
  onClose, 
  onConfirm 
}) {
  const [deleting, setDeleting] = useState(false);

  if (!open || !payment) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm?.();
      onClose();
    } finally {
      setDeleting(false);
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

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'Cash': return '💵';
      case 'Mobile Money': return '📱';
      case 'Card': return '💳';
      case 'Bank Transfer': return '🏦';
      case 'Check': return '📝';
      default: return '💰';
    }
  };

  const newOutstanding = currentOutstanding + parseFloat(payment.amount || 0);

  const portalTarget = document.getElementById("modal-root") || document.body;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '450px', width: '90%' }}
      >
        <div className="modal-header" style={{ background: '#dc2626', color: 'white', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MdWarning size={24} />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Confirmer la Suppression</h3>
          </div>
          <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: "white" }}>
            <MdClose />
          </IconButton>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          <p style={{ fontSize: '15px', color: '#374151', marginBottom: '20px' }}>
            Êtes-vous sûr de vouloir supprimer ce paiement?
          </p>

          {/* Payment Details Card */}
          <div style={{
            background: '#f9fafb',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{getPaymentIcon(payment.paymentMethod)}</span>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {formatFCFA(payment.amount)}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {payment.paymentMethod}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
              📅 {formatDate(payment.createdAt || payment.paymentDate)}
            </div>
            {payment.notes && (
              <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                📝 {payment.notes}
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>Cette action ne peut pas être annulée</span>
          </div>

          {/* Impact on Balance */}
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '6px',
            padding: '12px'
          }}>
            <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '8px' }}>
              Le solde restant sera recalculé:
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#92400e'
            }}>
              <span>{formatFCFA(currentOutstanding)}</span>
              <span>→</span>
              <span style={{ color: '#dc2626' }}>{formatFCFA(newOutstanding)}</span>
            </div>
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
            variant="outlined" 
            color="inherit" 
            onClick={onClose}
            disabled={deleting}
            sx={{ textTransform: 'none', fontSize: '15px' }}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirm}
            disabled={deleting}
            startIcon={deleting ? null : <MdDelete />}
            sx={{ textTransform: 'none', fontSize: '15px', fontWeight: '600' }}
          >
            {deleting ? (
              <>
                <LoadingSpinner size="small" color="#fff" />
                <span style={{ marginLeft: '8px' }}>Suppression...</span>
              </>
            ) : 'Supprimer'}
          </Button>
        </div>
      </div>
    </div>,
    portalTarget
  );
}
