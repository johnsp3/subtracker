'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, Check, Trash } from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const Header = () => {
  const { 
    notifications, 
    clearNotification, 
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount
  } = useNotifications();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleNotificationClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };
  
  const handleClearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotification(id);
  };
  
  const handleClearAll = () => {
    clearAllNotifications();
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="flex items-center justify-between mb-10">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions, subscriptions, etc."
            className="w-full rounded-xl bg-white pl-12 pr-4 py-3.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
            size={20} 
          />
        </div>
      </div>
      
      <div className="flex items-center relative" ref={dropdownRef}>
        <button 
          className="relative p-2.5 bg-white shadow-sm rounded-full hover:bg-gray-50 transition-colors"
          onClick={handleNotificationClick}
          aria-label="Notifications"
        >
          <Bell size={20} className="text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center text-white text-xs">
              {unreadCount}
            </span>
          )}
        </button>
        
        {/* Notification Dropdown */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg z-50 border border-gray-100">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium">Notifications</h3>
              <div className="flex space-x-2">
                {notifications.length > 0 && (
                  <>
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                      aria-label="Mark all as read"
                    >
                      <Check size={12} className="mr-1" />
                      Mark all read
                    </button>
                    <button 
                      onClick={handleClearAll}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                      aria-label="Clear all notifications"
                    >
                      <Trash size={12} className="mr-1" />
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onClear={handleClearNotification}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string, e: React.MouseEvent) => void;
  onClear: (id: string, e: React.MouseEvent) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onClear }: NotificationItemProps) => {
  return (
    <div className={`p-3 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-2">
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
          <p className="text-gray-400 text-xs mt-2">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </p>
        </div>
        <div className="flex space-x-1">
          {!notification.read && (
            <button
              onClick={(e) => onMarkAsRead(notification.id, e)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              aria-label="Mark as read"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={(e) => onClear(notification.id, e)}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
            aria-label="Delete notification"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header; 