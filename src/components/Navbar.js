import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/shared/navbar.css";
import { 
    MdAccountCircle, 
    MdSettings, 
    MdLogout, 
    MdPerson,
    MdMenu,
    MdSearch,
    MdNotifications,
    MdKeyboardArrowDown
} from "react-icons/md";
import NotificationCenter from "./NotificationCenter";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";

const Navbar = () => {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const { user, logout } = useAuth();
    const { isAdmin } = useRole();
    
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Don't show navbar on auth pages
    if (location.pathname === '/login' || location.pathname === '/signup') {
        return null;
    }

    return(
        <nav className="navbar">
            <div className="mobile-menu-button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <MdMenu size={24} />
            </div>
            
            <div className="nav-brand">
                <Link to="/" className="brand">
                    <div className="hotel-logo">Hôtel Le Process</div>
                    <span className="brand-text">Admin Portal</span>
                </Link>
            </div>
            
            <div className="nav-right">
                {/* Notification Center */}
                <NotificationCenter />
                
                {/* User Profile */}
                <div className="profile-section" ref={dropdownRef}>
                    <div
                        className="user-profile"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <div className="avatar">
                            <span className="avatar-text">{user?.firstName?.[0] || user?.username?.[0] || 'U'}</span>
                        </div>
                        <div className="user-info">
                            <span className="user-name-display">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}</span>
                            <span className="user-role">{user?.role === 'ADMIN' ? 'Administrateur' : 'Réceptionniste'}</span>
                        </div>
                        <MdKeyboardArrowDown className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                    </div>
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <div className="dropdown-avatar">
                                    <span className="dropdown-avatar-text">{user?.firstName?.[0] || user?.username?.[0] || 'U'}</span>
                                </div>
                                <div className="dropdown-user-info">
                                    <span className="user-name">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}</span>
                                    <span className="user-email">{user?.email || ''}</span>
                                </div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <Link to="/account" className="dropdown-item">
                                <MdPerson />
                                <span>Mon Profil</span>
                            </Link>
                            {isAdmin && (
                                <Link to="/settings" className="dropdown-item">
                                    <MdSettings />
                                    <span>Paramètres</span>
                                </Link>
                            )}
                            <div className="dropdown-divider"></div>
                            <button onClick={logout} className="dropdown-item logout-link">
                                <MdLogout />
                                <span>Déconnexion</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Mobile menu overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-menu" ref={mobileMenuRef}>
                    <div className="mobile-menu-header">
                        <div className="hotel-logo">Hôtel Le Process</div>
                        <h3>Admin</h3>
                    </div>
                    <div className="mobile-nav-links">
                        <Link to="/" className="mobile-nav-item">Dashboard</Link>
                        <Link to="/reservations" className="mobile-nav-item">Reservations</Link>
                        <Link to="/rooms" className="mobile-nav-item">Rooms</Link>
                        <Link to="/guests" className="mobile-nav-item">Guests</Link>
                        {isAdmin && <Link to="/staff" className="mobile-nav-item">Staff</Link>}
                        {isAdmin && <Link to="/reports" className="mobile-nav-item">Reports</Link>}
                        <Link to="/helpdesk" className="mobile-nav-item">Help Desk</Link>
                        {isAdmin && <Link to="/settings" className="mobile-nav-item">Settings</Link>}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;