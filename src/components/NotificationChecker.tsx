'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, getUserSubscriptions } from '@/utils/firestore';
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
    if (!user) return;
    
    // Function to check for subscription renewals
    const checkRenewals = async () => {
      try {
        // Get user's notification settings
        const settings = await getUserSettings(user.uid);
        
        // If notifications aren't enabled, don't do anything
        if (!settings || !settings.notifications.enabled) return;
        
        // Check if notification permission is granted
        const permissionStatus = getNotificationPermission();
        if (permissionStatus !== 'granted') return;
        
        // Get user's subscriptions
        const subscriptions = await getUserSubscriptions(user.uid);
        
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
  }, [user, serviceWorkerReg, updateServiceWorkerRegistration]);
  
  // This component doesn't render anything
  return null;
};

export default NotificationChecker; 