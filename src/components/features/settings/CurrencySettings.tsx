'use client';

import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { useCurrencyViewModel, ProviderConfiguration } from '@/viewmodels/currency/currency.viewmodel';
import { ExchangeRateProvider } from '@/models/currency/currency.model';
import { Wallet, RefreshCw } from 'lucide-react';

/**
 * Currency Exchange Settings Component
 * 
 * This component allows users to configure currency exchange API providers
 * and select the active provider.
 */
const CurrencySettings = () => {
  // Initialization ref to avoid infinite useEffect loops
  const isInitialized = useRef(false);
  
  // Get user settings from local storage on mount
  const getInitialProviders = (): ProviderConfiguration[] => {
    if (typeof window === 'undefined') return [];
    
    const saved = localStorage.getItem('currencyProviders');
    if (!saved) return [];
    
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved currency providers', e);
      return [];
    }
  };

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Use the currency view model
  const {
    loading,
    error,
    availableProviders,
    activeProvider,
    initialize,
    changeProvider,
    clearError,
    getProviderDisplayName
  } = useCurrencyViewModel();
  
  // Local form state
  const [formData, setFormData] = useState<{
    exchangeRateApiKey: string;
  }>({
    exchangeRateApiKey: ''
  });
  
  // Form errors state
  const [formErrors, setFormErrors] = useState<{
    exchangeRateApiKey?: string;
  }>({});
  
  // Function to update form data from providers (extracted to avoid dependency issues)
  const updateFormFromProviders = useCallback((providers: ProviderConfiguration[]) => {
    const newFormData = {
      exchangeRateApiKey: ''
    };
    
    providers.forEach(provider => {
      if (provider.provider === ExchangeRateProvider.EXCHANGE_RATE_API) {
        newFormData.exchangeRateApiKey = provider.apiKey;
      }
    });
    
    setFormData(newFormData);
  }, []);
  
  // Initialize from saved settings when component mounts
  useEffect(() => {
    // Skip if already initialized or running on server
    if (isInitialized.current || typeof window === 'undefined') {
      return;
    }
    
    const savedProviders = getInitialProviders();
    
    if (savedProviders.length > 0) {
      // Update form data with saved API keys
      updateFormFromProviders(savedProviders);
      
      // Initialize the currency service with saved providers
      initialize(savedProviders);
      
      // Mark as initialized
      isInitialized.current = true;
    }
  }, [initialize, updateFormFromProviders]);
  
  // Show error as an alert
  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error, clearError]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear success message when form is changed
    if (successMessage) {
      setSuccessMessage('');
    }
    
    // Clear validation errors when input changes
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: {
      exchangeRateApiKey?: string;
    } = {};
    
    // API key must be provided
    if (!formData.exchangeRateApiKey) {
      errors.exchangeRateApiKey = 'API key is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      // Build provider configurations from form data
      const providers: ProviderConfiguration[] = [];
      
      if (formData.exchangeRateApiKey) {
        providers.push({
          provider: ExchangeRateProvider.EXCHANGE_RATE_API,
          apiKey: formData.exchangeRateApiKey,
          displayName: getProviderDisplayName(ExchangeRateProvider.EXCHANGE_RATE_API)
        });
      }
      
      // Save providers to local storage
      localStorage.setItem('currencyProviders', JSON.stringify(providers));
      
      // Initialize the currency service with the new providers
      await initialize(providers);
      
      // Show success message
      setSuccessMessage('Currency provider settings saved successfully');
    } catch (err) {
      console.error('Failed to save currency provider settings', err);
      alert('Failed to save currency provider settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <RefreshCw className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold">Currency Exchange API Settings</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Configure the API provider for currency exchange rate data. You need to register for 
        an API key with ExchangeRate-API to use the currency conversion features.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ExchangeRate-API Key</label>
            <input
              type="password"
              name="exchangeRateApiKey"
              value={formData.exchangeRateApiKey}
              onChange={handleInputChange}
              placeholder="Enter your ExchangeRate-API key"
              className={`w-full p-3 bg-gray-50 border ${formErrors.exchangeRateApiKey ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
              disabled={loading}
            />
            {formErrors.exchangeRateApiKey && <p className="text-red-500 text-xs mt-1">{formErrors.exchangeRateApiKey}</p>}
            <p className="text-xs text-gray-500 mt-1">
              <a href="https://www.exchangerate-api.com/" target="_blank" rel="noopener noreferrer" className="text-primary">
                Register for an ExchangeRate-API key
              </a>
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <button 
            type="submit"
            disabled={saving || loading}
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
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

export default CurrencySettings; 