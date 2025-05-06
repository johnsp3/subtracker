'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/serviceWorker';

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    const initServiceWorker = async () => {
      await registerServiceWorker();
    };

    // Initialize service worker
    initServiceWorker();
  }, []);

  // This component doesn't render anything
  return null;
};

export default ServiceWorkerRegistration; 