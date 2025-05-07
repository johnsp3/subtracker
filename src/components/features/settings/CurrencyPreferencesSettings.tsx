'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, DollarSign } from 'lucide-react';
import { useUserSettingsViewModel } from '@/viewmodels/user/user-settings.viewmodel';
import { CurrencyCode } from '@/models/currency/currency.model';

/**
 * Currency Preferences Settings Component
 * 
 * This component allows users to configure their currency preferences,
 * including primary and secondary currencies and whether to show dual currency.
 */
const CurrencyPreferencesSettings = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Use the user settings view model
  const {
    settings,
    loading,
    error,
    clearError,
    updateCurrencyPreferences,
    getCurrencySettingsDisplay
  } = useUserSettingsViewModel(user?.uid || null);
  
  // Local form state
  const [formData, setFormData] = useState({
    primaryCurrency: 'EUR' as CurrencyCode,
    secondaryCurrency: 'USD' as CurrencyCode,
    showDualCurrency: true
  });
  
  // Initialize form data when settings are loaded
  useEffect(() => {
    const currencySettings = getCurrencySettingsDisplay();
    if (currencySettings) {
      setFormData({
        primaryCurrency: currencySettings.primaryCurrency,
        secondaryCurrency: currencySettings.secondaryCurrency !== currencySettings.primaryCurrency 
          ? currencySettings.secondaryCurrency 
          : currencySettings.primaryCurrency === 'EUR' ? 'USD' : 'EUR',
        showDualCurrency: currencySettings.showDualCurrency
      });
    }
  }, [settings, getCurrencySettingsDisplay]);
  
  // Show error as an alert
  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error, clearError]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For checkbox inputs, use checked property
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
      setValidationError(null);
    } else if (name === 'primaryCurrency') {
      // If primary currency changes, ensure secondary is different
      setFormData(prev => {
        const newPrimaryCurrency = value as CurrencyCode;
        let newSecondaryCurrency = prev.secondaryCurrency;
        
        // If new primary is same as current secondary, switch secondary to a different default
        if (newPrimaryCurrency === prev.secondaryCurrency) {
          newSecondaryCurrency = newPrimaryCurrency === 'EUR' ? 'USD' : 'EUR';
        }
        
        return {
          ...prev,
          primaryCurrency: newPrimaryCurrency,
          secondaryCurrency: newSecondaryCurrency
        };
      });
      setValidationError(null);
    } else if (name === 'secondaryCurrency') {
      // Prevent setting secondary to same as primary
      if (value === formData.primaryCurrency) {
        setValidationError('Primary and secondary currencies must be different');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        secondaryCurrency: value as CurrencyCode
      }));
      setValidationError(null);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      setValidationError(null);
    }
    
    // Clear success message when form is changed
    if (successMessage) {
      setSuccessMessage('');
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate currencies are different
    if (formData.primaryCurrency === formData.secondaryCurrency) {
      setValidationError('Primary and secondary currencies must be different');
      return;
    }
    
    setSaving(true);
    setValidationError(null);
    
    try {
      // Update currency preferences
      const success = await updateCurrencyPreferences({
        primaryCurrency: formData.primaryCurrency,
        secondaryCurrency: formData.secondaryCurrency,
        showDualCurrency: formData.showDualCurrency
      });
      
      if (success) {
        setSuccessMessage('Currency preferences saved successfully');
      }
    } catch (err) {
      console.error('Failed to save currency preferences', err);
      alert('Failed to save currency preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Get proper currency symbol from code
  const getCurrencySymbol = (currencyCode: CurrencyCode): string => {
    switch (currencyCode) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      default: return currencyCode;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <DollarSign className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold">Currency Display Preferences</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Configure how currencies are displayed throughout the application.
        You can enable dual currency display to show amounts in both primary and secondary currencies.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Currency</label>
            <select
              name="primaryCurrency"
              value={formData.primaryCurrency}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={loading}
            >
              <option value="EUR">€ (Euro)</option>
              <option value="USD">$ (US Dollar)</option>
              <option value="GBP">£ (British Pound)</option>
              <option value="JPY">¥ (Japanese Yen)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Your main currency for displaying amounts
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Currency</label>
            <select
              name="secondaryCurrency"
              value={formData.secondaryCurrency}
              onChange={handleInputChange}
              className={`w-full p-3 bg-gray-50 border ${validationError ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
              disabled={loading}
            >
              <option value="USD" disabled={formData.primaryCurrency === 'USD'}>$ (US Dollar)</option>
              <option value="EUR" disabled={formData.primaryCurrency === 'EUR'}>€ (Euro)</option>
              <option value="GBP" disabled={formData.primaryCurrency === 'GBP'}>£ (British Pound)</option>
              <option value="JPY" disabled={formData.primaryCurrency === 'JPY'}>¥ (Japanese Yen)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Shown alongside primary currency when dual display is enabled
            </p>
            {validationError && (
              <p className="text-xs text-red-500 mt-1">{validationError}</p>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDualCurrency"
              name="showDualCurrency"
              checked={formData.showDualCurrency}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
              disabled={loading}
            />
            <label htmlFor="showDualCurrency" className="ml-2 block text-sm text-gray-700">
              Enable dual currency display
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <button 
            type="submit"
            disabled={saving || loading || !!validationError}
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
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
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
        <div className="flex flex-col space-y-2">
          <div>
            <span className="text-xs text-gray-500">Primary currency:</span>
            <div className="text-lg font-semibold">
              {getCurrencySymbol(formData.primaryCurrency)}100.00
            </div>
          </div>
          {formData.showDualCurrency && (
            <div>
              <span className="text-xs text-gray-500">With dual display:</span>
              <div className="text-lg">
                {getCurrencySymbol(formData.primaryCurrency)}100.00
                <span className="text-gray-500 ml-1 text-sm">
                  ({getCurrencySymbol(formData.secondaryCurrency)}108.50)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyPreferencesSettings; 