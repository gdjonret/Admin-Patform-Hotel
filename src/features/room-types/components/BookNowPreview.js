import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './BookNowOriginal.css';
import AmenitiesParser from '../../../utils/amenitiesParser';

const BookNowPreview = ({ roomType, images, description, onUpdateAmenities }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [editingEquipment, setEditingEquipment] = useState(false);
  const [editingAmenities, setEditingAmenities] = useState(false);
  const [tempEquipment, setTempEquipment] = useState([]);
  const [tempAmenities, setTempAmenities] = useState([]);

  // Parse detailed amenities (for modal) using shared utility
  const { equipment: detailedEquipment, amenities: detailedAmenities } = AmenitiesParser.parse(roomType?.amenitiesJson);
  
  // Parse quick amenities (for room card)
  let quickEquipment = [];
  let quickAmenities = [];
  try {
    if (roomType?.quickEquipment) {
      quickEquipment = JSON.parse(roomType.quickEquipment);
    } else {
      // Default values for new room types
      quickEquipment = ['Climatisation', 'Télévision', 'Bureau de travail'];
    }
  } catch (e) {
    console.error('Error parsing quick equipment:', e);
    quickEquipment = ['Climatisation', 'Télévision', 'Bureau de travail'];
  }
  
  try {
    if (roomType?.quickAmenities) {
      quickAmenities = JSON.parse(roomType.quickAmenities);
    } else {
      // Default values for new room types
      quickAmenities = ['Wi-Fi gratuit', 'Réception 24h/24'];
    }
  } catch (e) {
    console.error('Error parsing quick amenities:', e);
    quickAmenities = ['Wi-Fi gratuit', 'Réception 24h/24'];
  }

  // Use temp values in modal if available, otherwise use parsed values
  const displayEquipment = showModal && tempEquipment.length >= 0 ? tempEquipment : detailedEquipment;
  const displayAmenities = showModal && tempAmenities.length >= 0 ? tempAmenities : detailedAmenities;

  // Get image URLs - use uploaded images
  const imageUrls = images.length > 0 
    ? images.map(img => img.url || img.preview) 
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const openModal = (e) => {
    e.preventDefault();
    setShowModal(true);
    setModalImageIndex(0);
    // Initialize temp values with current detailed amenities
    setTempEquipment([...detailedEquipment]);
    setTempAmenities([...detailedAmenities]);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEquipment(false);
    setEditingAmenities(false);
  };

  const handleAddEquipment = (newItem) => {
    if (newItem && newItem.trim() && !tempEquipment.includes(newItem.trim())) {
      const updated = [...tempEquipment, newItem.trim()];
      setTempEquipment(updated);
      updateAmenitiesJson(updated, tempAmenities);
    }
  };

  const handleRemoveEquipment = (index) => {
    const updated = tempEquipment.filter((_, i) => i !== index);
    setTempEquipment(updated);
    updateAmenitiesJson(updated, tempAmenities);
  };

  const handleAddAmenity = (newItem) => {
    if (newItem && newItem.trim() && !tempAmenities.includes(newItem.trim())) {
      const updated = [...tempAmenities, newItem.trim()];
      setTempAmenities(updated);
      updateAmenitiesJson(tempEquipment, updated);
    }
  };

  const handleRemoveAmenity = (index) => {
    const updated = tempAmenities.filter((_, i) => i !== index);
    setTempAmenities(updated);
    updateAmenitiesJson(tempEquipment, updated);
  };

  const updateAmenitiesJson = (equipmentList, amenitiesList) => {
    if (onUpdateAmenities) {
      const newAmenitiesJson = AmenitiesParser.stringify(equipmentList, amenitiesList);
      onUpdateAmenities(newAmenitiesJson);
      
      // Show save reminder
      console.log('✅ Amenities updated in form. Remember to click "Save Room Type" to persist!');
    }
  };

  const nextModalImage = () => {
    setModalImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevModalImage = () => {
    setModalImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };


  return (
    <div className="booknow-preview-wrapper">
      {/* EXACT COPY OF BOOKNOW.EJS ROOM CARD */}
      <div className="room-container">
        {/* Image with Carousel - Exact structure from BookNow.ejs line 156-170 */}
        <div className="room-image room-card-carousel">
          {imageUrls.length > 0 ? (
            <>
              <img 
                src={imageUrls[currentImageIndex]} 
                alt={roomType?.name || 'Room'} 
                className="img-fluid rounded"
              />
              
              {/* Price Overlay - Exact from line 158 */}
              <div className="price-overlay">
                {roomType?.baseRate ? `${Number(roomType.baseRate).toLocaleString()} FCFA/night` : '0 FCFA/night'}
              </div>
              
              {/* Photo Count Badge - Exact from line 159-161 (but with REAL count, not random) */}
              <div className="photo-count-badge">
                <i className="fas fa-camera"></i> {imageUrls.length}
              </div>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              background: '#f3f4f6',
              color: '#6b7280',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              No images
            </div>
          )}
          
          {/* Carousel Controls - Exact from line 162-169 */}
          {imageUrls.length > 1 && (
            <>
              <button 
                className="carousel-control-prev room-card-prev" 
                type="button"
                onClick={prevImage}
              >
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>‹</span>
              </button>
              <button 
                className="carousel-control-next room-card-next" 
                type="button"
                onClick={nextImage}
              >
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>›</span>
              </button>
            </>
          )}
        </div>

        {/* Room Details - Exact structure from BookNow.ejs line 171-234 */}
        <div className="room-details">
          {/* Room Header - Exact from line 172-177 */}
          <div className="room-header">
            <h2>{roomType?.name?.toUpperCase() || 'ROOM NAME'}</h2>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="more-details-link" onClick={openModal}>
              More details <i className="fas fa-chevron-right"></i>
            </a>
          </div>

          {/* Max Occupancy - Exact from line 178 */}
          <p>
            <i className="fas fa-users icon"></i>
            <strong>Max Occupancy:</strong> {roomType?.capacity || 1} Guest{roomType?.capacity > 1 ? 's' : ''}
          </p>

          {/* Equipment - Show quick equipment */}
          {quickEquipment.length > 0 && (
            <p>
              <i className="fas fa-snowflake icon"></i>
              <strong>Equipment:</strong> {quickEquipment.join(', ')}
            </p>
          )}

          {/* Amenities - Show quick amenities */}
          {quickAmenities.length > 0 && (
            <p>
              <i className="fas fa-wifi icon"></i>
              <strong>Amenities:</strong> {quickAmenities.join(', ')}
            </p>
          )}

          {/* Price - Exact from line 188 */}
          <p>
            <i className="fas fa-money-bill icon"></i>
            <strong>Price:</strong> {roomType?.baseRate ? `${Number(roomType.baseRate).toLocaleString()} FCFA/night` : '0 FCFA/night'}
          </p>

          {/* Description (optional - not in original but useful) */}
          {description && (
            <p style={{ marginTop: '15px', padding: '12px', background: '#f9f9f9', borderRadius: '8px', borderLeft: '3px solid #34495e' }}>
              <i className="fas fa-info-circle icon"></i>
              <strong>Description:</strong> {description}
            </p>
          )}

          {/* Book Now Button - Exact from line 206-223 */}
          <div className="room-buttons mt-4">
            <button className="btn btn-primary book-now-btn">
              Book Now
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Info Banner */}
      <div style={{
        marginTop: '20px',
        padding: '12px 16px',
        background: '#fef3c7',
        border: '1px solid #fde047',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: '#854d0e'
      }}>
        <i className="fas fa-info-circle" style={{ color: '#ca8a04', fontSize: '16px' }}></i>
        This is an exact copy of how customers will see this room on the BookNow page
      </div>

      {/* Room Details Modal - Split Screen: Preview + Edit */}
      {showModal && ReactDOM.createPortal(
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div 
            style={{ 
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '90vw',
              maxWidth: '1400px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h5 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Room Information - Preview & Edit</h5>
              <button 
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
              >×</button>
            </div>

            {/* Body - Split Screen */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1.3fr 1fr',
              flex: 1,
              overflow: 'hidden'
            }}>
              {/* LEFT: Preview */}
              <div style={{ padding: '32px', overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
                {/* Image Carousel */}
                <div className="carousel slide" style={{ marginBottom: '20px', position: 'relative' }}>
                  <div className="carousel-inner">
                    <div 
                      className="carousel-item active"
                      style={{
                        background: '#000',
                        borderRadius: '14px',
                        minHeight: '420px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px'
                      }}
                    >
                      <img 
                        src={imageUrls[modalImageIndex]} 
                        className="d-block"
                        alt={roomType?.name || 'Room'}
                        style={{ 
                          maxHeight: '396px',
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  </div>
                  {imageUrls.length > 1 && (
                    <>
                      <button 
                        className="carousel-control-prev" 
                        type="button"
                        onClick={prevModalImage}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '15px',
                          transform: 'translateY(-50%)',
                          zIndex: 5,
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: 0.9,
                          transition: 'opacity 0.3s',
                          color: '#fff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                      >
                        <i className="fas fa-chevron-left" aria-hidden="true"></i>
                      </button>
                      <button 
                        className="carousel-control-next" 
                        type="button"
                        onClick={nextModalImage}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '15px',
                          transform: 'translateY(-50%)',
                          zIndex: 5,
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: 0.9,
                          transition: 'opacity 0.3s',
                          color: '#fff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                      >
                        <i className="fas fa-chevron-right" aria-hidden="true"></i>
                      </button>
                    </>
                  )}
                </div>

                {/* Room Details - EXACT COPY from BookNow.ejs modal */}
                <div className="modal-room-details" style={{ padding: '25px' }}>
                  <h3 id="modalRoomName" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                    {roomType?.name || 'ROOM NAME'}
                  </h3>
                  <p id="modalRoomSubtitle" style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>City view</p>
                  
                  {/* Amenities Grid - Exact CSS from BookNow.css */}
                  <div className="row" style={{ marginTop: '1.5rem' }}>
                    <div className="col-md-6">
                      <div className="amenity-item" style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: '12px', 
                        marginBottom: '15px',
                        padding: '10px',
                        background: '#e8ecf1',
                        borderRadius: '8px',
                        transition: 'background 0.3s ease'
                      }}>
                        <i className="fas fa-snowflake" style={{ color: '#1a1a1a', fontSize: '1.1rem', marginTop: '2px', flexShrink: 0 }}></i>
                        <div>
                          <strong style={{ color: '#1a1a1a', fontWeight: 400, fontSize: '0.9rem' }}>Climatisation</strong>
                        </div>
                      </div>
                      <div className="amenity-item" style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: '12px', 
                        marginBottom: '15px',
                        padding: '10px',
                        background: '#e8ecf1',
                        borderRadius: '8px',
                        transition: 'background 0.3s ease'
                      }}>
                        <i className="fas fa-bell" style={{ color: '#1a1a1a', fontSize: '1.1rem', marginTop: '2px', flexShrink: 0 }}></i>
                        <div>
                          <strong style={{ color: '#1a1a1a', fontWeight: 400, fontSize: '0.9rem' }}>Reception 24/7</strong>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="amenity-item" style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: '12px', 
                        marginBottom: '15px',
                        padding: '10px',
                        background: '#e8ecf1',
                        borderRadius: '8px',
                        transition: 'background 0.3s ease'
                      }}>
                        <i className="fas fa-utensils" style={{ color: '#1a1a1a', fontSize: '1.1rem', marginTop: '2px', flexShrink: 0 }}></i>
                        <div>
                          <strong style={{ color: '#1a1a1a', fontWeight: 400, fontSize: '0.9rem' }}>Restaurant/Bar</strong>
                        </div>
                      </div>
                      <div className="amenity-item" style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: '12px', 
                        marginBottom: '15px',
                        padding: '10px',
                        background: '#e8ecf1',
                        borderRadius: '8px',
                        transition: 'background 0.3s ease'
                      }}>
                        <i className="fas fa-parking" style={{ color: '#1a1a1a', fontSize: '1.1rem', marginTop: '2px', flexShrink: 0 }}></i>
                        <div>
                          <strong style={{ color: '#1a1a1a', fontWeight: 400, fontSize: '0.9rem' }}>Parking</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Room Details - Exact CSS from BookNow.css */}
                  <div className="room-details-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 20px', marginTop: '1.5rem' }}>
                    <div className="room-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', color: '#333' }}>
                      <i className="fas fa-expand-arrows-alt" style={{ fontSize: '1.2rem', color: '#1a1a1a', width: '24px', textAlign: 'center' }}></i>
                      <span style={{ fontWeight: 400 }}>310 sq ft</span>
                    </div>
                    <div className="room-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', color: '#333' }}>
                      <i className="fas fa-users" style={{ fontSize: '1.2rem', color: '#1a1a1a', width: '24px', textAlign: 'center' }}></i>
                      <span style={{ fontWeight: 400 }}>Sleeps {roomType?.capacity || 4}</span>
                    </div>
                    <div className="room-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', color: '#333' }}>
                      <i className="fas fa-bed" style={{ fontSize: '1.2rem', color: '#1a1a1a', width: '24px', textAlign: 'center' }}></i>
                      <span style={{ fontWeight: 400 }}>1 King Bed</span>
                    </div>
                    <div className="room-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', color: '#333' }}>
                      <i className="fas fa-wifi" style={{ fontSize: '1.2rem', color: '#1a1a1a', width: '24px', textAlign: 'center' }}></i>
                      <span style={{ fontWeight: 400 }}>Free WiFi</span>
                    </div>
                  </div>

                  {/* Room Amenities Section - Exact CSS from BookNow.css */}
                  <div style={{ marginTop: '2.5rem' }}>
                    <h4 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a' }}>Équipements de la Chambre</h4>
                    
                    <div className="amenities-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                      {/* Bedroom */}
                      <div className="amenity-category" style={{ marginBottom: '2rem' }}>
                        <h5 className="amenity-category-title" style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: 600, 
                          color: '#1a1a1a', 
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <i className="fas fa-bed" style={{ fontSize: '1.3rem', color: '#1a1a1a' }}></i> Chambre 
                        </h5>
                        <ul className="amenity-list" style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                          {displayEquipment.length > 0 ? displayEquipment.map((item, idx) => (
                            <li key={idx} style={{ 
                              padding: '0.5rem 0', 
                              color: '#333', 
                              fontSize: '1rem',
                              position: 'relative',
                              paddingLeft: '25px'
                            }}>
                              <span style={{
                                content: '•',
                                position: 'absolute',
                                left: 0,
                                color: '#333',
                                fontSize: '1.2rem'
                              }}>•</span>
                              {item}
                            </li>
                          )) : (
                            <>
                              <li style={{ padding: '0.5rem 0', color: '#333', fontSize: '1rem', position: 'relative', paddingLeft: '25px' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#333', fontSize: '1.2rem' }}>•</span>
                                Bureau de Travail
                              </li>
                              <li style={{ padding: '0.5rem 0', color: '#333', fontSize: '1rem', position: 'relative', paddingLeft: '25px' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#333', fontSize: '1.2rem' }}>•</span>
                                Television
                              </li>
                              <li style={{ padding: '0.5rem 0', color: '#333', fontSize: '1rem', position: 'relative', paddingLeft: '25px' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#333', fontSize: '1.2rem' }}>•</span>
                                Wifi
                              </li>
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Bathroom */}
                      <div className="amenity-category" style={{ marginBottom: '2rem' }}>
                        <h5 className="amenity-category-title" style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: 600, 
                          color: '#1a1a1a', 
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <i className="fas fa-bath" style={{ fontSize: '1.3rem', color: '#1a1a1a' }}></i> Toilettes
                        </h5>
                        <ul className="amenity-list" style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                          {displayAmenities.length > 0 ? displayAmenities.map((item, idx) => (
                            <li key={idx} style={{ 
                              padding: '0.5rem 0', 
                              color: '#333', 
                              fontSize: '1rem',
                              position: 'relative',
                              paddingLeft: '25px'
                            }}>
                              <span style={{
                                position: 'absolute',
                                left: 0,
                                color: '#333',
                                fontSize: '1.2rem'
                              }}>•</span>
                              {item}
                            </li>
                          )) : (
                            <>
                              <li style={{ padding: '0.5rem 0', color: '#333', fontSize: '1rem', position: 'relative', paddingLeft: '25px' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#333', fontSize: '1.2rem' }}>•</span>
                                Eau Chaude
                              </li>
                              <li style={{ padding: '0.5rem 0', color: '#333', fontSize: '1rem', position: 'relative', paddingLeft: '25px' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#333', fontSize: '1.2rem' }}>•</span>
                                Serviettes et draps
                              </li>
                              <li style={{ padding: '0.5rem 0', color: '#333', fontSize: '1rem', position: 'relative', paddingLeft: '25px' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#333', fontSize: '1.2rem' }}>•</span>
                                Savon et papier toilette
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description if available */}
                  {description && (
                    <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #0ea5e9' }}>
                      <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#0ea5e9' }}></i>
                        Description
                      </h5>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{description}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* End Preview Section */}

              {/* RIGHT: Edit */}
              <div style={{ padding: '32px', background: '#f8fafc', overflowY: 'auto' }}>
                <h6 style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '20px'
                }}>
                  <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
                  Edit Amenities
                </h6>
                
                <div className="alert alert-success" style={{ marginBottom: '20px', fontSize: '13px', padding: '12px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', color: '#065f46' }}>
                  <i className="fas fa-check-circle"></i> Changes are saved automatically and reflected in the preview!
                </div>
                
                {/* Equipment Section */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h6 style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      <i className="fas fa-snowflake" style={{ color: '#0ea5e9', marginRight: '8px' }}></i>
                      Equipment
                    </h6>
                    <button
                      onClick={() => setEditingEquipment(!editingEquipment)}
                      style={{
                        background: editingEquipment ? '#ef4444' : '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className={`fas fa-${editingEquipment ? 'times' : 'plus'}`}></i>
                      {editingEquipment ? 'Cancel' : 'Add'}
                    </button>
                  </div>
                  
                  {editingEquipment && (
                    <div style={{ marginBottom: '12px' }}>
                      <input
                        type="text"
                        placeholder="Type equipment name and press Enter..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddEquipment(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '2px solid #0ea5e9',
                          borderRadius: '6px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                      <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                        Press Enter to add
                      </small>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tempEquipment.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>No equipment added</p>
                    ) : (
                      tempEquipment.map((item, index) => (
                        <div key={`eq-${index}`} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: 'white',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '13px'
                        }}>
                          <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '12px' }}></i>
                          <span>{item}</span>
                          <button
                            onClick={() => handleRemoveEquipment(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0 4px',
                              fontSize: '14px',
                              marginLeft: '4px'
                            }}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Amenities Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h6 style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      <i className="fas fa-wifi" style={{ color: '#0ea5e9', marginRight: '8px' }}></i>
                      Amenities
                    </h6>
                    <button
                      onClick={() => setEditingAmenities(!editingAmenities)}
                      style={{
                        background: editingAmenities ? '#ef4444' : '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className={`fas fa-${editingAmenities ? 'times' : 'plus'}`}></i>
                      {editingAmenities ? 'Cancel' : 'Add'}
                    </button>
                  </div>
                  
                  {editingAmenities && (
                    <div style={{ marginBottom: '12px' }}>
                      <input
                        type="text"
                        placeholder="Type amenity name and press Enter..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddAmenity(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '2px solid #0ea5e9',
                          borderRadius: '6px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                      <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                        Press Enter to add
                      </small>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tempAmenities.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>No amenities added</p>
                    ) : (
                      tempAmenities.map((item, index) => (
                        <div key={`am-${index}`} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: 'white',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '13px'
                        }}>
                          <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '12px' }}></i>
                          <span>{item}</span>
                          <button
                            onClick={() => handleRemoveAmenity(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0 4px',
                              fontSize: '14px',
                              marginLeft: '4px'
                            }}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BookNowPreview;
