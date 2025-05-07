/**
 * Currency Provider Migration Utility
 * 
 * This utility migrates old currency provider settings from localStorage.
 * It removes the deprecated 'fixer' provider and ensures only valid providers are stored.
 */
import { ExchangeRateProvider } from '@/models/currency/currency.model';

interface StoredProvider {
  provider: string;
  apiKey: string;
}

/**
 * Migrate currency provider settings in localStorage
 * 
 * This function should be called on app initialization to ensure
 * that no deprecated providers are used.
 */
export const migrateCurrencyProviders = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if we have saved providers
    const savedProviders = localStorage.getItem('currencyProviders');
    if (!savedProviders) return;
    
    // Parse the saved providers
    const providers: StoredProvider[] = JSON.parse(savedProviders);
    
    // Filter out the deprecated 'fixer' provider
    const validProviders = providers.filter(p => 
      p.provider !== 'fixer' && 
      Object.values(ExchangeRateProvider).includes(p.provider as ExchangeRateProvider)
    );
    
    // Ensure we have at least one valid provider
    if (validProviders.length === 0) {
      // If we don't have any valid providers, clear the localStorage item
      localStorage.removeItem('currencyProviders');
      console.log('Removed deprecated currency providers from localStorage');
    } else if (validProviders.length !== providers.length) {
      // If we filtered out some providers, save the valid ones
      localStorage.setItem('currencyProviders', JSON.stringify(validProviders));
      console.log('Migrated currency providers in localStorage');
    }
    
    // Check if we have a saved active provider
    const activeProvider = localStorage.getItem('activeCurrencyProvider');
    if (activeProvider === 'fixer') {
      // If the active provider is 'fixer', set it to the default
      localStorage.setItem('activeCurrencyProvider', ExchangeRateProvider.EXCHANGE_RATE_API);
      console.log('Updated active currency provider to default');
    }
  } catch (error) {
    console.error('Error migrating currency providers:', error);
    // If there's an error, clear the providers to ensure a clean state
    localStorage.removeItem('currencyProviders');
    localStorage.removeItem('activeCurrencyProvider');
  }
}; 