import React, { useState, useEffect } from 'react';
import './AmenitiesEditor.css';

const AmenitiesEditor = ({ amenitiesJson, quickEquipment, quickAmenities, onChange }) => {
  const [quickEquipmentList, setQuickEquipmentList] = useState([]);
  const [quickAmenitiesList, setQuickAmenitiesList] = useState([]);
  const [detailedEquipment, setDetailedEquipment] = useState([]);
  const [detailedAmenities, setDetailedAmenities] = useState([]);
  const [newQuickEquipment, setNewQuickEquipment] = useState('');
  const [newQuickAmenity, setNewQuickAmenity] = useState('');
  const [newDetailedEquipment, setNewDetailedEquipment] = useState('');
  const [newDetailedAmenity, setNewDetailedAmenity] = useState('');

  // Parse JSON on mount and when it changes
  useEffect(() => {
    try {
      const parsed = JSON.parse(amenitiesJson || '{"equipment":[],"amenities":[]}');
      setDetailedEquipment(parsed.equipment || []);
      setDetailedAmenities(parsed.amenities || []);
    } catch (e) {
      console.error('Error parsing amenities:', e);
      setDetailedEquipment([]);
      setDetailedAmenities([]);
    }
  }, [amenitiesJson]);

  useEffect(() => {
    try {
      setQuickEquipmentList(quickEquipment ? JSON.parse(quickEquipment) : []);
    } catch (e) {
      console.error('Error parsing quick equipment list:', e);
      setQuickEquipmentList([]);
    }
  }, [quickEquipment]);

  useEffect(() => {
    try {
      setQuickAmenitiesList(quickAmenities ? JSON.parse(quickAmenities) : []);
    } catch (e) {
      console.error('Error parsing quick amenities list:', e);
      setQuickAmenitiesList([]);
    }
  }, [quickAmenities]);

  // Update parent when lists change
  const updateDetailedParent = (newEquipment, newAmenities) => {
    const updated = {
      equipment: newEquipment,
      amenities: newAmenities
    };
    onChange({
      target: {
        name: 'amenitiesJson',
        value: JSON.stringify(updated, null, 2)
      }
    });
  };

  const updateQuickEquipmentParent = (items) => {
    onChange({
      target: {
        name: 'quickEquipment',
        value: JSON.stringify(items)
      }
    });
  };

  const updateQuickAmenitiesParent = (items) => {
    onChange({
      target: {
        name: 'quickAmenities',
        value: JSON.stringify(items)
      }
    });
  };

  // Add equipment
  const addEquipment = () => {
    if (newDetailedEquipment.trim()) {
      const updated = [...detailedEquipment, newDetailedEquipment.trim()];
      setDetailedEquipment(updated);
      updateDetailedParent(updated, detailedAmenities);
      setNewDetailedEquipment('');
    }
  };

  // Remove equipment
  const removeEquipment = (index) => {
    const updated = detailedEquipment.filter((_, i) => i !== index);
    setDetailedEquipment(updated);
    updateDetailedParent(updated, detailedAmenities);
  };

  // Add amenity
  const addAmenity = () => {
    if (newDetailedAmenity.trim()) {
      const updated = [...detailedAmenities, newDetailedAmenity.trim()];
      setDetailedAmenities(updated);
      updateDetailedParent(detailedEquipment, updated);
      setNewDetailedAmenity('');
    }
  };

  // Remove amenity
  const removeAmenity = (index) => {
    const updated = detailedAmenities.filter((_, i) => i !== index);
    setDetailedAmenities(updated);
    updateDetailedParent(detailedEquipment, updated);
  };

  // Quick equipment handlers
  const addQuickEquipment = () => {
    if (newQuickEquipment.trim()) {
      const updated = [...quickEquipmentList, newQuickEquipment.trim()];
      setQuickEquipmentList(updated);
      updateQuickEquipmentParent(updated);
      setNewQuickEquipment('');
    }
  };

  const removeQuickEquipment = (index) => {
    const updated = quickEquipmentList.filter((_, i) => i !== index);
    setQuickEquipmentList(updated);
    updateQuickEquipmentParent(updated);
  };

  const addQuickAmenity = () => {
    if (newQuickAmenity.trim()) {
      const updated = [...quickAmenitiesList, newQuickAmenity.trim()];
      setQuickAmenitiesList(updated);
      updateQuickAmenitiesParent(updated);
      setNewQuickAmenity('');
    }
  };

  const removeQuickAmenity = (index) => {
    const updated = quickAmenitiesList.filter((_, i) => i !== index);
    setQuickAmenitiesList(updated);
    updateQuickAmenitiesParent(updated);
  };

  // Predefined suggestions
  const equipmentSuggestions = [
    'Climatisation',
    'Télévision',
    'Bureau de travail',
    'Mini-frigo',
    'Coffre-fort',
    'Cafetière',
    'Sèche-cheveux',
    'Fer à repasser'
  ];

  const amenitySuggestions = [
    'Wi-Fi gratuit',
    'Réception 24h/24',
    'Service en chambre',
    'Petit-déjeuner inclus',
    'Balcon',
    'Vue sur l\'océan',
    'Parking gratuit',
    'Piscine'
  ];

  const quickEquipmentSuggestions = ['Climatisation', 'Télévision', 'Bureau de travail'];
  const quickAmenitiesSuggestions = ['Wi-Fi gratuit', 'Réception 24h/24'];

  return (
    <div className="amenities-editor">
      {/* Quick Equipment Section */}
      <div className="amenities-section">
        <h4 className="section-title">
         {/* <i className="fas fa-bolt"></i> */}
          Équipements Rapides 
        </h4>

        <div className="items-list">
          {quickEquipmentList.length === 0 ? (
            <p className="empty-message">Aucun équipement rapide ajouté</p>
          ) : (
            quickEquipmentList.map((item, index) => (
              <div key={index} className="item-tag">
                <i className="fas fa-check-circle"></i>
                <span>{item}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeQuickEquipment(index)}
                  title="Remove"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="add-item-form">
          <input
            type="text"
            value={newQuickEquipment}
            onChange={(e) => setNewQuickEquipment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuickEquipment())}
            placeholder="Ajouter un équipement (ex: Climatisation)"
            className="add-input"
          />
          <button
            type="button"
            onClick={addQuickEquipment}
            className="add-btn"
            disabled={!newQuickEquipment.trim()}
          >
            <i className="fas fa-plus"></i>
            Ajouter
          </button>
        </div>

        <div className="suggestions">
          <small className="suggestions-label">Ajout rapide:</small>
          <div className="suggestions-list">
            {quickEquipmentSuggestions
              .filter(s => !quickEquipmentList.includes(s))
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => {
                    const updated = [...quickEquipmentList, suggestion];
                    setQuickEquipmentList(updated);
                    updateQuickEquipmentParent(updated);
                  }}
                >
                  + {suggestion}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Quick Amenities Section */}
      <div className="amenities-section">
        <h4 className="section-title">
          Services Rapides
        </h4>

        <div className="items-list">
          {quickAmenitiesList.length === 0 ? (
            <p className="empty-message">Aucun service rapide ajouté</p>
          ) : (
            quickAmenitiesList.map((item, index) => (
              <div key={index} className="item-tag">
                <i className="fas fa-check-circle"></i>
                <span>{item}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeQuickAmenity(index)}
                  title="Remove"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="add-item-form">
          <input
            type="text"
            value={newQuickAmenity}
            onChange={(e) => setNewQuickAmenity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuickAmenity())}
            placeholder="Ajouter un service (ex: Wi-Fi gratuit)"
            className="add-input"
          />
          <button
            type="button"
            onClick={addQuickAmenity}
            className="add-btn"
            disabled={!newQuickAmenity.trim()}
          >
            <i className="fas fa-plus"></i>
            Ajouter
          </button>
        </div>

        <div className="suggestions">
          <small className="suggestions-label">Ajout rapide:</small>
          <div className="suggestions-list">
            {quickAmenitiesSuggestions
              .filter(s => !quickAmenitiesList.includes(s))
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => {
                    const updated = [...quickAmenitiesList, suggestion];
                    setQuickAmenitiesList(updated);
                    updateQuickAmenitiesParent(updated);
                  }}
                >
                  + {suggestion}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Detailed Equipment Section */}
      <div className="amenities-section">
        <h4 className="section-title">
          {/* <i className="fas fa-snowflake"></i> */}
          Detailed Equipment (Modal)
        </h4>
        
        <div className="items-list">
          {detailedEquipment.length === 0 ? (
            <p className="empty-message">No detailed equipment added yet</p>
          ) : (
            detailedEquipment.map((item, index) => (
              <div key={index} className="item-tag">
                <i className="fas fa-check-circle"></i>
                <span>{item}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeEquipment(index)}
                  title="Remove"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="add-item-form">
          <input
            type="text"
            value={newDetailedEquipment}
            onChange={(e) => setNewDetailedEquipment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
            placeholder="Add equipment (e.g., Climatisation)"
            className="add-input"
          />
          <button
            type="button"
            onClick={addEquipment}
            className="add-btn"
            disabled={!newDetailedEquipment.trim()}
          >
            <i className="fas fa-plus"></i>
            Add
          </button>
        </div>

        <div className="suggestions">
          <small className="suggestions-label">Quick add:</small>
          <div className="suggestions-list">
            {equipmentSuggestions
              .filter(s => !detailedEquipment.includes(s))
              .slice(0, 4)
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => {
                    const updated = [...detailedEquipment, suggestion];
                    setDetailedEquipment(updated);
                    updateDetailedParent(updated, detailedAmenities);
                  }}
                >
                  + {suggestion}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Detailed Amenities Section */}
      <div className="amenities-section">
        <h4 className="section-title">
         {/* <i className="fas fa-concierge-bell"></i> */}
          Detailed Amenities (Modal)
        </h4>
        
        <div className="items-list">
          {detailedAmenities.length === 0 ? (
            <p className="empty-message">No detailed amenities added yet</p>
          ) : (
            detailedAmenities.map((item, index) => (
              <div key={index} className="item-tag">
                <i className="fas fa-check-circle"></i>
                <span>{item}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeAmenity(index)}
                  title="Remove"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="add-item-form">
          <input
            type="text"
            value={newDetailedAmenity}
            onChange={(e) => setNewDetailedAmenity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
            placeholder="Add amenity (e.g., Wi-Fi gratuit)"
            className="add-input"
          />
          <button
            type="button"
            onClick={addAmenity}
            className="add-btn"
            disabled={!newDetailedAmenity.trim()}
          >
            <i className="fas fa-plus"></i>
            Add
          </button>
        </div>

        <div className="suggestions">
          <small className="suggestions-label">Quick add:</small>
          <div className="suggestions-list">
            {amenitySuggestions
              .filter(s => !detailedAmenities.includes(s))
              .slice(0, 4)
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => {
                    const updated = [...detailedAmenities, suggestion];
                    setDetailedAmenities(updated);
                    updateDetailedParent(detailedEquipment, updated);
                  }}
                >
                  + {suggestion}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="editor-note">
        <i className="fas fa-info-circle"></i>
        Quick lists appear on the room card. Detailed lists appear in the modal.
      </div>
    </div>
  );
};

export default AmenitiesEditor;
