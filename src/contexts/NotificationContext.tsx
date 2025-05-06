'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Define notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Define the context interface
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (title: string, message: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

// Create the context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  clearNotification: () => {},
  clearAllNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  unreadCount: 0,
});

// Custom hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Compute unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Reset notifications when user changes
  useEffect(() => {
    if (user) {
      // In a real app, we would fetch notifications from the database here
      setNotifications([]);
    } else {
      setNotifications([]);
    }
  }, [user]);

  const addNotification = (title: string, message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(), // Simple unique ID
      title,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        clearNotification,
        clearAllNotifications,
        markAsRead,
        markAllAsRead,
        unreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 