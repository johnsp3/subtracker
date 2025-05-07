'use client';

import { useEffect, useState } from 'react';
import { useCurrencyViewModel, ProviderConfiguration } from '@/viewmodels/currency/currency.viewmodel';

/**
 * Currency Service Initializer
 * 
 * This component initializes the currency exchange service on app startup.
 * It should be mounted once at the application root level.
 */
const CurrencyServiceInitializer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { initialize } = useCurrencyViewModel();
  
  useEffect(() => {
    // Skip if already initialized or running on server
    if (isInitialized || typeof window === 'undefined') {
      return;
    }
    
    // Load provider configurations from local storage
    const loadProviders = async () => {
      try {
        const savedProvidersJson = localStorage.getItem('currencyProviders');
        
        if (savedProvidersJson) {
          const savedProviders = JSON.parse(savedProvidersJson) as ProviderConfiguration[];
          
          if (Array.isArray(savedProviders) && savedProviders.length > 0) {
            // Initialize the currency service with saved providers
            await initialize(savedProviders);
            console.log('Currency service initialized with saved providers');
          }
        }
      } catch (error) {
        console.error('Failed to initialize currency service', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadProviders();
  }, [initialize, isInitialized]);
  
  // This is a utility component and doesn't render anything visible
  return null;
};

export default CurrencyServiceInitializer; 