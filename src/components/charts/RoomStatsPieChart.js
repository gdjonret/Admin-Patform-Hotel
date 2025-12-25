import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { MdWarning } from 'react-icons/md';
import axios from 'axios';

const RoomStatsPieChart = () => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Fetch daily occupancy data
  useEffect(() => {
    const fetchDailyOccupancy = async () => {
      try {
        setError(null);
        const response = await axios.get('http://localhost:8080/api/admin/dashboard/daily-occupancy');
        
        // Validate response data
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Validate each item has required fields
          const validData = response.data.filter(item => 
            item.day && 
            typeof item.occupiedRooms === 'number' && 
            typeof item.availableRooms === 'number' &&
            typeof item.totalRooms === 'number' &&
            typeof item.occupancyRate === 'number'
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
          
          // Translate day names to French
          const translatedData = response.data.map(item => ({
            ...item,
            day: dayMap[item.day] || item.day
          }));
          
          // FIXED: Find today by matching day name instead of array index
          // Start week with Monday (Lun)
          const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
          const todayName = dayNames[new Date().getDay()];
          
          // Reorder data to start with Monday
          const dayOrder = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          const reorderedData = dayOrder
            .map(day => translatedData.find(item => item.day === day))
            .filter(item => item !== undefined);
          
          setDailyData(reorderedData);
          const todayData = reorderedData.find(item => item.day === todayName) || reorderedData[0];
          
          console.log('📅 Today:', todayName, 'Found:', todayData?.day);
          console.log('📅 Occupied rooms:', todayData?.occupiedRooms);
          
          setSelectedDay(todayData);
        } else {
          throw new Error('Aucune donnée disponible');
        }
      } catch (error) {
        console.error('Error fetching daily occupancy:', error);
        setError('Impossible de charger les données d\'occupation. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyOccupancy();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDailyOccupancy, 300000);
    return () => clearInterval(interval);
  }, []);
  
  const total = selectedDay?.totalRooms || 0;
  const occupancyRate = selectedDay?.occupancyRate || 0;
  
  // Determine occupancy level
  const getOccupancyLevel = (rate) => {
    if (rate >= 80) return { level: 'high', color: '#EF4444', label: 'Élevée' };
    if (rate >= 60) return { level: 'medium', color: '#F59E0B', label: 'Moyenne' };
    return { level: 'low', color: '#10B981', label: 'Faible' };
  };
  
  const occupancyLevel = getOccupancyLevel(occupancyRate);
  
  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload;
      return (
        <div className="custom-tooltip-pro">
          <div className="tooltip-header">{dayData.day}</div>
          <div className="tooltip-content">
            <div className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: '#6366F1' }}></span>
              <span className="tooltip-label">Occupées:</span>
              <span className="tooltip-value">{dayData.occupiedRooms}</span>
            </div>
            <div className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: '#10B981' }}></span>
              <span className="tooltip-label">Disponibles:</span>
              <span className="tooltip-value">{dayData.availableRooms}</span>
            </div>
            <div className="tooltip-total">
              Occupation: {dayData.occupancyRate}%
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
      <div className="chart-container pro-chart room-occupancy-pro">
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
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Chargement des données d'occupation...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="chart-container pro-chart room-occupancy-pro">
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
              background: '#10b981',
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
    <div className="chart-container pro-chart room-occupancy-pro">
      <div className="chart-header-pro">
        <div className="chart-title-section">
          <h2 className="chart-title-pro">Occupation Quotidienne des Chambres</h2>
          <p className="chart-subtitle-pro">Tendances d'occupation hebdomadaires</p>
        </div>
        <div className="occupancy-level-badge" style={{ backgroundColor: `${occupancyLevel.color}15`, color: occupancyLevel.color }}>
          <span className="level-dot" style={{ backgroundColor: occupancyLevel.color }}></span>
          <span>Occupation {occupancyLevel.label} Aujourd'hui</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={dailyData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="occupiedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.7}/>
            </linearGradient>
            <linearGradient id="availableGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#34D399" stopOpacity={0.7}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="occupiedRooms" 
            stackId="a" 
            fill="url(#occupiedGradient)"
            radius={[0, 0, 0, 0]}
            name="Occupées"
          />
          <Bar 
            dataKey="availableRooms" 
            stackId="a" 
            fill="url(#availableGradient)"
            radius={[8, 8, 0, 0]}
            name="Disponibles"
          />
        </BarChart>
      </ResponsiveContainer>
      
      {selectedDay && (
        <div className="chart-stats-pro" style={{ marginTop: '24px', gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="stat-card-pro">
            <div className="stat-icon-pro">
              <div className="icon-circle" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                <span>●</span>
              </div>
            </div>
            <div className="stat-content-pro">
              <div className="stat-label-pro">Chambres Occupées</div>
              <div className="stat-value-pro">{selectedDay.occupiedRooms}</div>
              <div className="stat-meta-pro">
                <span className="stat-avg">{selectedDay.occupancyRate}% d'occupation</span>
              </div>
            </div>
          </div>
          
          <div className="stat-divider-pro"></div>
          
          <div className="stat-card-pro">
            <div className="stat-icon-pro">
              <div className="icon-circle" style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}>
                <span>✓</span>
              </div>
            </div>
            <div className="stat-content-pro">
              <div className="stat-label-pro">Chambres Disponibles</div>
              <div className="stat-value-pro">{selectedDay.availableRooms}</div>
              <div className="stat-meta-pro">
                <span className="stat-avg">Sur {selectedDay.totalRooms} au total</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomStatsPieChart;
