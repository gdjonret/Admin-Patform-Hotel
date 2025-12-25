import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import './components/rooms.css';
import '../../styles/shared/modern-table.css';
import '../../features/reservations/components/modern-reservations-header.css';
import '../../styles/shared/modern-modal.css';
import '../../styles/shared/status-badge.css';
import './components/roomStyles.css';
import { MdClose, MdEdit, MdVisibility, MdDelete } from 'react-icons/md';
import { Button } from '@mui/material';
import MenuPortal from '../../components/MenuPortal';
import Pagination from '../../components/common/Pagination';
import ActionMenuButton from '../../components/common/ActionMenuButton';
import { useRooms } from '../../context/RoomContext';
import eventBus, { EVENTS } from '../../utils/eventBus';
import { useRole } from '../../hooks/useRole';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const Rooms = forwardRef((props, ref) => {
  const { isAdmin } = useRole();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [originalRoomId, setOriginalRoomId] = useState(null);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'view'
  const [isNewRoom, setIsNewRoom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  
  // Use the room context instead of local state
  const { rooms, loading, error, addRoom, updateRoom, deleteRoom } = useRooms();
  
  // Fetch room types for dropdown
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/admin/room-types`);
        setRoomTypes(response.data);
      } catch (err) {
        console.error('Error fetching room types:', err);
      }
    };
    fetchRoomTypes();
  }, []);

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const buttonRefs = useRef({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Helper functions for room type context
  const getRoomTypeName = (roomTypeId) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    return roomType ? roomType.name : 'Unknown';
  };
  
  const getRoomTypeCount = (roomTypeId) => {
    return rooms.filter(r => r.roomTypeId === roomTypeId).length;
  };
  
  const getAvailableCount = (roomTypeId) => {
    return rooms.filter(r => r.roomTypeId === roomTypeId && r.status === 'Available').length;
  };
  
  // Translate status from English to French
  const translateStatus = (status) => {
    const translations = {
      'Available': 'Disponible',
      'Occupied': 'Occupé',
      'Reserved': 'Réservé',
      'Maintenance': 'Maintenance'
    };
    return translations[status] || status;
  };
  
  const openEditModal = (room) => {
    setCurrentRoom({...room});
    setOriginalRoomId(room.id);
    setModalMode('edit');
    setIsNewRoom(false);
    setIsModalOpen(true);
  };
  
  const openNewRoomModal = () => {
    // Find the highest room number to suggest the next one
    // Default to 100 if no rooms exist
    const highestRoomNumber = rooms.length > 0 
      ? Math.max(...rooms.map(room => parseInt(room.number) || 0)) 
      : 100;
    const suggestedRoomNumber = highestRoomNumber + 1;
    
    // Set default values for a new room
    setCurrentRoom({
      id: suggestedRoomNumber,
      number: suggestedRoomNumber.toString(),
      roomTypeId: roomTypes.length > 0 ? roomTypes[0].id : null,
      status: 'Available'
    });
    setOriginalRoomId(null);
    setModalMode('edit');
    setIsNewRoom(true);
    setIsModalOpen(true);
    setStatusMessage('');
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openNewRoomModal
  }));
  
  const openViewModal = (room) => {
    setCurrentRoom({...room});
    setModalMode('view');
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRoom(null);
    setOriginalRoomId(null);
    setIsNewRoom(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRoom(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCapacityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setCurrentRoom(prev => ({
      ...prev,
      capacity: value
    }));
  };
  
  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setCurrentRoom(prev => ({
      ...prev,
      price: value
    }));
  };
  
  const handleRoomNumberChange = (e) => {
    const value = e.target.value;
    setCurrentRoom(prev => ({
      ...prev,
      number: value,
      // For new rooms, also update id to match the number
      ...(isNewRoom && { id: parseInt(value) || 0 })
    }));
  };
  
  const handleAmenitiesChange = (e) => {
    const value = e.target.value;
    const amenitiesList = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setCurrentRoom(prev => ({
      ...prev,
      amenities: amenitiesList
    }));
  };
  
  const saveRoomChanges = async () => {
    // Clear any previous messages
    setStatusMessage('');
    
    // Validate room number input
    const roomNumberToCheck = currentRoom.number || currentRoom.id;
    
    if (!roomNumberToCheck) {
      setStatusMessage('❌ Le numéro de chambre est requis.');
      return;
    }
    
    // Check if trying to change OCCUPIED room to AVAILABLE
    const originalRoom = rooms.find(r => r.id === originalRoomId);
    if (originalRoom && originalRoom.status === 'Occupied' && currentRoom.status === 'Available') {
      setStatusMessage('❌ Impossible de rendre une chambre occupée disponible. Le client doit d\'abord faire le check-out.');
      return;
    }
    
    // If changing RESERVED to AVAILABLE, warn about unassigning
    if (originalRoom && originalRoom.status === 'Reserved' && currentRoom.status === 'Available') {
      const confirmed = window.confirm(
        'Cette chambre est actuellement réservée pour une réservation. La changer en Disponible la désassignera de la réservation. Continuer?'
      );
      if (!confirmed) {
        return;
      }
    }
    
    // Check for duplicate room numbers
    let isDuplicate = false;
    
    if (isNewRoom) {
      // For new rooms: check if ANY room has this number
      isDuplicate = rooms.some(room => {
        const existingNumber = room.number || room.id;
        return existingNumber.toString() === roomNumberToCheck.toString();
      });
    } else {
      // For editing: check if any OTHER room (not the current one) has this number
      isDuplicate = rooms.some(room => {
        const existingNumber = room.number || room.id;
        const currentOriginalNumber = originalRoomId;
        
        // Skip the room we're currently editing
        if (room.id === currentOriginalNumber) {
          return false;
        }
        
        return existingNumber.toString() === roomNumberToCheck.toString();
      });
    }
    
    if (isDuplicate) {
      setStatusMessage(`❌ Le numéro de chambre "${roomNumberToCheck}" existe déjà. Veuillez choisir un numéro différent.`);
      return;
    }
    
    // Validate room type
    if (!currentRoom.roomTypeId) {
      setStatusMessage('❌ Veuillez sélectionner un type de chambre.');
      return;
    }
    
    // Proceed with saving
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (isNewRoom) {
        result = await addRoom(currentRoom);
      } else {
        result = await updateRoom(currentRoom);
      }
      
      if (result.success) {
        setStatusMessage('✓ Chambre enregistrée avec succès!');
        
        // Emit event to notify other components (e.g., refresh reservations if room status changed)
        eventBus.emit(EVENTS.ROOM_UPDATED);
        
        setTimeout(() => {
          closeModal();
          setStatusMessage('');
        }, 1500);
      } else {
        setStatusMessage(`❌ Erreur: ${result.error || 'Échec de l\'enregistrement de la chambre'}`);
      }
    } catch (err) {
      console.error('Error saving room:', err);
      setStatusMessage(`❌ Erreur: ${err.message || 'Une erreur inattendue s\'est produite'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette chambre?')) {
      try {
        const result = await deleteRoom(roomId);
        if (!result.success) {
          alert(`Échec de la suppression de la chambre: ${result.error || 'Erreur inconnue'}`);
        }
      } catch (err) {
        alert(`Erreur lors de la suppression de la chambre: ${err.message}`);
      }
    }
    setActiveMenu(null);
  };
  
  const toggleMenu = (roomId) => {
    setActiveMenu(activeMenu === roomId ? null : roomId);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && 
          buttonRefs.current[activeMenu] && 
          !buttonRefs.current[activeMenu].contains(event.target)) {
        // Check if the click is outside the menu portal
        const portalElement = document.querySelector('.action-menu-portal');
        if (!portalElement || !portalElement.contains(event.target)) {
          setActiveMenu(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  const filteredRooms = rooms
    .filter(room => filterStatus === 'All' ? true : room.status === filterStatus)
    .filter(room => filterType === 'All' ? true : room.type === filterType)
    .filter(room => 
      searchTerm === '' || 
      room.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.amenities || []).some(amenity => amenity?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Pagination calculations
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, searchTerm]);

  return (
    <div>
      {/* Modern Filters Section */}
      <div style={{ marginBottom: '24px' }}>
        <div className="modern-filter-row">
          <div className="modern-search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="modern-search-input"
              placeholder="Rechercher des chambres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="modern-filter-group">
            <label className="filter-label">Statut:</label>
            <select className="modern-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">Tous</option>
              <option value="Available">Disponible</option>
              <option value="Occupied">Occupé</option>
              <option value="Reserved">Réservé</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div className="modern-filter-group">
            <label className="filter-label">Type:</label>
            <select className="modern-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">Tous</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.name}>{rt.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="modern-table-container">
        {loading ? (
          <div className="modern-table-empty">
            <h3>Chargement des chambres...</h3>
            <p>Veuillez patienter pendant que nous récupérons les données.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Numéro de Chambre</th>
                <th>Type</th>
                <th>Capacité</th>
                <th>Prix/Nuit (FCFA)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Erreur de chargement des chambres</div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>{error}</div>
                    <div style={{ fontSize: '14px' }}>Veuillez vérifier votre connexion backend.</div>
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Aucune chambre trouvée</div>
                    <div style={{ fontSize: '14px' }}>Cliquez sur le bouton "Ajouter une Chambre" pour créer votre première chambre.</div>
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                      {searchTerm ? 'Aucune chambre trouvée' : 
                       filterStatus === 'Available' ? 'Aucune chambre disponible' :
                       filterStatus === 'Occupied' ? 'Aucune chambre occupée' :
                       filterStatus === 'Maintenance' ? 'Aucune chambre en maintenance' :
                       filterType !== 'All' ? `Aucune chambre ${filterType} trouvée` :
                       'Aucune chambre trouvée'}
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      {searchTerm ? `Aucune chambre ne correspond à "${searchTerm}". Essayez un autre terme de recherche.` :
                       filterStatus !== 'All' || filterType !== 'All' ? 'Essayez d\'ajuster vos filtres pour voir plus de résultats.' :
                       'Cliquez sur le bouton "Ajouter une Chambre" pour créer votre première chambre.'}
                    </div>
                  </td>
                </tr>
              ) : (
              paginatedRooms.map(room => (
              <tr 
                key={room.id} 
                className={room.status.toLowerCase()}
                onClick={(e) => {
                  // Don't open modal if clicking on action menu or buttons
                  if (e.target.closest('.action-cell') || e.target.closest('button')) {
                    return;
                  }
                  openViewModal(room);
                }}
                style={{ cursor: 'pointer' }}
              >
                <td><strong>{room.number || room.id}</strong></td>
                <td>{room.type}</td>
                <td>{room.capacity || 1} {(room.capacity || 1) > 1 ? 'personnes' : 'personne'}</td>
                <td>{room.price?.toFixed(0) || 0} FCFA</td>
                <td>
                  <span className={`status-badge ${room.status.toLowerCase()}`}>
                    {translateStatus(room.status)}
                  </span>
                </td>
                <td className="action-cell">
                  <div className="action-menu-container">
                    <ActionMenuButton
                      onClick={() => toggleMenu(room.id)}
                      buttonRef={el => buttonRefs.current[room.id] = el}
                      isActive={activeMenu === room.id}
                    />
                    
                    <MenuPortal isOpen={activeMenu === room.id} buttonRef={buttonRefs} activeId={room.id}>
                      <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e2e8f0',
                        padding: '6px',
                        minWidth: '160px',
                        overflow: 'hidden'
                      }}>
                        <button 
                          onClick={() => { openViewModal(room); setActiveMenu(null); }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#475569',
                            transition: 'all 0.15s',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#f1f5f9';
                            e.target.style.color = '#2c3e50';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#475569';
                          }}
                        >
                          <MdVisibility size={18} /> Voir
                        </button>
                        <button 
                          onClick={() => { openEditModal(room); setActiveMenu(null); }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#475569',
                            transition: 'all 0.15s',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#f1f5f9';
                            e.target.style.color = '#2c3e50';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#475569';
                          }}
                        >
                          <MdEdit size={18} /> Modifier
                        </button>
                        {/* Delete button - Admin Only */}
                        {isAdmin && (
                          <>
                            <div style={{
                              height: '1px',
                              background: '#e2e8f0',
                              margin: '4px 8px'
                            }}/>
                            <button 
                              onClick={() => handleDeleteRoom(room.id)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#dc2626',
                                transition: 'all 0.15s',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#fee2e2';
                                e.target.style.color = '#991b1b';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#dc2626';
                              }}
                            >
                              <MdDelete size={18} /> Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </MenuPortal>
                  </div>
                </td>
              </tr>
              ))
              )}
            </tbody>
          </table>
        )}
        
        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRooms.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="chambres"
        />
      </div>
      
      {/* Room Modal - Edit or View */}
      {isModalOpen && currentRoom && (isNewRoom ? createPortal(
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div className="modal-content" style={{
            maxWidth: '600px',
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {isNewRoom ? (
              /* Modern Add Room Header */
              <div style={{
                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                padding: '32px 32px 24px',
                position: 'relative'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: '-0.5px'
                }}>
                  Ajouter une Nouvelle Chambre
                </h2>
                <p style={{
                  margin: '8px 0 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '400'
                }}>
                  Créer une nouvelle chambre dans votre inventaire
                </p>
              </div>
            ) : (
              /* Original Header for Edit/View */
              <div className="modal-header">
                <h2>{modalMode === 'edit' ? 'Modifier' : 'Voir'} Chambre {currentRoom.id}</h2>
                <button className="close-btn" onClick={closeModal}>
                  <MdClose size={24} />
                </button>
              </div>
            )}
            <div className="modal-body" style={isNewRoom ? { padding: '32px' } : {}}>
              {modalMode === 'edit' ? (
                /* Edit Mode */
                <>
                  <div className="form-group" style={isNewRoom ? { marginBottom: '24px' } : {}}>
                    <label style={isNewRoom ? {
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    } : {}}>Numéro de Chambre</label>
                    <input 
                      type="text" 
                      name="number" 
                      value={currentRoom.number || currentRoom.id} 
                      onChange={handleRoomNumberChange}
                      placeholder="e.g., 101, 102, 201"
                      style={isNewRoom ? {
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        outline: 'none'
                      } : {}}
                      onFocus={(e) => isNewRoom && (e.target.style.borderColor = '#2c3e50')}
                      onBlur={(e) => isNewRoom && (e.target.style.borderColor = '#e2e8f0')}
                    />
                  </div>

                  <div className="form-group" style={isNewRoom ? { marginBottom: '24px' } : {}}>
                    <label style={isNewRoom ? {
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    } : {}}>Type de Chambre</label>
                    <select 
                      name="roomTypeId" 
                      value={currentRoom.roomTypeId} 
                      onChange={handleInputChange}
                      required
                      style={isNewRoom ? {
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        outline: 'none',
                        cursor: 'pointer'
                      } : {}}
                      onFocus={(e) => isNewRoom && (e.target.style.borderColor = '#2c3e50')}
                      onBlur={(e) => isNewRoom && (e.target.style.borderColor = '#e2e8f0')}
                    >
                      <option value="">Sélectionner le type de chambre</option>
                      {roomTypes.map(roomType => (
                        <option key={roomType.id} value={roomType.id}>
                          {roomType.name} - {Number(roomType.baseRate).toLocaleString()} FCFA/night
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group" style={isNewRoom ? { marginBottom: '32px' } : {}}>
                    <label style={isNewRoom ? {
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    } : {}}>Statut</label>
                    <select 
                      name="status" 
                      value={currentRoom.status} 
                      onChange={handleInputChange}
                      style={isNewRoom ? {
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        outline: 'none',
                        cursor: 'pointer'
                      } : {}}
                      onFocus={(e) => isNewRoom && (e.target.style.borderColor = '#2c3e50')}
                      onBlur={(e) => isNewRoom && (e.target.style.borderColor = '#e2e8f0')}
                    >
                      <option value="Available">Disponible</option>
                      <option value="Occupied">Occupé</option>
                      <option value="Reserved">Réservé</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </>
              ) : (
                /* View Mode */
                <div className="view-details">
                  <div className="vertical-details">
                    <div className="detail-row">
                      <span className="detail-label">Numéro de Chambre:</span>
                      <span className="detail-value">{currentRoom.id}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Type de Chambre:</span>
                      <span className="detail-value">{currentRoom.type || 'Non spécifié'}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Capacité:</span>
                      <span className="detail-value">{currentRoom.capacity || 1} {(currentRoom.capacity || 1) > 1 ? 'personnes' : 'personne'}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Prix par Nuit:</span>
                      <span className="detail-value price-value">{(currentRoom.price || 0).toFixed(0)} FCFA</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Statut:</span>
                      <span className="detail-value">
                        <span className={`status-badge ${currentRoom.status?.toLowerCase() || 'available'}`}>
                          {currentRoom.status || 'Disponible'}
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Commodités:</span>
                      <span className="detail-value">{(currentRoom.amenities || []).join(', ') || 'Aucune'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={isNewRoom ? {
              padding: '24px 32px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            } : {}}>
              {modalMode === 'edit' ? (
                <>
                  {statusMessage && isNewRoom && (
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textAlign: 'center',
                      background: statusMessage.includes('❌') 
                        ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                        : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      color: statusMessage.includes('❌') ? '#991b1b' : '#166534',
                      border: statusMessage.includes('❌') 
                        ? '1px solid #fecaca' 
                        : '1px solid #bbf7d0',
                      boxShadow: statusMessage.includes('❌')
                        ? '0 2px 8px rgba(220, 38, 38, 0.1)'
                        : '0 2px 8px rgba(34, 197, 94, 0.1)',
                      animation: 'fadeIn 0.3s ease-in'
                    }}>
                      {statusMessage}
                    </div>
                  )}
                  <div style={isNewRoom ? {
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  } : {}}>
                    <button 
                      className="cancel-btn" 
                      onClick={closeModal}
                      style={isNewRoom ? {
                        padding: '12px 24px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        background: 'white',
                        color: '#64748b',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      } : {}}
                      onMouseEnter={(e) => isNewRoom && (e.target.style.background = '#f8fafc')}
                      onMouseLeave={(e) => isNewRoom && (e.target.style.background = 'white')}
                    >
                      Annuler
                    </button>
                    <button 
                      className="save-btn" 
                      onClick={saveRoomChanges} 
                      disabled={isSubmitting}
                      style={isNewRoom ? {
                        padding: '12px 32px',
                        border: 'none',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: '0 4px 12px rgba(44, 62, 80, 0.3)',
                        opacity: isSubmitting ? 0.6 : 1
                      } : {}}
                      onMouseEnter={(e) => !isSubmitting && isNewRoom && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 6px 16px rgba(44, 62, 80, 0.4)')}
                      onMouseLeave={(e) => !isSubmitting && isNewRoom && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 12px rgba(44, 62, 80, 0.3)')}
                    >
                      {isSubmitting ? 'Création en cours...' : (isNewRoom ? '✓ Créer la Chambre' : 'Enregistrer les Modifications')}
                    </button>
                  </div>
                  {statusMessage && !isNewRoom && (
                    <div className="status-message">{statusMessage}</div>
                  )}
                </>
              ) : (
                <>
                  <button className="cancel-btn" onClick={closeModal}>Close</button>
                  <button 
                    className="edit-btn" 
                    onClick={() => {
                      setOriginalRoomId(currentRoom.id);
                      setModalMode('edit');
                    }}
                  >
                    Edit Room
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      ) : createPortal(
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div className="modal-content" style={{
            maxWidth: '600px',
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* Modern Header for Edit/View */}
            <div style={{
              background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
              padding: '32px 32px 24px',
              position: 'relative'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '-0.5px'
              }}>
                {modalMode === 'edit' ? 'Modifier la Chambre' : 'Détails de la Chambre'}
              </h2>
              <p style={{
                margin: '8px 0 0',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '400'
              }}>
                {modalMode === 'edit' ? `Update room ${currentRoom.number || currentRoom.id} information` : `Room ${currentRoom.number || currentRoom.id} details`}
              </p>
            </div>
            <div className="modal-body" style={{ padding: '32px' }}>
              {modalMode === 'edit' ? (
                /* Edit Mode */
                <>
                  {/* Important Notice for New Rooms */}
                  {isNewRoom && (
                    <div style={{
                      padding: '14px 16px',
                      background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
                      borderRadius: '10px',
                      marginBottom: '24px',
                      border: '1px solid #ffc107'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#856404', marginBottom: '6px' }}>
                        ℹ️ IMPORTANT
                      </div>
                      <div style={{ fontSize: '13px', color: '#856404', lineHeight: '1.5' }}>
                        Individual rooms affect internal inventory only. To change what customers see on the public website, 
                        edit <strong>Room Types</strong> in the Room Types section.
                      </div>
                    </div>
                  )}
                  
                  {/* Room Type Context Info */}
                  {!isNewRoom && currentRoom.roomTypeId && (
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      borderRadius: '10px',
                      marginBottom: '24px',
                      border: '1px solid #90caf9'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1565c0', marginBottom: '8px' }}>
                        📊 CONTEXTE DU TYPE DE CHAMBRE
                      </div>
                      <div style={{ fontSize: '14px', color: '#1976d2' }}>
                        <strong>Type:</strong> {getRoomTypeName(currentRoom.roomTypeId)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#1976d2', marginTop: '4px' }}>
                        Chambres totales de ce type: {getRoomTypeCount(currentRoom.roomTypeId)} | 
                        Disponibles: {getAvailableCount(currentRoom.roomTypeId)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#0d47a1', marginTop: '8px', fontStyle: 'italic' }}>
                        💡 Les modifications de cette chambre affectent la disponibilité "{getRoomTypeName(currentRoom.roomTypeId)}" sur le site public
                      </div>
                    </div>
                  )}
                  
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Numéro de Chambre</label>
                    <input 
                      type="text" 
                      name="number" 
                      value={currentRoom.number || currentRoom.id} 
                      onChange={handleRoomNumberChange}
                      placeholder="e.g., 101, 102, 201"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2c3e50'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Type de Chambre</label>
                    <select 
                      name="roomTypeId" 
                      value={currentRoom.roomTypeId} 
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2c3e50'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    >
                      <option value="">Sélectionner le type de chambre</option>
                      {roomTypes.map(roomType => (
                        <option key={roomType.id} value={roomType.id}>
                          {roomType.name} - {Number(roomType.baseRate).toLocaleString()} FCFA/night
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '32px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Statut</label>
                    <select 
                      name="status" 
                      value={currentRoom.status} 
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2c3e50'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    >
                      <option value="Available">Disponible</option>
                      <option value="Occupied">Occupé</option>
                      <option value="Reserved">Réservé</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </>
              ) : (
                /* View Mode */
                <div className="view-details">
                  <div className="vertical-details">
                    <div className="detail-row">
                      <span className="detail-label">Room Number:</span>
                      <span className="detail-value">{currentRoom.number || currentRoom.id}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{currentRoom.type}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Capacity:</span>
                      <span className="detail-value">{currentRoom.capacity} {currentRoom.capacity > 1 ? 'Persons' : 'Person'}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Price per Night:</span>
                      <span className="detail-value price-value">{currentRoom.price.toFixed(0)} FCFA</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">
                        <span className={`status-badge ${currentRoom.status.toLowerCase()}`}>
                          {currentRoom.status}
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Amenities:</span>
                      <span className="detail-value">{currentRoom.amenities.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{
              padding: '24px 32px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              backgroundColor: '#f8fafc'
            }}>
              {statusMessage && (
                <div style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {statusMessage}
                </div>
              )}
              {modalMode === 'edit' ? (
                <>
                  <button 
                    onClick={closeModal}
                    style={{
                      padding: '12px 24px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      backgroundColor: 'white',
                      color: '#64748b',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveRoomChanges} 
                    disabled={isSubmitting}
                    style={{
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isSubmitting ? 0.6 : 1,
                      boxShadow: '0 4px 12px rgba(44, 62, 80, 0.3)'
                    }}
                    onMouseEnter={(e) => !isSubmitting && (e.target.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => !isSubmitting && (e.target.style.transform = 'translateY(0)')}
                  >
                    {isSubmitting ? 'Enregistrement...' : '✓ Enregistrer les Modifications'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={closeModal}
                    style={{
                      padding: '12px 24px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      backgroundColor: 'white',
                      color: '#64748b',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setOriginalRoomId(currentRoom.id);
                      setModalMode('edit');
                    }}
                    style={{
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(44, 62, 80, 0.3)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Edit Room
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      ))}
    </div>
  );
});

Rooms.displayName = 'Rooms';

export default Rooms;
