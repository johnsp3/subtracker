/**
 * Currency Service
 * 
 * This is the main service file for currency exchange operations.
 * It acts as a facade for the various currency providers and exposes
 * a simple, unified API for the rest of the application.
 */

import { 
  CurrencyCode, 
  ExchangeRateProvider, 
  ExchangeRateResult,
  CurrencyConversionResult
} from '@/models/currency/currency.model';

import { 
  CurrencyProviderConfig 
} from './currency-provider.interface';

import { CurrencyProviderFactory } from './currency-provider-factory';
import { createError, ErrorType } from '@/services/error/error.service';

/**
 * Default provider to use if none is specified
 */
const DEFAULT_PROVIDER = ExchangeRateProvider.EXCHANGE_RATE_API;

/**
 * LocalStorage key for active provider
 */
const ACTIVE_PROVIDER_STORAGE_KEY = 'activeCurrencyProvider';

/**
 * Initialize the currency service with provider configurations
 * 
 * @param configs - Map of provider configurations by provider type
 * @returns Promise that resolves when initialization is complete
 */
export const initializeCurrencyService = async (
  configs: Partial<Record<ExchangeRateProvider, CurrencyProviderConfig>>
): Promise<void> => {
  const factory = CurrencyProviderFactory.getInstance();
  
  // Initialize each provider with its config
  Object.entries(configs).forEach(([provider, config]) => {
    if (config && config.apiKey) {
      factory.initializeProvider(provider as ExchangeRateProvider, config);
    }
  });
  
  // Check if there's a saved provider preference
  if (typeof window !== 'undefined') {
    const savedProvider = localStorage.getItem(ACTIVE_PROVIDER_STORAGE_KEY);
    
    if (savedProvider && factory.hasProvider(savedProvider as ExchangeRateProvider)) {
      // Use the saved provider if it's available
      factory.setActiveProvider(savedProvider as ExchangeRateProvider);
      return;
    }
  }
  
  // Otherwise auto-select a working provider
  await factory.autoSelectProvider();
};

/**
 * Set the active currency provider
 * 
 * @param provider - Provider to set as active
 */
export const setActiveCurrencyProvider = (provider: ExchangeRateProvider): void => {
  const factory = CurrencyProviderFactory.getInstance();
  
  if (!factory.hasProvider(provider)) {
    throw new Error(`Provider ${provider} has not been initialized`);
  }
  
  // Set the active provider in the factory
  factory.setActiveProvider(provider);
  
  // Save the active provider to localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_PROVIDER_STORAGE_KEY, provider);
  }
};

/**
 * Get the currently active provider
 * 
 * @returns The active provider type
 */
export const getActiveCurrencyProvider = (): ExchangeRateProvider => {
  try {
    const factory = CurrencyProviderFactory.getInstance();
    return factory.getActiveProvider().provider;
  } catch (error) {
    // If no provider is active, return the default
    return DEFAULT_PROVIDER;
  }
};

/**
 * Get all available provider types that have been initialized
 * 
 * @returns Array of available provider types
 */
export const getAvailableCurrencyProviders = (): ExchangeRateProvider[] => {
  const factory = CurrencyProviderFactory.getInstance();
  return factory.getAvailableProviders();
};

/**
 * Get the latest exchange rates
 * 
 * @param base - Base currency code
 * @param symbols - Optional specific currencies to get rates for
 * @param provider - Optional specific provider to use (uses active provider by default)
 * @returns Promise with exchange rate result
 */
export const getLatestExchangeRates = async (
  base: CurrencyCode = 'EUR',
  symbols?: CurrencyCode[],
  provider?: ExchangeRateProvider
): Promise<ExchangeRateResult> => {
  const factory = CurrencyProviderFactory.getInstance();
  
  try {
    // Use the specified provider or fall back to the active provider
    if (provider && factory.hasProvider(provider)) {
      return await factory.getProvider(provider).getLatestRates(base, symbols);
    }
    
    return await factory.getActiveProvider().getLatestRates(base, symbols);
  } catch (error) {
    // If the active provider fails, try other providers if available
    if (!provider && factory.getAvailableProviders().length > 1) {
      const activeProvider = factory.getActiveProvider().provider;
      const otherProviders = factory.getAvailableProviders().filter(p => p !== activeProvider);
      
      // Try each available provider
      for (const altProvider of otherProviders) {
        try {
          const result = await factory.getProvider(altProvider).getLatestRates(base, symbols);
          // If successful, set this provider as active
          setActiveCurrencyProvider(altProvider); // Use our function to ensure it's also saved to localStorage
          console.log(`Switched to alternate provider: ${altProvider}`);
          return result;
        } catch (altError) {
          // Continue to next provider
          console.error(`Alternative provider ${altProvider} also failed:`, altError);
        }
      }
    }
    
    // If we get here, all providers failed
    throw createError(
      ErrorType.NETWORK,
      'Unable to fetch exchange rates from any provider',
      'currency_service_unavailable',
      error
    );
  }
};

/**
 * Convert an amount from one currency to another
 * 
 * @param amount - Amount to convert
 * @param from - Source currency code
 * @param to - Target currency code
 * @param provider - Optional specific provider to use (uses active provider by default)
 * @returns Promise with conversion result
 */
export const convertCurrency = async (
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  provider?: ExchangeRateProvider
): Promise<CurrencyConversionResult> => {
  const factory = CurrencyProviderFactory.getInstance();
  
  try {
    // Use the specified provider or fall back to the active provider
    if (provider && factory.hasProvider(provider)) {
      return await factory.getProvider(provider).convertCurrency(amount, from, to);
    }
    
    return await factory.getActiveProvider().convertCurrency(amount, from, to);
  } catch (error) {
    // If the active provider fails, try other providers if available
    if (!provider && factory.getAvailableProviders().length > 1) {
      const activeProvider = factory.getActiveProvider().provider;
      const otherProviders = factory.getAvailableProviders().filter(p => p !== activeProvider);
      
      // Try each available provider
      for (const altProvider of otherProviders) {
        try {
          const result = await factory.getProvider(altProvider).convertCurrency(amount, from, to);
          // If successful, set this provider as active
          setActiveCurrencyProvider(altProvider); // Use our function to ensure it's also saved to localStorage
          console.log(`Switched to alternate provider: ${altProvider}`);
          return result;
        } catch (altError) {
          // Continue to next provider
          console.error(`Alternative provider ${altProvider} also failed:`, altError);
        }
      }
    }
    
    // If we get here, all providers failed
    throw createError(
      ErrorType.NETWORK,
      'Unable to convert currency with any provider',
      'currency_service_unavailable',
      error
    );
  }
}; 