import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/shared/sidebar.css";
import { 
    MdDashboard, 
    MdHotel, 
    MdPeople, 
    MdCalendarToday, 
    MdInsertChart, 
    MdSupportAgent,
    MdOutlineHotel,
    MdBadge,
    MdMenu,
    MdChevronLeft,
    MdChevronRight,
    MdSettings,
    MdMailOutline,
    MdExpandMore,
    MdExpandLess,
    MdCategory
} from "react-icons/md";
import { useRole } from "../hooks/useRole";
import { useMessagesContext } from "../context/MessagesContext";

const Sidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isChambresOpen, setIsChambresOpen] = useState(false);
    const { isAdmin } = useRole();
    const { newCount } = useMessagesContext();
    
    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };
    
    const isChambresActive = () => {
        return location.pathname === '/rooms' || location.pathname === '/room-types';
    };
    
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };
    
    const toggleChambres = () => {
        setIsChambresOpen(!isChambresOpen);
    };
    
    // Don't show sidebar on auth pages
    if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password') {
        return null;
    }
    
    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-content">
                {/* Brand Section - Fixed at top */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-content">
                        <div className="brand-logo">
                            <MdOutlineHotel className="hotel-icon" />
                        </div>
                        <div className="brand-info">
                            <h2 className="brand-text">Hotel Admin</h2>
                            <span className="brand-subtitle">Management Portal</span>
                        </div>
                    </div>
                    
                    {/* Collapse Toggle Button */}
                    <button className="sidebar-toggle" onClick={toggleSidebar} title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                        {isCollapsed ? <MdChevronRight /> : <MdChevronLeft />}
                    </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="sidebar-scrollable">
                    {/* Main Navigation */}
                    <div className="sidebar-section">
                    <div className="sidebar-section-title">
                        <span>Menu Principal</span>
                    </div>
                    <nav className="sidebar-menu">
                        <ul>
                            <li className={isActive('/')}>
                                <Link to="/" className="sidebar-menu-item">
                                    <div className="menu-icon-wrapper">
                                        <MdDashboard className="sidebar-menu-icon" />
                                    </div>
                                    <div className="menu-content">
                                        <span className="menu-text">Tableau de bord</span>
                                        <span className="menu-description">Vue d'ensemble</span>
                                    </div>
                                </Link>
                            </li>
                            <li className={isActive('/messages')}>
                                <Link to="/messages" className={`sidebar-menu-item ${newCount > 0 ? 'has-badge' : ''}`}>
                                    <div className="menu-icon-wrapper">
                                        <MdMailOutline className="sidebar-menu-icon" />
                                    </div>
                                    <div className="menu-content">
                                        <span className="menu-text">Messagerie</span>
                                        <span className="menu-description">Conversations clients</span>
                                    </div>
                                    {newCount > 0 && (
                                        <span className="menu-badge">{newCount > 99 ? '99+' : newCount}</span>
                                    )}
                                </Link>
                            </li>
                            <li className={isActive('/reservations')}>
                                <Link to="/reservations" className="sidebar-menu-item">
                                    <div className="menu-icon-wrapper">
                                        <MdCalendarToday className="sidebar-menu-icon" />
                                    </div>
                                    <div className="menu-content">
                                        <span className="menu-text">Réservations</span>
                                        <span className="menu-description">Gérer les réservations</span>
                                    </div>
                                </Link>
                            </li>
                            <li className={isChambresActive() ? 'active has-submenu' : 'has-submenu'}>
                                <div className="sidebar-menu-item" onClick={toggleChambres} style={{ cursor: 'pointer' }}>
                                    <div className="menu-icon-wrapper">
                                        <MdHotel className="sidebar-menu-icon" />
                                    </div>
                                    <div className="menu-content">
                                        <span className="menu-text">Chambres</span>
                                        <span className="menu-description">Gestion des chambres</span>
                                    </div>
                                    <div className="menu-icon-wrapper">
                                        {isChambresOpen ? <MdExpandLess /> : <MdExpandMore />}
                                    </div>
                                </div>
                                {isChambresOpen && (
                                    <ul className="submenu">
                                        <li className={isActive('/rooms')}>
                                            <Link to="/rooms" className="sidebar-menu-item submenu-item">
                                                <div className="menu-icon-wrapper">
                                                    <MdHotel className="sidebar-menu-icon" />
                                                </div>
                                                <div className="menu-content">
                                                    <span className="menu-text">Toutes les Chambres</span>
                                                    <span className="menu-description">Inventaire des chambres</span>
                                                </div>
                                            </Link>
                                        </li>
                                        {isAdmin && (
                                            <li className={isActive('/room-types')}>
                                                <Link to="/room-types" className="sidebar-menu-item submenu-item">
                                                    <div className="menu-icon-wrapper">
                                                        <MdCategory className="sidebar-menu-icon" />
                                                    </div>
                                                    <div className="menu-content">
                                                        <span className="menu-text">Types de Chambres</span>
                                                        <span className="menu-description">Gérer les types</span>
                                                    </div>
                                                </Link>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                            <li className={isActive('/guests')}>
                                <Link to="/guests" className="sidebar-menu-item">
                                    <div className="menu-icon-wrapper">
                                        <MdPeople className="sidebar-menu-icon" />
                                    </div>
                                    <div className="menu-content">
                                        <span className="menu-text">Clients</span>
                                        <span className="menu-description">Répertoire des clients</span>
                                    </div>
                                </Link>
                            </li>
                            {/* Staff/Personnel - Admin Only */}
                            {isAdmin && (
                                <li className={isActive('/staff')}>
                                    <Link to="/staff" className="sidebar-menu-item">
                                        <div className="menu-icon-wrapper">
                                            <MdBadge className="sidebar-menu-icon" />
                                        </div>
                                        <div className="menu-content">
                                            <span className="menu-text">Personnel</span>
                                            <span className="menu-description">Gestion d'équipe</span>
                                        </div>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </nav>
                </div>
                
                {/* Analytics Section - Admin Only */}
                {isAdmin && (
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">
                            <span>Analytique</span>
                        </div>
                        <nav className="sidebar-menu">
                            <ul>
                                <li className={isActive('/reports')}>
                                    <Link to="/reports" className="sidebar-menu-item">
                                        <div className="menu-icon-wrapper">
                                            <MdInsertChart className="sidebar-menu-icon" />
                                        </div>
                                        <div className="menu-content">
                                            <span className="menu-text">Rapports</span>
                                            <span className="menu-description">Analyses et statistiques</span>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
                
                {/* Support Section */}
                <div className="sidebar-section">
                    <div className="sidebar-section-title">
                        <span>Assistance</span>
                    </div>
                    <nav className="sidebar-menu">
                        <ul>
                            <li className={isActive('/helpdesk')}>
                                <Link to="/helpdesk" className="sidebar-menu-item">
                                    <div className="menu-icon-wrapper">
                                        <MdSupportAgent className="sidebar-menu-icon" />
                                    </div>
                                    <div className="menu-content">
                                        <span className="menu-text">Centre d'aide</span>
                                        <span className="menu-description">Obtenir de l'aide</span>
                                    </div>
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
                
                {/* Settings Section - Admin Only */}
                {isAdmin && (
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">
                            <span>Système</span>
                        </div>
                        <nav className="sidebar-menu">
                            <ul>
                                <li className={isActive('/settings')}>
                                    <Link to="/settings" className="sidebar-menu-item">
                                        <div className="menu-icon-wrapper">
                                            <MdSettings className="sidebar-menu-icon" />
                                        </div>
                                        <div className="menu-content">
                                            <span className="menu-text">Paramètres</span>
                                            <span className="menu-description">Configuration système</span>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
                
                    {/* Footer */}
                    <div className="sidebar-footer">
                        <div className="footer-content">
                            <div className="footer-badge">
                                <span className="badge-dot"></span>
                                <span className="version-text">v1.0.0</span>
                            </div>
                            <span className="copyright-text">© 2025 Hotel Admin</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
