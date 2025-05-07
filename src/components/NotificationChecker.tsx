'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionViewModel } from '@/viewmodels/subscription/subscription.viewmodel';
import { useUserSettingsViewModel } from '@/viewmodels/user/user-settings.viewmodel';
import { 
  checkSubscriptionRenewals, 
  getServiceWorkerRegistration,
  getNotificationPermission
} from '@/utils/serviceWorker';

/**
 * Client component that runs in the background to check for subscription
 * renewals and trigger notifications at appropriate times.
 */
const NotificationChecker = () => {
  const { user } = useAuth();
  const [serviceWorkerReg, setServiceWorkerReg] = useState<ServiceWorkerRegistration | null>(null);
  
  // Use viewmodels instead of direct service calls
  const { subscriptions } = useSubscriptionViewModel(user?.uid || null);
  const { settings } = useUserSettingsViewModel(user?.uid || null);
  
  // Function to get or update the service worker registration
  const updateServiceWorkerRegistration = useCallback(async () => {
    try {
      const registration = await getServiceWorkerRegistration();
      setServiceWorkerReg(registration);
      return registration;
    } catch (error) {
      console.error('Error updating service worker registration:', error);
      return null;
    }
  }, []);
  
  // On component mount, get the service worker registration
  useEffect(() => {
    updateServiceWorkerRegistration();
    
    // Set up an interval to periodically check the service worker registration
    const interval = setInterval(updateServiceWorkerRegistration, 60 * 60 * 1000); // Check hourly
    
    return () => clearInterval(interval);
  }, [updateServiceWorkerRegistration]);
  
  // Check for subscription renewals
  useEffect(() => {
    if (!user || !settings || !subscriptions) return;
    
    // Function to check for subscription renewals
    const checkRenewals = async () => {
      try {
        // If notifications aren't enabled, don't do anything
        if (!settings.notifications.enabled) return;
        
        // Check if notification permission is granted
        const permissionStatus = getNotificationPermission();
        if (permissionStatus !== 'granted') return;
        
        // Send subscriptions and notification settings to service worker for checking
        // Get a fresh registration if needed
        const registration = serviceWorkerReg || await updateServiceWorkerRegistration();
        
        await checkSubscriptionRenewals(
          registration,
          subscriptions,
          settings.notifications
        );
      } catch (error) {
        console.error('Error checking renewals:', error);
      }
    };
    
    // Run the check immediately
    checkRenewals();
    
    // Set up an interval to check for renewals daily
    const interval = setInterval(checkRenewals, 24 * 60 * 60 * 1000); // once a day
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [user, settings, subscriptions, serviceWorkerReg, updateServiceWorkerRegistration]);
  
  // This component doesn't render anything
  return null;
};

export default NotificationChecker; 