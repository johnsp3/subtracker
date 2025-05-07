'use client';

import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencyCode } from '@/models/currency/currency.model';

interface DualCurrencyDisplayProps {
  amount: number;
  currency?: string | CurrencyCode;
  className?: string;
  showSecondary?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Dual Currency Display Component
 * 
 * This component displays an amount in both primary and secondary currencies
 * based on user preferences from the CurrencyContext.
 */
const DualCurrencyDisplay: React.FC<DualCurrencyDisplayProps> = ({
  amount,
  currency,
  className = '',
  showSecondary = true,
  size = 'md'
}) => {
  const { formatAmountWithDual } = useCurrency();
  
  // Convert symbol to code if needed
  const getCurrencyCode = (currencySymbol?: string): CurrencyCode => {
    if (!currencySymbol) return 'EUR';
    
    switch (currencySymbol) {
      case '€': return 'EUR';
      case '$': return 'USD';
      case '£': return 'GBP';
      case '¥': return 'JPY';
      default: 
        // If it's already a code, return it
        if (['EUR', 'USD', 'GBP', 'JPY'].includes(currencySymbol)) {
          return currencySymbol as CurrencyCode;
        }
        return 'EUR';
    }
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Format the display with dual currency if enabled
  const formattedAmount = formatAmountWithDual(amount, getCurrencyCode(currency));
  
  // Split the formatted string into primary amount and secondary amount (if any)
  const hasDualDisplay = formattedAmount.includes('(');
  let primaryPart = formattedAmount;
  let secondaryPart = '';
  
  if (hasDualDisplay) {
    const parts = formattedAmount.split('(');
    primaryPart = parts[0].trim();
    secondaryPart = `(${parts[1]}`;
  }
  
  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {primaryPart}
      {hasDualDisplay && (
        <span className="text-gray-500 ml-1 text-sm">
          {secondaryPart}
        </span>
      )}
    </span>
  );
};

export default DualCurrencyDisplay; 