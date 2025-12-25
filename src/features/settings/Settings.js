import React, { useState } from 'react';
import './settings.css';
import TaxManagement from '../taxes/TaxManagement';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const [generalSettings, setGeneralSettings] = useState({
    hotelName: 'Hôtel Le Process',
    address: 'Quartier Dembé - BP 4553, N\'Djamena, Tchad',
    phone: '+235 68 88 93 33',
    email: 'leprocess@intnet.td',
    website: 'https://hotelleprocess.com',
    timezone: 'Africa/Ndjamena'  // Chad timezone (UTC+1)
  });

  const [bookingSettings, setBookingSettings] = useState({
    checkInTime: '12:00',
    checkOutTime: '12:00',
    minimumStay: 1,
    maximumStay: 30,
    advanceBookingDays: 365,
    cancellationPeriod: 48
  });


  const handleGeneralChange = (e) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleBookingChange = (e) => {
    setBookingSettings({
      ...bookingSettings,
      [e.target.name]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    // Save settings logic would go here
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-container">
      <h1>Paramètres</h1>
      
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Général
        </button>
        <button 
          className={`tab-button ${activeTab === 'booking' ? 'active' : ''}`}
          onClick={() => setActiveTab('booking')}
        >
          Réservation
        </button>
        <button 
          className={`tab-button ${activeTab === 'taxes' ? 'active' : ''}`}
          onClick={() => setActiveTab('taxes')}
        >
          💰 Taxes
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Utilisateurs
        </button>
      </div>
      
      {activeTab === 'taxes' ? (
        <TaxManagement />
      ) : activeTab === 'users' ? (
        <div className="settings-section">
          <h2>Gestion des Utilisateurs</h2>
          <div className="settings-card">
            <p>Gestion des utilisateurs à venir...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
        {activeTab === 'general' && (
          <div className="settings-section">
            <h2>Paramètres Généraux</h2>
            <div className="settings-card">
            <div className="form-group">
              <label htmlFor="hotelName">Nom de l'Hôtel</label>
              <input
                type="text"
                id="hotelName"
                name="hotelName"
                value={generalSettings.hotelName}
                onChange={handleGeneralChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Adresse</label>
              <input
                type="text"
                id="address"
                name="address"
                value={generalSettings.address}
                onChange={handleGeneralChange}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Téléphone</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={generalSettings.phone}
                  onChange={handleGeneralChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={generalSettings.email}
                  onChange={handleGeneralChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="website">Site Web</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={generalSettings.website}
                  onChange={handleGeneralChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="timezone">Fuseau Horaire</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={generalSettings.timezone}
                  onChange={handleGeneralChange}
                >
                  <option value="Africa/Ndjamena">Chad Time (WAT - UTC+1)</option>
                  <option value="Africa/Lagos">West Africa Time (WAT - UTC+1)</option>
                  <option value="Europe/Paris">Central European Time (CET)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>
            </div>
            </div>
          </div>
        )}
        
        {activeTab === 'booking' && (
          <div className="settings-section">
            <h2>Paramètres de Réservation</h2>
          <div className="settings-card">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="checkInTime">Heure d'Arrivée</label>
                <input
                  type="time"
                  id="checkInTime"
                  name="checkInTime"
                  value={bookingSettings.checkInTime}
                  onChange={handleBookingChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="checkOutTime">Heure de Départ</label>
                <input
                  type="time"
                  id="checkOutTime"
                  name="checkOutTime"
                  value={bookingSettings.checkOutTime}
                  onChange={handleBookingChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minimumStay">Séjour Minimum (nuits)</label>
                <input
                  type="number"
                  id="minimumStay"
                  name="minimumStay"
                  min="1"
                  value={bookingSettings.minimumStay}
                  onChange={handleBookingChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="maximumStay">Séjour Maximum (nuits)</label>
                <input
                  type="number"
                  id="maximumStay"
                  name="maximumStay"
                  min="1"
                  value={bookingSettings.maximumStay}
                  onChange={handleBookingChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="advanceBookingDays">Réservation Anticipée (jours)</label>
                <input
                  type="number"
                  id="advanceBookingDays"
                  name="advanceBookingDays"
                  min="1"
                  value={bookingSettings.advanceBookingDays}
                  onChange={handleBookingChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cancellationPeriod">Délai d'Annulation (heures)</label>
                <input
                  type="number"
                  id="cancellationPeriod"
                  name="cancellationPeriod"
                  min="0"
                  value={bookingSettings.cancellationPeriod}
                  onChange={handleBookingChange}
                />
              </div>
            </div>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button type="submit" className="save-btn">Enregistrer les Modifications</button>
          <button type="button" className="cancel-btn">Annuler</button>
        </div>
      </form>
      )}
    </div>
  );
};

export default Settings;
