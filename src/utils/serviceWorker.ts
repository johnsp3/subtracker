/**
 * Service Worker utility functions for registering and interacting with service workers
 */

// Function to register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker with scope
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('Service worker registered successfully:', registration.scope);
      
      // Return the registration only if it's active or activating
      if (registration.active || registration.installing || registration.waiting) {
        return registration;
      } else {
        console.warn('Service worker registered but not active');
        return null;
      }
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  console.log('Service workers are not supported in this browser');
  return null;
};

// Function to check if notifications are supported
export const areNotificationsSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Function to check if permission is granted for notifications
export const getNotificationPermission = (): NotificationPermission => {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

// Function to request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  try {
    // First ensure service worker is registered
    await registerServiceWorker();
    
    // Then request permission
    const permission = await Notification.requestPermission();
    
    // If permission granted, show a test notification after a short delay
    // This helps ensure the permission takes effect
    if (permission === 'granted') {
      setTimeout(() => {
        try {
          showTestNotification();
        } catch (error) {
          console.error('Error showing test notification after permission granted:', error);
        }
      }, 500);
    }
    
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Function to get the active service worker registration
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  
  try {
    // Get the existing registration
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    // Find a registration with the correct scope
    const registration = registrations.find(reg => 
      reg.scope.endsWith('/') || reg.scope.endsWith('/service-worker.js')
    );
    
    if (registration) {
      return registration;
    }
    
    // If no registration found, register a new one
    return registerServiceWorker();
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
};

// Function to trigger subscription renewal checks
export const checkSubscriptionRenewals = async (
  swRegistration: ServiceWorkerRegistration | null,
  subscriptions: any[],
  notificationSettings: any
): Promise<void> => {
  // If no registration provided, try to get one
  if (!swRegistration) {
    swRegistration = await getServiceWorkerRegistration();
    if (!swRegistration) return;
  }
  
  if (swRegistration.active) {
    swRegistration.active.postMessage({
      type: 'CHECK_RENEWALS',
      subscriptions,
      notificationSettings
    });
  } else {
    console.warn('Service worker is registered but not active');
  }
};

// Function to show a test notification
export const showTestNotification = async (): Promise<void> => {
  if (!areNotificationsSupported() || Notification.permission !== 'granted') {
    console.error('Notifications are not supported or permission not granted');
    return;
  }
  
  try {
    // Try with the Notification API first
    new Notification('SubTracker Notifications Enabled', {
      body: 'You will now receive notifications about your subscriptions.',
      icon: '/favicon.ico'
    });
  } catch (error) {
    console.error('Error showing test notification with Notification API:', error);
    
    // Fall back to service worker notification
    try {
      const registration = await getServiceWorkerRegistration();
      if (registration) {
        await registration.showNotification('SubTracker Notifications Enabled', {
          body: 'You will now receive notifications about your subscriptions.',
          icon: '/favicon.ico'
        });
      }
    } catch (swError) {
      console.error('Error showing test notification with service worker:', swError);
    }
  }
}; 