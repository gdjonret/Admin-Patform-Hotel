import React, { useState, useEffect } from 'react';
import './reports-new.css';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  MdTrendingUp, MdTrendingDown, MdDownload, MdDateRange, 
  MdAttachMoney, MdPeople, MdHotel, MdAssessment, MdCalendarToday
} from 'react-icons/md';
import axios from 'axios';

// French translations
const TRANSLATIONS = {
  // Header
  title: "Rapports & Analyses",
  subtitle: "Aperçu complet des performances de votre hôtel",
  exportBtn: "Exporter le Rapport",
  
  // Filters
  reportType: "Type de Rapport",
  timePeriod: "Période",
  startDate: "Date de Début",
  endDate: "Date de Fin",
  generate: "Générer",
  
  // Report Types
  overview: "Vue d'ensemble",
  revenue: "Analyse des Revenus",
  occupancy: "Tendances d'Occupation",
  bookings: "Performance des Réservations",
  
  // Time Periods
  last7Days: "7 Derniers Jours",
  last30Days: "30 Derniers Jours",
  last90Days: "90 Derniers Jours",
  lastYear: "Dernière Année",
  customRange: "Période Personnalisée",
  
  // Metrics
  totalRevenue: "Revenu Total",
  totalBookings: "Réservations Totales",
  occupancyRate: "Taux d'Occupation",
  avgDailyRate: "Tarif Journalier Moyen",
  revPAR: "RevPAR",
  avgOccupancyRate: "Taux d'Occupation Moyen",
  totalRoomNights: "Nuitées Totales",
  availableRooms: "Chambres Disponibles",
  peakOccupancy: "Occupation Maximale",
  avgBookingValue: "Valeur Moyenne par Réservation",
  confirmedBookings: "Réservations Confirmées",
  pendingBookings: "Réservations en Attente",
  
  // Chart Titles
  revenueTrend: "Tendance des Revenus",
  revenueTrendSubtitle: "Performance quotidienne des revenus sur la période sélectionnée",
  bookingsTrend: "Tendance des Réservations",
  bookingsTrendSubtitle: "Volume quotidien des réservations",
  occupancyRateChart: "Taux d'Occupation",
  occupancyRateSubtitle: "Pourcentage d'occupation quotidien",
  topPerformingRooms: "Types de Chambres les Plus Performants",
  topPerformingRoomsSubtitle: "Répartition des revenus et réservations par catégorie de chambre",
  revenueTrendAnalysis: "Analyse de la Tendance des Revenus",
  revenueTrendAnalysisSubtitle: "Performance quotidienne des revenus avec détails",
  revenueBreakdown: "Répartition des Revenus par Type de Chambre",
  revenueBreakdownSubtitle: "Comparer les performances de revenus entre différentes catégories de chambres",
  dailyOccupancyTrend: "Tendance d'Occupation Quotidienne",
  dailyOccupancyTrendSubtitle: "Suivre le pourcentage d'occupation au fil du temps",
  occupancyByRoomType: "Occupation par Type de Chambre",
  occupancyByRoomTypeSubtitle: "Comparer les taux d'occupation entre les catégories de chambres",
  bookingVolumeTrend: "Tendance du Volume de Réservations",
  bookingVolumeTrendSubtitle: "Activité quotidienne des réservations sur la période sélectionnée",
  bookingPerformanceByRoom: "Performance des Réservations par Type de Chambre",
  bookingPerformanceByRoomSubtitle: "Catégories de chambres les plus populaires",
  
  // Table Headers
  roomType: "Type de Chambre",
  totalBookingsTable: "Réservations Totales",
  revenueGenerated: "Revenu Généré",
  avgRate: "Tarif Moyen",
  performance: "Performance",
  totalRooms: "Chambres Totales",
  occupied: "Occupées",
  occupancyRateTable: "Taux d'Occupation",
  avgStay: "Séjour Moyen (nuits)",
  avgBookingValueTable: "Valeur Moyenne par Réservation",
  popularity: "Popularité",
  
  // Messages
  vsLastPeriod: "vs période précédente",
  revenuePerRoom: "Revenu par chambre disponible",
  occupiedRoomNights: "Nuitées occupées",
  totalInventory: "Inventaire total",
  highestRateAchieved: "Taux le plus élevé atteint",
  perReservation: "Par réservation",
  confirmationRate: "taux de confirmation",
  awaitingConfirmation: "En attente de confirmation",
  generatingReport: "Génération du rapport...",
  noDataMessage: "Sélectionnez les filtres et cliquez sur Générer pour voir le rapport"
};

const Reports = () => {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('30days');
  
  // Set default dates to last 30 days
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };
  
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Remove auto-fetch - only fetch when user clicks "Générer"
  // useEffect removed to prevent unnecessary API calls
  
  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Calculate date range
      let end = new Date();
      let start = new Date();
      
      if (dateRange === '7days') {
        start.setDate(end.getDate() - 7);
      } else if (dateRange === '30days') {
        start.setDate(end.getDate() - 30);
      } else if (dateRange === '90days') {
        start.setDate(end.getDate() - 90);
      } else if (dateRange === '365days') {
        start.setDate(end.getDate() - 365);
      } else if (dateRange === 'custom') {
        if (!startDate || !endDate) {
          setError('Veuillez sélectionner les dates de début et de fin');
          setIsLoading(false);
          return;
        }
        start = new Date(startDate + 'T00:00:00');
        end = new Date(endDate + 'T23:59:59');
        const today = new Date();
        
        // Validate dates
        if (start > end) {
          setError('La date de début doit être avant la date de fin');
          setIsLoading(false);
          return;
        }
        if (end > today) {
          setError('La date de fin ne peut pas être dans le futur');
          setIsLoading(false);
          return;
        }
        // Limit to 2 years max
        const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
        if (daysDiff > 730) {
          setError('La période ne peut pas dépasser 2 ans');
          setIsLoading(false);
          return;
        }
      }
      
      // Format dates without timezone conversion
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatDate(start);
      const endDateStr = formatDate(end);
      
      // Call real backend API
      const response = await axios.get(`http://localhost:8080/api/admin/reports/${reportType}`, {
        params: {
          startDate: startDateStr,
          endDate: endDateStr
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Transform backend data to match frontend format
      const transformedData = transformBackendData(response.data, reportType);
      setReportData(transformedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Impossible de charger les données du rapport. Veuillez réessayer.');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const transformBackendData = (data, type) => {
    // Transform backend response to match the expected frontend format
    if (type === 'overview') {
      return {
        summary: {
          totalRevenue: data.totalRevenue || 0,
          revenueChange: 0,
          totalBookings: data.totalBookings || 0,
          bookingsChange: 0,
          occupancyRate: data.occupancyRate || 0,
          occupancyChange: 0,
          avgDailyRate: data.avgDailyRate || 0,
          adrChange: 0
        },
        chartData: data.dailyTrend || [],
        topRoomTypes: data.roomTypePerformance || [],
        metrics: {
          revPAR: data.revPAR || 0,
          totalRoomNights: data.totalRoomNights || 0,
          confirmedBookings: data.confirmedBookings || 0,
          pendingBookings: data.pendingBookings || 0
        }
      };
    } else if (type === 'revenue') {
      return {
        summary: {
          totalRevenue: data.totalRevenue || 0,
          revenueChange: data.revenueChange || 0,
          avgDailyRate: data.avgDailyRate || 0,
          adrChange: data.adrChange || 0,
          occupancyRate: data.occupancyRate || 0,
          totalBookings: data.totalBookings || 0,
          bookingsChange: data.bookingsChange || 0
        },
        chartData: data.dailyRevenue || [],
        topRoomTypes: data.roomTypeRevenue || []
      };
    } else if (type === 'occupancy') {
      return {
        summary: {
          avgOccupancyRate: data.avgOccupancyRate || 0,
          occupancyChange: 0,
          totalRoomNights: data.totalRoomNights || 0,
          totalRooms: data.totalRooms || 0,
          peakOccupancy: data.peakOccupancy || 0,
          totalBookings: 0
        },
        chartData: data.dailyOccupancy || [],
        topRoomTypes: data.roomTypeOccupancy || []
      };
    } else if (type === 'bookings') {
      return {
        summary: {
          totalBookings: data.totalBookings || 0,
          confirmedBookings: data.confirmedBookings || 0,
          pendingBookings: data.pendingBookings || 0,
          cancelledBookings: data.cancelledBookings || 0,
          avgBookingValue: data.avgBookingValue || 0,
          bookingsChange: data.bookingsChange || 0,
          avgValueChange: data.avgValueChange || 0
        },
        chartData: data.dailyBookings || [],
        topRoomTypes: data.roomTypeBookings || []
      };
    }
    
    return data;
  };
  
  const generateMockData = (type, range) => {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 90 : 365;
    
    return {
      summary: {
        totalRevenue: 2450000,
        revenueChange: 12.5,
        totalBookings: 342,
        bookingsChange: 8.3,
        occupancyRate: 78.5,
        occupancyChange: 5.2,
        avgDailyRate: 85000,
        adrChange: -2.1
      },
      chartData: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: `Day ${i + 1}`,
        revenue: 70000 + Math.random() * 50000,
        bookings: 8 + Math.floor(Math.random() * 8),
        occupancy: 60 + Math.random() * 30
      })),
      topRoomTypes: [
        { name: 'Deluxe Suite', bookings: 89, revenue: 890000 },
        { name: 'Standard Room', bookings: 156, revenue: 780000 },
        { name: 'Executive Suite', bookings: 45, revenue: 675000 },
        { name: 'Family Room', bookings: 52, revenue: 520000 }
      ]
    };
  };
  
  const handleExport = () => {
    if (!reportData) {
      setError('Veuillez d\'abord générer un rapport');
      return;
    }
    // TODO: Implement export functionality
    setError('La fonction d\'export sera bientôt disponible');
  };
  
  const formatCurrency = (value) => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue) + ' FCFA';
  };
  
  const getTrendIcon = (change) => {
    return change >= 0 ? <MdTrendingUp /> : <MdTrendingDown />;
  };
  
  const getTrendClass = (change) => {
    return change >= 0 ? 'positive' : 'negative';
  };

  return (
    <div className="reports-container-new">
      {/* Header */}
      <div className="reports-header-new">
        <div className="header-left">
          <h1>{TRANSLATIONS.title}</h1>
          <p className="header-subtitle">{TRANSLATIONS.subtitle}</p>
        </div>
        <button className="export-btn-new" onClick={handleExport}>
          <MdDownload />
          <span>{TRANSLATIONS.exportBtn}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>{TRANSLATIONS.reportType}</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="overview">{TRANSLATIONS.overview}</option>
            <option value="revenue">{TRANSLATIONS.revenue}</option>
            <option value="occupancy">{TRANSLATIONS.occupancy}</option>
            <option value="bookings">{TRANSLATIONS.bookings}</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>{TRANSLATIONS.timePeriod}</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7days">{TRANSLATIONS.last7Days}</option>
            <option value="30days">{TRANSLATIONS.last30Days}</option>
            <option value="90days">{TRANSLATIONS.last90Days}</option>
            <option value="365days">{TRANSLATIONS.lastYear}</option>
            <option value="custom">{TRANSLATIONS.customRange}</option>
          </select>
        </div>
        
        {dateRange === 'custom' && (
          <>
            <div className="filter-group">
              <label>{TRANSLATIONS.startDate}</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>{TRANSLATIONS.endDate}</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}
        
        <button className="apply-btn" onClick={fetchReportData}>
          <MdAssessment />
          {TRANSLATIONS.generate}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="reports-error" style={{
          padding: '40px',
          textAlign: 'center',
          background: '#fef2f2',
          borderRadius: '12px',
          border: '1px solid #fecaca',
          margin: '20px 0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Erreur</h3>
          <p style={{ color: '#991b1b' }}>{error}</p>
          <button 
            onClick={() => setError(null)} 
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="reports-loading">
          <div className="loading-spinner"></div>
          <p>{TRANSLATIONS.generatingReport}</p>
        </div>
      ) : !error && reportData ? (
        <>
          {/* Overview Report */}
          {reportType === 'overview' && (
            <>
              {/* Key Metrics */}
              <div className="key-metrics-grid">
            <div className="metric-card">
              <div className="metric-icon revenue-icon">
                <MdAttachMoney />
              </div>
              <div className="metric-content">
                <p className="metric-label">{TRANSLATIONS.totalRevenue}</p>
                <h3 className="metric-value">{formatCurrency(reportData.summary.totalRevenue)}</h3>
                <div className={`metric-change ${getTrendClass(reportData.summary.revenueChange)}`}>
                  {getTrendIcon(reportData.summary.revenueChange)}
                  <span>{Math.abs(reportData.summary.revenueChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon bookings-icon">
                <MdCalendarToday />
              </div>
              <div className="metric-content">
                <p className="metric-label">{TRANSLATIONS.totalBookings}</p>
                <h3 className="metric-value">{reportData.summary.totalBookings}</h3>
                <div className={`metric-change ${getTrendClass(reportData.summary.bookingsChange)}`}>
                  {getTrendIcon(reportData.summary.bookingsChange)}
                  <span>{Math.abs(reportData.summary.bookingsChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon occupancy-icon">
                <MdHotel />
              </div>
              <div className="metric-content">
                <p className="metric-label">{TRANSLATIONS.occupancyRate}</p>
                <h3 className="metric-value">{reportData.summary.occupancyRate}%</h3>
                <div className={`metric-change ${getTrendClass(reportData.summary.occupancyChange)}`}>
                  {getTrendIcon(reportData.summary.occupancyChange)}
                  <span>{Math.abs(reportData.summary.occupancyChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon adr-icon">
                <MdPeople />
              </div>
              <div className="metric-content">
                <p className="metric-label">{TRANSLATIONS.avgDailyRate}</p>
                <h3 className="metric-value">{formatCurrency(reportData.summary.avgDailyRate)}</h3>
                <div className={`metric-change ${getTrendClass(reportData.summary.adrChange)}`}>
                  {getTrendIcon(reportData.summary.adrChange)}
                  <span>{Math.abs(reportData.summary.adrChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            {/* Revenue Trend */}
            <div className="chart-card full-width">
              <div className="chart-header">
                <h3>{TRANSLATIONS.revenueTrend}</h3>
                <p className="chart-subtitle">{TRANSLATIONS.revenueTrendSubtitle}</p>
              </div>
              <div className="chart-body">
                {reportData.chartData && reportData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={reportData.chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#6366F1" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bookings & Occupancy */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>{TRANSLATIONS.bookingsTrend}</h3>
                <p className="chart-subtitle">{TRANSLATIONS.bookingsTrendSubtitle}</p>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="bookings" 
                      fill="#10B981" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>{TRANSLATIONS.occupancyRateChart}</h3>
                <p className="chart-subtitle">{TRANSLATIONS.occupancyRateSubtitle}</p>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Occupancy']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="occupancyRate" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ fill: '#F59E0B', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Performing Room Types */}
          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>{TRANSLATIONS.topPerformingRooms}</h3>
              <p className="chart-subtitle">{TRANSLATIONS.topPerformingRoomsSubtitle}</p>
            </div>
            <div className="table-container">
              {reportData.topRoomTypes && reportData.topRoomTypes.length > 0 ? (
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>{TRANSLATIONS.roomType}</th>
                      <th>{TRANSLATIONS.totalBookingsTable}</th>
                      <th>{TRANSLATIONS.revenueGenerated}</th>
                      <th>{TRANSLATIONS.avgRate}</th>
                      <th>{TRANSLATIONS.performance}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topRoomTypes.map((room, index) => {
                      const maxRevenue = reportData.topRoomTypes[0]?.revenue || 1;
                      const performanceWidth = maxRevenue > 0 ? ((room.revenue || 0) / maxRevenue) * 100 : 0;
                      
                      return (
                        <tr key={index}>
                          <td>
                            <div className="room-type-cell">
                              <div className="rank-badge">{index + 1}</div>
                              <span>{room.name || 'Type inconnu'}</span>
                            </div>
                          </td>
                          <td>{room.bookings || 0}</td>
                          <td className="revenue-cell">{formatCurrency(room.revenue || 0)}</td>
                          <td>{formatCurrency(room.avgRate || 0)}</td>
                          <td>
                            <div className="performance-bar">
                              <div 
                                className="performance-fill" 
                                style={{ width: `${performanceWidth}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  <p>Aucune donnée disponible pour cette période</p>
                </div>
              )}
            </div>
          </div>
            </>
          )}

          {/* Revenue Analysis Report */}
          {reportType === 'revenue' && (
            <>
              {/* Revenue Metrics */}
              <div className="key-metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon revenue-icon">
                    <MdAttachMoney />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.totalRevenue}</p>
                    <h3 className="metric-value">{formatCurrency(reportData.summary.totalRevenue)}</h3>
                    <div className={`metric-change ${getTrendClass(reportData.summary.revenueChange)}`}>
                      {getTrendIcon(reportData.summary.revenueChange)}
                      <span>{Math.abs(reportData.summary.revenueChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon adr-icon">
                    <MdPeople />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.avgDailyRate}</p>
                    <h3 className="metric-value">{formatCurrency(reportData.summary.avgDailyRate)}</h3>
                    <div className={`metric-change ${getTrendClass(reportData.summary.adrChange)}`}>
                      {getTrendIcon(reportData.summary.adrChange)}
                      <span>{Math.abs(reportData.summary.adrChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon revenue-icon">
                    <MdAttachMoney />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.revPAR}</p>
                    <h3 className="metric-value">{formatCurrency(reportData.summary.avgDailyRate * (reportData.summary.occupancyRate / 100))}</h3>
                    <div className={`metric-change positive`}>
                      <MdTrendingUp />
                      <span>{TRANSLATIONS.revenuePerRoom}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon bookings-icon">
                    <MdCalendarToday />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.totalBookings}</p>
                    <h3 className="metric-value">{reportData.summary.totalBookings}</h3>
                    <div className={`metric-change ${getTrendClass(reportData.summary.bookingsChange)}`}>
                      {getTrendIcon(reportData.summary.bookingsChange)}
                      <span>{Math.abs(reportData.summary.bookingsChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Trend Chart */}
              <div className="chart-card full-width">
                <div className="chart-header">
                  <h3>{TRANSLATIONS.revenueTrendAnalysis}</h3>
                  <p className="chart-subtitle">{TRANSLATIONS.revenueTrendAnalysisSubtitle}</p>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={reportData.chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#6366F1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by Room Type */}
              <div className="chart-card full-width">
                <div className="chart-header">
                  <h3>{TRANSLATIONS.revenueBreakdown}</h3>
                  <p className="chart-subtitle">{TRANSLATIONS.revenueBreakdownSubtitle}</p>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={reportData.topRoomTypes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="#6366F1" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Occupancy Trends Report */}
          {reportType === 'occupancy' && (
            <>
              {/* Occupancy Metrics */}
              <div className="key-metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon occupancy-icon">
                    <MdHotel />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.avgOccupancyRate}</p>
                    <h3 className="metric-value">{reportData.summary.avgOccupancyRate}%</h3>
                    <div className={`metric-change ${getTrendClass(reportData.summary.occupancyChange)}`}>
                      {getTrendIcon(reportData.summary.occupancyChange)}
                      <span>{Math.abs(reportData.summary.occupancyChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon bookings-icon">
                    <MdCalendarToday />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.totalRoomNights}</p>
                    <h3 className="metric-value">{reportData.summary.totalRoomNights}</h3>
                    <div className="metric-change positive">
                      <MdTrendingUp />
                      <span>{TRANSLATIONS.occupiedRoomNights}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon revenue-icon">
                    <MdAttachMoney />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.availableRooms}</p>
                    <h3 className="metric-value">{reportData.summary.totalRooms}</h3>
                    <div className="metric-change positive">
                      <span>{TRANSLATIONS.totalInventory}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon adr-icon">
                    <MdPeople />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.peakOccupancy}</p>
                    <h3 className="metric-value">{reportData.summary.peakOccupancy}%</h3>
                    <div className="metric-change positive">
                      <MdTrendingUp />
                      <span>{TRANSLATIONS.highestRateAchieved}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupancy Trend Chart */}
              <div className="chart-card full-width">
                <div className="chart-header">
                  <h3>{TRANSLATIONS.dailyOccupancyTrend}</h3>
                  <p className="chart-subtitle">{TRANSLATIONS.dailyOccupancyTrendSubtitle}</p>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={reportData.chartData}>
                      <defs>
                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Occupancy']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="occupancyRate" 
                        stroke="#F59E0B" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorOccupancy)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Room Type Occupancy */}
              <div className="chart-card full-width">
                <div className="chart-header">
                  <h3>{TRANSLATIONS.occupancyByRoomType}</h3>
                  <p className="chart-subtitle">{TRANSLATIONS.occupancyByRoomTypeSubtitle}</p>
                </div>
                <div className="table-container">
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>{TRANSLATIONS.roomType}</th>
                        <th>{TRANSLATIONS.totalRooms}</th>
                        <th>{TRANSLATIONS.occupied}</th>
                        <th>{TRANSLATIONS.occupancyRateTable}</th>
                        <th>{TRANSLATIONS.performance}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topRoomTypes.map((room, index) => {
                        const totalRooms = index === 0 ? 20 : index === 1 ? 50 : index === 2 ? 15 : 15;
                        const occupancyRate = (room.bookings / totalRooms) * 100;
                        return (
                          <tr key={index}>
                            <td>
                              <div className="room-type-cell">
                                <div className="rank-badge">{index + 1}</div>
                                <span>{room.name}</span>
                              </div>
                            </td>
                            <td>{totalRooms}</td>
                            <td>{room.bookings}</td>
                            <td className="revenue-cell">{occupancyRate.toFixed(1)}%</td>
                            <td>
                              <div className="performance-bar">
                                <div 
                                  className="performance-fill" 
                                  style={{ width: `${occupancyRate}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Booking Performance Report */}
          {reportType === 'bookings' && (
            <>
              {/* Booking Metrics */}
              <div className="key-metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon bookings-icon">
                    <MdCalendarToday />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.totalBookings}</p>
                    <h3 className="metric-value">{reportData.summary.totalBookings}</h3>
                    <div className={`metric-change ${getTrendClass(reportData.summary.bookingsChange)}`}>
                      {getTrendIcon(reportData.summary.bookingsChange)}
                      <span>{Math.abs(reportData.summary.bookingsChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon revenue-icon">
                    <MdAttachMoney />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.avgBookingValue}</p>
                    <h3 className="metric-value">{formatCurrency(reportData.summary.avgBookingValue)}</h3>
                    <div className={`metric-change ${getTrendClass(reportData.summary.avgValueChange)}`}>
                      {getTrendIcon(reportData.summary.avgValueChange)}
                      <span>{Math.abs(reportData.summary.avgValueChange)}% {TRANSLATIONS.vsLastPeriod}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon occupancy-icon">
                    <MdHotel />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.confirmedBookings}</p>
                    <h3 className="metric-value">{reportData.summary.confirmedBookings}</h3>
                    <div className="metric-change positive">
                      <span>{reportData.summary.totalBookings > 0 ? Math.round((reportData.summary.confirmedBookings / reportData.summary.totalBookings) * 100) : 0}% {TRANSLATIONS.confirmationRate}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon adr-icon">
                    <MdPeople />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{TRANSLATIONS.pendingBookings}</p>
                    <h3 className="metric-value">{Math.floor(reportData.summary.totalBookings * 0.15)}</h3>
                    <div className="metric-change negative">
                      <span>{TRANSLATIONS.awaitingConfirmation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Trend Chart */}
              <div className="chart-card full-width">
                <div className="chart-header">
                  <h3>{TRANSLATIONS.bookingVolumeTrend}</h3>
                  <p className="chart-subtitle">{TRANSLATIONS.bookingVolumeTrendSubtitle}</p>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="bookings" 
                        fill="#10B981" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Booking Performance by Room Type */}
              <div className="chart-card full-width">
                <div className="chart-header">
                  <h3>{TRANSLATIONS.bookingPerformanceByRoom}</h3>
                  <p className="chart-subtitle">{TRANSLATIONS.bookingPerformanceByRoomSubtitle}</p>
                </div>
                <div className="table-container">
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>{TRANSLATIONS.roomType}</th>
                        <th>{TRANSLATIONS.totalBookingsTable}</th>
                        <th>{TRANSLATIONS.avgStay}</th>
                        <th>{TRANSLATIONS.avgBookingValueTable}</th>
                        <th>{TRANSLATIONS.popularity}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topRoomTypes.map((room, index) => {
                        const avgStay = 2 + Math.random() * 2;
                        return (
                          <tr key={index}>
                            <td>
                              <div className="room-type-cell">
                                <div className="rank-badge">{index + 1}</div>
                                <span>{room.name}</span>
                              </div>
                            </td>
                            <td>{room.bookings}</td>
                            <td>{avgStay.toFixed(1)}</td>
                            <td className="revenue-cell">{formatCurrency(room.bookings > 0 ? room.revenue / room.bookings : 0)}</td>
                            <td>
                              <div className="performance-bar">
                                <div 
                                  className="performance-fill" 
                                  style={{ width: `${reportData.topRoomTypes[0]?.bookings > 0 ? (room.bookings / reportData.topRoomTypes[0].bookings) * 100 : 0}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="no-data">
          <MdAssessment size={64} />
          <p>{TRANSLATIONS.noDataMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
