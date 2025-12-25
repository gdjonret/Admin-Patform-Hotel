import React, { useState, useEffect } from 'react';
import './TaxManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/admin';

const TaxManagement = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    taxType: 'PERCENTAGE',
    rate: '',
    appliesTo: 'SUBTOTAL',
    isEnabled: true,
    isInclusive: false,
    displayOrder: 0
  });

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/taxes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch taxes');
      
      const data = await response.json();
      setTaxes(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleToggleTax = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/taxes/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to toggle tax');
      
      fetchTaxes(); // Refresh list
    } catch (err) {
      alert('Error toggling tax: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingTax 
        ? `${API_URL}/taxes/${editingTax.id}`
        : `${API_URL}/taxes`;
      
      const method = editingTax ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save tax');
      }
      
      // Reset form and refresh
      setShowForm(false);
      setEditingTax(null);
      setFormData({
        name: '',
        description: '',
        taxType: 'PERCENTAGE',
        rate: '',
        appliesTo: 'SUBTOTAL',
        isEnabled: true,
        isInclusive: false,
        displayOrder: 0
      });
      fetchTaxes();
    } catch (err) {
      alert('Error saving tax: ' + err.message);
    }
  };

  const handleEdit = (tax) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      description: tax.description || '',
      taxType: tax.taxType,
      rate: tax.rate,
      appliesTo: tax.appliesTo,
      isEnabled: tax.isEnabled,
      isInclusive: tax.isInclusive,
      displayOrder: tax.displayOrder
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tax?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/taxes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete tax');
      
      fetchTaxes();
    } catch (err) {
      alert('Error deleting tax: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Chargement des taxes...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="tax-management">
      <div className="tax-header">
        <h1>Configuration des Taxes</h1>
        <button 
          className="btn-add-tax"
          onClick={() => {
            setShowForm(true);
            setEditingTax(null);
            setFormData({
              name: '',
              description: '',
              taxType: 'PERCENTAGE',
              rate: '',
              appliesTo: 'SUBTOTAL',
              isEnabled: true,
              isInclusive: false,
              displayOrder: taxes.length
            });
          }}
        >
          + Ajouter une Taxe
        </button>
      </div>

      {showForm && (
        <div className="tax-form-modal">
          <div className="tax-form-content">
            <h2>{editingTax ? 'Modifier la Taxe' : 'Ajouter une Taxe'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom de la Taxe *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="ex: TVA, Taxe Municipale"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="ex: Taxe sur la Valeur Ajoutée (18%)"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type de Taxe *</label>
                  <select
                    value={formData.taxType}
                    onChange={(e) => setFormData({...formData, taxType: e.target.value})}
                  >
                    <option value="PERCENTAGE">Pourcentage</option>
                    <option value="FIXED">Montant Fixe</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Taux *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({...formData, rate: e.target.value})}
                    required
                    placeholder={formData.taxType === 'PERCENTAGE' ? '18.00' : '5000.00'}
                  />
                  <small>{formData.taxType === 'PERCENTAGE' ? '%' : 'FCFA'}</small>
                </div>
              </div>

              <div className="form-group">
                <label>S'applique à *</label>
                <select
                  value={formData.appliesTo}
                  onChange={(e) => setFormData({...formData, appliesTo: e.target.value})}
                >
                  <option value="ROOM_RATE">Tarif Chambre Uniquement</option>
                  <option value="SUBTOTAL">Sous-total (Chambre + Frais)</option>
                  <option value="TOTAL">Total Final</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ordre d'Affichage</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})}
                />
                <small>Ordre d'apparition sur les factures</small>
              </div>

              <div className="form-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({...formData, isEnabled: e.target.checked})}
                  />
                  Taxe Activée
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.isInclusive}
                    onChange={(e) => setFormData({...formData, isInclusive: e.target.checked})}
                  />
                  Taxe Inclusive (déjà dans le prix)
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">
                  {editingTax ? 'Mettre à Jour' : 'Créer la Taxe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tax-list">
        {taxes.length === 0 ? (
          <p className="no-taxes">Aucune taxe configurée. Cliquez sur "Ajouter une Taxe" pour en créer une.</p>
        ) : (
          taxes.map(tax => (
            <div key={tax.id} className={`tax-card ${!tax.isEnabled ? 'disabled' : ''}`}>
              <div className="tax-card-header">
                <div className="tax-info">
                  <h3>
                    {tax.name}
                    {tax.taxType === 'PERCENTAGE' ? ` (${tax.rate}%)` : ` (${tax.rate.toLocaleString()} FCFA)`}
                  </h3>
                  <p>{tax.description}</p>
                </div>
                <div className="tax-toggle">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tax.isEnabled}
                      onChange={() => handleToggleTax(tax.id)}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="toggle-label">{tax.isEnabled ? 'ON' : 'OFF'}</span>
                </div>
              </div>

              <div className="tax-card-details">
                <span className="tax-detail">
                  <strong>Type:</strong> {tax.taxType === 'PERCENTAGE' ? 'Pourcentage' : 'Montant Fixe'}
                </span>
                <span className="tax-detail">
                  <strong>S'applique à:</strong> {tax.appliesTo.replace('_', ' ')}
                </span>
                {tax.isInclusive && <span className="tax-badge">Inclusive</span>}
              </div>

              <div className="tax-card-actions">
                <button onClick={() => handleEdit(tax)} className="btn-edit">Éditer</button>
                <button onClick={() => handleDelete(tax.id)} className="btn-delete">Supprimer</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaxManagement;
