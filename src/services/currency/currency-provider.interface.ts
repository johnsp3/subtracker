/**
 * Currency Exchange Provider Interface
 * 
 * This file defines the contract that all currency exchange providers must implement.
 * Following the Dependency Inversion Principle, high-level modules depend on this
 * abstraction rather than concrete implementations.
 */

import { 
  CurrencyCode, 
  ExchangeRateResult, 
  CurrencyConversionResult, 
  ExchangeRateProvider 
} from '@/models/currency/currency.model';

/**
 * Configuration options for currency providers
 */
export interface CurrencyProviderConfig {
  /** API key for the provider */
  apiKey: string;
  
  /** Base URL for API requests */
  baseUrl?: string;
  
  /** Cache duration in milliseconds (default: 1 hour) */
  cacheTtl?: number;
  
  /** Maximum number of retry attempts for failed requests */
  maxRetries?: number;
  
  /** Initial delay for retry backoff in milliseconds */
  initialRetryDelay?: number;
  
  /** Maximum delay between retries in milliseconds */
  maxRetryDelay?: number;
  
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_PROVIDER_CONFIG: Omit<CurrencyProviderConfig, 'apiKey'> = {
  cacheTtl: 60 * 60 * 1000, // 1 hour
  maxRetries: 3,
  initialRetryDelay: 1000, // 1 second
  maxRetryDelay: 30000, // 30 seconds
  timeout: 10000 // 10 seconds
};

/**
 * Interface for currency exchange providers
 */
export interface ICurrencyProvider {
  /**
   * Get the provider type
   */
  readonly provider: ExchangeRateProvider;
  
  /**
   * Get the latest exchange rates for a base currency
   * 
   * @param base - Base currency code
   * @param symbols - Optional specific currencies to get rates for
   * @returns Promise with exchange rate result
   */
  getLatestRates(base: CurrencyCode, symbols?: CurrencyCode[]): Promise<ExchangeRateResult>;
  
  /**
   * Convert an amount from one currency to another
   * 
   * @param amount - Amount to convert
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Promise with conversion result
   */
  convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<CurrencyConversionResult>;
  
  /**
   * Check if the provider is available and API key is valid
   * 
   * @returns Promise resolving to true if provider is available
   */
  testConnection(): Promise<boolean>;
} 