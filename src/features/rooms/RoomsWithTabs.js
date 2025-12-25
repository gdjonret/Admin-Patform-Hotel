import React, { useRef } from 'react';
import { Button } from '@mui/material';
import Rooms from './Rooms';
import './components/rooms.css';
import '../../features/reservations/components/modern-reservations-header.css';
import { useRole } from '../../hooks/useRole';

const RoomsWithTabs = () => {
  const roomsRef = useRef();
  const { isAdmin } = useRole();

  const handleAddClick = () => {
    if (roomsRef.current) {
      roomsRef.current.openNewRoomModal();
    }
  };

  return (
    <div className="rooms-container">
      {/* Modern Header Section */}
      <div className="modern-page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1 className="page-title">Toutes les Chambres</h1>
          </div>
          {/* Add button - Admin Only */}
          {isAdmin && (
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
              + Ajouter une Chambre
            </Button>
          )}
        </div>
      </div>

      {/* Room Content */}
      <div className="tab-content" style={{ marginTop: '0' }}>
        <Rooms ref={roomsRef} />
      </div>
    </div>
  );
};

export default RoomsWithTabs;
