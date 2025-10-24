import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
            return;
        }
        
        try {
            setLoading(true);
            const response = await apiClient.getNotifications();
            const notificationsData = response.notifications || [];
            setNotifications(notificationsData);
            setUnreadCount(notificationsData.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await apiClient.markNotificationAsRead(notificationId);
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notificationId 
                        ? { ...n, is_read: true, read_at: new Date().toISOString() }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.markAllNotificationsAsRead();
            setNotifications(prev => 
                prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    };

    const refreshNotifications = () => {
        fetchNotifications();
    };

    useEffect(() => {
        if (user?.role === 'instructor' || user?.role === 'admin') {
            fetchNotifications();
        }
    }, [user]);

    // Listen for custom events to refresh notifications
    useEffect(() => {
        const handleNotificationUpdate = () => {
            fetchNotifications();
        };

        window.addEventListener('notificationUpdated', handleNotificationUpdate);
        return () => {
            window.removeEventListener('notificationUpdated', handleNotificationUpdate);
        };
    }, []);

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        refreshNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
