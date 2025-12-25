import { useState, useMemo, useEffect, useCallback } from "react";
import { sortReservations } from "../utils/sort";
import { getReservationsByTab } from '../../../../api/reservations';
import { useTaxCalculation } from '../../../../hooks/useTaxCalculation';
import { nightsBetweenYmd } from '../../../../lib/dates';
import { useRooms } from '../../../../context/RoomContext';

export function useReservations(today, initialTab = 'Pending') {
  const { calculateTaxes } = useTaxCalculation();
  const { getRoomPrice } = useRooms();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [lastFetchedTab, setLastFetchedTab] = useState(null);
  
  // Helper function to calculate total with taxes
  // FIXED: Only calculate taxes for active reservations, not past/completed ones
  const calculateTotalWithTaxes = useCallback((reservation) => {
    // FIXED: For past reservations (checked out, cancelled, or no-show), use stored totalPrice
    const isPastReservation = ['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(reservation?.status);
    
    if (isPastReservation) {
      // Use stored totalPrice (original amount charged - no retroactive taxes)
      return reservation?.totalPrice || 0;
    }
    
    // For active reservations, calculate with current taxes
    const checkInDate = reservation?.checkInDate || reservation?.checkIn?.slice(0, 10) || '';
    const checkOutDate = reservation?.checkOutDate || reservation?.checkOut?.slice(0, 10) || '';
    const nights = nightsBetweenYmd(checkInDate, checkOutDate) || 0;
    const roomPrice = reservation?.roomPrice || reservation?.pricePerNight || (reservation?.roomType ? getRoomPrice(reservation.roomType) : 0);
    const taxBreakdown = roomPrice && nights ? calculateTaxes(roomPrice, nights, 0) : null;
    return taxBreakdown ? taxBreakdown.grandTotal : (reservation?.totalPrice || 0);
  }, [calculateTaxes, getRoomPrice]);
  
  // Fetch reservations from backend API by tab
  const fetchReservationsByTab = useCallback(async (tab) => {
    if (!tab) return; // Don't fetch if no tab specified
    
    try {
      setLoading(true);
      setLastFetchedTab(tab);
      const data = await getReservationsByTab(tab);
        
        // Transform backend data to match frontend format
        const transformedData = data.map(booking => ({
          id: booking.id,
          bookingReference: booking.bookingReference,
          reference: booking.bookingReference, // Alias for compatibility
          status: booking.status,
          checkIn: booking.checkInDate, // Map to checkIn for compatibility
          checkOut: booking.checkOutDate, // Map to checkOut for compatibility
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          checkInTime: booking.checkInTime,
          checkOutTime: booking.checkOutTime,
          adults: booking.adults,
          kids: booking.kids || 0,
          guests: {
            adults: booking.adults,
            kids: booking.kids || 0
          },
          roomType: booking.roomType,
          roomNumber: booking.roomNumber,
          roomId: booking.roomId,
          guestName: booking.guestName,
          email: booking.guestEmail, // Map to email for modal
          guestEmail: booking.guestEmail,
          phone: booking.guestPhone, // Map to phone for modal
          guestPhone: booking.guestPhone,
          totalPrice: booking.totalPrice,
          pricePerNight: booking.pricePerNight,
          amountPaid: booking.amountPaid || 0,
          roomPrice: booking.pricePerNight, // Add room price for charges calculation
          specialRequest: booking.specialRequests || '', // Map to specialRequest for modal
          specialRequests: booking.specialRequests || '',
          address: {
            line1: booking.address,
            city: booking.city,
            postalCode: booking.zipCode,
            state: '',
            line2: ''
          },
          city: booking.city,
          zipCode: booking.zipCode,
          country: booking.country,
          source: booking.source || 'WEB',
          paymentMethod: 'Cash', // Default
          paymentStatus: 'Pending',
          createdAt: booking.createdAt,
          // Status change timestamps
          confirmedAt: booking.confirmedAt,
          checkedInAt: booking.checkedInAt,
          checkedOutAt: booking.checkedOutAt,
          cancelledAt: booking.cancelledAt,
          // Additional charges
          chargesJson: booking.chargesJson || null
        }));
        
        setReservations(transformedData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        setError('Failed to load reservations from backend.');
        setReservations([]);
      } finally {
        setLoading(false);
      }
  }, []);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchReservationsByTab(currentTab);
  }, [currentTab, fetchReservationsByTab]);

  const addReservation = (r) => setReservations(prev => [...prev, r]);
  const editReservation = (updated) =>
    setReservations(prev => prev.map(x => x.id === updated.id ? updated : x));
  const checkIn = (id, timeStr) =>
    setReservations(prev => prev.map(x => x.id === id ? { ...x, status: "CHECKED_IN", checkInTime: timeStr } : x));
  const checkOut = (id, timeStr) =>
    setReservations(prev => prev.map(x => x.id === id ? { ...x, status: "CHECKED_OUT", checkOutTime: timeStr } : x));
  const cancelReservation = (id, dateStr) =>
    setReservations(prev => prev.map(x => x.id === id ? { ...x, status: "CANCELLED", cancellationDate: dateStr } : x));
  const assignRoom = (id, roomNumber) =>
    setReservations(prev => prev.map(x => x.id === id ? { ...x, roomNumber } : x));
  const addCharge = (id, amount) =>
    setReservations(prev => prev.map(x => x.id === id ? { ...x, totalPrice: Number(x.totalPrice || 0) + Number(amount) } : x));
  
  const deleteReservation = (id) =>
    setReservations(prev => prev.filter(x => x.id !== id));

  const api = { 
    reservations,
    loading,
    error,
    addReservation, 
    editReservation, 
    checkIn, 
    checkOut, 
    cancelReservation, 
    assignRoom, 
    addCharge, 
    deleteReservation,
    sortConfig, 
    setSortConfig,
    currentTab,
    setCurrentTab
  };

  const selectors = {
    getView: (activeTab, filterStatus, searchTerm) => {
      // Update current tab if changed and trigger refetch
      if (activeTab && activeTab !== currentTab) {
        setCurrentTab(activeTab);
      }
      
      // If we haven't fetched this tab yet, or tab changed, return empty while loading
      if (activeTab !== lastFetchedTab && loading) {
        return [];
      }
      
      // Apply status filter and search filter (backend handles tab filtering)
      let filtered = reservations;
      
      // Filter by status if not "All"
      if (filterStatus && filterStatus !== "All") {
        filtered = filtered.filter(r => r.status === filterStatus);
      }
      
      // Filter by search term
      if (searchTerm && searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(r => {
          const guestName = (r.guestName || "").toLowerCase();
          const reference = (r.reference || "").toLowerCase();
          const roomNumber = (r.roomNumber || "").toLowerCase();
          const roomType = (r.roomType || "").toLowerCase();
          
          return guestName.includes(term) || 
                 reference.includes(term) || 
                 roomNumber.includes(term) || 
                 roomType.includes(term);
        });
      }
      
      return sortReservations(filtered, api.sortConfig);
    },
    fetchReservationsByTab,
    refetch: () => {
      if (currentTab) {
        fetchReservationsByTab(currentTab);
      }
    }
  };

  return { ...api, ...selectors, calculateTotalWithTaxes };
}
