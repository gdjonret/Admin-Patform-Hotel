import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MdVisibility, MdVisibilityOff, MdClose } from 'react-icons/md';
import './auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', formData);
      
      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Redirect to dashboard
      navigate('/');
      window.location.reload(); // Reload to update auth state
    } catch (err) {
      setError(err.response?.data || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-auth-container">
      <div className="modern-auth-card">
        {/* Left Side - Welcome Section */}
        <div className="auth-left-section">
          <div className="welcome-content">
            <h2>Hôtel Le Process</h2>
            <h3>Portail Administrateur</h3>
            <p>Connectez-vous avec vos identifiants pour accéder au système de gestion de l'hôtel.</p>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="auth-right-section">
          <button className="close-btn" onClick={() => navigate('/')}>
            <MdClose size={24} />
          </button>

          <div className="form-wrapper">
            <h2 className="form-title">CONNEXION</h2>

            {error && (
              <div className="error-alert">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  autoFocus
                  className="modern-input"
                />
                <label className={formData.username ? 'active' : ''}>Email ou Nom d'utilisateur</label>
              </div>

              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  className="modern-input"
                />
                <label className={formData.password ? 'active' : ''}>Mot de passe</label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>

              <Link to="/forgot-password" className="forgot-link">
                Mot de passe oublié?
              </Link>

              <button type="submit" className="modern-submit-btn" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="bottom-text">
              Pas de compte? <Link to="/signup" className="signup-link">S'inscrire</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
