'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, updateUserSettings } from '@/utils/firestore';
import { NotificationDay, UserSettings } from '@/utils/types';
import { 
  areNotificationsSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  showTestNotification 
} from '@/utils/serviceWorker';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

const NotificationSettings = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  const [formData, setFormData] = useState({
    enabled: false,
    daysBeforeRenewal: [] as NotificationDay[],
    browserNotifications: true,
    systemNotifications: false
  });

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Check notification permission status on component mount and re-check on focus
  useEffect(() => {
    const checkPermission = () => {
      if (areNotificationsSupported()) {
        const currentPermission = getNotificationPermission();
        setPermissionStatus(currentPermission);
        
        // Show permission prompt if they have notifications enabled but permission not granted
        if (formData.enabled && (formData.browserNotifications || formData.systemNotifications) && 
            currentPermission !== 'granted') {
          setShowPermissionPrompt(true);
        }
      }
    };

    // Check immediately
    checkPermission();
    
    // Re-check when window gains focus (user might have changed permission in browser settings)
    const handleFocus = () => checkPermission();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, [formData.enabled, formData.browserNotifications, formData.systemNotifications]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const settings = await getUserSettings(user.uid);
        
        if (settings) {
          setUserSettings(settings);
          setFormData({
            enabled: settings.notifications.enabled,
            daysBeforeRenewal: settings.notifications.daysBeforeRenewal,
            browserNotifications: settings.notifications.browserNotifications,
            systemNotifications: settings.notifications.systemNotifications
          });
          
          // If user has notifications enabled, check permission status
          if (settings.notifications.enabled && 
              (settings.notifications.browserNotifications || settings.notifications.systemNotifications)) {
            const currentPermission = getNotificationPermission();
            if (currentPermission !== 'granted') {
              setShowPermissionPrompt(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      
      // If enabling notifications, show permission prompt
      if (name === 'enabled' && checked) {
        if (permissionStatus !== 'granted') {
          setShowPermissionPrompt(true);
        }
      }
      
      // If enabling browser or system notifications, show permission prompt
      if ((name === 'browserNotifications' || name === 'systemNotifications') && 
          checked && permissionStatus !== 'granted') {
        setShowPermissionPrompt(true);
      }
    }
    
    // Clear success message when form is changed
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleDayToggle = (day: NotificationDay) => {
    setFormData(prev => {
      const daysBeforeRenewal = [...prev.daysBeforeRenewal];
      
      if (daysBeforeRenewal.includes(day)) {
        // Remove the day
        return {
          ...prev,
          daysBeforeRenewal: daysBeforeRenewal.filter(d => d !== day)
        };
      } else {
        // Add the day
        return {
          ...prev,
          daysBeforeRenewal: [...daysBeforeRenewal, day].sort((a, b) => a - b)
        };
      }
    });
    
    // Clear success message when form is changed
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setPermissionStatus(permission);
    
    if (permission === 'granted') {
      showTestNotification();
      setShowPermissionPrompt(false);
    }
  };

  const handleTestNotification = async () => {
    // First check if notifications are supported and permission is granted
    if (!areNotificationsSupported() || getNotificationPermission() !== 'granted') {
      alert('Please enable notifications in your browser settings first.');
      return;
    }
    
    try {
      // Show a system notification
      await showTestNotification();
      
      // Add a notification to our context
      addNotification(
        'Test Notification',
        'This is a test notification to verify your notification settings are working correctly.'
      );
      
      // Show a success message
      setSuccessMessage('Test notification sent!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification. Please check browser permissions.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user || !userSettings) {
      return;
    }
    
    // Make sure at least one day is selected if notifications are enabled
    if (formData.enabled && formData.daysBeforeRenewal.length === 0) {
      alert('Please select at least one day for renewal notifications');
      return;
    }

    // Make sure at least one notification type is enabled if notifications are enabled
    if (formData.enabled && !formData.browserNotifications && !formData.systemNotifications) {
      alert('Please enable at least one notification type');
      return;
    }
    
    try {
      setSaving(true);
      
      // If notifications are enabled and permission is not granted, request it
      if (formData.enabled && 
          (formData.browserNotifications || formData.systemNotifications) && 
          permissionStatus !== 'granted') {
        const permission = await requestNotificationPermission();
        setPermissionStatus(permission);
        
        // If permission was denied, disable the notification options
        if (permission !== 'granted') {
          setFormData(prev => ({
            ...prev,
            browserNotifications: false,
            systemNotifications: false
          }));
          alert('Notification permission denied. Please enable notifications in your browser settings to receive alerts.');
          setSaving(false);
          return;
        } else {
          // Show a test notification
          showTestNotification();
        }
      }
      
      // Update settings in Firestore
      await updateUserSettings(userSettings.id, {
        notifications: {
          enabled: formData.enabled,
          daysBeforeRenewal: formData.daysBeforeRenewal,
          browserNotifications: formData.browserNotifications && permissionStatus === 'granted',
          systemNotifications: formData.systemNotifications && permissionStatus === 'granted'
        }
      });
      
      // Update local state
      setUserSettings({
        ...userSettings,
        notifications: {
          enabled: formData.enabled,
          daysBeforeRenewal: formData.daysBeforeRenewal,
          browserNotifications: formData.browserNotifications && permissionStatus === 'granted',
          systemNotifications: formData.systemNotifications && permissionStatus === 'granted'
        }
      });
      
      // Show success message
      setSuccessMessage('Notification settings updated successfully!');
      
      // Hide permission prompt
      setShowPermissionPrompt(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-4">
          <Bell className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Subscription Renewal Notifications</h2>
          <p className="text-gray-600 text-sm">Get reminders before your subscriptions renew</p>
        </div>
      </div>
      
      {/* Permission Required Banner */}
      {showPermissionPrompt && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Notification Permission Required</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>To receive notifications, you need to allow permission in your browser.</p>
              </div>
              <button 
                type="button"
                onClick={handleRequestPermission}
                className="mt-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Allow Notifications
              </button>
            </div>
          </div>
        </div>
      )}
      
      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Enable Notifications Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">Enable Notifications</h3>
              <p className="text-gray-600 text-sm">Receive timely reminders about upcoming subscription renewals</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="enabled"
                checked={formData.enabled}
                onChange={handleInputChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Notification Days */}
          <div className={`p-4 bg-gray-50 rounded-lg ${!formData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="font-medium text-gray-800 mb-3">Notification Timing</h3>
            <p className="text-gray-600 text-sm mb-4">Choose when to receive notifications before renewal dates</p>
            
            <div className="flex flex-wrap gap-3">
              {[1, 3, 5].map((day) => (
                <button 
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day as NotificationDay)}
                  className={`px-4 py-2 rounded-lg border border-gray-200 font-medium text-sm transition-colors ${
                    formData.daysBeforeRenewal.includes(day as NotificationDay) 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day} {day === 1 ? 'day' : 'days'} before
                </button>
              ))}
            </div>
          </div>

          {/* Notification Types */}
          <div className={`p-4 bg-gray-50 rounded-lg ${!formData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="font-medium text-gray-800 mb-3">Notification Types</h3>
            <p className="text-gray-600 text-sm mb-4">Choose how you want to receive notifications</p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input 
                  id="browserNotifications" 
                  type="checkbox" 
                  name="browserNotifications"
                  checked={formData.browserNotifications}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="browserNotifications" className="ml-2 text-sm font-medium text-gray-700">Browser Notifications</label>
                
                {formData.browserNotifications && permissionStatus === 'denied' && (
                  <span className="ml-3 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                    Permission Denied in Browser Settings
                  </span>
                )}
              </div>
              
              <div className="flex items-center">
                <input 
                  id="systemNotifications" 
                  type="checkbox" 
                  name="systemNotifications"
                  checked={formData.systemNotifications}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="systemNotifications" className="ml-2 text-sm font-medium text-gray-700">macOS System Notifications</label>
                
                {formData.systemNotifications && permissionStatus === 'denied' && (
                  <span className="ml-3 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                    Permission Denied in Browser Settings
                  </span>
                )}
              </div>
            </div>
            
            {/* Notification info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-medium">About macOS System Notifications</p>
              <ul className="list-disc list-inside mt-1 text-xs">
                <li>System notifications will only appear when your browser is open</li>
                <li>For best results, keep the browser running in the background</li>
                <li>Notifications will be delivered to your Notification Center</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-3">
            <button 
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Apply Changes'}
            </button>
            
            <button 
              type="button"
              onClick={handleTestNotification}
              className="px-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Test Notification
            </button>
          </div>
          
          {successMessage && (
            <div className="flex items-center text-green-600">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings; 