import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './components/dashboard-minimal.css';
import '../../components/charts/charts.css';
import '../../features/reservations/components/reservation-statistic.css';
import '../../components/charts/pro-charts.css';
import { getDashboardStats } from '../../api/dashboard';
import { toast } from '../../utils/toast';
import eventBus, { EVENTS } from '../../utils/eventBus';
import { 
  MdCalendarToday, 
  MdHotel, 
  MdMeetingRoom, 
  MdPeople,
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdCheckCircle,
  MdExitToApp,
  MdPayment,
  MdPersonAdd,
  MdBuild,
  MdAdd,
  MdLogin,
  MdLogout,
  MdReport,
  MdAttachMoney,
  MdShowChart,
  MdWarning,
  MdCancel,
  MdEventBusy,
  MdNotifications,
  MdCreditCard,
  MdAssignment,
  MdStar,
  MdCleaningServices,
  MdEventAvailable
} from 'react-icons/md';
import ReservationStatisticChart from '../../components/charts/ReservationStatisticChart';
import RoomStatsPieChart from '../../components/charts/RoomStatsPieChart';
import { useRole } from '../../hooks/useRole';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [stats, setStats] = useState({
    totalReservations: 0,
    newReservationsLastWeek: 0,
    availableRooms: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    todaysCheckIns: 0,
    expectedCheckIns: 0,
    todaysCheckOuts: 0,
    upcomingArrivals: 0,
    upcomingDepartures: 0,
    pendingReservations: 0,
    needsRoomAssignment: 0,
    // Revenue metrics
    todaysRevenue: 0,
    todaysRevenueChange: 0,
    monthlyRevenue: 0,
    monthlyRevenueChange: 0,
    avgDailyRate: 0,
    adrChange: 0,
    revPAR: 0,
    revPARChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [arrivals, setArrivals] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(new Set());

  // Handle quick checkout from alert
  const handleQuickCheckout = async (bookingId) => {
    if (processingCheckout.has(bookingId)) return;
    
    setProcessingCheckout(prev => new Set(prev).add(bookingId));
    
    try {
      const response = await fetch(`http://localhost:8080/api/admin/bookings/${bookingId}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        toast.success('Guest checked out successfully');
        // Refresh alerts and stats
        const fetchAlerts = async () => {
          try {
            const response = await fetch('http://localhost:8080/api/admin/dashboard/alerts');
            if (response.ok) {
              const data = await response.json();
              setAlerts(data);
            }
          } catch (error) {
            console.error('Error refreshing alerts:', error);
          }
        };
        fetchAlerts();
        
        // Trigger event to refresh stats
        eventBus.emit(EVENTS.GUEST_CHECKED_OUT);
      } else {
        const errorText = await response.text();
        toast.error(`Failed to checkout: ${errorText}`);
      }
    } catch (error) {
      console.error('Error checking out guest:', error);
      toast.error('Failed to checkout guest');
    } finally {
      setProcessingCheckout(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // FIXED: Refresh stats every 5 minutes (reduced from 30s for better performance)
    const interval = setInterval(fetchStats, 300000);

    
    // Listen for check-in/check-out events to refresh immediately
    const unsubscribeCheckIn = eventBus.on(EVENTS.GUEST_CHECKED_IN, () => {
      console.log('📊 Dashboard: Guest checked in, refreshing stats...');
      fetchStats();
    });
    
    const unsubscribeCheckOut = eventBus.on(EVENTS.GUEST_CHECKED_OUT, () => {
      console.log('📊 Dashboard: Guest checked out, refreshing stats...');
      fetchStats();
    });
    
    return () => {
      clearInterval(interval);
      unsubscribeCheckIn();
      unsubscribeCheckOut();
    };
  }, []);

  // Fetch today's schedule (arrivals, departures, and pending)
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setScheduleLoading(true);
        const [arrivalsRes, departuresRes, pendingRes] = await Promise.all([
          fetch('http://localhost:8080/api/admin/dashboard/todays-arrivals'),
          fetch('http://localhost:8080/api/admin/dashboard/todays-departures'),
          fetch('http://localhost:8080/api/admin/dashboard/pending-bookings')
        ]);
        
        if (arrivalsRes.ok) {
          const arrivalsData = await arrivalsRes.json();
          setArrivals(arrivalsData);
        }
        
        if (departuresRes.ok) {
          const departuresData = await departuresRes.json();
          setDepartures(departuresData);
        }
        
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingBookings(pendingData);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
    // FIXED: Refresh schedule every 5 minutes (reduced from 2min for better performance)
    const interval = setInterval(fetchSchedule, 300000);
    return () => clearInterval(interval);
  }, []);

  // Fetch alerts and notifications
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setAlertsLoading(true);
        const response = await fetch('http://localhost:8080/api/admin/dashboard/alerts');
        
        if (response.ok) {
          const alertsData = await response.json();
          setAlerts(alertsData);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
    // FIXED: Refresh alerts every 2 minutes (reduced from 1min for better performance)
    const interval = setInterval(fetchAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent activity
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setActivityLoading(true);
        const limit = showAllActivity ? 50 : 10;
        const response = await fetch(`http://localhost:8080/api/admin/dashboard/recent-activity?limit=${limit}`);
        
        if (response.ok) {
          const activityData = await response.json();
          setRecentActivity(activityData);
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
    // FIXED: Refresh activity every 5 minutes (reduced from 2min for better performance)
    const interval = setInterval(fetchActivity, 300000);
    return () => clearInterval(interval);
  }, [showAllActivity]);

  // Format FCFA currency
  const formatFCFA = (amount) => {
    if (amount == null) return '0 FCFA';
    if (amount < 0) {
      console.warn('Negative revenue detected:', amount);
      return '0 FCFA';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  };

  // Translate alert messages to French
  const translateAlertTitle = (title) => {
    const translations = {
      'Room Assignment Needed': 'Attribution de Chambre Requise',
      'Payment Pending': 'Paiement en Attente',
      'Overdue Checkout': 'Départ en Retard',
      'Maintenance Required': 'Maintenance Requise',
      'Low Inventory': 'Stock Faible',
      'Guest Complaint': 'Plainte Client'
    };
    return translations[title] || title;
  };

  const translateAlertMessage = (message) => {
    // Common patterns to translate
    const patterns = [
      { en: /(\d+) reservation(?:s)? for today\/tomorrow need room assignment/, fr: (match) => `${match[1]} réservation${match[1] > 1 ? 's' : ''} pour aujourd'hui/demain nécessite${match[1] > 1 ? 'nt' : ''} une attribution de chambre` },
      { en: /(\d+) guest(?:s)? (?:has|have) overdue checkout/, fr: (match) => `${match[1]} client${match[1] > 1 ? 's' : ''} ${match[1] > 1 ? 'ont' : 'a'} un départ en retard` },
      { en: /(\d+) payment(?:s)? pending/, fr: (match) => `${match[1]} paiement${match[1] > 1 ? 's' : ''} en attente` },
      { en: /Room (\d+) requires maintenance/, fr: (match) => `La chambre ${match[1]} nécessite une maintenance` },
      { en: /(\d+) room(?:s)? need(?:s)? cleaning/, fr: (match) => `${match[1]} chambre${match[1] > 1 ? 's' : ''} nécessite${match[1] > 1 ? 'nt' : ''} un nettoyage` }
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern.en);
      if (match) {
        return pattern.fr(match);
      }
    }
    
    return message; // Return original if no translation found
  };

  // Translate activity descriptions to French
  const translateActivityDescription = (description) => {
    const patterns = [
      { en: /Check-out completed for Room (\d+)/, fr: (match) => `Check-out complété pour la Chambre ${match[1]}` },
      { en: /Check-in completed for Room (\d+)/, fr: (match) => `Check-in complété pour la Chambre ${match[1]}` },
      { en: /New reservation created for Room (\d+)/, fr: (match) => `Nouvelle réservation créée pour la Chambre ${match[1]}` },
      { en: /New reservation created for room assignment pending/, fr: () => `Nouvelle réservation créée en attente d'attribution de chambre` },
      { en: /Reservation confirmed for (.+)/, fr: (match) => `Réservation confirmée pour ${match[1]}` },
      { en: /Reservation cancelled for (.+)/, fr: (match) => `Réservation annulée pour ${match[1]}` },
      { en: /Guest no-show for (.+)/, fr: (match) => `Absence du client ${match[1]}` },
      { en: /Payment received for (.+)/, fr: (match) => `Paiement reçu pour ${match[1]}` },
      { en: /Room (\d+) assigned to (.+)/, fr: (match) => `Chambre ${match[1]} attribuée à ${match[2]}` }
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern.en);
      if (match) {
        return pattern.fr(match);
      }
    }
    
    return description; // Return original if no translation found
  };

  // Format timestamp to relative time (using Chad timezone)
  const formatTimeAgo = (timestamp) => {
    // Parse the timestamp from backend (already in Chad timezone with +01:00 offset)
    const alertTime = new Date(timestamp);
    
    // Get current time
    const now = new Date();
    
    // Calculate difference (both are in UTC internally, so this works correctly)
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  // Get alert icon based on type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'overdue_checkout':
        return <MdWarning />;
      case 'payment_pending':
        return <MdPayment />;
      case 'room_assignment':
        return <MdAssignment />;
      case 'maintenance':
        return <MdBuild />;
      default:
        return <MdNotifications />;
    }
  };

  // Get activity icon based on type
  const getActivityIcon = (icon) => {
    switch (icon) {
      case 'reservation':
        return <MdCheckCircle />;
      case 'checkin':
        return <MdLogin />;
      case 'checkout':
        return <MdExitToApp />;
      case 'confirmed':
        return <MdCheckCircle />;
      case 'cancelled':
        return <MdCancel />;
      case 'noshow':
        return <MdEventBusy />;
      default:
        return <MdCheckCircle />;
    }
  };

  // Format time for activity (24-hour format: 4:16 in Chad timezone)
  const formatActivityTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      timeZone: 'Africa/Ndjamena',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Get trend icon and class
  const getTrendDisplay = (change) => {
    if (change == null) {
      return { icon: null, className: 'neutral', text: 'N/A' };
    }
    if (change > 0) {
      return { icon: <MdTrendingUp size={14} />, className: 'positive', text: `+${change}%` };
    } else if (change < 0) {
      return { icon: <MdTrendingDown size={14} />, className: 'negative', text: `${change}%` };
    }
    // Exactly 0 - stable
    return { icon: <MdTrendingFlat size={14} />, className: 'neutral', text: '0% (stable)' };
  };

  // Quick action handlers
  const handleNewReservation = () => {
    navigate('/reservations?action=new');
  };

  const handleQuickCheckIn = () => {
    navigate('/reservations?tab=arrivals');
  };

  const handleQuickCheckOut = () => {
    navigate('/reservations?tab=departures');
  };

  const handleReportIssue = () => {
    navigate('/helpdesk');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Tableau de Bord</h1>
          <p className="dashboard-subtitle">Bienvenue! Voici ce qui se passe aujourd'hui.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="quick-action-btn primary" onClick={handleNewReservation}>
          <div className="action-icon">
            <MdAdd />
          </div>
          <span>Nouvelle Réservation</span>
        </button>
        <button className="quick-action-btn success" onClick={handleQuickCheckIn}>
          <div className="action-icon">
            <MdLogin />
          </div>
          <span>Check-in Rapide</span>
        </button>
        <button className="quick-action-btn info" onClick={handleQuickCheckOut}>
          <div className="action-icon">
            <MdLogout />
          </div>
          <span>Check-out Rapide</span>
        </button>
        <button className="quick-action-btn warning" onClick={handleReportIssue}>
          <div className="action-icon">
            <MdReport />
          </div>
          <span>Signaler un Problème</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats">
        <div className="stat-card reservation-card">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <MdCalendarToday />
            </div>
            <div className="stat-content">
              <h3>Réservations Totales</h3>
              <div className="stat-value-row">
                <p className="stat-number">{stats.totalReservations || 0}</p>
                {stats.newReservationsLastWeek > 0 && (
                  <span className="stat-trend positive">
                    <MdTrendingUp size={16} />
                    +{stats.newReservationsLastWeek}
                  </span>
                )}
              </div>
              <p className="stat-description">
                {stats.newReservationsLastWeek > 0 
                  ? `+${stats.newReservationsLastWeek} depuis la semaine dernière`
                  : 'Aucune nouvelle réservation cette semaine'}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card available-card">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <MdHotel />
            </div>
            <div className="stat-content">
              <h3>Chambres Disponibles</h3>
              <div className="stat-value-row">
                <p className="stat-number">{stats.availableRooms || 0}</p>
              </div>
              <p className="stat-description">Sur {stats.totalRooms || 0} au total</p>
            </div>
          </div>
        </div>
        <div className="stat-card occupied-card">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <MdMeetingRoom />
            </div>
            <div className="stat-content">
              <h3>Chambres Occupées</h3>
              <div className="stat-value-row">
                <p className="stat-number">{stats.occupiedRooms || 0}</p>
              </div>
              <p className="stat-description">
                {stats.occupancyRate != null ? Math.round(stats.occupancyRate) : 0}% taux d'occupation
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card checkin-card">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <MdPeople />
            </div>
            <div className="stat-content">
              <h3>Check-ins d'Aujourd'hui</h3>
              <div className="stat-value-row">
                <p className="stat-number">{stats.todaysCheckIns || 0}</p>
                {(() => {
                  const currentHour = new Date().getHours();
                  const isLateInDay = currentHour >= 18; // After 6 PM
                  const hasMissingCheckIns = stats.todaysCheckIns < stats.expectedCheckIns;
                  return isLateInDay && hasMissingCheckIns && (
                    <span className="stat-trend warning">
                      <MdWarning size={16} />
                    </span>
                  );
                })()}
              </div>
              <p className="stat-description">{stats.expectedCheckIns || 0} attendus au total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Metrics - Admin Only */}
      {isAdmin && (
        <div className="revenue-metrics">
          <div className="revenue-card">
            <div className="revenue-icon">
              <MdAttachMoney />
            </div>
            <div className="revenue-content">
              <h4>Revenus d'Aujourd'hui</h4>
              <div className="revenue-amount">
                {stats.todaysRevenue != null ? formatFCFA(stats.todaysRevenue) : 'Chargement...'}
              </div>
              <div className={`revenue-change ${getTrendDisplay(stats.todaysRevenueChange).className}`}>
                {getTrendDisplay(stats.todaysRevenueChange).icon}
                <span>{getTrendDisplay(stats.todaysRevenueChange).text} vs hier</span>
              </div>
            </div>
          </div>
          <div className="revenue-card">
            <div className="revenue-icon">
              <MdShowChart />
            </div>
            <div className="revenue-content">
              <h4>Revenus Mensuels</h4>
              <div className="revenue-amount">
                {stats.monthlyRevenue != null ? formatFCFA(stats.monthlyRevenue) : 'Chargement...'}
              </div>
              <div className={`revenue-change ${getTrendDisplay(stats.monthlyRevenueChange).className}`}>
                {getTrendDisplay(stats.monthlyRevenueChange).icon}
                <span>{getTrendDisplay(stats.monthlyRevenueChange).text} vs mois dernier</span>
              </div>
            </div>
          </div>
          <div className="revenue-card">
            <div className="revenue-icon">
              <MdCreditCard />
            </div>
            <div className="revenue-content">
              <h4>Tarif Moyen Journalier</h4>
              <div className="revenue-amount">
                {stats.avgDailyRate != null ? formatFCFA(stats.avgDailyRate) : 'Chargement...'}
              </div>
              <div className={`revenue-change ${getTrendDisplay(stats.adrChange).className}`}>
                {getTrendDisplay(stats.adrChange).icon}
                <span>{getTrendDisplay(stats.adrChange).text} vs semaine dernière</span>
              </div>
            </div>
          </div>
          <div className="revenue-card">
            <div className="revenue-icon">
              <MdStar />
            </div>
            <div className="revenue-content">
              <h4>RevPAR</h4>
              <div className="revenue-amount">
                {stats.revPAR != null ? formatFCFA(stats.revPAR) : 'Chargement...'}
              </div>
              <div className={`revenue-change ${getTrendDisplay(stats.revPARChange).className}`}>
                {getTrendDisplay(stats.revPARChange).icon}
                <span>{getTrendDisplay(stats.revPARChange).text} vs mois dernier</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">
        {/* Charts Section */}
        <div className="dashboard-charts">
          <div className="chart-card reservation-statistic-chart">
            <ReservationStatisticChart />
          </div>
          <div className="chart-card pie-chart">
            <RoomStatsPieChart />
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="todays-schedule">
          <div className="schedule-header">
            <h2>Programme d'Aujourd'hui</h2>
            <span className="schedule-date">{new Date().toLocaleDateString('fr-FR', { timeZone: 'Africa/Ndjamena', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          
          {/* Arrivals Section */}
          <div className="schedule-section">
            <div className="schedule-section-header">
              <MdLogin className="section-icon" />
              <h3>Arrivées ({arrivals.length})</h3>
            </div>
            <div className="schedule-list">
              {scheduleLoading ? (
                <div className="schedule-loading">Chargement des arrivées...</div>
              ) : arrivals.length === 0 ? (
                <div className="schedule-empty">Aucune arrivée prévue aujourd'hui</div>
              ) : (
                arrivals.map((arrival) => (
                  <div key={arrival.id} className="schedule-item">
                    <div className="schedule-time">
                      {arrival.checkInTime ? arrival.checkInTime.substring(0, 5) : '--:--'}
                    </div>
                    <div className="schedule-details">
                      <div className="schedule-guest">{arrival.guestName || 'Nom non disponible'}</div>
                      <div className="schedule-room">
                        {arrival.roomNumber || 'Non assignée'} • {arrival.nights || 0} nuit{(arrival.nights || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className={`schedule-status ${arrival.status.toLowerCase()}`}>
                      {arrival.status === 'CHECKED_IN' ? 'Enregistré' : 
                       arrival.status === 'CONFIRMED' ? 'Confirmé' : 
                       arrival.status === 'PENDING' ? 'En attente' : arrival.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Departures Section */}
          <div className="schedule-section">
            <div className="schedule-section-header">
              <MdLogout className="section-icon" />
              <h3>Départs ({departures.length})</h3>
            </div>
            <div className="schedule-list">
              {scheduleLoading ? (
                <div className="schedule-loading">Chargement des départs...</div>
              ) : departures.length === 0 ? (
                <div className="schedule-empty">Aucun départ prévu aujourd'hui</div>
              ) : (
                departures.map((departure) => (
                  <div key={departure.id} className="schedule-item">
                    <div className="schedule-time">
                      {departure.checkOutTime ? departure.checkOutTime.substring(0, 5) : '--:--'}
                    </div>
                    <div className="schedule-details">
                      <div className="schedule-guest">{departure.guestName || 'Nom non disponible'}</div>
                      <div className="schedule-room">{departure.roomNumber || 'Non assignée'}</div>
                    </div>
                    <div className={`schedule-status ${departure.status.toLowerCase()}`}>
                      {departure.status === 'CHECKED_OUT' ? 'Départ effectué' : 
                       departure.status === 'CHECKED_IN' ? 'En chambre' : departure.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Bookings Section */}
          <div className="schedule-section">
            <div className="schedule-section-header">
              <MdAssignment className="section-icon" />
              <h3>Réservations en Attente ({pendingBookings.length})</h3>
            </div>
            <div className="schedule-list">
              {scheduleLoading ? (
                <div className="schedule-loading">Chargement des réservations en attente...</div>
              ) : pendingBookings.length === 0 ? (
                <div className="schedule-empty">Aucune réservation en attente</div>
              ) : (
                pendingBookings.map((booking) => (
                  <div key={booking.id} className="schedule-item">
                    <div className="schedule-time">
                      {booking.daysUntilCheckIn === 0 ? 'Aujourd\'hui' : 
                       booking.daysUntilCheckIn === 1 ? 'Demain' : 
                       booking.daysUntilCheckIn < 0 ? 'En retard' :
                       `${booking.daysUntilCheckIn} jours`}
                    </div>
                    <div className="schedule-details">
                      <div className="schedule-guest">{booking.guestName || 'Nom non disponible'}</div>
                      <div className="schedule-room">
                        {booking.roomNumber || 'Non assignée'} • {booking.nights || 0} nuit{(booking.nights || 0) !== 1 ? 's' : ''}
                        {booking.needsRoomAssignment && <span className="needs-assignment"> • Besoin de chambre</span>}
                      </div>
                    </div>
                    <div className="schedule-status pending">
                      En attente
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="alerts-panel">
          <div className="alerts-header">
            <h2>Alertes & Notifications</h2>
            {alerts.length > 0 && (
              <span className="alerts-count">{alerts.length}</span>
            )}
          </div>
          <div className="alerts-list">
            {alertsLoading ? (
              <div className="alerts-loading">Chargement des alertes...</div>
            ) : alerts.length === 0 ? (
              <div className="alerts-empty">
                <MdCheckCircle size={48} style={{ color: '#10B981', marginBottom: '1rem' }} />
                <p>Aucune alerte pour le moment</p>
                <span>Tout fonctionne parfaitement!</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`alert-item priority-${alert.priority}`}>
                  <div className="alert-icon">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="alert-content">
                    <div className="alert-title">{translateAlertTitle(alert.title)}</div>
                    <div className="alert-message">{translateAlertMessage(alert.message)}</div>
                    <div className="alert-time">{formatTimeAgo(alert.timestamp)}</div>
                  </div>
                  {alert.type === 'overdue_checkout' && alert.bookingId && (
                    <button
                      className="alert-action-btn"
                      onClick={() => handleQuickCheckout(alert.bookingId)}
                      disabled={processingCheckout.has(alert.bookingId)}
                      title="Check out guest"
                    >
                      {processingCheckout.has(alert.bookingId) ? (
                        <>
                          <MdCleaningServices size={16} />
                          <span>Traitement...</span>
                        </>
                      ) : (
                        <>
                          <MdLogout size={16} />
                          <span>Check Out</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-header">
          <h2>Activité Récente</h2>
          <button 
            className="view-all-btn"
            onClick={() => setShowAllActivity(!showAllActivity)}
          >
            {showAllActivity ? 'Voir Moins' : 'Voir Tout'}
          </button>
        </div>
        <div className="activity-list">
          {activityLoading ? (
            <div className="activity-loading">Chargement de l'activité...</div>
          ) : recentActivity.length === 0 ? (
            <div className="activity-empty">
              <p>Aucune activité récente à afficher</p>
              <span style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '8px' }}>Les dernières actions apparaîtront ici</span>
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.icon}-icon`}>
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="activity-content">
                  <p className="activity-desc">
                    {activity.description ? translateActivityDescription(activity.description) : 'Activité sans description'}
                  </p>
                  <div className="activity-meta">
                    <span className="activity-time">
                      {activity.timestamp ? formatActivityTime(activity.timestamp) : 'Date inconnue'}
                    </span>
                    <span className="activity-user">par {activity.user || 'Système'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
