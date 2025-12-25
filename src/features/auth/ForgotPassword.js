import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/forgot-password', { email });
      setSuccess(response.data || 'Un email de réinitialisation a été envoyé à votre adresse.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="hotel-logo-auth">Hôtel Le Process</div>
          <h1>Mot de passe oublié?</h1>
          <p>Entrez votre email pour réinitialiser votre mot de passe</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <span>✓</span>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Adresse Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@hotel.com"
              required
              autoFocus
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Envoi en cours...
              </>
            ) : (
              'Envoyer le lien de réinitialisation'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Vous vous souvenez de votre mot de passe? <Link to="/login">Se connecter</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
