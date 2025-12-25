import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { MdAdd, MdRefresh, MdEdit, MdDelete, MdSave, MdClose, MdMoreVert, MdSearch } from 'react-icons/md';
import { Button } from '@mui/material';
import ImageUploader from './components/ImageUploader';
import BookNowPreview from './components/BookNowPreview';
import { getDefaultAmenitiesJson, getDefaultQuickEquipmentJson, getDefaultQuickAmenitiesJson } from '../../utils/defaultAmenities';
import AmenitiesEditor from './components/AmenitiesEditor';
import './RoomTypes.css';
import './RoomTypes_Option3.css';
import '../reservations/components/modern-reservations-header.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const RoomTypes = forwardRef((props, ref) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    capacity: 1,
    baseRate: 20000,
    sortOrder: 0,
    active: true,
    amenitiesJson: getDefaultAmenitiesJson(),
    quickEquipment: getDefaultQuickEquipmentJson(),
    quickAmenities: getDefaultQuickAmenitiesJson()
  });
  
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ADDED: Validation and UI state
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);

  // Fetch room types
  useEffect(() => {
    fetchRoomTypes();
  }, []);

  // ADDED: Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing && !isSubmitting) {
          saveRoomType();
        }
      }
      // Escape to close
      if (e.key === 'Escape' && isEditing) {
        closeEditor();
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyboard);
      return () => document.removeEventListener('keydown', handleKeyboard);
    }
  }, [isEditing, isSubmitting]);

  // ADDED: Real-time validation
  const validateField = (name, value) => {
    switch(name) {
      case 'name':
        if (!value || value.trim() === '') return 'Le nom est requis';
        if (value.length < 3) return 'Le nom doit contenir au moins 3 caractères';
        if (value.length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
        return null;
      case 'capacity':
        if (!value || value < 1) return 'La capacité doit être au moins 1';
        if (value > 10) return 'La capacité ne peut pas dépasser 10';
        return null;
      case 'baseRate':
        if (!value || value <= 0) return 'Le tarif doit être supérieur à 0';
        if (value < 5000) return 'Le tarif semble trop bas (minimum recommandé: 5,000 FCFA)';
        return null;
      default:
        return null;
    }
  };

  // ADDED: Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // ADDED: Get field status (valid, invalid, warning)
  const getFieldStatus = (name) => {
    if (!touchedFields[name]) return '';
    if (fieldErrors[name]) return 'invalid';
    
    const value = formData[name];
    if (value) return 'valid';
    return '';
  };

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/room-types`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Room types data:', response.data);
      // Log first room type to check image structure
      if (response.data && response.data.length > 0) {
        console.log('First room type:', response.data[0]);
        console.log('Images field:', response.data[0].images);
      }
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
      amenitiesJson: getDefaultAmenitiesJson(),
      quickEquipment: getDefaultQuickEquipmentJson(),
      quickAmenities: getDefaultQuickAmenitiesJson()
    });
    setImages([]);
    setDescription('');
    setSelectedRoomType(null);
    setIsEditing(true);
    setStatusMessage('');
  };

  // Expose method to parent
  useImperativeHandle(ref, () => ({
    openNewRoomTypeModal: openNewRoomType
  }));

  const openEditRoomType = async (roomType) => {
    try {
      setStatusMessage('Loading room type...');
      
      // Fetch from Admin API (has all fields including sortOrder)
      const response = await axios.get(`${BACKEND_URL}/api/admin/room-types/${roomType.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = response.data;
      
      console.log('Room type data:', data);
      setFormData({
        id: data.id,
        name: data.name,
        capacity: data.capacity,
        baseRate: data.baseRate,
        sortOrder: data.sortOrder || 0,
        active: data.active,
        amenitiesJson: data.amenitiesJson || JSON.stringify({
          equipment: [],
          amenities: []
        }, null, 2),
        quickEquipment: data.quickEquipment || getDefaultQuickEquipmentJson(),
        quickAmenities: data.quickAmenities || getDefaultQuickAmenitiesJson()
      });
      
      // Load existing images (parse JSON string if needed)
      let imageUrls = [];
      try {
        if (data.images) {
          imageUrls = typeof data.images === 'string' 
            ? JSON.parse(data.images) 
            : data.images;
        }
      } catch (e) {
        console.error('Error parsing images:', e);
        imageUrls = [];
      }
      
      const existingImages = (imageUrls || []).map((url, index) => ({
        id: Date.now() + index,
        url: url,
        name: `Image ${index + 1}`,
        existing: true
      }));
      setImages(existingImages);
      setDescription(data.description || '');
      setSelectedRoomType(data);
      setIsEditing(true);
      setStatusMessage('✓ Room type loaded');
      
      // Clear success message after 2 seconds
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err) {
      console.error('Error loading room type:', err);
      setStatusMessage('❌ Failed to load room type');
      setTimeout(() => setStatusMessage(''), 3000);
    }
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
      amenitiesJson: getDefaultAmenitiesJson(),
      quickEquipment: getDefaultQuickEquipmentJson(),
      quickAmenities: getDefaultQuickAmenitiesJson()
    });
    setImages([]);
    setDescription('');
    setStatusMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // ADDED: Real-time validation
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, newValue);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  // ADDED: Validate image before upload
  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxDimension = 2000; // pixels
      
      // Check file size
      if (file.size > maxSize) {
        reject(new Error(`Image trop grande. Taille maximale: 5MB. Votre image: ${(file.size / 1024 / 1024).toFixed(2)}MB`));
        return;
      }
      
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        reject(new Error(`Type de fichier invalide. Autorisés: JPEG, PNG, WebP. Reçu: ${file.type}`));
        return;
      }
      
      // Check dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width > maxDimension || img.height > maxDimension) {
          reject(new Error(`Dimensions trop grandes. Maximum: ${maxDimension}x${maxDimension}px. Votre image: ${img.width}x${img.height}px`));
        } else {
          resolve(true);
        }
      };
      img.onerror = () => reject(new Error('Fichier image invalide'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImages = async (imagesList) => {
    console.log('📤 DEBUG: uploadImages called with:', imagesList);
    console.log('📤 DEBUG: imagesList length:', imagesList.length);
    
    const uploadedUrls = [];
    
    for (const image of imagesList) {
      console.log('📤 DEBUG: Processing image:', image);
      
      // Check if this is an existing image (has a server URL, not a data URL)
      if (image.existing || (image.url && image.url.startsWith('http'))) {
        console.log('✅ DEBUG: Using existing image URL:', image.url);
        uploadedUrls.push(image.url);
      } 
      // Check if this is a new image with a file object
      else if (image.file) {
        try {
          console.log('📤 DEBUG: Uploading new image file:', image.file.name);
          
          // VALIDATE before upload
          await validateImage(image.file);
          console.log('✅ DEBUG: Image validation passed');
          
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
          
          console.log('✅ DEBUG: Upload response:', response.data);
          uploadedUrls.push(response.data.url);
        } catch (error) {
          console.error('❌ DEBUG: Error uploading image:', error);
          console.error('❌ DEBUG: Error details:', error.response?.data);
          setStatusMessage(`❌ ${error.message || 'Erreur lors du téléchargement de l\'image'}`);
          throw error; // Stop the save process
        }
      } 
      // Skip data URLs without file objects (shouldn't happen, but log it)
      else if (image.url && image.url.startsWith('data:')) {
        console.error('❌ DEBUG: Found data URL without file object - this image will be skipped:', image);
        setStatusMessage(`❌ Image "${image.name}" has no file object - please re-add this image`);
        throw new Error(`Image "${image.name}" cannot be uploaded - missing file object`);
      }
      // Unknown image format
      else {
        console.warn('⚠️ DEBUG: Image has no file and is not existing:', image);
      }
    }
    
    console.log('✅ DEBUG: All uploads complete. URLs:', uploadedUrls);
    return uploadedUrls;
  };

  const saveRoomType = async () => {
    // Validate
    if (!formData.name || formData.name.trim() === '') {
      setStatusMessage('❌ Room name is required');
      return;
    }

    // Validate minimum images
    if (images.length < 3) {
      setStatusMessage('❌ Minimum 3 images required to publish');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Uploading images and saving...');

    try {
      // DEBUG: Log images state before upload
      console.log('🔍 DEBUG: Images state before upload:', images);
      console.log('🔍 DEBUG: Images count:', images.length);
      images.forEach((img, i) => {
        console.log(`🔍 DEBUG: Image ${i}:`, {
          id: img.id,
          name: img.name,
          url: img.url,
          existing: img.existing,
          hasFile: !!img.file
        });
      });
      
      // Upload images first
      const imageUrls = await uploadImages(images);
      
      // DEBUG: Log uploaded URLs
      console.log('✅ DEBUG: Uploaded URLs:', imageUrls);
      console.log('✅ DEBUG: URLs count:', imageUrls.length);
      
      const payload = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        baseRate: parseFloat(formData.baseRate),
        sortOrder: parseInt(formData.sortOrder || 0),
        active: formData.active,
        amenitiesJson: formData.amenitiesJson,
        quickEquipment: formData.quickEquipment,
        quickAmenities: formData.quickAmenities,
        images: JSON.stringify(imageUrls), // Store as JSON string
        description: description,
        featuredImage: imageUrls[0] || null
      };
      
      // DEBUG: Log final payload
      console.log('📦 DEBUG: Payload being sent:', payload);
      console.log('📦 DEBUG: Images field:', payload.images);
      console.log('📦 DEBUG: Featured image:', payload.featuredImage);

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

  const activeCount = roomTypes.filter(rt => rt.active).length;
  const inactiveCount = roomTypes.length - activeCount;
  const filteredRoomTypes = roomTypes.filter(rt => {
    if (statusFilter === 'active') {
      return rt.active;
    }
    if (statusFilter === 'inactive') {
      return !rt.active;
    }
    return true;
  });
  const hasRoomTypes = roomTypes.length > 0;
  const showFilteredEmpty = hasRoomTypes && filteredRoomTypes.length === 0;

  if (loading) {
    return (
      <div className="room-types-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Chargement des types de chambres...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="content-manager-container" style={{ background: '#f8fafc', minHeight: '100vh', paddingLeft: '45px' }}>
        {/* Modern Top Bar */}
        <div className="modal-top-bar">
          <div>
            <h2 className="modal-top-bar-title">
              {selectedRoomType ? 'Modifier le Type de Chambre' : 'Créer un Nouveau Type'}
            </h2>
            <p className="modal-top-bar-subtitle">
              <i className="fas fa-globe" style={{ fontSize: '13px' }}></i>
              Aperçu en temps réel de l'affichage sur le site de réservation
            </p>
          </div>
          <div className="modal-top-bar-actions">
            <button 
              className="btn-secondary" 
              onClick={closeEditor}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: 600,
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                borderRadius: '10px',
                transition: 'all 0.2s'
              }}
            >
              <MdClose size={20} />
              Fermer
            </button>
            <button 
              className="btn-primary" 
              onClick={saveRoomType} 
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                background: isSubmitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <MdSave size={20} />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer & Publier'}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`status-banner ${
            statusMessage.includes('❌') ? 'error' : 
            statusMessage.includes('⚠️') ? 'warning' : 
            'success'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Split Screen Layout */}
        <div className="split-screen-layout" style={{ height: 'calc(100vh - 180px)', padding: '24px 32px 32px 0', gap: '24px' }}>
          {/* Left Panel - Edit Form */}
          <div className="edit-panel" style={{ 
            background: 'white', 
            borderRadius: '16px', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb'
          }}>
            <div className="edit-panel-content" style={{ padding: '28px 28px 28px 32px' }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: 700, 
                color: '#111827', 
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f3f4f6'
              }}>
                Détails de la Chambre
              </h2>
              
              {/* Room Name */}
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    Nom du Type de Chambre <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>
                    {formData.name.length}/100
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => setTouchedFields(prev => ({ ...prev, name: true }))}
                  placeholder="e.g., Deluxe Single, Suite Présidentielle"
                  className={`form-input ${getFieldStatus('name')}`}
                  maxLength="100"
                />
                {getFieldStatus('name') === 'valid' && (
                  <small style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span>✓</span> Nom valide
                  </small>
                )}
                {fieldErrors.name && touchedFields.name && (
                  <small style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span>✗</span> {fieldErrors.name}
                  </small>
                )}
                <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Ce nom sera visible sur le site de réservation</small>
              </div>

              {/* Capacity & Price */}
              <div className="form-row">
                <div className="form-group">
                  <label>Capacité <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, capacity: true }))}
                    min="1"
                    max="10"
                    className={`form-input ${getFieldStatus('capacity')}`}
                  />
                  {getFieldStatus('capacity') === 'valid' && (
                    <small style={{ color: '#10b981' }}>✓ Valide (1-10 personnes)</small>
                  )}
                  {fieldErrors.capacity && touchedFields.capacity && (
                    <small style={{ color: '#ef4444' }}>✗ {fieldErrors.capacity}</small>
                  )}
                  {!fieldErrors.capacity && !getFieldStatus('capacity') && (
                    <small style={{ color: '#64748b' }}>Nombre maximum de personnes</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Tarif de Base (FCFA) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    name="baseRate"
                    value={formData.baseRate}
                    onChange={handleInputChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, baseRate: true }))}
                    step="1000"
                    min="0"
                    className={`form-input ${getFieldStatus('baseRate')}`}
                  />
                  {formData.baseRate > 0 && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px 12px', 
                      background: '#f0f9ff', 
                      border: '1px solid #bae6fd',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}>
                      <div style={{ fontWeight: 600, color: '#0369a1' }}>
                        {formatPrice(formData.baseRate)}/nuit
                      </div>
                      {activeBookingsCount > 0 && (
                        <div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '4px' }}>
                          ⚠️ {activeBookingsCount} réservation(s) active(s) - le changement affecte uniquement les nouvelles réservations
                        </div>
                      )}
                    </div>
                  )}
                  {fieldErrors.baseRate && touchedFields.baseRate && (
                    <small style={{ color: '#ef4444' }}>✗ {fieldErrors.baseRate}</small>
                  )}
                </div>
              </div>

              {/* Images */}
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Images de la Chambre <span style={{ color: '#dc2626' }}>*</span></span>
                  <span style={{ fontSize: '11px', color: images.length >= 3 ? '#10b981' : '#dc2626', fontWeight: 'normal' }}>
                    {images.length}/10 images {images.length < 3 && '(min. 3 requis)'}
                  </span>
                </label>
                {images.length < 3 && (
                  <div style={{ 
                    padding: '12px', 
                    background: images.length === 0 ? '#fffbeb' : '#fef2f2', 
                    border: images.length === 0 ? '1px solid #fde047' : '1px solid #fca5a5',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: images.length === 0 ? '#854d0e' : '#991b1b'
                  }}>
                    {images.length === 0 ? '💡' : '⚠️'} {images.length === 0 ? 'Recommandation' : 'Requis'}: Ajoutez au moins 3 images de haute qualité (JPEG, PNG, WebP · Max 5MB · 1200x800px recommandé)
                  </div>
                )}
                <ImageUploader 
                  images={images}
                  onChange={setImages}
                  maxImages={10}
                />
              </div>

              {/* Equipment & Amenities Editor */}
              <div className="form-group">
                <label>Équipements & Services</label>
                <AmenitiesEditor 
                  amenitiesJson={formData.amenitiesJson}
                  quickEquipment={formData.quickEquipment}
                  quickAmenities={formData.quickAmenities}
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
                  <span>Actif (visible sur le site de réservation)</span>
                </label>
              </div>

              {/* Sort Order */}
              <div className="form-group">
                <label>Ordre d'Affichage</label>
                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  className="form-input"
                />
                <small>Les numéros inférieurs apparaissent en premier</small>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="preview-panel">
            <div className="preview-panel-header">
              <h3>Aperçu en Direct - Page Réservation</h3>
              <span className="preview-badge">Temps réel</span>
            </div>
            <div className="preview-panel-content">
              <BookNowPreview 
                roomType={formData}
                images={images}
                description={description}
                onUpdateAmenities={(newAmenitiesJson) => {
                  console.log('Updating amenities in form:', newAmenitiesJson);
                  setFormData(prev => ({
                    ...prev,
                    amenitiesJson: newAmenitiesJson
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="room-types-cards">
      {/* Modern Header Section */}
      <div className="modern-page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1 className="page-title">Types de Chambres</h1>
          </div>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={openNewRoomType}
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
            + Ajouter un Type
          </Button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ margin: '0 24px 24px 24px' }}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Filter Pills */}
      <div className="filter-pills">
        <button
          className={`pill ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Tous ({roomTypes.length})
        </button>
        <button
          className={`pill ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          Actifs ({activeCount})
        </button>
        <button
          className={`pill ${statusFilter === 'inactive' ? 'active' : ''}`}
          onClick={() => setStatusFilter('inactive')}
        >
          Inactifs ({inactiveCount})
        </button>
      </div>

      {roomTypes.length === 0 ? (
        <div className="empty-enhanced">
          <div className="empty-icon">🏨</div>
          <h3 className="empty-title">Aucun type de chambre</h3>
          <p className="empty-description">Créez votre premier type de chambre pour commencer à gérer vos hébergements</p>
          <button className="empty-action" onClick={openNewRoomType}>
            <MdAdd size={20} />
            Créer un Type
          </button>
        </div>
      ) : showFilteredEmpty ? (
        <div className="empty-enhanced">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">Aucun résultat</h3>
          <p className="empty-description">Aucun type de chambre ne correspond à ce filtre</p>
        </div>
      ) : (
        <div className="room-cards-enhanced">
          {filteredRoomTypes.map(roomType => {
              // Parse quick amenities (for card display)
              let equipment = [];
              let amenities = [];
              try {
                if (roomType.quickEquipment) {
                  equipment = JSON.parse(roomType.quickEquipment);
                }
              } catch (e) {
                console.error('Error parsing quick equipment:', e);
              }
              
              try {
                if (roomType.quickAmenities) {
                  amenities = JSON.parse(roomType.quickAmenities);
                }
              } catch (e) {
                console.error('Error parsing quick amenities:', e);
              }

              // Parse images JSON string
              let imageArray = [];
              try {
                if (roomType.images) {
                  imageArray = typeof roomType.images === 'string' 
                    ? JSON.parse(roomType.images) 
                    : roomType.images;
                }
              } catch (e) {
                console.error('Error parsing images:', e);
              }

              // Get image URL
              let imageUrl = null;
              if (imageArray && Array.isArray(imageArray) && imageArray.length > 0) {
                imageUrl = imageArray[0];
              } else if (roomType.featuredImage) {
                imageUrl = roomType.featuredImage;
              } else if (roomType.image) {
                imageUrl = roomType.image;
              }

              return (
                <div key={roomType.id} className="room-card-enhanced">
                  {/* Card Image Section */}
                  <div className="card-image-section">
                    {imageUrl ? (
                      <img src={imageUrl} alt={roomType.name} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                        Pas d'image
                      </div>
                    )}
                    <div className="image-overlay"></div>
                    
                    {/* Status Badge - Top Left */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                      <div className={`badge ${roomType.active ? 'active' : 'inactive'}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <i className="fas fa-shield-alt" style={{ fontSize: '14px' }}></i>
                        {roomType.active ? 'ACTIF' : 'INACTIF'}
                      </div>
                    </div>
                    
                    {/* Photo Count - Top Right */}
                    {imageArray?.length > 0 && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <div className="badge" style={{ background: 'rgba(55, 65, 81, 0.9)', color: 'white' }}>
                          <i className="fas fa-camera"></i> {imageArray.length}
                        </div>
                      </div>
                    )}
                    
                    {/* Capacity - Bottom Left */}
                    <div style={{ position: 'absolute', bottom: '14px', left: '14px' }}>
                      <div style={{
                        padding: '8px 14px',
                        background: 'rgba(17, 24, 39, 0.92)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        transition: 'transform 0.2s ease'
                      }}>
                        <i className="fas fa-user"></i> {roomType.capacity}
                      </div>
                    </div>
                    
                    {/* Price - Bottom Right */}
                    <div className="card-price">
                      {Number(roomType.baseRate).toLocaleString()} FCFA/nuit
                    </div>
                  </div>

                  {/* Card Content Section */}
                  <div className="card-content-section">
                    <div className="card-header">
                      <h3 className="card-title">{roomType.name}</h3>
                      <div style={{ position: 'relative' }}>
                        <button 
                          className="card-menu" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === roomType.id ? null : roomType.id);
                          }}
                        >
                          <MdMoreVert size={20} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openMenuId === roomType.id && (
                          <>
                            <div 
                              style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 10
                              }}
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div 
                              style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                minWidth: '160px',
                                zIndex: 20,
                                overflow: 'hidden'
                              }}
                            >
                              <button
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'white',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  color: '#374151',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openEditRoomType(roomType);
                                }}
                              >
                                <MdEdit size={16} />
                                Modifier
                              </button>
                              <div style={{ height: '1px', background: '#f3f4f6' }} />
                              <button
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'white',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  color: '#dc2626',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  deleteRoomType(roomType.id);
                                }}
                              >
                                <MdDelete size={16} />
                                Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="room-info">
                      <div className="info-item">
                        <i className="fas fa-bed info-icon"></i>
                        <span>Chambre {roomType.name?.toLowerCase().includes('deluxe') ? 'Deluxe' : 'Standard'}</span>
                      </div>
                    </div>

                    {/* Tags Section */}
                    {(equipment.length > 0 || amenities.length > 0) && (
                      <div className="tags-section">
                        {equipment.length > 0 && (
                          <div className="tags-group">
                            {equipment.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="tag equipment">
                                {item}
                              </div>
                            ))}
                            {equipment.length > 3 && (
                              <div className="tag equipment">+{equipment.length - 3}</div>
                            )}
                          </div>
                        )}
                        {amenities.length > 0 && (
                          <div className="tags-group">
                            {amenities.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="tag amenity">
                                {item}
                              </div>
                            ))}
                            {amenities.length > 2 && (
                              <div className="tag amenity">+{amenities.length - 2}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
});

export default RoomTypes;
