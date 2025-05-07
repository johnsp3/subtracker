/**
 * ExchangeRate-API Currency Provider
 * 
 * Concrete implementation of the currency provider interface for ExchangeRate-API.
 */

import { 
  CurrencyCode, 
  ExchangeRateResult, 
  ExchangeRateProvider,
  CurrencyErrorType
} from '@/models/currency/currency.model';

import { 
  CurrencyProviderConfig 
} from './currency-provider.interface';

import { BaseCurrencyProvider } from './base-currency-provider';
import { ErrorType, createError } from '@/services/error/error.service';

/**
 * ExchangeRate-API response interface
 */
interface ExchangeRateApiResponse {
  result: string;
  documentation?: string;
  terms_of_use?: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: { [key: string]: number };
  error_type?: string;
  error_message?: string;
}

/**
 * Default ExchangeRate-API configuration
 */
const DEFAULT_EXCHANGE_RATE_API_CONFIG: Partial<CurrencyProviderConfig> = {
  baseUrl: 'https://v6.exchangerate-api.com/v6'
};

/**
 * ExchangeRate-API currency provider implementation
 */
export class ExchangeRateApiProvider extends BaseCurrencyProvider {
  readonly provider = ExchangeRateProvider.EXCHANGE_RATE_API;
  
  /**
   * Constructor for the ExchangeRate-API provider
   * 
   * @param config - Provider configuration with API key
   */
  constructor(config: CurrencyProviderConfig) {
    super({
      ...DEFAULT_EXCHANGE_RATE_API_CONFIG,
      ...config
    });
  }
  
  /**
   * Fetch the latest exchange rates from ExchangeRate-API
   * 
   * @param base - Base currency code
   * @param symbols - Optional specific currencies to get rates for
   * @returns Promise with exchange rate result
   */
  protected async fetchLatestRates(base: CurrencyCode, symbols?: CurrencyCode[]): Promise<ExchangeRateResult> {
    // Build request URL
    const url = `${this.config.baseUrl}/${this.config.apiKey}/latest/${base}`;
    
    try {
      // Fetch data from ExchangeRate-API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw createError(
          ErrorType.NETWORK,
          `ExchangeRate-API returned ${response.status} ${response.statusText}`,
          CurrencyErrorType.PROVIDER_ERROR
        );
      }
      
      const data: ExchangeRateApiResponse = await response.json();
      
      // Check for API-level errors
      if (data.result === 'error') {
        this.handleExchangeRateApiError(data);
      }
      
      // Filter rates if specific symbols were requested
      let rates = { ...data.conversion_rates };
      if (symbols && symbols.length > 0) {
        const filteredRates: { [key: string]: number } = {};
        symbols.forEach(symbol => {
          if (rates[symbol] !== undefined) {
            filteredRates[symbol] = rates[symbol];
          }
        });
        rates = filteredRates;
      }
      
      // Convert the date format
      const dateStr = new Date(data.time_last_update_unix * 1000).toISOString().split('T')[0];
      
      // Transform the response to our standard format
      return {
        base: data.base_code,
        date: dateStr,
        rates,
        provider: this.provider,
        timestamp: data.time_last_update_unix * 1000 // Convert to milliseconds
      };
    } catch (error) {
      // For any fetch errors, transform them
      if (!(error instanceof Error) || !('type' in error)) {
        throw this.handleProviderError(error);
      }
      throw error;
    }
  }
  
  /**
   * Test the connection to ExchangeRate-API
   * 
   * @returns Promise resolving to true if connection works
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch USD as a simple test
      await this.getLatestRates('USD');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Handle ExchangeRate-API specific error responses
   * 
   * @param response - ExchangeRate-API error response
   */
  private handleExchangeRateApiError(response: ExchangeRateApiResponse): never {
    const errorType = response.error_type || 'unknown_error';
    const errorMessage = response.error_message || 'Unknown ExchangeRate-API error';
    
    switch (errorType) {
      case 'unsupported-code':
        throw createError(
          ErrorType.VALIDATION,
          'Unsupported currency code',
          CurrencyErrorType.UNSUPPORTED_CURRENCY,
          response
        );
      
      case 'malformed-request':
        throw createError(
          ErrorType.VALIDATION,
          'Invalid API request format',
          CurrencyErrorType.PROVIDER_ERROR,
          response
        );
      
      case 'invalid-key':
        throw createError(
          ErrorType.AUTHENTICATION,
          'Invalid API key',
          CurrencyErrorType.INVALID_API_KEY,
          response
        );
      
      case 'inactive-account':
        throw createError(
          ErrorType.AUTHENTICATION,
          'API key has been deactivated',
          CurrencyErrorType.INVALID_API_KEY,
          response
        );
      
      case 'quota-reached':
        throw createError(
          ErrorType.PERMISSION,
          'API request quota has been reached',
          CurrencyErrorType.RATE_LIMIT_EXCEEDED,
          response
        );
          
      default:
        throw createError(
          ErrorType.UNEXPECTED,
          errorMessage,
          CurrencyErrorType.PROVIDER_ERROR,
          response
        );
    }
  }
} 