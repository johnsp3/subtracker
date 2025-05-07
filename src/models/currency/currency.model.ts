/**
 * Currency Exchange Rate Model
 * 
 * This file defines types and interfaces related to currency exchange data.
 * Following the Single Responsibility Principle, this file only handles
 * currency exchange data structures.
 */

/**
 * Exchange Rate Provider enum
 * 
 * Supported external API providers for currency exchange rates
 */
export enum ExchangeRateProvider {
  EXCHANGE_RATE_API = 'exchangerate-api'
}

/**
 * Currency Code type
 * 
 * Common currency codes used throughout the application
 */
export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | string;

/**
 * Rate object interface
 * 
 * Maps currency codes to their exchange rate values
 */
export interface ExchangeRates {
  [currencyCode: string]: number;
}

/**
 * Exchange Rate Result interface
 * 
 * Standard format for exchange rate results, regardless of provider
 */
export interface ExchangeRateResult {
  /** Base currency that rates are relative to */
  base: CurrencyCode;
  
  /** Date when rates were last updated */
  date: string;
  
  /** Object mapping currency codes to their exchange rate values */
  rates: ExchangeRates;
  
  /** Source provider of the exchange rate data */
  provider: ExchangeRateProvider;
  
  /** Timestamp when the data was fetched or calculated */
  timestamp: number;
}

/**
 * Currency Conversion Result interface
 * 
 * Result of a currency conversion calculation
 */
export interface CurrencyConversionResult {
  /** Original amount before conversion */
  amount: number;
  
  /** Currency of the original amount */
  from: CurrencyCode;
  
  /** Currency to convert to */
  to: CurrencyCode;
  
  /** Converted amount */
  convertedAmount: number;
  
  /** The exchange rate used for conversion */
  rate: number;
  
  /** Date when the rate was last updated */
  date: string;
  
  /** Source provider of the exchange rate data */
  provider: ExchangeRateProvider;
}

/**
 * Exchange Rate Cache interface
 * 
 * Structure for caching exchange rate data
 */
export interface ExchangeRateCache {
  /** The cached exchange rate data */
  data: ExchangeRateResult;
  
  /** Timestamp when the data was cached */
  timestamp: number;
  
  /** TTL in milliseconds */
  ttl: number;
}

/**
 * Error types specific to currency exchange
 */
export enum CurrencyErrorType {
  INVALID_API_KEY = 'invalid_api_key',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNSUPPORTED_CURRENCY = 'unsupported_currency',
  INVALID_BASE_CURRENCY = 'invalid_base_currency',
  PROVIDER_ERROR = 'provider_error',
  NETWORK_ERROR = 'network_error'
} 