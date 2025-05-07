/**
 * Currency View Model
 * 
 * This file serves as a mediator between the currency service (model) and UI components (view).
 * Following the MVVM pattern, this file handles:
 * 1. Business logic related to currency exchange
 * 2. State transformation between model and view formats
 * 3. Error handling and validation
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  CurrencyCode, 
  ExchangeRateProvider,
  ExchangeRateResult,
  CurrencyConversionResult
} from '@/models/currency/currency.model';

import {
  initializeCurrencyService,
  getLatestExchangeRates,
  convertCurrency,
  setActiveCurrencyProvider,
  getActiveCurrencyProvider,
  getAvailableCurrencyProviders
} from '@/services/currency/currency.service';

import { handleError } from '@/services/error/error.service';

/**
 * Provider configuration interface for the view model
 */
export interface ProviderConfiguration {
  provider: ExchangeRateProvider;
  apiKey: string;
  displayName: string;
}

/**
 * Currency view model state interface
 */
export interface CurrencyState {
  /** Loading status */
  loading: boolean;
  
  /** Error message if any */
  error: string | null;
  
  /** Available currency providers */
  availableProviders: ExchangeRateProvider[];
  
  /** Currently active provider */
  activeProvider: ExchangeRateProvider;
  
  /** Last fetched exchange rates */
  exchangeRates: ExchangeRateResult | null;
}

/**
 * Default display names for providers
 */
const PROVIDER_DISPLAY_NAMES: Record<ExchangeRateProvider, string> = {
  [ExchangeRateProvider.EXCHANGE_RATE_API]: 'ExchangeRate-API'
};

/**
 * Currency view model hook
 * 
 * @param initialProviders - Initial provider configurations
 * @returns Currency view model state and methods
 */
export const useCurrencyViewModel = (
  initialProviders?: ProviderConfiguration[]
) => {
  // View model state
  const [state, setState] = useState<CurrencyState>({
    loading: true,
    error: null,
    availableProviders: [],
    activeProvider: ExchangeRateProvider.EXCHANGE_RATE_API,
    exchangeRates: null
  });
  
  /**
   * Initialize the currency service
   */
  const initialize = useCallback(async (providers: ProviderConfiguration[]) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Create config object from provider configurations
      const configs = providers.reduce((acc, config) => {
        acc[config.provider] = { apiKey: config.apiKey };
        return acc;
      }, {} as Record<ExchangeRateProvider, { apiKey: string }>);
      
      // Initialize the service
      await initializeCurrencyService(configs);
      
      // Get available providers and active provider
      const available = getAvailableCurrencyProviders();
      const active = getActiveCurrencyProvider();
      
      setState(prev => ({
        ...prev,
        loading: false,
        availableProviders: available,
        activeProvider: active
      }));
      
      return true;
    } catch (error) {
      // Handle and transform the error
      const appError = handleError(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError.message
      }));
      
      return false;
    }
  }, []);
  
  /**
   * Initialize on first load if initial providers are provided
   */
  useEffect(() => {
    if (initialProviders && initialProviders.length > 0) {
      initialize(initialProviders);
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [initialize, initialProviders]);
  
  /**
   * Change the active currency provider
   */
  const changeProvider = useCallback(async (provider: ExchangeRateProvider) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Set the active provider
      setActiveCurrencyProvider(provider);
      
      setState(prev => ({
        ...prev,
        loading: false,
        activeProvider: provider
      }));
      
      return true;
    } catch (error) {
      // Handle and transform the error
      const appError = handleError(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError.message
      }));
      
      return false;
    }
  }, []);
  
  /**
   * Fetch the latest exchange rates
   */
  const fetchExchangeRates = useCallback(async (
    base: CurrencyCode = 'EUR',
    symbols?: CurrencyCode[]
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get exchange rates
      const rates = await getLatestExchangeRates(base, symbols);
      
      setState(prev => ({
        ...prev,
        loading: false,
        exchangeRates: rates
      }));
      
      return rates;
    } catch (error) {
      // Handle and transform the error
      const appError = handleError(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError.message
      }));
      
      return null;
    }
  }, []);
  
  /**
   * Convert currency amount
   */
  const convert = useCallback(async (
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Perform conversion
      const result = await convertCurrency(amount, from, to);
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
      
      return result;
    } catch (error) {
      // Handle and transform the error
      const appError = handleError(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError.message
      }));
      
      return null;
    }
  }, []);
  
  /**
   * Clear any error message
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  /**
   * Get display name for a provider
   */
  const getProviderDisplayName = useCallback((provider: ExchangeRateProvider) => {
    return PROVIDER_DISPLAY_NAMES[provider] || provider;
  }, []);
  
  return {
    ...state,
    initialize,
    changeProvider,
    fetchExchangeRates,
    convert,
    clearError,
    getProviderDisplayName
  };
}; 