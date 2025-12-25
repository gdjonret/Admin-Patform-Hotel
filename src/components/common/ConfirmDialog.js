// src/components/common/ConfirmDialog.js
import React from 'react';
import { createPortal } from 'react-dom';
import '../../styles/shared/confirm-dialog.css';

/**
 * Modern confirmation dialog to replace window.confirm()
 * 
 * Usage:
 * <ConfirmDialog
 *   open={showConfirm}
 *   title="Delete Reservation"
 *   message="Are you sure you want to delete this reservation? This action cannot be undone."
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   variant="danger"
 *   onConfirm={() => handleDelete()}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary', 'danger', 'warning'
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!open) return null;

  const portalTarget = document.getElementById('modal-root') || document.body;

  const variantClasses = {
    primary: 'confirm-btn-primary',
    danger: 'confirm-btn-danger',
    warning: 'confirm-btn-warning'
  };

  const modalContent = (
    <div className="confirm-overlay" onClick={onCancel}>
      <div 
        className="confirm-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className="confirm-header">
          <h3 id="confirm-title">{title}</h3>
        </div>
        
        <div className="confirm-body">
          <p id="confirm-message">{message}</p>
        </div>
        
        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-btn confirm-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-btn ${variantClasses[variant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalTarget);
}
