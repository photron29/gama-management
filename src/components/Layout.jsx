import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import HamburgerIcon from './HamburgerIcon';
import {
    FaTachometerAlt,
    FaUsers,
    FaUserTie,
    FaClipboardCheck,
    FaRupeeSign,
    FaBox,
    FaSignOutAlt,
    FaUser,
    FaSun,
    FaMoon,
    FaSchool,
    FaMapMarkerAlt,
    FaShoppingCart,
    FaShoppingBag
} from 'react-icons/fa';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigationItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt, roles: ['admin', 'instructor'] },
        { path: '/branches', label: 'Branches', icon: FaMapMarkerAlt, roles: ['admin'] },
        { path: '/schools', label: 'Schools', icon: FaSchool, roles: ['admin'] },
        { path: '/instructors', label: 'Instructors', icon: FaUserTie, roles: ['admin'] },
        { path: '/students', label: 'Students', icon: FaUsers, roles: ['admin', 'instructor'] },
        { path: '/students/inactive', label: 'Inactive Students', icon: FaUsers, roles: ['admin'] },
        { path: '/attendance', label: 'Attendance', icon: FaClipboardCheck, roles: ['admin', 'instructor'] },
        { path: '/fees', label: 'Fees', icon: FaRupeeSign, roles: ['admin', 'instructor'] },
        { path: '/inventory', label: 'Inventory', icon: FaBox, roles: ['admin'] },
        { path: '/admin/orders', label: 'Orders', icon: FaShoppingBag, roles: ['admin'] },
        { path: '/products', label: 'Products', icon: FaShoppingCart, roles: ['instructor'] },
        { path: '/orders', label: 'My Orders', icon: FaShoppingBag, roles: ['instructor'] }
    ];

    const filteredNavItems = navigationItems.filter(item =>
        item.roles.includes(user?.role)
    );

    return (
        <div className="layout">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <h2>GAMA</h2>
                    <button
                        className="sidebar-toggle mobile-only"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close menu"
                    >
                        <HamburgerIcon isOpen={true} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className="nav-icon" />
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <FaUser className="user-icon" />
                        <div className="user-details">
                            <span className="user-name">{user?.first_name} {user?.last_name}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Top Bar */}
                <header className="top-bar">
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle menu"
                    >
                        <HamburgerIcon isOpen={sidebarOpen} />
                    </button>
                    <div className="top-bar-actions">
                        <button
                            className="theme-toggle"
                            onClick={toggleTheme}
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? <FaSun /> : <FaMoon />}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default Layout;
