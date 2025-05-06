// Service Worker for SubTracker
const CACHE_NAME = 'subtracker-cache-v1';

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/favicon.ico'
];

// Keep track of subscriptions that we've already notified about
// to prevent duplicate notifications
const notifiedSubscriptions = new Map();

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.', event);

  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.url,
      actions: [
        {
          action: 'view',
          title: 'View Subscription'
        }
      ],
      vibrate: [100, 50, 100],
      tag: data.id || 'subscription-notification', // Prevent duplicate notifications
      renotify: data.renotify || false
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push event:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.', event);
  
  event.notification.close();

  let urlToOpen = '/';
  
  if (event.action === 'view' && event.notification.data) {
    urlToOpen = event.notification.data;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there is already a window/tab open with the target URL
      for (const client of clientList) {
        const url = new URL(client.url);
        const appUrl = new URL(self.location.origin);
        
        // If we have an existing window, focus it and navigate if needed
        if (url.origin === appUrl.origin) {
          client.focus();
          // If we need to navigate to a different path, do it
          if (url.pathname !== urlToOpen && urlToOpen !== '/') {
            return client.navigate(urlToOpen);
          }
          return;
        }
      }
      
      // If no existing window, open a new one
      return clients.openWindow(urlToOpen);
    })
  );
});

// Function to check for upcoming subscription renewals
// This can be triggered via a message from the main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'CHECK_RENEWALS') {
    try {
      const { subscriptions, notificationSettings } = event.data;
      
      if (!notificationSettings.enabled) {
        console.log('[Service Worker] Notifications are disabled');
        return;
      }
      
      const today = new Date();
      const notificationDays = notificationSettings.daysBeforeRenewal;
      
      console.log(`[Service Worker] Checking ${subscriptions.length} subscriptions for renewals...`);
      
      // Check each subscription
      subscriptions.forEach(subscription => {
        if (subscription.status !== 'active') {
          return;
        }
        
        const nextBillingDate = new Date(subscription.nextBilling);
        const daysUntilRenewal = Math.ceil((nextBillingDate - today) / (1000 * 60 * 60 * 24));
        
        // Create a unique key for this subscription and renewal date
        const notificationKey = `${subscription.id}:${daysUntilRenewal}:${today.toDateString()}`;
        
        // If we've already notified for this specific renewal on this day, skip it
        if (notifiedSubscriptions.has(notificationKey)) {
          return;
        }
        
        // If the days until renewal matches one of our notification days, show a notification
        if (notificationDays.includes(daysUntilRenewal)) {
          const title = `Subscription Renewal: ${subscription.name}`;
          const body = `Your ${subscription.name} subscription will renew in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}. The cost will be ${subscription.currency}${subscription.price}.`;
          
          console.log(`[Service Worker] Sending notification for ${subscription.name} - renews in ${daysUntilRenewal} days`);
          
          self.registration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: '/subscriptions',
            vibrate: [100, 50, 100],
            tag: `subscription-${subscription.id}`, // Prevent duplicate notifications
            renotify: false
          });
          
          // Remember that we've notified for this subscription today
          notifiedSubscriptions.set(notificationKey, true);
          
          // Clean up old notification records (keep the map size manageable)
          if (notifiedSubscriptions.size > 100) {
            // Remove the oldest entries
            const keysToDelete = Array.from(notifiedSubscriptions.keys()).slice(0, 50);
            keysToDelete.forEach(key => notifiedSubscriptions.delete(key));
          }
        }
      });
    } catch (error) {
      console.error('[Service Worker] Error checking renewals:', error);
    }
  }
}); 