import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import HamburgerIcon from './HamburgerIcon';
import NotificationBell from './NotificationBell';
import {
    FaTachometerAlt,
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaMapMarkerAlt,
    FaShoppingCart,
    FaBox,
    FaClipboardList,
    FaMoneyBillWave,
    FaSignOutAlt,
    FaSun,
    FaMoon,
    FaCog,
    FaBell
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
    
    // 💡 FIX 1: Use a useEffect hook to apply the 'dark' class to the root HTML element
    // Theme management is handled by ThemeContext
    

    // Define navigation items based on user role
    const getNavigationItems = () => {
        if (user?.role === 'instructor') {
            return [
                { name: 'Dashboard', href: '/', icon: FaTachometerAlt },
                { name: 'Students', href: '/students', icon: FaUserGraduate },
                { name: 'Attendance', href: '/attendance', icon: FaClipboardList },
                { name: 'Fees', href: '/fees', icon: FaMoneyBillWave },
                { name: 'Products', href: '/products', icon: FaBox },
                { name: 'My Orders', href: '/my-orders', icon: FaShoppingCart },
                { name: 'Notifications', href: '/notifications', icon: FaBell },
                { name: 'Profile', href: '/profile', icon: FaUsers },
            ];
        } else if (user?.role === 'admin') {
            return [
                { name: 'Dashboard', href: '/', icon: FaTachometerAlt },
                { name: 'Students', href: '/students', icon: FaUserGraduate },
                { name: 'Instructors', href: '/instructors', icon: FaChalkboardTeacher },
                { name: 'Attendance', href: '/attendance', icon: FaClipboardList },
                { name: 'Fees', href: '/fees', icon: FaMoneyBillWave },
                { name: 'Branches', href: '/branches', icon: FaMapMarkerAlt },
                { name: 'Inventory', href: '/inventory', icon: FaBox },
                { name: 'Orders', href: '/orders', icon: FaShoppingCart },
                { name: 'Announcements', href: '/announcements', icon: FaBell },
                { name: 'Profile', href: '/profile', icon: FaUsers },
            ];
        } else {
            // Default navigation for unknown roles
            return [
                { name: 'Dashboard', href: '/', icon: FaTachometerAlt },
            ];
        }
    };

    const navigation = getNavigationItems();

    const isActive = (href) => {
        if (href === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900"> 
            
            {/* Mobile sidebar overlay (No change) */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out 
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:h-screen
            `}>
                <div className="flex h-full flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                    
                    {/* Logo and close button (Fixed height: h-16) */}
                    <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-lg">G</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">GAMA</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Management System</p>
                            </div>
                        </div>
                        <button
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <HamburgerIcon isOpen={true} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto"> 
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                                        group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                        ${active 
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                        }
                                    `}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className={`
                                        mr-3 h-5 w-5 flex-shrink-0 transition-colors
                                        ${active ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
                                    `} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section (shrink-0) */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 shrink-0">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.name || `${user?.first_name} ${user?.last_name}` || user?.username || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.role || 'User'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={toggleTheme}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {isDarkMode ? <FaSun className="h-4 w-4 mr-2 text-yellow-500" /> : <FaMoon className="h-4 w-4 mr-2 text-indigo-400" />}
                                Theme
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <FaSignOutAlt className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-72 flex flex-col min-h-screen">
                
                {/* Top bar */}
                <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center">
                            <button
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                <HamburgerIcon isOpen={sidebarOpen} />
                            </button>
                            <div className="ml-4 lg:ml-0">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                                </h2>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <NotificationBell />
                            <button 
                                onClick={() => navigate('/profile')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="User Profile"
                            >
                                <FaCog className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                {/* 💡 FIX 2: Ensure main content takes up remaining vertical space and is scrollable */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto"> 
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;