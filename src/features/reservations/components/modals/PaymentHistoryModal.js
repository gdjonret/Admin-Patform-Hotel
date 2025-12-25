import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdEdit, MdDelete, MdPayment, MdAdd, MdMoreVert, MdAccountBalanceWallet, MdCreditCard, MdPhone, MdAccountBalance } from "react-icons/md";
import { formatFCFA } from "../../../../lib/formatters";
import { getPayments, updatePayment, deletePayment, fetchReservationById, recordPayment } from "../../../../api/reservations";
import SuccessToast from "../../../../components/common/SuccessToast";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import { useTaxCalculation } from "../../../../hooks/useTaxCalculation";
import { nightsBetweenYmd } from "../../../../lib/dates";
import { useRooms } from "../../../../context/RoomContext";
import "../../../../styles/shared/modern-form.css";

export default function PaymentHistoryModal({ 
  open, 
  reservation, 
  onClose, 
  onAddPayment,
  onRefresh
}) {
  const { calculateTaxes } = useTaxCalculation();
  const { getRoomPrice } = useRooms();
  const [payments, setPayments] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentReservation, setCurrentReservation] = useState(reservation);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editForm, setEditForm] = useState({ amount: '', paymentMethod: '', notes: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  const fetchData = async () => {
    try {
      // Fetch both payments and updated reservation data
      const [paymentsData, reservationData] = await Promise.all([
        getPayments(reservation.id),
        fetchReservationById(reservation.id)
      ]);
      setPayments(paymentsData || []);
      setCurrentReservation(reservationData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPayments([]);
    }
  };

  useEffect(() => {
    if (open && reservation?.id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservation?.id]);

  if (!open || !reservation) return null;

  // Calculate total with taxes
  const checkInDate = currentReservation?.checkInDate || currentReservation?.checkIn?.slice(0, 10) || '';
  const checkOutDate = currentReservation?.checkOutDate || currentReservation?.checkOut?.slice(0, 10) || '';
  const nights = nightsBetweenYmd(checkInDate, checkOutDate) || 0;
  const roomPrice = currentReservation?.roomPrice || currentReservation?.pricePerNight || (currentReservation?.roomType ? getRoomPrice(currentReservation.roomType) : 0);
  const taxBreakdown = roomPrice && nights ? calculateTaxes(roomPrice, nights, 0) : null;
  const totalPrice = taxBreakdown ? taxBreakdown.grandTotal : (currentReservation?.totalPrice || 0);
  
  const totalPaid = currentReservation?.amountPaid || 0;
  const outstanding = totalPrice - totalPaid;

  const portalTarget = document.getElementById("modal-root") || document.body;

  const handleEditClick = (payment) => {
    setEditingPaymentId(payment.id);
    setEditForm({
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod,
      notes: payment.notes || ''
    });
    setActiveMenu(null);
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditForm({ amount: '', paymentMethod: '', notes: '' });
  };

  const handleDeleteClick = (payment) => {
    setConfirmDeleteId(payment.id);
    setActiveMenu(null);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updatePayment(reservation.id, editingPaymentId, {
        amount: parseFloat(editForm.amount),
        paymentMethod: editForm.paymentMethod,
        notes: editForm.notes
      });
      setEditingPaymentId(null);
      setSuccessMessage('Paiement modifié avec succès');
      await fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error updating payment:', error);
      const message = error.response?.data || 'Erreur lors de la modification du paiement';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setActionLoading(true);
    try {
      await deletePayment(reservation.id, confirmDeleteId);
      setConfirmDeleteId(null);
      setSuccessMessage('Paiement supprimé avec succès');
      await fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting payment:', error);
      const message = error.response?.data || 'Erreur lors de la suppression du paiement';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
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
    const iconMap = {
      'Cash': <MdAccountBalanceWallet size={18} />,
      'Mobile Money': <MdPhone size={18} />,
      'Bank Transfer': <MdAccountBalance size={18} />,
      'Credit Card': <MdCreditCard size={18} />,
      'Debit Card': <MdCreditCard size={18} />
    };
    return iconMap[method] || <MdPayment size={18} />;
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return formatDate(dateString);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(paymentForm.amount);
    
    // Validate payment amount
    if (paymentAmount > outstanding) {
      setErrorMessage(`Le montant ne peut pas dépasser le solde restant de ${formatFCFA(outstanding)}`);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    
    if (paymentAmount <= 0) {
      setErrorMessage('Le montant doit être supérieur à zéro');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    
    setActionLoading(true);
    try {
      await recordPayment(reservation.id, {
        amount: paymentAmount,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      });
      setShowPaymentForm(false);
      setPaymentForm({ amount: '', paymentMethod: 'Cash', notes: '' });
      setSuccessMessage('Paiement enregistré avec succès');
      await fetchData();
      onRefresh?.();
    } catch (error) {
      console.error('Error recording payment:', error);
      const message = error.response?.data || 'Erreur lors de l\'enregistrement du paiement';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const togglePaymentForm = () => {
    setShowPaymentForm(!showPaymentForm);
    if (!showPaymentForm) {
      const balance = outstanding > 0 ? outstanding : 0;
      setPaymentForm({
        amount: balance.toString(),
        paymentMethod: 'Cash',
        notes: ''
      });
    }
  };

  return createPortal(
    <>
      <style>
        {`
          .payment-history-modal::-webkit-scrollbar {
            display: none !important;
          }
          
          .payment-history-modal {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          
          .modal-overlay::-webkit-scrollbar {
            display: none !important;
          }
          
          .modal-overlay {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          
          body::-webkit-scrollbar {
            display: none !important;
          }
        `}
      </style>
      <div className="modal-overlay" onClick={onClose} style={{ overflow: 'hidden' }}>
        <div 
          className="modal-content payment-history-modal" 
          onClick={(e) => e.stopPropagation()} 
          style={{ maxWidth: '650px', width: '90%', maxHeight: '85vh', overflow: 'auto' }}
        >
          <div style={{ 
            background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', 
            color: 'white', 
            padding: '28px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MdPayment size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '600', letterSpacing: '-0.3px', color: 'white' }}>Historique des Paiements</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9, color: 'rgba(255, 255, 255, 0.95)' }}>{reservation.guestName} • Réf: {reservation.bookingReference}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: 'white',
                fontSize: '24px',
                fontWeight: '300',
                lineHeight: '1',
                padding: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              ×
            </button>
          </div>

          <div className="modal-body" style={{ padding: '24px', position: 'relative' }}>
            {/* Loading Overlay */}
            {actionLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                borderRadius: '8px'
              }}>
                <LoadingSpinner />
                <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>Traitement en cours...</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px',
                color: '#991b1b',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Summary Card with Progress */}
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>Montant Total</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{formatFCFA(totalPrice)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>Total Payé</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{formatFCFA(totalPaid)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>Solde Restant</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: outstanding > 0 ? '#ef4444' : '#10b981' }}>
                    {formatFCFA(outstanding)}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Progression</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    {totalPrice > 0 ? Math.round((totalPaid / totalPrice) * 100) : 0}%
                  </span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '10px', 
                  background: '#f1f5f9', 
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${totalPrice > 0 ? (totalPaid / totalPrice) * 100 : 0}%`, 
                    height: '100%', 
                    background: totalPrice > 0 && (totalPaid / totalPrice) * 100 === 100 ? '#10b981' : '#3b82f6',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: '10px'
                  }} />
                </div>
              </div>
            </div>

            {/* Add Payment Button / Form Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={togglePaymentForm}
                disabled={outstanding <= 0}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: outstanding <= 0 ? '#e5e7eb' : (showPaymentForm ? 'white' : '#0f172a'),
                  color: outstanding <= 0 ? '#9ca3af' : (showPaymentForm ? '#64748b' : 'white'),
                  border: showPaymentForm ? '2px solid #e2e8f0' : 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: outstanding <= 0 ? 'not-allowed' : 'pointer',
                  opacity: outstanding <= 0 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  boxShadow: showPaymentForm ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!showPaymentForm && outstanding > 0) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (outstanding > 0) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = showPaymentForm ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.3)';
                  }
                }}
              >
                {outstanding <= 0 ? (
                  <>
                    Entièrement Payé
                  </>
                ) : showPaymentForm ? (
                  <>
                    <MdClose size={20} />
                    Annuler
                  </>
                ) : (
                  <>
                    <MdAdd size={20} />
                    Nouveau Paiement
                  </>
                )}
              </button>
            </div>

            {/* Inline Payment Form */}
            {showPaymentForm && (
              <form onSubmit={handleAddPayment} style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: '#1e40af',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Montant (FCFA) *
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value > outstanding) {
                          setPaymentForm({ ...paymentForm, amount: outstanding.toString() });
                        } else {
                          setPaymentForm({ ...paymentForm, amount: e.target.value });
                        }
                      }}
                      placeholder="Entrer le montant"
                      required
                      min="0"
                      max={outstanding}
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #bfdbfe',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '600',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: '#1e40af',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Méthode de Paiement *
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #bfdbfe',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#1e40af',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Notes (Optionnel)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Ajouter des notes..."
                    rows="2"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #bfdbfe',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {actionLoading ? 'Enregistrement...' : 'Enregistrer le Paiement'}
                </button>
              </form>
            )}

            {/* Payments List */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>
                Paiements ({payments.length})
              </h4>

              {payments.length === 0 ? (
                <div style={{
                  padding: '40px 32px',
                  textAlign: 'center',
                  color: '#6b7280',
                  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <MdPayment size={56} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: '#374151' }}>Aucun paiement enregistré</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Cliquez sur "Nouveau Paiement" pour commencer</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {payments.map((payment, index) => {
                    const isEditing = editingPaymentId === payment.id;
                    const isConfirmingDelete = confirmDeleteId === payment.id;
                    
                    return (
                    <div
                      key={payment.id || index}
                      style={{
                        background: isEditing ? '#f0f9ff' : 'white',
                        border: isEditing ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                        transition: 'all 0.2s',
                        cursor: 'default',
                        position: 'relative',
                        opacity: (editingPaymentId && !isEditing) || (confirmDeleteId && !isConfirmingDelete) ? 0.4 : 1,
                        boxShadow: isEditing ? '0 4px 16px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isEditing && !editingPaymentId && !confirmDeleteId) {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isEditing) {
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {/* Top Right: Payment Number & Actions */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div style={{
                          background: '#0f172a',
                          color: 'white',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.3px'
                        }}>
                          #{payments.length - index}
                        </div>
                        
                        {!isEditing && !isConfirmingDelete && (
                          <button
                            onClick={() => setActiveMenu(activeMenu === payment.id ? null : payment.id)}
                            style={{
                              padding: '4px',
                              background: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              color: '#64748b'
                            }}
                            onMouseEnter={(e) => { 
                              e.target.style.background = '#f8fafc';
                              e.target.style.borderColor = '#94a3b8';
                            }}
                            onMouseLeave={(e) => { 
                              e.target.style.background = 'white';
                              e.target.style.borderColor = '#d1d5db';
                            }}
                          >
                            <MdMoreVert size={16} />
                          </button>
                        )}
                        
                        {/* Dropdown Menu */}
                        {activeMenu === payment.id && (
                          <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '32px',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            zIndex: 10,
                            minWidth: '140px',
                            overflow: 'hidden'
                          }}>
                            <button
                              onClick={() => handleEditClick(payment)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'white',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#334155',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              <MdEdit size={16} />
                              Modifier
                            </button>
                            <div style={{ height: '1px', background: '#e5e7eb' }} />
                            <button
                              onClick={() => handleDeleteClick(payment)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'white',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#dc2626',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              <MdDelete size={16} />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        /* Inline Edit Form */
                        <form onSubmit={handleSaveEdit} style={{ paddingTop: '8px' }}>
                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#1e40af',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Montant (FCFA) *
                            </label>
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              required
                              min="0"
                              step="0.01"
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #bfdbfe',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: '600',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#1e40af',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Méthode de Paiement *
                            </label>
                            <select
                              value={editForm.paymentMethod}
                              onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                              required
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #bfdbfe',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: '500',
                                boxSizing: 'border-box',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="Cash">Cash</option>
                              <option value="Mobile Money">Mobile Money</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="Debit Card">Debit Card</option>
                            </select>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#1e40af',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Notes (Optionnel)
                            </label>
                            <textarea
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              rows="2"
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '2px solid #bfdbfe',
                                borderRadius: '8px',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={actionLoading}
                              style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '8px',
                                background: 'transparent',
                                color: '#64748b',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                opacity: actionLoading ? 0.5 : 1,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (!actionLoading) {
                                  e.currentTarget.style.background = '#f1f5f9';
                                  e.currentTarget.style.color = '#475569';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#64748b';
                              }}
                            >
                              Annuler
                            </button>
                            <button
                              type="submit"
                              disabled={actionLoading}
                              style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                opacity: actionLoading ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                              }}
                            >
                              {actionLoading ? 'Enregistrement...' : (
                                <>
                                  <MdEdit size={16} />
                                  Enregistrer
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                        {/* Payment Method Icon */}
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {getPaymentIcon(payment.paymentMethod)}
                        </div>

                        {/* Payment Details */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                              {formatFCFA(payment.amount)}
                            </span>
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#10b981',
                              padding: '4px 10px',
                              background: '#f0fdf4',
                              borderRadius: '6px',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              border: '1px solid #d1fae5'
                            }}>
                              {getPaymentIcon(payment.paymentMethod)}
                              {payment.paymentMethod}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>
                            {getRelativeTime(payment.createdAt || payment.paymentDate)}
                          </div>
                          
                          {payment.notes && (
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#475569', 
                              background: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              marginTop: '8px',
                              border: '1px solid #e2e8f0'
                            }}>
                              {payment.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete Confirmation (if active) */}
                      {isConfirmingDelete && (
                        <div style={{ 
                          paddingTop: '12px', 
                          borderTop: '1px solid #e5e7eb',
                          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                          margin: '-14px -14px 0',
                          padding: '14px',
                          borderRadius: '0 0 10px 10px'
                        }}>
                          <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#991b1b' }}>
                            ⚠️ Confirmer la suppression ?
                          </p>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={handleCancelDelete}
                              disabled={actionLoading}
                              style={{
                                padding: '6px 14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                background: 'white',
                                color: '#64748b',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                opacity: actionLoading ? 0.5 : 1
                              }}
                            >
                              Annuler
                            </button>
                            <button
                              onClick={handleConfirmDelete}
                              disabled={actionLoading}
                              style={{
                                padding: '6px 14px',
                                border: 'none',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                opacity: actionLoading ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {actionLoading ? 'Suppression...' : (
                                <>
                                  <MdDelete size={14} />
                                  Oui, supprimer
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ 
            borderTop: '2px solid #e5e7eb', 
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            background: '#f8fafc',
            gap: '12px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 28px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: 'white',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.color = '#475569';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#64748b';
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <SuccessToast 
          message={successMessage} 
          onClose={() => setSuccessMessage('')}
        />
      )}
    </>,
    portalTarget
  );
}
