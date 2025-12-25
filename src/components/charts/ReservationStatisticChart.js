import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MdTrendingUp, MdTrendingDown, MdWarning } from 'react-icons/md';
import axios from 'axios';

const ReservationStatisticChart = () => {
  const [data, setData] = useState([
    { week: 'Lun', checkIn: 0, checkOut: 0 },
    { week: 'Mar', checkIn: 0, checkOut: 0 },
    { week: 'Mer', checkIn: 0, checkOut: 0 },
    { week: 'Jeu', checkIn: 0, checkOut: 0 },
    { week: 'Ven', checkIn: 0, checkOut: 0 },
    { week: 'Sam', checkIn: 0, checkOut: 0 },
    { week: 'Dim', checkIn: 0, checkOut: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch weekly reservation data
  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setError(null);
        const response = await axios.get('http://localhost:8080/api/admin/dashboard/weekly-stats');
        
        // Validate response data
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Validate each item has required fields
          const validData = response.data.filter(item => 
            item.week && 
            typeof item.checkIn === 'number' && 
            typeof item.checkOut === 'number'
          );
          
          if (validData.length === 0) {
            throw new Error('Données invalides reçues du serveur');
          }
          // Map English day names to French
          const dayMap = {
            'Mon': 'Lun',
            'Tue': 'Mar',
            'Wed': 'Mer',
            'Thu': 'Jeu',
            'Fri': 'Ven',
            'Sat': 'Sam',
            'Sun': 'Dim'
          };
          
          // Enhance data with full dates and French day names
          const today = new Date();
          const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
          const monday = new Date(today);
          monday.setDate(today.getDate() + mondayOffset);
          
          const enhancedData = validData.map((item) => {
            const translatedDay = dayMap[item.week] || item.week;
            let fullDate = translatedDay;
            if (item.date) {
              const dateObj = new Date(`${item.date}T00:00:00`);
              if (!Number.isNaN(dateObj.getTime())) {
                fullDate = dateObj.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                });
              }
            }
            console.log(`📅 Translating: ${item.week} → ${translatedDay}`, item);
            return {
              ...item,
              week: translatedDay,
              fullDate,
              isoDate: item.date || null
            };
          });
          
          // Reorder data to start with Monday (Lun)
          const dayOrder = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          const reorderedData = dayOrder
            .map(day => {
              const found = enhancedData.find(item => item.week === day);
              // If day not found, create placeholder with 0 values
              return found || { week: day, checkIn: 0, checkOut: 0, fullDate: day, isoDate: null };
            });
          
          console.log('📊 Enhanced data:', enhancedData);
          console.log('📊 Reordered data:', reorderedData);
          
          setData(reorderedData);
        } else {
          throw new Error('Aucune donnée disponible');
        }
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
        setError('Impossible de charger les statistiques. Veuillez réessayer.');
        // Keep default data if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchWeeklyData, 300000);
    return () => clearInterval(interval);
  }, []);
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Calculate metrics with safe handling
  const totalCheckIns = data.reduce((sum, item) => sum + (item.checkIn || 0), 0);
  const totalCheckOuts = data.reduce((sum, item) => sum + (item.checkOut || 0), 0);
  const avgCheckIns = data.length > 0 ? Math.round(totalCheckIns / data.length) : 0;
  const avgCheckOuts = data.length > 0 ? Math.round(totalCheckOuts / data.length) : 0;
  const peakDay = data.length > 0 
    ? data.reduce((max, item) => (item.checkIn || 0) > (max.checkIn || 0) ? item : max, data[0])
    : { week: 'N/A', checkIn: 0 };
  
  // Calculate trend with safe division (FIXED: include Thursday, handle zero division)
  const firstHalf = data.slice(0, 3).reduce((sum, item) => sum + (item.checkIn || 0), 0) / 3;
  const secondHalf = data.slice(3, 7).reduce((sum, item) => sum + (item.checkIn || 0), 0) / 4;
  
  let trend = 0;
  let isPositiveTrend = false;
  
  if (firstHalf === 0) {
    trend = secondHalf > 0 ? 100 : 0;
    isPositiveTrend = secondHalf > 0;
  } else {
    const trendValue = ((secondHalf - firstHalf) / firstHalf * 100);
    trend = parseFloat(trendValue.toFixed(1));
    isPositiveTrend = trend > 0;
  }
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Get full date from payload
      const fullDate = payload[0].payload.fullDate || label;
      
      return (
        <div className="custom-tooltip-pro">
          <div className="tooltip-header">{fullDate}</div>
          <div className="tooltip-content">
            <div className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: '#6366F1' }}></span>
              <span className="tooltip-label">Check-Ins:</span>
              <span className="tooltip-value">{payload[0].value}</span>
            </div>
            <div className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: '#14B8A6' }}></span>
              <span className="tooltip-label">Check-Outs:</span>
              <span className="tooltip-value">{payload[1].value}</span>
            </div>
            <div className="tooltip-total">
              Total: {payload[0].value + payload[1].value} réservations
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="chart-container pro-chart">
        <div className="chart-loading" style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          gap: '16px'
        }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="chart-container pro-chart">
        <div className="chart-error" style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          gap: '16px',
          padding: '20px'
        }}>
          <MdWarning size={48} style={{ color: '#f59e0b' }} />
          <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '8px 16px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chart-container pro-chart">
      <div className="chart-header-pro">
        <div className="chart-title-section">
          <h2 className="chart-title-pro">Statistiques Hebdomadaires des Réservations</h2>
          <p className="chart-subtitle-pro">Performance des check-ins et check-outs</p>
        </div>
        <div className="chart-metrics-badges">
          <div className={`trend-badge ${isPositiveTrend ? 'positive' : 'negative'}`}>
            {isPositiveTrend ? <MdTrendingUp size={16} /> : <MdTrendingDown size={16} />}
            <span>{isPositiveTrend ? '+' : ''}{trend}%</span>
          </div>
          <div className="peak-badge">
            <span className="peak-label">Pic:</span>
            <span className="peak-value">{peakDay.week}</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
          onMouseMove={(state) => {
            if (state.isTooltipActive) {
              setActiveIndex(state.activeTooltipIndex);
            } else {
              setActiveIndex(null);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            {/* Enhanced gradients with multiple stops */}
            <linearGradient id="colorCheckInPro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4}/>
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.2}/>
              <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="colorCheckOutPro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.3}/>
              <stop offset="50%" stopColor="#10B981" stopOpacity={0.15}/>
              <stop offset="100%" stopColor="#34D399" stopOpacity={0.05}/>
            </linearGradient>
            {/* Glow effect filters */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#E5E7EB" 
            opacity={0.5}
          />
          
          <XAxis 
            dataKey="week" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }}
            dy={10}
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            domain={[0, 'auto']}
            allowDataOverflow={false}
          />
          
          {/* Average reference line */}
          <ReferenceLine 
            y={avgCheckIns} 
            stroke="#9CA3AF" 
            strokeDasharray="5 5" 
            strokeWidth={1}
            label={{ 
              value: `Moy: ${avgCheckIns}`, 
              position: 'right', 
              fill: '#6B7280', 
              fontSize: 11,
              fontWeight: 600
            }}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }} />
          
          <Area 
            type="monotone" 
            dataKey="checkIn" 
            stroke="#6366F1" 
            strokeWidth={3}
            fill="url(#colorCheckInPro)" 
            activeDot={{ 
              r: 8, 
              fill: "#6366F1", 
              stroke: "#fff", 
              strokeWidth: 3,
              filter: "url(#glow)"
            }}
            dot={{ 
              r: 4, 
              fill: "#6366F1", 
              stroke: "#fff", 
              strokeWidth: 2 
            }}
            animationDuration={1200}
            animationEasing="ease-in-out"
          />
          
          <Area 
            type="monotone" 
            dataKey="checkOut" 
            stroke="#14B8A6" 
            strokeWidth={3}
            fill="url(#colorCheckOutPro)" 
            activeDot={{ 
              r: 8, 
              fill: "#14B8A6", 
              stroke: "#fff", 
              strokeWidth: 3,
              filter: "url(#glow)"
            }}
            dot={{ 
              r: 4, 
              fill: "#14B8A6", 
              stroke: "#fff", 
              strokeWidth: 2 
            }}
            animationDuration={1200}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="chart-stats-pro">
        <div className="stat-card-pro check-in-card">
          <div className="stat-icon-pro">
            <div className="icon-circle" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
              <span>↓</span>
            </div>
          </div>
          <div className="stat-content-pro">
            <div className="stat-label-pro">Check-ins totales</div>
            <div className="stat-value-pro">{totalCheckIns}</div>
            <div className="stat-meta-pro" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="stat-avg">Moy: {avgCheckIns}/jour</span>
              {totalCheckOuts > 0 ? (
                <span className={`stat-badge ${totalCheckIns > totalCheckOuts ? 'positive' : totalCheckIns < totalCheckOuts ? 'negative' : 'neutral'}`}>
                  {totalCheckIns > totalCheckOuts ? '+' : ''}{Math.round((totalCheckIns / totalCheckOuts - 1) * 100)}%
                </span>
              ) : totalCheckIns > 0 ? (
                <span className="stat-badge neutral" style={{ fontSize: '10px', padding: '2px 6px' }}>Ratio: N/A</span>
              ) : null}
            </div>
          </div>
        </div>
        
        <div className="stat-divider-pro"></div>
        
        <div className="stat-card-pro check-out-card">
          <div className="stat-icon-pro">
            <div className="icon-circle" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #10B981 100%)' }}>
              <span>↑</span>
            </div>
          </div>
          <div className="stat-content-pro">
            <div className="stat-label-pro">Check-outs totales</div>
            <div className="stat-value-pro">{totalCheckOuts}</div>
            <div className="stat-meta-pro" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="stat-avg">Moy: {avgCheckOuts}/jour</span>
              {totalCheckIns > 0 ? (
                <span className="stat-badge neutral">{Math.round((totalCheckOuts / totalCheckIns) * 100)}%</span>
              ) : totalCheckOuts > 0 ? (
                <span className="stat-badge neutral" style={{ fontSize: '10px', padding: '2px 6px' }}>Ratio: N/A</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationStatisticChart;
