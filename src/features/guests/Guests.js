import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@mui/material';
import './guests.css';
import '../../styles/shared/modern-table.css';
import '../../features/reservations/components/modern-reservations-header.css';
import '../../styles/shared/status-badge.css';
import '../../styles/shared/modern-modal.css';
import { MdClose, MdEdit, MdVisibility, MdDelete, MdAdd, MdPerson, MdEmail, MdPhone, MdHome, MdStar, MdCalendarToday, MdCheckCircle, MdRefresh } from 'react-icons/md';
import { todayYmdTZ } from '../../lib/dates';
import MenuPortal from '../../components/MenuPortal';
import Pagination from '../../components/common/Pagination';
import ActionMenuButton from '../../components/common/ActionMenuButton';
import { fetchGuests, createGuest, updateGuest, deleteGuest, fetchGuestBookings, fetchBookingPayments } from '../../api/guests';
import { recordPayment } from '../../api/reservations';
import eventBus, { EVENTS } from '../../utils/eventBus';
import { useRole } from '../../hooks/useRole';

const Guests = () => {
  const { isAdmin } = useRole();
  
  // Store button refs for each action menu
  const buttonRefs = useRef({});
  
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadGuests = async () => {
    console.log('[Guests] Loading guests from API...');
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGuests();
      console.log('[Guests] Received', data.length, 'guests from API');
      //transform backend data to match frontend format
      const transformedGuests = data.map(guest => ({
        id: guest.id,
        name: `${guest.firstName} ${guest.lastName}`,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        city: guest.city,
        zipCode: guest.zipCode,
        country: guest.country,
        visits: guest.visits || 1,
        lastStay: guest.lastStayDate || guest.createdAt?.split('T')[0] || '',
        status: guest.visits > 3 ? 'VIP' : guest.visits > 1 ? 'Regular' : 'New',
        balance: guest.balance || 0
      }));
      setGuests(transformedGuests);
    } catch (error) {
      console.error('Error loading guests:', error);
      alert('Échec du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  //fetch guests from backend when component loads
  useEffect(() => {
    loadGuests();
    
    // Listen for guest update events from other pages
    const unsubscribe = eventBus.on(EVENTS.GUEST_UPDATED, () => {
      console.log('Guest updated event received, refreshing guests...');
      loadGuests();
    });
    
    // Refresh when page becomes visible (user navigates back to this page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing guests...');
        loadGuests();
      }
    };
    
    // Refresh when window gains focus (user navigates back from another page)
    const handleFocus = () => {
      console.log('Window focused, refreshing guests...');
      loadGuests();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Cleanup listeners on unmount
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentGuest, setCurrentGuest] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Expanded row state for payment details
  const [expandedGuestId, setExpandedGuestId] = useState(null);
  const [guestBookings, setGuestBookings] = useState({});
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [bookingPayments, setBookingPayments] = useState({});
  
  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    notes: ''
  });
  
  // Form state for adding/editing guest
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    zipCode: '',
    country: ''
  });
  
  // Validation helpers
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  };
  
  const validatePhone = (phone) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Valid international phone: 10-15 digits
    return digits.length >= 10 && digits.length <= 15;
  };

  const filteredGuests = guests
    .filter(guest => filterStatus === 'All' ? true : guest.status === filterStatus)
    .filter(guest => 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone.includes(searchTerm)
    );

  // Pagination calculations
  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGuests = filteredGuests.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);
    
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Open add guest modal
  const handleAddClick = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    });
    setIsAddModalOpen(true);
  };
  
  // Open edit guest modal
  const handleEditClick = (guest) => {
    setCurrentGuest(guest);
    setFormData({
      firstName: guest.firstName || guest.name?.split(' ')[0] || '',
      lastName: guest.lastName || guest.name?.split(' ').slice(1).join(' ') || '',
      email: guest.email,
      phone: guest.phone,
      address: guest.address
    });
    setIsEditModalOpen(true);
  };
  
  // Open view guest modal
  const handleViewClick = (guest) => {
    setCurrentGuest(guest);
    setIsViewModalOpen(true);
  };
  
  // Toggle expanded row to show payment history
  const toggleExpandRow = async (guest) => {
    if (expandedGuestId === guest.id) {
      // Collapse if already expanded
      setExpandedGuestId(null);
      setExpandedBookingId(null);
    } else {
      // Expand and fetch bookings if not already loaded
      setExpandedGuestId(guest.id);
      if (!guestBookings[guest.id]) {
        try {
          const bookings = await fetchGuestBookings(guest.email);
          setGuestBookings(prev => ({
            ...prev,
            [guest.id]: bookings
          }));
        } catch (error) {
          console.error('Error fetching guest bookings:', error);
        }
      }
    }
  };
  
  // Toggle payment history for a specific booking
  const toggleBookingPayments = async (bookingId) => {
    if (expandedBookingId === bookingId) {
      // Collapse if already expanded
      setExpandedBookingId(null);
    } else {
      // Expand and fetch payments if not already loaded
      setExpandedBookingId(bookingId);
      if (!bookingPayments[bookingId]) {
        try {
          const payments = await fetchBookingPayments(bookingId);
          setBookingPayments(prev => ({
            ...prev,
            [bookingId]: payments
          }));
        } catch (error) {
          console.error('Error fetching booking payments:', error);
        }
      }
    }
  };
  
  // Open payment modal
  const openPaymentModal = (booking) => {
    setSelectedBookingForPayment(booking);
    const balance = (booking.totalPrice || 0) - (booking.amountPaid || 0);
    setPaymentForm({
      amount: balance > 0 ? balance.toString() : '',
      paymentMethod: 'Cash',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };
  
  // Handle payment submission
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedBookingForPayment) return;
    
    // FIXED: Validate payment amount
    const balance = (selectedBookingForPayment.totalPrice || 0) - 
                    (selectedBookingForPayment.amountPaid || 0);
    const amount = parseFloat(paymentForm.amount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez entrer un montant valide supérieur à 0');
      return;
    }
    
    if (amount > balance) {
      alert(`Le montant ne peut pas dépasser le solde (${balance.toLocaleString('fr-FR')} FCFA)`);
      return;
    }
    
    // FIXED: Add confirmation dialog
    if (!window.confirm(`Confirmer le paiement de ${amount.toLocaleString('fr-FR')} FCFA ?`)) {
      return;
    }
    
    try {
      await recordPayment(selectedBookingForPayment.id, {
        amount: amount,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      });
      
      // Refresh payments for this booking
      const updatedPayments = await fetchBookingPayments(selectedBookingForPayment.id);
      setBookingPayments(prev => ({
        ...prev,
        [selectedBookingForPayment.id]: updatedPayments
      }));
      
      // Refresh bookings to update balance
      const bookings = await fetchGuestBookings(expandedGuestId);
      setGuestBookings(prev => ({
        ...prev,
        [expandedGuestId]: bookings
      }));
      
      // Refresh guests to update overall balance
      await loadGuests();
      
      // Close modal and reset form
      setIsPaymentModalOpen(false);
      setSelectedBookingForPayment(null);
      setPaymentForm({
        amount: '',
        paymentMethod: 'Cash',
        notes: ''
      });
      
      alert('Paiement enregistré avec succès!');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Échec de l\'enregistrement du paiement. Veuillez réessayer.');
    }
  };
  
  // Add new guest
  const handleAddGuest = async (e) => {
    e.preventDefault();
    
    // FIXED: Validate email format
    if (!validateEmail(formData.email)) {
      alert('Veuillez entrer une adresse email valide (ex: nom@exemple.com)');
      return;
    }
    
    // FIXED: Validate phone format
    if (!validatePhone(formData.phone)) {
      alert('Veuillez entrer un numéro de téléphone valide (10-15 chiffres)');
      return;
    }
    
    try {
      // FIXED: Check for duplicate email
      const existingGuests = guests.filter(g => g.email.toLowerCase() === formData.email.toLowerCase());
      if (existingGuests.length > 0) {
        alert('Un client avec cet email existe déjà!');
        return;
      }
      
      // Send to backend
      const guestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };
      
      await createGuest(guestData);
      
      // Reload guests from backend
      await loadGuests();
      
      setIsAddModalOpen(false);
      alert('Client ajouté avec succès!');
    } catch (error) {
      console.error('Error adding guest:', error);
      alert('Échec de l\'ajout du client: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Update existing guest
  const handleUpdateGuest = async (e) => {
    e.preventDefault();
    
    // FIXED: Validate email format
    if (!validateEmail(formData.email)) {
      alert('Veuillez entrer une adresse email valide (ex: nom@exemple.com)');
      return;
    }
    
    // FIXED: Validate phone format
    if (!validatePhone(formData.phone)) {
      alert('Veuillez entrer un numéro de téléphone valide (10-15 chiffres)');
      return;
    }
    
    try {
      const guestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };
      
      await updateGuest(currentGuest.id, guestData);
      await loadGuests();
      
      setIsEditModalOpen(false);
      alert('Client mis à jour avec succès!');
    } catch (error) {
      console.error('Error updating guest:', error);
      alert('Échec de la mise à jour du client');
    }
  };
  
  // Delete guest
  const handleDeleteGuest = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await deleteGuest(id);
        await loadGuests();
        alert('Guest deleted successfully!');
      } catch (error) {
        console.error('Error deleting guest:', error);
        alert('Failed to delete guest');
      }
    }
    setActiveMenu(null);
  };

  // Toggle action menu
  const toggleMenu = (id) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && 
          buttonRefs.current[activeMenu] && 
          !buttonRefs.current[activeMenu].contains(event.target) &&
          !document.querySelector('.action-menu-portal')?.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  return (
    <div className="guests-container">
      {/* Modern Header Section */}
      <div className="modern-page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1 className="page-title">Clients</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              variant="outlined" 
              onClick={loadGuests}
              disabled={loading}
              sx={{ 
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MdRefresh size={20} />
              Actualiser
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddClick}
              sx={{ 
                fontWeight: 600,
                textTransform: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
              }
            }}
          >
            + Ajouter Client
          </Button>
          </div>
        </div>
      </div>

      {/* Modern Filters Section */}
      <div className="modern-controls-section">
        <div className="modern-filter-row">
          <div className="modern-search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="modern-search-input"
              placeholder="Rechercher des clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="modern-filter-group">
            <label className="filter-label">Statut:</label>
            <select className="modern-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">Tous</option>
              <option value="New">Nouveau</option>
              <option value="Regular">Régulier</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="modern-table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Visites</th>
              <th>Dernier Séjour</th>
             {/* <th>Statut</th> */}
             <th>Solde</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div>Chargement des clients...</div>
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>Veuillez patienter pendant que nous récupérons les données.</div>
                </td>
              </tr>
            ) : filteredGuests.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                    {searchTerm ? 'Aucun client trouvé' : 
                     filterStatus === 'New' ? 'Aucun nouveau client' :
                     filterStatus === 'Regular' ? 'Aucun client régulier' :
                     filterStatus === 'VIP' ? 'Aucun client VIP' :
                     'Aucun client trouvé'}
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    {searchTerm ? `Aucun client ne correspond à "${searchTerm}". Essayez un autre terme de recherche.` :
                     filterStatus !== 'All' ? 'Essayez d\'ajuster vos filtres pour voir plus de résultats.' :
                     'Cliquez sur le bouton "Ajouter Client" pour ajouter votre premier client.'}
                  </div>
                </td>
              </tr>
            ) : (
            paginatedGuests.map(guest => (
              <React.Fragment key={guest.id}>
                <tr 
                  data-guest-id={guest.id}
                  onClick={(e) => {
                    // Don't toggle if clicking on action menu or buttons
                    if (e.target.closest('.action-cell') || e.target.closest('button')) {
                      return;
                    }
                    toggleExpandRow(guest);
                  }}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: expandedGuestId === guest.id ? '#eff6ff' : 'transparent',
                    borderLeft: expandedGuestId === guest.id ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <td>{guest.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{expandedGuestId === guest.id ? '▼' : '▶'}</span>
                      {guest.name}
                    </div>
                  </td>
                  <td>{guest.email}</td>
                  <td>{guest.phone}</td>
                  <td>{guest.visits}</td>
                  <td>{guest.lastStay}</td>
                  <td style={{ 
                    fontWeight: '500',
                    color: guest.balance === 0 ? '#10b981' : guest.balance > 0 ? '#ef4444' : '#6b7280'
                  }}>
                    {guest.balance === 0 ? '0 FCFA' : `${guest.balance.toLocaleString('fr-FR')} FCFA`}
                    {guest.balance === 0 && ' ✓'}
                  </td>
                  <td className="action-cell">
                    <div className="action-menu-container">
                      <ActionMenuButton
                        onClick={() => toggleMenu(guest.id)}
                        buttonRef={el => buttonRefs.current[guest.id] = el}
                        isActive={activeMenu === guest.id}
                      />
                      <MenuPortal 
                        isOpen={activeMenu === guest.id}
                        buttonRef={buttonRefs}
                        activeId={guest.id}
                      >
                        <div className="action-menu">
                          <button className="menu-item" onClick={() => handleEditClick(guest)}>
                            <MdEdit /> Modifier
                          </button>
                          <button className="menu-item" onClick={() => handleViewClick(guest)}>
                            <MdVisibility /> Voir
                          </button>
                          {/* Delete button - Admin Only */}
                          {isAdmin && (
                            <button className="menu-item delete" onClick={() => handleDeleteGuest(guest.id)}>
                              <MdDelete /> Supprimer
                            </button>
                          )}
                        </div>
                      </MenuPortal>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded row showing booking details */}
                {expandedGuestId === guest.id && (
                  <tr>
                    <td colSpan="8" style={{ padding: 0, backgroundColor: '#eff6ff' }}>
                      <div style={{ padding: '20px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                          Historique des Paiements et Réservations
                        </h4>
                        {!guestBookings[guest.id] ? (
                          <p style={{ color: '#6b7280' }}>Chargement des réservations...</p>
                        ) : guestBookings[guest.id].length === 0 ? (
                          <p style={{ color: '#6b7280' }}>Aucune réservation trouvée pour ce client.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {guestBookings[guest.id].map(booking => {
                              const totalPrice = booking.totalPrice || 0;
                              const amountPaid = booking.amountPaid || 0;
                              // PENDING and CANCELLED bookings should have 0 balance - they don't owe money
                              const balance = (booking.status === 'PENDING' || booking.status === 'CANCELLED') ? 0 : (totalPrice - amountPaid);
                              const isPaid = balance <= 0;
                              
                              return (
                                <div 
                                  key={booking.id}
                                  style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {/* Booking Header - Clickable */}
                                  <div
                                    onClick={() => toggleBookingPayments(booking.id)}
                                    style={{
                                      padding: '16px',
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                      gap: '12px',
                                      cursor: 'pointer',
                                      backgroundColor: expandedBookingId === booking.id ? '#f9fafb' : 'white'
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                        Référence Réservation
                                      </div>
                                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{expandedBookingId === booking.id ? '▼' : '▶'}</span>
                                        #{booking.bookingReference}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                        Dates
                                      </div>
                                      <div>{booking.checkInDate} → {booking.checkOutDate}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                        Prix Total
                                      </div>
                                      <div style={{ fontWeight: '500' }}>
                                        {totalPrice.toLocaleString('fr-FR')} FCFA
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                        Montant Payé
                                      </div>
                                      <div style={{ fontWeight: '500', color: '#10b981' }}>
                                        {amountPaid.toLocaleString('fr-FR')} FCFA
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                        Solde
                                      </div>
                                      <div style={{ 
                                        fontWeight: '600',
                                        color: isPaid ? '#10b981' : '#ef4444'
                                      }}>
                                        {balance.toLocaleString('fr-FR')} FCFA
                                        {isPaid && ' ✓'}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                        Statut
                                      </div>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        backgroundColor: booking.status === 'CHECKED_OUT' ? '#dbeafe' :
                                                       booking.status === 'CHECKED_IN' ? '#dcfce7' :
                                                       booking.status === 'CONFIRMED' ? '#fef3c7' :
                                                       booking.status === 'CANCELLED' ? '#fee2e2' : '#f3f4f6',
                                        color: booking.status === 'CHECKED_OUT' ? '#1e40af' :
                                              booking.status === 'CHECKED_IN' ? '#166534' :
                                              booking.status === 'CONFIRMED' ? '#92400e' :
                                              booking.status === 'CANCELLED' ? '#991b1b' : '#374151'
                                      }}>
                                        {booking.status === 'CONFIRMED' ? 'CONFIRMÉ' :
                                         booking.status === 'CANCELLED' ? 'ANNULÉ' :
                                         booking.status === 'PENDING' ? 'EN ATTENTE' :
                                         booking.status}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Payment History - Expandable */}
                                  {expandedBookingId === booking.id && (
                                    <div style={{ 
                                      borderTop: '1px solid #e5e7eb',
                                      padding: '16px',
                                      backgroundColor: '#f9fafb'
                                    }}>
                                      <div style={{ 
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '12px'
                                      }}>
                                        <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                                          Historique des Paiements
                                        </h5>
                                        {/* Enregistrer Paiement - Admin Only */}
                                        {isAdmin && balance > 0 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openPaymentModal(booking);
                                            }}
                                            style={{
                                              padding: '6px 12px',
                                              fontSize: '13px',
                                              fontWeight: '500',
                                              color: '#1976d2',
                                              backgroundColor: 'white',
                                              border: '1px solid #1976d2',
                                              borderRadius: '6px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px'
                                            }}
                                          >
                                            <MdAdd size={16} />
                                            Enregistrer Paiement
                                          </button>
                                        )}
                                      </div>
                                      
                                      {!bookingPayments[booking.id] ? (
                                        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                                          Chargement des paiements...
                                        </p>
                                      ) : bookingPayments[booking.id].length === 0 ? (
                                        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                                          Aucun paiement enregistré.
                                        </p>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {bookingPayments[booking.id].map((payment, idx) => (
                                            <div
                                              key={payment.id}
                                              style={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                padding: '12px',
                                                display: 'grid',
                                                gridTemplateColumns: 'auto 1fr auto auto',
                                                gap: '16px',
                                                alignItems: 'center'
                                              }}
                                            >
                                              <div style={{ 
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#6b7280'
                                              }}>
                                                #{idx + 1}
                                              </div>
                                              <div>
                                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                  {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                                                    timeZone: 'Africa/Ndjamena',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })}
                                                </div>
                                                {payment.notes && (
                                                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                                                    {payment.notes}
                                                  </div>
                                                )}
                                              </div>
                                              <div style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#10b981'
                                              }}>
                                                {payment.amount.toLocaleString('fr-FR')} FCFA
                                              </div>
                                              <div style={{
                                                fontSize: '12px',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: '#f3f4f6',
                                                color: '#374151',
                                                fontWeight: '500'
                                              }}>
                                                {payment.paymentMethod || 'Cash'}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredGuests.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="clients"
        />
      </div>
      
      {/* Add Guest Modal */}
      {isAddModalOpen && createPortal(
        <div className="modern-modal-overlay">
          <div className="modern-modal-container large">
            <div className="modern-modal-header">
              <h2>Ajouter Nouveau Client</h2>
              <p>Enregistrer un nouveau client dans le système</p>
            </div>
            <div className="modern-modal-body">
              <form onSubmit={handleAddGuest}>
                {/* Personal Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    fontSize: '15px', 
                    fontWeight: '600', 
                    color: '#1e293b', 
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>Informations Personnelles</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="firstName">Prénom *</label>
                      <input 
                        type="text" 
                        id="firstName" 
                        name="firstName" 
                        value={formData.firstName || ''} 
                        onChange={handleInputChange} 
                        placeholder="Entrez le prénom"
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="lastName">Nom de Famille *</label>
                      <input 
                        type="text" 
                        id="lastName" 
                        name="lastName" 
                        value={formData.lastName || ''} 
                        onChange={handleInputChange} 
                        placeholder="Entrez le nom de famille"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="email">Adresse Email *</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="guest@example.com"
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="phone">Numéro de Téléphone *</label>
                      <input 
                        type="text" 
                        id="phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder="+1 (555) 000-0000"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="country">Pays *</label>
                      <input 
                        type="text" 
                        id="country" 
                        name="country" 
                        value={formData.country} 
                        onChange={handleInputChange} 
                        placeholder="Pays"
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="city">Ville *</label>
                      <input 
                        type="text" 
                        id="city" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        placeholder="Ville"
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="zipCode">Code Postal *</label>
                      <input 
                        type="text" 
                        id="zipCode" 
                        name="zipCode" 
                        value={formData.zipCode} 
                        onChange={handleInputChange} 
                        placeholder="12345"
                        required 
                      />
                    </div>
                  </div>
                </div>

                {/* REMOVED: Guest Details Section (visits, lastStay, status) */}
                {/* These fields are auto-calculated by the backend */}
              </form>
            </div>
            <div className="modern-modal-footer">
              <button type="button" className="modern-modal-btn-secondary" onClick={() => setIsAddModalOpen(false)}>Annuler</button>
              <button type="submit" className="modern-modal-btn-primary" onClick={handleAddGuest}>
                ✓ Ajouter Client
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Edit Guest Modal */}
      {isEditModalOpen && currentGuest && createPortal(
        <div className="modern-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modern-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modern-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <MdEdit size={24} color="white" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'white' }}>Modifier Client</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>Mettre à jour les informations du client</p>
                </div>
              </div>
            </div>
            <div className="modern-modal-body">
              <form onSubmit={handleUpdateGuest}>
                {/* Contact Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>Contact Information</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="edit-firstName">Prénom *</label>
                      <input 
                        type="text" 
                        id="edit-firstName" 
                        name="firstName" 
                        value={formData.firstName || formData.name?.split(' ')[0] || ''} 
                        onChange={handleInputChange} 
                        placeholder="Enter first name"
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="edit-lastName">Nom de Famille *</label>
                      <input 
                        type="text" 
                        id="edit-lastName" 
                        name="lastName" 
                        value={formData.lastName || formData.name?.split(' ').slice(1).join(' ') || ''} 
                        onChange={handleInputChange} 
                        placeholder="Enter last name"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="edit-email">Adresse Email *</label>
                      <input 
                        type="email" 
                        id="edit-email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="guest@example.com"
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="edit-phone">Numéro de Téléphone *</label>
                      <input 
                        type="text" 
                        id="edit-phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder="+1 (555) 000-0000"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="edit-country">Pays *</label>
                      <input 
                        type="text" 
                        id="edit-country" 
                        name="country" 
                        value={formData.country} 
                        onChange={handleInputChange} 
                        placeholder="Pays"
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="edit-city">Ville *</label>
                      <input 
                        type="text" 
                        id="edit-city" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        placeholder="Ville"
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="edit-zipCode">Code Postal *</label>
                      <input 
                        type="text" 
                        id="edit-zipCode" 
                        name="zipCode" 
                        value={formData.zipCode} 
                        onChange={handleInputChange} 
                        placeholder="12345"
                        required 
                      />
                    </div>
                  </div>
                </div>
                
                {/* REMOVED: Guest Details Section (visits, lastStay, status) */}
                {/* These fields are read-only and managed by the backend */}
              </form>
            </div>
            <div className="modern-modal-footer">
              <button type="button" className="modern-modal-btn-secondary" onClick={() => setIsEditModalOpen(false)}>Annuler</button>
              <button type="submit" className="modern-modal-btn-primary" onClick={handleUpdateGuest}>
                <MdCheckCircle size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Mettre à Jour Client
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* View Guest Modal */}
      {isViewModalOpen && currentGuest && createPortal(
        <div className="modern-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modern-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modern-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <MdPerson size={32} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'white' }}>
                    {currentGuest.name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className={`status-badge ${currentGuest.status.toLowerCase()}`} style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      {currentGuest.status}
                    </span>
                    <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                      • {currentGuest.visits} {currentGuest.visits === 1 ? 'Visite' : 'Visites'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modern-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Contact Information Section */}
                <div>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>Contact Information</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MdEmail size={20} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>Adresse Email</div>
                        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{currentGuest.email}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MdPhone size={20} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>Numéro de Téléphone</div>
                        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{currentGuest.phone}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MdHome size={20} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>Adresse</div>
                        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{currentGuest.address}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Guest History Section */}
                <div>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>Historique du Client</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '2px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <MdStar size={18} color="#f59e0b" />
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Total Visites</div>
                      </div>
                      <div style={{ fontSize: '24px', color: '#1e293b', fontWeight: '700' }}>{currentGuest.visits}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {currentGuest.visits === 0 ? 'Premier client' : 
                         currentGuest.visits === 1 ? 'Deuxième visite' :
                         currentGuest.visits < 5 ? 'Client régulier' : 'Client VIP'}
                      </div>
                    </div>
                    
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '2px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <MdCalendarToday size={18} color="#64748b" />
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Dernier Séjour</div>
                      </div>
                      <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>{currentGuest.lastStay}</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '2px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <MdCheckCircle size={18} color="#64748b" />
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Statut Client</div>
                    </div>
                    <span className={`status-badge ${currentGuest.status.toLowerCase()}`}>
                      {currentGuest.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modern-modal-footer">
              <button className="modern-modal-btn-secondary" onClick={() => setIsViewModalOpen(false)}>Fermer</button>
              <button 
                className="modern-modal-btn-primary" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditClick(currentGuest);
                }}
              >
                <MdEdit size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Modifier Client
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedBookingForPayment && createPortal(
        <div className="modern-modal-overlay">
          <div className="modern-modal-container" style={{ maxWidth: '500px' }}>
            <div className="modern-modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h2 className="modern-modal-title" style={{ margin: 0 }}>
                  Enregistrer Paiement
                </h2>
                <button 
                  className="modern-modal-close-btn" 
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedBookingForPayment(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  <MdClose size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleRecordPayment}>
              <div className="modern-modal-body">
                {/* Booking Info */}
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Réservation #{selectedBookingForPayment.bookingReference}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Total : {selectedBookingForPayment.totalPrice?.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981' }}>
                    Payé : {selectedBookingForPayment.amountPaid?.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>
                    Solde : {((selectedBookingForPayment.totalPrice || 0) - (selectedBookingForPayment.amountPaid || 0)).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
                
                {/* Amount */}
                <div className="modern-form-group">
                  <label className="modern-form-label">
                    Montant (FCFA) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="modern-form-input"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="Entrez le montant"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                {/* Payment Method */}
                <div className="modern-form-group">
                  <label className="modern-form-label">
                    Méthode de Paiement <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="modern-form-input"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="Cash">Espèces</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Virement Bancaire</option>
                    <option value="Credit Card">Carte de Crédit</option>
                    <option value="Debit Card">Carte de Débit</option>
                  </select>
                </div>
                
                {/* Notes */}
                <div className="modern-form-group">
                  <label className="modern-form-label">
                    Notes (Optionnel)
                  </label>
                  <textarea
                    className="modern-form-input"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Ajouter des notes sur ce paiement..."
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modern-modal-footer">
                <button 
                  type="button"
                  className="modern-modal-btn-secondary" 
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedBookingForPayment(null);
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="modern-modal-btn-primary"
                  disabled={((selectedBookingForPayment.totalPrice || 0) - (selectedBookingForPayment.amountPaid || 0)) <= 0}
                  style={{
                    opacity: ((selectedBookingForPayment.totalPrice || 0) - (selectedBookingForPayment.amountPaid || 0)) <= 0 ? 0.5 : 1,
                    cursor: ((selectedBookingForPayment.totalPrice || 0) - (selectedBookingForPayment.amountPaid || 0)) <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Enregistrer Paiement
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Guests;
