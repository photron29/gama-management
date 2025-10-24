import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { apiClient } from '../utils/api';
import { toast } from 'react-hot-toast';
import { FaBell, FaCheck, FaCheckDouble, FaEye, FaTrash, FaCalendarAlt, FaUser, FaArrowLeft, FaSync } from 'react-icons/fa';
import LoadingAtom from '../components/LoadingAtom';
import Modal from '../components/Modal';

const Notifications = () => {
    const { user } = useAuth();
    const { notifications, loading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all, unread, read

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
            toast.success('Notification marked as read');
            // Emit event to update other components
            window.dispatchEvent(new CustomEvent('notificationUpdated'));
        } catch (error) {
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            toast.success('All notifications marked as read');
            // Emit event to update other components
            window.dispatchEvent(new CustomEvent('notificationUpdated'));
        } catch (error) {
            toast.error('Failed to mark all notifications as read');
        }
    };

    const handleNotificationClick = (notification) => {
        setSelectedNotification(notification);
        setShowModal(true);
        
        // Mark as read if not already read
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'announcement':
                return '📢';
            case 'order':
                return '🛒';
            case 'order_status':
                return '📦';
            case 'system':
                return '⚙️';
            case 'reminder':
                return '⏰';
            default:
                return '🔔';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const renderMessageWithLinks = (message) => {
        if (!message) return message;
        
        // URL regex pattern to detect URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = message.split(urlRegex);
        
        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.is_read;
        if (filter === 'read') return notification.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return <LoadingAtom />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                                    Notifications
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Stay updated with the latest announcements and updates
                                </p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FaCheckDouble className="mr-2" />
                                Mark All Read
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    filter === 'all' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All ({notifications.length})
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    filter === 'unread' 
                                        ? 'bg-red-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Unread ({unreadCount})
                            </button>
                            <button
                                onClick={() => setFilter('read')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    filter === 'read' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Read ({notifications.length - unreadCount})
                            </button>
                        </div>
                        <button
                            onClick={refreshNotifications}
                            className="ml-auto px-4 py-2 bg-blue-200 text-gray-700 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                        >
                            <FaSync />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <FaBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {filter === 'unread' ? 'No unread notifications' : 
                                 filter === 'read' ? 'No read notifications' : 
                                 'No notifications yet'}
                            </h3>
                            <p className="text-gray-500">
                                {filter === 'all' ? 'You\'ll see notifications here when they arrive' : 
                                 'Try changing the filter to see more notifications'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                                        !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className={`text-lg font-semibold ${
                                                    !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                                }`}>
                                                    {notification.title}
                                                </h3>
                                                <div className="flex items-center space-x-2">
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    )}
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(notification.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 mb-3 line-clamp-2">
                                                {renderMessageWithLinks(notification.message)}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <FaCalendarAlt className="mr-1" />
                                                        {new Date(notification.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaUser className="mr-1" />
                                                        {notification.type}
                                                    </div>
                                                </div>
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notification.id);
                                                        }}
                                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notification Detail Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedNotification(null);
                    }}
                    title="Notification Details"
                    size="large"
                >
                    {selectedNotification && (
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <span className="text-3xl">
                                    {getNotificationIcon(selectedNotification.type)}
                                </span>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {selectedNotification.title}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                                        <div className="flex items-center">
                                            <FaCalendarAlt className="mr-1" />
                                            {new Date(selectedNotification.created_at).toLocaleString()}
                                        </div>
                                        <div className="flex items-center">
                                            <FaUser className="mr-1" />
                                            {selectedNotification.type}
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            selectedNotification.is_read 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {selectedNotification.is_read ? 'Read' : 'Unread'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {selectedNotification.message}
                                    </p>
                                </div>
                            </div>

                            {!selectedNotification.is_read && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => {
                                            handleMarkAsRead(selectedNotification.id);
                                            setShowModal(false);
                                        }}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        Mark as Read
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default Notifications;
