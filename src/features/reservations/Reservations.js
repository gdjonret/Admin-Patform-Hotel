// src/pages/Reservations.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import '../../styles/shared/modern-table.css';
import '../../styles/shared/tabs.css';
import './components/modern-reservations-header.css';
import './components/reservations.css';
import '../../styles/shared/status-badge.css';
import { Button, Stack, IconButton } from "@mui/material";
import { MdEdit, MdClose, MdDelete, MdVisibility } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { toast } from '../../utils/toast';
import eventBus, { EVENTS } from '../../utils/eventBus';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import ActionMenuButton from '../../components/common/ActionMenuButton';

import AddReservationModal from "./components/modals/AddReservationModal";
import EditReservationModal from "./components/modals/EditReservationModal";
import ViewReservationModal from "./components/modals/ViewReservationModal";
import PaymentModal from "./components/modals/PaymentModal";
import CheckInConfirmModal from "./components/modals/CheckInConfirmModal";
import CheckOutConfirmModal from "./components/modals/CheckOutConfirmModal";
import AssignRoomModal from "./components/modals/AssignRoomModal";
import ReceiptModal from "./components/modals/ReceiptModal";

import { useReservations } from "./components/hooks/useReservations";
import { useDropdownMenu } from "./components/hooks/useDropdownMenu";
import { atMidnight, nightsBetweenYmd, formatDate, todayYmdTZ, parseYmd } from "../../lib/dates";
import { formatFCFA } from "../../lib/formatters";
import { useRole } from "../../hooks/useRole";

// French tab labels
const TAB_LABELS = {
  "Pending": "En Attente",
  "arrivals": "Arrivées",
  "in-house": "En Séjour",
  "departures": "Départs",
  "upcoming": "À Venir",
  "past": "Passées",
  "cancelled": "Annulées",
  "all": "Toutes"
};

// Modern sortable header styles
const sortableHeaderStyle = {
  cursor: "pointer",
  userSelect: "none",
  position: "relative",
  transition: "background-color 0.2s",
};
const sortableHeaderHoverStyle = { backgroundColor: "#f1f5f9" };

const Reservations = () => {
  // ---------- Role-based access control ----------
  const { isAdmin } = useRole();
  
  // ---------- Local UI state (tabs, filters, sorting) ----------
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  // Initialize activeTab from URL or default to "Pending"
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["Pending", "arrivals", "in-house", "departures", "upcoming", "past", "cancelled", "all"].includes(tabParam)) {
      return tabParam;
    }
    return "Pending"; // Default to Pending tab
  });
  const [hoveredHeader, setHoveredHeader] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ---------- Modal state management ----------
  // Centralized modal state manager
  const [modalState, setModalState] = useState({
    // Modal visibility
    showAddModal: false,
    showEditModal: false,
    showViewModal: false,
    showPaymentModal: false,
    showCheckoutConfirmModal: false,
    showCheckInModal: false,
    showAssignRoomModal: false,
    showReceiptModal: false,
    
    // Current reservation data
    currentReservation: null,
    checkoutReservation: null,
    reservationToCheckIn: null,
    reservationToAssign: null
  });
  
  // Helper functions to manage modal state
  const openModal = (modalName, reservation = null, keepViewModalOpen = false) => {
    // Close all other modals first (but optionally keep ViewModal open)
    const newState = {
      ...modalState,
      showAddModal: false,
      showEditModal: false,
      showViewModal: keepViewModalOpen ? modalState.showViewModal : false,
      showPaymentModal: false,
      showCheckoutConfirmModal: false,
      showCheckInModal: false,
      showAssignRoomModal: false,
      showReceiptModal: false
    };
    
    // Set the specific modal to open
    newState[`show${modalName}Modal`] = true;
    
    // Set the current reservation if provided
    if (reservation) {
      newState.currentReservation = { ...reservation };
      
      // Set specific reservation state based on modal type
      switch (modalName) {
        case 'CheckIn':
          newState.reservationToCheckIn = { ...reservation };
          break;
        case 'CheckoutConfirm':
          newState.checkoutReservation = { ...reservation };
          break;
        case 'AssignRoom':
          newState.reservationToAssign = { ...reservation };
          break;
        default:
          break;
      }
    }
    
    setModalState(newState);
    closeMenu(); // Close any open dropdown menus
  };
  
  const closeModal = (modalName) => {
    setModalState(prev => ({
      ...prev,
      [`show${modalName}Modal`]: false
    }));
  };
  
  // Destructure modal state for easier access
  const {
    showAddModal,
    showEditModal,
    showViewModal,
    showPaymentModal,
    showCheckoutConfirmModal,
    showCheckInModal,
    showAssignRoomModal,
    showReceiptModal,
    currentReservation,
    checkoutReservation,
    reservationToCheckIn,
    reservationToAssign
  } = modalState;

  // Use custom dropdown menu hook with smart positioning
  const { 
    activeMenu, 
    menuRefs,
    triggerRefs,
    menuPosition,
    toggleMenu, 
    closeMenu, 
    handleAction, 
    isActionLoading 
  } = useDropdownMenu();
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'primary'
  });

  // ---------- Available rooms sample (you can move this to a separate file later) ----------
  const [availableRooms] = useState([
    "101", "102", "103", "104", "105",
    "201", "202", "203", "204", "205",
    "301", "302", "303", "304", "305",
    "401", "402", "403", "404", "405",
  ]);

  // ---------- Hook: centralized reservations state, filtering, and mutations ----------
  const today = useMemo(() => {
    const todayYmd = todayYmdTZ('Africa/Ndjamena');
    return parseYmd(todayYmd);
  }, []);
  const {
    reservations,
    getView,                 // (tab, filterStatus, searchTerm) => rows
    addReservation,          // (row)
    editReservation,         // (updatedRow)
    checkIn,                 // (row)
    checkOut,                // (row)
    cancelReservation,       // (row)
    assignRoom,              // (id, roomNumber)
    addCharge,               // (id, amount, description, category)
    deleteReservation,       // (id)
    sortConfig,
    setSortConfig,
    refetch,                 // () => void - refetch current tab
    calculateTotalWithTaxes, // (reservation) => total with taxes
  } = useReservations(today, activeTab);

  // rows for the current view
  const filteredReservations = getView(activeTab, filterStatus, searchTerm);
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);
  
  // Reset to page 1 when tab, filter, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, searchTerm]);

  // ---------- URL ?tab= and ?action= handling ----------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const actionParam = params.get("action");
    
    if (tabParam && ["Pending", "arrivals", "in-house", "departures", "upcoming", "past", "cancelled", "all"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Handle action parameter (e.g., ?action=new to open Add Reservation modal)
    if (actionParam === "new") {
      openModal('Add');
      // Clean up URL parameter
      const url = new URL(window.location);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url);
    }
  }, []);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const url = new URL(window.location);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url);
  };

  // Dropdown menu is now handled by useDropdownMenu hook

  // ---------- Sorting ----------
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  // ---------- Helpers ----------
  const calculateNights = (checkInDate, checkOutDate) => {
    // Use standardized date utility
    return nightsBetweenYmd(checkInDate, checkOutDate);
  };

  // Helper to get status badge class and text
  const getStatusInfo = (status) => {
    // Debug logging
    if (status === 'NO_SHOW' || status === 'CANCELLED') {
      console.log('getStatusInfo called with status:', status);
    }
    
    const statusMap = {
      'PENDING': { class: 'pending', text: 'En Attente' },
      'CONFIRMED': { class: 'confirmed', text: 'Confirmée' },
      'CHECKED_IN': { class: 'checked_in', text: 'Checked In' },
      'CHECKED_OUT': { class: 'checked-out', text: 'Checked Out' },
      'CANCELLED': { class: 'cancelled', text: 'Annulée' },
      'NO_SHOW': { class: 'no-show', text: 'Absent' }
    };
    return statusMap[status] || { class: 'confirmed', text: 'Confirmed' };
  };

  // ---------- Openers ----------
  const openEditModal = (reservation) => {
    openModal('Edit', reservation);
  };
  
  const openViewModal = (reservation) => {
    openModal('View', reservation);
  };

  // ---------- useEffect hooks ----------
  // Add event listener for opening assign room modal from check-in modal
  useEffect(() => {
    const handleOpenAssignRoomModal = (event) => {
      const { reservation } = event.detail;
      if (reservation) {
        openModal('AssignRoom', reservation);
      }
    };
    
    window.addEventListener('openAssignRoomModal', handleOpenAssignRoomModal);
    
    return () => {
      window.removeEventListener('openAssignRoomModal', handleOpenAssignRoomModal);
    };
  }, []);

  // ---------- Actions using the hook ----------
  const handleEditReservation = async (updatedReservation) => {
    try {
      // Import API function
      const { updateReservation } = await import('../../api/reservations');
      
      console.log('Updating reservation:', updatedReservation); // Debug log
      
      // Call backend API to save changes
      const result = await updateReservation(updatedReservation.id, updatedReservation);
      
      console.log('Update result:', result); // Debug log
      
      // Update local state
      editReservation(updatedReservation);
      
      // Refresh from backend to ensure sync
      refetch();
      
      closeModal('Edit');
      toast.success(`Reservation for ${updatedReservation.guestName} has been updated.`);
    } catch (error) {
      console.error('Error updating reservation:', error);
      console.error('Error response:', error.response); // More details
      
      // Extract detailed error message
      let errorMsg = 'Failed to update reservation';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
    }
  };

  const handleDeleteReservation = (reservation) => {
    setConfirmDialog({
      open: true,
      title: 'Supprimer la Réservation',
      message: `Êtes-vous sûr de vouloir supprimer la réservation pour ${reservation.guestName} ? Cette action ne peut pas être annulée.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setConfirmDialog(prev => ({ ...prev, open: false }));
          
          // Import the API function
          const { deleteReservation: deleteReservationAPI } = await import('../../api/reservations');
          
          // Call backend API to delete reservation
          await deleteReservationAPI(reservation.id);
          
          // Update local state
          deleteReservation(reservation.id);
          
          // Refresh the reservations list from backend
          refetch();
          
          toast.success(`La réservation pour ${reservation.guestName} a été supprimée.`);
          
          // Update view modal if it's showing the same reservation
          if (showViewModal && currentReservation?.id === reservation.id) {
            setModalState(prev => ({
              ...prev,
              showViewModal: false,
              currentReservation: null
            }));
          }
        } catch (error) {
          console.error('Error deleting reservation:', error);
          
          // Extract detailed error message from backend
          let errorMsg = 'Échec de la suppression de la réservation';
          if (error.message) {
            errorMsg = error.message;
          } else if (error.response?.data) {
            if (typeof error.response.data === 'string') {
              errorMsg = error.response.data;
            } else if (error.response.data.message) {
              errorMsg = error.response.data.message;
            }
          }
          
          toast.error(errorMsg);
        }
      }
    });
  };
  
  // Reset function removed - data now comes from backend database

  const handleConfirmReservation = async (reservation) => {
    try {
      // Import the API function
      const { confirmReservation: confirmReservationAPI } = await import('../../api/reservations');
      
      // Call backend API to update status to CONFIRMED
      await confirmReservationAPI(reservation.id);
      
      // Close modal and refresh
      closeModal('View');
      refetch();
      
      toast.success(`La réservation pour ${reservation.guestName} a été confirmée !`);
    } catch (error) {
      console.error('Error confirming reservation:', error);
      toast.error('Une erreur s\'est produite lors de la confirmation de la réservation. Veuillez réessayer.');
    }
  };

  const handleCheckIn = (reservation) => {
    openModal('CheckIn', reservation);
  };
  
  const confirmCheckIn = async (payload) => {
    if (!payload || !payload.id) return;
    
    try {
      // Import the API functions
      const { checkInReservation, assignRoom } = await import('../../api/reservations');
      const { getAllRooms } = await import('../../api/rooms');
      
      // Step 1: Assign room if roomNumber is provided
      if (payload.roomNumber) {
        try {
          // Get all rooms to find the room ID from room number
          const allRooms = await getAllRooms();
          const room = allRooms.find(r => String(r.number) === String(payload.roomNumber));
          
          if (room && room.id) {
            console.log(`Assigning room ${room.number} (ID: ${room.id}) to booking ${payload.id}`);
            await assignRoom(payload.id, room.id);
          } else {
            console.warn(`Room ${payload.roomNumber} not found in available rooms`);
          }
        } catch (roomError) {
          console.error('Error assigning room:', roomError);
          // Continue with check-in even if room assignment fails
        }
      }
      
      // Step 2: Check in the guest with complete data
      await checkInReservation(payload.id, {
        checkInTime: payload.checkInTime,
        actualCheckInDate: payload.actualCheckInDate,
        actualNights: payload.actualNights,
        updatedTotalPrice: payload.updatedTotalPrice,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentStatus,
        amountPaid: payload.amountPaid
      });
      
      // Step 3: Update local state
      checkIn(payload.id, payload.checkInTime);
      
      // Step 4: Show success message
      const reservation = reservations.find(r => r.id === payload.id);
      toast.success(`${reservation?.guestName || 'Client'} a été enregistré avec succès.`);
      
      closeModal('CheckIn');
      
      // Step 5: Refresh the reservations list from backend
      refetch();
    } catch (error) {
      console.error('Error during check-in:', error);
      toast.error('Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.');
    }
  };

  const handleCheckOut = (reservation) => {
    openModal('CheckoutConfirm', reservation);
  };
  
  const confirmCheckOut = async (payload) => {
    if (!payload || !payload.id) return;
    
    try {
      // Import the API function
      const { checkOutReservation: checkOutReservationAPI } = await import('../../api/reservations');
      
      // Call backend API to check out the guest with complete data
      await checkOutReservationAPI(payload.id, {
        checkOutTime: payload.checkOutTime,
        actualCheckOutDate: payload.actualCheckOutDate,
        actualNights: payload.actualNights,
        billingMethod: payload.billingMethod,
        finalTotalPrice: payload.finalTotalPrice,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentStatus,
        amountPaid: payload.amountPaid,
        chargesJson: payload.chargesJson
      });
      
      // Update local state
      checkOut(payload.id, payload.checkOutTime);
      
      // Find the reservation to get the guest name
      const reservation = reservations.find(r => r.id === payload.id);
      toast.success(`${reservation?.guestName || 'Client'} a check-out avec succès.`);
      
      closeModal('CheckoutConfirm');
      
      // Close view modal if it's showing the same reservation
      if (showViewModal && currentReservation?.id === payload.id) {
        closeModal('View');
      }
      
      // Refresh the reservations list from backend
      refetch();
    } catch (error) {
      console.error('Error during check-out:', error);
      toast.error('There was an error processing the check-out. Please try again.');
    }
  };

  const handleAssignRoom = (reservation) => {
    openModal('AssignRoom', reservation);
  };
  
  const assignRoomToReservation = async (roomNumber) => {
    if (!reservationToAssign || !roomNumber) return;
    
    try {
      console.log('assignRoomToReservation called with roomNumber:', roomNumber);
      console.log('reservationToAssign:', reservationToAssign);
      
      // Import API functions
      const { assignRoom: assignRoomAPI } = await import('../../api/reservations');
      const { getAllRooms } = await import('../../api/rooms');
      
      // Get all rooms to find the room ID from room number
      const allRooms = await getAllRooms();
      console.log('All rooms:', allRooms);
      
      const room = allRooms.find(r => String(r.number) === String(roomNumber));
      console.log('Found room:', room);
      
      if (!room || !room.id) {
        throw new Error(`Room ${roomNumber} not found in system`);
      }
      
      console.log(`Assigning room ${room.number} (ID: ${room.id}) to booking ${reservationToAssign.id}`);
      
      // Call backend API with room ID (not room number)
      await assignRoomAPI(reservationToAssign.id, room.id);
      
      // Update local state with room number for display
      assignRoom(reservationToAssign.id, roomNumber);
      
      toast.success(`La chambre ${roomNumber} a été assignée à ${reservationToAssign.guestName}.`);
      closeModal('AssignRoom');
      
      // Emit event to refresh rooms
      eventBus.emit(EVENTS.ROOM_ASSIGNED);
      
      // Update view modal if it's showing the same reservation
      if (showViewModal && currentReservation?.id === reservationToAssign.id) {
        setModalState(prev => ({
          ...prev,
          currentReservation: {
            ...prev.currentReservation,
            roomNumber: roomNumber
          }
        }));
      }
      
      // Refresh to sync with backend
      refetch();
    } catch (error) {
      console.error('Error assigning room:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'There was an error assigning the room. Please try again.';
      toast.error(errorMessage);
    }
  };  

  const handleRecordPayment = (reservation) => {
    openModal('Payment', reservation);
  };

  const handleViewReceipt = async (reservation) => {
    try {
      // Fetch fresh reservation data to ensure we have chargesJson
      const { fetchReservationById } = await import('../../api/reservations');
      const freshReservation = await fetchReservationById(reservation.id);
      openModal('Receipt', freshReservation);
    } catch (error) {
      console.error('Error fetching reservation for receipt:', error);
      // Fallback to cached data if fetch fails
      openModal('Receipt', reservation);
    }
  };

  const handleCancelReservation = async (reservation) => {
    setConfirmDialog({
      open: true,
      title: 'Annuler la Réservation',
      message: `Êtes-vous sûr de vouloir annuler la réservation pour ${reservation.guestName} ?`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          setConfirmDialog(prev => ({ ...prev, open: false }));
          
          // Import the API function
          const { cancelReservation: cancelReservationAPI } = await import('../../api/reservations');
          
          // Call backend API to cancel reservation
          await cancelReservationAPI(reservation.id);
          
          // Update local state with Chad's today
          const todayChad = todayYmdTZ('Africa/Ndjamena');
          cancelReservation(reservation.id, todayChad);
          closeMenu();
          
          // Refresh the reservations list from backend
          refetch();
          
          toast.success(`La réservation pour ${reservation.guestName} a été annulée.`);
          
          // Update view modal if it's showing the same reservation
          if (showViewModal && currentReservation?.id === reservation.id) {
            setModalState(prev => ({
              ...prev,
              currentReservation: {
                ...prev.currentReservation,
                status: "CANCELLED",
                cancellationDate: today
              }
            }));
          }
        } catch (error) {
          console.error('Error cancelling reservation:', error);
          toast.error('Une erreur s\'est produite lors de l\'annulation de la réservation. Veuillez réessayer.');
        }
      }
    });
  };

  // ---------- Render ----------
  return (
    <div className="reservations-container">
      {/* Modern Header Section */}
      <div className="modern-page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1 className="page-title">Réservations</h1>
          </div>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => openModal('Add')} 
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
            + Nouvelle Réservation
          </Button>
        </div>
      </div>

      {/* Modern Tabs & Filters Section */}
      <div className="modern-controls-section">
        {/* Tabs */}
        <div className="modern-tabs-container">
          <button className={`modern-tab ${activeTab === "Pending" ? "active" : ""}`} onClick={() => handleTabChange("Pending")}>
            {TAB_LABELS["Pending"]}
          </button>
          <button className={`modern-tab ${activeTab === "arrivals" ? "active" : ""}`} onClick={() => handleTabChange("arrivals")}>
            {TAB_LABELS["arrivals"]}
          </button>
          <button className={`modern-tab ${activeTab === "in-house" ? "active" : ""}`} onClick={() => handleTabChange("in-house")}>
            {TAB_LABELS["in-house"]}
          </button>
          <button className={`modern-tab ${activeTab === "departures" ? "active" : ""}`} onClick={() => handleTabChange("departures")}>
            {TAB_LABELS["departures"]}
          </button>
          <button className={`modern-tab ${activeTab === "upcoming" ? "active" : ""}`} onClick={() => handleTabChange("upcoming")}>
            {TAB_LABELS["upcoming"]}
          </button>
          <button className={`modern-tab ${activeTab === "past" ? "active" : ""}`} onClick={() => handleTabChange("past")}>
            {TAB_LABELS["past"]}
          </button>
          <button className={`modern-tab ${activeTab === "cancelled" ? "active" : ""}`} onClick={() => handleTabChange("cancelled")}>
            {TAB_LABELS["cancelled"]}
          </button>
          <button className={`modern-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => handleTabChange("all")}>
            {TAB_LABELS["all"]}
          </button>
        </div>

        {/* Filters Row */}
        <div className="modern-filter-row">
          <div className="modern-search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="modern-search-input"
              placeholder="Rechercher des réservations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === "cancelled" && (
            <div className="modern-filter-group">
              <label className="filter-label">Statut:</label>
              <select className="modern-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">Tous</option>
                <option value="CANCELLED">Annulée</option>
                <option value="NO_SHOW">Absent</option>
              </select>
            </div>
          )}
          {activeTab === "all" && (
            <div className="modern-filter-group">
              <label className="filter-label">Statut:</label>
              <select className="modern-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">Tous</option>
                <option value="CONFIRMED">Confirmée</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="CANCELLED">Annulée</option>
                <option value="NO_SHOW">Absent</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="modern-table-container">
        <table className="modern-table" data-tab={activeTab}>
          <thead>
            <tr>
              {/* Pending */}
              {activeTab === "Pending" && (
                <>
                  <th
                    className="sortable"
                    onClick={() => handleSort("bookingReference")}
                    onMouseEnter={() => setHoveredHeader("bookingReference")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "bookingReference" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Référence
                    {sortConfig.key === "bookingReference" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("guestName")}
                    onMouseEnter={() => setHoveredHeader("guestName")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "guestName" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Nom du Client
                    {sortConfig.key === "guestName" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomType")}
                    onMouseEnter={() => setHoveredHeader("roomType")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomType" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Type de Chambre
                    {sortConfig.key === "roomType" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkInDate")}
                    onMouseEnter={() => setHoveredHeader("checkInDate")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkInDate" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Arrivée
                    {sortConfig.key === "checkInDate" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkOutDate")}
                    onMouseEnter={() => setHoveredHeader("checkOutDate")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkOutDate" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Départ
                    {sortConfig.key === "checkOutDate" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </>
              )}

              {/* Arrivals */}
              {activeTab === "arrivals" && (
                <>
                  <th
                    className="sortable"
                    onClick={() => handleSort("bookingReference")}
                    onMouseEnter={() => setHoveredHeader("bookingReference")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "bookingReference" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Reference
                    {sortConfig.key === "bookingReference" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("guestName")}
                    onMouseEnter={() => setHoveredHeader("guestName")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "guestName" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Client
                    {sortConfig.key === "guestName" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomType")}
                    onMouseEnter={() => setHoveredHeader("roomType")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomType" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Type de Chambre
                    {sortConfig.key === "roomType" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomNumber")}
                    onMouseEnter={() => setHoveredHeader("roomNumber")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomNumber" ? sortableHeaderHoverStyle : {}) }}
                  >
                    N° Chambre
                    {sortConfig.key === "roomNumber" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkIn")}
                    onMouseEnter={() => setHoveredHeader("checkIn")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkIn" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Date d'Arrivée
                    {sortConfig.key === "checkIn" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("totalPrice")}
                    onMouseEnter={() => setHoveredHeader("totalPrice")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "totalPrice" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Total Prévu
                    {sortConfig.key === "totalPrice" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </>
              )}

              {/* In-house */}
              {activeTab === "in-house" && (
                <>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomNumber")}
                    onMouseEnter={() => setHoveredHeader("roomNumber")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomNumber" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Room
                    {sortConfig.key === "roomNumber" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("guestName")}
                    onMouseEnter={() => setHoveredHeader("guestName")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "guestName" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Client
                    {sortConfig.key === "guestName" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Nuits</th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkInTime")}
                    onMouseEnter={() => setHoveredHeader("checkInTime")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkInTime" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Heure d'Arrivée
                    {sortConfig.key === "checkInTime" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("balance")}
                    onMouseEnter={() => setHoveredHeader("balance")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "balance" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Solde
                    {sortConfig.key === "balance" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </>
              )}

              {/* Departures */}
              {activeTab === "departures" && (
                <>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomNumber")}
                    onMouseEnter={() => setHoveredHeader("roomNumber")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomNumber" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Chambre
                    {sortConfig.key === "roomNumber" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("guestName")}
                    onMouseEnter={() => setHoveredHeader("guestName")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "guestName" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Client
                    {sortConfig.key === "guestName" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkIn")}
                    onMouseEnter={() => setHoveredHeader("checkIn")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkIn" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Date d'Arrivée
                    {sortConfig.key === "checkIn" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkOut")}
                    onMouseEnter={() => setHoveredHeader("checkOut")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkOut" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Date de Départ
                    {sortConfig.key === "checkOut" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("outstanding")}
                    onMouseEnter={() => setHoveredHeader("outstanding")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "outstanding" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Reste à Payer
                    {sortConfig.key === "outstanding" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </>
              )}

              {/* Upcoming */}
              {activeTab === "upcoming" && (
                <>
                  <th
                    className="sortable"
                    onClick={() => handleSort("bookingReference")}
                    onMouseEnter={() => setHoveredHeader("bookingReference")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "bookingReference" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Reference
                    {sortConfig.key === "bookingReference" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("guestName")}
                    onMouseEnter={() => setHoveredHeader("guestName")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "guestName" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Client
                    {sortConfig.key === "guestName" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomType")}
                    onMouseEnter={() => setHoveredHeader("roomType")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomType" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Type de Chambre
                    {sortConfig.key === "roomType" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkIn")}
                    onMouseEnter={() => setHoveredHeader("checkIn")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkIn" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Date d'Arrivée
                    {sortConfig.key === "checkIn" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkOut")}
                    onMouseEnter={() => setHoveredHeader("checkOut")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkOut" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Date de Départ
                    {sortConfig.key === "checkOut" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </>
              )}

              {/* Past */}
              {activeTab === "past" && (
                <>
                  <th
                    className="sortable"
                    onClick={() => handleSort("bookingReference")}
                    onMouseEnter={() => setHoveredHeader("bookingReference")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "bookingReference" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Reference
                    {sortConfig.key === "bookingReference" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("guestName")}
                    onMouseEnter={() => setHoveredHeader("guestName")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "guestName" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Guest
                    {sortConfig.key === "guestName" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomNumber")}
                    onMouseEnter={() => setHoveredHeader("roomNumber")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomNumber" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Room
                    {sortConfig.key === "roomNumber" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Période de Séjour</th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("totalPrice")}
                    onMouseEnter={() => setHoveredHeader("totalPrice")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "totalPrice" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Total Final
                    {sortConfig.key === "totalPrice" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("paymentStatus")}
                    onMouseEnter={() => setHoveredHeader("paymentStatus")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "paymentStatus" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Paiement
                    {sortConfig.key === "paymentStatus" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </>
              )}

              {/* Cancelled */}
              {activeTab === "cancelled" && (
                <>
                  <th
                    className="sortable"
                    onClick={() => handleSort("bookingReference")}
                    onMouseEnter={() => setHoveredHeader("bookingReference")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "bookingReference" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Reference
                    {sortConfig.key === "bookingReference" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("guestName")}
                    onMouseEnter={() => setHoveredHeader("guestName")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "guestName" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Guest
                    {sortConfig.key === "guestName" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomType")}
                    onMouseEnter={() => setHoveredHeader("roomType")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomType" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Room Type
                    {sortConfig.key === "roomType" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Séjour Prévu</th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("status")}
                    onMouseEnter={() => setHoveredHeader("status")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "status" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Statut
                    {sortConfig.key === "status" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </>
              )}

              {/* All */}
              {activeTab === "all" && (
                <>
                  <th
                    className="sortable"
                    onClick={() => handleSort("reference")}
                    onMouseEnter={() => setHoveredHeader("reference")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "reference" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Reference
                    {sortConfig.key === "reference" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("guestName")}
                    onMouseEnter={() => setHoveredHeader("guestName")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "guestName" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Guest
                    {sortConfig.key === "guestName" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("roomNumber")}
                    onMouseEnter={() => setHoveredHeader("roomNumber")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "roomNumber" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Room
                    {sortConfig.key === "roomNumber" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkIn")}
                    onMouseEnter={() => setHoveredHeader("checkIn")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkIn" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Check-in
                    {sortConfig.key === "checkIn" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("checkOut")}
                    onMouseEnter={() => setHoveredHeader("checkOut")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "checkOut" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Check-out
                    {sortConfig.key === "checkOut" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("status")}
                    onMouseEnter={() => setHoveredHeader("status")}
                    onMouseLeave={() => setHoveredHeader(null)}
                    style={{ ...sortableHeaderStyle, ...(hoveredHeader === "status" ? sortableHeaderHoverStyle : {}) }}
                  >
                    Status
                    {sortConfig.key === "status" && <span className="sort-icon">{sortConfig.direction === "ascending" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedReservations.map((reservation) => {
              // Use standardized date formatting
              const checkInFormatted = formatDate(reservation.checkIn, 'medium');
              const checkOutFormatted = formatDate(reservation.checkOut, 'medium');
              const nights = calculateNights(reservation.checkIn, reservation.checkOut);
              const stayPeriod = `${checkInFormatted} - ${checkOutFormatted}`;

              return (
                <tr 
                  key={reservation.id}
                  onClick={(e) => {
                    // Don't open modal if clicking on buttons or action column
                    if (e.target.closest('.action-buttons') || e.target.closest('button')) {
                      return;
                    }
                    // For in-house tab, open checkout modal instead of view modal
                    if (activeTab === 'in-house') {
                      handleCheckOut(reservation);
                    } else {
                      openViewModal(reservation);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pending */}
                  {activeTab === "Pending" && (
                    <>
                      <td><strong>{reservation.bookingReference}</strong></td>
                      <td>{reservation.guestName}</td>
                      <td>{reservation.roomType}</td>
                      <td>{checkInFormatted}</td>
                      <td>{checkOutFormatted}</td>
                      <td className="action-buttons">
                        <button className="action-btn success pending-btn" onClick={() => openModal('View', reservation)}>
                          Confirmer
                        </button>
                        <button className="action-btn warn pending-btn" onClick={() => handleCancelReservation(reservation)}>
                          Annuler
                        </button>
                      </td>
                    </>
                  )}

                  {/* Arrivals */}
                  {activeTab === "arrivals" && (
                    <>
                      <td><strong>{reservation.bookingReference}</strong></td>
                      <td>{reservation.guestName}</td>
                      <td>{reservation.roomType}</td>
                      <td>
                        {reservation.roomNumber ? (
                          <span style={{ fontWeight: '500' }}>{reservation.roomNumber}</span>
                        ) : (
                          <span className="not-assigned-badge">Non assignée</span>
                        )}
                      </td>
                      <td>{checkInFormatted}</td>
                      <td style={{ fontWeight: '500' }}>
                        {(() => {
                          const total = calculateTotalWithTaxes(reservation);
                          const paid = reservation.amountPaid || 0;
                          const due = total - paid;
                          
                          if (paid > 0 && due > 0) {
                            // Deposit paid, show remaining
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>{formatFCFA(total)}</span>
                                <span style={{ fontSize: '0.85em', color: '#6b7280' }}>
                                  ({formatFCFA(due)} due at check-in)
                                </span>
                              </div>
                            );
                          } else if (paid >= total) {
                            // Fully paid
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>{formatFCFA(total)}</span>
                                <span style={{ fontSize: '0.85em', color: '#10b981' }}>
                                  (Payé ✓)
                                </span>
                              </div>
                            );
                          } else {
                            // No payment yet
                            return formatFCFA(total);
                          }
                        })()}
                      </td>
                      <td className="action-buttons">
                        <button className="action-btn success arrivals-btn" onClick={() => handleCheckIn(reservation)}>
                          Check-in
                        </button>
                        <button className="action-btn assign-room arrivals-btn" onClick={() => handleAssignRoom(reservation)}>
                          Add Room
                        </button>
                      </td>
                    </>
                  )}

                  {/* In-House */}
                  {activeTab === "in-house" && (
                    <>
                      <td><strong>{reservation.roomNumber || "—"}</strong></td>
                      <td>{reservation.guestName}</td>
                      <td>{nights}</td>
                      <td>{reservation.checkInTime || "—"}</td>
                      <td style={{ 
                        fontWeight: '500',
                        color: (() => {
                          const outstanding = calculateTotalWithTaxes(reservation) - (reservation.amountPaid || 0);
                          return outstanding > 0 ? '#dc2626' : '#10b981';
                        })()
                      }}>
                        {(() => {
                          const outstanding = calculateTotalWithTaxes(reservation) - (reservation.amountPaid || 0);
                          return formatFCFA(outstanding);
                        })()}
                      </td>
                      <td className="action-buttons">
                        <button className="action-btn checkout" onClick={() => handleCheckOut(reservation)}>
                          Check-out
                        </button>
                      </td>
                    </>
                  )}

                  {/* Departures */}
                  {activeTab === "departures" && (
                    <>
                      <td><strong>{reservation.roomNumber || "—"}</strong></td>
                      <td>{reservation.guestName}</td>
                      <td>{checkInFormatted}</td>
                      <td>{checkOutFormatted}</td>
                      <td style={{ 
                        fontWeight: '500',
                        color: (() => {
                          const outstanding = calculateTotalWithTaxes(reservation) - (reservation.amountPaid || 0);
                          return outstanding > 0 ? '#dc2626' : '#10b981';
                        })()
                      }}>
                        {(() => {
                          const outstanding = calculateTotalWithTaxes(reservation) - (reservation.amountPaid || 0);
                          return formatFCFA(outstanding);
                        })()}
                      </td>
                      <td className="action-buttons">
                        <button className="action-btn checkout" onClick={() => handleCheckOut(reservation)}>
                          Check-out
                        </button>
                        <button className="action-btn ghost" onClick={() => openViewModal(reservation)}>
                          View
                        </button>
                      </td>
                    </>
                  )}

                  {/* Upcoming */}
                  {activeTab === "upcoming" && (
                    <>
                      <td><strong>{reservation.bookingReference}</strong></td>
                      <td>{reservation.guestName}</td>
                      <td>{reservation.roomType}</td>
                      <td>{checkInFormatted}</td>
                      <td>{checkOutFormatted}</td>
                      <td className="action-buttons">
                        <button className="action-btn ghost" onClick={() => openViewModal(reservation)}>
                          View
                        </button>
                        <button className="action-btn" onClick={() => openEditModal(reservation)}>
                          Edit
                        </button>
                      </td>
                    </>
                  )}

                  {/* Past */}
                  {activeTab === "past" && (
                    <>
                      <td><strong>{reservation.bookingReference}</strong></td>
                      <td>{reservation.guestName}</td>
                      <td><strong>{reservation.roomNumber || "—"}</strong></td>
                      <td>{stayPeriod}</td>
                      <td style={{ fontWeight: '500' }}>{formatFCFA(calculateTotalWithTaxes(reservation))}</td>
                      <td>
                        {(() => {
                          const total = calculateTotalWithTaxes(reservation);
                          const outstanding = total - (reservation.amountPaid || 0);
                          const status = outstanding <= 0 ? 'Payé' : outstanding < total ? 'Partiel' : 'Impayé';
                          const statusColor = outstanding <= 0 ? '#10b981' : outstanding < total ? '#f59e0b' : '#dc2626';
                          return (
                            <span style={{ 
                              color: statusColor, 
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {status}
                              {outstanding > 0 && (
                                <span style={{ fontSize: '0.85em', fontWeight: '400' }}>
                                  ({formatFCFA(outstanding)} dû)
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="action-buttons">
                        <button className="action-btn ghost" onClick={() => openViewModal(reservation)}>
                          View
                        </button>
                        <button className="action-btn" onClick={() => handleViewReceipt(reservation)}>
                          Receipt
                        </button>
                      </td>
                    </>
                  )}

                  {/* Cancelled */}
                  {activeTab === "cancelled" && (
                    <>
                      <td><strong>{reservation.bookingReference}</strong></td>
                      <td>{reservation.guestName}</td>
                      <td>{reservation.roomType}</td>
                      <td>{stayPeriod}</td>
                      <td>
                        <span className={`status-badge ${getStatusInfo(reservation.status).class}`}>
                          {getStatusInfo(reservation.status).text}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button className="action-btn ghost" onClick={() => openViewModal(reservation)}>
                          View
                        </button>
                        {/* Delete button - Admin Only */}
                        {isAdmin && (
                          <button className="action-btn warn" onClick={() => handleDeleteReservation(reservation)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </>
                  )}

                  {/* All */}
                  {activeTab === "all" && (
                    <>
                      <td><strong>{reservation.bookingReference}</strong></td>
                      <td>{reservation.guestName}</td>
                      <td>{reservation.roomNumber || "—"}</td>
                      <td>{checkInFormatted}</td>
                      <td>{checkOutFormatted}</td>
                      <td>
                        <span className={`status-badge ${getStatusInfo(reservation.status).class}`}>
                          {getStatusInfo(reservation.status).text}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <div className="menu-container">
                          <ActionMenuButton
                            buttonRef={(el) => (triggerRefs.current[reservation.id] = el)}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(reservation.id, e);
                              // Auto-focus first menu item after opening
                              setTimeout(() => {
                                const menu = menuRefs.current[reservation.id];
                                menu?.querySelector('button:not(:disabled)')?.focus();
                              }, 50);
                            }}
                            isActive={activeMenu === reservation.id}
                          />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {filteredReservations.length === 0 && (
              <tr>
                <td colSpan="20" style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', color: '#333' }}>
                    No reservations found
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    {searchTerm ? `No results match "${searchTerm}"` : `No ${activeTab === 'all' ? '' : activeTab} reservations at this time`}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Render dropdown menu as portal at document level */}
        {activeMenu && (
          <>
            {/* Mobile backdrop */}
            <div 
              className="dropdown-backdrop" 
              onClick={closeMenu}
              aria-hidden="true"
            />
            
            <div 
              className="dropdown-menu" 
              ref={(el) => (menuRefs.current[activeMenu] = el)}
              role="menu"
              aria-label="Reservation actions"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  closeMenu();
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  const buttons = e.currentTarget.querySelectorAll('button:not(:disabled)');
                  const currentIndex = Array.from(buttons).indexOf(document.activeElement);
                  const nextIndex = e.key === 'ArrowDown' 
                    ? (currentIndex + 1) % buttons.length 
                    : (currentIndex - 1 + buttons.length) % buttons.length;
                  buttons[nextIndex]?.focus();
                }
              }}
            >
              {(() => {
                const reservation = filteredReservations.find(r => r.id === activeMenu);
                if (!reservation) return null;
                
                return (
                  <>
                                <button 
                                  onClick={() => handleAction(() => openViewModal(reservation), 'view')}
                                  role="menuitem"
                                  tabIndex={0}
                                  disabled={isActionLoading('view')}
                                >
                                  <MdVisibility /> 
                                  <span>View Details</span>
                                  <span className="keyboard-hint">Enter</span>
                                </button>
                                <button 
                                  onClick={() => handleAction(() => openEditModal(reservation), 'edit')}
                                  disabled={reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW' || reservation.status === 'CHECKED_OUT' || isActionLoading('edit')}
                                  data-tooltip="Cannot edit completed/cancelled/no-show reservations"
                                  role="menuitem"
                                  tabIndex={-1}
                                >
                                  <MdEdit /> 
                                  <span>Edit</span>
                                  <span className="keyboard-hint">E</span>
                                </button>
                                <div className="menu-divider"></div>
                                <button 
                                  className="cancel-option" 
                                  onClick={() => handleAction(() => handleCancelReservation(reservation), 'cancel')}
                                  disabled={reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW' || reservation.status === 'CHECKED_OUT' || isActionLoading('cancel')}
                                  data-tooltip="Already cancelled, no-show, or checked out"
                                  role="menuitem"
                                  tabIndex={-1}
                                >
                                  <MdClose /> 
                                  <span>Cancel Reservation</span>
                                  {isActionLoading('cancel') && <span className="keyboard-hint">...</span>}
                                </button>
                                {/* Delete Permanently - Admin Only */}
                                {isAdmin && (
                                  <button 
                                    className="delete-option" 
                                    onClick={() => handleAction(() => handleDeleteReservation(reservation), 'delete')}
                                    role="menuitem"
                                    tabIndex={-1}
                                    disabled={isActionLoading('delete')}
                                  >
                                    <MdDelete /> 
                                    <span>Delete Permanently</span>
                                    {isActionLoading('delete') && <span className="keyboard-hint">...</span>}
                                  </button>
                                )}
                  </>
                );
              })()}
            </div>
          </>
        )}
        
        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredReservations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="reservations"
        />
      </div>

      {/* ---------- Modals ---------- */}

      {/* Add Reservation */}
      {showAddModal && (
        <AddReservationModal
          open={true}
          onClose={() => closeModal('Add')}
          onSubmitSuccess={(row) => {
            addReservation(row);
            setActiveTab("all");
            closeModal('Add');
          }}
        />
      )}

      {/* Edit Reservation */}
      {showEditModal && currentReservation && (
        <EditReservationModal
          open={true}
          reservation={currentReservation}
          onClose={() => closeModal('Edit')}
          onSave={handleEditReservation}
          onAssignRoom={(reservation) => {
            closeModal('Edit');
            openModal('AssignRoom', reservation);
          }}
        />
      )}

      {/* View Reservation */}
      {showViewModal && currentReservation && (
        <ViewReservationModal
          open={true}
          reservation={currentReservation}
          currentTab={activeTab}
          onClose={() => closeModal('View')}
          onConfirm={handleConfirmReservation}
          onCheckIn={() => {
            closeModal('View');
            openModal('CheckIn', currentReservation);
          }}
          onAssignRoom={() => {
            closeModal('View');
            openModal('AssignRoom', currentReservation);
          }}
          onCheckOut={() => {
            closeModal('View');
            openModal('Checkout', currentReservation);
          }}
          onAddCharge={() => {
            openModal('Charge', currentReservation, true);
          }}
          onRecordPayment={() => {
            openModal('Payment', currentReservation, true);
          }}
          onEdit={() => {
            closeModal('View');
            openModal('Edit', currentReservation);
          }}
          onViewReceipt={handleViewReceipt}
          onRefreshParent={async () => {
            // Refresh currentReservation when payment/charge is deleted
            try {
              const { fetchReservationById } = await import('../../api/reservations');
              const freshReservation = await fetchReservationById(currentReservation.id);
              setModalState(prev => ({
                ...prev,
                currentReservation: { ...freshReservation, _refreshKey: Date.now() }
              }));
              refetch();
            } catch (error) {
              console.error('Error refreshing reservation:', error);
            }
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && currentReservation && (
        <PaymentModal
          open={true}
          reservation={currentReservation}
          onClose={() => closeModal('Payment')}
          onSubmit={async (paymentData) => {
            try {
              // Import API function
              const { recordPayment: recordPaymentAPI, fetchReservationById } = await import('../../api/reservations');
              
              // Call backend API to record payment
              const updatedBooking = await recordPaymentAPI(currentReservation.id, paymentData);
              
              // Fetch fresh data from backend immediately
              const freshReservation = await fetchReservationById(updatedBooking.id);
              
              const refreshKey = Date.now();
              console.log('💰 Payment recorded - updating parent state');
              console.log('   Fresh amountPaid:', freshReservation.amountPaid);
              console.log('   Fresh totalPrice:', freshReservation.totalPrice);
              console.log('   _refreshKey:', refreshKey);
              
              // Update currentReservation state immediately (for both ViewModal and PaymentModal)
              setModalState(prev => ({
                ...prev,
                currentReservation: { ...freshReservation, _refreshKey: refreshKey }
              }));
              
              // Refresh the reservations list from backend
              refetch();
              
              closeModal('Payment');
              
              const amt = parseFloat(paymentData.amount);
              toast.success(`Payment of ${amt.toLocaleString()} FCFA recorded successfully`);
            } catch (error) {
              console.error('Error recording payment:', error);
              const errorMsg = error?.response?.data || error?.response?.data?.message || error?.message || 'Failed to record payment';
              toast.error(errorMsg);
            }
          }}
        />
      )}

      {showCheckInModal && reservationToCheckIn && (
        <CheckInConfirmModal
          reservation={reservationToCheckIn}
          onClose={() => closeModal('CheckIn')}
          onConfirm={confirmCheckIn}
        />
      )}

      {/* Check-out Confirm */}
      {showCheckoutConfirmModal && checkoutReservation && (
        <CheckOutConfirmModal
          open={true}
          reservation={checkoutReservation}
          onClose={() => closeModal('CheckoutConfirm')}
          onConfirm={confirmCheckOut}
        />
      )}

      {/* Assign Room Modal */}
      {showAssignRoomModal && reservationToAssign && (
        <AssignRoomModal
          open={true}
          reservation={reservationToAssign}
          availableRooms={availableRooms}
          onClose={() => closeModal('AssignRoom')}
          onAssign={assignRoomToReservation}
        />
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />

      {/* Receipt Modal */}
      {showReceiptModal && currentReservation && (
        <ReceiptModal
          open={true}
          reservation={currentReservation}
          onClose={() => closeModal('Receipt')}
        />
      )}
    </div>
  );
}

export default Reservations;
