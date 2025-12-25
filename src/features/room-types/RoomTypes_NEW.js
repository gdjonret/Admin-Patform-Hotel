import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { MdAdd, MdRefresh, MdEdit, MdDelete, MdSave, MdClose, MdVisibility } from 'react-icons/md';
import ImageUploader from './components/ImageUploader';
import AmenitiesEditor from './components/AmenitiesEditor';
import RoomPreviewCard from './components/RoomPreviewCard';
import './RoomTypes_NEW.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const RoomTypes = forwardRef((props, ref) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    capacity: 1,
    baseRate: 20000,
    sortOrder: 0,
    active: true,
    amenitiesJson: JSON.stringify({
      equipment: ['Climatisation', 'Télévision'],
      amenities: ['Wi-Fi gratuit', 'Réception 24h/24']
    }, null, 2)
  });
  
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch room types
  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/room-types`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setRoomTypes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching room types:', err);
      setError(err.response?.data?.message || 'Failed to fetch room types');
    } finally {
      setLoading(false);
    }
  };

  const openNewRoomType = () => {
    setFormData({
      name: '',
      capacity: 1,
      baseRate: 20000,
      sortOrder: 0,
      active: true,
      amenitiesJson: JSON.stringify({
        equipment: ['Climatisation', 'Télévision'],
        amenities: ['Wi-Fi gratuit', 'Réception 24h/24']
      }, null, 2)
    });
    setImages([]);
    setDescription('');
    setSelectedRoomType(null);
    setIsEditing(true);
    setStatusMessage('');
  };

  useImperativeHandle(ref, () => ({
    openNewRoomTypeModal: openNewRoomType
  }));

  const openEditRoomType = (roomType) => {
    setFormData({
      id: roomType.id,
      name: roomType.name,
      capacity: roomType.capacity,
      baseRate: roomType.baseRate,
      sortOrder: roomType.sortOrder || 0,
      active: roomType.active,
      amenitiesJson: roomType.amenitiesJson || JSON.stringify({
        equipment: [],
        amenities: []
      }, null, 2)
    });
    
    const existingImages = (roomType.images || []).map((url, index) => ({
      id: Date.now() + index,
      url: url,
      name: `Image ${index + 1}`,
      existing: true
    }));
    setImages(existingImages);
    setDescription(roomType.description || '');
    setSelectedRoomType(roomType);
    setIsEditing(true);
    setStatusMessage('');
  };

  const closeEditor = () => {
    setIsEditing(false);
    setSelectedRoomType(null);
    setFormData({
      name: '',
      capacity: 1,
      baseRate: 20000,
      sortOrder: 0,
      active: true,
      amenitiesJson: JSON.stringify({
        equipment: [],
        amenities: []
      }, null, 2)
    });
    setImages([]);
    setDescription('');
    setStatusMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const uploadImages = async (imagesList) => {
    const uploadedUrls = [];
    
    for (const image of imagesList) {
      if (image.existing) {
        uploadedUrls.push(image.url);
      } else if (image.file) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', image.file);
          
          const response = await axios.post(
            `${BACKEND_URL}/api/admin/images/upload`,
            formDataUpload,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          uploadedUrls.push(response.data.url);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }
    
    return uploadedUrls;
  };

  const saveRoomType = async () => {
    if (!formData.name || formData.name.trim() === '') {
      setStatusMessage('❌ Room name is required');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Uploading images and saving...');

    try {
      const imageUrls = await uploadImages(images);
      
      const payload = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        baseRate: parseFloat(formData.baseRate),
        sortOrder: parseInt(formData.sortOrder || 0),
        active: formData.active,
        amenitiesJson: formData.amenitiesJson,
        images: imageUrls,
        description: description,
        featuredImage: imageUrls[0] || null
      };

      if (selectedRoomType) {
        payload.id = formData.id;
        await axios.put(`${BACKEND_URL}/api/admin/room-types/${formData.id}`, payload, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        setStatusMessage('✓ Room type updated successfully!');
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/room-types`, payload, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        setStatusMessage('✓ Room type created successfully!');
      }

      await fetchRoomTypes();
      setTimeout(() => closeEditor(), 1500);
    } catch (err) {
      console.error('Error saving room type:', err);
      setStatusMessage(`❌ ${err.response?.data?.message || 'Failed to save'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRoomType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room type?')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/room-types/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchRoomTypes();
    } catch (err) {
      console.error('Error deleting room type:', err);
      alert(err.response?.data?.message || 'Failed to delete room type');
    }
  };

  if (loading) {
    return (
      <div className="room-types-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading room types...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="content-manager-wrapper">
        {/* Top Bar */}
        <div className="content-manager-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Room Content Manager</h1>
              <p>{selectedRoomType ? 'Edit Room Type' : 'Create New Room Type'}</p>
            </div>
            <div className="header-actions">
              <button className="btn-secondary" onClick={closeEditor}>
                <MdClose size={20} />
                Close
              </button>
              <button className="btn-primary" onClick={saveRoomType} disabled={isSubmitting}>
                <MdSave size={20} />
                {isSubmitting ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`status-banner ${statusMessage.includes('❌') ? 'error' : 'success'}`}>
            {statusMessage}
          </div>
        )}

        {/* Split Screen Layout */}
        <div className="split-screen-container">
          {/* Left Panel - Edit Form */}
          <div className="edit-panel">
            <div className="panel-header">
              <h2>Edit Room Details</h2>
            </div>
            <div className="panel-content">
              
              {/* Room Name */}
              <div className="form-group">
                <label>Room Type Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Deluxe Single, Suite Présidentielle"
                  className="form-input"
                />
              </div>

              {/* Capacity & Price */}
              <div className="form-row">
                <div className="form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    className="form-input"
                  />
                  <small>Max guests</small>
                </div>
                <div className="form-group">
                  <label>Price (FCFA) *</label>
                  <input
                    type="number"
                    name="baseRate"
                    value={formData.baseRate}
                    onChange={handleInputChange}
                    step="1000"
                    min="0"
                    className="form-input"
                  />
                  <small>Per night</small>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this room type..."
                  rows="3"
                  className="form-input"
                />
              </div>

              {/* Images */}
              <div className="form-group">
                <label>Room Images</label>
                <ImageUploader 
                  images={images}
                  onChange={setImages}
                  maxImages={10}
                />
              </div>

              {/* Equipment & Amenities */}
              <div className="form-group">
                <label>Equipment & Amenities</label>
                <AmenitiesEditor 
                  amenitiesJson={formData.amenitiesJson}
                  onChange={handleInputChange}
                />
              </div>

              {/* Active Toggle */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                  <span>Active (visible on booking site)</span>
                </label>
              </div>

              {/* Sort Order */}
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  className="form-input"
                />
                <small>Lower numbers appear first</small>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="preview-panel">
            <div className="panel-header">
              <h2>Live Preview</h2>
              <span className="preview-badge">
                <MdVisibility size={16} />
                Real-time
              </span>
            </div>
            <div className="panel-content">
              <RoomPreviewCard 
                roomType={formData}
                images={images}
                description={description}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="room-types-container">
      <div className="room-types-header">
        <div className="header-left">
          <h1>Room Types</h1>
          <p>Manage your hotel room types and content</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchRoomTypes}>
            <MdRefresh size={20} />
            Refresh
          </button>
          <button className="btn-primary" onClick={openNewRoomType}>
            <MdAdd size={20} />
            New Room Type
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="room-types-list">
        {roomTypes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏨</div>
            <h3>No room types yet</h3>
            <p>Create your first room type to get started</p>
            <button className="btn-primary" onClick={openNewRoomType}>
              <MdAdd size={20} />
              Create Room Type
            </button>
          </div>
        ) : (
          <div className="room-types-grid">
            {roomTypes.map(roomType => (
              <div key={roomType.id} className="room-type-card">
                <div className="card-image">
                  {roomType.images && roomType.images.length > 0 ? (
                    <img src={roomType.images[0]} alt={roomType.name} />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                  <div className="image-count">
                    📷 {roomType.images?.length || 0}
                  </div>
                </div>
                <div className="card-content">
                  <h3>{roomType.name}</h3>
                  <p className="price">{Number(roomType.baseRate).toLocaleString()} FCFA/night</p>
                  <p className="capacity">👥 {roomType.capacity} Guest{roomType.capacity > 1 ? 's' : ''}</p>
                  <div className="card-actions">
                    <button className="btn-edit" onClick={() => openEditRoomType(roomType)}>
                      <MdEdit size={18} />
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => deleteRoomType(roomType.id)}>
                      <MdDelete size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default RoomTypes;
