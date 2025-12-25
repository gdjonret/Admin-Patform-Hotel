import React, { useState } from 'react';
import './RoomPreviewCard.css';

const RoomPreviewCard = ({ roomType, images, description }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Parse quick amenities (for room card display)
  let equipment = [];
  let amenities = [];
  try {
    if (roomType?.quickEquipment) {
      equipment = JSON.parse(roomType.quickEquipment);
    }
  } catch (e) {
    console.error('Error parsing quick equipment:', e);
  }
  
  try {
    if (roomType?.quickAmenities) {
      amenities = JSON.parse(roomType.quickAmenities);
    }
  } catch (e) {
    console.error('Error parsing quick amenities:', e);
  }

  // Get image URLs
  const imageUrls = images.length > 0 
    ? images.map(img => img.url || img.preview) 
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const allItems = [...equipment, ...amenities];

  return (
    <div className="room-preview-wrapper">
      {/* Preview Info Banner */}
      <div className="preview-info-banner">
        <i className="fas fa-info-circle"></i>
        <span>This is how customers will see this room on BookNow</span>
      </div>

      {/* Room Card Preview */}
      <div className="room-card-preview">
        {/* Image Section */}
        <div className="room-card-image">
          <img 
            src={imageUrls[currentImageIndex]} 
            alt={roomType?.name || 'Room'} 
          />
          
          {/* Price Overlay */}
          <div className="price-tag">
            {roomType?.baseRate ? `${Number(roomType.baseRate).toLocaleString()} FCFA/night` : '0 FCFA/night'}
          </div>
          
          {/* Photo Count */}
          <div className="photo-badge">
            <i className="fas fa-camera"></i> {imageUrls.length}
          </div>
          
          {/* Carousel Controls */}
          {imageUrls.length > 1 && (
            <>
              <button className="carousel-btn prev-btn" onClick={prevImage}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="carousel-btn next-btn" onClick={nextImage}>
                <i className="fas fa-chevron-right"></i>
              </button>
            </>
          )}
        </div>

        {/* Details Section */}
        <div className="room-card-details">
          <div className="room-card-header">
            <h3>{roomType?.name?.toUpperCase() || 'ROOM NAME'}</h3>
            <button 
              className="more-details-btn"
              onClick={() => setShowDetailsModal(true)}
            >
              More details <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="room-card-info">
            <div className="info-row">
              <i className="fas fa-users"></i>
              <span><strong>Max Occupancy:</strong> {roomType?.capacity || 1} Guest{roomType?.capacity > 1 ? 's' : ''}</span>
            </div>

            {equipment.length > 0 && (
              <div className="info-row">
                <i className="fas fa-snowflake"></i>
                <span><strong>Equipment:</strong> {equipment.join(', ')}</span>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="info-row">
                <i className="fas fa-wifi"></i>
                <span><strong>Amenities:</strong> {amenities.join(', ')}</span>
              </div>
            )}

            <div className="info-row">
              <i className="fas fa-money-bill"></i>
              <span><strong>Price:</strong> {roomType?.baseRate ? `${Number(roomType.baseRate).toLocaleString()} FCFA/night` : '0 FCFA/night'}</span>
            </div>

            {description && (
              <div className="room-description">
                <p>{description}</p>
              </div>
            )}
          </div>

          <button className="book-now-button">
            Book Now <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="details-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Room Information</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Image */}
              <div className="modal-image">
                <img 
                  src={imageUrls[currentImageIndex]} 
                  alt={roomType?.name || 'Room'} 
                />
                {imageUrls.length > 1 && (
                  <>
                    <button className="carousel-btn prev-btn" onClick={prevImage}>
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button className="carousel-btn next-btn" onClick={nextImage}>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </>
                )}
              </div>

              {/* Details */}
              <div className="modal-details">
                <h3>{roomType?.name?.toUpperCase() || 'ROOM NAME'}</h3>
                {description && <p className="modal-description">{description}</p>}
                
                {/* Amenities Grid */}
                {allItems.length > 0 && (
                  <div className="amenities-grid">
                    {allItems.map((item, index) => (
                      <div key={index} className="amenity-badge">
                        <i className="fas fa-check-circle"></i>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Info */}
                <div className="additional-info">
                  <div className="info-item">
                    <i className="fas fa-users"></i>
                    <span>Sleeps {roomType?.capacity || 1} guest{roomType?.capacity > 1 ? 's' : ''}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-money-bill"></i>
                    <span>{roomType?.baseRate ? `${Number(roomType.baseRate).toLocaleString()} FCFA/night` : '0 FCFA/night'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-camera"></i>
                    <span>{imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPreviewCard;
