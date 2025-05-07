'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { CurrencyCode } from '@/models/currency/currency.model';
import { useUserSettingsViewModel } from '@/viewmodels/user/user-settings.viewmodel';
import { useCurrencyViewModel } from '@/viewmodels/currency/currency.viewmodel';

interface CurrencyContextType {
  primaryCurrency: CurrencyCode;
  secondaryCurrency: CurrencyCode;
  showDualCurrency: boolean;
  formatAmount: (amount: number, currency?: CurrencyCode) => string;
  formatAmountWithDual: (amount: number, fromCurrency?: CurrencyCode) => string;
  convertAmount: (amount: number, from: CurrencyCode, to: CurrencyCode) => Promise<number | null>;
  isLoading: boolean;
}

const defaultContext: CurrencyContextType = {
  primaryCurrency: 'EUR',
  secondaryCurrency: 'USD',
  showDualCurrency: true,
  formatAmount: (amount) => `€${amount.toFixed(2)}`,
  formatAmountWithDual: (amount) => `€${amount.toFixed(2)}`,
  convertAmount: async () => null,
  isLoading: false
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

export const useCurrency = () => useContext(CurrencyContext);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useUserSettingsViewModel(user?.uid || null);
  const { convert, loading: conversionLoading } = useCurrencyViewModel();
  
  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>('EUR');
  const [secondaryCurrency, setSecondaryCurrency] = useState<CurrencyCode>('USD');
  const [showDualCurrency, setShowDualCurrency] = useState(true);
  const [conversionCache, setConversionCache] = useState<Record<string, number>>({});
  
  // Store secondary currency amounts for dual display
  const [secondaryAmounts, setSecondaryAmounts] = useState<Record<string, number>>({});
  const [pendingConversions, setPendingConversions] = useState<Record<string, boolean>>({});
  
  // Track which conversions need to be processed
  const [conversionQueue, setConversionQueue] = useState<string[]>([]);
  
  // Ensure secondary currency is different from primary
  const getAlternateCurrency = useCallback((currency: CurrencyCode): CurrencyCode => {
    switch (currency) {
      case 'EUR': return 'USD';
      case 'USD': return 'EUR';
      case 'GBP': return 'USD';
      case 'JPY': return 'USD';
      default: return 'USD';
    }
  }, []);
  
  // Load currency preferences from user settings
  useEffect(() => {
    if (settings?.currency) {
      const primaryCurr = settings.currency.primaryCurrency;
      let secondaryCurr = settings.currency.secondaryCurrency;
      
      // Ensure secondary is different from primary
      if (primaryCurr === secondaryCurr) {
        secondaryCurr = getAlternateCurrency(primaryCurr);
      }
      
      setPrimaryCurrency(primaryCurr);
      setSecondaryCurrency(secondaryCurr);
      setShowDualCurrency(settings.currency.showDualCurrency);
    }
  }, [settings, getAlternateCurrency]);
  
  /**
   * Get currency symbol from currency code
   */
  const getCurrencySymbol = useCallback((currencyCode: CurrencyCode): string => {
    switch (currencyCode) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      default: return currencyCode;
    }
  }, []);
  
  /**
   * Format amount in the specified currency or primary currency if not specified
   */
  const formatAmount = useCallback((amount: number, currency?: CurrencyCode): string => {
    const currencyCode = currency || primaryCurrency;
    
    // Simple formatter - could be enhanced with Intl.NumberFormat for production
    const currencySymbol = getCurrencySymbol(currencyCode);
    return `${currencySymbol}${amount.toFixed(2)}`;
  }, [primaryCurrency, getCurrencySymbol]);
  
  /**
   * Convert amount between currencies
   */
  const convertAmount = useCallback(async (amount: number, from: CurrencyCode, to: CurrencyCode): Promise<number | null> => {
    if (from === to) return amount;
    
    // Create cache key
    const cacheKey = `${from}_${to}`;
    
    // If we have a cached conversion rate, use it
    if (conversionCache[cacheKey]) {
      return amount * conversionCache[cacheKey];
    }
    
    // Otherwise, perform the conversion through the API
    try {
      const result = await convert(amount, from, to);
      
      if (result) {
        // Cache the conversion rate
        setConversionCache(prev => ({
          ...prev,
          [cacheKey]: result.rate
        }));
        
        return result.convertedAmount;
      }
      
      return null;
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return null;
    }
  }, [convert, conversionCache]);
  
  /**
   * Process pending currency conversions outside of render cycle
   */
  useEffect(() => {
    if (!showDualCurrency || conversionQueue.length === 0) return;
    
    const processNextConversion = async () => {
      // Get the next conversion to process
      const conversionKey = conversionQueue[0];
      if (!conversionKey) return;
      
      // Skip if already being processed or completed
      if (pendingConversions[conversionKey] || secondaryAmounts[conversionKey] !== undefined) {
        // Remove from queue and continue
        setConversionQueue(prev => prev.filter(key => key !== conversionKey));
        return;
      }
      
      try {
        // Mark this conversion as pending
        setPendingConversions(prev => ({
          ...prev,
          [conversionKey]: true
        }));
        
        // Parse conversion key to get details
        const [amountStr, fromCurrency, toCurrency] = conversionKey.split('_');
        const amount = parseFloat(amountStr);
        
        // Perform the conversion
        const converted = await convertAmount(
          amount, 
          fromCurrency as CurrencyCode, 
          toCurrency as CurrencyCode
        );
        
        // Store the result if successful
        if (converted !== null) {
          setSecondaryAmounts(prev => ({
            ...prev,
            [conversionKey]: converted
          }));
        }
      } catch (error) {
        console.error('Error processing currency conversion:', error);
      } finally {
        // Clear pending status
        setPendingConversions(prev => {
          const updated = { ...prev };
          delete updated[conversionKey];
          return updated;
        });
        
        // Remove from queue
        setConversionQueue(prev => prev.filter(key => key !== conversionKey));
      }
    };
    
    processNextConversion();
  }, [conversionQueue, pendingConversions, secondaryAmounts, showDualCurrency, convertAmount]);
  
  /**
   * Format amount with dual currency display as a string
   * This function is safe to use during rendering as it doesn't initiate state updates
   */
  const formatAmountWithDual = useCallback((amount: number, fromCurrency?: CurrencyCode): string => {
    const actualFromCurrency = fromCurrency || primaryCurrency;
    
    // If we're not showing dual currency, just return the formatted amount
    if (!showDualCurrency) {
      return formatAmount(amount, actualFromCurrency);
    }
    
    // Always display a different currency for secondary display
    let displaySecondary: CurrencyCode;
    
    if (actualFromCurrency === primaryCurrency) {
      // If displaying in primary currency, use secondary as the dual display
      displaySecondary = secondaryCurrency;
    } else if (actualFromCurrency === secondaryCurrency) {
      // If displaying in secondary currency, use primary as the dual display
      displaySecondary = primaryCurrency;
    } else {
      // If displaying in a third currency, prefer secondary currency for dual display
      // unless it's the same as the from currency, then use primary
      displaySecondary = (actualFromCurrency === secondaryCurrency) ? primaryCurrency : secondaryCurrency;
    }
    
    // Sanity check - ensure we're always displaying different currencies
    if (displaySecondary === actualFromCurrency) {
      displaySecondary = getAlternateCurrency(actualFromCurrency);
    }
    
    // Create a unique key for this conversion
    const conversionKey = `${amount}_${actualFromCurrency}_${displaySecondary}`;
    
    // Queue this conversion if needed (but don't update state during render)
    if (secondaryAmounts[conversionKey] === undefined && 
        !pendingConversions[conversionKey] && 
        !conversionQueue.includes(conversionKey)) {
      // Add to queue in the next tick to avoid state updates during render
      setTimeout(() => {
        setConversionQueue(prev => {
          if (prev.includes(conversionKey)) return prev;
          return [...prev, conversionKey];
        });
      }, 0);
    }
    
    // Get the secondary amount if available
    const secondaryAmount = secondaryAmounts[conversionKey];
    const isPending = pendingConversions[conversionKey];
    
    // Format the primary amount
    const primaryFormatted = formatAmount(amount, actualFromCurrency);
    
    // Return combined format if secondary amount is available
    if (secondaryAmount !== undefined) {
      return `${primaryFormatted} (${formatAmount(secondaryAmount, displaySecondary)})`;
    }
    
    // Return with loading indicator if conversion is pending
    if (isPending) {
      return `${primaryFormatted} (...)`;
    }
    
    // Otherwise just return the primary amount
    return primaryFormatted;
  }, [
    primaryCurrency, 
    secondaryCurrency, 
    showDualCurrency, 
    formatAmount, 
    secondaryAmounts, 
    pendingConversions,
    conversionQueue,
    getAlternateCurrency
  ]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    primaryCurrency,
    secondaryCurrency,
    showDualCurrency,
    formatAmount,
    formatAmountWithDual,
    convertAmount,
    isLoading: settingsLoading || conversionLoading
  }), [
    primaryCurrency,
    secondaryCurrency,
    showDualCurrency,
    formatAmount,
    formatAmountWithDual,
    convertAmount,
    settingsLoading,
    conversionLoading
  ]);
  
  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}; 