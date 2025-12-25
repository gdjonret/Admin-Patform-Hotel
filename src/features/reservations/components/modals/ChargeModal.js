// src/components/reservations/modals/ChargeModal.js
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button, Stack, IconButton } from "@mui/material";
import { MdClose, MdAttachMoney, MdDescription, MdCategory } from "react-icons/md";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import "../../../../styles/shared/modern-form.css";

export default function ChargeModal({ open, reservation, onClose, onSubmit }) {
  const [form, setForm] = useState({ 
    amount: "", 
    description: "", 
    category: "ROOM_SERVICE" 
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!open || !reservation) return null;

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
      e.amount = "Please enter a valid amount greater than 0";
    }
    
    if (!form.description?.trim()) {
      e.description = "Please enter a description";
    }
    
    if (!form.category) {
      e.category = "Please select a category";
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
      setForm({ amount: "", description: "", category: "ROOM_SERVICE" });
    } finally {
      setSubmitting(false);
    }
  };

  const portalTarget = document.getElementById("modal-root") || document.body;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content charge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Charge to Reservation</h3>
          <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
            <MdClose />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="charge-form">
          <div className="modal-body">
            <div className="form-section">
              <div className="reservation-info">
                <p><strong>Guest:</strong> {reservation.guestName}</p>
                <p><strong>Room:</strong> {reservation.roomNumber || 'Not assigned'}</p>
                <p><strong>Current Balance:</strong> {reservation.balance || 0} FCFA</p>
              </div>

              <div className="form-field">
                <label className="form-label required">
                  <MdAttachMoney style={{ marginRight: '4px' }} />
                  Amount (FCFA)
                </label>
                <input
                  type="number"
                  name="amount"
                  className="form-input"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  autoFocus
                />
                {errors.amount && <p className="form-error">{errors.amount}</p>}
              </div>

              <div className="form-field">
                <label className="form-label required">
                  <MdCategory style={{ marginRight: '4px' }} />
                  Category
                </label>
                <select
                  name="category"
                  className="form-input"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="ROOM_SERVICE">Room Service</option>
                  <option value="MINIBAR">Minibar</option>
                  <option value="LAUNDRY">Laundry</option>
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="SPA">Spa</option>
                  <option value="PARKING">Parking</option>
                  <option value="PHONE">Phone Calls</option>
                  <option value="DAMAGE">Damage/Loss</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.category && <p className="form-error">{errors.category}</p>}
              </div>

              <div className="form-field">
                <label className="form-label required">
                  <MdDescription style={{ marginRight: '4px' }} />
                  Description
                </label>
                <textarea
                  name="description"
                  className="form-textarea"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter charge description (e.g., 'Breakfast for 2')"
                  rows={3}
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              <div className="charge-summary">
                <p><strong>New Balance:</strong> {(parseFloat(reservation.balance || 0) + parseFloat(form.amount || 0)).toFixed(2)} FCFA</p>
              </div>
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
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="small" color="#fff" />
                    <span style={{ marginLeft: '8px' }}>Adding...</span>
                  </>
                ) : 'Add Charge'}
              </Button>
            </Stack>
          </div>
        </form>
      </div>
    </div>,
    portalTarget
  );
}
