import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MdClose } from 'react-icons/md';
import './auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate terms agreement
    if (!agreedToTerms) {
      setError('Veuillez accepter les Termes et Conditions');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      // Extract username from email (part before @)
      const username = formData.email.split('@')[0];
      
      await axios.post('http://localhost:8080/api/auth/register', {
        username: username,
        email: formData.email,
        password: formData.password,
        firstName: username,
        lastName: 'User',
        role: 'RECEPTIONIST'
      });
      
      // Redirect to login
      alert('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-auth-container">
      <div className="modern-auth-card">
        {/* Left Side - Create Account Section */}
        <div className="auth-left-section signup-section">
          <div className="welcome-content">
            <h2>Hôtel Le Process</h2>
            <h3>Inscription Personnel</h3>
            <p>Créez votre compte administrateur ou réceptionniste pour accéder au système de gestion.</p>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="auth-right-section">
          <button className="close-btn" onClick={() => navigate('/')}>
            <MdClose size={24} />
          </button>

          <div className="form-wrapper">
            <h2 className="form-title">INSCRIPTION</h2>

            {error && (
              <div className="error-alert">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">
              <div className="simple-input-group">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Entrez votre email"
                  required
                  className="simple-input"
                />
              </div>

              <div className="simple-input-group">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Créer un mot de passe"
                  required
                  className="simple-input"
                />
              </div>

              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label htmlFor="terms">
                  J'accepte les <a href="#" className="terms-link">Termes et Conditions</a>
                </label>
              </div>

              <button type="submit" className="modern-submit-btn" disabled={loading}>
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </form>

            <div className="bottom-text">
              Vous avez déjà un compte? <Link to="/login" className="signup-link">Se connecter</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
